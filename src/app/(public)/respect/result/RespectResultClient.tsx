'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomSheet from '@/components/BottomSheet';
import { getClientIdHeader } from '@/lib/client-id';
import { MAX_HISTORY_MESSAGES, MAX_QUESTION_LENGTH } from '@/lib/constants';
import {
  calculateRespectResult,
  getRespectQuestions,
  getRespectResultStorageKey,
  RESPECT_QUESTION_VERSION,
  RESPECT_RESULT_TTL_MS,
  type RespectEntry,
  type RespectRiskLevel,
  respectAxisLabels,
  respectEntryLabels,
} from '@/data/workplaceRespectQuestions';

const levelStyle: Record<RespectRiskLevel, { label: string; className: string }> = {
  low: {
    label: '낮음',
    className: 'bg-[var(--color-success-soft)] text-[#059669]',
  },
  caution: {
    label: '주의',
    className: 'bg-[var(--color-warning-soft)] text-[#c87f2a]',
  },
  high: {
    label: '높음',
    className: 'bg-[var(--color-warning-soft)] text-[#b45309]',
  },
  urgent: {
    label: '즉시 도움 필요',
    className: 'bg-[#fff1f2] text-[#be123c]',
  },
};

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';
const dangerFocusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c] focus-visible:ring-offset-2';
const CHAT_SCROLL_AREA = 'flex-1 space-y-3 overflow-y-auto px-5 py-4';

const urgentCallLinks: Record<RespectEntry, Array<{ href: string; label: string; subLabel: string; ariaLabel: string }>> = {
  action: [
    { href: 'tel:112', label: '112', subLabel: '긴급신고', ariaLabel: '112 긴급신고' },
    { href: 'tel:119', label: '119', subLabel: '구조·응급', ariaLabel: '119 구조·응급' },
    { href: 'tel:109', label: '109', subLabel: '상담', ariaLabel: '109 자살예방상담전화' },
  ],
  experience: [
    { href: 'tel:109', label: '109', subLabel: '상담', ariaLabel: '109 자살예방상담전화' },
    { href: 'tel:112', label: '112', subLabel: '긴급신고', ariaLabel: '112 긴급신고' },
    { href: 'tel:119', label: '119', subLabel: '구조·응급', ariaLabel: '119 구조·응급' },
  ],
};

interface StoredRespectResult {
  entry: RespectEntry;
  answers: number[];
  createdAt: number;
  version: string;
}

interface RespectChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type RespectChatErrorType = 'network' | 'rate-limit' | 'shared-rate-limit' | 'server';

