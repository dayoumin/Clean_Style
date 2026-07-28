export default function EmergencyHelpStrip({ compact = false }: { compact?: boolean }) {
  const focusRing = 'transition-colors hover:bg-[#ffe4e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c] focus-visible:ring-offset-2';

  return (
    <section className="rounded-[var(--radius-md)] border border-[#fecdd3] bg-[#fff1f2] px-4 py-3">
      <p className="text-[12px] font-bold text-[#be123c]">
        지금 안전하지 않다면 먼저 도움을 요청하세요
      </p>
      {!compact && (
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          자해 생각, 폭력 위험, 즉각적인 안전 문제가 있으면 문항을 계속하지 말고 가까운 사람이나 기관에 바로 연결하세요.
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a
          href="tel:109"
          aria-label="109 자살예방상담전화"
          className={`rounded-[var(--radius-md)] bg-white px-2 py-2 text-center text-[12px] font-bold text-[#be123c] ${focusRing}`}
        >
          109 상담
        </a>
        <a
          href="tel:112"
          aria-label="112 긴급신고"
          className={`rounded-[var(--radius-md)] bg-white px-2 py-2 text-center text-[12px] font-bold text-[#be123c] ${focusRing}`}
        >
          112 신고
        </a>
        <a
          href="tel:119"
          aria-label="119 구조·응급"
          className={`rounded-[var(--radius-md)] bg-white px-2 py-2 text-center text-[12px] font-bold text-[#be123c] ${focusRing}`}
        >
          119 응급
        </a>
      </div>
    </section>
  );
}
