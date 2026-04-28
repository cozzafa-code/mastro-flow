// components/mobile/team/NewTeamActionSheetMobile.tsx
"use client";
import React from "react";
import { PAL } from "@/lib/types/team";

interface Props {
  onClose: () => void;
  onNuovoTask: () => void;
  onNuovaSquadra: () => void;
  onNuovoProblema: () => void;
  onAssegnaLavoro: () => void;
  onApriMappa: () => void;
  onNotaVeloce: () => void;
}

const ICO = {
  task: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  squadra: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  problema: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  assegna: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  mappa: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  nota: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

export default function NewTeamActionSheetMobile(p: Props) {
  const ACTIONS = [
    { lbl: "Nuovo task",     desc: "Assegna un nuovo task",     bg: "#DCFCE7", tx: PAL.attivoText, icon: ICO.task,     fn: p.onNuovoTask },
    { lbl: "Nuova squadra",  desc: "Crea una nuova squadra",    bg: "#DBEAFE", tx: PAL.viaggioText, icon: ICO.squadra, fn: p.onNuovaSquadra },
    { lbl: "Nuovo problema", desc: "Segnala un problema",        bg: "#FEE2E2", tx: PAL.problemaText, icon: ICO.problema, fn: p.onNuovoProblema },
    { lbl: "Assegna lavoro", desc: "Assegna lavoro a operatore", bg: "#FFEDD5", tx: PAL.fermoText,   icon: ICO.assegna, fn: p.onAssegnaLavoro },
    { lbl: "Apri mappa team",desc: "Vedi tutti sulla mappa",     bg: "#E0F2EE", tx: PAL.tealDark,    icon: ICO.mappa,   fn: p.onApriMappa },
    { lbl: "Nota veloce",    desc: "Scrivi una nota rapida",     bg: "#F3E8FF", tx: "#7E22CE",       icon: ICO.nota,    fn: p.onNotaVeloce },
  ];

  return (
    <div onClick={p.onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.45)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: PAL.pageBg, width: "100%", maxWidth: 480,
        borderRadius: "20px 20px 0 0", padding: "16px 14px 24px",
      }}>
        <div style={{ width: 40, height: 4, background: "#E5E0D6", borderRadius: 999, margin: "0 auto 14px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ACTIONS.map(a => (
            <div key={a.lbl} onClick={a.fn} style={{
              background: a.bg, borderRadius: 14, padding: "14px 12px",
              cursor: "pointer",
            }}>
              <div style={{ color: a.tx, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: PAL.text }}>{a.lbl}</div>
              <div style={{ fontSize: 10, color: PAL.textSub, marginTop: 2 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
