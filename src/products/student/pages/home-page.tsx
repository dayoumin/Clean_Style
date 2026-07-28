import Link from 'next/link';
import { FluentEmoji } from '@/components/FluentEmoji';
import { LeafLineArt } from '@/components/LeafLineArt';
import { studentProduct } from '@/products/student';

export default function StudentHomePage() {
  return (
    <div className="animate-fade-in relative -mx-6 -mb-6 -mt-4 flex flex-1 flex-col overflow-hidden bg-[#f6f9ff] px-6 pb-6 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:rounded-2xl sm:px-6 sm:pb-8 sm:pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[linear-gradient(180deg,#eaf2ff,rgba(234,242,255,0))]" />
      <LeafLineArt className="pointer-events-none absolute -left-20 top-16 h-48 w-48 rotate-[22deg] text-[#b7cce5] opacity-[0.24]" />
      <LeafLineArt className="pointer-events-none absolute -right-20 bottom-12 h-64 w-64 rotate-[-14deg] text-[#9eb7d8] opacity-[0.24]" />

      <span className="absolute right-6 top-5 z-20 text-[10px] font-extrabold tracking-[0.18em] text-[#6f8199]">
        DEMO
      </span>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="mb-7 inline-flex h-24 w-24 items-center justify-center rounded-[24px] bg-white shadow-[0_18px_45px_rgba(69,92,122,0.13)]">
          <FluentEmoji emoji="🧭" size={52} />
        </div>

        <p className="text-[12px] font-bold text-[#377d6a]">
          {studentProduct.copy.title}
        </p>
        <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-[var(--color-text)]">
          {studentProduct.copy.primaryDiagnosticTitle}
        </h1>
        <p className="mt-3 text-[14px] font-medium text-[var(--color-text-secondary)]">
          {studentProduct.copy.primaryDiagnosticDescription}
        </p>

        <Link
          href="/test"
          className="mt-12 w-full rounded-lg bg-[#28705e] px-6 py-4 text-[15px] font-bold text-white shadow-[0_12px_26px_rgba(40,112,94,0.22)] transition-colors hover:bg-[#205c4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28705e] focus-visible:ring-offset-2"
        >
          시작하기
        </Link>
      </section>
    </div>
  );
}
