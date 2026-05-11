"use client";
// components/CentroClienti.tsx
// Lista clienti + apertura dossier

import React, { useState, useMemo } from "react";
import { useClienti, type ClienteDossier } from "../hooks/useDossierCliente";
import DossierCliente from "./DossierCliente";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", PURPLE = "#7E22CE", BLUE = "#1E40AF";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

const STATO_COL: Record<string, string> = {
  attivo: TEAL_DEEP, storico: BLUE, dormiente: AMBER, prospect: PURPLE, perso: RED,
};
const PRIORITA_ICO: Record<string, string> = {
  premium: '👑', alto: '⭐', medio: '•', basso: '·',
};

type Filtro = 'tutti' | 'attivi' | 'premium' | 'problemi';

export default function CentroClienti({ aziendaId, onClose, onApriCommessa }: any) {
  const resolved = resolveAziendaId(aziendaId);
  const { clienti, loading } = useClienti(resolved);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('tutti');
  const [clienteAperto, setClienteAperto] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let arr = clienti;
    if (filtro === 'attivi') arr = arr.filter(c => c.stato_cliente === 'attivo');
    else if (filtro === 'premium') arr = arr.filter(c => c.livello_priorita === 'premium' || c.livello_priorita === 'alto');
    else if (filtro === 'problemi') arr = arr.filter(c => (c.affidabilita_pct || 100) < 70);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(c =>
        (c.nome || '').toLowerCase().includes(q) ||
        (c.cognome || '').toLowerCase().includes(q) ||
        (c.citta || '').toLowerCase().includes(q) ||
        (c.telefono || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [clienti, filtro, search]);

  const stats = useMemo(() => {
    const totValore = clienti.reduce((s, c) => s + Number(c.valore_storico_eur || 0), 0);
    return {
      totale: clienti.length,
      attivi: clienti.filter(c => c.stato_cliente === 'attivo').length,
      premium: clienti.filter(c => c.livello_priorita === 'premium').length,
      problemi: clienti.filter(c => (c.affidabilita_pct || 100) < 70).length,
      valore: totValore,
    };
  }, [clienti]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CENTRO</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>👥 Clienti & Dossier</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <KpiHero icon="👥" label="TOTALI" val={stats.totale} color={TEAL} />
          <KpiHero icon="🟢" label="ATTIVI" val={stats.attivi} color={TEAL_DEEP} />
          <KpiHero icon="👑" label="PREMIUM" val={stats.premium} color={PURPLE} />
          <KpiHero icon="💰" label="VALORE" val={`€${Math.round(stats.valore / 1000)}k`} color={GREEN} small />
        </div>
      </div>

      {/* Search */}
      <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
          <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca nome, città, telefono..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>}
      </div>

      {/* Filtri */}
      <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', gap: 6, overflowX: 'auto' as const }}>
        <Chip active={filtro === 'tutti'} onClick={() => setFiltro('tutti')} label="TUTTI" n={stats.totale} col={NAVY} />
        <Chip active={filtro === 'attivi'} onClick={() => setFiltro('attivi')} label="ATTIVI" n={stats.attivi} col={TEAL_DEEP} bg="#D1FAE5" />
        <Chip active={filtro === 'premium'} onClick={() => setFiltro('premium')} label="PREMIUM/ALTO" n={stats.premium} col={PURPLE} bg="#F3E8FF" />
        {stats.problemi > 0 && (
          <Chip active={filtro === 'problemi'} onClick={() => setFiltro('problemi')} label="PROBLEMI" n={stats.problemi} col={RED} bg="#FEE2E2" />
        )}
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         filtered.length === 0 ? <Empty label="Nessun cliente trovato" /> :
         filtered.map(c => <CardCliente key={c.id} c={c} onClick={() => setClienteAperto(c.id)} />)}
      </div>

      {clienteAperto && (
        <DossierCliente
          clienteId={clienteAperto}
          onClose={() => setClienteAperto(null)}
          onApriCommessa={(cmId: string) => { setClienteAperto(null); onApriCommessa?.(cmId); }}
        />
      )}
    </div>
  );
}

function CardCliente({ c, onClick }: { c: ClienteDossier; onClick: () => void }) {
  const statoCol = STATO_COL[c.stato_cliente] || MUTED;
  const prioIcon = PRIORITA_ICO[c.livello_priorita] || '·';
  const affidCol = c.affidabilita_pct >= 85 ? TEAL_DEEP : c.affidabilita_pct >= 60 ? AMBER : RED;
  const ultContatto = c.ultimo_contatto_at ? Math.floor((Date.now() - new Date(c.ultimo_contatto_at).getTime()) / 86400000) : null;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${statoCol}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {c.foto_url ? (
          <img src={c.foto_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' as const }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${statoCol}, ${statoCol}aa)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
            {(c.nome?.[0] || '?') + (c.cognome?.[0] || '')}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{c.nome} {c.cognome}</span>
            <span style={{ fontSize: 12 }}>{prioIcon}</span>
          </div>
          <div style={{ fontSize: 10, color: MUTED }}>
            📍 {c.citta || '—'} {c.telefono && `· 📞 ${c.telefono}`}
          </div>
          {c.prossima_azione && (
            <div style={{ marginTop: 4, padding: '3px 7px', background: '#FEF3C7', color: '#92400E', borderRadius: 4, fontSize: 9, fontWeight: 700, display: 'inline-block' }}>
              ➜ {c.prossima_azione}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>€{Math.round(c.valore_storico_eur / 1000)}k</div>
          <div style={{ fontSize: 9, color: affidCol, fontWeight: 700, marginTop: 2 }}>{c.affidabilita_pct}% affid.</div>
          {ultContatto !== null && (
            <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{ultContatto === 0 ? 'oggi' : ultContatto === 1 ? 'ieri' : `${ultContatto}g fa`}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiHero({ icon, label, val, color, small }: any) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${color}55`, padding: '8px 6px', borderRadius: 10, textAlign: 'center' as const }}>
      <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
      <div style={{ fontSize: small ? 14 : 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 7, color, fontWeight: 700, letterSpacing: 0.6, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Chip({ active, onClick, label, n, col, bg }: any) {
  return (
    <button onClick={onClick} style={{
      background: active ? col : (bg || '#F1F4F7'),
      color: active ? '#fff' : TEXT,
      border: 'none', borderRadius: 7, padding: '7px 11px',
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      whiteSpace: 'nowrap' as const, flexShrink: 0,
    }}>
      {label}
      <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: active ? '#fff' : TEXT, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{n}</span>
    </button>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
