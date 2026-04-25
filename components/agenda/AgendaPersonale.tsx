"use client";

import { useMemo } from "react";
import { useAgenda, TIPO_COLORE } from "@/hooks/useAgenda";

export function AgendaPersonale() {
  const { eventi } = useAgenda();

  const oggi = new Date().toISOString().slice(0, 10);
  const oggiEv = useMemo(() => eventi.filter((e) => e.giorno === oggi), [eventi, oggi]);

  const totaleMin = oggiEv.reduce((s, e) => {
    const ini = parseInt(e.ora_inizio.slice(0,2), 10) * 60 + parseInt(e.ora_inizio.slice(3,5), 10);
    const fin = parseInt(e.ora_fine.slice(0,2), 10) * 60 + parseInt(e.ora_fine.slice(3,5), 10);
    return s + Math.max(0, fin - ini);
  }, 0);

  const fatturato = oggiEv.reduce((s, e) => s + (e.importo_eur ?? 0), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F4F6F5", paddingBottom: 100 }}>
      {/* Header personale */}
      <div style={{ padding: "14px 16px 12px", background: "#fff", borderBottom: "1px solid rgba(200,228,228,0.4)" }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "#5A7878", letterSpacing: 1, textTransform: "uppercase" }}>
          La mia agenda
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(145deg, #28A0A0, #1E8080)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900,
            boxShadow: "0 3px 8px rgba(40,160,160,0.4)",
          }}>FA</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#0F2525", letterSpacing: -0.2 }}>Fabio</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#5A7878" }}>
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long" })}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
          <SmallStat n={oggiEv.length} lbl="Interventi" />
          <SmallStat n={Math.floor(totaleMin / 60) + "h" + (totaleMin % 60 ? " " + (totaleMin % 60) + "m" : "")} lbl="Tempo" />
          <SmallStat n={"€" + fatturato.toLocaleString("it-IT", { maximumFractionDigits: 0 })} lbl="Fatturato" />
        </div>
      </div>

      {/* Lista interventi */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {oggiEv.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "#5A7878", fontSize: 11, fontWeight: 700 }}>
            Nessun intervento oggi
          </div>
        )}
        {oggiEv.map((ev) => {
          const c = TIPO_COLORE[ev.tipo];
          return (
            <div key={ev.id} style={{
              display: "flex", gap: 10,
              padding: "10px 12px", borderRadius: 12,
              background: "#fff",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
              borderLeft: `3px solid ${c.fg}`,
            }}>
              <div style={{ minWidth: 44 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#0F2525" }}>{ev.ora_inizio.slice(0,5)}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#8FA8A8" }}>{ev.ora_fine.slice(0,5)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ev.titolo}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: c.fg, marginTop: 1, letterSpacing: 0.2, textTransform: "uppercase",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ev.luogo ?? ev.cliente ?? ev.tipo}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note + Fine giornata */}
      <div style={{ padding: "0 14px", marginTop: 4 }}>
        <textarea placeholder="Note giornaliere"
          style={{
            width: "100%", padding: "11px 13px", minHeight: 60,
            borderRadius: 12, border: "1px solid rgba(200,228,228,0.6)",
            background: "#fff", outline: "none",
            fontSize: 12, fontWeight: 600, color: "#0F2525",
            fontFamily: "inherit", resize: "vertical",
            boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
          }}/>
        <button type="button"
          style={{
            marginTop: 10, width: "100%", padding: "12px",
            borderRadius: 12, border: 0, cursor: "pointer",
            background: "linear-gradient(145deg, #28A0A0, #1E8080)",
            color: "#fff",
            fontSize: 12, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase",
            boxShadow: "0 4px 14px rgba(40,160,160,0.4), inset 0 -2px 0 rgba(0,0,0,0.1)",
            fontFamily: "inherit",
          }}>Fine giornata</button>
      </div>
    </div>
  );
}

function SmallStat({ n, lbl }: { n: string | number; lbl: string }) {
  return (
    <div style={{
      padding: "7px 8px", borderRadius: 9,
      background: "rgba(40,160,160,0.08)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "#1E8080", letterSpacing: -0.3, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 8.5, fontWeight: 800, color: "#5A7878", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 1 }}>{lbl}</div>
    </div>
  );
}
