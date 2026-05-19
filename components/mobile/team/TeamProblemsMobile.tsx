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
    <div style={{ padding: "16px 16px 100px", fontFamily: "Inter, sans-serif" }}>
      {problems.map((p, i) => {
        const isPrimo = i === 0;
        const prioBg = p.priority === "Alta" ? PAL.altaBg : PAL.mediaBg;
        const prioTx = p.priority === "Alta" ? PAL.altaTx : PAL.mediaTx;

        return (
          <div key={p.id} style={{
            background: PAL.problemaBg,
            borderRadius: 16, padding: 16, marginBottom: 12,
          }}>
            {/* HEADER: titolo problema + tag priorità + tempo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              {/* H3 16px SemiBold */}
              <div style={{ fontSize: 15, fontWeight: 600, color: PAL.problemaText }}>
                {p.title}
              </div>
              <span style={{ fontSize: 11, color: PAL.textGrey, fontWeight: 500, flexShrink: 0 }}>{p.reported_ago}</span>
            </div>

            {/* Body 14px */}
            <div style={{ fontSize: 13, color: PAL.text, fontWeight: 500, marginBottom: 4 }}>
              Commessa {p.commessa_label || p.ordine_label}
            </div>
            <div style={{ fontSize: 12, color: PAL.textGrey, marginBottom: 12 }}>
              Segnalato da {p.reported_by}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                padding: "4px 12px", borderRadius: 999,
                background: prioBg, color: prioTx,
                fontSize: 11, fontWeight: 600,
              }}>{p.priority}</span>

              <button onClick={() => isPrimo ? onRisolvi?.(p) : onOpen?.(p)} style={{
                padding: "8px 18px", borderRadius: 12,
                background: isPrimo ? PAL.errorRed : PAL.gradEnd,
                color: "#FFFFFF", border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {isPrimo ? "Risolvi" : "Apri"}
              </button>
            </div>
          </div>
        );
      })}

      <div onClick={onVediTutti} style={{
        textAlign: "center" as any, marginTop: 16,
        fontSize: 13, fontWeight: 500, color: PAL.gradEnd,
        cursor: "pointer",
      }}>
        Vedi tutti i problemi
      </div>
    </div>
  );
}
