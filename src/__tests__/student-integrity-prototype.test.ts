import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  STUDENT_PROTOTYPE_FORM_ID,
  STUDENT_RESPONSE_STORAGE_KEY,
  clearStudentResponseHandoff,
  createStudentResponseEnvelope,
  isValidStudentResponseEnvelope,
  readStudentResponse,
  studentPrototypeScenarios,
  takeStudentResponseFromHandoff,
  writeStudentResponseForHandoff,
  type StudentItemResponse,
} from '@/diagnostics/student-integrity';

function completeResponses(): StudentItemResponse[] {
  return studentPrototypeScenarios.map((scenario, index) => {
    if (index === 1) {
      return {
        questionId: scenario.id,
        phase: 'initial',
        status: 'skipped',
      };
    }

    return {
      questionId: scenario.id,
      phase: 'initial',
      status: 'answered',
      choiceId: scenario.choices[0].id,
      reasonId: scenario.reasons[0].id,
    };
  });
}

describe('student integrity prototype contract', () => {
  it('keeps prototype content explicitly unvalidated with unique stable ids', () => {
    const questionIds = studentPrototypeScenarios.map((scenario) => scenario.id);
    expect(new Set(questionIds).size).toBe(questionIds.length);

    for (const scenario of studentPrototypeScenarios) {
      expect(scenario.contentStatus).toBe('sample-unvalidated');
      expect(scenario.safetyMode).toBe('standard');
      expect(new Set(scenario.choices.map((choice) => choice.id)).size).toBe(scenario.choices.length);
      expect(new Set(scenario.reasons.map((reason) => reason.id)).size).toBe(scenario.reasons.length);
    }
  });

  it('creates a versioned, completed, unscored session-only response', () => {
    const response = createStudentResponseEnvelope(
      completeResponses(),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    );

    expect(response.formId).toBe(STUDENT_PROTOTYPE_FORM_ID);
    expect(response.status).toBe('completed');
    expect(response.responseMode).toBe('unscored');
    expect(response.storagePolicy).toBe('session-only');
    expect(isValidStudentResponseEnvelope(response)).toBe(true);
    expect('scores' in response).toBe(false);
    expect('styleKey' in response).toBe(false);
    expect('name' in response).toBe(false);
  });

  it('accepts answered and skipped items but rejects incomplete completion', () => {
    const complete = createStudentResponseEnvelope(
      completeResponses(),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    );
    const incomplete = {
      ...complete,
      responses: complete.responses.slice(0, -1),
    };

    expect(isValidStudentResponseEnvelope(complete)).toBe(true);
    expect(isValidStudentResponseEnvelope(incomplete)).toBe(false);
    expect(() => createStudentResponseEnvelope(
      completeResponses().slice(0, -1),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    )).toThrow('Invalid student response envelope');
  });

  it('rejects duplicate questions and invalid choice or reason references', () => {
    const complete = createStudentResponseEnvelope(
      completeResponses(),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    );
    const duplicate = {
      ...complete,
      responses: [complete.responses[0], complete.responses[0], complete.responses[2]],
    };
    const invalidReference = {
      ...complete,
      responses: complete.responses.map((response, index) => (
        index === 0 && response.status === 'answered'
          ? { ...response, choiceId: 'unknown-choice' }
          : response
      )),
    };
    const invalidReason = {
      ...complete,
      responses: complete.responses.map((response, index) => (
        index === 0 && response.status === 'answered'
          ? { ...response, reasonId: 'unknown-reason' }
          : response
      )),
    };
    const skippedWithAnswerFields = {
      ...complete,
      responses: complete.responses.map((response, index) => (
        index === 1
          ? { ...response, choiceId: 'contact-first', reasonId: 'fair-contribution' }
          : response
      )),
    };

    expect(isValidStudentResponseEnvelope(duplicate)).toBe(false);
    expect(isValidStudentResponseEnvelope(invalidReference)).toBe(false);
    expect(isValidStudentResponseEnvelope(invalidReason)).toBe(false);
    expect(isValidStudentResponseEnvelope(skippedWithAnswerFields)).toBe(false);
  });

  it('rejects other product and instrument versions during restore', () => {
    const complete = createStudentResponseEnvelope(
      completeResponses(),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    );

    expect(readStudentResponse(JSON.stringify({ ...complete, productId: 'clean-style' }))).toBeNull();
    expect(readStudentResponse(JSON.stringify({ ...complete, instrumentVersion: 'student-p1' }))).toBeNull();
    expect(readStudentResponse('{broken-json')).toBeNull();
  });

  it('does not add server calls, localStorage, names, or free-text inputs to student pages', () => {
    const studentPages = [
      'src/products/student/pages/test-page.tsx',
      'src/products/student/pages/StudentResultClient.tsx',
    ].map((file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')).join('\n');

    expect(studentPages).not.toContain('fetch(');
    expect(studentPages).not.toContain('localStorage');
    expect(studentPages).not.toContain('type="text"');
    expect(studentPages).not.toContain('textarea');
    expect(studentPages).not.toContain('missions');
    expect(studentPages).not.toContain('성장 미션');
  });

  it('uses session storage only as a read-once handoff', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
    const complete = createStudentResponseEnvelope(
      completeResponses(),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    );

    expect(writeStudentResponseForHandoff(storage, complete)).toBe(true);
    expect(values.has(STUDENT_RESPONSE_STORAGE_KEY)).toBe(true);
    expect(takeStudentResponseFromHandoff(storage)).toEqual(complete);
    expect(values.has(STUDENT_RESPONSE_STORAGE_KEY)).toBe(false);
    clearStudentResponseHandoff(storage);
  });

  it('does not fall back when browser session storage is unavailable', () => {
    const unavailableStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const complete = createStudentResponseEnvelope(
      completeResponses(),
      '2026-07-28T00:00:00.000Z',
      '2026-07-28T00:03:00.000Z',
    );

    expect(writeStudentResponseForHandoff(unavailableStorage, complete)).toBe(false);
    expect(takeStudentResponseFromHandoff(unavailableStorage)).toBeNull();
    expect(() => clearStudentResponseHandoff(unavailableStorage)).not.toThrow();
  });
});
