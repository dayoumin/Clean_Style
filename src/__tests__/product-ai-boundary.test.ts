import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const ai = vi.hoisted(() => ({
  chat: vi.fn(async () => ({ content: '요약', provider: 'test' })),
  chatStream: vi.fn(() => new ReadableStream({ start(ctrl) { ctrl.close(); } })),
}));
vi.mock('@/lib/ai', () => ai);
vi.mock('@/lib/runtime-env', () => ({ getAiRuntimeEnv: async () => ({}) }));

describe('product matrix AI route boundary', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });
  afterEach(() => vi.unstubAllEnvs());

  it.each(['default', 'plus', 'student'])('%s gates chat and summarize before any AI call', async variant => {
    vi.stubEnv('NEXT_PUBLIC_APP_VARIANT', variant);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_AI_CHAT', '1');
    const { POST: chat } = await import('@/app/api/chat/route');
    const { POST: summarize } = await import('@/app/api/summarize/route');
    for (const [path, post] of [['chat', chat], ['summarize', summarize]] as const) {
      const res = await post(new NextRequest(`http://localhost/api/${path}`, {
        method: 'POST', body: JSON.stringify({
          styleKey: 'principle-transparent-independent',
          userContext: '거래처에서 선물을 받았어요',
          history: [{ role: 'user', content: '선물 문의' }],
        }),
      }));
      expect(res.status).toBe(variant === 'student' ? 404 : 200);
      await res.text();
    }
    expect(ai.chat.mock.calls.length).toBe(variant === 'student' ? 0 : 1);
    expect(ai.chatStream.mock.calls.length).toBe(variant === 'student' ? 0 : 1);
  });

  it.each(['default', 'plus', 'student'])('%s gates workplace advice before decoding or AI calls', async variant => {
    vi.stubEnv('NEXT_PUBLIC_APP_VARIANT', variant);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_AI_CHAT', '1');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_RESPECT_PILOT', '1');
    const { createRespectResponse } = await import('@/diagnostics/workplace-respect/response');
    const { getRespectQuestions } = await import('@/data/workplaceRespectQuestions');
    const { POST } = await import('@/app/api/respect-advice/route');
    const response = createRespectResponse('action', Array(getRespectQuestions('action').length).fill(0));
    const res = await POST(new NextRequest('http://localhost/api/respect-advice', {
      method: 'POST', body: JSON.stringify({ entry: 'action', response, question: '내 행동을 어떻게 바꿀까요?' }),
    }));
    expect(res.status).toBe(variant === 'plus' ? 200 : 404);
    await res.text();
    expect(ai.chatStream.mock.calls.length).toBe(variant === 'plus' ? 1 : 0);
  });
});
