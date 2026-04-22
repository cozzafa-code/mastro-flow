// components/VanoEditorAccordion.tsx
// Card "galattica" per il vano nel workspace preventivo:
// - preview SVG dark a sinistra con numero vano + tipo
// - body con pills stanza/piano/pezzi + misure grandi + chips accessori
// - prezzo a destra
// - barra status verde in fondo (misure, Uw, CE)
// Click per espandere → form inline sistema/vetro/colore/prezzo/pezzi/note.

import React from "react";

type Props = {
  vano: any;
  commessa: any;
  sistemiDB: any[];
  index: number;
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
  tealLight: "#9FE1CB",
  tealBg: "#E1F5EE",
  tealDark: "#0F6E56",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  warn: "#ff9500",
  warnBg: "#FAEEDA",
  warnText: "#854F0B",
  neutralBg: "#F1EFE8",
  neutralText: "#5F5E5A",
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
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onOpenCAD,
  onDuplicate,
  onDelete,
  onCalcPrezzo,
}: Props) {
  const v = vano;
  const mis = v.misure || {};
  const lCentro = mis.lCentro || v.larghezza || v.l || 0;
  const hCentro = mis.hCentro || v.altezza || v.h || 0;
  const pezzi = v.pezzi || 1;
  const prezzoUnit = onCalcPrezzo(v);
  const totale = prezzoUnit * pezzi;
  const mq = ((lCentro * hCentro) / 1000000).toFixed(2);
  const nMis = Object.values(mis).filter(x => (x as number) > 0).length;
  const misOk = nMis >= 6;

  const fmtPrezzo = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const pill = (txt: string, type: "ctx" | "qty" | "acc" | "neutral" = "neutral") => {
    const colors = {
      ctx: { bg: T.tealBg, color: T.tealDark },
      qty: { bg: T.tealLight, color: "#085041" },
      acc: { bg: T.warnBg, color: T.warnText },
      neutral: { bg: T.neutralBg, color: T.neutralText },
    }[type];
    return (
      <span style={{
        fontSize: 10, padding: "3px 8px", borderRadius: 4,
        background: colors.bg, color: colors.color, fontWeight: 600,
        whiteSpace: "nowrap" as const,
      }}>{txt}</span>
    );
  };

  const fieldLabel = (txt: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
      {txt}
    </div>
  );

  const chip = (sel: boolean): React.CSSProperties => ({
    padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
    cursor: "pointer",
    background: sel ? T.teal : T.lightBg,
    color: sel ? "#fff" : T.textDark,
    border: `1px solid ${sel ? T.teal : T.border}`,
    userSelect: "none" as const,
  });

  const input: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${T.border}`, fontSize: 12,
    fontFamily: "inherit", boxSizing: "border-box" as const,
  };

  const accessori: { label: string }[] = [];
  if (v.controtelaio && v.controtelaio !== "Nessuno") accessori.push({ label: v.controtelaio });
  if (v.accessori?.tapparella?.attivo) accessori.push({ label: "Tapparella" });
  if (v.accessori?.persiana?.attivo) accessori.push({ label: "Persiana" });
  if (v.accessori?.zanzariera?.attivo) accessori.push({ label: "Zanzariera" });

  return (
    <div style={{
      background: T.cardBg, borderRadius: 12,
      border: `1px solid ${isExpanded ? T.teal : T.border}`,
      marginBottom: 10, overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* ── HEADER RICCO ── */}
      <div onClick={onToggle} style={{ display: "flex", alignItems: "stretch", cursor: "pointer" }}>

        {/* Preview dark sinistra */}
        <div style={{
          width: 92, background: T.darkBg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "10px 6px", position: "relative", flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: 6, left: 6,
            background: T.teal, color: "#fff",
            fontSize: 10, fontWeight: 700,
            padding: "2px 7px", borderRadius: 6,
          }}>#{index + 1}</div>
          <svg viewBox="0 0 60 72" width="48" height="58" style={{ marginTop: 10 }}>
            <rect x="2" y="2" width="56" height="68" fill="none" stroke={T.teal} strokeWidth="2" rx="2"/>
            {(v.tipo || "").startsWith("F2") || (v.tipo || "").startsWith("PF2") ? (
              <line x1="30" y1="2" x2="30" y2="70" stroke={T.teal} strokeWidth="1.5"/>
            ) : null}
            <circle cx="24" cy="36" r="1.5" fill={T.teal}/>
            <circle cx="36" cy="36" r="1.5" fill={T.teal}/>
          </svg>
          <div style={{ color: T.tealLight, fontSize: 10, fontWeight: 700, marginTop: 4, letterSpacing: 0.5 }}>
            {v.tipo || "?"}
          </div>
        </div>

        {/* Corpo info */}
        <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
          {/* Riga 1: nome + pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.textDark }}>
              {v.nome || `Vano ${index + 1}`}
            </span>
            {v.stanza && pill(v.stanza, "ctx")}
            {v.piano && pill(v.piano, "ctx")}
            {pezzi > 0 && pill(`${pezzi} pz`, "qty")}
          </div>

          {/* Riga 2: misure grandi */}
          <div style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 8 }}>
            {lCentro} × {hCentro}
            <span style={{ fontSize: 11, color: T.textSub, fontWeight: 500 }}> mm</span>
            <span style={{ marginLeft: 10, fontSize: 12, color: T.textSub, fontWeight: 500 }}>· {mq} m²</span>
          </div>

          {/* Riga 3: chips specifiche + accessori */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
            {v.sistema && pill(v.sistema, "neutral")}
            {v.colore && pill(v.colore, "neutral")}
            {v.vetro && pill(v.vetro.split(" ")[0], "neutral")}
            {accessori.map((a, i) => (
              <React.Fragment key={i}>{pill(a.label, "acc")}</React.Fragment>
            ))}
          </div>
        </div>

        {/* Prezzo destra */}
        <div style={{
          borderLeft: `1px solid ${T.border}`, padding: "12px 14px",
          display: "flex", flexDirection: "column",
          alignItems: "flex-end", justifyContent: "center",
          minWidth: 90,
        }}>
          <div style={{ fontSize: 9, color: T.textSub, letterSpacing: 0.5, textTransform: "uppercase" }}>Totale</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.textDark }}>
            €{fmtPrezzo(totale)}
          </div>
          <div style={{ fontSize: 10, color: T.textSub }}>
            {fmtPrezzo(prezzoUnit)} € × {pezzi}
          </div>
        </div>
      </div>

      {/* ── BARRA STATUS ── */}
      <div onClick={onToggle} style={{
        background: misOk ? T.tealBg : "#FAEEDA",
        padding: "6px 14px", display: "flex", alignItems: "center", gap: 8,
        fontSize: 10, fontWeight: 600,
        color: misOk ? T.tealDark : T.warnText,
        cursor: "pointer",
      }}>
        <span style={{
          display: "inline-block", width: 6, height: 6, borderRadius: "50%",
          background: misOk ? "#1D9E75" : T.warn,
        }}></span>
        {misOk ? `Misure confermate · ${nMis}/6` : `Misure incomplete · ${nMis}/6`}
        {v.uw && ` · Uw ${v.uw} W/m²K`}
        {v.ceClass && ` · CE ${v.ceClass}`}
        <span style={{
          marginLeft: "auto", color: T.textSub,
          transform: isExpanded ? "rotate(180deg)" : "none",
          transition: "transform 0.15s",
        }}>▼</span>
      </div>

      {/* ── BODY ESPANSO ── */}
      {isExpanded && (
        <div style={{ padding: "14px 14px 16px", borderTop: `1px solid ${T.border}` }}>

          {/* SISTEMA */}
          <div style={{ marginBottom: 12 }}>
            {fieldLabel("Sistema")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {SISTEMA_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("sistema", s)} style={chip(v.sistema === s)}>{s}</div>
              ))}
            </div>
          </div>

          {/* APERTURA */}
          <div style={{ marginBottom: 12 }}>
            {fieldLabel("Apertura")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {APERTURA_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("apertura", s)} style={chip(v.apertura === s)}>{s}</div>
              ))}
            </div>
          </div>

          {/* VETRO */}
          <div style={{ marginBottom: 12 }}>
            {fieldLabel("Vetro")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {VETRO_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("vetro", s)} style={chip(v.vetro === s)}>{s}</div>
              ))}
            </div>
          </div>

          {/* COLORE */}
          <div style={{ marginBottom: 12 }}>
            {fieldLabel("Colore")}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {COLORE_OPTS.map(s => (
                <div key={s} onClick={() => onUpdate("colore", s)} style={chip(v.colore === s)}>{s}</div>
              ))}
            </div>
          </div>

          {/* PREZZO + PEZZI */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div>
              {fieldLabel("Prezzo unit. (€)")}
              <input
                type="number"
                value={v.prezzoManuale || ""}
                onChange={e => onUpdate("prezzoManuale", parseFloat(e.target.value) || 0)}
                placeholder={prezzoUnit.toFixed(2)}
                style={input}
              />
            </div>
            <div>
              {fieldLabel("Pezzi")}
              <input
                type="number" min={1} value={pezzi}
                onChange={e => onUpdate("pezzi", parseInt(e.target.value) || 1)}
                style={input}
              />
            </div>
          </div>

          {/* NOTE */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel("Note")}
            <textarea
              value={v.note || ""}
              onChange={e => onUpdate("note", e.target.value)}
              rows={2}
              style={{ ...input, resize: "vertical" as const }}
              placeholder="Note per officina o cliente..."
            />
          </div>

          {/* AZIONI */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => alert("Costruttore CAD prossimamente — per ora modifica via form sopra.")} style={{
              flex: 1, padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.lightBg,
              color: T.textSub, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", opacity: 0.6,
            }}>
              🎨 Costruttore (presto)
            </button>
            {onDuplicate && (
              <button onClick={onDuplicate} style={{
                padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: "#fff",
                color: T.textSub, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Duplica</button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{
                padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${T.danger}40`, background: "#fff",
                color: T.danger, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>🗑</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
