// AI 호출 라이브러리 — OpenRouter + NVIDIA NIM fallback
// 타임아웃: 10초 (non-stream), 30초 (stream)

const AI_TIMEOUT_MS = 10_000;
const AI_STREAM_TIMEOUT_MS = 90_000;
export const AI_MODELS = [
  'google/gemini-3.1-flash-lite-preview',
  'nvidia:deepseek-ai/deepseek-v4-flash',
  'x-ai/grok-4.3',
] as const;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL_PREFIX = 'nvidia:';
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
  nvidiaApiKey?: string;
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
  model: string,
  stream = false,
): Omit<RequestInit, 'signal'> {
  const appUrl = options.appUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
  const providerModel = model.startsWith(NVIDIA_MODEL_PREFIX)
    ? model.slice(NVIDIA_MODEL_PREFIX.length)
    : model;

  return {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-Title': 'Clean Style',
    },
    body: JSON.stringify({
      model: providerModel,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? (stream ? 1200 : 1500),
      ...(stream && { stream: true }),
    }),
  };
}

function getOpenRouterApiKey(options: ChatOptions): string | undefined {
  return options.apiKey?.trim() || process.env.OPENROUTER_API_KEY;
}

function getNvidiaApiKey(options: ChatOptions): string | undefined {
  return options.nvidiaApiKey?.trim() || process.env.NVIDIA_API_KEY;
}

function resolveProvider(model: string, options: ChatOptions): { url: string; apiKey?: string } {
  if (model.startsWith(NVIDIA_MODEL_PREFIX)) {
    return { url: NVIDIA_URL, apiKey: getNvidiaApiKey(options) };
  }
  return { url: OPENROUTER_URL, apiKey: getOpenRouterApiKey(options) };
}

async function readErrorText(res: Response): Promise<string> {
  const text = await res.text().catch(() => 'unknown');
  return text.replace(/\s+/g, ' ').trim().slice(0, 500) || 'empty error body';
}

function serviceErrorEvent(status?: number): ServiceErrorEvent {
  return status ? { error: 'AI_SERVICE_ERROR', status } : { error: 'AI_SERVICE_ERROR' };
}

export async function chat(options: ChatOptions): Promise<ChatResponse> {
  let lastError: Error | null = null;

  for (const model of AI_MODELS) {
    const { url, apiKey } = resolveProvider(model, options);
    if (!apiKey) {
      console.error('AI provider key missing:', model);
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...buildRequestInit(apiKey, options, model),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await readErrorText(res);
        console.error('AI API error:', model, res.status, errorText);
        lastError = new Error(`API error (${res.status}): ${errorText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        lastError = new Error(`Empty response from ${model}`);
        console.error('AI API empty response:', model);
        continue;
      }

      return { content, provider: data.model ?? model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('AI request failed');
      console.error('AI API request failed:', model, lastError.message);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('AI provider keys not set');
}

/** 스트리밍 호출 — SSE ReadableStream 반환 */
export function chatStream(options: ChatOptions): ReadableStream {
  const encoder = new TextEncoder();
  let activeAbortCtrl: AbortController | null = null;

  return new ReadableStream({
    async start(ctrl) {
      let lastStatus: number | undefined;

      for (const model of AI_MODELS) {
        const { url, apiKey } = resolveProvider(model, options);
        if (!apiKey) {
          console.error('AI provider key missing:', model);
          continue;
        }

        const abortCtrl = new AbortController();
        activeAbortCtrl = abortCtrl;
        let timedOut = false;
        let emittedToken = false;
        let shouldTryNextModel = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          abortCtrl.abort();
        }, AI_STREAM_TIMEOUT_MS);

        try {
          const res = await fetch(url, {
            ...buildRequestInit(apiKey, options, model, true),
            signal: abortCtrl.signal,
          });

          if (!res.ok || !res.body) {
            const errorText = await readErrorText(res);
            lastStatus = res.status;
            console.error('AI stream error:', model, res.status, errorText);
            continue;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
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
                    console.error('AI stream chunk error:', model, errMsg);
                    if (!emittedToken) {
                      shouldTryNextModel = true;
                      break;
                    }
                    ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent())}\n\n`));
                    ctrl.close();
                    return;
                  }
                  const delta = chunk.choices?.[0]?.delta?.content;
                  if (delta) {
                    emittedToken = true;
                    ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`));
                  }
                } catch { /* skip malformed JSON chunk */ }
              }

              if (shouldTryNextModel) break;
            }
          } finally {
            reader.releaseLock();
          }

          if (shouldTryNextModel || !emittedToken) {
            if (!emittedToken) console.error('AI stream empty response:', model);
            continue;
          }

          ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
          ctrl.close();
          return;
        } catch (err) {
          if (abortCtrl.signal.aborted && !timedOut) { try { ctrl.close(); } catch { /* already closed */ } return; }
          const msg = err instanceof Error ? err.message : 'stream error';
          console.error('AI stream request failed:', model, timedOut ? 'request timed out' : msg);
          if (emittedToken) {
            ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent(lastStatus))}\n\n`));
            ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
            ctrl.close();
            return;
          }
        } finally {
          clearTimeout(timeout);
          if (activeAbortCtrl === abortCtrl) activeAbortCtrl = null;
        }
      }

      ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent(lastStatus))}\n\n`));
      ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
      ctrl.close();
    },
    cancel() { activeAbortCtrl?.abort(); },
  });
}
