"use client";
// MASTRO TABLET - Fiscale v3 (produzione)
import * as React from "react";
import { supabase } from "../../../lib/supabase";
import { getAziendaId } from "../../mastro-constants";

type Fattura = {
  id: string;
  azienda_id: string;
  numero: string;
  data_emissione: string;
  data_scadenza: string | null;
  cliente: string;
  cliente_piva: string | null;
  imponibile: number;
  iva: number;
  totale: number;
  stato: string;
  pagato: number;
  residuo: number;
  commessa_code: string | null;
  sdi_id: string | null;
  sdi_stato: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  tipo: string | null;
};

const C = {
  bg: "#94A3B8", card: "#FFFFFF", cardSoft: "#F8FAFC", ink: "#0A1628",
  sub: "#64748B", subLight: "#94A3B8", border: "#E2E8F0",
  navy: "#1E3A5F", navyTint: "#DBE6F1",
  amber: "#92400E", amberTint: "#FEF3C7",
  green: "#065F46", greenTint: "#ECFDF5",
  red: "#991B1B", redTint: "#FEE2E2", redSoft: "#FEF2F2",
  blue: "#3B7FE0", blueTint: "#DBEAFE",
};

function statoFatturaColor(stato: string): { bg: string; fg: string; label: string } {
  const s = (stato || "").toLowerCase();
  if (s === "pagata") return { bg: C.greenTint, fg: C.green, label: "Pagata" };
  if (s === "scaduta") return { bg: C.redTint, fg: C.red, label: "Scaduta" };
  if (s === "parziale") return { bg: C.amberTint, fg: C.amber, label: "Parziale" };
  if (s === "da_inviare") return { bg: C.amberTint, fg: C.amber, label: "Da inviare" };
  if (s === "inviata") return { bg: C.blueTint, fg: C.blue, label: "Inviata" };
  if (s === "consegnata") return { bg: C.greenTint, fg: C.green, label: "Consegnata" };
  if (s === "scartata") return { bg: C.redTint, fg: C.red, label: "Scartata SDI" };
  return { bg: C.navyTint, fg: C.navy, label: stato || "—" };
}

function isScaduta(f: Fattura): boolean {
  if (!f.data_scadenza) return false;
  if (f.stato === "pagata") return false;
  const today = new Date().toISOString().split("T")[0];
  return f.data_scadenza < today && Number(f.residuo) > 0;
}

