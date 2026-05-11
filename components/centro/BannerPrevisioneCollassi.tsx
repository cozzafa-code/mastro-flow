"use client";
// components/centro/BannerPrevisioneCollassi.tsx
// Banner alert proattivi + mini grafico saturazione 14 giorni

import React, { useState } from "react";
import { usePrevisioneCollassi } from "../../hooks/usePrevisioneCollassi";

const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

const LIVELLO_COLOR: Record<string, string> = {
  libero: '#E5EAF0',
  normale: '#A7E5E5',
  carico: '#FBBF24',
  pieno: '#FB923C',
  saturo: '#DC2626',
};

interface Props {
  aziendaId: string;
}

export default function BannerPrevisioneCollassi({ aziendaId }: Props) {
  const { giorni, alerts, loading } = usePrevisioneCollassi(aziendaId);
  const [expanded, setExpanded] = useState(false);

  if (loading) return null;
  if (alerts.length === 0 && giorni.every(g => g.saturazione_pct < 50)) return null;

  const hasBlock = alerts.some(a => a.severity === 'block');
  const hasWarn = alerts.some(a => a.severity === 'warn');
  const headerCol = hasBlock ? RED : hasWarn ? AMBER : TEAL_DEEP;
  const headerBg = hasBlock ? '#FEE2E2' : hasWarn ? '#FEF3C7' : '#E1F5EE';

  return (
    <div style={{ background: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden' as const, border: `2px solid ${headerCol}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ background: headerBg, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={headerCol} strokeWidth={2.5}>
          {hasBlock ? <><circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></> : <path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/>}
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: headerCol }}>PREVISIONE COLLASSI · 14 GIORNI</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginTop: 2 }}>
            {alerts.length > 0 ? alerts[0].message : 'Tutto sotto controllo'}
          </div>
        </div>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={headerCol} strokeWidth={2} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: 14 }}>
          {alerts.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: MUTED, marginBottom: 6 }}>TUTTI GLI ALERT</div>
              {alerts.slice(1).map((a, i) => {
                const col = a.severity === 'block' ? RED : a.severity === 'warn' ? AMBER : TEAL_DEEP;
                const bg = a.severity === 'block' ? '#FEE2E2' : a.severity === 'warn' ? '#FEF3C7' : '#E1F5EE';
                return (
                  <div key={i} style={{ background: bg, borderLeft: `3px solid ${col}`, padding: '6px 10px', borderRadius: 6, marginBottom: 4, fontSize: 11, color: col, fontWeight: 600 }}>
                    {a.message}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: MUTED, marginBottom: 6 }}>SATURAZIONE PROSSIMI 14 GIORNI</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2, alignItems: 'end', height: 80, marginBottom: 6 }}>
            {giorni.map((g, i) => {
              const h = g.capacita_ore === 0 ? 6 : Math.max(8, (g.saturazione_pct / 100) * 75);
              return (
                <div key={i} title={`${g.giorno_label} · ${g.ore_pianificate}h / ${g.capacita_ore}h · ${g.saturazione_pct}%`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}>
                  <div style={{ width: '100%', height: h, background: LIVELLO_COLOR[g.livello], borderRadius: '3px 3px 0 0', minHeight: 6 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2 }}>
            {giorni.map((g, i) => (
              <div key={i} style={{ fontSize: 8, color: MUTED, textAlign: 'center' as const, fontWeight: 600 }}>
                {new Date(g.data).getDate()}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, fontSize: 9, color: MUTED, flexWrap: 'wrap' as const }}>
            <LegendDot color={LIVELLO_COLOR.libero} label="< 40%" />
            <LegendDot color={LIVELLO_COLOR.normale} label="40-75%" />
            <LegendDot color={LIVELLO_COLOR.carico} label="75-90%" />
            <LegendDot color={LIVELLO_COLOR.pieno} label="90-100%" />
            <LegendDot color={LIVELLO_COLOR.saturo} label="> 100% SATURO" />
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
      <span>{label}</span>
    </div>
  );
}
