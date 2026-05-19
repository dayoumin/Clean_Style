import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIENT_ID_HEADER } from '@/lib/constants';
import { checkRateLimit, checkScopedRateLimit, getClientId, getClientIp, _getStoreSize, _resetStore } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetStore();
    vi.useRealTimers();
  });

  it('제한 내 요청 → allowed: true', () => {
    const result = checkRateLimit('test-ip', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBeUndefined();
  });

  it('제한 초과 → allowed: false + retryAfter', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('overflow-ip', 3, 60_000);
    }
    const result = checkRateLimit('overflow-ip', 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('다른 IP는 독립적으로 카운트', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('ip-a', 3, 60_000);
    }
    const resultA = checkRateLimit('ip-a', 3, 60_000);
    const resultB = checkRateLimit('ip-b', 3, 60_000);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it('윈도우 만료 후 다시 허용', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    for (let i = 0; i < 3; i++) {
      checkRateLimit('expire-ip', 3, 1000);
    }
    expect(checkRateLimit('expire-ip', 3, 1000).allowed).toBe(false);

    vi.setSystemTime(now + 1001);
    expect(checkRateLimit('expire-ip', 3, 1000).allowed).toBe(true);

    vi.useRealTimers();
  });
});

describe('checkRateLimit — /api/results 시뮬레이션 (5req/60s)', () => {
  beforeEach(() => {
    _resetStore();
  });

  const RESULTS_LIMIT = 5;
  const RESULTS_WINDOW_MS = 60_000;

  it('정상 사용: 테스트 완료 1회 → 허용', () => {
    const result = checkRateLimit('user-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS);
    expect(result.allowed).toBe(true);
  });

  it('5회까지 허용, 6회째 차단', () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit('attacker-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit('attacker-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it('curl 반복 호출 시뮬레이션: 100회 중 5회만 허용', () => {
    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 100; i++) {
      const r = checkRateLimit('curl-attacker', RESULTS_LIMIT, RESULTS_WINDOW_MS);
      if (r.allowed) allowedCount++;
      else blockedCount++;
    }

    expect(allowedCount).toBe(5);
    expect(blockedCount).toBe(95);
  });

  it('차단된 IP와 다른 IP는 독립 동작', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('bad-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS);
    }
    expect(checkRateLimit('bad-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS).allowed).toBe(false);
    expect(checkRateLimit('good-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS).allowed).toBe(true);
  });

  it('윈도우 만료 ��� 다시 허용됨', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    for (let i = 0; i < 5; i++) {
      checkRateLimit('recover-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS);
    }
    expect(checkRateLimit('recover-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS).allowed).toBe(false);

    vi.setSystemTime(now + 60_001);
    expect(checkRateLimit('recover-ip', RESULTS_LIMIT, RESULTS_WINDOW_MS).allowed).toBe(true);

    vi.useRealTimers();
  });
});

describe('checkScopedRateLimit', () => {
  beforeEach(() => {
    _resetStore();
  });

  function request(ip: string, clientId?: string) {
    return new Request('http://localhost', {
      headers: {
        'cf-connecting-ip': ip,
        ...(clientId ? { [CLIENT_ID_HEADER]: clientId } : {}),
      },
    });
  }

  it('채팅은 브라우저별 5회/분까지 허용하고 6회째 차단', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkScopedRateLimit({
        scope: 'chat',
        request: request('1.1.1.1', 'client-aaaaaaaaaaaa'),
        clientLimit: 5,
        ipLimit: 200,
      }).allowed).toBe(true);
    }

    const blocked = checkScopedRateLimit({
      scope: 'chat',
      request: request('1.1.1.1', 'client-aaaaaaaaaaaa'),
      clientLimit: 5,
      ipLimit: 200,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.limitedBy).toBe('client');
  });

  it('같은 IP라도 clientId가 다르면 브라우저별 카운터가 분리됨', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkScopedRateLimit({
        scope: 'chat',
        request: request('2.2.2.2', 'client-aaaaaaaaaaaa'),
        clientLimit: 5,
        ipLimit: 200,
      }).allowed).toBe(true);
    }

    expect(checkScopedRateLimit({
      scope: 'chat',
      request: request('2.2.2.2', 'client-bbbbbbbbbbbb'),
      clientLimit: 5,
      ipLimit: 200,
    }).allowed).toBe(true);
  });

  it('브라우저가 달라도 같은 IP 전체 요청이 과도하면 IP 집계 제한이 막음', () => {
    for (let i = 0; i < 3; i++) {
      expect(checkScopedRateLimit({
        scope: 'chat',
        request: request('3.3.3.3', `client-${i}aaaaaaaaaaaa`),
        clientLimit: 5,
        ipLimit: 3,
      }).allowed).toBe(true);
    }

    const blocked = checkScopedRateLimit({
      scope: 'chat',
      request: request('3.3.3.3', 'client-dddddddddddd'),
      clientLimit: 5,
      ipLimit: 3,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.limitedBy).toBe('ip');
  });

  it('IP 제한을 먼저 검사해 rotating clientId가 추가 client key를 만들지 않음', () => {
    expect(checkScopedRateLimit({
      scope: 'chat',
      request: request('3.3.3.4', 'client-aaaaaaaaaaaa'),
      clientLimit: 5,
      ipLimit: 1,
    }).allowed).toBe(true);
    expect(_getStoreSize()).toBe(2);

    const blocked = checkScopedRateLimit({
      scope: 'chat',
      request: request('3.3.3.4', 'client-bbbbbbbbbbbb'),
      clientLimit: 5,
      ipLimit: 1,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.limitedBy).toBe('ip');
    expect(_getStoreSize()).toBe(2);
  });

  it('client 제한에 막힌 요청은 IP 전체 카운터를 소모하지 않음', () => {
    expect(checkScopedRateLimit({
      scope: 'chat',
      request: request('3.3.3.5', 'client-aaaaaaaaaaaa'),
      clientLimit: 1,
      ipLimit: 2,
    }).allowed).toBe(true);

    const clientBlocked = checkScopedRateLimit({
      scope: 'chat',
      request: request('3.3.3.5', 'client-aaaaaaaaaaaa'),
      clientLimit: 1,
      ipLimit: 2,
    });
    expect(clientBlocked.allowed).toBe(false);
    expect(clientBlocked.limitedBy).toBe('client');

    const otherClient = checkScopedRateLimit({
      scope: 'chat',
      request: request('3.3.3.5', 'client-bbbbbbbbbbbb'),
      clientLimit: 1,
      ipLimit: 2,
    });
    expect(otherClient.allowed).toBe(true);
  });

  it('API scope가 다르면 같은 사용자라도 카운터가 분리됨', () => {
    for (let i = 0; i < 5; i++) {
      checkScopedRateLimit({
        scope: 'chat',
        request: request('4.4.4.4', 'client-aaaaaaaaaaaa'),
        clientLimit: 5,
        ipLimit: 200,
      });
    }

    expect(checkScopedRateLimit({
      scope: 'results',
      request: request('4.4.4.4', 'client-aaaaaaaaaaaa'),
      clientLimit: 5,
      ipLimit: 200,
    }).allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('cf-connecting-ip 우선', () => {
    const req = new Request('http://localhost', {
      headers: {
        'cf-connecting-ip': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
      },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('cf-connecting-ip 없으면 x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '5.6.7.8, 9.10.11.12' },
    });
    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('둘 다 없으면 unknown', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('getClientId', () => {
  it('유효한 clientId 헤더를 반환', () => {
    const req = new Request('http://localhost', {
      headers: { [CLIENT_ID_HEADER]: 'client-aaaaaaaaaaaa' },
    });
    expect(getClientId(req)).toBe('client-aaaaaaaaaaaa');
  });

  it('너무 짧거나 허용되지 않는 문자가 있으면 무시', () => {
    expect(getClientId(new Request('http://localhost', {
      headers: { [CLIENT_ID_HEADER]: 'short' },
    }))).toBeNull();
    expect(getClientId(new Request('http://localhost', {
      headers: { [CLIENT_ID_HEADER]: 'client<script>alert(1)</script>' },
    }))).toBeNull();
  });
});
