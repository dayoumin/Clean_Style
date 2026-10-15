import { afterEach, describe, expect, it, vi } from 'vitest';
import { AI_MODELS, chat, chatStream } from '@/lib/ai';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('OpenAI Luna direct requests', () => {
  const options = { apiKey: 'test-openai', messages: [{ role: 'user' as const, content: '조언을 주세요.' }], maxTokens: 120 };
  it('uses only the requested Luna model', () => { expect(AI_MODELS).toEqual(['gpt-6-luna']); });
  it('calls OpenAI directly with supported parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ model: 'gpt-6-luna', choices: [{ message: { content: '한 걸음씩 시작해 보세요.' } }] })));
    vi.stubGlobal('fetch', fetchMock);
    expect(await chat(options)).toEqual({ content: '한 걸음씩 시작해 보세요.', provider: 'gpt-6-luna' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'gpt-6-luna', reasoning_effort: 'none', max_completion_tokens: 120 });
    expect(JSON.parse(init.body)).not.toHaveProperty('temperature');
    expect(JSON.parse(init.body)).not.toHaveProperty('max_tokens');
    expect(init.headers).not.toHaveProperty('HTTP-Referer');
  });
  it('keeps the existing streaming token contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"시작해 보세요."}}]}\n\ndata: [DONE]\n\n'));
    vi.stubGlobal('fetch', fetchMock);
    const output = await new Response(chatStream(options)).text();
    expect(output).toContain('"token":"시작해 보세요."');
    expect(output).toContain('data: [DONE]');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ stream: true, model: 'gpt-6-luna' });
  });
  it.each([
    ['종료 신호 없이 끊김', 'data: {"choices":[{"delta":{"content":"중간"}}]}\n\n', true],
    ['콘텐츠 필터로 중단', 'data: {"choices":[{"delta":{"content":"중간"}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"content_filter"}]}\n\n', true],
    ['길이 한도로 종료', 'data: {"choices":[{"delta":{"content":"긴 답"}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n', false],
    ['마지막 [DONE]에 줄바꿈 없음', 'data: {"choices":[{"delta":{"content":"답"}}]}\n\ndata: [DONE]', false],
  ])('업스트림 종료 상태를 구분한다: %s', async (_label, upstream, expectError) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(upstream)));
    const output = await new Response(chatStream(options)).text();
    expect(output).toContain('"token":');
    expect(output.includes('AI_SERVICE_ERROR')).toBe(expectError);
    expect(output.endsWith('data: [DONE]\n\n')).toBe(true);
  });
  it('reports OpenAI failure without calling an alternate provider', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const output = await new Response(chatStream(options)).text();
    expect(output).toContain('"error":"AI_SERVICE_ERROR","status":503');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
