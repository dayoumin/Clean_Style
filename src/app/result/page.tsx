'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { styleTypes, computeSixAxisScores, type StyleType } from '@/data/questions';
import StyleRadarChart from '@/components/StyleRadarChart';
import { MAX_QUESTION_LENGTH, TEST_START_TIME_KEY, TEST_REFERRER_KEY } from '@/lib/constants';
import BottomSheet from '@/components/BottomSheet';
import { cn } from '@/lib/utils';
import { LoadingFairy, AnalyzingScreen } from '@/components/LoadingFairy';
import { useAiChat } from '@/hooks/useAiChat';

const SCROLL_AREA = 'flex-1 space-y-3 overflow-y-auto px-5 py-4';

function ChatBubbles({ messages }: { messages: { role: 'user' | 'assistant'; content: string }[] }) {
  if (messages.length === 0) return null;
  return (
    <>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] rounded-bl-sm'
            }`}
          >
            <p className="whitespace-pre-line">{msg.content}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === '1';
  const isShared = !searchParams.has('new') && !searchParams.has('hid');
  const [analyzing, setAnalyzing] = useState(isNew);
  const [showModal, setShowModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [activeTab, setActiveTab] = useState<'strength' | 'caution' | 'tip'>('strength');

  const historyId = searchParams.get('hid') ?? '';
  const styleKey = searchParams.get('style') ?? '';
  const pRaw = searchParams.get('p') ?? '0';
  const tRaw = searchParams.get('t') ?? '0';
  const iRaw = searchParams.get('i') ?? '0';
  const scores = useMemo(() => ({
    principle: Number(pRaw),
    transparency: Number(tRaw),
    independence: Number(iRaw),
  }), [pRaw, tRaw, iRaw]);
  const answersRaw = searchParams.get('a') ?? '';
  const answers = useMemo(() => answersRaw.split(',').map(Number), [answersRaw]);
  const sixAxis = useMemo(() => computeSixAxisScores(answers), [answers]);

  const chat = useAiChat({ styleKey, historyId, scores });

  const savedRef = useRef(false);
  useEffect(() => {
    if (isNew && !isShared && styleKey && !savedRef.current) {
      savedRef.current = true;
      const startTime = Number(sessionStorage.getItem(TEST_START_TIME_KEY) || 0);
      const durationSec = startTime ? Math.round((Date.now() - startTime) / 1000) : undefined;
      const referrer = sessionStorage.getItem(TEST_REFERRER_KEY) || undefined;
      sessionStorage.removeItem(TEST_START_TIME_KEY);
      sessionStorage.removeItem(TEST_REFERRER_KEY);
      fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleKey, scores, answers, durationSec, referrer }),
      }).catch(() => {});
    }
  }, [isNew, isShared, styleKey, scores, answers]);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  const style: StyleType | undefined = styleTypes[styleKey];

  if (!style) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="mb-4 text-lg text-[var(--color-text)]">잘못된 접근입니다.</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[var(--color-primary-hover)]"
        >
          처음으로
        </button>
      </div>
    );
  }

  if (analyzing) {
    return <AnalyzingScreen onDone={() => setAnalyzing(false)} />;
  }

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('hid');
    navigator.clipboard.writeText(url.toString()).then(() => {
      clearTimeout(toastTimerRef.current);
      setToastVisible(true);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 animate-slide-up">
        {/* 공유 모드 배너 */}
        {isShared && (
          <div className="mb-2 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
            <span className="text-base">👀</span>
            다른 사람의 청렴 스타일 결과입니다
          </div>
        )}

        {/* 유형 카드 */}
        <div className="result-gradient relative z-0 mb-2 overflow-hidden rounded-[var(--radius-xl)] px-6 py-4 text-center text-white shadow-lg">
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-8 top-4 h-3 w-3 rounded-full bg-white/10" />
          <span className="absolute left-4 top-3 z-20 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/80 backdrop-blur-sm">
            청렴 스타일
          </span>
          {!isShared && (
            <button
              onClick={handleCopyLink}
              className="absolute right-4 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm hover:bg-white/25 transition-colors"
              aria-label="결과 링크 복사"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          )}
          <div className="relative z-10">
            <div className="mb-0.5 text-[36px]">{style.emoji}</div>
            <h1 className="mb-1 text-[24px] font-extrabold tracking-tight">{style.name}</h1>
            <p className="text-[13px] leading-relaxed text-white/80">{style.description}</p>
          </div>
        </div>

        {/* 성향 레이더 차트 */}
        <div className="result-card px-3 pb-1 pt-1">
          <StyleRadarChart sixAxis={sixAxis} />
        </div>

        {/* 유형별 한줄 분석 — 탭 배지 */}
        <div className="result-card !py-4">
          <div className="flex justify-center gap-3 mb-2">
            {([
              { key: 'strength' as const, label: '강점' },
              { key: 'caution' as const, label: '주의' },
              { key: 'tip' as const, label: '팁' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex h-8 w-16 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                  activeTab === key
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-primary-soft)] text-[var(--color-primary-accent)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            {activeTab === 'strength' && style.strength}
            {activeTab === 'caution' && style.caution}
            {activeTab === 'tip' && style.tip}
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      {isShared ? (
        <div className="mt-auto pt-2">
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3.5 text-center text-[14px] font-bold text-white hover:bg-[var(--color-primary-hover)]"
          >
            나도 테스트 해보기 →
          </button>
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-primary-soft)] py-3 text-center text-[13px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)]"
            >
              다시 하기
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] py-3 text-center text-[13px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-soft)]"
            >
              AI 맞춤 조언
              {chat.chatHistory.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 text-[11px] text-white">
                  {Math.floor(chat.chatHistory.length / 2)}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg">
          결과 링크가 복사되었어요
        </div>
      )}

      {/* AI 조언 모달 */}
      {!isShared && showModal && (
        <BottomSheet title="✨ AI 맞춤 조언" onClose={() => { if (!chat.aiLoading) { setShowModal(false); chat.closeChat(); } }}>
          {chat.aiLoading ? (
            <>
              <div className={SCROLL_AREA}>
                <ChatBubbles messages={chat.chatHistory} />
                <ChatBubbles messages={[{ role: 'user', content: chat.userContext }]} />
                {chat.aiAnswer ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                      <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">{chat.aiAnswer}<span className="inline-block w-1.5 h-4 bg-[var(--color-primary-accent)] animate-pulse ml-0.5 align-text-bottom" /></p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent mb-3" />
                    <p className="text-[14px] font-semibold text-[var(--color-primary-accent)]">답변을 작성하고 있어요...</p>
                  </div>
                )}
                <div ref={chat.scrollAnchorRef} />
              </div>
              <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-3">
                <button
                  onClick={chat.abortAnswer}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                >
                  중단
                </button>
              </div>
            </>
          ) : chat.aiAnswer ? (
            <>
              <div className={SCROLL_AREA}>
                <ChatBubbles messages={chat.chatHistory.slice(0, -2)} />
                <ChatBubbles messages={[{ role: 'user', content: chat.userContext }]} />
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                    <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">{chat.aiAnswer}</p>
                  </div>
                </div>
                <div ref={chat.scrollAnchorRef} />
              </div>
              <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-5 py-3">
                {chat.chatMaxReached && (
                  <p className="text-center text-[12px] text-[var(--color-text-muted)]">대화가 길어져서 새로 시작할게요</p>
                )}
                {chat.chatLastTurn && (
                  <p className="text-center text-[12px] text-[var(--color-text-muted)]">이어서 질문은 1번 더 가능해요</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={chat.resetChat}
                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                  >
                    새 질문
                  </button>
                  <button
                    onClick={chat.continueChat}
                    disabled={chat.chatMaxReached}
                    className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    이어서
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {chat.chatHistory.length > 0 && (
                <div className={SCROLL_AREA}>
                  <ChatBubbles messages={chat.chatHistory} />
                </div>
              )}
              <div className={cn('shrink-0 space-y-3 px-5 py-3', chat.chatHistory.length > 0 ? 'border-t border-[var(--color-border)]' : 'pt-0')}>
                <div className="relative">
                  <textarea
                    value={chat.userContext}
                    onChange={(e) => chat.setUserContext(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (chat.userContext.trim()) chat.fetchAnswer(); } }}
                    maxLength={MAX_QUESTION_LENGTH}
                    placeholder={chat.chatHistory.length > 0 ? "이어서 질문해주세요" : "궁금한 상황을 자유롭게 질문해주세요"}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 pr-14 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-accent)]"
                    rows={3}
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-[var(--color-text-muted)]">{chat.userContext.length}/{MAX_QUESTION_LENGTH}</span>
                </div>
                {chat.aiError && (
                  <p className="text-[13px] text-red-500">답변 생성에 실패했어요. 다시 시도해주세요.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowModal(false); chat.closeChat(); }}
                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-3 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                  >
                    닫기
                  </button>
                  <button
                    onClick={chat.fetchAnswer}
                    disabled={!chat.userContext.trim()}
                    className="flex-[2] rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    질문하기
                  </button>
                </div>
                {chat.chatHistory.length > 0 && (
                  <button
                    onClick={chat.deleteChat}
                    className="w-full py-2 text-[12px] text-[var(--color-text-muted)] hover:text-red-500"
                  >
                    대화 지우기
                  </button>
                )}
              </div>
            </>
          )}
        </BottomSheet>
      )}
    </div>
  );
}

function SuspenseSpinner() {
  return <LoadingFairy message="불러오는 중..." />;
}

export default function ResultPage() {
  return (
    <Suspense fallback={<SuspenseSpinner />}>
      <ResultContent />
    </Suspense>
  );
}
