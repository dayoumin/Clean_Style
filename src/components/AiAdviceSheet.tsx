'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import BottomSheet from '@/components/BottomSheet';
import { MAX_QUESTION_LENGTH } from '@/lib/constants';

export type AiAdviceMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiAdviceErrorType = 'network' | 'rate-limit' | 'shared-rate-limit' | 'server' | null;

const SCROLL_AREA = 'flex-1 space-y-3 overflow-y-auto px-5 py-4';

function ChatBubbles({ messages }: { messages: AiAdviceMessage[] }) {
  if (messages.length === 0) return null;

  return (
    <>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[14px] leading-relaxed ${
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

interface AiAdviceSheetProps {
  title?: string;
  loading: boolean;
  messages: AiAdviceMessage[];
  currentUserMessage?: string;
  streamingAnswer?: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onAbort: () => void;
  onClose: () => void;
  onDeleteConversation?: () => void;
  onStartNewConversation?: () => void;
  maxTurns?: number;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  scrollAnchorRef: RefObject<HTMLDivElement | null>;
  placeholder: string;
  notice?: string | null;
  errorType?: AiAdviceErrorType;
  piiWarning?: string[] | null;
  rows?: number;
  maxLength?: number;
  closeLabel?: string;
  submitLabel?: string;
}

export default function AiAdviceSheet({
  title = 'AI 조언',
  loading,
  messages,
  currentUserMessage = '',
  streamingAnswer = '',
  inputValue,
  onInputChange,
  onSubmit,
  onAbort,
  onClose,
  onDeleteConversation,
  onStartNewConversation,
  maxTurns,
  inputRef,
  scrollAnchorRef,
  placeholder,
  notice,
  errorType = null,
  piiWarning = null,
  rows = 4,
  maxLength = MAX_QUESTION_LENGTH,
  closeLabel = '닫기',
  submitLabel = '보내기',
}: AiAdviceSheetProps) {
  const hasMessages = messages.length > 0;
  const limitReached = maxTurns !== undefined && messages.length >= maxTurns * 2;
  const lastTurn = maxTurns !== undefined && !limitReached && messages.length >= (maxTurns - 1) * 2;
  const canSubmit = !loading && !limitReached && inputValue.trim().length > 0;
  // 'delete' = 대화 지우기, 'restart' = 한도 도달 후 새 대화 시작. 둘 다 저장된 대화를 지운다.
  const [confirmAction, setConfirmAction] = useState<'delete' | 'restart' | null>(null);
  const lastConfirmRef = useRef<'delete' | 'restart' | null>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const confirmTitleId = useId();
  const confirmDescriptionId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const newConversationRef = useRef<HTMLButtonElement>(null);
  const limitNotice = limitReached
    ? `한 대화에서 ${maxTurns}번의 질문을 마쳤어요. 새 대화를 시작해 주세요.`
    : lastTurn ? '이어서 질문은 1번 더 가능해요.' : null;

  // 포커스된 컨트롤이 다른 컨트롤로 바뀌면 포커스가 body로 빠지므로 새 컨트롤로 옮긴다.
  useEffect(() => {
    if (confirmAction) {
      lastConfirmRef.current = confirmAction;
      confirmDialogRef.current?.showModal();
      confirmCancelRef.current?.focus();
      return;
    }
    const last = lastConfirmRef.current;
    lastConfirmRef.current = null;
    if (!last || document.activeElement !== document.body) return;
    const previousControl = last === 'restart' ? newConversationRef.current : deleteButtonRef.current;
    (previousControl ?? inputRef.current)?.focus();
  }, [confirmAction, inputRef]);

  useEffect(() => {
    if (!confirmAction) return;
    const handleConfirmationKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return;
      // 상위 시트의 document 키 처리보다 먼저 확인 팝업에서 처리한다.
      event.stopImmediatePropagation();
      event.preventDefault();
      if (event.key === 'Escape') {
        if (!event.isComposing && event.keyCode !== 229) setConfirmAction(null);
        return;
      }
      const buttons = Array.from(confirmDialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
      if (!buttons.length) return;
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.shiftKey ? (index <= 0 ? buttons.length - 1 : index - 1) : (index + 1) % buttons.length;
      buttons[next].focus();
    };
    document.addEventListener('keydown', handleConfirmationKey, true);
    return () => document.removeEventListener('keydown', handleConfirmationKey, true);
  }, [confirmAction]);

  useEffect(() => {
    if (!limitReached) return;
    const active = document.activeElement;
    if (!active || active === document.body || active.getAttribute('role') === 'dialog') {
      newConversationRef.current?.focus();
    }
  }, [limitReached]);

  return (
    <BottomSheet title={title} onClose={onClose} hideHeader>
      <div className="relative flex min-h-0 max-h-[inherit] flex-col">
        {!loading && hasMessages && !limitReached && onDeleteConversation && (
          <button ref={deleteButtonRef} type="button" onClick={() => setConfirmAction('delete')} aria-label="대화 지우기" title="대화 지우기" className="absolute top-3 right-20 z-10 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-red-700">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg>
          </button>
        )}
        <button type="button" onClick={onClose} disabled={loading} aria-label={closeLabel} title={closeLabel} className={`absolute right-7 z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] disabled:opacity-40 ${hasMessages || loading || limitNotice ? 'top-3' : 'top-5'}`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      {(hasMessages || loading) && (
          <div className={`${SCROLL_AREA} pt-16`} role="log" aria-label="대화 내용" aria-live={loading ? 'off' : 'polite'}>
            <ChatBubbles messages={messages} />
            {loading && currentUserMessage && (
              <ChatBubbles messages={[{ role: 'user', content: currentUserMessage }]} />
            )}
            {loading && (streamingAnswer ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-3.5 py-2.5">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                    {streamingAnswer}
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[var(--color-primary-accent)] align-text-bottom" />
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <span className="mb-3 inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent" />
                <p className="text-[13px] text-[var(--color-text-secondary)]">질문을 살펴보고 있어요...</p>
              </div>
            ))}
            <div ref={scrollAnchorRef} />
          </div>
      )}
          {limitNotice && (
            <p role="status" className={`shrink-0 px-5 py-2 text-center text-[12px] leading-relaxed text-[var(--color-text-secondary)] ${!hasMessages && !loading ? 'pt-16' : ''}`}>{limitNotice}</p>
          )}
          {!limitReached ? (
            <div className={`shrink-0 space-y-3 px-5 pb-3 ${hasMessages ? 'border-t border-[var(--color-border)] pt-3' : notice && !loading && !limitNotice ? 'pt-16' : 'pt-3'}`}>
              {notice && (
                <p className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  {notice}
                </p>
              )}
              <form
                className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-2 focus-within:border-[var(--color-primary-accent)]"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canSubmit) {
                    setConfirmAction(null);
                    onSubmit();
                  }
                }}
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      if (canSubmit) {
                        setConfirmAction(null);
                        onSubmit();
                      }
                    }
                  }}
                  maxLength={maxLength}
                  readOnly={loading}
                  placeholder={placeholder}
                  aria-label="AI에게 질문할 내용"
                  className="min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[16px] leading-relaxed text-[var(--color-text)] placeholder:text-[14px] placeholder:text-[var(--color-text-muted)] outline-none! shadow-none! read-only:opacity-60"
                  rows={rows}
                />
                {loading ? (
                  <button type="button" onClick={onAbort} className="min-h-11 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]">중단</button>
                ) : (
                  <button type="submit" disabled={!canSubmit} aria-label={submitLabel} title={submitLabel} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white enabled:hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-45">
                    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3" /></svg>
                  </button>
                )}
              </form>
              {piiWarning && piiWarning.length > 0 && (
                <p className="text-[13px] leading-relaxed text-amber-800">
                  개인정보({piiWarning.join(', ')})가 감지되어 자동으로 가렸습니다.
                </p>
              )}
              {errorType && (
                <p role="alert" className="text-[13px] text-red-700">
                  {errorType === 'network' && '인터넷 연결을 확인해주세요.'}
                  {errorType === 'rate-limit' && 'AI 질문은 1분에 5번까지 가능해요. 잠시 후 다시 시도해주세요.'}
                  {errorType === 'shared-rate-limit' && '같은 네트워크에서 AI 요청이 많아요. 잠시 후 다시 시도해주세요.'}
                  {errorType === 'server' && 'AI 서비스에 일시적인 문제가 생겼어요. 잠시 후 다시 전송해 주세요.'}
                </p>
              )}
            </div>
          ) : (
            <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-5 py-3">
                <button
                  ref={newConversationRef}
                  type="button"
                  onClick={() => setConfirmAction('restart')}
                  disabled={!onStartNewConversation || confirmAction !== null}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  새 대화 시작
                </button>
            </div>
          )}
      {!loading && confirmAction && (
        <dialog
          ref={confirmDialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={confirmTitleId}
          aria-describedby={confirmDescriptionId}
          onCancel={(event) => {
            event.preventDefault();
            setConfirmAction(null);
          }}
          className="fixed inset-0 m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-bg)] p-5 text-[var(--color-text)] shadow-xl backdrop:bg-black/35"
        >
            <h2 id={confirmTitleId} className="text-[18px] font-bold leading-snug">
              {confirmAction === 'restart' ? '지금 대화를 지우고 새로 시작할까요?' : '대화를 지울까요?'}
            </h2>
            <p id={confirmDescriptionId} className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              AI와 나눈 대화가 지워지며 복구할 수 없어요. 진단 결과는 그대로 유지돼요.
            </p>
            <div className="mt-6 flex gap-3">
              <button ref={confirmCancelRef} type="button" onClick={() => setConfirmAction(null)} className="min-h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-[14px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]">취소</button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === 'restart') onStartNewConversation?.();
                  else onDeleteConversation?.();
                }}
                className="min-h-11 flex-1 rounded-[var(--radius-md)] bg-red-700 px-4 text-[14px] font-semibold text-white hover:bg-red-800"
              >
                {confirmAction === 'restart' ? '새로 시작' : '지우기'}
              </button>
            </div>
        </dialog>
      )}
      </div>
    </BottomSheet>
  );
}
