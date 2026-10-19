import { toBlob } from 'html-to-image';
import { createExportFooter, EXPORT_FOOTER_GAP } from './export-footer';

function copyAppearance(source: Element, target: Element) {
  const style = getComputedStyle(source);
  const destination = (target as HTMLElement | SVGElement).style;
  for (const property of Array.from(style)) destination.setProperty(property, style.getPropertyValue(property));
  destination.animation = 'none';
  destination.transition = 'none';
  for (let index = 0; index < target.children.length; index++) copyAppearance(source.children[index], target.children[index]);
}

// Freeze the real rendered sections at their measured positions. This avoids a
// second result template and prevents flex/reflow changes when controls are omitted.
export async function createResultImage(root: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await Promise.all(Array.from(root.querySelectorAll('img')).map(async image => {
    await image.decode();
    if (!image.naturalWidth) throw Error('Result image unavailable');
  }));
  if (!root.isConnected) throw Error('Result was closed');
  const main = root.closest('main')!;
  const frame = main.getBoundingClientRect();
  const bounds = root.getBoundingClientRect();
  const mainStyle = getComputedStyle(main);
  const insetX = bounds.left - frame.left - parseFloat(mainStyle.borderLeftWidth);
  const insetY = bounds.top - frame.top + main.scrollTop - parseFloat(mainStyle.borderTopWidth);
  const snapshot = main.cloneNode(false) as HTMLElement;
  copyAppearance(main, snapshot);
  const body = root.cloneNode(false) as HTMLElement;
  // Root styles include diagnostic tokens inherited from the adult experience.
  const rootStyle = getComputedStyle(root);
  for (const property of Array.from(rootStyle)) body.style.setProperty(property, rootStyle.getPropertyValue(property));
  Object.assign(body.style, { position: 'absolute', left: `${insetX}px`, top: `${insetY}px`,
    width: `${bounds.width}px`, height: `${bounds.height}px`, margin: '0', animation: 'none', transform: 'none', display: 'block', opacity: '1' });
  let contentBottom = 0;
  for (const section of Array.from(root.children)) {
    if (!(section instanceof HTMLElement) || section.matches('.adult-result-actions, [role="status"]')) continue;
    const rect = section.getBoundingClientRect();
    const clone = section.cloneNode(true) as HTMLElement;
    copyAppearance(section, clone);
    Object.assign(clone.style, { position: 'absolute', left: `${rect.left - bounds.left}px`, top: `${rect.top - bounds.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', flex: 'none' });
    body.append(clone);
    contentBottom = Math.max(contentBottom, rect.bottom - bounds.top);
  }
  const width = Math.ceil(frame.width);
  const footer = createExportFooter();
  const footerTop = contentBottom + EXPORT_FOOTER_GAP;
  Object.assign(footer.style, { position: 'absolute', left: '0', top: `${footerTop}px`, width: `${bounds.width}px` });
  body.append(footer);
  Object.assign(snapshot.style, { position: 'relative', left: '0', top: '0', width: `${width}px`, height: '0',
    minHeight: '0', maxHeight: 'none', margin: '0', display: 'block', overflow: 'hidden', transform: 'none', animation: 'none' });
  snapshot.dataset.resultCapture = 'true';
  snapshot.setAttribute('aria-hidden', 'true');
  snapshot.inert = true;
  snapshot.append(body);
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-100000px', top: '0', pointerEvents: 'none' });
  host.setAttribute('aria-hidden', 'true');
  host.append(snapshot);
  document.body.append(host);
  try {
    // The generated footer also needs resolved inherited font sizes before the
    // renderer clones it without page styles (font-size is excluded below).
    copyAppearance(footer, footer);
    // Measure the new typography at the live result width, so wrapping grows the
    // export instead of clipping it. Omitted controls never leave a blank footer.
    const height = Math.ceil(parseFloat(mainStyle.borderTopWidth) + insetY + footerTop + footer.getBoundingClientRect().height
      + parseFloat(mainStyle.paddingBottom) + parseFloat(mainStyle.borderBottomWidth));
    snapshot.style.height = `${height}px`;
    const blob = await toBlob(snapshot, { width, height, pixelRatio: 2, skipFonts: true,
      backgroundColor: mainStyle.backgroundColor,
      // Keep the exact inline font size; the library otherwise reduces it by 0.1px.
      includeStyleProperties: Array.from(getComputedStyle(snapshot)).filter(property => property !== 'font-size'),
      style: { position: 'relative', left: '0', top: '0' } });
    if (!blob) throw Error('PNG generation failed');
    return blob;
  } finally { host.remove(); }
}
