// AI 호출 라이브러리 — OpenRouter
// 타임아웃: 10초 (non-stream), 30초 (stream)

const AI_TIMEOUT_MS = 10_000;
const PRIMARY_MODEL = 'google/gemini-3.1-flash-lite-preview';
const FALLBACK_MODEL = 'openai/gpt-5.4-nano';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_APP_URL = 'https://clean-style.ecomarin.workers.dev';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  appUrl?: string;
}

interface ChatResponse {
  content: string;
  provider: string;
}

interface ServiceErrorEvent {
  error: 'AI_SERVICE_ERROR';
  status?: number;
}

function buildRequestInit(
  apiKey: string,
  options: ChatOptions,
  stream = false,
): Omit<RequestInit, 'signal'> {
  const appUrl = options.appUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  return {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-Title': 'Clean Style',
    },
    body: JSON.stringify({
      model: PRIMARY_MODEL,
      models: [PRIMARY_MODEL, FALLBACK_MODEL],
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? (stream ? 1200 : 1500),
      ...(stream && { stream: true }),
    }),
  };
}

function getApiKey(options: ChatOptions): string {
  const apiKey = options.apiKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  return apiKey;
}

async function readErrorText(res: Response): Promise<string> {
  const text = await res.text().catch(() => 'unknown');
  return text.replace(/\s+/g, ' ').trim().slice(0, 500) || 'empty error body';
}

function serviceErrorEvent(status?: number): ServiceErrorEvent {
  return status ? { error: 'AI_SERVICE_ERROR', status } : { error: 'AI_SERVICE_ERROR' };
}

export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const apiKey = getApiKey(options);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      ...buildRequestInit(apiKey, options),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await readErrorText(res);
      console.error('OpenRouter API error:', res.status, errorText);
      throw new Error(`API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    return { content, provider: data.model ?? PRIMARY_MODEL };
  } finally {
    clearTimeout(timeout);
  }
}

/** 스트리밍 호출 — SSE ReadableStream 반환 */
export function chatStream(options: ChatOptions): ReadableStream {
  const apiKey = getApiKey(options);

  const encoder = new TextEncoder();

  const abortCtrl = new AbortController();
  let timedOut = false;

  return new ReadableStream({
    async start(ctrl) {
      const timeout = setTimeout(() => {
        timedOut = true;
        abortCtrl.abort();
      }, 30_000);

      try {
        const res = await fetch(OPENROUTER_URL, {
          ...buildRequestInit(apiKey, options, true),
          signal: abortCtrl.signal,
        });

        if (!res.ok || !res.body) {
          const errorText = await readErrorText(res);
          console.error('OpenRouter stream error:', res.status, errorText);
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent(res.status))}\n\n`));
          ctrl.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') continue;

            try {
              const chunk = JSON.parse(payload);
              if (chunk.error) {
                const errMsg = typeof chunk.error === 'string' ? chunk.error : chunk.error.message ?? 'provider error';
                console.error('OpenRouter stream chunk error:', errMsg);
                ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent())}\n\n`));
                ctrl.close();
                return;
              }
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`));
              }
            } catch { /* skip malformed JSON chunk */ }
          }
        }

        ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
        ctrl.close();
      } catch (err) {
        if (abortCtrl.signal.aborted && !timedOut) { try { ctrl.close(); } catch { /* already closed */ } return; }
        const msg = err instanceof Error ? err.message : 'stream error';
        console.error('OpenRouter stream request failed:', msg);
        try {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent())}\n\n`));
          ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
          ctrl.close();
        } catch { /* stream already closed */ }
      } finally {
        clearTimeout(timeout);
      }
    },
    cancel() { abortCtrl.abort(); },
  });
}
