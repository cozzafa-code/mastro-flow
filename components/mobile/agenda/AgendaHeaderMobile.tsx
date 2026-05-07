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
        padding: "calc(env(safe-area-inset-top, 0px) + 16px) 18px 22px",
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        color: "#fff",
        boxShadow: "0 8px 22px rgba(15,23,42,0.25)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#93B0CF", textTransform: "uppercase" }}>
            Pianificazione
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>{title}</div>
          <div style={{ fontSize: 13, color: "#B5C8DD", marginTop: 4, fontWeight: 600 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div onClick={onMenu} style={{
            cursor: "pointer",
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
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
