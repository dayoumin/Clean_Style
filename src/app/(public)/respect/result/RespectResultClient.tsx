'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AiAdviceSheet from '@/components/AiAdviceSheet';
import { LeafLineArt } from '@/components/LeafLineArt';
import { useRespectChat } from '@/hooks/useRespectChat';
import { scanAndRedactPiiText } from '@/lib/sanitize';
import { AI_CHAT_ENABLED } from '@/data/appVariant';
import {
  calculateRespectResult,
  getRespectQuestions,
  getRespectResultStorageKey,
  RESPECT_RESULT_TTL_MS,
  type RespectEntry,
  type RespectRiskLevel,
  respectAxisLabels,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';
import { decodeRespectResponse, type DecodedRespectResponse } from '@/diagnostics/workplace-respect/response';

function removeStoredResult(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* 저장소 사용 불가 */ }
}

const levelStyle: Record<RespectRiskLevel, { label: string; className: string }> = {
  low: {
    label: '낮음',
    className: 'bg-[var(--color-success-soft)] text-[#047857]',
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
  ],
  experience: [
    { href: 'tel:109', label: '109', subLabel: '자살예방상담', ariaLabel: '109 자살예방상담전화' },
    { href: 'tel:112', label: '112', subLabel: '긴급신고', ariaLabel: '112 긴급신고' },
    { href: 'tel:119', label: '119', subLabel: '구조·응급', ariaLabel: '119 구조·응급' },
  ],
};

type StoredRespectResult = DecodedRespectResponse;

