import { describe, it, expect } from 'vitest';
import { styleTypes } from '@/data/questions';

/**
 * OG 이미지 라우트 + generateMetadata 로직 시뮬레이션.
 * 실제 ImageResponse 렌더링은 Edge 환경 필요하므로,
 * 입력→출력 매핑(스타일 키 조회, fallback, URL 생성)을 검증.
 */

// OG 라우트의 스타일 조회 로직 재현
function resolveOgData(styleKey: string) {
  const style = styleTypes[styleKey];
  return {
    emoji: style?.emoji ?? '🧭',
    name: style?.name ?? '청렴 스타일',
    description: style?.description ?? '나의 업무 스타일을 알아보세요',
  };
}

// generateMetadata의 메타데이터 생성 로직 재현
function resolveMetadata(styleKey: string) {
  const style = styleTypes[styleKey];
  const defaultTitle = '나의 청렴 스타일은?';
  const defaultDesc = '재미로 알아보는 청렴 스타일 자기발견 테스트';

  const title = style ? `${style.emoji} ${style.name} — 나의 청렴 스타일` : defaultTitle;
  const description = style?.description ?? defaultDesc;
  const ogImagePath = style
    ? `/api/og?style=${encodeURIComponent(styleKey)}`
    : '/api/og';

  return { title, description, ogImagePath };
}

// ── 1. OG 이미지: 8유형 모두 정상 조회 ──
describe('OG 이미지 데이터 조회', () => {
  const allStyleKeys = Object.keys(styleTypes);

  it('8개 유형이 정의되어 있음', () => {
    expect(allStyleKeys.length).toBe(8);
  });

  it.each(allStyleKeys)('유형 "%s" → 이모지, 이름, 설명 모두 존재', (key) => {
    const data = resolveOgData(key);
    expect(data.emoji).not.toBe('🧭');
    expect(data.name).not.toBe('청렴 스타일');
    expect(data.description).not.toBe('나의 업무 스타일을 알아보세요');
    expect(data.emoji.length).toBeGreaterThan(0);
    expect(data.name.length).toBeGreaterThan(0);
    expect(data.description.length).toBeGreaterThan(0);
  });

  it('존재하지 않는 키 → fallback 값 반환', () => {
    const data = resolveOgData('nonexistent-key');
    expect(data.emoji).toBe('🧭');
    expect(data.name).toBe('청렴 스타일');
    expect(data.description).toBe('나의 업무 스타일을 알아보세요');
  });

  it('빈 문자열 키 → fallback 값 반환', () => {
    const data = resolveOgData('');
    expect(data.emoji).toBe('🧭');
    expect(data.name).toBe('청렴 스타일');
  });
});

// ── 2. generateMetadata: 동적 OG 태그 생성 ──
describe('generateMetadata 메타데이터 생성', () => {
  it.each(Object.keys(styleTypes))('유형 "%s" → 제목에 이모지+유형명 포함', (key) => {
    const meta = resolveMetadata(key);
    const style = styleTypes[key]!;

    expect(meta.title).toBe(`${style.emoji} ${style.name} — 나의 청렴 스타일`);
    expect(meta.description).toBe(style.description);
    expect(meta.ogImagePath).toBe(`/api/og?style=${encodeURIComponent(key)}`);
  });

  it('스타일 없을 때 → 기본 제목/설명', () => {
    const meta = resolveMetadata('');
    expect(meta.title).toBe('나의 청렴 스타일은?');
    expect(meta.description).toBe('재미로 알아보는 청렴 스타일 자기발견 테스트');
    expect(meta.ogImagePath).toBe('/api/og');
  });

  it('OG 이미지 경로가 상대 경로 (metadataBase에 위임)', () => {
    const meta = resolveMetadata('principle-transparent-independent');
    expect(meta.ogImagePath).not.toContain('http');
    expect(meta.ogImagePath).toMatch(/^\/api\/og/);
  });

  it('스타일 키에 특수문자가 있어도 URL 인코딩됨', () => {
    // 현재 스타일 키에 특수문자는 없지만, 하이픈이 포함된 키 테스트
    const meta = resolveMetadata('principle-transparent-independent');
    expect(meta.ogImagePath).toContain('principle-transparent-independent');
  });
});

// ── 3. 공유 URL에서 OG가 올바르게 매칭되는 시나리오 ──
describe('공유 링크 → OG 태그 시나리오', () => {
  it('테스트 완료 후 공유: style 파라미터에서 메타데이터 생성', () => {
    // 공유 URL: /result?style=flexible-cautious-cooperative&p=-2&t=-3&i=-1&a=...
    const shareUrl = new URL('/result?style=flexible-cautious-cooperative&p=-2&t=-3&i=-1&a=1,2,3,0,1,2,3,0,1,2,3,0,1,2,3', 'http://localhost');
    const styleKey = shareUrl.searchParams.get('style')!;

    const meta = resolveMetadata(styleKey);
    const style = styleTypes[styleKey]!;

    expect(meta.title).toContain('온건한 조정자');
    expect(meta.title).toContain('🕊️');
    expect(meta.description).toBe(style.description);
  });

  it('style 파라미터가 없는 URL → 기본 OG', () => {
    const url = new URL('/result?p=1&t=2&i=3&a=0,0,0,0,0,0,0,0,0,0,0,0,0,0,0', 'http://localhost');
    const styleKey = url.searchParams.get('style') ?? '';

    const meta = resolveMetadata(styleKey);
    expect(meta.title).toBe('나의 청렴 스타일은?');
  });

  it('8유형 각각의 공유 링크에서 고유한 OG 제목 생성', () => {
    const titles = new Set<string>();
    for (const key of Object.keys(styleTypes)) {
      const meta = resolveMetadata(key);
      titles.add(meta.title);
    }
    expect(titles.size).toBe(8);
  });
});
