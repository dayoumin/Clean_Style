'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from 'recharts';
import { questions } from '@/data/questions';
import { cn } from '@/lib/utils';

interface DashboardData {
  summary: {
    total: number;
    todayCount: number;
    avgDurationSec: number | null;
    device: { mobile: number; desktop: number; tablet: number };
  };
  styleDistribution: { style_key: string; style_name: string; count: number }[];
  dailyTrend: { day: string; count: number }[];
  avgSixAxis: Record<string, number>;
  questionChoices: number[][];
  referrers: { referrer: string; count: number }[];
  durationBuckets: { bucket: string; count: number }[];
}

const TOOLTIP_STYLE = {
  background: 'white',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
} as const;

const STYLE_COLORS: Record<string, string> = {
  'principle-transparent-independent': '#4361ee',
  'principle-transparent-cooperative': '#3b82f6',
  'principle-cautious-independent': '#06d6a0',
  'principle-cautious-cooperative': '#059669',
  'flexible-transparent-independent': '#f4a261',
  'flexible-transparent-cooperative': '#e07b3a',
  'flexible-cautious-independent': '#9b59b6',
  'flexible-cautious-cooperative': '#8e44ad',
};

const CHOICE_COLORS = ['#4361ee', '#06d6a0', '#f4a261', '#e63946'];
const DEVICE_COLORS: Record<string, string> = { mobile: '#4361ee', desktop: '#06d6a0', tablet: '#f4a261' };
const DEVICE_LABELS: Record<string, string> = { mobile: '모바일', desktop: '데스크탑', tablet: '태블릿' };

const CATEGORY_COLOR: Record<string, string> = {
  research: '#4361ee',
  admin: '#f4a261',
  relation: '#06d6a0',
};

const SIX_AXIS_LABELS: Record<string, string> = {
  principle: '원칙',
  flexible: '유연',
  transparent: '투명',
  cautious: '신중',
  independent: '독립',
  cooperative: '협력',
};

function categoryTick(props: unknown) {
  const { x, y, payload } = props as { x: number; y: number; payload: { value: string; index: number } };
  const q = questions[payload.index];
  const color = q ? CATEGORY_COLOR[q.category] ?? 'var(--color-text-muted)' : 'var(--color-text-muted)';
  return (
    <text x={x} y={Number(y) + 12} textAnchor="middle" fontSize={11} fill={color} fontWeight={600}>
      {payload.value}
    </text>
  );
}

function pieLabel(props: unknown) {
  const { name, percent } = props as { name?: string; percent: number };
  return `${name ?? ''} ${(percent * 100).toFixed(0)}%`;
}

function formatDuration(sec: number | null): string {
  if (sec == null) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5', className)} role="region" aria-label={title}>
      <h2 className="mb-4 text-sm font-bold text-[var(--color-text)]">{title}</h2>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    setError(false);
    setData(null);
    fetch('/api/admin/dashboard')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(fetchData, [fetchData]);

  const deviceData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.summary.device)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ name: DEVICE_LABELS[key] ?? key, value, fill: DEVICE_COLORS[key] ?? '#999' }));
  }, [data]);

  const radarData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.avgSixAxis).map(([key, value]) => ({
      axis: SIX_AXIS_LABELS[key] ?? key,
      value,
    }));
  }, [data]);

  const perQuestionData = useMemo(() => {
    if (!data) return [];
    return questions.map((q, qi) => ({
      name: `Q${q.id}`,
      category: q.category,
      choice0: data.questionChoices[qi]?.[0] ?? 0,
      choice1: data.questionChoices[qi]?.[1] ?? 0,
      choice2: data.questionChoices[qi]?.[2] ?? 0,
      choice3: data.questionChoices[qi]?.[3] ?? 0,
    }));
  }, [data]);

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-[var(--color-text)]">데이터를 불러올 수 없습니다</p>
        <button
          onClick={fetchData}
          className="rounded-lg bg-[var(--color-primary-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-[var(--color-text-muted)]">불러오는 중...</div>
      </div>
    );
  }

  if (data.summary.total === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold text-[var(--color-text)]">아직 응답 데이터가 없습니다</p>
        <p className="text-sm text-[var(--color-text-muted)]">테스트 참여가 쌓이면 이곳에 통계가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="font-[Pretendard,-apple-system,sans-serif]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[var(--color-text)]">대시보드</h1>
        <Link
          href="/admin/questions"
          className="text-sm font-semibold text-[var(--color-primary-accent)] hover:underline"
        >
          문항 관리 →
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="총 응답 수" value={data.summary.total.toLocaleString()} />
        <StatCard label="오늘 참여" value={data.summary.todayCount} />
        <StatCard label="평균 소요 시간" value={formatDuration(data.summary.avgDurationSec)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="스타일 유형 분포">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.styleDistribution} layout="vertical" margin={{ left: 80, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
              <YAxis
                type="category"
                dataKey="style_name"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                width={75}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey="count" name="응답 수" radius={[0, 4, 4, 0]}>
                {data.styleDistribution.map((entry) => (
                  <Cell key={entry.style_key} fill={STYLE_COLORS[entry.style_key] ?? '#999'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="일별 참여 추이 (최근 30일)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.dailyTrend} margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickFormatter={(v: string) => v.slice(5)} // MM-DD
              />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(v) => String(v)}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="참여 수"
                stroke="var(--color-primary-accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-primary-accent)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="전체 평균 6축 성향">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--color-text-muted)" strokeOpacity={0.3} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)', fontWeight: 600 }}
              />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
              <Radar
                dataKey="value"
                name="평균 점수"
                stroke="var(--color-primary-accent)"
                fill="var(--color-primary-accent)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="소요 시간 분포">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.durationBuckets} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey="count" name="응답 수" fill="var(--color-primary-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="문항별 선택 분포" className="mb-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perQuestionData} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={categoryTick}
              />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey="choice0" name="선택 A" stackId="a" fill={CHOICE_COLORS[0]} />
              <Bar dataKey="choice1" name="선택 B" stackId="a" fill={CHOICE_COLORS[1]} />
              <Bar dataKey="choice2" name="선택 C" stackId="a" fill={CHOICE_COLORS[2]} />
              <Bar dataKey="choice3" name="선택 D" stackId="a" fill={CHOICE_COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
            {Object.entries(CATEGORY_COLOR).map(([key, color]) => (
              <span key={key}>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                {key === 'research' ? '연구·데이터' : key === 'admin' ? '행정·계약' : '관계·소통'}
              </span>
            ))}
          </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="기기 분포">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={deviceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                strokeWidth={2}
                stroke="var(--color-card)"
                label={pieLabel}
              >
                {deviceData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="유입 경로 (Top 10)">
          {data.referrers.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">유입 경로 데이터 없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">경로</th>
                    <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">방문</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrers.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="max-w-[240px] truncate py-2 pr-4 text-[var(--color-text-secondary)]">{r.referrer}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-[var(--color-text)]">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
