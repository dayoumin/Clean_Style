import { QUESTION_OCEAN_FILES } from './question-ocean-files';
export { QUESTION_OCEAN_FILES } from './question-ocean-files';
export const QUESTION_OCEAN_SCENE_COUNT = QUESTION_OCEAN_FILES.length;

/** Start from the saved session seed, then advance one file per question. */
export function getQuestionOceanScene(seed: number, questionIndex: number): number {
  return (seed % QUESTION_OCEAN_SCENE_COUNT + Math.max(0, questionIndex)) % QUESTION_OCEAN_SCENE_COUNT;
}
