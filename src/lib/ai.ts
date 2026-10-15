// AI 호출 라이브러리 — OpenAI Luna 직접 호출
// 타임아웃: 10초 (non-stream), 90초 (stream)

const AI_TIMEOUT_MS = 10_000;
const AI_STREAM_TIMEOUT_MS = 90_000;
export const AI_MODELS = ['gpt-6-luna'] as const;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  apiKey?: string;
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
  return {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      // Luna does not support temperature. Keep brief advice within the output budget.
      reasoning_effort: 'none',
      max_completion_tokens: options.maxTokens ?? (stream ? 1200 : 1500),
      ...(stream && { stream: true }),
    }),
  };
}

function resolveProvider(options: ChatOptions): { url: string; apiKey?: string } {
  return { url: OPENAI_URL, apiKey: options.apiKey?.trim() || process.env.OPENAI_API_KEY };
}

async function readErrorText(res: Response): Promise<string> {
  const text = await res.text().catch(() => 'unknown');
  return text.replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]').replace(/\s+/g, ' ').trim().slice(0, 500) || 'empty error body';
}

function serviceErrorEvent(status?: number): ServiceErrorEvent {
  return status ? { error: 'AI_SERVICE_ERROR', status } : { error: 'AI_SERVICE_ERROR' };
}

export async function chat(options: ChatOptions): Promise<ChatResponse> {
  let lastError: Error | null = null;

  for (const model of AI_MODELS) {
    const { url, apiKey } = resolveProvider(options);
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
        const { url, apiKey } = resolveProvider(options);
        if (!apiKey) {
          console.error('AI provider key missing:', model);
          continue;
        }

        const abortCtrl = new AbortController();
        activeAbortCtrl = abortCtrl;
        let timedOut = false;
        let emittedToken = false;
        let shouldTryNextModel = false;
        // 업스트림이 정상 종료를 알렸는지 ([DONE] 또는 finish_reason). 연결만 끊긴 경우를 완료로 보지 않는다.
        let upstreamDone = false;
        let finishReason: string | null = null;
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
                if (payload === '[DONE]') {
                  upstreamDone = true;
                  continue;
                }

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
                  const reason = chunk.choices?.[0]?.finish_reason;
                  if (typeof reason === 'string') finishReason = reason;
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
          // 마지막 줄에 줄바꿈이 없어도 종료 신호로 인정한다.
          if (buffer.trim() === 'data: [DONE]') upstreamDone = true;

          if (shouldTryNextModel || !emittedToken) {
            if (!emittedToken) console.error('AI stream empty response:', model);
            continue;
          }

          // 길이 한도('length')는 답변으로 인정하고, 종료 신호 없는 끊김·콘텐츠 필터는 오류로 알린다.
          if ((!upstreamDone && !finishReason) || finishReason === 'content_filter') {
            console.error('AI stream ended without completion:', model, finishReason ?? 'no finish signal');
            ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serviceErrorEvent(lastStatus))}\n\n`));
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
