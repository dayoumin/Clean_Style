import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(resolve('public/sw.js'), 'utf8');
const image = '/images/adult-integrity/question-ocean/01-turtle-123456789a.webp';

function worker({ storageFails = false, writeFails = false } = {}) {
  const handlers = new Map<string, (event: unknown) => void>();
  const saved = new Map<string, Response>();
  const background: Promise<unknown>[] = [];
  const cache = {
    match: vi.fn(async (request: { url: string }) => saved.get(request.url)?.clone()),
    put: vi.fn(async (request: { url: string }, response: Response) => {
      if (writeFails) throw new Error('quota');
      saved.set(request.url, response);
    }),
  };
  const network = vi.fn(async () => new Response('webp', { status: 200 }));
  const open = vi.fn(async () => {
    if (storageFails) throw new Error('storage unavailable');
    return cache;
  });
  runInNewContext(source, {
    URL,
    self: {
      location: { hostname: 'example.test', origin: 'https://example.test' },
      addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler),
    },
    caches: { open },
    fetch: network,
  });
  return {
    network, cache, background,
    async request(path: string) {
      let response: Promise<Response> | undefined;
      handlers.get('fetch')?.({
        request: { url: path.startsWith('https://') ? path : `https://example.test${path}`, method: 'GET', mode: 'cors' },
        respondWith: (value: Promise<Response>) => { response = value; },
        waitUntil: (value: Promise<unknown>) => { background.push(value); },
      });
      return response;
    },
  };
}

describe('versioned question image cache', () => {
  it('fetches once and serves the next request from storage', async () => {
    const sw = worker();
    expect(await (await sw.request(image))?.text()).toBe('webp');
    expect(await (await sw.request(image))?.text()).toBe('webp');
    expect(sw.network).toHaveBeenCalledTimes(1);
  });

  it('fetches a changed content hash instead of serving an older image', async () => {
    const sw = worker();
    await sw.request(image);
    await sw.request(image.replace('123456789a', 'abcdef1234'));
    expect(sw.network).toHaveBeenCalledTimes(2);
  });

  it.each([{ storageFails: true }, { writeFails: true }])('still displays images when cache storage fails: %j', async options => {
    const sw = worker(options);
    expect((await sw.request(image))?.status).toBe(200);
    expect(sw.network).toHaveBeenCalledTimes(1);
  });

  it('does not cache failed image responses', async () => {
    const sw = worker();
    sw.network.mockResolvedValue(new Response('missing', { status: 404 }));
    await sw.request(image);
    await sw.request(image);
    expect(sw.cache.put).not.toHaveBeenCalled();
    expect(sw.network).toHaveBeenCalledTimes(2);
  });

  it('does not intercept APIs and refreshes mutable images in the background', async () => {
    const sw = worker();
    expect(await sw.request('/api/chat')).toBeUndefined();
    expect(sw.network).not.toHaveBeenCalled();
    const mutable = '/images/adult-integrity/question-ocean/01-turtle.png';
    await sw.request(mutable);
    await sw.request(mutable);
    expect(sw.network).toHaveBeenCalledTimes(2);
  });

  it('returns a stored main image without waiting for a slow refresh', async () => {
    const sw = worker();
    const main = '/images/adult-integrity/home-hero.webp';
    await sw.request(main);
    let finishRefresh: (response: Response) => void = () => {};
    sw.network.mockImplementationOnce(() => new Promise<Response>(resolve => { finishRefresh = resolve; }));
    const cached = await sw.request(main);
    expect(await cached?.text()).toBe('webp');
    finishRefresh(new Response('updated'));
    await Promise.all(sw.background);
  });

  it('does not intercept another origin, including a hostname with a matching prefix', async () => {
    const sw = worker();
    expect(await sw.request(`https://other.test${image}`)).toBeUndefined();
    expect(await sw.request(`https://example.test.evil${image}`)).toBeUndefined();
    expect(sw.network).not.toHaveBeenCalled();
    expect(sw.cache.put).not.toHaveBeenCalled();
  });
});
