import { describe, it, expect } from 'vitest';
import { calculateResult, computeSixAxisScores, questions } from '@/data/questions';

describe('computeSixAxisScores', () => {
  it('모든 첫 번째 선택지 → 6축 점수가 0 이상', () => {
    const answers = questions.map(() => 0);
    const scores = computeSixAxisScores(answers);

    for (const val of Object.values(scores)) {
      expect(val).toBeGreaterThanOrEqual(0);
    }
  });

  it('빈 답변 → 모두 0', () => {
    const scores = computeSixAxisScores([]);
    expect(scores).toEqual({
      principle: 0, flexible: 0,
      transparent: 0, cautious: 0,
      independent: 0, cooperative: 0,
    });
  });

  it('양수 점수는 principle/transparent/independent로, 음수는 반대축으로', () => {
    // Q1 choice 0: principle:1, independence:1, transparency:-1
    const scores = computeSixAxisScores([0]);
    expect(scores.principle).toBe(1);
    expect(scores.independent).toBe(1);
    expect(scores.cautious).toBe(1); // transparency:-1 → cautious
    expect(scores.flexible).toBe(0);
    expect(scores.transparent).toBe(0);
    expect(scores.cooperative).toBe(0);
  });

  it('범위 밖 인덱스는 무시', () => {
    const scores = computeSixAxisScores([99]);
    expect(scores).toEqual({
      principle: 0, flexible: 0,
      transparent: 0, cautious: 0,
      independent: 0, cooperative: 0,
    });
  });
});

describe('calculateResult', () => {
  it('15문항 답변 → styleKey가 유효한 8가지 유형 중 하나', () => {
    const validKeys = [
      'principle-transparent-independent', 'principle-transparent-cooperative',
      'principle-cautious-independent', 'principle-cautious-cooperative',
      'flexible-transparent-independent', 'flexible-transparent-cooperative',
      'flexible-cautious-independent', 'flexible-cautious-cooperative',
    ];

    const answers = questions.map(() => 0);
    const result = calculateResult(answers);

    expect(validKeys).toContain(result.styleKey);
    expect(result.answers).toEqual(answers);
    expect(result.style).toBeDefined();
    expect(result.style.name).toBeTruthy();
  });

  it('3축 순점수 = principle - flexible, transparent - cautious, independent - cooperative', () => {
    const answers = [0]; // Q1 choice 0: principle+1, independence+1, transparency-1
    const result = calculateResult(answers);

    // 1문항만이므로: principle=1, flexible=0 → net=1
    expect(result.scores.principle).toBe(1);
    expect(result.scores.independence).toBe(1);
    expect(result.scores.transparency).toBe(-1); // cautious +1 → net = 0-1 = -1
  });

  it('borderline 감지 — 순점수 0인 축 기록', () => {
    // 모든 문항에서 점수가 없는 답변을 선택하면 전부 0
    const answers: number[] = [];
    const result = calculateResult(answers);

    // 빈 답변이면 모든 축 0 → 전부 borderline
    expect(result.borderline).toContain('principle');
    expect(result.borderline).toContain('transparency');
    expect(result.borderline).toContain('independence');
  });

  it('scores 범위: 각 축 절댓값이 15 이하', () => {
    // 모든 선택지 경우의 수에서 최대/최소 확인
    for (let c = 0; c < 4; c++) {
      const answers = questions.map(() => c);
      const result = calculateResult(answers);
      expect(Math.abs(result.scores.principle)).toBeLessThanOrEqual(15);
      expect(Math.abs(result.scores.transparency)).toBeLessThanOrEqual(15);
      expect(Math.abs(result.scores.independence)).toBeLessThanOrEqual(15);
    }
  });

  it('0점 축 → styleKey에서 양수 쪽(principle/transparent/independent) 선택', () => {
    const result = calculateResult([]);
    // 모두 0이면 >= 0 조건에 의해 principle-transparent-independent
    expect(result.styleKey).toBe('principle-transparent-independent');
  });
});
