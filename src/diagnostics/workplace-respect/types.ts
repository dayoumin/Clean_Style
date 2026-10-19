export type RespectEntry = 'action' | 'experience';
export type RespectQuestionAxis = 'officialAction' | 'experienceFrequency' | 'crisisGate';
export type RespectOfficialBand = 'low' | 'moderate' | 'high' | 'veryHigh';
export type RespectCrisisKind = 'physicalSafety' | 'selfHarm';
export type RespectSupportKind = 'passing' | 'recurring';
export interface RespectChoice {
  id: string;
  text: string;
  score: number;
  crisis?: boolean;
  crisisKind?: RespectCrisisKind;
  support?: boolean;
  supportKind?: RespectSupportKind;
  gate?: boolean;
  uncertain?: boolean;
  /** Project-added unknown/skip control, outside the five official response categories. */
  auxiliary?: boolean;
}
export interface RespectQuestion {
  id: string;
  entry: RespectEntry;
  category: '행동' | '경험' | '안전';
  axis: RespectQuestionAxis;
  prompt: string;
  helpText?: string;
  choices: RespectChoice[];
}
export interface RespectResult {
  entry: RespectEntry;
  /** null means incomplete/unknown; it never means zero. */
  score: number | null;
  maxScore: 40 | 100;
  scoreLabel: string;
  sourceBand: RespectOfficialBand | null;
  sourceBandText: string | null;
  scoredAnsweredCount: number;
  scoredTotal: 10 | 25;
  reportedItems: Array<{ id: string; prompt: string; response: string }>;
  crisis: boolean;
  crisisKinds: RespectCrisisKind[];
  support: boolean;
  supportKind: RespectSupportKind | null;
  safetyUncertain: boolean;
  answeredCount: number;
  uncertainCount: number;
  informationLimited: boolean;
  title: string;
  summary: string;
  primaryActions: string[];
  supportActions: string[];
  supportNotice: { title: string; body: string } | null;
  safetyNotice: { title: string; body: string } | null;
}
