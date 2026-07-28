import type { Metadata } from 'next';
import Link from 'next/link';
import { studentProduct } from '@/products/student';

export function generateMetadata(): Metadata {
  return {
    title: studentProduct.copy.title,
    description: studentProduct.copy.primaryDiagnosticDescription,
  };
}

export default function StudentResultPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-[var(--color-text)]">아직 학생용 진단 결과가 없습니다</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
        학생용 결과 체계는 문항 검토와 검증을 마친 뒤 제공할 예정입니다.
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
