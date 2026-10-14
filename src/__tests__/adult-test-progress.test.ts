import { describe, expect, it } from 'vitest';
import { questions } from '@/diagnostics/adult-integrity';
import { ADULT_SHUFFLE_SEED_RANGE, parseAdultTestProgress } from '@/diagnostics/adult-integrity/progress';

describe('adult test progress restoration', () => {
  it('preserves existing valid saved answers and the exact shuffle seed', () => {
    const progress = { answers: [0, 2, 1], seed: 123 };
    expect(parseAdultTestProgress(JSON.stringify(progress))).toEqual(progress);
  });

  it.each([0, ADULT_SHUFFLE_SEED_RANGE - 1])('accepts valid seed boundary %s', seed => {
    const answers = questions.slice(0, -1).map(question => question.choices.length - 1);
    expect(parseAdultTestProgress(JSON.stringify({ answers, seed }))).toEqual({ answers, seed });
  });

  it.each([null, '', 'bad json', 'null', '[]', '42', '{}'])('rejects a missing or malformed record: %s', raw => {
    expect(parseAdultTestProgress(raw)).toBeNull();
  });

  it.each([[], Array(questions.length).fill(0), Array(questions.length + 1).fill(0)])('rejects empty or already complete answers: %j', answers => {
    expect(parseAdultTestProgress(JSON.stringify({ answers, seed: 123 }))).toBeNull();
  });

  it.each([-1, 0.5, null, '0', true, questions[1].choices.length])('rejects an invalid saved choice instead of scoring partial data: %s', choice => {
    expect(parseAdultTestProgress(JSON.stringify({ answers: [0, choice], seed: 123 }))).toBeNull();
  });

  it.each([undefined, null, '123', -1, 0.5, ADULT_SHUFFLE_SEED_RANGE, Infinity])('rejects a missing or invalid shuffle seed: %s', seed => {
    expect(parseAdultTestProgress(JSON.stringify({ answers: [0], seed }))).toBeNull();
  });

  it('does not accept non-array answers or non-finite values from JSON', () => {
    expect(parseAdultTestProgress('{"answers":{"0":0,"length":1},"seed":123}')).toBeNull();
    expect(parseAdultTestProgress('{"answers":[1e400],"seed":123}')).toBeNull();
    expect(parseAdultTestProgress('{"answers":[0],"seed":1e400}')).toBeNull();
  });
});
