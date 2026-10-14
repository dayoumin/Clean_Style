import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readJsonBodyWithLimit } from '@/lib/request-body';

function request(body: string, length?: string) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST', body,
    headers: length ? { 'content-length': length } : undefined,
  });
}

describe('bounded JSON body reader', () => {
  it('accepts exact UTF-8 byte limit and rejects one byte less', async () => {
    const body = JSON.stringify({ text: '한글' });
    const size = new TextEncoder().encode(body).byteLength;
    expect((await readJsonBodyWithLimit(request(body), size)).ok).toBe(true);
    const result = await readJsonBodyWithLimit(request(body, '1'), size - 1);
    expect(!result.ok && result.response.status).toBe(413);
  });

  it('stops reading and cancels a chunked body as soon as the limit is exceeded', async () => {
    let reads = 0;
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        reads++;
        controller.enqueue(new Uint8Array(8));
      }, cancel,
    }, { highWaterMark: 0 });
    const req = { headers: new Headers(), body } as NextRequest;
    const result = await readJsonBodyWithLimit(req, 12);
    expect(!result.ok && result.response.status).toBe(413);
    expect(reads).toBe(2);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid JSON rather than a server error', async () => {
    const result = await readJsonBodyWithLimit(request('{broken'), 64);
    expect(!result.ok && result.response.status).toBe(400);
  });

  it('decodes Korean characters across byte chunks', async () => {
    const bytes = new TextEncoder().encode('"가"');
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
        controller.close();
      },
    });
    expect(await readJsonBodyWithLimit({ headers: new Headers(), body } as NextRequest, bytes.length))
      .toEqual({ ok: true, body: '가' });
  });
});
