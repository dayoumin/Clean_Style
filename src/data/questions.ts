// 청렴 스타일 테스트 - 15문항
// 3개 축: principle(원칙↔유연), transparency(투명↔신중), independence(독립↔협력)
// 각 축은 양수 = 앞쪽(원칙/투명/독립), 음수 = 뒤쪽(유연/신중/협력)
//
// 매핑 기준:
//   투명(+1) = 정보를 즉시 공유/보고/공개하는 행위
//   신중(-1) = 먼저 확인/파악한 뒤 판단하는 행위
//   원칙(+1) = 규정/절차/기준을 우선하는 행위
//   유연(-1) = 상황/맥락/효율을 고려하는 행위
//   독립(+1) = 혼자 판단하고 실행하는 행위
//   협력(-1) = 타인과 함께 판단/행동하는 행위
//
// 점수 균형 목표: 각 축 +1/-1 기회가 대략 동일 (±2 이내)

export interface Choice {
  text: string;
  scores: {
    principle?: number;    // +1 원칙, -1 유연
    transparency?: number; // +1 투명, -1 신중
    independence?: number; // +1 독립, -1 협력
  };
}

export interface Question {
  id: number;
  category: 'research' | 'admin' | 'relation';
  situation: string;
  choices: Choice[];
}

export const questions: Question[] = [
  // ── 연구·데이터 영역 (5문항) ──
  {
    id: 1,
    category: 'research',
    situation: '실험 데이터 정리 중 예상과 다른 결과가 나왔다. 마감도 얼마 안 남았는데...',
    choices: [
      { text: '일단 전부 기록해두고 내일 다시 본다', scores: { principle: 1, independence: 1 } },
      { text: '선임연구원에게 같이 봐달라고 한다', scores: { transparency: 1, independence: -1 } },
      { text: '전체 흐름을 먼저 파악하고, 나중에 다시 살펴본다', scores: { principle: -1 } },
      { text: '이상한 부분만 메모해두고 팀 회의에서 꺼낸다', scores: { transparency: 1, independence: -1 } },
    ],
  },
  {
    id: 2,
    category: 'research',
    situation: '공동연구 보고서 작성 중인데, 동료가 "이 수치 좀 반올림해서 깔끔하게 하자"고 한다.',
    choices: [
      { text: '"원본 그대로 쓰는 게 맞지 않나" 하고 얘기한다', scores: { principle: 1 } },
      { text: '의미 있는 차이인지 먼저 확인해본다', scores: { transparency: -1, independence: 1 } },
      { text: '보고서 가독성도 중요하니 적절히 조정한다', scores: { principle: -1 } },
      { text: '팀장한테 어디까지 정리해도 되는지 물어본다', scores: { independence: -1, transparency: -1 } },
    ],
  },
  {
    id: 3,
    category: 'research',
    situation: '연구비 집행 마감이 다가오는데, 소액이 남았다. 올해 안에 써야 이월이 안 된다.',
    choices: [
      { text: '쓸 곳이 없으면 반납이 맞다고 보고 정리한다', scores: { principle: 1 } },
      { text: '다음 실험에 필요한 소모품을 미리 확보해둔다', scores: { principle: -1, independence: 1 } },
      { text: '연구관리팀에 이월 가능 여부를 먼저 확인한다', scores: { transparency: 1, independence: -1 } },
      { text: '팀원들에게 필요한 물품이 있는지 취합해본다', scores: { independence: -1 } },
    ],
  },
  {
    id: 4,
    category: 'research',
    situation: '연구 중간보고 시점인데, 일부 실험이 예상대로 안 돼서 당초 계획보다 진도가 늦다.',
    choices: [
      { text: '지연 상황과 원인을 솔직하게 보고한다', scores: { transparency: 1 } },
      { text: '할 수 있는 데까지 해보고, 보고 시점에 정리해서 말한다', scores: { principle: -1 } },
      { text: '비슷한 경험이 있는 동료에게 먼저 조언을 구한다', scores: { transparency: -1, independence: -1 } },
      { text: '방법을 바꿔서라도 일정 내 결과를 내본다', scores: { independence: 1, principle: -1 } },
    ],
  },
  {
    id: 5,
    category: 'research',
    situation: '논문 공동저자 순서를 정해야 하는데, 기여도 판단이 애매하다.',
    choices: [
      { text: '기여도 기준표를 만들어 객관적으로 정한다', scores: { principle: 1, independence: 1 } },
      { text: '관련된 사람들 모두 모여서 솔직하게 논의한다', scores: { transparency: 1, independence: -1 } },
      { text: '그동안 관행을 참고해서 적절히 조율한다', scores: { principle: -1, transparency: -1 } },
      { text: '팀장에게 최종 판단을 맡긴다', scores: { independence: -1 } },
    ],
  },

  // ── 행정·계약 영역 (5문항) ──
  {
    id: 6,
    category: 'admin',
    situation: '물품을 구매하려는데, 자주 거래하던 업체가 가격은 살짝 비싸지만 빠르고 편하다.',
    choices: [
      { text: '비교견적 절차를 밟고 최저가로 진행한다', scores: { principle: 1 } },
      { text: '금액 차이가 크지 않으면 기존 업체로 간다', scores: { principle: -1, independence: 1 } },
      { text: '다른 업체도 알아보되, 담당자와 상의해서 결정한다', scores: { independence: -1 } },
      { text: '비교견적 과정과 선정 이유를 문서로 남긴다', scores: { transparency: 1 } },
    ],
  },
  {
    id: 7,
    category: 'admin',
    situation: '용역 계약서에 해석이 달라질 수 있는 조항이 있다. 상대방은 "실무에서는 다 이렇게 한다"고 한다.',
    choices: [
      { text: '해당 조항의 문구를 구체적으로 바꿔서 제안한다', scores: { principle: 1, independence: 1 } },
      { text: '법무/계약 담당에게 의견을 구한다', scores: { transparency: 1, independence: -1 } },
      { text: '실무 관행도 중요하니 전체 맥락을 보고 판단한다', scores: { principle: -1, transparency: -1 } },
      { text: '비슷한 계약을 해본 동료에게 경험을 물어본다', scores: { independence: -1 } },
    ],
  },
  {
    id: 8,
    category: 'admin',
    situation: '출장 중 저녁 식사를 했는데, 업무 논의도 했고 개인적 대화도 섞였다. 정산할 때 포함할지 고민된다.',
    choices: [
      { text: '구분이 애매하면 청구하지 않는 쪽으로 정리한다', scores: { principle: 1 } },
      { text: '업무 논의가 포함된 자리였으니 청구해도 된다고 본다', scores: { principle: -1, independence: 1 } },
      { text: '함께한 동료와 얘기해서 업무 비중을 맞춰본다', scores: { independence: -1, transparency: -1 } },
      { text: '행정팀에 기준을 물어보고 그대로 따른다', scores: { transparency: 1 } },
    ],
  },
  {
    id: 9,
    category: 'admin',
    situation: '오래 거래한 업체 담당자가 퇴직 인사를 하며 커피 한 잔 하자고 한다. 앞으로 업무 관계는 없을 예정이다.',
    choices: [
      { text: '고마웠지만 정중히 사양한다', scores: { principle: 1, independence: 1 } },
      { text: '혹시 모르니 기관 규정을 확인해본다', scores: { transparency: -1, principle: 1 } },
      { text: '앞으로 이해관계가 없으니 편하게 만난다', scores: { principle: -1 } },
      { text: '팀장에게 알리고 판단을 구한다', scores: { independence: -1, transparency: 1 } },
    ],
  },
  {
    id: 10,
    category: 'admin',
    situation: '연구 장비 유지보수 계약 갱신인데, 기존 업체 외에 선택지가 사실상 없다.',
    choices: [
      { text: '그래도 공식 절차(수의계약 사유서 등)를 꼼꼼히 밟는다', scores: { principle: 1 } },
      { text: '상황이 상황인 만큼 빠르게 갱신 처리한다', scores: { principle: -1, independence: 1 } },
      { text: '혹시 다른 업체가 있는지 한 번은 알아본다', scores: { transparency: -1 } },
      { text: '계약 담당과 상의해서 적절한 방법을 찾는다', scores: { independence: -1, transparency: -1 } },
    ],
  },

  // ── 관계·소통 영역 (5문항) ──
  {
    id: 11,
    category: 'relation',
    situation: '외부 기관 담당자가 점심 미팅을 제안했다. 업무 관련 논의가 목적이라고 한다.',
    choices: [
      { text: '기관 내 회의실에서 만나자고 제안한다', scores: { principle: 1, independence: 1 } },
      { text: '각자 비용 부담으로 가볍게 만난다', scores: { principle: -1, independence: 1 } },
      { text: '팀장에게 보고하고 동행할지 물어본다', scores: { independence: -1, transparency: 1 } },
      { text: '미팅 내용을 기록으로 남기고 참석한다', scores: { transparency: 1, principle: -1 } },
    ],
  },
  {
    id: 12,
    category: 'relation',
    situation: '동료가 절차를 좀 편하게 처리하는 걸 봤다. 명백한 위반은 아닌 것 같은데 찜찜하다.',
    choices: [
      { text: '관련 규정을 확인해보고, 문제가 있으면 알려준다', scores: { principle: 1, independence: 1 } },
      { text: '동료한테 직접 "이거 괜찮은 건지" 가볍게 물어본다', scores: { transparency: 1, independence: -1 } },
      { text: '업무 스타일 차이일 수 있으니, 상황을 좀 더 파악해본다', scores: { principle: -1, transparency: -1 } },
      { text: '기관 윤리담당에게 일반적 질문으로 확인해본다', scores: { transparency: -1, principle: 1 } },
    ],
  },
  {
    id: 13,
    category: 'relation',
    situation: '상급자가 "이번 건은 빠르게 처리해"라며 일부 절차 생략을 암시했다.',
    choices: [
      { text: '절차가 필요한 이유를 설명하고 정식으로 진행한다', scores: { principle: 1, independence: 1 } },
      { text: '간소화 가능한 부분과 필수 절차를 구분해서 제안한다', scores: { principle: -1, transparency: 1 } },
      { text: '속도에 맞추되, 진행 과정을 기록으로 남겨둔다', scores: { transparency: 1, principle: -1 } },
      { text: '다른 팀원과 함께 상급자에게 의견을 전달한다', scores: { independence: -1, transparency: 1 } },
    ],
  },
  {
    id: 14,
    category: 'relation',
    situation: '민원성 데이터 분석 요청이 들어왔는데, 요청 의도가 특정 결론을 원하는 것 같다.',
    choices: [
      { text: '데이터가 말하는 대로 객관적 결과만 제공한다', scores: { principle: 1, independence: 1 } },
      { text: '요청 의도를 먼저 정확히 파악하고 범위를 조율한다', scores: { transparency: -1, principle: -1 } },
      { text: '팀장에게 보고하고 대응 방향을 함께 정한다', scores: { independence: -1, transparency: 1 } },
      { text: '결과와 함께 분석의 한계도 명확히 안내한다', scores: { transparency: 1 } },
    ],
  },
  {
    id: 15,
    category: 'relation',
    situation: '퇴근 시간인데, 동료가 내일까지인 서류에 "대충 사인만 해달라"고 한다.',
    choices: [
      { text: '시간이 걸려도 내용을 확인하고 사인한다', scores: { principle: 1, independence: 1 } },
      { text: '핵심만 빠르게 확인하고 처리한다', scores: { principle: -1, independence: 1 } },
      { text: '동료와 함께 빠르게 검토하고 사인한다', scores: { independence: -1, transparency: 1 } },
      { text: '내일 아침 일찍 와서 제대로 확인하겠다고 한다', scores: { transparency: -1, principle: 1 } },
    ],
  },
];

