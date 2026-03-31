'use client';

import { useState } from 'react';
import Link from 'next/link';
import HistoryList from '@/components/HistoryList';

function ChipIcon({ type, className }: { type: 'clipboard' | 'target' | 'sparkles'; className?: string }) {
  if (type === 'clipboard') return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="17" rx="2.5" stroke="#4361ee" strokeWidth="1.6" fill="#eef1ff"/>
      <rect x="8.5" y="2" width="7" height="3.5" rx="1.5" fill="#4361ee"/>
      <line x1="8.5" y1="10.5" x2="15.5" y2="10.5" stroke="#4361ee" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="8.5" y1="13.8" x2="13.5" y2="13.8" stroke="#4361ee" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="8.5" y1="17.1" x2="14.5" y2="17.1" stroke="#4361ee" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'target') return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke="#4361ee" strokeWidth="1.5" fill="#eef1ff"/>
      <circle cx="12" cy="12" r="6" stroke="#4361ee" strokeWidth="1.5" fill="white"/>
      <circle cx="12" cy="12" r="2.5" fill="#4361ee"/>
    </svg>
  );
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* large star - center left */}
      <path d="M10 5L11.2 9.2L15 10L11.2 10.8L10 15L8.8 10.8L5 10L8.8 9.2Z" fill="#4361ee" fillOpacity="0.2" stroke="#4361ee" strokeWidth="1.2" strokeLinejoin="round"/>
      {/* medium star - upper right */}
      <path d="M18 3L18.8 5.8L21 6L18.8 6.2L18 9L17.2 6.2L15 6L17.2 5.8Z" fill="#4361ee" fillOpacity="0.35" stroke="#4361ee" strokeWidth="1" strokeLinejoin="round"/>
      {/* small star - lower right */}
      <path d="M16 16L16.6 18L18.5 18L16.6 18L16 20L15.4 18L13.5 18L15.4 18Z" fill="#4361ee" stroke="#4361ee" strokeWidth="0.9" strokeLinejoin="round"/>
    </svg>
  );
}

const chipIconTypes = ['clipboard', 'target', 'sparkles'] as const;

const infoChips = [
  { title: '15개 상황', desc: '약 3분', detail: '업무 중 겪을 수 있는 15가지 상황에 대해 답해보는 테스트입니다.' },
  { title: '오답 없음', desc: '다 맞는 답', detail: '정답·오답이 없는 테스트입니다. 생각대로 편하게 선택하세요.' },
  { title: 'AI 분석', desc: '맞춤 팁', detail: 'AI가 응답 패턴을 분석해 나만의 청렴 스타일과 실천 팁을 알려드립니다.' },
];

export default function HomePage() {
  const [openChip, setOpenChip] = useState<number | null>(null);

  return (
    <div className="animate-fade-in flex flex-col items-center pt-[6vh]">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
        ✨ 3분 자기발견 테스트
      </div>

      <h1 className="mb-10 text-center text-[1.75rem] font-extrabold leading-[1.25] tracking-tight text-[var(--color-text)]">
        나의 청렴 스타일은?
      </h1>

      <div className="mb-6 flex w-full gap-2">
        {infoChips.map((chip, i) => (
          <button
            key={chip.title}
            type="button"
            onClick={() => setOpenChip(i)}
            className="flex flex-1 flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-3.5 text-center shadow-sm active:scale-95 transition-transform"
          >
            <span
              className="animate-bounce-soft mb-1.5 inline-block"
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              <ChipIcon type={chipIconTypes[i]} />
            </span>
            <p className="text-[12px] font-bold tracking-tight text-[var(--color-text)]">{chip.title}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{chip.desc}</p>
          </button>
        ))}
      </div>

      {openChip !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpenChip(null)}
        >
          <div
            className="mx-6 w-full max-w-xs rounded-2xl bg-[var(--color-card)] px-6 py-7 text-center shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mb-3 inline-block">
              <ChipIcon type={chipIconTypes[openChip]} className="w-10 h-10" />
            </span>
            <h2 className="mb-1 text-[16px] font-bold text-[var(--color-text)]">{infoChips[openChip].title}</h2>
            <p className="mb-4 text-[12px] text-[var(--color-text-muted)]">{infoChips[openChip].desc}</p>
            <p className="mb-5 text-[13px] leading-relaxed text-[var(--color-text)]">
              {infoChips[openChip].detail}
            </p>
            <button
              type="button"
              onClick={() => setOpenChip(null)}
              className="rounded-full bg-[var(--color-primary-soft)] px-6 py-2 text-[13px] font-semibold text-[var(--color-primary-accent)] transition-colors active:bg-[var(--color-primary-accent)] active:text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <Link
        href="/test"
        className="cta-gradient mt-[4vh] w-full rounded-[var(--radius-md)] py-[15px] text-center text-[15px] font-bold tracking-tight text-white mb-[2vh]"
      >
        테스트 시작하기 →
      </Link>

      <HistoryList />

    </div>
  );
}
