import { questions } from './index';

/** A result chart requires the complete adult instrument's choice indices. */
export function parseAdultResultAnswers(raw: string): number[] | undefined {
  if (!raw.trim()) return undefined;
  const parts = raw.split(',');
  if (parts.length !== questions.length || parts.some(part => !part.trim())) return undefined;
  const answers = parts.map(Number);
  return answers.every((choice, index) => Number.isInteger(choice) && questions[index].choices[choice] !== undefined)
    ? answers
    : undefined;
}
