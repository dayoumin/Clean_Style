import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { questions, calculateResult, computeSixAxisScores } from '@/data/questions';
import { detectDeviceType, normalizeReferrer } from '@/lib/device';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { D1Database } from '@cloudflare/workers-types';

// 결과 저장은 테스트 완료 시 1회만 호출되므로 넉넉하게 설정
const RESULTS_LIMIT = 5;
const RESULTS_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip, RESULTS_LIMIT, RESULTS_WINDOW_MS);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } },
    );
  }

  try {
    const body = await request.json();
    const { answers, durationSec, referrer } = body;

    if (
      !Array.isArray(answers) ||
      answers.length !== questions.length ||
      !answers.every((a: unknown) => Number.isInteger(a) && (a as number) >= 0 && (a as number) <= 3)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = calculateResult(answers);
    const sixAxis = computeSixAxisScores(answers);

    const ua = request.headers.get('user-agent') ?? '';
    const deviceType = detectDeviceType(ua);
    const duration = typeof durationSec === 'number' && durationSec > 0 ? Math.round(durationSec) : null;
    const ref = typeof referrer === 'string' ? normalizeReferrer(referrer) : null;

    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;

    await db
      .prepare(
        `INSERT INTO test_results
         (style_key, style_name, score_principle, score_transparency, score_independence,
          six_principle, six_flexible, six_transparent, six_cautious, six_independent, six_cooperative,
          answers, duration_sec, device_type, borderline, referrer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        result.styleKey,
        result.style.name,
        result.scores.principle,
        result.scores.transparency,
        result.scores.independence,
        sixAxis.principle,
        sixAxis.flexible,
        sixAxis.transparent,
        sixAxis.cautious,
        sixAxis.independent,
        sixAxis.cooperative,
        JSON.stringify(answers),
        duration,
        deviceType,
        JSON.stringify(result.borderline),
        ref,
      )
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to save result:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
