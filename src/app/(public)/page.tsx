'use client';

import { DiagnosticCard } from '@/components/DiagnosticCard';
import HistoryList from '@/components/HistoryList';
import { LeafLineArt } from '@/components/LeafLineArt';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';

const featureCards = [
  {
    href: '/test',
    emoji: '✨',
    title: '청렴 스타일 진단',
    description: '나의 청렴 성향 파악하기',
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
  const visibleCards = featureCards.filter(card => card.enabled !== false);

  return (
    <div className="animate-fade-in relative -mx-6 -mb-6 -mt-4 flex flex-1 flex-col overflow-hidden bg-[#f8faf5] px-6 pb-6 pt-4 sm:-mx-8 sm:-mb-8 sm:-mt-6 sm:rounded-2xl sm:px-8 sm:pb-8 sm:pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[235px] bg-[linear-gradient(180deg,#edf5e8,rgba(237,245,232,0))]" />
      <LeafLineArt className="pointer-events-none absolute -right-12 top-20 h-56 w-56 text-[#98aa87] opacity-30" />
      <LeafLineArt className="pointer-events-none absolute -left-24 bottom-16 h-60 w-60 rotate-[-18deg] text-[#b5c3a8] opacity-22" />

      <section className="relative z-10 flex flex-1 flex-col justify-center py-6">
        <div className="mb-8 text-center">
          <h1
            id="home-start"
            tabIndex={-1}
            className="text-[16px] font-medium leading-relaxed tracking-normal text-[var(--color-text-secondary)] focus-visible:outline-none"
          >
            잠깐 체크해 볼까요?
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
