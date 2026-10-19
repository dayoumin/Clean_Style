import { NextRequest, NextResponse } from 'next/server';
import { chatStream } from '@/lib/ai';
import { createPrivateChatStream } from '@/lib/private-chat-stream';
import { getAiRuntimeEnv } from '@/lib/runtime-env';
import { checkScopedRateLimit } from '@/lib/rate-limit';
import { MAX_QUESTION_LENGTH, MAX_CHAT_REQUEST_BYTES, RESPECT_MAX_HISTORY_MESSAGES } from '@/lib/constants';
import { sanitizeHistory, sanitizeUserInput, scanAndRedactPii, trimHistoryToLimit } from '@/lib/sanitize';
import { readJsonBodyWithLimit } from '@/lib/request-body';
import {
  calculateRespectResult,
  getRespectQuestions,
  isRespectEntry,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';
import { AI_CHAT_ENABLED } from '@/data/appVariant';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { getRespectAdviceSystemPrompt } from '@/diagnostics/workplace-respect/advice-prompts';
import { decodeRespectResponse } from '@/diagnostics/workplace-respect/response';

const RESPECT_ADVICE_CLIENT_LIMIT = 5;
const RESPECT_ADVICE_IP_LIMIT = 200;
const RESPECT_ADVICE_WINDOW_MS = 60_000;

function sanitizeAndRedactText(text: string) {
  const cleaned = sanitizeUserInput(text);
  const result = scanAndRedactPii(cleaned);

  return {
    text: result.hasPii ? result.redacted : cleaned,
    detected: result.detected,
  };
}

export async function POST(request: NextRequest) {
  if (!RESPECT_FEATURE_ENABLED || !AI_CHAT_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rateCheck = checkScopedRateLimit({
    scope: 'respect-advice',
    request,
    clientLimit: RESPECT_ADVICE_CLIENT_LIMIT,
    ipLimit: RESPECT_ADVICE_IP_LIMIT,
    windowMs: RESPECT_ADVICE_WINDOW_MS,
  });

  if (!rateCheck.allowed) {
    const message = rateCheck.limitedBy === 'ip'
      ? '같은 네트워크에서 AI 요청이 많아요. 잠시 후 다시 시도해주세요.'
      : 'AI 조언은 1분에 5번까지 가능해요. 잠시 후 다시 시도해주세요.';

    return NextResponse.json(
      {
        error: message,
        limitedBy: rateCheck.limitedBy,
        retryAfter: rateCheck.retryAfter,
      },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } },
    );
  }

  try {
    const parsed = await readJsonBodyWithLimit(request, MAX_CHAT_REQUEST_BYTES);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body as Record<string, unknown> | null;
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const entry = typeof body.entry === 'string' ? body.entry : null;
    if (!isRespectEntry(entry)) {
      return NextResponse.json({ error: 'Invalid respect entry' }, { status: 400 });
    }

    const questions = getRespectQuestions(entry);
    // Retention is local to the browser; its clock is not a trusted server clock.
    const decoded = decodeRespectResponse(body.response, entry, Date.now(), { enforceLocalExpiry: false });
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }
    const answers = decoded.answers;

    const rawQuestion = typeof body.question === 'string' ? body.question : '';
    if (!rawQuestion.trim()) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    if (rawQuestion.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: `question must be under ${MAX_QUESTION_LENGTH} chars` }, { status: 400 });
    }

    const questionRedaction = sanitizeAndRedactText(rawQuestion);
    const finalQuestion = questionRedaction.text;
    const detectedPii = new Set(questionRedaction.detected);
    const safeHistory = trimHistoryToLimit(sanitizeHistory(body.history), RESPECT_MAX_HISTORY_MESSAGES)
      .map((message) => {
        const redacted = sanitizeAndRedactText(message.content);
        redacted.detected.forEach((type) => detectedPii.add(type));

        return {
          ...message,
          content: redacted.text,
        };
      });

    const result = calculateRespectResult(entry, answers);
    const entryLabel = respectEntryLabels[entry];
    const selectedAnswers = questions.map((question, index) => {
      const choice = question.choices[answers[index]];
      return choice ? `- ${question.category}: ${question.prompt} / 응답: ${choice.text}` : `- ${question.id}: 미응답`;
    }).join('\n');

    const userMessage = `자가점검 유형: ${entryLabel.title}
점수 종류: ${result.scoreLabel}
합계: ${result.score === null ? '모름·미응답 포함 — 전체 합계 미산출' : `${result.score} / ${result.maxScore}`}
${entry === 'action' ? `2019년 원표 기준 구간: ${result.sourceBandText ?? '미산출'}` : '위험 등급: 보류. 빈도 합계를 위험·안전·피해 심각성으로 해석하지 않음.'}
결과 제목: ${result.title}
상황 요약: ${result.summary}
기본 권장 행동:
${result.primaryActions.map((action) => `- ${action}`).join('\n')}
도움 연결:
${result.supportActions.map((action) => `- ${action}`).join('\n')}
${[result.safetyNotice, result.supportNotice].flatMap((notice) => (notice ? [`화면 상단 안내: ${notice.title} — ${notice.body}`] : [])).join('\n')}

문항별 응답:
${selectedAnswers}

사용자 질문:
${finalQuestion}

위 자가점검 결과와 사용자 질문을 함께 참고해 답하세요.`;

    const aiEnv = await getAiRuntimeEnv();
    const stream = chatStream({
      messages: [
        { role: 'system', content: getRespectAdviceSystemPrompt(entry, result.crisis, { supportKind: result.supportKind, safetyUncertain: result.safetyUncertain }) },
        ...safeHistory,
        { role: 'user', content: userMessage },
      ],
      maxTokens: 700,
      apiKey: aiEnv.OPENAI_API_KEY,
    });

    const finalStream = createPrivateChatStream(stream, { signal: request.signal, detected: [...detectedPii] });

    return new Response(finalStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('Respect advice API error:', msg);
    return NextResponse.json(
      { error: 'AI 조언 생성에 실패했어요. 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
