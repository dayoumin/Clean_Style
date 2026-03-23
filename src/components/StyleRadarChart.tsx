'use client';

import { useId } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface StyleRadarChartProps {
  scores: {
    principle: number;
    transparency: number;
    independence: number;
  };
}

interface ChartDataItem {
  axis: string;
  label: string;
  score: number;
  raw: number;
  positive: string;
  negative: string;
}

const chartConfig: ChartConfig = {
  score: {
    label: '성향 점수',
    color: 'var(--color-primary-accent)',
  },
};

const AXES = [
  { key: 'principle' as const, axis: '원칙 ↔ 유연', positive: '원칙', negative: '유연' },
  { key: 'transparency' as const, axis: '투명 ↔ 신중', positive: '투명', negative: '신중' },
  { key: 'independence' as const, axis: '독립 ↔ 협력', positive: '독립', negative: '협력' },
] as const;

function normalizeScore(value: number, maxAbsolute: number = 15): number {
  const clamped = Math.max(-maxAbsolute, Math.min(maxAbsolute, value));
  // 0~100 범위, 최소 25% 보장하여 레이더 형태가 항상 보이게
  const raw = ((clamped + maxAbsolute) / (2 * maxAbsolute)) * 100;
  return Math.round(25 + (raw * 0.75));
}

function getTextAnchor(index: number, total: number): 'start' | 'middle' | 'end' {
  const angle = (index / total) * 360;
  if (angle === 0 || angle === 180) return 'middle';
  return angle < 180 ? 'start' : 'end';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTooltip(_value: any, _name: any, item: any) {
  const { raw, positive, negative } = item.payload as ChartDataItem;
  return (
    <span>
      {raw >= 0 ? positive : negative}: {raw > 0 ? '+' : ''}{raw}
    </span>
  );
}

export default function StyleRadarChart({ scores }: StyleRadarChartProps) {
  const id = useId();
  const gradientId = `radarGradient-${id}`;
  const strokeId = `radarStroke-${id}`;

  const data: ChartDataItem[] = AXES.map(({ key, axis, positive, negative }) => ({
    axis,
    label: scores[key] >= 0 ? positive : negative,
    score: normalizeScore(scores[key]),
    raw: scores[key],
    positive,
    negative,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto max-h-[260px] w-full"
    >
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-primary-accent)" stopOpacity={0.7} />
            <stop offset="100%" stopColor="var(--color-primary-accent)" stopOpacity={0.15} />
          </radialGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary-accent)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
        </defs>

        <PolarGrid
          gridType="circle"
          stroke="var(--color-text-muted)"
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <PolarAngleAxis
          dataKey="axis"
          tick={({ x, y, index }) => {
            const item = data[index as number];
            if (!item) return <text />;
            const numX = Number(x);
            const numY = Number(y);
            const anchor = getTextAnchor(index as number, data.length);
            const offsetX = anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0;
            const offsetY = index === 0 ? -6 : 6;
            return (
              <g>
                <text
                  x={numX + offsetX}
                  y={numY + offsetY}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  className="text-[13px] font-bold"
                  fill="var(--color-text)"
                >
                  {item.label}
                </text>
                <text
                  x={numX + offsetX}
                  y={numY + offsetY + 16}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  className="text-[10px]"
                  fill="var(--color-text-muted)"
                >
                  {Math.abs(item.raw)}점
                </text>
              </g>
            );
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={formatTooltip}
            />
          }
        />
        <Radar
          dataKey="score"
          fill={`url(#${gradientId})`}
          stroke={`url(#${strokeId})`}
          strokeWidth={3}
          dot={{
            r: 5,
            fill: 'white',
            stroke: 'var(--color-primary-accent)',
            strokeWidth: 3,
            fillOpacity: 1,
          }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </RadarChart>
    </ChartContainer>
  );
}
