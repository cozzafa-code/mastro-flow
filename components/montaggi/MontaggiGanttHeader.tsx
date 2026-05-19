// components/montaggi/MontaggiGanttHeader.tsx
"use client";

import React from "react";
import { C, DOW_SHORT, isSameDay } from "./montaggi-types";

export type GanttZoom = "3g" | "1sett" | "2sett" | "mese";

export const GANTT_ZOOM_DAYS: Record<GanttZoom, number> = {
  "3g": 3,
  "1sett": 7,
  "2sett": 14,
  mese: 30,
};

const ZOOM_LABELS: Record<GanttZoom, string> = {
  "3g": "3g",
  "1sett": "1 sett.",
  "2sett": "2 sett.",
  mese: "Mese",
};

// Zoom toggle
export function GanttZoomToggle({
  zoom,
  onChange,
}: {
  zoom: GanttZoom;
  onChange: (z: GanttZoom) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: C.white,
        borderRadius: 10,
        padding: 3,
        boxShadow: C.shadowXs,
      }}
    >
      {(Object.keys(GANTT_ZOOM_DAYS) as GanttZoom[]).map((z) => (
        <button
          key={z}
          onClick={() => onChange(z)}
          style={{
            padding: "6px 11px",
            borderRadius: 7,
            border: "none",
            background: zoom === z ? C.navy : "transparent",
            color: zoom === z ? C.white : C.navyDim,
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {ZOOM_LABELS[z]}
        </button>
      ))}
    </div>
  );
}

// Header con celle giorni
export function GanttDaysHeader({ days, today }: { days: Date[]; today: Date }) {
  const colWidth = `repeat(${days.length}, 1fr)`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `90px ${colWidth}`,
        background: C.whiteOff,
        borderBottom: `1px solid ${C.border}`,
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontSize: 10,
          fontWeight: 800,
          color: C.navyFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
        }}
      >
        Squadra
      </div>
      {days.map((d, i) => {
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isToday = isSameDay(d, today);
        return (
          <div
            key={i}
            style={{
              textAlign: "center",
              padding: "8px 2px",
              borderRight:
                i === days.length - 1 ? "none" : `1px solid ${C.border}`,
              background: isToday
                ? C.amber
                : isWeekend
                  ? "rgba(26, 42, 71, 0.03)"
                  : "transparent",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: isToday ? C.navy : C.navyFaint,
                textTransform: "uppercase",
              }}
            >
              {DOW_SHORT[d.getDay()]}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: isToday ? C.navy : C.navyText,
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Scroll hint
export function GanttScrollHint() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        padding: 8,
        background: C.whiteOff,
        fontSize: 10,
        color: C.navyFaint,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.6,
      }}
    >
      ← Scorri orizzontale →
    </div>
  );
}
