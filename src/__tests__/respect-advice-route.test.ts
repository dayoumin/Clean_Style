import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  chatStream: vi.fn((_options: unknown) => new ReadableStream<Uint8Array>({
    start(ctrl) {
      ctrl.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      ctrl.close();
    },
  })),
}));

vi.mock('@/lib/ai', () => ({
  chatStream: mocks.chatStream,
}));

vi.mock('@/lib/runtime-env', () => ({ getAiRuntimeEnv: async () => ({}) }));

vi.mock('@/data/appVariant', () => ({
  AI_CHAT_ENABLED: true,
}));

vi.mock('@/data/workplaceRespectFeature', () => ({
  RESPECT_FEATURE_ENABLED: true,
}));

import { POST } from '@/app/api/respect-advice/route';
import { CLIENT_ID_HEADER, MAX_CHAT_HISTORY_CHARS, MAX_CHAT_REQUEST_BYTES } from '@/lib/constants';
import { _resetStore } from '@/lib/rate-limit';
import { createRespectResponse } from '@/diagnostics/workplace-respect/response';
import { getRespectQuestions, isRespectEntry } from '@/data/workplaceRespectQuestions';

function adviceRequest(body: unknown, clientId = 'client-aaaaaaaaaaaa') {
  if (body && typeof body === 'object') {
    const value = body as Record<string, unknown>;
    if (typeof value.entry === 'string' && isRespectEntry(value.entry) && Array.isArray(value.answers)) {
      try {
        const payload: Record<string, unknown> = { ...value, response: createRespectResponse(value.entry, value.answers) };
        delete payload.answers;
        body = payload;
      } catch { /* Preserve malformed input for rejection cases. */ }
    }
  }
  return new NextRequest('http://localhost/api/respect-advice', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': '10.10.0.1',
      [CLIENT_ID_HEADER]: clientId,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/respect-advice', () => {
  beforeEach(() => {
    _resetStore();
    mocks.chatStream.mockClear();
  });

  it('서버와 브라우저의 시계 편차로 정상 버전 응답을 거절하지 않는다', async () => {
    const response = createRespectResponse('experience', Array(12).fill(0), Date.now() + 60_000);
    const res = await POST(adviceRequest({ entry: 'experience', response, question: '어디에 상담할까요?' }));
    expect(res.status).toBe(200);
  });

  it('부분 위기 응답은 허용하고 채점 버전 불일치는 거절한다', async () => {
    const response = createRespectResponse('action', [2]);
    const ok = await POST(adviceRequest({ entry: 'action', response, question: '지금 어떻게 도움을 요청할까요?' }));
    expect(ok.status).toBe(200);
    const old = await POST(adviceRequest({ entry: 'action', response: { ...response, scoringVersion: 'old' }, question: '문의' }));
    expect(old.status).toBe(400);
  });

  it('본문이 상한을 넘으면 AI를 호출하지 않고 413을 돌려준다', async () => {
    const res = await POST(adviceRequest({
      entry: 'experience',
      answers: Array(12).fill(0),
      question: '어디에 상담할까요?',
      history: [{ role: 'user', content: 'x'.repeat(MAX_CHAT_REQUEST_BYTES) }],
    }));

    expect(res.status).toBe(413);
    expect(mocks.chatStream).toHaveBeenCalledTimes(0);
  });

  it('기록은 최근 메시지부터 글자 수 한도 안에서만 AI에 보낸다', async () => {
    const history = [
      { role: 'user', content: '오래된-기록 ' + '가'.repeat(1990) },
      ...Array.from({ length: 6 }, (_, index) => ({ role: index % 2 ? 'user' : 'assistant', content: '나'.repeat(2000) })),
      { role: 'user', content: '최근-기록' },
    ];
    const res = await POST(adviceRequest({ entry: 'experience', answers: Array(12).fill(0), question: '어디에 상담할까요?', history }));

    expect(res.status).toBe(200);
    const call = mocks.chatStream.mock.calls.at(-1)?.[0] as { messages: Array<{ role: string; content: string }> } | undefined;
    const sentHistory = call?.messages.slice(1, -1) ?? [];
    expect(sentHistory).toHaveLength(6);
    expect(sentHistory.reduce((sum, message) => sum + message.content.length, 0)).toBeLessThanOrEqual(MAX_CHAT_HISTORY_CHARS);
    expect(JSON.stringify(sentHistory)).toContain('최근-기록');
    expect(JSON.stringify(sentHistory)).not.toContain('오래된-기록');
  });

  it('잘못된 entry는 400을 반환한다', async () => {
    const res = await POST(adviceRequest({ entry: 'unknown', answers: [] }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid respect entry' });
  });

  it('불완전한 답변은 AI 호출 전에 400을 반환한다', async () => {
    const res = await POST(adviceRequest({ entry: 'action', answers: [0, 1] }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid answers' });
  });

  it('질문이 없으면 AI 호출 전에 400을 반환한다', async () => {
    const res = await POST(adviceRequest({ entry: 'action', answers: Array(12).fill(0) }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'question is required' });
  });

  it('질문 길이가 너무 길면 400을 반환한다', async () => {
    const res = await POST(adviceRequest({
      entry: 'action',
      answers: Array(12).fill(0),
      question: '가'.repeat(501),
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'question must be under 500 chars' });
  });

  it('브라우저별 6번째 요청은 개인 한도 메시지와 limitedBy=client를 반환한다', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(adviceRequest({ entry: 'action', answers: [] }));
      expect(res.status).toBe(400);
    }

    const blocked = await POST(adviceRequest({ entry: 'action', answers: [] }));
    expect(blocked.status).toBe(429);

    const body = await blocked.json();
    expect(body.limitedBy).toBe('client');
    expect(body.error).toContain('1분에 5번');
  });

  it('이전 대화 history의 개인정보도 AI 호출 전에 가린다', async () => {
    const res = await POST(adviceRequest({
      entry: 'action',
      answers: Array(12).fill(0),
      question: '이 경우 어떻게 말하면 좋을까요?',
      history: [
        { role: 'user', content: '제 번호는 010-1234-5678이고 이름은 홍길동입니다.' },
        { role: 'assistant', content: '상황 중심으로 정리해 보겠습니다.' },
      ],
    }));

    expect(res.status).toBe(200);
    const lastCall = mocks.chatStream.mock.calls.at(-1) as unknown[] | undefined;
    expect(lastCall).toBeDefined();
    const call = lastCall?.[0] as { messages: unknown[] } | undefined;
    expect(call).toBeDefined();
    const serialized = JSON.stringify(call?.messages ?? []);
    expect(serialized).not.toContain('010-1234-5678');
    expect(serialized).toContain('[전화번호]');
  });

  it('내 행동 점검은 자기 행동 조정용 시스템 프롬프트를 사용한다', async () => {
    const res = await POST(adviceRequest({
      entry: 'action',
      answers: Array(12).fill(0),
      question: '제가 한 요청이 부담이었을까요?',
    }));

    expect(res.status).toBe(200);
    const lastCall = mocks.chatStream.mock.calls.at(-1) as unknown[] | undefined;
    expect(lastCall).toBeDefined();
    const call = lastCall?.[0] as { messages: Array<{ role: string; content: string }> } | undefined;
    expect(call).toBeDefined();
    const systemPrompt = call?.messages[0]?.content ?? '';
    expect(systemPrompt).toContain('클린 스타일의 내 행동 점검 조언 도우미');
    expect(systemPrompt).toContain('내 행동 점검 조언 방향');
    expect(systemPrompt).toContain('업무 목적과 기준');
    expect(systemPrompt).not.toContain('일터 존중 점검 조언 방향');
  });

  it('일터 존중 점검은 겪은 일 정리와 도움 경로용 시스템 프롬프트를 사용한다', async () => {
    const res = await POST(adviceRequest({
      entry: 'experience',
      answers: Array(12).fill(0),
      question: '제가 겪은 일이 부당한지 어떻게 정리하면 될까요?',
    }));

    expect(res.status).toBe(200);
    const lastCall = mocks.chatStream.mock.calls.at(-1) as unknown[] | undefined;
    expect(lastCall).toBeDefined();
    const call = lastCall?.[0] as { messages: Array<{ role: string; content: string }> } | undefined;
    expect(call).toBeDefined();
    const systemPrompt = call?.messages[0]?.content ?? '';
    expect(systemPrompt).toContain('클린 스타일의 일터 존중 점검 조언 도우미');
    expect(systemPrompt).toContain('일터 존중 점검 조언 방향');
    expect(systemPrompt).toContain('날짜·장소·말투·증거');
    expect(systemPrompt).not.toContain('내 행동 점검 조언 방향');
  });

  it.each(['action', 'experience'])('청렴 유형과 점수 필드를 %s 진단의 AI 맥락으로 전달하지 않는다', async (entry) => {
    const res = await POST(adviceRequest({
      entry, answers: Array(12).fill(0), question: '이 상황에서 다음 행동을 알려주세요.',
      styleKey: 'adult-type-must-not-leak', scores: { p: 987, t: 654, i: 321 },
    }));
    expect(res.status).toBe(200);
    const lastCall = mocks.chatStream.mock.calls.at(-1) as unknown[] | undefined;
    const call = lastCall?.[0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const userMessage = call.messages.at(-1)?.content ?? '';
    expect(userMessage).not.toContain('adult-type-must-not-leak');
    expect(userMessage).not.toContain('987');
    expect(userMessage).not.toContain('나의 청렴 스타일');
    expect(call.messages[0].content).toContain('청렴 스타일 유형과 성향 점수를 사용하거나 언급하지 마세요');
    expect(call.messages[0].content).toContain('즉각적인 자해·폭력·위해 위험');
  });

  it('일터 존중 긴급 결과는 전문 상담사 톤과 즉시 도움 연결 프롬프트를 추가한다', async () => {
    const answers = Array(12).fill(0);
    answers[getRespectQuestions('experience').findIndex(q => q.id === 'E10')] = 3;

    const res = await POST(adviceRequest({
      entry: 'experience',
      answers,
      question: '기관 내에 보통 어디에 문의하면 되지?',
    }));

    expect(res.status).toBe(200);
    const lastCall = mocks.chatStream.mock.calls.at(-1) as unknown[] | undefined;
    expect(lastCall).toBeDefined();
    const call = lastCall?.[0] as { messages: Array<{ role: string; content: string }> } | undefined;
    expect(call).toBeDefined();
    const systemPrompt = call?.messages[0]?.content ?? '';
    expect(systemPrompt).toContain('긴급 도움 연결 답변 방향');
    expect(systemPrompt).toContain('전문 상담사처럼');
    expect(systemPrompt).toContain('모든 답변에 109, 112, 119를 반복하지 마세요');
    expect(systemPrompt).toContain('연결 순서를 묻는 경우');
    expect(systemPrompt).toContain('고충처리·EAP·노동조합');
    expect(systemPrompt).toContain('지금 혼자 감당하기 어렵고 안전이 걱정됩니다');
  });
});
