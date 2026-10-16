import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getQuestionOceanScene, QUESTION_OCEAN_SCENE_COUNT, QUESTION_OCEAN_FILES } from '@/products/adult/components/question-ocean-scenes';

describe('question ocean scene selection', () => {
  it('keeps fifteen scenes distinct and stable for a saved session seed', () => {
    for (const seed of [0, 1, 29, 731, 99999]) {
      const scenes = Array.from({ length: 15 }, (_, index) => getQuestionOceanScene(seed, index));
      expect(new Set(scenes).size).toBe(15);
      expect(getQuestionOceanScene(seed, 3)).toBe(scenes[3]);
      expect(scenes.every(scene => scene >= 0 && scene < QUESTION_OCEAN_SCENE_COUNT)).toBe(true);
    }
  });

  it('selects varied scenes across new sessions', () => {
    const scenes = Array.from({ length: 300 }, (_, seed) => getQuestionOceanScene(seed, 0));
    expect(new Set(scenes).size).toBe(QUESTION_OCEAN_SCENE_COUNT);
  });

  it('ships thirty independent PNGs with exactly the same canvas dimensions', () => {
    expect(new Set(QUESTION_OCEAN_FILES).size).toBe(30);
    for (const name of QUESTION_OCEAN_FILES) {
      const png = readFileSync(resolve('public/images/adult-integrity/question-ocean', name));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(png.readUInt32BE(16)).toBe(435);
      expect(png.readUInt32BE(20)).toBe(214);
    }
  });
});
