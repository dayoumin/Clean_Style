import { MAX_CONTENT_LENGTH } from '@/lib/constants';

/** userContext에서 프롬프트 인젝션 패턴을 제거 */
export function sanitizeUserInput(input: string): string {
  let cleaned = input
    .replace(/```/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n{3,}/g, '\n\n')
    // 범용 인젝션 패턴 제거
    .replace(/system\s*:/gi, '')
    .replace(/IGNORE\s+(ALL\s+)?PREVIOUS\s+INSTRUCTIONS/gi, '')
    .replace(/DO\s+NOT\s+FOLLOW/gi, '')
    .replace(/YOU\s+ARE\s+NOW/gi, '')
    .replace(/FORGET\s+(ALL\s+)?PREVIOUS/gi, '')
    .trim();

  // 줄 수 제한 (20줄 초과 시 잘라냄)
  const lines = cleaned.split('\n');
  if (lines.length > 20) {
    cleaned = lines.slice(0, 20).join('\n');
  }

  return cleaned;
}

/** history 배열에서 user/assistant 역할만 허용, content 길이 제한 */
export function sanitizeHistory(
  history: unknown,
): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (msg): msg is { role: 'user' | 'assistant'; content: string } =>
        typeof msg === 'object' &&
        msg !== null &&
        'role' in msg &&
        'content' in msg &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string',
    )
    .map((msg) => ({
      role: msg.role,
      content: msg.content.slice(0, MAX_CONTENT_LENGTH),
    }));
}

/** scores 객체 검증 — 3개 축이 모두 숫자이고 합리적 범위 내인지 */
export function isValidScores(s: unknown): s is { principle: number; transparency: number; independence: number } {
  if (typeof s !== 'object' || s === null) return false;
  const obj = s as Record<string, unknown>;
  const p = obj.principle, t = obj.transparency, i = obj.independence;
  return (
    typeof p === 'number' && typeof t === 'number' && typeof i === 'number' &&
    Math.abs(p) <= 15 && Math.abs(t) <= 15 && Math.abs(i) <= 15
  );
}

/** 점수를 한글 성향 설명으로 변환 */
export function describeScores(scores: { principle: number; transparency: number; independence: number }): string {
  const axis = (score: number, pos: string, neg: string) => {
    if (score >= 3) return `${pos} 성향 뚜렷`;
    if (score >= 1) return `${pos} 성향 약간`;
    if (score <= -3) return `${neg} 성향 뚜렷`;
    if (score <= -1) return `${neg} 성향 약간`;
    return '균형';
  };
  return [
    `원칙↔유연(${scores.principle}): ${axis(scores.principle, '원칙', '유연')}`,
    `투명↔신중(${scores.transparency}): ${axis(scores.transparency, '투명', '신중')}`,
    `독립↔협력(${scores.independence}): ${axis(scores.independence, '독립', '협력')}`,
  ].join('\n');
}
