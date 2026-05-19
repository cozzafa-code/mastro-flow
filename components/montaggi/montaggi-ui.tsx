// components/montaggi/montaggi-ui.tsx
// Componenti UI generici riusabili (separati da montaggi-shared per limite righe)

"use client";

import React from "react";
import { C } from "./montaggi-types";

// ===== Insight card (alert/info contestuali) =====
export function InsightCard({
  color,
  title,
  desc,
}: {
  color: "red" | "amber" | "green";
  title: string;
  desc: string;
}) {
  const map = {
    red: { bar: C.red, iconBg: C.redSoft, iconFg: C.red },
    amber: { bar: C.amber, iconBg: C.amberSoft, iconFg: C.amberDark },
    green: { bar: C.greenBright, iconBg: C.greenSoft, iconFg: C.green },
  } as const;
  const cm = map[color];

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 12,
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        boxShadow: C.shadowSm,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: cm.bar,
        }}
      />
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: cm.iconBg,
          color: cm.iconFg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: C.navyText,
            lineHeight: 1.3,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.navyDim,
            lineHeight: 1.4,
            fontWeight: 600,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

// ===== Sezione label =====
export function SectionLabel({
  title,
  right,
  warn,
}: {
  title: string;
  right?: string;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 4px",
        margin: "16px 0 10px 0",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: warn ? C.red : C.navyText,
          textTransform: "uppercase",
          letterSpacing: 0.7,
        }}
      >
        {title}
      </div>
      {right && (
        <div style={{ fontSize: 11, fontWeight: 700, color: C.navyDim }}>
          {right}
        </div>
      )}
    </div>
  );
}

// ===== NavBtn nav calendario =====
export function NavBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        border: `1px solid ${C.borderStrong}`,
        background: C.whiteOff,
        color: C.navyText,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}
