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

function MiniAvatar({ url, name, size }: { url?: string; name: string; size: number }) {
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, background: "#fff", objectFit: "cover" as any }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: "linear-gradient(135deg, #94A3B8, #64748B)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 800,
    }}>{name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}</div>
  );
}

export default function TeamMapMobile({ operators, onBack, onOpenOperator }: Props) {
  const positions = [
    { left: "22%", top: "25%" },
    { left: "78%", top: "30%" },
    { left: "55%", top: "55%" },
    { left: "30%", top: "65%" },
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
      <div style={{ position: "relative", height: 280, background: "#E8F0E8", overflow: "hidden" }}>
        <svg viewBox="0 0 400 280" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
          <rect width="400" height="280" fill="#E8F0E8"/>
          <circle cx="60"  cy="60"  r="40" fill="#D4E7CE"/>
          <circle cx="320" cy="220" r="50" fill="#D4E7CE"/>
          <rect x="170" y="30" width="70" height="40" fill="#D4E7CE" rx="4"/>
          <path d="M0 100 L400 110" stroke="#FFFFFF" strokeWidth="12"/>
          <path d="M0 180 L400 170" stroke="#FFFFFF" strokeWidth="9"/>
          <path d="M120 0 L100 280" stroke="#FFFFFF" strokeWidth="10"/>
          <path d="M260 0 L270 280" stroke="#FFFFFF" strokeWidth="9"/>
          <rect x="40"  y="130" width="40" height="30" fill="#F5EFE6"/>
          <rect x="170" y="195" width="50" height="30" fill="#F5EFE6"/>
          <rect x="290" y="80"  width="35" height="40" fill="#F5EFE6"/>
        </svg>

        {/* Pin a goccia con avatar dentro */}
        {operators.map((op, i) => {
          const s = STATUS_INFO[op.status];
          const pos = positions[i % positions.length];
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)} style={{
              position: "absolute", left: pos.left, top: pos.top,
              transform: "translate(-50%, -100%)", cursor: "pointer",
            }}>
              <div style={{ position: "relative", width: 46, height: 60 }}>
                <svg width="46" height="60" viewBox="0 0 46 60" style={{ position: "absolute", inset: 0 }}>
                  <path d="M23 0 C9 0 0 11 0 23 C0 38 23 60 23 60 C23 60 46 38 46 23 C46 11 37 0 23 0 Z" fill={s.dot} stroke="#fff" strokeWidth="2"/>
                </svg>
                <div style={{ position: "absolute", left: 7, top: 5, width: 32, height: 32 }}>
                  <MiniAvatar url={op.avatar_url} name={op.name} size={32} />
                </div>
              </div>
            </div>
          );
        })}

        <div style={{
          position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)",
          width: 12, height: 12, borderRadius: 999, background: "#3B82F6",
          border: "2.5px solid #fff", boxShadow: "0 0 0 6px rgba(59,130,246,0.2)",
        }}/>
      </div>

      {/* OPERATORI NELLE VICINANZE */}
      <div style={{ background: PAL.card, padding: "12px 14px", borderTopLeftRadius: 18, borderTopRightRadius: 18, marginTop: -16, position: "relative", zIndex: 2 }}>
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
                       : op.status === "pausa" ? "Pausa 25m"
                       : op.status === "viaggio" ? `Arrivo ${op.arrival_eta}`
                       : op.status === "problema" ? "Problema" : "";
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: `1px solid ${PAL.cardBorder}`,
              cursor: "pointer",
            }}>
              <MiniAvatar url={op.avatar_url} name={op.name} size={38} />
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
