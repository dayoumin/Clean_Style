import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { Buffer } from 'node:buffer';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAdultResultArtwork } from '@/diagnostics/adult-integrity/artwork';
import { ADULT_THEME_COLOR } from '@/products/adult/theme';
import { styleTypes } from '@/diagnostics/adult-integrity';
import { formatNamedResultTitle, normalizeDisplayName } from '@/lib/display-name';
import { APP_COPY, IS_STUDENT_VARIANT } from '@/data/appVariant';

type AssetsBinding = { fetch: (request: Request) => Promise<Response> };

// Worker가 자기 workers.dev 주소를 다시 fetch하면 Cloudflare가 막을 수 있어(1042), 정적 자산 바인딩으로 직접 읽는다.
async function fetchStaticAsset(url: URL): Promise<Response> {
  // next dev의 ASSETS 프록시는 이전 빌드 산출물을 가리킬 수 있으므로 현재 public 파일을 읽는다.
  if (process.env.NODE_ENV === 'development') {
    return fetch(url, { signal: AbortSignal.timeout(3000) });
  }
  let assets: AssetsBinding | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    assets = (env as { ASSETS?: AssetsBinding }).ASSETS;
  } catch {
    // next dev·테스트처럼 Cloudflare 컨텍스트가 없는 환경은 일반 fetch로 읽는다.
  }
  // 바인딩 호출 실패는 자기 Worker 재호출로 우회하지 않는다.
  if (assets) return assets.fetch(new Request(url, { signal: AbortSignal.timeout(3000) }));
  return fetch(url, { signal: AbortSignal.timeout(3000) });
}

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
        const image = await fetchStaticAsset(new URL(artworkPath.replace('.webp', '.png'), request.url));
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
      {
        width: 1200, height: 630,
        // 일시적인 그림 접근 실패가 하루 동안 이모지로 고정되지 않게 한다.
        headers: { 'Cache-Control': `public, max-age=${artworkPath && !artworkData ? 60 : 86400}` },
      },
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
