"use client";
import React from "react";
import type { FatturaRicevutaRow, SpesaRow, FattRicevuteKPI, FiltroFattRic } from "../../../hooks/useSpese";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const GREEN = "#0F6E56";
const RED = "#C73E1D";
const MUTED = "#5C6B7A";
const TXT_SOFT = "#8794A6";

interface Props {
  fatture: FatturaRicevutaRow[];
  spese: SpesaRow[];
  kpi: FattRicevuteKPI | null;
  filtro: FiltroFattRic;
  onFiltroChange: (f: FiltroFattRic) => void;
  onPagamento?: (fatturaId: string) => void;
}

const FILTRI: { v: FiltroFattRic; l: string }[] = [
  { v: "tutte", l: "Tutte" },
  { v: "da_pagare", l: "Da pagare" },
  { v: "scadute", l: "Scadute" },
  { v: "pagate", l: "Pagate" },
];

function stripColor(s: string): { bg: string; tx: string; lbl: string } {
  if (s === "scaduta") return { bg: "linear-gradient(180deg,#F8DCD3,#fff)", tx: "#8E2A14", lbl: "SCADUTA" };
  if (s === "da_pagare") return { bg: "linear-gradient(180deg,#FBF0DC,#fff)", tx: "#8B6926", lbl: "DA PAGARE" };
  if (s === "pagata") return { bg: "linear-gradient(180deg,#D5EBE0,#fff)", tx: GREEN, lbl: "PAGATA" };
  return { bg: "linear-gradient(180deg,#EEF2F7,#fff)", tx: NAVY, lbl: s.toUpperCase() };
}

function fmtData(d?: string | null): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }); }
  catch { return "—"; }
}

function fmtEuro(n?: number | null): string {
  if (n == null || isNaN(n)) return "0";
  return Number(n).toLocaleString("it-IT", { maximumFractionDigits: 0 });
}

export default function VistaPassive({ fatture, spese, kpi, filtro, onFiltroChange, onPagamento }: Props) {
  const safe = fatture || [];
  const safeSpese = spese || [];

  const conteggi: Record<FiltroFattRic, number> = {
    tutte: safe.length,
    da_pagare: safe.filter((f) => f.stato_calcolato === "da_pagare").length,
    scadute: safe.filter((f) => f.stato_calcolato === "scaduta").length,
    pagate: safe.filter((f) => f.stato_calcolato === "pagata").length,
  };

  const filtrate = filtro === "tutte"
    ? safe
    : safe.filter((f) => {
        if (filtro === "da_pagare") return f.stato_calcolato === "da_pagare";
        if (filtro === "scadute") return f.stato_calcolato === "scaduta";
        if (filtro === "pagate") return f.stato_calcolato === "pagata";
        return true;
      });

  return (
    <div style={{ padding: "12px 0 0" }}>
      {kpi && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, padding: "0 14px 10px" }}>
          <KpiCell val={`${kpi.n_da_pagare || 0}`} lbl="DA PAGARE" tone={NAVY} />
          <KpiCell val={`${kpi.n_scadute || 0}`} lbl="SCADUTE" tone={RED} />
          <KpiCell val={`€${((kpi.importo_da_pagare || 0) / 1000).toFixed(1)}k`} lbl="TOT" tone="#8B6926" />
        </div>
      )}

      <div className="pass-pillrow" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 14px 10px", scrollbarWidth: "none" as any }}>
        <style>{`.pass-pillrow::-webkit-scrollbar{display:none}`}</style>
        {FILTRI.map((p) => {
          const act = filtro === p.v;
          return (
            <button key={p.v} onClick={() => onFiltroChange(p.v)} style={{
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

      <div style={{
        margin: "0 14px 4px", padding: "7px 12px",
        background: "rgba(255,255,255,0.5)", borderRadius: 8,
        fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8,
        color: NAVY, textTransform: "uppercase",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>Fatture Passive</span>
        <span style={{ background: NAVY, color: "#fff", padding: "2px 7px", borderRadius: 99, fontSize: 10 }}>
          {filtrate.length}
        </span>
      </div>

      {filtrate.length === 0 ? (
        <div style={{ padding: "20px 14px", textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessuna fattura {filtro !== "tutte" ? `"${filtro}"` : ""} trovata
        </div>
      ) : (
        filtrate.map((f) => {
          const sc = stripColor(f.stato_calcolato);
          return (
            <div key={f.id} style={{
              background: "#fff", borderRadius: 13, margin: "8px 10px",
              overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <div style={{ background: sc.bg, padding: "6px 12px", color: sc.tx, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5 }}>
                {sc.lbl}
              </div>
              <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.fornitore || "Fornitore"}
                  </div>
                  <div style={{ fontSize: 9.5, color: TXT_SOFT, marginTop: 2, fontWeight: 600 }}>
                    N° {f.numero || "—"} · {fmtData(f.data_ricezione)}
                    {f.data_scadenza && ` · scad. ${fmtData(f.data_scadenza)}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                    €{fmtEuro(f.totale)}
                  </div>
                  {f.stato_calcolato !== "pagata" && onPagamento && (
                    <button onClick={() => onPagamento(f.id)} style={{
                      marginTop: 6, padding: "5px 10px", borderRadius: 7,
                      background: RED, color: "#fff", border: "none",
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.3, cursor: "pointer",
                    }}>
                      PAGA
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {safeSpese.length > 0 && (
        <>
          <div style={{
            margin: "16px 14px 4px", padding: "7px 12px",
            background: "rgba(255,255,255,0.5)", borderRadius: 8,
            fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8,
            color: NAVY, textTransform: "uppercase",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>Spese rapide</span>
            <span style={{ background: NAVY, color: "#fff", padding: "2px 7px", borderRadius: 99, fontSize: 10 }}>
              {safeSpese.length}
            </span>
          </div>
          {safeSpese.slice(0, 10).map((s) => (
            <div key={s.id} style={{
              background: "#fff", margin: "6px 10px", padding: "9px 12px",
              borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.descrizione || s.categoria || "Spesa"}
                </div>
                <div style={{ fontSize: 9.5, color: TXT_SOFT, marginTop: 2 }}>
                  {s.categoria || "—"} · {fmtData(s.data)}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: RED, marginLeft: 8 }}>
                −€{fmtEuro(s.importo)}
              </div>
            </div>
          ))}
        </>
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
