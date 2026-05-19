"use client";
// MASTRO CODICI HUB - dashboard generale tutti i codici
import * as React from "react";
import { supabase } from "../../lib/supabase";
import { getAziendaId } from "../mastro-constants";
import ScannerOverlay from "./ScannerOverlay";

type Codice = {
  id: string;
  short: string;
  tipo: string;
  entita_id: string;
  stato: string;
  scansioni_count: number | null;
  ultima_scansione: string | null;
  next_action_hint: string | null;
  anomalie: any;
  created_at: string;
  payload: any;
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
  blue: "#3B7FE0",
  blueTint: "#DBEAFE",
  purple: "#6D28D9",
  purpleTint: "#EDE9FE",
};

const TIPO_DEF: Record<string, { label: string; icon: string; color: string; tint: string }> = {
  commessa:           { label: "Commessa",        icon: "📋", color: C.navy,   tint: C.navyTint },
  vano:               { label: "Vano",            icon: "🪟", color: C.blue,   tint: C.blueTint },
  pezzo_cnc:          { label: "Pezzo CNC",       icon: "⚙️", color: C.purple, tint: C.purpleTint },
  articolo:           { label: "Articolo",        icon: "📦", color: C.amber,  tint: C.amberTint },
  collo:              { label: "Collo",           icon: "🎁", color: C.green,  tint: C.greenTint },
  cantiere:           { label: "Cantiere",        icon: "🏗️", color: C.red,    tint: C.redTint },
  furgone:            { label: "Furgone",         icon: "🚐", color: C.navy,   tint: C.navyTint },
  macchina:           { label: "Macchinario",     icon: "🔧", color: C.purple, tint: C.purpleTint },
  documento:          { label: "Documento",       icon: "📄", color: C.sub,    tint: C.cardSoft },
  fornitore_esterno:  { label: "Fornitore",       icon: "🏭", color: C.amber,  tint: C.amberTint },
};

const STATO_DEF: Record<string, { label: string; color: string; tint: string }> = {
  creato:         { label: "Creato",         color: C.sub,    tint: C.cardSoft },
  in_lavorazione: { label: "In lavorazione", color: C.amber,  tint: C.amberTint },
  lavorato:       { label: "Lavorato",       color: C.purple, tint: C.purpleTint },
  pronto:         { label: "Pronto",         color: C.blue,   tint: C.blueTint },
  in_consegna:    { label: "In consegna",    color: C.amber,  tint: C.amberTint },
  consegnato:     { label: "Consegnato",     color: C.green,  tint: C.greenTint },
  installato:     { label: "Installato",     color: C.green,  tint: C.greenTint },
  annullato:      { label: "Annullato",      color: C.red,    tint: C.redTint },
  scaduto:        { label: "Scaduto",        color: C.red,    tint: C.redTint },
};

