/**
 * In-memory sliding window rate limiter.
 *
 * Designed for Cloudflare Workers: the global Map persists within an
 * isolate but resets on cold start (fail-open, which is acceptable).
 * No external dependencies.
 */

const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 60_000;

/** ip -> sorted array of request timestamps (ms) */
const store = new Map<string, number[]>();

/** 테스트용: 내부 store 초기화 */
export function _resetStore() { store.clear(); }

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may retry. Only present when `allowed` is false. */
  retryAfter?: number;
}

/**
 * Check whether a request from `ip` is within the rate limit.
 *
 * On every call the window is lazily pruned so the Map never grows
 * unbounded for a given key.
 */
export function checkRateLimit(
  ip: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  // IP를 식별할 수 없으면 제한하지 않음 (진짜 fail-open)
  if (ip === 'unknown') return { allowed: true };

  const now = Date.now();
  const windowStart = now - windowMs;

  // Retrieve existing timestamps and prune expired ones in one pass.
  let timestamps = store.get(ip);

  if (timestamps) {
    // Find the first index that falls inside the current window.
    let firstValid = 0;
    while (firstValid < timestamps.length && timestamps[firstValid] <= windowStart) {
      firstValid++;
    }
    if (firstValid > 0) {
      timestamps = timestamps.slice(firstValid);
    }
    // All entries expired — evict the key
    if (timestamps.length === 0) {
      store.delete(ip);
    }
  } else {
    timestamps = [];
  }

  if (timestamps.length >= limit) {
    // Oldest timestamp still in the window determines when the caller can retry.
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    const retryAfter = Math.ceil(retryAfterMs / 1000);

    // Persist the pruned array (no new entry added).
    store.set(ip, timestamps);

    return { allowed: false, retryAfter };
  }

  // Under the limit — record this request.
  timestamps.push(now);
  store.set(ip, timestamps);

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
