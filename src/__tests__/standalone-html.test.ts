import { describe, expect, it } from 'vitest';
import {
  questions, calculateResult, chartValues, shuffle, readHistory, writeHistory, readProgress,
  HISTORY_KEY, PROGRESS_KEY, INSTRUMENT_VERSION, SCORING_VERSION,
} from '@/products/adult/standalone/model';
import { calculateResult as serverResult, computeSixAxisScores, AXIS_MAXIMUMS } from '@/diagnostics/adult-integrity';
import { seededShuffle } from '@/lib/utils';

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}
function entry(index = 0) {
  return { id: `result-${index}`, createdAt: '2026-10-16T00:00:00Z', name: '테스트',
    instrumentVersion: INSTRUMENT_VERSION, scoringVersion: SCORING_VERSION,
    answers: questions.map((question, position) => (position + index) % question.choices.length) };
}
describe('standalone HTML contracts', () => {
  it('uses the identical server scoring function and permutation', () => {
    expect(calculateResult).toBe(serverResult);
    for (const seed of [0, 1, 33, 99999]) {
      expect(shuffle([0, 1, 2, 3], seed)).toEqual(seededShuffle([0, 1, 2, 3], seed));
      const answers = entry(seed).answers;
      const six = computeSixAxisScores(answers);
      const axes = ['principle', 'transparent', 'independent', 'flexible', 'cautious', 'cooperative'] as const;
      expect(chartValues(answers)).toEqual(axes.map(key => Math.min(Math.round(1 + Math.sqrt(six[key] / AXIS_MAXIMUMS[key]) * 4), 5)));
    }
  });
  it('round-trips complete versioned results, retains latest ten and removes a result durably', () => {
    const local = storage();
    const entries = Array.from({ length: 12 }, (_, index) => entry(index));
    expect(writeHistory(local, entries)).toBe(true);
    expect(readHistory(local)).toEqual(entries.slice(0, 10));
    expect(writeHistory(local, readHistory(local).filter(item => item.id !== 'result-0'))).toBe(true);
    expect(readHistory(local).some(item => item.id === 'result-0')).toBe(false);
    expect(local.getItem('integrity-history')).toBeNull(); // Web records stay independent.
  });
  it('rejects incompatible, corrupt or incomplete histories before calculating results', () => {
    const local = storage();
    local.setItem(HISTORY_KEY, JSON.stringify([entry(), { ...entry(1), scoringVersion: 'future' },
      { ...entry(2), answers: [0] }, { ...entry(3), answers: questions.map(() => -1) }, { ...entry(4), createdAt: 'bad' }]));
    expect(readHistory(local)).toEqual([entry()]);
    local.setItem(HISTORY_KEY, '{');
    expect(readHistory(local)).toEqual([]);
  });
  it('does not throw or falsely report success when browser storage is denied', () => {
    const denied = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(readHistory(denied)).toEqual([]);
    expect(readProgress(denied)).toBeNull();
    expect(writeHistory(denied, [entry()])).toBe(false);
    expect(readHistory(null)).toEqual([]);
    expect(writeHistory(null, [entry()])).toBe(false);
  });
  it('restores in-progress and pending-complete answers with matching versions and seed', () => {
    const local = storage();
    const progress = { instrumentVersion: INSTRUMENT_VERSION, scoringVersion: SCORING_VERSION, answers: [0, 1], seed: 33 };
    local.setItem(PROGRESS_KEY, JSON.stringify(progress));
    expect(readProgress(local)).toEqual({ answers: [0, 1], seed: 33 });
    local.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, answers: entry().answers }));
    expect(readProgress(local)).toEqual({ answers: entry().answers, seed: 33 });
    for (const invalid of [{ ...progress, seed: -1 }, { ...progress, answers: [-1] },
      { ...progress, answers: [...entry().answers, 0] }, { ...progress, instrumentVersion: 'future' }]) {
      local.setItem(PROGRESS_KEY, JSON.stringify(invalid));
      expect(readProgress(local)).toBeNull();
    }
  });
});
