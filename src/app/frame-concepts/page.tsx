import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FluentEmoji } from '@/components/FluentEmoji';
import { LeafLineArt } from '@/components/LeafLineArt';

const homeCards = [
  {
    emoji: '✨',
    title: '청렴 스타일 진단',
    description: '나의 청렴 성향 파악하기',
    iconClassName: 'bg-[#fff5dc]',
  },
  {
    emoji: '🤝',
    title: '내 행동 점검',
    description: '일상 속 올바른 실천 확인',
    iconClassName: 'bg-[#e8f4ff]',
  },
  {
    emoji: '📑',
    title: '일터 존중 점검',
    description: '상호 존중하는 문화 만들기',
    iconClassName: 'bg-[#f1f2f6]',
  },
];

const concepts = [
  {
    id: 'paper',
    label: 'A',
    name: '클린 페이퍼',
    summary: '흰 화면의 장점을 살리고, 얇은 레이어와 선으로 빈 여백을 정돈합니다.',
  },
  {
    id: 'line',
    label: 'B',
    name: '블루 라인',
    summary: '공공기관 도구처럼 차분한 파란 선과 그리드로 세련된 인상을 줍니다.',
  },
  {
    id: 'warm',
    label: 'C',
    name: '웜 체크인',
    summary: '자가점검의 부담을 낮추는 따뜻한 배경과 부드러운 카드 톤입니다.',
  },
  {
    id: 'slate',
    label: 'D',
    name: '딥 포커스',
    summary: '어두운 상단 배경을 얇게 써서 앱 첫 화면에 무게감과 집중감을 줍니다.',
  },
  {
    id: 'diagonal',
    label: 'E',
    name: '사선 벡터',
    summary: 'SVG나 벡터 이미지를 사선 레이어로 깔아 화면에 방향성과 세련된 구조감을 줍니다.',
  },
  {
    id: 'webp',
    label: 'F',
    name: 'WebP 컷아웃',
    summary: '일반 WebP 이미지를 모서리에 부분 노출해 앱 이미지와 기분 좋은 시각 신호를 만듭니다.',
  },
  {
    id: 'leaf',
    label: 'G',
    name: '리프 라인',
    summary: '낙엽과 잎맥을 얇은 선화로 써서 자연 이미지를 가장 절제되게 넣습니다.',
  },
  {
    id: 'reed',
    label: 'H',
    name: '풀잎 실루엣',
    summary: '기다란 풀잎 실루엣을 좌우 가장자리에 배치해 안정감을 만듭니다.',
  },
  {
    id: 'botanical',
    label: 'I',
    name: '보태니컬 컷',
    summary: '자연 사진 WebP를 쓰는 경우를 가정한 부분 컷아웃형 배치입니다.',
  },
  {
    id: 'sage',
    label: 'J',
    name: '세이지 라이트',
    summary: '은은한 자연색과 흐린 식물 그림자를 섞어 가장 앱다운 안정감을 줍니다.',
  },
  {
    id: 'shadow',
    label: 'K',
    name: '잎 그림자',
    summary: '사진 대신 빛과 그림자 느낌만 써서 세련되고 조용한 첫 화면을 만듭니다.',
  },
  {
    id: 'meadow',
    label: 'L',
    name: '메도우 엣지',
    summary: '하단 여백에 기다란 풀잎을 얇게 깔아 카드 영역은 깨끗하게 유지합니다.',
  },
];

function ReedArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 180 420" fill="none" aria-hidden="true">
      <path d="M40 410C43 322 56 221 83 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M83 40C107 69 118 103 112 143C88 112 78 79 83 40Z" fill="currentColor" opacity="0.22" />
      <path d="M72 120C38 143 24 177 30 221C62 191 77 159 72 120Z" fill="currentColor" opacity="0.18" />
      <path d="M62 214C93 243 108 283 103 334C70 298 57 259 62 214Z" fill="currentColor" opacity="0.2" />
      <path d="M112 410C110 318 118 218 143 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.58" />
      <path d="M143 78C161 104 168 132 162 165C143 138 137 111 143 78Z" fill="currentColor" opacity="0.16" />
    </svg>
  );
}

function LeafShadowArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 360 260" fill="none" aria-hidden="true">
      <path d="M75 226C126 179 166 121 197 42" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity="0.18" />
      <path d="M120 176C104 124 124 83 179 52C194 111 174 153 120 176Z" fill="currentColor" opacity="0.16" />
      <path d="M191 91C180 49 200 22 247 12C257 58 237 86 191 91Z" fill="currentColor" opacity="0.12" />
      <path d="M135 198C97 170 62 160 28 168C53 207 88 218 135 198Z" fill="currentColor" opacity="0.12" />
      <path d="M241 218C273 162 297 101 313 36" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.12" />
      <path d="M261 156C244 116 255 78 296 42C318 89 306 126 261 156Z" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

function HomeCard({
  emoji,
  title,
  description,
  iconClassName,
}: {
  emoji: string;
  title: string;
  description: string;
  iconClassName: string;
}) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-[20px] bg-white px-4 py-4 text-left shadow-[0_14px_34px_rgba(23,24,47,0.08)]">
      <span className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] ${iconClassName}`}>
        <FluentEmoji emoji={emoji} size={32} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-black tracking-normal text-[#111329]">{title}</p>
        <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#5a6080]">{description}</p>
      </div>
      <span className="text-3xl font-light leading-none text-[#a3a9bd]">›</span>
    </div>
  );
}

function HomeScreen({
  variant,
}: {
  variant: 'paper' | 'line' | 'warm' | 'slate' | 'diagonal' | 'webp' | 'leaf' | 'reed' | 'botanical' | 'sage' | 'shadow' | 'meadow';
}) {
  const isSlate = variant === 'slate';
  const bgClass = {
    paper: 'bg-[#f8f9fc]',
    line: 'bg-[#f5f8ff]',
    warm: 'bg-[#fff9f0]',
    slate: 'bg-[#f6f7fb]',
    diagonal: 'bg-[#f7f9ff]',
    webp: 'bg-[#fbfcff]',
    leaf: 'bg-[#f8faf5]',
    reed: 'bg-[#f5f8f1]',
    botanical: 'bg-[#fbfaf5]',
    sage: 'bg-[#f7faf4]',
    shadow: 'bg-[#fbfcf8]',
    meadow: 'bg-[#f8faf6]',
  }[variant];

  return (
    <div className={`relative h-[700px] overflow-hidden rounded-[28px] ${bgClass} px-8 py-8 shadow-[0_22px_58px_rgba(23,24,47,0.15)]`}>
      {variant === 'paper' && (
        <>
          <div className="absolute inset-x-8 top-10 h-[118px] rounded-[28px] border border-[#e5e8f2] bg-white/70" />
          <div className="absolute bottom-12 left-8 right-8 h-[150px] rounded-[30px] border border-dashed border-[#e1e5f0]" />
          <div className="absolute left-12 top-52 h-px w-[78%] bg-[#eef1f7]" />
          <div className="absolute left-12 top-60 h-px w-[68%] bg-[#eef1f7]" />
        </>
      )}

      {variant === 'line' && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(67,97,238,0.07)_1px,transparent_1px),linear-gradient(180deg,rgba(67,97,238,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute left-0 top-0 h-24 w-full bg-[linear-gradient(180deg,#e9efff,rgba(233,239,255,0))]" />
          <div className="absolute right-8 top-12 h-16 w-28 rounded-[18px] border border-[#cbd6ff] bg-white/58" />
          <div className="absolute bottom-14 left-8 h-20 w-40 rounded-[20px] border border-[#cbd6ff] bg-white/42" />
        </>
      )}

      {variant === 'warm' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[235px] bg-[linear-gradient(180deg,#ffe8bd,rgba(255,232,189,0))]" />
          <div className="absolute left-8 top-10 h-28 w-[calc(100%-4rem)] rounded-[28px] bg-white/52" />
          <div className="absolute bottom-10 left-10 right-10 h-20 rounded-[24px] bg-[#fff2dc]" />
          <div className="absolute bottom-10 left-10 right-10 h-px bg-[#f4d9b0]" />
        </>
      )}

      {variant === 'slate' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[250px] bg-[#17182f]" />
          <div className="absolute inset-x-8 top-8 h-[118px] rounded-[28px] border border-white/10 bg-white/6" />
          <div className="absolute left-8 right-8 top-[168px] h-px bg-[#dfe4f4]" />
          <div className="absolute bottom-12 left-8 right-8 h-[100px] rounded-[26px] border border-[#dfe4f4] bg-white/58" />
        </>
      )}

      {variant === 'diagonal' && (
        <>
          <div className="absolute -right-24 top-10 h-16 w-[340px] -rotate-[24deg] rounded-full bg-[#dde6ff]" />
          <div className="absolute -right-14 top-28 h-8 w-[260px] -rotate-[24deg] rounded-full bg-[#edf2ff]" />
          <div className="absolute -left-20 bottom-24 h-14 w-[300px] -rotate-[24deg] rounded-full bg-[#eef1f7]" />
          <div className="absolute left-8 top-10 h-[118px] w-[calc(100%-4rem)] rounded-[28px] border border-[#d8e0f7] bg-white/52" />
          <div className="absolute bottom-11 right-8 h-[112px] w-[210px] -rotate-[5deg] rounded-[26px] border border-[#d8e0f7] bg-white/50" />
        </>
      )}

      {variant === 'webp' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[250px] bg-[linear-gradient(180deg,#eef3ff,rgba(238,243,255,0))]" />
          <div className="absolute -right-16 top-16 opacity-25 blur-[1px]">
            <FluentEmoji emoji="✨" size={176} />
          </div>
          <div className="absolute -left-20 bottom-22 opacity-15">
            <FluentEmoji emoji="🧭" size={208} />
          </div>
          <div className="absolute right-8 bottom-11 h-[116px] w-[200px] rounded-[28px] border border-[#dfe5f4] bg-white/64" />
          <div className="absolute left-8 top-10 h-[118px] w-[calc(100%-4rem)] rounded-[28px] bg-white/50" />
        </>
      )}

      {variant === 'leaf' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[235px] bg-[linear-gradient(180deg,#edf5e8,rgba(237,245,232,0))]" />
          <LeafLineArt className="absolute -right-8 top-16 h-52 w-52 text-[#98aa87] opacity-30" />
          <LeafLineArt className="absolute -left-20 bottom-16 h-56 w-56 rotate-[-18deg] text-[#b5c3a8] opacity-22" />
        </>
      )}

      {variant === 'reed' && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(137,154,123,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
          <ReedArt className="absolute -left-8 bottom-0 h-[430px] w-[180px] text-[#82936f] opacity-32" />
          <ReedArt className="absolute -right-16 bottom-0 h-[420px] w-[180px] scale-x-[-1] text-[#a8b89b] opacity-22" />
          <div className="absolute inset-x-8 top-10 h-[118px] rounded-[28px] bg-white/56" />
          <div className="absolute bottom-12 left-10 right-10 h-[90px] rounded-[24px] bg-white/44" />
        </>
      )}

      {variant === 'botanical' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[260px] bg-[linear-gradient(180deg,#f1eadb,rgba(241,234,219,0))]" />
          <div className="absolute -right-10 top-16 h-[260px] w-[150px] overflow-hidden rounded-[34px] border border-white/70 bg-[#d9e2cf] shadow-[0_18px_42px_rgba(83,93,65,0.14)]">
            <ReedArt className="absolute -bottom-16 -left-8 h-[360px] w-[170px] text-[#6f815e] opacity-45" />
            <LeafLineArt className="absolute -right-12 top-10 h-44 w-44 text-white opacity-55" />
          </div>
          <div className="absolute -left-8 bottom-20 h-[190px] w-[126px] overflow-hidden rounded-[30px] border border-white/70 bg-[#eef2e6]">
            <LeafLineArt className="absolute -left-12 top-2 h-52 w-52 text-[#9cad86] opacity-38" />
          </div>
          <div className="absolute left-8 top-10 h-[118px] w-[calc(100%-4rem)] rounded-[28px] bg-white/56" />
        </>
      )}

      {variant === 'sage' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(216,228,200,0.7),transparent_30%),radial-gradient(circle_at_82%_88%,rgba(234,219,196,0.58),transparent_34%)]" />
          <div className="absolute inset-x-7 top-8 h-[126px] rounded-[32px] border border-white/70 bg-white/46 shadow-[0_22px_52px_rgba(96,112,80,0.08)]" />
          <div className="absolute -right-20 top-12 h-80 w-80 rounded-full bg-white/28 blur-2xl" />
          <LeafShadowArt className="absolute -right-16 top-20 h-64 w-80 text-[#78905d] opacity-35 blur-[0.3px]" />
          <LeafShadowArt className="absolute -left-24 bottom-4 h-64 w-80 rotate-[-20deg] text-[#a8b48f] opacity-24 blur-[0.4px]" />
          <div className="absolute bottom-10 left-8 right-8 h-[116px] rounded-[30px] border border-white/64 bg-white/38 shadow-[0_18px_38px_rgba(96,112,80,0.06)]" />
        </>
      )}

      {variant === 'shadow' && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#fcfbf5_0%,#f7faf4_58%,#fbfcff_100%)]" />
          <div className="absolute -right-20 top-6 h-[330px] w-[310px] rounded-full bg-[#eef4e7] blur-3xl" />
          <LeafShadowArt className="absolute -right-24 top-2 h-[310px] w-[430px] rotate-[8deg] text-[#72845d] opacity-22 blur-[3px]" />
          <LeafShadowArt className="absolute -left-32 bottom-20 h-[290px] w-[390px] rotate-[-28deg] text-[#9ba889] opacity-16 blur-[4px]" />
          <div className="absolute inset-x-8 top-10 h-[118px] rounded-[30px] bg-white/44 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72)]" />
          <div className="absolute inset-x-8 bottom-12 h-[96px] rounded-[28px] bg-white/34 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.66)]" />
        </>
      )}

      {variant === 'meadow' && (
        <>
          <div className="absolute inset-x-0 top-0 h-[220px] bg-[linear-gradient(180deg,#eef6ea,rgba(238,246,234,0))]" />
          <div className="absolute inset-x-7 top-8 h-[120px] rounded-[30px] border border-[#e4edde] bg-white/52" />
          <div className="absolute bottom-0 left-0 right-0 h-[190px] bg-[linear-gradient(180deg,rgba(248,250,246,0),rgba(226,235,218,0.75))]" />
          <ReedArt className="absolute -left-10 bottom-[-22px] h-[330px] w-[150px] text-[#778a66] opacity-25" />
          <ReedArt className="absolute left-12 bottom-[-58px] h-[260px] w-[124px] text-[#9cab86] opacity-16" />
          <ReedArt className="absolute -right-8 bottom-[-28px] h-[340px] w-[150px] scale-x-[-1] text-[#81936f] opacity-26" />
          <div className="absolute bottom-12 left-8 right-8 h-[92px] rounded-[28px] border border-white/72 bg-white/42" />
        </>
      )}

      <div className="relative flex h-full flex-col">
        <div className="pt-8 text-center">
          <p className={`text-[16px] font-semibold leading-relaxed ${isSlate ? 'text-white/88' : 'text-[#4f5574]'}`}>
            잠깐 체크해 볼까요?
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4">
          {homeCards.map((card) => (
            <HomeCard key={card.title} {...card} />
          ))}
        </div>

        <div className="pb-1 text-center">
          <span className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-[12px] font-semibold ${
            isSlate ? 'bg-white/80 text-[#5a6080]' : 'text-[#969caf]'
          }`}>
            청렴 결과 보기
          </span>
        </div>
      </div>
    </div>
  );
}

