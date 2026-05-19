/**
 * In-memory sliding window rate limiter.
 *
 * Designed for Cloudflare Workers: the global Map persists within an
 * isolate but resets on cold start (fail-open, which is acceptable).
 * No external dependencies.
 */

import { CLIENT_ID_HEADER } from '@/lib/constants';

const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 60_000;
export const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{12,80}$/;

/** key -> sorted array of request timestamps (ms) */
const store = new Map<string, number[]>();

/** 테스트용: 내부 store 초기화 */
export function _resetStore() { store.clear(); }

/** 테스트용: 내부 store 크기 확인 */
export function _getStoreSize() { return store.size; }

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may retry. Only present when `allowed` is false. */
  retryAfter?: number;
  /** Which limiter blocked the request. Only present when `allowed` is false. */
  limitedBy?: 'client' | 'ip';
}

interface WindowCheck {
  allowed: boolean;
  timestamps: number[];
  retryAfter?: number;
}

function checkWindow(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): WindowCheck {
  const windowStart = now - windowMs;
  let timestamps = store.get(key) ?? [];

  let firstValid = 0;
  while (firstValid < timestamps.length && timestamps[firstValid] <= windowStart) {
    firstValid++;
  }
  if (firstValid > 0) {
    timestamps = timestamps.slice(firstValid);
  }

  if (timestamps.length >= limit) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      timestamps,
      retryAfter: Math.ceil(retryAfterMs / 1000),
    };
  }

  return { allowed: true, timestamps };
}

function persistWindow(key: string, timestamps: number[], now?: number) {
  if (key === 'unknown') return;

  if (typeof now === 'number') {
    store.set(key, [...timestamps, now]);
  } else if (timestamps.length === 0) {
    store.delete(key);
  } else {
    store.set(key, timestamps);
  }
}

/**
 * Check whether a request from `ip` is within the rate limit.
 *
 * On every call the window is lazily pruned so the Map never grows
 * unbounded for a given key.
 */
export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  // 식별할 수 없으면 제한하지 않음 (진짜 fail-open)
  if (key === 'unknown') return { allowed: true };

  const now = Date.now();
  const result = checkWindow(key, limit, windowMs, now);

  if (!result.allowed) {
    persistWindow(key, result.timestamps);
    return { allowed: false, retryAfter: result.retryAfter };
  }

  persistWindow(key, result.timestamps, now);

  return { allowed: true };
}

export function getClientId(request: Request): string | null {
  const raw = request.headers.get(CLIENT_ID_HEADER);
  if (!raw) return null;

  const trimmed = raw.trim();
  return CLIENT_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export interface ScopedRateLimitOptions {
  scope: string;
  request: Request;
  clientLimit: number;
  ipLimit: number;
  windowMs?: number;
}

export function checkScopedRateLimit({
  scope,
  request,
  clientLimit,
  ipLimit,
  windowMs = DEFAULT_WINDOW_MS,
}: ScopedRateLimitOptions): RateLimitResult {
  const ip = getClientIp(request);
  const clientId = getClientId(request);
  const ipKey = ip === 'unknown' ? 'unknown' : `${scope}:ip:${ip}`;
  const clientKey = clientId
    ? `${scope}:client:${ip}:${clientId}`
    : (ip === 'unknown' ? 'unknown' : `${scope}:client:${ip}:anonymous`);
  const now = Date.now();

  const ipResult = ipKey === 'unknown'
    ? { allowed: true, timestamps: [] }
    : checkWindow(ipKey, ipLimit, windowMs, now);
  if (!ipResult.allowed) {
    persistWindow(ipKey, ipResult.timestamps);
    return { allowed: false, retryAfter: ipResult.retryAfter, limitedBy: 'ip' };
  }

  const clientResult = clientKey === 'unknown'
    ? { allowed: true, timestamps: [] }
    : checkWindow(clientKey, clientLimit, windowMs, now);
  if (!clientResult.allowed) {
    persistWindow(ipKey, ipResult.timestamps);
    persistWindow(clientKey, clientResult.timestamps);
    return { allowed: false, retryAfter: clientResult.retryAfter, limitedBy: 'client' };
  }

  persistWindow(ipKey, ipResult.timestamps, now);
  persistWindow(clientKey, clientResult.timestamps, now);

  return { allowed: true };
}

/**
 * Extract the client IP from a Request.
 *
 * Priority:
 * 1. `cf-connecting-ip`  — set by Cloudflare
 * 2. `x-forwarded-for`   — first address in the chain
 * 3. `'unknown'`         — safe fallback (fail-open)
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0];
    if (first) return first.trim();
  }

  return 'unknown';
}
