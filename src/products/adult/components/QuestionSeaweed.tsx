'use client';

import { useEffect, useRef, useState } from 'react';

/** Uses existing empty space; never adds height or covers answer text. */
export default function QuestionSeaweed({ questionIndex }: { questionIndex: number }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [position, setPosition] = useState({ top: 0, visible: false });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    const page = image?.parentElement;
    const content = page?.querySelector('.adult-question-content');
    const main = page?.closest('main');
    if (!image || !page || !content || !main) return;

    const measure = () => {
      const pageBox = page.getBoundingClientRect();
      const contentBottom = content.getBoundingClientRect().bottom;
      const viewportBottom = window.visualViewport
        ? window.visualViewport.offsetTop + window.visualViewport.height
        : window.innerHeight;
      const bottom = Math.min(pageBox.bottom, main.getBoundingClientRect().bottom, viewportBottom);
      const height = image.offsetHeight;
      const top = Math.min(contentBottom + 14, bottom - 12 - height);
      // At most a small overlap with the button's empty bottom edge.
      let visible = top >= contentBottom - 12 && top >= pageBox.top;
      if (visible) {
        const right = pageBox.right - 12;
        const left = right - image.offsetWidth;
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while (visible && (node = walker.nextNode())) {
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          visible = !Array.from(range.getClientRects()).some(rect =>
            left < rect.right && right > rect.left && top < rect.bottom && top + height > rect.top,
          );
        }
      }
      const relativeTop = Math.max(0, top - pageBox.top);
      setPosition(previous => previous.top === relativeTop && previous.visible === visible
        ? previous : { top: relativeTop, visible });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(page);
    observer.observe(content);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [questionIndex]);

  return (
    <img ref={imageRef} src="/images/adult-integrity/question-seaweed-2d.png" alt="" aria-hidden="true"
      width={48} height={68} decoding="async" draggable={false} className="adult-question-seaweed"
      style={{ top: position.top, visibility: position.visible && !failed ? 'visible' : 'hidden' }}
      onError={() => setFailed(true)} />
  );
}
