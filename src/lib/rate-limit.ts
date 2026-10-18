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
const CLEANUP_INTERVAL_MS = 60_000;
export const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{12,80}$/;

interface RateLimitWindow {
  timestamps: number[];
  expiresAt: number;
}

const store = new Map<string, RateLimitWindow>();
let nextCleanupAt = 0;

// Reclaim abandoned keys on incoming traffic, without background timers.
function cleanupExpiredWindows(now: number) {
  if (now < nextCleanupAt) return;
  for (const [key, window] of store) {
    if (window.expiresAt <= now) store.delete(key);
  }
  nextCleanupAt = now + CLEANUP_INTERVAL_MS;
}

/** 테스트용: 내부 store 초기화 */
export function _resetStore() {
  store.clear();
  nextCleanupAt = 0;
}

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
  let timestamps = store.get(key)?.timestamps ?? [];

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

function persistWindow(key: string, timestamps: number[], windowMs: number, now?: number) {
  if (key === 'unknown') return;

  const recorded = typeof now === 'number' ? [...timestamps, now] : timestamps;
  if (recorded.length === 0) {
    store.delete(key);
    return;
  }

  store.set(key, {
    timestamps: recorded,
    // Rejected requests must not extend the last accepted request's lifetime.
    expiresAt: recorded[recorded.length - 1] + windowMs,
  });
}

/**
 * Check whether a request from `ip` is within the rate limit.
 *
 * Each call prunes the current window. Incoming traffic also reclaims expired
 * keys at most once per minute, including keys that are never queried again.
 */
export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  // 식별할 수 없으면 제한하지 않음 (진짜 fail-open)
  if (key === 'unknown') return { allowed: true };

  const now = Date.now();
  cleanupExpiredWindows(now);
  const result = checkWindow(key, limit, windowMs, now);

  if (!result.allowed) {
    persistWindow(key, result.timestamps, windowMs);
    return { allowed: false, retryAfter: result.retryAfter };
  }

  persistWindow(key, result.timestamps, windowMs, now);

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
  cleanupExpiredWindows(now);

  const ipResult = ipKey === 'unknown'
    ? { allowed: true, timestamps: [] }
    : checkWindow(ipKey, ipLimit, windowMs, now);
  if (!ipResult.allowed) {
    persistWindow(ipKey, ipResult.timestamps, windowMs);
    return { allowed: false, retryAfter: ipResult.retryAfter, limitedBy: 'ip' };
  }

  const clientResult = clientKey === 'unknown'
    ? { allowed: true, timestamps: [] }
    : checkWindow(clientKey, clientLimit, windowMs, now);
  if (!clientResult.allowed) {
    persistWindow(ipKey, ipResult.timestamps, windowMs);
    persistWindow(clientKey, clientResult.timestamps, windowMs);
    return { allowed: false, retryAfter: clientResult.retryAfter, limitedBy: 'client' };
  }

  persistWindow(ipKey, ipResult.timestamps, windowMs, now);
  persistWindow(clientKey, clientResult.timestamps, windowMs, now);

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
