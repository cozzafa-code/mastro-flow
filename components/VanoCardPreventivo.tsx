// components/VanoCardPreventivo.tsx
// Card "galattica" per il vano nel workspace preventivo.
// SOLO VISTA: click apre VanoDetailPanel fullscreen per edit completo.
// Preview SVG a sinistra, info ricche al centro, prezzo destra, barra status sotto.

import React from "react";

type Props = {
  vano: any;
  commessa: any;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onClickEdit: () => void;
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
};

export default function VanoCardPreventivo({
  vano,
  commessa,
  index,
  isSelected = false,
  onToggleSelect,
  onClickEdit,
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

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

  const accessori: string[] = [];
  if (v.controtelaio && v.controtelaio !== "Nessuno") accessori.push(v.controtelaio);
  if (v.accessori?.tapparella?.attivo) accessori.push("Tapparella");
  if (v.accessori?.persiana?.attivo) accessori.push("Persiana");
  if (v.accessori?.zanzariera?.attivo) accessori.push("Zanzariera");

  return (
    <div
      onClick={onClickEdit}
      style={{
        background: T.cardBg,
        borderRadius: 12,
        border: `2px solid ${isSelected ? T.teal : T.border}`,
        marginBottom: 10,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: isSelected ? `0 0 0 3px ${T.teal}20` : "none",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "stretch" }}>

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
          {onToggleSelect && (
            <div onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              style={{
                position: "absolute", top: 6, right: 6,
                width: 22, height: 22, borderRadius: 6,
                background: isSelected ? T.teal : "rgba(255,255,255,0.15)",
                border: `2px solid ${isSelected ? T.teal : "rgba(255,255,255,0.4)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 900,
                cursor: "pointer",
              }}>
              {isSelected ? "✓" : ""}
            </div>
          )}
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.textDark }}>
              {v.nome || `Vano ${index + 1}`}
            </span>
            {v.stanza && pill(v.stanza, "ctx")}
            {v.piano && pill(v.piano, "ctx")}
            {pezzi > 0 && pill(`${pezzi} pz`, "qty")}
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 8 }}>
            {lCentro} × {hCentro}
            <span style={{ fontSize: 11, color: T.textSub, fontWeight: 500 }}> mm</span>
            <span style={{ marginLeft: 10, fontSize: 12, color: T.textSub, fontWeight: 500 }}>· {mq} m²</span>
          </div>

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
            {v.sistema && pill(v.sistema, "neutral")}
            {v.colore && pill(v.colore, "neutral")}
            {v.vetro && pill(v.vetro.split(" ")[0], "neutral")}
            {accessori.map((a, i) => (
              <React.Fragment key={i}>{pill(a, "acc")}</React.Fragment>
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
            €{fmt(totale)}
          </div>
          {pezzi > 1 && (
            <div style={{ fontSize: 10, color: T.textSub }}>
              {fmt(prezzoUnit)} × {pezzi}
            </div>
          )}
        </div>
      </div>

      {/* ── BARRA STATUS ── */}
      <div style={{
        background: misOk ? T.tealBg : T.warnBg,
        padding: "6px 14px", display: "flex", alignItems: "center", gap: 8,
        fontSize: 10, fontWeight: 600,
        color: misOk ? T.tealDark : T.warnText,
      }}>
        <span style={{
          display: "inline-block", width: 6, height: 6, borderRadius: "50%",
          background: misOk ? "#1D9E75" : T.warn,
        }}></span>
        {misOk ? `Misure confermate · ${nMis}/6` : `Misure incomplete · ${nMis}/6`}
        {v.uw && ` · Uw ${v.uw} W/m²K`}
        {v.ceClass && ` · CE ${v.ceClass}`}
        <span style={{ marginLeft: "auto", color: T.textSub, fontWeight: 500 }}>
          Tocca per modificare →
        </span>
      </div>
    </div>
  );
}
