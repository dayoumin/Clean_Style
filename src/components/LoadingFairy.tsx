'use client';

import { useState, useEffect } from 'react';
import { FluentEmoji } from '@/components/FluentEmoji';

export function LoadingFairy({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="animate-bounce-soft mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)]">
        <FluentEmoji emoji="✨" size={32} />
      </div>
      <p className="mb-3 text-base font-semibold text-[var(--color-text)]">
        {message}
      </p>
      <div className="flex gap-1.5">
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
      </div>
      {children}
    </div>
  );
}

export function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ['응답을 분석하고 있어요...', '성향을 파악하고 있어요...', '결과를 정리하고 있어요...'];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 1600);
    const t3 = setTimeout(onDone, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <LoadingFairy message={steps[step]}>
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary-accent)] transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
    </LoadingFairy>
  );
}
