'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { questions, calculateResult, styleTypes } from '@/data/questions';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';

export default function TestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>([]);
  const [userContext, setUserContext] = useState('');
  const testDone = answers.length >= questions.length;

  const handleSelect = useCallback((choiceIndex: number) => {
    setAnswers(prev => [...prev, choiceIndex]);
  }, []);

  const navigateToResult = (context?: string) => {
    if (!testResult) return;
    const params = new URLSearchParams({
      style: testResult.styleKey,
      p: String(testResult.scores.principle),
      t: String(testResult.scores.transparency),
      i: String(testResult.scores.independence),
      a: answers.join(','),
    });
    if (context?.trim()) {
      sessionStorage.setItem('userContext', context.trim());
    } else {
      sessionStorage.removeItem('userContext');
    }
    router.push(`/result?${params.toString()}`);
  };

  // 중간 입력 화면: 테스트 완료 후 결과 이동 전
  const testResult = testDone ? calculateResult(answers) : null;

  if (testDone && testResult) {
    const style = styleTypes[testResult.styleKey];

    return (
      <div className="animate-fade-in flex flex-col items-center pt-8">
        {/* 스타일 미리보기 */}
        <div className="mb-2 text-[48px]">{style?.emoji}</div>
        <h2 className="mb-1 text-[22px] font-extrabold tracking-tight text-[var(--color-text)]">
          {style?.name}
        </h2>
        <p className="mb-8 text-[14px] text-[var(--color-text-secondary)]">
          {style?.subtitle}
        </p>

        {/* 추가 입력 안내 */}
        <div className="mb-6 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h3 className="mb-1.5 text-[15px] font-bold text-[var(--color-text)]">
            더 정확한 조언을 원하시나요?
          </h3>
          <p className="mb-4 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            업무 상황이나 고민을 알려주시면 AI가 맞춤 분석을 해드려요.
            <br />
            건너뛰어도 괜찮아요!
          </p>
          <textarea
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            maxLength={500}
            placeholder="예: 연구비 정산 시 애매한 항목 처리가 고민이에요"
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:outline-none"
            rows={3}
          />
          <p className="mt-1.5 text-right text-[11px] text-[var(--color-text-muted)]">
            {userContext.length}/500
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex w-full gap-2.5">
          <button
            onClick={() => navigateToResult()}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-4 text-center text-[15px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-card)]"
          >
            건너뛰기
          </button>
          <button
            onClick={() => navigateToResult(userContext)}
            disabled={!userContext.trim()}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-4 text-center text-[15px] font-semibold text-white hover:bg-[#2a2a4e] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            맞춤 분석 받기
          </button>
        </div>
      </div>
    );
  }

  const question = questions[answers.length];
  if (!question) return null;

  return (
    <div>
      <ProgressBar current={answers.length + 1} total={questions.length} />
      <QuestionCard
        key={question.id}
        question={question}
        questionIndex={answers.length}
        onSelect={handleSelect}
      />
    </div>
  );
}
