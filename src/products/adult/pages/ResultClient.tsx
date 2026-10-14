'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { styleTypes, computeSixAxisScores, type StyleType } from '@/diagnostics/adult-integrity';
import StyleRadarChart from '@/components/StyleRadarChart';
import { TEST_START_TIME_KEY, TEST_REFERRER_KEY, MAX_HISTORY_MESSAGES } from '@/lib/constants';
import { AnalyzingScreen } from '@/components/LoadingFairy';
import { useAiChat } from '@/hooks/useAiChat';
import { getClientIdHeader } from '@/lib/client-id';
import { formatNamedResultTitle, normalizeDisplayName } from '@/lib/display-name';
import AiAdviceSheet from '@/components/AiAdviceSheet';
import { AI_CHAT_ENABLED } from '@/data/appVariant';
import { adultCommonArtwork, getAdultResultArtwork } from '@/diagnostics/adult-integrity/artwork';
import { parseAdultResultAnswers } from '@/diagnostics/adult-integrity/result-answers';
import AdultArtwork from '../components/AdultArtwork';
import { AdultIcon } from '../components/AdultIcon';

const RESULT_TABS = [
  { key: 'strength' as const, label: '강점' },
  { key: 'caution' as const, label: '주의' },
  { key: 'tip' as const, label: '팁' },
];

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
  const answers = useMemo(() => parseAdultResultAnswers(answersRaw), [answersRaw]);
  const sixAxis = useMemo(() => answers ? computeSixAxisScores(answers) : undefined, [answers]);
  const displayName = normalizeDisplayName(searchParams.get('name'));

  const chat = useAiChat({ styleKey, historyId, scores });

  const savedRef = useRef(false);
  useEffect(() => {
    if (isNew && !isShared && !savedRef.current && answers) {
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

  const style: StyleType | undefined = Object.prototype.hasOwnProperty.call(styleTypes, styleKey) ? styleTypes[styleKey] : undefined;
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
    Promise.resolve().then(() => navigator.clipboard.writeText(getShareUrl())).then(() => {
      showToast('링크가 복사되었어요');
    }).catch(() => {
      showToast('링크를 복사하지 못했어요. 브라우저의 주소를 복사해 주세요.', 'warning');
    });
  };

  // PII 경고 감지 시 토스트 표시
  useEffect(() => {
    if (chat.piiWarning && chat.piiWarning.length > 0) {
      const types = chat.piiWarning.join(', ');
      showToast(`⚠️ 개인정보(${types})가 감지되어 자동으로 가려졌습니다.`, 'warning');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.piiWarning]);

  const openAiAdvice = useCallback(() => {
    setShowModal(true);
    chat.scrollToBottom();
    if (!chat.chatMaxReached) focusTextarea();
  }, [chat.chatMaxReached, chat.scrollToBottom, focusTextarea]);

  const closeAiAdvice = useCallback(() => {
    if (chat.aiLoading) return;
    setShowModal(false);
    chat.clearInput();
  }, [chat]);

  const resetAiConversation = useCallback(() => {
    chat.deleteChat();
    focusTextarea();
  }, [chat, focusTextarea]);

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
      {analyzing && <AnalyzingScreen onDone={() => setAnalyzing(false)} artwork={<AdultArtwork src={adultCommonArtwork.pause} className="adult-neutral-art" eager />} />}
      <div className={analyzing ? 'hidden' : 'adult-integrity-result animate-fade-in'}>
        <section className="adult-result-hero" aria-label="당신의 청렴 스타일">
          {!isShared ? (
            <button type="button" onClick={handleCopyLink} className="adult-icon-button adult-result-share" aria-label="결과 링크 복사"><AdultIcon name="share" size={19} /></button>
          ) : null}
          <div className="adult-result-title">
            <h1>{displayName && <span className="adult-result-name">'{displayName}'님은</span>}{displayName ? style.name : resultTitle}</h1>
            <p>{style.description}</p>
          </div>
          <div className={`adult-result-visual${isShared ? '' : ' adult-result-visual-with-share'}`}>
            <AdultArtwork src={getAdultResultArtwork(styleKey) ?? adultCommonArtwork.pause} fallback={style.emoji} className="adult-result-art" eager />
          </div>
        </section>
        <div className="adult-result-traits" aria-label="주요 성향">
          {style.subtitle.split('-').map(trait => <span key={trait}>{trait}</span>)}
        </div>
        <section className="adult-result-chart" aria-labelledby="adult-chart-title">
          <h2 id="adult-chart-title">나의 성향</h2>
          {sixAxis ? <StyleRadarChart sixAxis={sixAxis} /> : (
            <p className="adult-result-chart-unavailable">응답 정보가 없어 성향 그래프를 표시할 수 없어요.</p>
          )}
        </section>
        <section aria-label="스타일 해석">
          <div className="adult-result-tabs" role="tablist" aria-label="강점, 주의, 팁">
            {RESULT_TABS.map(({ key, label }, index) => (
              <button key={key} id={'adult-tab-' + key} type="button" role="tab" aria-selected={activeTab === key}
                aria-controls="adult-interpretation" tabIndex={activeTab === key ? 0 : -1} onClick={() => setActiveTab(key)}
                onKeyDown={event => {
                  let next: number | undefined;
                  if (event.key === 'ArrowRight') next = (index + 1) % RESULT_TABS.length;
                  if (event.key === 'ArrowLeft') next = (index + RESULT_TABS.length - 1) % RESULT_TABS.length;
                  if (event.key === 'Home') next = 0;
                  if (event.key === 'End') next = RESULT_TABS.length - 1;
                  if (next !== undefined) {
                    event.preventDefault();
                    setActiveTab(RESULT_TABS[next].key);
                    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
                    tabs?.[next]?.focus();
                  }
                }}>{label}</button>
            ))}
          </div>
          <div id="adult-interpretation" role="tabpanel" aria-labelledby={'adult-tab-' + activeTab} tabIndex={0} className="adult-result-description">
            {activeTab === 'strength' ? style.strength : activeTab === 'caution' ? style.caution : style.tip}
          </div>
        </section>
        {isShared ? (
          <button type="button" onClick={() => router.push('/')} className="adult-primary-action w-full">나도 테스트 해보기 <AdultIcon name="arrow" size={18} /></button>
        ) : (
          <div className="adult-result-actions">
            <button type="button" onClick={() => router.push('/')}>처음으로</button>
            {AI_CHAT_ENABLED && (
              <button type="button" onClick={openAiAdvice}><AdultIcon name="chat" size={18} /> AI 조언
                {chat.chatHistory.length > 0 && <span className="text-[11px] opacity-80">{Math.floor(chat.chatHistory.length / 2)}</span>}
              </button>
            )}
          </div>
        )}

      {toastVisible && (
        <div role="status" aria-live="polite" aria-atomic="true" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-[var(--radius-md)] px-5 py-2.5 text-[13px] font-semibold shadow-lg ${
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
          onStartNewConversation={resetAiConversation}
          maxTurns={MAX_HISTORY_MESSAGES / 2}
          inputRef={textareaRef}
          scrollAnchorRef={chat.scrollAnchorRef}
          placeholder={chat.chatHistory.length > 0 ? '이어서 이야기해 주세요' : '궁금한 상황을 적어 주세요'}
          errorType={chat.aiErrorType}
          piiWarning={chat.piiWarning}
        />
      )}
    </div>
    </>
  );
}
