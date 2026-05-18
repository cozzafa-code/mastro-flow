"use client";
import React from "react";

type Profilo = {
  id: string;
  codice: string | null;
  descrizione: string | null;
  ruolo: string | null;
  larghezza_mm: number | null;
  altezza_mm: number | null;
  prezzo_ml: number | null;
  peso_kg_m: number | null;
  n_camere: number | null;
  sistema?: { nome?: string; produttore?: string } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (profilo: Profilo) => void;
  ruolo?: string | null; // filtro suggerito (telaio/anta/montante/traverso/zoccolo/soglia)
  vanoSistema?: string | null;
  currentProfiloId?: string | null;
};

const RUOLI_LABEL: Record<string, string> = {
  telaio: "Telaio",
  anta: "Anta",
  montante: "Montante",
  traverso: "Traverso",
  zoccolo: "Zoccolo",
  soglia: "Soglia",
  fascia: "Fascia",
  profcomp: "Prof. Comp.",
  fermavetro: "Fermavetro",
};

export default function SelettoreProfilo({ open, onClose, onSelect, ruolo, vanoSistema, currentProfiloId }: Props) {
  const [profili, setProfili] = React.useState<Profilo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filtroRuolo, setFiltroRuolo] = React.useState<string | null>(ruolo || null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (vanoSistema) params.append("sistema", vanoSistema);
    fetch(`/api/catalogo-profili?${params.toString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setProfili(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setProfili([]); setLoading(false); });
  }, [open, vanoSistema]);

  React.useEffect(() => { setFiltroRuolo(ruolo || null); }, [ruolo]);

  if (!open) return null;

  const ruoliPresenti = Array.from(new Set(profili.map(p => p.ruolo).filter(Boolean))) as string[];

  const filtered = profili.filter(p => {
    if (filtroRuolo && p.ruolo !== filtroRuolo) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(p.codice?.toLowerCase().includes(s) || p.descrizione?.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "min(96vw, 560px)", maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73" }}>📐 Catalogo Profili</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
              {profili.length} profili{vanoSistema ? ` · sistema ${vanoSistema}` : ""}{filtroRuolo ? ` · ${RUOLI_LABEL[filtroRuolo] || filtroRuolo}` : ""} · {filtered.length} risultati
            </div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#666" }}>✕</div>
        </div>

        <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cerca per codice / descrizione"
            style={{ width: "100%", padding: "9px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, marginBottom: 8, fontFamily: "inherit" }} />

          {ruoliPresenti.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <div onClick={() => setFiltroRuolo(null)}
                style={{
                  padding: "4px 9px", fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                  background: !filtroRuolo ? "#1A9E73" : "#fff",
                  color: !filtroRuolo ? "#fff" : "#666",
                  border: `1.5px solid ${!filtroRuolo ? "#1A9E73" : "#ddd"}`,
                }}>Tutti</div>
              {ruoliPresenti.map(r => (
                <div key={r} onClick={() => setFiltroRuolo(filtroRuolo === r ? null : r)}
                  style={{
                    padding: "4px 9px", fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                    background: filtroRuolo === r ? "#1A9E73" : "#fff",
                    color: filtroRuolo === r ? "#fff" : "#666",
                    border: `1.5px solid ${filtroRuolo === r ? "#1A9E73" : "#ddd"}`,
                  }}>{RUOLI_LABEL[r] || r}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>Caricamento profili...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>
              Nessun profilo corrisponde ai filtri.
              <div style={{ marginTop: 6, fontSize: 9 }}>Controlla che il sistema sia importato in catalogo_profili.</div>
            </div>
          ) : (
            filtered.map(p => (
              <div key={p.id} onClick={() => onSelect(p)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderBottom: "1px solid #f5f5f5", cursor: "pointer",
                  background: currentProfiloId === p.id ? "#1A9E7310" : "transparent",
                }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, border: "1px solid #eee", borderRadius: 6, background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#1A9E73", textTransform: "uppercase" }}>{p.ruolo || "?"}</div>
                  {p.larghezza_mm && p.altezza_mm && (
                    <div style={{ fontSize: 7, color: "#888", marginTop: 1, fontFamily: "monospace" }}>{p.larghezza_mm}×{p.altezza_mm}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{p.codice}</div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descrizione}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.sistema?.nome && <span style={{ background: "#3B7FE015", color: "#3B7FE0", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>{p.sistema.nome}</span>}
                    {p.peso_kg_m && <span>{p.peso_kg_m}kg/m</span>}
                    {p.n_camere && <span>· {p.n_camere}cam</span>}
                  </div>
                </div>
                <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: "#1A9E73" }}>
                  {p.prezzo_ml ? `€${p.prezzo_ml.toFixed(2)}/ml` : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
