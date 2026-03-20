import Link from 'next/link';

const infoChips = [
  { emoji: '📋', title: '15개 상황', desc: '약 3분' },
  { emoji: '🎯', title: '정답 없음', desc: '나의 스타일' },
  { emoji: '🤖', title: 'AI 분석', desc: '맞춤 팁' },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in flex flex-col items-center pt-12">
      {/* 배지 */}
      <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-[13px] font-semibold text-[var(--color-primary-accent)]">
        ✨ 3분 자기발견 테스트
      </div>

      {/* 타이틀 */}
      <h1 className="mb-3 text-center text-[2rem] font-extrabold leading-[1.25] tracking-tight text-[var(--color-text)]">
        나의 청렴
        <br />
        스타일은?
      </h1>
      <p className="mb-10 text-center text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
        공공 연구기관에서 만나는 다양한 상황,
        <br />
        나는 어떻게 대처할까?
      </p>

      {/* 안내 칩 */}
      <div className="mb-8 flex w-full gap-3">
        {infoChips.map((chip) => (
          <div
            key={chip.title}
            className="flex flex-1 flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-5 text-center"
          >
            <span className="mb-2.5 text-2xl">{chip.emoji}</span>
            <p className="text-[13px] font-bold tracking-tight text-[var(--color-text)]">{chip.title}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{chip.desc}</p>
          </div>
        ))}
      </div>

      {/* 시작 버튼 */}
      <Link
        href="/test"
        className="cta-gradient w-full rounded-[var(--radius-md)] py-[18px] text-center text-[16px] font-bold tracking-tight text-white"
      >
        테스트 시작하기 →
      </Link>

      {/* 푸터 */}
      <p className="mt-7 text-center text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        이 테스트는 재미있는 자기발견을 위한 것이며,
        <br />
        공식적인 평가와는 무관합니다.
      </p>
    </div>
  );
}
