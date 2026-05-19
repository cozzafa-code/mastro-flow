// components/montaggi/MontaggiCalendarView.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  C,
  MontaggioRow,
  parseDateISO,
  isSameDay,
} from "./montaggi-types";
import MontaggiAgendaCard from "./MontaggiAgendaCard";
import MontaggiCalendarHeader from "./MontaggiCalendarHeader";

interface Props {
  montaggi: MontaggioRow[];
  onMontaggioClick: (m: MontaggioRow) => void;
}

const DOW_HEAD = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function MontaggiCalendarView({
  montaggi,
  onMontaggioClick,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - startDow);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      out.push(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
    }
    return out;
  }, [viewMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, MontaggioRow[]>();
    for (const m of montaggi) {
      if (!m.data_montaggio) continue;
      const arr = map.get(m.data_montaggio) || [];
      arr.push(m);
      map.set(m.data_montaggio, arr);
    }
    return map;
  }, [montaggi]);

  function keyOf(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function evtStyle(m: MontaggioRow): React.CSSProperties {
    if (m.stato === "in_corso")
      return { background: C.greenSoft, color: C.green, borderLeft: `2px solid ${C.greenBright}` };
    if (m.stato === "da_pianificare")
      return { background: C.redSoft, color: C.red, borderLeft: `2px solid ${C.red}` };
    if (m.stato === "completato")
      return { background: "rgba(139, 149, 168, 0.15)", color: C.navyDim, borderLeft: `2px solid ${C.navyFaint}` };
    return { background: C.amberSoft, color: C.amberDeep, borderLeft: `2px solid ${C.amber}` };
  }

  const selectedEvents = eventsByDay.get(keyOf(selectedDay)) || [];

  const monthCount = montaggi.filter((m) => {
    const d = parseDateISO(m.data_montaggio);
    return d && d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
  }).length;

  return (
    <div>
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          boxShadow: C.shadowSm,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <MontaggiCalendarHeader
          viewMonth={viewMonth}
          monthCount={monthCount}
          onPrev={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          onNext={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          onToday={() => {
            setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDay(today);
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: C.whiteOff }}>
          {DOW_HEAD.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 9,
                color: C.navyFaint,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                padding: "8px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((d, i) => {
            const isCurMonth = d.getMonth() === viewMonth.getMonth();
            const isToday = isSameDay(d, today);
            const isSel = isSameDay(d, selectedDay);
            const events = eventsByDay.get(keyOf(d)) || [];

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(d)}
                style={{
                  borderTop: `1px solid ${C.border}`,
                  borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${C.border}`,
                  minHeight: 64,
                  padding: "5px 4px 4px 5px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  background: isSel
                    ? "rgba(232, 176, 92, 0.1)"
                    : !isCurMonth
                      ? C.whiteOff
                      : "transparent",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: !isCurMonth ? C.navyFaint : isToday ? C.navy : isSel ? C.white : C.navyText,
                    background: isToday ? C.amber : isSel ? C.navy : "transparent",
                    marginBottom: 3,
                  }}
                >
                  {d.getDate()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden", flex: 1 }}>
                  {events.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMontaggioClick(m);
                      }}
                      style={{
                        ...evtStyle(m),
                        height: 14,
                        borderRadius: 3,
                        padding: "0 4px",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.commessa_code || "—"}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div style={{ fontSize: 9, color: C.navyDim, fontWeight: 800, padding: "0 4px" }}>
                      +{events.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MontaggiAgendaCard
        selectedDay={selectedDay}
        events={selectedEvents}
        onMontaggioClick={onMontaggioClick}
      />
    </div>
  );
}
