"use client";
// components/centro/AIAssistantDrawer.tsx
// Pannello AI Assistant con suggerimenti operativi proattivi

import React, { useState } from "react";
import { useAISuggerimenti, type AISuggerimento } from "../../hooks/useAISuggerimenti";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface Props {
  aziendaId: string;
  onApriCommessa?: (id: string) => void;
}

export default function AIAssistantDrawer({ aziendaId, onApriCommessa }: Props) {
  const { suggerimenti, loading } = useAISuggerimenti(aziendaId);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'tutti' | 'alta' | 'media' | 'bassa'>('tutti');

  const totAlta = suggerimenti.filter(s => s.priorita === 'alta').length;
  const totMedia = suggerimenti.filter(s => s.priorita === 'media').length;
  const totBassa = suggerimenti.filter(s => s.priorita === 'bassa').length;
  const totAlerts = suggerimenti.length;

  const filtered = filter === 'tutti' ? suggerimenti : suggerimenti.filter(s => s.priorita === filter);

  return (
    <>
      {/* Bottone floating */}
      <button onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 9700,
        width: 60, height: 60, borderRadius: '50%',
        background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`,
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(40,160,160,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        ⚡
        {totAlta > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: RED, color: '#fff', borderRadius: '50%',
            width: 22, height: 22, fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{totAlta}</span>
        )}
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9850, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#F4F1EA', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto' as const, paddingBottom: 24 }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>AI ASSISTANT</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{totAlerts === 0 ? 'Tutto sotto controllo' : `${totAlerts} azione${totAlerts > 1 ? 'i' : ''} consigliata${totAlerts > 1 ? 'e' : ''}`}</div>
                </div>
                <button onClick={() => setOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
              </div>

              {/* Filtri */}
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto' as const }}>
                <Chip active={filter === 'tutti'} onClick={() => setFilter('tutti')} label="Tutti" n={totAlerts} activeBg="rgba(255,255,255,0.25)" />
                <Chip active={filter === 'alta'} onClick={() => setFilter('alta')} label="Alta" n={totAlta} activeBg={RED} />
                <Chip active={filter === 'media'} onClick={() => setFilter('media')} label="Media" n={totMedia} activeBg={AMBER} />
                <Chip active={filter === 'bassa'} onClick={() => setFilter('bassa')} label="Bassa" n={totBassa} activeBg={TEAL} />
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 14 }}>
              {loading ? (
                <Empty label="Analisi in corso…" />
              ) : filtered.length === 0 ? (
                <Empty label={filter === 'tutti' ? '✓ Tutto sotto controllo — nessuna azione richiesta' : 'Nessun suggerimento in questa priorità'} />
              ) : (
                filtered.map(s => (
                  <CardSuggerimento key={s.id} s={s} onClick={() => {
                    if (s.commessa_id && onApriCommessa) {
                      onApriCommessa(s.commessa_id);
                      setOpen(false);
                    }
                  }} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CardSuggerimento({ s, onClick }: { s: AISuggerimento; onClick: () => void }) {
  const bgCol = s.priorita === 'alta' ? '#FEE2E2' : s.priorita === 'media' ? '#FEF3C7' : '#E1F5EE';
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${s.color}`, cursor: s.commessa_id ? 'pointer' : 'default', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bgCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {s.icona}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ background: s.color + '22', color: s.color, fontSize: 8, padding: '2px 6px', borderRadius: 3, fontWeight: 800, letterSpacing: 0.5 }}>{s.priorita.toUpperCase()}</span>
            {s.commessa_code && <span style={{ background: '#F1F4F7', color: TEXT, fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{s.commessa_code}</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{s.titolo}</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, lineHeight: 1.4 }}>{s.descrizione}</div>
          <div style={{ background: '#F8FAFA', padding: '6px 10px', borderRadius: 6, fontSize: 10, color: TEXT, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{ fontWeight: 600 }}>{s.azione}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, label, n, activeBg }: any) {
  return (
    <button onClick={onClick} style={{
      background: active ? activeBg : 'rgba(255,255,255,0.1)',
      color: '#fff', border: 'none', borderRadius: 7,
      padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const,
    }}>
      {label}
      <span style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 3, fontSize: 10 }}>{n}</span>
    </button>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
