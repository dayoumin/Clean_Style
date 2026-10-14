import { STUDENT_DEMO_FEEDBACK_VERSION } from './definition';
import type { StudentResponseEnvelope } from './types';

export type StudentPerspectiveAxisKey =
  | 'fairnessAwareness'
  | 'empathyPerspective'
  | 'principleJudgment'
  | 'outcomeBalance'
  | 'valueCommitment'
  | 'braveAction';

export type StudentPerspectiveCompanionKey =
  | 'fair-radar'
  | 'balance-maker'
  | 'core-keeper'
  | 'brave-mover';

export const studentPerspectiveAxes = [
  { key: 'fairnessAwareness', label: '공정 감지' },
  { key: 'empathyPerspective', label: '공감 시야' },
  { key: 'principleJudgment', label: '원칙 판단' },
  { key: 'outcomeBalance', label: '결과 균형' },
  { key: 'valueCommitment', label: '가치 수호' },
  { key: 'braveAction', label: '용기 실행' },
] as const satisfies readonly {
  key: StudentPerspectiveAxisKey;
  label: string;
}[];

export const studentPerspectiveCompanions = {
  'fair-radar': {
    name: '공정 레이더',
    emoji: '🎯',
    image: '/images/student/result-characters/fair-radar.webp',
    accent: '#0f8f94',
    soft: '#e8f7f7',
    tagline: '누가 놓치고 있는지 먼저 살펴봐.',
    question: '누구의 이야기를 더 들어보면 좋을까요?',
  },
  'balance-maker': {
    name: '밸런스 메이커',
    emoji: '⚖️',
    image: '/images/student/result-characters/balance-maker.webp',
    accent: '#c77908',
    soft: '#fff6df',
    tagline: '사람도 기준도 함께 봐.',
    question: '먼저 확인할 기준은 무엇일까요?',
  },
  'core-keeper': {
    name: '코어 키퍼',
    emoji: '🛡️',
    image: '/images/student/result-characters/core-keeper.webp',
    accent: '#7654c7',
    soft: '#f2edff',
    tagline: '중요한 가치를 놓치지 않아.',
    question: '지키고 싶은 가치와 대안은 무엇일까요?',
  },
  'brave-mover': {
    name: '브레이브 무버',
    emoji: '🚀',
    image: '/images/student/result-characters/brave-mover.webp',
    accent: '#2f8a55',
    soft: '#eaf7ef',
    tagline: '생각을 안전한 행동으로 옮겨.',
    question: '누구에게 어떤 도움을 요청할 수 있을까요?',
  },
} as const satisfies Record<StudentPerspectiveCompanionKey, {
  name: string;
  emoji: string;
  image: string;
  accent: string;
  soft: string;
  tagline: string;
  question: string;
}>;

export const studentReconsiderPrompts = {
  'DEMO-GROUP-001': {
    title: '모둠 과제의 이름',
    prompt: '친구의 사정, 기여 기준, 모둠 관계 중 무엇을 먼저 확인하면 좋을까요?',
  },
  'DEMO-DIGITAL-001': {
    title: '단체 대화방의 사진',
    prompt: '사진 속 학생의 동의와 예상되는 불편을 함께 생각하면 선택이 달라질까요?',
  },
  'DEMO-LEARNING-001': {
    title: '과제와 생성형 AI',
    prompt: '기한뿐 아니라 출처와 내가 확인한 범위를 함께 보면 무엇을 바꿀까요?',
  },
  skipped: {
    title: '세 장면 다시 보기',
    prompt: '건너뛴 장면 중 하나를 골라 내가 중요하게 볼 이유를 한 문장으로 떠올려 보세요.',
  },
} as const;

export const studentNextActions = [
  '사실 하나를 확인하고 도움을 요청하기',
  '결정하기 전에 상대의 생각을 한 번 묻기',
  '지킬 기준 하나와 가능한 대안 하나를 정하기',
] as const;

type DemoScenarioId = Exclude<keyof typeof studentReconsiderPrompts, 'skipped'>;
type PatternRule = {
  axes: readonly StudentPerspectiveAxisKey[];
  companions: readonly StudentPerspectiveCompanionKey[];
};

