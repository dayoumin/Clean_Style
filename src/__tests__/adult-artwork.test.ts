import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { styleTypes } from '@/data/questions';
import { adultCommonArtwork, adultResultArtwork, getAdultResultArtwork } from '@/diagnostics/adult-integrity/artwork';

describe('adult presentation assets', () => {
  it('covers every diagnostic style exactly once with distinct local files', () => {
    expect(Object.keys(adultResultArtwork).sort()).toEqual(Object.keys(styleTypes).sort());
    expect(new Set(Object.values(adultResultArtwork)).size).toBe(Object.keys(styleTypes).length);
    for (const key of Object.keys(styleTypes)) {
      const asset = getAdultResultArtwork(key)!;
      const webp = readFileSync(resolve('public', asset.slice(1)));
      expect(webp.subarray(0, 4).toString()).toBe('RIFF');
      expect(webp.subarray(8, 12).toString()).toBe('WEBP');
      const og = readFileSync(resolve('public', asset.slice(1).replace('.webp', '.png')));
      expect(og.subarray(1, 4).toString()).toBe('PNG');
    }
  });

  it('keeps unknown and prototype keys out of the asset lookup', () => {
    for (const key of ['', 'missing', '__proto__', 'constructor', 'toString', '../student']) {
      expect(getAdultResultArtwork(key)).toBeUndefined();
    }
  });

  it('has separate home and neutral waiting illustrations', () => {
    expect(adultCommonArtwork.home).not.toBe(adultCommonArtwork.pause);
    for (const asset of Object.values(adultCommonArtwork)) {
      expect(readFileSync(resolve('public', asset.slice(1))).length).toBeGreaterThan(0);
    }
  });
});
