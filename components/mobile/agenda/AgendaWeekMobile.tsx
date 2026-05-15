// components/mobile/agenda/AgendaWeekMobile.tsx
"use client";
import React, { useMemo } from "react";
import type { AgendaEvent } from "../../../lib/types/agenda";
import { TIPO_COLORS } from "../../../lib/types/agenda";

interface Props {
  selectedDate: string;
  eventsByDate: Record<string, AgendaEvent[]>;
  onSelectDay: (iso: string) => void;
  onTapEvent: (e: AgendaEvent) => void;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const DOW = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const ROW_H = 56; // pixel per ora

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 = dom
  const diff = (day === 0 ? -6 : 1 - day);
  const out = new Date(d);
  out.setDate(d.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function parseHour(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

export default function AgendaWeekMobile({ selectedDate, eventsByDate, onSelectDay, onTapEvent }: Props) {
  const week = useMemo(() => {
    const sel = new Date(selectedDate + "T00:00:00");
    const start = startOfWeek(sel);
    const days: { iso: string; dow: string; day: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        iso: d.toISOString().split("T")[0],
        dow: DOW[d.getDay()],
        day: d.getDate(),
      });
    }
    return days;
  }, [selectedDate]);

  return (
    <div style={{ background: "#fff", padding: "10px 0 100px" }}>
      {/* Header giorni */}
      <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", gap: 4, padding: "0 10px", marginBottom: 6, position: "sticky", top: 0, background: "#fff", zIndex: 5, paddingTop: 4, paddingBottom: 6, borderBottom: "1px solid #E4E4E7" }}>
        <div />
        {week.map((d) => {
          const active = d.iso === selectedDate;
          return (
            <div
              key={d.iso}
              onClick={() => onSelectDay(d.iso)}
              style={{
                textAlign: "center",
                padding: "4px 0",
                borderRadius: 8,
                background: active ? "#28A0A0" : "transparent",
                color: active ? "#fff" : "#0D1F1F",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.8 }}>{d.dow}</div>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{d.day}</div>
            </div>
          );
        })}
      </div>

      {/* Griglia ore */}
      <div style={{ position: "relative", padding: "0 10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", gap: 4 }}>
          {/* Colonna ore */}
          <div>
            {HOURS.map((h) => (
              <div key={h} style={{ height: ROW_H, fontSize: 10, fontWeight: 700, color: "#A1A1AA", paddingTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                {h.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Colonne giorni */}
          {week.map((d) => {
            const evs = (eventsByDate[d.iso] || []).slice().sort((a, b) => (a.oraInizio || a.ora_inizio || "").localeCompare(b.oraInizio || b.ora_inizio || ""));
            return (
              <div key={d.iso} style={{ position: "relative", borderLeft: "1px solid #F4F4F5" }}>
                {/* righe ore */}
                {HOURS.map((h) => (
                  <div key={h} style={{ height: ROW_H, borderBottom: "1px dashed #F4F4F5" }} />
                ))}
                {/* eventi */}
                {evs.map((e) => {
                  const start = parseHour(e.oraInizio);
                  const end = parseHour(e.oraFine);
                  const top = (start - HOURS[0]) * ROW_H;
                  const height = Math.max(28, (end - start) * ROW_H - 2);
                  if (top < 0 || start > HOURS[HOURS.length - 1] + 1) return null;
                  const c = TIPO_COLORS[e.tipo];
                  return (
                    <div
                      key={e.id}
                      onClick={() => onTapEvent(e)}
                      style={{
                        position: "absolute",
                        top,
                        left: 2,
                        right: 2,
                        height,
                        background: c.soft,
                        borderLeft: `3px solid ${c.bd}`,
                        borderRadius: 6,
                        padding: "4px 5px",
                        fontSize: 9,
                        fontWeight: 700,
                        color: c.tx,
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        lineHeight: 1.2,
                      }}
                    >
                      <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", opacity: 0.8 }}>{e.oraInizio}</div>
                      <div style={{ fontWeight: 900, marginTop: 1 }}>{(e.titolo || e.title || "").split(" ")[0]}</div>
                      {e.cliente && <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.85 }}>{e.cliente}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
