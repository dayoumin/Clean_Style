'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHistory, deleteHistoryEntry, type HistoryEntry } from '@/lib/history';
import { buildResultUrl } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';
import { FluentEmoji } from '@/components/FluentEmoji';

const PREVIEW_COUNT = 2;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function HistoryItem({
  entry,
  onView,
  onDelete,
}: {
  entry: HistoryEntry;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2">
      <FluentEmoji emoji={entry.styleEmoji} size={24} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--color-text)]">
          {entry.styleName}
          <span className="ml-1.5 text-[11px] font-normal text-[var(--color-text-muted)]">
            {formatDate(entry.createdAt)}
            {entry.chat.length > 0 && (<> · <FluentEmoji emoji="💬" size={12} className="inline align-baseline" />{Math.floor(entry.chat.length / 2)}</>)}
          </span>
        </p>
      </div>
      <button
        onClick={onView}
        className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-muted)]"
      >
        보기
      </button>
      <button
        onClick={onDelete}
        className="rounded-full px-2 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-red-500"
      >
        ✕
      </button>
    </div>
  );
}

export default function HistoryList() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (entries.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-1.5 text-center">
        <span className="text-2xl opacity-60">🧭</span>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          업무 중 만나는 애매한 상황,
          <br />
          나라면 어떻게 할까?
        </p>
      </div>
    );
  }

  const handleView = (entry: HistoryEntry) => {
    setShowModal(false);
    router.push(buildResultUrl(entry.styleKey, entry.scores, entry.answers, entry.id));
  };

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    if (next.length <= PREVIEW_COUNT) setShowModal(false);
  };

  const hasMore = entries.length > PREVIEW_COUNT;

  return (
    <>
      <div className="mt-6 w-full">
        <p className="mb-2 text-[12px] font-bold text-[var(--color-text-muted)]">
          이전 결과
        </p>
        <div className="space-y-2">
          {entries.slice(0, PREVIEW_COUNT).map(entry => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              onView={() => handleView(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] py-2.5 text-center text-[12px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-card)]"
          >
            이전 결과 더보기 ({entries.length - PREVIEW_COUNT}건)
          </button>
        )}
      </div>

      {showModal && (
        <BottomSheet title="이전 결과" onClose={() => setShowModal(false)}>
          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
            <p className="text-center text-[11px] text-[var(--color-text-muted)]">
              최대 10건까지 저장되며, 초과 시 오래된 기록은 자동 삭제됩니다.
            </p>
            {entries.map(entry => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onView={() => handleView(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
