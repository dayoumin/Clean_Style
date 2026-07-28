'use client';

import { type RefObject } from 'react';
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
  showComposer: boolean;
  onShowComposer: () => void;
  onHideComposer: () => void;
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
  showComposer,
  onShowComposer,
  onHideComposer,
  inputRef,
  scrollAnchorRef,
  placeholder,
  notice,
  errorType = null,
  piiWarning = null,
  rows = 6,
  maxLength = MAX_QUESTION_LENGTH,
  closeLabel = '닫기',
  submitLabel = '질문하기',
}: AiAdviceSheetProps) {
  const hasMessages = messages.length > 0;
  const canSubmit = inputValue.trim().length > 0;

  return (
    <BottomSheet title={title} onClose={onClose} hideHeader>
      {loading ? (
        <>
          <div className={SCROLL_AREA}>
            <ChatBubbles messages={messages} />
            {currentUserMessage && (
              <ChatBubbles messages={[{ role: 'user', content: currentUserMessage }]} />
            )}
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
            <div ref={scrollAnchorRef} />
          </div>
          <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-3">
            <button
              type="button"
              onClick={onAbort}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
            >
              중단
            </button>
          </div>
        </>
      ) : (
        <>
          {hasMessages && (
            <div className={SCROLL_AREA}>
              <ChatBubbles messages={messages} />
              <div ref={scrollAnchorRef} />
            </div>
          )}
          {showComposer ? (
            <div className={`shrink-0 space-y-3 px-5 pb-3 ${hasMessages ? 'border-t border-[var(--color-border)] pt-3' : 'pt-5'}`}>
              {notice && (
                <p className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  {notice}
                </p>
              )}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (canSubmit) onSubmit();
                    }
                  }}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 pr-14 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-accent)]"
                  rows={rows}
                />
                <span className="absolute bottom-2 right-3 text-[11px] text-[var(--color-text-muted)]">
                  {inputValue.length}/{maxLength}
                </span>
              </div>
              {piiWarning && piiWarning.length > 0 && (
                <p className="text-[12px] leading-relaxed text-amber-600">
                  개인정보({piiWarning.join(', ')})가 감지되어 자동으로 가렸습니다.
                </p>
              )}
              {errorType && (
                <p className="text-[13px] text-red-500">
                  {errorType === 'network' && '인터넷 연결을 확인해주세요.'}
                  {errorType === 'rate-limit' && 'AI 질문은 1분에 5번까지 가능해요. 잠시 후 다시 시도해주세요.'}
                  {errorType === 'shared-rate-limit' && '같은 네트워크에서 AI 요청이 많아요. 잠시 후 다시 시도해주세요.'}
                  {errorType === 'server' && 'AI 서비스에 일시적인 문제가 생겼어요.'}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={hasMessages ? onHideComposer : onClose}
                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-3 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                >
                  {closeLabel}
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className="flex-[2] rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitLabel}
                </button>
              </div>
              {hasMessages && onDeleteConversation && (
                <button
                  type="button"
                  onClick={onDeleteConversation}
                  className="w-full py-2 text-[12px] text-[var(--color-text-muted)] hover:text-red-500"
                >
                  대화 지우기
                </button>
              )}
            </div>
          ) : (
            <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-5 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-3 text-[13px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
                >
                  {closeLabel}
                </button>
                <button
                  type="button"
                  onClick={onShowComposer}
                  className="flex-[2] rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  {submitLabel}
                </button>
              </div>
              {hasMessages && onDeleteConversation && (
                <button
                  type="button"
                  onClick={onDeleteConversation}
                  className="w-full py-2 text-[12px] text-[var(--color-text-muted)] hover:text-red-500"
                >
                  대화 지우기
                </button>
              )}
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
