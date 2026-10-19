import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createResultImage } from './result-image';
import { getSaved } from './runtime';

export default function ExportActions({ historyId }: { historyId: string }) {
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const readyAt = useRef(performance.now() + 1000);
  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  async function save(event: MouseEvent<HTMLButtonElement>) {
    const entry = getSaved(historyId);
    const root = event.currentTarget.closest<HTMLElement>('.adult-integrity-result');
    if (busyRef.current || !entry || !root) return;
    busyRef.current = true; setBusy(true); setError('');
    const wasInert = root.inert;
    root.inert = true;
    try {
      // Let the initial chart/fade settle; freeze tab selection during the capture.
      const delay = readyAt.current - performance.now();
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      const blob = await createResultImage(root);
      if (!mounted.current || !getSaved(historyId)) return;
      const url = URL.createObjectURL(blob);
      const filename = `clean-style-screen-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      setDownloadName(filename);
      setDownloadUrl(url);
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.append(link); link.click(); link.remove();
    } catch {
      if (mounted.current) setError('이미지를 만들지 못했어요. 결과는 그대로 있으니 다시 시도해 주세요.');
    } finally {
      root.inert = wasInert;
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return <><button type="button" onClick={save} disabled={busy} aria-busy={busy}>
    {busy ? '이미지 만드는 중…' : '이미지로 저장'}
  </button>
    {error && <p role="status" className="standalone-export-message">{error}</p>}
    {downloadUrl && !error && <p role="status" className="standalone-export-message">
      PNG를 만들었어요. 다운로드가 시작되지 않으면 <a href={downloadUrl} download={downloadName}>다시 다운로드</a>해 주세요.
    </p>}
  </>;
}
