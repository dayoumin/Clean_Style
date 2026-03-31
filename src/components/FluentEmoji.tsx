const CDN = 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@latest/assets';

const CODEPOINTS: Record<string, string> = {
  '📋': '1f4cb',
  '🎯': '1f3af',
  '✨': '2728',
  '🛡️': '1f6e1-fe0f',
  '⚖️': '2696-fe0f',
  '🏔️': '1f3d4-fe0f',
  '🤝': '1f91d',
  '🚀': '1f680',
  '💬': '1f4ac',
  '🕊️': '1f54a-fe0f',
  '🔬': '1f52c',
  '📑': '1f4d1',
  '🧭': '1f9ed',
};

export function FluentEmoji({ emoji, size = 24, className }: { emoji: string; size?: number; className?: string }) {
  const code = CODEPOINTS[emoji];
  if (!code) return <span className={className}>{emoji}</span>;
  return (
    <img
      src={`${CDN}/${code}.webp`}
      alt={emoji}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
