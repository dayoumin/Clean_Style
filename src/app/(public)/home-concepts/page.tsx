'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FluentEmoji } from '@/components/FluentEmoji';

type ConceptId = 'daily' | 'canvas' | 'briefing' | 'signal';

const concepts: Array<{
  id: ConceptId;
  label: string;
  name: string;
  tone: string;
}> = [
  { id: 'daily', label: 'A', name: '가벼운 체크인', tone: '밝고 산뜻한 앱 첫 화면' },
  { id: 'canvas', label: 'B', name: '판단 캔버스', tone: '넓고 시원한 비주얼 중심' },
  { id: 'briefing', label: 'C', name: '업무 브리핑', tone: '차분하고 신뢰감 있는 구성' },
  { id: 'signal', label: 'D', name: '좋은 신호', tone: '따뜻하고 감성적인 진입' },
];

function ConceptShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 -mb-6 -mt-4 overflow-hidden bg-white sm:-mx-8 sm:-mb-8 sm:-mt-6 sm:rounded-2xl">
      {children}
    </div>
  );
}

function StartButton({ tone = 'dark' }: { tone?: 'dark' | 'light' | 'green' }) {
  const toneClass = {
    dark: 'bg-[#17182f] text-white shadow-[0_12px_28px_rgba(23,24,47,0.18)]',
    light: 'bg-white text-[#17182f] shadow-[0_12px_30px_rgba(23,24,47,0.16)]',
    green: 'bg-[#0f3d33] text-white shadow-[0_12px_28px_rgba(15,61,51,0.18)]',
  }[tone];

  return (
    <Link
      href="/test"
      className={`flex h-[56px] w-full items-center justify-center rounded-[18px] text-[15px] font-extrabold ${toneClass}`}
    >
      테스트 시작하기
      <span className="ml-2 text-[18px] leading-none">→</span>
    </Link>
  );
}

