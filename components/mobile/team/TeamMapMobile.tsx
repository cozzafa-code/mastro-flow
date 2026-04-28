// components/mobile/team/TeamMapMobile.tsx
"use client";
import React from "react";
import type { Operator } from "@/lib/types/team";
import { PAL, STATUS_INFO } from "@/lib/types/team";

interface Props {
  operators: Operator[];
  onBack: () => void;
  onOpenOperator?: (op: Operator) => void;
}

const ICO_BACK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ICO_FILTER = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
);

function Avatar({ name, size }: { name: string; size: number }) {
  const init = name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size > 30 ? 11 : 9, fontWeight: 800,
    }}>
      {init}
    </div>
  );
}

export default function TeamMapMobile({ operators, onBack, onOpenOperator }: Props) {
  // Posizioni pin (stile mockup)
  const positions = [
    { left: "25%", top: "20%" }, // Marco verde top-left
    { left: "75%", top: "30%" }, // Luca verde top-right
    { left: "55%", top: "50%" }, // Paolo verde center
    { left: "40%", top: "70%" }, // Gianni rosso bottom
  ];

  return (
    <div style={{ background: PAL.pageBg, minHeight: "100vh", paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{
        background: PAL.headerGrad,
        padding: "12px 14px 14px",
        color: "#fff",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: 4 }}>{ICO_BACK}</div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, textAlign: "center" as any }}>Mappa team</div>
        <div style={{ cursor: "pointer", padding: 4 }}>{ICO_FILTER}</div>
      </div>

      {/* MAPPA */}
      <div style={{ position: "relative", height: 260, background: "#E8F0E8", overflow: "hidden" }}>
        <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
          <rect width="400" height="260" fill="#E8F0E8"/>
          <circle cx="60"  cy="60"  r="40" fill="#D4E7CE"/>
          <circle cx="320" cy="200" r="50" fill="#D4E7CE"/>
          <rect x="170" y="30" width="70" height="40" fill="#D4E7CE" rx="4"/>
          <path d="M0 90  L400 100" stroke="#FFFFFF" strokeWidth="12"/>
          <path d="M0 170 L400 160" stroke="#FFFFFF" strokeWidth="9"/>
          <path d="M120 0 L100 260" stroke="#FFFFFF" strokeWidth="10"/>
          <path d="M260 0 L270 260" stroke="#FFFFFF" strokeWidth="9"/>
          <rect x="40"  y="120" width="40" height="30" fill="#F5EFE6"/>
          <rect x="170" y="180" width="50" height="30" fill="#F5EFE6"/>
          <rect x="290" y="80"  width="35" height="40" fill="#F5EFE6"/>
        </svg>

        {/* Pin operatori a goccia */}
        {operators.map((op, i) => {
          const s = STATUS_INFO[op.status];
          const pos = positions[i % positions.length];
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)} style={{
              position: "absolute", left: pos.left, top: pos.top,
              transform: "translate(-50%, -100%)", cursor: "pointer",
            }}>
              <div style={{ position: "relative", width: 44, height: 56 }}>
                {/* Goccia pin */}
                <svg width="44" height="56" viewBox="0 0 44 56" style={{ position: "absolute", inset: 0 }}>
                  <path d="M22 0 C9 0 0 10 0 22 C0 36 22 56 22 56 C22 56 44 36 44 22 C44 10 35 0 22 0 Z" fill={s.dot} stroke="#fff" strokeWidth="2"/>
                </svg>
                {/* Avatar dentro */}
                <div style={{ position: "absolute", left: 6, top: 4, width: 32, height: 32 }}>
                  <Avatar name={op.name} size={32} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Punto utente */}
        <div style={{
          position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)",
          width: 12, height: 12, borderRadius: 999, background: "#3B82F6",
          border: "2.5px solid #fff", boxShadow: "0 0 0 6px rgba(59,130,246,0.2)",
        }}/>
      </div>

      {/* OPERATORI NELLE VICINANZE */}
      <div style={{ background: PAL.card, padding: "12px 14px", borderTopLeftRadius: 18, borderTopRightRadius: 18, marginTop: -16, position: "relative" }}>
        <div style={{ width: 40, height: 4, background: "#E5E0D6", borderRadius: 999, margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: PAL.text, marginBottom: 10 }}>
          Operatori nelle vicinanze
        </div>
        {operators.map(op => {
          const s = STATUS_INFO[op.status];
          const subText = op.status === "attivo" ? op.position_label
                       : op.status === "pausa" ? op.position_label
                       : op.status === "viaggio" ? "In viaggio"
                       : op.status === "problema" ? op.cliente : op.position_label;
          const rightText = op.status === "attivo" ? op.timer_label
                       : op.status === "pausa" ? op.timer_label?.replace("Pausa da ", "Pausa ")
                       : op.status === "viaggio" ? `Arrivo ${op.arrival_eta}`
                       : op.status === "problema" ? "Problema" : "";
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", borderBottom: `1px solid ${PAL.cardBorder}`,
              cursor: "pointer",
            }}>
              <Avatar name={op.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: PAL.text }}>{op.name}</div>
                <div style={{ fontSize: 11, color: PAL.textSub, marginTop: 1 }}>{subText}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.tx }}>{rightText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
