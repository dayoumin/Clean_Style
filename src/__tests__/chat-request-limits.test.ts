import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as chatPOST } from '@/app/api/chat/route';
import { POST as summarizePOST } from '@/app/api/summarize/route';
import { CLIENT_ID_HEADER, MAX_CHAT_REQUEST_BYTES } from '@/lib/constants';
import { _resetStore } from '@/lib/rate-limit';
import { redactHistoryPii, trimHistoryToLimit } from '@/lib/sanitize';

const STYLE_KEY = 'principle-transparent-independent';
const PII_TEXT = '연락처는 010-1234-5678, 메일은 kim@example.com, 주민번호 900101-1234567 입니다.';

function postRequest(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': '10.1.0.1',
      [CLIENT_ID_HEADER]: `client-${Math.random().toString(36).slice(2, 14).padEnd(12, 'a')}`,
    },
    body: JSON.stringify(body),
  });
}

/** OpenRouter로 나가는 요청 본문을 잡아 두고, 짧은 SSE 응답을 돌려준다. */
function captureUpstream() {
  const bodies: { messages: { role: string; content: string }[] }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    const sse = 'data: {"choices":[{"delta":{"content":"답변"}}]}\n\ndata: [DONE]\n\n';
    const json = { choices: [{ message: { content: '요약' } }] };
    const isStream = JSON.parse(String(init.body)).stream === true;
    return isStream
      ? new Response(sse, { status: 200, headers: { 'content-type': 'text/event-stream' } })
      : new Response(JSON.stringify(json), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
  return bodies;
}

describe('trimHistoryToLimit', () => {
  it('최근 메시지부터 글자 수 한도 안에 드는 것만 남긴다', () => {
    const history = [
      { role: 'user', content: 'a'.repeat(50) },
      { role: 'assistant', content: 'b'.repeat(50) },
      { role: 'user', content: 'c'.repeat(30) },
    ];
    expect(trimHistoryToLimit(history, 40, 80).map(m => m.content[0])).toEqual(['b', 'c']);
  });

  it('메시지 개수 한도도 적용한다', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({ role: 'user', content: String(i) }));
    expect(trimHistoryToLimit(history, 3, 1000).map(m => m.content)).toEqual(['7', '8', '9']);
  });
});

describe('redactHistoryPii', () => {
  it('기록의 전화번호·이메일·주민번호를 가린다', () => {
    const [message] = redactHistoryPii([{ role: 'user', content: PII_TEXT }]);
    expect(message.content).not.toContain('010-1234-5678');
    expect(message.content).not.toContain('kim@example.com');
    expect(message.content).not.toContain('900101-1234567');
    expect(message.content).toContain('[전화번호]');
  });
});

describe('/api/chat·/api/summarize 요청 상한과 기록 마스킹', () => {
  beforeEach(() => {
    _resetStore();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('본문이 상한을 넘으면 AI를 호출하지 않고 413을 돌려준다', async () => {
    const bodies = captureUpstream();
    const res = await chatPOST(postRequest('/api/chat', {
      styleKey: STYLE_KEY,
      userContext: '질문',
      history: [{ role: 'user', content: 'x'.repeat(MAX_CHAT_REQUEST_BYTES) }],
    }));
    expect(res.status).toBe(413);
    expect(bodies).toHaveLength(0);
  });

  it('요약 요청도 상한을 넘으면 413', async () => {
    const bodies = captureUpstream();
    const res = await summarizePOST(postRequest('/api/summarize', {
      styleKey: STYLE_KEY,
      history: Array.from({ length: 200 }, () => ({ role: 'user', content: '가'.repeat(2000) })),
    }));
    expect(res.status).toBe(413);
    expect(bodies).toHaveLength(0);
  });

  it('채팅: 이전 기록과 요약의 개인정보도 가려서 보낸다', async () => {
    const bodies = captureUpstream();
    const res = await chatPOST(postRequest('/api/chat', {
      styleKey: STYLE_KEY,
      userContext: '업체에서 선물을 받아도 될까요?',
      history: [
        { role: 'user', content: PII_TEXT },
        { role: 'assistant', content: '알겠습니다.' },
      ],
      summary: `이전에 ${PII_TEXT}`,
    }));
    expect(res.status).toBe(200);
    await res.text();

    const outgoing = JSON.stringify(bodies[0].messages);
    expect(outgoing).not.toContain('010-1234-5678');
    expect(outgoing).not.toContain('kim@example.com');
    expect(outgoing).not.toContain('900101-1234567');
  });

  it('요약: 기록의 개인정보를 가리고 한도를 넘는 오래된 기록은 버린다', async () => {
    const bodies = captureUpstream();
    const res = await summarizePOST(postRequest('/api/summarize', {
      styleKey: STYLE_KEY,
      history: [
        { role: 'user', content: '오래된-메시지 ' + '가'.repeat(1990) },
        ...Array.from({ length: 6 }, () => ({ role: 'assistant', content: '나'.repeat(2000) })),
        { role: 'user', content: PII_TEXT },
      ],
    }));
    expect(res.status).toBe(200);

    const outgoing = JSON.stringify(bodies[0].messages);
    expect(outgoing).not.toContain('010-1234-5678');
    expect(outgoing).not.toContain('오래된-메시지');
  });
});
