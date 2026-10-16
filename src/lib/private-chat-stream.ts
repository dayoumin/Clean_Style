import { readPrivateChatReply } from '@/lib/chat-reply';
import type { PiiType } from '@/lib/sanitize';

/** Buffer before crossing the HTTP boundary, then emit only the masked completed reply. */
export function createPrivateChatStream(
  source: ReadableStream<Uint8Array>,
  options: { signal?: AbortSignal; detected?: PiiType[] } = {},
): ReadableStream<Uint8Array> {
  const abort = new AbortController();
  const onAbort = () => abort.abort();
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      options.signal?.addEventListener('abort', onAbort, { once: true });
      if (options.signal?.aborted) abort.abort();
      try {
        const reply = await readPrivateChatReply(source, abort.signal);
        if (abort.signal.aborted || cancelled) return;
        const detected = [...new Set([...(options.detected ?? []), ...reply.detected])];
        if (detected.length) emit({ pii_warning: detected });
        emit({ token: reply.answer });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        if (!abort.signal.aborted && !cancelled) {
          emit({ error: 'AI_SERVICE_ERROR' });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        }
      } finally {
        options.signal?.removeEventListener('abort', onAbort);
        if (!cancelled) controller.close();
      }
    },
    cancel() { cancelled = true; abort.abort(); },
  });
}
