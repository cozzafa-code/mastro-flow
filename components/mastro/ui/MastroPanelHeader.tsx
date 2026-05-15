// components/mastro/ui/MastroPanelHeader.tsx
// ═══════════════════════════════════════════════════════════════════════════
// MASTRO PANEL HEADER — uno e uno solo
// Sostituisce le 15 implementazioni di header sparse nel codebase.
// Garantisce: sinistra ← (back), destra × (close), chip commessa opzionale.
// ═══════════════════════════════════════════════════════════════════════════
'use client';

import React from 'react';
import { ICO } from '@/components/mastro-constants';
import { FLIWOX, FLIWOX_FONT, FLIWOX_SHADOW } from '@/lib/fliwox-theme';

export interface MastroPanelHeaderProps {
  /** Titolo principale (es. "Preventivo", "Agenda", "Assistente AI") */
  title: string;
  /** Sottotitolo opzionale (es. "S-0062 · Mario Rossi") */
  subtitle?: string;

  /** Callback freccia indietro. Se omesso, prova window.history.back() */
  onBack?: () => void;
  /** Callback X chiusura totale. Se omesso, NON renderizza il bottone X */
  onClose?: () => void;

  /** Chip persistente "commessa attiva" (es. "S-0062"). Click → onCommessaTap */
  commessaCode?: string;
  onCommessaTap?: () => void;

  /** Icona accanto al titolo (chiave di ICO). Default: nessuna */
  iconKey?: keyof typeof ICO;
  /** Variante visuale */
  variant?: 'light' | 'navy';
  /** Slot azione destra extra (prima della X). Es. <button>...</button> */
  rightSlot?: React.ReactNode;
  /** Sticky in alto. Default true */
  sticky?: boolean;
}

const BTN = {
  width: 40, height: 40, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', userSelect: 'none' as const,
  WebkitTapHighlightColor: 'transparent',
  flexShrink: 0,
  transition: 'background 120ms ease',
};

export function MastroPanelHeader({
  title,
  subtitle,
  onBack,
  onClose,
  commessaCode,
  onCommessaTap,
  iconKey,
  variant = 'light',
  rightSlot,
  sticky = true,
}: MastroPanelHeaderProps) {
  const isNavy = variant === 'navy';
  const bg     = isNavy ? FLIWOX.navy : FLIWOX.surface;
  const fg     = isNavy ? FLIWOX.textOnNavy : FLIWOX.text;
  const fgDim  = isNavy ? 'rgba(255,255,255,0.7)' : FLIWOX.textDim;
  const btnBg  = isNavy ? 'rgba(255,255,255,0.12)' : FLIWOX.surfaceDim;
  const btnFg  = isNavy ? '#FFFFFF' : FLIWOX.navy;
  const border = isNavy ? 'rgba(255,255,255,0.10)' : FLIWOX.divider;

  const handleBack = () => {
    if (onBack) return onBack();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 0 : undefined,
        zIndex: 20,
        background: bg,
        borderBottom: `1px solid ${border}`,
        boxShadow: sticky ? FLIWOX_SHADOW.sm : 'none',
        fontFamily: FLIWOX_FONT,
      }}
    >
      {/* RIGA PRINCIPALE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        minHeight: 56,
      }}>
        {/* SX: ← BACK (sempre presente) */}
        <button
          type="button"
          aria-label="Indietro"
          onClick={handleBack}
          style={{ ...BTN, background: btnBg, border: 'none' }}
          onMouseDown={(e) => (e.currentTarget.style.background = isNavy ? 'rgba(255,255,255,0.20)' : FLIWOX.divider)}
          onMouseUp={(e)   => (e.currentTarget.style.background = btnBg)}
          onMouseLeave={(e)=> (e.currentTarget.style.background = btnBg)}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
               stroke={btnFg} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            {ICO.back}
          </svg>
        </button>

        {/* CENTRO: titolo + sottotitolo */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          {iconKey && (
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: isNavy ? 'rgba(255,255,255,0.12)' : FLIWOX.amberSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                   stroke={isNavy ? '#FFF' : FLIWOX.amber}
                   strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {ICO[iconKey]}
              </svg>
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 700, color: fg,
              lineHeight: 1.15,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </div>
            {subtitle && (
              <div style={{
                fontSize: 11.5, fontWeight: 500, color: fgDim,
                marginTop: 2, lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* DX: slot extra + X (se onClose) */}
        {rightSlot}
        {onClose && (
          <button
            type="button"
            aria-label="Chiudi"
            onClick={onClose}
            style={{ ...BTN, background: btnBg, border: 'none' }}
            onMouseDown={(e) => (e.currentTarget.style.background = isNavy ? 'rgba(255,255,255,0.20)' : FLIWOX.divider)}
            onMouseUp={(e)   => (e.currentTarget.style.background = btnBg)}
            onMouseLeave={(e)=> (e.currentTarget.style.background = btnBg)}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                 stroke={btnFg} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              {ICO.x}
            </svg>
          </button>
        )}
      </div>

      {/* CHIP COMMESSA ATTIVA (riga 2, solo se commessaCode) */}
      {commessaCode && (
        <div style={{
          padding: '0 12px 10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button
            type="button"
            onClick={onCommessaTap}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: isNavy ? 'rgba(255,255,255,0.14)' : FLIWOX.amberSoft,
              color: isNavy ? '#FFF' : FLIWOX.amber.replace('5C', '00'),
              border: 'none',
              borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              letterSpacing: 0.3,
              cursor: onCommessaTap ? 'pointer' : 'default',
              fontFamily: FLIWOX_FONT,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              {ICO.folder}
            </svg>
            {commessaCode}
            {onCommessaTap && (
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                {ICO.chevronRight}
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default MastroPanelHeader;
