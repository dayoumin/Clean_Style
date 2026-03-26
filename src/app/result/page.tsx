'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { styleTypes, computeSixAxisScores, type StyleType } from '@/data/questions';
import StyleRadarChart from '@/components/StyleRadarChart';
import type html2canvasType from 'html2canvas';
import { MAX_HISTORY_MESSAGES, SUMMARIZE_AT_MESSAGES, MAX_QUESTION_LENGTH } from '@/lib/constants';
import { getHistoryEntry, updateChat, clearChat } from '@/lib/history';
import BottomSheet from '@/components/BottomSheet';
import { cn } from '@/lib/utils';

const SCROLL_AREA = 'flex-1 space-y-3 overflow-y-auto px-5 py-4';

// ── 컴포넌트 ──

function LoadingFairy({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="animate-bounce-soft mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-3xl">
        ✨
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
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const isRevisit = searchParams.has('hid');
  const isShared = !isRevisit;
  const [analyzing, setAnalyzing] = useState(!isRevisit && !isShared);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [activeTab, setActiveTab] = useState<'strength' | 'caution' | 'tip'>('strength');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatSummary, setChatSummary] = useState('');
  const [summarizedUpTo, setSummarizedUpTo] = useState(0);
  const summarizingRef = useRef(false);
  const summarizeAbortRef = useRef<AbortController | null>(null);

  const historyId = searchParams.get('hid') ?? '';
  const styleKey = searchParams.get('style') ?? '';

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      summarizeAbortRef.current?.abort();
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  // DOM 페인트 후 최신 답변으로 스크롤 — 상태 업데이트 직후 레이아웃이 완료되지 않을 수 있어 지연 필요
  useEffect(() => {
    if (aiAnswer) {
      const timer = setTimeout(() => scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return () => clearTimeout(timer);
    }
  }, [aiAnswer]);

  const triggerSummarize = async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    // in-flight 요약이 있으면 취소하고 최신으로 교체 (유실 방지)
    summarizeAbortRef.current?.abort();
    summarizingRef.current = true;
    const controller = new AbortController();
    summarizeAbortRef.current = controller;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summarize',
          history: chatSummary ? messages.slice(-SUMMARIZE_AT_MESSAGES) : messages,
          summary: chatSummary || undefined,
          styleKey,
        }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setChatSummary(data.summary);
        setSummarizedUpTo(messages.length);
      }
    } catch {
      // 요약 실패/취소 시 무시 — 전체 히스토리로 계속 진행
    } finally {
      summarizingRef.current = false;
    }
  };

  // historyId 변경 시 채팅 로드 (없으면 리셋)
  const chatLoadedRef = useRef(false);
  useEffect(() => {
    setChatSummary('');
    setSummarizedUpTo(0);
    if (!historyId) {
      setChatHistory([]);
      return;
    }
    const entry = getHistoryEntry(historyId);
    if (entry?.chat.length) {
      chatLoadedRef.current = true;
      setChatHistory(entry.chat);
      // 재방문 시 히스토리가 충분하면 즉시 요약 생성
      if (entry.chat.length >= SUMMARIZE_AT_MESSAGES) {
        triggerSummarize(entry.chat);
      }
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
    abortRef.current?.abort();
    summarizeAbortRef.current?.abort();
    setAiLoading(false);
    clearChatUI();
    setChatHistory([]);
    setChatSummary('');
    setSummarizedUpTo(0);
    if (historyId) clearChat(historyId);
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
    setAiAnswer('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const question = userContext.trim();

      // 요약이 있으면 요약 이후의 메시지만 전송 (요약에 포함된 턴은 제외)
      const historyToSend = chatSummary
        ? chatHistory.slice(summarizedUpTo)
        : chatHistory;

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleKey, scores, answers,
          userContext: question,
          mode: 'question',
          history: historyToSend.length > 0 ? historyToSend : undefined,
          summary: chatSummary || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('API 응답 오류');

      // SSE 스트림 소비 — 5토큰마다 UI 갱신 (리렌더 절감)
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';
      let buffer = '';
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;

          let parsed;
          try { parsed = JSON.parse(payload); } catch { continue; }
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.token) {
            fullAnswer += parsed.token;
            tokenCount++;
            if (tokenCount % 5 === 0) setAiAnswer(fullAnswer);
          }
        }
      }
      if (tokenCount % 5 !== 0) setAiAnswer(fullAnswer);

      if (!fullAnswer) throw new Error('Empty response');

      const raw = [
        ...chatHistory,
        { role: 'user' as const, content: question },
        { role: 'assistant' as const, content: fullAnswer },
      ];
      const trimmed = raw.length - MAX_HISTORY_MESSAGES;
      const newHistory = trimmed > 0 ? raw.slice(trimmed) : raw;

      // trim 시 summarizedUpTo도 같이 밀어줌 (음수 방지)
      if (trimmed > 0 && summarizedUpTo > 0) {
        setSummarizedUpTo(Math.max(0, summarizedUpTo - trimmed));
      }

      setChatHistory(newHistory);

      // 4턴마다 롤링 요약 (4턴 배수 도달 시마다 재요약)
      const turnCount = newHistory.length / 2;
      if (turnCount >= 4 && turnCount % 4 === 0) {
        triggerSummarize(newHistory);
      }
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

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('hid');
    navigator.clipboard.writeText(url.toString()).then(() => {
      clearTimeout(toastTimerRef.current);
      setToastVisible(true);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
    }).catch(() => {
      // clipboard API 실패 시 무시 (non-secure context 등)
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 animate-slide-up" ref={captureRef}>
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

          <div className="relative z-10">
            <div className="mb-0.5 text-[36px]">{style.emoji}</div>
            <h1 className="mb-1 text-[24px] font-extrabold tracking-tight">{style.name}</h1>
            <p className="text-[13px] leading-relaxed text-white/80">
              {style.description}
            </p>
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

        {/* AI 맞춤 조언 버튼 — 본인만 */}
        {!isShared && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] py-3.5 text-center text-[13px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-muted)]"
          >
            <span className="text-base">✨</span> AI 맞춤 조언 받기
            {chatHistory.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] text-white">
                💬{Math.floor(chatHistory.length / 2)}
              </span>
            )}
          </button>
        )}
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
          <button
            onClick={handleCopyLink}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-success-soft)] py-2.5 text-center text-[13px] font-semibold text-[#059669] hover:bg-[var(--color-border)]"
          >
            🔗 결과 링크 복사하기
          </button>
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg">
          결과 링크가 복사되었어요
        </div>
      )}

      {/* AI 조언 모달 — 본인만 */}
      {!isShared && showModal && (
        <BottomSheet title="✨ AI 맞춤 조언" onClose={() => { if (!aiLoading) { setShowModal(false); closeModal(); } }}>
          {aiLoading ? (
            <>
              <div className={SCROLL_AREA}>
                <ChatBubbles messages={chatHistory} />
                <ChatBubbles messages={[{ role: 'user', content: userContext }]} />
                {aiAnswer ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                      <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">{aiAnswer}<span className="inline-block w-1.5 h-4 bg-[var(--color-primary-accent)] animate-pulse ml-0.5 align-text-bottom" /></p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent mb-3" />
                    <p className="text-[14px] font-semibold text-[var(--color-primary-accent)]">답변을 작성하고 있어요...</p>
                  </div>
                )}
                <div ref={scrollAnchorRef} />
              </div>
              <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-3">
                <button
                  onClick={() => { abortRef.current?.abort(); setAiLoading(false); }}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                >
                  중단
                </button>
              </div>
            </>
          ) : aiAnswer ? (
            <>
              <div className={SCROLL_AREA}>
                <ChatBubbles messages={chatHistory.slice(0, -2)} />
                <ChatBubbles messages={[{ role: 'user', content: userContext }]} />
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                    <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">{aiAnswer}</p>
                  </div>
                </div>
                <div ref={scrollAnchorRef} />
              </div>

              <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-5 py-3">
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
            </>
          ) : (
            <>
              {/* 대화 히스토리 — 스크롤 (있을 때만) */}
              {chatHistory.length > 0 && (
                <div className={SCROLL_AREA}>
                  <ChatBubbles messages={chatHistory} />
                </div>
              )}

              {/* 하단 입력 */}
              <div className={cn('shrink-0 space-y-3 px-5 py-3', chatHistory.length > 0 ? 'border-t border-[var(--color-border)]' : 'pt-0')}>
                <div className="relative">
                  <textarea
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (userContext.trim()) fetchAnswer(); } }}
                    maxLength={MAX_QUESTION_LENGTH}
                    placeholder={chatHistory.length > 0 ? "이어서 질문해주세요" : "궁금한 상황을 자유롭게 질문해주세요"}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 pr-14 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-accent)]"
                    rows={3}
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-[var(--color-text-muted)]">{userContext.length}/{MAX_QUESTION_LENGTH}</span>
                </div>
                {aiError && (
                  <p className="text-[13px] text-red-500">답변 생성에 실패했어요. 다시 시도해주세요.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowModal(false); closeModal(); }}
                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-3 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                  >
                    닫기
                  </button>
                  <button
                    onClick={fetchAnswer}
                    disabled={!userContext.trim()}
                    className="flex-[2] rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    질문하기
                  </button>
                </div>
                {chatHistory.length > 0 && (
                  <button
                    onClick={handleDeleteChat}
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
