import { describe, expect, it } from 'vitest';
import { QA_SYSTEM_PROMPT } from '@/lib/prompts';

describe('QA_SYSTEM_PROMPT', () => {
  it('질문 유형별 상담형 답변 구조와 최소 분량을 강제', () => {
    expect(QA_SYSTEM_PROMPT).toContain('정확히 8개의 완성된 문장');
    expect(QA_SYSTEM_PROMPT).toContain('상황이 복잡할 때만 9~10문장까지 허용');
    expect(QA_SYSTEM_PROMPT).toContain('6문장 이하의 단답형 답변이나 11문장 이상의 장황한 답변은 허용하지 않습니다');
    expect(QA_SYSTEM_PROMPT).toContain('마지막 격려 문장도 전체 7~10문장 안에 포함하세요');
    expect(QA_SYSTEM_PROMPT).toContain('질문 유형에 맞는 흐름을 선택하세요');
    expect(QA_SYSTEM_PROMPT).toContain('결론 → 적용 기간/대상 → 예외 또는 품목 구분 → 직무관련성 주의 → 실제 행동');
    expect(QA_SYSTEM_PROMPT).toContain('핵심 판단 → 이유 → 확인할 사실 → 기록/보고 방법 → 다음 행동');
    expect(QA_SYSTEM_PROMPT).toContain('설·추석 전 24일부터 설·추석 후 5일까지');
    expect(QA_SYSTEM_PROMPT).toContain('원활한 직무수행 또는 사교·의례 등의 목적');
    expect(QA_SYSTEM_PROMPT).toContain('전체 답변은 4~6개 문단');
  });
});
