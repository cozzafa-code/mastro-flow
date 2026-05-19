"use client";
// components/centro/MaterialiCommessaDrawer.tsx
// BLOCCO 5 - Drawer Commessa→Materiali esploso visivo 7 sezioni

import React, { useState } from "react";
import { useMaterialiCommessa, CATEGORIE, type CategoriaOp, type MaterialeRow } from "../../hooks/useMaterialiCommessa";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const CAT_META: Record<CategoriaOp, { icon: string; bg: string; border: string; fg: string; label: string }> = {
  TELAI:      { icon: '🔧', bg: '#E0E7FF', border: '#4F46E5', fg: '#3730A3', label: 'TELAI' },
  ANTE:       { icon: '🚪', bg: '#FCE7F3', border: '#DB2777', fg: '#9D174D', label: 'ANTE' },
  VETRI:      { icon: '🪟', bg: '#DBEAFE', border: BLUE,      fg: '#1E40AF', label: 'VETRI' },
  FERRAMENTA: { icon: '⚙️',  bg: '#FEF3C7', border: AMBER,     fg: '#92400E', label: 'FERRAMENTA' },
  ACCESSORI:  { icon: '📎', bg: '#E1F5EE', border: TEAL,      fg: TEAL_DEEP, label: 'ACCESSORI' },
  MOTORI:     { icon: '⚡', bg: '#FECACA', border: RED,       fg: '#991B1B', label: 'MOTORI' },
  KIT_POSA:   { icon: '📦', bg: '#F3E8FF', border: PURPLE,    fg: '#6B21A8', label: 'KIT POSA' },
};

// 12 stati operativi colorati
const STATO_META: Record<string, { col: string; bg: string; label: string; icon: string }> = {
  ordinato:    { col: '#6366F1', bg: '#E0E7FF', label: 'ORDINATO', icon: '📋' },
  inviato:     { col: BLUE,      bg: '#DBEAFE', label: 'INVIATO', icon: '📤' },
  confermato:  { col: PURPLE,    bg: '#F3E8FF', label: 'CONFERMATO', icon: '🤝' },
  in_viaggio:  { col: '#0EA5E9', bg: '#E0F2FE', label: 'IN VIAGGIO', icon: '🚚' },
  arrivato:    { col: TEAL,      bg: '#E1F5EE', label: 'ARRIVATO', icon: '📦' },
  verificato:  { col: GREEN,     bg: '#D1FAE5', label: 'VERIFICATO', icon: '✅' },
  stoccato:    { col: TEAL_DEEP, bg: '#D1FAE5', label: 'STOCCATO', icon: '📥' },
  assegnato:   { col: '#7C3AED', bg: '#EDE9FE', label: 'ASSEGNATO', icon: '🔖' },
  preparato:   { col: '#0891B2', bg: '#CFFAFE', label: 'PREPARATO', icon: '📋' },
  caricato:    { col: '#0E7490', bg: '#CFFAFE', label: 'CARICATO', icon: '🚛' },
  consegnato:  { col: '#15803D', bg: '#D1FAE5', label: 'CONSEGNATO', icon: '🎯' },
  montato:     { col: TEAL_DEEP, bg: '#D1FAE5', label: 'MONTATO', icon: '✓' },
  reso:        { col: AMBER,     bg: '#FEF3C7', label: 'RESO', icon: '↩️' },
  danneggiato: { col: RED,       bg: '#FEE2E2', label: 'DANNEGGIATO', icon: '❌' },
  ricevuto:    { col: TEAL,      bg: '#E1F5EE', label: 'RICEVUTO', icon: '📦' },
  in_attesa:   { col: AMBER,     bg: '#FEF3C7', label: 'IN ATTESA', icon: '⏳' },
};

interface Props {
  commessaId: string;
  commessaCode?: string;
  commessaCliente?: string;
  onClose: () => void;
}

