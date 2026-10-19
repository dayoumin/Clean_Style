import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRespectChat } from '@/hooks/useRespectChat';
import { createRespectResponse } from '@/diagnostics/workplace-respect/response';
import { getRespectQuestions } from '@/data/workplaceRespectQuestions';
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


const response = createRespectResponse('experience', getRespectQuestions('experience').map(() => 0));
function render() {
  let result: ReturnType<typeof useRespectChat>;
  do { hooks.dirty=false; hooks.cursor=0; result=useRespectChat('experience', response); hooks.effects.splice(0).forEach(effect=>effect()); } while(hooks.dirty);
  return result;
}
function pendingResponse() {
  let resolve!: (response: Response)=>void;
  const promise=new Promise<Response>(yes=>{resolve=yes;});
  return {promise,resolve};
}
function answer(text='답변') { return new Response('data: '+JSON.stringify({token:text})+'\n\ndata: [DONE]\n\n'); }
describe('workplace chat request lifecycle simulations',()=>{
  beforeEach(()=>{ hooks.slots=[]; hooks.cursor=0; hooks.dirty=false; hooks.effects=[]; vi.clearAllMocks(); });
  afterEach(()=>{ hooks.slots.forEach(slot=>slot.cleanup?.()); vi.unstubAllGlobals(); });
  it('keeps a new request active when a cancelled request finishes late',async()=>{
    const first=pendingResponse(),second=pendingResponse();
    vi.stubGlobal('fetch',vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
    let chat=render(); chat.setChatInput('첫 질문'); chat=render();
    const run1=chat.fetchAiChat(); chat=render(); chat.abortAiChat(); chat=render();
    chat.setChatInput('새 질문'); chat=render(); const run2=chat.fetchAiChat(); chat=render();
    first.resolve(answer('이전 답변')); await run1; chat=render();
    expect(chat.chatLoading).toBe(true); expect(chat.chatMessages).toEqual([]); expect(chat.chatErrorType).toBeNull();
    second.resolve(answer('새 답변')); await run2; chat=render();
    expect(chat.chatMessages.map(m=>m.content)).toEqual(['새 질문','새 답변']); expect(chat.chatLoading).toBe(false);
  });
  it('masks outgoing questions and completed replies and rejects duplicate submission',async()=>{
    const pending=pendingResponse(); const request=vi.fn().mockReturnValue(pending.promise); vi.stubGlobal('fetch',request);
    let chat=render(); chat.setChatInput('연락 010-1234-5678'); chat=render();
    const run=chat.fetchAiChat(); await chat.fetchAiChat(); chat=render();
    expect(request).toHaveBeenCalledTimes(1); expect(JSON.parse(request.mock.calls[0][1].body).question).toBe('연락 [전화번호]');
    pending.resolve(answer('메일 test@example.com')); await run; chat=render();
    expect(chat.chatMessages.map(m=>m.content)).toEqual(['연락 [전화번호]','메일 [이메일]']); expect(chat.piiWarning).toEqual(['전화번호','이메일']);
  });
  it.each(['error','disconnect'])('does not show or save a partial answer after %s',async mode=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('data: {"token":"010-1234-5678"}\n\n'+(mode==='error'?'data: {"error":"AI_SERVICE_ERROR"}\n\n':''))));
    let chat=render(); chat.setChatInput('내 질문'); chat=render(); await chat.fetchAiChat(); chat=render();
    expect(chat.streamingAnswer).toBe(''); expect(chat.chatMessages).toEqual([]); expect(chat.chatInput).toBe('내 질문'); expect(chat.chatErrorType).toBe('server');
  });
  it('reset blocks a late response from repopulating deleted chat',async()=>{
    const pending=pendingResponse(); vi.stubGlobal('fetch',vi.fn().mockReturnValue(pending.promise));
    let chat=render(); chat.setChatInput('질문'); chat=render(); const run=chat.fetchAiChat(); chat=render(); chat.resetChat();
    pending.resolve(answer('오래된 답변')); await run; chat=render(); expect(chat.chatMessages).toEqual([]); expect(chat.streamingAnswer).toBe(''); expect(chat.chatInput).toBe('');
  });

  it('continues beyond 16 turns while retaining only the latest 32 messages',async()=>{
    const request=vi.fn().mockImplementation(()=>answer('응답'));vi.stubGlobal('fetch',request);
    let chat=render();
    for(let turn=1;turn<=17;turn++) {chat.setChatInput('질문 '+turn);chat=render();await chat.fetchAiChat();chat=render();}
    expect(request).toHaveBeenCalledTimes(17);expect(chat.chatMessages).toHaveLength(32);
    expect(chat.chatMessages[0].content).toBe('질문 2');expect(chat.chatMessages.at(-2)?.content).toBe('질문 17');
  });
});
