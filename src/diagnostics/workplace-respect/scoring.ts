import { getRespectQuestions, respectAxisLabels } from './content';
import type { RespectAxisSummary, RespectCrisisKind, RespectEntry, RespectResult, RespectRiskAxis, RespectRiskLevel } from './types';

const riskAxes: RespectRiskAxis[] = ['relationPower', 'workScope', 'dignityHarm', 'privateBenefit', 'disadvantage', 'repetition'];
function emptyAxes(): Record<RespectRiskAxis, number> {
  return { relationPower: 0, workScope: 0, dignityHarm: 0, privateBenefit: 0, disadvantage: 0, repetition: 0 };
}
export function calculateRespectResult(entry: RespectEntry, answers: number[]): RespectResult {
  const questions = getRespectQuestions(entry);
  const scores = emptyAxes();
  const crisisKinds = new Set<RespectCrisisKind>();
  let score = 0, answeredCount = 0, uncertainCount = 0;
  let support = false, resultGate = false, strongSignal = false, improperTreatment = false;
  answers.slice(0, questions.length).forEach((answer, index) => {
    if (!Number.isInteger(answer)) return;
    const item = questions[index];
    const choice = item?.choices[answer];
    if (!choice) return;
    answeredCount++;
    if (choice.uncertain) uncertainCount++;
    if (riskAxes.includes(item.axis as RespectRiskAxis)) {
      const axis = item.axis as RespectRiskAxis;
      scores[axis] = Math.max(scores[axis], choice.score);
      // Relation and repetition describe context, not a problematic act, so they cannot raise the level alone.
      strongSignal ||= choice.score >= 3 && axis !== 'relationPower' && axis !== 'repetition';
      if (['A06', 'E05', 'A12', 'E12'].includes(item.id) && choice.score >= 2) improperTreatment = true;
    }
    if (choice.crisis) crisisKinds.add(choice.crisisKind ?? 'physicalSafety');
    support ||= Boolean(choice.support);
    resultGate ||= Boolean(choice.gate);
  });
  // An axis requires one clearly endorsed item; two mild answers do not activate it.
  score = riskAxes.reduce((total, axis) => total + scores[axis], 0);
  const activeAxes = riskAxes.filter((axis) => scores[axis] >= 2);
  const active = new Set(activeAxes);
  const coreCriteriaMet = active.has('relationPower')
    && (active.has('workScope') || active.has('privateBenefit') || active.has('disadvantage') || improperTreatment)
    && (active.has('dignityHarm') || active.has('disadvantage') || active.has('repetition'));
  const relationWithSignal = active.has('relationPower') && activeAxes.length >= 2;
  const axisSummary: RespectAxisSummary = { scores, activeAxes, coreCriteriaMet };
  const crisis = crisisKinds.size > 0;
  // Provisional guidance thresholds, not legal or clinical classifications.
  const level: RespectRiskLevel = crisis ? 'urgent'
    : coreCriteriaMet && score >= 8 ? 'high'
    : coreCriteriaMet || relationWithSignal || strongSignal || improperTreatment || active.has('dignityHarm') || active.has('disadvantage')
      || resultGate || support || score >= 6 || activeAxes.length >= 3 ? 'caution' : 'low';
  return { entry, level, score, crisis, crisisKinds: [...crisisKinds], support, answeredCount, uncertainCount, axisSummary,
    ...buildContent(entry, level, axisSummary, support, [...crisisKinds], uncertainCount) };
}

