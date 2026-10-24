// Production smoke checks shared by `pnpm release` and `pnpm release:rollback`.
// With `candidateVersionId`, requests are pinned to a 0% candidate through the
// Cloudflare version override header, so the check runs before any user traffic moves.

const REQUEST_TIMEOUT_MS = 45000;

/** @param {import('./products.mjs').Product} product @param {string | undefined} candidateVersionId @returns {Record<string,string>} */
export function overrideHeaders(product, candidateVersionId) {
  return candidateVersionId ? { 'Cloudflare-Workers-Version-Overrides': `${product.worker}="${candidateVersionId}"` } : {};
}

/** @param {import('./products.mjs').Product} product @param {{candidateVersionId?: string}} [options] @returns {Promise<string>} */
export async function runSmoke(product, options = {}) {
  const headers = overrideHeaders(product, options.candidateVersionId);
  return product.smoke === 'chat' ? smokeChat(product, headers) : smokeStudent(product, headers);
}

/** Adult AI chat must stream at least one token (same check as the former deploy workflow). */
async function smokeChat(product, headers) {
  const started = Date.now();
  const res = await fetch(`${product.url}/api/chat`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', 'x-clean-style-client-id': `release-smoke-${Date.now()}` },
    body: JSON.stringify({
      styleKey: 'principle-transparent-independent',
      scores: { principle: 80, transparency: 80, independence: 80 },
      userContext: '출장을 하루면 되는데 2일로 가도 될까?',
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok || !res.body) throw new Error(`AI smoke HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const errors = [];
  let buffer = '';
  const handle = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) return false;
    const payload = trimmed.slice(6);
    if (payload === '[DONE]') return false;
    let event;
    try { event = JSON.parse(payload); } catch { return false; }
    if (event.error) errors.push(`${event.error}${event.status ? `:${event.status}` : ''}`);
    return Boolean(event.token);
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    if (lines.some(handle)) {
      await reader.cancel();
      return `AI chat streamed a token in ${Date.now() - started}ms`;
    }
  }
  if (handle(buffer)) return `AI chat streamed a token in ${Date.now() - started}ms`;
  throw new Error(`AI smoke failed: ${errors.join(', ') || 'no token returned'}`);
}

/** Student pages load and every adult API stays disabled. */
async function smokeStudent(product, headers) {
  for (const path of ['/', '/test']) {
    const res = await fetch(`${product.url}${path}`, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`student ${path} HTTP ${res.status}`);
  }
  const blockedRoutes = [
    { path: '/api/chat', method: 'POST' },
    { path: '/api/results', method: 'POST' },
    { path: '/api/questions', method: 'GET' },
    { path: '/api/summarize', method: 'POST' },
    { path: '/api/respect-advice', method: 'POST' },
    { path: '/api/admin/dashboard', method: 'HEAD' },
  ];
  for (const route of blockedRoutes) {
    const res = await fetch(`${product.url}${route.path}`, {
      method: route.method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: route.method === 'POST' ? '{}' : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.status !== 404) throw new Error(`${route.path} should be disabled, got HTTP ${res.status}`);
  }
  return 'student pages load and adult APIs return 404';
}
