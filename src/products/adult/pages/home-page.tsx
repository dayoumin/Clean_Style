'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DiagnosticCard } from '@/components/DiagnosticCard';
import { FluentEmoji } from '@/components/FluentEmoji';
import HistoryList from '@/components/HistoryList';
import { LeafLineArt } from '@/components/LeafLineArt';
import { APP_COPY } from '@/data/appVariant';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';

const infoChips = [
  { emoji: '📋', title: '15개 상황', desc: '약 3분', detail: '업무 중 겪을 수 있는 15가지 상황에 대해 답해보는 테스트입니다.' },
  { emoji: '🎯', title: '오답 없음', desc: '다 맞는 답', detail: '정답·오답이 없는 테스트입니다. 생각대로 편하게 선택하세요.' },
  { emoji: '✨', title: 'AI 분석', desc: '맞춤 팁', detail: 'AI가 응답 패턴을 분석해 나만의 청렴 스타일과 실천 팁을 알려드립니다.' },
];

const featureCards = [
  {
    href: '/test',
    emoji: '✨',
    title: APP_COPY.primaryDiagnosticTitle,
    description: APP_COPY.primaryDiagnosticDescription,
    iconClassName: 'bg-[#fff8e7]',
  },
  {
    href: '/respect/check?entry=action',
    emoji: '🤝',
    title: '내 행동 점검',
    description: '일상 속 올바른 실천 확인',
    iconClassName: 'bg-[#eaf5ff]',
    enabled: RESPECT_FEATURE_ENABLED,
  },
  {
    href: '/respect/check?entry=experience',
    emoji: '📑',
    title: '일터 존중 점검',
    description: '상호 존중하는 문화 만들기',
    iconClassName: 'bg-[#f3f4f7]',
    enabled: RESPECT_FEATURE_ENABLED,
  },
];

export default function HomePage() {
  if (!RESPECT_FEATURE_ENABLED) {
    return <CleanStyleHomePage />;
  }

  return <VariantHomePage />;
}

function CleanStyleHomePage() {
  const [openChip, setOpenChip] = useState<number | null>(null);

  return (
    <div className="animate-fade-in flex min-h-[80vh] flex-col items-center justify-center">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
        <FluentEmoji emoji="✨" size={16} /> 3분 자기발견 테스트
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
            className="flex flex-1 flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-3.5 text-center shadow-sm transition-transform active:scale-95"
          >
            <span
              className="animate-bounce-soft mb-1.5 inline-block"
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              <FluentEmoji emoji={chip.emoji} size={28} />
            </span>
            <p className="text-[12px] font-bold tracking-tight text-[var(--color-text)]">{chip.title}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{chip.desc}</p>
          </button>
        ))}
      </div>

      {openChip !== null && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpenChip(null)}
        >
          <div
            className="mx-6 w-full max-w-xs animate-scale-in rounded-2xl bg-[var(--color-card)] px-6 py-7 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mb-3 inline-block"><FluentEmoji emoji={infoChips[openChip].emoji} size={48} /></span>
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
        className="cta-gradient mb-[2vh] mt-[4vh] w-full rounded-[var(--radius-md)] py-[15px] text-center text-[15px] font-bold tracking-tight text-white"
      >
        테스트 시작하기 →
      </Link>

      <HistoryList />
    </div>
  );
}

function VariantHomePage() {
  const visibleCards = featureCards.filter(card => card.enabled !== false);

  return (
    <div className="animate-fade-in relative -mx-6 -mb-6 -mt-4 flex flex-1 flex-col overflow-hidden bg-[#f6f9ff] px-6 pb-6 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:rounded-2xl sm:px-6 sm:pb-8 sm:pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[235px] bg-[linear-gradient(180deg,#eaf2ff,rgba(234,242,255,0))]" />
      <LeafLineArt className="pointer-events-none absolute -left-16 top-9 h-44 w-44 rotate-[22deg] text-[#c5d4ea] opacity-[0.20]" />
      <LeafLineArt className="pointer-events-none absolute -right-12 top-20 h-56 w-56 text-[#9eb7d8] opacity-[0.30]" />
      <LeafLineArt className="pointer-events-none absolute -left-24 bottom-16 h-60 w-60 rotate-[-18deg] text-[#cbd8ea] opacity-[0.24]" />

      <section className="relative z-10 flex flex-1 flex-col justify-center py-6">
        <div className="mb-8 text-center">
          <h1
            id="home-start"
            tabIndex={-1}
            className="text-[16px] font-medium leading-relaxed tracking-normal text-[var(--color-text-secondary)] focus-visible:outline-none"
          >
            {APP_COPY.homePrompt}
          </h1>
        </div>

        <div className="grid gap-4">
          {visibleCards.map(card => (
            <DiagnosticCard
              key={card.href}
              href={card.href}
              emoji={card.emoji}
              title={card.title}
              description={card.description}
              iconClassName={card.iconClassName}
            />
          ))}
        </div>
      </section>

      <div className="relative z-10">
        <HistoryList buttonLabel="청렴 결과 보기" emptyFocusTargetId="home-start" />
      </div>
    </div>
  );
}
