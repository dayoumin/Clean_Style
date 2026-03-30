import { Suspense } from 'react';
import type { Metadata } from 'next';
import { styleTypes } from '@/data/questions';
import { LoadingFairy } from '@/components/LoadingFairy';
import ResultContent from './ResultClient';

const DEFAULT_TITLE = '나의 청렴 스타일은?';
const DEFAULT_DESC = '재미로 알아보는 청렴 스타일 자기발견 테스트';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const styleKey = typeof params.style === 'string' ? params.style : '';
  const style = styleTypes[styleKey];

  const title = style ? `${style.emoji} ${style.name} — 나의 청렴 스타일` : DEFAULT_TITLE;
  const description = style?.description ?? DEFAULT_DESC;
  const ogImagePath = style
    ? `/api/og?style=${encodeURIComponent(styleKey)}`
    : '/api/og';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogImagePath, width: 1200, height: 630 }],
    },
  };
}

function SuspenseSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingFairy message="불러오는 중..." />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<SuspenseSpinner />}>
      <ResultContent />
    </Suspense>
  );
}
