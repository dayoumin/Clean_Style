import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp, _resetStore } from '@/lib/rate-limit';

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
