// components/mobile/team/TeamMapMobile.tsx
"use client";
import React from "react";
import type { Operator } from "@/lib/types/team";
import { PAL, STATUS_INFO } from "@/lib/types/team";
import { IcoBack, IcoSliders } from "./icons";

interface Props {
  operators: Operator[];
  onBack: () => void;
  onOpenOperator?: (op: Operator) => void;
}

function MiniAvatar({ url, name, size }: { url?: string; name: string; size: number }) {
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, background: "#fff" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: "linear-gradient(135deg,#94A3B8,#64748B)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700,
    }}>{name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}</div>
  );
}

export default function TeamMapMobile({ operators, onBack, onOpenOperator }: Props) {
  const positions = [
    { left: "22%", top: "22%" },
    { left: "78%", top: "30%" },
    { left: "55%", top: "55%" },
    { left: "30%", top: "70%" },
  ];

  return (
    <div style={{ background: PAL.pageBg, minHeight: "100vh", paddingBottom: 100, fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <div style={{
        background: PAL.headerGrad,
        padding: "14px 16px",
        color: "#FFFFFF",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: 4 }}><IcoBack s={22} /></div>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 600, textAlign: "center" as any }}>Mappa team</div>
        <div style={{ cursor: "pointer", padding: 4 }}><IcoSliders s={20} /></div>
      </div>

      {/* MAPPA */}
      <div style={{ position: "relative", height: 280, background: "#E8F0E8", overflow: "hidden" }}>
        <svg viewBox="0 0 400 280" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
          <rect width="400" height="280" fill="#E8F0E8"/>
          <circle cx="60"  cy="60"  r="40" fill="#D4E7CE"/>
          <circle cx="320" cy="220" r="50" fill="#D4E7CE"/>
          <rect x="170" y="30" width="70" height="40" fill="#D4E7CE" rx="4"/>
          <path d="M0 100 L400 110" stroke="#FFFFFF" strokeWidth="14"/>
          <path d="M0 180 L400 170" stroke="#FFFFFF" strokeWidth="10"/>
          <path d="M120 0 L100 280" stroke="#FFFFFF" strokeWidth="12"/>
          <path d="M260 0 L270 280" stroke="#FFFFFF" strokeWidth="10"/>
          <rect x="40"  y="125" width="40" height="30" fill="#F5EFE6"/>
          <rect x="170" y="195" width="50" height="30" fill="#F5EFE6"/>
        </svg>

        {/* Pin a goccia con foto */}
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
                  <path d="M23 0 C9 0 0 11 0 23 C0 38 23 60 23 60 C23 60 46 38 46 23 C46 11 37 0 23 0 Z" fill={s.dot} stroke="#FFFFFF" strokeWidth="2"/>
                </svg>
                <div style={{ position: "absolute", left: 7, top: 5, width: 32, height: 32 }}>
                  <MiniAvatar url={op.avatar_url} name={op.name} size={32} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Punto utente */}
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          width: 12, height: 12, borderRadius: 999, background: PAL.infoBlue,
          border: "2.5px solid #fff", boxShadow: `0 0 0 6px ${PAL.infoBlue}33`,
        }}/>
      </div>

      {/* OPERATORI VICINANZE */}
      <div style={{ background: PAL.card, padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18, marginTop: -16, position: "relative", zIndex: 2 }}>
        <div style={{ width: 40, height: 4, background: PAL.border, borderRadius: 999, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: PAL.text, marginBottom: 12 }}>
          Operatori nelle vicinanze
        </div>
        {operators.map(op => {
          const s = STATUS_INFO[op.status];
          const subText = op.status === "viaggio" ? "In viaggio"
                       : op.status === "problema" ? op.cliente
                       : op.position_label;
          const rightText = op.status === "attivo" ? op.timer_label
                       : op.status === "pausa" ? "Pausa 25m"
                       : op.status === "viaggio" ? `Arrivo ${op.arrival_eta}`
                       : op.status === "problema" ? "Problema" : "";
          return (
            <div key={op.id} onClick={() => onOpenOperator?.(op)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0", borderBottom: `1px solid ${PAL.border}`,
              cursor: "pointer",
            }}>
              <MiniAvatar url={op.avatar_url} name={op.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: PAL.text }}>{op.name}</div>
                <div style={{ fontSize: 12, color: PAL.textGrey, marginTop: 2 }}>{subText}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.tx }}>{rightText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
