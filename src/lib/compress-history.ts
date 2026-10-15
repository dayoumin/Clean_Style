/**
 * 대화 히스토리 축약 유틸리티
 *
 * LLM 요약(/api/summarize) 실패 시 fallback으로 사용.
 * 오래된 메시지를 문자열 truncation으로 축약하여
 * API 호출 없이 대화 맥락을 보존.
 *
 * BioHub 프로젝트의 chat-history-compressor.ts에서 이식.
 */

import type { ChatMessage } from './history';
import { MAX_CONTENT_LENGTH } from './constants';

const MAX_CHARS_PER_MESSAGE = 120;
// sanitizeSummary가 앞쪽 20줄·MAX_CONTENT_LENGTH자만 남기므로, 미리 최신 내용 위주로 맞춘다.
const MAX_SUMMARY_LINES = 20;

/**
 * 대화 히스토리를 텍스트 요약으로 축약 (LLM 호출 없음)
 *
 * @param messages - 축약할 대화 메시지 배열
 * @param existingSummary - 기존 요약 (있으면 앞에 붙임)
 * @returns 축약된 텍스트 요약
 */
export function compressHistoryToSummary(
  messages: ChatMessage[],
  existingSummary?: string,
): string {
  const lines = messages.map(m => {
    const prefix = m.role === 'user' ? '사용자' : 'AI';
    const truncated = truncateAtSentence(m.content, MAX_CHARS_PER_MESSAGE);
    return `${prefix}: ${truncated}`;
  });

  const newSummary = lines.join('\n');
  const combined = existingSummary ? `${existingSummary}\n\n${newSummary}` : newSummary;
  return keepNewest(combined);
}

/** 줄 수·글자 수 한도를 넘으면 오래된(앞쪽) 줄부터 버린다. */
function keepNewest(text: string): string {
  const lines = text.replace(/\n{3,}/g, '\n\n').split('\n');
  while (lines.length > 1 && (lines.length > MAX_SUMMARY_LINES || lines.join('\n').length > MAX_CONTENT_LENGTH)) {
    lines.shift();
  }
  return lines.join('\n').trim().slice(-MAX_CONTENT_LENGTH);
}

function truncateAtSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?'),
  );
  const cutPoint = lastEnd > maxChars * 0.5 ? lastEnd + 1 : maxChars;
  return text.slice(0, cutPoint).trimEnd() + '…';
}
