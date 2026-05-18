export type ChatIntent =
  | 'integrity-advice'
  | 'style-info'
  | 'assistant-meta'
  | 'small-talk'
  | 'follow-up'
  | 'unclear';

export type ChatResponseMode = 'advice' | 'style-info' | 'neutral';

const STYLE_INFO_PATTERNS = [
  /(내|나의|제)\s*(청렴\s*)?(스타일|유형|성향|결과)/,
  /나는\s*어떤\s*(청렴\s*)?(스타일|유형|성향)/,
  /(청렴\s*)?(스타일|유형|성향)\s*(알려|뭐|무엇|궁금|설명)/,
];

const ASSISTANT_META_PATTERNS = [
  /(너|네|당신|AI|에이아이|도우미|챗봇)(의)?\s*이름/,
  /이름(은|이)?\s*(뭐|무엇|있어|있나요|있니)/,
  /(너|당신|AI|에이아이|도우미|챗봇)(는|은)?\s*누구/,
  /(무슨|어떤)\s*(역할|기능|일)을?\s*(해|하나|하나요|할 수)/,
  /(뭐|무엇)을?\s*할\s*수\s*(있어|있나요|있니)/,
  /사용법/,
];

const SMALL_TALK_PATTERNS = [
  /^(안녕|안녕하세요|하이|hello|hi)[\s!.?~]*$/i,
  /^(고마워|감사|감사합니다|thanks|thank you|수고했어|수고하세요)[\s!.?~]*$/i,
];

const FOLLOW_UP_PATTERNS = [
  /^(그럼|그러면|그건|그 경우|앞에서|방금|이어서|그 방법|이 방법|더 알려|자세히)/,
  /^(왜|어떤 기준|주말에만|잠깐만|한 번만|조금만)/,
  /(앞에서|아까|이전)\s*(말한|이야기한|답한)/,
];

const INTEGRITY_PATTERNS = [
  /청렴|규정|법령|법률|청탁금지법|이해\s*충돌|이해관계/,
  /감사실|국민권익위원회|1398|신고|제보|징계|위반|리스크/,
  /연구\s*비|출장\s*비|출장|정산|법인\s*카드|공금|예산|회의비/,
  /선물|식사|접대|금품|뇌물|사례금|경조사|화환|외부\s*강의|강의료/,
  /업체|계약|수의\s*계약|입찰|용역|자문|구매|물품|장비|노트북/,
  /심사|평가|채용|인사|특혜|부정|부패|연구\s*윤리|논문|저자|표절/,
  /결재|승인|보고|문서화|반납|반출|사적\s*사용|개인\s*업무/,
];

const WORKPLACE_CONTEXT_PATTERN = /동료|상사|팀장|부서|기관|공공기관|연구기관|담당자|교수|책임자|거래처|협력사/;
const ADVICE_NEED_PATTERN = /어떻게|괜찮|가능|되나|되나요|될까요|맞나요|해야|하면|문제|주의|확인|처리|대응|거절|받아도|써도|사용해도/;

function normalizeForIntent(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

export function classifyChatIntent(input: string): ChatIntent {
  const text = normalizeForIntent(input);
  if (!text) return 'unclear';

  if (STYLE_INFO_PATTERNS.some(pattern => pattern.test(text))) {
    return 'style-info';
  }

  if (ASSISTANT_META_PATTERNS.some(pattern => pattern.test(text))) {
    return 'assistant-meta';
  }

  if (SMALL_TALK_PATTERNS.some(pattern => pattern.test(text))) {
    return 'small-talk';
  }

  if (INTEGRITY_PATTERNS.some(pattern => pattern.test(text))) {
    return 'integrity-advice';
  }

  if (WORKPLACE_CONTEXT_PATTERN.test(text) && ADVICE_NEED_PATTERN.test(text)) {
    return 'integrity-advice';
  }

  if (FOLLOW_UP_PATTERNS.some(pattern => pattern.test(text))) {
    return 'follow-up';
  }

  return 'unclear';
}

export function getChatResponseMode(input: string, hasPriorContext: boolean): ChatResponseMode {
  const intent = classifyChatIntent(input);

  if (intent === 'integrity-advice') return 'advice';
  if (intent === 'style-info') return 'style-info';
  if (intent === 'follow-up' && hasPriorContext) return 'advice';

  return 'neutral';
}