function ConceptBlock({
  id,
  label,
  name,
  summary,
  variant,
  recommendation,
}: {
  id: string;
  label: string;
  name: string;
  summary: string;
  variant: 'paper' | 'line' | 'warm' | 'slate' | 'diagonal' | 'webp' | 'leaf' | 'reed' | 'botanical' | 'sage' | 'shadow' | 'meadow';
  recommendation: string;
}) {
  return (
    <section id={id} className="rounded-[28px] border border-[#dce1ec] bg-white p-6 shadow-[0_12px_38px_rgba(23,24,47,0.07)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-black text-[#4361ee]">Concept {label}</p>
          <h2 className="mt-1 text-[22px] font-black text-[#17182f]">{name}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#687089]">{summary}</p>
        </div>
        <span className="rounded-full bg-[#f1f3fa] px-4 py-2 text-[12px] font-bold text-[#5a6080]">
          {recommendation}
        </span>
      </div>
      <div className="mx-auto max-w-[430px]">
        <HomeScreen variant={variant} />
      </div>
    </section>
  );
}

export default function FrameConceptsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-[#edf0f6] px-6 py-8 text-[#17182f]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-[#6f738a]">첫 화면 배경 시안</p>
            <h1 className="mt-2 text-[30px] font-black tracking-normal">홈 화면의 빈 여백을 어떻게 살릴까요?</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#687089]">
              진단 카드 3개는 유지하고, 첫 화면 안쪽의 큰 여백을 더 세련되고 안정적으로 보이게 하는 배경 방향입니다.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#d4dae7] bg-white px-4 py-2 text-[13px] font-bold text-[#5a6080] shadow-sm"
          >
            현재 첫 화면
          </Link>
        </header>

        <div className="mb-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12">
          {concepts.map((concept) => (
            <a
              key={concept.id}
              href={`#${concept.id}`}
              className="rounded-[18px] bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(23,24,47,0.07)]"
            >
              <span className="text-[12px] font-black text-[#4361ee]">{concept.label}</span>
              <p className="mt-1 text-[16px] font-black">{concept.name}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#6f738a]">{concept.summary}</p>
            </a>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ConceptBlock
            id="paper"
            label="A"
            name="클린 페이퍼"
            summary="흰 화면을 크게 유지하되, 얇은 선과 레이어로 정돈된 느낌을 줍니다. 가장 보수적이고 실제 앱에 바로 붙이기 쉽습니다."
            variant="paper"
            recommendation="가장 안전"
          />
          <ConceptBlock
            id="line"
            label="B"
            name="블루 라인"
            summary="파란 그리드와 얇은 보조 패널로 공공기관 업무 도구 같은 인상을 만듭니다. 심플하지만 빈 공간이 덜 비어 보입니다."
            variant="line"
            recommendation="깔끔한 도구감"
          />
          <ConceptBlock
            id="warm"
            label="C"
            name="웜 체크인"
            summary="자가점검의 부담을 낮추는 따뜻한 톤입니다. 첫 방문자에게 부드럽지만, 기관용 앱으로는 약간 친근한 인상이 강합니다."
            variant="warm"
            recommendation="부드러운 인상"
          />
          <ConceptBlock
            id="slate"
            label="D"
            name="딥 포커스"
            summary="상단에 짧은 어두운 배경을 넣어 시각적 무게감을 만듭니다. 가장 멋은 있지만 현재 청렴 스타일 화면보다 강한 인상입니다."
            variant="slate"
            recommendation="가장 선명"
          />
          <ConceptBlock
            id="diagonal"
            label="E"
            name="사선 벡터"
            summary="사선 벡터 레이어를 배경 이미지처럼 부분 배치합니다. 빈 여백이 줄고, 화면에 움직임과 방향성이 생깁니다."
            variant="diagonal"
            recommendation="세련된 구조감"
          />
          <ConceptBlock
            id="webp"
            label="F"
            name="WebP 컷아웃"
            summary="WebP 이미지를 모서리 밖으로 살짝 걸쳐 배치하는 방식입니다. 실제 적용 시 기관 톤에 맞는 일러스트나 사진 컷아웃으로 교체하면 됩니다."
            variant="webp"
            recommendation="이미지 활용형"
          />
          <ConceptBlock
            id="leaf"
            label="G"
            name="리프 라인"
            summary="낙엽과 잎맥을 선화로만 넣어 자연 이미지를 가장 절제되게 활용합니다. 안정감은 주면서도 웰니스 앱처럼 과하게 가지 않습니다."
            variant="leaf"
            recommendation="가장 세련된 자연형"
          />
          <ConceptBlock
            id="reed"
            label="H"
            name="풀잎 실루엣"
            summary="기다란 풀잎을 양쪽 가장자리 실루엣으로 두는 방식입니다. 화면 중앙은 깨끗하게 유지하면서 여백에 진정감을 줍니다."
            variant="reed"
            recommendation="차분한 안정감"
          />
          <ConceptBlock
            id="botanical"
            label="I"
            name="보태니컬 컷"
            summary="실제 WebP 자연 이미지나 사진 컷아웃을 쓰는 경우의 배치입니다. 이미지가 들어가지만 중앙 카드의 집중도는 유지합니다."
            variant="botanical"
            recommendation="사진 적용 참고"
          />
          <ConceptBlock
            id="sage"
            label="J"
            name="세이지 라이트"
            summary="자연색을 아주 옅게 깔고 식물 그림자를 흐리게 넣은 방식입니다. 첫 화면에 바로 적용한다면 가장 균형이 좋습니다."
            variant="sage"
            recommendation="적용 추천"
          />
          <ConceptBlock
            id="shadow"
            label="K"
            name="잎 그림자"
            summary="사진의 물성은 유지하되 실제 사진 파일 없이 빛과 잎 그림자만 표현합니다. 시각적으로 가장 조용하고 고급스럽습니다."
            variant="shadow"
            recommendation="가장 세련"
          />
          <ConceptBlock
            id="meadow"
            label="L"
            name="메도우 엣지"
            summary="긴 풀잎을 하단과 가장자리에만 두어 카드 집중도를 유지합니다. 자연 이미지가 명확하지만 화면은 복잡하지 않습니다."
            variant="meadow"
            recommendation="가장 차분"
          />
        </div>
      </div>
    </main>
  );
}
