import { afterEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AiAdviceSheet from '@/components/AiAdviceSheet';
import { sanitizeHistory, sanitizeSummary } from '@/lib/sanitize';
import { MAX_CONTENT_LENGTH } from '@/lib/constants';

vi.mock('react', async (load) => ({
  ...await load<typeof import('react')>(),
  useState: (initial: unknown) => [initial, vi.fn()],
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: vi.fn(),
  useId: () => "test-confirmation-id",
}));
vi.mock('@/components/BottomSheet', () => ({ default: ({children}: {children: ReactNode}) => children }));
afterEach(() => vi.restoreAllMocks());
type Element = ReactElement<Record<string, unknown>>;
function descendants(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...descendants(node.props.children as ReactNode)];
}
function props(extra: Partial<Parameters<typeof AiAdviceSheet>[0]> = {}) {
  return {loading:false,messages:[],inputValue:'질문',onInputChange:vi.fn(),onSubmit:vi.fn(),onAbort:vi.fn(),onClose:vi.fn(),inputRef:{current:null},scrollAnchorRef:{current:null},placeholder:'질문',...extra};
}
describe('retained PR #2 behavior fixes', () => {
  it.each([{keyCode:229,isComposing:false,shiftKey:false},{keyCode:13,isComposing:true,shiftKey:false},{keyCode:13,isComposing:false,shiftKey:true}])('does not send an IME or multiline Enter: %j', data => {
    const input=props();
    const textarea=descendants(AiAdviceSheet(input)).find(node=>node.type==='textarea')!;
    const preventDefault=vi.fn();
    (textarea.props.onKeyDown as (event:unknown)=>void)({key:'Enter',keyCode:data.keyCode,shiftKey:data.shiftKey,nativeEvent:{isComposing:data.isComposing},preventDefault});
    expect(input.onSubmit).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
  it('sends a normal Enter exactly once', () => {
    const input=props();
    const textarea=descendants(AiAdviceSheet(input)).find(node=>node.type==='textarea')!;
    const preventDefault=vi.fn();
    (textarea.props.onKeyDown as (event:unknown)=>void)({key:'Enter',keyCode:13,shiftKey:false,nativeEvent:{isComposing:false},preventDefault});
    expect(input.onSubmit).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
  it('cancels the native click before abort replaces the stop control', () => {
    const order:string[]=[];
    const input=props({loading:true,onAbort:()=>order.push('abort')});
    const button=descendants(AiAdviceSheet(input)).find(node=>node.type==='button' && node.props.children==='중단')!;
    (button.props.onClick as (event:unknown)=>void)({preventDefault:()=>order.push('prevent')});
    expect(order).toEqual(['prevent','abort']);
    expect(input.onSubmit).not.toHaveBeenCalled();
  });
  it('keeps the privacy warning visible at the conversation cap', () => {
    const html=renderToStaticMarkup(AiAdviceSheet(props({messages:[{role:'user',content:'질문'},{role:'assistant',content:'답변'}],maxTurns:1,piiWarning:['이메일']})));
    expect(html).toContain('개인정보(이메일)가 감지되어 자동으로 가려졌습니다.');
    expect(html).toContain('새 대화 시작');
    expect(html).not.toContain('<textarea');
  });
});
describe('bounded private-data scans', () => {
  it('handles a 64KB regex stress input without scanning the entire payload', () => {
    const text='a.'.repeat(32000), start=performance.now();
    expect(sanitizeHistory([{role:'user',content:text}])[0].content.length).toBeLessThanOrEqual(MAX_CONTENT_LENGTH);
    expect(sanitizeSummary(text).length).toBeLessThanOrEqual(MAX_CONTENT_LENGTH);
    expect(performance.now()-start).toBeLessThan(2000);
  });
  it.each(['010-1234-5678','kim@example.com','900101-1234567'])('masks a value crossing the output boundary: %s', privateText => {
    const input='가'.repeat(MAX_CONTENT_LENGTH-4)+privateText+'나'.repeat(500);
    for (const output of [sanitizeHistory([{role:'user',content:input}])[0].content,sanitizeSummary(input)]) {
      expect(output).not.toContain(privateText.slice(0,4));
      expect(output.length).toBeLessThanOrEqual(MAX_CONTENT_LENGTH);
    }
  });
  it('discards a partial private value at the scan cutoff', () => {
    const input='가'.repeat(MAX_CONTENT_LENGTH+254)+'kim@example.com';
    for (const output of [sanitizeHistory([{role:'user',content:input}])[0].content,sanitizeSummary(input)]) expect(output).not.toContain('ki');
  });
});
