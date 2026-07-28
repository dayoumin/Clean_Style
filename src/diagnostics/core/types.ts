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
