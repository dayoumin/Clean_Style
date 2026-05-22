// 테스트 결과 + AI 대화 히스토리 관리 (localStorage)

const HISTORY_KEY = 'integrity-history';
const MAX_ENTRIES = 10;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  styleKey: string;
  styleName: string;
  styleEmoji: string;
  scores: { principle: number; transparency: number; independence: number };
  answers: number[];
  chat: ChatMessage[];
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeScores(value: unknown): HistoryEntry['scores'] | null {
  if (!isRecord(value)) return null;
  const { principle, transparency, independence } = value;

  if (
    typeof principle !== 'number'
    || typeof transparency !== 'number'
    || typeof independence !== 'number'
  ) {
    return null;
  }

  return { principle, transparency, independence };
}

function normalizeChat(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value.filter((message): message is ChatMessage => (
    isRecord(message)
    && (message.role === 'user' || message.role === 'assistant')
    && typeof message.content === 'string'
  ));
}

function normalizeHistoryEntry(value: unknown): HistoryEntry | null {
  if (!isRecord(value)) return null;

  const scores = normalizeScores(value.scores);
  if (!scores) return null;

  if (
    typeof value.styleKey !== 'string'
    || typeof value.styleName !== 'string'
    || typeof value.styleEmoji !== 'string'
    || !Array.isArray(value.answers)
    || !value.answers.every(answer => typeof answer === 'number')
  ) {
    return null;
  }

  return {
    id: typeof value.id === 'string' && value.id ? value.id : generateId(),
    createdAt: typeof value.createdAt === 'string' && value.createdAt ? value.createdAt : new Date().toISOString(),
    styleKey: value.styleKey,
    styleName: value.styleName,
    styleEmoji: value.styleEmoji,
    scores,
    answers: value.answers,
    chat: normalizeChat(value.chat),
  };
}

export function getHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    const entries = data
      .map(normalizeHistoryEntry)
      .filter((entry): entry is HistoryEntry => entry !== null)
      .slice(0, MAX_ENTRIES);

    if (JSON.stringify(entries) !== JSON.stringify(data)) {
      saveHistory(entries);
    }

    return entries;
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): boolean {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    return true;
  } catch {
    // 용량 초과 시 가장 오래된 항목 제거 후 재시도
    if (entries.length > 1) {
      return saveHistory(entries.slice(0, -1));
    }
    return false;
  }
}

export function addHistoryEntry(
  params: Omit<HistoryEntry, 'id' | 'createdAt' | 'chat'>,
): HistoryEntry | null {
  const entry: HistoryEntry = {
    ...params,
    id: generateId(),
    createdAt: new Date().toISOString(),
    chat: [],
  };
  const entries = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  if (!saveHistory(entries)) return null;
  return entry;
}

export function getHistoryEntry(id: string): HistoryEntry | undefined {
  return getHistory().find(e => e.id === id);
}

export function deleteHistoryEntry(id: string): boolean {
  const entries = getHistory().filter(e => e.id !== id);
  return saveHistory(entries);
}

export function updateChat(id: string, chat: ChatMessage[]): boolean {
  const entries = getHistory();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  entries[idx].chat = chat;
  return saveHistory(entries);
}

export function clearChat(id: string): boolean {
  return updateChat(id, []);
}
