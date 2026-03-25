'use client';

import { useEffect } from 'react';

export default function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="animate-slide-up flex w-full max-w-md flex-col rounded-t-[20px] sm:rounded-[20px] bg-[var(--color-bg)] shadow-xl max-h-[85dvh] sm:max-h-[70vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-[16px] font-bold text-[var(--color-text)]">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
