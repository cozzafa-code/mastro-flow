"use client";

import { useMemo, useState } from "react";
import { useAgenda, type AgendaEvento, TIPO_COLORE } from "@/hooks/useAgenda";

const ORE_SETT = Array.from({ length: 12 }, (_, i) => 8 + i); // 08-19

export function CalendarSettimana() {
  const { eventi, spostaEvento } = useAgenda();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const giorni = useMemo(() => {
    const oggi = new Date();
    const wd = (oggi.getDay() + 6) % 7;
    const lun = new Date(oggi); lun.setDate(oggi.getDate() - wd);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lun); d.setDate(lun.getDate() + i);
      const iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const labels = ["LUN","MAR","MER","GIO","VEN","SAB","DOM"];
      const oggiIso = new Date().toISOString().slice(0, 10);
      return { iso, lbl: labels[i], d: d.getDate(), today: iso === oggiIso };
    });
  }, []);

  const handleDrop = async (giorno: string) => {
    if (!draggingId) return;
    await spostaEvento(draggingId, giorno);
    setDraggingId(null);
  };

  return (
    <div style={{ flex: 1, overflow: "auto", background: "#F4F6F5", paddingBottom: 80 }}>
      {/* Header giorni */}
      <div style={{
        display: "grid", gridTemplateColumns: "32px repeat(7, 1fr)",
        background: "#fff",
        borderBottom: "1px solid rgba(200,228,228,0.4)",
        position: "sticky", top: 0, zIndex: 2,
      }}>
        <div/>
        {giorni.map((g) => (
          <div key={g.iso} style={{
            padding: "8px 2px", textAlign: "center",
            background: g.today ? "rgba(40,160,160,0.08)" : "transparent",
            borderBottom: g.today ? "2px solid #28A0A0" : undefined,
          }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#5A7878", letterSpacing: 0.5 }}>{g.lbl}</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: g.today ? "#1E8080" : "#0F2525", marginTop: 1 }}>{g.d}</div>
          </div>
        ))}
      </div>

      {/* Griglia ore × giorni */}
      <div style={{ display: "grid", gridTemplateColumns: "32px repeat(7, 1fr)" }}>
        {ORE_SETT.map((ora) => (
          <FragmentRow key={ora} ora={ora} giorni={giorni} eventi={eventi}
            draggingId={draggingId}
            onDragStart={(id) => setDraggingId(id)}
            onDragEnd={() => setDraggingId(null)}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ ora, giorni, eventi, draggingId, onDragStart, onDragEnd, onDrop }: {
  ora: number; giorni: { iso: string; today: boolean }[]; eventi: AgendaEvento[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (giorno: string) => void;
}) {
  return (
    <>
      <div style={{
        padding: "2px 4px", borderTop: "1px solid rgba(200,228,228,0.3)",
        fontSize: 8.5, fontWeight: 700, color: "#5A7878", textAlign: "right",
      }}>{String(ora).padStart(2, "0")}</div>
      {giorni.map((g) => {
        const eventoOra = eventi.find((e) =>
          e.giorno === g.iso &&
          parseInt(e.ora_inizio.slice(0, 2), 10) === ora
        );
        const c = eventoOra ? TIPO_COLORE[eventoOra.tipo] : null;
        return (
          <div key={`${g.iso}-${ora}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(g.iso); }}
            style={{
              minHeight: 32,
              borderTop: "1px solid rgba(200,228,228,0.3)",
              borderLeft: "1px solid rgba(200,228,228,0.25)",
              padding: 2, position: "relative",
              background: g.today ? "rgba(40,160,160,0.03)" : "#fff",
            }}>
            {eventoOra && c && (
              <div draggable
                onDragStart={() => onDragStart(eventoOra.id)}
                onDragEnd={onDragEnd}
                style={{
                  background: c.gradient,
                  borderRadius: 4, padding: "2px 3px", height: "100%",
                  cursor: "grab", color: "#fff",
                  opacity: draggingId === eventoOra.id ? 0.5 : 1,
                  boxShadow: `0 1px 3px ${c.fg}66`,
                }}>
                <div style={{
                  fontSize: 7.5, fontWeight: 900,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{(eventoOra.cliente ?? eventoOra.titolo).slice(0, 8)}</div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
