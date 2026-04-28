// components/mobile/agenda/AgendaHeaderMobile.tsx
"use client";
import React from "react";

interface Props {
  title: string;
  subtitle: string;
  onMenu?: () => void;
}

export default function AgendaHeaderMobile({ title, subtitle, onMenu }: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0F4F4F 0%, #0D1F1F 100%)",
        padding: "44px 18px 22px",
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        color: "#fff",
        boxShadow: "0 6px 18px rgba(13,31,31,0.18)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>{title}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {/* icona calendario */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {/* tre puntini */}
          <div onClick={onMenu} style={{ cursor: "pointer", padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
