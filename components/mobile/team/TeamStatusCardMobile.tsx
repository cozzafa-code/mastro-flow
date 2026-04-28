// components/mobile/team/TeamStatusCardMobile.tsx
"use client";
import React from "react";
import { PAL } from "@/lib/types/team";

interface Props {
  attivi: number;
  pausa: number;
  problemi: number;
  offline: number;
  onClick?: () => void;
}

export default function TeamStatusCardMobile({ attivi, pausa, problemi, offline, onClick }: Props) {
  return (
    <div onClick={onClick} style={{
      background: PAL.card,
      borderRadius: 14,
      padding: "12px 14px",
      margin: "12px 14px 0",
      border: `1px solid ${PAL.cardBorder}`,
      cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: PAL.text, marginBottom: 8 }}>
        Stato azienda oggi
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Item count={attivi}   color={PAL.attivoDot}   label="Attivi" />
        <Item count={pausa}    color={PAL.pausaDot}    label="In pausa" />
        <Item count={problemi} color={PAL.problemaDot} label="Problemi" />
        <Item count={offline}  color={PAL.offlineDot}  label="Offline" />
        <span style={{ fontSize: 16, color: PAL.textSub, fontWeight: 500, marginLeft: 4 }}>›</span>
      </div>
    </div>
  );
}

function Item({ count, color, label }: { count: number; color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
        <span style={{ fontSize: 20, fontWeight: 800, color: PAL.text, lineHeight: 1 }}>{count}</span>
      </div>
      <span style={{ fontSize: 10, color: PAL.textSub, fontWeight: 600 }}>{label}</span>
    </div>
  );
}
