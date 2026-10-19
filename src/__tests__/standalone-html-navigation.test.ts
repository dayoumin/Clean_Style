import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import * as model from '@/products/adult/standalone/model';

const source = readFileSync(path.resolve('src/products/adult/standalone/app.js'), 'utf8');

// Execute the actual standalone entry. This small DOM substitute covers the
// storage/navigation lifecycle; it does not claim to verify browser rendering.
class ElementStub {
  children: ElementStub[] = [];
  className = '';
  textContent = '';
  listeners = new Map<string, () => void>();
  content = { cloneNode: () => new ElementStub('fragment') };

  constructor(public tag: string) {}
  append(...children: ElementStub[]) { this.children.push(...children); }
  replaceChildren(...children: ElementStub[]) { this.children = children; }
  setAttribute() {}
  focus() {}
  addEventListener(name: string, action: () => void) { this.listeners.set(name, action); }
  querySelector(selector: string): ElementStub | null {
    for (const child of this.children) {
      if (selector.startsWith('.') ? child.className.split(' ').includes(selector.slice(1)) : child.tag === selector) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
}

function navigationHarness() {
  const entry: model.SavedResult = {
    id: 'saved-result', createdAt: '2026-10-16T00:00:00Z', name: '기록 주인',
    instrumentVersion: model.INSTRUMENT_VERSION, scoringVersion: model.SCORING_VERSION,
    answers: model.questions.map(() => 0),
  };
  const values = new Map([[model.HISTORY_KEY, JSON.stringify([entry])]]);
  let denyWrites = false;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (denyWrites) throw new Error('QuotaExceededError');
      values.set(key, value);
    },
  };
  const app = new ElementStub('main');
  const notice = new ElementStub('p');
  const data = new ElementStub('script');
  const imagePaths = [
    '/images/integrity-home-title-smile.png', ...Object.values(model.adultCommonArtwork),
    model.getAdultResultArtwork(model.calculateResult(entry.answers).styleKey),
  ];
  data.textContent = JSON.stringify({
    assets: Object.fromEntries(imagePaths.map(imagePath => [imagePath, 'data:image/png;base64,fixture'])),
    metadata: { brandMarkup: '', icons: {}, sceneFiles: [] },
  });
  const listeners = new Map<string, (event: { state: unknown }) => void>();
  const context = vm.createContext({
    require(name: string) {
      if (name !== './model') throw new Error(`Unexpected dependency: ${name}`);
      return model;
    },
    document: {
      getElementById: (id: string) => ({ app, notice, 'standalone-data': data })[id as 'app' | 'notice' | 'standalone-data'] ?? null,
      createElement: (tag: string) => new ElementStub(tag),
      createElementNS: (_namespace: string, tag: string) => new ElementStub(tag),
    },
    window: {
      localStorage: storage,
      history: { replaceState: vi.fn(), pushState: vi.fn() },
      scrollTo: vi.fn(),
      addEventListener: (name: string, listener: (event: { state: unknown }) => void) => listeners.set(name, listener),
    },
    URL: { revokeObjectURL: vi.fn() },
    requestAnimationFrame: vi.fn(), setTimeout: vi.fn(), clearTimeout: vi.fn(),
  });
  vm.runInContext(source, context);
  // Start from a previously viewed result, then revisit its saved-history row.
  vm.runInContext('currentResult = readHistory(storage)[0]; result(); home(); history();', context);
  return {
    app, notice, storage,
    denyDeletion: () => { denyWrites = true; },
    deleteEntry: () => app.querySelector('.delete')!.listeners.get('click')!(),
    snapshot: () => vm.runInContext('({ route: renderedRoute, currentResult, cached: resultCache.has("saved-result") })', context),
    backToResult: () => listeners.get('popstate')!({ state: { route: 'result', resultId: entry.id, answers: [], seed: 0 } }),
  };
}

describe('standalone HTML history deletion and browser navigation', () => {
  it('removes a deleted result from storage and memory before revisiting its browser-history entry', () => {
    const harness = navigationHarness();
    harness.deleteEntry();

    expect(model.readHistory(harness.storage)).toEqual([]);
    expect(harness.snapshot()).toMatchObject({ currentResult: null, cached: false });
    harness.backToResult();
    expect(harness.snapshot()).toMatchObject({ route: 'home', currentResult: null, cached: false });
  });

  it('keeps a result available when persistent deletion fails', () => {
    const harness = navigationHarness();
    harness.denyDeletion();
    harness.deleteEntry();

    expect(model.readHistory(harness.storage)).toHaveLength(1);
    expect(harness.notice.textContent).toContain('기록을 삭제하지 못했어요');
    expect(harness.app.querySelector('.delete')).not.toBeNull();
    expect(harness.snapshot()).toMatchObject({ currentResult: { id: 'saved-result' }, cached: true });
    harness.backToResult();
    expect(harness.snapshot()).toMatchObject({ route: 'result', currentResult: { id: 'saved-result' }, cached: true });
  });
});
