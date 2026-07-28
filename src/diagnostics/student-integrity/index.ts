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
