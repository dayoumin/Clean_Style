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
import type { SixAxisScores } from '@/data/questions';

interface StyleRadarChartProps {
  sixAxis: SixAxisScores;
}

interface ChartDataItem {
  axis: string;
  label: string;
  score: number;
}

const chartConfig: ChartConfig = {
  score: {
    label: '성향 점수',
    color: 'var(--color-primary-accent)',
  },
};

// 대각선에 반대 성향이 오도록 배치: 원칙↔유연, 투명↔신중, 독립↔협력
const AXES: { key: keyof SixAxisScores; label: string }[] = [
  { key: 'principle', label: '원칙' },
  { key: 'transparent', label: '투명' },
  { key: 'independent', label: '독립' },
  { key: 'flexible', label: '유연' },
  { key: 'cautious', label: '신중' },
  { key: 'cooperative', label: '협력' },
];

const DISPLAY_MAX = 5;

function getTextAnchor(index: number, total: number): 'start' | 'middle' | 'end' {
  const angle = (index / total) * 360;
  if (angle === 0 || angle === 180) return 'middle';
  return angle < 180 ? 'start' : 'end';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTooltip(_value: any, _name: any, item: any) {
  const { label, score } = item.payload as ChartDataItem;
  return (
    <span>
      {label}: {score} / {DISPLAY_MAX}
    </span>
  );
}

export default function StyleRadarChart({ sixAxis }: StyleRadarChartProps) {
  const id = useId();
  const gradientId = `radarGradient-${id}`;
  const strokeId = `radarStroke-${id}`;

  const data: ChartDataItem[] = AXES.map(({ key, label }) => ({
    axis: label,
    label,
    score: Math.min(sixAxis[key], DISPLAY_MAX),
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto max-h-[240px] w-full"
    >
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
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
          gridType="polygon"
          stroke="var(--color-text-muted)"
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, DISPLAY_MAX]}
          tickCount={6}
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
                  {item.score}점
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
