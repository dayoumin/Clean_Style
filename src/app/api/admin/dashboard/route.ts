import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';
import { questions } from '@/data/questions';

function checkAdminAuth(request: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return { ok: false, status: 500, message: 'ADMIN_SECRET not configured' };
  const token = request.cookies.get('admin_token')?.value;
  if (token !== secret) return { ok: false, status: 401, message: 'Unauthorized' };
  return { ok: true };
}

export async function HEAD(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (!auth.ok) return new NextResponse(null, { status: auth.status });
  return new NextResponse(null, { status: 200 });
}

export async function GET(request: NextRequest) {
  const auth = checkAdminAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { env } = await getCloudflareContext();
    const db = (env as { DB: D1Database }).DB;

    const [summaryRes, styleRes, trendRes, sixAxisRes, answersRes, referrerRes, durationRes] =
      await db.batch([
        db.prepare(`
          SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN DATE(created_at, '+9 hours') = DATE('now', '+9 hours') THEN 1 END) AS today_count,
            AVG(duration_sec) AS avg_duration,
            COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) AS mobile,
            COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) AS desktop,
            COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) AS tablet
          FROM test_results
        `),
        db.prepare(`
          SELECT style_key, style_name, COUNT(*) AS count
          FROM test_results GROUP BY style_key ORDER BY count DESC
        `),
        db.prepare(`
          SELECT DATE(created_at, '+9 hours') AS day, COUNT(*) AS count
          FROM test_results
          WHERE DATE(created_at, '+9 hours') >= DATE('now', '+9 hours', '-29 days')
          GROUP BY day ORDER BY day ASC
        `),
        db.prepare(`
          SELECT
            AVG(six_principle) AS principle, AVG(six_flexible) AS flexible,
            AVG(six_transparent) AS transparent, AVG(six_cautious) AS cautious,
            AVG(six_independent) AS independent, AVG(six_cooperative) AS cooperative
          FROM test_results
        `),
        db.prepare(`
          SELECT CAST(json_each.key AS INTEGER) AS qi, json_each.value AS choice, COUNT(*) AS cnt
          FROM test_results, json_each(answers)
          WHERE json_typeof(answers) = 'array'
            AND json_each.value BETWEEN 0 AND 3
            AND CAST(json_each.key AS INTEGER) < ?
          GROUP BY qi, choice
        `).bind(questions.length),
        db.prepare(`
          SELECT referrer, COUNT(*) AS count
          FROM test_results WHERE referrer IS NOT NULL
          GROUP BY referrer ORDER BY count DESC LIMIT 10
        `),
        db.prepare(`
          SELECT
            CASE
              WHEN duration_sec < 60  THEN '1분 미만'
              WHEN duration_sec < 120 THEN '1~2분'
              WHEN duration_sec < 180 THEN '2~3분'
              WHEN duration_sec < 300 THEN '3~5분'
              ELSE '5분 이상'
            END AS bucket,
            COUNT(*) AS count
          FROM test_results WHERE duration_sec IS NOT NULL
          GROUP BY bucket
          ORDER BY MIN(duration_sec) ASC
        `),
      ]);

    const questionChoices: number[][] = Array.from({ length: questions.length }, () => [0, 0, 0, 0]);
    for (const row of answersRes.results as { qi: number; choice: number; cnt: number }[]) {
      if (row.qi < questions.length && row.choice >= 0 && row.choice <= 3) {
        questionChoices[row.qi][row.choice] = row.cnt;
      }
    }

    const s = summaryRes.results[0] as Record<string, number | null>;
    const avg = sixAxisRes.results[0] as Record<string, number | null>;

    const body = {
      summary: {
        total: s.total ?? 0,
        todayCount: s.today_count ?? 0,
        avgDurationSec: s.avg_duration ? Math.round(s.avg_duration as number) : null,
        device: {
          mobile: s.mobile ?? 0,
          desktop: s.desktop ?? 0,
          tablet: s.tablet ?? 0,
        },
      },
      styleDistribution: styleRes.results,
      dailyTrend: trendRes.results,
      avgSixAxis: {
        principle: round2(avg.principle),
        flexible: round2(avg.flexible),
        transparent: round2(avg.transparent),
        cautious: round2(avg.cautious),
        independent: round2(avg.independent),
        cooperative: round2(avg.cooperative),
      },
      questionChoices,
      referrers: referrerRes.results,
      durationBuckets: durationRes.results,
    };

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    console.error('Dashboard query failed:', err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}

function round2(v: number | null | undefined): number {
  return v != null ? Math.round(v * 100) / 100 : 0;
}
