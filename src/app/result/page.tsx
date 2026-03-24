'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { styleTypes, computeSixAxisScores, type StyleType } from '@/data/questions';
import StyleRadarChart from '@/components/StyleRadarChart';
import type html2canvasType from 'html2canvas';
import { MAX_HISTORY_MESSAGES } from '@/lib/constants';
import { getHistoryEntry, updateChat, clearChat } from '@/lib/history';

// ── 컴포넌트 ──

function LoadingFairy({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="animate-bounce-soft mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-2xl">
        🧚
      </div>
      <p className="mb-3 text-base font-semibold text-[var(--color-text)]">
        {message}
      </p>
      <div className="flex gap-1.5">
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
      </div>
      {children}
    </div>
  );
}

function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ['응답을 분석하고 있어요...', '성향을 파악하고 있어요...', '결과를 정리하고 있어요...'];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(onDone, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <LoadingFairy message={steps[step]}>
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary-accent)] transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
    </LoadingFairy>
  );
}

function BottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="animate-slide-up w-full max-w-md overflow-hidden rounded-[20px] bg-[var(--color-bg)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-[16px] font-bold text-[var(--color-text)]">🧚 AI 맞춤 조언</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

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
  const captureRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [activeTab, setActiveTab] = useState<'strength' | 'caution' | 'tip'>('strength');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const historyId = searchParams.get('hid') ?? '';
  const styleKey = searchParams.get('style') ?? '';

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // historyId 변경 시 채팅 로드 (없으면 리셋)
  const chatLoadedRef = useRef(false);
  useEffect(() => {
    if (!historyId) {
      setChatHistory([]);
      return;
    }
    const entry = getHistoryEntry(historyId);
    if (entry?.chat.length) {
      chatLoadedRef.current = true;
      setChatHistory(entry.chat);
    } else {
      setChatHistory([]);
    }
  }, [historyId]);

  // 채팅 변경 시 히스토리에 저장 (초기 로드 스킵)
  useEffect(() => {
    if (chatLoadedRef.current) {
      chatLoadedRef.current = false;
      return;
    }
    if (historyId && chatHistory.length > 0) {
      updateChat(historyId, chatHistory);
    }
  }, [historyId, chatHistory]);

  const scores = {
    principle: Number(searchParams.get('p') ?? 0),
    transparency: Number(searchParams.get('t') ?? 0),
    independence: Number(searchParams.get('i') ?? 0),
  };
  const answersRaw = searchParams.get('a') ?? '';
  const answers = useMemo(() => answersRaw.split(',').map(Number), [answersRaw]);
  const sixAxis = useMemo(() => computeSixAxisScores(answers), [answers]);

  const style: StyleType | undefined = styleTypes[styleKey];
  const chatMaxReached = chatHistory.length >= MAX_HISTORY_MESSAGES;
  const chatLastTurn = chatHistory.length >= MAX_HISTORY_MESSAGES - 2 && !chatMaxReached;

  const clearChatUI = () => {
    setAiAnswer('');
    setUserContext('');
    setAiError(false);
  };

  const resetModal = () => {
    clearChatUI();
    setChatHistory([]);
  };

  const closeModal = () => {
    clearChatUI();
  };

  const handleDeleteChat = () => {
    if (historyId) clearChat(historyId);
    resetModal();
  };

  const continueChat = clearChatUI;

  const fetchAnswer = async () => {
    if (aiLoading || !userContext.trim()) return;
    abortRef.current?.abort();
    setAiLoading(true);
    setAiError(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const question = userContext.trim();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleKey, scores, answers,
          userContext: question,
          mode: 'question',
          history: chatHistory.length > 0 ? chatHistory : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('API 응답 오류');

      const data = await res.json();
      setAiAnswer(data.answer);
      setChatHistory(prev => [
        ...prev,
        { role: 'user' as const, content: question },
        { role: 'assistant' as const, content: data.answer },
      ].slice(-MAX_HISTORY_MESSAGES));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const { default: html2canvas } = await import('html2canvas') as { default: typeof html2canvasType };
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `청렴스타일_${style?.name ?? '결과'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // 캡쳐 실패 시 무시
    } finally {
      setCapturing(false);
    }
  };

  const handleRetry = () => {
    router.push('/');
  };

  if (!style) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="mb-4 text-lg text-[var(--color-text)]">잘못된 접근입니다.</p>
        <button
          onClick={handleRetry}
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

  return (
    <div className="flex flex-col">
      <div className="flex-1 animate-slide-up" ref={captureRef}>
        {/* 유형 카드 */}
        <div className="result-gradient relative z-0 mb-4 overflow-hidden rounded-[var(--radius-xl)] px-6 py-5 text-center text-white shadow-lg">
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-8 top-4 h-3 w-3 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="mb-1 text-[40px]">{style.emoji}</div>
            <p className="mb-0.5 text-[11px] text-white/60">당신의 청렴 스타일</p>
            <h1 className="mb-1 text-[24px] font-extrabold tracking-tight">{style.name}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">
              {style.description}
            </p>
          </div>
        </div>

        {/* 성향 레이더 차트 */}
        <div className="result-card relative mb-4 px-3 pb-1 pt-4">
          <span className="absolute left-4 top-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            성향 분석
          </span>
          <StyleRadarChart sixAxis={sixAxis} />
        </div>

        {/* 유형별 한줄 분석 — 탭 배지 */}
        <div className="result-card">
          <div className="flex justify-center gap-3 mb-3">
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

        {/* AI 맞춤 조언 버튼 */}
        <button
          onClick={() => setShowModal(true)}
          className="mt-2 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] py-3.5 text-center text-[13px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-muted)]"
        >
          🧚 AI 맞춤 조언 받기
          {chatHistory.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] text-white">
              💬{Math.floor(chatHistory.length / 2)}
            </span>
          )}
        </button>
      </div>

      {/* 하단 버튼 — 바닥 고정 */}
      <div className="mt-auto flex gap-2 pt-3">
        <button
          onClick={handleRetry}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] py-3 text-center text-[13px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)]"
        >
          다시 하기
        </button>
        <button
          onClick={handleCapture}
          disabled={capturing}
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-center text-[13px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
        >
          {capturing ? '저장 중...' : '이미지 저장'}
        </button>
      </div>

      {/* AI 조언 모달 */}
      {showModal && (
        <BottomSheet onClose={() => { if (!aiLoading) { setShowModal(false); closeModal(); } }}>
          {aiAnswer ? (
            <div className="space-y-3">
              {/* 이전 대화 히스토리 (마지막 턴 제외 — 아래서 별도 렌더) */}
              <ChatBubbles messages={chatHistory.slice(0, -2)} />

              {/* 현재 질문 (우측) */}
              <ChatBubbles messages={[{ role: 'user', content: userContext }]} />

              {/* AI 답변 (좌측) — 최신 답변은 강조 스타일 */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                  <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">{aiAnswer}</p>
                </div>
              </div>

              {/* 버튼 */}
              <div className="space-y-2 pt-1">
                {chatMaxReached && (
                  <p className="text-center text-[12px] text-[var(--color-text-muted)]">
                    대화가 길어져서 새로 시작할게요
                  </p>
                )}
                {chatLastTurn && (
                  <p className="text-center text-[12px] text-[var(--color-text-muted)]">
                    이어서 질문은 1번 더 가능해요
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={resetModal}
                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                  >
                    새 질문
                  </button>
                  <button
                    onClick={continueChat}
                    disabled={chatMaxReached}
                    className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    이어서
                  </button>
                </div>
              </div>
            </div>
          ) : aiLoading ? (
            <div className="space-y-3">
              <ChatBubbles messages={chatHistory} />
              <ChatBubbles messages={[{ role: 'user', content: userContext }]} />
              <div className="py-4 text-center">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent mb-3" />
                <p className="text-[14px] font-semibold text-[var(--color-primary-accent)]">답변을 작성하고 있어요...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ChatBubbles messages={chatHistory} />
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                maxLength={500}
                placeholder={chatHistory.length > 0 ? "이어서 질문해주세요" : "궁금한 상황을 자유롭게 질문해주세요"}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-accent)]"
                rows={3}
              />
              {aiError && (
                <p className="text-[13px] text-red-500">답변 생성에 실패했어요. 다시 시도해주세요.</p>
              )}
              <button
                onClick={fetchAnswer}
                disabled={!userContext.trim()}
                className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                질문하기
              </button>
              {chatHistory.length > 0 && (
                <button
                  onClick={handleDeleteChat}
                  className="w-full py-2 text-[12px] text-[var(--color-text-muted)] hover:text-red-500"
                >
                  대화 지우기
                </button>
              )}
            </div>
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
