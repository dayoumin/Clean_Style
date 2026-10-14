import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/og/route';

const context = vi.hoisted(() => vi.fn());
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: context }));
vi.mock('next/og', () => ({
  ImageResponse: class extends Response {
    constructor(element: ReactElement, options?: ResponseInit) {
      super(renderToStaticMarkup(createElement('div', null, element)), options);
    }
  },
}));

describe('OG artwork asset binding', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

  it('uses ASSETS PNG data without fetching the Worker URL', async () => {
    const assetFetch = vi.fn(async (_request: Request) => new Response(Uint8Array.of(1, 2, 3)));
    context.mockResolvedValue({ env: { ASSETS: { fetch: assetFetch } } });
    const res = await GET(new NextRequest('https://example.test/api/og?style=flexible-transparent-independent'));
    expect(assetFetch).toHaveBeenCalledOnce();
    const req = assetFetch.mock.calls[0][0];
    expect(req.url).toBe('https://example.test/images/adult-integrity/flexible-transparent-independent.png');
    expect(await res.text()).toContain('data:image/png;base64,AQID');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps the result fallback if ASSETS fails without calling the Worker again', async () => {
    context.mockResolvedValue({ env: { ASSETS: { fetch: vi.fn().mockRejectedValue(new Error('asset failed')) } } });
    const res = await GET(new NextRequest('https://example.test/api/og?style=flexible-transparent-independent'));
    const html = await res.text();
    expect(html).toContain('실용주의 개척자');
    expect(html).not.toContain('data:image/png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reads current Next dev public assets rather than an old Cloudflare build', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.mocked(fetch).mockResolvedValue(new Response(Uint8Array.of(1, 2, 3)));
    const res = await GET(new NextRequest('http://localhost/api/og?style=flexible-transparent-independent'));
    expect(await res.text()).toContain('data:image/png;base64,AQID');
    expect(context).not.toHaveBeenCalled();
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400');
  });
});
