"use client";
// components/centro/CommessaCardOperativa.tsx
// Card commessa con TUTTI i dati operativi - usata da CentroProduzione e CentroMontaggi

import React from "react";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface CommessaOp {
  id: string; code: string; cliente: string; cognome?: string | null;
  fase: string; tipo_infisso?: string | null; piano_edificio?: string | null;
  difficolta_salita?: string | null; mezzo_salita?: string | null; urgenza?: string | null;
  materiali_status: string; materiali_perc: number;
  produzione_iniziata_at?: string | null; produzione_completata_at?: string | null;
  fattura_acconto_pagata_at?: string | null;
  totale_finale?: number; n_vani?: number; ore_previste?: number;
  indirizzo?: string | null;
  data_montaggio_prevista?: string | null;
  squadra_prevista?: string | null;
}

interface Conflitto {
  severity: 'block' | 'warn';
  code: string;
  message: string;
}

interface Props {
  cm: CommessaOp;
  onClick?: () => void;
  compact?: boolean;
  showIndirizzo?: boolean;
  conflitti?: Conflitto[];
  onAutoSchedule?: (id: string) => void;
}

export default function CommessaCardOperativa({ cm, onClick, compact, showIndirizzo, conflitti, onAutoSchedule }: Props) {
  const matCol = cm.materiali_status === 'completo' ? TEAL : cm.materiali_status === 'parziale' ? AMBER : cm.materiali_status === 'in_attesa' ? RED : MUTED;
  const rischio = computeRischio(cm);

  const matBadge = cm.materiali_status === 'completo' ? { bg: '#D1FAE5', fg: '#065F46', l: 'PRONTA' } :
                cm.materiali_status === 'parziale' ? { bg: '#FEF3C7', fg: '#92400E', l: `PARZ ${cm.materiali_perc}%` } :
                cm.materiali_status === 'in_attesa' ? { bg: '#FEE2E2', fg: '#991B1B', l: 'ATTESA' } :
                { bg: '#F1F4F7', fg: MUTED, l: 'NO ORD' };

  const urg = (cm.urgenza || 'media').toLowerCase();
  const urgenzaCol = urg === 'alta' ? RED : urg === 'bassa' ? MUTED : AMBER;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${matCol}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cm.code} · {cm.cliente} {cm.cognome || ''}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
            {cm.tipo_infisso || 'No tipo'} · {cm.n_vani || 0} vani · {cm.ore_previste || 0}h
          </div>
          {showIndirizzo && cm.indirizzo && (
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg>
              {cm.indirizzo}
            </div>
          )}
        </div>
        <span style={{ background: matBadge.bg, color: matBadge.fg, fontSize: 9, padding: '4px 8px', borderRadius: 5, fontWeight: 700, whiteSpace: 'nowrap' }}>{matBadge.l}</span>
      </div>

      {conflitti && conflitti.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {conflitti.map((c, i) => (
            <div key={i} style={{ 
              background: c.severity === 'block' ? '#FEE2E2' : '#FEF3C7',
              borderLeft: `3px solid ${c.severity === 'block' ? RED : AMBER}`,
              padding: '6px 10px', borderRadius: 6, marginBottom: 4,
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,
            }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={c.severity === 'block' ? '#991B1B' : '#92400E'} strokeWidth={2.5}>
                {c.severity === 'block' ? <><circle cx={12} cy={12} r={10}/><line x1={15} y1={9} x2={9} y2={15}/><line x1={9} y1={9} x2={15} y2={15}/></> : <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></>}
              </svg>
              <span style={{ color: c.severity === 'block' ? '#991B1B' : '#92400E', fontWeight: 600 }}>{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {!compact && onAutoSchedule && !cm.data_montaggio_prevista && (
        <button onClick={(e) => { e.stopPropagation(); onAutoSchedule(cm.id); }}
          style={{
            width: '100%', padding: '9px 0', marginBottom: 10,
            background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP})`, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          AUTO SCHEDULING AI
        </button>
      )}

      {!compact && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {cm.piano_edificio && cm.piano_edificio !== '' && <Pill label={`Piano ${cm.piano_edificio}`} bg="#F1F4F7" fg={TEXT} />}
          {cm.mezzo_salita && cm.mezzo_salita !== '' && <Pill label={cm.mezzo_salita} bg="#EFF6FF" fg="#1E40AF" />}
          {cm.difficolta_salita && cm.difficolta_salita !== '' && <Pill label={cm.difficolta_salita} bg="#FFFBEB" fg="#92400E" />}
          <Pill label={`Pr. ${urg}`} bg={urgenzaCol + '22'} fg={urgenzaCol} />
        </div>
      )}

      {cm.data_montaggio_prevista && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#EFF6FF', borderRadius: 6, marginBottom: 10, fontSize: 10 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ color: '#1E40AF', fontWeight: 600 }}>Montaggio:</span>
          <span style={{ color: '#1E40AF', fontWeight: 700 }}>{new Date(cm.data_montaggio_prevista).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
          {cm.squadra_prevista && <span style={{ marginLeft: 'auto', background: '#1E40AF', color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{cm.squadra_prevista}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <Check ok={!!cm.fattura_acconto_pagata_at} label="Acconto" />
        <Check ok={cm.materiali_status === 'completo'} partial={cm.materiali_status === 'parziale'} label="Materiali" />
        <Check ok={!!cm.produzione_completata_at} running={!!cm.produzione_iniziata_at && !cm.produzione_completata_at} label="Prod." />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTED, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>Avanz. materiali</span>
          <span style={{ color: matCol, fontWeight: 700 }}>{cm.materiali_perc}%</span>
        </div>
        <div style={{ height: 10, background: '#F1F4F7', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${cm.materiali_perc}%`, height: '100%', background: `linear-gradient(90deg, ${matCol}aa, ${matCol})`, borderRadius: 5 }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: rischio.bg, borderRadius: 6, fontSize: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: rischio.color }} />
          <span style={{ color: rischio.fg, fontWeight: 600 }}>RISCHIO RITARDO</span>
        </div>
        <span style={{ color: rischio.fg, fontWeight: 700 }}>{rischio.label}</span>
      </div>

      {rischio.warning && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF3C7', borderRadius: 6, fontSize: 10, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>
          <span style={{ fontWeight: 600 }}>{rischio.warning}</span>
        </div>
      )}
    </div>
  );
}

function computeRischio(cm: any) {
  if (cm.materiali_status === 'in_attesa' && cm.fase === 'produzione') {
    return { label: 'ALTO', color: RED, bg: '#FEE2E2', fg: '#991B1B', warning: 'Materiali mancanti in produzione' };
  }
  if (cm.materiali_status === 'parziale') {
    return { label: 'MEDIO', color: AMBER, bg: '#FEF3C7', fg: '#92400E', warning: cm.materiali_perc < 50 ? 'Meno del 50% materiali arrivati' : null };
  }
  if (cm.materiali_status === 'in_attesa') {
    return { label: 'MEDIO', color: AMBER, bg: '#FEF3C7', fg: '#92400E', warning: null };
  }
  return { label: 'BASSO', color: TEAL, bg: '#E1F5EE', fg: TEAL_DEEP, warning: null };
}

function Check({ ok, label, partial, running }: any) {
  const col = ok ? TEAL : partial ? AMBER : running ? '#3B82F6' : MUTED;
  const bg = ok ? '#E1F5EE' : partial ? '#FEF3C7' : running ? '#EFF6FF' : '#F1F4F7';
  return (
    <div style={{ flex: 1, background: bg, padding: '5px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={3}>
        {ok ? <polyline points="20 6 9 17 4 12"/> : partial ? <circle cx={12} cy={12} r={10}/> : running ? <circle cx={12} cy={12} r={4} fill={col}/> : <circle cx={12} cy={12} r={10}/>}
      </svg>
      <span style={{ fontSize: 9, color: col, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Pill({ label, bg, fg }: any) {
  return <span style={{ background: bg, color: fg, fontSize: 9, padding: '3px 7px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>;
}
