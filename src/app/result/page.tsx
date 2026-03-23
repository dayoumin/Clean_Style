'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { styleTypes, type StyleType } from '@/data/questions';
import type { AnalysisResult } from '@/types/analysis';
import StyleRadarChart from '@/components/StyleRadarChart';
import type html2canvasType from 'html2canvas';

// ── 모듈 레벨 상수 ──

const TIP_CONFIG = [
  { key: 'research' as const, label: '연구비·데이터', boxCls: 'tip-box-research', labelCls: 'tip-label-research' },
  { key: 'admin' as const, label: '구매·계약', boxCls: 'tip-box-admin', labelCls: 'tip-label-admin' },
  { key: 'relation' as const, label: '외부 협력·소통', boxCls: 'tip-box-relation', labelCls: 'tip-label-relation' },
] as const;

const AI_LOADING_STEPS = [
  '답변 패턴을 분석하고 있어요...',
  '청렴 성향을 해석하고 있어요...',
  '맞춤 조언을 작성하고 있어요...',
  '거의 다 됐어요!',
] as const;

const AI_BUTTON_CLS = 'mt-2 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] py-3.5 text-center text-[13px] font-semibold text-[var(--color-primary-accent)] hover:bg-[var(--color-primary-muted)]';

// ── 마크다운 헬퍼 ──

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
        결과를 준비하고 있어요
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

