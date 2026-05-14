"use client";
import React from "react";
import type { LiquidazioneIva, EventoFiscale, TasseKPI } from "../../../hooks/useTasse";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const GREEN = "#0F6E56";
const RED = "#C73E1D";
const MUTED = "#5C6B7A";
const TXT_SOFT = "#8794A6";

interface Props {
  liquidazioni: LiquidazioneIva[];
  eventi: EventoFiscale[];
  eventiScaduti: EventoFiscale[];
  kpi: TasseKPI | null;
  onMarcaVersata?: (id: string) => Promise<{ ok: boolean; error?: string }>;
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

function tipoBadge(tipo: string): { bg: string; tx: string; lbl: string } {
  const T = (tipo || "").toLowerCase();
  if (T.includes("f24")) return { bg: "#FBF0DC", tx: "#8B6926", lbl: "F24" };
  if (T.includes("iva")) return { bg: "#E3EDF9", tx: "#2D5A8C", lbl: "IVA" };
  if (T.includes("forfett")) return { bg: "#EDE3F5", tx: "#5C2D8C", lbl: "FORF." };
  if (T.includes("inps")) return { bg: "#D5EBE0", tx: GREEN, lbl: "INPS" };
  return { bg: "#EEF2F7", tx: MUTED, lbl: (tipo || "—").slice(0, 6).toUpperCase() };
}

export default function VistaF24Iva({ liquidazioni, eventi, eventiScaduti, kpi, onMarcaVersata }: Props) {
  const safeLiq = liquidazioni || [];
  const safeEv = eventi || [];
  const safeEvSc = eventiScaduti || [];

  return (
    <div style={{ padding: "12px 0 0" }}>
      {kpi && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, padding: "0 14px 10px" }}>
          <KpiCell val={`${kpi.n_aperte || 0}`} lbl="APERTE" tone={NAVY} />
          <KpiCell val={`${kpi.n_scadute || 0}`} lbl="SCADUTE" tone={RED} />
          <KpiCell val={`€${((kpi.importo_da_versare || 0) / 1000).toFixed(1)}k`} lbl="DA VERSARE" tone="#8B6926" />
        </div>
      )}

      {safeEvSc.length > 0 && (
        <>
          <SectionTitle title="Scaduti · da pagare subito" count={safeEvSc.length} red />
          {safeEvSc.map((e) => (
            <EventoCard key={e.id_evento} e={e} scaduto onMarcaVersata={onMarcaVersata} />
          ))}
        </>
      )}

      {safeEv.length > 0 && (
        <>
          <SectionTitle title="Prossime scadenze fiscali" count={safeEv.length} />
          {safeEv.slice(0, 15).map((e) => (
            <EventoCard key={e.id_evento} e={e} onMarcaVersata={onMarcaVersata} />
          ))}
        </>
      )}

      {safeLiq.length > 0 && (
        <>
          <SectionTitle title="Liquidazioni IVA · Storico" count={safeLiq.length} />
          {safeLiq.slice(0, 6).map((l) => (
            <div key={l.id} style={{
              background: "#fff", margin: "6px 10px", padding: 12,
              borderRadius: 11, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>
                    {l.periodo || "—"}
                    {l.tipo_periodo && <span style={{ fontSize: 9.5, color: TXT_SOFT, fontWeight: 600, marginLeft: 6 }}>· {l.tipo_periodo}</span>}
                  </div>
                  <div style={{ fontSize: 9.5, color: TXT_SOFT, fontWeight: 600, marginTop: 2 }}>
                    {l.data_versamento ? `Versata: ${fmtData(l.data_versamento)}` : `Stato: ${l.stato || "aperta"}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: l.data_versamento ? GREEN : "#8B6926", lineHeight: 1 }}>
                    €{fmtEuro(l.debito_versare)}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: l.data_versamento ? GREEN : "#8B6926", marginTop: 3 }}>
                    {l.data_versamento ? "VERSATA" : "DA VERSARE"}
                  </div>
                  {!l.data_versamento && onMarcaVersata && (
                    <button onClick={() => onMarcaVersata(l.id)} style={{
                      marginTop: 4, padding: "4px 8px", borderRadius: 6,
                      background: TEAL, color: "#fff", border: "none",
                      fontSize: 9.5, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
                    }}>VERSA</button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px dashed #E5EAF0" }}>
                <KpiMini lbl="VENDITE" val={`€${fmtEuro(l.iva_vendite)}`} />
                <KpiMini lbl="ACQUISTI" val={`€${fmtEuro(l.iva_acquisti)}`} />
                <KpiMini lbl="DOVUTA" val={`€${fmtEuro(l.iva_dovuta)}`} />
              </div>
            </div>
          ))}
        </>
      )}

      {safeEv.length === 0 && safeEvSc.length === 0 && safeLiq.length === 0 && (
        <div style={{ padding: "30px 14px", textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessuna scadenza fiscale in arrivo
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, count, red }: { title: string; count: number; red?: boolean }) {
  return (
    <div style={{
      margin: "10px 14px 4px", padding: "7px 12px",
      background: red ? "#F8DCD3" : "rgba(255,255,255,0.5)",
      borderRadius: 8,
      fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8,
      color: red ? RED : NAVY, textTransform: "uppercase",
      display: "flex", justifyContent: "space-between",
    }}>
      <span>{title}</span>
      <span style={{
        background: red ? RED : NAVY, color: "#fff",
        padding: "2px 7px", borderRadius: 99, fontSize: 10,
      }}>{count}</span>
    </div>
  );
}

function EventoCard({ e, scaduto, onMarcaVersata }: { e: EventoFiscale; scaduto?: boolean; onMarcaVersata?: (id: string) => Promise<any> }) {
  const b = tipoBadge(e.tipo);
  return (
    <div style={{
      background: "#fff", margin: "6px 10px", padding: 12,
      borderRadius: 11, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      borderLeft: `3px solid ${scaduto ? RED : "#E5EAF0"}`,
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{
          background: b.bg, color: b.tx,
          padding: "4px 8px", borderRadius: 6,
          fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0,
        }}>{b.lbl}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: NAVY }}>{e.descrizione || e.tipo}</div>
          <div style={{ fontSize: 10, color: TXT_SOFT, fontWeight: 600, marginTop: 2 }}>
            Data: {fmtData(e.data)} {e.riferimento ? `· ${e.riferimento}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: scaduto ? RED : "#8B6926" }}>
            €{fmtEuro(e.importo)}
          </div>
          {onMarcaVersata && (
            <button onClick={() => onMarcaVersata(e.id_evento)} style={{
              marginTop: 4, padding: "4px 8px", borderRadius: 6,
              background: TEAL, color: "#fff", border: "none",
              fontSize: 9.5, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
            }}>
              VERSA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiMini({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: 0.4, textTransform: "uppercase" }}>{lbl}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: NAVY, marginTop: 2 }}>{val}</div>
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
