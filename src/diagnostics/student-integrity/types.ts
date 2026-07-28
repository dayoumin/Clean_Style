import type {
  DiagnosticItemResponse,
  DiagnosticResponseEnvelope,
} from '../core/types';

export type StudentContentStatus =
  | 'sample-unvalidated'
  | 'reviewed-candidate'
  | 'approved-pilot';

export type StudentScenarioDomain =
  | 'learning'
  | 'peer-relationship'
  | 'group-participation'
  | 'digital-life'
  | 'school-rules';

export interface StudentScenarioChoice {
  id: string;
  text: string;
}

export interface StudentScenarioReason {
  id: string;
  text: string;
}

export interface StudentScenario {
  id: string;
  contentStatus: StudentContentStatus;
  safetyMode: 'standard' | 'help-seeking';
  domain: StudentScenarioDomain;
  title: string;
  situation: string;
  prompt: string;
  choices: readonly StudentScenarioChoice[];
  reasonPrompt: string;
  reasons: readonly StudentScenarioReason[];
}

export type StudentItemResponse = DiagnosticItemResponse;

export type StudentResponseEnvelope = DiagnosticResponseEnvelope<
  'clean-style-student',
  'student-integrity'
>;

export interface StudentDraftState {
  questionId: string;
  choiceId: string | null;
  reasonId: string | null;
}
