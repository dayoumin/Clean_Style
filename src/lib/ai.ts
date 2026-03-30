// AI 호출 라이브러리 — OpenRouter + Grok 전용
// 타임아웃: 10초

const AI_TIMEOUT_MS = 10_000;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface ChatResponse {
  content: string;
  provider: string;
}

export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'unknown');
      throw new Error(`Grok API error (${res.status}): ${errorText.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from Grok');

    return { content, provider: 'grok' };
  } finally {
    clearTimeout(timeout);
  }
}

/** 스트리밍 호출 — SSE ReadableStream 반환 */
export function chatStream(options: ChatOptions): ReadableStream {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const encoder = new TextEncoder();

  const abortCtrl = new AbortController();

  return new ReadableStream({
    async start(ctrl) {
      // 스트리밍은 토큰별 점진 전송이므로 non-stream(10s)보다 여유 있게 설정
      const timeout = setTimeout(() => abortCtrl.abort(), 30_000);

      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          body: JSON.stringify({
            model: 'x-ai/grok-4.1-fast',
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1200,
            stream: true,
          }),
          signal: abortCtrl.signal,
        });

        if (!res.ok || !res.body) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `API ${res.status}` })}\n\n`));
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
              // provider 에러 감지 (OpenRouter error frame)
              if (chunk.error) {
                const errMsg = typeof chunk.error === 'string' ? chunk.error : chunk.error.message ?? 'provider error';
                ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
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
        if (abortCtrl.signal.aborted) { try { ctrl.close(); } catch { /* already closed */ } return; }
        const msg = err instanceof Error ? err.message : 'stream error';
        try {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
          ctrl.close();
        } catch { /* stream already closed */ }
      } finally {
        clearTimeout(timeout);
      }
    },
    // 클라이언트 disconnect 시 업스트림 OpenRouter 스트림도 중단
    cancel() { abortCtrl.abort(); },
  });
}
