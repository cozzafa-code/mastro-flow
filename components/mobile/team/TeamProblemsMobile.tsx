// components/mobile/team/TeamProblemsMobile.tsx
"use client";
import React from "react";
import type { TeamProblem } from "@/lib/types/team";
import { TT, STATUS_COLORS } from "@/lib/types/team";

interface Props {
  problems: TeamProblem[];
  onOpen?: (p: TeamProblem) => void;
  onRisolvi?: (p: TeamProblem) => void;
  onVediTutti?: () => void;
}

export default function TeamProblemsMobile({ problems, onOpen, onRisolvi, onVediTutti }: Props) {
  return (
    <div style={{ padding: "12px 14px 90px" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: TT.text, marginBottom: 10 }}>
        Problemi aperti
      </div>

      {problems.length === 0 && (
        <div style={{ padding: "30px 16px", textAlign: "center", color: TT.sub, fontSize: 13 }}>
          Nessun problema aperto
        </div>
      )}

      {problems.map(p => (
        <div key={p.id} style={{
          background: STATUS_COLORS.problema.bgPastel,
          borderRadius: 16, padding: "12px 14px", marginBottom: 10,
          boxShadow: "0 2px 8px rgba(13,31,31,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_COLORS.problema.dot }} />
                <span style={{ fontSize: 13, fontWeight: 900, color: STATUS_COLORS.problema.tag }}>
                  {p.title}
                </span>
              </div>
              <div style={{ fontSize: 11, color: TT.text, fontWeight: 700, marginBottom: 2 }}>
                {p.commessa_label || p.ordine_label || "—"}
              </div>
              <div style={{ fontSize: 10, color: TT.sub }}>
                Segnalato da {p.reported_by}
              </div>
              {p.blocca_cantiere && (
                <div style={{ marginTop: 6, display: "inline-block", padding: "2px 8px", background: STATUS_COLORS.problema.tag, color: "#fff", borderRadius: 999, fontSize: 9, fontWeight: 900, letterSpacing: 0.4 }}>
                  BLOCCA CANTIERE
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: TT.sub, fontWeight: 700 }}>{p.reported_ago}</span>
              <button onClick={() => p.blocca_cantiere ? onRisolvi?.(p) : onOpen?.(p)} style={{
                padding: "6px 14px", borderRadius: 8,
                background: STATUS_COLORS.problema.tag, color: "#fff",
                border: "none", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              }}>
                {p.blocca_cantiere ? "Risolvi" : "Apri"}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div onClick={onVediTutti} style={{
        textAlign: "center", marginTop: 14,
        fontSize: 12, fontWeight: 800, color: TT.acc,
        textDecoration: "underline", cursor: "pointer",
      }}>
        Vedi tutti i problemi
      </div>
    </div>
  );
}
