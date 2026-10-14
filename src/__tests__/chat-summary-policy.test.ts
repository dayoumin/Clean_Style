import { describe, expect, it } from 'vitest';
import { shouldSummarizeChat } from '@/lib/chat-summary-policy';
import type { ChatMessage } from '@/lib/history';

function messages(count: number, length: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: '가'.repeat(length) }));
}

describe('chat summary length policy', () => {
  it('keeps a full short conversation verbatim instead of summarizing every four turns', () => {
    expect(shouldSummarizeChat(messages(8, 100))).toBe(false);
    expect(shouldSummarizeChat(messages(40, 100))).toBe(false);
  });

  it('summarizes only when enough accumulated text and turns exist', () => {
    expect(shouldSummarizeChat(messages(8, 999))).toBe(false);
    expect(shouldSummarizeChat(messages(8, 1000))).toBe(true);
    expect(shouldSummarizeChat(messages(6, 2000))).toBe(false);
  });

  it('counts only text added after the previous summary', () => {
    const history = [...messages(8, 1500), ...messages(8, 100)];
    expect(shouldSummarizeChat(history, 8)).toBe(false);
    expect(shouldSummarizeChat([...history, ...messages(8, 900)], 8)).toBe(true);
  });
});
