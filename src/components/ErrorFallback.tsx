'use client';

import { useEffect } from 'react';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function ErrorFallback({ error, reset, title = '문제가 발생했어요' }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text)',
          opacity: 0.6,
          marginBottom: '1.5rem',
        }}
      >
        잠시 후 다시 시도해 주세요.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <a
          href="/"
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          처음으로
        </a>
        <button
          onClick={reset}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
