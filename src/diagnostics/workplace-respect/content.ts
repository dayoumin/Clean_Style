import type { RespectChoice, RespectEntry, RespectQuestion } from './types';
import { officialActionItems2019, officialExperienceItems2026 } from './official-items';

export const RESPECT_QUESTION_VERSION = 'v0.3.0';
export const RESPECT_INSTRUMENT_VERSION = 'workplace-respect-official-v0.3.0';
export const RESPECT_SCORING_VERSION = 'opm2019-10-moel2026-25-pilot-v1';
export const RESPECT_RESULT_STORAGE_KEY = 'workplace-respect-result';
export const RESPECT_RESULT_TTL_MS = 30 * 60 * 1000;
export const RESPECT_START_NOTICE = '기관 내부 시험용 자가점검입니다. 안전·도움 확인은 점수와 별도이며, 점검을 끝내지 않아도 도움 경로를 이용할 수 있습니다. 이름·소속 등 식별정보를 묻지 않습니다.';
export function getRespectStartNotice(entry: RespectEntry): string {
  const safetyNotice = entry === 'experience'
    ? '공식 경험 문항에 앞서 신체 안전과 마음건강을 확인하는 질문이 나옵니다. 마음건강 질문에는 스스로를 해칠 생각이 있는지에 대한 내용이 포함됩니다.'
    : '공식 행동 문항에 앞서 신체 안전을 확인하는 질문이 나옵니다.';
  return `${safetyNotice} ${RESPECT_START_NOTICE}`;
}
export const RESPECT_MISSING_SCORE_NOTICE = '모름·건너뛰기는 0점으로 계산하지 않으며, 하나라도 있으면 전체 합계를 표시하지 않습니다. 유효 응답 수와 상담 안내는 볼 수 있습니다.';
export const RESPECT_EXPERIENCE_SOURCE_NOTICE = '고용노동부 2026년 매뉴얼의 사업장 조직문화 진단용 설문에서 경험 25문항을 발췌해 개인 자가점검에 활용했습니다.';
export const RESPECT_RESULT_NOTICE = '법적 판단이나 진단이 아닙니다. 점수·완료·기록 유무와 관계없이 상담과 보호 조치를 문의할 수 있습니다.';
export const RESPECT_STORAGE_NOTICE = '응답·결과는 이 탭의 브라우저 저장소에 30분의 보관 기한을 두며, 결과를 다시 열 때도 만료를 확인합니다. 결과 화면의 처음으로 버튼을 누르면 삭제합니다. AI 조언을 요청하면 응답·질문·최근 대화가 서버를 거쳐 외부 AI 제공사로 전송됩니다. 이름·소속·사건 당사자를 알아볼 정보는 적지 마세요.';
export const respectEntryLabels: Record<RespectEntry, { title: string; shortTitle: string; description: string }> = {
  action: { title: '내 행동 점검', shortTitle: '내 행동', description: '2019년 공식 예시표 10문항으로 내 행동을 돌아봅니다.' },
  experience: { title: '일터 존중 점검', shortTitle: '존중 점검', description: '최근 6개월의 경험 25문항과 시험용 빈도 합계로 상황을 정리합니다.' },
};
export const RESPECT_ACTION_GUIDANCE = '2019년 공공분야 갑질 예방 예시표의 10문항과 응답·채점을 그대로 사용합니다. 공식 문항에는 공통 회상기간이 정해져 있지 않습니다. 판단하기 어렵거나 적용할 상황이 없으면 별도 버튼으로 건너뛸 수 있습니다. 이 경우 완성 총점과 원표 구간을 내지 않습니다. 예방·상담 안내는 2026년 고용노동부 매뉴얼을 참고했습니다.';
export const RESPECT_EXPERIENCE_GUIDANCE = `다음은 최근 6개월 동안 직장 생활에서 발생한 경험의 빈도에 대한 질문입니다. ${RESPECT_EXPERIENCE_SOURCE_NOTICE} 공식 경험 문항과 다섯 빈도 응답을 사용하며, 0~4점 배점·0~100점 합계는 자체 시험안입니다. 위험 등급은 정하지 않았습니다. 모름·건너뛰기가 하나라도 있으면 전체 합계를 표시하지 않습니다. 답하기 어려운 문항은 건너뛰어도 유효 응답 수와 상담 안내를 볼 수 있습니다.`;
export function getRespectSituationGuidance(entry: RespectEntry): string {
  return entry === 'action' ? RESPECT_ACTION_GUIDANCE : RESPECT_EXPERIENCE_GUIDANCE;
}
const missingChoices: RespectChoice[] = [
  { id: 'unknown', text: '기억나지 않음·판단하기 어려움', score: 0, uncertain: true, auxiliary: true },
  { id: 'skip', text: '답변하지 않고 건너뛰기', score: 0, uncertain: true, auxiliary: true },
];
function sourceChoices(labels: string[]): RespectChoice[] {
  return [...labels.map((text, score) => ({ id: `value-${score}`, text, score })), ...missingChoices];
}
function question(value: RespectQuestion): RespectQuestion {
  return { ...value, choices: value.choices.map(choice => ({ ...choice, id: `${value.id}:${choice.id}` })) };
}
// Existing help questions stay separate from both source instruments and their totals.
const safetyQuestions: RespectQuestion[] = [
  question({ id: 'A11', entry: 'action', category: '안전', axis: 'crisisGate', prompt: '내 말이나 행동 때문에 지금 누군가의 신체 안전이 위험하거나, 이미 폭력·상해가 있었나요?', choices: [
    { id: 'safe', text: '아니다', score: 0 }, { id: 'uncertain', text: '안전한지 확신하기 어렵다', score: 0, gate: true, uncertain: true },
    { id: 'imminent', text: '폭력이나 위협을 가할 것 같다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
    { id: 'occurred', text: '이미 폭력이 있었거나 다친 사람이 있다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
  ] }),
  question({ id: 'E11', entry: 'experience', category: '안전', axis: 'crisisGate', prompt: '다른 사람의 폭력이나 위협으로 지금 내 신체 안전이 위험하거나, 이미 다쳤나요?', choices: [
    { id: 'safe', text: '아니다', score: 0 }, { id: 'uncertain', text: '안전한지 확신하기 어렵다', score: 0, gate: true, uncertain: true },
    { id: 'imminent', text: '폭력이나 위협이 진행 중이거나 곧 일어날 것 같다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
    { id: 'injured', text: '이미 다쳤거나 즉시 보호가 필요하다', score: 0, crisis: true, crisisKind: 'physicalSafety' },
  ] }),
  question({ id: 'E10', entry: 'experience', category: '안전', axis: 'crisisGate', prompt: '지금 스스로를 해칠 생각이 들거나 이미 스스로를 해친 상태인가요?', choices: [
    { id: 'no', text: '없다', score: 0 }, { id: 'passing', text: '생각이 잠깐 스치지만 지금 실행할 생각은 없다', score: 0, support: true, supportKind: 'passing' },
    { id: 'recurring', text: '생각이 반복되거나 그 생각을 혼자 감당하기 어렵다', score: 0, support: true, supportKind: 'recurring' },
    { id: 'immediate', text: '지금 실행할 것 같거나 이미 다쳐 즉시 도움이 필요하다', score: 0, crisis: true, crisisKind: 'selfHarm' },
  ] }),
];
const actionQuestions: RespectQuestion[] = officialActionItems2019.map((prompt, index) => question({
  id: `OPM19-A${String(index + 1).padStart(2, '0')}`, entry: 'action', category: '행동', axis: 'officialAction', prompt,
  choices: sourceChoices(['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다']),
}));
const experienceQuestions: RespectQuestion[] = officialExperienceItems2026.map((item, index) => question({
  id: `MOEL26-E${String(index + 1).padStart(2, '0')}`, entry: 'experience', category: '경험', axis: 'experienceFrequency',
  prompt: item.prompt, helpText: item.helpText,
  choices: sourceChoices(['전혀 없음', '6개월에 1-2회', '월 1회 정도', '주 1회 정도', '매일']),
}));
export const workplaceRespectRuntimeQuestions: RespectQuestion[] = [...safetyQuestions, ...actionQuestions, ...experienceQuestions];
/** Flow includes a distinct, unscored help step; numbered source questions are 10/25. */
export function getRespectQuestions(entry: RespectEntry): RespectQuestion[] {
  return workplaceRespectRuntimeQuestions.filter(item => item.entry === entry);
}
export function getRespectScoredQuestions(entry: RespectEntry): RespectQuestion[] {
  return getRespectQuestions(entry).filter(item => item.axis !== 'crisisGate');
}
export function getRespectSituationGuidanceIndex(entry: RespectEntry): number {
  return getRespectQuestions(entry).findIndex(item => item.axis !== 'crisisGate');
}
export function isRespectEntry(value: string | null): value is RespectEntry { return value === 'action' || value === 'experience'; }
export function buildRespectCheckUrl(entry: RespectEntry): string { return `/respect/check?entry=${entry}`; }
export function buildRespectResultUrl(entry: RespectEntry): string { return `/respect/result?entry=${entry}`; }
export function getRespectResultStorageKey(entry: RespectEntry): string { return `${RESPECT_RESULT_STORAGE_KEY}:${entry}`; }
