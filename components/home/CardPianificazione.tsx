"use client";
// components/home/CardPianificazione.tsx
// Tile home che mostra le commesse in fase di pianificazione produzione/montaggio
// [galassia] Legge da useMastroData invece di query diretta - nessuna dipendenza da auth
import React, { useMemo } from "react";
import { useMastroData } from "@/hooks/useMastroData";

interface Props {
  aziendaId: string;
  onClick?: (commessaId: string) => void;
}

const MAT_COLORS: Record<string, { bg: string; border: string; text: string; lbl: string }> = {
  completo:   { bg: '#E1F5EE', border: '#28A0A0', text: '#0F6E56', lbl: 'PRONTA' },
  parziale:   { bg: '#FEF3C7', border: '#D97706', text: '#92400E', lbl: 'PARZIALE' },
  in_attesa:  { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', lbl: 'IN ATTESA' },
  nessuno:    { bg: '#F1F4F7', border: '#5C6B7A', text: '#5C6B7A', lbl: 'NO ORDINI' },
};

const FASI_PIANIF = ['ordine', 'acconto_pagato', 'produzione', 'montaggio'];

export default function CardPianificazione({ aziendaId, onClick }: Props) {
  const { state } = useMastroData();

  const commesse = useMemo(() => {
    const src = state.commesse && state.commesse.length > 0 ? state.commesse : [];
    return src.filter((c: any) => FASI_PIANIF.includes(c.fase));
  }, [state.commesse]);

  const pronte   = commesse.filter((c: any) => c.materiali_status === 'completo').length;
  const parziali = commesse.filter((c: any) => c.materiali_status === 'parziale').length;
  const attesa   = commesse.filter((c: any) => !c.materiali_status || c.materiali_status === 'in_attesa' || c.materiali_status === 'nessuno').length;
  const totale   = commesse.length;

  const NAVY = '#1E3A5F';
  const MUTED = '#5C6B7A';
  const BORDER = '#E2E8F0';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2}>
            <rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/>
            <line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1F33' }}>Pianificazione</span>
        </div>
        <span style={{ fontSize: 11, color: MUTED }}>{totale} attive</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '8px 6px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0F6E56', letterSpacing: 0.3 }}>PRONTE</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0F6E56', marginTop: 2 }}>{pronte}</div>
        </div>
        <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '8px 6px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#92400E', letterSpacing: 0.3 }}>PARZIALI</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#92400E', marginTop: 2 }}>{parziali}</div>
        </div>
        <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '8px 6px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#991B1B', letterSpacing: 0.3 }}>IN ATTESA</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#991B1B', marginTop: 2 }}>{attesa}</div>
        </div>
      </div>

      {commesse.length === 0 ? (
        <div style={{ fontSize: 11, color: MUTED, textAlign: 'center' as const, padding: '8px 0' }}>
          Nessuna commessa in pianificazione
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
          {commesse.slice(0, 4).map((c: any) => {
            const mc = MAT_COLORS[c.materiali_status || 'nessuno'] || MAT_COLORS.nessuno;
            return (
              <div key={c.id} onClick={() => onClick?.(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                  borderBottom: `1px solid ${BORDER}`, cursor: onClick ? 'pointer' : 'default' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: mc.border, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0F1F33' }}>{c.code}</span>
                  <span style={{ fontSize: 10, color: MUTED, marginLeft: 4 }}>{c.cliente || ''}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: mc.text, background: mc.bg,
                  padding: '2px 5px', borderRadius: 3 }}>{mc.lbl}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
        {[{lbl:'Attesa',c:'#DC2626'},{lbl:'Parziale',c:'#D97706'},{lbl:'Pronta',c:'#28A0A0'}].map(({lbl,c}) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 9, color: MUTED }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
