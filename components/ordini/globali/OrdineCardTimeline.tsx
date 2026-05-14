"use client";

import { OrdineConCommessa } from "../ordini-types";

interface Props {
  ord: OrdineConCommessa;
  onClick: () => void;
  onQrClick: () => void;
}

const STEPS = [
  { key: "inviato", label: "Inviato" },
  { key: "confermato", label: "Conf." },
  { key: "in_transito", label: "Transito" },
  { key: "arrivato", label: "Arrivato" },
  { key: "verificato", label: "Chiuso" },
];

export default function OrdineCardTimeline({ ord, onClick }: Props) {
  const stato = ord.stato || "bozza";
  const currentIdx = STEPS.findIndex((s) => s.key === stato);
  const numero = ord.numero || ord.id.substring(0, 12);
  const fornitore = (ord as any).fornitore_nome || "—";
  const commessaCode = (ord as any).commessa?.code || "—";
  const cognome = (ord as any).commessa?.cognome || (ord as any).commessa?.cliente || "—";

  const borderColor = stato === "arrivato" || stato === "verificato" ? "#1F5A3F" :
    stato === "in_transito" || stato === "confermato" ? "#E8B05C" :
      stato === "inviato" ? "#3F7AC4" : "#8893A8";

  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 13, marginTop: 8,
      overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      cursor: "pointer", borderLeft: `5px solid ${borderColor}`
    }}>
      <div style={{ padding: "10px 12px 4px", display: "flex", alignItems: "flex-start", gap: 9 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: borderColor, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1A2A47", lineHeight: 1.15 }}>{fornitore}</div>
          <div style={{
            fontSize: 9.5, color: "#8893A8",
            fontFamily: "SF Mono, Menlo, monospace",
            letterSpacing: "0.4px", fontWeight: 700, marginTop: 2
          }}>{numero}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A2A47" }}>
            EUR {formatNum(ord.totale_imponibile || 0)}
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 14px 10px", display: "flex", alignItems: "center", position: "relative" }}>
        <div style={{
          position: "absolute", left: 24, right: 24, top: 14,
          height: 2, background: "#E8EAF0", borderRadius: 99
        }} />
        <div style={{
          position: "absolute", left: 24, top: 14, height: 2,
          background: borderColor, borderRadius: 99,
          width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * (100 - 13))}%`
        }} />
        {STEPS.map((s, i) => {
          const done = i < currentIdx;
          const curr = i === currentIdx;
          return (
            <div key={s.key} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", position: "relative", zIndex: 1
            }}>
              <div style={{
                width: 13, height: 13, borderRadius: "50%",
                background: done ? "#1F5A3F" : curr ? borderColor : "#E8EAF0",
                border: "2px solid #fff",
                boxShadow: curr ? `0 0 0 4px ${borderColor}40` : "none"
              }} />
              <div style={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: "0.3px",
                color: done ? "#1F5A3F" : curr ? borderColor : "#8893A8",
                textTransform: "uppercase", marginTop: 3, textAlign: "center"
              }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: "7px 12px 10px", borderTop: "1px dashed #E8EAF0",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 7
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", background: "rgba(232,176,92,0.15)",
          color: "#8B6926", borderRadius: 5,
          fontSize: 9.5, fontWeight: 800, letterSpacing: "0.4px"
        }}>{commessaCode}</span>
        <span style={{
          fontSize: 10.5, color: "#5A6478", fontWeight: 600,
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", flex: 1, marginLeft: 4
        }}>{cognome}</span>
      </div>
    </div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
