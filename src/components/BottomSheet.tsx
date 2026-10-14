'use client';

import { useEffect, useId, useRef } from 'react';

export default function BottomSheet({
  title,
  onClose,
  children,
  hideHeader = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;

      // 문서 단위로 잡아서, 포커스가 시트 밖(body 등)으로 빠진 뒤에도 시트 안으로 되돌린다.
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) {
        e.preventDefault();
        sheetRef.current.focus();
        return;
      }

      const index = focusable.indexOf(document.activeElement as HTMLElement);
      const wrap = e.shiftKey ? index <= 0 : index === -1 || index === focusable.length - 1;
      if (wrap) {
        e.preventDefault();
        focusable[e.shiftKey ? focusable.length - 1 : 0].focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else {
      sheetRef.current?.focus();
    }

    return () => {
      previousActiveElement?.focus();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={handleBackdrop}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={hideHeader ? title : undefined}
        aria-labelledby={hideHeader ? undefined : titleId}
        tabIndex={-1}
        className="animate-slide-up flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[20px] bg-[var(--color-bg)] shadow-xl sm:max-h-[82vh] sm:rounded-[20px]"
      >
        {!hideHeader && (
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 id={titleId} className="text-[16px] font-bold text-[var(--color-text)]">{title}</h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="group -mr-1.5 flex h-11 w-11 items-center justify-center rounded-full"
            >
              <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-border)]">
                ✕
              </span>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