export default function MaterialiCommessaDrawer({ commessaId, commessaCode, commessaCliente, onClose }: Props) {
  const { byCategoria, loading } = useMaterialiCommessa(commessaId);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Stats globali
  const tutteCat = CATEGORIE.map(cat => byCategoria[cat]).filter(Boolean);
  const catConDati = tutteCat.filter(c => c && c.totale_qta > 0);
  const totQta = catConDati.reduce((s, c) => s + c.totale_qta, 0);
  const totRicevuta = catConDati.reduce((s, c) => s + c.qta_ricevuta, 0);
  const percGlobale = totQta > 0 ? Math.round((totRicevuta / totQta) * 100) : 0;
  const catPronte = catConDati.filter(c => c.stato_globale === 'pronto').length;
  const catParziali = catConDati.filter(c => c.stato_globale === 'parziale').length;
  const catAttesa = catConDati.filter(c => c.stato_globale === 'attesa').length;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' as const, paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, #0F1B2D 0%, ${NAVY} 100%)`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(40,160,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>MATERIALI COMMESSA</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{commessaCode || 'Commessa'}{commessaCliente ? ` · ${commessaCliente}` : ''}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>×</button>
          </div>

          {/* Stats globali */}
          {!loading && catConDati.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 10 }}>
                <KpiSmall icon="📊" label="ITEMS" val={`${totRicevuta}/${totQta}`} color={TEAL} />
                <KpiSmall icon="🟢" label="PRONTE" val={catPronte} color={TEAL} />
                <KpiSmall icon="🟠" label="PARZ." val={catParziali} color={AMBER} />
                <KpiSmall icon="🔴" label="ATTESA" val={catAttesa} color={RED} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 600 }}>
                  <span>Completamento globale</span>
                  <span style={{ color: '#fff', fontWeight: 800 }}>{percGlobale}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' as const }}>
                  <div style={{ width: `${percGlobale}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP})`, borderRadius: 4 }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 14 }}>
          {loading ? (
            <Empty label="Caricamento materiali..." />
          ) : catConDati.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Nessun ordine collegato</div>
              <div style={{ fontSize: 11, color: MUTED }}>Aggiungi ordini fornitore per vedere i materiali</div>
            </div>
          ) : (
            CATEGORIE.map(cat => {
              const data = byCategoria[cat];
              if (!data || data.totale_qta === 0) return null;
              const meta = CAT_META[cat];
              const isExp = expandedCat === cat;
              const statoCol = data.stato_globale === 'pronto' ? TEAL : data.stato_globale === 'parziale' ? AMBER : RED;
              const statoLabel = data.stato_globale === 'pronto' ? 'PRONTO' : data.stato_globale === 'parziale' ? 'PARZIALE' : 'ATTESA';

              return (
                <div key={cat} style={{ background: '#fff', borderRadius: 12, marginBottom: 8, overflow: 'hidden' as const, borderLeft: `5px solid ${meta.border}` }}>
                  {/* Header categoria - cliccabile */}
                  <div onClick={() => setExpandedCat(isExp ? null : cat)} style={{ padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{meta.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: meta.fg, letterSpacing: 0.5 }}>{meta.label}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
                        {data.qta_ricevuta}/{data.totale_qta} pz · {data.totale_righe} {data.totale_righe === 1 ? 'articolo' : 'articoli'}
                      </div>
                      <div style={{ height: 6, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' as const, marginTop: 6 }}>
                        <div style={{ width: `${data.perc_completamento}%`, height: '100%', background: `linear-gradient(90deg, ${meta.border}aa, ${meta.border})` }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ background: statoCol, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{statoLabel}</span>
                      <span style={{ fontSize: 11, color: TEXT, fontWeight: 800 }}>{data.perc_completamento}%</span>
                    </div>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.5} style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 4 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Body categoria - articoli espansi */}
                  {isExp && (
                    <div style={{ background: '#F8FAFA', padding: 12, borderTop: '1px solid #E5EAF0' }}>
                      {data.righe.map(r => <RigaArticolo key={r.id} riga={r} catMeta={meta} />)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// =============== RIGA ARTICOLO ===============
function RigaArticolo({ riga, catMeta }: { riga: MaterialeRow; catMeta: any }) {
  const statoMeta = STATO_META[riga.stato] || STATO_META.in_attesa;
  const isReceived = Number(riga.qta_ricevuta) >= Number(riga.qta_richiesta);
  const isPartial = Number(riga.qta_ricevuta) > 0 && Number(riga.qta_ricevuta) < Number(riga.qta_richiesta);

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Header riga */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1F33', lineHeight: 1.3 }}>{riga.descrizione}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' as const }}>
            {riga.ordine_numero && <span style={{ background: '#F1F4F7', color: '#0F1F33', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{riga.ordine_numero}</span>}
            {riga.fornitore_nome && <span style={{ fontSize: 10, color: '#5C6B7A', fontWeight: 600 }}>{riga.fornitore_nome}</span>}
          </div>
        </div>
        <span style={{ background: statoMeta.bg, color: statoMeta.col, padding: '4px 9px', borderRadius: 5, fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{statoMeta.icon}</span>{statoMeta.label}
        </span>
      </div>

      {/* Quantità + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: '#5C6B7A', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ color: '#0F1F33', fontWeight: 800, fontSize: 13 }}>{riga.qta_ricevuta}/{riga.qta_richiesta}</span>
          <span style={{ fontSize: 10 }}>ricevuti</span>
        </div>
        {isReceived && <span style={{ color: '#0F6E56', fontWeight: 700 }}>✓ Completo</span>}
        {isPartial && <span style={{ color: '#92400E', fontWeight: 700 }}>⚠ Parziale</span>}
        {riga.data_prevista && !riga.data_ricevuta && (
          <span style={{ marginLeft: 'auto' }}>ETA: <strong>{new Date(riga.data_prevista).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</strong></span>
        )}
        {riga.data_ricevuta && (
          <span style={{ marginLeft: 'auto', color: '#0F6E56', fontWeight: 700 }}>📦 {new Date(riga.data_ricevuta).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
        )}
      </div>

      {/* Prezzo + totale */}
      {riga.prezzo_unitario > 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#5C6B7A', display: 'flex', justifyContent: 'space-between' }}>
          <span>€{Number(riga.prezzo_unitario).toFixed(2)} cad.</span>
          <span style={{ color: '#0F1F33', fontWeight: 700 }}>Totale €{Number(riga.totale_riga).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

function KpiSmall({ icon, label, val, color }: any) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${color}55`, padding: '6px 5px', borderRadius: 8, textAlign: 'center' as const }}>
      <div style={{ fontSize: 10, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{val}</div>
      <div style={{ fontSize: 7, color, fontWeight: 700, letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
