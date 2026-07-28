import Link from 'next/link';

export default function StudentTestPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 text-5xl" aria-hidden="true">🧭</span>
      <h1 className="text-xl font-bold text-[var(--color-text)]">학생용 청렴 진단을 준비하고 있어요</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
        학생에게 맞는 문항과 결과 설명을 검토 중입니다. 성인용 문항을 대신 보여주지 않도록 현재 진단은 잠시 닫아두었습니다.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-accent)] focus-visible:ring-offset-2"
      >
        처음으로
      </Link>
    </div>
  );
}
