import type {
  StudentItemResponse,
  StudentResponseEnvelope,
  StudentScenario,
} from './types';
import {
  STUDENT_PROTOTYPE_FORM_ID,
  studentIntegrityDefinition,
} from './definition';
import { studentPrototypeScenarios } from './prototype-content';

export const STUDENT_RESPONSE_STORAGE_KEY = 'student-integrity-prototype-response-v1';

export function createStudentResponseEnvelope(
  responses: StudentItemResponse[],
  startedAt: string,
  completedAt: string | null,
): StudentResponseEnvelope {
  const status = completedAt ? 'completed' : 'in-progress';

  const envelope: StudentResponseEnvelope = {
    schemaVersion: 'diagnostic-response-v1',
    productId: 'clean-style-student',
    instrumentId: 'student-integrity',
    instrumentVersion: studentIntegrityDefinition.instrumentVersion,
    scoringVersion: studentIntegrityDefinition.scoringVersion,
    formId: STUDENT_PROTOTYPE_FORM_ID,
    phase: 'initial',
    status,
    responseMode: 'unscored',
    storagePolicy: 'session-only',
    startedAt,
    completedAt,
    responses,
  };

  if (!isValidStudentResponseEnvelope(envelope)) {
    throw new Error('Invalid student response envelope');
  }

  return envelope;
}

export function isValidStudentResponseEnvelope(
  value: unknown,
): value is StudentResponseEnvelope {
  if (!value || typeof value !== 'object') return false;

  const record = value as Partial<StudentResponseEnvelope>;
  if (
    record.schemaVersion !== 'diagnostic-response-v1'
    || record.productId !== 'clean-style-student'
    || record.instrumentId !== 'student-integrity'
    || record.instrumentVersion !== studentIntegrityDefinition.instrumentVersion
    || record.scoringVersion !== studentIntegrityDefinition.scoringVersion
    || record.formId !== STUDENT_PROTOTYPE_FORM_ID
    || record.phase !== 'initial'
    || (record.status !== 'in-progress' && record.status !== 'completed' && record.status !== 'abandoned')
    || record.responseMode !== 'unscored'
    || record.storagePolicy !== 'session-only'
    || typeof record.startedAt !== 'string'
    || (record.completedAt !== null && typeof record.completedAt !== 'string')
    || !Array.isArray(record.responses)
  ) {
    return false;
  }

  const scenariosById = new Map<string, StudentScenario>(
    studentPrototypeScenarios.map((scenario) => [scenario.id, scenario]),
  );
  const seenQuestionIds = new Set<string>();

  const responsesAreValid = record.responses.every((response) => {
    if (!response || typeof response !== 'object') return false;
    const scenario = scenariosById.get(response.questionId);
    if (
      !scenario
      || seenQuestionIds.has(response.questionId)
      || response.phase !== record.phase
      || (response.status !== 'answered' && response.status !== 'skipped')
    ) {
      return false;
    }

    if (response.status === 'answered') {
      const choiceExists = scenario.choices.some((choice) => choice.id === response.choiceId);
      const reasonExists = scenario.reasons.some((reason) => reason.id === response.reasonId);
      if (!choiceExists || !reasonExists) return false;
    } else if ('choiceId' in response || 'reasonId' in response) {
      return false;
    }

    seenQuestionIds.add(response.questionId);
    return true;
  });

  if (!responsesAreValid) return false;
  if (record.status === 'completed') {
    return record.completedAt !== null
      && seenQuestionIds.size === studentPrototypeScenarios.length;
  }

  return record.completedAt === null;
}

export function readStudentResponse(raw: string | null): StudentResponseEnvelope | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidStudentResponseEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStudentResponseForHandoff(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  response: StudentResponseEnvelope,
): boolean {
  try {
    storage.removeItem(STUDENT_RESPONSE_STORAGE_KEY);
    storage.setItem(STUDENT_RESPONSE_STORAGE_KEY, JSON.stringify(response));
    return true;
  } catch {
    return false;
  }
}

export function takeStudentResponseFromHandoff(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
): StudentResponseEnvelope | null {
  try {
    return readStudentResponse(storage.getItem(STUDENT_RESPONSE_STORAGE_KEY));
  } catch {
    return null;
  } finally {
    try {
      storage.removeItem(STUDENT_RESPONSE_STORAGE_KEY);
    } catch {
      // The browser owns storage availability; there is no server fallback.
    }
  }
}

export function clearStudentResponseHandoff(
  storage: Pick<Storage, 'removeItem'>,
): void {
  try {
    storage.removeItem(STUDENT_RESPONSE_STORAGE_KEY);
  } catch {
    // No fallback storage is allowed for the student prototype.
  }
}
