import Link from 'next/link';
import type { Metadata } from 'next';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { buildRespectCheckUrl, respectEntryLabels } from '@/data/workplaceRespectQuestions';
import EmergencyHelpStrip from './EmergencyHelpStrip';
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
    marker: '01',
    title: respectEntryLabels.action.title,
    description: '내 말이나 지시가 상대에게 부담으로 보일 수 있는지 살펴봅니다.',
    examples: ['업무지시', '회식·휴가', '사적 부탁'],
  },
  {
    entry: 'experience' as const,
    marker: '02',
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
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
        일터 존중·안전 자가점검
      </div>

      <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] px-4 py-3 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
        내부 검토용 초안입니다. 공식 운영 전에는 법·노무, 인권, 정신건강 기준 검토가 필요합니다.
      </div>

      <h1 className="mb-3 text-[1.65rem] font-extrabold leading-[1.25] tracking-tight text-[var(--color-text)]">
        어떤 상황을 점검할까요?
      </h1>
      <p className="mb-7 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        이름, 소속, 연락처는 묻지 않습니다. 실명이나 기관명을 쓰지 말고 상황만 기준으로 확인하세요.
      </p>

      <div className="mb-4">
        <EmergencyHelpStrip />
      </div>

      <div className="space-y-3">
        {entryCards.map((card) => (
          <Link
            key={card.entry}
            href={buildRespectCheckUrl(card.entry)}
            className={`block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 shadow-sm transition-transform hover:border-[var(--color-primary-muted)] active:scale-[0.99] ${focusRing}`}
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

      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4">
        <p className="text-[13px] font-bold text-[var(--color-text)]">잘 모르겠어요</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          아래 문장 중 더 가까운 쪽으로 시작하세요. 목격했거나 도와줘야 하는 상황이면 겪은 일 점검에서 기록과 도움 경로를 먼저 확인합니다.
        </p>
        <div className="mt-3 grid gap-2">
          <Link
            href={buildRespectCheckUrl('action')}
            className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-center text-[12px] font-bold text-[var(--color-text)] hover:border-[var(--color-primary-muted)] ${focusRing}`}
          >
            내가 한 말·지시·요청이 걱정돼요
          </Link>
          <Link
            href={buildRespectCheckUrl('experience')}
            className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2.5 text-center text-[12px] font-bold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
          >
            내가 겪었거나 본 일이 걱정돼요
          </Link>
        </div>
      </div>

      <Link
        href="/"
        className={`mt-6 block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
      >
        청렴 스타일 진단으로 돌아가기
      </Link>
    </div>
  );
}
