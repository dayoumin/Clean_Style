import Link from 'next/link';

export default function RespectUnavailable() {
  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
        일터 존중·안전 자가점검은 내부 검토 중입니다
      </p>
      <p className="mb-6 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
        문항과 도움 안내는 현재 초안 단계라 공개 운영 전에 전문가 검토를 먼저 진행합니다.
      </p>
      <Link
        href="/"
        className={`rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[var(--color-primary-accent)] ${focusRing}`}
      >
        청렴 스타일 진단으로 돌아가기
      </Link>
    </div>
  );
}
