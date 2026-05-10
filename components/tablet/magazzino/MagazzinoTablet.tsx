"use client";
// MASTRO TABLET - Magazzino v3 (fix layout colonne)
import * as React from "react";
import { supabase } from "../../../lib/supabase";
import { getAziendaId } from "../../mastro-constants";

type Articolo = {
  id: string;
  azienda_id: string;
  codice_interno: string | null;
  nome: string;
  categoria: string | null;
  fornitore_principale: string | null;
  unita: string | null;
  qta_disponibile: number;
  qta_minima: number;
  qta_riordino: number;
  ubicazione: string | null;
  prezzo_medio: number;
  attivo: boolean;
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

function catColor(cat: string | null): { bg: string; fg: string } {
  const k = (cat || "").toLowerCase();
  if (k.includes("profil") || k.includes("alluminio") || k.includes("barre")) return { bg: C.blueTint, fg: C.blue };
  if (k.includes("vetr"))   return { bg: C.purpleTint, fg: C.purple };
  if (k.includes("ferr") || k.includes("manig") || k.includes("cernier")) return { bg: C.amberTint, fg: C.amber };
  if (k.includes("guarn") || k.includes("silicon"))  return { bg: C.greenTint, fg: C.green };
  return { bg: C.navyTint, fg: C.navy };
}

function statoScorta(qta: number, qmin: number): { label: string; bg: string; fg: string } {
  if (qta === 0) return { label: "Esaurito", bg: C.redTint, fg: C.red };
  if (qta < qmin * 0.5) return { label: "Critico", bg: C.redTint, fg: C.red };
  if (qta < qmin) return { label: "Basso", bg: C.amberTint, fg: C.amber };
  return { label: "OK", bg: C.greenTint, fg: C.green };
}

export default function MagazzinoTablet() {
  const [articoli, setArticoli] = React.useState<Articolo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQ, setSearchQ] = React.useState("");
  const [filtroCat, setFiltroCat] = React.useState<string>("tutte");

  const loadArticoli = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) {
        setError("Azienda non identificata");
        setArticoli([]);
        return;
      }
      const { data, error } = await supabase
        .from("magazzino_articoli")
        .select("*")
        .eq("azienda_id", aziendaId)
        .eq("attivo", true)
        .order("nome", { ascending: true });
      if (error) throw error;
      setArticoli(data || []);
    } catch (e: any) {
      setError(e?.message || "Errore caricamento magazzino");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadArticoli(); }, [loadArticoli]);

  const categorie = React.useMemo(() => {
    const set = new Set<string>();
    articoli.forEach(a => { if (a.categoria) set.add(a.categoria); });
    return Array.from(set).sort();
  }, [articoli]);

  const filtered = React.useMemo(() => {
    return articoli.filter(a => {
      if (filtroCat !== "tutte" && a.categoria !== filtroCat) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const hay = `${a.nome} ${a.codice_interno || ""} ${a.fornitore_principale || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articoli, filtroCat, searchQ]);

  const kpiTotale = articoli.length;
  const kpiValore = articoli.reduce((s, a) => s + ((a.qta_disponibile || 0) * (a.prezzo_medio || 0)), 0);
  const kpiSottoSoglia = articoli.filter(a => (a.qta_disponibile || 0) > 0 && (a.qta_disponibile || 0) < (a.qta_minima || 0)).length;
  const kpiEsauriti = articoli.filter(a => (a.qta_disponibile || 0) === 0).length;

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: 24 }}>

      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
        borderRadius: 18, padding: "22px 26px", color: "#fff",
        marginBottom: 18, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>Magazzino</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>
          {loading ? "Caricamento..." : `${kpiTotale} articoli`}
        </div>
        <div style={{ fontSize: 13, color: "#B5C8DD", fontWeight: 600, marginTop: 4 }}>
          Valore stock: €{kpiValore.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        <Kpi label="Articoli totali" value={String(kpiTotale)} color="navy" />
        <Kpi label="Valore stock" value={`€${(kpiValore/1000).toFixed(1)}k`} color="green" />
        <Kpi label="Sotto soglia" value={String(kpiSottoSoglia)} color="amber" alert={kpiSottoSoglia > 0} />
        <Kpi label="Esauriti" value={String(kpiEsauriti)} color="red" alert={kpiEsauriti > 0} />
      </div>

      <div style={{
        background: C.card, borderRadius: 14, padding: 16,
        boxShadow: "0 4px 16px rgba(15,23,42,0.18)", marginBottom: 14,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{
          flex: 1, minWidth: 220,
          background: C.cardSoft, borderRadius: 11, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.subLight} strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Cerca articolo, codice, fornitore..."
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, color: C.ink, outline: "none",
              fontFamily: "inherit", minWidth: 0,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill label={`Tutte (${articoli.length})`} active={filtroCat === "tutte"} onClick={() => setFiltroCat("tutte")} />
          {categorie.map(cat => (
            <Pill
              key={cat}
              label={`${cat} (${articoli.filter(a => a.categoria === cat).length})`}
              active={filtroCat === cat}
              onClick={() => setFiltroCat(cat)}
            />
          ))}
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 14, boxShadow: "0 4px 16px rgba(15,23,42,0.18)", overflow: "hidden" }}>
        {error && (
          <div style={{ padding: 32, textAlign: "center", color: C.red, fontWeight: 700 }}>
            ⚠ {error}
            <div style={{ marginTop: 10 }}>
              <button onClick={loadArticoli} style={{
                padding: "8px 16px", background: C.red, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Riprova</button>
            </div>
          </div>
        )}
        {!error && loading && (
          <div style={{ padding: 60, textAlign: "center", color: C.sub, fontSize: 14, fontWeight: 600 }}>
            Caricamento articoli...
          </div>
        )}
        {!error && !loading && filtered.length === 0 && articoli.length === 0 && (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Magazzino vuoto</div>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>Nessun articolo registrato per questa azienda</div>
          </div>
        )}
        {!error && !loading && filtered.length === 0 && articoli.length > 0 && (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>Nessun articolo corrisponde ai filtri</div>
          </div>
        )}
        {!error && !loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((a, idx) => {
              const cat = catColor(a.categoria);
              const stato = statoScorta(a.qta_disponibile || 0, a.qta_minima || 0);
              const valore = ((a.qta_disponibile || 0) * (a.prezzo_medio || 0));
              return (
                <div key={a.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  minWidth: 0,
                }}>
                  {/* COL 1: nome + categoria pill + fornitore */}
                  <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                        {a.nome}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                        background: cat.bg, color: cat.fg, textTransform: "uppercase", letterSpacing: 0.4,
                        flexShrink: 0,
                      }}>{a.categoria || "altro"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.codice_interno || "—"} · {a.fornitore_principale || "Fornitore n/d"}
                    </div>
                  </div>

                  {/* COL 2: disponibilità */}
                  <div style={{ flex: "0 0 100px", textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {a.qta_disponibile}
                      <span style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginLeft: 4 }}>{a.unita || ""}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginTop: 3 }}>
                      min: {a.qta_minima}
                    </div>
                  </div>

                  {/* COL 3: prezzo + valore */}
                  <div style={{ flex: "0 0 110px", textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      €{(a.prezzo_medio || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginTop: 3 }}>
                      val: €{valore.toFixed(0)}
                    </div>
                  </div>

                  {/* COL 4: stato + ubicazione */}
                  <div style={{ flex: "0 0 130px", textAlign: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: "5px 12px", borderRadius: 8,
                      background: stato.bg, color: stato.fg, display: "inline-block",
                    }}>{stato.label}</span>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginTop: 4 }}>
                      📍 {a.ubicazione || "—"}
                    </div>
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
  const colorMap = {
    navy: { bd: C.navy, fg: C.navy },
    green: { bd: C.green, fg: C.green },
    amber: { bd: C.amber, fg: C.amber },
    red: { bd: C.red, fg: C.red },
  };
  const m = colorMap[color];
  return (
    <div style={{
      background: alert ? C.redSoft : C.card,
      borderRadius: 14, padding: 16,
      boxShadow: "0 4px 16px rgba(15,23,42,0.18)",
      borderTop: `4px solid ${m.bd}`,
      display: "flex", flexDirection: "column", gap: 4,
      minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: m.fg, letterSpacing: -0.5, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
    </div>
  );
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      background: active ? C.navy : C.cardSoft,
      color: active ? "#fff" : C.ink,
      fontSize: 12, fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
      letterSpacing: 0.3,
    }}
  >{label}</div>
);
