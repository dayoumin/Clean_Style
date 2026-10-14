import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { Buffer } from 'node:buffer';
import { getAdultResultArtwork } from '@/diagnostics/adult-integrity/artwork';
import { ADULT_THEME_COLOR } from '@/products/adult/theme';
import { styleTypes } from '@/diagnostics/adult-integrity';
import { formatNamedResultTitle, normalizeDisplayName } from '@/lib/display-name';
import { APP_COPY, IS_STUDENT_VARIANT } from '@/data/appVariant';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const styleKey = searchParams.get('style') ?? '';
  const displayName = normalizeDisplayName(searchParams.get('name'));
  const style = !IS_STUDENT_VARIANT && Object.prototype.hasOwnProperty.call(styleTypes, styleKey) ? styleTypes[styleKey] : undefined;

  const emoji = style?.emoji ?? '🧭';
  const name = style
    ? formatNamedResultTitle(displayName, style.name)
    : IS_STUDENT_VARIANT ? APP_COPY.title : '청렴 스타일';
  const description = style?.description ?? APP_COPY.primaryDiagnosticDescription;


  if (!IS_STUDENT_VARIANT) {
    const artworkPath = getAdultResultArtwork(styleKey);
    let artworkData: string | undefined;
    if (artworkPath) {
      try {
        const image = await fetch(new URL(artworkPath.replace('.webp', '.png'), request.url), { signal: AbortSignal.timeout(3000) });
        if (image.ok) artworkData = 'data:image/png;base64,' + Buffer.from(await image.arrayBuffer()).toString('base64');
      } catch {
        // Result title and existing symbol remain available if the illustration cannot load.
      }
    }
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fbf7', color: '#263e36', padding: 70, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 700 }}>
          <div style={{ display: 'flex', color: ADULT_THEME_COLOR, fontSize: 25, fontWeight: 700, marginBottom: 28 }}>Clean Style</div>
          <div style={{ display: 'flex', fontSize: displayName ? 38 : 48, fontWeight: 800, lineHeight: 1.3, marginBottom: 22 }}>{name}</div>
          <div style={{ display: 'flex', fontSize: 25, color: '#53675f', lineHeight: 1.6 }}>{description}</div>
        </div>
        {artworkData
          ? <img src={artworkData} width={300} height={300} alt="" style={{ objectFit: 'contain', marginLeft: 24 }} />
          : <div style={{ display: 'flex', fontSize: 100, marginLeft: 30 }}>{emoji}</div>}
      </div>,
      { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400' } },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex' }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 50,
            padding: '8px 24px',
            marginBottom: 24,
            fontSize: 18,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
          }}
        >
          {IS_STUDENT_VARIANT ? '학생용 청렴 진단' : '청렴 스타일 테스트 결과'}
        </div>

        <div style={{ fontSize: 72, marginBottom: 16, display: 'flex' }}>{emoji}</div>

        <div
          style={{
            fontSize: displayName && style ? 42 : 48,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 12,
            display: 'flex',
          }}
        >
          {displayName && style ? (
            <>
              <span style={{ color: '#ffffff', display: 'flex' }}>&apos;</span>
              <span style={{ color: '#fde68a', display: 'flex' }}>{displayName}</span>
              <span style={{ color: '#ffffff', display: 'flex' }}>&apos;</span>
              <span style={{ display: 'flex' }}>님은 {style.name}</span>
            </>
          ) : name}
        </div>

        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 550,
            textAlign: 'center',
            lineHeight: 1.5,
            display: 'flex',
          }}
        >
          {description}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    },
  );
}
