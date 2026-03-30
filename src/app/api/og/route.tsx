import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { styleTypes } from '@/data/questions';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const styleKey = searchParams.get('style') ?? '';
  const style = styleTypes[styleKey];

  const emoji = style?.emoji ?? '🧭';
  const name = style?.name ?? '청렴 스타일';
  const description = style?.description ?? '나의 업무 스타일을 알아보세요';

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
          청렴 스타일 테스트 결과
        </div>

        <div style={{ fontSize: 72, marginBottom: 16, display: 'flex' }}>{emoji}</div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 12,
            display: 'flex',
          }}
        >
          {name}
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
