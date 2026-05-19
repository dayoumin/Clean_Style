import { describe, expect, it, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';
import { CLIENT_ID_HEADER } from '@/lib/constants';
import { _resetStore } from '@/lib/rate-limit';

function chatRequest(ip: string, clientId: string) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': ip,
      [CLIENT_ID_HEADER]: clientId,
    },
    body: JSON.stringify({}),
  });
}

describe('/api/chat rate limit responses', () => {
  beforeEach(() => {
    _resetStore();
  });

  it('브라우저별 6번째 요청은 개인 한도 메시지와 limitedBy=client를 반환', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(chatRequest('10.0.0.1', 'client-aaaaaaaaaaaa'));
      expect(res.status).toBe(400);
    }

    const blocked = await POST(chatRequest('10.0.0.1', 'client-aaaaaaaaaaaa'));
    expect(blocked.status).toBe(429);

    const body = await blocked.json();
    expect(body.limitedBy).toBe('client');
    expect(body.error).toContain('1분에 5번');
  });

  it('IP 전체 201번째 요청은 같은 네트워크 한도 메시지와 limitedBy=ip를 반환', async () => {
    for (let i = 0; i < 200; i++) {
      const clientId = `client-${String(i).padStart(12, 'a')}`;
      const res = await POST(chatRequest('10.0.0.2', clientId));
      expect(res.status).toBe(400);
    }

    const blocked = await POST(chatRequest('10.0.0.2', 'client-zzzzzzzzzzzz'));
    expect(blocked.status).toBe(429);

    const body = await blocked.json();
    expect(body.limitedBy).toBe('ip');
    expect(body.error).toContain('같은 네트워크');
  });
});
