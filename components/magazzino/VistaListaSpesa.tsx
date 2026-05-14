"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const PURPLE = "#5C2D8C";
const MUTED = "#5C6B7A";

interface ListaItem {
  id: string;
  articolo_id: string;
  articolo_nome: string;
  quantita_necessaria: number;
  quantita_disponibile: number;
  quantita_da_ordinare: number;
  urgenza: string;
  note: string | null;
  stato: string;
  prezzo_stimato: number | null;
  commessa_id: string | null;
  created_at: string;
  // Join articolo
  art_codice?: string;
  art_um?: string;
  art_fornitore_id?: string;
  art_fornitore_nome?: string;
}

interface Props {
  aziendaId: string;
  mag: any;
}

export default function VistaListaSpesa({ aziendaId, mag }: Props) {
  const [items, setItems] = useState<ListaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<any>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lista_spesa")
      .select(`*, articoli_magazzino!inner(codice, unita_misura, fornitore_id, fornitori(nome))`)
      .eq("azienda_id", aziendaId)
      .eq("stato", "da_ordinare")
      .order("urgenza", { ascending: false })
      .order("created_at", { ascending: false });
    
    const mapped = (data || []).map((d: any) => ({
      ...d,
      art_codice: d.articoli_magazzino?.codice,
      art_um: d.articoli_magazzino?.unita_misura,
      art_fornitore_id: d.articoli_magazzino?.fornitore_id,
      art_fornitore_nome: d.articoli_magazzino?.fornitori?.nome,
    }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [aziendaId]);

  const toggle = (id: string) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };
  
  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const generaOrdini = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    const ids = Array.from(selected);
    const { data, error } = await supabase.rpc("genera_ordini_da_lista_spesa", { p_ids: ids });
    setGenerating(false);
    if (error) { alert("Errore: " + error.message); return; }
    if (data?.ok) {
      setResult(data);
      setSelected(new Set());
      reload();
    }
  };

  const rimuoviRiga = async (id: string) => {
    await supabase.from("lista_spesa").delete().eq("id", id);
    reload();
  };

  // Raggruppa per fornitore
  const byFornitore = items.reduce((acc, i) => {
    const k = i.art_fornitore_id || "NO_FORNITORE";
    const name = i.art_fornitore_nome || "Senza fornitore";
    if (!acc[k]) acc[k] = { nome: name, items: [], totale: 0, qta: 0 };
    acc[k].items.push(i);
    acc[k].totale += i.quantita_da_ordinare * (i.prezzo_stimato || 0);
    acc[k].qta += i.quantita_da_ordinare;
    return acc;
  }, {} as Record<string, any>);

  const totGen = Object.values(byFornitore).reduce((s: number, g: any) => s + g.totale, 0);

  if (loading) return <Loader />;

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
        borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>Lista spesa</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>€ {totGen.toFixed(0)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          {items.length} articoli da ordinare · {Object.keys(byFornitore).length} fornitori
        </div>
      </div>

      {result && result.ok && (
        <div style={{
          background: GREEN, color: "#fff", padding: "11px 13px", borderRadius: 10,
          marginBottom: 9, fontSize: 12, fontWeight: 700,
        }}>
          ✓ Creati {result.n_ordini} ordini fornitore (vai in Ordini per inviare PEC)
          <button onClick={() => setResult(null)} style={{
            float: "right", background: "transparent", color: "#fff", border: "none",
            cursor: "pointer", fontSize: 16, fontWeight: 800,
          }}>×</button>
        </div>
      )}

      {/* Bottoni action */}
      <div style={{ display: "flex", gap: 5, marginBottom: 9 }}>
        <button onClick={() => setShowAdd(true)} style={{
          flex: 1, padding: 11,
          background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)`,
          color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.4, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>+ AGGIUNGI ARTICOLO</button>
        {selected.size > 0 && (
          <button onClick={generaOrdini} disabled={generating} style={{
            flex: 1, padding: 11,
            background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
            color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800,
            letterSpacing: 0.4, textTransform: "uppercase", border: "none", cursor: "pointer",
          }}>{generating ? "..." : `GENERA ${selected.size} → ORDINI`}</button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 13, padding: 30,
          textAlign: "center", color: MUTED, fontSize: 12,
        }}>
          Lista vuota. Aggiungi articoli durante la giornata.
        </div>
      ) : (
        <>
          {/* Toggle all */}
          <div style={{ marginBottom: 7, padding: "0 10px" }}>
            <button onClick={toggleAll} style={{
              background: "transparent", color: NAVY, border: "none",
              fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0,
            }}>{selected.size === items.length ? "Deseleziona tutto" : "Seleziona tutto"}</button>
          </div>

          {/* Per fornitore */}
          {Object.entries(byFornitore).map(([k, g]: any) => (
            <div key={k} style={{
              background: "#fff", borderRadius: 13, padding: "10px 11px",
              marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              borderLeft: `3px solid ${k === "NO_FORNITORE" ? AMBER : TEAL}`,
            }}>
              <div style={{
                display: "flex", alignItems: "center", marginBottom: 7,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, letterSpacing: 0.3 }}>
                    {g.nome}
                  </div>
                  <div style={{ fontSize: 9.5, color: MUTED, fontWeight: 600 }}>
                    {g.items.length} articoli · {g.qta} unità · € {g.totale.toFixed(0)}
                  </div>
                </div>
                {k === "NO_FORNITORE" && (
                  <span style={{
                    background: "#FBF0DC", color: "#8B6926",
                    padding: "2px 7px", borderRadius: 5,
                    fontSize: 8.5, fontWeight: 800, letterSpacing: 0.3,
                  }}>ASSEGNA FORN.</span>
                )}
              </div>
              {g.items.map((i: ListaItem) => (
                <RigaListaSpesa
                  key={i.id} item={i}
                  selected={selected.has(i.id)}
                  onToggle={() => toggle(i.id)}
                  onRemove={() => rimuoviRiga(i.id)}
                />
              ))}
            </div>
          ))}
        </>
      )}

      {showAdd && (
        <ModalAggiungiArticolo
          aziendaId={aziendaId} mag={mag}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); reload(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// RIGA
// ============================================================

function RigaListaSpesa({ item, selected, onToggle, onRemove }: any) {
  const urgColor = item.urgenza === "urgente" ? RED : item.urgenza === "alta" ? AMBER : MUTED;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 0", borderBottom: "1px solid #F1F4F7",
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle} style={{
        width: 17, height: 17, accentColor: TEAL, cursor: "pointer", flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>
          {item.art_codice || "—"}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.articolo_nome}
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 2, alignItems: "center" }}>
          {item.urgenza !== "normale" && (
            <span style={{
              background: `${urgColor}25`, color: urgColor,
              padding: "1px 5px", borderRadius: 4,
              fontSize: 8, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase",
            }}>{item.urgenza}</span>
          )}
          {item.note && <span style={{ fontSize: 9.5, color: MUTED, fontStyle: "italic" }}>{item.note}</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{item.quantita_da_ordinare}</div>
        <div style={{ fontSize: 9, color: MUTED }}>{item.art_um || "pz"}</div>
        {item.prezzo_stimato && (
          <div style={{ fontSize: 9, color: TEAL, fontWeight: 700, marginTop: 1 }}>€ {(item.prezzo_stimato * item.quantita_da_ordinare).toFixed(0)}</div>
        )}
      </div>
      <button onClick={onRemove} style={{
        width: 24, height: 24, background: "transparent", color: RED,
        border: "none", cursor: "pointer", borderRadius: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ============================================================
// MODAL AGGIUNGI ARTICOLO
// ============================================================

function ModalAggiungiArticolo({ aziendaId, mag, onClose, onAdded }: any) {
  const [search, setSearch] = useState("");
  const [selected, setSelectedArt] = useState<any | null>(null);
  const [qta, setQta] = useState(1);
  const [urgenza, setUrgenza] = useState("normale");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const articoli = mag.articoli || [];
  const filtered = !search ? articoli.slice(0, 15) : 
    articoli.filter((a: any) => 
      a.nome?.toLowerCase().includes(search.toLowerCase()) ||
      a.codice?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 15);

  const conferma = async () => {
    if (!selected) return;
    setLoading(true);
    const { error } = await supabase.rpc("lista_spesa_aggiungi", {
      p_articolo_id: selected.id,
      p_quantita: qta,
      p_note: note || null,
      p_urgenza: urgenza,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    onAdded();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
          padding: "14px 16px",
        }}>
          <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>AGGIUNGI A LISTA SPESA</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>Seleziona articolo</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {!selected ? (
            <>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca codice o nome..."
                autoFocus
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid #D8DEE5", borderRadius: 8,
                  fontSize: 13, color: NAVY, fontWeight: 600,
                  outline: "none", background: "#fff", marginBottom: 9,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ background: "#fff", borderRadius: 9, padding: 6 }}>
                {filtered.map((a: any) => (
                  <div key={a.id} onClick={() => setSelectedArt(a)} style={{
                    padding: "8px 9px", cursor: "pointer", borderRadius: 6,
                    borderBottom: "1px solid #F1F4F7",
                  }}>
                    <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{a.codice}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{a.nome}</div>
                    <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
                      Scorta: <b>{a.scorta_attuale}</b> {a.unita_misura}
                      {a.fornitore_nome && ` · ${a.fornitore_nome}`}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11 }}>
                    Nessun articolo trovato
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{
                background: "#fff", borderRadius: 10, padding: 11, marginBottom: 11,
                borderLeft: `3px solid ${TEAL}`,
              }}>
                <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{selected.codice}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{selected.nome}</div>
                <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
                  Scorta attuale: <b>{selected.scorta_attuale}</b> {selected.unita_misura}
                </div>
              </div>
              <div style={{ marginBottom: 11 }}>
                <Lbl>Quantità da ordinare</Lbl>
                <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", borderRadius: 9, padding: 5 }}>
                  <button onClick={() => setQta(Math.max(1, qta - 1))} style={stpBtn}>−</button>
                  <input type="number" value={qta} onChange={(e) => setQta(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: NAVY, border: "none", outline: "none", background: "transparent", padding: "8px 0" }} />
                  <button onClick={() => setQta(qta + 1)} style={stpBtn}>+</button>
                </div>
              </div>
              <div style={{ marginBottom: 11 }}>
                <Lbl>Urgenza</Lbl>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
                  {(["bassa","normale","alta","urgente"] as const).map(u => (
                    <button key={u} onClick={() => setUrgenza(u)} style={{
                      padding: "8px 4px",
                      background: urgenza === u ? (u === "urgente" ? RED : u === "alta" ? AMBER : TEAL) : "#fff",
                      color: urgenza === u ? "#fff" : MUTED,
                      borderRadius: 7, fontSize: 9.5, fontWeight: 800,
                      letterSpacing: 0.3, textTransform: "uppercase",
                      border: `1px solid ${urgenza === u ? "transparent" : "#D8DEE5"}`,
                      cursor: "pointer",
                    }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 11 }}>
                <Lbl>Note</Lbl>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="es. Per commessa Rossi"
                  style={{
                    width: "100%", padding: "10px 12px",
                    border: "1px solid #D8DEE5", borderRadius: 8,
                    fontSize: 12, color: NAVY, fontWeight: 600,
                    outline: "none", background: "#fff", boxSizing: "border-box",
                  }} />
              </div>
              <button onClick={() => setSelectedArt(null)} style={{
                width: "100%", padding: 9, marginTop: 5,
                background: "transparent", color: MUTED, border: "1px solid #D8DEE5",
                borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>← Cambia articolo</button>
            </>
          )}
        </div>
        {selected && (
          <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>
            <button onClick={conferma} disabled={loading} style={{
              width: "100%", padding: 13,
              background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)`,
              color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
              letterSpacing: 0.5, textTransform: "uppercase", border: "none", cursor: "pointer",
            }}>{loading ? "..." : "+ AGGIUNGI A LISTA"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Lbl({ children }: any) {
  return <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{children}</div>;
}

function Loader() {
  return <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>Caricamento...</div>;
}

const stpBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 7,
  background: NAVY, color: "#fff",
  fontSize: 18, fontWeight: 800,
  border: "none", cursor: "pointer", flexShrink: 0,
};
