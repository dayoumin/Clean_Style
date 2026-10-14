import Link from 'next/link';
import RespectCheckClient from '@/app/(public)/respect/check/RespectCheckClient';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { isRespectEntry } from '@/data/workplaceRespectQuestions';
import RespectUnavailable from '@/app/(public)/respect/RespectUnavailable';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RespectCheckPage({ searchParams }: Props) {
  if (!RESPECT_FEATURE_ENABLED) {
    return <RespectUnavailable />;
  }

  const params = await searchParams;
  const entry = typeof params.entry === 'string' ? params.entry : null;

  if (!isRespectEntry(entry)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="mb-2 text-[16px] font-bold text-[var(--color-text)]">점검 유형을 먼저 선택해주세요</p>
        <p className="mb-6 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          처음 화면 오른쪽 위의 ‘내 행동’ 또는 ‘일터 존중’을 눌러 점검을 시작할 수 있어요.
        </p>
        <Link
          href="/"
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-[14px] font-semibold text-white"
        >
          처음으로
        </Link>
      </div>
    );
  }

  return <RespectCheckClient entry={entry} />;
}
