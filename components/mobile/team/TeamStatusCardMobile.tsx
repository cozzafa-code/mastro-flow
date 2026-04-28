// components/mobile/team/TeamStatusCardMobile.tsx
"use client";
import React from "react";
import { TT, STATUS_COLORS } from "@/lib/types/team";

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
      background: TT.card,
      borderRadius: 16,
      padding: "12px 14px",
      margin: "12px 14px 0",
      border: `1px solid ${TT.bdr}`,
      boxShadow: "0 2px 8px rgba(13,31,31,0.04)",
      cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TT.text, marginBottom: 8, letterSpacing: 0.2 }}>
        Stato azienda oggi
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Item count={attivi}   color={STATUS_COLORS.attivo.dot}   label="Attivi" />
        <Item count={pausa}    color={STATUS_COLORS.pausa.dot}    label="In pausa" />
        <Item count={problemi} color={STATUS_COLORS.problema.dot} label="Problemi" />
        <Item count={offline}  color={STATUS_COLORS.offline.dot}  label="Offline" />
        <span style={{ fontSize: 16, color: TT.sub, fontWeight: 600 }}>›</span>
      </div>
    </div>
  );
}

function Item({ count, color, label }: { count: number; color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block" }} />
        <span style={{ fontSize: 17, fontWeight: 900, color: TT.text }}>{count}</span>
      </div>
      <span style={{ fontSize: 9, color: TT.sub, fontWeight: 700 }}>{label}</span>
    </div>
  );
}
