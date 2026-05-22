'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/ProgressBar';
import {
  buildRespectResultUrl,
  getRespectQuestions,
  getRespectResultStorageKey,
  RESPECT_QUESTION_VERSION,
  type RespectEntry,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';

const categoryEmoji: Record<string, string> = {
  관계: '🤝',
  업무범위: '📋',
  존중: '💬',
  사적요구: '🧾',
  불이익: '⚖️',
  반복: '🔁',
  기록: '🗂️',
  안전: '🛟',
};

const choiceLabels = ['A', 'B', 'C', 'D'];
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';

export default function RespectCheckClient({ entry }: { entry: RespectEntry }) {
  const router = useRouter();
  const questions = getRespectQuestions(entry);
  const [answers, setAnswers] = useState<number[]>([]);
  const currentQuestion = questions[answers.length];
  const label = respectEntryLabels[entry];

  useEffect(() => {
    sessionStorage.removeItem(getRespectResultStorageKey(entry));
  }, [entry]);

  const handleSelect = useCallback((choiceIndex: number) => {
    const nextAnswers = [...answers, choiceIndex];
    if (nextAnswers.length >= questions.length) {
      sessionStorage.setItem(
        getRespectResultStorageKey(entry),
        JSON.stringify({ entry, answers: nextAnswers, createdAt: Date.now(), version: RESPECT_QUESTION_VERSION }),
      );
      router.push(buildRespectResultUrl(entry));
      return;
    }
    setAnswers(nextAnswers);
  }, [answers, entry, questions.length, router]);

  const handleBack = () => setAnswers((prev) => prev.slice(0, -1));
  const handleQuit = () => router.push('/respect');

  if (!currentQuestion) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary-accent)]">
            일터 존중 점검
          </p>
          <h1 className="text-[17px] font-bold text-[var(--color-text)]">{label.title}</h1>
        </div>
        <div className="flex gap-1.5">
          {answers.length > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className={`rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] ${focusRing}`}
            >
              ← 이전
            </button>
          )}
          <button
            type="button"
            onClick={handleQuit}
            className={`rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] ${focusRing}`}
          >
            중단
          </button>
        </div>
      </div>

      <ProgressBar current={answers.length + 1} total={questions.length} ariaLabel="자가점검 진행률" />

      <div className="animate-fade-in">
        <div className="mb-3.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide text-[var(--color-primary-accent)]">
          <span aria-hidden="true">{categoryEmoji[currentQuestion.category]}</span>
          <span>{currentQuestion.category}</span>
        </div>

        <div className="mb-3 text-5xl font-extrabold leading-none tracking-tighter text-[var(--color-primary-muted)]">
          {String(answers.length + 1).padStart(2, '0')}
        </div>

        <h2 className="mb-8 text-[18px] font-semibold leading-[1.65] tracking-tight text-[var(--color-text)]">
          {currentQuestion.prompt}
        </h2>

        <div className="space-y-2">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={choice.text}
              type="button"
              onClick={() => handleSelect(index)}
              className={`choice-button relative w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-[18px] pr-5 pl-[48px] text-left text-[15px] leading-relaxed text-[var(--color-text)] shadow-sm ${focusRing}`}
            >
              <span className="absolute left-[18px] top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[12px] font-bold text-[var(--color-text-muted)]">
                {choiceLabels[index]}
              </span>
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
