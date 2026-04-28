// components/mobile/team/TeamMapMobile.tsx
"use client";
import React from "react";
import type { Operator } from "@/lib/types/team";
import { TT, STATUS_COLORS } from "@/lib/types/team";

interface Props {
  operators: Operator[];
  onBack: () => void;
  onOpenOperator?: (op: Operator) => void;
}

/**
 * Mappa stilizzata: SVG di sfondo a strade verde-tenue + pin operatori
 * posizionati relativamente. Quando avremo Mapbox/Leaflet, sostituiamo.
 */
export default function TeamMapMobile({ operators, onBack, onOpenOperator }: Props) {
  return (
    <div style={{ background: TT.bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* HEADER */}
      <div style={{
        background: TT.headerGrad,
        padding: "16px 16px 22px",
        borderRadius: "0 0 22px 22px",
        color: "#fff",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 900 }}>Mappa team</div>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
        </div>
      </div>

      {/* MAPPA */}
      <div style={{ position: "relative", height: 380, margin: "12px 0 0", overflow: "hidden", background: "#E8F0E8" }}>
        {/* Sfondo strade SVG */}
        <svg viewBox="0 0 400 380" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
          <rect width="400" height="380" fill="#E8F0E8"/>
          {/* parchi/aree verdi */}
          <circle cx="80"  cy="80"  r="50" fill="#D4E7CE"/>
          <circle cx="320" cy="280" r="60" fill="#D4E7CE"/>
          <rect x="180" y="40" width="80" height="50" fill="#D4E7CE" rx="6"/>
          {/* strade */}
          <path d="M0 120 L400 140" stroke="#FFFFFF" strokeWidth="14"/>
          <path d="M0 220 L400 200" stroke="#FFFFFF" strokeWidth="10"/>
          <path d="M0 300 L400 320" stroke="#FFFFFF" strokeWidth="8"/>
          <path d="M120 0 L100 380"  stroke="#FFFFFF" strokeWidth="12"/>
          <path d="M250 0 L260 380"  stroke="#FFFFFF" strokeWidth="10"/>
          <path d="M340 0 L350 380"  stroke="#FFFFFF" strokeWidth="8"/>
          {/* edifici */}
          <rect x="30"  y="160" width="50" height="40" fill="#F5EFE6"/>
          <rect x="160" y="240" width="60" height="40" fill="#F5EFE6"/>
          <rect x="280" y="100" width="40" height="50" fill="#F5EFE6"/>
        </svg>

        {/* Pin posizionati dinamicamente in base a lat/lng (normalizzati) */}
        {operators.map((op, i) => {
          const c = STATUS_COLORS[op.status];
          // posizioni mock se non c'è lat/lng
          const positions = [
            { left: "55%", top: "30%" },
            { left: "30%", top: "55%" },
            { left: "70%", top: "65%" },
            { left: "60%", top: "45%" },
          ];
          const pos = positions[i % positions.length];
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)}
              style={{
                position: "absolute", left: pos.left, top: pos.top,
                transform: "translate(-50%, -100%)", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
              <div style={{
                background: c.dot, color: "#fff", padding: "4px 10px", borderRadius: 999,
                fontSize: 10, fontWeight: 800, whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(13,31,31,0.2)",
              }}>
                {op.name.split(" ")[0]} <span style={{ opacity: 0.85 }}>· {c.text}</span>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: 999,
                background: "linear-gradient(135deg, #28A0A0 0%, #176868 100%)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900,
                border: `3px solid ${c.dot}`,
                boxShadow: "0 4px 8px rgba(13,31,31,0.25)",
              }}>
                {op.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            </div>
          );
        })}

        {/* Punto centrale (utente) */}
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          width: 14, height: 14, borderRadius: 999, background: "#3B82F6",
          border: "3px solid #fff", boxShadow: "0 0 0 8px rgba(59,130,246,0.2)",
        }}/>
      </div>

      {/* OPERATORI NELLE VICINANZE */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: TT.text, marginBottom: 10 }}>
          Operatori nelle vicinanze
        </div>
        {operators.map(op => {
          const c = STATUS_COLORS[op.status];
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)} style={{
              background: TT.card, borderRadius: 14, padding: "10px 12px", marginBottom: 8,
              border: `1px solid ${TT.bdr}`, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 999,
                background: "linear-gradient(135deg, #28A0A0 0%, #176868 100%)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900,
              }}>
                {op.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TT.text }}>{op.name}</div>
                <div style={{ fontSize: 11, color: TT.sub, marginTop: 1 }}>
                  {op.position_label || op.destination_label || op.cliente || "—"}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: c.tag }}>
                {op.status === "attivo" ? op.timer_label : op.status === "pausa" ? `Pausa ${op.timer_label?.replace("Pausa da ", "")}` : op.status === "viaggio" ? `Arrivo ${op.arrival_eta}` : op.status === "problema" ? "Problema" : op.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
