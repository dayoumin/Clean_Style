'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DiagnosticCard } from '@/components/DiagnosticCard';
import BottomSheet from '@/components/BottomSheet';
import HistoryList from '@/components/HistoryList';
import { APP_COPY } from '@/data/appVariant';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { adultCommonArtwork } from '@/diagnostics/adult-integrity/artwork';
import AdultArtwork from '../components/AdultArtwork';
import { AdultIcon, AdultStyleIcon, type AdultIconName } from '../components/AdultIcon';

const infoChips: { icon: AdultIconName; title: string; detail: string }[] = [
  { icon: 'document', title: '15개 상황', detail: '업무 중 겪을 수 있는 15가지 상황에 대해 답해보는 테스트입니다.' },
  { icon: 'clock', title: '약 3분', detail: '잠깐 시간을 내어 일상 속 선택을 돌아보세요. 자신의 속도로 편하게 답하면 됩니다.' },
  { icon: 'heart', title: '정답 없음', detail: '정답·오답이 없는 테스트입니다. 생각대로 편하게 선택하세요.' },
];

const featureCards = [
  { href: '/test', icon: 'spark' as const, emoji: '✨', title: APP_COPY.primaryDiagnosticTitle, description: APP_COPY.primaryDiagnosticDescription },
  { href: '/respect/check?entry=action', icon: 'handshake' as const, emoji: '🤝', title: '내 행동 점검', description: '일상 속 올바른 실천 확인', enabled: RESPECT_FEATURE_ENABLED },
  { href: '/respect/check?entry=experience', icon: 'document' as const, emoji: '📑', title: '일터 존중 점검', description: '상호 존중하는 문화 만들기', enabled: RESPECT_FEATURE_ENABLED },
];

const historyIcons = {
  buttonClassName: 'adult-history-action',
  renderStyleIcon: (styleKey: string) => <AdultStyleIcon styleKey={styleKey} />,
  chatIcon: <AdultIcon name="chat" size={12} className="inline align-baseline" />,
};

export default function HomePage() {
  return RESPECT_FEATURE_ENABLED ? <VariantHomePage /> : <CleanStyleHomePage />;
}

function CleanStyleHomePage() {
  const [openChip, setOpenChip] = useState<number | null>(null);
  return (
    <div className="adult-home animate-fade-in">
      <h1>나의 청렴<br />스타일은?</h1>
      <AdultArtwork src={adultCommonArtwork.home} className="adult-home-art" eager />
      <div className="adult-home-facts">
        {infoChips.map((chip, i) => (
          <button key={chip.title} type="button" onClick={() => setOpenChip(i)} aria-label={chip.title + ' 안내'}>
            <AdultIcon name={chip.icon} size={23} /><span>{chip.title}</span>
          </button>
        ))}
      </div>
      <Link href="/test" className="adult-primary-action">테스트 시작하기 <AdultIcon name="arrow" size={19} /></Link>
      <div className="adult-home-history"><HistoryList {...historyIcons} /></div>
      {openChip !== null && (
        <BottomSheet title={infoChips[openChip].title} onClose={() => setOpenChip(null)}>
          <div className="px-6 pb-6 pt-4">
            <p className="mb-6 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{infoChips[openChip].detail}</p>
            <button type="button" onClick={() => setOpenChip(null)} className="adult-primary-action w-full">확인</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function VariantHomePage() {
  const visibleCards = featureCards.filter(card => card.enabled !== false);
  return (
    <div className="adult-home animate-fade-in">
      <section className="flex flex-1 flex-col justify-center py-4">
        <AdultArtwork src={adultCommonArtwork.home} className="adult-plus-art" eager />
        <h1 id="home-start" tabIndex={-1} className="!mt-3 !text-center !text-[25px]">{APP_COPY.homePrompt}</h1>
        <div className="mt-5 grid gap-3">
          {visibleCards.map(card => (
            <DiagnosticCard key={card.href} href={card.href} emoji={card.emoji} title={card.title} description={card.description}
              icon={<AdultIcon name={card.icon} size={27} />} iconClassName="bg-[var(--color-primary-soft)] text-[var(--color-primary)]" className="adult-diagnostic-card" />
          ))}
        </div>
      </section>
      <HistoryList buttonLabel="청렴 결과 보기" emptyFocusTargetId="home-start" {...historyIcons} />
    </div>
  );
}
