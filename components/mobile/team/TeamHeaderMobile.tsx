// components/mobile/team/TeamHeaderMobile.tsx
"use client";
import React from "react";
import { TT } from "@/lib/types/team";

interface Props {
  totalOperators: number;
  attivi: number;
  problemi: number;
  onFilters?: () => void;
}

export default function TeamHeaderMobile({ totalOperators, attivi, problemi, onFilters }: Props) {
  return (
    <div style={{
      background: TT.headerGrad,
      padding: "18px 16px 24px",
      borderRadius: "0 0 22px 22px",
      color: "#fff",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            TEAM
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 6 }}>
            {totalOperators} operatori · {attivi} attivi
            {problemi > 0 && <> · <span style={{ color: "#FFB4B4", fontWeight: 800 }}>{problemi} problema{problemi > 1 ? "i" : ""}</span></>}
          </div>
        </div>
        {onFilters && (
          <div onClick={onFilters} style={{
            width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
          </div>
        )}
      </div>
    </div>
  );
}
