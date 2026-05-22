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

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
        tabIndex={hideHeader ? -1 : undefined}
        onKeyDown={handleDialogKeyDown}
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
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
