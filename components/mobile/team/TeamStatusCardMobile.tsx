// components/mobile/team/TeamStatusCardMobile.tsx
"use client";
import React from "react";
import { PAL } from "@/lib/types/team";
import { IcoChevronRight } from "./icons";

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
      borderRadius: 16,
      padding: "16px 16px 18px",
      margin: "12px 16px 0",
      border: `1px solid ${PAL.border}`,
      cursor: onClick ? "pointer" : "default",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: PAL.text }}>Stato azienda oggi</span>
        <span style={{ color: PAL.textGrey, display: "flex" }}><IcoChevronRight s={18} /></span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Item count={attivi}   color={PAL.attivoGreen}   label="Attivi" />
        <Item count={pausa}    color={PAL.warningOrange} label="In pausa" />
        <Item count={problemi} color={PAL.errorRed}      label="Problemi" />
        <Item count={offline}  color={PAL.offlineGrey}   label="Offline" />
      </div>
    </div>
  );
}

function Item({ count, color, label }: { count: number; color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 28, fontWeight: 700, color: color, lineHeight: 1, fontFamily: "Inter, sans-serif", letterSpacing: "-0.5px" }}>{count}</span>
      </div>
      <span style={{ fontSize: 11, color: PAL.textGrey, fontWeight: 400 }}>{label}</span>
    </div>
  );
}
