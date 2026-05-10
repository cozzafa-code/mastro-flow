"use client";
// MASTRO TABLET - Fiscale v2 con debug
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
  const [debugInfo, setDebugInfo] = React.useState<string>("");
  const [searchQ, setSearchQ] = React.useState("");
  const [filtroStato, setFiltroStato] = React.useState<string>("tutte");

  const loadFatture = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebugInfo("");
    try {
      console.log("[FISCALE] Inizio caricamento...");
      const aziendaId = await getAziendaId();
      console.log("[FISCALE] aziendaId ricevuto:", aziendaId);

      if (!aziendaId) {
        const msg = "getAziendaId() ha ritornato null";
        console.error("[FISCALE]", msg);
        setError(msg);
        setDebugInfo(`aziendaId: null`);
        return;
      }

      // Test 1: query con filter azienda_id
      console.log("[FISCALE] Query 1: con filter azienda_id =", aziendaId);
      const { data: data1, error: err1, count: c1 } = await supabase
        .from("fin_fatture_emesse")
        .select("*", { count: "exact" })
        .eq("azienda_id", aziendaId);
      console.log("[FISCALE] Query 1 risultato:", { count: c1, dataLen: data1?.length, error: err1 });

      // Test 2: query SENZA filter (vediamo se RLS blocca tutto)
      console.log("[FISCALE] Query 2: SENZA filter (test RLS)");
      const { data: data2, error: err2, count: c2 } = await supabase
        .from("fin_fatture_emesse")
        .select("id, numero, azienda_id", { count: "exact" })
        .limit(5);
      console.log("[FISCALE] Query 2 risultato:", { count: c2, dataLen: data2?.length, sample: data2, error: err2 });

      const dbg = `aziendaId: ${aziendaId}\nQuery1 (con filter): count=${c1} len=${data1?.length} err=${err1?.message || "ok"}\nQuery2 (no filter): count=${c2} len=${data2?.length} err=${err2?.message || "ok"}\nSample IDs: ${(data2 || []).map(d => d.azienda_id).join(", ")}`;
      setDebugInfo(dbg);
      console.log("[FISCALE] DEBUG:", dbg);

      if (err1) throw err1;
      setFatture((data1 || []) as Fattura[]);
    } catch (e: any) {
      console.error("[FISCALE] CATCH:", e);
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
          Fatturato: €{kpiTotale.toLocaleString("it-IT")} · Incassato: €{kpiInc.toLocaleString("it-IT")}
        </div>
      </div>

      {/* DEBUG BOX */}
      {debugInfo && (
        <div style={{
          background: "#FEF3C7", border: "2px solid #F59E0B", borderRadius: 10,
          padding: 14, marginBottom: 14, fontSize: 12, fontFamily: "monospace",
          whiteSpace: "pre-wrap", color: "#92400E", fontWeight: 600,
        }}>
          🔍 DEBUG (rimuovi dopo){"\n"}{debugInfo}
        </div>
      )}

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
        <Pill label={`Tutte (${fatture.length})`} active={filtroStato === "tutte"} onClick={() => setFiltroStato("tutte")} />
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
            Caricamento...
          </div>
        )}
        {!error && !loading && fatture.length === 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Nessuna fattura emessa</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Le fatture emesse compariranno qui</div>
            <div style={{ marginTop: 12 }}>
              <button onClick={loadFatture} style={{
                padding: "8px 16px", background: C.navy, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Ricarica</button>
            </div>
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
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7, background: C.navy, color: "#fff", letterSpacing: 0.4 }}>{f.numero}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 7, background: finalStato.bg, color: finalStato.fg }}>{finalStato.label}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>
                      €{Number(f.totale).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 4 }}>{f.cliente || "Cliente n/d"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
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

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <div onClick={onClick} style={{
    padding: "7px 12px", borderRadius: 9,
    background: active ? C.navy : C.cardSoft,
    color: active ? "#fff" : C.ink,
    fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
  }}>{label}</div>
);

const DataCell: React.FC<{ label: string; value: string; alert?: boolean; accent?: "green" | "amber" }> = ({ label, value, alert, accent }) => {
  const color = alert ? C.red : accent === "green" ? C.green : accent === "amber" ? C.amber : C.ink;
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
};
