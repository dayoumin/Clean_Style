import Link from 'next/link';
import RespectResultClient from '@/app/(public)/respect/result/RespectResultClient';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { isRespectEntry } from '@/data/workplaceRespectQuestions';
import RespectUnavailable from '@/app/(public)/respect/RespectUnavailable';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RespectResultPage({ searchParams }: Props) {
  if (!RESPECT_FEATURE_ENABLED) {
    return <RespectUnavailable />;
  }

  const params = await searchParams;
  const entry = typeof params.entry === 'string' ? params.entry : null;

  if (!isRespectEntry(entry)) {
    return <InvalidResult />;
  }

  return <RespectResultClient entry={entry} />;
}

function InvalidResult() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-[16px] font-bold text-[var(--color-text)]">결과를 불러올 수 없어요</p>
      <p className="mb-6 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        점검을 처음부터 다시 진행해주세요.
      </p>
      <Link
        href="/respect"
        className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-[14px] font-semibold text-white"
      >
        점검 시작하기
      </Link>
    </div>
  );
}
