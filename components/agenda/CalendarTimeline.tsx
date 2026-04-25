"use client";

import { useMemo, useState } from "react";
import { useAgenda, type AgendaEvento, type EventoTipo } from "@/hooks/useAgenda";
import { EventCard } from "@/components/agenda/EventCard";

const FILTRI: { v: "tutti" | EventoTipo; lbl: string }[] = [
  { v: "tutti", lbl: "Tutti" },
  { v: "sopralluogo", lbl: "Sopralluoghi" },
  { v: "montaggio", lbl: "Montaggi" },
  { v: "produzione", lbl: "Produzioni" },
  { v: "ordine", lbl: "Ordini" },
];

export function CalendarTimeline() {
  const { eventi } = useAgenda();
  const [filtro, setFiltro] = useState<"tutti" | EventoTipo>("tutti");

  const eventiFiltered = useMemo(() => {
    if (filtro === "tutti") return eventi;
    return eventi.filter((e) => e.tipo === filtro);
  }, [eventi, filtro]);

  const grouped = useMemo(() => {
    const m: Record<string, AgendaEvento[]> = {};
    eventiFiltered.forEach((e) => {
      if (!m[e.giorno]) m[e.giorno] = [];
      m[e.giorno].push(e);
    });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [eventiFiltered]);

  const fmtGiorno = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long" });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F4F6F5", paddingBottom: 80 }}>
      {/* filtri */}
      <div style={{
        display: "flex", gap: 6, padding: "10px 12px", overflowX: "auto",
        background: "#fff", borderBottom: "1px solid rgba(200,228,228,0.4)",
        scrollbarWidth: "none",
      }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {FILTRI.map((f) => {
          const active = filtro === f.v;
          return (
            <button key={f.v} type="button" onClick={() => setFiltro(f.v)}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 99, border: 0, cursor: "pointer",
                background: active ? "linear-gradient(145deg, #28A0A0, #1E8080)" : "rgba(244,246,245,0.8)",
                color: active ? "#fff" : "#5A7878",
                fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3,
                boxShadow: active ? "0 3px 8px rgba(40,160,160,0.35)" : "inset 0 0 0 1px rgba(200,228,228,0.5)",
                fontFamily: "inherit",
              }}>{f.lbl}</button>
          );
        })}
      </div>

      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {grouped.length === 0 && (
          <div style={{
            padding: 24, textAlign: "center", borderRadius: 12,
            background: "rgba(255,255,255,0.6)",
            fontSize: 12, fontWeight: 700, color: "#5A7878",
          }}>Nessun evento nel periodo</div>
        )}
        {grouped.map(([giorno, evs]) => (
          <div key={giorno}>
            <div style={{
              fontSize: 11, fontWeight: 900, color: "#0F2525",
              letterSpacing: 0.3, textTransform: "uppercase",
              marginBottom: 6, padding: "0 2px",
            }}>{fmtGiorno(giorno)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {evs.map((ev) => (<EventCard key={ev.id} evento={ev} variant="row" />))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
