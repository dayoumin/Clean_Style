export type RespectEntry = 'action' | 'experience';

export type RespectRiskAxis =
  | 'relationPower'
  | 'workScope'
  | 'dignityHarm'
  | 'privateBenefit'
  | 'disadvantage'
  | 'repetition';

export type RespectQuestionAxis = RespectRiskAxis | 'evidenceSupport' | 'resultGate' | 'crisisGate';
export type RespectRiskLevel = 'low' | 'caution' | 'high' | 'urgent';

export interface RespectChoice {
  text: string;
  score: number;
  crisis?: boolean;
  support?: boolean;
}

export interface RespectQuestion {
  id: string;
  entry: RespectEntry;
  category: '관계' | '업무범위' | '존중' | '사적요구' | '불이익' | '반복' | '기록' | '안전';
  axis: RespectQuestionAxis;
  prompt: string;
  choices: RespectChoice[];
}

export interface RespectAxisSummary {
  scores: Record<RespectRiskAxis, number>;
  activeAxes: RespectRiskAxis[];
  coreCriteriaMet: boolean;
}

export interface RespectResult {
  entry: RespectEntry;
  level: RespectRiskLevel;
  score: number;
  crisis: boolean;
  support: boolean;
  answeredCount: number;
  axisSummary: RespectAxisSummary;
  title: string;
  summary: string;
  primaryActions: string[];
  supportActions: string[];
}

export const respectEntryLabels: Record<RespectEntry, { title: string; shortTitle: string; description: string }> = {
  action: {
    title: '내 행동 점검',
    shortTitle: '내 행동',
    description: '내 말이나 지시가 상대에게 부담이나 갑질 위험으로 보일 수 있는지 살펴봅니다.',
  },
  experience: {
    title: '내가 겪은 일 점검',
    shortTitle: '겪은 일',
    description: '내가 겪은 일이 부당한지, 기록이나 상담이 필요한지 살펴봅니다.',
  },
};

export const RESPECT_RESULT_STORAGE_KEY = 'workplace-respect-result';
export const RESPECT_QUESTION_VERSION = 'v0.1';
export const RESPECT_RESULT_TTL_MS = 30 * 60 * 1000;

export const respectAxisLabels: Record<RespectRiskAxis, string> = {
  relationPower: '거절하기 어려운 관계',
  workScope: '업무범위·방식의 적정성',
  dignityHarm: '모욕감·불안 등 영향',
  privateBenefit: '사적 요구 가능성',
  disadvantage: '불이익 우려',
  repetition: '반복성',
};

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

