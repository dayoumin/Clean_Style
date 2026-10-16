'use client';

import { useId } from 'react';

export default function AdultInstitutionBrand() {
  const id = useId();
  const lettering = {
    x: 3,
    y: 31,
    textLength: 100,
    lengthAdjust: 'spacingAndGlyphs' as const,
    className: 'adult-institution-name',
  };

  return (
    <svg className="adult-institution-brand" viewBox="0 0 106 59" width={84} height={46.8} role="img" aria-label="NIFS 생명공학과">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#315771" />
          <stop offset=".45" stopColor="#20455f" />
          <stop offset="1" stopColor="#12334c" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6c7d2" stopOpacity=".85" />
          <stop offset=".32" stopColor="#7895aa" stopOpacity=".55" />
          <stop offset=".65" stopColor="#34566f" stopOpacity=".2" />
          <stop offset="1" stopColor="#0d293e" stopOpacity=".6" />
        </linearGradient>
      </defs>
      <text {...lettering} fill={`url(#${id}-metal)`} stroke={`url(#${id}-edge)`} strokeWidth={0.7} strokeLinejoin="round" paintOrder="stroke">NIFS</text>
      <text className="adult-institution-department" x={3} y={54}>생명공학과</text>
    </svg>
  );
}
