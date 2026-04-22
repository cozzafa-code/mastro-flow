// components/VanoEditorAccordion.tsx
// Editor inline per un vano dentro il workspace preventivo.
// Mostra form compatto quando espanso + bottone "Apri costruttore" per CAD fullscreen.

import React, { useState } from "react";

type Props = {
  vano: any;
  commessa: any;
  sistemiDB: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (field: string, value: any) => void;
  onOpenCAD: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCalcPrezzo: (v: any) => number;
};

const T = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  warn: "#ff9500",
  danger: "#DC2626",
};

const SISTEMA_OPTS = ["Alluminio", "PVC", "Legno", "Legno/Alluminio"];
const VETRO_OPTS = ["Standard 4/16/4", "Triplo 4/12/4/12/4", "Antieffrazione", "Basso emissivo"];
const COLORE_OPTS = ["Bianco", "Marrone", "Antracite", "Nero", "Quercia", "Ciliegio", "Noce"];
const APERTURA_OPTS = ["Interna", "Esterna", "Scorrevole", "A ribalta", "Fissa"];

export default function VanoEditorAccordion({
  vano,
  commessa,
  sistemiDB,
  isExpanded,
  onToggle,
  onUpdate,
  onOpenCAD,
  onDuplicate,
  onDelete,
  onCalcPrezzo,
}: Props) {
  const v = vano;
  const lCentro = v.misure?.lCentro || v.larghezza || 0;
  const hCentro = v.misure?.hCentro || v.altezza || 0;
  const prezzo = onCalcPrezzo(v);
  const pezzi = v.pezzi || 1;
  const totale = prezzo * pezzi;

  const row = (label: string, value: string | number) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
      <span style={{ color: T.textSub }}>{label}</span>
      <span style={{ fontWeight: 600, color: T.textDark }}>{value || "—"}</span>
    </div>
  );

  const fieldLabel = (txt: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
      {txt}
    </div>
  );

  const chip = (sel: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    background: sel ? T.teal : T.lightBg,
    color: sel ? "#fff" : T.textDark,
    border: `1px solid ${sel ? T.teal : T.border}`,
    userSelect: "none" as const,
  });

  const input: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    fontSize: 12,
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      background: T.cardBg,
      borderRadius: 10,
      border: `1px solid ${isExpanded ? T.teal : T.border}`,
      marginBottom: 8,
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* HEADER (sempre visibile) */}
      <div onClick={onToggle} style={{
        display: "flex",
        alignItems: "center",
        padding: 12,
        cursor: "pointer",
        gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${T.teal}15`, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: T.teal, fontWeight: 800, fontSize: 11,
        }}>
          {v.tipo || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textDark }}>
            {v.nome || "Vano senza nome"}
          </div>
          <div style={{ fontSize: 10, color: T.textSub }}>
            {lCentro}×{hCentro} mm · {pezzi}pz · {v.sistema || "No sistema"} · {v.colore || "—"}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.teal }}>
            €{totale.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{
            fontSize: 10, color: T.textSub,
            transform: isExpanded ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}>▼</div>
        </div>
      </div>

      {/* BODY ESPANSO */}
      {isExpanded && (
        <div style={{ padding: "0 12px 14px", borderTop: `1px solid ${T.border}` }}>
          {/* Quick info riepilogo */}
          <div style={{ padding: "10px 0", marginBottom: 4 }}>
            {row("Tipologia", v.tipo || "—")}
            {row("Dimensioni", `${lCentro} × ${hCentro} mm`)}
            {row("Stato misure", v.statoMisure === "confermate" ? "✓ Confermate" : "Provvisorie")}
          </div>

          {/* SISTEMA */}
          <div style={{ marginTop: 10 }}>
            {fieldLabel("Sistema")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SISTEMA_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("sistema", s)} style={chip(v.sistema === s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* APERTURA */}
          <div style={{ marginTop: 12 }}>
            {fieldLabel("Apertura")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {APERTURA_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("apertura", s)} style={chip(v.apertura === s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* VETRO */}
          <div style={{ marginTop: 12 }}>
            {fieldLabel("Vetro")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {VETRO_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("vetro", s)} style={chip(v.vetro === s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* COLORE */}
          <div style={{ marginTop: 12 }}>
            {fieldLabel("Colore")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {COLORE_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("colore", s)} style={chip(v.colore === s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* PREZZO + PEZZI */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
            <div>
              {fieldLabel("Prezzo unit. (€)")}
              <input
                type="number"
                value={v.prezzoManuale || ""}
                onChange={e => onUpdate("prezzoManuale", parseFloat(e.target.value) || 0)}
                placeholder={prezzo.toFixed(2)}
                style={input}
              />
            </div>
            <div>
              {fieldLabel("Pezzi")}
              <input
                type="number"
                min={1}
                value={v.pezzi || 1}
                onChange={e => onUpdate("pezzi", parseInt(e.target.value) || 1)}
                style={input}
              />
            </div>
          </div>

          {/* NOTE */}
          <div style={{ marginTop: 12 }}>
            {fieldLabel("Note")}
            <textarea
              value={v.note || ""}
              onChange={e => onUpdate("note", e.target.value)}
              rows={2}
              style={{ ...input, resize: "vertical" as const }}
              placeholder="Note per officina o cliente..."
            />
          </div>

          {/* BOTTONI AZIONE */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={onOpenCAD} style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${T.teal}`,
              background: "#fff",
              color: T.teal,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              🎨 Apri costruttore
            </button>
            {onDuplicate && (
              <button onClick={onDuplicate} style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: "#fff",
                color: T.textSub,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                Duplica
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${T.danger}40`,
                background: "#fff",
                color: T.danger,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                🗑
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
