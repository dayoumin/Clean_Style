'use client';

import { useEffect, useRef, useState } from 'react';

/** Decorative illustration; its adjacent heading provides the meaning. */
export default function AdultArtwork({
  src,
  fallback = '',
  className = '',
  eager = false,
}: {
  src: string;
  fallback?: string;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A failed SSR image may finish before React attaches its error listener.
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailedSrc(src);
  }, [src]);
  if (failedSrc === src) {
    return <span aria-hidden="true" className={`adult-artwork-fallback ${className}`}>{fallback}</span>;
  }
  return (
    <img
      ref={imageRef}
      src={src}
      alt=""
      aria-hidden="true"
      width={640}
      height={640}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={`adult-artwork ${className}`}
      onError={() => setFailedSrc(src)}
    />
  );
}
