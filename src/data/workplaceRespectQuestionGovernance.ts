import {
  RESPECT_QUESTION_VERSION,
  workplaceRespectRuntimeQuestions,
  type RespectChoice,
  type RespectEntry,
  type RespectQuestion as RuntimeRespectQuestion,
  type RespectRiskAxis,
} from './workplaceRespectQuestions';

type ReviewStatus = '초안' | '내부검토' | '전문가검토' | '운영중' | '폐기';
type ApprovalDecision = '미검토' | '보완필요' | '승인' | '폐기';

interface RespectSourceMappingBase {
  sourceTitle: string;
  sourceUrl: string;
  additionalSourceUrls: string[];
  publishedDate: string;
  retrievedAt: string;
  sectionOrPage: string;
  sourceLocatorStatus: '보완필요' | '확정';
  basis: string;
  sourceTextSummary: string;
  useCondition: '기준 참고' | '링크아웃' | '도움 연결';
  derivedOrDirect: '기준 기반 자체 문항' | '링크아웃';
  riskFlags: Array<'법률오인' | '의료오인' | '개인정보' | '위기표현'>;
}

type NonOperationalApproval = {
  reviewStatus: Exclude<ReviewStatus, '운영중'>;
  expertReviewer: string | null;
  reviewerRole: string | null;
  reviewedAt: string | null;
  approvalDecision: ApprovalDecision;
  approvalScope: string | null;
  approvalArtifact: string | null;
};

type OperationalApproval = {
  reviewStatus: '운영중';
  expertReviewer: string;
  reviewerRole: string;
  reviewedAt: string;
  approvalDecision: '승인';
  approvalScope: string;
  approvalArtifact: string;
  sourceLocatorStatus: '확정';
};

export type RespectSourceMapping = RespectSourceMappingBase & (NonOperationalApproval | OperationalApproval);

export interface RespectGovernanceQuestion extends RuntimeRespectQuestion {
  source: RespectSourceMapping;
  version: string;
  resultMapping: string[];
}

const MOEL_SOURCE_URL = 'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20260701008';
const GAPJIL_SOURCE_URL = 'https://www.korea.kr/archive/expDocView.do?docId=38412';
const HELP_SOURCE_URL = 'https://www.129.go.kr/109';
const POLICE_SOURCE_URL = 'https://www.112.go.kr/';
const FIRE_SOURCE_URL = 'https://www.119.go.kr/Center119/main.do';
const RETRIEVED_AT = '2026-05-22';

function moelSource(
  sectionOrPage: string,
  basis: string,
  sourceTextSummary: string,
  riskFlags: RespectSourceMapping['riskFlags'] = ['법률오인'],
): RespectSourceMapping {
  return {
    sourceTitle: '직장 내 괴롭힘 판단 및 예방·대응 매뉴얼',
    sourceUrl: MOEL_SOURCE_URL,
    additionalSourceUrls: [],
    publishedDate: '2026-07-29',
    retrievedAt: '2026-10-14',
    sectionOrPage,
    sourceLocatorStatus: sectionOrPage.startsWith('PDF') ? '확정' : '보완필요',
    basis,
    sourceTextSummary,
    useCondition: '기준 참고',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags,
    expertReviewer: null,
    reviewerRole: null,
    reviewedAt: null,
    approvalDecision: '미검토',
    approvalScope: null,
    approvalArtifact: null,
    reviewStatus: '초안',
  };
}

function gapjilSource(
  sectionOrPage: string,
  basis: string,
  sourceTextSummary: string,
): RespectSourceMapping {
  return {
    sourceTitle: '공공분야 갑질 근절 가이드라인',
    sourceUrl: GAPJIL_SOURCE_URL,
    additionalSourceUrls: [],
    publishedDate: '2019-02-22',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage,
    sourceLocatorStatus: '보완필요',
    basis,
    sourceTextSummary,
    useCondition: '기준 참고',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags: ['법률오인'],
    expertReviewer: null,
    reviewerRole: null,
    reviewedAt: null,
    approvalDecision: '미검토',
    approvalScope: null,
    approvalArtifact: null,
    reviewStatus: '초안',
  };
}

