// components/mobile/home/HomeCardWrapper.tsx
// Wrapper riusabile: header con num-badge + titolo + summary pill + chevron
// Gestisce: tap-to-expand, swipe orizzontale (prev/next), drag handle in edit mode
'use client';

import React, { useRef, useState } from 'react';

type Variant = 'default' | 'danger' | 'warning' | 'success' | 'accent';
type SummaryTone = 'default' | 'alert' | 'warn' | 'ok' | 'accent';

export type HomeCardWrapperProps = {
  id: string;
  num: number | string;
  title: string;
  variant?: Variant;
  summary?: { text: string; tone?: SummaryTone };
  link?: { label: string; onClick: () => void };
  expanded: boolean;
  editMode: boolean;
  onToggle: () => void;
  onSwipe: (direction: 'next' | 'prev') => void;
  onDragStart?: (e: React.PointerEvent) => void;
  children: React.ReactNode;
};

const SWIPE_THRESHOLD = 80;
const SWIPE_LOCK = 10;

const variantBg: Record<Variant, string> = {
  default: '#1E3A5F',
  danger:  '#991B1B',
  warning: '#92400E',
  success: '#065F46',
  accent:  '#2D4A6F',
};

const summaryStyle: Record<SummaryTone, React.CSSProperties> = {
  default: { background: '#FFFFFF', borderColor: '#CBD5E1', color: '#475A75' },
  alert:   { background: '#FEE2E2', borderColor: '#991B1B', color: '#991B1B' },
  warn:    { background: '#FEF3C7', borderColor: '#92400E', color: '#92400E' },
  ok:      { background: '#ECFDF5', borderColor: '#065F46', color: '#065F46' },
  accent:  { background: '#DBE6F1', borderColor: '#1E3A5F', color: '#1E3A5F' },
};

export function HomeCardWrapper(props: HomeCardWrapperProps) {
  const { id, num, title, variant = 'default', summary, link,
          expanded, editMode, onToggle, onSwipe, onDragStart, children } = props;

  const cardRef = useRef<HTMLDivElement>(null);
  const [swipe, setSwipe] = useState({ active: false, dx: 0, startX: 0, startY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-handle]')) return;
    if (target.closest('[data-no-swipe]')) return;
    setSwipe({ active: true, dx: 0, startX: e.clientX, startY: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!swipe.active || !cardRef.current) return;
    const dx = e.clientX - swipe.startX;
    const dy = e.clientY - swipe.startY;
    if (Math.abs(dy) > Math.abs(dx) + 10) {
      setSwipe(s => ({ ...s, active: false }));
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '';
      return;
    }
    if (Math.abs(dx) < SWIPE_LOCK) return;
    setSwipe(s => ({ ...s, dx }));
    cardRef.current.style.transform = `translateX(${dx * 0.4}px) rotate(${dx * 0.02}deg)`;
    cardRef.current.style.opacity = String(1 - Math.min(Math.abs(dx) / 400, 0.4));
  };

  const handlePointerUp = () => {
    if (!swipe.active || !cardRef.current) return;
    if (Math.abs(swipe.dx) >= SWIPE_THRESHOLD) {
      onSwipe(swipe.dx < 0 ? 'next' : 'prev');
    }
    cardRef.current.style.transform = '';
    cardRef.current.style.opacity = '';
    setSwipe({ active: false, dx: 0, startX: 0, startY: 0 });
  };

  const handleHeadClick = (e: React.MouseEvent) => {
    if (editMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-handle]')) return;
    if (target.closest('[data-link]')) return;
    onToggle();
  };

  return (
    <div
      ref={cardRef}
      data-card-id={id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        background: '#FFFFFF',
        border: editMode ? '1.5px dashed #1E3A5F' : '1px solid #94A3B8',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)',
        transition: swipe.active ? 'none' : 'transform 0.25s ease, opacity 0.2s ease',
        animation: editMode ? 'mastroWiggle 0.4s ease-in-out infinite alternate' : undefined,
      }}
    >
      <div
        onClick={handleHeadClick}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 14px',
          paddingBottom: expanded ? 10 : 13,
          background: '#F1F5F9',
          borderBottom: expanded ? '1px solid #CBD5E1' : 'none',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
          {editMode && (
            <div
              data-handle
              onPointerDown={onDragStart}
              style={{
                width: 26, height: 26, borderRadius: 5, background: '#1E3A5F', color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'grab', flexShrink: 0, touchAction: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
              </svg>
            </div>
          )}
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: variantBg[variant], color: '#FFF',
            fontSize: 12, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>{num}</div>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#0A1628',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</div>
        </div>

        {!expanded && summary && (
          <span style={{
            fontSize: 11, fontWeight: 800,
            border: '1px solid', borderRadius: 5, padding: '3px 8px',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
            marginRight: 8, flexShrink: 0,
            ...summaryStyle[summary.tone || 'default'],
          }}>{summary.text}</span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {expanded && link && !editMode && (
            <a
              data-link
              onClick={(e) => { e.stopPropagation(); link.onClick(); }}
              style={{
                fontSize: 12, fontWeight: 700, color: '#1E3A5F',
                textDecoration: 'none', cursor: 'pointer',
              }}
            >{link.label} â€º</a>
          )}
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={expanded ? '#1E3A5F' : '#475569'} strokeWidth={2.5}
            style={{
              transition: 'transform 0.25s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <div style={{
        maxHeight: expanded ? 1000 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        <div data-no-swipe style={{ padding: 14, background: '#FFFFFF' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
