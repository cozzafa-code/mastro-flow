"use client";
import React from "react";

type Nodo = {
  id: string;
  nome: string;
  descrizione: string | null;
  profili_coinvolti: string[] | null;
  tipo: string | null;
  immagine_url: string | null;
  dxf_url: string | null;
  pdf_url: string | null;
  note: string | null;
  sistema?: { nome?: string } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (nodo: Nodo) => void;
  profiliCoinvolti?: string[];
  vanoSistema?: string | null;
  currentNodoId?: string | null;
};

const TIPI_LABEL: Record<string, string> = {
  angolo_45: "Angolo 45°",
  angolo_90: "Angolo 90°",
  T: "T-Junction",
  X: "Croce",
  giunzione: "Giunzione",
  pilastrino: "Pilastrino",
};

export default function SelettoreNodo({ open, onClose, onSelect, profiliCoinvolti, vanoSistema, currentNodoId }: Props) {
  const [nodi, setNodi] = React.useState<Nodo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filtroTipo, setFiltroTipo] = React.useState<string | null>(null);
  const [matchOnly, setMatchOnly] = React.useState(true); // default: filtra solo nodi compatibili

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (vanoSistema) params.append("sistema", vanoSistema);
    fetch(`/api/catalogo-nodi?${params.toString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setNodi(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setNodi([]); setLoading(false); });
  }, [open, vanoSistema]);

  if (!open) return null;

  const tipiPresenti = Array.from(new Set(nodi.map(n => n.tipo).filter(Boolean))) as string[];

  const matchProfili = (n: Nodo) => {
    if (!profiliCoinvolti || profiliCoinvolti.length === 0) return true;
    if (!n.profili_coinvolti || n.profili_coinvolti.length === 0) return true;
    // Match: tutti i profili richiesti devono essere presenti nel nodo (in qualunque ordine)
    return profiliCoinvolti.every(p => (n.profili_coinvolti || []).some(np => np.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(np.toLowerCase())));
  };

  const filtered = nodi.filter(n => {
    if (matchOnly && !matchProfili(n)) return false;
    if (filtroTipo && n.tipo !== filtroTipo) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(n.nome?.toLowerCase().includes(s) || n.descrizione?.toLowerCase().includes(s))) return false;
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
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73" }}>🔗 Catalogo Nodi Costruttivi</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
              {nodi.length} nodi{vanoSistema ? ` · ${vanoSistema}` : ""}{profiliCoinvolti?.length ? ` · profili: ${profiliCoinvolti.join(" + ")}` : ""} · {filtered.length} risultati
            </div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#666" }}>✕</div>
        </div>

        <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cerca per nome / descrizione"
            style={{ width: "100%", padding: "9px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, marginBottom: 8, fontFamily: "inherit" }} />

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {profiliCoinvolti && profiliCoinvolti.length > 0 && (
              <div onClick={() => setMatchOnly(!matchOnly)}
                style={{
                  padding: "4px 9px", fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                  background: matchOnly ? "#D08008" : "#fff",
                  color: matchOnly ? "#fff" : "#666",
                  border: `1.5px solid ${matchOnly ? "#D08008" : "#ddd"}`,
                }}>{matchOnly ? "✓ Solo compatibili" : "Tutti"}</div>
            )}
            <div onClick={() => setFiltroTipo(null)}
              style={{
                padding: "4px 9px", fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                background: !filtroTipo ? "#1A9E73" : "#fff",
                color: !filtroTipo ? "#fff" : "#666",
                border: `1.5px solid ${!filtroTipo ? "#1A9E73" : "#ddd"}`,
              }}>Tutti</div>
            {tipiPresenti.map(t => (
              <div key={t} onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
                style={{
                  padding: "4px 9px", fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                  background: filtroTipo === t ? "#1A9E73" : "#fff",
                  color: filtroTipo === t ? "#fff" : "#666",
                  border: `1.5px solid ${filtroTipo === t ? "#1A9E73" : "#ddd"}`,
                }}>{TIPI_LABEL[t] || t}</div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>Caricamento nodi...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>
              Nessun nodo corrisponde ai filtri.
              <div style={{ marginTop: 6, fontSize: 9 }}>Aggiungi nodi in catalogo_nodi_costruttivi o disattiva "Solo compatibili".</div>
            </div>
          ) : (
            filtered.map(n => (
              <div key={n.id} onClick={() => onSelect(n)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderBottom: "1px solid #f5f5f5", cursor: "pointer",
                  background: currentNodoId === n.id ? "#1A9E7310" : "transparent",
                }}>
                <div style={{ width: 50, height: 50, flexShrink: 0, border: "1px solid #eee", borderRadius: 6, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {n.immagine_url ? (
                    <img src={n.immagine_url} alt={n.nome} style={{ maxWidth: 46, maxHeight: 46 }} />
                  ) : (
                    <div style={{ fontSize: 18 }}>🔗</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nome}</div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.descrizione || "—"}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {n.tipo && <span style={{ background: "#1A9E7315", color: "#1A9E73", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{TIPI_LABEL[n.tipo] || n.tipo}</span>}
                    {n.profili_coinvolti && n.profili_coinvolti.length > 0 && (
                      <span style={{ background: "#3B7FE015", color: "#3B7FE0", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                        {n.profili_coinvolti.join(" + ")}
                      </span>
                    )}
                    {n.sistema?.nome && <span style={{ color: "#aaa" }}>· {n.sistema.nome}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
                  {n.pdf_url && <div onClick={(e) => { e.stopPropagation(); window.open(n.pdf_url!, "_blank"); }}
                    style={{ fontSize: 9, padding: "3px 6px", borderRadius: 4, background: "#DC444415", color: "#DC4444", cursor: "pointer", fontWeight: 700 }}>PDF</div>}
                  {n.dxf_url && <div onClick={(e) => { e.stopPropagation(); window.open(n.dxf_url!, "_blank"); }}
                    style={{ fontSize: 9, padding: "3px 6px", borderRadius: 4, background: "#3B7FE015", color: "#3B7FE0", cursor: "pointer", fontWeight: 700 }}>DXF</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
