/** Prepare the replacement and its minimum hold time in parallel. */
export function prepareOceanImage(source: string, onReady: () => void, minimumDelayMs = 0): () => void {
  let active = true;
  let decoded = false;
  let delayElapsed = minimumDelayMs <= 0;
  const notifyReady = () => {
    if (active && decoded && delayElapsed) onReady();
  };
  const holdTimeout = minimumDelayMs > 0 ? setTimeout(() => {
    delayElapsed = true;
    notifyReady();
  }, minimumDelayMs) : undefined;
  const image = new Image();
  image.decoding = 'async';
  image.onload = async () => {
    try {
      if (image.decode) await image.decode();
      decoded = true;
      notifyReady();
    } catch {
      // A failed replacement must not clear the visible scene.
    }
  };
  image.src = source;
  return () => {
    active = false;
    if (holdTimeout !== undefined) clearTimeout(holdTimeout);
    image.onload = null;
  };
}