export const workplaceRespectRuntimeQuestions: RespectQuestion[] = [
  {
    id: 'A01',
    entry: 'action',
    category: '관계',
    axis: 'relationPower',
    prompt: '상대가 내 요청을 거절하기 어려운 위치에 있었나요?',
    choices: commonChoices.noneToStrong,
  },
  {
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
  },
  {
    id: 'A03',
    entry: 'action',
    category: '업무범위',
    axis: 'workScope',
    prompt: '업무상 필요하더라도 시간, 방식, 표현이 과도했을 가능성이 있나요?',
    choices: commonChoices.noToRepeated,
  },
  {
    id: 'A04',
    entry: 'action',
    category: '사적요구',
    axis: 'privateBenefit',
    prompt: '사적인 부탁, 개인 편의, 업무와 무관한 심부름이 포함되어 있었나요?',
    choices: commonChoices.noneToRepeated,
  },
  {
    id: 'A05',
    entry: 'action',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '상대의 휴가, 근무시간, 사생활을 존중하지 못했을 가능성이 있나요?',
    choices: commonChoices.noToRepeated,
  },
  {
    id: 'A06',
    entry: 'action',
    category: '존중',
    axis: 'dignityHarm',
    prompt: '상대가 공개된 자리에서 모욕감이나 압박을 느낄 수 있는 표현을 썼나요?',
    choices: commonChoices.noneToStrong,
  },
  {
    id: 'A07',
    entry: 'action',
    category: '불이익',
    axis: 'disadvantage',
    prompt: '상대가 거절하거나 질문했을 때 평가, 인사, 업무배정에 불이익을 줄 수 있다는 인상을 줬나요?',
    choices: commonChoices.noneToStrong,
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: 'E01',
    entry: 'experience',
    category: '관계',
    axis: 'relationPower',
    prompt: '나는 상대의 요구를 거절하기 어려운 위치나 관계에 있었나요?',
    choices: commonChoices.noneToStrong,
  },
  {
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
  },
  {
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
  },
  {
    id: 'E04',
    entry: 'experience',
    category: '사적요구',
    axis: 'privateBenefit',
    prompt: '사적인 심부름, 개인적 부탁, 업무 외 요구가 있었나요?',
    choices: commonChoices.noneToRepeated,
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

export function getRespectQuestions(entry: RespectEntry): RespectQuestion[] {
  return workplaceRespectRuntimeQuestions.filter((question) => question.entry === entry);
}

export function isRespectEntry(value: string | null): value is RespectEntry {
  return value === 'action' || value === 'experience';
}

export function buildRespectCheckUrl(entry: RespectEntry): string {
  return `/respect/check?entry=${entry}`;
}

export function buildRespectResultUrl(entry: RespectEntry): string {
  const params = new URLSearchParams({
    entry,
  });
  return `/respect/result?${params.toString()}`;
}

export function getRespectResultStorageKey(entry: RespectEntry): string {
  return `${RESPECT_RESULT_STORAGE_KEY}:${entry}`;
}

export function calculateRespectResult(entry: RespectEntry, answers: number[]): RespectResult {
  const questions = getRespectQuestions(entry);
  const safeAnswers = answers.slice(0, questions.length);
  let score = 0;
  let crisis = false;
  let support = false;
  let answeredCount = 0;
  const axisScores = createAxisScores();

  safeAnswers.forEach((answer, index) => {
    const question = questions[index];
    const choice = question?.choices[answer];
    if (!question || !choice) return;

    answeredCount += 1;
    score += choice.score;
    if (isRespectRiskAxis(question.axis)) {
      axisScores[question.axis] += choice.score;
    }
    if (choice.crisis) crisis = true;
    if (choice.support) support = true;
  });

  const axisSummary = summarizeAxes(axisScores);
  const level = getRespectLevel(score, crisis, support, axisSummary);
  const content = resultContent[entry][level];

  return {
    entry,
    level,
    score,
    crisis,
    support,
    answeredCount,
    axisSummary,
    ...content,
  };
}

function createAxisScores(): Record<RespectRiskAxis, number> {
  return {
    relationPower: 0,
    workScope: 0,
    dignityHarm: 0,
    privateBenefit: 0,
    disadvantage: 0,
    repetition: 0,
  };
}

function isRespectRiskAxis(axis: RespectQuestionAxis): axis is RespectRiskAxis {
  return (
    axis === 'relationPower'
    || axis === 'workScope'
    || axis === 'dignityHarm'
    || axis === 'privateBenefit'
    || axis === 'disadvantage'
    || axis === 'repetition'
  );
}

function summarizeAxes(scores: Record<RespectRiskAxis, number>): RespectAxisSummary {
  const activeAxes = (Object.keys(scores) as RespectRiskAxis[]).filter((axis) => scores[axis] >= 2);
  const coreCriteriaMet = (
    scores.relationPower >= 2
    && (scores.workScope >= 2 || scores.privateBenefit >= 2 || scores.disadvantage >= 2)
    && (scores.dignityHarm >= 2 || scores.disadvantage >= 2 || scores.repetition >= 2)
  );

  return {
    scores,
    activeAxes,
    coreCriteriaMet,
  };
}

function getRespectLevel(
  score: number,
  crisis: boolean,
  support: boolean,
  axisSummary: RespectAxisSummary,
): RespectRiskLevel {
  if (crisis) return 'urgent';
  if (axisSummary.coreCriteriaMet && score >= 12) return 'high';
  if (score >= 18 && axisSummary.scores.relationPower >= 2 && axisSummary.activeAxes.length >= 4) return 'high';
  if (support) return 'caution';
  if (score >= 9 || axisSummary.activeAxes.length >= 3) return 'caution';
  return 'low';
}

const resultContent: Record<RespectEntry, Record<RespectRiskLevel, Omit<RespectResult, 'entry' | 'level' | 'score' | 'crisis' | 'support' | 'answeredCount' | 'axisSummary'>>> = {
  action: {
    low: {
      title: '현재 위험 신호는 낮아 보여요',
      summary: '응답만 보면 갑질 위험 요소가 뚜렷하지 않습니다. 다만 관계상 우위가 생길 수 있는 상황에서는 말투, 시간, 기록을 함께 살피는 것이 좋습니다.',
      primaryActions: ['업무 목적과 기준을 짧게 설명하세요.', '상대가 질문하거나 거절할 수 있는 여지를 남기세요.', '중요한 지시는 메신저나 메일로 남기세요.'],
      supportActions: ['애매하면 인사·감사·청렴 담당자에게 일반 기준을 확인하세요.'],
    },
    caution: {
      title: '표현이나 방식 조정이 필요해 보여요',
      summary: '업무상 필요가 있더라도 관계상 우위, 시간, 표현 방식에서 부담이 생길 수 있습니다. 같은 목적이라도 요청 방식과 기록을 조정하는 편이 안전합니다.',
      primaryActions: ['사적인 부탁이나 업무 외 요구는 중단하세요.', '공개 지적보다 1:1로 사실 중심 피드백을 하세요.', '상대가 거절해도 불이익이 없다는 점을 분명히 하세요.'],
      supportActions: ['반복되는 상황이면 팀 기준이나 기관 지침을 먼저 확인하세요.'],
    },
    high: {
      title: '갑질로 보일 위험이 높습니다',
      summary: '관계상 우위와 업무범위 초과, 모욕감, 불이익 암시, 반복성 중 여러 기준이 함께 나타납니다. 지금은 정당화보다 중단과 확인이 우선입니다.',
      primaryActions: ['해당 지시나 표현을 즉시 멈추세요.', '상대에게 불이익이 없도록 업무 배정과 평가를 분리하세요.', '기관의 인사·감사·인권 담당자에게 기준을 확인하세요.'],
      supportActions: ['이미 문제가 제기됐다면 직접 해명보다 공식 절차에 따라 사실관계를 정리하세요.'],
    },
    urgent: {
      title: '즉시 제3자 도움을 받아야 합니다',
      summary: '폭력, 보복, 심각한 압박, 안전 위험이 있다면 일반적인 조언보다 즉시 안전 확보와 제3자 개입이 먼저입니다.',
      primaryActions: ['위험한 행동이나 연락을 즉시 멈추세요.', '기관 책임자, 인사·감사·인권 담당자에게 바로 알리세요.', '물리적 위험이 있으면 112 또는 119에 연락하세요.'],
      supportActions: ['상대가 심리적으로 위험해 보이면 혼자 판단하지 말고 전문기관 연결을 우선하세요.'],
    },
  },
  experience: {
    low: {
      title: '현재 응답만으로는 위험 신호가 낮아 보여요',
      summary: '직장 내 괴롭힘 판단 요소가 뚜렷하다고 단정하기는 어렵습니다. 그래도 불편함이 남는다면 상황과 날짜를 간단히 기록해 두는 것이 좋습니다.',
      primaryActions: ['날짜, 장소, 말이나 행동을 간단히 적어두세요.', '비슷한 일이 반복되는지 지켜보세요.', '업무 기준이 애매하면 일반 상담으로 확인하세요.'],
      supportActions: ['개인정보나 실명을 많이 적지 말고 상황 중심으로 정리하세요.'],
    },
    caution: {
      title: '기록과 상담을 권장합니다',
      summary: '관계상 우위, 업무범위, 모욕감이나 불안이 일부 나타납니다. 지금은 참는 것보다 상황을 정리하고 안전한 상담 경로를 찾는 것이 좋습니다.',
      primaryActions: ['메시지, 메일, 일정, 지시 내용 등 확인 가능한 기록을 모으세요.', '신뢰할 수 있는 내부 상담창구에 일반 상담으로 문의하세요.', '혼자 대응하지 말고 조언을 받을 사람을 정하세요.'],
      supportActions: ['수면, 불안, 출근 두려움이 커지면 정신건강복지센터나 공식 자가검진을 함께 확인하세요.'],
    },
    high: {
      title: '보호 조치나 신고 검토가 필요할 수 있습니다',
      summary: '관계상 우위, 업무범위, 고통·근무환경 영향, 불이익, 반복성 중 여러 기준이 함께 나타납니다. 사실관계를 기록하고, 내부 상담·보호 조치·신고 절차를 검토하는 단계입니다.',
      primaryActions: ['상황별 기록을 시간순으로 정리하세요.', '인사·감사·인권·청렴 담당부서에 상담 가능 여부를 확인하세요.', '보복이나 2차 피해가 우려되면 분리, 배정 조정, 보호 조치를 문의하세요.'],
      supportActions: ['마음건강 영향이 크다면 109 또는 정신건강복지센터 같은 외부 도움도 함께 고려하세요.'],
    },
    urgent: {
      title: '지금은 도움 연결이 먼저입니다',
      summary: '스스로를 해칠 생각, 즉각적인 안전위험, 폭력 위험이 있다면 앱 결과보다 실제 사람과 기관의 도움을 바로 받는 것이 우선입니다.',
      primaryActions: ['혼자 있지 말고 가까운 사람에게 지금 상태를 알리세요.', '자살예방상담전화 109에 연락하세요.', '즉각적인 위험이나 폭력 위험이 있으면 112 또는 119에 연락하세요.'],
      supportActions: ['이 화면의 내용을 근거로 혼자 판단하지 말고, 지금 바로 도움을 받을 수 있는 사람이나 기관과 연결하세요.'],
    },
  },
};
