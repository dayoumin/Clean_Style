import { SUMMARIZE_AT_MESSAGES } from './constants';
import type { ChatMessage } from './history';

// Character count is a simple length signal, not an estimate of billed tokens.
export const CHAT_SUMMARY_CHARACTER_THRESHOLD = 8000;

export function shouldSummarizeChat(messages: ChatMessage[], summarizedUpTo = 0): boolean {
  const pending = messages.slice(summarizedUpTo);
  return pending.length >= SUMMARIZE_AT_MESSAGES
    && pending.reduce((length, message) => length + message.content.length, 0) >= CHAT_SUMMARY_CHARACTER_THRESHOLD;
}
