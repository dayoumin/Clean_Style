'use client';

import { useEffect } from 'react';
import { getQuestionOceanScene, QUESTION_OCEAN_FILES } from './question-ocean-scenes';

/** Every independent scene shares the same canvas and display scale. */
export default function QuestionOcean({ seed, questionIndex, hasNext }: { seed: number; questionIndex: number; hasNext: boolean }) {
  const scene = getQuestionOceanScene(seed, questionIndex);
  const nextSource = `/images/adult-integrity/question-ocean/${QUESTION_OCEAN_FILES[getQuestionOceanScene(seed, questionIndex + 1)]}`;
  useEffect(() => {
    if (!hasNext) return;
    const nextImage = new Image();
    nextImage.decoding = 'async';
    nextImage.src = nextSource;
  }, [hasNext, nextSource]);
  return (
    <img className="adult-question-ocean"
      src={`/images/adult-integrity/question-ocean/${QUESTION_OCEAN_FILES[scene]}`}
      width={435} height={214} alt="" aria-hidden="true" draggable={false} decoding="async" />
  );
}
