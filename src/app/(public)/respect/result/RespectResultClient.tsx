'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  calculateRespectResult,
  getRespectQuestions,
  getRespectResultStorageKey,
  RESPECT_QUESTION_VERSION,
  RESPECT_RESULT_TTL_MS,
  type RespectEntry,
  type RespectRiskLevel,
  respectAxisLabels,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';

const levelStyle: Record<RespectRiskLevel, { label: string; className: string }> = {
  low: {
    label: '낮음',
    className: 'bg-[var(--color-success-soft)] text-[#059669]',
  },
  caution: {
    label: '주의',
    className: 'bg-[var(--color-warning-soft)] text-[#c87f2a]',
  },
  high: {
    label: '높음',
    className: 'bg-[var(--color-warning-soft)] text-[#b45309]',
  },
  urgent: {
    label: '즉시 도움 필요',
    className: 'bg-[#fff1f2] text-[#be123c]',
  },
};

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';
const dangerFocusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c] focus-visible:ring-offset-2';

const urgentCallLinks: Record<RespectEntry, Array<{ href: string; label: string; subLabel: string; ariaLabel: string }>> = {
  action: [
    { href: 'tel:112', label: '112', subLabel: '긴급신고', ariaLabel: '112 긴급신고' },
    { href: 'tel:119', label: '119', subLabel: '구조·응급', ariaLabel: '119 구조·응급' },
    { href: 'tel:109', label: '109', subLabel: '상담', ariaLabel: '109 자살예방상담전화' },
  ],
  experience: [
    { href: 'tel:109', label: '109', subLabel: '상담', ariaLabel: '109 자살예방상담전화' },
    { href: 'tel:112', label: '112', subLabel: '긴급신고', ariaLabel: '112 긴급신고' },
    { href: 'tel:119', label: '119', subLabel: '구조·응급', ariaLabel: '119 구조·응급' },
  ],
};

interface StoredRespectResult {
  entry: RespectEntry;
  answers: number[];
  createdAt: number;
  version: string;
}

