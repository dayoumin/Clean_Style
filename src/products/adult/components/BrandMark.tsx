/** Existing shield-and-wave identity, rendered in the current foreground color. */
export default function BrandMark({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M16 1 L2 6.5 L2 16 C2 24 7.5 29.5 16 31 C24.5 29.5 30 24 30 16 L30 6.5 Z" />
    <path d="M7 18 C9.5 13.5, 13.5 13.5, 16 18 C18.5 22.5, 22.5 22.5, 25 18" />
    <path d="M7.5 12.5 C10.5 8, 14.5 8, 17.5 12.5" />
  </svg>;
}
