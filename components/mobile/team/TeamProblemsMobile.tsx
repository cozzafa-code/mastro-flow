// components/mobile/team/TeamProblemsMobile.tsx
"use client";
import React from "react";
import type { TeamProblem } from "@/lib/types/team";
import { PAL } from "@/lib/types/team";

interface Props {
  problems: TeamProblem[];
  onOpen?: (p: TeamProblem) => void;
  onRisolvi?: (p: TeamProblem) => void;
  onVediTutti?: () => void;
}

export default function TeamProblemsMobile({ problems, onOpen, onRisolvi, onVediTutti }: Props) {
  return (
    <div style={{ padding: "16px 14px 100px" }}>
      {problems.map((p, i) => {
        const isPrimo = i === 0; // il primo nel mockup ha "Risolvi" rosso, gli altri "Apri"
        const prioBg = p.priority === "Alta" ? PAL.altaBg : PAL.mediaBg;
        const prioTx = p.priority === "Alta" ? PAL.altaTx : PAL.mediaTx;

        return (
          <div key={p.id} style={{
            background: PAL.problemaBg,
            borderRadius: 14, padding: "12px 14px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: PAL.problemaText }}>
                {p.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: PAL.textSub, fontWeight: 600 }}>{p.reported_ago}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: PAL.text, fontWeight: 600, marginBottom: 2 }}>
              {p.commessa_label || p.ordine_label}
            </div>
            <div style={{ fontSize: 11, color: PAL.textSub, marginBottom: 10 }}>
              Segnalato da {p.reported_by}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                padding: "3px 10px", borderRadius: 999,
                background: prioBg, color: prioTx,
                fontSize: 11, fontWeight: 700,
              }}>{p.priority}</span>

              <button onClick={() => isPrimo ? onRisolvi?.(p) : onOpen?.(p)} style={{
                padding: "7px 18px", borderRadius: 10,
                background: isPrimo ? PAL.problemaText : PAL.tealDark,
                color: "#fff", border: "none",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                {isPrimo ? "Risolvi" : "Apri"}
              </button>
            </div>
          </div>
        );
      })}

      <div onClick={onVediTutti} style={{
        textAlign: "center" as any, marginTop: 16,
        fontSize: 13, fontWeight: 600, color: PAL.tealDark,
        cursor: "pointer",
      }}>
        Vedi tutti i problemi
      </div>
    </div>
  );
}
