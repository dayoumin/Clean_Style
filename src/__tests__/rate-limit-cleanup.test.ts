import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIENT_ID_HEADER } from '@/lib/constants';
import { _getStoreSize, _resetStore, checkRateLimit, checkScopedRateLimit } from '@/lib/rate-limit';

describe('rate limit record expiry', () => {
  beforeEach(() => {
    _resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    _resetStore();
  });

  function scoped(clientId: string, windowMs = 60_000, scope = 'chat', ipLimit = 200) {
    return checkScopedRateLimit({
      scope,
      request: new Request('http://localhost', {
        headers: {
          'cf-connecting-ip': '192.0.2.1',
          [CLIENT_ID_HEADER]: clientId,
        },
      }),
      clientLimit: 1,
      ipLimit,
      windowMs,
    });
  }

  it('reclaims abandoned client IDs across repeated time windows', () => {
    for (let window = 0; window < 100; window++) {
      vi.setSystemTime(window * 60_001);
      for (let client = 0; client < 2; client++) {
        expect(scoped(`browser-${window}-${client}-unique`).allowed).toBe(true);
      }
      expect(_getStoreSize()).toBe(3);
    }
  });

  it('reclaims abandoned legacy keys without looking them up again', () => {
    for (let window = 0; window < 100; window++) {
      vi.setSystemTime(window * 60_001);
      expect(checkRateLimit(`legacy-${window}-a`, 1).allowed).toBe(true);
      expect(checkRateLimit(`legacy-${window}-b`, 1).allowed).toBe(true);
      expect(_getStoreSize()).toBe(2);
    }
  });

  it('honors each scope window when legacy traffic triggers cleanup', () => {
    expect(scoped('client-long-window', 180_000, 'summarize').allowed).toBe(true);
    expect(checkRateLimit('short-window', 1, 1000).allowed).toBe(true);

    vi.setSystemTime(60_000);
    expect(checkRateLimit('cleanup-trigger', 1).allowed).toBe(true);
    expect(_getStoreSize()).toBe(3);
    expect(scoped('client-long-window', 180_000, 'summarize')).toEqual({
      allowed: false,
      retryAfter: 120,
      limitedBy: 'client',
    });

    vi.setSystemTime(180_000);
    expect(scoped('client-at-boundary').allowed).toBe(true);
    expect(_getStoreSize()).toBe(2);
    expect(scoped('client-long-window', 180_000, 'summarize').allowed).toBe(true);
  });

  it('keeps recent requests blocked while removing older clients', () => {
    expect(scoped('client-old-record').allowed).toBe(true);
    vi.setSystemTime(30_000);
    expect(scoped('client-recent-record').allowed).toBe(true);

    vi.setSystemTime(60_000);
    expect(scoped('client-cleanup-trigger').allowed).toBe(true);
    expect(_getStoreSize()).toBe(3);
    expect(scoped('client-recent-record')).toEqual({
      allowed: false,
      retryAfter: 30,
      limitedBy: 'client',
    });

    vi.setSystemTime(90_000);
    expect(scoped('client-recent-record').allowed).toBe(true);
  });

  it('keeps the IP cap when cleanup removes an expired client', () => {
    expect(scoped('client-network-old', 60_000, 'chat', 2).allowed).toBe(true);
    vi.setSystemTime(30_000);
    expect(scoped('client-network-recent', 60_000, 'chat', 2).allowed).toBe(true);

    vi.setSystemTime(60_000);
    expect(scoped('client-network-trigger', 60_000, 'chat', 2).allowed).toBe(true);
    expect(scoped('client-network-blocked', 60_000, 'chat', 2)).toEqual({
      allowed: false,
      retryAfter: 30,
      limitedBy: 'ip',
    });
    expect(_getStoreSize()).toBe(3);
  });

  it('does not extend a rejected client record past its last accepted request', () => {
    expect(scoped('client-blocked-record').allowed).toBe(true);
    vi.setSystemTime(59_999);
    expect(scoped('client-blocked-record').allowed).toBe(false);

    vi.setSystemTime(60_000);
    expect(scoped('client-replacement-record').allowed).toBe(true);
    expect(_getStoreSize()).toBe(2);
  });

  it('does not extend a rejected legacy record past its last accepted request', () => {
    expect(checkRateLimit('legacy-blocked-record', 1).allowed).toBe(true);
    vi.setSystemTime(59_999);
    expect(checkRateLimit('legacy-blocked-record', 1).allowed).toBe(false);

    vi.setSystemTime(60_000);
    expect(checkRateLimit('legacy-replacement-record', 1).allowed).toBe(true);
    expect(_getStoreSize()).toBe(1);
  });
});
