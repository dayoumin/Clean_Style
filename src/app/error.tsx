'use client';

import { ErrorFallback } from '@/components/ErrorFallback';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}
