import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLIENT_ID_HEADER, CLIENT_ID_STORAGE_KEY } from '@/lib/constants';
import { getClientIdHeader, getOrCreateClientId } from '@/lib/client-id';

function installStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial) data.set(CLIENT_ID_STORAGE_KEY, initial);

  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }),
  });
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => '12345678-1234-4234-9234-123456789abc'),
  });

  return data;
}

describe('client id helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('기존 유효한 clientId를 재사용', () => {
    installStorage('client-aaaaaaaaaaaa');
    expect(getOrCreateClientId()).toBe('client-aaaaaaaaaaaa');
    expect(getClientIdHeader()).toEqual({ [CLIENT_ID_HEADER]: 'client-aaaaaaaaaaaa' });
  });

  it('저장된 값이 헤더에 부적합하면 새 clientId로 교체', () => {
    const data = installStorage('client<script>alert(1)</script>');
    expect(getOrCreateClientId()).toBe('12345678-1234-4234-9234-123456789abc');
    expect(data.get(CLIENT_ID_STORAGE_KEY)).toBe('12345678-1234-4234-9234-123456789abc');
  });

  it('브라우저가 아니면 헤더를 보내지 않음', () => {
    expect(getClientIdHeader()).toEqual({});
  });
});
