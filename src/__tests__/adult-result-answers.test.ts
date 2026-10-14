import { describe, expect, it } from 'vitest';
import { questions } from '@/diagnostics/adult-integrity';
import { parseAdultResultAnswers } from '@/diagnostics/adult-integrity/result-answers';

describe('adult result chart answers', () => {
  const complete = Array(questions.length).fill(0);

  it('preserves all complete choice indices', () => {
    const answers = questions.map(question => question.choices.length - 1);
    expect(parseAdultResultAnswers(answers.join(','))).toEqual(answers);
  });

  it.each(['', ' ', '0', '0,1', [...complete, 0].join(',')])('rejects missing or incomplete responses: %s', raw => {
    expect(parseAdultResultAnswers(raw)).toBeUndefined();
  });

  it.each(['', 'bad', '-1', '0.5', '99', 'Infinity'])('rejects an invalid choice without drawing a partial chart: %s', choice => {
    const answers = complete.map(String);
    answers[3] = choice;
    expect(parseAdultResultAnswers(answers.join(','))).toBeUndefined();
  });
});
