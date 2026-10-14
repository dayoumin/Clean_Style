import type { DiagnosticDefinition } from '../core/types';

export const studentIntegrityDefinition: DiagnosticDefinition = {
  id: 'student-integrity',
  audience: 'student',
  status: 'planning',
  route: '/test',
  instrumentVersion: 'student-integrity-p0',
  scoringVersion: 'unscored-p0',
  storagePolicy: 'session-only',
  resultMode: 'unscored-feedback',
};

export const STUDENT_DEMO_FORM_ID = 'student-demo-form-v1';
export const STUDENT_DEMO_CONTENT_VERSION = 'student-demo-content-v1';
export const STUDENT_DEMO_FEEDBACK_VERSION = 'student-demo-feedback-v1';
export const STUDENT_EXPERIENCE_MODE = 'contest-demo';