function helpSource(
  basis: string,
  sourceTextSummary: string,
): RespectSourceMapping {
  return {
    sourceTitle: '109 자살예방상담전화',
    sourceUrl: HELP_SOURCE_URL,
    additionalSourceUrls: [],
    publishedDate: '2024-01-01',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage: '상담전화 안내',
    sourceLocatorStatus: '보완필요',
    basis,
    sourceTextSummary,
    useCondition: '도움 연결',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags: ['의료오인', '개인정보', '위기표현'],
    expertReviewer: null,
    reviewerRole: null,
    reviewedAt: null,
    approvalDecision: '미검토',
    approvalScope: null,
    approvalArtifact: null,
    reviewStatus: '초안',
  };
}

function safetySource(
  basis: string,
  sourceTextSummary: string,
): RespectSourceMapping {
  return {
    sourceTitle: '112신고포털 및 119 안전신고센터',
    sourceUrl: POLICE_SOURCE_URL,
    additionalSourceUrls: [FIRE_SOURCE_URL],
    publishedDate: '상시',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage: '긴급 신고 안내',
    sourceLocatorStatus: '보완필요',
    basis,
    sourceTextSummary,
    useCondition: '도움 연결',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags: ['법률오인', '개인정보', '위기표현'],
    expertReviewer: null,
    reviewerRole: null,
    reviewedAt: null,
    approvalDecision: '미검토',
    approvalScope: null,
    approvalArtifact: null,
    reviewStatus: '초안',
  };
}

function crisisSource(
  basis: string,
  sourceTextSummary: string,
): RespectSourceMapping {
  return {
    sourceTitle: '109 자살예방상담전화, 112신고포털, 119 안전신고센터',
    sourceUrl: HELP_SOURCE_URL,
    additionalSourceUrls: [POLICE_SOURCE_URL, FIRE_SOURCE_URL],
    publishedDate: '상시',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage: '자해 위험 및 긴급 신고 안내',
    sourceLocatorStatus: '보완필요',
    basis,
    sourceTextSummary,
    useCondition: '도움 연결',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags: ['의료오인', '개인정보', '위기표현'],
    expertReviewer: null,
    reviewerRole: null,
    reviewedAt: null,
    approvalDecision: '미검토',
    approvalScope: null,
    approvalArtifact: null,
    reviewStatus: '초안',
  };
}

function withQuestionMeta<T extends Omit<RespectGovernanceQuestion, 'version' | 'resultMapping'>>(
  question: T,
  resultMapping: string[],
): RespectGovernanceQuestion {
  return {
    ...question,
    version: RESPECT_QUESTION_VERSION,
    resultMapping,
  };
}

