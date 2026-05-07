// lib/home/useDragReorder.ts
// Hook drag & drop per riordino card via pointer events (mouse + touch)
'use client';

import { useRef, useCallback } from 'react';

type DragState = {
  el: HTMLElement | null;
  offsetY: number;
  placeholder: HTMLElement | null;
  containerEl: HTMLElement | null;
};

export function useDragReorder(
  onReorder: (newOrder: string[]) => void,
) {
  const drag = useRef<DragState>({ el: null, offsetY: 0, placeholder: null, containerEl: null });

  const startDrag = useCallback((e: React.PointerEvent, cardEl: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();

    const container = cardEl.parentElement;
    if (!container) return;

    const rect = cardEl.getBoundingClientRect();
    drag.current = {
      el: cardEl,
      offsetY: e.clientY - rect.top,
      placeholder: null,
      containerEl: container,
    };

    cardEl.style.position = 'fixed';
    cardEl.style.zIndex = '1000';
    cardEl.style.width = `${rect.width}px`;
    cardEl.style.left = `${rect.left}px`;
    cardEl.style.top = `${rect.top}px`;
    cardEl.style.pointerEvents = 'none';
    cardEl.style.opacity = '0.85';
    cardEl.style.transform = 'scale(0.97)';
    cardEl.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.4)';

    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      height: ${rect.height}px;
      background: transparent;
      border: 2px dashed #1E3A5F;
      border-radius: 10px;
      opacity: 0.4;
    `;
    container.insertBefore(placeholder, cardEl);
    drag.current.placeholder = placeholder;

    document.body.style.userSelect = 'none';

    const handleMove = (ev: PointerEvent) => {
      const { el, offsetY, placeholder: ph, containerEl } = drag.current;
      if (!el || !ph || !containerEl) return;
      el.style.top = `${ev.clientY - offsetY}px`;

      const cards = Array.from(containerEl.querySelectorAll<HTMLElement>('[data-card-id]'))
        .filter(c => c !== el);
      let inserted = false;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (ev.clientY < mid) {
          if (ph.nextSibling !== card) containerEl.insertBefore(ph, card);
          inserted = true;
          break;
        }
      }
      if (!inserted && cards.length > 0) {
        const last = cards[cards.length - 1];
        if (ph.previousSibling !== last) containerEl.insertBefore(ph, last.nextSibling);
      }
    };

    const handleUp = () => {
      const { el, placeholder: ph, containerEl } = drag.current;
      if (!el || !ph || !containerEl) return;

      ph.parentNode?.insertBefore(el, ph);
      ph.remove();

      el.style.cssText = '';

      const newOrder = Array.from(containerEl.querySelectorAll<HTMLElement>('[data-card-id]'))
        .map(c => c.dataset.cardId!)
        .filter(Boolean);
      onReorder(newOrder);

      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      drag.current = { el: null, offsetY: 0, placeholder: null, containerEl: null };
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }, [onReorder]);

  return { startDrag };
}
