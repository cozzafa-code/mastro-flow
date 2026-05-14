"use client";

import { OrdineStato } from "../ordini-types";

export interface ActiveFilter { key: string; label: string; value: string; }

interface Props {
  attivo: string;
  onAttivo: (s: string) => void;
  counts: Record<string, number>;
  attiviChips: ActiveFilter[];
  onRemoveChip: (key: string) => void;
  onReset: () => void;
}

const PILLS: { key: string; label: string; dot?: string }[] = [
  { key: "tutti", label: "Tutti" },
  { key: "bozza", label: "Bozza", dot: "#8893A8" },
  { key: "inviato", label: "Inviati", dot: "#3F7AC4" },
  { key: "in_transito", label: "Transito", dot: "#E8B05C" },
  { key: "arrivato", label: "Arrivati", dot: "#1F5A3F" },
  { key: "in_ritardo", label: "Ritardo", dot: "#C44545" },
];

export default function GlobaliFilters(p: Props) {
  return (
    <>
      <div style={{
        margin: "9px 0 0", padding: "0 14px", display: "flex", gap: 6,
        overflowX: "auto", paddingBottom: 2,
        scrollbarWidth: "none" as any
      }}>
        {PILLS.map((pill) => {
          const active = p.attivo === pill.key;
          const count = p.counts[pill.key] || 0;
          return (
            <div key={pill.key} onClick={() => p.onAttivo(pill.key)} style={{
              padding: "6px 11px",
              background: active ? "#1A2A47" : "#fff",
              borderRadius: 99, fontSize: 11, fontWeight: 700,
              color: active ? "#fff" : "#1A2A47",
              whiteSpace: "nowrap", display: "inline-flex",
              alignItems: "center", gap: 5,
              border: active ? "1.5px solid #1A2A47" : "1.5px solid transparent",
              flexShrink: 0,
              boxShadow: active ? "0 2px 6px rgba(26,42,71,0.3)" : "0 1px 2px rgba(0,0,0,0.05)",
              cursor: "pointer"
            }}>
              {pill.dot && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: pill.dot, flexShrink: 0
                }} />
              )}
              {pill.label}
              <span style={{
                fontSize: 9.5,
                background: active ? "rgba(255,255,255,0.18)" : "#EEF2F7",
                padding: "1px 6px", borderRadius: 99, fontWeight: 800,
                color: active ? "#fff" : "#5A6478"
              }}>{count}</span>
            </div>
          );
        })}
      </div>

      {p.attiviChips.length > 0 && (
        <div style={{
          margin: "8px 14px 0", display: "flex", alignItems: "center",
          gap: 5, fontSize: 10, flexWrap: "wrap"
        }}>
          <span style={{
            color: "rgba(26,42,71,0.65)", fontWeight: 700,
            letterSpacing: "0.3px", display: "inline-flex", alignItems: "center", gap: 4
          }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtri:
          </span>
          {p.attiviChips.map((c) => (
            <span key={c.key} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 8px", background: "rgba(40,160,160,0.18)",
              color: "#1a6b6b", borderRadius: 99,
              fontSize: 10, fontWeight: 800
            }}>
              <span style={{
                fontSize: 8.5, letterSpacing: "0.5px",
                textTransform: "uppercase", opacity: 0.75
              }}>{c.label}</span>
              {c.value}
              <span onClick={() => p.onRemoveChip(c.key)} style={{
                width: 14, height: 14, background: "rgba(40,160,160,0.3)",
                borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, cursor: "pointer", marginLeft: 1
              }}>x</span>
            </span>
          ))}
          <span onClick={p.onReset} style={{
            marginLeft: "auto", fontSize: 9.5, color: "#5A6478",
            fontWeight: 800, letterSpacing: "0.5px",
            textDecoration: "underline", cursor: "pointer"
          }}>reset</span>
        </div>
      )}
    </>
  );
}
