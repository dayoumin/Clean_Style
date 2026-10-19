'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeafLineArt } from '@/components/LeafLineArt';
import ProgressBar from '@/components/ProgressBar';
import {
  buildRespectResultUrl,
  getRespectQuestions,
  getRespectResultStorageKey,
  getRespectSituationGuidanceIndex,
  getRespectSituationGuidance,
  getRespectScoredQuestions,
  getRespectStartNotice,
  RESPECT_MISSING_SCORE_NOTICE,
  calculateRespectResult,
  type RespectEntry,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';
import { createRespectResponse } from '@/diagnostics/workplace-respect/response';
import EmergencyHelpStrip from '../EmergencyHelpStrip';
import { getRespectHelpCalls } from '@/diagnostics/workplace-respect/help';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';

export default function RespectCheckClient({ entry }: { entry: RespectEntry }) {
  const router = useRouter();
  const questions = getRespectQuestions(entry);
  const [answers, setAnswers] = useState<number[]>([]);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [pendingHelpAnswers, setPendingHelpAnswers] = useState<number[] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const helpHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const helpWasOpenRef = useRef(false);
  const previousAnswerCountRef = useRef(answers.length);
  const currentQuestion = questions[answers.length];
  const helpResult = pendingHelpAnswers ? calculateRespectResult(entry, pendingHelpAnswers) : null;
  const label = respectEntryLabels[entry];
  const scoredTotal = getRespectScoredQuestions(entry).length;
  const isSafetyStep = currentQuestion?.axis === 'crisisGate';
  const sourceQuestionNumber = Math.max(0, answers.length - getRespectSituationGuidanceIndex(entry) + 1);

  useEffect(() => {
    try { sessionStorage.removeItem(getRespectResultStorageKey(entry)); } catch { /* 저장소 사용 불가 */ }
  }, [entry]);
  useEffect(() => {
    const heading = pendingHelpAnswers ? helpHeadingRef.current
      : helpWasOpenRef.current || previousAnswerCountRef.current !== answers.length ? questionHeadingRef.current : null;
    if (heading) {
      scrollContainerRef.current?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
      heading.closest('main')?.scrollTo({ top: 0 });
      heading.focus({ preventScroll: true });
    }
    helpWasOpenRef.current = pendingHelpAnswers !== null;
    previousAnswerCountRef.current = answers.length;
  }, [answers.length, pendingHelpAnswers]);

  const handleSelect = useCallback((choiceIndex: number) => {
    const nextAnswers = [...answers, choiceIndex];
    const choice = currentQuestion.choices[choiceIndex];
    if (choice?.support || (currentQuestion.axis === 'crisisGate' && choice?.gate) || choice?.crisis) {
      setPendingHelpAnswers(nextAnswers);
      if (!choice.crisis) return;
    }
    if (currentQuestion.choices[choiceIndex]?.crisis || nextAnswers.length >= questions.length) {
      try {
        sessionStorage.setItem(
          getRespectResultStorageKey(entry),
          JSON.stringify(createRespectResponse(entry, nextAnswers)),
        );
      } catch {
        // 결과는 이 탭의 저장소로만 넘기므로, 저장이 막히면 결과 화면 대신 안내를 보여준다.
        setStorageBlocked(true);
        return;
      }
      // 결과로 바꿔치기해, 뒤로가기가 점검 화면(열면 결과를 지움)으로 돌아가지 않게 한다.
      router.replace(buildRespectResultUrl(entry));
      return;
    }
    setAnswers(nextAnswers);
  }, [answers, currentQuestion, entry, questions.length, router]);

  const handleBack = () => {
    if (pendingHelpAnswers) { setPendingHelpAnswers(null); setStorageBlocked(false); }
    else setAnswers((prev) => prev.slice(0, -1));
  };
  const handleQuit = () => router.push('/respect');

  if (!currentQuestion) return null;

  return (
    <div ref={scrollContainerRef} className="animate-fade-in relative -mx-6 -mb-6 -mt-4 flex flex-1 flex-col overflow-y-auto bg-white px-6 pb-6 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:px-6 sm:pb-8 sm:pt-6">
      <LeafLineArt className="pointer-events-none absolute -right-16 top-16 h-52 w-52 text-[#b9c8aa] opacity-[0.16]" />
      <LeafLineArt className="pointer-events-none absolute -left-24 bottom-10 h-56 w-56 rotate-[-18deg] text-[#cbd6c0] opacity-[0.14]" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-[var(--color-text)]">{label.title}</h1>
            <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{scoredTotal}문항 · 안전·도움은 점수와 별도</p>
          </div>
          <div className="flex gap-1.5">
            {(answers.length > 0 || pendingHelpAnswers) && (
              <button
                type="button"
                onClick={handleBack}
                className={`min-h-11 whitespace-nowrap rounded-full border border-[var(--color-border)] px-3.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] ${focusRing}`}
              >
                ← 이전
              </button>
            )}
            <button
              type="button"
              onClick={handleQuit}
              className={`min-h-11 whitespace-nowrap rounded-full border border-[var(--color-border)] px-3.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] ${focusRing}`}
            >
              중단
            </button>
          </div>
        </div>

        {!isSafetyStep && <ProgressBar current={sourceQuestionNumber} total={scoredTotal} ariaLabel={`${label.title} 문항 진행률`} />}

        {answers.length === 0 && !helpResult && (
          <p className="mb-5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{getRespectStartNotice(entry)}</p>
        )}

        {helpResult ? (
          <section aria-labelledby="respect-check-help-title" className="rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] bg-[var(--color-card)] p-4">
            <h2 ref={helpHeadingRef} tabIndex={-1} id="respect-check-help-title" className="text-[18px] font-bold text-[var(--color-text)]">지금은 사람의 도움을 먼저 확인하세요</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">점검을 끝내지 않아도 도움을 받을 수 있습니다. 이 응답만으로 현재 안전을 판단하지 않습니다.</p>
            {[helpResult.safetyNotice, helpResult.supportNotice].filter(notice => notice !== null).map(notice => <p key={notice.title} className="mt-3 text-[14px] leading-relaxed text-[var(--color-text)]">{notice.body}</p>)}
            {helpResult.crisis && <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text)]">{helpResult.primaryActions.join(' ')}</p>}
            <div className="mt-4 flex flex-col gap-2">
              {getRespectHelpCalls(helpResult).map((call, index) => <a key={call.href} href={call.href} className={`flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] px-3 text-[14px] font-semibold ${index === 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-primary)]'} ${focusRing}`}>{call.number} {call.label}</a>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!helpResult.crisis && <button type="button" onClick={() => { setAnswers(pendingHelpAnswers!); setPendingHelpAnswers(null); }} className={`min-h-[48px] rounded-full border border-[var(--color-border)] px-4 text-[14px] ${focusRing}`}>점검 계속</button>}
              <button type="button" onClick={handleQuit} className={`min-h-[48px] rounded-full border border-[var(--color-border)] px-4 text-[14px] ${focusRing}`}>여기서 마치기</button>
            </div>
            {storageBlocked && <p role="alert" className="mt-3 text-[13px] text-red-700">브라우저 저장소를 사용할 수 없어 결과 화면으로 이동하지 못했습니다. 위 도움 경로는 저장 없이 이용할 수 있습니다.</p>}
          </section>
        ) : <div className="animate-fade-in">
          <div className="mb-3 text-[14px] font-semibold text-[var(--color-primary-accent)]">
            {isSafetyStep ? '안전·도움 확인 · 점수에 포함하지 않음' : `${sourceQuestionNumber} / ${scoredTotal}`}
          </div>

          <h2 ref={questionHeadingRef} tabIndex={-1} className="mb-8 text-[18px] font-semibold focus:outline-none leading-[1.65] tracking-tight text-[var(--color-text)]">
            {currentQuestion.prompt}
          </h2>

          {answers.length === getRespectSituationGuidanceIndex(entry) && (
            <div className="mb-5 rounded-[var(--radius-md)] bg-[var(--color-card)] px-4 py-3">
              <p className="mb-1 text-[12px] font-bold text-[var(--color-text-secondary)]">응답 기준</p>
              <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">{getRespectSituationGuidance(entry)}</p>
            </div>
          )}

          {currentQuestion.helpText && <details className="mb-5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            <summary className={`min-h-[44px] cursor-pointer rounded py-2 ${focusRing}`}>문항 이해 도움말(자체 작성) · 선택</summary>
            <p className="mt-1">{currentQuestion.helpText}</p>
          </details>}

          <div className="space-y-2">
            {currentQuestion.choices.map((choice, index) => choice.auxiliary ? null : (
              <button
                key={choice.text}
                type="button"
                onClick={() => handleSelect(index)}
                className={`choice-button relative w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3.5 pr-5 pl-[48px] text-left text-[15px] leading-relaxed text-[var(--color-text)] ${focusRing}`}
              >
                <span className="absolute left-[18px] top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[12px] font-bold text-[var(--color-text-muted)]">
                  {String.fromCharCode(65 + index)}
                </span>
                {choice.text}
              </button>
            ))}
          </div>

          {!isSafetyStep && <div className="mt-4 border-t border-[var(--color-border)] pt-3">
            <p className="mb-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">답하기 어려우면 건너뛸 수 있습니다. {RESPECT_MISSING_SCORE_NOTICE}</p>
            {currentQuestion.choices.map((choice, index) => choice.auxiliary ? <button key={choice.id} type="button" onClick={() => handleSelect(index)} className={`block min-h-[44px] w-full rounded px-2 py-2 text-left text-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}>{choice.text}</button> : null)}
          </div>}

          {storageBlocked && (
            <p role="alert" className="mt-4 text-[13px] leading-relaxed text-red-700">
              브라우저 저장소를 사용할 수 없어 결과를 표시하지 못했어요. 사생활 보호 모드나 저장소 차단 설정을 확인한 뒤 다시 시도해 주세요.
            </p>
          )}

          <details className="mt-5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            <summary className={`min-h-[44px] cursor-pointer rounded py-2 ${focusRing}`}>점검을 마치기 전 상담·도움 안내</summary>
            <p className="mt-1">점수·완료·메모·증거 유무와 관계없이 기관의 갑질·괴롭힘 담당자, 인사·감사·인권·고충처리·EAP 등 실제 운영 중인 안전한 창구에 문의할 수 있습니다. 내부 연결이 어렵다면 외부 상담을 선택하고 비밀보장·보호 범위를 확인하세요.</p>
          </details>
          <div className="mt-4"><EmergencyHelpStrip compact entry={entry} /></div>
        </div>}
      </div>
    </div>
  );
}
