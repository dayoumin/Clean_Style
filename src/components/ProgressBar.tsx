'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-tight text-[var(--color-text)]">
          {current}
          <span className="font-normal text-[var(--color-text-muted)]"> / {total}</span>
        </span>
        <span className="text-[12px] text-[var(--color-text-muted)]">{percentage}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-sm bg-[var(--color-border)]">
        <div
          className="progress-fill h-full rounded-sm bg-[var(--color-primary)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
