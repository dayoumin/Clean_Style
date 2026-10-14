'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeafLineArt } from '@/components/LeafLineArt';
import ProgressBar from '@/components/ProgressBar';
import {
  buildRespectResultUrl,
  getRespectQuestions,
  getRespectResultStorageKey,
  RESPECT_SITUATION_GUIDANCE,
  type RespectEntry,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';
import { createRespectResponse } from '@/diagnostics/workplace-respect/response';
import EmergencyHelpStrip from '../EmergencyHelpStrip';

const categoryEmoji: Record<string, string> = {
  관계: '🤝',
  업무범위: '📋',
  존중: '💬',
  사적요구: '🧾',
  불이익: '⚖️',
  반복: '🔁',
  기록: '🗂️',
  안전: '🛟',
};

const choiceLabels = ['A', 'B', 'C', 'D'];
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';

export default function RespectCheckClient({ entry }: { entry: RespectEntry }) {
  const router = useRouter();
  const questions = getRespectQuestions(entry);
  const [answers, setAnswers] = useState<number[]>([]);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const currentQuestion = questions[answers.length];
  const label = respectEntryLabels[entry];

  useEffect(() => {
    try { sessionStorage.removeItem(getRespectResultStorageKey(entry)); } catch { /* 저장소 사용 불가 */ }
  }, [entry]);

  const handleSelect = useCallback((choiceIndex: number) => {
    const nextAnswers = [...answers, choiceIndex];
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

  const handleBack = () => setAnswers((prev) => prev.slice(0, -1));
  const handleQuit = () => router.push('/');

  // 다음 문항은 맨 위에서 시작하고, 스크린리더가 새 문항을 읽도록 제목으로 포커스를 옮긴다.
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousAnswerCountRef = useRef<number | null>(null);
  useEffect(() => {
    const previous = previousAnswerCountRef.current;
    previousAnswerCountRef.current = answers.length;
    if (previous === null || previous === answers.length) return;
    window.scrollTo({ top: 0 });
    questionHeadingRef.current?.closest('main')?.scrollTo({ top: 0 });
    questionHeadingRef.current?.focus({ preventScroll: true });
  }, [answers.length]);

  if (!currentQuestion) return null;

  return (
    <div className="animate-fade-in relative -mx-6 -mb-6 -mt-4 flex flex-1 flex-col overflow-hidden bg-white px-6 pb-6 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:px-6 sm:pb-8 sm:pt-6">
      <LeafLineArt className="pointer-events-none absolute -right-16 top-16 h-52 w-52 text-[#b9c8aa] opacity-[0.16]" />
      <LeafLineArt className="pointer-events-none absolute -left-24 bottom-10 h-56 w-56 rotate-[-18deg] text-[#cbd6c0] opacity-[0.14]" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary-accent)]">
              일터 존중 점검
            </p>
            <h1 className="text-[17px] font-bold text-[var(--color-text)]">{label.title}</h1>
          </div>
          <div className="flex gap-1.5">
            {answers.length > 0 && (
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

        <ProgressBar current={answers.length + 1} total={questions.length} ariaLabel="자가점검 진행률" />

        <div className="animate-fade-in">
          <div className="mb-3.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide text-[var(--color-primary-accent)]">
            <span aria-hidden="true">{categoryEmoji[currentQuestion.category]}</span>
            <span>{currentQuestion.category}</span>
          </div>

          <div className="mb-3 text-5xl font-extrabold leading-none tracking-tighter text-[var(--color-text-muted)]">
            {String(answers.length + 1).padStart(2, '0')}
          </div>

          <h2 ref={questionHeadingRef} tabIndex={-1} className="mb-8 text-[18px] font-semibold focus:outline-none leading-[1.65] tracking-tight text-[var(--color-text)]">
            {currentQuestion.prompt}
          </h2>

          <div className="space-y-2">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={choice.text}
                type="button"
                onClick={() => handleSelect(index)}
                className={`choice-button relative w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-[18px] pr-5 pl-[48px] text-left text-[15px] leading-relaxed text-[var(--color-text)] shadow-sm ${focusRing}`}
              >
                <span className="absolute left-[18px] top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[12px] font-bold text-[var(--color-text-muted)]">
                  {choiceLabels[index]}
                </span>
                {choice.text}
              </button>
            ))}
          </div>

          {storageBlocked && (
            <p role="alert" className="mt-4 text-[13px] leading-relaxed text-red-700">
              브라우저 저장소를 사용할 수 없어 결과를 표시하지 못했어요. 사생활 보호 모드나 저장소 차단 설정을 확인한 뒤 다시 시도해 주세요.
            </p>
          )}

          {answers.length === 0 && (
            <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-card)] px-4 py-3">
              <p className="mb-1 text-[12px] font-bold text-[var(--color-text-secondary)]">응답 기준</p>
              <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">{RESPECT_SITUATION_GUIDANCE}</p>
            </div>
          )}
          {currentQuestion.category === '안전' && <div className="mt-6"><EmergencyHelpStrip compact entry={entry} /></div>}
        </div>
      </div>
    </div>
  );
}
