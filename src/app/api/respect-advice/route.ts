import { NextRequest, NextResponse } from 'next/server';
import { chatStream } from '@/lib/ai';
import { getAiRuntimeEnv } from '@/lib/runtime-env';
import { checkScopedRateLimit } from '@/lib/rate-limit';
import { MAX_HISTORY_MESSAGES, MAX_QUESTION_LENGTH } from '@/lib/constants';
import { sanitizeHistory, sanitizeUserInput, scanAndRedactPii } from '@/lib/sanitize';
import {
  calculateRespectResult,
  getRespectQuestions,
  isRespectEntry,
  type RespectEntry,
  respectAxisLabels,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';

const RESPECT_ADVICE_CLIENT_LIMIT = 5;
const RESPECT_ADVICE_IP_LIMIT = 200;
const RESPECT_ADVICE_WINDOW_MS = 60_000;

function concatStreams(a: ReadableStream<Uint8Array>, b: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let cancelled = false;

  return new ReadableStream({
    async start(ctrl) {
      try {
        for (const stream of [a, b]) {
          if (cancelled) return;

          const reader = stream.getReader();
          activeReader = reader;
          try {
            while (!cancelled) {
              const { done, value } = await reader.read();
              if (done) break;
              ctrl.enqueue(value);
            }
          } finally {
            activeReader = null;
            reader.releaseLock();
          }
        }

        if (!cancelled) ctrl.close();
      } catch (err) {
        if (!cancelled) ctrl.error(err);
      }
    },
    cancel(reason) {
      cancelled = true;
      return activeReader?.cancel(reason);
    },
  });
}

const RESPECT_ADVICE_SYSTEM_PROMPT_BASE = `당신은 공공 연구기관 종사자를 위한 일터 존중 점검 조언 도우미입니다.

## 역할
- 사용자의 자가점검 결과를 바탕으로 상황 정리와 다음 행동을 제안합니다.
- 법률상 갑질·직장 내 괴롭힘 여부를 판정하지 않습니다.
- 의료·정신건강 진단을 하지 않습니다.
- 신고 여부를 단정하지 않고, 기록·상담·기준 확인 같은 안전한 다음 행동을 제안합니다.

## 응답 원칙
- 한국어 일반 텍스트로 답하세요.
- 사용자의 질문에 직접 답하되, 자가점검 결과 맥락을 반영하세요.
- 답변은 기본적으로 7~10개의 완성된 문장으로 작성하세요.
- 2~3문장마다 빈 줄을 넣어 전체 답변을 4~6개의 짧은 문단으로 나누세요.
- 첫 문단은 결론과 핵심 이유를 말하고, 중간 문단은 확인할 사실과 기록 방법을 다루며, 마지막 문단은 다음 행동을 안내하세요.
- "갑질입니다", "괴롭힘입니다", "진단되었습니다"처럼 단정하는 표현을 쓰지 마세요.
- 사용자를 가해자나 피해자로 단정하지 말고, 상황을 기준으로 차분하게 정리하세요.
- 불확실한 사안은 인사·감사·인권·청렴 담당자에게 사실관계와 기준을 확인하라고 안내하세요.
- 자해 생각, 폭력, 즉각적인 안전 위험이 보이면 앱 조언보다 사람과 기관의 도움을 먼저 받으라고 말하세요.
- JSON, 표, 과도한 목록 대신 자연스러운 상담 문장으로 답하세요.`;

const RESPECT_ADVICE_ENTRY_PROMPTS: Record<RespectEntry, string> = {
  action: `## 내 행동 점검 조언 방향
- 사용자가 자신의 말, 지시, 요청, 회식·휴가·사적 부탁 등을 돌아보는 상황입니다.
- 사용자를 비난하지 말고, 상대가 거절하기 어려운 위치였는지와 업무상 필요·범위·시간·표현이 적절했는지 함께 살피게 하세요.
- 바로 사과나 신고를 단정하지 말고, 업무 목적과 기준을 짧게 설명하기, 선택권을 남기기, 중요한 지시는 기록으로 남기기 같은 예방 행동을 제안하세요.`,
  experience: `## 일터 존중 점검 조언 방향
- 사용자가 자신이 겪은 말, 지시, 배제, 모욕, 불이익 우려 등을 정리하는 상황입니다.
- 사용자의 억울함을 단정적으로 판정하지 말고, 반복성·업무 관련성·관계상 우위·기록 가능성을 기준으로 차분히 정리하게 하세요.
- 혼자 판단하게 두지 말고, 날짜·장소·말투·증거를 남기기, 신뢰할 수 있는 사람이나 인사·감사·인권·청렴 담당자에게 일반 기준을 확인하기 같은 도움 경로를 제안하세요.`,
};

function getRespectAdviceSystemPrompt(entry: RespectEntry): string {
  return `${RESPECT_ADVICE_SYSTEM_PROMPT_BASE}

${RESPECT_ADVICE_ENTRY_PROMPTS[entry]}`;
}

function sanitizeAndRedactText(text: string) {
  const cleaned = sanitizeUserInput(text);
  const result = scanAndRedactPii(cleaned);

  return {
    text: result.hasPii ? result.redacted : cleaned,
    detected: result.detected,
  };
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const entry = typeof body.entry === 'string' ? body.entry : null;
    if (!isRespectEntry(entry)) {
      return NextResponse.json({ error: 'Invalid respect entry' }, { status: 400 });
    }

    const questions = getRespectQuestions(entry);
    const rawAnswers = Array.isArray(body.answers) ? body.answers : null;
    const answers = rawAnswers?.every((answer: unknown): answer is number => Number.isInteger(answer))
      ? rawAnswers
      : null;
    const validAnswers = answers?.every((answer: number, index: number) => (
      answer >= 0
      && answer < (questions[index]?.choices.length ?? 0)
    ));

    if (!answers || answers.length !== questions.length || !validAnswers) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }

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
    const safeHistory = sanitizeHistory(body.history)
      .slice(-MAX_HISTORY_MESSAGES)
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
    const activeSignals = result.axisSummary.activeAxes
      .map((axis) => respectAxisLabels[axis])
      .join(', ') || '뚜렷한 신호 없음';
    const selectedAnswers = questions.map((question, index) => {
      const choice = question.choices[answers[index]];
      return `- ${question.category}: ${question.prompt} / 응답: ${choice.text}`;
    }).join('\n');

    const userMessage = `자가점검 유형: ${entryLabel.title}
결과 수준: ${result.level}
결과 제목: ${result.title}
상황 요약: ${result.summary}
확인된 신호: ${activeSignals}
기본 권장 행동:
${result.primaryActions.map((action) => `- ${action}`).join('\n')}
도움 연결:
${result.supportActions.map((action) => `- ${action}`).join('\n')}

문항별 응답:
${selectedAnswers}

사용자 질문:
${finalQuestion}

위 자가점검 결과와 사용자 질문을 함께 참고해 답하세요.`;

    const aiEnv = await getAiRuntimeEnv();
    const stream = chatStream({
      messages: [
        { role: 'system', content: getRespectAdviceSystemPrompt(entry) },
        ...safeHistory,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.35,
      maxTokens: 900,
      apiKey: aiEnv.OPENROUTER_API_KEY,
      nvidiaApiKey: aiEnv.NVIDIA_API_KEY,
      appUrl: aiEnv.NEXT_PUBLIC_APP_URL,
    });

    const encoder = new TextEncoder();
    const piiWarnings = [...detectedPii];
    const piiWarningStream = piiWarnings.length > 0
      ? new ReadableStream({
          start(ctrl) {
            ctrl.enqueue(encoder.encode(
              `data: ${JSON.stringify({ pii_warning: piiWarnings })}\n\n`,
            ));
            ctrl.close();
          },
        })
      : null;

    const finalStream = piiWarningStream
      ? concatStreams(piiWarningStream, stream)
      : stream;

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
