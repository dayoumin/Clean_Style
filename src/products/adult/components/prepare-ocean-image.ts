/** Keep the displayed scene until its replacement has loaded and decoded. */
export function prepareOceanImage(source: string, onReady: () => void): () => void {
  let active = true;
  const image = new Image();
  image.decoding = 'async';
  image.onload = async () => {
    try {
      if (image.decode) await image.decode();
      if (active) onReady();
    } catch {
      // A failed replacement must not clear the visible scene.
    }
  };
  image.src = source;
  return () => {
    active = false;
    image.onload = null;
  };
}