// 8가지 청렴 스타일 유형
export interface StyleType {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  emoji: string;
  strength: string;
  caution: string;
  tip: string;
}

export const styleTypes: Record<string, StyleType> = {
  'principle-transparent-independent': {
    id: 'principle-transparent-independent',
    name: '소신 수호자',
    subtitle: '원칙-투명-독립',
    description: '규정대로, 바로 말하고, 혼자서도 밀고 나가는 타입',
    emoji: '🛡️',
    strength: '애매한 상황에서도 기준을 먼저 확인하고, 문제가 보이면 바로 공유하는 투명한 판단력',
    caution: '혼자 판단하고 직설적으로 전달하다 보면, 동료 입장에서는 부담스러울 수 있어요',
    tip: '원칙은 지키되, 전달 전에 "이걸 어떻게 말하면 좋을까?" 한 번만 생각해보세요',
  },
  'principle-transparent-cooperative': {
    id: 'principle-transparent-cooperative',
    name: '정의의 조율자',
    subtitle: '원칙-투명-협력',
    description: '규정을 중시하되, 팀과 공유하며 함께 해결하는 타입',
    emoji: '⚖️',
    strength: '기준을 지키면서도 팀과 공유하고 합의를 이끌어내는 균형 감각이 돋보여요',
    caution: '모두의 동의를 구하다 보면 결정이 늦어지거나 원래 기준이 흐려질 수 있어요',
    tip: '핵심 원칙은 양보하지 않되, 방법은 유연하게 — 합의 결과를 간단히 기록해두면 좋아요',
  },
  'principle-cautious-independent': {
    id: 'principle-cautious-independent',
    name: '묵묵한 파수꾼',
    subtitle: '원칙-신중-독립',
    description: '원칙은 지키되, 조용히 혼자 판단하고 처리하는 타입',
    emoji: '🏔️',
    strength: '꼼꼼하게 확인하고 소란 없이 올바른 방향을 지키는 안정적인 판단력이 강점이에요',
    caution: '혼자 고민하다 타이밍을 놓치거나, 주변에서 무관심으로 오해할 수 있어요',
    tip: '판단은 신중하게 하되, 공유 시점은 빠르게 — 근거를 메모해두면 설명이 쉬워져요',
  },
  'principle-cautious-cooperative': {
    id: 'principle-cautious-cooperative',
    name: '신중한 중재자',
    subtitle: '원칙-신중-협력',
    description: '원칙 기반이지만, 상황 파악 후 팀과 협의하는 타입',
    emoji: '🤝',
    strength: '충분히 파악한 뒤 팀과 논의해서, 성급하지 않고 신뢰할 수 있는 결론을 이끌어내요',
    caution: '너무 신중하면 결정이 지연되고, 자기 의견을 뒤로 미루기 쉬워요',
    tip: '"확인할 건 3가지만" 같은 기준을 정해두면, 신중함과 실행력을 둘 다 챙길 수 있어요',
  },
  'flexible-transparent-independent': {
    id: 'flexible-transparent-independent',
    name: '실용주의 개척자',
    subtitle: '유연-투명-독립',
    description: '상황에 맞게 판단하고, 과정은 공개하며 주도적으로 실행하는 타입',
    emoji: '🚀',
    strength: '변화에 빠르게 대응하면서도 과정을 투명하게 공유해 독단적으로 보이지 않아요',
    caution: '유연한 판단이 반복되면 일관성이 부족해 보이거나 기준이 흔들릴 수 있어요',
    tip: '"이건 왜 이렇게 판단했는지" 한 줄이라도 남겨두면, 유연함이 신뢰로 바뀌어요',
  },
  'flexible-transparent-cooperative': {
    id: 'flexible-transparent-cooperative',
    name: '열린 소통가',
    subtitle: '유연-투명-협력',
    description: '유연하게 판단하고, 모두와 공유하며 진행하는 타입',
    emoji: '💬',
    strength: '다양한 의견을 듣고 정보를 적극 공유해서, 팀 전체가 함께 판단할 수 있게 해줘요',
    caution: '모든 의견을 수용하다 방향이 흔들리거나, 원칙이 필요한 순간에 너무 유연해질 수 있어요',
    tip: '"여기까지는 유연, 여기부터는 원칙" — 이 선을 미리 정해두면 결정이 한결 수월해져요',
  },
  'flexible-cautious-independent': {
    id: 'flexible-cautious-independent',
    name: '전략적 해결사',
    subtitle: '유연-신중-독립',
    description: '상황 판단 후 조용히 최선의 방법을 찾아내는 타입',
    emoji: '🎯',
    strength: '조용하지만 정확하게 상황을 파악하고, 갈등 없이 효과적으로 문제를 해결해요',
    caution: '혼자 처리하다 보면 팀이 상황을 모르거나, 소극적으로 비칠 수 있어요',
    tip: '판단 후 결과만이라도 팀에 간단히 공유하면, 신뢰와 협력이 함께 올라가요',
  },
  'flexible-cautious-cooperative': {
    id: 'flexible-cautious-cooperative',
    name: '온건한 조정자',
    subtitle: '유연-신중-협력',
    description: '분위기 살피며, 팀 합의로 부드럽게 풀어가는 타입',
    emoji: '🕊️',
    strength: '상황과 사람을 모두 살피며, 갈등을 최소화하면서 합의를 이끌어내는 조정력이 탁월해요',
    caution: '갈등을 피하다 문제 해결이 미뤄지거나, 분위기에 맞추느라 할 말을 못 할 수 있어요',
    tip: '부드럽게 말하되 할 말은 하는 연습 — "이건 꼭 지켜야 할 것" 목록을 미리 만들어보세요',
  },
};

