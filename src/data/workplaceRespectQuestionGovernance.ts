import { RESPECT_QUESTION_VERSION, workplaceRespectRuntimeQuestions, type RespectQuestion } from './workplaceRespectQuestions';

export interface RespectSourceMapping {
  sourceTitle: string;
  sourceUrl: string;
  additionalSourceUrls: string[];
  publishedDate: string;
  retrievedAt: string;
  sectionOrPage: string;
  sourceLocatorStatus: '확정' | '보완필요';
  basis: string;
  sourceTextSummary: string;
  useCondition: '공식 예시표 활용' | '도움 연결';
  derivedOrDirect: '공식 문항 원문' | '기준 기반 자체 문항';
  riskFlags: Array<'법률오인' | '의료오인' | '개인정보' | '위기표현'>;
  reviewStatus: '내부검토';
  expertReviewer: null;
  reviewerRole: null;
  reviewedAt: null;
  approvalDecision: '미검토';
  approvalScope: null;
  approvalArtifact: null;
}
export interface RespectGovernanceQuestion extends RespectQuestion {
  source: RespectSourceMapping;
  version: string;
  resultMapping: string[];
}

function sourceFor(question: RespectQuestion): RespectSourceMapping {
  const action = question.axis === 'officialAction';
  const safety = question.axis === 'crisisGate';
  const mentalHelp = question.id === 'E10';
  return {
    sourceTitle: safety ? '기존 별도 안전·도움 확인 자체 문항' : action ? '공공분야 갑질 근절을 위한 가이드라인(2019.2)' : '직장 내 괴롭힘 예방·대응 매뉴얼(2026.7)',
    sourceUrl: safety ? (mentalHelp ? 'https://www.129.go.kr/109' : 'https://www.112.go.kr/')
      : action ? 'https://www.opm.go.kr/opm/info/policies.do?articleNo=120471&mode=view' : 'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20260701008',
    additionalSourceUrls: safety ? ['https://www.119.go.kr/Center119/main.do'] : action ? ['https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20260701008'] : [],
    publishedDate: safety ? '상시' : action ? '2019-02-22' : '2026-07-29',
    retrievedAt: safety ? '2026-05-22' : '2026-10-15',
    sectionOrPage: safety ? '기존 도움 연결 안내; 문항·안전 분기 전문가 확인 대기' : action ? '책자 44쪽/PDF 46쪽, 붙임 1 개인별 진단' : '책자 139쪽/PDF 143쪽, 참고 5 설문 III',
    sourceLocatorStatus: safety ? '보완필요' : '확정',
    basis: safety ? '점수와 독립된 도움 연결' : action ? '원문·동의 응답 0~4점·0~40점 합계·원표 네 구간 유지' : '공식 경험 원문·최근 6개월·빈도 응답 유지, 자체 0~4점·0~100점 시험 합계',
    sourceTextSummary: safety ? '기존 안전·도움 문구와 분기를 유지한다. 단독으로 임상 위험을 판정하지 않으며 두 점수와 독립된다. 과거 사건의 긴급 분류와 문구는 전문가 확인 대기다.'
      : action ? '기관 특성에 따른 수정 활용을 허용하는 공식 예방 예시. 이번 구현에서는 원문·원표 채점을 유지한다. 2026년 보완 안내·모름·건너뛰기·결측 처리는 자체 추가이며 원표의 검증된 예측 정확도를 주장하지 않는다.'
      : '공식 부록은 개인 총점·위험 구간을 제시하지 않는다. 합계는 자체 시험 산식이며 다른 연구나 2019년 구간을 이전하지 않는다. 선택 도움말·모름·건너뛰기·결측 처리는 자체 추가다.',
    useCondition: safety ? '도움 연결' : '공식 예시표 활용',
    derivedOrDirect: safety ? '기준 기반 자체 문항' : '공식 문항 원문',
    riskFlags: safety ? ['의료오인', '개인정보', '위기표현'] : ['법률오인', '개인정보'],
    reviewStatus: '내부검토', expertReviewer: null, reviewerRole: null, reviewedAt: null,
    approvalDecision: '미검토', approvalScope: null, approvalArtifact: null,
  };
}

// Runtime is canonical; provenance records a verified source, never a fabricated expert approval.
export const workplaceRespectQuestions: RespectGovernanceQuestion[] = workplaceRespectRuntimeQuestions.map(question => ({
  ...question, version: RESPECT_QUESTION_VERSION, source: sourceFor(question),
  resultMapping: question.axis === 'crisisGate' ? ['별도 안전·도움'] : question.axis === 'officialAction' ? ['2019년 원표 합계·구간'] : ['자체 경험 빈도 합계·위험 등급 보류'],
}));
