// components/mobile/team/NewTeamActionSheetMobile.tsx
"use client";
import React from "react";
import { PAL } from "@/lib/types/team";
import { IcoTask, IcoUsers, IcoAlert, IcoUserPlus, IcoMapPin, IcoEdit } from "./icons";

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
    { lbl: "Nuovo task",     desc: "Assegna un nuovo task",     bg: PAL.attivoBg,   tx: PAL.attivoText,   icon: <IcoTask s={22} />,    fn: p.onNuovoTask },
    { lbl: "Nuova squadra",  desc: "Crea una nuova squadra",    bg: PAL.viaggioBg,  tx: PAL.viaggioText,  icon: <IcoUsers s={22} />,   fn: p.onNuovaSquadra },
    { lbl: "Nuovo problema", desc: "Segnala un problema",       bg: PAL.problemaBg, tx: PAL.problemaText, icon: <IcoAlert s={22} />,   fn: p.onNuovoProblema },
    { lbl: "Assegna lavoro", desc: "Assegna lavoro a operatore",bg: "#FFEDD5",      tx: "#EA580C",        icon: <IcoUserPlus s={22}/>, fn: p.onAssegnaLavoro },
    { lbl: "Apri mappa team",desc: "Vedi tutti sulla mappa",    bg: "#E0F2EE",      tx: PAL.gradEnd,      icon: <IcoMapPin s={22} />,  fn: p.onApriMappa },
    { lbl: "Nota veloce",    desc: "Scrivi una nota rapida",    bg: "#F3E8FF",      tx: "#7E22CE",        icon: <IcoEdit s={22} />,    fn: p.onNotaVeloce },
  ];

  return (
    <div onClick={p.onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.5)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: PAL.pageBg, width: "100%", maxWidth: 480,
        borderRadius: "20px 20px 0 0", padding: "16px 16px 24px",
      }}>
        <div style={{ width: 40, height: 4, background: PAL.border, borderRadius: 999, margin: "0 auto 16px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ACTIONS.map(a => (
            <div key={a.lbl} onClick={a.fn} style={{
              background: a.bg, borderRadius: 16, padding: "16px 14px",
              cursor: "pointer",
            }}>
              <div style={{ color: a.tx, marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: PAL.text }}>{a.lbl}</div>
              <div style={{ fontSize: 11, color: PAL.textGrey, marginTop: 2 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
