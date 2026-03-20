'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { styleTypes, type StyleType } from '@/data/questions';
import type { AnalysisResult } from '@/types/analysis';
import StyleRadarChart from '@/components/StyleRadarChart';

// ── 모듈 레벨 상수 ──

const TIP_CONFIG = [
  { key: 'research' as const, label: '연구비·데이터', boxCls: 'tip-box-research', labelCls: 'tip-label-research' },
  { key: 'admin' as const, label: '구매·계약', boxCls: 'tip-box-admin', labelCls: 'tip-label-admin' },
  { key: 'relation' as const, label: '외부 협력·소통', boxCls: 'tip-box-relation', labelCls: 'tip-label-relation' },
] as const;

// ── 마크다운 헬퍼 (렌더 밖에서 정의) ──

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const boldify = (s: string) =>
  escapeHtml(s).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

// ── 컴포넌트 ──

function LoadingDots() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-2xl">
        🤖
      </div>
      <p className="mb-3 text-base font-semibold text-[var(--color-text)]">
        AI가 분석 중이에요
      </p>
      <div className="flex gap-1.5">
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
        <div className="loading-dot h-2 w-2 rounded-full bg-[var(--color-primary-accent)]" />
      </div>
      <p className="mt-4 text-[13px] text-[var(--color-text-muted)]">잠깐이면 돼요!</p>
    </div>
  );
}

function StructuredResult({ data, style }: { data: AnalysisResult; style: StyleType }) {
  return (
    <>
      {/* 스타일 요약 */}
      <div className="result-card">
        <h3 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">
          📌 당신의 청렴 스타일: {style.name}
        </h3>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {data.styleSummary}
        </p>
      </div>

      {/* 강점 */}
      <div className="result-card">
        <h3 className="mb-4 text-[15px] font-bold text-[var(--color-text)]">💪 이런 점이 강점이에요</h3>
        <ul className="space-y-2">
          {data.strengths.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="mt-0.5 font-bold text-[var(--color-success)]">✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 주의 포인트 */}
      <div className="result-card">
        <h3 className="mb-4 text-[15px] font-bold text-[var(--color-text)]">⚠️ 이런 상황에서 한 번 더 생각해보세요</h3>
        <ul className="space-y-2">
          {data.cautions.map((c, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="mt-0.5 text-[var(--color-warning)]">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 업무별 팁 */}
      <div className="result-card">
        <h3 className="mb-4 text-[15px] font-bold text-[var(--color-text)]">💡 업무별 꿀팁</h3>
        <div className="space-y-2.5">
          {TIP_CONFIG.map((tip) => (
            <div key={tip.key} className={`tip-box ${tip.boxCls}`}>
              <p className={`mb-1.5 text-xs font-bold ${tip.labelCls}`}>{tip.label}</p>
              <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{data.tips[tip.key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 한마디 */}
      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] p-6 text-center">
        <p className="mb-2 text-2xl">🌟</p>
        <p className="text-[15px] font-semibold leading-relaxed text-[var(--color-primary)]">
          {data.message}
        </p>
      </div>
    </>
  );
}

function MarkdownResult({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++}>
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={key++}>{trimmed.replace('### ', '')}</h3>);
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.replace('- ', ''));
    } else {
      flushList();
      elements.push(<p key={key++} dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />);
    }
  }
  flushList();

  return <div className="ai-result result-card mb-6">{elements}</div>;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [markdownFallback, setMarkdownFallback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const styleKey = searchParams.get('style') ?? '';
  const scores = {
    principle: Number(searchParams.get('p') ?? 0),
    transparency: Number(searchParams.get('t') ?? 0),
    independence: Number(searchParams.get('i') ?? 0),
  };
  const answers = (searchParams.get('a') ?? '').split(',').map(Number);

  const style: StyleType | undefined = styleTypes[styleKey];

  useEffect(() => {
    if (!style) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchAnalysis() {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ styleKey, scores, answers }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('API 응답 오류');

        const data = await res.json();

        if (!controller.signal.aborted) {
          if (data.structured) {
            setAnalysisData(data.analysis);
          } else {
            setMarkdownFallback(data.analysis);
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchAnalysis();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 실패 시 무시
    }
  };

  const handleRetry = () => {
    window.location.href = '/';
  };

  if (loading) return <LoadingDots />;

  if (error) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="mb-4 text-lg text-[var(--color-text)]">{error}</p>
        <button
          onClick={handleRetry}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[#2a2a4e]"
        >
          처음으로
        </button>
      </div>
    );
  }

  if (!style) return null;

  return (
    <div className="animate-slide-up">
      {/* 유형 카드 */}
      <div className="result-gradient relative z-0 mb-6 rounded-[var(--radius-xl)] p-10 text-center text-white shadow-lg">
        <div className="mb-3 text-[56px]">{style.emoji}</div>
        <h1 className="mb-1.5 text-[28px] font-extrabold tracking-tight">{style.name}</h1>
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[14px] font-semibold backdrop-blur-sm">
          {style.subtitle}
        </span>
        <p className="mt-4 text-[14px] leading-relaxed text-white/75">
          {style.description}
        </p>
      </div>

      {/* 성향 레이더 차트 */}
      <div className="result-card mb-6 p-5">
        <h3 className="mb-3 text-center text-[13px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          성향 분석
        </h3>
        <StyleRadarChart scores={scores} />
      </div>

      {/* AI 분석 결과 */}
      {analysisData && <StructuredResult data={analysisData} style={style} />}
      {markdownFallback && <MarkdownResult text={markdownFallback} />}

      {/* 하단 버튼 */}
      <div className="flex gap-2.5">
        <button
          onClick={handleRetry}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-4 text-center text-[15px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-card)]"
        >
          다시 하기
        </button>
        <button
          onClick={handleShare}
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-4 text-center text-[15px] font-semibold text-white hover:bg-[#2a2a4e]"
        >
          {copied ? '복사됨!' : '결과 공유 →'}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        이 테스트는 재미있는 자기발견을 위한 것이며,
        <br />
        공식적인 평가와는 무관합니다.
      </p>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingDots />}>
      <ResultContent />
    </Suspense>
  );
}