function fmtData(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FiscaleTablet() {
  const [fatture, setFatture] = React.useState<Fattura[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQ, setSearchQ] = React.useState("");
  const [filtroStato, setFiltroStato] = React.useState<string>("tutte");

  const loadFatture = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) {
        setError("Azienda non identificata");
        setFatture([]);
        return;
      }
      const { data, error } = await supabase
        .from("fin_fatture_emesse")
        .select("*")
        .eq("azienda_id", aziendaId)
        .order("data_emissione", { ascending: false });
      if (error) throw error;
      setFatture((data || []) as Fattura[]);
    } catch (e: any) {
      setError(e?.message || "Errore caricamento fatture");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadFatture(); }, [loadFatture]);

  const filtered = React.useMemo(() => {
    return fatture.filter(f => {
      if (filtroStato === "scadute" && !isScaduta(f)) return false;
      else if (filtroStato !== "tutte" && filtroStato !== "scadute" && f.stato !== filtroStato) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const hay = `${f.numero} ${f.cliente || ""} ${f.commessa_code || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [fatture, filtroStato, searchQ]);

  const kpiTotale = fatture.reduce((s, f) => s + (Number(f.totale) || 0), 0);
  const kpiInc = fatture.reduce((s, f) => s + (Number(f.pagato) || 0), 0);
  const kpiRes = fatture.reduce((s, f) => s + (Number(f.residuo) || 0), 0);
  const kpiScad = fatture.filter(isScaduta).length;
  const kpiDaInviare = fatture.filter(f => f.stato === "da_inviare").length;

  const stati = React.useMemo(() => {
    const set = new Set<string>();
    fatture.forEach(f => { if (f.stato) set.add(f.stato); });
    return Array.from(set).sort();
  }, [fatture]);

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: 20 }}>

      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
        borderRadius: 16, padding: "20px 24px", color: "#fff",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>Fiscale</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>
          {loading ? "Caricamento..." : `${fatture.length} fatture emesse`}
        </div>
        <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4 }}>
          Fatturato: €{kpiTotale.toLocaleString("it-IT", { maximumFractionDigits: 2 })} · Incassato: €{kpiInc.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Fatturato" value={`€${(kpiTotale/1000).toFixed(1)}k`} color="navy" />
        <Kpi label="Incassato" value={`€${(kpiInc/1000).toFixed(1)}k`} color="green" />
        <Kpi label="Residuo" value={`€${(kpiRes/1000).toFixed(1)}k`} color="amber" alert={kpiRes > 0} />
        <Kpi label="Scadute" value={String(kpiScad)} color="red" alert={kpiScad > 0} />
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
            placeholder="Cerca numero, cliente, commessa..."
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13, fontWeight: 600, color: C.ink, outline: "none",
              fontFamily: "inherit", minWidth: 0,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Pill label={`Tutte (${fatture.length})`} active={filtroStato === "tutte"} onClick={() => setFiltroStato("tutte")} />
          {kpiScad > 0 && (
            <Pill label={`Scadute (${kpiScad})`} active={filtroStato === "scadute"} onClick={() => setFiltroStato("scadute")} alert />
          )}
          {stati.map(s => {
            const sc = statoFatturaColor(s);
            return (
              <Pill
                key={s}
                label={`${sc.label} (${fatture.filter(f => f.stato === s).length})`}
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
              <button onClick={loadFatture} style={{
                padding: "8px 16px", background: C.red, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Riprova</button>
            </div>
          </div>
        )}
        {!error && loading && (
          <div style={{ padding: 50, textAlign: "center", color: C.sub, fontSize: 13, fontWeight: 600 }}>
            Caricamento fatture...
          </div>
        )}
        {!error && !loading && filtered.length === 0 && fatture.length === 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Nessuna fattura emessa</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Le fatture emesse compariranno qui</div>
          </div>
        )}
        {!error && !loading && filtered.length === 0 && fatture.length > 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Nessuna fattura corrisponde ai filtri</div>
          </div>
        )}
        {!error && !loading && filtered.length > 0 && (
          <div>
            {filtered.map((f, idx) => {
              const stato = statoFatturaColor(f.stato);
              const scaduta = isScaduta(f);
              const finalStato = scaduta ? statoFatturaColor("scaduta") : stato;
              return (
                <div key={f.id} style={{
                  padding: "14px 16px",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  background: scaduta ? C.redSoft : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                        background: C.navy, color: "#fff", letterSpacing: 0.4,
                        fontVariantNumeric: "tabular-nums",
                      }}>{f.numero}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                        background: finalStato.bg, color: finalStato.fg,
                      }}>{finalStato.label}</span>
                      {f.sdi_stato && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 7,
                          background: C.blueTint, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5,
                        }}>SDI: {f.sdi_stato}</span>
                      )}
                      {f.commessa_code && (
                        <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>· {f.commessa_code}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                      €{Number(f.totale).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.3, marginBottom: 4 }}>
                    {f.cliente || "Cliente n/d"}
                  </div>
                  {f.cliente_piva && (
                    <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginBottom: 8 }}>
                      P.IVA {f.cliente_piva}
                    </div>
                  )}

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: 10,
                    paddingTop: 10,
                    borderTop: `1px dashed ${C.border}`,
                  }}>
                    <DataCell label="Emessa" value={fmtData(f.data_emissione)} />
                    <DataCell label="Scadenza" value={fmtData(f.data_scadenza)} alert={scaduta} />
                    <DataCell label="Pagato" value={`€${Number(f.pagato).toFixed(2)}`} accent="green" />
                    <DataCell label="Residuo" value={`€${Number(f.residuo).toFixed(2)}`} accent={Number(f.residuo) > 0 ? "amber" : undefined} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {kpiDaInviare > 0 && (
        <div style={{
          marginTop: 14,
          background: C.amberTint,
          border: `1px solid #FCD34D`,
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: C.amber, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, flexShrink: 0,
          }}>!</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.amber }}>
              {kpiDaInviare} {kpiDaInviare === 1 ? "fattura" : "fatture"} in attesa di invio SDI
            </div>
            <div style={{ fontSize: 11, color: "#475A75", fontWeight: 600, marginTop: 2 }}>
              Controlla e invia al Sistema di Interscambio per la trasmissione fiscale
            </div>
          </div>
        </div>
      )}
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
