'use client';

import { useEffect, useId, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import {
  studentPerspectiveAxes,
  type StudentPerspectiveAxisKey,
} from '@/diagnostics/student-integrity';

interface StudentPerspectiveMapProps {
  axisCounts: Record<StudentPerspectiveAxisKey, number>;
}

interface PerspectiveMapItem {
  axis: string;
  key: StudentPerspectiveAxisKey;
  value: number;
}

function textAnchor(index: number): 'start' | 'middle' | 'end' {
  if (index === 0 || index === 3) return 'middle';
  return index < 3 ? 'start' : 'end';
}

export default function StudentPerspectiveMap({ axisCounts }: StudentPerspectiveMapProps) {
  const id = useId().replace(/:/g, '');
  const [reduceMotion, setReduceMotion] = useState(true);
  const data: PerspectiveMapItem[] = studentPerspectiveAxes.map(({ key, label }) => ({
    axis: label,
    key,
    value: axisCounts[key],
  }));
  const visibleAxes = data.filter(({ value }) => value > 0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <div>
      <div
        className="h-[250px] w-full sm:h-[286px]"
        role="img"
        aria-label="이번 활동에서 함께 살펴본 여섯 관점 지도"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="64%">
            <defs>
              <linearGradient id={`student-map-${id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f8f94" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#2f8a55" stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <PolarGrid
              gridType="polygon"
              stroke="#a9bbb7"
              strokeOpacity={0.52}
            />
            <PolarRadiusAxis
              domain={[0, 3]}
              tick={false}
              axisLine={false}
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={({ x, y, index }) => {
                const item = data[index as number];
                if (!item) return <text />;
                const anchor = textAnchor(index as number);
                const offsetX = anchor === 'start' ? 7 : anchor === 'end' ? -7 : 0;
                const offsetY = index === 0 ? -7 : index === 3 ? 11 : 4;
                return (
                  <text
                    x={Number(x) + offsetX}
                    y={Number(y) + offsetY}
                    textAnchor={anchor}
                    dominantBaseline="central"
                    fill="#263b36"
                    className="text-[11px] font-bold sm:text-[12px]"
                  >
                    {item.axis}
                  </text>
                );
              }}
            />
            <Radar
              dataKey="value"
              fill={`url(#student-map-${id})`}
              fillOpacity={1}
              stroke="#0f8f94"
              strokeWidth={2.5}
              dot={{
                r: 3.5,
                fill: '#ffffff',
                stroke: '#0f8f94',
                strokeWidth: 2,
              }}
              isAnimationActive={!reduceMotion}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="sr-only">
        {visibleAxes.length > 0 ? (
          <>
            <p>이번 활동에서 함께 살펴본 관점:</p>
            <ul>
              {visibleAxes.map(({ key, axis }) => <li key={key}>{axis}</li>)}
            </ul>
          </>
        ) : (
          <p>이번에는 관점 지도를 비워 두었습니다. 다른 관점 질문을 살펴볼 수 있습니다.</p>
        )}
      </div>
    </div>
  );
}
