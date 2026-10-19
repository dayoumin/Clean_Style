import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRespectQuestions } from '@/data/workplaceRespectQuestions';

// Exercise the component's real handlers/effects with retained hook state and fake DOM refs.
// This verifies the scroll/focus contract, not browser layout or screen-reader output.
const hooks = vi.hoisted(() => ({
  slots: [] as { value: unknown; deps?: unknown[]; cleanup?: () => void }[],
  cursor: 0, dirty: false, effects: [] as (() => void)[],
}));
vi.mock('react', () => {
  const same = (a?: unknown[], b?: unknown[]) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  return {
    useState(initial: unknown) {
      const index = hooks.cursor++;
      hooks.slots[index] ??= { value: initial };
      return [hooks.slots[index].value, (next: unknown) => {
        const value = typeof next === 'function' ? next(hooks.slots[index].value) : next;
        if (!Object.is(value, hooks.slots[index].value)) hooks.dirty = true;
        hooks.slots[index].value = value;
      }];
    },
    useRef(initial: unknown) {
      const index = hooks.cursor++;
      hooks.slots[index] ??= { value: { current: initial } };
      return hooks.slots[index].value;
    },
    useCallback(callback: unknown, deps: unknown[]) {
      const index = hooks.cursor++;
      if (!same(hooks.slots[index]?.deps, deps)) hooks.slots[index] = { value: callback, deps };
      return hooks.slots[index].value;
    },
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {
      const index = hooks.cursor++;
      if (same(hooks.slots[index]?.deps, deps)) return;
      const cleanup = hooks.slots[index]?.cleanup;
      hooks.slots[index] = { value: undefined, deps };
      hooks.effects.push(() => {
        cleanup?.();
        hooks.slots[index].cleanup = effect() || undefined;
      });
    },
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
import RespectCheckClient from '@/app/(public)/respect/check/RespectCheckClient';

interface ElementNode {
  type: unknown;
  props: { children?: unknown; ref?: { current: unknown }; onClick?: () => void };
}
function elements(value: unknown): ElementNode[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const node = value as ElementNode;
  return [node, ...elements(node.props.children)];
}
function textContent(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (!value || typeof value !== 'object' || !('props' in value)) return '';
  return textContent((value as ElementNode).props.children);
}

let activeHeading = '';
const focus = vi.fn((label: string, _options: unknown) => { activeHeading = label; });
const main = { scrollTo: vi.fn() };
const scroller = {
  scrollTop: 0,
  scrollTo: vi.fn(({ top }: { top: number }) => { scroller.scrollTop = top; }),
};
let mountedRefs: { current: unknown }[] = [];
let tree: unknown;

function render() {
  do {
    hooks.dirty = false;
    hooks.cursor = 0;
    tree = RespectCheckClient({ entry: 'action' });
    mountedRefs.forEach(ref => { ref.current = null; });
    mountedRefs = [];
    for (const node of elements(tree)) {
      if (!node.props.ref) continue;
      mountedRefs.push(node.props.ref);
      node.props.ref.current = node === tree ? scroller : {
        focus: (options: unknown) => focus(textContent(node.props.children), options),
        closest: () => main,
      };
    }
    hooks.effects.splice(0).forEach(effect => effect());
  } while (hooks.dirty);
}
function click(label: string) {
  const button = elements(tree).find(node => node.type === 'button' && textContent(node.props.children).endsWith(label));
  expect(button, `button ending with ${label}`).toBeDefined();
  button!.props.onClick!();
  render();
}
function expectHeadingVisible(label: string) {
  expect(activeHeading).toBe(label);
  expect(focus).toHaveBeenLastCalledWith(label, { preventScroll: true });
  expect(scroller.scrollTop).toBe(0);
}

describe('respect check navigation scroll and focus', () => {
  beforeEach(() => {
    hooks.slots = []; hooks.cursor = 0; hooks.dirty = false; hooks.effects = [];
    mountedRefs = []; activeHeading = ''; scroller.scrollTop = 0;
    vi.clearAllMocks();
    vi.stubGlobal('window', { scrollTo: vi.fn() });
    vi.stubGlobal('sessionStorage', { removeItem: vi.fn(), setItem: vi.fn() });
    render();
  });
  afterEach(() => {
    hooks.slots.forEach(slot => slot.cleanup?.());
    vi.unstubAllGlobals();
  });

  it('reveals the next question after choosing a lower answer control', () => {
    click('아니다');
    scroller.scrollTop = 400;
    click('답변하지 않고 건너뛰기');
    expectHeadingVisible(getRespectQuestions('action')[2].prompt);
  });

  it('reveals help and then the next question when continuing', () => {
    scroller.scrollTop = 400;
    click('안전한지 확신하기 어렵다');
    expectHeadingVisible('지금은 사람의 도움을 먼저 확인하세요');
    scroller.scrollTop = 400;
    click('점검 계속');
    expectHeadingVisible(getRespectQuestions('action')[1].prompt);
  });

  it('reveals the same safety question when returning from help', () => {
    click('안전한지 확신하기 어렵다');
    scroller.scrollTop = 400;
    click('이전');
    expectHeadingVisible(getRespectQuestions('action')[0].prompt);
  });
});
