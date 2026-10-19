import { describe, expect, it } from 'vitest';
import { calculateRespectResult, getRespectQuestions, getRespectScoredQuestions, getRespectSituationGuidance, getRespectSituationGuidanceIndex, workplaceRespectRuntimeQuestions, RESPECT_RESULT_TTL_MS, RESPECT_INSTRUMENT_VERSION, RESPECT_SCORING_VERSION } from '@/data/workplaceRespectQuestions';
import { workplaceRespectQuestions as governance } from '@/data/workplaceRespectQuestionGovernance';
import { createRespectResponse, decodeRespectResponse } from '@/diagnostics/workplace-respect/response';
import type { RespectEntry } from '@/data/workplaceRespectQuestions';
import { getRespectHelpCalls } from '@/diagnostics/workplace-respect/help';

function answersFor(entry: RespectEntry, selected: Record<string, number> = {}) {
  return getRespectQuestions(entry).map(q => selected[q.id] ?? 0);
}
function scored(entry: RespectEntry, value: number) {
  return getRespectQuestions(entry).map(q => q.axis === 'crisisGate' ? 0 : value);
}
function actionTotal(total: number) {
  let remaining = total;
  return getRespectQuestions('action').map(q => {
    if (q.axis === 'crisisGate') return 0;
    const value = Math.min(4, remaining); remaining -= value; return value;
  });
}

