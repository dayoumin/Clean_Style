import { describe, expect, it } from 'vitest';
import { calculateRespectResult, getRespectQuestions, respectAxisLabels, workplaceRespectRuntimeQuestions, RESPECT_RESULT_TTL_MS } from '@/data/workplaceRespectQuestions';
import { workplaceRespectQuestions as governance } from '@/data/workplaceRespectQuestionGovernance';
import { createRespectResponse, decodeRespectResponse } from '@/diagnostics/workplace-respect/response';
import type { RespectEntry, RespectRiskAxis } from '@/data/workplaceRespectQuestions';

function answersFor(entry: RespectEntry, selected: Record<string, number> = {}) {
  return getRespectQuestions(entry).map((q) => selected[q.id] ?? 0);
}
describe('workplace-respect v0.2', () => {
  it('24문항·안전 우선 순서·안정적인 선택지 ID를 제공한다', () => {
    expect(workplaceRespectRuntimeQuestions).toHaveLength(24);
    expect(getRespectQuestions('action')).toHaveLength(12);
    expect(getRespectQuestions('experience')).toHaveLength(12);
    expect(getRespectQuestions('action')[0].id).toBe('A11');
    expect(getRespectQuestions('experience').slice(0, 2).map(q => q.id)).toEqual(['E11', 'E10']);
    const ids = workplaceRespectRuntimeQuestions.flatMap(q => q.choices.map(c => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of workplaceRespectRuntimeQuestions) expect(q.choices).toHaveLength(4);
  });
  it('화면·출처 관리의 문구·축·점수·모든 게이트가 일치하고 출처가 공개 데이터로 새지 않는다', () => {
    for (const q of workplaceRespectRuntimeQuestions) {
      const managed = governance.find(other => other.id === q.id);
      expect(managed).toMatchObject(q);
      expect(managed?.choices).toEqual(q.choices);
      expect(managed?.source.sourceUrl).toMatch(/^https:\/\//);
      expect(managed?.source.reviewStatus).toBe('초안');
      expect(managed?.source.expertReviewer).toBeNull();
      expect('source' in q).toBe(false);
    }
    expect(governance).toHaveLength(24);
  });
  it.each(['action', 'experience'] as const)('%s의 동일 축 중복 응답은 점수를 부풀리지 않고 최대점은 18이다', entry => {
    const riskOnly = Object.fromEntries(getRespectQuestions(entry).filter(q => !['crisisGate', 'resultGate', 'evidenceSupport'].includes(q.axis)).map(q => [q.id, 3]));
    expect(calculateRespectResult(entry, answersFor(entry, riskOnly)).score).toBe(18);
    const prefix = entry === 'action' ? 'A' : 'E';
    const one = calculateRespectResult(entry, answersFor(entry, { [prefix+'02']: 2 }));
    const two = calculateRespectResult(entry, answersFor(entry, { [prefix+'02']: 2, [prefix+'03']: 2 }));
    expect(one.score).toBe(two.score);
  });
  it('애매한 답변 두 개로 업무범위 축을 활성화하지 않는다', () => {
    const r = calculateRespectResult('action', answersFor('action', { A02: 1, A03: 1 }));
    expect(r.score).toBe(1);
    expect(r.axisSummary.activeAxes).not.toContain('workScope');
  });
  it.each(['action', 'experience'] as const)('%s의 핵심 신호 충족과 낮음 결과가 공존하지 않는다', entry => {
    const p = entry === 'action' ? 'A' : 'E';
    const r = calculateRespectResult(entry, answersFor(entry, { [p+'01']: 2, [p+'07']: 2 }));
    expect(r.axisSummary.coreCriteriaMet).toBe(true);
    expect(r.level).toBe('caution');
  });
  it.each(['A06', 'A07', 'A09', 'A12'])('%s 단독 강한 신호도 낮음으로 안내하지 않는다', id => {
    expect(calculateRespectResult('action', answersFor('action', { [id]: 3 })).level).toBe('caution');
  });
  it.each(['E05', 'E07', 'E12'])('%s 단독 강한 신호도 낮음으로 안내하지 않는다', id => {
    expect(calculateRespectResult('experience', answersFor('experience', { [id]: 3 })).level).toBe('caution');
  });
  it('모욕·위협은 업무 관련 여부와 별개로 부적절한 방식 신호가 된다', () => {
    const r = calculateRespectResult('experience', answersFor('experience', { E01: 2, E05: 2 }));
    expect(r.axisSummary.coreCriteriaMet).toBe(true);
    expect(r.level).toBe('caution');
  });
  it('관계 우위·심한 모욕·실제 불이익은 높은 안내 우선순위로 연결한다', () => {
    const r = calculateRespectResult('experience', answersFor('experience', { E01: 3, E05: 3, E07: 3 }));
    expect(r.level).toBe('high');
    expect(r.score).toBe(9);
  });
  it('관계 우위 응답 없이 높은 총점만으로 핵심 기준이나 high를 만들지 않는다', () => {
    const r = calculateRespectResult('experience', answersFor('experience', { E03: 3, E05: 3, E06: 3, E08: 3, E12: 3 }));
    expect(r.level).toBe('caution');
    expect(r.axisSummary.coreCriteriaMet).toBe(false);
  });
  it.each([
    ['action', 'A02'], ['action', 'A03'], ['action', 'A04'], ['action', 'A08'],
    ['experience', 'E02'], ['experience', 'E03'], ['experience', 'E04'], ['experience', 'E08'],
  ] as const)('%s 관계 우위와 함께 나타난 %s 신호는 낮음이 아니라 주의로 안내한다', (entry, id) => {
    const relationId = entry === 'action' ? 'A01' : 'E01';
    const axis = getRespectQuestions(entry).find(q => q.id === id)!.axis as RespectRiskAxis;
    const alone = calculateRespectResult(entry, answersFor(entry, { [id]: 2 }));
    const withRelation = calculateRespectResult(entry, answersFor(entry, { [relationId]: 2, [id]: 2 }));
    expect(alone.level).toBe('low');
    expect(withRelation.level).toBe('caution');
    expect(withRelation.score).toBe(4);
    expect(withRelation.axisSummary.coreCriteriaMet).toBe(false);
    expect(withRelation.axisSummary.activeAxes).toEqual(['relationPower', axis]);
    expect(withRelation.summary).toContain(respectAxisLabels[axis]);
    expect(withRelation.title).not.toBe(alone.title);
  });
  it.each([
    ['action', 'A01'], ['action', 'A08'], ['experience', 'E01'], ['experience', 'E08'],
  ] as const)('%s의 %s 최고점만으로는 주의로 올리지 않는다', (entry, id) => {
    const r = calculateRespectResult(entry, answersFor(entry, { [id]: 3 }));
    expect(r.score).toBe(3);
    expect(r.level).toBe('low');
    expect(r.axisSummary.activeAxes).toHaveLength(1);
    expect(r.axisSummary.coreCriteriaMet).toBe(false);
  });
  it.each(['action', 'experience'] as const)('%s에서 관계 우위와 다른 위험 문항 하나의 조합은 그 문항이 2점 이상일 때만 주의다', entry => {
    const items = getRespectQuestions(entry);
    const relation = items.find(q => q.axis === 'relationPower')!;
    const others = items.filter(q => q.axis !== 'relationPower' && !['crisisGate', 'resultGate', 'evidenceSupport'].includes(q.axis));
    let checked = 0;
    for (const relationChoice of [2, 3]) {
      for (const q of others) {
        q.choices.forEach((choice, index) => {
          const r = calculateRespectResult(entry, answersFor(entry, { [relation.id]: relationChoice, [q.id]: index }));
          expect(r.level, `${relation.id}=${relationChoice}, ${q.id}=${index}`).toBe(choice.score >= 2 ? 'caution' : 'low');
          checked++;
        });
      }
    }
    expect(checked).toBe(others.length * 4 * 2);
  });
  it.each([1, 2])('E10 도움 응답 %s는 위험 점수·축을 바꾸지 않는다', choice => {
    const base = { E01: 2, E03: 2, E05: 2 };
    const r = calculateRespectResult('experience', answersFor('experience', { ...base, E10: choice }));
    const before = calculateRespectResult('experience', answersFor('experience', base));
    expect(r.score).toBe(before.score);
    expect(r.axisSummary).toEqual(before.axisSummary);
    expect(r.level).toBe(before.level);
    expect(r.support).toBe(true);
  });
  it('마음건강 도움만 선택하면 선택하지 않은 관계·업무 신호를 요약하지 않는다', () => {
    const r = calculateRespectResult('experience', answersFor('experience', { E10: 2 }));
    expect(r.score).toBe(0);
    expect(r.level).toBe('caution');
    expect(r.summary).toContain('마음건강');
    expect(r.summary).not.toContain('관계');
    expect(r.summary).not.toContain('모욕');
  });
  it('A10 중단 게이트는 총점 0으로 최소 주의를 보장한다', () => {
    const r = calculateRespectResult('action', answersFor('action', { A10: 2 }));
    expect(r.score).toBe(0);
    expect(r.level).toBe('caution');
    expect(r.primaryActions.join(' ')).not.toContain('사적인 부탁');
  });
  it.each(['action', 'experience'] as const)('%s의 단발·모름은 반복성 점수를 바꾸지 않는다', entry => {
    const id = entry === 'action' ? 'A08' : 'E08';
    const zero = calculateRespectResult(entry, answersFor(entry));
    const unknown = calculateRespectResult(entry, answersFor(entry, { [id]: 1 }));
    expect(unknown.score).toBe(zero.score);
    expect(unknown.level).toBe(zero.level);
    expect(unknown.uncertainCount).toBe(1);
    expect(unknown.summary).toContain('판단하기 어렵다');
  });
  it.each(['action', 'experience'] as const)('%s의 첫 안전 응답만으로 바로 긴급 결과를 제공한다', entry => {
    const r = calculateRespectResult(entry, [2]);
    expect(r.level).toBe('urgent');
    expect(r.score).toBe(0);
    expect(r.crisisKinds).toEqual(['physicalSafety']);
    const text = [...r.primaryActions, ...r.supportActions].join(' ');
    expect(text).toContain('112');
    expect(text).toContain('119');
    expect(text).not.toContain('109');
  });
  it('자해의 현재 실행 위험과 반복 생각을 분리한다', () => {
    const urgent = calculateRespectResult('experience', answersFor('experience', { E10: 3 }));
    const recurring = calculateRespectResult('experience', answersFor('experience', { E10: 2 }));
    expect(urgent.crisisKinds).toEqual(['selfHarm']);
    expect(urgent.level).toBe('urgent');
    expect(recurring.level).toBe('caution');
    expect(recurring.support).toBe(true);
  });
  it('잘못된 선택지 인덱스·비정수는 응답 수에서 제외한다', () => {
    const r = calculateRespectResult('action', [-1, 99, 1.5, NaN]);
    expect(r.answeredCount).toBe(0);
    expect(r.score).toBe(0);
  });
});
describe('versioned respect response', () => {
  const now = 1_800_000_000_000;
  it('문항·선택지 ID와 두 버전으로 저장하고 기록 배열 순서에 의존하지 않는다', () => {
    const answers = answersFor('experience', { E05: 3 });
    const response = createRespectResponse('experience', answers, now);
    expect(response.instrumentVersion).toBe('workplace-respect-v0.2');
    expect(response.scoringVersion).toBe('workplace-respect-risk-v0.2.1');
    expect('answers' in response).toBe(false);
    expect(decodeRespectResponse({ ...response, responses: [...response.responses].reverse() }, 'experience', now)?.answers).toEqual(answers);
  });
  it('긴급 신호가 있는 일부 응답만 복원·공유할 수 있다', () => {
    const response = createRespectResponse('action', [2], now);
    const restored = decodeRespectResponse(response, 'action', now);
    expect(restored).not.toBeNull();
    expect(calculateRespectResult('action', restored!.answers).answeredCount).toBe(1);
    expect(() => createRespectResponse('action', [0], now)).toThrow('Incomplete');
    expect(decodeRespectResponse({ ...response, responses: [] }, 'action', now)).toBeNull();
  });
  it('이전 버전·다른 관점·만료·미래 시각을 거절한다', () => {
    const response = createRespectResponse('action', answersFor('action'), now);
    expect(decodeRespectResponse({ ...response, instrumentVersion: 'workplace-respect-v0.1' }, 'action', now)).toBeNull();
    expect(decodeRespectResponse({ ...response, scoringVersion: 'old' }, 'action', now)).toBeNull();
    expect(decodeRespectResponse(response, 'experience', now)).toBeNull();
    expect(decodeRespectResponse(response, 'action', now + RESPECT_RESULT_TTL_MS)).toBeNull();
    expect(decodeRespectResponse({ ...response, createdAt: now + 1 }, 'action', now)).toBeNull();
  });
  it('문항 중복·없는 문항·다른 문항의 선택지·부분 비긴급 응답을 거절한다', () => {
    const response = createRespectResponse('action', answersFor('action'), now);
    const first = response.responses[0];
    expect(decodeRespectResponse({ ...response, responses: [...response.responses, first] }, 'action', now)).toBeNull();
    expect(decodeRespectResponse({ ...response, responses: [{ questionId: 'A99', choiceId: 'A99:no' }] }, 'action', now)).toBeNull();
    expect(decodeRespectResponse({ ...response, responses: [{ ...first, choiceId: 'E11:imminent' }] }, 'action', now)).toBeNull();
    expect(decodeRespectResponse({ ...response, responses: [first] }, 'action', now)).toBeNull();
  });
});
