// components/mobile/agenda/AgendaProblemsMobile.tsx
"use client";
import React, { useMemo, useState } from "react";
import type { AgendaEvent } from "../../../lib/types/agenda";

interface ProblemRow {
  id: string;
  titolo: string;
  riferimento: string; // es. "S-0001 · Verdi"
  segnalatoDa: string;
  badge: string; // "Oggi" / "Ieri" / "2g fa"
  risolto: boolean;
}

interface Props {
  events: AgendaEvent[];
  onSegnala: () => void;
  onTap: (id: string) => void;
  onBack?: () => void;
}

const MOCK_PROBLEMS: ProblemRow[] = [
  { id: "p1", titolo: "VETRO NON ARRIVATO", riferimento: "S-0001 · Verdi", segnalatoDa: "Marco", badge: "Oggi", risolto: false },
  { id: "p2", titolo: "RITARDO FORNITORE", riferimento: "Ordine 9122C", segnalatoDa: "Luca", badge: "Ieri", risolto: false },
  { id: "p3", titolo: "MISURE DA VERIFICARE", riferimento: "S-0002 · Bianchi", segnalatoDa: "Fabio", badge: "2g fa", risolto: false },
];

export default function AgendaProblemsMobile({ events, onSegnala, onTap, onBack }: Props) {
  const [tab, setTab] = useState<"aperti" | "risolti">("aperti");

  // Combino mock + eventi reali tipo problema
  const problemiFromEvents: ProblemRow[] = useMemo(
    () =>
      events
        .filter((e) => e.tipo === "problema")
        .map((e) => ({
          id: e.id,
          titolo: e.titolo.toUpperCase(),
          riferimento: `${e.commessaCode || ""}${e.cliente ? " · " + e.cliente : ""}`.trim().replace(/^·\s/, ""),
          segnalatoDa: e.persone?.[0] || "—",
          badge: "Oggi",
          risolto: e.stato === "completato",
        })),
    [events]
  );

  const all = useMemo(() => {
    // dedup tra mock e events
    const seen = new Set<string>();
    const out: ProblemRow[] = [];
    [...problemiFromEvents, ...MOCK_PROBLEMS].forEach((p) => {
      const k = p.titolo + "|" + p.riferimento;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(p);
      }
    });
    return out;
  }, [problemiFromEvents]);

  const aperti = all.filter((p) => !p.risolto);
  const risolti = all.filter((p) => p.risolto);
  const lista = tab === "aperti" ? aperti : risolti;

  return (
    <div style={{ background: "#F8FAFA", minHeight: "100vh", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "44px 18px 14px", borderBottom: "1px solid #E4E4E7", display: "flex", alignItems: "center", gap: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D1F1F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0D1F1F" }}>Problemi</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, padding: "12px 16px", background: "#fff", borderBottom: "1px solid #E4E4E7" }}>
        {(["aperti", "risolti"] as const).map((t) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px 0",
              borderBottom: tab === t ? "2.5px solid #BE123C" : "2.5px solid transparent",
              fontSize: 13,
              fontWeight: tab === t ? 900 : 600,
              color: tab === t ? "#0D1F1F" : "#71717A",
              cursor: "pointer",
              textTransform: "capitalize" as const,
            }}
          >
            {t} {t === "aperti" && aperti.length > 0 && (
              <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 8, background: "#FFE4E6", color: "#BE123C", fontSize: 10, fontWeight: 900 }}>
                {aperti.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Lista */}
      <div style={{ padding: 16 }}>
        {lista.length === 0 ? (
          <div style={{ fontSize: 13, color: "#71717A", padding: "30px 0", textAlign: "center" }}>
            Nessun problema {tab === "aperti" ? "aperto" : "risolto"}
          </div>
        ) : (
          lista.map((p) => (
            <div
              key={p.id}
              onClick={() => onTap(p.id)}
              style={{
                background: "#fff",
                borderRadius: 14,
                borderLeft: "4px solid #BE123C",
                padding: "14px 14px",
                marginBottom: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BE123C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#BE123C", letterSpacing: 0.4 }}>{p.titolo}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#0D1F1F", marginTop: 4, fontWeight: 700 }}>{p.riferimento}</div>
                  <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>Segnalato da {p.segnalatoDa}</div>
                </div>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: 8,
                    background: "#FFE4E6",
                    color: "#BE123C",
                    fontSize: 10,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.badge}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottone segnala */}
      <div style={{ position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 50 }}>
        <button
          onClick={onSegnala}
          style={{
            width: "100%",
            padding: 14,
            background: "linear-gradient(135deg, #28A0A0 0%, #1A7A7A 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(40,160,160,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Segnala problema
        </button>
      </div>
    </div>
  );
}
