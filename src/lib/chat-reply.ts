import { scanAndRedactPiiText, type PiiType } from '@/lib/sanitize';

export type ChatErrorType = 'network' | 'rate-limit' | 'shared-rate-limit' | 'server';
export interface PrivateChatReply { answer: string; detected: PiiType[] }
const MAX_REPLY_CHARS = 12_000;
const MAX_EVENT_CHARS = 128_000;
const PII_TYPES = new Set<PiiType>(['주민등록번호', '신용카드번호', '전화번호', '이메일', '계좌번호']);

export function getChatErrorType(error: unknown): ChatErrorType {
  if (error instanceof TypeError) return 'network';
  if (error instanceof Error && error.message === 'RATE_LIMIT') return 'rate-limit';
  if (error instanceof Error && error.message === 'SHARED_RATE_LIMIT') return 'shared-rate-limit';
  return 'server';
}

/** App SSE contract, not the provider protocol. No partial reply leaves this function. */
export async function readPrivateChatReply(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): Promise<PrivateChatReply> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const detected = new Set<PiiType>();
  let buffer = '';
  let answer = '';
  let completed = false;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  const checkAbort = () => { if (signal?.aborted) throw new DOMException('Aborted', 'AbortError'); };
  const parseLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') { completed = true; return; }
    let event: unknown;
    try { event = JSON.parse(payload); } catch { throw new Error('Invalid chat event'); }
    if (!event || typeof event !== 'object') throw new Error('Invalid chat event');
    const data = event as Record<string, unknown>;
    if (data.error) throw new Error('Chat service failed');
    if (Array.isArray(data.pii_warning)) {
      for (const type of data.pii_warning) if (PII_TYPES.has(type as PiiType)) detected.add(type as PiiType);
    }
    if (data.token !== undefined) {
      if (typeof data.token !== 'string' || answer.length + data.token.length > MAX_REPLY_CHARS) {
        throw new Error('Invalid chat reply');
      }
      answer += data.token;
    }
  };
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    checkAbort();
    while (!completed) {
      const { done, value } = await reader.read();
      checkAbort();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (buffer.length > MAX_EVENT_CHARS) throw new Error('Chat event too large');
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1 && !completed) {
        parseLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
      }
      if (done) {
        if (!completed && buffer.trim()) parseLine(buffer);
        break;
      }
    }
    checkAbort();
    if (!completed) throw new Error('Incomplete chat reply');
    const safe = scanAndRedactPiiText(answer);
    if (!safe.redacted.trim()) throw new Error('Empty chat reply');
    safe.detected.forEach(type => detected.add(type));
    return { answer: safe.redacted, detected: [...detected] };
  } finally {
    signal?.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function readChatReplyResponse(response: Response, signal?: AbortSignal): Promise<PrivateChatReply> {
  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.limitedBy === 'ip' ? 'SHARED_RATE_LIMIT' : 'RATE_LIMIT');
  }
  if (!response.ok || !response.body) throw new Error('Chat service failed');
  return readPrivateChatReply(response.body, signal);
}