function ChatBubbles({ messages }: { messages: RespectChatMessage[] }) {
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
                ? 'rounded-br-sm bg-[var(--color-primary)] text-white'
                : 'rounded-bl-sm bg-[var(--color-card)] text-[var(--color-text-secondary)]'
            }`}
          >
            <p className="whitespace-pre-line">{msg.content}</p>
          </div>
        </div>
      ))}
    </>
  );
}

export default function RespectResultClient({ entry }: { entry: RespectEntry }) {
  const router = useRouter();
  const [stored, setStored] = useState<StoredRespectResult | null | undefined>(undefined);
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<RespectChatMessage[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatErrorType, setChatErrorType] = useState<RespectChatErrorType | null>(null);
  const [piiWarning, setPiiWarning] = useState<string[] | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatScrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const storageKey = useMemo(() => getRespectResultStorageKey(entry), [entry]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) {
        setStored(null);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StoredRespectResult>;
      if (parsed.entry !== entry || !Array.isArray(parsed.answers)) {
        sessionStorage.removeItem(storageKey);
        setStored(null);
        return;
      }

      const createdAt = typeof parsed.createdAt === 'number' ? parsed.createdAt : 0;
      const expired = !createdAt || Date.now() - createdAt > RESPECT_RESULT_TTL_MS;
      const questions = getRespectQuestions(entry);
      const answers = parsed.answers;
      const complete = answers.length === questions.length;
      const validAnswers = answers.every((answer, index) => (
        Number.isInteger(answer)
        && answer >= 0
        && answer < (questions[index]?.choices.length ?? 0)
      ));
      const versionMatches = parsed.version === RESPECT_QUESTION_VERSION;

      if (expired || !complete || !validAnswers || !versionMatches) {
        sessionStorage.removeItem(storageKey);
        setStored(null);
        return;
      }

      setStored({
        entry,
        answers,
        createdAt,
        version: RESPECT_QUESTION_VERSION,
      });
    } catch {
      sessionStorage.removeItem(storageKey);
      setStored(null);
    }
  }, [entry, storageKey]);

  useEffect(() => {
    return () => chatAbortRef.current?.abort();
  }, [chatAbortRef]);

  useEffect(() => {
    if (!chatLoading) return;
    const interval = setInterval(() => {
      chatScrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
    return () => clearInterval(interval);
  }, [chatLoading]);

  const questions = useMemo(() => getRespectQuestions(entry), [entry]);
  const result = useMemo(() => {
    if (!stored) return null;
    return calculateRespectResult(entry, stored.answers);
  }, [entry, stored]);
  const clearStoredResult = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setStored(null);
  }, [storageKey]);
  const clearAndGo = useCallback((href: string) => {
    clearStoredResult();
    router.push(href);
  }, [clearStoredResult, router]);
  const openAiChat = useCallback(() => {
    setShowAiChat(true);
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, []);
  const fetchAiChat = useCallback(async () => {
    const question = chatInput.trim();
    if (!stored || !question) return;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;
    setStreamingAnswer('');
    setChatErrorType(null);
    setPiiWarning(null);
    setChatLoading(true);

    let fullAnswer = '';

    try {
      const res = await fetch('/api/respect-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getClientIdHeader() },
        body: JSON.stringify({
          entry,
          answers: stored.answers,
          question,
          history: chatMessages.length > 0 ? chatMessages : undefined,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        setChatErrorType(body.limitedBy === 'ip' ? 'shared-rate-limit' : 'rate-limit');
        return;
      }

      if (!res.ok || !res.body) {
        setChatErrorType('server');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastRenderTime = 0;

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

          let parsed: { token?: string; error?: string; pii_warning?: string[] };
          try { parsed = JSON.parse(payload); } catch { continue; }
          if (parsed.pii_warning) {
            setPiiWarning(parsed.pii_warning);
            continue;
          }
          if (parsed.error) {
            setChatErrorType('server');
            return;
          }
          if (parsed.token) {
            fullAnswer += parsed.token;
            const now = performance.now();
            if (now - lastRenderTime > 30) {
              setStreamingAnswer(fullAnswer);
              lastRenderTime = now;
            }
          }
        }
      }

      if (!fullAnswer.trim()) {
        setChatErrorType('server');
        return;
      }

      setStreamingAnswer(fullAnswer);
      setChatMessages((prev) => {
        const next: RespectChatMessage[] = [
          ...prev,
          { role: 'user', content: question },
          { role: 'assistant', content: fullAnswer },
        ];
        const trimCount = next.length - MAX_HISTORY_MESSAGES;
        return trimCount > 0 ? next.slice(trimCount) : next;
      });
      setChatInput('');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setChatErrorType(error instanceof TypeError ? 'network' : 'server');
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatMessages, entry, stored]);
  const abortAiChat = useCallback(() => {
    chatAbortRef.current?.abort();
    setChatLoading(false);
  }, []);

  if (stored === undefined) {
    return <div className="min-h-[60vh]" />;
  }

  if (!stored || !result) {
    return <MissingResult />;
  }

  const entryLabel = respectEntryLabels[entry];
  const level = levelStyle[result.level];
  const complete = stored.answers.length >= questions.length;
  const activeSignals = result.axisSummary.activeAxes
    .map((axis) => respectAxisLabels[axis])
    .slice(0, 4);
  const callLinks = urgentCallLinks[entry];

  if (result.crisis) {
    return (
      <div className="animate-fade-in">
        <section className="result-card border-[#fecdd3] bg-[#fff1f2]">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#be123c]">
            {entryLabel.title}
          </p>
          <h1 className="mb-3 text-[1.55rem] font-extrabold leading-tight tracking-tight text-[var(--color-text)]">
            지금은 도움 연결이 먼저입니다
          </h1>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            {result.summary}
          </p>
          <p className="mt-3 rounded-[var(--radius-md)] bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-[#be123c]">
            이 결과는 법적·기관 공식 판정이 아니라 자가점검 안내입니다. 실제 위험이 있으면 앱보다 사람과 기관의 도움을 먼저 받으세요.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {callLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel}
                className={`rounded-[var(--radius-md)] bg-[#be123c] px-2 py-3 text-center text-[13px] font-bold leading-tight text-white hover:bg-[#9f1239] ${dangerFocusRing}`}
              >
                {link.label}<br /><span className="text-[10px] font-medium">{link.subLabel}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="result-card">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">바로 할 일</h2>
          <ul className="space-y-2">
            {result.primaryActions.map((action) => (
              <li key={action} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text)]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#be123c]" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="result-card">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">결과 관리</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            민감한 응답은 이 브라우저 탭에만 잠시 남습니다. 공용 기기라면 결과를 지워주세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => clearAndGo('/respect')}
              className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
            >
              지우고 다시 점검
            </button>
            <button
              type="button"
              onClick={() => clearAndGo('/')}
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-3 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              지우고 나가기
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
    <div className="animate-fade-in">
      <div className="result-gradient -mx-6 -mt-4 mb-5 px-6 py-8 text-white sm:-mx-8 sm:-mt-6 sm:px-8">
        <p className="relative mb-2 text-[12px] font-bold uppercase tracking-wide text-white/70">
          {entryLabel.title}
        </p>
        <h1 className="relative mb-3 text-[1.7rem] font-extrabold leading-tight tracking-tight">
          {result.title}
        </h1>
        <div className="relative flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${level.className}`}>
            {level.label}
          </span>
          <span className="text-[12px] text-white/70">
            {Math.min(result.answeredCount, questions.length)} / {questions.length}문항
            {!complete && ' 응답 기준'}
          </span>
        </div>
      </div>

      <section className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          이 결과는 법적·기관 공식 판정이 아니라 상황 정리와 도움 연결을 위한 자가점검입니다.
        </p>
      </section>

      {result.support && !result.crisis && (
        <section className="result-card border-[#facc15] bg-[var(--color-warning-soft)]">
          <h2 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">도움 연결을 함께 확인하세요</h2>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            스스로를 해칠 생각이 스친 적이 있다면 점수와 별개로 혼자 두지 않는 것이 중요합니다. 가까운 사람에게 현재 상태를 알리고, 필요하면 109 자살예방상담전화나 정신건강복지센터에 연결하세요.
          </p>
        </section>
      )}

      <section className="result-card">
        <h2 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">상황 요약</h2>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {result.summary}
        </p>
      </section>

      {activeSignals.length > 0 && (
        <section className="result-card">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">확인된 신호</h2>
          <div className="flex flex-wrap gap-1.5">
            {activeSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
              >
                {signal}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="result-card">
        <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">지금 할 일</h2>
        <ul className="space-y-2">
          {result.primaryActions.map((action) => (
            <li key={action} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text)]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-accent)]" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="result-card">
        <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">도움 연결</h2>
        <ul className="space-y-2">
          {result.supportActions.map((action) => (
            <li key={action} className="flex gap-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
        {(result.level === 'urgent' || result.support) && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a
              href="tel:109"
              aria-label="109 자살예방상담전화"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              109<br /><span className="text-[10px] font-medium">상담</span>
            </a>
            <a
              href="tel:112"
              aria-label="112 긴급신고"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              112<br /><span className="text-[10px] font-medium">긴급신고</span>
            </a>
            <a
              href="tel:119"
              aria-label="119 구조·응급"
              className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2.5 text-center text-[12px] font-bold leading-tight text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
            >
              119<br /><span className="text-[10px] font-medium">구조·응급</span>
            </a>
          </div>
        )}
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => clearAndGo('/respect')}
          className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-center text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] ${focusRing}`}
        >
          다시 점검
        </button>
        <button
          type="button"
          onClick={openAiChat}
          className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-center text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          AI 조언
        </button>
      </div>
      <button
        type="button"
        onClick={() => clearAndGo('/')}
        className={`mt-3 w-full rounded-[var(--radius-md)] py-2 text-center text-[13px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] ${focusRing}`}
      >
          처음으로
      </button>
    </div>
    {showAiChat && (
      <BottomSheet title="AI 조언" onClose={() => { if (!chatLoading) setShowAiChat(false); }}>
        {chatLoading ? (
          <>
            <div className={CHAT_SCROLL_AREA}>
              <ChatBubbles messages={chatMessages} />
              <ChatBubbles messages={[{ role: 'user', content: chatInput.trim() }]} />
              {streamingAnswer ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                    <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                      {streamingAnswer}
                      <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[var(--color-primary-accent)] align-text-bottom" />
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <span className="mb-3 inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent" />
                  <p className="text-[14px] font-semibold text-[var(--color-primary-accent)]">답변을 작성하고 있어요...</p>
                </div>
              )}
              <div ref={chatScrollAnchorRef} />
            </div>
            <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-3">
              <button
                type="button"
                onClick={abortAiChat}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
              >
                중단
              </button>
            </div>
          </>
        ) : (
          <>
            {chatMessages.length > 0 && (
              <div className={CHAT_SCROLL_AREA}>
                <ChatBubbles messages={chatMessages} />
                <div ref={chatScrollAnchorRef} />
              </div>
            )}
            <div className={`shrink-0 space-y-3 px-5 py-3 ${chatMessages.length > 0 ? 'border-t border-[var(--color-border)]' : 'pt-0'}`}>
              <p className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                AI 조언을 요청하면 점검 결과와 질문이 답변 생성을 위해 전송됩니다. 이름, 소속, 연락처 같은 개인정보는 쓰지 마세요.
              </p>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (chatInput.trim()) fetchAiChat();
                    }
                  }}
                  maxLength={MAX_QUESTION_LENGTH}
                  placeholder="결과를 바탕으로 더 궁금한 점을 질문하세요"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 pr-14 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-accent)]"
                  rows={6}
                />
                <span className="absolute bottom-2 right-3 text-[11px] text-[var(--color-text-muted)]">{chatInput.length}/{MAX_QUESTION_LENGTH}</span>
              </div>
              {piiWarning && piiWarning.length > 0 && (
                <p className="text-[12px] leading-relaxed text-amber-600">
                  개인정보({piiWarning.join(', ')})가 감지되어 자동으로 가렸습니다.
                </p>
              )}
              {chatErrorType && (
                <p className="text-[13px] text-red-500">
                  {chatErrorType === 'network' && '인터넷 연결을 확인해주세요.'}
                  {chatErrorType === 'rate-limit' && 'AI 질문은 1분에 5번까지 가능해요. 잠시 후 다시 시도해주세요.'}
                  {chatErrorType === 'shared-rate-limit' && '같은 네트워크에서 AI 요청이 많아요. 잠시 후 다시 시도해주세요.'}
                  {chatErrorType === 'server' && 'AI 서비스에 일시적인 문제가 생겼어요.'}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiChat(false)}
                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-3 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={fetchAiChat}
                  disabled={!chatInput.trim()}
                  className="flex-[2] rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  질문하기
                </button>
              </div>
              {chatMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setChatMessages([]);
                    setStreamingAnswer('');
                    setChatInput('');
                    setChatErrorType(null);
                    setPiiWarning(null);
                  }}
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
    </>
  );
}

function MissingResult() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-[16px] font-bold text-[var(--color-text)]">저장된 점검 결과가 없어요</p>
      <p className="mb-6 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        민감한 응답이 주소에 남지 않도록 결과는 이 브라우저 탭 안에서만 불러옵니다. 점검을 다시 진행해주세요.
      </p>
      <Link
        href="/respect"
        className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
      >
        점검 시작하기
      </Link>
    </div>
  );
}
