export type DiagnosticId =
  | 'adult-integrity'
  | 'workplace-respect'
  | 'student-integrity';

export type DiagnosticAudience = 'adult' | 'student';
export type DiagnosticStatus = 'production' | 'pilot' | 'planning';
export type DiagnosticStoragePolicy = 'server' | 'session-only' | 'local-ttl';

export interface DiagnosticDefinition {
  id: DiagnosticId;
  audience: DiagnosticAudience;
  status: DiagnosticStatus;
  route: string;
  instrumentVersion: string;
  scoringVersion: string;
  storagePolicy: DiagnosticStoragePolicy;
  resultMode: 'classified-style' | 'risk-guidance' | 'unscored-feedback';
}

export type DiagnosticResponsePhase = 'initial' | 'reconsidered' | 'transfer';

export type DiagnosticItemResponse =
  | {
      questionId: string;
      phase: DiagnosticResponsePhase;
      status: 'answered';
      choiceId: string;
      reasonId: string;
    }
  | {
      questionId: string;
      phase: DiagnosticResponsePhase;
      status: 'skipped';
    };

export interface DiagnosticResponseEnvelope<
  ProductId extends string = string,
  InstrumentId extends DiagnosticId = DiagnosticId,
> {
  schemaVersion: 'diagnostic-response-v1';
  productId: ProductId;
  instrumentId: InstrumentId;
  instrumentVersion: string;
  scoringVersion: string;
  formId: string;
  phase: DiagnosticResponsePhase;
  status: 'in-progress' | 'completed' | 'abandoned';
  responseMode: 'unscored' | 'scored';
  storagePolicy: DiagnosticStoragePolicy;
  startedAt: string;
  completedAt: string | null;
  responses: DiagnosticItemResponse[];
}
