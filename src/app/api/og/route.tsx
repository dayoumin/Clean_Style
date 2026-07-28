import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { styleTypes } from '@/diagnostics/adult-integrity';
import { formatNamedResultTitle, normalizeDisplayName } from '@/lib/display-name';
import { APP_COPY, IS_STUDENT_VARIANT } from '@/data/appVariant';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const styleKey = searchParams.get('style') ?? '';
  const displayName = normalizeDisplayName(searchParams.get('name'));
  const style = IS_STUDENT_VARIANT ? undefined : styleTypes[styleKey];

  const emoji = style?.emoji ?? '🧭';
  const name = style
    ? formatNamedResultTitle(displayName, style.name)
    : IS_STUDENT_VARIANT ? APP_COPY.title : '청렴 스타일';
  const description = style?.description ?? APP_COPY.primaryDiagnosticDescription;

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
