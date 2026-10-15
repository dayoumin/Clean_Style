import type { RespectChoice, RespectEntry, RespectQuestion, RespectRiskAxis } from './types';

export const RESPECT_QUESTION_VERSION = 'v0.2';
export const RESPECT_INSTRUMENT_VERSION = 'workplace-respect-v0.2';
export const RESPECT_SCORING_VERSION = 'workplace-respect-risk-v0.2.1';
export const RESPECT_RESULT_STORAGE_KEY = 'workplace-respect-result';
export const RESPECT_RESULT_TTL_MS = 30 * 60 * 1000;
export const RESPECT_SITUATION_GUIDANCE = '점검할 한 사건이나 이어지는 상황 하나와 관련된 상대를 떠올려주세요. 상대는 한 사람 또는 집단일 수 있습니다. 그 상황이 시작된 때부터 지금까지를 기준으로 답해주세요. 판단하기 어렵거나 해당하지 않는 경우에는 그에 맞는 선택지를 골라주세요.';
export const respectEntryLabels: Record<RespectEntry, { title: string; shortTitle: string; description: string }> = {
  action: { title: '내 행동 점검', shortTitle: '내 행동', description: '내 말이나 지시가 상대에게 준 부담을 돌아봅니다.' },
  experience: { title: '일터 존중 점검', shortTitle: '존중 점검', description: '내가 겪은 일을 정리하고 기록·상담·도움 경로를 살펴봅니다.' },
};
export const respectAxisLabels: Record<RespectRiskAxis, string> = {
  relationPower: '거절하기 어려운 관계', workScope: '업무범위·방식의 적정성', dignityHarm: '존중·일상에 미친 영향',
  privateBenefit: '사적 요구', disadvantage: '불이익 우려·경험', repetition: '반복성',
};
const agreement: RespectChoice[] = [
  { id: 'no', text: '아니다 / 해당하지 않는다', score: 0 },
  { id: 'uncertain', text: '판단하기 어렵다', score: 0, uncertain: true },
  { id: 'yes', text: '그렇다', score: 2 }, { id: 'strong', text: '매우 그렇다', score: 3 },
];
const intensity: RespectChoice[] = [
  { id: 'no', text: '아니다 / 해당하지 않는다', score: 0 }, { id: 'mild', text: '조금 과도했다', score: 1 },
  { id: 'clear', text: '상당히 과도했다', score: 2 }, { id: 'strong', text: '매우 과도했다', score: 3 },
];
const repetition: RespectChoice[] = [
  { id: 'notRepeated', text: '없거나 한 번뿐이었다', score: 0 },
  { id: 'uncertain', text: '반복 여부를 모르겠다', score: 0, uncertain: true },
  { id: 'sometimes', text: '가끔 반복됐다', score: 2 }, { id: 'often', text: '자주 반복됐다', score: 3 },
];
const relevance: RespectChoice[] = [
  { id: 'relevant', text: '명확히 관련 있다 / 요구가 없었다', score: 0 }, { id: 'partlyRelevant', text: '일부 관련 있다', score: 1 },
  { id: 'barelyRelevant', text: '거의 관련 없다', score: 2 }, { id: 'irrelevant', text: '관련 없다', score: 3 },
];
function question(value: RespectQuestion): RespectQuestion {
  return { ...value, choices: value.choices.map((choice) => ({ ...choice, id: `${value.id}:${choice.id}` })) };
}
export const workplaceRespectRuntimeQuestions: RespectQuestion[] = [
  question({ id: 'A01', entry: 'action', category: '관계', axis: 'relationPower', prompt: '직위, 평가 권한, 고용 형태 또는 집단의 영향력 때문에 상대가 내 요청이나 의견을 거절하기 어려웠나요?', choices: agreement }),
  question({ id: 'A02', entry: 'action', category: '업무범위', axis: 'workScope', prompt: '내 요청이나 지시가 상대의 공식 업무와 직접 관련이 있었나요?', choices: relevance }),
  question({ id: 'A03', entry: 'action', category: '업무범위', axis: 'workScope', prompt: '업무 관련 여부와 별개로, 내가 요청한 시간·방식·표현이 과도했나요?', choices: intensity }),
  question({ id: 'A04', entry: 'action', category: '사적요구', axis: 'privateBenefit', prompt: '내 개인 편의를 위한 부탁이나 업무와 무관한 심부름을 요구했나요?', choices: agreement }),
  question({ id: 'A05', entry: 'action', category: '존중', axis: 'dignityHarm', prompt: '나는 상대의 휴가·근무시간·사생활을 존중하지 못했나요?', choices: agreement }),
  question({ id: 'A06', entry: 'action', category: '존중', axis: 'dignityHarm', prompt: '나는 상대에게 모욕·비하·위협으로 받아들여질 수 있는 말을 했나요? 공개된 자리, 1:1 대화, 메신저를 모두 포함합니다.', choices: agreement }),
  question({ id: 'A07', entry: 'action', category: '불이익', axis: 'disadvantage', prompt: '상대의 거절·질문·문제 제기에 평가, 인사, 업무배정의 불이익을 암시하거나 실제로 줬나요?', choices: [
    { id: 'no', text: '아니다 / 그런 상황이 없었다', score: 0 }, { id: 'uncertain', text: '판단하기 어렵다', score: 0, uncertain: true },
    { id: 'implied', text: '불이익을 암시했다', score: 2 }, { id: 'occurred', text: '실제 불이익을 줬다', score: 3 },
  ] }),
  question({ id: 'A08', entry: 'action', category: '반복', axis: 'repetition', prompt: '같은 상대에게 비슷한 요구나 말이 반복됐나요?', choices: repetition }),
  question({ id: 'A09', entry: 'action', category: '존중', axis: 'dignityHarm', prompt: '상대가 불편함을 표현한 뒤에도 나는 같은 요구를 계속했나요?', choices: [
    { id: 'no', text: '아니다 / 불편함을 표현한 상황이 없었다', score: 0 }, { id: 'uncertain', text: '판단하기 어렵다', score: 0, uncertain: true },
    { id: 'possible', text: '계속했을 수 있다', score: 2 }, { id: 'continued', text: '계속했다', score: 3 },
  ] }),
  question({ id: 'A10', entry: 'action', category: '안전', axis: 'resultGate', prompt: '이 행동을 멈추고 제3자에게 기준을 확인할 필요가 있다고 느끼나요?', choices: [
    { id: 'no', text: '아니다', score: 0 }, { id: 'uncertain', text: '판단하기 어렵다', score: 0, uncertain: true },
    { id: 'review', text: '확인이 필요하다', score: 0, gate: true }, { id: 'stop', text: '지금 멈추고 확인해야 한다', score: 0, gate: true },
  ] }),
  question({ id: 'A11', entry: 'action', category: '안전', axis: 'crisisGate', prompt: '지금 내 말이나 행동으로 누군가의 신체 안전이 위험한가요?', choices: [
    { id: 'safe', text: '아니다', score: 0 }, { id: 'uncertain', text: '안전한지 확신하기 어렵다', score: 0, gate: true, uncertain: true },
    { id: 'imminent', text: '폭력이나 위협을 가할 것 같다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
    { id: 'occurred', text: '폭력이 있었거나 다친 사람이 있다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
  ] }),
  question({ id: 'A12', entry: 'action', category: '업무범위', axis: 'workScope', prompt: '정당한 업무 이유 없이 상대를 정보·회의·업무에서 배제하거나, 일을 주지 않거나, 허드렛일만 맡겼나요?', choices: agreement }),
  question({ id: 'E01', entry: 'experience', category: '관계', axis: 'relationPower', prompt: '직위, 평가 권한, 고용 형태 또는 집단의 영향력 때문에 상대의 요구나 의견을 거절하기 어려웠나요?', choices: agreement }),
  question({ id: 'E02', entry: 'experience', category: '업무범위', axis: 'workScope', prompt: '상대의 요구나 지시가 내 공식 업무와 직접 관련이 있었나요?', choices: relevance }),
  question({ id: 'E03', entry: 'experience', category: '업무범위', axis: 'workScope', prompt: '업무 관련 여부와 별개로, 상대의 행동 방식·시간·강도가 과도했나요?', choices: intensity }),
  question({ id: 'E04', entry: 'experience', category: '사적요구', axis: 'privateBenefit', prompt: '상대의 개인 편의를 위한 부탁이나 업무와 무관한 심부름을 요구받았나요?', choices: agreement }),
  question({ id: 'E05', entry: 'experience', category: '존중', axis: 'dignityHarm', prompt: '모욕·비하·위협으로 받아들여질 수 있는 말이나 행동이 있었나요? 공개된 자리, 1:1 대화, 메신저를 모두 포함합니다.', choices: [
    { id: 'no', text: '없었다', score: 0 }, { id: 'uncertain', text: '판단하기 어렵다', score: 0, uncertain: true },
    { id: 'present', text: '있었다', score: 2 }, { id: 'severe', text: '심했다', score: 3 },
  ] }),
  question({ id: 'E06', entry: 'experience', category: '존중', axis: 'dignityHarm', prompt: '그 상황 때문에 출근, 업무수행, 수면, 불안, 대인관계에 영향이 있었나요?', choices: [
    { id: 'no', text: '없었다', score: 0 }, { id: 'mild', text: '조금 있었다', score: 1 },
    { id: 'clear', text: '상당히 있었다', score: 2 }, { id: 'disrupted', text: '일상에 지장이 있었다', score: 3 },
  ] }),
  question({ id: 'E07', entry: 'experience', category: '불이익', axis: 'disadvantage', prompt: '거절·질문·문제 제기를 이유로 평가, 인사, 업무배정의 불이익이 걱정되거나 실제로 있었나요?', choices: [
    { id: 'no', text: '아니다 / 그런 상황이 없었다', score: 0 }, { id: 'uncertain', text: '판단하기 어렵다', score: 0, uncertain: true },
    { id: 'expected', text: '불이익이 걱정됐다', score: 2 }, { id: 'occurred', text: '실제 불이익이 있었다', score: 3 },
  ] }),
  question({ id: 'E08', entry: 'experience', category: '반복', axis: 'repetition', prompt: '나에게 비슷한 일이 반복됐나요?', choices: repetition }),
  question({ id: 'E09', entry: 'experience', category: '기록', axis: 'evidenceSupport', prompt: '문자, 메신저, 이메일, 일정 등 상황을 확인할 기록이 있나요?', choices: [
    { id: 'none', text: '없다', score: 0 }, { id: 'some', text: '일부 있다', score: 0 }, { id: 'enough', text: '충분하다', score: 0 }, { id: 'several', text: '여러 종류가 있다', score: 0 },
  ] }),
  question({ id: 'E10', entry: 'experience', category: '안전', axis: 'crisisGate', prompt: '지금 스스로를 해칠 생각이 들거나 이미 스스로를 해친 상태인가요?', choices: [
    { id: 'no', text: '없다', score: 0 }, { id: 'passing', text: '생각이 잠깐 스치지만 지금 실행할 생각은 없다', score: 0, support: true },
    { id: 'recurring', text: '생각이 반복되거나 혼자 감당하기 어렵다', score: 0, support: true },
    { id: 'immediate', text: '지금 실행할 것 같거나 이미 다쳐 즉시 도움이 필요하다', score: 0, crisis: true, crisisKind: 'selfHarm' },
  ] }),
  question({ id: 'E11', entry: 'experience', category: '안전', axis: 'crisisGate', prompt: '지금 다른 사람의 폭력이나 위협으로 내 신체 안전이 위험한가요?', choices: [
    { id: 'safe', text: '아니다', score: 0 }, { id: 'uncertain', text: '안전한지 확신하기 어렵다', score: 0, gate: true, uncertain: true },
    { id: 'imminent', text: '폭력이나 위협이 진행 중이거나 곧 일어날 것 같다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
    { id: 'injured', text: '이미 다쳤거나 즉시 보호가 필요하다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
  ] }),
  question({ id: 'E12', entry: 'experience', category: '업무범위', axis: 'workScope', prompt: '정당한 업무 이유 없이 정보·회의·업무에서 배제되거나, 일을 받지 못하거나, 허드렛일만 맡았나요?', choices: agreement }),
];
export function getRespectQuestions(entry: RespectEntry): RespectQuestion[] {
  const safetyFirst = entry === 'action' ? ['A11'] : ['E11', 'E10'];
  const priority = (id: string) => safetyFirst.includes(id) ? safetyFirst.indexOf(id) : safetyFirst.length;
  return workplaceRespectRuntimeQuestions.filter((item) => item.entry === entry).sort((a, b) => priority(a.id) - priority(b.id));
}
export function isRespectEntry(value: string | null): value is RespectEntry { return value === 'action' || value === 'experience'; }
export function buildRespectCheckUrl(entry: RespectEntry): string { return `/respect/check?entry=${entry}`; }
export function buildRespectResultUrl(entry: RespectEntry): string { return `/respect/result?entry=${entry}`; }
export function getRespectResultStorageKey(entry: RespectEntry): string { return `${RESPECT_RESULT_STORAGE_KEY}:${entry}`; }
