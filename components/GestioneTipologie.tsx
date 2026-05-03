"use client";
import React from "react";

type Tipologia = {
  id: number;
  nome: string;
  codice: string | null;
  categoria: string | null;
  n_ante: number | null;
  note: string | null;
  disegno: any;
  thumbnail: string | null;
  dimensioni_default: string | null;
  attivo: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect?: (tipologia: Tipologia) => void; // opzionale: se passato, click su tipologia la carica
};

const CATEGORIE = ["Tutte", "Finestre", "Balconi", "Scorrevoli", "Porte", "Altro"];

export default function GestioneTipologie({ open, onClose, onSelect }: Props) {
  const [tipologie, setTipologie] = React.useState<Tipologia[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filtroCat, setFiltroCat] = React.useState("Tutte");
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Tipologia | null>(null);
  const [editForm, setEditForm] = React.useState<{ nome: string; categoria: string; n_ante: string; note: string }>({ nome: "", categoria: "Finestre", n_ante: "", note: "" });
  const [status, setStatus] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/tipologie-infisso")
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTipologie(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setTipologie([]); setLoading(false); });
  }, []);

  React.useEffect(() => { if (open) load(); }, [open, load]);

  if (!open) return null;

  const filtered = tipologie.filter(t => {
    if (filtroCat !== "Tutte" && t.categoria !== filtroCat) return false;
    if (search && !t.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Raggruppa per categoria
  const grouped: Record<string, Tipologia[]> = {};
  filtered.forEach(t => {
    const c = t.categoria || "Altro";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(t);
  });

  const handleSaveEdit = async () => {
    if (!editing || !editForm.nome.trim()) { setStatus("⚠ Nome obbligatorio"); return; }
    setStatus("Salvataggio...");
    try {
      const payload: any = {
        id: editing.id,
        nome: editForm.nome.trim(),
        categoria: editForm.categoria,
        n_ante: editForm.n_ante ? parseInt(editForm.n_ante) : null,
        note: editForm.note.trim() || null,
      };
      const res = await fetch("/api/tipologie-infisso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("OK Aggiornato");
      setTimeout(() => { setEditing(null); setStatus(""); load(); }, 800);
    } catch (err: any) {
      setStatus(`Errore: ${err.message}`);
    }
  };

  const handleDelete = async (t: Tipologia) => {
    if (!confirm(`Eliminare la tipologia "${t.nome}"?\n\nLa tipologia sarà nascosta ma non cancellata definitivamente dal DB.`)) return;
    try {
      const res = await fetch(`/api/tipologie-infisso?id=${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      load();
    } catch (err: any) {
      alert(`Errore eliminazione: ${err.message}`);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={() => !editing && onClose()}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "min(96vw, 560px)", maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A9E73" }}>📚 Libreria Tipologie</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{tipologie.length} tipologie · gestisci, modifica, elimina</div>
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#666" }}>✕</div>
        </div>

        {/* Filtri */}
        <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cerca tipologia..."
            style={{ width: "100%", padding: "8px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
            {CATEGORIE.map(cat => (
              <div key={cat} onClick={() => setFiltroCat(cat)} style={{
                padding: "5px 11px", fontSize: 10, fontWeight: 700, borderRadius: 5, cursor: "pointer", whiteSpace: "nowrap",
                background: filtroCat === cat ? "#1A9E73" : "#fff",
                color: filtroCat === cat ? "#fff" : "#666",
                border: `1.5px solid ${filtroCat === cat ? "#1A9E73" : "#ddd"}`,
              }}>{cat}</div>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: "#888" }}>Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: "#888" }}>
              {search ? "Nessun risultato" : `Nessuna tipologia in "${filtroCat}"`}
              <div style={{ marginTop: 8, fontSize: 10 }}>Disegna nel CAD e usa "💾 Salva tipologia"</div>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div style={{ padding: "6px 14px", fontSize: 9, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, background: "#f8f8f8" }}>{cat} ({items.length})</div>
                {items.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderBottom: "1px solid #f5f5f5", cursor: onSelect ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    {/* Thumbnail */}
                    <div style={{ width: 56, height: 56, flexShrink: 0, border: "1px solid #eee", borderRadius: 6, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                      onClick={() => onSelect && onSelect(t)}>
                      {t.thumbnail ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                          dangerouslySetInnerHTML={{ __html: t.thumbnail }} />
                      ) : (
                        <span style={{ fontSize: 9, color: "#bbb" }}>—</span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect && onSelect(t)}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.codice?.startsWith("STD-") && <span style={{ fontSize: 9, color: "#888", marginRight: 4 }}>STD</span>}
                        {t.nome}
                      </div>
                      <div style={{ fontSize: 9, color: "#888", marginTop: 2, display: "flex", gap: 8 }}>
                        {t.n_ante != null && <span>{t.n_ante} ante</span>}
                        {t.dimensioni_default && <span>{t.dimensioni_default}mm</span>}
                        {t.note && <span style={{ color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>· {t.note}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <div onClick={(e) => {
                          e.stopPropagation();
                          setEditing(t);
                          setEditForm({ nome: t.nome, categoria: t.categoria || "Finestre", n_ante: t.n_ante?.toString() || "", note: t.note || "" });
                        }}
                        style={{ width: 30, height: 30, borderRadius: 6, background: "#3B7FE015", border: "1px solid #3B7FE040", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }} title="Modifica">✏️</div>
                      <div onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                        style={{ width: 30, height: 30, borderRadius: 6, background: "#DC444415", border: "1px solid #DC444440", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }} title="Elimina">🗑</div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Modal EDIT (sopra la lista) */}
        {editing && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 18, width: "100%", maxWidth: 380 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3B7FE0", marginBottom: 12 }}>✏️ Modifica tipologia</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Nome *</div>
                <input type="text" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd", borderRadius: 6 }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Categoria</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {["Finestre", "Balconi", "Scorrevoli", "Porte", "Altro"].map(cat => (
                    <div key={cat} onClick={() => setEditForm({ ...editForm, categoria: cat })}
                      style={{
                        padding: "5px 11px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer",
                        background: editForm.categoria === cat ? "#1A9E73" : "#fff",
                        color: editForm.categoria === cat ? "#fff" : "#666",
                        border: `1.5px solid ${editForm.categoria === cat ? "#1A9E73" : "#ddd"}`,
                      }}>{cat}</div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>N° ante</div>
                <input type="number" value={editForm.n_ante} onChange={(e) => setEditForm({ ...editForm, n_ante: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd", borderRadius: 6, fontFamily: "monospace" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Note</div>
                <textarea value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 11, border: "1.5px solid #ddd", borderRadius: 6, minHeight: 50, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              {status && (
                <div style={{ padding: 7, marginBottom: 10, borderRadius: 6, fontSize: 10, fontWeight: 600,
                  background: status.startsWith("OK") ? "#1A9E7315" : status.startsWith("⚠") || status.startsWith("Errore") ? "#DC444415" : "#3B7FE015",
                  color: status.startsWith("OK") ? "#1A9E73" : status.startsWith("⚠") || status.startsWith("Errore") ? "#DC4444" : "#3B7FE0",
                }}>{status}</div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div onClick={() => { setEditing(null); setStatus(""); }} style={{ padding: 10, borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Annulla</div>
                <div onClick={handleSaveEdit} style={{ padding: 10, borderRadius: 8, background: "#3B7FE0", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff" }}>💾 Salva</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