export default function CodiciHub() {
  const [codici, setCodici] = React.useState<Codice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQ, setSearchQ] = React.useState("");
  const [filtroTipo, setFiltroTipo] = React.useState<string>("tutti");
  const [filtroStato, setFiltroStato] = React.useState<string>("tutti");
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const loadCodici = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) { setError("Azienda non identificata"); setCodici([]); return; }
      const { data, error } = await supabase
        .from("codici")
        .select("*")
        .eq("azienda_id", aziendaId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setCodici((data || []) as Codice[]);
    } catch (e: any) {
      setError(e?.message || "Errore caricamento codici");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadCodici(); }, [loadCodici]);

  const filtered = React.useMemo(() => {
    return codici.filter(c => {
      if (filtroTipo !== "tutti" && c.tipo !== filtroTipo) return false;
      if (filtroStato !== "tutti" && c.stato !== filtroStato) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const hay = `${c.short} ${c.tipo} ${c.stato}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [codici, filtroTipo, filtroStato, searchQ]);

  // KPI
  const kpiTotale = codici.length;
  const kpiScansioni7g = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return codici.filter(c => c.ultima_scansione && new Date(c.ultima_scansione).getTime() > cutoff).length;
  }, [codici]);
  const kpiAnomalie = codici.filter(c => Array.isArray(c.anomalie) && c.anomalie.length > 0).length;
  const kpiInLavorazione = codici.filter(c => c.stato === "in_lavorazione" || c.stato === "in_consegna").length;

  // Conteggi tipi (per badge filtri)
  const tipiPresenti = React.useMemo(() => {
    const map: Record<string, number> = {};
    codici.forEach(c => { map[c.tipo] = (map[c.tipo] || 0) + 1; });
    return map;
  }, [codici]);

  const statiPresenti = React.useMemo(() => {
    const map: Record<string, number> = {};
    codici.forEach(c => { map[c.stato] = (map[c.stato] || 0) + 1; });
    return map;
  }, [codici]);

  const handleScanResult = (short: string) => {
    setScannerOpen(false);
    // Naviga alla vista contestuale del codice
    if (typeof window !== "undefined") {
      window.location.href = `/c/${short}`;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: 20 }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
        borderRadius: 16, padding: "20px 24px", color: "#fff",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>
            MASTRO Codici
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>
            {loading ? "Caricamento..." : `${kpiTotale} codici`}
          </div>
          <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4 }}>
            QR + Code128 · Identità digitale di tutto il flusso
          </div>
        </div>
        <button
          onClick={() => setScannerOpen(true)}
          style={{
            padding: "12px 22px",
            background: "rgba(255,255,255,0.15)", color: "#fff",
            border: "none", borderRadius: 11,
            fontSize: 13, fontWeight: 800,
            cursor: "pointer", letterSpacing: 0.4,
            display: "flex", alignItems: "center", gap: 8,
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
          </svg>
          Scansiona
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Totali"        value={String(kpiTotale)}      color="navy" />
        <Kpi label="Scansioni 7g"  value={String(kpiScansioni7g)} color="blue" />
        <Kpi label="In lavoraz."   value={String(kpiInLavorazione)} color="amber" alert={kpiInLavorazione > 0} />
        <Kpi label="Anomalie"      value={String(kpiAnomalie)}    color="red"  alert={kpiAnomalie > 0} />
      </div>

      {/* FILTRI TIPO */}
      <div style={{
        background: C.card, borderRadius: 14, padding: 14,
        boxShadow: "0 4px 16px rgba(15,23,42,0.18)", marginBottom: 10,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Tipo codice
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill label={`Tutti (${codici.length})`} active={filtroTipo === "tutti"} onClick={() => setFiltroTipo("tutti")} />
          {Object.entries(TIPO_DEF).map(([k, def]) => {
            const n = tipiPresenti[k] || 0;
            if (n === 0) return null;
            return (
              <Pill key={k}
                label={`${def.icon} ${def.label} (${n})`}
                active={filtroTipo === k}
                onClick={() => setFiltroTipo(k)}
                color={def.color}
              />
            );
          })}
        </div>
      </div>

      {/* FILTRI STATO + SEARCH */}
      <div style={{
        background: C.card, borderRadius: 14, padding: 14,
        boxShadow: "0 4px 16px rgba(15,23,42,0.18)", marginBottom: 12,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
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
              placeholder="Cerca short, tipo, stato..."
              autoComplete="off"
              style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: 13, fontWeight: 600, color: C.ink, outline: "none",
                fontFamily: "inherit", minWidth: 0,
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Pill label={`Tutti stati`} active={filtroStato === "tutti"} onClick={() => setFiltroStato("tutti")} />
          {Object.entries(STATO_DEF).map(([k, def]) => {
            const n = statiPresenti[k] || 0;
            if (n === 0) return null;
            return (
              <Pill key={k}
                label={`${def.label} (${n})`}
                active={filtroStato === k}
                onClick={() => setFiltroStato(k)}
                color={def.color}
              />
            );
          })}
        </div>
      </div>

      {/* LISTA */}
      <div style={{ background: C.card, borderRadius: 14, boxShadow: "0 4px 16px rgba(15,23,42,0.18)", overflow: "hidden" }}>
        {error && (
          <div style={{ padding: 28, textAlign: "center", color: C.red, fontWeight: 700 }}>
            ⚠ {error}
            <div style={{ marginTop: 10 }}>
              <button onClick={loadCodici} style={{
                padding: "8px 16px", background: C.red, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Riprova</button>
            </div>
          </div>
        )}
        {!error && loading && (
          <div style={{ padding: 50, textAlign: "center", color: C.sub, fontSize: 13, fontWeight: 600 }}>
            Caricamento codici...
          </div>
        )}
        {!error && !loading && filtered.length === 0 && codici.length === 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔖</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Nessun codice ancora</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>
              I codici vengono generati automaticamente quando crei commesse e vani
            </div>
          </div>
        )}
        {!error && !loading && filtered.length === 0 && codici.length > 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Nessun codice corrisponde ai filtri</div>
          </div>
        )}
        {!error && !loading && filtered.length > 0 && (
          <div>
            {filtered.map((c, idx) => {
              const tipoDef = TIPO_DEF[c.tipo] || { label: c.tipo, icon: "❓", color: C.sub, tint: C.cardSoft };
              const statoDef = STATO_DEF[c.stato] || { label: c.stato, color: C.sub, tint: C.cardSoft };
              const haAnomalie = Array.isArray(c.anomalie) && c.anomalie.length > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => { window.location.href = `/c/${c.short}`; }}
                  style={{
                    padding: "14px 16px",
                    borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer",
                    background: haAnomalie ? "#FEF2F2" : "transparent",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: tipoDef.tint,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, flexShrink: 0,
                  }}>{tipoDef.icon}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                        background: tipoDef.color, color: "#fff", letterSpacing: 0.4,
                        fontFamily: "monospace",
                      }}>{c.short}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                        background: statoDef.tint, color: statoDef.color,
                        textTransform: "uppercase", letterSpacing: 0.4,
                      }}>{statoDef.label}</span>
                      {haAnomalie && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 7,
                          background: C.redTint, color: C.red, textTransform: "uppercase", letterSpacing: 0.5,
                        }}>⚠ {c.anomalie.length} anom</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                      {tipoDef.label}
                      {c.next_action_hint && <span style={{ fontWeight: 500, color: C.sub, fontSize: 12 }}> · {c.next_action_hint}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 3 }}>
                      {c.scansioni_count || 0} scansioni
                      {c.ultima_scansione && ` · ultima ${fmtRelative(c.ultima_scansione)}`}
                    </div>
                  </div>

                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.subLight} strokeWidth={2.5} strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SCANNER OVERLAY */}
      {scannerOpen && (
        <ScannerOverlay
          onClose={() => setScannerOpen(false)}
          onResult={handleScanResult}
        />
      )}
    </div>
  );
}

function fmtRelative(iso: string): string {
  const dt = new Date(iso);
  const diff = Date.now() - dt.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ora";
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g fa`;
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

const Kpi: React.FC<{ label: string; value: string; color: "navy"|"green"|"amber"|"red"|"blue"; alert?: boolean }> = ({ label, value, color, alert }) => {
  const cm = { navy: C.navy, green: C.green, amber: C.amber, red: C.red, blue: C.blue };
  return (
    <div style={{
      background: alert ? "#FEF2F2" : C.card, borderRadius: 12, padding: 12,
      boxShadow: "0 4px 16px rgba(15,23,42,0.18)", borderTop: `4px solid ${cm[color]}`,
      display: "flex", flexDirection: "column", gap: 3, minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: cm[color], letterSpacing: -0.5, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void; color?: string }> = ({ label, active, onClick, color }) => (
  <div onClick={onClick} style={{
    padding: "7px 12px", borderRadius: 9,
    background: active ? (color || C.navy) : C.cardSoft,
    color: active ? "#fff" : C.ink,
    fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.3,
  }}>{label}</div>
);
