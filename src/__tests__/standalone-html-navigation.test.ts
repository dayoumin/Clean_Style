import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateResult, questions, HISTORY_KEY, PROGRESS_KEY } from '@/products/adult/standalone/model';

let values: Map<string, string>;
let denyWrites: boolean;
beforeEach(() => {
  vi.resetModules(); values = new Map(); denyWrites = false;
  vi.stubGlobal('window', {
    dispatchEvent: vi.fn(),
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem(key: string, value: string) { if (denyWrites) throw Error('QuotaExceededError'); values.set(key, value); },
      removeItem(key: string) { if (denyWrites) throw Error('SecurityError'); values.delete(key); },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
function completion(seed = 42) {
  const answers = questions.map(() => 0);
  const result = calculateResult(answers);
  return { answers, standaloneSeed: seed, scores: result.scores, styleKey: result.styleKey,
    styleName: result.style.name, styleEmoji: result.style.emoji };
}
describe('HTML result lifecycle', () => {
  it('restores the unfinished name step without creating another history entry', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion());
    runtime.rememberName('기록 주인');
    vi.resetModules(); // A file reload loses memory, but preserves browser storage.
    const reloaded = await import('@/products/adult/standalone/runtime');
    expect(reloaded.loadProgress()).toMatchObject({ answers: completion().answers, name: '기록 주인' });
    const restored = reloaded.addHistoryEntry(completion());
    expect(restored.id).toBe(first.id);
    expect(reloaded.getHistory()).toHaveLength(1);
    reloaded.finishResult(restored.id, '기록 주인');
    expect(reloaded.loadProgress()).toBeNull();
    expect(values.has(PROGRESS_KEY)).toBe(false);
    expect(reloaded.getSaved(first.id)?.name).toBe('기록 주인');
    expect(reloaded.getHistory()).toHaveLength(1);
  });
  it('does not clear a different unfinished test when an old result is viewed', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion()); runtime.finishResult(first.id, '');
    runtime.saveProgress([0, 1], 51);
    expect(runtime.openResult(first.id)).toBeDefined();
    expect(runtime.loadProgress()).toEqual({ answers: [0, 1], seed: 51 });
  });
  it('keeps the entered name and completes a pending result opened through history', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion());
    runtime.rememberName('홍길동');
    expect(runtime.openResult(first.id)?.name).toBe('홍길동');
    expect(runtime.loadProgress()).toBeNull();
    expect(runtime.getHistory()).toHaveLength(1);
    vi.resetModules();
    const reloaded = await import('@/products/adult/standalone/runtime');
    expect(reloaded.getSaved(first.id)?.name).toBe('홍길동');
    expect(reloaded.loadProgress()).toBeNull();
  });
  it('recovers a pending name saved by the previous HTML when history is opened after reload', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion());
    runtime.rememberName('복원 이름');
    vi.resetModules();
    const reloaded = await import('@/products/adult/standalone/runtime');
    expect(reloaded.openResult(first.id)?.name).toBe('복원 이름');
    expect(reloaded.loadProgress()).toBeNull();
    expect(JSON.parse(values.get(HISTORY_KEY)!)[0].name).toBe('복원 이름');
  });
  it('keeps another completed name draft while opening an older result', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion()); runtime.finishResult(first.id, '이전 이름');
    const second = runtime.addHistoryEntry(completion(43)); runtime.rememberName('진행 이름');
    expect(runtime.openResult(first.id)?.name).toBe('이전 이름');
    expect(runtime.loadProgress()).toMatchObject({ seed: 43, name: '진행 이름' });
    expect(runtime.openResult(second.id)?.name).toBe('진행 이름');
    expect(runtime.loadProgress()).toBeNull();
  });
  it('blocks stale result navigation after deletion, including cached records', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion()); runtime.finishResult(first.id, '');
    expect(runtime.deleteHistoryEntry(first.id)).toBe(true);
    expect(runtime.getHistory()).toEqual([]);
    expect(runtime.getSaved(first.id)).toBeUndefined();
  });
  it('keeps the record and pending state when deletion fails', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    const first = runtime.addHistoryEntry(completion());
    const before = values.get(HISTORY_KEY);
    denyWrites = true;
    expect(runtime.deleteHistoryEntry(first.id)).toBe(false);
    expect(values.get(HISTORY_KEY)).toBe(before);
    expect(runtime.getSaved(first.id)).toBeDefined();
    expect(runtime.loadProgress()?.answers).toHaveLength(15);
  });
  it('keeps a current result exportable in memory when all storage writes fail', async () => {
    const runtime = await import('@/products/adult/standalone/runtime');
    denyWrites = true;
    const first = runtime.addHistoryEntry(completion());
    runtime.finishResult(first.id, '임시 기록');
    expect(runtime.getSaved(first.id)?.name).toBe('임시 기록');
    expect(runtime.loadProgress()).toBeNull();
    expect(runtime.getHistory()).toEqual([]);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});
