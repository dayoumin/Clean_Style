import { DiagnosticCard } from '@/components/DiagnosticCard';
import { LeafLineArt } from '@/components/LeafLineArt';
import { studentProduct } from '@/products/student';

export default function StudentHomePage() {
  return (
    <div className="animate-fade-in relative -mx-6 -mb-6 -mt-4 flex flex-1 flex-col overflow-hidden bg-[#f6f9ff] px-6 pb-6 pt-4 sm:-mx-6 sm:-mb-8 sm:-mt-6 sm:rounded-2xl sm:px-6 sm:pb-8 sm:pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[235px] bg-[linear-gradient(180deg,#eaf2ff,rgba(234,242,255,0))]" />
      <LeafLineArt className="pointer-events-none absolute -left-16 top-9 h-44 w-44 rotate-[22deg] text-[#c5d4ea] opacity-[0.20]" />
      <LeafLineArt className="pointer-events-none absolute -right-12 top-20 h-56 w-56 text-[#9eb7d8] opacity-[0.30]" />

      <section className="relative z-10 flex flex-1 flex-col justify-center py-6">
        <div className="mb-8 text-center">
          <h1 className="text-[16px] font-medium leading-relaxed text-[var(--color-text-secondary)]">
            {studentProduct.copy.homePrompt}
          </h1>
        </div>

        <DiagnosticCard
          href="/test"
          emoji="🧭"
          title={studentProduct.copy.primaryDiagnosticTitle}
          description={studentProduct.copy.primaryDiagnosticDescription}
          iconClassName="bg-[#fff8e7]"
        />
      </section>
    </div>
  );
}
