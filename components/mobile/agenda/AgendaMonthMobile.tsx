// components/mobile/agenda/AgendaMonthMobile.tsx
"use client";
import React, { useMemo } from "react";
import type { AgendaEvent } from "../../../lib/types/agenda";
import { TIPO_COLORS, TIPO_LABEL } from "../../../lib/types/agenda";

interface Props {
  selectedDate: string;
  eventsByDate: Record<string, AgendaEvent[]>;
  onSelectDay: (iso: string) => void;
  onTapEvent: (e: AgendaEvent) => void;
}

const DOW = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];

function buildMonth(selectedIso: string) {
  const sel = new Date(selectedIso + "T00:00:00");
  const y = sel.getFullYear();
  const m = sel.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  // Lunedì come primo giorno: getDay 0=dom -> indice 6, 1=lun -> 0
  const firstDow = (first.getDay() + 6) % 7;
  const days: { iso: string; day: number; outOfMonth: boolean; isToday: boolean }[] = [];
  const todayIso = new Date().toISOString().split("T")[0];

  // giorni mese precedente
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(y, m, -i);
    days.push({ iso: d.toISOString().split("T")[0], day: d.getDate(), outOfMonth: true, isToday: false });
  }
  // giorni del mese
  for (let i = 1; i <= last.getDate(); i++) {
    const d = new Date(y, m, i);
    const iso = d.toISOString().split("T")[0];
    days.push({ iso, day: i, outOfMonth: false, isToday: iso === todayIso });
  }
  // riempimento finale fino a 42 (6 settimane)
  while (days.length < 42) {
    const last2 = new Date(days[days.length - 1].iso + "T00:00:00");
    last2.setDate(last2.getDate() + 1);
    days.push({ iso: last2.toISOString().split("T")[0], day: last2.getDate(), outOfMonth: true, isToday: false });
  }

  const monthName = sel.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  return { days, monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1) };
}

export default function AgendaMonthMobile({ selectedDate, eventsByDate, onSelectDay, onTapEvent }: Props) {
  const { days, monthName } = useMemo(() => buildMonth(selectedDate), [selectedDate]);
  const eventsSelected = (eventsByDate[selectedDate] || []).slice().sort((a, b) => (a.oraInizio || a.ora_inizio || "").localeCompare(b.oraInizio || b.ora_inizio || ""));

  return (
    <div style={{ background: "#fff", paddingBottom: 100 }}>
      <div style={{ padding: "12px 16px 4px", fontSize: 13, fontWeight: 800, color: "#0D1F1F" }}>{monthName}</div>

      {/* Header giorni settimana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px 4px" }}>
        {DOW.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "#71717A", letterSpacing: 0.5 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Griglia mese */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", gap: 2 }}>
        {days.map((d) => {
          const evs = eventsByDate[d.iso] || [];
          const tipi = Array.from(new Set(evs.map((e) => e.tipo)));
          const active = d.iso === selectedDate;
          return (
            <div
              key={d.iso}
              onClick={() => onSelectDay(d.iso)}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 10,
                background: active ? "#28A0A0" : "transparent",
                color: active ? "#fff" : d.outOfMonth ? "#D4D4D8" : "#0D1F1F",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                cursor: "pointer",
                position: "relative",
                fontWeight: d.isToday ? 900 : 600,
                border: d.isToday && !active ? "1.5px solid #28A0A0" : "none",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: active || d.isToday ? 900 : 600 }}>
                {d.day}
              </span>
              {tipi.length > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {tipi.slice(0, 4).map((t) => (
                    <div key={t} style={{ width: 4, height: 4, borderRadius: "50%", background: active ? "#fff" : TIPO_COLORS[t].bd }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lista eventi del giorno selezionato */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#28A0A0", letterSpacing: 1, marginBottom: 10 }}>
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        </div>
        {eventsSelected.length === 0 ? (
          <div style={{ fontSize: 13, color: "#71717A", padding: "20px 0", textAlign: "center" }}>
            Nessun impegno
          </div>
        ) : (
          eventsSelected.map((e) => {
            const c = TIPO_COLORS[e.tipo];
            return (
              <div
                key={e.id}
                onClick={() => onTapEvent(e)}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: "0 0 44px", fontSize: 11, fontWeight: 800, color: "#52525B", paddingTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  {e.oraInizio}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: c.soft,
                    borderLeft: `4px solid ${c.bd}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 900, color: c.tx, letterSpacing: 0.6 }}>{TIPO_LABEL[e.tipo]}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F", marginTop: 2 }}>
                    {e.titolo}
                    {e.cliente ? <span style={{ fontWeight: 600, color: "#52525B" }}> · {e.cliente}</span> : null}
                  </div>
                  {e.indirizzo && (
                    <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>{e.indirizzo}</div>
                  )}
                  <div style={{ fontSize: 11, color: "#71717A", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    {e.oraInizio} - {e.oraFine}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
