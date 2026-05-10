"use client";
// MASTRO TABLET - Ordini fornitori v1 con dati reali Supabase
// Tabella: ordini_fornitore (filter by azienda_id)
import * as React from "react";
import { supabase } from "../../../lib/supabase";
import { getAziendaId } from "../../mastro-constants";

type Ordine = {
  id: string;
  azienda_id: string;
  numero: string;
  fornitore: string;
  tipo: string | null;
  tipo_ordine: string | null;
  categoria_materiale: string | null;
  totale_euro: number | null;
  totale_stimato: number | null;
  totale_scontato: number | null;
  stato: string;
  consegna_prevista: string | null;
  consegna_confermata: string | null;
  data_invio: string | null;
  data_ricezione: string | null;
  urgente: boolean;
  bozza: boolean;
  righe: any;
  commessa_id: string | null;
  metodo_pagamento: string | null;
};

const C = {
  bg: "#94A3B8",
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyTint: "#DBE6F1",
  amber: "#92400E",
  amberTint: "#FEF3C7",
  green: "#065F46",
  greenTint: "#ECFDF5",
  red: "#991B1B",
  redTint: "#FEE2E2",
  redSoft: "#FEF2F2",
  blue: "#3B7FE0",
  blueTint: "#DBEAFE",
  purple: "#6D28D9",
  purpleTint: "#EDE9FE",
};

function statoColor(stato: string): { bg: string; fg: string; label: string } {
  const s = (stato || "").toLowerCase();
  if (s === "bozza") return { bg: C.cardSoft, fg: C.sub, label: "Bozza" };
  if (s === "da_inviare") return { bg: C.amberTint, fg: C.amber, label: "Da inviare" };
  if (s === "inviato" || s === "in_attesa") return { bg: C.blueTint, fg: C.blue, label: "Inviato" };
  if (s === "confermato") return { bg: C.purpleTint, fg: C.purple, label: "Confermato" };
  if (s === "in_consegna") return { bg: C.amberTint, fg: C.amber, label: "In consegna" };
  if (s === "ricevuto" || s === "consegnato") return { bg: C.greenTint, fg: C.green, label: "Ricevuto" };
  if (s === "annullato") return { bg: C.redTint, fg: C.red, label: "Annullato" };
  return { bg: C.navyTint, fg: C.navy, label: stato || "—" };
}

function isInRitardo(o: Ordine): boolean {
  if (!o.consegna_prevista) return false;
  if (o.stato === "ricevuto" || o.stato === "consegnato" || o.stato === "annullato") return false;
  const today = new Date().toISOString();
  return o.consegna_prevista < today;
}

