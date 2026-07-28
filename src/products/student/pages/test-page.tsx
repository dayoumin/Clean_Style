'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearStudentResponseHandoff,
  createStudentResponseEnvelope,
  studentPrototypeScenarios,
  writeStudentResponseForHandoff,
  type StudentItemResponse,
} from '@/diagnostics/student-integrity';

type Step = 'choice' | 'reason';

export default function StudentTestPage() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startedAtRef = useRef(new Date().toISOString());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [step, setStep] = useState<Step>('choice');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [responses, setResponses] = useState<StudentItemResponse[]>([]);
  const [handoffError, setHandoffError] = useState(false);

  const scenario = studentPrototypeScenarios[questionIndex];

  useEffect(() => {
    clearStudentResponseHandoff(sessionStorage);
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [questionIndex, step]);

  const completeQuestion = (response: StudentItemResponse) => {
    const nextResponses = [...responses, response];

    if (questionIndex === studentPrototypeScenarios.length - 1) {
      const envelope = createStudentResponseEnvelope(
        nextResponses,
        startedAtRef.current,
        new Date().toISOString(),
      );
      if (!writeStudentResponseForHandoff(sessionStorage, envelope)) {
        setHandoffError(true);
        return;
      }
      window.setTimeout(() => clearStudentResponseHandoff(sessionStorage), 5000);
      router.push('/result');
      return;
    }

    setResponses(nextResponses);
    setQuestionIndex((current) => current + 1);
    setSelectedChoiceId(null);
    setStep('choice');
  };

  const handleChoice = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setStep('reason');
  };

  const handleReason = (reasonId: string) => {
    if (!selectedChoiceId) return;
    completeQuestion({
      questionId: scenario.id,
      phase: 'initial',
      status: 'answered',
      choiceId: selectedChoiceId,
      reasonId,
    });
  };

  const handleSkip = () => {
    completeQuestion({
      questionId: scenario.id,
      phase: 'initial',
      status: 'skipped',
    });
  };

  const handlePrevious = () => {
    if (step === 'reason') {
      setStep('choice');
      return;
    }
    if (questionIndex === 0) return;

    const previousResponse = responses.at(-1);
    setResponses((current) => current.slice(0, -1));
    setQuestionIndex((current) => current - 1);
    setSelectedChoiceId(previousResponse?.status === 'answered' ? previousResponse.choiceId : null);
  };

  const handleQuit = () => {
    clearStudentResponseHandoff(sessionStorage);
    router.push('/');
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col pb-4">
      <div className="mb-4 flex items-center justify-between text-[12px] font-semibold text-[var(--color-text-muted)]">
        <span>{questionIndex + 1} / {studentPrototypeScenarios.length}</span>
        <span>{step === 'choice' ? '행동 선택' : '이유 선택'}</span>
      </div>
      <div
        className="mb-8 h-1.5 overflow-hidden rounded-full bg-[#e5ebf3]"
        role="progressbar"
        aria-label="진행률"
        aria-valuemin={1}
        aria-valuemax={studentPrototypeScenarios.length}
        aria-valuenow={questionIndex + 1}
      >
        <div
          className="h-full rounded-full bg-[#377d6a] transition-[width] duration-300"
          style={{ width: `${((questionIndex + 1) / studentPrototypeScenarios.length) * 100}%` }}
        />
      </div>

      <main className="flex-1">
        <p className="mb-3 text-[12px] font-bold text-[#377d6a]">{scenario.title}</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[21px] font-bold leading-8 text-[var(--color-text)] focus:outline-none"
        >
          {step === 'choice' ? scenario.situation : scenario.reasonPrompt}
        </h1>
        {step === 'choice' && (
          <p className="mt-3 text-[14px] leading-6 text-[var(--color-text-secondary)]">
            {scenario.prompt}
          </p>
        )}
        {step === 'reason' && (
          <div className="mt-5 rounded-lg bg-[#eef7f4] px-4 py-3 text-[13px] leading-5 text-[var(--color-text-secondary)]">
            <strong className="mr-2 text-[#205c4c]">내가 고른 행동</strong>
            {scenario.choices.find((choice) => choice.id === selectedChoiceId)?.text}
          </div>
        )}
        {handoffError && (
          <div className="mt-4 border-l-4 border-[#c2410c] bg-[#fff7ed] px-4 py-3 text-[13px] leading-5 text-[#7c2d12]" role="alert">
            브라우저의 임시 저장을 사용할 수 없어 선택 돌아보기 화면을 열지 못했습니다. 응답은 서버로 전송되지 않았습니다.
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {(step === 'choice' ? scenario.choices : scenario.reasons).map((option, index) => {
            const selected = step === 'choice' && selectedChoiceId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => step === 'choice' ? handleChoice(option.id) : handleReason(option.id)}
                aria-pressed={step === 'choice' ? selected : undefined}
                className={`min-h-[64px] w-full rounded-lg border px-4 py-3 text-left text-[14px] font-semibold leading-6 transition-[border-color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a] focus-visible:ring-offset-2 active:scale-[0.99] ${
                  selected
                    ? 'border-[#377d6a] bg-[#e9f5f1] text-[#205c4c]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:border-[#8db9ad] hover:bg-[#f5faf8]'
                }`}
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#edf2f7] text-[12px] font-bold text-[var(--color-text-secondary)]">
                  {index + 1}
                </span>
                {option.text}
              </button>
            );
          })}
        </div>
      </main>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <div className="flex gap-2">
          {(questionIndex > 0 || step === 'reason') && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-2 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a]"
            >
              이전
            </button>
          )}
          <button
            type="button"
            onClick={handleQuit}
            className="px-2 py-2 text-[13px] font-semibold text-[var(--color-text-muted)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a]"
          >
            중단
          </button>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="px-2 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a]"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