function Accordion({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="result-card">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-[15px] font-bold text-[var(--color-text)]">{title}</h3>
        <span className={`text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function BottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="animate-slide-up w-full max-w-md overflow-hidden rounded-[20px] bg-[var(--color-bg)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-[16px] font-bold text-[var(--color-text)]">🤖 AI 조언</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function AnalysisModalContent({ data }: { data: AnalysisResult }) {
  return (
    <>
      <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-5 py-4 text-center">
        <p className="text-[15px] font-semibold leading-relaxed text-[var(--color-primary)]">
          🌟 {data.message}
        </p>
      </div>

      <Accordion title="💪 이런 점이 강점이에요" defaultOpen>
        <ul className="space-y-2">
          {data.strengths.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="mt-0.5 font-bold text-[var(--color-success)]">✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="⚠️ 한 번 더 생각해보세요">
        <ul className="space-y-2">
          {data.cautions.map((c, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="mt-0.5 text-[var(--color-warning)]">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="💡 업무별 꿀팁">
        <div className="space-y-2.5">
          {TIP_CONFIG.map((tip) => (
            <div key={tip.key} className={`tip-box ${tip.boxCls}`}>
              <p className={`mb-1.5 text-xs font-bold ${tip.labelCls}`}>{tip.label}</p>
              <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{data.tips[tip.key]}</p>
            </div>
          ))}
        </div>
      </Accordion>
    </>
  );
}

function MarkdownContent({ text }: { text: string }) {
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

  return <div className="ai-result">{elements}</div>;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const captureRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [markdownFallback, setMarkdownFallback] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [aiError, setAiError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const styleKey = searchParams.get('style') ?? '';
  const scores = {
    principle: Number(searchParams.get('p') ?? 0),
    transparency: Number(searchParams.get('t') ?? 0),
    independence: Number(searchParams.get('i') ?? 0),
  };
  const answers = (searchParams.get('a') ?? '').split(',').map(Number);

  const style: StyleType | undefined = styleTypes[styleKey];

  const fetchAnalysis = async () => {
    if (aiLoading || analysisData || markdownFallback) return;
    setAiLoading(true);
    setAiError(false);
    setAiLoadingText(AI_LOADING_STEPS[0]);

    // 기존 타이머 정리 후 단계별 텍스트 변경
    timersRef.current.forEach(clearTimeout);
    timersRef.current = AI_LOADING_STEPS.slice(1).map((text, i) =>
      setTimeout(() => setAiLoadingText(text), (i + 1) * 2500)
    );

    const controller = new AbortController();
    abortRef.current = controller;
    const userContext = sessionStorage.getItem('userContext') ?? '';

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleKey, scores, answers, userContext: userContext || undefined }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('API 응답 오류');

      const data = await res.json();

      if (data.structured) {
        setAnalysisData(data.analysis);
      } else {
        setMarkdownFallback(data.analysis);
      }
      setShowModal(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setAiError(true);
    } finally {
      timersRef.current.forEach(clearTimeout);
      setAiLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 2000);
      timersRef.current.push(t);
    } catch {
      // 클립보드 실패 시 무시
    }
  };

  const handleCapture = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const { default: html2canvas } = await import('html2canvas') as { default: typeof html2canvasType };
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `청렴스타일_${style?.name ?? '결과'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // 캡쳐 실패 시 무시
    } finally {
      setCapturing(false);
    }
  };

  const handleRetry = () => {
    sessionStorage.removeItem('userContext');
    router.push('/');
  };

  if (!style) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="mb-4 text-lg text-[var(--color-text)]">잘못된 접근입니다.</p>
        <button
          onClick={handleRetry}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-white hover:bg-[#2a2a4e]"
        >
          처음으로
        </button>
      </div>
    );
  }

  const hasAnalysis = analysisData || markdownFallback;

  return (
    <>
      <div className="animate-slide-up" ref={captureRef}>
        {/* 유형 카드 */}
        <div className="result-gradient relative z-0 mb-6 overflow-hidden rounded-[var(--radius-xl)] px-6 py-7 text-center text-white shadow-lg">
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-8 top-4 h-3 w-3 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="mb-2 text-[48px]">{style.emoji}</div>
            <h1 className="mb-1.5 text-[26px] font-extrabold tracking-tight">{style.name}</h1>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold backdrop-blur-sm">
              {style.subtitle}
            </span>
            <p className="mt-3 text-[13px] leading-relaxed text-white/75">
              {style.description}
            </p>
          </div>
        </div>

        {/* 성향 레이더 차트 */}
        <div className="result-card relative mb-6 px-3 pb-2 pt-5">
          <span className="absolute left-4 top-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            성향 분석
          </span>
          <StyleRadarChart scores={scores} />
        </div>

        {/* 균형 상태 안내 */}
        {(() => {
          const axisNames: Record<string, string> = { principle: '원칙↔유연', transparency: '투명↔신중', independence: '독립↔협력' };
          const balanced = Object.entries(scores).filter(([, v]) => v === 0).map(([k]) => axisNames[k]);
          if (balanced.length === 0) return null;
          return (
            <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-4 py-3">
              <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-primary-accent)]">균형 </span>
                {balanced.join(', ')} 축이 균형 상태예요. 상황에 따라 양쪽 성향을 유연하게 활용하는 타입입니다.
              </p>
            </div>
          );
        })()}

        {/* AI 스타일 요약 */}
        {analysisData?.styleSummary && (
          <div className="result-card">
            <h3 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">
              📌 당신의 청렴 스타일
            </h3>
            <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {analysisData.styleSummary}
            </p>
          </div>
        )}

        {/* AI 조언 버튼 */}
        {aiLoading ? (
          <div className="mt-2 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-primary-muted)] bg-[var(--color-primary-soft)] px-4 py-4 text-center">
            <span className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary-accent)]">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent" />
              🤖 AI 분석 중
            </span>
            <p className="text-[12px] text-[var(--color-text-muted)] transition-all duration-300">
              {aiLoadingText}
            </p>
          </div>
        ) : hasAnalysis ? (
          <button onClick={() => setShowModal(true)} className={AI_BUTTON_CLS}>
            🤖 AI 맞춤 조언 보기
          </button>
        ) : aiError ? (
          <button onClick={fetchAnalysis} className={AI_BUTTON_CLS}>
            🤖 AI 조언 다시 시도
          </button>
        ) : (
          <button onClick={fetchAnalysis} className={AI_BUTTON_CLS}>
            🤖 AI 맞춤 조언 받기
          </button>
        )}

        {/* 푸터 */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          이 테스트는 재미있는 자기발견을 위한 것이며,
          <br />
          공식적인 평가와는 무관합니다.
        </p>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={handleRetry}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3.5 text-center text-[13px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-card)]"
        >
          다시 하기
        </button>
        <button
          onClick={handleCopyLink}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-3.5 text-center text-[13px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-card)]"
        >
          {copied ? '복사됨!' : '링크 복사'}
        </button>
        <button
          onClick={handleCapture}
          disabled={capturing}
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3.5 text-center text-[13px] font-semibold text-white hover:bg-[#2a2a4e] disabled:opacity-40"
        >
          {capturing ? '저장 중...' : '캡쳐하기'}
        </button>
      </div>

      {/* AI 조언 모달 */}
      {showModal && (analysisData || markdownFallback) && (
        <BottomSheet onClose={() => setShowModal(false)}>
          {analysisData && <AnalysisModalContent data={analysisData} />}
          {markdownFallback && <MarkdownContent text={markdownFallback} />}
        </BottomSheet>
      )}
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingDots />}>
      <ResultContent />
    </Suspense>
  );
}