const questionSources: Record<string, { source: RespectSourceMapping; resultMapping: string[] }> = {
  A01: { source: moelSource('PDF 48쪽 / 책자 44쪽, 관계의 우위', '지위·관계의 우위', '수적·고용 형태·평가 권한을 포함하여 거절하기 어려운 관계를 확인한다.'), resultMapping: ['관계상 우위'] },
  A02: { source: moelSource('PDF 53쪽 / 책자 49쪽, 업무상 적정범위', '업무 필요성', '공식 업무와 관련된 요청인지 확인한다.'), resultMapping: ['업무범위'] },
  A03: { source: moelSource('PDF 53쪽 / 책자 49쪽, 업무상 적정범위', '방식의 상당성', '업무 관련 여부와 별개로 시간·방식·표현의 과도함을 확인한다.'), resultMapping: ['업무범위'] },
  A04: { source: gapjilSource('주요 유형', '사적 이익 요구', '개인 편의를 위한 요구를 확인한다.'), resultMapping: ['사적 요구'] },
  A05: { source: moelSource('판단 요소·행위 유형 — 세부 쪽수 검수 필요', '근무환경 영향', '근무시간·휴가·사생활 존중을 확인한다.'), resultMapping: ['존엄감 영향'] },
  A06: { source: moelSource('PDF 53쪽 / 책자 49쪽, 행위 방식과 고통', '모욕·위협', '행동 주체를 명시하고 공개·비공개·메신저의 표현을 확인한다.'), resultMapping: ['존엄감 영향', '부적절한 방식'] },
  A07: { source: gapjilSource('주요 유형', '불이익 암시·실행', '거절·질문·문제 제기에 대한 불이익을 확인한다.'), resultMapping: ['불이익'] },
  A08: { source: moelSource('PDF 56쪽 / 책자 52쪽, 종합적 판단', '반복성', '같은 상대에게 반복된 일인지 확인하며 단발·모름은 반복 점수에 넣지 않는다.'), resultMapping: ['반복성'] },
  A09: { source: moelSource('PDF 56쪽 / 책자 52쪽, 종합적 판단', '존중과 부담', '불편함을 표현한 뒤에도 요구를 계속했는지 확인한다.'), resultMapping: ['존엄감 영향'] },
  A10: { source: gapjilSource('예방·기준 확인 — 게이트 자체 문항', '제3자 기준 확인', '점수와 별개로 중단·기준 확인 필요를 묻는다.'), resultMapping: ['중단 확인'] },
  A11: { source: safetySource('현재 신체 안전', '폭력·위협·상해는 점수와 무관하게 즉시 실제 도움과 거리 확보를 우선한다.'), resultMapping: ['즉시 도움 필요'] },
  A12: { source: moelSource('PDF 53쪽 / 책자 49쪽, 업무 배제·따돌림', '부당한 배제', '정당한 업무 이유 없는 정보·회의·업무 배제와 업무 미부여 등을 확인한다.'), resultMapping: ['업무범위'] },
  E01: { source: moelSource('PDF 48쪽 / 책자 44쪽, 관계의 우위', '지위·관계의 우위', '수적·고용 형태·평가 권한을 포함하여 거절하기 어려운 관계를 확인한다.'), resultMapping: ['관계상 우위'] },
  E02: { source: moelSource('PDF 53쪽 / 책자 49쪽, 업무상 적정범위', '업무 필요성', '요구나 지시가 공식 업무와 관련됐는지 확인한다.'), resultMapping: ['업무범위'] },
  E03: { source: moelSource('PDF 53쪽 / 책자 49쪽, 업무상 적정범위', '방식의 상당성', '업무 관련 여부와 별개로 시간·방식·강도의 과도함을 확인한다.'), resultMapping: ['업무범위'] },
  E04: { source: gapjilSource('주요 유형', '사적 이익 요구', '개인 편의를 위한 요구를 받았는지 확인한다.'), resultMapping: ['사적 요구'] },
  E05: { source: moelSource('PDF 53쪽 / 책자 49쪽, 행위 방식과 고통', '모욕·위협', '공개·비공개·메신저의 모욕·위협 등을 확인한다.'), resultMapping: ['존엄감 영향', '부적절한 방식'] },
  E06: { source: moelSource('PDF 8쪽 / 책자 4쪽, 고통·근무환경 악화', '일상·업무 영향', '출근·업무수행·수면 등 영향이며 의료적 진단을 하지 않는다.', ['법률오인', '의료오인']), resultMapping: ['존엄감 영향', '도움 연결'] },
  E07: { source: gapjilSource('주요 유형', '불이익 우려·경험', '거절·질문·문제 제기와 관련된 불이익을 확인하며 법 위반으로 단정하지 않는다.'), resultMapping: ['불이익'] },
  E08: { source: moelSource('PDF 56쪽 / 책자 52쪽, 종합적 판단', '반복성', '본인에게 반복된 일인지 묻고 다른 사람의 경험과 분리한다.'), resultMapping: ['반복성'] },
  E09: { source: gapjilSource('보호·대응 절차', '기록', '기록 유무는 위험 총점에 포함하지 않는다.'), resultMapping: ['기록 준비'] },
  E10: { source: crisisSource('자해 생각과 현재 즉각 위험', '안내 초안이며 임상 위험 척도가 아니다. 비즉각 도움과 현재 실행·상해 위험을 구분하며 정신건강 전문가 검수가 필요하다.'), resultMapping: ['도움 연결', '즉시 도움 필요'] },
  E11: { source: safetySource('타인에 의한 현재 신체 위험', '외부 폭력·위협·상해는 점수와 무관하게 실제 도움과 안전한 거리 확보를 우선한다.'), resultMapping: ['즉시 도움 필요'] },
  E12: { source: moelSource('PDF 53쪽 / 책자 49쪽, 업무 배제·따돌림', '부당한 배제', '정당한 업무 이유 없는 정보·회의·업무 배제와 업무 미부여 등을 확인한다.'), resultMapping: ['업무범위'] },
};

// Runtime content is canonical; internal provenance never enters the public question module.
export const workplaceRespectQuestions: RespectGovernanceQuestion[] = workplaceRespectRuntimeQuestions.map((question) => {
  const meta = questionSources[question.id];
  if (!meta) throw new Error(`Missing respect provenance: ${question.id}`);
  return withQuestionMeta({ ...question, source: meta.source }, meta.resultMapping);
});
