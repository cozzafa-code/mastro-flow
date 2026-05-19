"use client";

import { useState, useMemo } from "react";
import { useAgenda, type AgendaEvento } from "@/hooks/useAgenda";
import { EventCard } from "@/components/agenda/EventCard";

const ORE = Array.from({ length: 13 }, (_, i) => 7 + i); // 07-19

function isoToday(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function CalendarGiorno() {
  const { eventi, spostaEvento } = useAgenda();
  const [giornoSel, setGiornoSel] = useState<string>(isoToday());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const eventiGiorno = useMemo(
    () => eventi.filter((e) => e.giorno === giornoSel),
    [eventi, giornoSel]
  );

  // 7 giorni navigazione
  const giorni = useMemo(() => {
    const oggi = new Date();
    const wd = (oggi.getDay() + 6) % 7; // lun=0
    const lun = new Date(oggi); lun.setDate(oggi.getDate() - wd);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lun); d.setDate(lun.getDate() + i);
      const iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const labels = ["LUN","MAR","MER","GIO","VEN","SAB","DOM"];
      return { iso, lbl: labels[i], d: d.getDate() };
    });
  }, []);

  const handleDrop = async (ora: number) => {
    if (!draggingId) return;
    const oraStr = String(ora).padStart(2, "0") + ":00";
    await spostaEvento(draggingId, giornoSel, oraStr);
    setDraggingId(null);
  };

  const evInOra = (ora: number): AgendaEvento[] => {
    return eventiGiorno.filter((e) => {
      const inizio = parseInt(e.ora_inizio.slice(0, 2), 10);
      const fine = parseInt(e.ora_fine.slice(0, 2), 10);
      return inizio <= ora && ora < fine;
    });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F4F6F5" }}>
      {/* Strip 7 giorni */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        gap: 4, padding: "8px 12px",
        background: "#fff",
        borderBottom: "1px solid rgba(200,228,228,0.4)",
      }}>
        {giorni.map((g) => {
          const sel = g.iso === giornoSel;
          return (
            <button key={g.iso} type="button" onClick={() => setGiornoSel(g.iso)}
              style={{
                padding: "6px 4px", borderRadius: 8, border: 0, cursor: "pointer",
                background: sel ? "linear-gradient(145deg, #28A0A0, #1E8080)" : "transparent",
                color: sel ? "#fff" : "#5A7878",
                fontFamily: "inherit",
                boxShadow: sel ? "0 3px 8px rgba(40,160,160,0.4)" : undefined,
              }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.5, opacity: sel ? 0.9 : 0.7 }}>{g.lbl}</div>
              <div style={{ fontSize: 14, fontWeight: 900, marginTop: 1 }}>{g.d}</div>
            </button>
          );
        })}
      </div>

      {/* Timeline ore */}
      <div style={{ padding: "8px 0 80px" }}>
        {ORE.map((ora) => {
          const eventiOra = evInOra(ora);
          return (
            <div key={ora}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleDrop(ora); }}
              style={{
                display: "grid", gridTemplateColumns: "44px 1fr",
                minHeight: 56,
                borderTop: "1px solid rgba(200,228,228,0.35)",
              }}>
              <div style={{
                padding: "4px 6px",
                fontSize: 10, fontWeight: 800, color: "#5A7878", letterSpacing: 0.3,
              }}>{String(ora).padStart(2, "0")}:00</div>
              <div style={{ padding: "4px 8px 4px 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {eventiOra.map((ev) => (
                  <div key={ev.id} style={{ minHeight: 38 }}>
                    <EventCard evento={ev} draggable
                      onDragStart={() => setDraggingId(ev.id)}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