describe('official source instruments and separate help', () => {
  it('공식 10개·25개와 독립된 안전 문항 3개, 안정적인 ID를 제공한다', () => {
    expect(getRespectScoredQuestions('action')).toHaveLength(10);
    expect(getRespectScoredQuestions('experience')).toHaveLength(25);
    expect(workplaceRespectRuntimeQuestions).toHaveLength(38);
    expect(getRespectQuestions('action')[0].id).toBe('A11');
    expect(getRespectQuestions('experience').slice(0, 2).map(q => q.id)).toEqual(['E11', 'E10']);
    const ids = workplaceRespectRuntimeQuestions.flatMap(q => [q.id, ...q.choices.map(c => c.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getRespectSituationGuidanceIndex('action')).toBe(1);
    expect(getRespectSituationGuidanceIndex('experience')).toBe(2);
  });
  it('원표 10개 문구를 임의로 순화·확장하지 않는다', () => {
    expect(getRespectScoredQuestions('action').map(q => q.prompt)).toEqual([
      '업무지시를 할 때 화를 내거나 욕을 한 적이 있다.',
      '다른 직원 앞에서 특정 직원의 잘못을 과도하게 질책한 적이 있다.',
      '공식적 자리에서 부하직원을 공식 직명이 아닌 “야”, “너” 등의 반말로 부른 적이 있다.',
      '직원의 외모나 의상, 출신지역이나 연령 등에 대해 지적한 적이 있다.',
      '개인적인 일을 부하 직원에게 시키기도 한다.',
      '부하 직원에게 긴급하지 않은 경우임에도 야근, 주말근무를 지시한 적이 있다.',
      '본인 의사와 상관없이 불필요한 회식, 야외활동 참여를 요구한 적이 있다.',
      '소속 직원이 연차휴가나 병가 등을 신청하였으나 타당한 이유 없이 거부한 적이 있다.',
      '특정 직원에게 타당한 이유 없이 업무를 과다 또는 과소하게 부여한 적이 있다.',
      '사적인 이유로 부하 직원에게 인사상 불이익을 준 적이 있다.',
    ]);
    expect(getRespectScoredQuestions('experience')[13].prompt).toBe('나에게 신체적인 위협이나 폭력을 가했다.(예: 물건 던지기, 주먹질 등)');
    expect(getRespectScoredQuestions('experience')[24].prompt).toContain('성적 수치심');
  });
  it.each(['action', 'experience'] as const)('%s는 원표 다섯 응답과 별도 모름·건너뛰기를 구분한다', entry => {
    const expected = entry === 'action' ? ['전혀 아니다','아니다','보통이다','그렇다','매우 그렇다'] : ['전혀 없음','6개월에 1-2회','월 1회 정도','주 1회 정도','매일'];
    for (const q of getRespectScoredQuestions(entry)) {
      expect(q.choices.filter(c => !c.auxiliary).map(c => c.text)).toEqual(expected);
      expect(q.choices.filter(c => !c.auxiliary).map(c => c.score)).toEqual([0,1,2,3,4]);
      expect(q.choices.slice(5).every(c => c.auxiliary && c.uncertain)).toBe(true);
    }
  });
  it('행동 안내에 경험 회상기간을 적용하지 않고 경험은 최근 6개월을 사용한다', () => {
    expect(getRespectSituationGuidance('action')).not.toContain('최근 6개월');
    expect(getRespectSituationGuidance('action')).toContain('2026년');
    expect(getRespectSituationGuidance('experience')).toContain('최근 6개월');
    expect(getRespectScoredQuestions('experience').every(q => q.helpText)).toBe(true);
  });
  it('출처를 확인한 사실과 전문가 승인 사실을 구분한다', () => {
    expect(governance).toHaveLength(38);
    for (const q of governance) {
      expect(q.source.expertReviewer).toBeNull();
      expect(q.source.approvalDecision).toBe('미검토');
      expect(q.choices).toEqual(workplaceRespectRuntimeQuestions.find(item => item.id === q.id)?.choices);
      expect(q.source.sourceLocatorStatus).toBe(q.axis === 'crisisGate' ? '보완필요' : '확정');
    }
  });
});

describe('independent scoring', () => {
  it.each([[0,'low'],[10,'low'],[11,'moderate'],[20,'moderate'],[21,'high'],[29,'high'],[30,'veryHigh'],[40,'veryHigh']] as const)('2019년 원표 %s점 구간을 그대로 계산한다', (total, band) => {
    const result = calculateRespectResult('action', actionTotal(total));
    expect(result.score).toBe(total);
    expect(result.sourceBand).toBe(band);
    expect(result.maxScore).toBe(40);
  });
  it.each([[0,0],[1,25],[2,50],[3,75],[4,100]])('경험 빈도 %s 응답은 %s점이며 등급이 없다', (value,total) => {
    const result = calculateRespectResult('experience',scored('experience',value));
    expect(result.score).toBe(total);
    expect(result.maxScore).toBe(100);
    expect(result.sourceBand).toBeNull();
    expect(result.sourceBandText).toBeNull();
    expect(result).not.toHaveProperty('level');
    expect(result).not.toHaveProperty('axisSummary');
    expect(result.crisis).toBe(false);
  });
  it.each(['MOEL26-E14','MOEL26-E25'])('한 번의 %s 경험은 1점이지만 경미·안전으로 분류하지 않는다', id => {
    const result = calculateRespectResult('experience',answersFor('experience',{[id]:1}));
    expect(result.score).toBe(1);
    expect(result.reportedItems.map(item => item.id)).toEqual([id]);
    expect(result.sourceBand).toBeNull();
    expect(result.summary).toContain('한 번의 경험도 상담');
  });
  it('같은 종류의 두 문항도 각 응답을 합산하고 별도 가중치를 주지 않는다', () => {
    expect(calculateRespectResult('experience', answersFor('experience',{'MOEL26-E01':4,'MOEL26-E02':4})).score).toBe(8);
  });
  it.each(['action','experience'] as const)('%s 모름·건너뛰기·무효 응답은 총점·구간을 산출하지 않는다', entry => {
    const first = getRespectQuestions(entry).findIndex(q => q.axis !== 'crisisGate');
    for (const value of [5,6,-1,99,NaN,0.5]) {
      const answers = scored(entry,0); answers[first] = value;
      const result = calculateRespectResult(entry,answers);
      expect(result.score).toBeNull();
      expect(result.sourceBand).toBeNull();
      expect(result.scoredAnsweredCount).toBe(result.scoredTotal-1);
      expect(result.informationLimited).toBe(true);
    }
    expect(calculateRespectResult(entry,[]).score).toBeNull();
  });
  it('안전·도움 응답은 완성 합계와 원표 구간을 바꾸지 않는다', () => {
    for (const entry of ['action','experience'] as const) {
      const baseline = scored(entry,2);
      const before = calculateRespectResult(entry,baseline);
      for (const q of getRespectQuestions(entry).filter(q => q.axis === 'crisisGate')) {
        for (let choice=0; choice<q.choices.length; choice++) {
          const changed=[...baseline]; changed[getRespectQuestions(entry).findIndex(item => item.id===q.id)]=choice;
          const after=calculateRespectResult(entry,changed);
          expect([after.score,after.sourceBand]).toEqual([before.score,before.sourceBand]);
        }
      }
    }
  });
  it('별도 도움 신호에 즉시 도움을 제공하고 부분 응답에서 점수를 만들지 않는다', () => {
    const urgent=calculateRespectResult('action',[2]);
    expect(urgent.crisis).toBe(true);
    expect(urgent.score).toBeNull();
    expect(getRespectHelpCalls(urgent).map(c=>c.number)).toEqual(['112','119']);
    const recurring=calculateRespectResult('experience',[0,2]);
    expect(recurring.crisis).toBe(false);
    expect(recurring.supportKind).toBe('recurring');
    expect(recurring.supportNotice).not.toBeNull();
    expect(getRespectHelpCalls(recurring)[0].number).toBe('109');
    expect(calculateRespectResult('experience',[1]).safetyNotice).not.toBeNull();
  });
});

describe('versioned source response contract', () => {
  const now=1_800_000_000_000;
  it('현재 버전·안정 ID를 사용하고 저장 배열 순서에 의존하지 않는다', () => {
    const answers=scored('experience',2);
    const response=createRespectResponse('experience',answers,now);
    expect(response.instrumentVersion).toBe(RESPECT_INSTRUMENT_VERSION);
    expect(response.scoringVersion).toBe(RESPECT_SCORING_VERSION);
    expect(decodeRespectResponse({...response,responses:[...response.responses].reverse()},'experience',now)?.answers).toEqual(answers);
  });
  it('옛 문항·채점 버전, 관점 불일치, 중복·위조·만료를 거절한다', () => {
    const response=createRespectResponse('action',scored('action',0),now);
    for (const changes of [{instrumentVersion:'workplace-respect-v0.2.2'},{scoringVersion:'workplace-respect-risk-v0.2.2'},{responses:[...response.responses,response.responses[0]]},{responses:[{questionId:'A01',choiceId:'A01:yes'}]}]) {
      expect(decodeRespectResponse({...response,...changes},'action',now)).toBeNull();
    }
    expect(decodeRespectResponse(response,'experience',now)).toBeNull();
    expect(decodeRespectResponse(response,'action',now+RESPECT_RESULT_TTL_MS)).toBeNull();
    expect(decodeRespectResponse({...response,createdAt:now+1},'action',now)).toBeNull();
  });
  it('명시한 모름·건너뛰기는 저장하지만 불완전한 일반 응답은 거절한다', () => {
    const answers=answersFor('experience',{'MOEL26-E01':5,'MOEL26-E02':6});
    const response=createRespectResponse('experience',answers,now);
    expect(calculateRespectResult('experience',decodeRespectResponse(response,'experience',now)!.answers).score).toBeNull();
    expect(()=>createRespectResponse('action',[0],now)).toThrow('Incomplete');
  });
  it('첫 위기 응답으로 끝나는 연속 앞부분만 허용한다', () => {
    const response=createRespectResponse('experience',[0,3],now);
    expect(decodeRespectResponse(response,'experience',now)).not.toBeNull();
    expect(()=>createRespectResponse('experience',[2,2],now)).toThrow('after a crisis');
    expect(decodeRespectResponse({...response,responses:[response.responses[1]]},'experience',now)).toBeNull();
  });
});
