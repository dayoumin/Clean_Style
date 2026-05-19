import { CLIENT_ID_HEADER, CLIENT_ID_STORAGE_KEY } from '@/lib/constants';
import { CLIENT_ID_PATTERN } from '@/lib/rate-limit';

function fallbackId() {
  return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing && CLIENT_ID_PATTERN.test(existing)) return existing;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : fallbackId();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return '';
  }
}

export function getClientIdHeader(): Record<string, string> {
  const clientId = getOrCreateClientId();
  return clientId ? { [CLIENT_ID_HEADER]: clientId } : {};
}
