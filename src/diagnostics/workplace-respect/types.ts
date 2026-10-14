export type RespectEntry = 'action' | 'experience';
export type RespectRiskAxis = 'relationPower' | 'workScope' | 'dignityHarm' | 'privateBenefit' | 'disadvantage' | 'repetition';
export type RespectQuestionAxis = RespectRiskAxis | 'evidenceSupport' | 'resultGate' | 'crisisGate';
export type RespectRiskLevel = 'low' | 'caution' | 'high' | 'urgent';
export type RespectCrisisKind = 'physicalSafety' | 'selfHarm';
export interface RespectChoice {
  id: string;
  text: string;
  score: number;
  crisis?: boolean;
  crisisKind?: RespectCrisisKind;
  support?: boolean;
  gate?: boolean;
  uncertain?: boolean;
}
export interface RespectQuestion {
  id: string;
  entry: RespectEntry;
  category: '관계' | '업무범위' | '존중' | '사적요구' | '불이익' | '반복' | '기록' | '안전';
  axis: RespectQuestionAxis;
  prompt: string;
  choices: RespectChoice[];
}
export interface RespectAxisSummary {
  scores: Record<RespectRiskAxis, number>;
  activeAxes: RespectRiskAxis[];
  coreCriteriaMet: boolean;
}
export interface RespectResult {
  entry: RespectEntry;
  level: RespectRiskLevel;
  score: number;
  crisis: boolean;
  crisisKinds: RespectCrisisKind[];
  support: boolean;
  answeredCount: number;
  uncertainCount: number;
  axisSummary: RespectAxisSummary;
  title: string;
  summary: string;
  primaryActions: string[];
  supportActions: string[];
}
