// components/mobile/agenda/AgendaHeaderMobile.tsx
"use client";
import React from "react";
import { T } from "../../../lib/types/agenda";

interface Props {
  title: string;
  subtitle: string;
  onMenu?: () => void;
  // contenuto interno aggiuntivo (day strip + switch) renderizzato dentro lo stesso gradient
  children?: React.ReactNode;
}

export default function AgendaHeaderMobile({ title, subtitle, onMenu, children }: Props) {
  return (
    <div
      style={{
        background: T.headerGrad,
        padding: "44px 18px 16px",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        color: "#fff",
        boxShadow: "0 6px 18px rgba(13,31,31,0.14)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 5, fontWeight: 500 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div onClick={onMenu} style={{ cursor: "pointer", padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
