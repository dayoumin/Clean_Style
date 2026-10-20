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
      { text: '일단 전부 기록해두고 내일 다시 본다', scores: { principle: 1, independence: 1, transparency: -1 } },
      { text: '선임연구원에게 같이 봐달라고 한다', scores: { transparency: 1, independence: -1 } },
      { text: '전체 결과 흐름 속에서 이 값의 의미를 먼저 직접 살펴본다', scores: { principle: -1, transparency: -1, independence: 1 } },
      { text: '이상한 부분만 메모해두고 팀 회의에서 꺼낸다', scores: { transparency: 1, independence: -1 } },
    ],
  },
  {
    id: 2,
    category: 'research',
    situation: '공동연구 보고서 작성 중인데, 동료가 "이 수치 좀 반올림해서 깔끔하게 하자"고 한다.',
    choices: [
      { text: '원본 수치를 그대로 표시하자고 제안한다.', scores: { principle: 1 } },
      { text: '의미 있는 차이인지 먼저 확인해본다', scores: { transparency: -1, independence: 1 } },
      { text: '수치의 의미가 달라지지 않는 범위에서, 읽기 쉽도록 표시 자릿수를 조정한다.', scores: { principle: -1 } },
      { text: '팀장한테 어디까지 정리해도 되는지 물어본다', scores: { independence: -1 } },
    ],
  },
  {
    id: 3,
    category: 'research',
    situation: '연구비 집행 마감이 다가오는데, 소액이 남았다. 이 과제는 연말까지 쓰지 않은 금액을 반납하는 조건이다.',
    choices: [
      { text: '쓸 곳이 없으면 반납이 맞다고 보고 정리한다', scores: { principle: 1 } },
      { text: '과제에 실제로 필요한 소모품을 확인하고, 허용된 범위에서 구매 시기를 직접 조정한다.', scores: { principle: -1, independence: 1 } },
      { text: '잔액 상황을 연구관리팀에 알리고, 처리 방안을 함께 상의한다.', scores: { transparency: 1, independence: -1 } },
      { text: '팀원들과 과제에 필요한 물품을 확인해 본다.', scores: { independence: -1, transparency: -1 } },
    ],
  },
  {
    id: 4,
    category: 'research',
    situation: '연구 중간보고를 앞두고 있는데, 일부 실험이 예상대로 안 돼서 당초 계획보다 진도가 늦다.',
    choices: [
      { text: '확인된 지연 상황과 원인을 먼저 보고한다.', scores: { transparency: 1 } },
      { text: '할 수 있는 데까지 해보고, 보고 시점에 정리해서 말한다', scores: { principle: -1, transparency: -1 } },
      { text: '비슷한 경험이 있는 동료에게 먼저 조언을 구한다', scores: { transparency: -1, independence: -1 } },
      { text: '다른 실험 방법을 직접 검토해, 일정 안에 진행할 대안을 찾는다.', scores: { independence: 1, principle: -1, transparency: -1 } },
    ],
  },
  {
    id: 5,
    category: 'research',
    situation: '논문 공동저자 순서를 정해야 하는데, 기여도 판단이 애매하다.',
    choices: [
      { text: '기여도 기준표를 만들어 공동저자 순서안을 제안한다.', scores: { principle: 1, independence: 1 } },
      { text: '관련된 사람들이 모여 각자의 기여를 함께 논의한다.', scores: { transparency: 1, independence: -1 } },
      { text: '이번 연구에서 각자가 맡은 역할과 기여를 직접 살펴 조정안을 만든다.', scores: { principle: -1, transparency: -1, independence: 1 } },
      { text: '팀장과 기여도를 함께 검토해 논의할 안을 정한다.', scores: { independence: -1 } },
    ],
  },

  // ── 행정·계약 영역 (5문항) ──
  {
    id: 6,
    category: 'admin',
    situation: '물품을 구매하려는데, 자주 거래하던 업체가 가격은 살짝 비싸지만 빠르고 편하다.',
    choices: [
      { text: '정해진 구매 절차와 선정 기준에 따라 업체를 고른다.', scores: { principle: 1 } },
      { text: '구매 기준 안에서 기존 업체의 납기·품질 장점도 함께 따져 직접 결정한다.', scores: { principle: -1, independence: 1 } },
      { text: '다른 업체도 알아보되, 담당자와 상의해서 결정한다', scores: { independence: -1, transparency: -1 } },
      { text: '비교견적 과정과 선정 이유를 문서로 남긴다', scores: { transparency: 1 } },
    ],
  },
  {
    id: 7,
    category: 'admin',
    situation: '용역 계약서에 해석이 달라질 수 있는 조항이 있다. 상대방은 "실무에서는 다 이렇게 한다"고 한다.',
    choices: [
      { text: '해당 조항의 문구를 구체적으로 바꿔서 제안한다', scores: { principle: 1, independence: 1 } },
      { text: '애매한 조항을 법무·계약 담당에게 알리고, 대응 방향을 함께 검토한다.', scores: { transparency: 1, independence: -1 } },
      { text: '실제 업무 방식과 계약 전체 맥락을 직접 확인한 뒤 판단한다.', scores: { principle: -1, transparency: -1, independence: 1 } },
      { text: '비슷한 계약을 해본 동료에게 경험을 물어본다', scores: { independence: -1 } },
    ],
  },
  {
    id: 8,
    category: 'admin',
    situation: '출장 중 저녁 식사를 했는데, 업무 논의도 했고 개인적 대화도 섞였다. 정산할 때 포함할지 고민된다.',
    choices: [
      { text: '구분이 애매하면 청구하지 않는 쪽으로 정리한다', scores: { principle: 1 } },
      { text: '식사의 전체 목적과 업무 관련성을 직접 살펴 청구 가능 여부를 판단한다.', scores: { principle: -1, independence: 1 } },
      { text: '함께한 동료와 식사 경위를 확인한 뒤, 정산 내용을 함께 정리한다.', scores: { independence: -1, transparency: -1 } },
      { text: '식사 경위를 행정팀에 알리고, 적용할 정산 기준을 확인한다.', scores: { transparency: 1 } },
    ],
  },
  {
    id: 9,
    category: 'admin',
    situation: '오래 거래한 업체 담당자가 퇴직 인사로 커피 한잔을 제안했다. 계약·정산 등 남은 업무는 없고, 비용은 각자 부담하기로 했다.',
    choices: [
      { text: '업무로 맺은 관계에는 일정한 거리를 둔다는 기준으로 정중히 사양한다.', scores: { principle: 1, independence: 1 } },
      { text: '혹시 모르니 기관 규정을 확인해본다', scores: { transparency: -1, principle: 1 } },
      { text: '기관 기준에 어긋나지 않는 범위에서, 관계를 마무리하는 짧은 인사를 나눈다.', scores: { principle: -1 } },
      { text: '제안받은 내용을 팀장에게 알리고, 기관 기준에 맞는 인사 방식을 함께 정한다.', scores: { independence: -1, transparency: 1, principle: 1 } },
    ],
  },
  {
    id: 10,
    category: 'admin',
    situation: '연구 장비 유지보수 계약 갱신인데, 기존 업체 외에 선택지가 사실상 없다.',
    choices: [
      { text: '그래도 공식 절차(수의계약 사유서 등)를 꼼꼼히 밟는다', scores: { principle: 1 } },
      { text: '필수 절차를 갖춰, 장비 일정에 맞게 준비 순서를 직접 조정한다.', scores: { principle: -1, independence: 1 } },
      { text: '혹시 다른 업체가 있는지 한 번은 알아본다', scores: { transparency: -1, principle: 1 } },
      { text: '계약 담당과 상의해서 적절한 방법을 찾는다', scores: { independence: -1, principle: -1 } },
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
      { text: '팀장에게 보고하고 동행할지 물어본다', scores: { independence: -1, transparency: 1, principle: 1 } },
      { text: '점심 미팅에 참석하고, 논의 내용은 기록해 관련자와 공유한다.', scores: { transparency: 1, principle: -1 } },
    ],
  },
  {
    id: 12,
    category: 'relation',
    situation: '동료가 절차를 좀 편하게 처리하는 걸 봤다. 명백한 위반은 아닌 것 같은데 찜찜하다.',
    choices: [
      { text: '관련 규정을 확인해보고, 문제가 있으면 알려준다', scores: { principle: 1, independence: 1, transparency: -1 } },
      { text: '동료한테 직접 "이거 괜찮은 건지" 가볍게 물어본다', scores: { transparency: 1, independence: -1 } },
      { text: '업무 스타일 차이일 수 있으니, 상황을 좀 더 파악해본다', scores: { principle: -1, transparency: -1 } },
      { text: '개인을 특정하지 않고, 청렴 담당자에게 해당 처리 방식을 설명해 규정을 확인한다.', scores: { transparency: 1, principle: 1 } },
    ],
  },
  {
    id: 13,
    category: 'relation',
    situation: '상급자가 "이번 건은 빠르게 처리해"라며 일부 절차 생략을 암시했다.',
    choices: [
      { text: '절차가 필요한 이유를 설명하고 정식으로 진행한다', scores: { principle: 1, independence: 1 } },
      { text: '간소화 가능한 부분과 필수 절차를 구분해서 제안한다', scores: { principle: -1 } },
      { text: '필수 절차는 지키면서 일정에 맞게 진행하고, 과정을 기록해 공유한다.', scores: { transparency: 1, principle: -1 } },
      { text: '다른 팀원과 함께 상급자에게 의견을 전달한다', scores: { independence: -1, transparency: 1, principle: 1 } },
    ],
  },
  {
    id: 14,
    category: 'relation',
    situation: '외부에서 데이터 분석 요청이 들어왔는데, 요청한 쪽이 특정 결론을 기대하는 것 같다.',
    choices: [
      { text: '분석 기준에 따라 직접 분석하고, 나온 결과를 그대로 전달한다.', scores: { principle: 1, independence: 1, transparency: 1 } },
      { text: '요청 배경을 먼저 듣고, 자료로 답할 수 있는 질문을 중심으로 분석 범위를 조율한다.', scores: { transparency: -1, principle: -1 } },
      { text: '팀장에게 보고하고 대응 방향을 함께 정한다', scores: { independence: -1, transparency: 1 } },
      { text: '결과와 함께 분석의 한계도 명확히 안내한다', scores: { transparency: 1 } },
    ],
  },
  {
    id: 15,
    category: 'relation',
    situation: '퇴근 시간인데, 동료가 내일 마감인 서류에 "대충 사인만 해달라"고 한다.',
    choices: [
      { text: '시간이 걸려도 내용을 확인하고 사인한다', scores: { principle: 1, independence: 1 } },
      { text: '필수 항목을 확인하되, 중요한 항목부터 순서를 정해 직접 검토하고 사인한다.', scores: { principle: -1, independence: 1 } },
      { text: '동료와 함께 빠르게 검토하고 사인한다', scores: { independence: -1, principle: -1 } },
      { text: '내일 아침 검토 시간을 확보해 내용을 확인한 뒤 사인하겠다고 한다.', scores: { transparency: -1, principle: 1, independence: 1 } },
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
    caution: '여러 사람의 동의를 구하다 보면, 결정 시점이나 책임자가 불분명해질 수 있어요.',
    tip: '핵심 원칙은 양보하지 않되, 방법은 유연하게 — 합의 결과를 간단히 기록해두면 좋아요',
  },
  'principle-cautious-independent': {
    id: 'principle-cautious-independent',
    name: '묵묵한 파수꾼',
    subtitle: '원칙-신중-독립',
    description: '원칙은 지키되, 조용히 혼자 판단하고 처리하는 타입',
    emoji: '🏔️',
    strength: '꼼꼼하게 확인하고 소란 없이 기준을 지켜 가는 안정적인 판단력이 강점이에요',
    caution: '혼자 고민하다 타이밍을 놓치거나, 주변에서 무관심으로 오해할 수 있어요',
    tip: '판단은 신중하게 하되, 공유 시점은 빠르게 — 근거를 메모해두면 설명이 쉬워져요',
  },
  'principle-cautious-cooperative': {
    id: 'principle-cautious-cooperative',
    name: '신중한 중재자',
    subtitle: '원칙-신중-협력',
    description: '원칙을 바탕으로 상황을 확인하고 팀과 협의하는 타입',
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
    emoji: '🧭',
    strength: '상황에 맞는 대안을 찾고, 판단 과정과 근거를 공유하는 데 강점이 있어요.',
    caution: '상황에 따라 방법을 바꿀 때 판단 근거를 설명하지 않으면, 다른 사람이 기준을 이해하기 어려울 수 있어요.',
    tip: '"이건 왜 이렇게 판단했는지" 한 줄이라도 남겨두면, 유연함이 신뢰로 바뀌어요',
  },
  'flexible-transparent-cooperative': {
    id: 'flexible-transparent-cooperative',
    name: '열린 소통가',
    subtitle: '유연-투명-협력',
    description: '유연하게 판단하고, 모두와 공유하며 진행하는 타입',
    emoji: '💬',
    strength: '다양한 의견을 듣고 정보를 적극 공유해서, 팀 전체가 함께 판단할 수 있게 해줘요',
    caution: '여러 의견을 반영하며 방법을 조정하다 보면, 결정을 마무리하는 데 시간이 걸릴 수 있어요.',
    tip: '"여기까지는 유연, 여기부터는 원칙" — 이 선을 미리 정해두면 결정이 한결 수월해져요',
  },
  'flexible-cautious-independent': {
    id: 'flexible-cautious-independent',
    name: '전략적 해결사',
    subtitle: '유연-신중-독립',
    description: '상황 판단 후 조용히 최선의 방법을 찾아내는 타입',
    emoji: '🎯',
    strength: '상황과 대안을 차분히 비교해 실행할 방법을 찾는 데 강점이 있어요.',
    caution: '혼자 처리하다 보면 팀이 상황을 모르거나, 소극적으로 비칠 수 있어요',
    tip: '판단 후 결과만이라도 팀에 간단히 공유하면, 신뢰와 협력이 함께 올라가요',
  },
  'flexible-cautious-cooperative': {
    id: 'flexible-cautious-cooperative',
    name: '온건한 조정자',
    subtitle: '유연-신중-협력',
    description: '사람과 상황을 살피며, 팀과 함께 방법을 조정하는 타입',
    emoji: '🕊️',
    strength: '상황과 사람을 모두 살피며, 갈등을 최소화하면서 합의를 이끌어내는 조정력이 돋보여요.',
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

// 축별 이론상 최대 점수 (문항 구조에서 자동 계산)
// 각 문항에서 해당 방향에 +1을 줄 수 있는 선택지가 하나라도 있으면 1 기여
function computeAxisMaximums(): SixAxisScores {
  const max: SixAxisScores = {
    principle: 0, flexible: 0,
    transparent: 0, cautious: 0,
    independent: 0, cooperative: 0,
  };
  for (const q of questions) {
    let hasP = false, hasF = false, hasT = false, hasC = false, hasI = false, hasCo = false;
    for (const c of q.choices) {
      const p = c.scores.principle ?? 0;
      const t = c.scores.transparency ?? 0;
      const i = c.scores.independence ?? 0;
      if (p > 0) hasP = true;
      if (p < 0) hasF = true;
      if (t > 0) hasT = true;
      if (t < 0) hasC = true;
      if (i > 0) hasI = true;
      if (i < 0) hasCo = true;
    }
    if (hasP) max.principle++;
    if (hasF) max.flexible++;
    if (hasT) max.transparent++;
    if (hasC) max.cautious++;
    if (hasI) max.independent++;
    if (hasCo) max.cooperative++;
  }
  return max;
}

export const AXIS_MAXIMUMS: SixAxisScores = computeAxisMaximums();

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
