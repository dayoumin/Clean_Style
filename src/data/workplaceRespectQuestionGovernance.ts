import {
  RESPECT_QUESTION_VERSION,
  type RespectChoice,
  type RespectEntry,
  type RespectQuestion as RuntimeRespectQuestion,
  type RespectRiskAxis,
} from './workplaceRespectQuestions';

export interface RespectSourceMapping {
  sourceTitle: string;
  sourceUrl: string;
  publishedDate: string;
  retrievedAt: string;
  sectionOrPage: string;
  basis: string;
  sourceTextSummary: string;
  useCondition: '기준 참고' | '링크아웃' | '도움 연결';
  derivedOrDirect: '기준 기반 자체 문항' | '링크아웃';
  riskFlags: Array<'법률오인' | '의료오인' | '개인정보' | '위기표현'>;
  expertReviewer: string | null;
  reviewStatus: '초안' | '내부검토' | '전문가검토' | '운영중' | '폐기';
}

export interface RespectGovernanceQuestion extends RuntimeRespectQuestion {
  source: RespectSourceMapping;
  version: string;
  resultMapping: string[];
}

const MOEL_SOURCE_URL = 'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20230500514';
const GAPJIL_SOURCE_URL = 'https://www.korea.kr/archive/expDocView.do?docId=38412';
const HELP_SOURCE_URL = 'https://www.129.go.kr/109';
const RETRIEVED_AT = '2026-05-21';

