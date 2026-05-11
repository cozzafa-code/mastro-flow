"use client";
// components/centro/TabDocumenti.tsx - Documenti firmati cliente

import React, { useState } from "react";
import { useDocumenti, type DocumentoCliente } from "../../hooks/useDocumenti";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

const TIPO_DOC: Record<string, { icon: string; col: string; bg: string; label: string }> = {
  preventivo_firmato: { icon: '📄', col: TEAL_DEEP, bg: '#D1FAE5', label: 'Preventivo firmato' },
  contratto:          { icon: '📜', col: BLUE,      bg: '#DBEAFE', label: 'Contratto' },
  privacy:            { icon: '🔒', col: PURPLE,    bg: '#F3E8FF', label: 'Privacy GDPR' },
  rilievo_firmato:    { icon: '📐', col: AMBER,     bg: '#FEF3C7', label: 'Rilievo firmato' },
  collaudo:           { icon: '✅', col: GREEN,     bg: '#D1FAE5', label: 'Collaudo' },
  altro:              { icon: '📎', col: MUTED,     bg: '#F1F4F7', label: 'Altro documento' },
};

interface Props {
  clienteId: string;
  onApriCommessa?: (cmId: string) => void;
}

export default function TabDocumenti({ clienteId, onApriCommessa }: Props) {
  const { docs, loading } = useDocumenti(clienteId);

  if (loading) return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento...</div>;
  
  if (docs.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>📂</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Nessun documento</div>
        <div style={{ fontSize: 11, color: MUTED }}>I documenti firmati appariranno qui automaticamente</div>
      </div>
    );
  }

  const firmati = docs.filter(d => d.firmato).length;

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <StatBox icon="📂" label="TOTALI" val={docs.length} col={NAVY} />
        <StatBox icon="✓" label="FIRMATI" val={firmati} col={TEAL_DEEP} />
        <StatBox icon="⏳" label="NON FIRMATI" val={docs.length - firmati} col={firmati < docs.length ? AMBER : MUTED} />
      </div>

      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>📂 ARCHIVIO DOCUMENTI · {docs.length}</div>
      {docs.map(d => <CardDoc key={d.id} d={d} onApriCommessa={onApriCommessa} />)}
    </div>
  );
}

function CardDoc({ d, onApriCommessa }: { d: DocumentoCliente; onApriCommessa?: any }) {
  const m = TIPO_DOC[d.tipo] || TIPO_DOC.altro;

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, borderLeft: `4px solid ${m.col}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 9, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
            <span style={{ background: m.bg, color: m.col, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{m.label.toUpperCase()}</span>
            {d.firmato && <span style={{ background: '#D1FAE5', color: TEAL_DEEP, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>✓ FIRMATO</span>}
            {!d.firmato && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>⏳ NON FIRMATO</span>}
            {d.commessa_code && (
              <button onClick={(e) => { e.stopPropagation(); onApriCommessa?.(d.commessa_id); }} style={{ background: NAVY, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                {d.commessa_code}
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{d.nome_file}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <span>📅 {new Date(d.data_documento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            {d.firmato && d.firmato_da && <span>· ✍️ {d.firmato_da}</span>}
          </div>
        </div>
        <a href={d.url} target="_blank" rel="noopener noreferrer" style={{
          background: m.col, color: '#fff', padding: '8px 12px',
          borderRadius: 8, fontSize: 11, fontWeight: 800,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          📄 APRI
        </a>
      </div>
    </div>
  );
}

function StatBox({ icon, label, val, col }: any) {
  return (
    <div style={{ background: '#F8FAFA', padding: '8px 6px', borderRadius: 7, textAlign: 'center' as const }}>
      <div style={{ fontSize: 13, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: col, lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 7, color: MUTED, fontWeight: 700, letterSpacing: 0.4, marginTop: 3 }}>{label}</div>
    </div>
  );
}
