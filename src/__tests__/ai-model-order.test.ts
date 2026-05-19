import { describe, expect, it } from 'vitest';
import { AI_MODELS } from '@/lib/ai';

describe('AI_MODELS', () => {
  it('uses NVIDIA first, Gemini second, Grok third', () => {
    expect(AI_MODELS).toEqual([
      'nvidia:deepseek-ai/deepseek-v4-flash',
      'google/gemini-3.1-flash-lite-preview',
      'x-ai/grok-4.3',
    ]);
  });
});
