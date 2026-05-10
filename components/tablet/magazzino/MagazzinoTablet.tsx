"use client";
// MASTRO TABLET - Magazzino v4 (leggibilità nomi articolo)
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
  if (k.includes("guarn") || k.includes("silicon") || k.includes("minut"))  return { bg: C.greenTint, fg: C.green };
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
    <div style={{ background: C.bg, minHeight: "100%", padding: 20 }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
        borderRadius: 16, padding: "20px 24px", color: "#fff",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>Magazzino</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>
          {loading ? "Caricamento..." : `${kpiTotale} articoli`}
        </div>
        <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4 }}>
          Valore stock: €{kpiValore.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Totali" value={String(kpiTotale)} color="navy" />
        <Kpi label="Valore" value={`€${(kpiValore/1000).toFixed(1)}k`} color="green" />
        <Kpi label="Sotto soglia" value={String(kpiSottoSoglia)} color="amber" alert={kpiSottoSoglia > 0} />
        <Kpi label="Esauriti" value={String(kpiEsauriti)} color="red" alert={kpiEsauriti > 0} />
      </div>

      {/* FILTRI */}
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
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Cerca articolo, codice, fornitore..."
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13, fontWeight: 600, color: C.ink, outline: "none",
              fontFamily: "inherit", minWidth: 0,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Pill label={`Tutte (${articoli.length})`} active={filtroCat === "tutte"} onClick={() => setFiltroCat("tutte")} />
          {categorie.map(cat => (
            <Pill
              key={cat}
              label={`${cat.toLowerCase()} (${articoli.filter(a => a.categoria === cat).length})`}
              active={filtroCat === cat}
              onClick={() => setFiltroCat(cat)}
            />
          ))}
        </div>
      </div>

      {/* LISTA ARTICOLI */}
      <div style={{ background: C.card, borderRadius: 14, boxShadow: "0 4px 16px rgba(15,23,42,0.18)", overflow: "hidden" }}>
        {error && (
          <div style={{ padding: 28, textAlign: "center", color: C.red, fontWeight: 700 }}>
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
          <div style={{ padding: 50, textAlign: "center", color: C.sub, fontSize: 13, fontWeight: 600 }}>
            Caricamento articoli...
          </div>
        )}
        {!error && !loading && filtered.length === 0 && articoli.length === 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 6 }}>Magazzino vuoto</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Nessun articolo registrato</div>
          </div>
        )}
        {!error && !loading && filtered.length === 0 && articoli.length > 0 && (
          <div style={{ padding: 50, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Nessun articolo corrisponde ai filtri</div>
          </div>
        )}
        {!error && !loading && filtered.length > 0 && (
          <div>
            {filtered.map((a, idx) => {
              const cat = catColor(a.categoria);
              const stato = statoScorta(a.qta_disponibile || 0, a.qta_minima || 0);
              const valore = ((a.qta_disponibile || 0) * (a.prezzo_medio || 0));
              return (
                <div key={a.id} style={{
                  padding: "14px 16px",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                }}>
                  {/* RIGA 1: pill categoria + stato in alto a destra */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                      background: cat.bg, color: cat.fg, textTransform: "uppercase", letterSpacing: 0.5,
                    }}>{a.categoria || "altro"}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 7,
                      background: stato.bg, color: stato.fg,
                    }}>{stato.label}</span>
                  </div>

                  {/* RIGA 2: NOME completo (può andare a capo) */}
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.3, marginBottom: 4 }}>
                    {a.nome}
                  </div>

                  {/* RIGA 3: codice + fornitore */}
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginBottom: 10 }}>
                    {a.codice_interno || "—"} · {a.fornitore_principale || "Fornitore n/d"}
                  </div>

                  {/* RIGA 4: dati numerici allineati */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    paddingTop: 10,
                    borderTop: `1px dashed ${C.border}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>
                        Disponib.
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                        {a.qta_disponibile} <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>{a.unita || ""}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginTop: 2 }}>
                        min: {a.qta_minima}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>
                        Prezzo
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                        €{(a.prezzo_medio || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginTop: 2 }}>
                        val: €{valore.toFixed(0)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>
                        Ubicazione
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, lineHeight: 1, marginTop: 1 }}>
                        📍 {a.ubicazione || "—"}
                      </div>
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
      borderRadius: 12, padding: 12,
      boxShadow: "0 4px 16px rgba(15,23,42,0.18)",
      borderTop: `4px solid ${m.bd}`,
      display: "flex", flexDirection: "column", gap: 3,
      minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: m.fg, letterSpacing: -0.5, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
    </div>
  );
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: "7px 12px",
      borderRadius: 9,
      background: active ? C.navy : C.cardSoft,
      color: active ? "#fff" : C.ink,
      fontSize: 11, fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
      letterSpacing: 0.3,
    }}
  >{label}</div>
);
