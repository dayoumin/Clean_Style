import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildResultUrl(
  styleKey: string,
  scores: { principle: number; transparency: number; independence: number },
  answers: number[],
  historyId?: string,
  isNew?: boolean,
): string {
  const params = new URLSearchParams({
    style: styleKey,
    p: String(scores.principle),
    t: String(scores.transparency),
    i: String(scores.independence),
    a: answers.join(','),
  });
  if (isNew) params.set('new', '1');
  if (historyId) {
    params.set('hid', historyId);
  }
  return `/result?${params.toString()}`;
}

/** 시드 기반 셔플 (같은 시드 = 같은 순서) */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
