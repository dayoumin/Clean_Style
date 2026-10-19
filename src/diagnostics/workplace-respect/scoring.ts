import { getRespectQuestions } from './content';
import type { RespectCrisisKind, RespectEntry, RespectOfficialBand, RespectResult, RespectSupportKind } from './types';

const bandText: Record<RespectOfficialBand, string> = {
  low: '갑질 발생 가능성이 낮다.', moderate: '갑질 발생 가능성이 보통이다.',
  high: '갑질 발생 가능성이 높다.', veryHigh: '갑질 발생 가능성이 매우 높다.',
};
export function calculateRespectResult(entry: RespectEntry, answers: number[]): RespectResult {
  const questions = getRespectQuestions(entry);
  const crisisKinds = new Set<RespectCrisisKind>();
  let supportKind: RespectSupportKind | null = null;
  let safetyUncertain = false, answeredCount = 0, scoredAnsweredCount = 0, uncertainCount = 0, sum = 0;
  const reportedItems: RespectResult['reportedItems'] = [];
  for (const [index, item] of questions.entries()) {
    const answer = answers[index];
    const choice = Number.isInteger(answer) && answer >= 0 ? item.choices[answer] : undefined;
    if (!choice) continue;
    answeredCount++;
    if (item.axis === 'crisisGate') {
      if (choice.crisis) crisisKinds.add(choice.crisisKind ?? 'physicalSafety');
      safetyUncertain ||= Boolean(choice.gate);
      if (choice.supportKind && supportKind !== 'recurring') supportKind = choice.supportKind;
      continue;
    }
    if (choice.uncertain || choice.auxiliary) { uncertainCount++; continue; }
    scoredAnsweredCount++;
    sum += choice.score;
    if (choice.score > 0) reportedItems.push({ id: item.id, prompt: item.prompt, response: choice.text });
  }
  const scoredTotal = entry === 'action' ? 10 : 25;
  const maxScore = entry === 'action' ? 40 : 100;
  const score = scoredAnsweredCount === scoredTotal ? sum : null;
  const sourceBand: RespectOfficialBand | null = entry !== 'action' || score === null ? null
    : score <= 10 ? 'low' : score <= 20 ? 'moderate' : score <= 29 ? 'high' : 'veryHigh';
  const scoreLabel = entry === 'action' ? '2019년 원표 합계' : '일터 경험 빈도 합계(시험용)';
  const crisis = crisisKinds.size > 0;
  const support = supportKind !== null;
  const help = supportKind ? supportContent[supportKind] : null;
  const summary = score === null
    ? `${scoredTotal}개 중 유효 응답 ${scoredAnsweredCount}개입니다. 모름·미응답을 0점으로 바꾸지 않으므로 전체 합계${entry === 'action' ? '와 원표 구간을' : '를'} 내지 않았습니다. 답변한 내용과 관계없이 상담 안내를 이용할 수 있습니다.`
    : entry === 'action'
      ? '2019년 공식 예방 예시표의 응답·배점을 합산했습니다. 원표 구간은 해당 기관에서 검증된 발생 확률이나 법적 판정이 아닙니다. 이 표에 없는 행동도 함께 돌아볼 수 있습니다.'
      : '최근 6개월의 25가지 경험에 대한 빈도 응답을 합한 값입니다. 위험 등급 기준은 아직 정하지 않았습니다. 실제 횟수·피해 심각성·위험 확률을 뜻하지 않으며, 한 번의 경험도 상담할 수 있습니다.';
  const primaryActions = entry === 'action'
    ? ['걱정되는 말·지시·요청이 있다면 멈추거나 조정하고 업무상 필요와 방법을 돌아보세요.', '상대에게 해명·용서·직접 대면을 강요하지 말고, 필요하면 안전한 제3자에게 기준을 확인하세요.', '정상적인 업무지시와의 구분은 필요성·방식·정도·맥락을 함께 살펴보세요.']
    : ['기억나는 날짜·장소·구체적인 말이나 행동을 원하는 범위에서 정리하세요. 메모와 증거는 필수가 아닙니다.', '신뢰할 수 있는 사람이나 안전한 내부·외부 상담창구를 확인하세요.', '불이익이나 2차 피해가 걱정되면 보호 조치와 비밀보장 범위도 문의하세요.'];
  return {
    entry, score, maxScore, scoreLabel, sourceBand, sourceBandText: sourceBand ? bandText[sourceBand] : null,
    scoredAnsweredCount, scoredTotal, reportedItems, crisis, crisisKinds: [...crisisKinds], support, supportKind,
    safetyUncertain, answeredCount, uncertainCount, informationLimited: score === null,
    title: entry === 'action' ? '내 행동을 돌아보는 결과' : '일터 경험을 정리한 결과', summary, primaryActions,
    supportActions: help ? help.actions : ['기관의 갑질·괴롭힘 담당자, 인사·감사·인권·고충처리·EAP 등 실제 운영 중인 안전한 창구를 확인하세요. 내부 연결이 어렵다면 외부 상담을 선택할 수 있습니다.'],
    supportNotice: help ? help.notice : null, safetyNotice: safetyUncertain ? safetyContent[entry] : null,
    ...(crisis ? crisisContent(entry, [...crisisKinds]) : {}),
  };
}
const supportContent: Record<RespectSupportKind, { summary: string; title: string; actions: string[]; notice: { title: string; body: string } }> = {
  passing: {
    summary: '마음건강 도움 신호를 선택했습니다. 일터 상황의 판단과 별개로 지금 상태를 살피고 도움을 받을 경로를 확인하세요.',
    title: '지금 상태와 도움 경로를 확인하세요',
    actions: ['가까운 신뢰할 수 있는 사람에게 현재 상태를 알리고 정신건강복지센터나 109 상담에 연결하세요. 즉시 위험해지면 119 등 긴급 도움을 요청하세요.'],
    notice: {
      title: '도움받을 수 있는 곳',
      body: '스치는 생각이라도 혼자 감당하지 않아도 됩니다. 빈도만으로 현재 안전을 판단하지 않습니다. 가까운 사람이나 109 자살예방상담전화에 지금 상태를 알려주세요. 지금 실행할 것 같거나 다쳐 응급 도움이 필요하면 119에 연결하세요.',
    },
  },
  // Frequency does not establish safety or an appropriate clinical response deadline.
  recurring: {
    summary: '마음건강 도움 신호 중 자해 생각이 반복되거나 혼자 감당하기 어렵다는 응답입니다. 이 응답만으로 현재 안전이나 위험 수준을 판단할 수 없습니다. 일터 점검보다 실제 사람과 도움을 연결하는 것이 먼저입니다.',
    title: '사람과 연결해 현재 상태를 확인하세요',
    actions: ['가까운 신뢰할 수 있는 사람에게 지금 상태를 알리고 109 자살예방상담전화에 연락하세요.', '지금 실행할 것 같거나 다쳐 응급 도움이 필요하면 119에 연결하세요.'],
    notice: {
      title: '도움받을 수 있는 곳',
      body: '혼자 감당하지 않아도 됩니다. 생각의 빈도만으로 현재 안전을 판단할 수 없습니다. 가까운 사람이나 109 자살예방상담전화에 지금 상태를 알려주세요. 지금 실행할 것 같거나 다쳐 응급 도움이 필요하면 119에 연결하세요.',
    },
  },
};

