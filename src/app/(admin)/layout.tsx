'use client';

import { useState, useCallback, useEffect } from 'react';

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [secret, setSecret] = useState('');

  const checkAuth = useCallback(() => {
    const token = getCookie('admin_token');
    if (!token) { setAuthed(false); return; }
    fetch('/api/admin/dashboard', { method: 'HEAD' })
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(checkAuth, [checkAuth]);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)]">
        <div className="text-sm text-[var(--color-text-muted)]">확인 중...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg-page)] text-center">
        <p className="text-lg font-semibold text-[var(--color-text)]">관리자 인증</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          document.cookie = `admin_token=${encodeURIComponent(secret)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict; Secure`;
          checkAuth();
        }} className="flex gap-2">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="비밀번호"
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            확인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
