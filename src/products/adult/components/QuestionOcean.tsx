'use client';

import { useEffect, useState } from 'react';
import { getQuestionOceanScene, QUESTION_OCEAN_FILES } from './question-ocean-scenes';
import { prepareOceanImage } from './prepare-ocean-image';

/** Every independent scene shares the same canvas and display scale. */
export default function QuestionOcean({ seed, questionIndex, hasNext }: { seed: number; questionIndex: number; hasNext: boolean }) {
  const scene = getQuestionOceanScene(seed, questionIndex);
  const source = `/images/adult-integrity/question-ocean/${QUESTION_OCEAN_FILES[scene]}`;
  const [readySource, setReadySource] = useState(source);
  const [frame, setFrame] = useState<{ current: string; incoming: string | null }>({ current: source, incoming: null });
  useEffect(() => prepareOceanImage(source, () => setReadySource(source)), [source]);
  useEffect(() => {
    if (readySource !== source) return;
    // Finish an active fade before advancing to the latest requested scene.
    setFrame(previous => previous.incoming || previous.current === readySource
      ? previous : { ...previous, incoming: readySource });
  }, [readySource, source, frame.incoming]);
  function finishTransition(incoming: string) {
    setFrame(previous => previous.incoming === incoming
      ? { current: incoming, incoming: null } : previous);
  }
  useEffect(() => {
    const incoming = frame.incoming;
    if (!incoming) return;
    // Also settle when animation events are suppressed or the tab is hidden.
    const timeout = window.setTimeout(() => finishTransition(incoming), 550);
    return () => window.clearTimeout(timeout);
  }, [frame.incoming]);
  const nextSource = `/images/adult-integrity/question-ocean/${QUESTION_OCEAN_FILES[getQuestionOceanScene(seed, questionIndex + 1)]}`;
  useEffect(() => {
    if (!hasNext) return;
    const nextImage = new Image();
    nextImage.decoding = 'async';
    nextImage.src = nextSource;
  }, [hasNext, nextSource]);
  return (
    <div className="adult-question-ocean" aria-hidden="true">
      {[frame.current, frame.incoming].filter((value): value is string => value !== null).map(imageSource => (
        <img key={imageSource}
          className={`adult-question-ocean-layer${frame.incoming ? imageSource === frame.incoming ? ' is-incoming' : ' is-outgoing' : ''}`}
          src={imageSource} width={435} height={214} alt="" draggable={false} decoding="async"
          onAnimationEnd={imageSource === frame.incoming ? () => finishTransition(imageSource) : undefined} />
      ))}
    </div>
  );
}
