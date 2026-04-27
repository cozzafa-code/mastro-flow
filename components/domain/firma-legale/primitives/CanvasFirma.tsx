'use client';

// ============================================================
// MASTRO — Primitive: CanvasFirma
// Canvas SVG-quality per firma a dito/penna touch o mouse
// HiDPI ready (devicePixelRatio scaling)
// ============================================================

import { useEffect, useRef, useImperativeHandle, forwardRef, type CSSProperties } from 'react';
import { MC, MR, MS } from '@/constants/design-system';

export interface CanvasFirmaHandle {
  toDataURL: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

interface Props {
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  bg?: string;
  border?: string;
  onChange?: (hasContent: boolean) => void;
}

const CanvasFirma = forwardRef<CanvasFirmaHandle, Props>(function CanvasFirma(
  { height = 180, strokeColor = MC.text, strokeWidth = 2.5, bg = MC.card, border, onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasContentRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  // Setup canvas + listeners
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // HiDPI scaling
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr;
    c.height = c.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = c.getBoundingClientRect();
      const t = (e as TouchEvent).touches?.[0] ?? (e as MouseEvent);
      return {
        x: (t as any).clientX - rect.left,
        y: (t as any).clientY - rect.top,
      };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawingRef.current = true;
      const p = getPos(e);
      lastRef.current = p;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      if (!hasContentRef.current) {
        hasContentRef.current = true;
        onChange?.(true);
      }
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawingRef.current) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      lastRef.current = p;
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawingRef.current = false;
    };

    c.addEventListener('mousedown', onDown);
    c.addEventListener('mousemove', onMove);
    c.addEventListener('mouseup', onUp);
    c.addEventListener('mouseleave', onUp);
    c.addEventListener('touchstart', onDown, { passive: false });
    c.addEventListener('touchmove', onMove, { passive: false });
    c.addEventListener('touchend', onUp, { passive: false });

    return () => {
      c.removeEventListener('mousedown', onDown);
      c.removeEventListener('mousemove', onMove);
      c.removeEventListener('mouseup', onUp);
      c.removeEventListener('mouseleave', onUp);
      c.removeEventListener('touchstart', onDown);
      c.removeEventListener('touchmove', onMove);
      c.removeEventListener('touchend', onUp);
    };
  }, [strokeColor, strokeWidth, onChange]);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
    clear: () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx?.clearRect(0, 0, c.width, c.height);
      hasContentRef.current = false;
      onChange?.(false);
    },
    isEmpty: () => !hasContentRef.current,
  }));

  const wrapStyle: CSSProperties = {
    background: bg,
    borderRadius: MR.lg,
    padding: 4,
    boxShadow: MS.button,
    border: border ?? `2px dashed ${MC.border}`,
    position: 'relative',
  };

  const canvasStyle: CSSProperties = {
    width: '100%',
    height,
    borderRadius: MR.md,
    touchAction: 'none',
    display: 'block',
    cursor: 'crosshair',
  };

  // Placeholder icona penna al centro (visibile finché vuoto)
  const placeholderStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
    opacity: hasContentRef.current ? 0 : 0.3,
    transition: 'opacity 0.2s',
  };

  return (
    <div style={wrapStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={placeholderStyle}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={MC.mutedSoft} strokeWidth="1.5" strokeLinecap="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </div>
    </div>
  );
});

export default CanvasFirma;
