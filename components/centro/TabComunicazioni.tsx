"use client";
// components/centro/TabComunicazioni.tsx
// BLOCCO 2 - Tab comunicazioni unificate cliente

import React, { useState, useMemo } from "react";
import { useComunicazioni, toggleRispondere, marcaLetto, type Comunicazione } from "../../hooks/useComunicazioni";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

const CANALE_META: Record<string, { icon: string; col: string; bg: string; label: string }> = {
  whatsapp: { icon: '💬', col: '#25D366', bg: '#DCFCE7', label: 'WhatsApp' },
  email:    { icon: '✉️', col: BLUE,      bg: '#DBEAFE', label: 'Email' },
  chiamata: { icon: '📞', col: TEAL,      bg: '#E1F5EE', label: 'Chiamata' },
  vocale:   { icon: '🎙️', col: PURPLE,    bg: '#F3E8FF', label: 'Vocale' },
  sms:      { icon: '📱', col: AMBER,     bg: '#FEF3C7', label: 'SMS' },
  manuale:  { icon: '📝', col: MUTED,     bg: '#F1F4F7', label: 'Nota' },
};

type FiltroCanale = 'tutti' | 'da_rispondere' | keyof typeof CANALE_META;

interface Props {
  clienteId: string;
  clienteTelefono?: string | null;
  clienteEmail?: string | null;
  onApriCommessa?: (cmId: string) => void;
}

export default function TabComunicazioni({ clienteId, clienteTelefono, clienteEmail, onApriCommessa }: Props) {
  const { com, loading } = useComunicazioni(clienteId);
  const [filtro, setFiltro] = useState<FiltroCanale>('tutti');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let arr = com;
    if (filtro === 'da_rispondere') arr = arr.filter(c => c.rispondere);
    else if (filtro !== 'tutti') arr = arr.filter(c => c.canale === filtro);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(c =>
        (c.contenuto || '').toLowerCase().includes(q) ||
        (c.oggetto || '').toLowerCase().includes(q) ||
        (c.trascrizione || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [com, filtro, search]);

  const stats = useMemo(() => {
    const byCh: Record<string, number> = {};
    com.forEach(c => { byCh[c.canale] = (byCh[c.canale] || 0) + 1; });
    return {
      tot: com.length,
      da_rispondere: com.filter(c => c.rispondere).length,
      non_letti: com.filter(c => !c.letto && c.direzione === 'in').length,
      byCh,
    };
  }, [com]);

  if (loading) return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento...</div>;

  return (
    <div>
      {/* Stats bar */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <StatBox label="TOTALE" val={stats.tot} col={NAVY} />
        <StatBox label="DA RISPONDERE" val={stats.da_rispondere} col={stats.da_rispondere > 0 ? AMBER : MUTED} />
        <StatBox label="NON LETTI" val={stats.non_letti} col={stats.non_letti > 0 ? RED : MUTED} />
      </div>

      {/* Search */}
      <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
          <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca nei messaggi (anche storici)..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>}
      </div>

      {/* Filtri canale */}
      <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'flex', gap: 5, overflowX: 'auto' as const, marginBottom: 12 }}>
        <Chip active={filtro === 'tutti'} onClick={() => setFiltro('tutti')} label="TUTTI" n={stats.tot} col={NAVY} />
        {stats.da_rispondere > 0 && (
          <Chip active={filtro === 'da_rispondere'} onClick={() => setFiltro('da_rispondere')} label="🔴 DA RISPONDERE" n={stats.da_rispondere} col={AMBER} bg="#FEF3C7" />
        )}
        {Object.entries(CANALE_META).map(([k, v]) => {
          const n = stats.byCh[k] || 0;
          if (n === 0) return null;
          return <Chip key={k} active={filtro === k} onClick={() => setFiltro(k as FiltroCanale)} label={v.icon + ' ' + v.label} n={n} col={v.col} bg={v.bg} />;
        })}
      </div>

      {/* Lista comunicazioni */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>
          Nessuna comunicazione
        </div>
      ) : (
        filtered.map(c => <CardCom key={c.id} c={c} onApriCommessa={onApriCommessa} clienteTelefono={clienteTelefono} clienteEmail={clienteEmail} />)
      )}
    </div>
  );
}

