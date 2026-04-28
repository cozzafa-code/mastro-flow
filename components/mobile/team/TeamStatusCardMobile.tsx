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
      borderRadius: 16,                  // SPEC: card radius 16px
      padding: "14px 16px",
      margin: "12px 16px 0",             // SPEC: padding screen 16px
      border: `1px solid ${PAL.border}`,
      cursor: onClick ? "pointer" : "default",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* H3 16px SemiBold */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: PAL.text }}>Stato azienda oggi</span>
        <span style={{ color: PAL.textGrey }}><IcoChevronRight s={18} /></span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Item count={attivi}   color={PAL.attivoGreen}   label="Attivi" />
        <Item count={pausa}    color={PAL.warningOrange} label="In pausa" />
        <Item count={problemi} color={PAL.errorRed}      label="Problemi" />
        <Item count={offline}  color="#9CA3AF"            label="Offline" />
      </div>
    </div>
  );
}

function Item({ count, color, label }: { count: number; color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
        {/* H1 24px Bold (numero) */}
        <span style={{ fontSize: 22, fontWeight: 700, color: PAL.text, lineHeight: 1, fontFamily: "Inter" }}>{count}</span>
      </div>
      {/* Caption 11px */}
      <span style={{ fontSize: 11, color: PAL.textGrey, fontWeight: 400 }}>{label}</span>
    </div>
  );
}
