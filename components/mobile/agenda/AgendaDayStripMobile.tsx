// components/mobile/agenda/AgendaDayStripMobile.tsx
"use client";
import React, { useMemo } from "react";

interface Props {
  selectedDate: string;
  onSelect: (d: string) => void;
  daysCount?: number;
  // se true => stile chiaro bianco su gradient (dentro header), altrimenti su sfondo card
  inHeader?: boolean;
}

const DOW = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];

export default function AgendaDayStripMobile({ selectedDate, onSelect, daysCount = 5, inHeader = false }: Props) {
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const offsetStart = -1; // ieri come primo
    const todayIso = base.toISOString().split("T")[0];
    const arr: { iso: string; day: number; dow: string; isToday: boolean }[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offsetStart + i);
      const iso = d.toISOString().split("T")[0];
      arr.push({ iso, day: d.getDate(), dow: DOW[d.getDay()], isToday: iso === todayIso });
    }
    return arr;
  }, [daysCount]);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: inHeader ? "0" : "10px 14px 0",
        marginTop: inHeader ? 14 : 0,
        background: inHeader ? "transparent" : "transparent",
      }}
    >
      {days.map((d) => {
        const active = d.iso === selectedDate;
        return (
          <div
            key={d.iso}
            onClick={() => {
              console.log("[agenda day strip] click giorno", d.iso);
              onSelect(d.iso);
            }}
            style={{
              flex: "1 1 0",
              minWidth: 50,
              padding: "9px 4px",
              borderRadius: 14,
              background: active ? "#28A0A0" : (inHeader ? "rgba(255,255,255,0.12)" : "#FFFFFF"),
              border: active ? "1px solid #28A0A0" : (inHeader ? "1px solid rgba(255,255,255,0.18)" : "1px solid #E4E4E7"),
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: active ? "0 4px 14px rgba(40,160,160,0.45)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: active ? "rgba(255,255,255,0.95)" : (inHeader ? "rgba(255,255,255,0.7)" : "#71717A"),
                letterSpacing: 0.5,
              }}
            >
              {d.dow}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: active ? "#fff" : (inHeader ? "#fff" : "#0D1F1F"),
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
