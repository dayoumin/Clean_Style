'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_HISTORY_MESSAGES } from '@/lib/constants';
import { shouldSummarizeChat } from '@/lib/chat-summary-policy';
import { getHistoryEntry, updateChat, clearChat, type ChatMessage } from '@/lib/history';
import { compressHistoryToSummary } from '@/lib/compress-history';
import { getClientIdHeader } from '@/lib/client-id';
import { scanAndRedactPiiText, redactPiiText, trimHistoryToLimit, redactHistoryPii, sanitizeHistory, sanitizeSummary } from '@/lib/sanitize';

interface UseAiChatOptions {
  styleKey: string;
  historyId: string;
  scores: { principle: number; transparency: number; independence: number };
}

export function useAiChat({ styleKey, historyId, scores }: UseAiChatOptions) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiErrorType, setAiErrorType] = useState<'network' | 'rate-limit' | 'shared-rate-limit' | 'server' | null>(null);
  const [piiWarning, setPiiWarning] = useState<string[] | null>(null);
  const [userContext, setUserContext] = useState('');
  // 전송 중인 질문(PII 마스킹본). 입력창은 전송 즉시 비운다.
  const [pendingQuestion, setPendingQuestion] = useState('');
  const pendingRawQuestionRef = useRef('');
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
    const currentSummary = chatSummaryRef.current;
    const pending = sanitizeHistory(currentSummary ? messages.slice(summarizedUpToRef.current) : messages);
    const messagesToSummarize = trimHistoryToLimit(pending);
    // 글자 수 한도 밖으로 밀려난 앞부분은 문자열 축약으로 기존 요약에 합쳐, 요약 범위에서 조용히 빠지지 않게 한다.
    const dropped = pending.slice(0, pending.length - messagesToSummarize.length);
    const baseSummary = dropped.length > 0
      ? compressHistoryToSummary(dropped, currentSummary || undefined)
      : currentSummary;
    const applySummary = (summary: string) => {
      if (controller.signal.aborted || summarizeAbortRef.current !== controller) return;
      summary = sanitizeSummary(summary);
      chatSummaryRef.current = summary;
      summarizedUpToRef.current = messages.length;
      setChatSummary(summary);
      setSummarizedUpTo(messages.length);
    };
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getClientIdHeader() },
        body: JSON.stringify({
          history: messagesToSummarize,
          summary: baseSummary ? sanitizeSummary(baseSummary) : undefined,
          styleKey,
        }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (controller.signal.aborted || summarizeAbortRef.current !== controller) return;
        if (typeof data.summary !== 'string' || !data.summary.trim()) throw new Error('Invalid summary');
        applySummary(data.summary);
      } else {
        if (controller.signal.aborted || summarizeAbortRef.current !== controller) return;
        // LLM 요약 실패 → 문자열 축약 fallback
        applySummary(compressHistoryToSummary(messagesToSummarize, baseSummary || undefined));
      }
    } catch {
      // 네트워크 실패/취소 → 문자열 축약 fallback (취소 제외)
      if (!controller.signal.aborted && summarizeAbortRef.current === controller) {
        applySummary(compressHistoryToSummary(messagesToSummarize, baseSummary || undefined));
      }
    } finally {
      if (summarizeAbortRef.current === controller) summarizingRef.current = false;
    }
  }, [styleKey]);

  useEffect(() => {
    // historyId 전환 시 이전 요약 요청 취소 (stale summary 방지)
    abortRef.current?.abort();
    abortRef.current = null;
    userContextRef.current = '';
    pendingRawQuestionRef.current = '';
    chatHistoryRef.current = [];
    setAiLoading(false);
    setAiAnswer('');
    setAiErrorType(null);
    setPiiWarning(null);
    setUserContext('');
    setPendingQuestion('');
    summarizeAbortRef.current?.abort();
    summarizingRef.current = false;
    chatLoadedRef.current = false;
    chatSummaryRef.current = '';
    summarizedUpToRef.current = 0;
    setChatSummary('');
    setSummarizedUpTo(0);
    if (!historyId) {
      setChatHistory([]);
      return;
    }
    const entry = getHistoryEntry(historyId);
    if (entry?.chat.length) {
      const safeChat = redactHistoryPii(entry.chat);
      chatLoadedRef.current = true;
      chatHistoryRef.current = safeChat;
      setChatHistory(safeChat);
      if (safeChat.some((message, index) => message.content !== entry.chat[index].content)) {
        updateChat(historyId, safeChat);
      }
      if (safeChat.length < MAX_HISTORY_MESSAGES && shouldSummarizeChat(safeChat)) {
        triggerSummarize(safeChat);
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
    if (historyId && chatHistory.length > 0 && chatHistory === chatHistoryRef.current) {
      updateChat(historyId, chatHistory);
    }
  }, [historyId, chatHistory]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const clearChatUI = useCallback(() => {
    setAiAnswer('');
    setUserContext('');
    userContextRef.current = '';
    setPendingQuestion('');
    pendingRawQuestionRef.current = '';
    setAiErrorType(null);
    setPiiWarning(null);
  }, []);

  const fetchAnswer = useCallback(async () => {
    const question = userContextRef.current.trim();
    if (!question || chatHistoryRef.current.length >= MAX_HISTORY_MESSAGES) return;
    abortRef.current?.abort();
    // 개인정보는 보내기 전에 가리고, 가린 문장만 화면·기록에 남긴다.
    const piiResult = scanAndRedactPiiText(question);
    const safeQuestion = piiResult.redacted;
    pendingRawQuestionRef.current = question;
    setPendingQuestion(safeQuestion);
    userContextRef.current = '';
    setUserContext('');
    setAiLoading(true);
    setAiErrorType(null);
    setPiiWarning(piiResult.hasPii ? piiResult.detected : null);
    setAiAnswer('');

    const controller = new AbortController();
    abortRef.current = controller;
    const isCurrentRequest = () => abortRef.current === controller && !controller.signal.aborted;

    let fullAnswer = '';

    try {
      const currentHistory = chatHistoryRef.current;
      const currentSummary = chatSummaryRef.current;
      const currentSummarizedUpTo = summarizedUpToRef.current;
      const historyToSend = trimHistoryToLimit(sanitizeHistory(currentSummary
        ? currentHistory.slice(currentSummarizedUpTo)
        : currentHistory));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getClientIdHeader() },
        body: JSON.stringify({
          styleKey, scores,
          userContext: safeQuestion,
          history: historyToSend.length > 0 ? historyToSend : undefined,
          summary: currentSummary ? sanitizeSummary(currentSummary) : undefined,
        }),
        signal: controller.signal,
      });

      if (!isCurrentRequest()) {
        await res.body?.cancel();
        return;
      }

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.limitedBy === 'ip' ? 'SHARED_RATE_LIMIT' : 'RATE_LIMIT');
      }
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        console.error('Chat API error:', res.status, body.detail ?? body.error);
        throw new Error('API 응답 오류');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;
      let lastRenderTime = 0;
      const RENDER_INTERVAL = 30; // ms — 자연스러운 타이핑 속도

      while (true) {
        const { done, value } = await reader.read();
        if (!isCurrentRequest()) {
          await reader.cancel();
          return;
        }
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            completed = true;
            continue;
          }

          let parsed;
          try { parsed = JSON.parse(payload); } catch { continue; }
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.pii_warning) {
            setPiiWarning(parsed.pii_warning);
            continue;
          }
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
      if (!isCurrentRequest()) return;
      fullAnswer = redactPiiText(fullAnswer);
      setAiAnswer(fullAnswer);

      if (!fullAnswer || !completed) throw new Error('Incomplete response');

      const raw: ChatMessage[] = [
        ...currentHistory,
        { role: 'user', content: safeQuestion },
        { role: 'assistant', content: fullAnswer },
      ];
      const trimCount = raw.length - MAX_HISTORY_MESSAGES;
      const newHistory = trimCount > 0 ? raw.slice(trimCount) : raw;

      const latestSummarizedUpTo = summarizedUpToRef.current;
      const newSummarizedUpTo = (trimCount > 0 && latestSummarizedUpTo > 0)
        ? Math.max(0, latestSummarizedUpTo - trimCount)
        : latestSummarizedUpTo;

      if (trimCount > 0 && latestSummarizedUpTo > 0) {
        summarizedUpToRef.current = newSummarizedUpTo;
        setSummarizedUpTo(newSummarizedUpTo);
      }

      chatHistoryRef.current = newHistory;
      setChatHistory(newHistory);
      setPendingQuestion('');
      pendingRawQuestionRef.current = '';

      if (newHistory.length < MAX_HISTORY_MESSAGES && shouldSummarizeChat(newHistory, newSummarizedUpTo) && !summarizingRef.current) {
        triggerSummarize(newHistory);
      }
    } catch (err) {
      if (!isCurrentRequest()) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (fullAnswer) setAiAnswer(redactPiiText(fullAnswer));
      // 실패하면 다시 보낼 수 있게 질문을 입력창에 돌려놓는다.
      if (abortRef.current === controller) {
        userContextRef.current = pendingRawQuestionRef.current;
        setUserContext(pendingRawQuestionRef.current);
        setPendingQuestion('');
        pendingRawQuestionRef.current = '';
      }
      if (err instanceof TypeError) {
        setAiErrorType('network');
      } else if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setAiErrorType('rate-limit');
      } else if (err instanceof Error && err.message === 'SHARED_RATE_LIMIT') {
        setAiErrorType('shared-rate-limit');
      } else {
        setAiErrorType('server');
      }
    } finally {
      // 취소된 이전 요청이 새 요청의 로딩 상태를 해제하지 않게 한다.
      if (abortRef.current === controller) {
        abortRef.current = null;
        setAiLoading(false);
      }
    }
  }, [styleKey, scores, triggerSummarize]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    summarizeAbortRef.current?.abort();
    summarizingRef.current = false;
    chatHistoryRef.current = [];
    chatSummaryRef.current = '';
    summarizedUpToRef.current = 0;
    userContextRef.current = '';
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
    abortRef.current = null;
    setAiLoading(false);
    userContextRef.current = pendingRawQuestionRef.current;
    setUserContext(pendingRawQuestionRef.current);
    setPendingQuestion('');
    pendingRawQuestionRef.current = '';
  }, []);

  return {
    aiLoading, aiAnswer, aiErrorType, piiWarning,
    userContext, setUserContext, pendingQuestion,
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
