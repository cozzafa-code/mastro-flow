"use client";
import React from "react";
import { C } from "./montaggi-editor-types";
import type { TipoIntervento } from "./montaggi-editor-types";

interface Props {
  value: TipoIntervento;
  onChange: (v: TipoIntervento) => void;
}

const TIPI: Array<{ key: TipoIntervento; lbl: string; desc: string; icon: React.ReactNode }> = [
  {
    key: "cantiere",
    lbl: "Cantiere",
    desc: "Multi-giorno",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M3 21h18M5 21V7l8-4 8 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
      </svg>
    ),
  },
  {
    key: "intervento",
    lbl: "Intervento",
    desc: "Breve · min",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx={12} cy={12} r={10} />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "sopralluogo",
    lbl: "Sopralluogo",
    desc: "Nuovo cliente",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx={12} cy={10} r={3} />
      </svg>
    ),
  },
];

export default function MontaggiTipoToggle({ value, onChange }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 6,
        background: C.whiteOff,
        border: `1.5px solid ${C.borderStrong}`,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
      }}
    >
      {TIPI.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              padding: "10px 6px",
              borderRadius: 8,
              background: active ? C.navy : "transparent",
              border: "none",
              color: active ? C.white : C.navyDim,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              transition: "all 0.12s",
              boxShadow: active ? "0 2px 8px rgba(26, 42, 71, 0.25)" : "none",
            }}
          >
            <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t.icon}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>
              {t.lbl}
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.65, marginTop: 1 }}>
              {t.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}
