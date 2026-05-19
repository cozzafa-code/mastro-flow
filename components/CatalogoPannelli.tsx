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

type Sezione = "porte_interne" | "blindati" | "pannelli";

// Ogni sezione raggruppa N tipi del DB
const SEZIONI: Record<Sezione, { label: string; icon: string; color: string; tipi: string[]; descrizione: string }> = {
  porte_interne: {
    label: "Porte Interne",
    icon: "🚪",
    color: "#8B5E3C",
    tipi: ["porta_interna"],
    descrizione: "Porte da interno: laccate, in legno, vetrate. Per camere, cucine, bagni, uffici.",
  },
  blindati: {
    label: "Portoncini Blindati",
    icon: "🛡",
    color: "#1A1A1C",
    tipi: ["blindato", "ingresso_alluminio"],
    descrizione: "Porte di ingresso ad alta sicurezza: classe RC2-RC6, ingressi alluminio termici.",
  },
  pannelli: {
    label: "Pannelli",
    icon: "🪟",
    color: "#3B7FE0",
    tipi: ["pvc", "garage"],
    descrizione: "Pannelli per porte PVC, alluminio, garage. Decorativi e funzionali.",
  },
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
  const [sezione, setSezione] = React.useState<Sezione>("porte_interne");
  const [showImport, setShowImport] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [credits, setCredits] = React.useState<any | null>(null);

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

  const sezioneCorrente = SEZIONI[sezione];
  const pannelliSezione = pannelli.filter(p => p.tipo && sezioneCorrente.tipi.includes(p.tipo));
  const pannelliSenzaTipo = pannelli.filter(p => !p.tipo);

  const filtered = pannelliSezione.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      if (!(p.nome?.toLowerCase().includes(s) || p.codice?.toLowerCase().includes(s) || p.produttore?.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  // Conta per ogni sezione
  const conteggi: Record<Sezione, number> = {
    porte_interne: pannelli.filter(p => p.tipo && SEZIONI.porte_interne.tipi.includes(p.tipo)).length,
    blindati: pannelli.filter(p => p.tipo && SEZIONI.blindati.tipi.includes(p.tipo)).length,
    pannelli: pannelli.filter(p => p.tipo && SEZIONI.pannelli.tipi.includes(p.tipo)).length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Disattivare questo elemento?")) return;
    await fetch(`/api/pannelli/list?id=${id}`, { method: "DELETE" });
    loadAll();
  };

  const handleAssegnaTipo = async (id: string, nuovoTipo: string) => {
    // Aggiorna direttamente via list API (PATCH non disponibile, usa POST replicando)
    // Per semplicità: chiamata diretta a Supabase via update endpoint dedicato
    const res = await fetch(`/api/pannelli/list?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: nuovoTipo }),
    });
    if (!res.ok) {
      // Fallback: insert + delete
      alert("Funzione assegnazione tipo non ancora disponibile - importa pannelli con tipo dal modal");
      return;
    }
    loadAll();
  };

  return (
    <div style={{ padding: "16px 18px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header con tabs sezioni */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 4 }}>
          {(Object.keys(SEZIONI) as Sezione[]).map(s => {
            const sez = SEZIONI[s];
            const isActive = sezione === s;
            const count = conteggi[s];
            return (
              <div key={s} onClick={() => setSezione(s)} style={{
                flex: "1 1 auto", minWidth: 140,
                padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                background: isActive ? sez.color : "#fff",
                color: isActive ? "#fff" : "#1A1A1C",
                border: `2px solid ${isActive ? sez.color : "#e5e5e5"}`,
                transition: "all 0.15s",
                boxShadow: isActive ? `0 4px 12px ${sez.color}33` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 20 }}>{sez.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{sez.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>
                      {count} {count === 1 ? "elemento" : "elementi"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: "#888", padding: "0 4px" }}>
          {sezioneCorrente.descrizione}
        </div>
      </div>

      {/* Toolbar: search + import */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 Cerca in ${sezioneCorrente.label.toLowerCase()}...`}
          style={{ flex: 1, padding: "10px 14px", fontSize: 12, border: "1px solid #ddd", borderRadius: 8 }} />
        <div onClick={() => setShowImport(true)} style={{
          padding: "10px 16px", borderRadius: 8, background: sezioneCorrente.color, color: "#fff",
          fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          📥 Importa
        </div>
      </div>

      {/* Banner budget */}
      {credits?.credits && (
        <div style={{ marginBottom: 12, padding: 10, background: "#fafafa", borderRadius: 8, fontSize: 10, color: "#666", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            💳 Budget AI: <strong style={{ color: "#1A9E73" }}>€{Number(credits.credits.budget_corrente).toFixed(2)}</strong>
            {Number(credits.credits.totale_speso_mese) > 0 && <span> · speso questo mese: €{Number(credits.credits.totale_speso_mese).toFixed(2)}</span>}
          </div>
          <div style={{ fontSize: 9, color: "#aaa" }}>
            {pannelli.length} elementi totali in catalogo
          </div>
        </div>
      )}

      {/* Banner pannelli senza tipo */}
      {pannelliSenzaTipo.length > 0 && (
        <div style={{ padding: 12, marginBottom: 12, background: "#D0800815", borderRadius: 10, border: "1.5px solid #D08008" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#D08008", marginBottom: 4 }}>
            ⚠️ {pannelliSenzaTipo.length} elementi senza categoria
          </div>
          <div style={{ fontSize: 10, color: "#1A1A1C", lineHeight: 1.5, marginBottom: 8 }}>
            Hai {pannelliSenzaTipo.length} pannelli generici (PN-PVC, PN-AL, ecc.) non assegnati a una categoria. Assegnali per vederli nelle sezioni:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pannelliSenzaTipo.slice(0, 5).map(p => (
              <div key={p.id} style={{ padding: "5px 9px", background: "#fff", borderRadius: 5, fontSize: 9, border: "1px solid #D08008" }}>
                <strong>{p.codice || p.nome}</strong>
              </div>
            ))}
            {pannelliSenzaTipo.length > 5 && <div style={{ padding: "5px 9px", fontSize: 9, color: "#888" }}>+{pannelliSenzaTipo.length - 5} altri</div>}
          </div>
        </div>
      )}

      {/* Lista pannelli */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 11 }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#fafafa", borderRadius: 10 }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>{sezioneCorrente.icon}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 6 }}>
            {search ? "Nessun risultato" : `Nessun ${sezioneCorrente.label.toLowerCase()} in catalogo`}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>
            {search ? "Prova a cambiare ricerca" : "Importa un PDF catalogo per popolare questa sezione"}
          </div>
          {!search && (
            <div onClick={() => setShowImport(true)} style={{
              display: "inline-block", padding: "10px 18px", borderRadius: 8,
              background: sezioneCorrente.color, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
            }}>📥 Importa {sezioneCorrente.label}</div>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}>
          {filtered.map(p => {
            const tipoColor = (p.tipo && TIPI_COLOR[p.tipo]) || sezioneCorrente.color;
            return (
              <div key={p.id} style={{
                border: "1.5px solid #eee", borderRadius: 10, overflow: "hidden",
                background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  height: 140, background: "#fafafa",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", borderBottom: "1px solid #f0f0f0",
                }}>
                  {p.immagine_url ? (
                    <img src={p.immagine_url} alt={p.nome} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <div style={{ fontSize: 42, opacity: 0.25 }}>{sezioneCorrente.icon}</div>
                  )}
                  {p.tipo && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      padding: "3px 7px", borderRadius: 4, background: tipoColor, color: "#fff",
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
                    <div onClick={() => handleDelete(p.id)} style={{ padding: "4px 8px", fontSize: 9, color: "#DC4444", cursor: "pointer", fontWeight: 700 }}>🗑</div>
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
