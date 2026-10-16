import { getQuestionOceanScene, QUESTION_OCEAN_FILES } from './question-ocean-scenes';

/** Every independent scene shares the same canvas and display scale. */
export default function QuestionOcean({ seed, questionIndex }: { seed: number; questionIndex: number }) {
  const scene = getQuestionOceanScene(seed, questionIndex);
  return (
    <img className="adult-question-ocean"
      src={`/images/adult-integrity/question-ocean/${QUESTION_OCEAN_FILES[scene]}`}
      width={435} height={214} alt="" aria-hidden="true" draggable={false} decoding="async" />
  );
}
