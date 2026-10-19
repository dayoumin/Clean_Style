import { calculateResult, readHistory, readProgress, writeHistory, validAnswers, normalizeDisplayName,
  HISTORY_KEY, PROGRESS_KEY, INSTRUMENT_VERSION, SCORING_VERSION, type SavedResult } from './model';
import type { HistoryEntry } from '@/lib/history';

const PENDING_KEY = 'clean-style-html-pending-v1';
type Pending = SavedResult & { seed: number };
const transient = new Map<string, SavedResult>();
let pendingMemory: Pending | null | undefined;
let progressMemory: { answers: number[]; seed: number } | null | undefined;
const deleted = new Set<string>();
export function notice(message: string) {
  window.dispatchEvent(new CustomEvent('standalone-notice', { detail: message }));
}
function storage() { try { return window.localStorage; } catch { return null; } }
function warn() { notice('이 브라우저에서는 기록을 저장하지 못했어요. 창을 닫기 전에 결과를 이미지로 저장해 주세요.'); }
function pending(): Pending | null {
  if (pendingMemory !== undefined) return pendingMemory;
  try {
    const value = JSON.parse(storage()?.getItem(PENDING_KEY) ?? 'null');
    if (value?.instrumentVersion === INSTRUMENT_VERSION && value.scoringVersion === SCORING_VERSION
      && validAnswers(value.answers, true) && typeof value.id === 'string' && typeof value.name === 'string'
      && Number.isFinite(Date.parse(value.createdAt)) && Number.isInteger(value.seed) && value.seed >= 0 && value.seed < 100000) return value;
  } catch { /* use in-memory state when storage is blocked */ }
  return null;
}
function savePending(value: Pending | null) {
  pendingMemory = value;
  try {
    const target = storage();
    if (!target) throw Error('Storage blocked');
    if (value) target.setItem(PENDING_KEY, JSON.stringify(value));
    else target.removeItem(PENDING_KEY);
  } catch { if (value) warn(); }
}
export function getSaved(id: string): SavedResult | undefined {
  if (deleted.has(id)) return undefined;
  const active = pending();
  // The name step owns the latest draft, including names restored from an older HTML.
  return active?.id === id ? active : transient.get(id) ?? readHistory(storage()).find(entry => entry.id === id);
}
export function getHistory(): HistoryEntry[] {
  return readHistory(storage()).filter(entry => !deleted.has(entry.id)).map(entry => {
    const result = calculateResult(entry.answers);
    return { ...entry, styleKey: result.styleKey, styleName: result.style.name,
      styleEmoji: result.style.emoji, scores: result.scores, chat: [] };
  });
}
export function addHistoryEntry(value: Omit<HistoryEntry, 'id' | 'createdAt' | 'chat'> & { standaloneSeed: number }): HistoryEntry {
  const previous = pending();
  const entry: Pending = previous && previous.seed === value.standaloneSeed && JSON.stringify(previous.answers) === JSON.stringify(value.answers)
    ? previous : { id: crypto.randomUUID(), createdAt: new Date().toISOString(), name: '', answers: [...value.answers],
      seed: value.standaloneSeed, instrumentVersion: INSTRUMENT_VERSION, scoringVersion: SCORING_VERSION };
  transient.set(entry.id, entry);
  savePending(entry);
  if (!writeHistory(storage(), [entry, ...readHistory(storage()).filter(item => item.id !== entry.id)])) warn();
  clearProgress();
  return { ...value, ...entry, chat: [] };
}
export function deleteHistoryEntry(id: string): boolean {
  if (!writeHistory(storage(), readHistory(storage()).filter(entry => entry.id !== id))) {
    notice('기록을 삭제하지 못했어요. 다시 시도해 주세요.');
    return false;
  }
  transient.delete(id); deleted.add(id);
  if (pending()?.id === id) savePending(null);
  return true;
}
export function finishResult(id: string, name: string) {
  const entry = getSaved(id);
  if (!entry) return;
  const updated = { ...entry, name: normalizeDisplayName(name) };
  transient.set(id, updated);
  if (!writeHistory(storage(), [updated, ...readHistory(storage()).filter(item => item.id !== id)])) warn();
  if (pending()?.id === id) savePending(null);
}
export function openResult(id: string, name?: string): SavedResult | undefined {
  const entry = getSaved(id);
  if (!entry) return undefined;
  // Opening this completed test from history is also a completion action.
  // Viewing a different old result must preserve the current draft and progress.
  if (name !== undefined || pending()?.id === id) finishResult(id, name ?? entry.name);
  return getSaved(id);
}
export function rememberName(name: string) {
  const value = pending();
  if (value) savePending({ ...value, name: normalizeDisplayName(name) });
}
export function loadProgress() {
  const value = pending();
  if (value) return { answers: value.answers, seed: value.seed, name: value.name };
  return progressMemory !== undefined ? progressMemory : readProgress(storage()); // Earlier HTML files remain compatible.
}
export function clearProgress() {
  progressMemory = null;
  try { storage()?.removeItem(PROGRESS_KEY); } catch { /* memory-only use */ }
}
export function saveProgress(answers: number[], seed: number) {
  if (!answers.length) { clearProgress(); return; }
  if (!validAnswers(answers, false)) return;
  progressMemory = { answers: [...answers], seed };
  try {
    const target = storage();
    if (!target) throw Error('Storage blocked');
    target.setItem(PROGRESS_KEY, JSON.stringify({ answers, seed, instrumentVersion: INSTRUMENT_VERSION, scoringVersion: SCORING_VERSION }));
  } catch { warn(); }
}
export function startNew() { savePending(null); clearProgress(); }
export { HISTORY_KEY, PROGRESS_KEY };
