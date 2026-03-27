import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { styleTypes, questions, computeSixAxisScores } from '@/data/questions';
import type { D1Database } from '@cloudflare/workers-types';

function detectDeviceType(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function computeBorderline(scores: { principle: number; transparency: number; independence: number }): string[] {
  const result: string[] = [];
  if (scores.principle === 0) result.push('principle');
  if (scores.transparency === 0) result.push('transparency');
  if (scores.independence === 0) result.push('independence');
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { styleKey, scores, answers, durationSec, referrer } = body;

    if (
      typeof styleKey !== 'string' ||
      !styleTypes[styleKey] ||
      !scores ||
      typeof scores.principle !== 'number' ||
      typeof scores.transparency !== 'number' ||
      typeof scores.independence !== 'number' ||
      !Array.isArray(answers) ||
      answers.length !== questions.length
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const style = styleTypes[styleKey]!;
    const six = computeSixAxisScores(answers);

    const ua = request.headers.get('user-agent') ?? '';
    const deviceType = detectDeviceType(ua);
    const borderline = computeBorderline(scores);
    const duration = typeof durationSec === 'number' && durationSec > 0 ? Math.round(durationSec) : null;
    const ref = typeof referrer === 'string' ? referrer.slice(0, 200) : null;

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
        styleKey,
        style.name,
        scores.principle,
        scores.transparency,
        scores.independence,
        six.principle,
        six.flexible,
        six.transparent,
        six.cautious,
        six.independent,
        six.cooperative,
        JSON.stringify(answers),
        duration,
        deviceType,
        JSON.stringify(borderline),
        ref,
      )
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to save result:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
