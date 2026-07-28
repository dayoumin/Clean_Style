export default function StudentAdminLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg-page)] px-6 text-center">
      <h1 className="text-lg font-semibold text-[var(--color-text)]">학생용 관리 화면을 준비 중입니다</h1>
      <p className="max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        성인용 진단 데이터 관리 기능은 학생용 제품에 포함하지 않습니다.
      </p>
    </div>
  );
}
