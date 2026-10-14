'use client';

import { useState } from 'react';

/** A reserved header slot keeps the decoration independent of question length. */
export default function QuestionSeaweed() {
  const [failed, setFailed] = useState(false);

  return (
    <img src="/images/adult-integrity/question-seaweed-2d.png" alt="" aria-hidden="true"
      width={48} height={48} decoding="async" draggable={false} className="adult-question-seaweed"
      style={{ visibility: failed ? 'hidden' : 'visible' }}
      onError={() => setFailed(true)} />
  );
}
