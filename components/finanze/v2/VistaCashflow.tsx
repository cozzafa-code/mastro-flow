"use client";
import React from "react";
import type { FinanzeKPI, HeroKPI, CashflowGiorno, FinanzeAlert } from "../../../hooks/useFinanze";
import CalendarioTimelineFinanze from "../CalendarioTimelineFinanze";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const GREEN = "#0F6E56";
const GREEN_SOFT = "#D5EBE0";
const RED = "#C73E1D";
const RED_SOFT = "#F8DCD3";
const AMBER = "#E8B05C";
const AMBER_SOFT = "#FBF0DC";
const MUTED = "#5C6B7A";
const TXT_SOFT = "#8794A6";

interface Props {
  kpi: FinanzeKPI | null;
  heroKpi: HeroKPI | null;
  cashflow: CashflowGiorno[];
  alerts: FinanzeAlert[];
  onDismissAlert?: (id: string) => void;
}

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return Math.round(n).toString();
}

export default function VistaCashflow({ kpi, heroKpi, cashflow, alerts, onDismissAlert }: Props) {
  // Sparkline 90gg
  const maxBar = Math.max(1, ...cashflow.map((c) => Math.abs(c.in_atteso - c.out_atteso)));
  const liquidita = heroKpi?.liquidita.val ?? 0;
  const incassi30 = kpi?.incassi_30gg ?? 0;
  const pag30 = kpi?.pagamenti_30gg ?? 0;

  return (
    <div style={{ padding: "12px 0 0" }}>
      {/* HERO sparkline */}
      <div style={{ margin: "0 14px", padding: 14, background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.7, color: MUTED, textTransform: "uppercase" }}>
              Liquidità prevista 90gg
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1, marginTop: 5 }}>
              EUR {liquidita >= 0 ? "+" : ""}{fmtK(liquidita)}
            </div>
            <div style={{ fontSize: 10, color: TXT_SOFT, fontWeight: 600, marginTop: 4 }}>
              {fmtK(incassi30)} in entrata · {fmtK(pag30)} uscite previste
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: TEAL, background: "#D6F0F0", padding: "2px 8px", borderRadius: 99 }}>
            {new Date().getFullYear()}
          </div>
        </div>
        {/* Sparkline 90gg */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 30, marginTop: 10 }}>
          {cashflow.slice(0, 90).map((c, i) => {
            const delta = c.in_atteso - c.out_atteso;
            const h = Math.max(3, (Math.abs(delta) / maxBar) * 28);
            const neg = delta < 0;
            const today = i === 0;
            return (
              <div key={c.data} style={{
                flex: 1, height: `${h}px`, minHeight: 3,
                background: today ? AMBER : neg
                  ? `linear-gradient(180deg, ${RED}, #8E2A14)`
                  : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
                borderRadius: "1px 1px 0 0",
                outline: today ? "2px solid #fff" : "none", outlineOffset: -1,
                zIndex: today ? 1 : 0,
              }} />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: TXT_SOFT, marginTop: 4, fontWeight: 700 }}>
          <span>OGGI</span><span>+15GG</span><span>+30GG</span><span>+60GG</span><span>+90GG</span>
        </div>
      </div>

      {/* Calendario timeline */}
      <div style={{ margin: "0 14px" }}>
        <CalendarioTimelineFinanze cashflow={cashflow} />
      </div>

      {/* 4 KPI tile */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 7, padding: "10px 14px 0" }}>
        <KpiTile val={fmtK(incassi30)} lbl="DA INCASSARE" tone="blu" />
        <KpiTile val={fmtK(pag30)} lbl="DA PAGARE" tone="warn" />
        <KpiTile val={fmtK(kpi?.iva_da_versare ?? 0)} lbl="IVA Q" tone="bad" />
        <KpiTile val={fmtK(kpi?.utile_mese ?? 0)} lbl="UTILE MESE" tone={(kpi?.utile_mese ?? 0) >= 0 ? "ok" : "bad"} />
      </div>

      {/* Alert AI */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 14, padding: "0 14px" }}>
          <div style={{
            background: "rgba(255,255,255,0.5)", borderRadius: 8,
            padding: "7px 12px", fontSize: 10.5, fontWeight: 800,
            letterSpacing: 0.8, color: NAVY, textTransform: "uppercase",
            display: "flex", justifyContent: "space-between", marginBottom: 6,
          }}>
            <span>ALERT AI · Finanze</span>
            <span style={{ background: NAVY, color: "#fff", padding: "2px 7px", borderRadius: 99, fontSize: 10 }}>
              {alerts.length}
            </span>
          </div>
          {alerts.slice(0, 3).map((a) => (
            <div key={a.id} style={{
              background: a.severity === "critical" ? RED_SOFT : a.severity === "warning" ? AMBER_SOFT : "#E3EDF9",
              border: `1px solid ${a.severity === "critical" ? RED : a.severity === "warning" ? AMBER : "#2D5A8C"}`,
              borderRadius: 10, padding: "8px 10px", marginBottom: 6,
              fontSize: 11, color: NAVY, display: "flex", justifyContent: "space-between", gap: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{a.tipo}</div>
                <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>{a.descrizione}</div>
              </div>
              {onDismissAlert && (
                <button onClick={() => onDismissAlert(a.id)} style={{
                  background: "transparent", border: "none", color: MUTED, cursor: "pointer", fontSize: 12,
                }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiTile({ val, lbl, tone }: { val: string; lbl: string; tone: "blu" | "ok" | "warn" | "bad" | "viola" }) {
  const palette: Record<string, { bg: string; col: string }> = {
    blu: { bg: "#E3EDF9", col: "#2D5A8C" },
    ok:  { bg: "#D5EBE0", col: GREEN },
    warn:{ bg: AMBER_SOFT,col: "#8B6926" },
    bad: { bg: RED_SOFT,  col: "#8E2A14" },
    viola:{ bg:"#EDE3F5", col: "#5C2D8C" },
  };
  const p = palette[tone];
  return (
    <div style={{
      background: p.bg, padding: "9px 5px", borderRadius: 9, textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", cursor: "pointer",
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: p.col, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 0.4, color: MUTED, textTransform: "uppercase", marginTop: 3 }}>
        {lbl}
      </div>
    </div>
  );
}