export default function RespectResultClient({ entry }: { entry: RespectEntry }) {
  const router = useRouter();
  const [stored, setStored] = useState<StoredRespectResult | null | undefined>(undefined);
  const [showAiChat, setShowAiChat] = useState(false);
  const { chatInput, setChatInput, chatMessages, streamingAnswer, chatLoading, chatErrorType,
    piiWarning, chatScrollAnchorRef, textareaRef, fetchAiChat, abortAiChat, resetChat } = useRespectChat(entry, stored?.response);
  const storageKey = useMemo(() => getRespectResultStorageKey(entry), [entry]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) {
        setStored(null);
        return;
      }

      const decoded = decodeRespectResponse(JSON.parse(raw), entry);
      if (!decoded) {
        removeStoredResult(storageKey);
        setStored(null);
        return;
      }

      setStored(decoded);
    } catch {
      removeStoredResult(storageKey);
      setStored(null);
    }
  }, [entry, storageKey]);

  useEffect(() => {
    if (!stored) return;
    const expiresAt = stored.response.createdAt + RESPECT_RESULT_TTL_MS;
    const expire = () => {
      if (Date.now() < expiresAt) return;
      resetChat();
      removeStoredResult(storageKey);
      setShowAiChat(false);
      setStored(null);
    };
    const timer = setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    document.addEventListener('visibilitychange', expire);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', expire); };
  }, [stored, storageKey, resetChat]);

  useEffect(() => {
    if (stored === null) {
      router.replace('/');
    }
  }, [router, stored]);

  const questions = useMemo(() => getRespectQuestions(entry), [entry]);
  const result = useMemo(() => {
    if (!stored) return null;
    return calculateRespectResult(entry, stored.answers);
  }, [entry, stored]);
  const clearStoredResult = useCallback(() => {
    removeStoredResult(storageKey);
    setStored(null);
  }, [storageKey]);
  const clearAndGo = useCallback((href: string) => {
    clearStoredResult();
    router.push(href);
  }, [clearStoredResult, router]);
  const openAiChat = useCallback(() => {
    setShowAiChat(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 200);
  }, []);
  if (stored === undefined) {
    return <div className="min-h-[60vh]" />;
  }

  if (!stored || !result) {
    return <div className="min-h-[60vh]" />;
  }

  const entryLabel = respectEntryLabels[entry];
  const level = levelStyle[result.level];
  const isActionResult = entry === 'action';
  const isExperienceCrisis = !isActionResult && result.crisis;
  const isCompactResult = true;
  const levelLabel = level.label;
  const complete = result.answeredCount === questions.length;
  const activeSignals = result.axisSummary.activeAxes
    .map((axis) => respectAxisLabels[axis])
    .slice(0, 4);
  const callLinks = urgentCallLinks[entry].filter((link) => link.href !== 'tel:109' || result.crisisKinds.includes('selfHarm'));
  const urgentCallGridClass = callLinks.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
  const noticeText = isActionResult
    ? '이 결과는 공식 판정이 아니라 행동을 돌아보기 위한 것입니다.'
    : '이 결과는 공식 판정이 아니라 도움 연결을 위한 것입니다.';
  const supportSectionTitle = isActionResult ? '기준 확인' : '도움 연결';
  const resultNoticeText = isActionResult
    ? '이 결과는 공식 판정이 아니라 행동을 돌아보기 위한 것입니다.'
    : '이 결과는 공식 판정이 아니라 상황 정리를 돕기 위한 것입니다.';
  const resultContainerClassName = isCompactResult
    ? 'animate-fade-in -mx-6 -mb-6 -mt-4 flex flex-1 flex-col justify-evenly gap-2 overflow-hidden px-6 pb-5 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:px-6 sm:pb-6 sm:pt-5'
    : 'animate-fade-in';
  const heroClassName = isCompactResult
    ? 'result-gradient rounded-[var(--radius-lg)] px-5 py-5 text-white shadow-md'
    : 'result-gradient -mx-6 -mt-4 mb-5 px-6 py-8 text-white sm:-mx-6 sm:-mt-6 sm:px-6';
  const resultStackClassName = 'contents';
  const bodyCardClassName = isCompactResult
    ? 'rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5'
    : 'result-card';
  const sectionTitleClassName = isCompactResult
    ? 'mb-1.5 text-[14px] font-bold text-[var(--color-text)]'
    : 'mb-3 text-[15px] font-bold text-[var(--color-text)]';
  const listClassName = isCompactResult ? 'space-y-1.5' : 'space-y-2';
  const actionItemClassName = isCompactResult
    ? 'flex gap-2 text-[13px] leading-relaxed text-[var(--color-text)]'
    : 'flex gap-2 text-[14px] leading-relaxed text-[var(--color-text)]';
  const supportItemClassName = isCompactResult
    ? 'flex gap-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]'
    : 'flex gap-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]';
  const crisisCardClassName = isCompactResult
    ? heroClassName
    : 'result-card relative overflow-hidden border-[#fecdd3] bg-[#fff1f2]';
  const crisisTitleClassName = isCompactResult
    ? 'mb-3 text-[1.45rem] font-extrabold leading-tight tracking-tight text-white'
    : 'mb-3 text-[1.55rem] font-extrabold leading-tight tracking-tight text-[var(--color-text)]';
  const crisisLabelClassName = isCompactResult
    ? 'mb-2 text-[12px] font-bold uppercase tracking-wide text-white/70'
    : 'mb-2 text-[12px] font-bold uppercase tracking-wide text-[#be123c]';
  const crisisSummaryClassName = isCompactResult
    ? 'text-[14px] leading-relaxed text-white/75'
    : 'text-[14px] leading-relaxed text-[var(--color-text-secondary)]';
  const crisisNoticeClassName = isCompactResult
    ? 'mt-3 rounded-[var(--radius-md)] bg-white/10 px-3 py-2 text-[12px] leading-relaxed text-white/75'
    : 'mt-3 rounded-[var(--radius-md)] bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-[#be123c]';
  // AI가 꺼진 배포에서는 'AI 조언' 버튼을 숨기고 '처음으로' 한 칸만 둔다.
  const buttonGridCols = AI_CHAT_ENABLED ? 'grid-cols-2' : 'grid-cols-1';
  const buttonGroupClassName = isCompactResult ? `grid ${buttonGridCols} gap-2` : `mt-5 grid ${buttonGridCols} gap-2`;
  const aiQuestionPlaceholder = isExperienceCrisis
    ? '도움을 요청할 문장이나 지금 할 일을 짧게 물어보세요'
    : '결과를 바탕으로 더 궁금한 점을 질문하세요';
  const aiChatSheet = showAiChat ? (
    <AiAdviceSheet
      loading={chatLoading}
      messages={chatMessages}
      currentUserMessage={chatLoading ? scanAndRedactPiiText(chatInput.trim()).redacted : ''}
      streamingAnswer={streamingAnswer}
      inputValue={chatInput}
      onInputChange={setChatInput}
      onSubmit={fetchAiChat}
      onAbort={abortAiChat}
      onClose={() => {
        if (!chatLoading) {
          setShowAiChat(false);
        }
      }}
      onDeleteConversation={() => {
        resetChat();
        setTimeout(() => textareaRef.current?.focus(), 100);
      }}
      inputRef={textareaRef}
      scrollAnchorRef={chatScrollAnchorRef}
      placeholder={aiQuestionPlaceholder}
      errorType={chatErrorType}
      piiWarning={piiWarning}
    />
  ) : null;

  if (result.crisis) {
    return (
      <>
      <div className={resultContainerClassName}>
        <section className={`relative overflow-hidden ${crisisCardClassName}`}>
          <LeafLineArt
            className={`pointer-events-none absolute -right-14 top-2 h-44 w-44 ${
              isCompactResult ? 'text-white opacity-[0.10]' : 'text-[#fecdd3] opacity-[0.35]'
            }`}
          />
          <div className="relative z-10">
            <p className={crisisLabelClassName}>
              {entryLabel.title}
            </p>
            <h1 className={crisisTitleClassName}>
              {result.title}
            </h1>
            <p className={crisisSummaryClassName}>
              {result.summary}
            </p>
            <p className={crisisNoticeClassName}>
              {noticeText}
            </p>
            {callLinks.length > 0 && (
              <div className={`mt-4 grid gap-2 ${urgentCallGridClass}`}>
                {callLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-label={link.ariaLabel}
                    className={`rounded-[var(--radius-md)] bg-white/15 px-2 py-3 text-center text-[13px] font-bold leading-tight text-white hover:bg-white/20 ${dangerFocusRing}`}
                  >
                    {link.label}<br /><span className="text-[10px] font-medium">{link.subLabel}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={bodyCardClassName}>
          <h2 className={sectionTitleClassName}>바로 할 일</h2>
          <ul className={listClassName}>
            {result.primaryActions.map((action) => (
              <li key={action} className={actionItemClassName}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-accent)]" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={bodyCardClassName}>
          <h2 className={sectionTitleClassName}>{supportSectionTitle}</h2>
          <ul className={listClassName}>
            {result.supportActions.map((action) => (
              <li key={action} className={supportItemClassName}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className={buttonGroupClassName}>
          <button
            type="button"
            onClick={() => clearAndGo('/')}
            className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
          >
            처음으로
          </button>
          {AI_CHAT_ENABLED && (
            <button
              type="button"
              onClick={openAiChat}
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-3 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              AI 조언
            </button>
          )}
        </div>
      </div>
      {aiChatSheet}
      </>
    );
  }

  return (
    <>
    <div className={resultContainerClassName}>
      <div className={heroClassName}>
        <LeafLineArt className="pointer-events-none absolute -right-12 top-2 h-44 w-44 text-white opacity-[0.10]" />
        <LeafLineArt className="pointer-events-none absolute -left-16 bottom-[-56px] h-48 w-48 rotate-[-18deg] text-white opacity-[0.08]" />
        <p className="relative mb-2 text-[12px] font-bold uppercase tracking-wide text-white/70">
          {entryLabel.title}
        </p>
        <h1 className={`relative mb-3 font-extrabold leading-tight tracking-tight ${isActionResult ? 'text-[1.55rem]' : 'text-[1.7rem]'}`}>
          {result.title}
        </h1>
        <div className="relative flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${level.className}`}>
            {levelLabel}
          </span>
          <span className="text-[12px] text-white/70">
            {Math.min(result.answeredCount, questions.length)} / {questions.length}문항
            {!complete && ' 응답 기준'}
          </span>
        </div>
      </div>

      <div className={resultStackClassName}>
      {!isCompactResult && (
        <section className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
          <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
            {resultNoticeText}
          </p>
        </section>
      )}

      {entry === 'experience' && result.support && !result.crisis && (
        <section className={`${bodyCardClassName} border-[#facc15] bg-[var(--color-warning-soft)]`}>
          <h2 className={sectionTitleClassName}>지금 상태를 먼저 살피세요</h2>
          <p className={`${isCompactResult ? 'text-[13px]' : 'text-[14px]'} leading-relaxed text-[var(--color-text-secondary)]`}>
            스스로를 해칠 생각이 스친 적이 있다면 점수와 별개로 혼자 두지 않는 것이 중요합니다. 가까운 사람에게 현재 상태를 알리고, 필요하면 109 자살예방상담전화나 정신건강복지센터에 연결하세요.
          </p>
        </section>
      )}

      <section className={bodyCardClassName}>
        <h2 className={sectionTitleClassName}>상황 요약</h2>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {result.summary}
        </p>
        {!isCompactResult && !isActionResult && activeSignals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
              >
                {signal}
              </span>
            ))}
          </div>
        )}
        {isCompactResult && (
          <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {resultNoticeText}
          </p>
        )}
      </section>

      <section className={bodyCardClassName}>
        <h2 className={sectionTitleClassName}>지금 할 일</h2>
        <ul className={listClassName}>
          {result.primaryActions.map((action) => (
            <li key={action} className={actionItemClassName}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-accent)]" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={bodyCardClassName}>
        <h2 className={sectionTitleClassName}>{supportSectionTitle}</h2>
        <ul className={listClassName}>
          {result.supportActions.map((action) => (
            <li key={action} className={supportItemClassName}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
        {entry === 'experience' && result.support && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a
              href="tel:109"
              aria-label="109 자살예방상담전화"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              109<br /><span className="text-[10px] font-medium">자살예방상담</span>
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

      <div className={buttonGroupClassName}>
        <button
          type="button"
          onClick={() => clearAndGo('/')}
          className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
        >
          처음으로
        </button>
        {AI_CHAT_ENABLED && (
          <button
            type="button"
            onClick={openAiChat}
            className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            AI 조언
          </button>
        )}
      </div>
      </div>
    </div>
    {aiChatSheet}
    </>
  );
}
