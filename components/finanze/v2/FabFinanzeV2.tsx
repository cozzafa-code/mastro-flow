"use client";
import React from "react";

interface Props {
  open: boolean;
  onToggle: () => void;
  onNuovaFattura: () => void;
  onPagamentoIn: () => void;
  onNuovaSpesa: () => void;
  onPagamentoOut: () => void;
  onFatturaRic: () => void;
  onTasse: () => void;
}

const SV = {
  plus: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} /></svg>,
  close: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} /></svg>,
  doc: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1={12} y1={18} x2={12} y2={12} /><line x1={9} y1={15} x2={15} y2={15} /></svg>,
  arrDown: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1={12} y1={5} x2={12} y2={19} /><polyline points="19 12 12 19 5 12" /></svg>,
  cam: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx={12} cy={13} r={4} /></svg>,
  arrUp: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1={12} y1={19} x2={12} y2={5} /><polyline points="5 12 12 5 19 12" /></svg>,
  inbox: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>,
  cal: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1={16} y1={13} x2={8} y2={13} /><line x1={16} y1={17} x2={8} y2={17} /></svg>,
};

// Bottom alto per non coprire tab bar Home (~70px altezza)
const FAB_BOTTOM = 96;
const MENU_BOTTOM = FAB_BOTTOM + 62;

const ACTIONS: { lbl: string; color: string; key: keyof Props; ico: keyof typeof SV }[] = [
  { lbl: "Nuova fattura",      color: "#E8830C", key: "onNuovaFattura",  ico: "doc" },
  { lbl: "Pagamento ricevuto", color: "#0F6E56", key: "onPagamentoIn",   ico: "arrDown" },
  { lbl: "Nuova spesa",        color: "#E8B05C", key: "onNuovaSpesa",    ico: "cam" },
  { lbl: "Pagamento fornitore",color: "#C73E1D", key: "onPagamentoOut",  ico: "arrUp" },
  { lbl: "Fattura ricevuta",   color: "#8B5CF6", key: "onFatturaRic",    ico: "inbox" },
  { lbl: "Vai a Tasse",        color: "#28A0A0", key: "onTasse",         ico: "cal" },
];

export default function FabFinanzeV2(props: Props) {
  const { open, onToggle } = props;
  return (
    <>
      {open && (
        <div
          onClick={onToggle}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,31,51,0.5)",
            backdropFilter: "blur(2px)" as any,
            WebkitBackdropFilter: "blur(2px)" as any,
            zIndex: 9850,
          }}
        />
      )}
      {open && (
        <div style={{
          position: "fixed", bottom: MENU_BOTTOM, right: 24,
          display: "flex", flexDirection: "column", gap: 10,
          alignItems: "flex-end", zIndex: 9860,
        }}>
          {ACTIONS.map((a) => (
            <div key={a.lbl} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                background: "rgba(15,31,51,0.92)",
                color: "#fff",
                padding: "6px 11px", borderRadius: 8,
                fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
              }}>{a.lbl}</div>
              <button
                onClick={() => (props as any)[a.key]?.()}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: a.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2.5px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                }}
              >
                {SV[a.ico]}
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onToggle}
        style={{
          position: "fixed", bottom: FAB_BOTTOM, right: 24,
          width: 54, height: 54, borderRadius: "50%",
          background: open ? "#C73E1D" : "#28A0A0",
          border: `3px solid ${open ? "#8E2A14" : "#1a6b6b"}`,
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: open ? "0 6px 20px rgba(199,62,29,0.5)" : "0 6px 20px rgba(40,160,160,0.5)",
          cursor: "pointer",
          transition: "background 0.2s, border-color 0.2s",
          zIndex: 9870,
        }}
        title={open ? "Chiudi" : "Azioni veloci"}
      >
        {open ? SV.close : SV.plus}
      </button>
    </>
  );
}