// 6축 개별 점수 (레이더 차트용)
export interface SixAxisScores {
  principle: number;    // 원칙
  flexible: number;     // 유연
  transparent: number;  // 투명
  cautious: number;     // 신중
  independent: number;  // 독립
  cooperative: number;  // 협력
}

export function computeSixAxisScores(answers: number[]): SixAxisScores {
  const result: SixAxisScores = {
    principle: 0, flexible: 0,
    transparent: 0, cautious: 0,
    independent: 0, cooperative: 0,
  };

  answers.forEach((choiceIndex, questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return;
    const choice = question.choices[choiceIndex];
    if (!choice) return;

    const p = choice.scores.principle ?? 0;
    const t = choice.scores.transparency ?? 0;
    const i = choice.scores.independence ?? 0;

    if (p > 0) result.principle += p;
    if (p < 0) result.flexible += Math.abs(p);
    if (t > 0) result.transparent += t;
    if (t < 0) result.cautious += Math.abs(t);
    if (i > 0) result.independent += i;
    if (i < 0) result.cooperative += Math.abs(i);
  });

  return result;
}

// 점수 계산 유틸리티
export interface TestResult {
  scores: {
    principle: number;
    transparency: number;
    independence: number;
  };
  styleKey: string;
  style: StyleType;
  answers: number[]; // 각 문항에서 선택한 인덱스
  borderline: string[]; // 점수가 0인 축 (균형 상태)
}

export function calculateResult(answers: number[]): TestResult {
  // 6축 점수에서 3축 순점수를 도출 (단일 패스)
  const six = computeSixAxisScores(answers);
  const scores = {
    principle: six.principle - six.flexible,
    transparency: six.transparent - six.cautious,
    independence: six.independent - six.cooperative,
  };

  // 0점인 축을 기록 (균형 상태 — 어느 쪽 성향도 뚜렷하지 않음)
  const borderline: string[] = [];
  if (scores.principle === 0) borderline.push('principle');
  if (scores.transparency === 0) borderline.push('transparency');
  if (scores.independence === 0) borderline.push('independence');

  const p = scores.principle >= 0 ? 'principle' : 'flexible';
  const t = scores.transparency >= 0 ? 'transparent' : 'cautious';
  const i = scores.independence >= 0 ? 'independent' : 'cooperative';
  const styleKey = `${p}-${t}-${i}`;

  return {
    scores,
    styleKey,
    style: styleTypes[styleKey] ?? styleTypes['principle-transparent-independent']!,
    answers,
    borderline,
  };
}
