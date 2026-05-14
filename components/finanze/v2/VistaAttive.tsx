"use client";
import React from "react";
import type { FatturaFin, FattureKPI, FiltroFatture } from "../../../hooks/useFattureFinanze";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const GREEN = "#0F6E56";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const MUTED = "#5C6B7A";
const TXT_SOFT = "#8794A6";

interface Props {
  fatture: FatturaFin[];
  kpi: FattureKPI | null;
  filtro: FiltroFatture;
  onFiltroChange: (f: FiltroFatture) => void;
  onPagamento?: (fatturaId: string) => void;
}

const FILTRI: { v: FiltroFatture; l: string }[] = [
  { v: "tutte", l: "Tutte" },
  { v: "aperte", l: "Aperte" },
  { v: "scadute", l: "Scadute" },
  { v: "parziali", l: "Parziali" },
  { v: "pagate", l: "Pagate" },
];

function stripColor(s: string): { bg: string; tx: string; lbl: string } {
  if (s === "scaduta") return { bg: "linear-gradient(180deg,#F8DCD3,#fff)", tx: "#8E2A14", lbl: "SCADUTA" };
  if (s === "parziale") return { bg: "linear-gradient(180deg,#FBF0DC,#fff)", tx: "#8B6926", lbl: "PARZIALE" };
  if (s === "pagata") return { bg: "linear-gradient(180deg,#D5EBE0,#fff)", tx: GREEN, lbl: "PAGATA" };
  if (s === "aperta") return { bg: "linear-gradient(180deg,#E3EDF9,#fff)", tx: "#2D5A8C", lbl: "DA INCASSARE" };
  return { bg: "linear-gradient(180deg,#EEF2F7,#fff)", tx: NAVY, lbl: s.toUpperCase() };
}

function fmtData(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export default function VistaAttive({ fatture, kpi, filtro, onFiltroChange, onPagamento }: Props) {
  // Conteggi per pill
  const conteggi: Record<FiltroFatture, number> = {
    tutte: fatture.length,
    aperte: fatture.filter((f) => f.stato_calcolato === "aperta").length,
    scadute: fatture.filter((f) => f.stato_calcolato === "scaduta").length,
    parziali: fatture.filter((f) => f.stato_calcolato === "parziale").length,
    pagate: fatture.filter((f) => f.stato_calcolato === "pagata").length,
  };

  const filtrate = filtro === "tutte"
    ? fatture
    : fatture.filter((f) => {
        if (filtro === "aperte") return f.stato_calcolato === "aperta";
        if (filtro === "scadute") return f.stato_calcolato === "scaduta";
        if (filtro === "parziali") return f.stato_calcolato === "parziale";
        if (filtro === "pagate") return f.stato_calcolato === "pagata";
        return true;
      });

  return (
    <div style={{ padding: "12px 0 0" }}>
      {/* KPI riga */}
      {kpi && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, padding: "0 14px 10px" }}>
          <KpiCell val={`${kpi.n_aperte}`} lbl="APERTE" tone={NAVY} />
          <KpiCell val={`${kpi.n_scadute}`} lbl="SCADUTE" tone={RED} />
          <KpiCell val={`€${(kpi.totale_da_incassare / 1000).toFixed(1)}k`} lbl="DA INCASSARE" tone={GREEN} />
        </div>
      )}

      {/* Filtri pill */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 14px 10px", scrollbarWidth: "none" as any }}>
        <style>{`.fin-pillrow::-webkit-scrollbar{display:none}`}</style>
        {FILTRI.map((p) => {
          const act = filtro === p.v;
          return (
            <button key={p.v} onClick={() => onFiltroChange(p.v)} className="fin-pillrow" style={{
              padding: "6px 11px", borderRadius: 99,
              background: act ? NAVY : "#fff",
              color: act ? "#fff" : NAVY,
              border: `1.5px solid ${act ? NAVY : "transparent"}`,
              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
              cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}>
              <span>{p.l}</span>
              <span style={{
                fontSize: 9.5, padding: "1px 6px", borderRadius: 99, fontWeight: 800,
                background: act ? "rgba(255,255,255,0.2)" : "#EEF2F7",
                color: act ? "#fff" : MUTED,
              }}>{conteggi[p.v]}</span>
            </button>
          );
        })}
      </div>

      {/* Cards fatture */}
      {filtrate.length === 0 ? (
        <div style={{ padding: "32px 14px", textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessuna fattura {filtro !== "tutte" ? `"${filtro}"` : ""} trovata
        </div>
      ) : (
        filtrate.map((f) => {
          const sc = stripColor(f.stato_calcolato);
          return (
            <div key={f.id} style={{
              background: "#fff", borderRadius: 13, margin: "8px 10px",
              overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative",
            }}>
              <div style={{ background: sc.bg, padding: "6px 12px", color: sc.tx, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5 }}>
                {sc.lbl}
              </div>
              <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.cliente_nome || "Cliente"}
                  </div>
                  <div style={{ fontSize: 9.5, color: TXT_SOFT, marginTop: 2, fontWeight: 600 }}>
                    N° {f.numero || "—"} · {fmtData(f.data_emissione)}
                    {f.scadenza && ` · scad. ${fmtData(f.scadenza)}`}
                  </div>
                  {f.commessa_code && (
                    <div style={{
                      display: "inline-block", marginTop: 5,
                      background: "#FBF0DC", color: "#8B6926",
                      padding: "2px 7px", borderRadius: 99, fontSize: 9.5, fontWeight: 700,
                    }}>
                      {f.commessa_code}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                    €{f.totale_lordo.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                  </div>
                  {f.totale_pagato > 0 && f.stato_calcolato !== "pagata" && (
                    <div style={{ fontSize: 9.5, color: GREEN, fontWeight: 700, marginTop: 2 }}>
                      pag. €{f.totale_pagato.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                    </div>
                  )}
                  {f.stato_calcolato !== "pagata" && onPagamento && (
                    <button onClick={() => onPagamento(f.id)} style={{
                      marginTop: 6, padding: "5px 10px", borderRadius: 7,
                      background: TEAL, color: "#fff", border: "none",
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.3, cursor: "pointer",
                    }}>
                      INCASSA
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function KpiCell({ val, lbl, tone }: { val: string; lbl: string; tone: string }) {
  return (
    <div style={{ background: "#fff", padding: "8px 6px", borderRadius: 9, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: tone, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: 0.4, marginTop: 3, textTransform: "uppercase" }}>{lbl}</div>
    </div>
  );
}
