'use client';

import { ErrorFallback } from '@/components/ErrorFallback';

export default function ResultError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} title="결과를 불러오는 중 문제가 발생했어요" />;
}
