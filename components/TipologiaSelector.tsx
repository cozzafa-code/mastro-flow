"use client";
import React from "react";

type Tipologia = {
  id: number;
  nome: string;
  categoria: string;
  n_ante: number | null;
  note: string | null;
  disegno: any;
  dimensioni_default: string | null;
};

type Props = {
  value?: number | null;                      // id tipologia selezionata
  vanoSistema?: string;                       // per filtri intelligenti futuri
  onSelect: (tipologia: Tipologia) => void;  // chiamata quando l'utente sceglie
  placeholder?: string;
};

const CATEGORIE = ["Finestre", "Balconi", "Scorrevoli", "Porte", "Altro"];

export default function TipologiaSelector({ value, onSelect, placeholder = "— Seleziona tipologia —" }: Props) {
  const [open, setOpen] = React.useState(false);
  const [categoria, setCategoria] = React.useState<string>("Finestre");
  const [tipologie, setTipologie] = React.useState<Tipologia[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Carica tipologie quando si apre o cambia categoria
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/tipologie-infisso?categoria=${encodeURIComponent(categoria)}`)
      .then(r => r.json())
      .then(data => {
        setTipologie(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setTipologie([]); setLoading(false); });
  }, [open, categoria]);

  const selected = tipologie.find(t => t.id === value);
  const filtered = search
    ? tipologie.filter(t => t.nome.toLowerCase().includes(search.toLowerCase()))
    : tipologie;

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger dropdown */}
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderRadius: 8, border: "1.5px solid #ddd",
        background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
      }}>
        <span style={{ color: selected ? "#1A1A1C" : "#999" }}>
          {selected ? selected.nome : placeholder}
        </span>
        <span style={{ color: "#999", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* Pannello dropdown */}
      {open && (
        <>
          {/* Overlay click-out */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 101,
            background: "#fff", borderRadius: 10, border: "1.5px solid #1A9E73",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            maxHeight: 380, overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            {/* Tabs categoria */}
            <div style={{ display: "flex", gap: 1, padding: "8px 8px 4px", borderBottom: "1px solid #f0f0f0", overflowX: "auto" }}>
              {CATEGORIE.map(cat => (
                <div key={cat} onClick={() => setCategoria(cat)} style={{
                  padding: "5px 11px", fontSize: 10, fontWeight: 700, borderRadius: 5,
                  cursor: "pointer", whiteSpace: "nowrap",
                  background: categoria === cat ? "#1A9E73" : "transparent",
                  color: categoria === cat ? "#fff" : "#666",
                }}>{cat}</div>
              ))}
            </div>
            {/* Search */}
            <div style={{ padding: "6px 10px", borderBottom: "1px solid #f0f0f0" }}>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca tipologia..."
                style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #e5e5e5", borderRadius: 5 }} />
            </div>
            {/* Lista tipologie */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 11, color: "#999" }}>Caricamento...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 11, color: "#999" }}>
                  {search ? "Nessun risultato" : `Nessuna tipologia in "${categoria}"`}
                  <div style={{ marginTop: 6, fontSize: 9 }}>Disegna nel CAD e usa "💾 Salva tipologia"</div>
                </div>
              ) : (
                filtered.map(t => (
                  <div key={t.id} onClick={() => { onSelect(t); setOpen(false); }} style={{
                    padding: "8px 14px", cursor: "pointer", borderLeft: `3px solid ${value === t.id ? "#1A9E73" : "transparent"}`,
                    background: value === t.id ? "#1A9E7308" : "transparent",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = value === t.id ? "#1A9E7308" : "transparent"; }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C" }}>{t.nome}</div>
                    <div style={{ fontSize: 9, color: "#888", marginTop: 2, display: "flex", gap: 8 }}>
                      {t.n_ante && <span>{t.n_ante} ante</span>}
                      {t.dimensioni_default && <span>{t.dimensioni_default} mm</span>}
                      {t.note && <span style={{ color: "#aaa" }}>· {t.note.substring(0, 30)}{t.note.length > 30 ? "..." : ""}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
