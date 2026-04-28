// components/mobile/team/NewTeamActionSheetMobile.tsx
"use client";
import React from "react";
import { TT } from "@/lib/types/team";

interface Props {
  onClose: () => void;
  onNuovoTask: () => void;
  onNuovaSquadra: () => void;
  onNuovoProblema: () => void;
  onAssegnaLavoro: () => void;
  onApriMappa: () => void;
  onNotaVeloce: () => void;
}

export default function NewTeamActionSheetMobile(p: Props) {
  const ACTIONS = [
    { lbl: "Nuovo task",     bg: "#DCFCE7", tx: "#15803D", icon: "📝", fn: p.onNuovoTask },
    { lbl: "Nuova squadra",  bg: "#DBEAFE", tx: "#1D4ED8", icon: "👥", fn: p.onNuovaSquadra },
    { lbl: "Nuovo problema", bg: "#FEE2E2", tx: "#B91C1C", icon: "⚠", fn: p.onNuovoProblema },
    { lbl: "Assegna lavoro", bg: "#FEF3C7", tx: "#B45309", icon: "🔨", fn: p.onAssegnaLavoro },
    { lbl: "Apri mappa",     bg: "#E0F2EE", tx: TT.acc,    icon: "🗺", fn: p.onApriMappa },
    { lbl: "Nota veloce",    bg: "#F3E8FF", tx: "#7E22CE", icon: "✏",  fn: p.onNotaVeloce },
  ];
  return (
    <div onClick={p.onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.55)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: TT.card, width: "100%", maxWidth: 480,
        borderRadius: "20px 20px 0 0", padding: "16px 16px 26px",
      }}>
        <div style={{ width: 40, height: 4, background: "#E0E0E0", borderRadius: 999, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 16, fontWeight: 900, color: TT.text, marginBottom: 14 }}>
          Nuova azione team
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {ACTIONS.map(a => (
            <div key={a.lbl} onClick={a.fn} style={{
              background: a.bg, color: a.tx, padding: "16px 8px",
              borderRadius: 14, textAlign: "center" as any, cursor: "pointer",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{a.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
