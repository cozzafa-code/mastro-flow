"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

interface Riga {
  tempId: string;
  articolo_id?: string;
  codice: string;
  nome: string;
  unita_misura: string;
  quantita: number;
  prezzo_unitario: number;
  sconto: number;
}

interface Props {
  aziendaId: string;
  mag: any;
  onClose: () => void;
  commessaId?: string;
  preselectArticolo?: any;
}

export default function ModalOrdineMultiRiga({ aziendaId, mag, onClose, commessaId, preselectArticolo }: Props) {
  // Testata
  const [fornitoreId, setFornitoreId] = useState("");
  const [fornitori, setFornitori] = useState<any[]>([]);
  const [dataConsegna, setDataConsegna] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [note, setNote] = useState("");
  
  // Righe
  const [righe, setRighe] = useState<Riga[]>([]);
  const [showAddArt, setShowAddArt] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  
  // Stato
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("fornitori").select("id, nome").eq("azienda_id", aziendaId).order("nome")
      .then(({ data }) => setFornitori(data || []));
  }, [aziendaId]);

  // Preseleziona articolo se passato
  useEffect(() => {
    if (preselectArticolo) {
      addRigaDaArticolo(preselectArticolo, 1);
    }
  }, [preselectArticolo]);

  const addRigaDaArticolo = (a: any, qta = 1) => {
    const nuovaRiga: Riga = {
      tempId: `temp-${Date.now()}-${Math.random()}`,
      articolo_id: a.id,
      codice: a.codice,
      nome: a.nome,
      unita_misura: a.unita_misura || "pz",
      quantita: qta,
      prezzo_unitario: a.prezzo_acquisto || 0,
      sconto: 0,
    };
    setRighe(prev => [...prev, nuovaRiga]);
    // Auto-assegna fornitore se vuoto
    if (!fornitoreId && a.fornitore_id) setFornitoreId(a.fornitore_id);
  };

  const addRigaCustom = () => {
    setRighe(prev => [...prev, {
      tempId: `temp-${Date.now()}`,
      codice: "GEN-" + Date.now().toString().slice(-4),
      nome: "Nuovo articolo",
      unita_misura: "pz",
      quantita: 1,
      prezzo_unitario: 0,
      sconto: 0,
    }]);
  };

  const updateRiga = (tempId: string, field: keyof Riga, value: any) => {
    setRighe(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
  };

  const removeRiga = (tempId: string) => {
    setRighe(prev => prev.filter(r => r.tempId !== tempId));
  };

  // Totali
  const subtotale = righe.reduce((s, r) => s + r.quantita * r.prezzo_unitario * (1 - r.sconto / 100), 0);
  const iva = subtotale * 0.22;
  const totale = subtotale + iva;

  const conferma = async () => {
    if (!fornitoreId) { setErr("Scegli fornitore"); return; }
    if (righe.length === 0) { setErr("Aggiungi almeno una riga"); return; }
    setLoading(true); setErr(null);

    // 1. Crea testata
    const { data: ordine, error: e1 } = await supabase.from("ordini_fornitore").insert({
      azienda_id: aziendaId,
      fornitore_id: fornitoreId,
      data_ordine: new Date().toISOString().split("T")[0],
      consegna_prevista: dataConsegna,
      stato: "da_inviare",
      righe: [],
      totale_euro: totale,
      note: note || null,
      commessa_id: commessaId || null,
    }).select("id").single();

    if (e1 || !ordine) {
      setLoading(false);
      setErr(e1?.message || "Errore creazione ordine");
      return;
    }

    // 2. Inserisci tutte le righe
    const righeInsert = righe.map((r, idx) => ({
      azienda_id: aziendaId,
      ordine_id: ordine.id,
      articolo_id: r.articolo_id || null,
      codice_snapshot: r.codice,
      nome_snapshot: r.nome,
      unita_misura_snapshot: r.unita_misura,
      quantita_ordinata: r.quantita,
      prezzo_unitario: r.prezzo_unitario,
      sconto_percentuale: r.sconto,
      ordine_riga: idx + 1,
      commessa_id: commessaId || null,
    }));

    const { error: e2 } = await supabase.from("ordini_fornitore_righe").insert(righeInsert);
    if (e2) {
      setLoading(false);
      setErr("Righe: " + e2.message);
      return;
    }

    setLoading(false);
    setOk(`Ordine creato con ${righe.length} righe · € ${totale.toFixed(2)}`);
    setTimeout(onClose, 1500);
  };

  const articoli = mag.articoli || [];
  const filtered = !search ? articoli.slice(0, 30) :
    articoli.filter((a: any) =>
      a.nome?.toLowerCase().includes(search.toLowerCase()) ||
      a.codice?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 30);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 520, maxHeight: "95vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>
              NUOVO ORDINE FORNITORE
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {righe.length} {righe.length === 1 ? "riga" : "righe"} · € {totale.toFixed(0)}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {err && <Banner kind="err">{err}</Banner>}
          {ok && <Banner kind="ok">{ok}</Banner>}

          {/* TESTATA */}
          <Sez title="Testata">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
              <Field label="Fornitore" required>
                <select value={fornitoreId} onChange={(e) => setFornitoreId(e.target.value)} style={inputStyle}>
                  <option value="">-- Scegli --</option>
                  {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </Field>
              <Field label="Consegna">
                <input type="date" value={dataConsegna} onChange={(e) => setDataConsegna(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Note">
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="es. Spedire entro venerdì"
                style={inputStyle} />
            </Field>
          </Sez>

          {/* RIGHE */}
          <Sez title={`Righe ordine`} count={righe.length}>
            {/* Bottoni add */}
            <div style={{ display: "flex", gap: 5, marginBottom: 9 }}>
              <button onClick={() => setShowAddArt(true)} style={btnAdd}>
                + DA MAGAZZINO
              </button>
              <button onClick={addRigaCustom} style={btnAddSec}>
                + RIGA LIBERA
              </button>
              <button onClick={() => setShowImport(true)} style={btnAddSec}>
                ↑ IMPORT
              </button>
            </div>

            {righe.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11, background: "#fff", borderRadius: 7 }}>
                Aggiungi righe da magazzino, libere o importa CSV
              </div>
            ) : righe.map((r, idx) => (
              <RigaEditabile
                key={r.tempId} riga={r} idx={idx + 1}
                onUpdate={(field, val) => updateRiga(r.tempId, field, val)}
                onRemove={() => removeRiga(r.tempId)}
              />
            ))}
          </Sez>

          {/* TOTALI */}
          {righe.length > 0 && (
            <div style={{
              background: "#fff", borderRadius: 11, padding: "11px 13px",
              marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED, fontWeight: 600 }}>
                <span>Subtotale</span><span>€ {subtotale.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED, fontWeight: 600, marginTop: 3 }}>
                <span>IVA 22%</span><span>€ {iva.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: NAVY, fontWeight: 800, marginTop: 6, paddingTop: 6, borderTop: "1px solid #E5EAF0" }}>
                <span>TOTALE</span><span>€ {totale.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>
          <button onClick={conferma} disabled={loading || !fornitoreId || righe.length === 0} style={{
            width: "100%", padding: 14,
            background: (loading || !fornitoreId || righe.length === 0) ? "#D8DEE5" : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
            color: "#fff", borderRadius: 11, fontSize: 13, fontWeight: 800,
            letterSpacing: 0.6, textTransform: "uppercase", border: "none",
            cursor: (loading || !fornitoreId || righe.length === 0) ? "not-allowed" : "pointer",
          }}>
            {loading ? "Salvataggio..." : `CREA ORDINE · € ${totale.toFixed(0)}`}
          </button>
        </div>
      </div>

      {/* Sub-modal: Aggiungi da magazzino */}
      {showAddArt && (
        <SubModalScegliArt
          articoli={filtered} search={search} setSearch={setSearch}
          onPick={(a, qta) => { addRigaDaArticolo(a, qta); setShowAddArt(false); }}
          onClose={() => setShowAddArt(false)}
        />
      )}

      {/* Sub-modal: Import CSV */}
      {showImport && (
        <SubModalImport
          onImport={(righeImp) => { setRighe(prev => [...prev, ...righeImp]); setShowImport(false); }}
          onClose={() => setShowImport(false)}
          articoli={articoli}
        />
      )}
    </div>
  );
}

