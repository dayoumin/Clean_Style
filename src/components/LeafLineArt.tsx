export function LeafLineArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 220" fill="none" aria-hidden="true">
      <path d="M34 172C92 151 137 101 172 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M74 147C68 119 79 97 106 80C115 112 105 134 74 147Z" stroke="currentColor" strokeWidth="3" />
      <path d="M117 103C110 74 123 52 153 35C162 68 151 91 117 103Z" stroke="currentColor" strokeWidth="3" />
      <path d="M92 134L106 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M137 88L153 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M42 176C64 183 88 180 107 167" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M108 167C99 144 83 132 56 132C62 160 79 173 108 167Z" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
