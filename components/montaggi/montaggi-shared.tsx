// components/montaggi/montaggi-shared.tsx
// Componenti UI condivisi (StatBox, Chip, Bdg, SumItem)
// Per InsightCard/SectionLabel/NavBtn vedi montaggi-ui.tsx

"use client";

import React from "react";
import { C } from "./montaggi-types";

// Re-export per comodità
export { InsightCard, SectionLabel, NavBtn } from "./montaggi-ui";

// ===== StatBox (header stats) =====
export function StatBox({
  num,
  lbl,
  color,
  alert,
}: {
  num: number;
  lbl: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div
      style={{
        background: alert
          ? "rgba(196, 69, 69, 0.18)"
          : "rgba(255, 255, 255, 0.08)",
        border: alert
          ? "1px solid rgba(196, 69, 69, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.10)",
        borderRadius: 11,
        padding: "9px 8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 19,
          fontWeight: 800,
          color: color || C.white,
          lineHeight: 1,
          marginBottom: 3,
          letterSpacing: -0.5,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255, 255, 255, 0.65)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {lbl}
      </div>
    </div>
  );
}

// ===== Chip filtro =====
export function Chip({
  active,
  onClick,
  dotColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dotColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        padding: "7px 12px",
        borderRadius: 20,
        background: active ? C.navy : C.white,
        color: active ? C.white : C.navyDim,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        boxShadow: C.shadowXs,
      }}
    >
      {dotColor && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            flex: "0 0 auto",
          }}
        />
      )}
      {children}
    </button>
  );
}

// ===== Badge counter dentro chip =====
export function Bdg({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        background: active
          ? "rgba(255, 255, 255, 0.18)"
          : "rgba(26, 42, 71, 0.08)",
        padding: "1px 7px",
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

// ===== SumItem (Gantt summary KPI) =====
export function SumItem({
  num,
  lbl,
  color,
}: {
  num: string;
  lbl: string;
  color?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "6px 4px",
        background: C.whiteOff,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: color || C.navyText,
          letterSpacing: -0.5,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: 9,
          color: C.navyDim,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: 3,
        }}
      >
        {lbl}
      </div>
    </div>
  );
}
