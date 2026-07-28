'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { styleTypes, computeSixAxisScores, type StyleType } from '@/diagnostics/adult-integrity';
import StyleRadarChart from '@/components/StyleRadarChart';
import { TEST_START_TIME_KEY, TEST_REFERRER_KEY } from '@/lib/constants';
import { AnalyzingScreen } from '@/components/LoadingFairy';
import { useAiChat } from '@/hooks/useAiChat';
import { FluentEmoji } from '@/components/FluentEmoji';
import { LeafLineArt } from '@/components/LeafLineArt';
import { getClientIdHeader } from '@/lib/client-id';
import { formatNamedResultTitle, normalizeDisplayName } from '@/lib/display-name';
import { cn } from '@/lib/utils';
import AiAdviceSheet from '@/components/AiAdviceSheet';
import { AI_CHAT_ENABLED } from '@/data/appVariant';

export default function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === '1';
  const isShared = !searchParams.has('new') && !searchParams.has('hid');
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'default' | 'warning'>('default');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [activeTab, setActiveTab] = useState<'strength' | 'caution' | 'tip'>('strength');
  const [showAiComposer, setShowAiComposer] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusTextarea = useCallback(() => {
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, []);

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
  const displayName = normalizeDisplayName(searchParams.get('name'));

  const chat = useAiChat({ styleKey, historyId, scores });

  const savedRef = useRef(false);
  useEffect(() => {
    if (isNew && !isShared && !savedRef.current && answers.length > 0) {
      savedRef.current = true;
      const startTime = Number(sessionStorage.getItem(TEST_START_TIME_KEY) || 0);
      const durationSec = startTime ? Math.round((Date.now() - startTime) / 1000) : undefined;
      const referrer = sessionStorage.getItem(TEST_REFERRER_KEY) || undefined;
      sessionStorage.removeItem(TEST_START_TIME_KEY);
      sessionStorage.removeItem(TEST_REFERRER_KEY);
      fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getClientIdHeader() },
        body: JSON.stringify({ answers, durationSec, referrer }),
        keepalive: true,
      }).catch(() => {});
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      window.history.replaceState(null, '', url.toString());
    }
  }, [isNew, isShared, answers]);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  const style: StyleType | undefined = styleTypes[styleKey];
  const resultTitle = style ? formatNamedResultTitle(displayName, style.name) : '';

  const getShareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('hid');
    url.searchParams.delete('new');
    return url.toString();
  };

  const showToast = (msg: string, type: 'default' | 'warning' = 'default') => {
    clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), type === 'warning' ? 4000 : 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl()).then(() => {
      showToast('링크가 복사되었어요');
    }).catch(() => {});
  };

  // PII 경고 감지 시 토스트 표시
  useEffect(() => {
    if (chat.piiWarning && chat.piiWarning.length > 0) {
      const types = chat.piiWarning.join(', ');
      showToast(`⚠️ 개인정보(${types})가 감지되어 자동으로 가려졌습니다.`, 'warning');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.piiWarning]);

  useEffect(() => {
    if (showModal && !chat.aiLoading && chat.aiAnswer) {
      setShowAiComposer(false);
    }
  }, [chat.aiAnswer, chat.aiLoading, showModal]);

  const openAiAdvice = useCallback(() => {
    const shouldShowComposer = chat.chatHistory.length === 0;
    setShowModal(true);
    setShowAiComposer(shouldShowComposer);
    chat.scrollToBottom();
    if (shouldShowComposer) focusTextarea();
  }, [chat.chatHistory.length, chat.scrollToBottom, focusTextarea]);

  const closeAiAdvice = useCallback(() => {
    if (chat.aiLoading) return;
    setShowModal(false);
    setShowAiComposer(false);
    chat.clearInput();
  }, [chat]);

  const resetAiConversation = useCallback(() => {
    chat.deleteChat();
    setShowAiComposer(true);
    focusTextarea();
  }, [chat, focusTextarea]);

  const showComposer = useCallback(() => {
    chat.clearInput();
    setShowAiComposer(true);
    focusTextarea();
  }, [chat, focusTextarea]);

  const hideComposer = useCallback(() => {
    chat.clearInput();
    setShowAiComposer(false);
  }, [chat]);

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

  return (
    <>
      {analyzing && <AnalyzingScreen onDone={() => setAnalyzing(false)} />}
      <div className={analyzing ? 'hidden' : 'flex flex-col animate-fade-in'}>
      <div className="flex-1 animate-slide-up">
        <div className="result-gradient relative z-0 mb-2 overflow-hidden rounded-[var(--radius-xl)] px-6 pt-12 pb-4 text-center text-white shadow-lg">
          <LeafLineArt className="pointer-events-none absolute -right-12 top-2 h-40 w-40 text-white opacity-[0.10]" />
          <LeafLineArt className="pointer-events-none absolute -left-16 bottom-[-52px] h-44 w-44 rotate-[-18deg] text-white opacity-[0.08]" />
          <span className="absolute left-4 top-3 z-20 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/80 backdrop-blur-sm">
            청렴 스타일
          </span>
          {!isShared && (
            <button
              onClick={handleCopyLink}
              className="absolute right-4 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm hover:bg-white/25 transition-colors"
              aria-label="결과 링크 복사"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          )}
          <div className="relative z-10">
            <div className="mb-2 flex justify-center"><FluentEmoji emoji={style.emoji} size={56} /></div>
            <h1
              className={cn(
                'mb-1 font-extrabold leading-tight tracking-tight [word-break:keep-all]',
                displayName ? 'text-[22px]' : 'text-[24px]',
              )}
            >
              {displayName ? (
                <>
                  <span className="text-white">&apos;</span>
                  <span className="text-[#fde68a]">{displayName}</span>
                  <span className="text-white">&apos;</span>
                  {`님은 ${style.name}`}
                </>
              ) : resultTitle}
            </h1>
            <p className="text-[13px] leading-relaxed text-white/80">{style.description}</p>
          </div>
        </div>

        <div className="result-card px-3 pb-1 pt-1">
          <StyleRadarChart sixAxis={sixAxis} />
        </div>

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
              className={`${AI_CHAT_ENABLED ? 'flex-1' : 'w-full'} rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-primary-soft)] py-3 text-center text-[13px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)]`}
            >
              처음으로
            </button>
            {AI_CHAT_ENABLED && (
              <button
                onClick={openAiAdvice}
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] py-3 text-center text-[13px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-soft)]"
              >
                AI 조언
                {chat.chatHistory.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 text-[11px] text-white">
                    {Math.floor(chat.chatHistory.length / 2)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {toastVisible && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-[var(--radius-md)] px-5 py-2.5 text-[13px] font-semibold shadow-lg ${
          toastType === 'warning'
            ? 'bg-amber-600 text-white'
            : 'bg-[var(--color-primary)] text-white'
        }`}>
          {toastMessage}
        </div>
      )}

      {!isShared && AI_CHAT_ENABLED && showModal && (
        <AiAdviceSheet
          title="AI 조언"
          loading={chat.aiLoading}
          messages={chat.chatHistory}
          currentUserMessage={chat.aiLoading ? chat.userContext : ''}
          streamingAnswer={chat.aiAnswer}
          inputValue={chat.userContext}
          onInputChange={chat.setUserContext}
          onSubmit={chat.fetchAnswer}
          onAbort={chat.abortAnswer}
          onClose={closeAiAdvice}
          onDeleteConversation={resetAiConversation}
          showComposer={showAiComposer}
          onShowComposer={showComposer}
          onHideComposer={hideComposer}
          inputRef={textareaRef}
          scrollAnchorRef={chat.scrollAnchorRef}
          placeholder={chat.chatHistory.length > 0 ? '이어서 질문해주세요' : '궁금한 상황을 자유롭게 질문해주세요'}
          errorType={chat.aiErrorType}
          piiWarning={chat.piiWarning}
        />
      )}
    </div>
    </>
  );
}
