"use client";
import React, { useState } from "react";
import { ArticoloMagazzino, ABC_COLOR } from "../../hooks/useMagazzinoTop";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

interface RiordinoItem {
  articolo: ArticoloMagazzino;
  qta_suggerita: number;
  totale: number;
  urgente: boolean;
}

export default function VistaRiordini({ mag, onOrdineRapido }: { mag: any; onOrdineRapido: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Calcola riordini suggeriti dall'AI
  const items: RiordinoItem[] = (mag.articoli as ArticoloMagazzino[])
    .filter(a => a.stato_scorta === "sotto_minimo" || a.stato_scorta === "esaurito")
    .map(a => {
      const qta = Math.max(a.scorta_minima * 2 - a.scorta_attuale, 1);
      return {
        articolo: a,
        qta_suggerita: Math.round(qta),
        totale: Math.round(qta * (a.prezzo_acquisto || 0) * 100) / 100,
        urgente: a.stato_scorta === "esaurito",
      };
    });

  const toggle = (id: string) => {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSelected(ns);
  };

  const totaleSelez = items
    .filter(i => selected.has(i.articolo.id))
    .reduce((s, i) => s + i.totale, 0);

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Hero forecast */}
      <div style={{
        background: "#fff", borderRadius: 13, padding: "11px 12px",
        marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          fontSize: 9.5, fontWeight: 800, color: NAVY,
          letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Forecast consumo 90 gg</span>
          <span style={{ fontSize: 9, color: TEAL, fontWeight: 800, display: "flex", alignItems: "center", gap: 3 }}>
            <SparkleIcon size={10} />AI
          </span>
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginBottom: 8 }}>
          Calcolato su consumo medio + commesse in pipeline
        </div>
        {items.slice(0, 3).map(i => (
          <ForecastRow key={i.articolo.id} item={i} />
        ))}
      </div>

      {/* Suggeriti AI */}
      <div style={{
        background: "#fff", borderRadius: 13, padding: "11px 12px",
        marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          fontSize: 9.5, fontWeight: 800, color: NAVY,
          letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Suggeriti dall'AI</span>
          <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
            Nessun riordino necessario
          </div>
        ) : (
          items.map(i => (
            <RiordinoRow
              key={i.articolo.id}
              item={i}
              checked={selected.has(i.articolo.id)}
              onToggle={() => toggle(i.articolo.id)}
            />
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", padding: "10px 12px",
        display: "flex", gap: 8, alignItems: "center",
        borderTop: "1px solid #E5EAF0", boxShadow: "0 -4px 12px rgba(0,0,0,0.1)", zIndex: 40,
      }}>
        <div style={{ flex: 1, fontSize: 11, color: NAVY, fontWeight: 700 }}>
          {selected.size} sel · <b style={{ fontSize: 13 }}>€{totaleSelez.toLocaleString("it-IT")}</b>
        </div>
        <button onClick={onOrdineRapido} style={{
          padding: "11px 14px", background: AMBER, color: "#fff",
          borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <BoltIcon size={12} />30S
        </button>
        <button disabled={selected.size === 0} style={{
          padding: "11px 14px",
          background: selected.size === 0 ? "#D8DEE5" : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
          color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none",
          cursor: selected.size === 0 ? "not-allowed" : "pointer",
        }}>
          CREA ORDINE
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTI
// ============================================================

function ForecastRow({ item }: { item: RiordinoItem }) {
  const a = item.articolo;
  const percUsato = Math.min(100, (a.scorta_attuale / Math.max(a.scorta_minima * 2, 1)) * 100);
  const percMinimo = (a.scorta_minima / Math.max(a.scorta_minima * 2, 1)) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
      <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: NAVY, minWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {a.nome}
      </div>
      <div style={{ flex: 2, background: "#F1F4F7", height: 18, borderRadius: 9, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%",
          width: `${percUsato}%`,
          background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DARK})`,
          borderRadius: 9,
        }} />
        <div style={{
          position: "absolute", top: 0, left: `${percUsato}%`,
          height: "100%", width: "30%",
          background: `repeating-linear-gradient(45deg, ${AMBER}, ${AMBER} 4px, #D69A40 4px, #D69A40 8px)`,
        }} />
        <div style={{
          position: "absolute", top: 0, left: `${percMinimo}%`,
          height: "100%", width: 2, background: RED,
        }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, minWidth: 50, textAlign: "right" }}>
        +{item.qta_suggerita}
      </div>
    </div>
  );
}

function RiordinoRow({ item, checked, onToggle }: { item: RiordinoItem; checked: boolean; onToggle: () => void }) {
  const a = item.articolo;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "9px 0", borderBottom: "1px solid #E5EAF0",
    }}>
      <button onClick={onToggle} style={{
        width: 22, height: 22, borderRadius: 6,
        background: checked ? GREEN : "#fff",
        borderColor: checked ? "#0a4d3c" : "#D8DEE5",
        borderWidth: 1.5, borderStyle: "solid",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, cursor: "pointer", padding: 0,
      }}>
        {checked && <CheckIcon size={12} />}
      </button>
      <div style={{
        width: 32, height: 32, borderRadius: 7,
        background: item.urgente ? "#FCE3E3" : "#FBF0DC",
        color: item.urgente ? RED : "#8B6926",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {item.urgente ? <AlertIcon size={14} /> : <PkgIcon size={14} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {a.abc_class && (
            <span style={{
              width: 14, height: 14, borderRadius: 3,
              background: ABC_COLOR[a.abc_class], color: "#fff",
              fontSize: 8, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{a.abc_class}</span>
          )}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {a.nome}
          </div>
        </div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
          {a.fornitore_nome || "—"} · {a.scorta_attuale}/min {a.scorta_minima} · €{a.prezzo_acquisto || 0}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: TEAL }}>
          {item.qta_suggerita} {a.unita_misura}
        </div>
        <div style={{ fontSize: 9, color: MUTED }}>€{item.totale.toLocaleString("it-IT")}</div>
      </div>
    </div>
  );
}

const SparkleIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2z"/>
  </svg>
);
const BoltIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const AlertIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const PkgIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
