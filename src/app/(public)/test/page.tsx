'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questions, calculateResult, styleTypes } from '@/data/questions';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';
import { addHistoryEntry } from '@/lib/history';
import { buildResultUrl } from '@/lib/utils';
import { TEST_START_TIME_KEY, TEST_REFERRER_KEY } from '@/lib/constants';

const STORAGE_KEY = 'integrity-test-progress';

function loadProgress(): { answers: number[]; seed: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data.answers) && data.answers.length > 0 && data.answers.length < questions.length) {
      return data;
    }
  } catch { /* ignore */ }
  return null;
}

function saveProgress(answers: number[], seed: number) {
  if (answers.length > 0 && answers.length < questions.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, seed }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export default function TestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>([]);
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [resumeData, setResumeData] = useState<{ answers: number[]; seed: number } | null>(null);
  const [ready, setReady] = useState(false);

  // 최초 로드: 저장된 진행 상황 확인 + 분석용 메타데이터 기록
  useEffect(() => {
    const saved = loadProgress();
    if (saved) {
      setResumeData(saved);
    }
    if (!sessionStorage.getItem(TEST_START_TIME_KEY)) {
      sessionStorage.setItem(TEST_START_TIME_KEY, String(Date.now()));
    }
    if (!sessionStorage.getItem(TEST_REFERRER_KEY)) {
      sessionStorage.setItem(TEST_REFERRER_KEY, document.referrer || 'direct');
    }
    setReady(true);
  }, []);

  // 답변 변경 시 자동 저장 (0개면 제거)
  useEffect(() => {
    saveProgress(answers, shuffleSeed);
  }, [answers, shuffleSeed]);

  // 마지막 문항 완료 시 결과 페이지로 이동
  useEffect(() => {
    if (ready && answers.length >= questions.length) {
      localStorage.removeItem(STORAGE_KEY);
      const result = calculateResult(answers);
      const style = styleTypes[result.styleKey];
      const entry = addHistoryEntry({
        styleKey: result.styleKey,
        styleName: style?.name ?? result.styleKey,
        styleEmoji: style?.emoji ?? '',
        scores: result.scores,
        answers,
      });
      router.push(buildResultUrl(result.styleKey, result.scores, answers, entry?.id, true));
    }
  }, [answers, router, ready]);

  const handleResume = () => {
    if (resumeData) {
      setAnswers(resumeData.answers);
      setShuffleSeed(resumeData.seed);
    }
    setResumeData(null);
  };

  const handleStartNew = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(TEST_START_TIME_KEY, String(Date.now()));
    setAnswers([]);
    setShuffleSeed(Math.floor(Math.random() * 100000));
    setResumeData(null);
  };

  const handleSelect = useCallback((choiceIndex: number) => {
    setAnswers(prev => [...prev, choiceIndex]);
  }, []);

  const handleBack = () => setAnswers(prev => prev.slice(0, -1));

  const handleQuit = () => {
    localStorage.removeItem(STORAGE_KEY);
    router.push('/');
  };

  if (!ready) return <div className="min-h-[60vh]" />;

  // 이어하기 안내
  if (resumeData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-2 text-[15px] font-bold text-[var(--color-text)]">
          이전에 풀던 테스트가 있어요
        </p>
        <p className="mb-8 text-[13px] text-[var(--color-text-muted)]">
          {resumeData.answers.length}/{questions.length}문항까지 진행했어요
        </p>
        <div className="flex w-full max-w-xs gap-2">
          <button
            onClick={handleStartNew}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] py-3 text-[14px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)]"
          >
            처음부터
          </button>
          <button
            onClick={handleResume}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            이어하기
          </button>
        </div>
      </div>
    );
  }

  const question = questions[answers.length];
  if (!question) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <h1 className="text-[17px] font-bold text-[var(--color-text)]">나의 청렴 스타일은?</h1>
        <div className="flex gap-1.5">
          {answers.length > 0 && (
            <button
              onClick={handleBack}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
            >
              ← 이전
            </button>
          )}
          <button
            onClick={handleQuit}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            중단
          </button>
        </div>
      </div>
      <ProgressBar current={answers.length + 1} total={questions.length} />
      <QuestionCard
        key={question.id}
        question={question}
        questionIndex={answers.length}
        shuffleSeed={shuffleSeed}
        onSelect={handleSelect}
      />
    </div>
  );
}
