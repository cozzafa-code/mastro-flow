'use client';
// components/WidgetButton.tsx
// Bottone collassabile stile fliwoX (come Tendaggi). Click → apre WidgetHost.

import { useState } from 'react';
import type { WidgetId, WidgetExportData } from '@/lib/widgets/widgetTypes';
import { getWidget } from '@/lib/widgets/widgetRegistry';
import WidgetHost from './WidgetHost';

interface Props {
  widgetId: WidgetId;
  vano: any;
  onChange: (patch: Record<string, any>) => void;
  onExport?: (data: WidgetExportData) => void;
  defaultOpen?: boolean;
  locked?: boolean; // se piano utente < minPlan, mostra lucchetto
}

const T = {
  acc: '#28A0A0',
  accDeep: '#156060',
  bdr: '#C8E4E4',
  bdrLight: '#EEF8F8',
  text: '#0D1F1F',
  muted: '#888',
};

export default function WidgetButton({
  widgetId,
  vano,
  onChange,
  onExport,
  defaultOpen = false,
  locked = false,
}: Props) {
  const widget = getWidget(widgetId);
  const [open, setOpen] = useState<boolean>(defaultOpen);

  // Difensivo: se widget non esiste nel registry, non renderizzare (evita crash)
  if (!widget) {
    if (typeof console !== 'undefined') {
      console.warn('[WidgetButton] widgetId sconosciuto:', widgetId);
    }
    return null;
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: `1px solid ${T.bdr}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header bottone (sempre visibile, click → toggle) */}
      <button
        type="button"
        onClick={() => !locked && setOpen((o) => !o)}
        style={{
          width: '100%',
          background: open ? T.bdrLight : '#FFFFFF',
          border: 'none',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: locked ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          opacity: locked ? 0.55 : 1,
        }}
      >
        {/* Icona */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.acc}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={widget.iconSvg} />
        </svg>

        {/* Label + sublabel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: T.text,
              letterSpacing: 0.2,
            }}
          >
            {widget.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: T.muted,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {widget.sublabel}
          </div>
        </div>

        {/* Lucchetto se locked, altrimenti freccia */}
        {locked ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.muted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.acc}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Contenuto espanso */}
      {open && !locked && (
        <div style={{ padding: 12, background: T.bdrLight }}>
          <WidgetHost
            widgetId={widgetId}
            vano={vano}
            onChange={onChange}
            onExport={onExport}
          />
        </div>
      )}
    </div>
  );
}
