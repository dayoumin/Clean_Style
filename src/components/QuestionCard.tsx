'use client';

import type { Question } from '@/data/questions';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  onSelect: (choiceIndex: number) => void;
}

const categoryInfo: Record<string, { label: string; emoji: string }> = {
  research: { label: '연구·데이터', emoji: '🔬' },
  admin: { label: '행정·계약', emoji: '📑' },
  relation: { label: '관계·소통', emoji: '🤝' },
};

const choiceLabels = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, questionIndex, onSelect }: QuestionCardProps) {
  const cat = categoryInfo[question.category];

  return (
    <div className="animate-fade-in">
      {/* 카테고리 */}
      <div className="mb-3.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide text-[var(--color-primary-accent)]">
        <span>{cat?.emoji}</span>
        <span>{cat?.label}</span>
      </div>

      {/* 문항 번호 */}
      <div className="mb-3 text-5xl font-extrabold leading-none tracking-tighter text-[var(--color-border)]">
        {String(questionIndex + 1).padStart(2, '0')}
      </div>

      {/* 상황 설명 */}
      <h2 className="mb-8 text-[18px] font-semibold leading-[1.65] tracking-tight text-[var(--color-text)]">
        {question.situation}
      </h2>

      {/* 선택지 */}
      <div className="space-y-2">
        {question.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className="choice-button relative w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-[18px] pr-5 pl-[48px] text-left text-[15px] leading-relaxed text-[var(--color-text)]"
          >
            <span className="absolute left-[18px] top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[12px] font-bold text-[var(--color-text-muted)]">
              {choiceLabels[index]}
            </span>
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