function CardCom({ c, onApriCommessa, clienteTelefono, clienteEmail }: any) {
  const m = CANALE_META[c.canale] || CANALE_META.manuale;
  const isIn = c.direzione === 'in';
  const d = new Date(c.data_comunicazione);
  const giorni = Math.floor((Date.now() - d.getTime()) / 86400000);
  const dataFmt = giorni === 0 ? 'OGGI ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) :
                  giorni === 1 ? 'IERI ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) :
                  giorni < 7 ? giorni + 'g fa' :
                  d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });

  function rispondiRapido() {
    if (c.canale === 'whatsapp' && clienteTelefono) {
      window.open(`https://wa.me/${clienteTelefono.replace(/[^\d]/g, '')}`);
    } else if (c.canale === 'email' && clienteEmail) {
      window.open(`mailto:${clienteEmail}?subject=Re: ${encodeURIComponent(c.oggetto || '')}`);
    } else if (c.canale === 'chiamata' && clienteTelefono) {
      window.open(`tel:${clienteTelefono}`);
    }
    toggleRispondere(c.id, false);
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 12, marginBottom: 6,
      borderLeft: `4px solid ${m.col}`,
      boxShadow: c.rispondere ? `0 0 0 2px ${AMBER}55` : '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {m.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' as const }}>
            <span style={{ background: m.bg, color: m.col, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{m.label}</span>
            <span style={{ background: isIn ? '#FEF3C7' : '#E1F5EE', color: isIn ? '#92400E' : TEAL_DEEP, padding: '2px 6px', borderRadius: 3, fontSize: 8, fontWeight: 800 }}>
              {isIn ? '◀ IN' : '▶ OUT'}
            </span>
            {c.commessa_code && (
              <button onClick={(e) => { e.stopPropagation(); onApriCommessa?.(c.commessa_id); }} style={{ background: NAVY, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                {c.commessa_code}
              </button>
            )}
            {c.rispondere && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>🔴 DA RISPONDERE</span>}
            {!c.letto && c.direzione === 'in' && <span style={{ background: BLUE, color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>NUOVO</span>}
          </div>
          
          {c.oggetto && <div style={{ fontSize: 12, fontWeight: 800, color: TEXT, marginBottom: 3 }}>{c.oggetto}</div>}
          <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.45, fontStyle: c.canale === 'vocale' ? 'italic' as const : 'normal' as const }}>
            {c.canale === 'vocale' && '🎙️ '}
            {c.contenuto}
          </div>
          {c.durata_secondi && c.canale === 'vocale' && (
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>⏱ {c.durata_secondi}s</div>
          )}
          {c.durata_secondi && c.canale === 'chiamata' && (
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>⏱ {Math.floor(c.durata_secondi / 60)}:{(c.durata_secondi % 60).toString().padStart(2, '0')}</div>
          )}
          
          <div style={{ fontSize: 9, color: MUTED, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span>📅 {dataFmt}</span>
            {c.autore && <span>· {c.autore}</span>}
            {!c.letto && c.direzione === 'in' && (
              <button onClick={() => marcaLetto(c.id, true)} style={{ marginLeft: 'auto', background: '#F1F4F7', color: TEXT, border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Marca letto
              </button>
            )}
          </div>

          {c.rispondere && (
            <button onClick={rispondiRapido} style={{
              marginTop: 8, width: '100%', padding: '9px 0',
              background: m.col, color: '#fff', border: 'none', borderRadius: 7,
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {m.icon} RISPONDI ORA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, val, col }: any) {
  return (
    <div style={{ background: '#F8FAFA', padding: '7px 6px', borderRadius: 7, textAlign: 'center' as const }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{val}</div>
      <div style={{ fontSize: 8, color: col, fontWeight: 700, letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Chip({ active, onClick, label, n, col, bg }: any) {
  return (
    <button onClick={onClick} style={{
      background: active ? col : (bg || '#F1F4F7'),
      color: active ? '#fff' : TEXT,
      border: 'none', borderRadius: 7, padding: '6px 9px',
      fontSize: 10, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      whiteSpace: 'nowrap' as const, flexShrink: 0,
    }}>
      {label}
      <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: active ? '#fff' : TEXT, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{n}</span>
    </button>
  );
}
