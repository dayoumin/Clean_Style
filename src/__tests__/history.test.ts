import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHistory } from '@/lib/history';

const HISTORY_KEY = 'integrity-history';

function createLocalStorage() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    },
  };
}

const baseHistoryEntry = {
  id: 'old-1',
  createdAt: '2026-05-22T00:00:00.000Z',
  styleKey: 'principle-transparent-independent',
  styleName: '원칙을 중시하는 소신 수호자',
  styleEmoji: '🧭',
  scores: { principle: 5, transparency: 3, independence: 1 },
  answers: [0, 1, 2],
};

describe('history storage normalization', () => {
  let localStorageMock: ReturnType<typeof createLocalStorage>;

  beforeEach(() => {
    localStorageMock = createLocalStorage();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('crypto', { randomUUID: () => 'generated-id' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('chat이 없는 기존 기록을 빈 대화 배열로 보정한다', () => {
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify([baseHistoryEntry]));

    const history = getHistory();

    expect(history).toHaveLength(1);
    expect(history[0].chat).toEqual([]);
    expect(JSON.parse(localStorageMock.getItem(HISTORY_KEY) ?? '[]')[0].chat).toEqual([]);
  });

  it('깨진 기록은 히스토리에서 제외한다', () => {
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify([
      baseHistoryEntry,
      { ...baseHistoryEntry, id: 'broken', scores: { principle: 'bad' } },
    ]));

    expect(getHistory()).toHaveLength(1);
  });
});
