'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { questions, calculateResult, styleTypes } from '@/data/questions';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';
import { addHistoryEntry } from '@/lib/history';
import { buildResultUrl } from '@/lib/utils';
import { TEST_START_TIME_KEY, TEST_REFERRER_KEY } from '@/lib/constants';
import { AnalyzingScreen } from '@/components/LoadingFairy';
import { normalizeDisplayName, MAX_DISPLAY_NAME_LENGTH } from '@/lib/display-name';

const STORAGE_KEY = 'integrity-test-progress';
const AUTO_RESULT_DELAY_SECONDS = 10;

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
  const [finishing, setFinishing] = useState(false);
  const [shareName, setShareName] = useState('');
  const [autoSecondsLeft, setAutoSecondsLeft] = useState(AUTO_RESULT_DELAY_SECONDS);
  const [nameFieldFocused, setNameFieldFocused] = useState(false);
  const shareNameRef = useRef('');
  const navigatedRef = useRef(false);

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

  useEffect(() => {
    shareNameRef.current = shareName;
  }, [shareName]);

  // 마지막 문항 완료 시 분석 화면에서 공유용 이름을 선택 입력
  const resultUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (ready && answers.length >= questions.length && !finishing) {
      navigatedRef.current = false;
      setFinishing(true);
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
      resultUrlRef.current = buildResultUrl(result.styleKey, result.scores, answers, entry?.id, true);
    }
  }, [answers, ready, finishing]);

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

  const handleViewResult = useCallback(() => {
    if (!resultUrlRef.current || navigatedRef.current) return;
    navigatedRef.current = true;
    const url = new URL(resultUrlRef.current, window.location.origin);
    const displayName = normalizeDisplayName(shareNameRef.current);
    if (displayName) url.searchParams.set('name', displayName);
    router.push(`${url.pathname}${url.search}`);
  }, [router]);

  useEffect(() => {
    const autoResultEnabled = finishing && !nameFieldFocused && !normalizeDisplayName(shareName);
    if (!autoResultEnabled) return;

    setAutoSecondsLeft(AUTO_RESULT_DELAY_SECONDS);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setAutoSecondsLeft(Math.max(0, AUTO_RESULT_DELAY_SECONDS - elapsedSeconds));
    }, 250);
    const timeout = setTimeout(handleViewResult, AUTO_RESULT_DELAY_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [finishing, nameFieldFocused, shareName, handleViewResult]);

  if (!ready) return <div className="min-h-[60vh]" />;

  if (finishing) {
    const hasShareName = Boolean(normalizeDisplayName(shareName));
    const autoResultEnabled = !nameFieldFocused && !hasShareName;

    return (
      <AnalyzingScreen
        autoComplete={false}
        onDone={handleViewResult}
      >
        <div className="mt-7 w-full max-w-xs rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4 shadow-sm">
          <label className="block text-left text-[12px] font-bold text-[var(--color-text-muted)]" htmlFor="share-name">
            공유용 이름(선택)
          </label>
          <input
            id="share-name"
            value={shareName}
            onChange={(event) => setShareName(normalizeDisplayName(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                handleViewResult();
              }
            }}
            onFocus={() => setNameFieldFocused(true)}
            onBlur={() => setNameFieldFocused(false)}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            placeholder="이름"
            className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2.5 text-[14px] font-semibold text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:ring-1 focus:ring-[var(--color-primary-accent)]"
          />
          <button
            onClick={handleViewResult}
            className="mt-3 w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-bold text-white hover:bg-[var(--color-primary-hover)]"
          >
            결과 보기
          </button>
          <p
            className="mt-2 text-center text-[11px] font-medium text-[var(--color-text-muted)]"
            role="status"
            aria-live="polite"
          >
            {autoResultEnabled
              ? `입력하지 않아도 ${autoSecondsLeft}초 뒤 결과로 이동해요`
              : '이름 입력 후 결과 보기를 눌러주세요'}
          </p>
        </div>
      </AnalyzingScreen>
    );
  }

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
