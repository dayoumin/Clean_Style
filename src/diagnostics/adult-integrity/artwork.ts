/** Presentation assets only. Keys follow the adult instrument's stable style IDs. */
export const adultResultArtwork = {
  'principle-transparent-independent': '/images/adult-integrity/principle-transparent-independent.webp',
  'principle-transparent-cooperative': '/images/adult-integrity/principle-transparent-cooperative.webp',
  'principle-cautious-independent': '/images/adult-integrity/principle-cautious-independent.webp',
  'principle-cautious-cooperative': '/images/adult-integrity/principle-cautious-cooperative.webp',
  'flexible-transparent-independent': '/images/adult-integrity/flexible-transparent-independent.webp',
  'flexible-transparent-cooperative': '/images/adult-integrity/flexible-transparent-cooperative.webp',
  'flexible-cautious-independent': '/images/adult-integrity/flexible-cautious-independent.webp',
  'flexible-cautious-cooperative': '/images/adult-integrity/flexible-cautious-cooperative.webp',
} as const;

export type AdultStyleKey = keyof typeof adultResultArtwork;

export function getAdultResultArtwork(styleKey: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(adultResultArtwork, styleKey)
    ? adultResultArtwork[styleKey as AdultStyleKey]
    : undefined;
}

export const adultCommonArtwork = {
  home: '/images/adult-integrity/home-hero.webp',
  pause: '/images/adult-integrity/neutral-pause.webp',
} as const;
