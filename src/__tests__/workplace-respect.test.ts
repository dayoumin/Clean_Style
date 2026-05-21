import { describe, expect, it } from 'vitest';
import {
  buildRespectCheckUrl,
  buildRespectResultUrl,
  calculateRespectResult,
  getRespectQuestions,
  RESPECT_QUESTION_VERSION,
  workplaceRespectRuntimeQuestions,
} from '@/data/workplaceRespectQuestions';
import {
  workplaceRespectQuestions as workplaceRespectGovernanceQuestions,
} from '@/data/workplaceRespectQuestionGovernance';

describe('workplaceRespectQuestions', () => {
  it('두 입구에 각각 10문항을 제공한다', () => {
    expect(workplaceRespectRuntimeQuestions).toHaveLength(20);
    expect(getRespectQuestions('action')).toHaveLength(10);
    expect(getRespectQuestions('experience')).toHaveLength(10);
  });

  it('모든 문항은 4개 선택지를 가진다', () => {
    for (const question of workplaceRespectRuntimeQuestions) {
      expect(question.choices).toHaveLength(4);
    }
  });

  it('모든 문항은 내부 출처 관리 메타데이터를 가진다', () => {
    for (const question of workplaceRespectGovernanceQuestions) {
      expect(question.source.sourceUrl).toMatch(/^https:\/\//);
      expect(question.source.sectionOrPage).toBeTruthy();
      expect(question.source.useCondition).toBeTruthy();
      expect(question.source.derivedOrDirect).toBe('기준 기반 자체 문항');
      expect(question.source.expertReviewer).toBeNull();
      expect(question.source.reviewStatus).toBe('초안');
      expect(question.version).toBe(RESPECT_QUESTION_VERSION);
      expect(question.resultMapping.length).toBeGreaterThan(0);
    }
  });

  it('화면용 문항 데이터에는 내부 출처 메타데이터를 싣지 않는다', () => {
    for (const question of workplaceRespectRuntimeQuestions) {
      expect('source' in question).toBe(false);
      expect('resultMapping' in question).toBe(false);
      expect('version' in question).toBe(false);
    }
  });

  it('내부 출처 관리 문항과 화면용 문항의 사용자 문구는 일치한다', () => {
    expect(workplaceRespectGovernanceQuestions.map((question) => question.id)).toEqual(
      workplaceRespectRuntimeQuestions.map((question) => question.id),
    );

    for (const runtimeQuestion of workplaceRespectRuntimeQuestions) {
      const governanceQuestion = workplaceRespectGovernanceQuestions.find((question) => (
        question.id === runtimeQuestion.id
      ));
      expect(governanceQuestion?.prompt).toBe(runtimeQuestion.prompt);
      expect(governanceQuestion?.choices.map((choice) => choice.text)).toEqual(
        runtimeQuestion.choices.map((choice) => choice.text),
      );
    }
  });

  it('문항은 개인정보를 직접 요구하지 않는다', () => {
    const blockedTerms = ['이름', '소속기관', '부서명', '직위', '연락처', '전화번호', '실명'];

    for (const question of workplaceRespectRuntimeQuestions) {
      for (const term of blockedTerms) {
        expect(question.prompt).not.toContain(term);
      }
    }
  });

  it('문항과 결과 문구는 법률·의료 진단을 단정하지 않는다', () => {
    const blockedPhrases = ['갑질입니다', '괴롭힘입니다', '우울증입니다', '자살위험군입니다', '진단되었습니다'];
    const texts = [
      ...workplaceRespectRuntimeQuestions.flatMap((question) => [
        question.prompt,
        ...question.choices.map((choice) => choice.text),
      ]),
      ...(['action', 'experience'] as const).flatMap((entry) => {
        const low = calculateRespectResult(entry, Array(10).fill(0));
        const highAnswers = Array(10).fill(3);
        highAnswers[9] = 0;
        const high = calculateRespectResult(entry, highAnswers);
        return [
          low.title,
          low.summary,
          ...low.primaryActions,
          ...low.supportActions,
          high.title,
          high.summary,
          ...high.primaryActions,
          ...high.supportActions,
        ];
      }),
    ];

    for (const text of texts) {
      for (const phrase of blockedPhrases) {
        expect(text).not.toContain(phrase);
      }
    }
  });

  it('시작 및 결과 URL을 생성한다', () => {
    expect(buildRespectCheckUrl('action')).toBe('/respect/check?entry=action');
    expect(buildRespectResultUrl('experience')).toBe('/respect/result?entry=experience');
  });
});

describe('calculateRespectResult', () => {
  it('낮은 점수는 low 결과를 반환한다', () => {
    const result = calculateRespectResult('action', Array(10).fill(0));
    expect(result.level).toBe('low');
    expect(result.score).toBe(0);
    expect(result.crisis).toBe(false);
  });

  it('중간 점수는 caution 결과를 반환한다', () => {
    const result = calculateRespectResult('action', Array(10).fill(1));
    expect(result.level).toBe('caution');
    expect(result.score).toBe(10);
  });

  it('높은 점수는 high 결과를 반환한다', () => {
    const answers = Array(10).fill(3);
    answers[9] = 0;
    const result = calculateRespectResult('experience', answers);
    expect(result.level).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(18);
    expect(result.axisSummary.coreCriteriaMet).toBe(true);
  });

  it('핵심 기준 축이 함께 나타나지 않으면 단순 합산 점수만으로 high를 반환하지 않는다', () => {
    const answers = Array(10).fill(3);
    answers[0] = 0;
    answers[9] = 0;

    const result = calculateRespectResult('experience', answers);
    expect(result.axisSummary.coreCriteriaMet).toBe(false);
    expect(result.level).toBe('caution');
  });

  it('위기 선택지는 점수와 무관하게 urgent 결과를 반환한다', () => {
    const answers = Array(10).fill(0);
    answers[9] = 2;

    const result = calculateRespectResult('experience', answers);
    expect(result.level).toBe('urgent');
    expect(result.crisis).toBe(true);
  });

  it('내 행동 점검에서도 안전위험 선택지는 urgent 결과를 반환한다', () => {
    const answers = Array(10).fill(0);
    answers[9] = 3;

    const result = calculateRespectResult('action', answers);
    expect(result.level).toBe('urgent');
    expect(result.crisis).toBe(true);
  });

  it('자해 생각이 가끔 스치는 선택지는 최소 caution과 도움 연결 표시로 이어진다', () => {
    const answers = Array(10).fill(0);
    answers[9] = 1;

    const result = calculateRespectResult('experience', answers);
    expect(result.level).toBe('caution');
    expect(result.support).toBe(true);
    expect(result.crisis).toBe(false);
  });

  it('부분 응답도 안전하게 계산한다', () => {
    const result = calculateRespectResult('action', [3, 3]);
    expect(result.answeredCount).toBe(2);
    expect(result.score).toBe(6);
  });

  it('잘못된 답변 인덱스는 점수와 응답 수에서 제외한다', () => {
    const result = calculateRespectResult('action', [99, -1, 2]);
    expect(result.answeredCount).toBe(1);
    expect(result.score).toBe(2);
  });
});
