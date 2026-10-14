import { questions } from './index';

export const ADULT_SHUFFLE_SEED_RANGE = 100_000;

export interface AdultTestProgress {
  answers: number[];
  seed: number;
}

/** Restore only a valid, incomplete adult test; existing unversioned saves remain compatible. */
export function parseAdultTestProgress(raw: string | null): AdultTestProgress | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const { answers, seed } = data as Record<string, unknown>;
    if (
      !Array.isArray(answers)
      || answers.length === 0
      || answers.length >= questions.length
      || typeof seed !== 'number'
      || !Number.isInteger(seed)
      || seed < 0
      || seed >= ADULT_SHUFFLE_SEED_RANGE
    ) return null;

    if (!answers.every((choice: unknown, index): choice is number => (
      typeof choice === 'number'
      && Number.isInteger(choice)
      && questions[index].choices[choice] !== undefined
    ))) return null;

    return { answers, seed };
  } catch {
    return null;
  }
}
