'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  STUDENT_PROTOTYPE_NOTICE,
  studentPrototypeScenarios,
  takeStudentResponseFromHandoff,
  type StudentResponseEnvelope,
} from '@/diagnostics/student-integrity';

const reflectionQuestions = [
  '내가 가장 중요하게 생각한 것은 무엇이었나요?',
  '다른 선택을 한 친구는 어떤 이유를 중요하게 생각했을까요?',
  '혼자 결정하기 어려울 때 누구에게 기준이나 도움을 물을 수 있을까요?',
];

export default function StudentResultClient() {
  const loadedRef = useRef(false);
  const [response, setResponse] = useState<StudentResponseEnvelope | null | undefined>(undefined);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const stored = takeStudentResponseFromHandoff(sessionStorage);
    setResponse(stored?.status === 'completed' ? stored : null);
  }, []);

  if (response === undefined) {
    return (
      <div className="min-h-[60vh]" role="status" aria-live="polite">
        <span className="sr-only">선택 내용 불러오는 중</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-[var(--color-text)]">돌아볼 선택 내용이 없어요</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          예시 활동을 마치면 이 화면에서 선택과 이유를 다시 볼 수 있습니다.
        </p>
        <Link
          href="/test"
          className="mt-7 bg-[#377d6a] px-6 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a] focus-visible:ring-offset-2"
        >
          예시 활동 시작
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl pb-6">
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[12px] font-bold text-[#377d6a]">선택 돌아보기</p>
        <h1 className="mt-2 text-[24px] font-bold leading-9 text-[var(--color-text)]">
          예시 활동을 마쳤어요
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-[var(--color-text-secondary)]">
          아래 내용은 점수나 성격 결과가 아니라, 방금 고른 행동과 이유를 그대로 정리한 것입니다.
        </p>
      </header>

      <section className="py-7" aria-labelledby="response-review-title">
        <h2 id="response-review-title" className="text-[17px] font-bold text-[var(--color-text)]">
          내가 고른 내용
        </h2>
        <div className="mt-4 grid gap-4">
          {response.responses.map((item) => {
            const scenario = studentPrototypeScenarios.find((candidate) => candidate.id === item.questionId);
            if (!scenario) return null;

            const choice = item.status === 'answered'
              ? scenario.choices.find((candidate) => candidate.id === item.choiceId)
              : null;
            const reason = item.status === 'answered'
              ? scenario.reasons.find((candidate) => candidate.id === item.reasonId)
              : null;

            return (
              <article key={item.questionId} className="border-l-4 border-[#8db9ad] bg-[#f5faf8] px-4 py-4">
                <h3 className="text-[14px] font-bold text-[var(--color-text)]">{scenario.title}</h3>
                {item.status === 'skipped' ? (
                  <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">이 상황은 건너뛰었습니다.</p>
                ) : (
                  <div className="mt-3 space-y-2 text-[13px] leading-5">
                    <p><strong className="text-[#205c4c]">행동</strong> {choice?.text}</p>
                    <p><strong className="text-[#205c4c]">이유</strong> {reason?.text}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] py-7" aria-labelledby="reflection-title">
        <h2 id="reflection-title" className="text-[17px] font-bold text-[var(--color-text)]">함께 생각해 볼 질문</h2>
        <ol className="mt-4 space-y-3">
          {reflectionQuestions.map((question, index) => (
            <li key={question} className="flex gap-3 text-[14px] leading-6 text-[var(--color-text-secondary)]">
              <span className="font-bold text-[#377d6a]">{index + 1}</span>
              <span>{question}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="border-l-4 border-[#f0b429] bg-[#fff9e8] px-4 py-3 text-[12px] leading-5 text-[#5f4b16]" role="note">
        {STUDENT_PROTOTYPE_NOTICE}
      </div>

      <Link
        href="/"
        className="mt-7 block w-full bg-[#377d6a] px-6 py-3 text-center text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a] focus-visible:ring-offset-2"
      >
        처음으로
      </Link>
    </div>
  );
}