function fmtData(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function getTotale(o: Ordine): number {
  return Number(o.totale_scontato || o.totale_euro || o.totale_stimato || 0);
}

export default function OrdiniTablet() {
  const [ordini, setOrdini] = React.useState<Ordine[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQ, setSearchQ] = React.useState("");
  const [filtroStato, setFiltroStato] = React.useState<string>("tutti");

  const loadOrdini = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) {
        setError("Azienda non identificata");
        setOrdini([]);
        return;
      }
      const { data, error } = await supabase
        .from("ordini_fornitore")
        .select("*")
        .eq("azienda_id", aziendaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrdini((data || []) as Ordine[]);
    } catch (e: any) {
      setError(e?.message || "Errore caricamento ordini");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadOrdini(); }, [loadOrdini]);

  const filtered = React.useMemo(() => {
    return ordini.filter(o => {
      if (filtroStato === "ritardo" && !isInRitardo(o)) return false;
      else if (filtroStato !== "tutti" && filtroStato !== "ritardo" && o.stato !== filtroStato) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const hay = `${o.numero} ${o.fornitore || ""} ${o.categoria_materiale || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ordini, filtroStato, searchQ]);

  const kpiTotale = ordini.length;
  const kpiValore = ordini.reduce((s, o) => s + getTotale(o), 0);
  const kpiInRitardo = ordini.filter(isInRitardo).length;
  const kpiInConsegna = ordini.filter(o => o.stato === "in_consegna" || o.stato === "in_attesa" || o.stato === "inviato").length;

  const stati = React.useMemo(() => {
    const set = new Set<string>();
    ordini.forEach(o => { if (o.stato) set.add(o.stato); });
    return Array.from(set).sort();
  }, [ordini]);

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: 20 }}>

      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
        borderRadius: 16, padding: "20px 24px", color: "#fff",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>Ordini fornitori</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>
          {loading ? "Caricamento..." : `${kpiTotale} ordini`}
        </div>
        <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4 }}>
          Valore totale: €{kpiValore.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Totali" value={String(kpiTotale)} color="navy" />
        <Kpi label="Valore" value={`€${(kpiValore/1000).toFixed(1)}k`} color="green" />
        <Kpi label="In consegna" value={String(kpiInConsegna)} color="amber" alert={kpiInConsegna > 0} />
        <Kpi label="In ritardo" value={String(kpiInRitardo)} color="red" alert={kpiInRitardo > 0} />
      </div>

      <div style={{
        background: C.card, borderRadius: 14, padding: 14,
        boxShadow: "0 4px 16px rgba(15,23,42,0.18)", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{
          flex: 1, minWidth: 200,
          background: C.cardSoft, borderRadius: 10, padding: "9px 12px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.subLight} strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Cerca numero, fornitore, categoria..."
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13, fontWeight: 600, color: C.ink, outline: "none",
              fontFamily: "inherit", minWidth: 0,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Pill label={`Tutti (${ordini.length})`} active={filtroStato === "tutti"} onClick={() => setFiltroStato("tutti")} />
          {kpiInRitardo > 0 && (
            <Pill label={`Ritardo (${kpiInRitardo})`} active={filtroStato === "ritardo"} onClick={() => setFiltroStato("ritardo")} alert />
          )}
          {stati.map(s => {
            const sc = statoColor(s);
            return (
              <Pill
                key={s}
                label={`${sc.label} (${ordini.filter(o => o.stato === s).length})`}
                active={filtroStato === s}
                onClick={() => setFiltroStato(s)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 14, boxShadow: "0 4px 16px rgba(15,23,42,0.18)", overflow: "hidden" }}>
        {error && (
          <div style={{ padding: 28, textAlign: "center", color: C.red, fontWeight: 700 }}>
            ⚠ {error}
            <div style={{ marginTop: 10 }}>
              <button onClick={loadOrdini} style={{
                padding: "8px 16px", background: C.red, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Riprova</button>
            </div>
          </div>
        )}
        {!error && loading && (
          <div style={{ padding: 50, textAlign: "center", color: C.sub, fontSize: 13, fontWeight: 600 }}>
            Caricamento ordini...
          </div>
        )}
        {!error && !loading && filtered.length === 0 && ordini.length === 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Nessun ordine</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Gli ordini ai fornitori compariranno qui</div>
          </div>
        )}
        {!error && !loading && filtered.length === 0 && ordini.length > 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Nessun ordine corrisponde ai filtri</div>
          </div>
        )}
        {!error && !loading && filtered.length > 0 && (
          <div>
            {filtered.map((o, idx) => {
              const stato = statoColor(o.stato);
              const ritardo = isInRitardo(o);
              const finalStato = ritardo ? { bg: C.redTint, fg: C.red, label: "In ritardo" } : stato;
              const totale = getTotale(o);
              const nPezzi = Array.isArray(o.righe) ? o.righe.reduce((s, r) => s + (Number(r?.qta) || 0), 0) : 0;
              return (
                <div key={o.id} style={{
                  padding: "14px 16px",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  background: ritardo ? C.redSoft : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                        background: C.navy, color: "#fff", letterSpacing: 0.4,
                        fontVariantNumeric: "tabular-nums",
                      }}>{o.numero}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                        background: finalStato.bg, color: finalStato.fg,
                      }}>{finalStato.label}</span>
                      {o.urgente && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 7,
                          background: C.redTint, color: C.red, textTransform: "uppercase", letterSpacing: 0.5,
                        }}>⚡ Urgente</span>
                      )}
                      {o.bozza && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 7,
                          background: C.cardSoft, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5,
                        }}>Bozza</span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                      €{totale.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.3, marginBottom: 4 }}>
                    {o.fornitore || "Fornitore n/d"}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginBottom: 8 }}>
                    {o.categoria_materiale || "—"}
                    {o.tipo_ordine ? ` · ${o.tipo_ordine}` : ""}
                    {nPezzi > 0 ? ` · ${nPezzi} pezzi` : ""}
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    paddingTop: 10,
                    borderTop: `1px dashed ${C.border}`,
                  }}>
                    <DataCell label="Inviato" value={fmtData(o.data_invio)} />
                    <DataCell label="Consegna" value={fmtData(o.consegna_prevista)} alert={ritardo} />
                    <DataCell label="Ricevuto" value={fmtData(o.data_ricezione)} accent={o.data_ricezione ? "green" : undefined} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const Kpi: React.FC<{ label: string; value: string; color: "navy" | "green" | "amber" | "red"; alert?: boolean }> = ({ label, value, color, alert }) => {
  const cm = { navy: C.navy, green: C.green, amber: C.amber, red: C.red };
  return (
    <div style={{
      background: alert ? C.redSoft : C.card, borderRadius: 12, padding: 12,
      boxShadow: "0 4px 16px rgba(15,23,42,0.18)", borderTop: `4px solid ${cm[color]}`,
      display: "flex", flexDirection: "column", gap: 3, minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: cm[color], letterSpacing: -0.5, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void; alert?: boolean }> = ({ label, active, onClick, alert }) => (
  <div onClick={onClick} style={{
    padding: "7px 12px", borderRadius: 9,
    background: active ? (alert ? C.red : C.navy) : (alert ? C.redTint : C.cardSoft),
    color: active ? "#fff" : (alert ? C.red : C.ink),
    fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.3,
  }}>{label}</div>
);

const DataCell: React.FC<{ label: string; value: string; alert?: boolean; accent?: "green" | "amber" }> = ({ label, value, alert, accent }) => {
  const color = alert ? C.red : accent === "green" ? C.green : accent === "amber" ? C.amber : C.ink;
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
    </div>
  );
};
