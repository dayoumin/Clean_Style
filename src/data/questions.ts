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
      { text: '이상한 부분만 메모해두고 팀 회의에서 꺼낸다', scores: { transparency: -1, independence: -1 } },
    ],
  },
  {
    id: 2,
    category: 'research',
    situation: '공동연구 보고서 작성 중인데, 동료가 "이 수치 좀 반올림해서 깔끔하게 하자"고 한다.',
    choices: [
      { text: '"원본 그대로 쓰는 게 맞지 않나" 하고 얘기한다', scores: { principle: 1, transparency: 1 } },
      { text: '의미 있는 차이인지 먼저 확인해본다', scores: { transparency: -1, independence: 1 } },
      { text: '보고서 가독성도 중요하니 적절히 조정한다', scores: { principle: -1 } },
      { text: '팀장한테 어디까지 정리해도 되는지 물어본다', scores: { independence: -1, transparency: -1 } },
    ],
  },
  {
    id: 3,
    category: 'research',
    situation: '연구비 집행 마감인데, 소액이 남았다. 당장 필요한 물품은 없다.',
    choices: [
      { text: '남은 금액은 반납 처리하고 정리한다', scores: { principle: 1 } },
      { text: '다음 연구에 쓸 소모품을 미리 구매한다', scores: { principle: -1, independence: 1 } },
      { text: '기관 연구관리팀에 처리 방법을 확인한다', scores: { transparency: 1, independence: -1 } },
      { text: '동료들한테 필요한 거 있는지 물어본다', scores: { independence: -1 } },
    ],
  },
  {
    id: 4,
    category: 'research',
    situation: '연구 중간보고 시점인데, 일부 실험이 예상대로 안 돼서 당초 계획보다 진도가 늦다.',
    choices: [
      { text: '지연 상황과 원인을 솔직하게 보고한다', scores: { transparency: 1, principle: 1 } },
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
      { text: '다른 업체도 알아보되, 담당자와 상의해서 결정한다', scores: { independence: -1, transparency: -1 } },
      { text: '비교견적 과정과 선정 이유를 문서로 남긴다', scores: { transparency: 1, principle: 1 } },
    ],
  },
  {
    id: 7,
    category: 'admin',
    situation: '용역 계약서 내용이 좀 모호한 부분이 있다. 상대방은 "원래 이렇게 한다"고 한다.',
    choices: [
      { text: '모호한 부분을 명확히 수정 요청한다', scores: { principle: 1, independence: 1 } },
      { text: '법무/계약 담당에게 검토를 요청한다', scores: { transparency: 1, independence: -1 } },
      { text: '큰 문제 없어 보이면 진행하되 메모를 남긴다', scores: { principle: -1, transparency: -1 } },
      { text: '팀 내에서 같은 경험 있는 사람에게 물어본다', scores: { independence: -1 } },
    ],
  },
  {
    id: 8,
    category: 'admin',
    situation: '출장비 정산 중인데, 업무 관련 저녁 식사비를 개인 경비와 구분하기 애매한 건이 있다.',
    choices: [
      { text: '애매한 건은 빼고 확실한 것만 청구한다', scores: { principle: 1 } },
      { text: '업무 맥락이 있었으니 포함해서 청구한다', scores: { principle: -1, independence: 1 } },
      { text: '같이 식사한 동료에게 업무 관련이었는지 확인해본다', scores: { independence: -1, transparency: -1 } },
      { text: '행정팀에 기준을 문의해서 그대로 따른다', scores: { transparency: 1, principle: 1 } },
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
      { text: '그래도 공식 절차(수의계약 사유서 등)를 꼼꼼히 밟는다', scores: { principle: 1, transparency: 1 } },
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
      { text: '속도에 맞추되, 진행 과정을 기록으로 남겨둔다', scores: { transparency: -1, principle: -1 } },
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
}

export const styleTypes: Record<string, StyleType> = {
  'principle-transparent-independent': {
    id: 'principle-transparent-independent',
    name: '소신 수호자',
    subtitle: '원칙-투명-독립',
    description: '규정대로, 바로 말하고, 혼자서도 밀고 나가는 타입',
    emoji: '🛡️',
  },
  'principle-transparent-cooperative': {
    id: 'principle-transparent-cooperative',
    name: '정의의 조율자',
    subtitle: '원칙-투명-협력',
    description: '규정을 중시하되, 팀과 공유하며 함께 해결하는 타입',
    emoji: '⚖️',
  },
  'principle-cautious-independent': {
    id: 'principle-cautious-independent',
    name: '묵묵한 파수꾼',
    subtitle: '원칙-신중-독립',
    description: '원칙은 지키되, 조용히 혼자 판단하고 처리하는 타입',
    emoji: '🏔️',
  },
  'principle-cautious-cooperative': {
    id: 'principle-cautious-cooperative',
    name: '신중한 중재자',
    subtitle: '원칙-신중-협력',
    description: '원칙 기반이지만, 상황 파악 후 팀과 협의하는 타입',
    emoji: '🤝',
  },
  'flexible-transparent-independent': {
    id: 'flexible-transparent-independent',
    name: '실용주의 개척자',
    subtitle: '유연-투명-독립',
    description: '상황에 맞게 판단하고, 과정은 공개하며 주도적으로 실행하는 타입',
    emoji: '🚀',
  },
  'flexible-transparent-cooperative': {
    id: 'flexible-transparent-cooperative',
    name: '열린 소통가',
    subtitle: '유연-투명-협력',
    description: '유연하게 판단하고, 모두와 공유하며 진행하는 타입',
    emoji: '💬',
  },
  'flexible-cautious-independent': {
    id: 'flexible-cautious-independent',
    name: '전략적 해결사',
    subtitle: '유연-신중-독립',
    description: '상황 판단 후 조용히 최선의 방법을 찾아내는 타입',
    emoji: '🎯',
  },
  'flexible-cautious-cooperative': {
    id: 'flexible-cautious-cooperative',
    name: '온건한 조정자',
    subtitle: '유연-신중-협력',
    description: '분위기 살피며, 팀 합의로 부드럽게 풀어가는 타입',
    emoji: '🕊️',
  },
};

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
  const scores = { principle: 0, transparency: 0, independence: 0 };

  answers.forEach((choiceIndex, questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return;
    const choice = question.choices[choiceIndex];
    if (!choice) return;

    scores.principle += choice.scores.principle ?? 0;
    scores.transparency += choice.scores.transparency ?? 0;
    scores.independence += choice.scores.independence ?? 0;
  });

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
