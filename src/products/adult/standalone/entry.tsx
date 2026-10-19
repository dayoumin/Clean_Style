import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomePage from '../pages/home-page';
import TestPage from '../pages/test-page';
import ResultContent from '../pages/ResultClient';
import PublicLayout from '@/app/(public)/layout';
import { useLocation } from './navigation';
import { getSaved } from './runtime';

function App() {
  const location = useLocation();
  const path = location.split('?')[0];
  const [message, setMessage] = useState('');
  useEffect(() => {
    const listener = (event: Event) => setMessage((event as CustomEvent<string>).detail);
    window.addEventListener('standalone-notice', listener);
    return () => window.removeEventListener('standalone-notice', listener);
  }, []);
  useEffect(() => {
    const main = document.querySelector('main');
    main?.scrollTo(0, 0);
  }, [location]);
  const entry = getSaved(new URLSearchParams(location.split('?')[1]).get('hid') ?? '');
  return <><PublicLayout>
    {path === '/test' ? <TestPage /> : path === '/result' && entry ? <ResultContent key={entry.id} /> : <HomePage />}
  </PublicLayout>{message && <div role="status" aria-live="polite" className="standalone-notice">
    {message}<button type="button" aria-label="알림 닫기" onClick={() => setMessage('')}>×</button>
  </div>}</>;
}
createRoot(document.getElementById('app')!).render(<App />);
