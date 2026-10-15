'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FluentEmoji } from '@/components/FluentEmoji';
import {
  createStudentDemoFeedback,
  readStudentDemoFeedbackFromStorage,
  studentNextActions,
  studentPerspectiveCompanions,
  studentReconsiderPrompts,
  takeStudentResponseFromHandoff,
  writeStudentDemoFeedback,
  type StudentDemoFeedback,
  type StudentPerspectiveCompanionKey,
} from '@/diagnostics/student-integrity';
import StudentPerspectiveMap from '../components/StudentPerspectiveMap';

type ReflectionSection = 'other' | 'reconsider' | 'action';
type ViewPhase = 'loading' | 'revealing' | 'ready' | 'empty';

const companionOrder = Object.keys(studentPerspectiveCompanions) as StudentPerspectiveCompanionKey[];
const explorerImage = '/images/student/result-characters/perspective-explorer.webp';

function ShareIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 11v8h14v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M4 7v5h5M20 17v-5h-5M6.1 16.6A7 7 0 0 0 18 13M17.9 7.4A7 7 0 0 0 6 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResultReveal() {
  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center text-center" role="status" aria-live="polite">
      <div className="animate-scale-in">
        <Image
          src={explorerImage}
          alt=""
          width={112}
          height={112}
          unoptimized
          className="h-28 w-28 rounded object-cover"
        />
      </div>
      <p className="mt-6 text-[13px] font-bold text-[#28705e]">선택을 모으는 중</p>
      <h1 className="mt-2 text-[22px] font-bold text-[var(--color-text)]">관점 지도를 그리고 있어요</h1>
      <div className="mt-6 flex gap-2" aria-hidden="true">
        <span className="loading-dot h-2 w-2 rounded-full bg-[#0f8f94]" />
        <span className="loading-dot h-2 w-2 rounded-full bg-[#c77908]" />
        <span className="loading-dot h-2 w-2 rounded-full bg-[#7654c7]" />
      </div>
    </div>
  );
}

