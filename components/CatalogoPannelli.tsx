"use client";
import React from "react";
import ImportPannelli from "./ImportPannelli";

type Pannello = {
  id: string;
  nome: string;
  codice: string | null;
  tipo: string | null;
  produttore: string | null;
  serie: string | null;
  modello: string | null;
  colore_finitura: string | null;
  immagine_url: string | null;
  larghezza_min: number | null;
  larghezza_max: number | null;
  altezza_min: number | null;
  altezza_max: number | null;
  spessore_mm: number | null;
  prezzo: number | null;
  fornitore: string | null;
  certificazioni: any;
  colori_disponibili: any;
  attivo: boolean;
  sorgente_import: string | null;
  created_at: string;
};

const TIPI_LABEL: Record<string, string> = {
  porta_interna: "Porta interna",
  blindato: "Blindato",
  pvc: "PVC",
  ingresso_alluminio: "Ingresso alluminio",
  garage: "Garage",
};

const TIPI_COLOR: Record<string, string> = {
  porta_interna: "#8B5E3C",
  blindato: "#1A1A1C",
  pvc: "#3B7FE0",
  ingresso_alluminio: "#888",
  garage: "#D08008",
};

export default function CatalogoPannelli() {
  const [pannelli, setPannelli] = React.useState<Pannello[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showImport, setShowImport] = React.useState(false);
  const [filtroTipo, setFiltroTipo] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [credits, setCredits] = React.useState<any | null>(null);
  const [imports, setImports] = React.useState<any[]>([]);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/pannelli/list").then(r => r.ok ? r.json() : []),
        fetch("/api/ai-credits").then(r => r.ok ? r.json() : null),
      ]);
      setPannelli(Array.isArray(pRes) ? pRes : []);
      setCredits(cRes);
    } catch (e) {
      setPannelli([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  const tipiPresenti = Array.from(new Set(pannelli.map(p => p.tipo).filter(Boolean))) as string[];

  const filtered = pannelli.filter(p => {
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(p.nome?.toLowerCase().includes(s) || p.codice?.toLowerCase().includes(s) || p.produttore?.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Disattivare questo pannello?")) return;
    await fetch(`/api/pannelli/list?id=${id}`, { method: "DELETE" });
    loadAll();
  };

  return (
    <div style={{ padding: "16px 18px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1C" }}>📦 Catalogo Pannelli</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            {pannelli.length} pannelli totali · {filtered.length} mostrati
            {credits?.credits && (
              <span style={{ marginLeft: 12 }}>
                · 💳 Budget AI: <strong style={{ color: "#1A9E73" }}>€{Number(credits.credits.budget_corrente).toFixed(2)}</strong>
              </span>
            )}
          </div>
        </div>
        <div onClick={() => setShowImport(true)} style={{
          padding: "10px 18px", borderRadius: 8, background: "#1A9E73", color: "#fff",
          fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          📥 Importa catalogo
        </div>
      </div>

      {/* Filtri */}
      <div style={{ marginBottom: 12, padding: 12, background: "#fafafa", borderRadius: 10 }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cerca per nome / codice / produttore..."
          style={{ width: "100%", padding: "9px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, marginBottom: 10 }} />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div onClick={() => setFiltroTipo(null)} style={chipStyle(!filtroTipo, "#1A9E73")}>Tutti</div>
          {Object.keys(TIPI_LABEL).map(t => {
            const count = pannelli.filter(p => p.tipo === t).length;
            const isActive = filtroTipo === t;
            const c = TIPI_COLOR[t] || "#1A9E73";
            return (
              <div key={t} onClick={() => setFiltroTipo(isActive ? null : t)}
                style={chipStyle(isActive, c)}>
                {TIPI_LABEL[t]} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner se DB povero */}
      {!loading && pannelli.filter(p => p.tipo).length === 0 && pannelli.length > 0 && (
        <div style={{ padding: 14, marginBottom: 12, background: "#3B7FE015", borderRadius: 10, border: "1.5px solid #3B7FE0" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#3B7FE0", marginBottom: 4 }}>💡 Catalogo iniziale generico</div>
          <div style={{ fontSize: 10, color: "#1A1A1C", lineHeight: 1.5 }}>
            Hai {pannelli.length} pannelli generici di partenza (senza tipo, produttore, foto). Importa un catalogo PDF di un produttore (Garofoli, Dierre, Internorm, ecc.) per arricchire il database con dati reali e foto.
          </div>
        </div>
      )}

      {/* Lista pannelli */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 11 }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#fafafa", borderRadius: 10 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 6 }}>
            {search || filtroTipo ? "Nessun pannello trova i filtri" : "Catalogo vuoto"}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>
            {search || filtroTipo ? "Prova a cambiare filtri" : "Importa un PDF catalogo per riempire il database"}
          </div>
          {(!search && !filtroTipo) && (
            <div onClick={() => setShowImport(true)} style={{
              display: "inline-block", padding: "10px 18px", borderRadius: 8, background: "#1A9E73",
              color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
            }}>📥 Importa il primo catalogo</div>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}>
          {filtered.map(p => {
            const c = (p.tipo && TIPI_COLOR[p.tipo]) || "#666";
            return (
              <div key={p.id} style={{
                border: "1.5px solid #eee", borderRadius: 10, overflow: "hidden",
                background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  height: 130, background: "#fafafa",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", borderBottom: "1px solid #f0f0f0",
                }}>
                  {p.immagine_url ? (
                    <img src={p.immagine_url} alt={p.nome} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <div style={{ fontSize: 36, opacity: 0.3 }}>🚪</div>
                  )}
                  {p.tipo && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      padding: "3px 7px", borderRadius: 4, background: c, color: "#fff",
                      fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                    }}>{TIPI_LABEL[p.tipo] || p.tipo}</div>
                  )}
                  {p.sorgente_import === "ai_catalogo" && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      padding: "3px 6px", borderRadius: 4, background: "#D08008", color: "#fff",
                      fontSize: 8, fontWeight: 800,
                    }}>🤖 AI</div>
                  )}
                </div>
                <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</div>
                  {p.codice && <div style={{ fontSize: 9, color: "#888", fontFamily: "monospace", marginBottom: 4 }}>{p.codice}</div>}
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 6, flex: 1 }}>
                    {p.produttore && <span style={{ fontWeight: 700 }}>{p.produttore}</span>}
                    {p.serie && <span> · {p.serie}</span>}
                    {!p.produttore && !p.serie && <span style={{ color: "#aaa" }}>Generico</span>}
                  </div>
                  {(p.larghezza_max || p.altezza_max) && (
                    <div style={{ fontSize: 9, color: "#888", marginBottom: 4, fontFamily: "monospace" }}>
                      {p.larghezza_min && p.larghezza_max && `${p.larghezza_min}-${p.larghezza_max}mm`}
                      {p.altezza_min && p.altezza_max && ` × ${p.altezza_min}-${p.altezza_max}mm`}
                      {p.spessore_mm && ` · sp.${p.spessore_mm}mm`}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: p.prezzo ? "#1A9E73" : "#aaa" }}>
                      {p.prezzo ? `€${Number(p.prezzo).toFixed(2)}` : "—"}
                    </div>
                    <div onClick={() => handleDelete(p.id)} style={{ padding: "4px 8px", fontSize: 9, color: "#DC4444", cursor: "pointer", fontWeight: 700 }}>🗑 Elimina</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImportPannelli open={showImport} onClose={() => setShowImport(false)} onComplete={loadAll} />
    </div>
  );
}

function chipStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: "5px 11px", fontSize: 10, fontWeight: 700,
    borderRadius: 5, cursor: "pointer", whiteSpace: "nowrap",
    background: active ? color : "#fff",
    color: active ? "#fff" : "#666",
    border: `1.5px solid ${active ? color : "#ddd"}`,
  };
}
