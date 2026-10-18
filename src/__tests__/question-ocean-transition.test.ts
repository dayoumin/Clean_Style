import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareOceanImage } from '@/products/adult/components/prepare-ocean-image';

class PendingImage {
  static instances: PendingImage[] = [];
  onload: (() => Promise<void>) | null = null;
  src = '';
  decoding = '';
  resolveDecode!: () => void;
  rejectDecode!: () => void;
  decode = vi.fn(() => new Promise<void>((resolve, reject) => {
    this.resolveDecode = resolve;
    this.rejectDecode = reject;
  }));
  constructor() { PendingImage.instances.push(this); }
}

describe('ocean replacement readiness', () => {
  beforeEach(() => { PendingImage.instances = []; vi.stubGlobal('Image', PendingImage); });
  afterEach(() => vi.unstubAllGlobals());
  it('keeps the old scene while loading and decoding the new image', async () => {
    const ready = vi.fn();
    prepareOceanImage('/next.webp', ready);
    const image = PendingImage.instances[0];
    expect(image.src).toBe('/next.webp');
    expect(ready).not.toHaveBeenCalled();
    const loaded = image.onload!();
    expect(ready).not.toHaveBeenCalled();
    image.resolveDecode(); await loaded;
    expect(ready).toHaveBeenCalledOnce();
  });
  it('ignores a superseded image whose decoding finishes late', async () => {
    const staleReady = vi.fn(), latestReady = vi.fn();
    const cancel = prepareOceanImage('/old-request.webp', staleReady);
    const stale = PendingImage.instances[0];
    const staleLoaded = stale.onload!();
    cancel();
    prepareOceanImage('/latest.webp', latestReady);
    const latest = PendingImage.instances[1];
    const latestLoaded = latest.onload!(); latest.resolveDecode(); await latestLoaded;
    stale.resolveDecode(); await staleLoaded;
    expect(staleReady).not.toHaveBeenCalled();
    expect(latestReady).toHaveBeenCalledOnce();
  });
  it('does not replace the visible image when the replacement fails to decode', async () => {
    const ready = vi.fn();
    prepareOceanImage('/broken.webp', ready);
    const image = PendingImage.instances[0];
    const loaded = image.onload!(); image.rejectDecode(); await loaded;
    expect(ready).not.toHaveBeenCalled();
  });
  it('removes the load callback when unmounted before the file arrives', () => {
    const cancel = prepareOceanImage('/pending.webp', vi.fn());
    cancel();
    expect(PendingImage.instances[0].onload).toBeNull();
  });
});

describe('ocean replacement minimum hold', () => {
  beforeEach(() => {
    PendingImage.instances = [];
    vi.stubGlobal('Image', PendingImage);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps a decoded replacement hidden for the full 500ms', async () => {
    const ready = vi.fn();
    prepareOceanImage('/next.webp', ready, 500);
    const image = PendingImage.instances[0];
    const loaded = image.onload!();
    image.resolveDecode();
    await loaded;
    expect(ready).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(ready).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(ready).toHaveBeenCalledOnce();
  });

  it('loads in parallel with the hold instead of adding another delay after decoding', async () => {
    const ready = vi.fn();
    prepareOceanImage('/slow.webp', ready, 500);
    vi.advanceTimersByTime(800);
    expect(ready).not.toHaveBeenCalled();
    const image = PendingImage.instances[0];
    const loaded = image.onload!();
    image.resolveDecode();
    await loaded;
    expect(ready).toHaveBeenCalledOnce();
  });

  it('cancels a decoded replacement during the hold', async () => {
    const ready = vi.fn();
    const cancel = prepareOceanImage('/cancelled.webp', ready, 500);
    const image = PendingImage.instances[0];
    const loaded = image.onload!();
    image.resolveDecode();
    await loaded;
    vi.advanceTimersByTime(300);
    cancel();
    vi.advanceTimersByTime(1000);
    expect(ready).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores late decoding after a new scene supersedes the old request', async () => {
    const staleReady = vi.fn();
    const latestReady = vi.fn();
    const cancel = prepareOceanImage('/stale.webp', staleReady, 500);
    const stale = PendingImage.instances[0];
    const staleLoaded = stale.onload!();
    vi.advanceTimersByTime(300);
    cancel();
    prepareOceanImage('/latest.webp', latestReady, 500);
    const latest = PendingImage.instances[1];
    const latestLoaded = latest.onload!();
    latest.resolveDecode();
    await latestLoaded;
    stale.resolveDecode();
    await staleLoaded;
    vi.advanceTimersByTime(499);
    expect(staleReady).not.toHaveBeenCalled();
    expect(latestReady).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(latestReady).toHaveBeenCalledOnce();
  });
});