function moelSource(
  sectionOrPage: string,
  basis: string,
  sourceTextSummary: string,
  riskFlags: RespectSourceMapping['riskFlags'] = ['법률오인'],
): RespectSourceMapping {
  return {
    sourceTitle: '직장 내 괴롭힘 판단 및 예방·대응 매뉴얼',
    sourceUrl: MOEL_SOURCE_URL,
    publishedDate: '2023-05-10',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage,
    basis,
    sourceTextSummary,
    useCondition: '기준 참고',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags,
    expertReviewer: null,
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
    publishedDate: '2019-02-22',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage,
    basis,
    sourceTextSummary,
    useCondition: '기준 참고',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags: ['법률오인'],
    expertReviewer: null,
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
    publishedDate: '2024-01-01',
    retrievedAt: RETRIEVED_AT,
    sectionOrPage: '상담전화 안내',
    basis,
    sourceTextSummary,
    useCondition: '도움 연결',
    derivedOrDirect: '기준 기반 자체 문항',
    riskFlags: ['의료오인', '개인정보', '위기표현'],
    expertReviewer: null,
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

const commonChoices = {
  noneToStrong: [
    { text: '아니다', score: 0 },
    { text: '애매하다', score: 1 },
    { text: '그렇다', score: 2 },
    { text: '매우 그렇다', score: 3 },
  ],
  noneToRepeated: [
    { text: '없다', score: 0 },
    { text: '애매하다', score: 1 },
    { text: '있다', score: 2 },
    { text: '반복됐다', score: 3 },
  ],
  noToRepeated: [
    { text: '아니다', score: 0 },
    { text: '조금 있다', score: 1 },
    { text: '크다', score: 2 },
    { text: '반복됐다', score: 3 },
  ],
};

export const workplaceRespectQuestions: RespectGovernanceQuestion[] = [
  withQuestionMeta({
    id: 'A01',
    entry: 'action',
    category: '관계',
    axis: 'relationPower',
    prompt: '상대가 내 요청을 거절하기 어려운 위치에 있었나요?',
    choices: commonChoices.noneToStrong,
    source: moelSource('판단 기준', '지위 또는 관계의 우위', '거절하기 어려운 관계였는지 확인한다.'),
  }, ['관계상 우위']),
  withQuestionMeta({
    id: 'A02',
    entry: 'action',
    category: '업무범위',
    axis: 'workScope',
    prompt: '그 요청이나 지시가 상대의 공식 업무와 직접 관련이 있었나요?',
    choices: [
      { text: '명확히 관련 있다', score: 0 },
      { text: '일부 관련 있다', score: 1 },
      { text: '거의 관련 없다', score: 2 },
      { text: '관련 없다', score: 3 },
    ],
    source: moelSource('판단 기준', '업무상 적정범위', '요구나 지시가 공식 업무 범위 안에 있는지 확인한다.'),
  }, ['업무상 적정범위']),
  withQuestionMeta({
    id: 'A03',
    entry: 'action',
    category: '업무범위',
    axis: 'workScope',
    prompt: '업무상 필요하더라도 시간, 방식, 표현이 과도했을 가능성이 있나요?',
    choices: commonChoices.noToRepeated,
    source: moelSource('판단 기준', '업무상 적정범위 초과', '업무 필요성이 있어도 방식과 강도가 과도할 수 있는지 확인한다.'),
  }, ['업무상 적정범위', '존엄감 영향']),
  withQuestionMeta({
    id: 'A04',
    entry: 'action',
    category: '사적요구',
    axis: 'privateBenefit',
    prompt: '사적인 부탁, 개인 편의, 업무와 무관한 심부름이 포함되어 있었나요?',
    choices: commonChoices.noneToRepeated,
    source: gapjilSource('주요 유형', '사적 이익 요구 또는 사적 지시', '업무와 무관한 개인적 요구가 포함되었는지 확인한다.'),
  }, ['사적 요구']),
  withQuestionMeta({
    id: 'A05',
    entry: 'action',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '상대의 휴가, 근무시간, 사생활을 존중하지 못했을 가능성이 있나요?',
    choices: commonChoices.noToRepeated,
    source: moelSource('판단 기준', '근무환경 악화', '근무시간과 사생활 침해로 부담이 커졌는지 확인한다.'),
  }, ['존엄감 영향']),
  withQuestionMeta({
    id: 'A06',
    entry: 'action',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '상대가 공개된 자리에서 모욕감이나 압박을 느낄 수 있는 표현을 썼나요?',
    choices: commonChoices.noneToStrong,
    source: moelSource('판단 기준', '신체적·정신적 고통', '모욕감이나 압박을 줄 수 있는 표현이 있었는지 확인한다.'),
  }, ['존엄감 영향']),
  withQuestionMeta({
    id: 'A07',
    entry: 'action',
    category: '불이익',
    axis: 'disadvantage',
    prompt: '상대가 거절하거나 질문했을 때 평가, 인사, 업무배정에 불이익을 줄 수 있다는 인상을 줬나요?',
    choices: commonChoices.noneToStrong,
    source: gapjilSource('주요 유형', '부당한 인사 또는 업무 불이익', '거절이나 이견 제시에 불이익을 암시했는지 확인한다.'),
  }, ['불이익 우려']),
  withQuestionMeta({
    id: 'A08',
    entry: 'action',
    category: '반복',
    axis: 'repetition',
    prompt: '같은 방식의 지시나 말이 한 사람 또는 여러 사람에게 반복되고 있나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '1회성이다', score: 1 },
      { text: '가끔 있다', score: 2 },
      { text: '자주 있다', score: 3 },
    ],
    source: moelSource('사례 판단 보조 요소', '반복성과 지속성', '같은 방식이 반복되는지 확인한다.'),
  }, ['반복성']),
  withQuestionMeta({
    id: 'A09',
    entry: 'action',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '상대가 불편함을 표현했는데도 같은 요구를 계속했나요?',
    choices: [
      { text: '아니다', score: 0 },
      { text: '몰랐다', score: 1 },
      { text: '그랬을 수 있다', score: 2 },
      { text: '계속했다', score: 3 },
    ],
    source: moelSource('판단 기준', '정신적 고통과 반복성', '불편함 표현 뒤에도 요구가 이어졌는지 확인한다.'),
  }, ['존엄감 영향', '반복성']),
  withQuestionMeta({
    id: 'A10',
    entry: 'action',
    category: '안전',
    axis: 'resultGate',
    prompt: '지금 이 행동을 중단하고 제3자에게 기준을 확인해야겠다는 신호가 있나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '조금 있다', score: 1 },
      { text: '분명히 있다', score: 2 },
      { text: '폭력, 보복, 안전 위험이 있다', score: 0, crisis: true },
    ],
    source: helpSource('즉각적 안전위험', '폭력, 보복, 심각한 안전위험이 있으면 일반 결과보다 제3자 도움을 우선한다.'),
  }, ['즉시 도움 필요']),
  withQuestionMeta({
    id: 'E01',
    entry: 'experience',
    category: '관계',
    axis: 'relationPower',
    prompt: '나는 상대의 요구를 거절하기 어려운 위치나 관계에 있었나요?',
    choices: commonChoices.noneToStrong,
    source: moelSource('판단 기준', '지위 또는 관계의 우위', '거절하기 어려운 관계였는지 확인한다.'),
  }, ['관계상 우위']),
  withQuestionMeta({
    id: 'E02',
    entry: 'experience',
    category: '업무범위',
    axis: 'workScope',
    prompt: '그 요구나 행동이 내 업무와 직접 관련이 있었나요?',
    choices: [
      { text: '명확히 관련 있다', score: 0 },
      { text: '일부 관련 있다', score: 1 },
      { text: '거의 관련 없다', score: 2 },
      { text: '관련 없다', score: 3 },
    ],
    source: moelSource('판단 기준', '업무상 적정범위', '요구나 행동이 업무 범위 안에 있는지 확인한다.'),
  }, ['업무상 적정범위']),
  withQuestionMeta({
    id: 'E03',
    entry: 'experience',
    category: '업무범위',
    axis: 'workScope',
    prompt: '업무 관련 행동이라도 방식, 시간, 강도가 과도하다고 느꼈나요?',
    choices: [
      { text: '아니다', score: 0 },
      { text: '조금 그렇다', score: 1 },
      { text: '상당히 그렇다', score: 2 },
      { text: '반복적으로 그렇다', score: 3 },
    ],
    source: moelSource('판단 기준', '업무상 적정범위 초과', '업무 관련 행동이라도 방식과 강도가 과도했는지 확인한다.'),
  }, ['업무상 적정범위', '존엄감 영향']),
  withQuestionMeta({
    id: 'E04',
    entry: 'experience',
    category: '사적요구',
    axis: 'privateBenefit',
    prompt: '사적인 심부름, 개인적 부탁, 업무 외 요구가 있었나요?',
    choices: commonChoices.noneToRepeated,
    source: gapjilSource('주요 유형', '사적 이익 요구 또는 사적 지시', '업무 외 사적 요구가 있었는지 확인한다.'),
  }, ['사적 요구']),
  withQuestionMeta({
    id: 'E05',
    entry: 'experience',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '모욕, 비하, 공개적 망신, 위협처럼 존엄감을 해치는 말이나 행동이 있었나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '애매하다', score: 1 },
      { text: '있었다', score: 2 },
      { text: '심했다', score: 3 },
    ],
    source: moelSource('판단 기준', '신체적·정신적 고통', '모욕, 비하, 위협처럼 존엄감을 해치는 행동이 있었는지 확인한다.'),
  }, ['존엄감 영향']),
  withQuestionMeta({
    id: 'E06',
    entry: 'experience',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '그 일 때문에 출근, 업무수행, 수면, 불안, 대인관계에 영향이 있었나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '조금 있다', score: 1 },
      { text: '상당히 있다', score: 2 },
      { text: '일상에 지장이 있다', score: 3 },
    ],
    source: moelSource('판단 기준', '신체적·정신적 고통 또는 근무환경 악화', '출근, 업무수행, 수면, 불안에 영향이 있었는지 확인한다.', ['법률오인', '의료오인']),
  }, ['존엄감 영향', '도움 연결']),
  withQuestionMeta({
    id: 'E07',
    entry: 'experience',
    category: '불이익',
    axis: 'disadvantage',
    prompt: '거절하거나 문제를 말하면 평가, 인사, 업무배정에 불이익이 있을 것 같았나요?',
    choices: [
      { text: '아니다', score: 0 },
      { text: '애매하다', score: 1 },
      { text: '그렇다', score: 2 },
      { text: '이미 있었다', score: 3 },
    ],
    source: gapjilSource('주요 유형', '부당한 인사 또는 업무 불이익', '문제 제기 후 불이익 우려나 실제 불이익이 있었는지 확인한다.'),
  }, ['불이익 우려']),
  withQuestionMeta({
    id: 'E08',
    entry: 'experience',
    category: '반복',
    axis: 'repetition',
    prompt: '비슷한 일이 반복되거나 다른 사람에게도 일어나고 있나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '모르겠다', score: 1 },
      { text: '가끔 있다', score: 2 },
      { text: '자주 있다', score: 3 },
    ],
    source: moelSource('사례 판단 보조 요소', '반복성과 조직 내 패턴', '비슷한 일이 반복되거나 다른 사람에게도 일어나는지 확인한다.'),
  }, ['반복성']),
  withQuestionMeta({
    id: 'E09',
    entry: 'experience',
    category: '기록',
    axis: 'evidenceSupport',
    prompt: '문자, 메신저, 이메일, 일정, 녹취 등 상황을 확인할 기록이 있나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '일부 있다', score: 0 },
      { text: '충분하다', score: 0 },
      { text: '여러 종류가 있다', score: 0 },
    ],
    source: gapjilSource('피해자 보호와 대응 절차', '기록과 사실관계 정리', '상담 또는 보호 요청 전 상황을 확인할 기록이 있는지 확인한다.',),
  }, ['기록 준비']),
  withQuestionMeta({
    id: 'E10',
    entry: 'experience',
    category: '안전',
    axis: 'crisisGate',
    prompt: '지금 혼자 있기에 위험하다고 느끼거나 스스로를 해칠 생각이 있나요?',
    choices: [
      { text: '없다', score: 0 },
      { text: '가끔 스친다', score: 1, support: true },
      { text: '지금 위험하다', score: 0, crisis: true },
      { text: '즉시 도움이 필요하다', score: 0, crisis: true },
    ],
    source: helpSource('자해·자살 생각 또는 즉각적 안전위험', '위험 신호가 있으면 일반 결과보다 도움 연결을 우선한다.'),
  }, ['도움 연결', '즉시 도움 필요']),
];
