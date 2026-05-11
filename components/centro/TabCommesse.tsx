"use client";
// components/centro/TabCommesse.tsx - Card visive grandi commesse cliente

import React, { useState, useMemo } from "react";
import { useCommesseCliente, type CommessaCliente } from "../../hooks/useDossierExtra";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

const FASE_META: Record<string, { col: string; bg: string; label: string; icon: string }> = {
  rilievo:         { col: MUTED,     bg: '#F1F4F7', label: 'RILIEVO',         icon: '📐' },
  preventivo:      { col: BLUE,      bg: '#DBEAFE', label: 'PREVENTIVO',      icon: '📄' },
  ordine:          { col: PURPLE,    bg: '#F3E8FF', label: 'ORDINE',          icon: '🤝' },
  acconto_pagato:  { col: AMBER,     bg: '#FEF3C7', label: 'ACCONTO PAGATO',  icon: '💰' },
  produzione:      { col: TEAL,      bg: '#E1F5EE', label: 'PRODUZIONE',      icon: '🏭' },
  montaggio:       { col: '#0EA5E9', bg: '#E0F2FE', label: 'MONTAGGIO',       icon: '🔧' },
  consegnato:      { col: TEAL_DEEP, bg: '#D1FAE5', label: 'CONSEGNATO',      icon: '📦' },
  completato:      { col: GREEN,     bg: '#D1FAE5', label: 'COMPLETATO',      icon: '✅' },
  annullato:       { col: RED,       bg: '#FEE2E2', label: 'ANNULLATO',       icon: '🚫' },
};

type Filtro = 'tutte' | 'attive' | 'completate' | 'problemi';

interface Props {
  clienteId: string;
  onApriCommessa?: (cmId: string) => void;
}

export default function TabCommesse({ clienteId, onApriCommessa }: Props) {
  const { commesse, loading } = useCommesseCliente(clienteId);
  const [filtro, setFiltro] = useState<Filtro>('tutte');

  const filtered = useMemo(() => {
    if (filtro === 'attive') return commesse.filter(c => !['completato','annullato','consegnato'].includes(c.fase));
    if (filtro === 'completate') return commesse.filter(c => ['completato','consegnato'].includes(c.fase));
    if (filtro === 'problemi') return commesse.filter(c => c.num_problemi > 0);
    return commesse;
  }, [commesse, filtro]);

  const stats = {
    tot: commesse.length,
    attive: commesse.filter(c => !['completato','annullato','consegnato'].includes(c.fase)).length,
    completate: commesse.filter(c => ['completato','consegnato'].includes(c.fase)).length,
    problemi: commesse.filter(c => c.num_problemi > 0).length,
  };

  if (loading) return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento...</div>;

  return (
    <div>
      {/* Filtri */}
      <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'flex', gap: 6, overflowX: 'auto' as const, marginBottom: 12 }}>
        <Chip active={filtro === 'tutte'} onClick={() => setFiltro('tutte')} label="TUTTE" n={stats.tot} col={NAVY} />
        <Chip active={filtro === 'attive'} onClick={() => setFiltro('attive')} label="ATTIVE" n={stats.attive} col={TEAL} bg="#E1F5EE" />
        <Chip active={filtro === 'completate'} onClick={() => setFiltro('completate')} label="COMPLETATE" n={stats.completate} col={TEAL_DEEP} bg="#D1FAE5" />
        {stats.problemi > 0 && (
          <Chip active={filtro === 'problemi'} onClick={() => setFiltro('problemi')} label="PROBLEMI" n={stats.problemi} col={RED} bg="#FEE2E2" />
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>
          Nessuna commessa
        </div>
      ) : filtered.map(c => <CardCommessa key={c.id} c={c} onClick={() => onApriCommessa?.(c.id)} />)}
    </div>
  );
}

function CardCommessa({ c, onClick }: { c: CommessaCliente; onClick: () => void }) {
  const fm = FASE_META[c.fase] || FASE_META.rilievo;
  const saldoAperto = Math.max(0, c.totale - c.importo_pagato);
  const percPagato = c.totale > 0 ? Math.round((c.importo_pagato / c.totale) * 100) : 0;
  
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${fm.col}`, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: fm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{fm.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
            <span style={{ background: NAVY, color: '#fff', padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{c.code}</span>
            <span style={{ background: fm.bg, color: fm.col, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{fm.label}</span>
            {c.num_problemi > 0 && (
              <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>⚠ {c.num_problemi} PROB.</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>
            🏗️ {c.materiale || 'Serramenti'} · 🪟 {c.num_vani} vani
            {c.indirizzo && ` · 📍 ${c.indirizzo}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>€{Math.round(c.totale).toLocaleString('it-IT')}</div>
        </div>
      </div>

      {/* Barra avanzamento */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: MUTED, marginBottom: 4, fontWeight: 700 }}>
          <span>AVANZAMENTO</span>
          <span style={{ color: fm.col }}>{c.perc_avanzamento}%</span>
        </div>
        <div style={{ height: 7, background: '#F1F4F7', borderRadius: 4, overflow: 'hidden' as const }}>
          <div style={{ width: `${c.perc_avanzamento}%`, height: '100%', background: `linear-gradient(90deg, ${fm.col}aa, ${fm.col})` }} />
        </div>
      </div>

      {/* Pagamenti mini */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{ background: '#F1F4F7', padding: '6px 9px', borderRadius: 6 }}>
          <div style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.3 }}>PAGATO</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: TEAL_DEEP }}>€{Math.round(c.importo_pagato).toLocaleString('it-IT')} <span style={{ fontSize: 9, color: MUTED }}>· {percPagato}%</span></div>
        </div>
        <div style={{ background: saldoAperto > 0 ? '#FEF3C7' : '#F1F4F7', padding: '6px 9px', borderRadius: 6 }}>
          <div style={{ fontSize: 8, color: saldoAperto > 0 ? '#92400E' : MUTED, fontWeight: 700, letterSpacing: 0.3 }}>SALDO APERTO</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: saldoAperto > 0 ? '#92400E' : MUTED }}>€{Math.round(saldoAperto).toLocaleString('it-IT')}</div>
        </div>
      </div>

      {/* Dates */}
      {(c.data_inizio || c.data_consegna_prevista) && (
        <div style={{ marginTop: 8, fontSize: 10, color: MUTED, display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          {c.data_inizio && <span>📅 Iniziata {new Date(c.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
          {c.data_consegna_prevista && <span style={{ marginLeft: 'auto' }}>🎯 Consegna {new Date(c.data_consegna_prevista).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, label, n, col, bg }: any) {
  return (
    <button onClick={onClick} style={{
      background: active ? col : (bg || '#F1F4F7'),
      color: active ? '#fff' : TEXT,
      border: 'none', borderRadius: 7, padding: '7px 11px',
      fontSize: 10, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const, flexShrink: 0,
    }}>
      {label}
      <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: active ? '#fff' : TEXT, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{n}</span>
    </button>
  );
}
