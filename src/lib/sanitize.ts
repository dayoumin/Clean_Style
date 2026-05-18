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

// ---------------------------------------------------------------------------
// PII 탐지 및 마스킹
// ---------------------------------------------------------------------------

/**
 * 신용카드 Luhn 체크섬 검증.
 * 구분자(-, 공백)를 제거한 순수 숫자열을 받는다.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** PII 패턴 정의 — 탐지 순서가 우선순위 */
const PII_PATTERNS: {
  type: PiiType;
  regex: RegExp;
  validate?: (match: string) => boolean;
}[] = [
  {
    type: '주민등록번호',
    // 6자리 생년월일 + 구분자 + 1-4로 시작하는 7자리
    regex: /\d{6}[-–]\s?[1-4]\d{6}/g,
  },
  {
    type: '신용카드번호',
    // 4자리-4자리-4자리-4자리 (구분자: 하이픈, 공백)
    regex: /\d{4}[-– ]\d{4}[-– ]\d{4}[-– ]\d{4}/g,
    validate: (match) => luhnCheck(match.replace(/[-– ]/g, '')),
  },
  {
    type: '전화번호',
    // 한국 휴대폰: 010/011/016/017/018/019 + 3~4자리 + 4자리
    regex: /01[016789][-– ]?\d{3,4}[-– ]?\d{4}/g,
  },
  {
    type: '이메일',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: '계좌번호',
    // 한국 은행 계좌: 3~6자리-2~6자리-4~8자리 (최소 10자리 숫자)
    regex: /\d{3,6}[-–]\d{2,6}[-–]\d{4,8}/g,
    validate: (match) => match.replace(/[-–]/g, '').length >= 10,
  },
];

export type PiiType = '주민등록번호' | '신용카드번호' | '전화번호' | '이메일' | '계좌번호';

export interface PiiScanResult {
  /** PII가 하나라도 감지되었는지 */
  hasPii: boolean;
  /** 감지된 PII 유형 목록 (중복 없음) */
  detected: PiiType[];
  /** PII가 마스킹된 텍스트 */
  redacted: string;
}

/** 자유 텍스트에서 고위험 PII를 탐지하고 마스킹한다. */
export function scanAndRedactPii(input: string): PiiScanResult {
  const detected = new Set<PiiType>();
  let redacted = input;

  for (const { type, regex, validate } of PII_PATTERNS) {
    // 각 패턴의 regex는 g 플래그 — 매번 lastIndex를 리셋해야 안전
    const freshRegex = new RegExp(regex.source, regex.flags);
    redacted = redacted.replace(freshRegex, (match) => {
      if (validate && !validate(match)) return match;
      detected.add(type);
      return `[${type}]`;
    });
  }

  return {
    hasPii: detected.size > 0,
    detected: [...detected],
    redacted,
  };
}
