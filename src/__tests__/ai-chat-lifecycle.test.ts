import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAiChat } from '@/hooks/useAiChat';
import { getHistoryEntry, updateChat } from '@/lib/history';

// Callback unit tests: retain state/ref slots and flush effects between actions.
// Browser focus and DOM behavior are verified separately.
const hooks = vi.hoisted(() => ({
  slots: [] as { value: unknown; deps?: unknown[]; cleanup?: () => void }[],
  cursor: 0, dirty: false, effects: [] as (() => void)[],
}));
vi.mock('react', () => {
  const same = (a?: unknown[], b?: unknown[]) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  return {
    useState(initial: unknown) {
      const i = hooks.cursor++;
      hooks.slots[i] ??= { value: initial };
      return [hooks.slots[i].value, (next: unknown) => {
        const value = typeof next === 'function' ? next(hooks.slots[i].value) : next;
        if (!Object.is(value, hooks.slots[i].value)) hooks.dirty = true;
        hooks.slots[i].value = value;
      }];
    },
    useRef(initial: unknown) {
      const i = hooks.cursor++;
      hooks.slots[i] ??= { value: { current: initial } };
      return hooks.slots[i].value;
    },
    useCallback(callback: unknown, deps: unknown[]) {
      const i = hooks.cursor++;
      if (!same(hooks.slots[i]?.deps, deps)) hooks.slots[i] = { value: callback, deps };
      return hooks.slots[i].value;
    },
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {
      const i = hooks.cursor++;
      if (same(hooks.slots[i]?.deps, deps)) return;
      const cleanup = hooks.slots[i]?.cleanup;
      hooks.slots[i] = { value: undefined, deps };
      hooks.effects.push(() => {
        cleanup?.();
        hooks.slots[i].cleanup = effect() || undefined;
      });
    },
  };
});
vi.mock('@/lib/history', () => ({ getHistoryEntry: vi.fn(), updateChat: vi.fn(), clearChat: vi.fn() }));
vi.mock('@/lib/client-id', () => ({ getClientIdHeader: () => ({}) }));

const options = { styleKey: 'principle-transparent-independent', historyId: 'saved', scores: { principle: 0, transparency: 0, independence: 0 } };
function render() {
  let result: ReturnType<typeof useAiChat>;
  do {
    hooks.dirty = false;
    hooks.cursor = 0;
    result = useAiChat(options);
    hooks.effects.splice(0).forEach(effect => effect());
  } while (hooks.dirty);
  return result;
}
function pendingResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function answer(text = '답변') {
  return new Response(`data: ${JSON.stringify({ token: text })}\n\ndata: [DONE]\n\n`);
}

