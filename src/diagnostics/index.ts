import type { DiagnosticDefinition, DiagnosticId } from './core/types';
import { adultIntegrityDefinition } from './adult-integrity';
import { studentIntegrityDefinition } from './student-integrity';
import { workplaceRespectDefinition } from './workplace-respect';

export const DIAGNOSTIC_REGISTRY: Readonly<Record<DiagnosticId, DiagnosticDefinition>> = {
  'adult-integrity': adultIntegrityDefinition,
  'workplace-respect': workplaceRespectDefinition,
  'student-integrity': studentIntegrityDefinition,
};

export type {
  DiagnosticAudience,
  DiagnosticDefinition,
  DiagnosticId,
  DiagnosticStatus,
  DiagnosticStoragePolicy,
} from './core/types';
