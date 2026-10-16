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