export default function RespectResultClient({ entry }: { entry: RespectEntry }) {
  const router = useRouter();
  const [stored, setStored] = useState<StoredRespectResult | null | undefined>(undefined);
  const storageKey = useMemo(() => getRespectResultStorageKey(entry), [entry]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) {
        setStored(null);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StoredRespectResult>;
      if (parsed.entry !== entry || !Array.isArray(parsed.answers)) {
        sessionStorage.removeItem(storageKey);
        setStored(null);
        return;
      }

      const createdAt = typeof parsed.createdAt === 'number' ? parsed.createdAt : 0;
      const expired = !createdAt || Date.now() - createdAt > RESPECT_RESULT_TTL_MS;
      const questions = getRespectQuestions(entry);
      const answers = parsed.answers;
      const complete = answers.length === questions.length;
      const validAnswers = answers.every((answer, index) => (
        Number.isInteger(answer)
        && answer >= 0
        && answer < (questions[index]?.choices.length ?? 0)
      ));
      const versionMatches = parsed.version === RESPECT_QUESTION_VERSION;

      if (expired || !complete || !validAnswers || !versionMatches) {
        sessionStorage.removeItem(storageKey);
        setStored(null);
        return;
      }

      setStored({
        entry,
        answers,
        createdAt,
        version: RESPECT_QUESTION_VERSION,
      });
    } catch {
      sessionStorage.removeItem(storageKey);
      setStored(null);
    }
  }, [entry, storageKey]);

  const questions = useMemo(() => getRespectQuestions(entry), [entry]);
  const result = useMemo(() => {
    if (!stored) return null;
    return calculateRespectResult(entry, stored.answers);
  }, [entry, stored]);
  const clearStoredResult = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setStored(null);
  }, [storageKey]);
  const clearAndGo = useCallback((href: string) => {
    clearStoredResult();
    router.push(href);
  }, [clearStoredResult, router]);

  if (stored === undefined) {
    return <div className="min-h-[60vh]" />;
  }

  if (!stored || !result) {
    return <MissingResult />;
  }

  const entryLabel = respectEntryLabels[entry];
  const level = levelStyle[result.level];
  const complete = stored.answers.length >= questions.length;
  const activeSignals = result.axisSummary.activeAxes
    .map((axis) => respectAxisLabels[axis])
    .slice(0, 4);
  const callLinks = urgentCallLinks[entry];

  if (result.crisis) {
    return (
      <div className="animate-fade-in">
        <section className="result-card border-[#fecdd3] bg-[#fff1f2]">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#be123c]">
            {entryLabel.title}
          </p>
          <h1 className="mb-3 text-[1.55rem] font-extrabold leading-tight tracking-tight text-[var(--color-text)]">
            지금은 도움 연결이 먼저입니다
          </h1>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            {result.summary}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {callLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel}
                className={`rounded-[var(--radius-md)] bg-[#be123c] px-2 py-3 text-center text-[13px] font-bold leading-tight text-white hover:bg-[#9f1239] ${dangerFocusRing}`}
              >
                {link.label}<br /><span className="text-[10px] font-medium">{link.subLabel}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="result-card">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">바로 할 일</h2>
          <ul className="space-y-2">
            {result.primaryActions.map((action) => (
              <li key={action} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text)]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#be123c]" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="result-card">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">결과 관리</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            민감한 응답은 이 브라우저 탭에만 잠시 남습니다. 공용 기기라면 결과를 지워주세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => clearAndGo('/respect')}
              className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
            >
              지우고 다시 점검
            </button>
            <button
              type="button"
              onClick={() => clearAndGo('/')}
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-3 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              지우고 나가기
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="result-gradient -mx-6 -mt-4 mb-5 px-6 py-8 text-white sm:-mx-8 sm:-mt-6 sm:px-8">
        <p className="relative mb-2 text-[12px] font-bold uppercase tracking-wide text-white/70">
          {entryLabel.title}
        </p>
        <h1 className="relative mb-3 text-[1.7rem] font-extrabold leading-tight tracking-tight">
          {result.title}
        </h1>
        <div className="relative flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${level.className}`}>
            {level.label}
          </span>
          <span className="text-[12px] text-white/70">
            {Math.min(result.answeredCount, questions.length)} / {questions.length}문항
            {!complete && ' 응답 기준'}
          </span>
        </div>
      </div>

      {result.support && !result.crisis && (
        <section className="result-card border-[#facc15] bg-[var(--color-warning-soft)]">
          <h2 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">도움 연결을 함께 확인하세요</h2>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            스스로를 해칠 생각이 스친 적이 있다면 점수와 별개로 혼자 두지 않는 것이 중요합니다. 가까운 사람에게 현재 상태를 알리고, 필요하면 109 자살예방상담전화나 정신건강복지센터에 연결하세요.
          </p>
        </section>
      )}

      <section className="result-card">
        <h2 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">상황 요약</h2>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {result.summary}
        </p>
      </section>

      {activeSignals.length > 0 && (
        <section className="result-card">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">확인된 신호</h2>
          <div className="flex flex-wrap gap-1.5">
            {activeSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
              >
                {signal}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="result-card">
        <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">지금 할 일</h2>
        <ul className="space-y-2">
          {result.primaryActions.map((action) => (
            <li key={action} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text)]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-accent)]" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="result-card">
        <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">도움 연결</h2>
        <ul className="space-y-2">
          {result.supportActions.map((action) => (
            <li key={action} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
        {(result.level === 'urgent' || result.support) && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a
              href="tel:109"
              aria-label="109 자살예방상담전화"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              109<br /><span className="text-[10px] font-medium">상담</span>
            </a>
            <a
              href="tel:112"
              aria-label="112 긴급신고"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              112<br /><span className="text-[10px] font-medium">긴급신고</span>
            </a>
            <a
              href="tel:119"
              aria-label="119 구조·응급"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              119<br /><span className="text-[10px] font-medium">구조·응급</span>
            </a>
          </div>
        )}
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => clearAndGo('/respect')}
          className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
        >
          다시 점검
        </button>
        <button
          type="button"
          onClick={clearStoredResult}
          className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
        >
          결과 지우기
        </button>
      </div>
      <button
        type="button"
        onClick={() => clearAndGo('/')}
        className={`mt-3 w-full rounded-[var(--radius-md)] py-2 text-center text-[13px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] ${focusRing}`}
      >
          처음으로
      </button>
    </div>
  );
}

function MissingResult() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-[16px] font-bold text-[var(--color-text)]">저장된 점검 결과가 없어요</p>
      <p className="mb-6 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        민감한 응답이 주소에 남지 않도록 결과는 이 브라우저 탭 안에서만 불러옵니다. 점검을 다시 진행해주세요.
      </p>
      <Link
        href="/respect"
        className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
      >
        점검 시작하기
      </Link>
    </div>
  );
}
