import Link from 'next/link';
import { FluentEmoji } from '@/components/FluentEmoji';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';

interface DiagnosticCardProps {
  href: string;
  emoji: string;
  title: string;
  description?: string;
  iconClassName?: string;
  tags?: string[];
  className?: string;
}

export function DiagnosticCard({
  href,
  emoji,
  title,
  description,
  iconClassName = 'bg-[var(--color-primary-soft)]',
  tags = [],
  className = '',
}: DiagnosticCardProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-24 items-center gap-4 rounded-[20px] border border-transparent bg-white px-4 py-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5 hover:border-[var(--color-primary-muted)] active:scale-[0.99] ${focusRing} ${className}`}
    >
      <span className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] ${iconClassName}`}>
        <FluentEmoji emoji={emoji} size={32} />
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] font-bold tracking-normal text-[var(--color-text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[12px] font-medium leading-snug text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <ChevronIcon />
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
