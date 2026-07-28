export type CandidateItemStatus =
  | 'draft'
  | 'expert-review'
  | 'cognitive-interview'
  | 'approved-candidate'
  | 'rejected';

export type CandidateReviewStatus = 'pending' | 'in-review' | 'approved' | 'revise';

export interface CandidateItemOption {
  id: string;
  text: string;
}

export interface StudentCandidateItem {
  id: string;
  revision: number;
  status: CandidateItemStatus;
  domain: string;
  gradeBands: readonly ('middle' | 'high')[];
  safetyMode: 'standard' | 'help-seeking';
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
  reviews: {
    content: CandidateReviewStatus;
    studentLanguage: CandidateReviewStatus;
    safeguarding: CandidateReviewStatus;
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

    const reviews = item.reviews;
    if (!reviews) {
      errors.push(`${label}: reviews are required`);
    } else {
      for (const reviewName of reviewNames) {
        if (!reviewStatuses.has(reviews[reviewName])) {
          errors.push(`${label}: invalid ${reviewName} review status`);
        }
      }
      if (
        item.status === 'approved-candidate'
        && Object.values(reviews).some((status) => status !== 'approved')
      ) {
        errors.push(`${label}: approved candidates require all reviews`);
      }
    }
  });

  return errors;
}