export default function StudentResultClient() {
  const loadedRef = useRef(false);
  const [phase, setPhase] = useState<ViewPhase>('loading');
  const [feedback, setFeedback] = useState<StudentDemoFeedback | null>(null);
  const [activeSection, setActiveSection] = useState<ReflectionSection>('action');
  const [selectedAction, setSelectedAction] = useState<(typeof studentNextActions)[number]>(
    studentNextActions[0],
  );
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const response = takeStudentResponseFromHandoff(sessionStorage);
    const completedResponse = response?.status === 'completed' ? response : null;
    const nextFeedback = completedResponse
      ? createStudentDemoFeedback(completedResponse)
      : readStudentDemoFeedbackFromStorage(sessionStorage);

    if (!nextFeedback) {
      setPhase('empty');
      return;
    }

    setFeedback(nextFeedback);
    if (completedResponse) writeStudentDemoFeedback(sessionStorage, nextFeedback);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!completedResponse || reduceMotion) {
      setPhase('ready');
      return;
    }

    setPhase('revealing');
    const timer = window.setTimeout(() => setPhase('ready'), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  const shareActivity = async () => {
    const url = `${window.location.origin}/`;
    const title = '선택 연습';
    const text = '학교생활 속 세 장면에서 여러 관점을 살펴보는 선택 연습을 해보세요.';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setShareMessage('활동 초대를 공유했어요');
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage('활동 주소를 복사했어요');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareMessage('공유하지 못했어요. 다시 시도해 주세요');
    }

    window.setTimeout(() => setShareMessage(''), 2200);
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-[60vh]" role="status" aria-live="polite">
        <span className="sr-only">선택 내용 불러오는 중</span>
      </div>
    );
  }

  if (phase === 'revealing') return <ResultReveal />;

  if (phase === 'empty' || !feedback) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Image
          src={explorerImage}
          alt=""
          width={88}
          height={88}
          unoptimized
          className="h-[88px] w-[88px] rounded object-cover"
        />
        <h1 className="mt-5 text-xl font-bold text-[var(--color-text)]">돌아볼 선택 내용이 없어요</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          세 장면을 살펴본 뒤 관점 지도를 만날 수 있어요.
        </p>
        <Link
          href="/test"
          className="mt-7 min-h-11 bg-[#28705e] px-6 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#377d6a] focus-visible:ring-offset-2"
        >
          선택 연습 시작
        </Link>
      </div>
    );
  }

  const reconsider = studentReconsiderPrompts[feedback.reconsiderScenarioId];
  const otherCompanion = studentPerspectiveCompanions[feedback.otherCompanionKey];
  const highlighted = new Set(feedback.highlightedCompanionKeys);

  const reflectionSections: {
    key: ReflectionSection;
    label: string;
    icon: string;
    accent: string;
    content: React.ReactNode;
  }[] = [
    {
      key: 'other',
      label: '다른 관점',
      icon: '🎯',
      accent: otherCompanion.accent,
      content: (
        <div className="flex gap-3">
          <Image
            src={otherCompanion.image}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
          <div>
            <p className="text-[13px] font-bold" style={{ color: otherCompanion.accent }}>{otherCompanion.name}</p>
            <p className="mt-1 text-[14px] leading-6 text-[var(--color-text-secondary)]">{otherCompanion.question}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'reconsider',
      label: '다시 생각하기',
      icon: '✨',
      accent: '#c77908',
      content: (
        <div>
          <p className="text-[13px] font-bold text-[#9a5b00]">{reconsider.title}</p>
          <p className="mt-1 text-[14px] leading-6 text-[var(--color-text-secondary)]">{reconsider.prompt}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: '다음 행동',
      icon: '🚀',
      accent: '#2f8a55',
      content: (
        <div className="grid gap-2">
          {studentNextActions.map((action) => {
            const selected = selectedAction === action;
            return (
              <button
                key={action}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedAction(action)}
                className={`min-h-12 w-full border px-3 py-2.5 text-left text-[13px] font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28705e] focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-[#2f8a55] bg-[#eef8f1] text-[#205c3b]'
                    : 'border-[#dbe5e1] bg-white text-[var(--color-text-secondary)] hover:border-[#8db9ad]'
                }`}
              >
                <span
                  className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    selected ? 'bg-[#2f8a55] text-white' : 'bg-[#edf2ef] text-[#66736f]'
                  }`}
                  aria-hidden="true"
                >
                  {selected ? '✓' : '○'}
                </span>
                {action}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-xl pb-2" data-testid="student-result">
      <header className="flex min-h-11 items-center justify-between border-b border-[#e4ebe8] pb-3">
        <Link href="/" className="text-[15px] font-bold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28705e]">
          선택 연습
        </Link>
        <button
          type="button"
          onClick={shareActivity}
          className="inline-flex h-11 w-11 items-center justify-center text-[#263b36] hover:bg-[#f1f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28705e]"
          aria-label="활동 공유"
          title="활동 공유"
        >
          <ShareIcon />
        </button>
      </header>

      <section className="animate-fade-in border-b border-[#e4ebe8] py-5 sm:py-6" aria-labelledby="result-title">
        <div className="flex items-center gap-4">
          <Image
            src={explorerImage}
            alt=""
            width={88}
            height={88}
            priority
            unoptimized
            className="h-[76px] w-[76px] shrink-0 rounded object-cover sm:h-[88px] sm:w-[88px]"
          />
          <div>
            <p className="text-[12px] font-bold text-[#28705e]">관점 탐색가</p>
            <h1 id="result-title" className="mt-1 text-[22px] font-bold leading-8 text-[var(--color-text)]">
              이번 선택에서 만난 관점
            </h1>
            <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              세 장면에서 함께 살펴본 생각을 모았어요.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:mt-6" aria-label="네 가지 관점 동료">
          {companionOrder.map((key) => {
            const companion = studentPerspectiveCompanions[key];
            const isHighlighted = highlighted.has(key);
            return (
              <div
                key={key}
                className="min-w-0 rounded border p-1.5 text-center sm:px-2 sm:py-2.5"
                style={{
                  borderColor: isHighlighted ? companion.accent : '#dfe8e5',
                  backgroundColor: isHighlighted ? companion.soft : '#ffffff',
                }}
                data-highlighted={isHighlighted}
              >
                <Image
                  src={companion.image}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized
                  className="aspect-square w-full rounded-sm object-cover"
                />
                <p className="mt-1.5 break-keep text-[10px] font-bold leading-4 text-[#263b36]">{companion.name}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="animate-slide-up border-b border-[#e4ebe8] py-5 sm:py-6" aria-labelledby="perspective-map-title">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#0f8f94]">이번에 살펴본 생각</p>
            <h2 id="perspective-map-title" className="mt-1 text-[18px] font-bold text-[var(--color-text)]">관점 지도</h2>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">점수나 순위가 아니에요</p>
        </div>
        <StudentPerspectiveMap axisCounts={feedback.axisCounts} />
      </section>

      <section className="py-5" aria-label="생각을 이어 가는 세 단계">
        <div className="divide-y divide-[#e4ebe8] border-y border-[#e4ebe8]">
          {reflectionSections.map((section) => {
            const open = activeSection === section.key;
            return (
              <div key={section.key}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#28705e]"
                  aria-expanded={open}
                  aria-controls={`reflection-${section.key}`}
                  onClick={() => setActiveSection(section.key)}
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${section.accent}18` }}
                    aria-hidden="true"
                  >
                    <FluentEmoji emoji={section.icon} size={24} className="h-6 w-6" />
                  </span>
                  <span className="flex-1 text-[15px] font-bold text-[var(--color-text)]">{section.label}</span>
                  <Chevron open={open} />
                </button>
                {open && (
                  <div id={`reflection-${section.key}`} className="animate-fade-in pb-4 pl-12 pr-1">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[52px_1fr] gap-3 border-t border-[#e4ebe8] pt-4">
        <Link
          href="/test"
          className="inline-flex h-[52px] items-center justify-center border border-[#ccd8d4] text-[#263b36] hover:bg-[#f3f7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28705e] focus-visible:ring-offset-2"
          aria-label="다시 해보기"
          title="다시 해보기"
        >
          <RestartIcon />
        </Link>
        <button
          type="button"
          onClick={shareActivity}
          className="inline-flex h-[52px] items-center justify-center gap-2 bg-[#0f8f94] px-5 text-[15px] font-bold text-white hover:bg-[#0b777b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f8f94] focus-visible:ring-offset-2"
        >
          <ShareIcon />
          활동 공유
        </button>
      </div>

      {shareMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-[#263b36] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg"
        >
          {shareMessage}
        </div>
      )}
    </div>
  );
}
