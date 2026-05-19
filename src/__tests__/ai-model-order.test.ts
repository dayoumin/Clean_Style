import { describe, expect, it } from 'vitest';
import { AI_MODELS } from '@/lib/ai';

describe('AI_MODELS', () => {
  it('uses Gemini first, NVIDIA second, Grok third', () => {
    expect(AI_MODELS).toEqual([
      'google/gemini-3.1-flash-lite-preview',
      'nvidia:deepseek-ai/deepseek-v4-flash',
      'x-ai/grok-4.3',
    ]);
  });
});