function DailyConcept() {
  return (
    <ConceptShell>
      <section className="min-h-[700px] bg-[#f6fbf8] px-6 pb-7 pt-7 text-[#17201b]">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#277662] shadow-sm">
            3분 체크인
          </div>
          <div className="text-[12px] font-semibold text-[#8a9b93]">청렴 스타일</div>
        </div>

        <div className="relative mt-8 h-[250px] overflow-hidden rounded-[28px] bg-[#cfeee3]">
          <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-[#fff6bf]" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-[#8ed7c2]" />
          <div className="absolute bottom-8 left-8 right-8 rounded-[24px] bg-white/92 p-5 shadow-[0_18px_44px_rgba(39,118,98,0.18)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf7f2]">
                <FluentEmoji emoji="🧭" size={22} />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">오늘의 판단 감각</p>
                <p className="text-[11px] text-[#7c8d85]">가볍게 확인해볼까요?</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['상황', '선택', '분석'].map((item, index) => (
                <div key={item} className="rounded-[14px] bg-[#f3faf7] px-2 py-3 text-center">
                  <p className="text-[18px] font-black text-[#277662]">{index + 1}</p>
                  <p className="text-[11px] font-bold text-[#50655c]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h1 className="text-[2.35rem] font-black leading-[1.08] tracking-normal">
            나의 청렴 스타일,
            <br />
            오늘 기분으로
            <br />
            가볍게 보기
          </h1>
          <p className="mt-4 max-w-[310px] text-[14px] leading-relaxed text-[#60746a]">
            정답을 맞히는 테스트가 아니라, 애매한 순간에 내가 어떤 기준을 먼저 보는지 확인하는 짧은 체크인입니다.
          </p>
        </div>

        <div className="mt-9">
          <StartButton tone="green" />
          <p className="mt-4 text-center text-[12px] font-semibold text-[#8a9b93]">15개 상황 · 오답 없음 · AI 요약</p>
        </div>
      </section>
    </ConceptShell>
  );
}

function CanvasConcept() {
  return (
    <ConceptShell>
      <section className="min-h-[700px] bg-[#f8f7f2] px-6 pb-7 pt-7 text-[#1d2430]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#7c6d53]">Integrity Canvas</span>
          <span className="rounded-full bg-[#1d2430] px-3 py-1.5 text-[12px] font-bold text-white">3 min</span>
        </div>

        <div className="relative mt-8 h-[330px]">
          <div className="absolute left-0 top-3 h-[230px] w-[78%] rounded-[30px] bg-[#f0d59b] shadow-[0_22px_48px_rgba(59,48,33,0.16)]" />
          <div className="absolute right-0 top-24 h-[190px] w-[68%] rounded-[30px] bg-[#d8eadf] shadow-[0_18px_42px_rgba(45,79,65,0.16)]" />
          <div className="absolute left-8 top-36 h-[132px] w-[190px] rotate-[-6deg] rounded-[24px] bg-white p-5 shadow-[0_16px_36px_rgba(29,36,48,0.16)]">
            <p className="text-[12px] font-bold text-[#7c6d53]">상황 카드</p>
            <p className="mt-4 h-2 w-24 rounded-full bg-[#1d2430]" />
            <p className="mt-3 h-2 w-32 rounded-full bg-[#d7d1c4]" />
            <p className="mt-3 h-2 w-20 rounded-full bg-[#d7d1c4]" />
          </div>
          <div className="absolute right-8 top-8 flex h-[112px] w-[112px] rotate-[8deg] items-center justify-center rounded-[34px] bg-[#1d2430] text-white shadow-[0_18px_36px_rgba(29,36,48,0.22)]">
            <FluentEmoji emoji="✨" size={42} />
          </div>
          <div className="absolute bottom-0 right-4 rounded-full bg-white px-4 py-3 text-[13px] font-extrabold shadow-[0_12px_28px_rgba(29,36,48,0.14)]">
            내 기준을 발견하는 시간
          </div>
        </div>

        <h1 className="mt-4 text-[2.2rem] font-black leading-[1.08]">
          애매한 순간,
          <br />
          나는 무엇을
          <br />
          먼저 볼까?
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-[#6c675d]">
          답을 고르는 동안 나의 일 처리 습관이 하나의 스타일로 정리됩니다.
        </p>

        <div className="mt-8">
          <StartButton />
        </div>
      </section>
    </ConceptShell>
  );
}

function BriefingConcept() {
  return (
    <ConceptShell>
      <section className="min-h-[700px] bg-[#f3f5f8] px-6 pb-7 pt-7 text-[#151927]">
        <div className="rounded-[26px] bg-white px-5 py-5 shadow-[0_16px_42px_rgba(21,25,39,0.08)]">
          <div className="flex items-center justify-between border-b border-[#e7ebf0] pb-4">
            <div>
              <p className="text-[12px] font-bold text-[#748093]">오늘의 짧은 진단</p>
              <p className="mt-1 text-[18px] font-black">청렴 스타일 리포트</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9f0ff]">
              <FluentEmoji emoji="📋" size={24} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-4">
            <div>
              <h1 className="text-[2rem] font-black leading-[1.12]">
                15가지 상황으로
                <br />
                내 업무 판단
                <br />
                패턴 보기
              </h1>
              <p className="mt-4 text-[13px] leading-relaxed text-[#687385]">
                연구, 행정, 관계 속에서 내가 자주 선택하는 기준을 차분하게 보여줍니다.
              </p>
            </div>
            <div className="flex w-16 flex-col items-center justify-between rounded-full bg-[#f2f5fa] py-4">
              <span className="h-7 w-7 rounded-full bg-[#3c70e8]" />
              <span className="h-7 w-7 rounded-full bg-[#20b486]" />
              <span className="h-7 w-7 rounded-full bg-[#f1a456]" />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {[
            ['소요 시간', '약 3분'],
            ['문항 구성', '업무 상황 15개'],
            ['결과 방식', 'AI 맞춤 요약'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-[#dde4ee] py-4">
              <span className="text-[13px] font-bold text-[#687385]">{label}</span>
              <span className="text-[15px] font-black text-[#151927]">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-9">
          <StartButton />
          <p className="mt-4 text-center text-[12px] font-semibold text-[#7b8594]">공유용 결과와 AI 조언까지 이어집니다.</p>
        </div>
      </section>
    </ConceptShell>
  );
}

function SignalConcept() {
  return (
    <ConceptShell>
      <section className="min-h-[700px] bg-[#fff8ef] px-6 pb-7 pt-7 text-[#251a16]">
        <div className="relative min-h-[650px] overflow-hidden rounded-[34px] bg-[#f7c975] px-6 pb-6 pt-6">
          <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#ffe8b9]" />
          <div className="absolute -bottom-16 -left-20 h-64 w-64 rounded-full bg-[#c7ead8]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/78 px-3 py-1.5 text-[12px] font-extrabold text-[#7a4d1b]">Good signal</span>
              <span className="text-[12px] font-bold text-[#7a4d1b]">오답 없음</span>
            </div>

            <div className="mt-20 flex justify-center">
              <div className="relative h-36 w-36 rounded-[44px] bg-white/85 shadow-[0_22px_45px_rgba(96,55,18,0.18)]">
                <div className="absolute left-8 top-8 h-16 w-16 rounded-[22px] bg-[#251a16]" />
                <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#62c99b]">
                  <FluentEmoji emoji="✓" size={28} />
                </div>
                <div className="absolute bottom-6 left-6 right-6 h-3 rounded-full bg-[#f7c975]" />
              </div>
            </div>

            <div className="mt-16">
              <h1 className="text-center text-[2.25rem] font-black leading-[1.08]">
                좋은 판단은
                <br />
                내 스타일을
                <br />
                아는 데서 시작해요
              </h1>
              <p className="mx-auto mt-5 max-w-[292px] text-center text-[14px] leading-relaxed text-[#6f4d29]">
                복잡한 설명 없이, 내가 일할 때 자주 켜는 신호를 짧고 기분 좋게 확인합니다.
              </p>
            </div>

            <div className="mt-12 rounded-[24px] bg-white/74 p-3 backdrop-blur">
              <StartButton tone="light" />
            </div>
          </div>
        </div>
      </section>
    </ConceptShell>
  );
}

function ActiveConcept({ id }: { id: ConceptId }) {
  if (id === 'canvas') return <CanvasConcept />;
  if (id === 'briefing') return <BriefingConcept />;
  if (id === 'signal') return <SignalConcept />;
  return <DailyConcept />;
}

export default function HomeConceptsPage() {
  const [active, setActive] = useState<ConceptId>('daily');
  const activeConcept = concepts.find(concept => concept.id === active) ?? concepts[0];

  return (
    <div className="animate-fade-in">
      <div className="-mx-6 -mt-4 border-b border-[var(--color-border)] bg-white px-4 py-3 sm:-mx-8 sm:-mt-6 sm:px-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-black text-[var(--color-text)]">메인 화면 시안</h1>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">{activeConcept.tone}</p>
          </div>
          <Link href="/" className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-text-secondary)]">
            현재 화면
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {concepts.map(concept => (
            <button
              key={concept.id}
              type="button"
              onClick={() => setActive(concept.id)}
              className={`rounded-[12px] px-2 py-2 text-center transition-colors ${
                active === concept.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-card)] text-[var(--color-text-secondary)]'
              }`}
            >
              <span className="block text-[12px] font-black">{concept.label}</span>
              <span className="block truncate text-[10px] font-bold">{concept.name}</span>
            </button>
          ))}
        </div>
      </div>

      <ActiveConcept id={active} />
    </div>
  );
}
