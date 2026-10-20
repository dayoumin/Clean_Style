const data = JSON.parse(document.getElementById('standalone-data')!.textContent!);
export const assets: Record<string, string> = data.assets;
export function asset(path: string): string {
  if (path.startsWith('data:')) return path;
  const embedded = assets[path];
  if (!embedded) throw new Error(`Image missing from HTML: ${path}`);
  return embedded;
}
