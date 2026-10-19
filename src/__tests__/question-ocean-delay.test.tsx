import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { QUESTION_OCEAN_FILES } from '@/products/adult/components/question-ocean-files';

// Retain React hook state while driving actual component effects with a controllable clock.
const hooks = vi.hoisted(() => ({
  slots: [] as { value: unknown; deps?: unknown[]; cleanup?: () => void }[],
  cursor: 0, dirty: false, effects: [] as (() => void)[],
}));
vi.mock('react', () => ({
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
  useEffect(effect: () => void | (() => void), deps: unknown[]) {
    const index = hooks.cursor++;
    const previous = hooks.slots[index];
    if (previous?.deps?.length === deps.length && previous.deps.every((value, i) => Object.is(value, deps[i]))) return;
    hooks.slots[index] = { value: undefined, deps };
    hooks.effects.push(() => { previous?.cleanup?.(); hooks.slots[index].cleanup = effect() || undefined; });
  },
}));
import QuestionOcean from '@/products/adult/components/QuestionOcean';

class PendingImage {
  static instances: PendingImage[] = [];
  src = '';
  onload: (() => Promise<void>) | null = null;
  resolveDecode!: () => void;
  decode = () => new Promise<void>(resolve => { this.resolveDecode = resolve; });
  constructor() { PendingImage.instances.push(this); }
}
type Layer = ReactElement<{ src: string; className: string; onAnimationEnd?: () => void }>;
let questionIndex = 0;
let layers: Layer[] = [];
const source = (index: number) => `/images/adult-integrity/question-ocean/${QUESTION_OCEAN_FILES[index]}`;
function render(index = questionIndex) {
  questionIndex = index;
  do {
    hooks.dirty = false; hooks.cursor = 0;
    const tree = QuestionOcean({ seed: 0, questionIndex, hasNext: questionIndex < 14 });
    layers = tree.props.children;
    hooks.effects.splice(0).forEach(effect => effect());
  } while (hooks.dirty);
}
async function load(index: number) {
  const image = [...PendingImage.instances].reverse().find(item => item.src === source(index) && item.onload)!;
  const decoded = image.onload!(); image.resolveDecode(); await decoded; render();
}
function advance(ms: number) { vi.advanceTimersByTime(ms); render(); }
const visibleSources = () => layers.map(layer => layer.props.src);
function finishFade() { layers.find(layer => layer.props.className.includes('is-incoming'))!.props.onAnimationEnd!(); render(); }

describe('delayed question artwork', () => {
  beforeEach(() => {
    hooks.slots = []; hooks.cursor = 0; hooks.dirty = false; hooks.effects = [];
    PendingImage.instances = []; questionIndex = 0;
    vi.useFakeTimers();
    vi.stubGlobal('window', { setTimeout, clearTimeout });
    vi.stubGlobal('Image', PendingImage);
    render();
  });
  afterEach(() => {
    hooks.slots.forEach(slot => slot.cleanup?.());
    vi.useRealTimers(); vi.unstubAllGlobals();
  });
  it('shows the first scene immediately and waits a full second before crossfading the next', async () => {
    expect(visibleSources()).toEqual([source(0)]);
    render(1); await load(1);
    advance(999); expect(visibleSources()).toEqual([source(0)]);
    advance(1); expect(visibleSources()).toEqual([source(0), source(1)]);
    finishFade(); expect(visibleSources()).toEqual([source(1)]);
  });
  it('skips intermediate scenes and restarts the wait after a rapid answer', async () => {
    render(1); await load(1); advance(600);
    render(2); await load(2); advance(999);
    expect(visibleSources()).toEqual([source(0)]);
    advance(1); expect(visibleSources()).toEqual([source(0), source(2)]);
  });
  it('keeps the old scene if loading exceeds a second and starts once decoding finishes', async () => {
    render(1); advance(1500);
    expect(visibleSources()).toEqual([source(0)]);
    await load(1); expect(visibleSources()).toEqual([source(0), source(1)]);
  });
  it('ignores a cancelled image that finishes decoding after later navigation', async () => {
    render(1);
    const stale = PendingImage.instances.find(image => image.src === source(1) && image.onload)!;
    const decoding = stale.onload!();
    advance(500); render(2); await load(2);
    stale.resolveDecode(); await decoding; advance(999);
    expect(visibleSources()).toEqual([source(0)]);
    advance(1); expect(visibleSources()).toEqual([source(0), source(2)]);
  });
  it('finishes an active fade while retaining the new question’s own quiet interval', async () => {
    render(1); await load(1); advance(1000);
    render(2); await load(2); advance(300); finishFade();
    expect(visibleSources()).toEqual([source(1)]);
    advance(699); expect(visibleSources()).toEqual([source(1)]);
    advance(1); expect(visibleSources()).toEqual([source(1), source(2)]);
  });
  it('cancels pending decoration when the questionnaire is unmounted', async () => {
    render(1); await load(1);
    hooks.slots.forEach(slot => slot.cleanup?.());
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(2000);
    expect(visibleSources()).toEqual([source(0)]);
  });
});
