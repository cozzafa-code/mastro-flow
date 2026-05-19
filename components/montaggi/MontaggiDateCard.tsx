// components/montaggi/MontaggiDateCard.tsx
"use client";

import React from "react";
import { C, MontaggioRow, DOW_FULL, MONTH_FULL } from "./montaggi-types";

interface Props {
  dateStr: string;
  items: MontaggioRow[];
}

export default function MontaggiDateCard({ dateStr, items }: Props) {
  const d = new Date(dateStr + "T00:00:00");
  const totH = items.reduce((s, m) => s + (m.ore_preventivate || 0), 0);
  const overload = totH > 16;
  const loadPct = Math.min(100, (totH / 16) * 100);

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: C.shadowSm,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: C.navyText,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          {d.getDate()}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.navyText,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {DOW_FULL[d.getDay()]}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.navyDim,
              fontWeight: 600,
              marginTop: 1,
            }}
          >
            {MONTH_FULL[d.getMonth()]} {d.getFullYear()}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: overload ? C.red : C.navyText,
          }}
        >
          {totH}h
        </div>
        <div
          style={{
            fontSize: 9,
            color: C.navyDim,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          {items.length} montaggio
        </div>
        <div
          style={{
            width: 50,
            height: 4,
            background: C.white2,
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${loadPct}%`,
              background: overload ? C.red : C.amber,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}
