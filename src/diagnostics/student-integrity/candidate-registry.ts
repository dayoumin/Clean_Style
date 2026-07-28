export type CandidateItemStatus =
  | 'draft'
  | 'expert-review'
  | 'cognitive-interview'
  | 'approved-candidate'
  | 'rejected';

export type CandidateReviewStatus = 'pending' | 'in-review' | 'approved' | 'revise';
export type CandidateChoiceFrame =
  | 'first-information-check'
  | 'first-support-path'
  | 'first-protective-response'
  | 'first-collaboration-step';

export interface CandidateItemOption {
  id: string;
  text: string;
}

export interface CandidateRevisionEntry {
  revision: number;
  date: string;
  summary: string;
}

export interface CandidateReviewRecord {
  status: CandidateReviewStatus;
  evidenceRefs: readonly string[];
}

export interface StudentCandidateItem {
  id: string;
  revision: number;
  status: CandidateItemStatus;
  domain: string;
  gradeBands: readonly ('middle' | 'high')[];
  safetyMode: 'standard' | 'help-seeking';
  construct: {
    id: string;
    label: string;
    definition: string;
  };
  valueTension: readonly [string, string];
  choiceFrame: CandidateChoiceFrame;
  title: string;
  scenario: string;
  decisionPrompt: string;
  choices: readonly CandidateItemOption[];
  reasonPrompt: string;
  reasons: readonly CandidateItemOption[];
  sourceBasis: {
    content: readonly string[];
    method: readonly string[];
  };
  riskNotes: readonly string[];
  revisionHistory: readonly CandidateRevisionEntry[];
  reviews: {
    content: CandidateReviewRecord;
    studentLanguage: CandidateReviewRecord;
    safeguarding: CandidateReviewRecord;
  };
}

const itemStatuses = new Set<CandidateItemStatus>([
  'draft',
  'expert-review',
  'cognitive-interview',
  'approved-candidate',
  'rejected',
]);
const reviewStatuses = new Set<CandidateReviewStatus>([
  'pending',
  'in-review',
  'approved',
  'revise',
]);
const gradeBands = new Set<StudentCandidateItem['gradeBands'][number]>(['middle', 'high']);
const choiceFrames = new Set<CandidateChoiceFrame>([
  'first-information-check',
  'first-support-path',
  'first-protective-response',
  'first-collaboration-step',
]);
const reviewNames = ['content', 'studentLanguage', 'safeguarding'] as const;

