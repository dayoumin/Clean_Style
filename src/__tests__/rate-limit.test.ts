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
