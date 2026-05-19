// components/montaggi/MontaggiGanttRow.tsx
"use client";

import React, { useMemo } from "react";
import {
  C,
  MontaggioRow,
  parseDateISO,
  isSameDay,
} from "./montaggi-types";

interface Props {
  squadId: string;
  squadLabel: string;
  loadStr: string;
  loadOver: boolean;
  montaggi: MontaggioRow[];
  days: Date[];
  today: Date;
  onClick: (m: MontaggioRow) => void;
  isLiberi?: boolean;
}

export default function MontaggiGanttRow({
  squadId,
  squadLabel,
  loadStr,
  loadOver,
  montaggi,
  days,
  today,
  onClick,
  isLiberi,
}: Props) {
  const colWidth = `repeat(${days.length}, 1fr)`;

  // Placement barre
  const placements = useMemo(() => {
    return montaggi
      .map((m) => {
        const d = parseDateISO(m.data_montaggio);
        if (!d) return null;
        const idx = days.findIndex((dd) => isSameDay(dd, d));
        if (idx < 0) return null;
        const giorni = m.ore_preventivate
          ? Math.max(1, Math.ceil(m.ore_preventivate / 8))
          : 1;
        return { m, idx, span: Math.min(giorni, days.length - idx) };
      })
      .filter(Boolean) as { m: MontaggioRow; idx: number; span: number }[];
  }, [montaggi, days]);

  const avBg =
    squadId === "sq2"
      ? "linear-gradient(135deg, #6B7DA8, #4A5E89)"
      : isLiberi
        ? C.red
        : `linear-gradient(135deg, ${C.navy2}, ${C.navy})`;

  function barColors(m: MontaggioRow) {
    let bg = `linear-gradient(135deg, ${C.amber}, #D49A47)`;
    let color = C.navy;
    if (m.stato === "in_corso") {
      bg = `linear-gradient(135deg, ${C.greenBright}, ${C.green})`;
      color = C.white;
    } else if (m.stato === "da_pianificare" || isLiberi) {
      bg = `linear-gradient(135deg, ${C.redBright}, ${C.red})`;
      color = C.white;
    } else if (m.stato === "completato") {
      bg = `linear-gradient(135deg, #B0B7C5, ${C.navyFaint})`;
      color = C.white;
    }
    return { bg, color };
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `90px ${colWidth}`,
        borderBottom: `1px solid ${C.border}`,
        alignItems: "stretch",
        position: "relative",
        minHeight: 56,
      }}
    >
      {/* Colonna label squadra */}
      <div
        style={{
          padding: "10px 10px",
          borderRight: `1px solid ${C.border}`,
          background: C.whiteOff,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: avBg,
              color: C.white,
              fontSize: 9,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${C.white}`,
              boxShadow: C.shadowXs,
            }}
          >
            {isLiberi ? "!" : squadId}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.navyText }}>
            {squadLabel}
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            color: loadOver ? C.red : C.navyDim,
            fontWeight: 700,
          }}
        >
          {loadStr}
        </div>
      </div>

      {/* Celle giorni vuote (bg) */}
      {days.map((d, i) => {
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isToday = isSameDay(d, today);
        return (
          <div
            key={i}
            style={{
              borderRight:
                i === days.length - 1 ? "none" : `1px solid ${C.border}`,
              position: "relative",
              minHeight: 56,
              background: isToday
                ? "rgba(232, 176, 92, 0.07)"
                : isWeekend
                  ? "rgba(26, 42, 71, 0.025)"
                  : "transparent",
            }}
          />
        );
      })}

      {/* Barre overlay */}
      {placements.map(({ m, idx, span }, i) => {
        const cellPctStart = (idx / days.length) * 100;
        const cellPctWidth = (span / days.length) * 100;
        const { bg, color } = barColors(m);
        return (
          <div
            key={m.id + i}
            onClick={() => onClick(m)}
            style={{
              position: "absolute",
              top: 8,
              bottom: 8,
              left: `calc(90px + (100% - 90px) * ${cellPctStart} / 100 + 6px)`,
              width: `calc((100% - 90px) * ${cellPctWidth} / 100 - 12px)`,
              background: bg,
              borderRadius: 6,
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontWeight: 800,
              color,
              whiteSpace: "nowrap",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.12)",
              zIndex: 5,
            }}
          >
            <span
              style={{
                width: 4,
                height: 16,
                background: "rgba(0,0,0,0.25)",
                borderRadius: 2,
                flex: "0 0 auto",
              }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.commessa_code || "—"}
              {m.commessa_cognome ? ` ${m.commessa_cognome}` : ""}
            </span>
            <span
              style={{
                width: 4,
                height: 16,
                background: "rgba(0,0,0,0.25)",
                borderRadius: 2,
                flex: "0 0 auto",
                marginLeft: "auto",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