export function validateStudentCandidateItems(value: unknown): string[] {
  if (!Array.isArray(value)) return ['registry must be an array'];

  const errors: string[] = [];
  const itemIds = new Set<string>();

  value.forEach((rawItem, index) => {
    if (!rawItem || typeof rawItem !== 'object') {
      errors.push(`item ${index + 1}: must be an object`);
      return;
    }

    const item = rawItem as Partial<StudentCandidateItem>;
    const label = typeof item.id === 'string' ? item.id : `item ${index + 1}`;
    if (!item.id || itemIds.has(item.id)) errors.push(`${label}: missing or duplicate id`);
    if (item.id) itemIds.add(item.id);
    if (!Number.isInteger(item.revision) || (item.revision ?? 0) < 1) {
      errors.push(`${label}: revision must be a positive integer`);
    }
    if (!item.status || !itemStatuses.has(item.status)) errors.push(`${label}: invalid status`);
    if (!item.domain || !item.title || !item.scenario || !item.decisionPrompt || !item.reasonPrompt) {
      errors.push(`${label}: required content is missing`);
    }
    if (!Array.isArray(item.gradeBands) || item.gradeBands.length === 0) {
      errors.push(`${label}: gradeBands are required`);
    } else if (
      item.gradeBands.some((gradeBand) => !gradeBands.has(gradeBand))
      || new Set(item.gradeBands).size !== item.gradeBands.length
    ) {
      errors.push(`${label}: gradeBands contain an invalid or duplicate value`);
    }
    if (item.safetyMode !== 'standard' && item.safetyMode !== 'help-seeking') {
      errors.push(`${label}: invalid safetyMode`);
    }
    if (
      !item.construct
      || !item.construct.id
      || !item.construct.label
      || !item.construct.definition
    ) {
      errors.push(`${label}: construct is required`);
    }
    if (
      !Array.isArray(item.valueTension)
      || item.valueTension.length !== 2
      || item.valueTension.some((valueName) => typeof valueName !== 'string' || !valueName.trim())
      || item.valueTension[0] === item.valueTension[1]
    ) {
      errors.push(`${label}: valueTension must contain two distinct values`);
    }
    if (!item.choiceFrame || !choiceFrames.has(item.choiceFrame)) {
      errors.push(`${label}: invalid choiceFrame`);
    }

    for (const [field, options] of [
      ['choices', item.choices],
      ['reasons', item.reasons],
    ] as const) {
      if (!Array.isArray(options) || options.length < 3) {
        errors.push(`${label}: ${field} must contain at least three options`);
        continue;
      }
      const optionIds = new Set<string>();
      for (const option of options) {
        if (!option.id || !option.text || optionIds.has(option.id)) {
          errors.push(`${label}: ${field} contain an invalid or duplicate option`);
          break;
        }
        optionIds.add(option.id);
      }
    }

    if (!item.sourceBasis || typeof item.sourceBasis !== 'object') {
      errors.push(`${label}: sourceBasis is required`);
    } else {
      for (const basisType of ['content', 'method'] as const) {
        const sources = item.sourceBasis[basisType];
        if (
          !Array.isArray(sources)
          || sources.length === 0
          || sources.some((sourceId) => typeof sourceId !== 'string' || !sourceId.trim())
        ) {
          errors.push(`${label}: sourceBasis.${basisType} is required`);
        }
      }
    }
    if (
      !Array.isArray(item.riskNotes)
      || item.riskNotes.some((note) => typeof note !== 'string' || !note.trim())
    ) {
      errors.push(`${label}: riskNotes must be an array of non-empty strings`);
    }
    if (!Array.isArray(item.revisionHistory) || item.revisionHistory.length === 0) {
      errors.push(`${label}: revisionHistory is required`);
    } else {
      const revisions = item.revisionHistory.map((entry) => entry.revision);
      const latestRevision = Math.max(...revisions);
      const isAscending = revisions.every((revision, historyIndex) => (
        historyIndex === 0 || revision > revisions[historyIndex - 1]
      ));
      const invalidEntry = item.revisionHistory.some((entry) => (
        !Number.isInteger(entry.revision)
        || entry.revision < 1
        || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
        || !entry.summary.trim()
      ));
      if (
        invalidEntry
        || new Set(revisions).size !== revisions.length
        || !isAscending
        || latestRevision !== item.revision
      ) {
        errors.push(`${label}: revisionHistory must be valid, unique, and match revision`);
      }
    }

    const reviews = item.reviews;
    if (!reviews) {
      errors.push(`${label}: reviews are required`);
    } else {
      for (const reviewName of reviewNames) {
        const review = reviews[reviewName];
        if (
          !review
          || !reviewStatuses.has(review.status)
          || !Array.isArray(review.evidenceRefs)
          || review.evidenceRefs.some((reference) => !reference.trim())
        ) {
          errors.push(`${label}: invalid ${reviewName} review status`);
        } else if (review.status === 'approved' && review.evidenceRefs.length === 0) {
          errors.push(`${label}: approved ${reviewName} review requires evidence`);
        }
      }
      if (
        item.status === 'approved-candidate'
        && Object.values(reviews).some((review) => review.status !== 'approved')
      ) {
        errors.push(`${label}: approved candidates require all reviews`);
      }
    }
  });

  return errors;
}
