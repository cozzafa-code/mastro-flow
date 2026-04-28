// components/mobile/agenda/AgendaDayStripMobile.tsx
"use client";
import React, { useMemo } from "react";

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (d: string) => void;
  daysCount?: number; // default 5
  centered?: boolean; // default false (parte da -1 giorno)
}

const DOW = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];

export default function AgendaDayStripMobile({ selectedDate, onSelect, daysCount = 5, centered = false }: Props) {
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const offsetStart = centered ? -Math.floor(daysCount / 2) : -1;
    const arr: { iso: string; day: number; dow: string; isToday: boolean }[] = [];
    const todayIso = base.toISOString().split("T")[0];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offsetStart + i);
      const iso = d.toISOString().split("T")[0];
      arr.push({
        iso,
        day: d.getDate(),
        dow: DOW[d.getDay()],
        isToday: iso === todayIso,
      });
    }
    return arr;
  }, [daysCount, centered]);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0F4F4F 0%, #0D1F1F 100%)",
        padding: "0 12px 16px",
        display: "flex",
        gap: 8,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {days.map((d) => {
        const active = d.iso === selectedDate;
        return (
          <div
            key={d.iso}
            onClick={() => onSelect(d.iso)}
            style={{
              flex: "1 1 0",
              minWidth: 56,
              padding: "10px 6px",
              borderRadius: 14,
              background: active ? "#28A0A0" : "rgba(255,255,255,0.08)",
              border: active ? "1px solid #28A0A0" : "1px solid rgba(255,255,255,0.12)",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: active ? "0 4px 12px rgba(40,160,160,0.4)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
                letterSpacing: 0.5,
              }}
            >
              {d.dow}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#fff",
                marginTop: 2,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {d.day}
            </div>
          </div>
        );
      })}
    </div>
  );
}
