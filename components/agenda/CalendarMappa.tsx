"use client";

import { useMemo } from "react";
import { useAgenda, TIPO_COLORE } from "@/hooks/useAgenda";

export function CalendarMappa() {
  const { eventi } = useAgenda();

  const oggiEv = useMemo(() => {
    const oggi = new Date().toISOString().slice(0, 10);
    return eventi.filter((e) => e.giorno === oggi && e.luogo);
  }, [eventi]);

  const km = oggiEv.length * 24;
  const tempo = oggiEv.length * 25;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F4F6F5", paddingBottom: 80 }}>
      {/* Stats top */}
      <div style={{ padding: "12px 14px", background: "#fff", borderBottom: "1px solid rgba(200,228,228,0.4)" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#1E8080", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>
          Mappa interventi · oggi
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <Stat n={oggiEv.length} lbl="Interventi" />
          <Stat n={km + " km"} lbl="Distanza" />
          <Stat n={Math.floor(tempo / 60) + "h " + (tempo % 60) + "m"} lbl="Tempo" />
        </div>
      </div>

      {/* Mappa placeholder · sostituibile con react-leaflet/maps */}
      <div style={{
        margin: 14,
        height: 200, borderRadius: 14,
        background: "linear-gradient(135deg, #C8E4E4 0%, #8FB8B8 100%)",
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 14px rgba(13,31,31,0.08)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.5), transparent 50%), radial-gradient(circle at 70% 70%, rgba(40,160,160,0.3), transparent 50%)",
        }}/>
        <svg viewBox="0 0 300 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M30 160 L80 100 L150 130 L210 70 L260 110" stroke="#1E8080" strokeWidth="2.5" fill="none" strokeDasharray="4,4"/>
          {oggiEv.slice(0, 5).map((ev, i) => {
            const x = 30 + i * 56;
            const y = 160 - i * 22 + (i === 2 ? 30 : 0);
            const c = TIPO_COLORE[ev.tipo].fg;
            return (
              <g key={ev.id}>
                <circle cx={x} cy={y} r="11" fill="#fff" />
                <circle cx={x} cy={y} r="9" fill={c} />
                <text x={x} y={y + 4} fontSize="11" fontWeight="900" fill="#fff" textAnchor="middle">{i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Lista ordinata */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#0F2525", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>
          Ordine ottimizzato
        </div>
        {oggiEv.slice(0, 6).map((ev, i) => {
          const c = TIPO_COLORE[ev.tipo];
          return (
            <div key={ev.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 11px", borderRadius: 11,
              background: "#fff",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: c.gradient, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900,
                flexShrink: 0,
                boxShadow: `0 2px 6px ${c.fg}55`,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ev.cliente ?? ev.titolo}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: c.fg, letterSpacing: 0.2, marginTop: 1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ev.tipo} · {ev.ora_inizio.slice(0,5)} · {ev.luogo ?? "—"}
                </div>
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: 800, color: "#5A7878",
                padding: "2px 6px", borderRadius: 5, background: "rgba(244,246,245,0.8)",
              }}>{15 + i * 5} min</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ n, lbl }: { n: string | number; lbl: string }) {
  return (
    <div style={{
      padding: "8px 8px", borderRadius: 11,
      background: "rgba(40,160,160,0.08)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: "#1E8080", letterSpacing: -0.3, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#5A7878", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 1 }}>{lbl}</div>
    </div>
  );
}
