import Link from 'next/link';
import HistoryList from '@/components/HistoryList';

const infoChips = [
  { emoji: '📋', title: '15개 상황', desc: '약 3분' },
  { emoji: '🎯', title: '오답 없음', desc: '다 맞는 답' },
  { emoji: '✨', title: 'AI 분석', desc: '맞춤 팁' },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in flex flex-col items-center pt-[6vh]">
      {/* 배지 */}
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-primary-accent)]">
        ✨ 3분 자기발견 테스트
      </div>

      {/* 타이틀 */}
      <h1 className="mb-10 text-center text-[1.75rem] font-extrabold leading-[1.25] tracking-tight text-[var(--color-text)]">
        나의 청렴 스타일은?
      </h1>

      {/* 안내 칩 */}
      <div className="mb-6 flex w-full gap-2">
        {infoChips.map((chip, i) => (
          <div
            key={chip.title}
            className="flex flex-1 flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-3.5 text-center shadow-sm"
          >
            <span
              className="animate-bounce-soft mb-1.5 inline-block text-xl"
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              {chip.emoji}
            </span>
            <p className="text-[12px] font-bold tracking-tight text-[var(--color-text)]">{chip.title}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{chip.desc}</p>
          </div>
        ))}
      </div>

      {/* 시작 버튼 */}
      <Link
        href="/test"
        className="cta-gradient mt-[4vh] w-full rounded-[var(--radius-md)] py-[15px] text-center text-[15px] font-bold tracking-tight text-white mb-[2vh]"
      >
        테스트 시작하기 →
      </Link>

      {/* 이전 결과 */}
      <HistoryList />

    </div>
  );
}
