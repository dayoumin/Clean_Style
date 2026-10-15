import { NextRequest, NextResponse } from 'next/server';

type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse };

/** 본문 크기를 먼저 확인한 뒤 JSON으로 읽는다. 초과하면 413, 형식이 틀리면 400. */
export async function readJsonBodyWithLimit(request: NextRequest, maxBytes: number): Promise<JsonBodyResult> {
  const tooLarge = () => ({
    ok: false as const,
    response: NextResponse.json({ error: 'Request body too large' }, { status: 413 }),
  });

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return tooLarge();

  // Content-Length가 없거나 부정확해도 읽는 동안 실제 바이트 한도를 적용한다.
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytesRead = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        if (bytesRead > maxBytes) {
          await reader.cancel().catch(() => undefined);
          return tooLarge();
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) };
  }
}
