export function detectDeviceType(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/android/i.test(ua) && !/mobile/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android.*mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function normalizeReferrer(raw: string): string {
  try {
    const url = new URL(raw);
    return (url.origin + url.pathname).slice(0, 200);
  } catch {
    return raw.slice(0, 200);
  }
}