function buildContent(entry: RespectEntry, level: RespectRiskLevel, axes: RespectAxisSummary, support: boolean, crisisKinds: RespectCrisisKind[], uncertainCount: number) {
  if (level === 'urgent') {
    const selfHarm = crisisKinds.includes('selfHarm');
    return {
      title: '지금은 안전과 도움 연결이 먼저입니다',
      summary: selfHarm ? '지금 스스로를 해칠 수 있거나 이미 다쳤다는 응답입니다. 점검보다 실제 사람과 기관의 도움을 먼저 받아주세요.' : '지금 폭력·위협·상해와 관련된 안전 우려를 선택했습니다. 점검보다 안전한 거리와 실제 도움을 먼저 확보하세요.',
      primaryActions: entry === 'action'
        ? ['위협적인 말·연락·행동을 즉시 멈추고 상대와 거리를 두세요.', '상대에게 직접 해명이나 대면을 요구하지 말고 안전한 책임자에게 도움을 요청하세요.', '폭력 위험은 112, 상해·응급 상황은 119에 바로 연결하세요.']
        : selfHarm
          ? ['혼자 감당하지 말고 가까운 신뢰할 수 있는 사람에게 지금 상태를 알리세요.', '즉시 다칠 위험이 있거나 이미 다쳤다면 119에 연결하세요. 자해 생각의 상담은 109에서 도움을 받을 수 있습니다.', '다른 사람의 폭력 위험도 있으면 안전한 장소로 이동하고 112에 연결하세요.']
          : ['상대와 거리를 두고 안전한 장소로 이동하세요.', '폭력·위협은 112, 상해·응급 상황은 119에 바로 연결하세요.', '기관 내부 연락이 위험하거나 도움을 지연시키면 외부 도움을 먼저 요청하세요.'],
      supportActions: ['가까운 신뢰할 수 있는 사람이나 안전한 책임자에게 현재 상황과 필요한 보호를 알려주세요.'],
    };
  }
  const action = entry === 'action';
  const signals = axes.activeAxes.map((axis) => respectAxisLabels[axis]);
  const summary = signals.length > 0
    ? `응답에서 ${signals.join(', ')}에 관한 신호를 확인했습니다. ${action ? '표현과 요청을 돌아보고 필요하면 제3자에게 기준을 확인하세요.' : '상황을 기록하고 안전한 상담 경로를 살펴보세요.'}`
    : support ? '마음건강 도움 신호를 선택했습니다. 일터 상황의 판단과 별개로 지금 상태를 살피고 도움을 받을 경로를 확인하세요.'
    : uncertainCount > 0 ? '판단하기 어렵다는 응답이 포함되어 있습니다. 불분명한 사실을 정리하고 필요하면 안전한 창구에 기준을 확인하세요.'
    : level === 'caution' ? '중단이나 기준 확인이 필요하다는 응답입니다. 상황을 정리하고 제3자에게 확인할 경로를 살펴보세요.'
    : '이번 응답에서 드러난 신호는 제한적입니다. 점검에 담지 못한 사정이나 불편함이 남아 있다면 기록과 상담으로 확인해 볼 수 있습니다.';
  const primaryActions = action
    ? ['업무 목적과 기준을 짧게 설명하세요.', '상대가 질문하거나 거절할 수 있는 여지를 남기세요.', '필요하면 안전한 인사·감사·인권 담당자에게 기준을 확인하세요.']
    : ['날짜, 장소, 말이나 행동을 상황 중심으로 기록하세요.', '신뢰할 수 있는 사람이나 안전한 내부·외부 상담창구를 확인하세요.', '불이익이나 2차 피해가 걱정되면 보호 조치도 문의하세요.'];
  if (action && axes.scores.privateBenefit >= 2) primaryActions[0] = '사적인 부탁이나 업무 외 요구를 멈추고 업무 기준을 확인하세요.';
  if (action && level === 'high') primaryActions[1] = '해당 요청이나 표현을 멈추고 상대에게 불이익이 없도록 하세요.';
  return {
    title: level === 'low' ? '응답에 담긴 상황을 더 살펴보세요' : level === 'high' ? (action ? '행동 중단과 기준 확인을 권장합니다' : '기록과 보호 조치 검토를 권장합니다') : support ? '지금 상태와 도움 경로를 확인하세요' : (action ? '표현·방식과 기준을 확인하세요' : '기록과 상담을 권장합니다'),
    summary, primaryActions,
    supportActions: support ? ['가까운 신뢰할 수 있는 사람에게 현재 상태를 알리고 정신건강복지센터나 109 상담에 연결하세요. 즉시 위험해지면 119 등 긴급 도움을 요청하세요.']
      : [action ? '기관의 갑질 예방·인사·복무 기준을 함께 확인하세요.' : '일상에 미친 영향이 크다면 정신건강복지센터나 기관 상담창구도 확인하세요.'],
  };
}
