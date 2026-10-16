import { describe, expect, it } from 'vitest';
import { QA_SYSTEM_PROMPT, QA_SYSTEM_PROMPT_CONTINUE, QA_SYSTEM_PROMPT_NEUTRAL } from '@/lib/prompts';

describe('QA_SYSTEM_PROMPT', () => {
  it('질문에 맞게 분량을 조절하고 기존 법령 기준을 보존한다', () => {
    expect(QA_SYSTEM_PROMPT).toContain('질문이 간단하면 짧게');
    expect(QA_SYSTEM_PROMPT).not.toContain('6~8개의 완성된 문장');
    expect(QA_SYSTEM_PROMPT).not.toContain('마지막에 한 줄 격려');
    expect(QA_SYSTEM_PROMPT).toContain('질문 유형에 맞는 흐름을 선택하세요');
    expect(QA_SYSTEM_PROMPT).toContain('결론 → 적용 기간/대상 → 예외 또는 품목 구분 → 직무관련성 주의 → 실제 행동');
    expect(QA_SYSTEM_PROMPT).toContain('핵심 판단 → 이유 → 확인할 사실 → 기록/보고 방법 → 다음 행동');
    expect(QA_SYSTEM_PROMPT).toContain('설·추석 전 24일부터 설·추석 후 5일까지');
    expect(QA_SYSTEM_PROMPT).toContain('원활한 직무수행 또는 사교·의례 등의 목적');
    expect(QA_SYSTEM_PROMPT).toContain('짧은 문단');
  });

  it('청렴 첫 상담과 후속·중립 답변의 유형 사용 범위를 구분한다', () => {
    expect(QA_SYSTEM_PROMPT).toContain('스타일 정보는 약한 참고');
    expect(QA_SYSTEM_PROMPT).toContain('성향으로 위법 여부나 도덕성을 판단하지 마세요');
    expect(QA_SYSTEM_PROMPT_CONTINUE).toContain('유형명·스타일 라벨');
    expect(QA_SYSTEM_PROMPT_CONTINUE).toContain('스타일만으로 다른 조언을 만들지 마세요');
    expect(QA_SYSTEM_PROMPT_CONTINUE).toContain('현재 상황·어려움·제약·선호가 스타일 참고보다 우선');
    expect(QA_SYSTEM_PROMPT_CONTINUE).not.toContain('그 사람의 강점은 살리고 약점은 보완');
    expect(QA_SYSTEM_PROMPT_CONTINUE).not.toContain('독립 성향이 강하면');
    expect(QA_SYSTEM_PROMPT_CONTINUE).not.toContain('이전 대화에서 이미 스타일을 언급했습니다');
    expect(QA_SYSTEM_PROMPT_NEUTRAL).toContain('유형명, 유형 라벨, 성향 설명을 언급하지 마세요');
  });
});
