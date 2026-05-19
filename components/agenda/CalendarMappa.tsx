"use client";

import { useMemo } from "react";
import { useAgenda, TIPO_COLORE } from "@/hooks/useAgenda";
import { MappaGoogle } from "@/components/agenda/MappaGoogle";

export function CalendarMappa() {
  const { eventi } = useAgenda();

  const oggiEv = useMemo(() => {
    const oggi = new Date().toISOString().slice(0, 10);
    return eventi.filter((e) => e.giorno === oggi);
  }, [eventi]);

  const oggiConCoord = oggiEv.filter((e) => e.lat != null && e.lon != null);
  const senzaCoord = oggiEv.length - oggiConCoord.length;

  const sortedOggi = [...oggiConCoord].sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio));

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F4F6F5", paddingBottom: 80 }}>
      <div style={{ padding: "12px 14px", background: "#fff", borderBottom: "1px solid rgba(200,228,228,0.4)" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#1E8080", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>
          Mappa interventi · oggi
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <Stat n={oggiEv.length} lbl="Interventi" />
          <Stat n={oggiConCoord.length} lbl="Sulla mappa" />
          <Stat n={senzaCoord} lbl="Senza luogo" tone={senzaCoord > 0 ? "warn" : "default"} />
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <MappaGoogle eventi={oggiEv} />
      </div>

      {sortedOggi.length > 0 && (
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#0F2525", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>
            Ordine ottimizzato
          </div>
          {sortedOggi.map((ev, i) => {
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
                  <div style={{
                    fontSize: 11.5, fontWeight: 900, color: "#0F2525",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>{ev.cliente ?? ev.titolo}</div>
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, color: c.fg, letterSpacing: 0.2, marginTop: 1,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {ev.tipo} · {ev.ora_inizio.slice(0,5)} · {ev.luogo ?? "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {oggiEv.length === 0 && (
        <div style={{
          margin: "20px 14px", padding: 24, textAlign: "center", borderRadius: 12,
          background: "rgba(255,255,255,0.6)",
          fontSize: 11, fontWeight: 700, color: "#5A7878",
        }}>Nessun intervento oggi</div>
      )}

      {oggiEv.length > 0 && oggiConCoord.length === 0 && (
        <div style={{
          margin: "12px 14px", padding: 14, borderRadius: 11,
          background: "rgba(239,159,39,0.08)",
          border: "1px solid rgba(239,159,39,0.3)",
          fontSize: 10.5, fontWeight: 800, color: "#854F0B", lineHeight: 1.4,
        }}>
          Gli interventi di oggi non hanno coordinate. Aggiungi un indirizzo nel campo "luogo" → geocoding via Google.
        </div>
      )}
    </div>
  );
}

function Stat({ n, lbl, tone = "default" }: { n: string | number; lbl: string; tone?: "default" | "warn" }) {
  const TONES: Record<string, { bg: string; fg: string }> = {
    default: { bg: "rgba(40,160,160,0.08)", fg: "#1E8080" },
    warn:    { bg: "rgba(239,159,39,0.10)", fg: "#854F0B" },
  };
  const t = TONES[tone];
  return (
    <div style={{
      padding: "8px 8px", borderRadius: 11,
      background: t.bg,
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: t.fg, letterSpacing: -0.3, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#5A7878", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 1 }}>{lbl}</div>
    </div>
  );
}
