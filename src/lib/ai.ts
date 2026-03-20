// AI 호출 통합 라이브러리
// 지원: OpenRouter (기본) / Anthropic / OpenAI
// 타임아웃: 30초

const AI_TIMEOUT_MS = 30_000;

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

// 타임아웃 적용 fetch
function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
  });
}

// OpenRouter 호출
async function callOpenRouter(options: ChatOptions): Promise<ChatResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const models = [
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-haiku',
    'openai/gpt-4o-mini',
  ];

  for (const model of models) {
    try {
      const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'unknown');
        console.warn(`OpenRouter ${model} failed (${res.status}): ${errorText.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return { content, provider: `openrouter/${model}` };
    } catch (error) {
      console.warn(`OpenRouter ${model} error:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  throw new Error('All OpenRouter models failed');
}

// Anthropic 직접 호출
async function callAnthropic(options: ChatOptions): Promise<ChatResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const systemMsg = options.messages.find(m => m.role === 'system');
  const userMsgs = options.messages.filter(m => m.role === 'user');

  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens ?? 2000,
      system: systemMsg?.content ?? '',
      messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  const content = data.content?.[0]?.text;
  if (!content) throw new Error('Empty response from Anthropic');

  return { content, provider: 'anthropic' };
}

// OpenAI 호출
async function callOpenAI(options: ChatOptions): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  return { content, provider: 'openai' };
}

// 통합 호출 — 사용 가능한 키를 자동으로 감지하여 호출
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const providers: Array<() => Promise<ChatResponse>> = [];

  if (process.env.OPENROUTER_API_KEY) providers.push(() => callOpenRouter(options));
  if (process.env.ANTHROPIC_API_KEY) providers.push(() => callAnthropic(options));
  if (process.env.OPENAI_API_KEY) providers.push(() => callOpenAI(options));

  if (providers.length === 0) {
    throw new Error('No AI API key configured. Set OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY');
  }

  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      console.warn('AI provider failed, trying next:', error instanceof Error ? error.message : error);
      continue;
    }
  }

  throw new Error('All AI providers failed');
}
