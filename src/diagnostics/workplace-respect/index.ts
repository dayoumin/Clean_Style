import type { DiagnosticDefinition } from '../core/types';
import { RESPECT_INSTRUMENT_VERSION, RESPECT_SCORING_VERSION } from './content';

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
  instrumentVersion: RESPECT_INSTRUMENT_VERSION,
  scoringVersion: RESPECT_SCORING_VERSION,
  storagePolicy: 'local-ttl',
  resultMode: 'risk-guidance',
};
