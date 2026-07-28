import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { styleTypes } from '@/diagnostics/adult-integrity';
import { MAX_CONTENT_LENGTH } from '@/lib/constants';
import { SUMMARIZE_SYSTEM_PROMPT } from '@/lib/prompts';
import { sanitizeHistory, sanitizeUserInput } from '@/lib/sanitize';
import { checkScopedRateLimit } from '@/lib/rate-limit';
import { getAiRuntimeEnv } from '@/lib/runtime-env';
import { AI_CHAT_ENABLED } from '@/data/appVariant';

const SUMMARIZE_CLIENT_LIMIT = 20;
const SUMMARIZE_IP_LIMIT = 200;
const SUMMARIZE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  if (!AI_CHAT_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rateCheck = checkScopedRateLimit({
    scope: 'summarize',
    request,
    clientLimit: SUMMARIZE_CLIENT_LIMIT,
    ipLimit: SUMMARIZE_IP_LIMIT,
    windowMs: SUMMARIZE_WINDOW_MS,
  });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } },
    );
  }

  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const styleKey = typeof body.styleKey === 'string' ? body.styleKey : '';
    const history = Array.isArray(body.history) ? body.history : undefined;
    const summary = typeof body.summary === 'string' ? body.summary : undefined;

    if (!styleKey || !styleTypes[styleKey]) {
      return NextResponse.json({ error: 'Invalid styleKey' }, { status: 400 });
    }

    const safeHistory = sanitizeHistory(history);
    if (safeHistory.length === 0) {
      return NextResponse.json({ error: 'history is required' }, { status: 400 });
    }

    const safeSummary = typeof summary === 'string' ? sanitizeUserInput(summary.slice(0, MAX_CONTENT_LENGTH)) : '';
    const conversation = safeHistory
      .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');
    const userContent = safeSummary
      ? `## 이전 요약\n${safeSummary}\n\n## 이후 대화\n${conversation}`
      : conversation;

    const aiEnv = await getAiRuntimeEnv();
    const response = await chat({
      messages: [
        { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      maxTokens: 300,
      apiKey: aiEnv.OPENROUTER_API_KEY,
      nvidiaApiKey: aiEnv.NVIDIA_API_KEY,
      appUrl: aiEnv.NEXT_PUBLIC_APP_URL,
    });

    return NextResponse.json({ summary: response.content });
  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json({ error: 'summarization failed' }, { status: 500 });
  }
}
