'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { questions, calculateResult } from '@/data/questions';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';

export default function TestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>([]);

  const currentIndex = answers.length;

  const handleSelect = useCallback((choiceIndex: number) => {
    setAnswers(prev => {
      const newAnswers = [...prev, choiceIndex];

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

      return newAnswers;
    });
  }, [router]);

  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div>
      <ProgressBar current={currentIndex + 1} total={questions.length} />
      <QuestionCard
        key={question.id}
        question={question}
        questionIndex={currentIndex}
        onSelect={handleSelect}
      />
    </div>
  );
}
