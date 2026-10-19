import { questions, computeSixAxisScores, AXIS_MAXIMUMS } from '@/data/questions';
import { normalizeDisplayName } from '@/lib/display-name';
export { questions, calculateResult, styleTypes } from '@/data/questions';
export { normalizeDisplayName, formatNamedResultTitle } from '@/lib/display-name';
export { adultCommonArtwork, getAdultResultArtwork } from '@/diagnostics/adult-integrity/artwork';

export const INSTRUMENT_VERSION = 'adult-integrity-v1';
export const SCORING_VERSION = 'adult-three-axis-v1';
export const HISTORY_KEY = 'clean-style-html-history-v1';
export const PROGRESS_KEY = 'clean-style-html-progress-v1';
export const AXES = ['principle', 'transparent', 'independent', 'flexible', 'cautious', 'cooperative'] as const;
export const AXIS_LABELS = ['원칙', '투명', '독립', '유연', '신중', '협력'];

export interface SavedResult {
  id: string;
  createdAt: string;
  instrumentVersion: string;
  scoringVersion: string;
  answers: number[];
  name: string;
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function validAnswers(value: unknown, complete: boolean): value is number[] {
  return Array.isArray(value) && (complete ? value.length === questions.length : value.length < questions.length)
    && value.every((choice, index) => Number.isInteger(choice) && !!questions[index]?.choices[choice]);
}
export function readHistory(storage: StorageLike | null): SavedResult[] {
  try {
    const values: unknown = JSON.parse(storage?.getItem(HISTORY_KEY) ?? '[]');
    if (!Array.isArray(values)) return [];
    return values.filter((item): item is SavedResult => item && typeof item === 'object'
      && typeof item.id === 'string' && !!item.id && typeof item.name === 'string'
      && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))
      && item.instrumentVersion === INSTRUMENT_VERSION && item.scoringVersion === SCORING_VERSION
      && validAnswers(item.answers, true)).slice(0, 10).map(item => ({ ...item, name: normalizeDisplayName(item.name) }));
  } catch { return []; }
}
export function writeHistory(storage: StorageLike | null, entries: SavedResult[]): boolean {
  try {
    if (!storage) return false;
    storage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 10)));
    return true;
  } catch { return false; }
}
export function readProgress(storage: StorageLike | null): { answers: number[]; seed: number } | null {
  try {
    const item = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? 'null');
    return item?.instrumentVersion === INSTRUMENT_VERSION && item.scoringVersion === SCORING_VERSION
      && (validAnswers(item.answers, false) || validAnswers(item.answers, true)) && item.answers.length > 0 && Number.isInteger(item.seed)
      && item.seed >= 0 && item.seed < 100000 ? { answers: item.answers, seed: item.seed } : null;
  } catch { return null; }
}
export function chartValues(answers: number[]): number[] {
  const six = computeSixAxisScores(answers);
  return AXES.map(key => Math.min(Math.round(1 + Math.sqrt(AXIS_MAXIMUMS[key] > 0 ? six[key] / AXIS_MAXIMUMS[key] : 0) * 4), 5));
}
// Same seeded permutation used by the web question card; preserve original choice indices.
export function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed;
  for (let index = result.length - 1; index > 0; index--) {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
