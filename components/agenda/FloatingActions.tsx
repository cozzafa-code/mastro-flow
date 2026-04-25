"use client";

import { useState } from "react";
import { useAgenda, type EventoTipo } from "@/hooks/useAgenda";

const AZIONI: { tipo: EventoTipo; lbl: string; color: string; ico: JSX.Element }[] = [
  { tipo: "sopralluogo", lbl: "Nuovo sopralluogo", color: "#7F77DD",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { tipo: "montaggio", lbl: "Nuovo montaggio", color: "#1D9E75",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13"/></svg> },
  { tipo: "produzione", lbl: "Nuova produzione", color: "#378ADD",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M5 20V8l4 4 4-8 4 4 4-4v16"/></svg> },
  { tipo: "ordine", lbl: "Nuovo ordine", color: "#EF9F27",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg> },
  { tipo: "problema", lbl: "Segnala problema", color: "#DC4444",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/></svg> },
];

export function FloatingActions() {
  const [open, setOpen] = useState(false);
  const { creaEvento } = useAgenda();

  const handleCrea = async (tipo: EventoTipo) => {
    setOpen(false);
    const titolo = prompt(`Titolo nuovo ${tipo}:`);
    if (!titolo) return;
    const cliente = prompt("Cliente:") ?? "";
    await creaEvento({ tipo, titolo, cliente, giorno: new Date().toISOString().slice(0,10) });
  };

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(13,31,31,0.55)", backdropFilter: "blur(4px)",
          }}/>
      )}

      {open && (
        <div style={{
          position: "fixed", bottom: 130, right: 18, zIndex: 81,
          display: "flex", flexDirection: "column", gap: 7,
          alignItems: "flex-end",
        }}>
          {AZIONI.map((a) => (
            <button key={a.tipo} type="button" onClick={() => handleCrea(a.tipo)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px 9px 9px", borderRadius: 99, border: 0, cursor: "pointer",
                background: a.color, color: "#fff",
                fontSize: 11, fontWeight: 900, letterSpacing: 0.3,
                boxShadow: `0 4px 14px ${a.color}66, inset 0 -2px 0 rgba(0,0,0,0.1)`,
                fontFamily: "inherit",
                animation: "fabPop 0.22s cubic-bezier(.2,.8,.2,1)",
              }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{a.ico}</span>
              {a.lbl}
            </button>
          ))}
          <style>{`@keyframes fabPop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}

      <button type="button" onClick={() => setOpen(!open)}
        aria-label="Aggiungi"
        style={{
          position: "fixed", bottom: 76, right: 18, zIndex: 82,
          width: 52, height: 52, borderRadius: "50%", border: 0, cursor: "pointer",
          background: open
            ? "linear-gradient(145deg, #FF8C8C, #DC4444)"
            : "linear-gradient(145deg, #28A0A0, #1E8080)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 22px rgba(40,160,160,0.5), inset 0 -3px 0 rgba(0,0,0,0.12)",
          transition: "transform 0.22s cubic-bezier(.2,.8,.2,1)",
          transform: open ? "rotate(45deg)" : "rotate(0)",
          fontFamily: "inherit",
        }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </>
  );
}
