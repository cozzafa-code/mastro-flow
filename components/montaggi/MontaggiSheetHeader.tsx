// components/montaggi/MontaggiSheetHeader.tsx
"use client";

import React from "react";
import { C } from "./montaggi-types";
import { StatBox } from "./montaggi-shared";

interface Props {
  onClose: () => void;
  stats: {
    daFare: number;
    inOpera: number;
    daPianif: number;
    fatti: number;
  };
}

export default function MontaggiSheetHeader({ onClose, stats }: Props) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        background: `linear-gradient(165deg, ${C.navy3} 0%, ${C.navy2} 50%, ${C.navy} 100%)`,
        borderRadius: "0 0 22px 22px",
        padding: "12px 14px 14px 14px",
        boxShadow: C.shadowMd,
        color: C.white,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow ambra decorativo */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background:
            "radial-gradient(circle, rgba(232, 176, 92, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "rgba(255, 255, 255, 0.10)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.white,
            }}
            aria-label="Chiudi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ lineHeight: 1.1 }}>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 800,
                letterSpacing: 1.4,
              }}
            >
              MASTRO
            </div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                letterSpacing: -0.5,
                color: C.white,
                marginTop: 2,
              }}
            >
              Montaggi
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          position: "relative",
          zIndex: 1,
        }}
      >
        <StatBox num={stats.daFare} lbl="Da fare" color={C.amberBright} />
        <StatBox num={stats.inOpera} lbl="In opera" color="#6FCE9A" />
        <StatBox
          num={stats.daPianif}
          lbl="Da pianif."
          color={C.redBright}
          alert={stats.daPianif > 0}
        />
        <StatBox num={stats.fatti} lbl="Fatti" />
      </div>
    </div>
  );
}
