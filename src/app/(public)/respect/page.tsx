import Link from 'next/link';
import type { Metadata } from 'next';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { buildRespectCheckUrl, respectEntryLabels } from '@/data/workplaceRespectQuestions';
import RespectUnavailable from './RespectUnavailable';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const entryCards = [
  {
    entry: 'action' as const,
    marker: '나',
    title: respectEntryLabels.action.title,
    description: '내 말이나 지시가 상대에게 부담으로 보일 수 있는지 살펴봅니다.',
    examples: ['업무지시', '회식·휴가', '사적 부탁'],
  },
  {
    entry: 'experience' as const,
    marker: '일',
    title: respectEntryLabels.experience.title,
    description: '내가 겪은 일이 부당한지, 기록이나 상담이 필요한지 살펴봅니다.',
    examples: ['모욕·압박', '업무 배제', '불이익 우려'],
  },
];

export default function RespectStartPage() {
  if (!RESPECT_FEATURE_ENABLED) {
    return <RespectUnavailable />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
          일터 존중 점검
        </div>
        <details className="group relative shrink-0">
          <summary
            aria-label="점검 안내 보기"
            className={`flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[13px] font-extrabold text-[var(--color-text-muted)] shadow-sm marker:hidden [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            ?
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-72 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-[12px] leading-relaxed text-[var(--color-text-secondary)] shadow-lg">
            <p>
              이름, 소속, 연락처는 묻지 않습니다. 실명이나 기관명보다 상황을 기준으로 답하세요.
            </p>
            <div className="mt-3 rounded-[var(--radius-md)] border border-[#fecdd3] bg-[#fff1f2] p-3">
              <p className="font-bold text-[#be123c]">
                지금 안전하지 않다면 문항보다 도움 요청이 먼저입니다.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <a
                  href="tel:109"
                  aria-label="109 자살예방상담전화"
                  className="rounded-[var(--radius-md)] bg-white px-2 py-2 text-center text-[11px] font-bold text-[#be123c]"
                >
                  109
                </a>
                <a
                  href="tel:112"
                  aria-label="112 긴급신고"
                  className="rounded-[var(--radius-md)] bg-white px-2 py-2 text-center text-[11px] font-bold text-[#be123c]"
                >
                  112
                </a>
                <a
                  href="tel:119"
                  aria-label="119 구조·응급"
                  className="rounded-[var(--radius-md)] bg-white px-2 py-2 text-center text-[11px] font-bold text-[#be123c]"
                >
                  119
                </a>
              </div>
            </div>
          </div>
        </details>
      </div>

      <h1 className="mb-2 text-[1.65rem] font-extrabold leading-[1.25] tracking-tight text-[var(--color-text)]">
        어떤 상황인가요?
      </h1>
      <p className="mb-5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        가까운 쪽을 선택하면 10문항으로 기준과 도움 경로를 확인합니다.
      </p>

      <div className="space-y-3">
        {entryCards.map((card) => (
          <Link
            key={card.entry}
            href={buildRespectCheckUrl(card.entry)}
            className={`block min-h-[154px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 shadow-sm transition-transform hover:border-[var(--color-primary-muted)] active:scale-[0.99] ${focusRing}`}
          >
            <div className="mb-3 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg)]">
                <span className="text-[13px] font-extrabold text-[var(--color-primary-accent)]">
                  {card.marker}
                </span>
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold tracking-tight text-[var(--color-text)]">
                  {card.title}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {card.description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.examples.map((example) => (
                <span
                  key={example}
                  className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
                >
                  {example}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className={`mt-6 block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
      >
        홈으로
      </Link>
    </div>
  );
}
