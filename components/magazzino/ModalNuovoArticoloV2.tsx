"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

// Sistemi serramento comuni in Italia
const SISTEMI_DEFAULT = [
  "PVC 70 mm", "PVC 76 mm", "PVC 82 mm",
  "Alluminio taglio termico", "Alluminio standard",
  "Legno", "Legno-Alluminio", "Acciaio",
  "Persiane", "Tapparelle", "Zanzariere", "Cassonetti",
];

const CATEGORIE_OP = [
  "Ferramenta", "Profili", "Vetri", "Guarnizioni",
  "Sigillanti", "Accessori", "Tapparelle", "Persiane",
  "Zanzariere", "Cassonetti", "Componenti elettrici", "Altro",
];

interface Props {
  mag: any;
  aziendaId: string;
  onClose: () => void;
}

export default function ModalNuovoArticoloV2({ mag, aziendaId, onClose }: Props) {
  // Campi base
  const [codice, setCodice] = useState("");
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoriaOp, setCategoriaOp] = useState("");
  const [unita, setUnita] = useState("pz");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [sistema, setSistema] = useState<string[]>([]);

  // Prezzi e scorte
  const [prezzoAcq, setPrezzoAcq] = useState("");
  const [prezzoVen, setPrezzoVen] = useState("");
  const [scortaMin, setScortaMin] = useState("0");
  const [scortaIniz, setScortaIniz] = useState("0");

  // Posizione e identificativi
  const [scaffale, setScaffale] = useState("");
  const [ean, setEan] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [note, setNote] = useState("");

  // Fornitore
  const [fornitori, setFornitori] = useState<Array<{ id: string; nome: string }>>([]);
  const [fornitoreId, setFornitoreId] = useState("");
  const [nuovoFornitore, setNuovoFornitore] = useState("");
  const [aggFornitore, setAggFornitore] = useState(false);

  // Autocomplete
  const [suggerimenti, setSuggerimenti] = useState<any[]>([]);
  const [mostraSugg, setMostraSugg] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);

  // Stato
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [duplicato, setDuplicato] = useState<any | null>(null);

  // Carica fornitori
  useEffect(() => {
    supabase.from("fornitori").select("id, nome").eq("azienda_id", aziendaId).order("nome")
      .then(({ data }) => setFornitori((data || []) as any));
  }, [aziendaId]);

  // Autocomplete nome (cerca articoli esistenti dopo 2 caratteri)
  useEffect(() => {
    if (nome.trim().length < 2) {
      setSuggerimenti([]);
      setMostraSugg(false);
      return;
    }
    const timer = setTimeout(async () => {
      const q = nome.toLowerCase().trim();
      const { data } = await supabase
        .from("articoli_magazzino")
        .select("id, codice, nome, marca, modello, prezzo_acquisto, fornitore_id, unita_misura, foto_url")
        .eq("azienda_id", aziendaId)
        .or(`nome.ilike.%${q}%,codice.ilike.%${q}%`)
        .limit(5);
      setSuggerimenti(data || []);
      setMostraSugg((data?.length || 0) > 0);
    }, 250);
    return () => clearTimeout(timer);
  }, [nome, aziendaId]);

  // Verifica duplicato codice
  useEffect(() => {
    if (!codice.trim()) { setDuplicato(null); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("articoli_magazzino")
        .select("id, nome, scorta_attuale, unita_misura")
        .eq("azienda_id", aziendaId)
        .eq("codice", codice.trim().toUpperCase())
        .maybeSingle();
      setDuplicato(data);
    }, 400);
    return () => clearTimeout(timer);
  }, [codice, aziendaId]);

  // Foto preview
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto(f);
    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(String(ev.target?.result || ""));
    reader.readAsDataURL(f);
  };

  // Upload foto su Supabase Storage
  const uploadFoto = async (articoloId: string): Promise<string | null> => {
    if (!foto) return null;
    const ext = foto.name.split(".").pop() || "jpg";
    const path = `${aziendaId}/${articoloId}.${ext}`;
    const { error } = await supabase.storage.from("articoli").upload(path, foto, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("articoli").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const usaSuggerimento = (s: any) => {
    setNome(s.nome || "");
    setCodice(s.codice || "");
    setMarca(s.marca || "");
    setModello(s.modello || "");
    if (s.prezzo_acquisto) setPrezzoAcq(String(s.prezzo_acquisto));
    if (s.fornitore_id) setFornitoreId(s.fornitore_id);
    if (s.unita_misura) setUnita(s.unita_misura);
    setMostraSugg(false);
    setErr(`Articolo simile trovato: ${s.codice}. Modifica i campi se diverso.`);
  };

  const toggleSistema = (s: string) => {
    if (sistema.includes(s)) setSistema(sistema.filter(x => x !== s));
    else setSistema([...sistema, s]);
  };

  const aggiungiFornitoreNuovo = async () => {
    if (!nuovoFornitore.trim()) return;
    const { data, error } = await supabase.from("fornitori").insert({
      azienda_id: aziendaId, nome: nuovoFornitore.trim(),
    }).select("id, nome").single();
    if (error) { setErr(error.message); return; }
    if (data) {
      setFornitori([...fornitori, data]);
      setFornitoreId(data.id);
      setNuovoFornitore("");
      setAggFornitore(false);
    }
  };

  const conferma = async () => {
    if (!codice.trim() || !nome.trim()) {
      setErr("Codice e nome obbligatori"); return;
    }
    if (duplicato) {
      setErr(`Codice già esistente: ${duplicato.nome}`); return;
    }
    setLoading(true); setErr(null);

    // 1. Insert articolo
    const { data: art, error } = await supabase.from("articoli_magazzino").insert({
      azienda_id: aziendaId,
      codice: codice.trim().toUpperCase(),
      nome: nome.trim(),
      descrizione: descrizione.trim() || null,
      tipo: tipo || null,
      categoria_operativa: categoriaOp || null,
      unita_misura: unita,
      marca: marca.trim() || null,
      modello: modello.trim() || null,
      compatibilita_sistemi: sistema.length > 0 ? sistema : null,
      prezzo_acquisto: prezzoAcq ? parseFloat(prezzoAcq) : null,
      prezzo_vendita: prezzoVen ? parseFloat(prezzoVen) : null,
      scorta_minima: parseFloat(scortaMin) || 0,
      scorta_attuale: parseFloat(scortaIniz) || 0,
      posizione_magazzino: scaffale.trim() || null,
      fornitore_id: fornitoreId || null,
      ean: ean.trim() || null,
      note: note.trim() || null,
      attivo: true,
    }).select("id").single();

    if (error || !art) {
      setLoading(false);
      setErr(error?.message || "Errore creazione articolo"); return;
    }

    // 2. Upload foto (se presente) + update articolo
    if (foto) {
      const fotoUrl = await uploadFoto(art.id);
      if (fotoUrl) {
        await supabase.from("articoli_magazzino").update({ foto_url: fotoUrl }).eq("id", art.id);
      }
    }

    setLoading(false);
    setOk(`Articolo ${codice} creato`);
    await mag.reload();
    setTimeout(onClose, 1200);
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
        {/* Header */}
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
          color: "#fff", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>
              NUOVO ARTICOLO
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>Aggiungi a magazzino</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {err && <Banner kind="warn">{err}</Banner>}
          {ok && <Banner kind="ok">{ok}</Banner>}

          {/* Foto upload */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <label style={{
              width: 80, height: 80, borderRadius: 10,
              background: fotoPreview ? "transparent" : "#fff",
              border: `2px dashed ${TEAL}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", flexShrink: 0,
              position: "relative",
            }}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: TEAL }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <div style={{ fontSize: 8, fontWeight: 800, marginTop: 2 }}>FOTO</div>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: "none" }} />
            </label>
            <div style={{ flex: 1 }}>
              <Field label="Codice articolo" required>
                <input
                  value={codice}
                  onChange={(e) => setCodice(e.target.value.toUpperCase())}
                  placeholder="es. FER-CER-MAICO-RC2"
                  style={duplicato ? { ...inputStyle, borderColor: RED, background: "#FCE3E3" } : inputStyle}
                />
                {duplicato && (
                  <div style={{ fontSize: 10, color: RED, marginTop: 3, fontWeight: 700 }}>
                    Esistente: {duplicato.nome} · {duplicato.scorta_attuale} {duplicato.unita_misura}
                  </div>
                )}
              </Field>
            </div>
          </div>

          {/* Nome con autocomplete */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Field label="Nome / descrizione" required>
              <input
                ref={nomeRef}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onFocus={() => suggerimenti.length > 0 && setMostraSugg(true)}
                onBlur={() => setTimeout(() => setMostraSugg(false), 200)}
                placeholder="Inizia a scrivere (es. Maniglia, Cerniera)..."
                style={inputStyle}
              />
            </Field>
            {mostraSugg && suggerimenti.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "#fff", borderRadius: 9, marginTop: 3,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                zIndex: 10, maxHeight: 220, overflowY: "auto",
                border: `1px solid ${TEAL}`,
              }}>
                <div style={{
                  padding: "6px 10px", fontSize: 9, fontWeight: 800,
                  color: TEAL, letterSpacing: 0.5, textTransform: "uppercase",
                  borderBottom: "1px solid #E5EAF0", background: "#F7F9FB",
                }}>
                  {suggerimenti.length} articoli simili già in magazzino
                </div>
                {suggerimenti.map(s => (
                  <div key={s.id} onMouseDown={() => usaSuggerimento(s)} style={{
                    padding: "9px 11px", cursor: "pointer", display: "flex", gap: 8,
                    borderBottom: "1px solid #F1F4F7",
                  }}>
                    {s.foto_url ? (
                      <img src={s.foto_url} alt="" style={{ width: 30, height: 30, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 30, height: 30, background: "#F1F4F7", borderRadius: 5, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{s.codice}</div>
                      <div style={{ fontSize: 11.5, color: NAVY, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nome}</div>
                      {s.marca && <div style={{ fontSize: 9, color: MUTED }}>{s.marca}{s.modello ? ` · ${s.modello}` : ""}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Marca + Modello */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <Field label="Marca">
              <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="es. Maico" style={inputStyle} />
            </Field>
            <Field label="Modello">
              <input value={modello} onChange={(e) => setModello(e.target.value)} placeholder="es. RC2" style={inputStyle} />
            </Field>
          </div>

          {/* Categoria + UM */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 10 }}>
            <Field label="Categoria">
              <select value={categoriaOp} onChange={(e) => setCategoriaOp(e.target.value)} style={inputStyle}>
                <option value="">-- Scegli --</option>
                {CATEGORIE_OP.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="UM">
              <select value={unita} onChange={(e) => setUnita(e.target.value)} style={inputStyle}>
                <option>pz</option><option>ml</option><option>mq</option>
                <option>kg</option><option>cad</option><option>conf</option><option>l</option>
              </select>
            </Field>
          </div>

          {/* Sistemi serramento compatibili (multi-select) */}
          <Field label="Compatibile con sistemi (opzionale)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {SISTEMI_DEFAULT.map(s => (
                <button key={s} type="button" onClick={() => toggleSistema(s)} style={{
                  padding: "5px 9px",
                  background: sistema.includes(s) ? TEAL : "#fff",
                  color: sistema.includes(s) ? "#fff" : MUTED,
                  border: `1px solid ${sistema.includes(s) ? "#1a6b6b" : "#D8DEE5"}`,
                  borderRadius: 99, fontSize: 10, fontWeight: 700,
                  cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </Field>

          {/* Prezzi */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <Field label="Prezzo acquisto €">
              <input type="number" inputMode="decimal" value={prezzoAcq} onChange={(e) => setPrezzoAcq(e.target.value)} placeholder="0.00" style={inputStyle} />
            </Field>
            <Field label="Prezzo vendita €">
              <input type="number" inputMode="decimal" value={prezzoVen} onChange={(e) => setPrezzoVen(e.target.value)} placeholder="0.00" style={inputStyle} />
            </Field>
          </div>

          {/* Scorte */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <Field label="Scorta minima">
              <input type="number" value={scortaMin} onChange={(e) => setScortaMin(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Scorta iniziale">
              <input type="number" value={scortaIniz} onChange={(e) => setScortaIniz(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          {/* Posizione */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 8, marginBottom: 10 }}>
            <Field label="Scaffale">
              <input value={scaffale} onChange={(e) => setScaffale(e.target.value)} placeholder="es. A-01" style={inputStyle} />
            </Field>
            <Field label="EAN / barcode">
              <input value={ean} onChange={(e) => setEan(e.target.value)} placeholder="codice barre" style={inputStyle} />
            </Field>
          </div>

          {/* Fornitore + nuovo */}
          <Field label="Fornitore">
            {!aggFornitore ? (
              <div style={{ display: "flex", gap: 5 }}>
                <select value={fornitoreId} onChange={(e) => setFornitoreId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                  <option value="">-- Scegli --</option>
                  {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <button onClick={() => setAggFornitore(true)} style={{
                  padding: "8px 12px", background: GREEN, color: "#fff",
                  border: "none", borderRadius: 7, fontSize: 11, fontWeight: 800,
                  cursor: "pointer",
                }}>+</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 5 }}>
                <input value={nuovoFornitore} onChange={(e) => setNuovoFornitore(e.target.value)}
                  placeholder="Nome nuovo fornitore" style={{ ...inputStyle, flex: 1 }} autoFocus />
                <button onClick={aggiungiFornitoreNuovo} style={{
                  padding: "8px 12px", background: GREEN, color: "#fff",
                  border: "none", borderRadius: 7, fontSize: 11, fontWeight: 800,
                  cursor: "pointer",
                }}>OK</button>
                <button onClick={() => { setAggFornitore(false); setNuovoFornitore(""); }} style={{
                  padding: "8px 12px", background: "#fff", color: MUTED,
                  border: "1px solid #D8DEE5", borderRadius: 7, fontSize: 11, fontWeight: 800,
                  cursor: "pointer",
                }}>X</button>
              </div>
            )}
          </Field>

          {/* Note */}
          <Field label="Note">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Note interne, schede tecniche, particolarità..."
              style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
        </div>

        {/* CTA */}
        <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>
          <button onClick={conferma} disabled={loading || !codice.trim() || !nome.trim() || !!duplicato} style={{
            width: "100%", padding: 14,
            background: (loading || !codice.trim() || !nome.trim() || !!duplicato) ? "#D8DEE5" : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
            color: "#fff", borderRadius: 11, fontSize: 13, fontWeight: 800,
            letterSpacing: 0.6, textTransform: "uppercase", border: "none",
            cursor: (loading || !codice.trim() || !nome.trim() || !!duplicato) ? "not-allowed" : "pointer",
          }}>
            {loading ? "Salvataggio..." : "CREA ARTICOLO"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Banner({ kind, children }: { kind: "ok" | "err" | "warn"; children: React.ReactNode }) {
  const cfg = kind === "err" ? { bg: "#FCE3E3", col: RED } :
    kind === "warn" ? { bg: "#FBF0DC", col: "#8B6926" } :
    { bg: "#D5EBE0", col: GREEN };
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
      background: cfg.bg, color: cfg.col, marginBottom: 10,
      fontWeight: 700, borderLeft: `3px solid ${cfg.col}`,
    }}>{children}</div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{
        fontSize: 9.5, fontWeight: 800, color: NAVY,
        letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5,
      }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #D8DEE5", borderRadius: 8,
  fontSize: 13, color: NAVY, fontWeight: 600,
  outline: "none", background: "#fff", fontFamily: "inherit",
  boxSizing: "border-box",
};
