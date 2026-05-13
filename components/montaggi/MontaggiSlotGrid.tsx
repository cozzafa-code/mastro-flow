"use client";
import React from "react";
import { C, MESI_FULL, fmtIso, parseIso, addDays, isWeekend } from "./montaggi-editor-types";
import type { CaricoMap } from "./montaggi-editor-types";
import { caricoKey } from "./montaggi-editor-types";

interface Props {
  squadra: string;
  caricoMap: CaricoMap;
  dataPending: string | null;
  giorni: number;
  viewYear: number;
  viewMonth: number;
  today: Date;
  onPickDate: (iso: string) => void;
  onChangeMonth: (delta: number) => void;
}

export default function MontaggiSlotGrid({
  squadra,
  caricoMap,
  dataPending,
  giorni,
  viewYear,
  viewMonth,
  today,
  onPickDate,
  onChangeMonth,
}: Props) {
  const first = new Date(viewYear, viewMonth, 1);
  const startDow = (first.getDay() + 6) % 7;

  const pendingDate = dataPending ? parseIso(dataPending) : null;
  const rangeEnd = pendingDate ? addDays(pendingDate, giorni - 1) : null;

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(viewYear, viewMonth, 1 - startDow + i);
    const isCur = cellDate.getMonth() === viewMonth;
    const iso = fmtIso(cellDate);
    const ore = isCur ? (caricoMap.get(caricoKey(squadra, iso)) || 0) : 0;
    const we = isWeekend(cellDate);
    const isTd = cellDate.toDateString() === today.toDateString();

    let bg = C.white;
    let color = C.navyText;
    let border = "1.5px solid transparent";

    if (!isCur) {
      color = C.navyFaint;
      bg = "transparent";
    } else if (we) {
      bg = "rgba(26, 42, 71, 0.06)";
      color = C.navyFaint;
    } else if (ore === 0) {
      bg = C.greenSoft;
      color = C.green;
    } else if (ore < 8) {
      bg = C.amberSoft;
      color = C.amberDark;
    } else {
      bg = C.redSoft;
      color = C.red;
    }
    if (isTd) border = `2px solid ${C.navy}`;

    // Range highlight (selezione)
    let inRange = false;
    if (isCur && pendingDate && rangeEnd && cellDate >= pendingDate && cellDate <= rangeEnd) {
      inRange = true;
      bg = C.navy;
      color = C.white;
      border = `1.5px solid ${C.navy}`;
    }

    const opacity = !isCur ? 0.4 : 1;
    const clickable = isCur && !we;

    cells.push(
      <div
        key={i}
        onClick={() => clickable && onPickDate(iso)}
        style={{
          aspectRatio: "1",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: clickable ? "pointer" : "default",
          fontSize: 13, fontWeight: 800,
          background: bg,
          color,
          border,
          opacity,
          transition: "all 0.12s",
          pointerEvents: clickable ? "auto" : "none",
        }}
      >
        <div>{cellDate.getDate()}</div>
        {isCur && ore > 0 && !inRange && (
          <div style={{ fontSize: 8, fontWeight: 800, marginTop: 1, lineHeight: 1 }}>
            {Number.isInteger(ore) ? ore : ore.toFixed(1)}h
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 12px",
          background: C.whiteOff,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <button
          onClick={() => onChangeMonth(-1)}
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: C.white, border: `1px solid ${C.borderStrong}`,
            color: C.navyText, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.navyText }}>
          {MESI_FULL[viewMonth]} {viewYear}
        </div>
        <button
          onClick={() => onChangeMonth(1)}
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: C.white, border: `1px solid ${C.borderStrong}`,
            color: C.navyText, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "6px 4px 3px 4px" }}>
        {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 9, fontWeight: 800,
              color: C.navyFaint,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, padding: "0 4px 4px 4px" }}>
        {cells}
      </div>

      <div
        style={{
          display: "flex", gap: 8, flexWrap: "wrap",
          padding: "8px 14px",
          borderTop: `1px solid ${C.border}`,
          background: C.whiteOff,
        }}
      >
        {[
          { lbl: "Libero", bg: C.greenBright },
          { lbl: "Parziale", bg: C.amber },
          { lbl: "Pieno", bg: C.red },
          { lbl: "Selezione", bg: C.navy },
        ].map((l) => (
          <div key={l.lbl} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: l.bg }} />
            <div style={{
              fontSize: 9, fontWeight: 700,
              color: C.navyDim,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}>
              {l.lbl}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
