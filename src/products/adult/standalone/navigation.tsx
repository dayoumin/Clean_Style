import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { buildResultUrl } from '@/lib/utils';
import { calculateResult } from './model';
import { openResult, getSaved } from './runtime';

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => { window.removeEventListener('hashchange', listener); window.removeEventListener('popstate', listener); };
};
export function useLocation() {
  return useSyncExternalStore(subscribe, () => window.location.hash.slice(1) || '/', () => '/');
}
function navigate(href: string, replace = false) {
  const url = new URL(href, 'https://standalone.invalid');
  let route = url.pathname;
  if (route === '/result') {
    const id = url.searchParams.get('hid') ?? '';
    const entry = openResult(id, url.searchParams.has('new') ? url.searchParams.get('name') ?? '' : undefined);
    if (!entry) route = '/';
    else {
      route += '?hid=' + encodeURIComponent(id);
    }
  }
  window.history[replace ? 'replaceState' : 'pushState'](null, '', '#' + route);
  window.dispatchEvent(new Event('hashchange'));
  window.scrollTo(0, 0);
}
const router = { push: (href: string) => navigate(href), replace: (href: string) => navigate(href, true) };
export const useRouter = () => router;
export function useSearchParams() {
  const route = useLocation();
  const params = new URLSearchParams(route.split('?')[1]);
  const entry = getSaved(params.get('hid') ?? '');
  if (!entry) return new URLSearchParams();
  const result = calculateResult(entry.answers);
  const values = new URLSearchParams(buildResultUrl(result.styleKey, result.scores, entry.answers, entry.id).split('?')[1]);
  if (entry.name) values.set('name', entry.name);
  return values;
}
export default function Link({ href = '/', onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={'#' + href} onClick={(event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); router.push(href);
    }
  }} />;
}
