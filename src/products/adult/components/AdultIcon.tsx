import type { ReactNode } from 'react';

export type AdultIconName = 'document' | 'clock' | 'heart' | 'spark' | 'research' | 'handshake' | 'chat' | 'shield' | 'scales' | 'mountain' | 'rocket' | 'compass' | 'target' | 'dove' | 'arrow' | 'back' | 'share' | 'close' | 'person-check' | 'people-heart';

const paths: Record<AdultIconName, ReactNode> = {
  document: <><path d="M14 3H6v18h12V7z" /><path d="M14 3v5h4M9 12h6M9 16h6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  heart: <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 1 10 8 15 7-5 13-10 8-15Z" />,
  spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />,
  research: <><path d="m10 3 5 3-4 7-5-3zM5 19h14M13 12c5 0 6 7 0 7M7 12v3H4" /><path d="m9 5 3 2" /></>,
  handshake: <><path d="m3 8 4-3 5 1 5-1 4 3-3 8-5 4-5-3-5-5z" /><path d="m7 8 5-2-3 5 3 2 3-3 4 4M8 15l3 2M11 13l4 4" /></>,
  chat: <><path d="M21 12a8 8 0 0 1-8 8H4l1-5a8 8 0 1 1 16-3Z" /><path d="M8 11h8M8 14h5" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6z" /><path d="m8 12 3 3 5-6" /></>,
  scales: <><path d="M12 3v18M7 21h10M4 7h16M6 7l-4 8h8zm12 0-4 8h8z" /></>,
  mountain: <><path d="m2 20 7-15 5 10 3-7 5 12zM7 10l2 2 2-2" /></>,
  rocket: <><path d="M9 16C7 8 11 4 16 2c2 5 0 11-6 14zM9 9 4 12v6l5-2M14 14l-2 6H6" /><circle cx="13" cy="8" r="1.5" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-3 6-5 2 3-6z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  dove: <><path d="M3 15c5 5 14 5 17-1 3-5-1-9-4-7l-3 3-7-4 3 7zM20 9l2 1-3 1M10 15l5-2" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m9 10 6-4m-6 8 6 4" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  'person-check': <><circle cx="9" cy="6" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2zM17 12l2 2 3-4" /></>,
  'people-heart': <><circle cx="6" cy="13" r="2.5" /><circle cx="18" cy="13" r="2.5" /><path d="M1.5 22v-1a4.5 4.5 0 0 1 9 0v1zM13.5 22v-1a4.5 4.5 0 0 1 9 0v1zM12 8l-3-3a2 2 0 0 1 3-2 2 2 0 0 1 3 2z" /></>,
};

export function AdultIcon({ name, size = 20, className = '' }: { name: AdultIconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>{paths[name]}</svg>;
}

const resultIcons: Record<string, AdultIconName> = {
  'principle-transparent-independent': 'shield',
  'principle-transparent-cooperative': 'scales',
  'principle-cautious-independent': 'mountain',
  'principle-cautious-cooperative': 'handshake',
  'flexible-transparent-independent': 'compass',
  'flexible-transparent-cooperative': 'chat',
  'flexible-cautious-independent': 'target',
  'flexible-cautious-cooperative': 'dove',
};

export function AdultStyleIcon({ styleKey, size = 24 }: { styleKey: string; size?: number }) {
  const name = Object.prototype.hasOwnProperty.call(resultIcons, styleKey) ? resultIcons[styleKey] : 'spark';
  return <AdultIcon name={name} size={size} />;
}
