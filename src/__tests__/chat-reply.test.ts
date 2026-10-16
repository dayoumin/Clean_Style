import { describe, expect, it, vi } from 'vitest';
import { getChatErrorType, readChatReplyResponse, readPrivateChatReply } from '@/lib/chat-reply';
import { createPrivateChatStream } from '@/lib/private-chat-stream';

const encoder = new TextEncoder();
const token = (text: string) => `data: ${JSON.stringify({ token: text })}\n\n`;
function source(text: string) { return new Response(text).body!; }
function controlled() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({ start(c) { controller = c; }, cancel });
  return { stream, controller, cancel, send: (text: string) => controller.enqueue(encoder.encode(text)) };
}

describe('completed private chat reply contract', () => {
  it('handles byte splits, Korean, CRLF, and an unterminated final DONE line', async () => {
    const bytes = encoder.encode(token('답변 010-12') + token('34-5678 test@') + token('example.com') + 'data: [DONE]');
    const stream = new ReadableStream<Uint8Array>({ start(c) { for (const byte of bytes) c.enqueue(Uint8Array.of(byte)); c.close(); } });
    const reply = await readPrivateChatReply(stream);
    expect(reply.answer).toBe('답변 [전화번호] [이메일]');
    expect(reply.detected).toEqual(['전화번호', '이메일']);
  });

  it.each([
    token('비공개 중간 답변'),
    token('비공개 중간 답변') + 'data: {"error":"provider raw secret"}\n\ndata: [DONE]\n\n',
    'data: [DONE]\n\n',
    token('답변') + 'data: malformed\n\ndata: [DONE]\n\n',
    token('a'.repeat(12_001)) + 'data: [DONE]\n\n',
  ])('rejects incomplete, failed, empty, malformed, or excessive replies', async text => {
    await expect(readPrivateChatReply(source(text))).rejects.toThrow();
  });

  it('does not publish anything before completion, even when PII spans events', async () => {
    const upstream = controlled();
    const downstream = createPrivateChatStream(upstream.stream).getReader();
    let published = false;
    const first = downstream.read().then(result => { published = true; return result; });
    upstream.send(token('연락 010-12'));
    await Promise.resolve(); await Promise.resolve();
    expect(published).toBe(false);
    upstream.send(token('34-5678 test@example.com') + 'data: [DONE]\n\n');
    upstream.controller.close();
    let text = new TextDecoder().decode((await first).value);
    while (true) { const next = await downstream.read(); if (next.done) break; text += new TextDecoder().decode(next.value); }
    expect(text).toContain('[전화번호] [이메일]');
    expect(text).not.toContain('010-12');
    expect(text).not.toContain('test@example.com');
    expect(text).toContain('pii_warning');
  });

  it('discards partial answer and raw error text at the HTTP boundary', async () => {
    const reply = await new Response(createPrivateChatStream(source(token('010-1234-5678') + 'data: {"error":"test@example.com"}\n\n'))).text();
    expect(reply).toContain('AI_SERVICE_ERROR');
    expect(reply).not.toContain('token');
    expect(reply).not.toContain('010-1234');
    expect(reply).not.toContain('test@example.com');
  });

  it('cancels a pending reader immediately and never returns its buffered answer', async () => {
    const upstream = controlled(); const abort = new AbortController();
    const reply = readPrivateChatReply(upstream.stream, abort.signal);
    upstream.send(token('부분 답변'));
    abort.abort();
    await expect(reply).rejects.toMatchObject({ name: 'AbortError' });
    expect(upstream.cancel).toHaveBeenCalled();
  });

  it.each(['request', 'consumer'])('propagates %s cancellation to the provider stream', async target => {
    const upstream = controlled(); const abort = new AbortController();
    const downstream = createPrivateChatStream(upstream.stream, { signal: abort.signal });
    if (target === 'consumer') await downstream.cancel(); else abort.abort();
    await Promise.resolve(); await Promise.resolve();
    expect(upstream.cancel).toHaveBeenCalled();
    if (target === 'request') expect(await new Response(downstream).text()).toBe('');
  });

  it('unions warnings and drops untrusted warning labels', async () => {
    const upstream = source('data: {"pii_warning":["전화번호","leaked@example.com"]}\n\n' + token('답변 test@example.com') + 'data: [DONE]\n\n');
    const reply = await readPrivateChatReply(createPrivateChatStream(upstream, { detected: ['주민등록번호'] }));
    expect(new Set(reply.detected)).toEqual(new Set(['전화번호','이메일','주민등록번호']));
    expect(JSON.stringify(reply)).not.toContain('leaked@example.com');
  });

  it.each([['ip','shared-rate-limit'],['client','rate-limit']])('preserves %s rate limit classification', async (limitedBy, expected) => {
    let error: unknown;
    try { await readChatReplyResponse(new Response(JSON.stringify({ limitedBy }), { status: 429 })); } catch (caught) { error = caught; }
    expect(getChatErrorType(error)).toBe(expected);
  });
});
