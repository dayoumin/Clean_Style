'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_HISTORY_MESSAGES, SUMMARIZE_AT_MESSAGES } from '@/lib/constants';
import { getHistoryEntry, updateChat, clearChat, type ChatMessage } from '@/lib/history';

interface UseAiChatOptions {
  styleKey: string;
  historyId: string;
  scores: { principle: number; transparency: number; independence: number };
}

export function useAiChat({ styleKey, historyId, scores }: UseAiChatOptions) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiErrorType, setAiErrorType] = useState<'network' | 'rate-limit' | 'server' | null>(null);
  const [userContext, setUserContext] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSummary, setChatSummary] = useState('');
  const [summarizedUpTo, setSummarizedUpTo] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const summarizeAbortRef = useRef<AbortController | null>(null);
  const summarizingRef = useRef(false);
  const chatLoadedRef = useRef(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // refs for mutable state read inside callbacks (avoids stale closures + dependency churn)
  const chatSummaryRef = useRef(chatSummary);
  const chatHistoryRef = useRef(chatHistory);
  const summarizedUpToRef = useRef(summarizedUpTo);
  const userContextRef = useRef(userContext);
  useEffect(() => { chatSummaryRef.current = chatSummary; }, [chatSummary]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
  useEffect(() => { summarizedUpToRef.current = summarizedUpTo; }, [summarizedUpTo]);
  useEffect(() => { userContextRef.current = userContext; }, [userContext]);

  const chatMaxReached = chatHistory.length >= MAX_HISTORY_MESSAGES;
  // messages are added in pairs (user+assistant), so length is always even
  const chatLastTurn = chatHistory.length === MAX_HISTORY_MESSAGES - 2;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      summarizeAbortRef.current?.abort();
    };
  }, []);

  // auto-scroll during streaming (interval while loading, not per-token)
  useEffect(() => {
    if (aiLoading) {
      const interval = setInterval(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [aiLoading]);

  const triggerSummarize = useCallback(async (messages: ChatMessage[]) => {
    summarizeAbortRef.current?.abort();
    summarizingRef.current = true;
    const controller = new AbortController();
    summarizeAbortRef.current = controller;
    try {
      const currentSummary = chatSummaryRef.current;
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentSummary ? messages.slice(-SUMMARIZE_AT_MESSAGES) : messages,
          summary: currentSummary || undefined,
          styleKey,
        }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setChatSummary(data.summary);
        setSummarizedUpTo(messages.length);
      }
    } catch {
      // 요약 실패/취소 시 무시
    } finally {
      summarizingRef.current = false;
    }
  }, [styleKey]);

  useEffect(() => {
    // historyId 전환 시 이전 요약 요청 취소 (stale summary 방지)
    summarizeAbortRef.current?.abort();
    setChatSummary('');
    setSummarizedUpTo(0);
    if (!historyId) {
      setChatHistory([]);
      return;
    }
    const entry = getHistoryEntry(historyId);
    if (entry?.chat.length) {
      chatLoadedRef.current = true;
      setChatHistory(entry.chat);
      if (entry.chat.length >= SUMMARIZE_AT_MESSAGES) {
        triggerSummarize(entry.chat);
      }
    } else {
      setChatHistory([]);
    }
  }, [historyId, triggerSummarize]);

  useEffect(() => {
    if (chatLoadedRef.current) {
      chatLoadedRef.current = false;
      return;
    }
    if (historyId && chatHistory.length > 0) {
      updateChat(historyId, chatHistory);
    }
  }, [historyId, chatHistory]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const clearChatUI = useCallback(() => {
    setAiAnswer('');
    setUserContext('');
    setAiErrorType(null);
  }, []);

  const fetchAnswer = useCallback(async () => {
    const question = userContextRef.current.trim();
    if (!question) return;
    abortRef.current?.abort();
    setAiLoading(true);
    setAiErrorType(null);
    setAiAnswer('');

    const controller = new AbortController();
    abortRef.current = controller;

    let fullAnswer = '';

    try {
      const currentHistory = chatHistoryRef.current;
      const currentSummary = chatSummaryRef.current;
      const currentSummarizedUpTo = summarizedUpToRef.current;
      const historyToSend = currentSummary
        ? currentHistory.slice(currentSummarizedUpTo)
        : currentHistory;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleKey, scores,
          userContext: question,
          history: historyToSend.length > 0 ? historyToSend : undefined,
          summary: currentSummary || undefined,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) throw new Error('RATE_LIMIT');
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        console.error('Chat API error:', res.status, body.detail ?? body.error);
        throw new Error('API 응답 오류');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastRenderTime = 0;
      const RENDER_INTERVAL = 30; // ms — 자연스러운 타이핑 속도

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;

          let parsed;
          try { parsed = JSON.parse(payload); } catch { continue; }
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.token) {
            fullAnswer += parsed.token;
            const now = performance.now();
            if (now - lastRenderTime >= RENDER_INTERVAL) {
              setAiAnswer(fullAnswer);
              lastRenderTime = now;
            }
          }
        }
      }
      setAiAnswer(fullAnswer);

      if (!fullAnswer) throw new Error('Empty response');

      const raw: ChatMessage[] = [
        ...currentHistory,
        { role: 'user', content: question },
        { role: 'assistant', content: fullAnswer },
      ];
      const trimCount = raw.length - MAX_HISTORY_MESSAGES;
      const newHistory = trimCount > 0 ? raw.slice(trimCount) : raw;

      if (trimCount > 0 && currentSummarizedUpTo > 0) {
        setSummarizedUpTo(Math.max(0, currentSummarizedUpTo - trimCount));
      }

      setChatHistory(newHistory);

      const turnCount = newHistory.length / 2;
      if (turnCount >= 4 && turnCount % 4 === 0) {
        triggerSummarize(newHistory);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (fullAnswer) setAiAnswer(fullAnswer);
      if (err instanceof TypeError) {
        setAiErrorType('network');
      } else if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setAiErrorType('rate-limit');
      } else {
        setAiErrorType('server');
      }
    } finally {
      setAiLoading(false);
    }
  }, [styleKey, scores, triggerSummarize]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    summarizeAbortRef.current?.abort();
    setAiLoading(false);
    clearChatUI();
    setChatHistory([]);
    setChatSummary('');
    setSummarizedUpTo(0);
    if (historyId) clearChat(historyId);
  }, [historyId, clearChatUI]);

  const deleteChat = useCallback(() => {
    resetChat();
  }, [resetChat]);

  const abortAnswer = useCallback(() => {
    abortRef.current?.abort();
    setAiLoading(false);
  }, []);

  return {
    aiLoading, aiAnswer, aiErrorType,
    userContext, setUserContext,
    chatHistory, chatMaxReached, chatLastTurn,
    scrollAnchorRef,
    fetchAnswer,
    resetChat,
    clearInput: clearChatUI,
    scrollToBottom,
    deleteChat,
    abortAnswer,
  };
}
