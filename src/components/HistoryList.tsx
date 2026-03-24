'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHistory, deleteHistoryEntry, type HistoryEntry } from '@/lib/history';
import { buildResultUrl } from '@/lib/utils';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function HistoryList() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
    setMounted(true);
  }, []);

  if (!mounted || entries.length === 0) return null;

  const handleView = (entry: HistoryEntry) => {
    router.push(buildResultUrl(entry.styleKey, entry.scores, entry.answers, entry.id));
  };

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="mt-6 w-full">
      <p className="mb-3 text-[13px] font-bold text-[var(--color-text-muted)]">
        이전 결과
      </p>
      <div className="space-y-2">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3"
          >
            <span className="text-xl">{entry.styleEmoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--color-text)]">
                {entry.styleName}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {formatDate(entry.createdAt)}
                {entry.chat.length > 0 && ` · 💬${Math.floor(entry.chat.length / 2)}`}
              </p>
            </div>
            <button
              onClick={() => handleView(entry)}
              className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-muted)]"
            >
              보기
            </button>
            <button
              onClick={() => handleDelete(entry.id)}
              className="rounded-full px-2 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