// ============================================================
// RIGA EDITABILE
// ============================================================

function RigaEditabile({ riga, idx, onUpdate, onRemove }: any) {
  const sub = riga.quantita * riga.prezzo_unitario * (1 - riga.sconto / 100);
  return (
    <div style={{
      background: "#fff", padding: "9px 10px", borderRadius: 8,
      marginBottom: 6, borderLeft: `2px solid ${TEAL}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: MUTED, fontWeight: 800, minWidth: 18 }}>{idx}.</span>
        <input value={riga.nome} onChange={(e) => onUpdate("nome", e.target.value)}
          style={{
            flex: 1, fontSize: 12, fontWeight: 700, color: NAVY,
            border: "none", outline: "none", background: "transparent",
            padding: "2px 0",
          }} />
        <button onClick={onRemove} style={{
          width: 22, height: 22, background: "transparent", color: RED,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <input value={riga.codice} onChange={(e) => onUpdate("codice", e.target.value)}
          style={{ ...miniInput, fontFamily: "SF Mono, monospace", fontSize: 9, color: MUTED, flex: 1 }} />
        <input type="number" value={riga.quantita} onChange={(e) => onUpdate("quantita", parseFloat(e.target.value) || 0)}
          style={{ ...miniInput, width: 50, textAlign: "right", fontWeight: 800, color: NAVY }} />
        <span style={{ fontSize: 9, color: MUTED, minWidth: 18 }}>{riga.unita_misura}</span>
        <span style={{ fontSize: 10, color: MUTED }}>×</span>
        <input type="number" step="0.01" value={riga.prezzo_unitario} onChange={(e) => onUpdate("prezzo_unitario", parseFloat(e.target.value) || 0)}
          style={{ ...miniInput, width: 60, textAlign: "right" }} />
        <span style={{ fontSize: 10, color: MUTED }}>€</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: TEAL, minWidth: 50, textAlign: "right" }}>
          € {sub.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// SUB-MODAL: scegli articolo
// ============================================================

function SubModalScegliArt({ articoli, search, setSearch, onPick, onClose }: any) {
  const [tempQta, setTempQta] = useState<Record<string, number>>({});
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2100,
      background: "rgba(15,31,51,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440,
        maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: 14, borderBottom: "1px solid #E5EAF0" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Scegli articolo</div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
            placeholder="Cerca codice o nome..."
            style={{
              width: "100%", padding: "10px 12px",
              border: "1px solid #D8DEE5", borderRadius: 8,
              fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {articoli.map((a: any) => (
            <div key={a.id} style={{
              display: "flex", gap: 8, alignItems: "center",
              padding: "8px 9px", borderRadius: 7,
              borderBottom: "1px solid #F1F4F7",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{a.codice}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
              </div>
              <input type="number" defaultValue={1} value={tempQta[a.id] || 1}
                onChange={(e) => setTempQta({ ...tempQta, [a.id]: parseFloat(e.target.value) || 1 })}
                style={{ width: 50, padding: "5px 7px", border: "1px solid #D8DEE5", borderRadius: 5, fontSize: 12, fontWeight: 700, textAlign: "center", outline: "none" }} />
              <button onClick={() => onPick(a, tempQta[a.id] || 1)} style={{
                padding: "6px 10px", background: TEAL, color: "#fff",
                border: "none", borderRadius: 6, fontSize: 10, fontWeight: 800,
                cursor: "pointer", letterSpacing: 0.3,
              }}>+ ADD</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-MODAL: Import CSV righe
// ============================================================

function SubModalImport({ onImport, onClose, articoli }: any) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const t = await f.text();
    setText(t);
    parse(t);
  };

  const parse = (t: string) => {
    const lines = t.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;
    const sep = lines[0].split(";").length > lines[0].split(",").length ? ";" : ",";
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
    const idxCod = headers.findIndex(h => h.includes("codice") || h === "code" || h === "sku");
    const idxNome = headers.findIndex(h => h.includes("nome") || h.includes("descr"));
    const idxQta = headers.findIndex(h => h.includes("qta") || h.includes("quant"));
    const idxPrz = headers.findIndex(h => h.includes("prezzo") || h.includes("costo"));
    
    const out = lines.slice(1).map(line => {
      const v = line.split(sep);
      const codice = (v[idxCod] || "").trim();
      const art = articoli.find((a: any) => a.codice === codice);
      return {
        tempId: `imp-${Date.now()}-${Math.random()}`,
        articolo_id: art?.id,
        codice: codice || "GEN",
        nome: (v[idxNome] || art?.nome || "").trim(),
        unita_misura: art?.unita_misura || "pz",
        quantita: parseFloat(v[idxQta]) || 1,
        prezzo_unitario: parseFloat((v[idxPrz] || "0").replace(",", ".")) || art?.prezzo_acquisto || 0,
        sconto: 0,
      };
    });
    setParsed(out);
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2100,
      background: "rgba(15,31,51,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440,
        maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: 14, borderBottom: "1px solid #E5EAF0" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>Import righe da CSV</div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3 }}>
            Formato: codice;nome;qta;prezzo (header prima riga)
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <button onClick={() => inputRef.current?.click()} style={{
            width: "100%", padding: 12,
            background: TEAL, color: "#fff", border: "none", borderRadius: 9,
            fontSize: 12, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase",
            cursor: "pointer", marginBottom: 11,
          }}>SCEGLI FILE CSV</button>
          <input ref={inputRef} type="file" accept=".csv,.txt"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          
          {parsed.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: GREEN, fontWeight: 800, marginBottom: 6 }}>
                ✓ {parsed.length} righe pronte all'import
              </div>
              <div style={{ background: "#F7F9FB", borderRadius: 8, padding: 8, maxHeight: 200, overflowY: "auto", fontSize: 10 }}>
                {parsed.slice(0, 10).map((r, i) => (
                  <div key={i} style={{ padding: "3px 0", color: NAVY, fontWeight: 600 }}>
                    {r.codice} · {r.nome} · {r.quantita} × €{r.prezzo_unitario}
                  </div>
                ))}
                {parsed.length > 10 && <div style={{ color: MUTED, fontStyle: "italic" }}>...e altre {parsed.length - 10}</div>}
              </div>
            </>
          )}
        </div>
        <div style={{ padding: 14, display: "flex", gap: 8, borderTop: "1px solid #E5EAF0" }}>
          <button onClick={onClose} style={{
            padding: "11px 14px", background: "#fff", color: MUTED,
            border: "1px solid #D8DEE5", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>Annulla</button>
          {parsed.length > 0 && (
            <button onClick={() => onImport(parsed)} style={{
              flex: 1, padding: 11, background: TEAL, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 800,
              letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer",
            }}>IMPORTA {parsed.length} RIGHE</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function Banner({ kind, children }: any) {
  const cfg = kind === "err" ? { bg: "#FCE3E3", col: RED } : { bg: "#D5EBE0", col: GREEN };
  return (
    <div style={{ padding: "9px 11px", borderRadius: 8, fontSize: 11.5, background: cfg.bg, color: cfg.col, marginBottom: 10, fontWeight: 700, borderLeft: `3px solid ${cfg.col}` }}>
      {children}
    </div>
  );
}

function Sez({ title, count, children }: any) {
  return (
    <div style={{
      background: "transparent", marginBottom: 11,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: NAVY,
        letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{title}</span>
        {count !== undefined && (
          <span style={{ background: TEAL, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 9, fontWeight: 800 }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: any) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: NAVY, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px",
  border: "1px solid #D8DEE5", borderRadius: 7,
  fontSize: 12, color: NAVY, fontWeight: 600,
  outline: "none", background: "#fff", boxSizing: "border-box", fontFamily: "inherit",
};

const miniInput: React.CSSProperties = {
  padding: "3px 5px", border: "1px solid #D8DEE5", borderRadius: 4,
  fontSize: 10.5, outline: "none", background: "#fff",
};

const btnAdd: React.CSSProperties = {
  flex: 1, padding: "9px 6px", background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
  color: "#fff", border: "none", borderRadius: 7, fontSize: 10, fontWeight: 800,
  letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer",
};

const btnAddSec: React.CSSProperties = {
  ...btnAdd, background: "#fff", color: NAVY, border: "1px solid #D8DEE5",
};
