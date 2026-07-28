import type { DiagnosticDefinition } from '../core/types';

export {
  getRespectQuestions,
  respectEntryLabels,
  workplaceRespectRuntimeQuestions,
} from '../../data/workplaceRespectQuestions';

export type {
  RespectChoice,
  RespectEntry,
  RespectQuestion,
  RespectResult,
  RespectRiskAxis,
  RespectRiskLevel,
} from '../../data/workplaceRespectQuestions';

export const workplaceRespectDefinition: DiagnosticDefinition = {
  id: 'workplace-respect',
  audience: 'adult',
  status: 'pilot',
  route: '/respect/check',
  instrumentVersion: 'workplace-respect-v0.1',
  scoringVersion: 'workplace-respect-risk-v0.1',
  storagePolicy: 'local-ttl',
  resultMode: 'risk-guidance',
};
