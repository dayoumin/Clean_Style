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

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) return tooLarge();

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) };
  }
}
