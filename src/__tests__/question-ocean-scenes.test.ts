import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
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

  it('advances in file order on every question and wraps after the thirtieth', () => {
    expect(Array.from({ length: 5 }, (_, index) => getQuestionOceanScene(28, index))).toEqual([28, 29, 0, 1, 2]);
    for (const seed of [0, 1, 731, 99999]) {
      for (let index = 0; index < 14; index++) {
        expect(getQuestionOceanScene(seed, index + 1)).toBe((getQuestionOceanScene(seed, index) + 1) % 30);
      }
    }
  });

  it('ships thirty small versioned WebPs with exactly the same canvas dimensions', async () => {
    const require = createRequire(import.meta.url);
    const sharp = createRequire(require.resolve('next/package.json'))('sharp');
    expect(new Set(QUESTION_OCEAN_FILES).size).toBe(30);
    for (const name of QUESTION_OCEAN_FILES) {
      const webp = readFileSync(resolve('public/images/adult-integrity/question-ocean', name));
      expect(webp.subarray(0, 4).toString()).toBe('RIFF');
      expect(webp.subarray(8, 12).toString()).toBe('WEBP');
      const hash = createHash('sha256').update(webp).digest('hex').slice(0, 10);
      expect(name.endsWith(`-${hash}.webp`)).toBe(true);
      const metadata = await sharp(webp).metadata();
      expect(metadata.width).toBe(435);
      expect(metadata.height).toBe(214);
      expect(webp.length).toBeLessThan(15_000);
    }
  });
});
