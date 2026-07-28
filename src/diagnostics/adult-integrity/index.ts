import type { DiagnosticDefinition } from '../core/types';

export {
  calculateResult,
  computeSixAxisScores,
  AXIS_MAXIMUMS,
  questions,
  styleTypes,
} from '../../data/questions';

export type {
  Choice,
  Question,
  SixAxisScores,
  StyleType,
} from '../../data/questions';

export const adultIntegrityDefinition: DiagnosticDefinition = {
  id: 'adult-integrity',
  audience: 'adult',
  status: 'production',
  route: '/test',
  instrumentVersion: 'adult-integrity-v1',
  scoringVersion: 'adult-three-axis-v1',
  storagePolicy: 'server',
  resultMode: 'classified-style',
};
