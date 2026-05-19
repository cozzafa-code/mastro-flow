"use client";
import React from "react";
import { LaborOperatore } from "../../hooks/useMagazzinoTop";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

const COLORS = [
  ["#28A0A0", "#1a6b6b"], // teal
  ["#E8B05C", "#8B6926"], // amber
  ["#5C2D8C", "#3D1E5E"], // purple
  ["#C73E1D", "#8B0000"], // red
  ["#0F6E56", "#0a4d3c"], // green
];

export default function VistaLabor({ mag }: { mag: any }) {
  const operatori: LaborOperatore[] = mag.labor || [];
  const effMedia = operatori.length > 0
    ? Math.round(operatori.reduce((s, o) => s + (o.eff_avg || 0), 0) / operatori.length)
    : 0;

  return (
    <div>
      {/* Hero efficienza */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
        color: "#fff", borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
          Efficienza media team
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{effMedia}%</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          {operatori.length} operatori · target 90%
        </div>
      </div>

      {/* Operatori */}
      <div style={sezStyle}>
        <div style={{
          fontSize: 9.5, fontWeight: 800, color: NAVY,
          letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
          display: "flex", justifyContent: "space-between",
        }}>
          <span>Operatori questa settimana</span>
          <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10 }}>
            {operatori.length}
          </span>
        </div>

        {operatori.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
            Nessuna metrica disponibile · accumula dati nei prossimi giorni
          </div>
        ) : operatori.map((o, i) => <LabRow key={o.operatore_id || i} o={o} colorIdx={i} />)}
      </div>

      {/* Tempi medi task */}
      <div style={sezStyle}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
          Tempi medi per task
        </div>
        <TaskRow lbl="Carico DDT (10 art.)" tempo="8 min" />
        <TaskRow lbl="Wave picking (5 art.)" tempo="12 min" />
        <TaskRow lbl="Carica furgone" tempo="22 min" />
        <TaskRow lbl="Conta ciclica zona" tempo="15 min" />
      </div>
    </div>
  );
}

function LabRow({ o, colorIdx }: { o: LaborOperatore; colorIdx: number }) {
  const [a, b] = COLORS[colorIdx % COLORS.length];
  const eff = o.eff_avg || 0;
  const effColor = eff >= 90 ? GREEN : eff >= 80 ? AMBER : RED;
  const effLabel = eff >= 80 ? "eff." : "training";

  const iniziali = (o.operatore_nome || "OP")
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s.charAt(0).toUpperCase())
    .join("");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `linear-gradient(135deg, ${a}, ${b})`,
        color: "#fff", fontSize: 13, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{iniziali}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>{o.operatore_nome || "—"}</div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1, display: "flex", gap: 9 }}>
          <span><b style={{ color: NAVY }}>{o.picks_per_ora || 0}</b> pick/h</span>
          <span><b style={{ color: NAVY }}>{o.errori_sett || 0}</b> err.</span>
          <span><b style={{ color: NAVY }}>{Math.round(o.scan_rate_avg || 0)}%</b> scan</span>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: effColor }}>{Math.round(eff)}%</div>
        <div style={{ fontSize: 8.5, color: MUTED, marginTop: -1 }}>{effLabel}</div>
      </div>
    </div>
  );
}

function TaskRow({ lbl, tempo }: { lbl: string; tempo: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "6px 0", borderBottom: "1px solid #E5EAF0",
      fontSize: 11, color: NAVY,
    }}>
      <span>{lbl}</span>
      <span style={{ fontWeight: 800, color: TEAL }}>{tempo}</span>
    </div>
  );
}

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};