describe('adult AI chat cancellation and privacy', () => {
  beforeEach(() => {
    hooks.slots = []; hooks.cursor = 0; hooks.dirty = false; hooks.effects = [];
    vi.useFakeTimers(); vi.clearAllMocks();
    vi.mocked(getHistoryEntry).mockReturnValue(undefined);
  });
  afterEach(() => {
    hooks.slots.forEach(slot => slot.cleanup?.());
    vi.useRealTimers(); vi.unstubAllGlobals();
  });

  it.each([true, false])('keeps the selected result when summarization succeeds=%s', async succeeds => {
    const saved = Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: '기관 기준 확인 중입니다. '.repeat(100) }));
    vi.mocked(getHistoryEntry).mockReturnValue({ chat: saved } as ReturnType<typeof getHistoryEntry>);
    const request = vi.fn(async (url: string, _init?: RequestInit) => url === '/api/summarize'
      ? { ok: succeeds, json: async () => ({ summary: '기관 장비의 승인 여부는 모른다고 했고 확인 절차를 안내했습니다.' }) }
      : answer('담당자에게 확인하세요.'));
    vi.stubGlobal('fetch', request);
    let chat = render();
    await vi.runAllTimersAsync(); chat = render();
    expect(request.mock.calls.some(call => call[0] === '/api/summarize')).toBe(true);
    chat.setUserContext('지금 남은 확인 사항은요?'); chat = render();
    await chat.fetchAnswer(); chat = render();
    const sent = JSON.parse(String(request.mock.calls.find(call => call[0] === '/api/chat')?.[1]?.body));
    expect(sent.styleKey).toBe(options.styleKey);
    expect(sent.scores).toEqual(options.scores);
    expect(sent.summary.length).toBeGreaterThan(0);
    expect(chat.aiErrorType).toBeNull();
  });

  it('keeps the new request loading when an aborted previous request rejects late', async () => {
    const first = pendingResponse(), second = pendingResponse();
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
    let chat = render();
    chat.setUserContext('첫 질문'); chat = render();
    const firstRun = chat.fetchAnswer(); chat = render();
    chat.abortAnswer(); chat = render();
    const secondRun = chat.fetchAnswer(); chat = render();
    first.reject(new DOMException('aborted', 'AbortError'));
    await firstRun; chat = render();
    expect(chat.aiLoading).toBe(true);
    expect(chat.pendingQuestion).toBe('첫 질문');
    expect(chat.aiErrorType).toBeNull();
    second.resolve(answer()); await secondRun; chat = render();
    expect(chat.aiLoading).toBe(false);
    expect(chat.chatHistory.map(m => m.content)).toEqual(['첫 질문', '답변']);
  });

  it('ignores a late successful response after conversation deletion', async () => {
    const response = pendingResponse();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(response.promise));
    let chat = render(); chat.setUserContext('삭제할 질문'); chat = render();
    const run = chat.fetchAnswer(); chat = render();
    chat.deleteChat(); chat = render();
    response.resolve(answer('이전 답변')); await run; chat = render();
    expect(chat.chatHistory).toEqual([]);
    expect(chat.aiAnswer).toBe('');
    expect(chat.userContext).toBe('');
  });

  it('masks saved history and outgoing questions; restores raw draft on failure', async () => {
    vi.mocked(getHistoryEntry).mockReturnValue({ chat: [{ role: 'user', content: 'old@example.com' }] } as ReturnType<typeof getHistoryEntry>);
    const request = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', request);
    let chat = render();
    expect(chat.chatHistory[0].content).toBe('[이메일]');
    expect(updateChat).toHaveBeenCalledWith('saved', [{ role: 'user', content: '[이메일]' }]);
    chat.setUserContext('연락 010-1234-5678'); chat = render();
    await chat.fetchAnswer(); chat = render();
    const sent = JSON.parse(request.mock.calls[0][1].body);
    expect(sent.userContext).toBe('연락 [전화번호]');
    expect(JSON.stringify(sent)).not.toContain('old@example.com');
    expect(chat.userContext).toBe('연락 010-1234-5678');
    expect(chat.pendingQuestion).toBe('');
    expect(chat.aiErrorType).toBe('network');
  });

  it('masks PII split by injection markers before sending and saving', async () => {
    vi.mocked(getHistoryEntry).mockReturnValue({ chat: [{ role: 'user', content: '010-1234-```5678' }, { role: 'assistant', content: '네' }] } as ReturnType<typeof getHistoryEntry>);
    const request = vi.fn().mockResolvedValue(answer('확인'));
    vi.stubGlobal('fetch', request);
    let chat = render();
    expect(chat.chatHistory[0].content).toBe('[전화번호]');
    chat.setUserContext('메일 kim@exam```ple.com'); chat = render();
    await chat.fetchAnswer(); chat = render();
    const sent = JSON.parse(request.mock.calls[0][1].body);
    expect(sent.userContext).toBe('메일 [이메일]');
    expect(JSON.stringify(sent)).not.toContain('5678');
    expect(chat.chatHistory.map(m => m.content)).toEqual(['[전화번호]', '네', '메일 [이메일]', '확인']);
  });

  it('folds messages trimmed out of the summarize request into the summary instead of dropping them', async () => {
    const saved = [
      { role: 'user', content: '오래된-첫메시지 입니다.' },
      ...Array.from({ length: 9 }, (_, index) => ({ role: index % 2 ? 'user' : 'assistant', content: '가'.repeat(2000) })),
    ];
    vi.mocked(getHistoryEntry).mockReturnValue({ chat: saved } as ReturnType<typeof getHistoryEntry>);
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ summary: '요약' })));
    vi.stubGlobal('fetch', request);
    render();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe('/api/summarize');
    const sent = JSON.parse(request.mock.calls[0][1].body);
    expect(sent.history).toHaveLength(6);
    expect(JSON.stringify(sent.history)).not.toContain('오래된-첫메시지');
    expect(sent.summary).toContain('사용자: 오래된-첫메시지 입니다.');
  });

  it('does not store an answer when the connection ends without a completion event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('data: {"token":"중간 답변"}\n\n')));
    let chat = render(); chat.setUserContext('질문'); chat = render();
    await chat.fetchAnswer(); chat = render();
    expect(chat.chatHistory).toEqual([]);
    expect(chat.userContext).toBe('질문');
    expect(chat.aiErrorType).toBe('server');
    expect(chat.aiAnswer).toBe('');
  });

  it('holds split private output until completion and saves only its masked form', async () => {
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(c) { streamController=c; } });
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(stream)));
    let chat=render(); chat.setUserContext('질문'); chat=render(); const run=chat.fetchAnswer();
    streamController.enqueue(new TextEncoder().encode('data: {"token":"연락 010-12"}\n\n'));
    await Promise.resolve(); await Promise.resolve(); chat=render();
    expect(chat.aiAnswer).toBe(''); expect(chat.chatHistory).toEqual([]);
    streamController.enqueue(new TextEncoder().encode('data: {"token":"34-5678"}\n\ndata: [DONE]\n\n')); streamController.close();
    await run; chat=render();
    expect(chat.aiAnswer).toBe('연락 [전화번호]'); expect(chat.chatHistory.at(-1)?.content).toBe('연락 [전화번호]'); expect(chat.piiWarning).toContain('전화번호');
  });
});