const groupReasonAxes = {
  'fair-contribution': ['fairnessAwareness', 'braveAction'],
  'check-context': ['empathyPerspective', 'braveAction'],
  'shared-standard': ['principleJudgment', 'braveAction'],
  'protect-relationship': ['outcomeBalance', 'braveAction'],
} as const satisfies Record<string, readonly StudentPerspectiveAxisKey[]>;

const patternRules: Record<DemoScenarioId, Record<string, Record<string, PatternRule>>> = {
  'DEMO-GROUP-001': {
    'contact-first': {
      'fair-contribution': { axes: groupReasonAxes['fair-contribution'], companions: ['fair-radar', 'balance-maker'] },
      'check-context': { axes: groupReasonAxes['check-context'], companions: ['balance-maker'] },
      'shared-standard': { axes: groupReasonAxes['shared-standard'], companions: ['balance-maker', 'core-keeper'] },
      'protect-relationship': { axes: groupReasonAxes['protect-relationship'], companions: ['balance-maker'] },
    },
    'teacher-check': {
      'fair-contribution': { axes: groupReasonAxes['fair-contribution'], companions: ['fair-radar', 'brave-mover'] },
      'check-context': { axes: groupReasonAxes['check-context'], companions: ['balance-maker', 'brave-mover'] },
      'shared-standard': { axes: groupReasonAxes['shared-standard'], companions: ['core-keeper', 'brave-mover'] },
      'protect-relationship': { axes: groupReasonAxes['protect-relationship'], companions: ['balance-maker', 'brave-mover'] },
    },
  },
  'DEMO-DIGITAL-001': {
    'ask-permission': {
      consent: {
        axes: ['principleJudgment', 'empathyPerspective', 'braveAction'],
        companions: ['fair-radar', 'brave-mover'],
      },
      'reduce-harm': {
        axes: ['empathyPerspective', 'outcomeBalance', 'braveAction'],
        companions: ['fair-radar', 'brave-mover'],
      },
    },
    'remove-face': {
      consent: {
        axes: ['principleJudgment', 'empathyPerspective', 'braveAction'],
        companions: ['fair-radar', 'balance-maker'],
      },
      'reduce-harm': {
        axes: ['empathyPerspective', 'outcomeBalance', 'braveAction'],
        companions: ['balance-maker', 'brave-mover'],
      },
    },
  },
  'DEMO-LEARNING-001': {
    'verify-and-disclose': {
      authorship: {
        axes: ['valueCommitment', 'braveAction'],
        companions: ['core-keeper', 'brave-mover'],
      },
      accuracy: {
        axes: ['principleJudgment', 'outcomeBalance', 'braveAction'],
        companions: ['balance-maker', 'core-keeper'],
      },
      deadline: {
        axes: ['outcomeBalance', 'braveAction'],
        companions: ['balance-maker'],
      },
      'clear-rule': {
        axes: ['principleJudgment', 'valueCommitment', 'braveAction'],
        companions: ['core-keeper', 'brave-mover'],
      },
    },
    'ask-standard': {
      authorship: {
        axes: ['valueCommitment', 'braveAction'],
        companions: ['core-keeper', 'brave-mover'],
      },
      accuracy: {
        axes: ['principleJudgment', 'outcomeBalance', 'braveAction'],
        companions: ['balance-maker', 'brave-mover'],
      },
      deadline: {
        axes: ['outcomeBalance', 'braveAction'],
        companions: ['balance-maker', 'brave-mover'],
      },
      'clear-rule': {
        axes: ['principleJudgment', 'valueCommitment', 'braveAction'],
        companions: ['core-keeper', 'brave-mover'],
      },
    },
  },
};

export interface StudentDemoFeedback {
  version: typeof STUDENT_DEMO_FEEDBACK_VERSION;
  answeredCount: number;
  axisCounts: Record<StudentPerspectiveAxisKey, number>;
  highlightedCompanionKeys: StudentPerspectiveCompanionKey[];
  otherCompanionKey: StudentPerspectiveCompanionKey;
  reconsiderScenarioId: DemoScenarioId | 'skipped';
}

export const STUDENT_RESULT_STORAGE_KEY = 'student-integrity-demo-result-v1';

function emptyAxisCounts(): Record<StudentPerspectiveAxisKey, number> {
  return Object.fromEntries(
    studentPerspectiveAxes.map(({ key }) => [key, 0]),
  ) as Record<StudentPerspectiveAxisKey, number>;
}

