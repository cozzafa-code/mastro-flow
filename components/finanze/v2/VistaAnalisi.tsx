"use client";
import React from "react";
import { useAnalisiFinanze, BUCKET_AGING_LABEL, BUCKET_AGING_COLOR } from "../../../hooks/useAnalisiFinanze";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const MUTED = "#5C6B7A";
const RED = "#C73E1D";
const GREEN = "#0F6E56";
const BG_SOFT = "#F7F9FB";
const BORDER = "#E5EAF0";

interface Props { aziendaId: string; }

export default function VistaAnalisi({ aziendaId }: Props) {
  const a = useAnalisiFinanze(aziendaId);

  if (a.loading) return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Carico analisi…</div>;

  const aKpi = a.agingKpi;
  const prev = a.previsionale;
  const saldoPrev = prev ? (prev.in_30gg - prev.out_30gg) : 0;

  return (
    <div style={{ padding: 12 }}>

      {/* PREVISIONALE 90gg */}
      <Sez tit="Previsionale 90 giorni">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
          <PrevCol lbl="30 gg" inn={prev?.in_30gg || 0} out={prev?.out_30gg || 0} />
          <PrevCol lbl="31-60 gg" inn={prev?.in_31_60gg || 0} out={prev?.out_31_60gg || 0} />
          <PrevCol lbl="61-90 gg" inn={prev?.in_61_90gg || 0} out={prev?.out_61_90gg || 0} />
        </div>
        <div style={{
          background: saldoPrev >= 0 ? "#D5EBE0" : "#FCE3E3",
          color: saldoPrev >= 0 ? GREEN : RED,
          padding: "9px 11px", borderRadius: 8, textAlign: "center", fontWeight: 800, fontSize: 12,
        }}>
          Saldo 30gg: € {saldoPrev.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
        </div>
      </Sez>

      {/* AGING */}
      <Sez tit="Aging fatture aperte" right={<span style={{ fontSize: 9.5, color: MUTED, fontWeight: 700 }}>{a.aging.length} aperte</span>}>
        {!aKpi || aKpi.importo_totale_aperto === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11.5, fontStyle: "italic" }}>
            Tutte le fatture incassate. ✓
          </div>
        ) : (
          <>
            <AgingBar kpi={aKpi} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 8 }}>
              <AgBox lbl="OK" val={aKpi.importo_corrente} c={GREEN} />
              <AgBox lbl="0-30" val={aKpi.importo_0_30} c="#E8B05C" />
              <AgBox lbl="31-60" val={aKpi.importo_31_60} c="#E8830C" />
              <AgBox lbl="61-90" val={aKpi.importo_61_90} c={RED} />
              <AgBox lbl=">90" val={aKpi.importo_over_90} c="#8B0000" />
            </div>
            {aKpi.n_critiche > 0 && (
              <div style={{
                marginTop: 8, padding: "8px 11px", background: "#FCE3E3", color: RED,
                borderRadius: 7, fontSize: 11, fontWeight: 700, borderLeft: `3px solid ${RED}`,
              }}>
                ⚠ {aKpi.n_critiche} {aKpi.n_critiche === 1 ? "fattura critica" : "fatture critiche"} oltre 90 gg
              </div>
            )}
          </>
        )}
      </Sez>

      {/* TOP MOROSI */}
      <Sez tit="Top clienti morosi" right={<span style={{ fontSize: 9.5, color: MUTED, fontWeight: 700 }}>{a.morosi.length}</span>}>
        {a.morosi.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11.5, fontStyle: "italic" }}>
            Nessun cliente moroso. ✓
          </div>
        ) : (
          a.morosi.slice(0, 5).map((m, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 0", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.cliente}
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
                  {m.n_fatture_scadute} fatt. · ritardo medio {m.avg_giorni_ritardo}gg · max {m.max_giorni_ritardo}gg
                </div>
              </div>
              <div style={{ textAlign: "right", marginLeft: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.max_giorni_ritardo > 60 ? RED : "#E8830C" }}>
                  € {m.importo_dovuto.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          ))
        )}
      </Sez>

      {/* DSO clienti top */}
      <Sez tit="DSO medio per cliente">
        {a.dso.slice(0, 5).map((d, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 0", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.cliente}
              </div>
              <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
                {d.n_fatture} fatt. · € {(d.fatturato_totale || 0).toLocaleString("it-IT", { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 800,
              color: d.dso_medio == null ? MUTED : d.dso_medio <= 30 ? GREEN : d.dso_medio <= 60 ? "#E8830C" : RED,
              minWidth: 50, textAlign: "right",
            }}>
              {d.dso_medio == null ? "—" : `${d.dso_medio}gg`}
            </div>
          </div>
        ))}
      </Sez>

      {/* MARGINI COMMESSE */}
      <Sez tit="Margine reale commesse" right={<span style={{ fontSize: 9.5, color: MUTED, fontWeight: 700 }}>{a.margini.length}</span>}>
        {a.margini.slice(0, 5).map((m, i) => (
          <div key={i} style={{
            padding: "9px 0", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>
                  {m.commessa_code} · {m.cliente_nome}
                </div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
                  Ric. €{m.ricavi_fatturati.toLocaleString("it-IT", { maximumFractionDigits: 0 })} − Mat. €{m.costo_materiali.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div style={{ textAlign: "right", marginLeft: 10 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 800,
                  color: m.margine_pct == null ? MUTED : m.margine_pct >= 30 ? GREEN : m.margine_pct >= 15 ? "#E8830C" : RED,
                }}>
                  {m.margine_pct == null ? "—" : `${m.margine_pct}%`}
                </div>
                <div style={{ fontSize: 9.5, color: MUTED }}>
                  €{m.margine_assoluto.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Sez>

    </div>
  );
}

function Sez({ tit, right, children }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 13, padding: "11px 12px", marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{tit}</span>{right}
      </div>
      {children}
    </div>
  );
}

function AgingBar({ kpi }: { kpi: any }) {
  const total = kpi.importo_totale_aperto || 1;
  const segs = [
    { v: kpi.importo_corrente, c: GREEN, k: "corrente" },
    { v: kpi.importo_0_30, c: "#E8B05C", k: "0_30" },
    { v: kpi.importo_31_60, c: "#E8830C", k: "31_60" },
    { v: kpi.importo_61_90, c: RED, k: "61_90" },
    { v: kpi.importo_over_90, c: "#8B0000", k: "over_90" },
  ];
  return (
    <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: BG_SOFT }}>
      {segs.map((s, i) => s.v > 0 && (
        <div key={i} style={{ flex: s.v / total, background: s.c }} title={`${BUCKET_AGING_LABEL[s.k]}: €${s.v.toFixed(0)}`} />
      ))}
    </div>
  );
}

function AgBox({ lbl, val, c }: { lbl: string; val: number; c: string }) {
  return (
    <div style={{ background: BG_SOFT, padding: "6px 5px", borderRadius: 6, textAlign: "center", borderTop: `2px solid ${c}` }}>
      <div style={{ fontSize: 8.5, color: MUTED, fontWeight: 700, letterSpacing: 0.3 }}>{lbl}</div>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: c, marginTop: 1 }}>
        €{Math.round(val || 0).toLocaleString("it-IT")}
      </div>
    </div>
  );
}

function PrevCol({ lbl, inn, out }: { lbl: string; inn: number; out: number }) {
  return (
    <div style={{ background: BG_SOFT, borderRadius: 9, padding: "8px 7px" }}>
      <div style={{ fontSize: 9, color: MUTED, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 5 }}>{lbl}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: GREEN, fontWeight: 700 }}>▼</span>
        <span style={{ fontSize: 11, color: GREEN, fontWeight: 800 }}>€{Math.round(inn).toLocaleString("it-IT")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 9, color: RED, fontWeight: 700 }}>▲</span>
        <span style={{ fontSize: 11, color: RED, fontWeight: 800 }}>€{Math.round(out).toLocaleString("it-IT")}</span>
      </div>
    </div>
  );
}
