import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { CHAT_SCOPE_PROMPT, parseChatScope, CHAT_SCOPE_REPLIES } from '@/lib/chat-scope';
import { POST } from '@/app/api/chat/route';
import { styleTypes } from '@/diagnostics/adult-integrity';
import { SUMMARIZE_SYSTEM_PROMPT } from '@/lib/prompts';
import { buildChatResultContext } from '@/lib/chat-result-context';

const ai = vi.hoisted(() => ({ chat: vi.fn(), chatStream: vi.fn() }));
vi.mock('@/lib/ai', () => ai);
vi.mock('@/lib/runtime-env', () => ({ getAiRuntimeEnv: async () => ({}) }));
vi.mock('@/lib/rate-limit', () => ({ checkScopedRateLimit: () => ({ allowed: true }) }));

function request(extra: Record<string, unknown> = {}, signal?: AbortSignal) {
  return new NextRequest('http://localhost/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ styleKey: 'principle-transparent-independent', userContext: '앞 상황을 정리해줘.', ...extra }), signal });
}

beforeEach(() => {
  vi.clearAllMocks();
  ai.chat.mockResolvedValue({ content: '{"mode":"advice","mixed":false}', provider: 'test' });
  ai.chatStream.mockImplementation(() => new ReadableStream({ start(c) { c.close(); } }));
});

describe('pre-stream scope decision', () => {
  it.each(['off-topic', 'clarify'] as const)('%s returns a fixed completed reply without answer generation', async mode => {
    ai.chat.mockResolvedValue({ content: JSON.stringify({ mode, mixed: false }) });
    const response = await POST(request({ userContext: '파스타 만드는 법 알려줘.' }));
    const text = await response.text();
    expect(text).toContain(CHAT_SCOPE_REPLIES[mode]);
    expect(text).toContain('data: [DONE]');
    expect(ai.chatStream).not.toHaveBeenCalled();
  });

  it.each(['not json', '{"mode":"allow","mixed":false}', '{"mode":"advice"}', '[]'])('fails closed for malformed classification: %s', async content => {
    ai.chat.mockResolvedValue({ content });
    expect((await POST(request())).status).toBe(503);
    expect(ai.chatStream).not.toHaveBeenCalled();
  });

  it('does not start generation after classification failure or cancellation', async () => {
    ai.chat.mockRejectedValueOnce(new Error('offline'));
    expect((await POST(request())).status).toBe(503);
    const controller = new AbortController();
    ai.chat.mockImplementationOnce(async () => { controller.abort(); return { content: '{"mode":"advice","mixed":false}' }; });
    expect((await POST(request({}, controller.signal))).status).toBe(499);
    expect(ai.chatStream).not.toHaveBeenCalled();
  });

  it('passes sanitized history and summary into both classification and follow-up generation', async () => {
    const history = [{ role: 'user', content: '업체에서 점수를 알려달래요. 연락처 010-1234-5678' }, { role: 'assistant', content: '공식 절차로 안내하세요.' }];
    await POST(request({ history, summary: '사용자는 담당자에게 메일 kim@example.com 대신 공식 창구로 연락하기로 함.' }));
    const gate = ai.chat.mock.calls[0][0];
    const answer = ai.chatStream.mock.calls[0][0];
    expect(gate.messages[0].content).toBe(CHAT_SCOPE_PROMPT);
    expect(JSON.stringify(gate)).toContain('업체에서 점수를');
    expect(JSON.stringify(answer)).toContain('업체에서 점수를');
    for (const call of [gate, answer]) {
      expect(JSON.stringify(call)).not.toContain('010-1234-5678');
      expect(JSON.stringify(call)).not.toContain('kim@example.com');
    }
    expect(answer.messages.at(-1).content).toContain('conversation_summary');
  });

  it.each(Object.values(styleTypes))('$name supplies only a weak direction after summary, without deficit prescriptions', async style => {
    await POST(request({ styleKey: style.id, summary: '이미 기록과 공유는 마쳤고 말할 문장이 어렵다고 함.', history: [] }));
    const system = ai.chatStream.mock.calls[0][0].messages[0].content;
    expect(system).toContain(style.subtitle);
    expect(system).not.toContain(style.name);
    expect(system).not.toContain(style.caution);
    expect(system).not.toContain(style.tip);
    expect(system).toContain('약한 참고');
    expect(system).toContain('사용하지 않아도 됩니다');
    expect(system).toContain('자동으로 출력하지 마세요');
  });

  it('retains context for role questions and gives safety priority over personalization', async () => {
    for (const mode of ['assistant-meta', 'safety']) {
      ai.chat.mockResolvedValue({ content: JSON.stringify({ mode, mixed: false }) });
      await POST(request({ history: [{ role: 'user', content: '기관 장비 사용 상담' }] }));
      const messages = ai.chatStream.mock.calls.at(-1)?.[0].messages;
      expect(messages).toHaveLength(3);
      expect(messages[0].content).not.toContain('## 테스트 응답 프로파일');
      if (mode === 'safety') expect(messages[0].content).toContain('현재 안전 위험을 최우선');
    }
  });

  it('mixed requests preserve the relevant counseling part only', async () => {
    ai.chat.mockResolvedValue({ content: '{"mode":"advice","mixed":true}' });
    await POST(request());
    expect(ai.chatStream.mock.calls[0][0].messages[0].content).toContain('무관한 본문은 제공하지 마세요');
  });

  it('retains registry context over 20 turns even as summaries replace older messages', async () => {
    const history: { role: 'user' | 'assistant'; content: string }[] = [];
    for (let turn = 0; turn < 20; turn++) {
      const summary = turn >= 4 ? '앞 대화에는 유형명이 없으며 업체 부탁의 공식 절차를 확인하기로 함.' : undefined;
      await POST(request({ userContext: '기록과 공유는 이미 마쳤어요. 지금 남은 행동만 정리해줘.', history: summary ? history.slice(-2) : history, summary, scores: { principle: 8, transparency: -8, independence: 8 } }));
      const messages = ai.chatStream.mock.calls.at(-1)?.[0].messages;
      expect(messages[0].content).toContain('이번 응답은 독립 쪽');
      expect(messages[0].content).not.toContain('소신 수호자');
      expect(messages[0].content).toContain('이미 확인·공유·기록한 일');
      expect(messages[0].content).toContain('자동으로 출력하지 마세요');
      if (summary) expect(messages.at(-1).content).toContain(summary);
      history.push({ role: 'user', content: '업체 부탁을 기록했습니다.' }, { role: 'assistant', content: '공식 절차를 확인하세요.' });
    }
  });

  it.each(['toString', 'constructor', '__proto__'])('rejects non-result property %s before any AI request', async styleKey => {
    expect((await POST(request({ styleKey }))).status).toBe(400);
    expect(ai.chat).not.toHaveBeenCalled();
  });
});

describe('summary ownership', () => {
  it('keeps unknown facts and decisions, leaving style persistence to registry context', () => {
    expect(SUMMARIZE_SYSTEM_PROMPT).toContain('모른다고 한 사실');
    expect(SUMMARIZE_SYSTEM_PROMPT).toContain('서버가 상담 요청');
    expect(SUMMARIZE_SYSTEM_PROMPT).toContain('스타일 반영을 원하지 않는다는 요청');
    expect(SUMMARIZE_SYSTEM_PROMPT).not.toContain('유형명을 반드시 포함');
    expect(parseChatScope('{"mode":"advice","mixed":false}')).toEqual({ mode: 'advice', mixed: false });
  });
});

describe('weak result context', () => {
  const style = styleTypes['principle-transparent-independent'];
  it('does not turn zero scores into a dominant type or strength judgment', () => {
    const context = buildChatResultContext(style, { principle: 0, transparency: 0, independence: 0 });
    expect(context.match(/우세 방향 미확정/g)).toHaveLength(3);
    expect(context).not.toContain(style.name);
    expect(context).not.toContain('뚜렷');
  });
  it('only supplies the explanatory name when the user asks about the result itself', async () => {
    ai.chat.mockResolvedValue({ content: '{"mode":"style-info","mixed":false}' });
    await POST(request({ userContext: '내 스타일이 뭐야?' }));
    const system = ai.chatStream.mock.calls[0][0].messages[0].content;
    expect(system).toContain(style.name);
    expect(system).toContain('설명용 프로파일');
    expect(system).toContain('확정된 성격이나 결함으로 단정하지 마세요');
  });
  it('keeps new user constraints instead of replacing them with old profile assumptions', async () => {
    await POST(request({ userContext: '혼자 결정하기가 어려워요. 기록과 공유는 이미 했고, 스타일은 반영하지 말아주세요.', summary: '예전에 혼자 처리하겠다고 말했다.' }));
    const messages = ai.chatStream.mock.calls[0][0].messages;
    expect(messages[0].content).toContain('사용자 설명을 따르고');
    expect(messages[0].content).toContain('스타일을 반영하지 말라고 했다면');
    expect(messages.at(-1).content).toContain('혼자 결정하기가 어려워요');
    expect(messages.at(-1).content).toContain('스타일은 반영하지 말아주세요');
  });
});