export function createStudentDemoFeedback(
  response: StudentResponseEnvelope,
): StudentDemoFeedback {
  const axisCounts = emptyAxisCounts();
  const companionCounts = new Map<StudentPerspectiveCompanionKey, number>(
    Object.keys(studentPerspectiveCompanions).map((key) => [key as StudentPerspectiveCompanionKey, 0]),
  );
  let answeredCount = 0;
  let reconsiderScenarioId: DemoScenarioId | 'skipped' = 'skipped';
  let firstAnsweredScenarioId: DemoScenarioId | null = null;

  for (const item of response.responses) {
    if (item.status !== 'answered') continue;
    answeredCount += 1;

    const scenarioId = item.questionId as DemoScenarioId;
    if (!(scenarioId in patternRules)) continue;
    firstAnsweredScenarioId ??= scenarioId;

    const pattern = patternRules[scenarioId][item.choiceId]?.[item.reasonId];
    if (!pattern) {
      if (reconsiderScenarioId === 'skipped') reconsiderScenarioId = scenarioId;
      continue;
    }

    for (const axis of new Set(pattern.axes)) axisCounts[axis] += 1;
    for (const companion of new Set(pattern.companions)) {
      companionCounts.set(companion, (companionCounts.get(companion) ?? 0) + 1);
    }
  }

  if (reconsiderScenarioId === 'skipped' && firstAnsweredScenarioId) {
    reconsiderScenarioId = firstAnsweredScenarioId;
  }

  const companionKeys = Object.keys(studentPerspectiveCompanions) as StudentPerspectiveCompanionKey[];
  const highlightedCompanionKeys = companionKeys.filter((key) => (companionCounts.get(key) ?? 0) > 0);
  const otherCompanionKey = [...companionKeys].sort((left, right) => (
    (companionCounts.get(left) ?? 0) - (companionCounts.get(right) ?? 0)
  ))[0];

  return {
    version: STUDENT_DEMO_FEEDBACK_VERSION,
    answeredCount,
    axisCounts,
    highlightedCompanionKeys,
    otherCompanionKey,
    reconsiderScenarioId,
  };
}

export function isValidStudentDemoFeedback(value: unknown): value is StudentDemoFeedback {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<StudentDemoFeedback>;
  const companionKeys = Object.keys(studentPerspectiveCompanions);
  const axisKeys = studentPerspectiveAxes.map(({ key }) => key);

  if (
    record.version !== STUDENT_DEMO_FEEDBACK_VERSION
    || !Number.isInteger(record.answeredCount)
    || (record.answeredCount ?? -1) < 0
    || (record.answeredCount ?? 4) > 3
    || !record.axisCounts
    || typeof record.axisCounts !== 'object'
    || !Array.isArray(record.highlightedCompanionKeys)
    || new Set(record.highlightedCompanionKeys).size !== record.highlightedCompanionKeys.length
    || record.highlightedCompanionKeys.some((key) => !companionKeys.includes(key))
    || !companionKeys.includes(record.otherCompanionKey ?? '')
    || !(record.reconsiderScenarioId && record.reconsiderScenarioId in studentReconsiderPrompts)
  ) {
    return false;
  }

  return axisKeys.every((key) => {
    const count = record.axisCounts?.[key];
    return Number.isInteger(count) && (count ?? -1) >= 0 && (count ?? 4) <= 3;
  });
}

export function readStudentDemoFeedback(raw: string | null): StudentDemoFeedback | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidStudentDemoFeedback(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStudentDemoFeedback(
  storage: Pick<Storage, 'setItem'>,
  feedback: StudentDemoFeedback,
): boolean {
  try {
    storage.setItem(STUDENT_RESULT_STORAGE_KEY, JSON.stringify(feedback));
    return true;
  } catch {
    return false;
  }
}

export function readStudentDemoFeedbackFromStorage(
  storage: Pick<Storage, 'getItem'>,
): StudentDemoFeedback | null {
  try {
    return readStudentDemoFeedback(storage.getItem(STUDENT_RESULT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearStudentDemoFeedback(
  storage: Pick<Storage, 'removeItem'>,
): void {
  try {
    storage.removeItem(STUDENT_RESULT_STORAGE_KEY);
  } catch {
    // The student demo has no server or local-storage fallback.
  }
}
