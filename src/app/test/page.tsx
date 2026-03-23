'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { questions, calculateResult } from '@/data/questions';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';

export default function TestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>([]);
  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 100000));

  const handleSelect = useCallback((choiceIndex: number) => {
    const newAnswers = [...answers, choiceIndex];
    setAnswers(newAnswers);

    // 마지막 문항이면 바로 결과 페이지로 이동
    if (newAnswers.length >= questions.length) {
      const result = calculateResult(newAnswers);
      const params = new URLSearchParams({
        style: result.styleKey,
        p: String(result.scores.principle),
        t: String(result.scores.transparency),
        i: String(result.scores.independence),
        a: newAnswers.join(','),
      });
      router.push(`/result?${params.toString()}`);
    }
  }, [answers, router]);

  const handleBack = () => setAnswers(prev => prev.slice(0, -1));

  const question = questions[answers.length];
  if (!question) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <h1 className="text-[17px] font-bold text-[var(--color-text)]">나의 청렴 스타일은?</h1>
        {answers.length > 0 ? (
          <button
            onClick={handleBack}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            ← 이전
          </button>
        ) : (
          <span className="text-[12px] text-[var(--color-text-muted)]">{questions.length}문항</span>
        )}
      </div>
      <ProgressBar current={answers.length + 1} total={questions.length} />
      <QuestionCard
        key={question.id}
        question={question}
        questionIndex={answers.length}
        shuffleSeed={shuffleSeed}
        onSelect={handleSelect}
      />
    </div>
  );
}
