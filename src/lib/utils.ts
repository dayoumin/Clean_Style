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
): string {
  const params = new URLSearchParams({
    style: styleKey,
    p: String(scores.principle),
    t: String(scores.transparency),
    i: String(scores.independence),
    a: answers.join(','),
  });
  if (historyId) params.set('hid', historyId);
  return `/result?${params.toString()}`;
}
