"use client";
import React from "react";

type Vetro = {
  id: string;
  codice: string | null;
  nome: string;
  composizione: string | null;
  ug: number | null;
  spessore: number | null;
  peso_mq: number | null;
  trasmittanza_solare: number | null;
  abbattimento_acustico: number | null;
  sicurezza: string | null;
  prezzo_mq: number | null;
  descrizione: string | null;
  fornitore: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (vetro: Vetro) => void;
  currentVetroId?: string | null;
};

const FILTRI_RAPIDI = [
  { id: "doppio", label: "Doppio", check: (v: Vetro) => /\d+-\d+-\d+/.test(v.composizione || "") && (v.composizione || "").split("-").length === 3 },
  { id: "triplo", label: "Triplo", check: (v: Vetro) => /\d+-\d+-\d+-\d+-\d+/.test(v.composizione || "") },
  { id: "acustico", label: "Acustico (Rw≥40)", check: (v: Vetro) => (v.abbattimento_acustico || 0) >= 40 },
  { id: "termico", label: "Termico (Ug≤1.0)", check: (v: Vetro) => (v.ug || 99) <= 1.0 },
  { id: "sicurezza", label: "Sicurezza", check: (v: Vetro) => !!v.sicurezza && v.sicurezza !== "no" },
  { id: "selettivo", label: "Selettivo", check: (v: Vetro) => /selet/i.test(v.nome) || /selet/i.test(v.descrizione || "") },
  { id: "basso_emiss", label: "Basso emiss.", check: (v: Vetro) => /low.?e|basso.?emiss/i.test(v.nome) || /low.?e|basso.?emiss/i.test(v.descrizione || "") },
];

const FAV_KEY = "vetri_preferiti";

export default function SelettoreVetri({ open, onClose, onSelect, currentVetroId }: Props) {
  const [vetri, setVetri] = React.useState<Vetro[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(new Set());
  const [maxUg, setMaxUg] = React.useState(3.0);
  const [minRw, setMinRw] = React.useState(0);
  const [favoriti, setFavoriti] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/catalogo-vetri")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setVetri(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setVetri([]); setLoading(false); });
    try {
      const fav = localStorage.getItem(FAV_KEY);
      if (fav) setFavoriti(JSON.parse(fav));
    } catch {}
  }, [open]);

  const toggleFav = (id: string) => {
    const next = favoriti.includes(id) ? favoriti.filter(x => x !== id) : [...favoriti, id];
    setFavoriti(next);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch {}
  };

  if (!open) return null;

  // Filtri composti
  const filtered = vetri.filter(v => {
    if (search) {
      const s = search.toLowerCase();
      if (!(v.nome?.toLowerCase().includes(s) || v.codice?.toLowerCase().includes(s) || v.composizione?.toLowerCase().includes(s) || v.descrizione?.toLowerCase().includes(s))) return false;
    }
    for (const fid of activeFilters) {
      const f = FILTRI_RAPIDI.find(x => x.id === fid);
      if (f && !f.check(v)) return false;
    }
    if ((v.ug || 99) > maxUg) return false;
    if ((v.abbattimento_acustico || 0) < minRw) return false;
    return true;
  });

  // Split: preferiti + altri
  const preferiti = filtered.filter(v => favoriti.includes(v.id));
  const altri = filtered.filter(v => !favoriti.includes(v.id));

  const renderVetro = (v: Vetro) => (
    <div key={v.id} onClick={() => onSelect(v)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        borderBottom: "1px solid #f5f5f5", cursor: "pointer",
        background: currentVetroId === v.id ? "#1A9E7310" : "transparent",
      }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #eee" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1A9E73", lineHeight: 1 }}>{v.ug ? v.ug.toFixed(1) : "?"}</div>
        <div style={{ fontSize: 7, color: "#888", marginTop: 1 }}>W/m²K</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.nome}</div>
        <div style={{ fontSize: 9, color: "#666", marginTop: 2, fontFamily: "monospace" }}>{v.composizione || "—"} · {v.spessore ? `${v.spessore}mm` : ""}</div>
        <div style={{ fontSize: 9, color: "#888", marginTop: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {v.abbattimento_acustico ? <span style={{ background: "#3B7FE015", color: "#3B7FE0", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>Rw {v.abbattimento_acustico}dB</span> : null}
          {v.sicurezza && v.sicurezza !== "no" ? <span style={{ background: "#D0800815", color: "#D08008", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>{v.sicurezza}</span> : null}
          {v.fornitore ? <span style={{ color: "#aaa" }}>· {v.fornitore}</span> : null}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        {v.prezzo_mq && <div style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73" }}>€{v.prezzo_mq.toFixed(2)}/m²</div>}
        <div onClick={(e) => { e.stopPropagation(); toggleFav(v.id); }} style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, color: favoriti.includes(v.id) ? "#D08008" : "#ccc" }}>
          {favoriti.includes(v.id) ? "★" : "☆"}
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "min(96vw, 580px)", maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73" }}>🪟 Catalogo Vetri</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{vetri.length} vetri · {filtered.length} risultati</div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#666" }}>✕</div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cerca per nome / codice / composizione (es. 4-15-4)"
            style={{ width: "100%", padding: "9px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, marginBottom: 8, fontFamily: "inherit" }} />

          {/* Chip filtri rapidi */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {FILTRI_RAPIDI.map(f => (
              <div key={f.id} onClick={() => {
                const next = new Set(activeFilters);
                if (next.has(f.id)) next.delete(f.id); else next.add(f.id);
                setActiveFilters(next);
              }}
                style={{
                  padding: "4px 9px", fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                  background: activeFilters.has(f.id) ? "#1A9E73" : "#fff",
                  color: activeFilters.has(f.id) ? "#fff" : "#666",
                  border: `1.5px solid ${activeFilters.has(f.id) ? "#1A9E73" : "#ddd"}`,
                }}>{f.label}</div>
            ))}
          </div>

          {/* Slider Ug max */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
                <span>Ug max</span><span style={{ color: "#1A9E73", fontFamily: "monospace" }}>{maxUg.toFixed(1)} W/m²K</span>
              </div>
              <input type="range" min="0.5" max="3.0" step="0.1" value={maxUg} onChange={(e) => setMaxUg(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#1A9E73" }} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
                <span>Rw min</span><span style={{ color: "#3B7FE0", fontFamily: "monospace" }}>{minRw} dB</span>
              </div>
              <input type="range" min="0" max="50" step="1" value={minRw} onChange={(e) => setMinRw(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#3B7FE0" }} />
            </div>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>
              Nessun vetro corrisponde ai filtri.
              <div style={{ marginTop: 6, fontSize: 9 }}>Allenta i parametri o azzera la ricerca.</div>
            </div>
          ) : (
            <>
              {preferiti.length > 0 && (
                <>
                  <div style={{ padding: "6px 14px", fontSize: 9, fontWeight: 800, color: "#D08008", textTransform: "uppercase", letterSpacing: 0.5, background: "#FFF8E8" }}>★ Preferiti ({preferiti.length})</div>
                  {preferiti.map(renderVetro)}
                </>
              )}
              {altri.length > 0 && (
                <>
                  {preferiti.length > 0 && (
                    <div style={{ padding: "6px 14px", fontSize: 9, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, background: "#f8f8f8" }}>Tutti i vetri ({altri.length})</div>
                  )}
                  {altri.map(renderVetro)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
