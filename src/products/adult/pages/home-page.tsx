'use client';

import { useState } from 'react';
import Link from 'next/link';
import BottomSheet from '@/components/BottomSheet';
import HistoryList from '@/components/HistoryList';
import { RESPECT_FEATURE_ENABLED } from '@/data/workplaceRespectFeature';
import { adultCommonArtwork } from '@/diagnostics/adult-integrity/artwork';
import AdultArtwork from '../components/AdultArtwork';
import { AdultIcon, AdultStyleIcon, type AdultIconName } from '../components/AdultIcon';

const infoChips: { icon: AdultIconName; title: string; detail: string }[] = [
  { icon: 'document', title: '15개 상황', detail: '업무 중 겪을 수 있는 15가지 상황에 대해 답해보는 테스트입니다.' },
  { icon: 'clock', title: '약 3분', detail: '잠깐 시간을 내어 일상 속 선택을 돌아보세요. 자신의 속도로 편하게 답하면 됩니다.' },
  { icon: 'heart', title: '오답 없음', detail: '정답·오답이 없는 테스트입니다. 생각대로 편하게 선택하세요.' },
];

const historyIcons = {
  buttonClassName: 'adult-history-action',
  renderStyleIcon: (styleKey: string) => <AdultStyleIcon styleKey={styleKey} />,
  chatIcon: <AdultIcon name="chat" size={12} className="inline align-baseline" />,
};

export default function HomePage() {
  return <CleanStyleHomePage />;
}

function CleanStyleHomePage() {
  const [openChip, setOpenChip] = useState<number | null>(null);
  const [titleImageFailed, setTitleImageFailed] = useState(false);
  return (
    <div className={`adult-home animate-fade-in${RESPECT_FEATURE_ENABLED ? ' adult-home-with-secondary' : ''}`}>
      <div className="adult-home-heading">
        <h1 id="home-start" tabIndex={-1} className={titleImageFailed ? undefined : 'adult-home-title-art'}>
          {titleImageFailed ? <>나의 청렴<br />스타일은?</> : (
            <>
              <span className="sr-only">나의 청렴 스타일은?</span>
              <img src="/images/integrity-home-title-smile.png" alt="" aria-hidden="true" width={1860} height={845} draggable={false} onError={() => setTitleImageFailed(true)} />
            </>
          )}
        </h1>
        {RESPECT_FEATURE_ENABLED && (
          <nav className="adult-home-secondary" aria-label="추가 점검">
            <Link href="/respect/check?entry=action" aria-label="내 행동 점검">
              <AdultIcon name="person-check" size={24} /><span>내 행동</span>
            </Link>
            <Link href="/respect/check?entry=experience" aria-label="일터 존중 점검">
              <AdultIcon name="people-heart" size={24} /><span>일터 존중</span>
            </Link>
          </nav>
        )}
      </div>
      <AdultArtwork src={adultCommonArtwork.home} className="adult-home-art" eager />
      <div className="adult-home-facts">
        {infoChips.map((chip, i) => (
          <button key={chip.title} type="button" onClick={() => setOpenChip(i)} aria-label={chip.title + ' 안내'}>
            <AdultIcon name={chip.icon} size={23} /><span>{chip.title}</span>
          </button>
        ))}
      </div>
      <Link href="/test" className="adult-primary-action">시작하기</Link>
      <div className="adult-home-history"><HistoryList emptyFocusTargetId="home-start" {...historyIcons} /></div>
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
