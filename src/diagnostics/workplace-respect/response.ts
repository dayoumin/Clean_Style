import { getRespectQuestions, isRespectEntry, RESPECT_INSTRUMENT_VERSION, RESPECT_SCORING_VERSION, RESPECT_RESULT_TTL_MS } from './content';
import type { RespectEntry } from './types';

export interface RespectResponse {
  schemaVersion: 'workplace-respect-response-v1';
  instrumentId: 'workplace-respect';
  instrumentVersion: string;
  scoringVersion: string;
  entry: RespectEntry;
  createdAt: number;
  responses: Array<{ questionId: string; choiceId: string }>;
}
export interface DecodedRespectResponse {
  response: RespectResponse;
  answers: number[];
}

// The check stops at the first crisis answer, so a stored response is either every question
// or an unbroken prefix that ends exactly at its first crisis answer.
function expectedAnswerCount(entry: RespectEntry, answers: number[]): number {
  const questions = getRespectQuestions(entry);
  const firstCrisis = answers.findIndex((answer, index) => Boolean(questions[index]?.choices[answer]?.crisis));
  return firstCrisis >= 0 ? firstCrisis + 1 : questions.length;
}

export function createRespectResponse(entry: RespectEntry, answers: number[], now = Date.now()): RespectResponse {
  const questions = getRespectQuestions(entry);
  const responses: RespectResponse['responses'] = [];
  answers.forEach((answer, index) => {
    const item = questions[index];
    const choice = Number.isInteger(answer) ? item?.choices[answer] : undefined;
    if (!item || !choice) throw new Error('Invalid respect answer');
    responses.push({ questionId: item.id, choiceId: choice.id });
  });
  const expected = expectedAnswerCount(entry, answers);
  if (responses.length < expected) throw new Error('Incomplete respect response');
  if (responses.length > expected) throw new Error('Respect response continues after a crisis answer');
  return { schemaVersion: 'workplace-respect-response-v1', instrumentId: 'workplace-respect', instrumentVersion: RESPECT_INSTRUMENT_VERSION,
    scoringVersion: RESPECT_SCORING_VERSION, entry, createdAt: now, responses };
}

export function decodeRespectResponse(value: unknown, entry: RespectEntry, now = Date.now(), options: { enforceLocalExpiry?: boolean } = {}): DecodedRespectResponse | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<RespectResponse>;
  if (candidate.schemaVersion !== 'workplace-respect-response-v1' || candidate.instrumentId !== 'workplace-respect'
    || candidate.instrumentVersion !== RESPECT_INSTRUMENT_VERSION || candidate.scoringVersion !== RESPECT_SCORING_VERSION
    || !isRespectEntry(candidate.entry ?? null) || candidate.entry !== entry
    || typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt) || candidate.createdAt <= 0
    || (options.enforceLocalExpiry !== false && (candidate.createdAt > now || now - candidate.createdAt >= RESPECT_RESULT_TTL_MS))
    || !Array.isArray(candidate.responses)) return null;
  const questions = getRespectQuestions(entry);
  const answers = Array<number>(questions.length).fill(-1);
  const seen = new Set<string>();
  for (const item of candidate.responses) {
    if (!item || typeof item !== 'object' || typeof item.questionId !== 'string' || typeof item.choiceId !== 'string' || seen.has(item.questionId)) return null;
    const index = questions.findIndex((question) => question.id === item.questionId);
    if (index < 0) return null;
    const choiceIndex = questions[index].choices.findIndex((choice) => choice.id === item.choiceId);
    if (choiceIndex < 0) return null;
    answers[index] = choiceIndex;
    seen.add(item.questionId);
  }
  const expected = expectedAnswerCount(entry, answers);
  if (!answers.every((answer, index) => (index < expected) === (answer >= 0))) return null;
  return { response: {
    schemaVersion: 'workplace-respect-response-v1', instrumentId: 'workplace-respect',
    instrumentVersion: RESPECT_INSTRUMENT_VERSION, scoringVersion: RESPECT_SCORING_VERSION,
    entry, createdAt: candidate.createdAt,
    responses: candidate.responses.map(({ questionId, choiceId }) => ({ questionId, choiceId })),
  }, answers };
}