// A11/E11 "안전한지 확신하기 어렵다" stays non-urgent, but the result must still lead with physical safety.
const safetyContent: Record<RespectEntry, { title: string; body: string }> = {
  action: {
    title: '안전부터 확인하세요',
    body: '해당 말·연락·행동을 멈추고 상대와 거리를 두세요. 지금 폭력·위협 위험이 있으면 112, 상해로 응급 도움이 필요하면 119에 연결하세요. 안전을 확신하기 어렵다면 점검보다 믿을 수 있는 사람의 도움을 먼저 요청하세요.',
  },
  experience: {
    title: '안전부터 확인하세요',
    body: '상대와 거리를 두고 안전한 장소와 믿을 수 있는 사람을 먼저 확보하세요. 지금 폭력·위협 위험이 있으면 112, 상해로 응급 도움이 필요하면 119에 연결하세요. 안전을 확신하기 어렵다면 혼자 판단하지 말고 도움을 요청하세요.',
  },
};


function crisisContent(entry: RespectEntry, crisisKinds: RespectCrisisKind[]) {
    const selfHarm = crisisKinds.includes('selfHarm');
    return {
      title: '지금은 안전과 도움 연결이 먼저입니다',
      summary: selfHarm ? '지금 스스로를 해칠 수 있거나 이미 다쳤다는 응답입니다. 점검보다 실제 사람과 기관의 도움을 먼저 받아주세요.' : '폭력·위협·상해와 관련된 안전 우려를 선택했습니다. 지금도 위험하거나 다친 사람이 있다면 점검보다 안전한 거리와 실제 도움을 먼저 확보하세요.',
      primaryActions: entry === 'action'
        ? ['위협적인 말·연락·행동을 즉시 멈추고 상대와 거리를 두세요.', '상대에게 직접 해명이나 대면을 요구하지 말고 안전한 책임자에게 도움을 요청하세요.', '폭력 위험은 112, 상해·응급 상황은 119에 바로 연결하세요.']
        : selfHarm
          ? ['혼자 감당하지 말고 가까운 신뢰할 수 있는 사람에게 지금 상태를 알리세요.', '즉시 다칠 위험이 있거나 이미 다쳤다면 119에 연결하세요. 자해 생각의 상담은 109에서 도움을 받을 수 있습니다.', '다른 사람의 폭력 위험도 있으면 안전한 장소로 이동하고 112에 연결하세요.']
          : ['상대와 거리를 두고 안전한 장소로 이동하세요.', '폭력·위협은 112, 상해·응급 상황은 119에 바로 연결하세요.', '기관 내부 연락이 위험하거나 도움을 지연시키면 외부 도움을 먼저 요청하세요.'],
      supportActions: ['가까운 신뢰할 수 있는 사람이나 안전한 책임자에게 현재 상황과 필요한 보호를 알려주세요.'],
      supportNotice: null,
    };
  }
