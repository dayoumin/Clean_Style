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
  getRespectResultStorageKey,
  RESPECT_RESULT_TTL_MS,
  RESPECT_RESULT_NOTICE,
  RESPECT_STORAGE_NOTICE,
  RESPECT_EXPERIENCE_SOURCE_NOTICE,
  type RespectEntry,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';
import { decodeRespectResponse, type DecodedRespectResponse } from '@/diagnostics/workplace-respect/response';
import { getRespectHelpCalls, respectHelpCalls as CALLS } from '@/diagnostics/workplace-respect/help';
import EmergencyHelpStrip from '../EmergencyHelpStrip';

function removeStoredResult(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* 저장소 사용 불가 */ }
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';
const dangerFocusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c] focus-visible:ring-offset-2';
interface CallLink {
  href: string;
  number: string;
  label: string;
  sheetPrompt: string;
}

const quietButton = `min-h-[48px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`;
const softPrimaryButton = `min-h-[48px] rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] bg-[var(--color-bg)] px-2 text-center text-[14px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] ${focusRing}`;
const strongButton = `min-h-[48px] rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] ${focusRing}`;

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
  const notices = [result.safetyNotice, result.supportNotice].filter((notice) => notice !== null);
  // Safety or self-harm answers turn the screen into a help-first layout: one call leads, workplace detail folds away.
  const helpFirst = notices.length > 0;
  const crisisCalls = getRespectHelpCalls(result);
  const helpCalls: CallLink[] = getRespectHelpCalls(result);
  const [primaryCall, ...secondaryCalls] = helpCalls;
  const sheetCall = result.crisis
    ? (result.crisisKinds.includes('selfHarm') ? CALLS.rescue : CALLS.police)
    : helpFirst ? primaryCall : null;
  const workplaceSummary = result.summary;
  const supportLines = result.supportNotice ? [] : result.supportActions;
  const buttonGridCols = AI_CHAT_ENABLED ? 'grid-cols-2' : 'grid-cols-1';
  const containerClassName = 'animate-fade-in -mx-6 -mb-6 -mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-5 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:px-6 sm:pb-6 sm:pt-5';
  const heroClassName = 'relative shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] px-5 py-5';
  const cardClassName = 'shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3.5';
  const bodyTextClassName = 'text-[14px] leading-relaxed text-[var(--color-text-secondary)]';
  const aiQuestionPlaceholder = result.crisis && entry === 'experience'
    ? '도움을 요청할 문장이나 지금 할 일을 짧게 물어보세요'
    : '결과를 바탕으로 더 궁금한 점을 질문하세요';

  const heroArt = (
    <LeafLineArt className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 text-[var(--color-primary-muted)]" />
  );
  const actionList = (items: string[]) => (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text)]">
          <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
  const footerButtons = (
    <div className="mt-auto shrink-0 space-y-3 pt-1">
    <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">{RESPECT_RESULT_NOTICE}</p>
    {AI_CHAT_ENABLED && <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">AI 질문을 보내면 응답·질문·최근 대화가 외부 AI 제공사로 전송됩니다. 개인을 알아볼 정보는 적지 마세요.</p>}
    <details className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
      <summary className={`cursor-pointer rounded py-2 ${focusRing}`}>응답 저장·AI 전송 안내</summary>
      <p className="mt-1">{RESPECT_STORAGE_NOTICE}</p>
      <p className="mt-1">이 점검의 응답만으로 기관에 자동 신고하지 않습니다. 상담·신고 절차와 비밀보장 범위는 이용할 창구에 확인하세요.</p>
    </details>
    <div className={`grid ${buttonGridCols} gap-2`}>
      <button type="button" onClick={() => clearAndGo('/')} className={quietButton}>
        처음으로
      </button>
      {AI_CHAT_ENABLED && (
        <button type="button" onClick={openAiChat} className={helpFirst || result.crisis ? softPrimaryButton : strongButton}>
          AI 조언
        </button>
      )}
    </div>
    </div>
  );
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
      helpAction={sheetCall ? {
        href: sheetCall.href,
        label: `${sheetCall.number} 전화`,
        ariaLabel: `${sheetCall.number} 전화, ${sheetCall.label}`,
        description: sheetCall.sheetPrompt,
      } : null}
    />
  ) : null;

  if (result.crisis) {
    return (
      <>
      <div className={containerClassName}>
        <header className={heroClassName}>
          {heroArt}
          <h1 className="relative text-[1.5rem] font-extrabold leading-snug tracking-tight text-[var(--color-text)] [word-break:keep-all]">
            {result.title}
          </h1>
          <p className="relative mt-1 text-[13px] text-[var(--color-text-secondary)]">{entryLabel.title}</p>
          <p className={`relative mt-3 ${bodyTextClassName}`}>{result.summary}</p>
          <div className={`relative mt-4 grid gap-2 ${crisisCalls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {crisisCalls.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-label={`${link.number} ${link.label} 전화`}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-[var(--radius-md)] bg-[#be123c] px-2 text-white hover:bg-[#9f1239] ${dangerFocusRing}`}
              >
                <span className="text-[17px] font-bold leading-tight">{link.number}</span>
                <span className="text-[12px] font-medium leading-tight">{link.label}</span>
              </a>
            ))}
          </div>
        </header>

        <section className={cardClassName}>
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">바로 할 일</h2>
          {actionList(result.primaryActions)}
          {result.supportActions.length > 0 && (
            <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {result.supportActions.join(' ')}
            </p>
          )}
        </section>

        {footerButtons}
      </div>
      {aiChatSheet}
      </>
    );
  }

  const workplaceContent = (
    <>
      <p className="text-[14px] font-semibold text-[var(--color-text)]">{result.scoreLabel}: {result.score === null ? '전체 합계 미산출' : `${result.score}점 / ${result.maxScore}점 범위`}</p>
      <p className="mt-1 mb-3 text-[13px] text-[var(--color-text-secondary)]">유효 응답 {result.scoredAnsweredCount} / {result.scoredTotal}개</p>
      {result.sourceBandText && <p className="mb-3 text-[14px] leading-relaxed text-[var(--color-text)]">2019년 원표 기준 구간: {result.sourceBandText}</p>}
      {workplaceSummary && <p className={`${bodyTextClassName} mb-3`}>{workplaceSummary}</p>}
      {result.reportedItems.length > 0 && <details className="mb-4 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        <summary className={`min-h-[44px] cursor-pointer rounded py-2 ${focusRing}`}>답변한 {entry === 'action' ? '행동' : '경험'} 살펴보기</summary>
        <ul className="mt-2 space-y-3">{result.reportedItems.map(item => <li key={item.id}>{item.prompt}<br /><span className="font-semibold">{item.response}</span></li>)}</ul>
      </details>}
      <h2 className="text-[15px] font-bold text-[var(--color-text)]">지금 할 일</h2>
      {actionList(result.primaryActions)}
      {supportLines.length > 0 && (
        <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          {supportLines.join(' ')}
        </p>
      )}
    </>
  );

  return (
    <>
    <div className={containerClassName}>
      <header className={heroClassName}>
        {heroArt}
        <h1 className="relative text-[1.5rem] font-extrabold leading-snug tracking-tight text-[var(--color-text)] [word-break:keep-all]">
          {result.title}
        </h1>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
          <span>{entryLabel.title}</span>
        </div>
      </header>

      {helpFirst && (
        <section aria-labelledby="respect-help-title" className="shrink-0 rounded-[var(--radius-lg)] border border-[var(--color-primary-muted)] bg-[var(--color-bg)] px-4 py-4">
          {notices.map((notice, index) => (
            <div key={notice.title} className={index > 0 ? 'mt-3 border-t border-[var(--color-border)] pt-3' : undefined}>
              <h2 id={index === 0 ? 'respect-help-title' : undefined} className="text-[16px] font-bold text-[var(--color-text)]">
                {notice.title}
              </h2>
              <p className={`mt-1 ${bodyTextClassName}`}>{notice.body}</p>
            </div>
          ))}
          <a
            href={primaryCall.href}
            aria-label={`${primaryCall.number} ${primaryCall.label} 전화`}
            className={`mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-white hover:bg-[var(--color-primary-hover)] ${focusRing}`}
          >
            <span className="text-[17px] font-bold">{primaryCall.number}</span>
            <span className="text-[14px] font-semibold">{primaryCall.label}</span>
          </a>
          <div className={`mt-2 grid gap-2 ${secondaryCalls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {secondaryCalls.map((call) => (
              <a
                key={call.href}
                href={call.href}
                aria-label={`${call.number} ${call.label} 전화`}
                className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] bg-[var(--color-bg)] px-2 text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] ${focusRing}`}
              >
                <span className="text-[15px] font-bold">{call.number}</span>
                <span className="text-[13px] font-medium">{call.label}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {helpFirst ? (
        <details className={`group ${cardClassName}`}>
          <summary className={`-mx-1 flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius-md)] px-1 text-[15px] font-bold text-[var(--color-text)] [&::-webkit-details-marker]:hidden ${focusRing}`}>
            일터 상황 정리 보기
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform group-open:rotate-180">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="mt-2"><p className="mb-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">안전을 확인하고 도움을 연결한 뒤 살펴볼 수 있습니다.</p>{workplaceContent}</div>
        </details>
      ) : (
        <section className={cardClassName}>{workplaceContent}</section>
      )}

      <details className={`${cardClassName} text-[13px] leading-relaxed text-[var(--color-text-secondary)]`}>
        <summary className={`min-h-[44px] cursor-pointer rounded py-2 ${focusRing}`}>문항·채점 출처와 안내</summary>
        <p className="mt-2">{entry === 'action' ? '문항·채점: 2019년 공공분야 갑질 근절 가이드라인의 개인별 진단 예시. 예방·상담 안내: 2026년 고용노동부 매뉴얼 참고. 관리자 권한이 없는 경우의 적용과 정상 업무 맥락은 추가 확인 대상입니다.' : `${RESPECT_EXPERIENCE_SOURCE_NOTICE} 문항·다섯 빈도 응답은 공식 자료에 기반합니다. 0~4점 코딩·0~100점 합계는 자체 시험안이며 정부의 점수 기준이 아닙니다. 점수의 크기로 위험·안전 등급을 정하지 않습니다.`}</p>
        <a className="mt-2 block underline" href={entry === 'action' ? 'https://www.opm.go.kr/opm/info/policies.do?articleNo=120471&mode=view' : 'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20260701008'} target="_blank" rel="noreferrer">공식 출처 보기</a>
      </details>

      {!helpFirst && <EmergencyHelpStrip compact entry={entry} />}
      {footerButtons}
    </div>
    {aiChatSheet}
    </>
  );
}
