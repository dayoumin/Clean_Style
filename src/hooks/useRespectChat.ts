'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getClientIdHeader } from '@/lib/client-id';
import { RESPECT_MAX_HISTORY_MESSAGES } from '@/lib/constants';
import { scanAndRedactPiiText, trimHistoryToLimit } from '@/lib/sanitize';
import { getChatErrorType, readChatReplyResponse, type ChatErrorType } from '@/lib/chat-reply';
import type { RespectEntry } from '@/data/workplaceRespectQuestions';
import type { DecodedRespectResponse } from '@/diagnostics/workplace-respect/response';

interface RespectChatMessage { role: 'user' | 'assistant'; content: string }

/** Workplace chat owns its in-memory history; the adult saved-history policy stays separate. */
export function useRespectChat(entry: RespectEntry, response?: DecodedRespectResponse['response']) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<RespectChatMessage[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatErrorType, setChatErrorType] = useState<ChatErrorType | null>(null);
  const [piiWarning, setPiiWarning] = useState<string[] | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatScrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetChat = useCallback(() => {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setChatLoading(false);
    setChatMessages([]);
    setStreamingAnswer('');
    setChatInput('');
    setChatErrorType(null);
    setPiiWarning(null);
  }, []);

  useEffect(() => {
    resetChat();
    return () => { chatAbortRef.current?.abort(); chatAbortRef.current = null; };
  }, [entry, response, resetChat]);

  useEffect(() => {
    if (!chatLoading) {
      chatScrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLoading, chatMessages.length, chatErrorType]);

  const fetchAiChat = useCallback(async () => {
    const rawQuestion = chatInput.trim();
    if (!response || !rawQuestion || chatAbortRef.current) return;
    const piiResult = scanAndRedactPiiText(rawQuestion);
    const question = piiResult.redacted;
    const controller = new AbortController();
    chatAbortRef.current = controller;
    const isCurrentRequest = () => chatAbortRef.current === controller && !controller.signal.aborted;
    setStreamingAnswer('');
    setChatErrorType(null);
    setPiiWarning(piiResult.hasPii ? piiResult.detected : null);
    setChatLoading(true);
    try {
      const res = await fetch('/api/respect-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getClientIdHeader() },
        body: JSON.stringify({
          entry, response, question,
          history: chatMessages.length > 0 ? trimHistoryToLimit(chatMessages, RESPECT_MAX_HISTORY_MESSAGES) : undefined,
        }),
        signal: controller.signal,
      });
      if (!isCurrentRequest()) { await res.body?.cancel(); return; }
      const reply = await readChatReplyResponse(res, controller.signal);
      if (!isCurrentRequest()) return;
      setStreamingAnswer(reply.answer);
      if (reply.detected.length) setPiiWarning(current => [...new Set([...(current ?? []), ...reply.detected])]);
      setChatMessages(prev => [...prev,
        { role: 'user' as const, content: question },
        { role: 'assistant' as const, content: reply.answer },
      ].slice(-RESPECT_MAX_HISTORY_MESSAGES));
      setChatInput('');
    } catch (error) {
      if (!isCurrentRequest()) return;
      setStreamingAnswer('');
      setChatErrorType(getChatErrorType(error));
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
        setChatLoading(false);
      }
    }
  }, [chatInput, chatMessages, entry, response]);

  const abortAiChat = useCallback(() => {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setStreamingAnswer('');
    setChatLoading(false);
  }, []);

  return { chatInput, setChatInput, chatMessages, streamingAnswer, chatLoading, chatErrorType,
    piiWarning, chatScrollAnchorRef, textareaRef, fetchAiChat, abortAiChat, resetChat };
}
