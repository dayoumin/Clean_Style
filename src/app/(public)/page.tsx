'use client';

import Link from 'next/link';
import HistoryList from '@/components/HistoryList';
import { FluentEmoji } from '@/components/FluentEmoji';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';

const featureCards = [
  {
    href: '/test',
    emoji: '✨',
    label: '청렴',
    title: '청렴 스타일 진단',
    description: '업무 상황에서 내가 중요하게 보는 기준과 실천 방식을 확인합니다.',
    tags: ['15개 상황', '약 3분', 'AI 조언'],
  },
  {
    href: '/respect',
    emoji: '🧭',
    label: '존중',
    title: '일터 존중 점검',
    description: '내 행동이나 내가 겪은 일을 기준으로 기록과 도움 경로를 확인합니다.',
    tags: ['2개 경로', '10문항', '도움 경로'],
    enabled: RESPECT_FEATURE_ENABLED,
  },
];

export default function HomePage() {
  const visibleCards = featureCards.filter(card => card.enabled !== false);

  return (
    <div className="animate-fade-in flex min-h-[80vh] flex-col justify-center">
      <div className="mb-7 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
          셀프 점검
        </div>

        <h1 className="text-[1.75rem] font-extrabold leading-[1.25] tracking-tight text-[var(--color-text)]">
          무엇을 확인할까요?
        </h1>
        <p className="mx-auto mt-3 max-w-[20rem] text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          업무 중 마주한 상황을 기준으로 필요한 점검을 선택하세요.
        </p>
      </div>

      <div className="grid gap-3">
        {visibleCards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="flex min-h-[178px] flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 text-left shadow-sm transition-transform hover:border-[var(--color-primary-muted)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2"
          >
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)]">
                  <FluentEmoji emoji={card.emoji} size={28} />
                </span>
                <span className="rounded-full bg-[var(--color-bg)] px-3 py-1 text-[11px] font-extrabold text-[var(--color-primary-accent)]">
                  {card.label}
                </span>
              </div>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[var(--color-text)]">
                {card.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {card.description}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <span className="text-[12px] font-extrabold text-[var(--color-primary-accent)]">
                  시작 →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <HistoryList />

    </div>
  );
}
