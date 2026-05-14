"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RigaOrdine, TipoOrdine } from "./ordini-types";
import { creaOrdineBozza, fetchFornitori, inviaOrdine } from "./ordini-helpers";

const C = {
  navy: "#1A2A47",
  navyDim: "#5A6478",
  navyFaint: "#8B95A8",
  white: "#FFFFFF",
  whiteOff: "#F5F7FA",
  border: "rgba(26, 42, 71, 0.10)",
  borderStrong: "rgba(26, 42, 71, 0.18)",
  amber: "#E8B05C",
  amberDark: "#8C5E1A",
  amberSoft: "#FBF0DC",
  green: "#1F5A3F",
  greenBright: "#2B7A52",
  greenSoft: "#D8EBDF",
  red: "#C44545",
};

interface Props {
  aziendaId: string;
  commessaIdSuggerita?: string | null;
  onClose: () => void;
  onCreated: (ordineId: string) => void;
}

interface Fornitore { id: string; nome: string; categoria?: string; is_preferito?: boolean; ordini_totali?: number; metodo_pagamento?: string; }
interface Commessa { id: string; code: string; cliente: string; cognome: string; indirizzo?: string; }

export default function NuovoOrdineWizard({ aziendaId, commessaIdSuggerita, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tipo, setTipo] = useState<TipoOrdine>(commessaIdSuggerita ? "commessa" : "commessa");
  const [fornitoreSel, setFornitoreSel] = useState<Fornitore | null>(null);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [queryForn, setQueryForn] = useState("");
  const [commessaSel, setCommessaSel] = useState<Commessa | null>(null);
  const [commessePick, setCommessePick] = useState<Commessa[]>([]);
  const [showCommessaPicker, setShowCommessaPicker] = useState(false);
  const [righe, setRighe] = useState<RigaOrdine[]>([]);
  const [consegnaData, setConsegnaData] = useState("");
  const [consegnaTipo, setConsegnaTipo] = useState<"magazzino" | "cantiere">("magazzino");
  const [consegnaIndirizzo, setConsegnaIndirizzo] = useState("");
  const [canale, setCanale] = useState<"email" | "whatsapp" | "pec">("email");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!aziendaId) return;
    fetchFornitori(aziendaId).then(setFornitori);
  }, [aziendaId]);

  useEffect(() => {
    if (!aziendaId) return;
    if (step === 2 && tipo === "commessa" && commessePick.length === 0) {
      supabase.from("commesse").select("id, code, cliente, cognome, indirizzo").eq("azienda_id", aziendaId).not("fase", "in", "(pagata,persa,annullata,chiusa)").order("created_at", { ascending: false }).limit(50).then(({ data }) => {
        setCommessePick((data || []) as Commessa[]);
        if (commessaIdSuggerita) {
          const m = (data || []).find((c: any) => c.id === commessaIdSuggerita);
          if (m) setCommessaSel(m as Commessa);
        }
      });
    }
  }, [step, tipo, aziendaId, commessaIdSuggerita, commessePick.length]);

  useEffect(() => {
    if (consegnaTipo === "cantiere" && commessaSel?.indirizzo) setConsegnaIndirizzo(commessaSel.indirizzo);
  }, [consegnaTipo, commessaSel]);

  const fornFiltrati = useMemo(() => {
    if (!queryForn.trim()) return fornitori;
    const q = queryForn.toLowerCase();
    return fornitori.filter(f => f.nome.toLowerCase().includes(q) || (f.categoria || "").toLowerCase().includes(q));
  }, [fornitori, queryForn]);

  const totaleOrdine = useMemo(() => righe.reduce((s, r) => s + (r.totale_riga || 0), 0), [righe]);

  function aggiungiRigaLibera() {
    const nuova: RigaOrdine = { id: "r" + Date.now(), codice: "", descrizione: "", qta_richiesta: 1, prezzo_unitario: 0, totale_riga: 0, unita: "pz" };
    setRighe([...righe, nuova]);
  }
  function updateRiga(id: string, patch: Partial<RigaOrdine>) {
    setRighe(righe.map(r => r.id === id ? { ...r, ...patch, totale_riga: (patch.qta_richiesta ?? r.qta_richiesta) * (patch.prezzo_unitario ?? r.prezzo_unitario) } : r));
  }
  function removeRiga(id: string) { setRighe(righe.filter(r => r.id !== id)); }

  async function handleSalva(invia: boolean) {
    if (busy || !fornitoreSel) return;
    if (righe.length === 0) { alert("Aggiungi almeno una riga"); return; }
    setBusy(true);
    const res = await creaOrdineBozza(aziendaId, {
      tipo,
      commessaId: tipo === "commessa" ? commessaSel?.id : null,
      fornitore: fornitoreSel.nome,
      fornitoreId: fornitoreSel.id,
      righe,
      consegnaPrevista: consegnaData || null,
      consegnaIndirizzo: consegnaIndirizzo || null,
      consegnaTipo,
      canaleInvio: canale,
      note: note || null,
    });
    if (!res.ok || !res.id) {
      setBusy(false);
      console.error("[Wizard] salvataggio fallito:", res.error);
      alert("Salvataggio ordine fallito.\n\nMotivo: " + (res.error || "errore sconosciuto") + "\n\nControlla console per dettagli.");
      return;
    }
    console.log("[Wizard] ordine creato:", res.id);
    if (invia) {
      const r2 = await inviaOrdine(res.id);
      if (!r2.ok) {
        setBusy(false);
        console.error("[Wizard] invio fallito:", r2.error);
        alert("Bozza salvata ma invio fallito: " + (r2.error || ""));
        return;
      }
      console.log("[Wizard] ordine inviato");
    }
    setBusy(false);
    onCreated(res.id);
  }

  const canNextStep1 = !!fornitoreSel;
  const canNextStep2 = righe.length > 0 && (tipo === "scorta" || !!commessaSel);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,42,71,0.55)", zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100vh", background: C.white, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, background: C.whiteOff, border: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.navy, zIndex: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <WizHead step={step} />

        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 100px 14px" }}>
          {step === 1 && (
            <Step1 tipo={tipo} setTipo={setTipo} fornitori={fornFiltrati} fornitoreSel={fornitoreSel} setFornitoreSel={setFornitoreSel} query={queryForn} setQuery={setQueryForn} />
          )}
          {step === 2 && (
            <Step2 tipo={tipo} commessaSel={commessaSel} commessePick={commessePick} showPicker={showCommessaPicker} setShowPicker={setShowCommessaPicker} setCommessaSel={setCommessaSel} righe={righe} updateRiga={updateRiga} removeRiga={removeRiga} aggiungiRigaLibera={aggiungiRigaLibera} totaleOrdine={totaleOrdine} />
          )}
          {step === 3 && (
            <Step3 consegnaData={consegnaData} setConsegnaData={setConsegnaData} consegnaTipo={consegnaTipo} setConsegnaTipo={setConsegnaTipo} consegnaIndirizzo={consegnaIndirizzo} setConsegnaIndirizzo={setConsegnaIndirizzo} canale={canale} setCanale={setCanale} note={note} setNote={setNote} totaleOrdine={totaleOrdine} fornitoreSel={fornitoreSel} />
          )}
        </div>

        <WizFoot step={step} setStep={setStep} canNext={step === 1 ? canNextStep1 : canNextStep2} busy={busy} onSalva={() => handleSalva(false)} onInvia={() => handleSalva(true)} />
      </div>
    </div>
  );
}

function WizHead({ step }: { step: 1 | 2 | 3 }) {
  const titles: Record<number, string> = { 1: "Tipo e fornitore", 2: "Aggiungi articoli", 3: "Consegna e invio" };
  return (
    <div style={{ padding: "14px 14px 10px 14px", background: "linear-gradient(180deg, " + C.amberSoft + " 0%, " + C.white + " 100%)", borderBottom: "1px solid " + C.border }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.amberDark, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Crea nuovo ordine</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, letterSpacing: -0.2 }}>Step {step} di 3</div>
      <div style={{ fontSize: 11, color: C.navyDim, fontWeight: 600, marginTop: 2 }}>{titles[step]}</div>
      <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, background: s < step ? C.greenBright : s === step ? C.amber : C.whiteOff, borderRadius: 2 }} />
        ))}
      </div>
    </div>
  );
}

function Step1({ tipo, setTipo, fornitori, fornitoreSel, setFornitoreSel, query, setQuery }: any) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 0 12px 0" }}>
        <div style={{ width: 26, height: 26, background: C.amber, color: C.navy, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>1</div>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 800, color: C.navy }}>Tipo ordine</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <TipoCard active={tipo === "commessa"} onClick={() => setTipo("commessa")} icon="folder" name="Per commessa" desc="Materiale specifico per un cantiere" />
        <TipoCard active={tipo === "scorta"} onClick={() => setTipo("scorta")} icon="box" name="Scorta magazzino" desc="Riassortimento senza commessa" />
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Fornitore</div>
      <div style={{ background: C.whiteOff, border: "1.5px solid " + C.borderStrong, borderRadius: 10, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navyFaint} strokeWidth={2.2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca fornitore..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, fontWeight: 700, color: C.navy, fontFamily: "inherit" }} />
      </div>
      {fornitori.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: C.navyFaint, fontSize: 12, fontWeight: 700 }}>Nessun fornitore trovato</div>
      ) : fornitori.map((f: Fornitore) => (
        <div key={f.id} onClick={() => setFornitoreSel(f)} style={{ display: "flex", alignItems: "center", gap: 10, background: fornitoreSel?.id === f.id ? C.amberSoft : C.white, border: "1.5px solid " + (fornitoreSel?.id === f.id ? C.amber : C.borderStrong), borderRadius: 11, padding: 11, marginBottom: 6, cursor: "pointer", borderLeft: f.is_preferito ? "3px solid " + C.amber : undefined }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#DCEAF5,#B5C2D0)", color: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, letterSpacing: 0.4, flex: "0 0 36px" }}>{f.nome.slice(0, 2).toUpperCase()}</div>
          <div style={{ flex: 1, lineHeight: 1.25, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nome}</div>
            <div style={{ fontSize: 9, color: C.navyDim, fontWeight: 700, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.3 }}>{f.categoria || "—"} · {f.ordini_totali || 0} ordini</div>
          </div>
          {f.is_preferito && <span style={{ background: C.amberSoft, color: C.amberDark, padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 800, letterSpacing: 0.3 }}>★ TOP</span>}
        </div>
      ))}
    </>
  );
}

function TipoCard({ active, onClick, icon, name, desc }: any) {
  return (
    <div onClick={onClick} style={{ background: active ? C.amberSoft : C.white, border: "2px solid " + (active ? C.amber : C.borderStrong), borderRadius: 11, padding: "14px 11px", cursor: "pointer", textAlign: "center" }}>
      <div style={{ width: 36, height: 36, background: active ? C.amber : C.whiteOff, color: active ? C.navy : C.navyDim, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px auto" }}>
        {icon === "folder" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><rect x="3" y="6" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 9, color: C.navyDim, fontWeight: 700, lineHeight: 1.3 }}>{desc}</div>
    </div>
  );
}

function Step2({ tipo, commessaSel, commessePick, showPicker, setShowPicker, setCommessaSel, righe, updateRiga, removeRiga, aggiungiRigaLibera, totaleOrdine }: any) {
  return (
    <>
      {tipo === "commessa" && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px 0" }}>Commessa destinazione</div>
          {!commessaSel ? (
            <button onClick={() => setShowPicker(true)} style={{ width: "100%", padding: "12px 14px", background: C.amberSoft, border: "1.5px dashed " + C.amber, borderRadius: 10, color: C.amberDark, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Scegli commessa
            </button>
          ) : (
            <div onClick={() => setShowPicker(true)} style={{ background: C.amberSoft, borderRadius: 9, padding: "9px 11px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, background: C.amber, color: C.navy, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
              </div>
              <div style={{ flex: 1, lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.amberDark }}>{commessaSel.code}</div>
                <div style={{ fontSize: 9, color: C.amberDark, fontWeight: 700, opacity: 0.85 }}>{commessaSel.cliente} {commessaSel.cognome || ""}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.navyFaint} strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )}
          {showPicker && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(26,42,71,0.65)", zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 420, maxHeight: "80vh", background: C.white, borderRadius: "16px 16px 0 0", overflowY: "auto", padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 10 }}>Scegli commessa</div>
                {commessePick.map((c: Commessa) => (
                  <div key={c.id} onClick={() => { setCommessaSel(c); setShowPicker(false); }} style={{ padding: 11, background: C.whiteOff, borderRadius: 9, marginBottom: 5, cursor: "pointer" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.navy }}>{c.code} · {c.cliente} {c.cognome || ""}</div>
                  </div>
                ))}
                <button onClick={() => setShowPicker(false)} style={{ width: "100%", padding: 10, background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 9, fontSize: 12, fontWeight: 800, marginTop: 8, cursor: "pointer" }}>Annulla</button>
              </div>
            </div>
          )}
        </>
      )}
      <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px 0" }}>Righe articoli ({righe.length})</div>
      {righe.map((r: RigaOrdine) => (
        <div key={r.id} style={{ background: C.white, border: "1px solid " + C.borderStrong, borderRadius: 10, padding: "9px 11px", marginBottom: 5, display: "grid", gridTemplateColumns: "70px 1fr 50px 60px 22px", alignItems: "center", gap: 6 }}>
          <input value={r.codice || ""} onChange={e => updateRiga(r.id, { codice: e.target.value })} placeholder="COD" style={{ fontFamily: "monospace", background: C.whiteOff, border: "1px solid " + C.borderStrong, padding: "3px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800, color: C.navy, outline: "none", width: "100%" }} />
          <input value={r.descrizione} onChange={e => updateRiga(r.id, { descrizione: e.target.value })} placeholder="Descrizione articolo" style={{ fontSize: 11, fontWeight: 700, color: C.navy, border: "none", outline: "none", fontFamily: "inherit", background: "transparent", width: "100%" }} />
          <input type="number" value={r.qta_richiesta} onChange={e => updateRiga(r.id, { qta_richiesta: Number(e.target.value) })} style={{ background: C.whiteOff, border: "1px solid " + C.borderStrong, padding: "4px 6px", borderRadius: 6, fontSize: 12, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums", textAlign: "center", outline: "none", fontFamily: "inherit", width: "100%" }} />
          <input type="number" value={r.prezzo_unitario} onChange={e => updateRiga(r.id, { prezzo_unitario: Number(e.target.value) })} placeholder="€" style={{ background: C.whiteOff, border: "1px solid " + C.borderStrong, padding: "4px 6px", borderRadius: 6, fontSize: 11, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums", textAlign: "right", outline: "none", fontFamily: "inherit", width: "100%" }} />
          <button onClick={() => removeRiga(r.id)} style={{ width: 22, height: 22, background: C.whiteOff, border: "1px solid " + C.borderStrong, borderRadius: 6, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
      <button onClick={aggiungiRigaLibera} style={{ background: C.whiteOff, border: "1.5px dashed " + C.borderStrong, borderRadius: 10, padding: 10, width: "100%", fontSize: 11, fontWeight: 800, color: C.navy, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12, cursor: "pointer" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Aggiungi riga
      </button>
      {righe.length > 0 && (
        <div style={{ background: C.navy, color: C.white, borderRadius: 10, padding: "10px 13px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
            <span style={{ opacity: 0.85 }}>Imponibile ({righe.length} righe)</span>
            <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>€{totaleOrdine.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, padding: "6px 0 0 0", marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <span>TOTALE c/IVA</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>€{(totaleOrdine * 1.22).toFixed(2)}</span>
          </div>
        </div>
      )}
    </>
  );
}

function Step3({ consegnaData, setConsegnaData, consegnaTipo, setConsegnaTipo, consegnaIndirizzo, setConsegnaIndirizzo, canale, setCanale, note, setNote, totaleOrdine, fornitoreSel }: any) {
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px 0" }}>Consegna</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        <Field label="Data" type="date" value={consegnaData} onChange={setConsegnaData} />
        <div style={{ background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 9, padding: "7px 10px" }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: C.navyFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Tipo</div>
          <select value={consegnaTipo} onChange={e => setConsegnaTipo(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: C.navy, width: "100%", background: "transparent", fontFamily: "inherit" }}>
            <option value="magazzino">Magazzino</option>
            <option value="cantiere">Cantiere</option>
          </select>
        </div>
      </div>
      <Field label="Indirizzo" value={consegnaIndirizzo} onChange={setConsegnaIndirizzo} />
      <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px 0" }}>Canale invio</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {(["email", "whatsapp", "pec"] as const).map(ch => (
          <button key={ch} onClick={() => setCanale(ch)} style={{ flex: 1, padding: 10, background: canale === ch ? C.navy : C.white, color: canale === ch ? C.white : C.navy, border: "1.5px solid " + (canale === ch ? C.navy : C.borderStrong), borderRadius: 9, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, cursor: "pointer" }}>{ch}</button>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px 0" }}>Note (opz.)</div>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Note per fornitore..." style={{ width: "100%", background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 10, padding: "9px 11px", fontSize: 12, color: C.navy, fontFamily: "inherit", resize: "vertical", outline: "none", marginBottom: 12 }} />
      <div style={{ background: C.greenSoft, borderRadius: 10, padding: 11, fontSize: 11, color: C.green, fontWeight: 700, lineHeight: 1.4 }}>
        <b>Pronto per invio</b><br/>
        Fornitore: <b>{fornitoreSel?.nome || "—"}</b><br/>
        Totale c/IVA: <b>€{(totaleOrdine * 1.22).toFixed(2)}</b>
      </div>
    </>
  );
}

function Field({ label, value, onChange, type }: any) {
  return (
    <div style={{ background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 9, padding: "7px 10px", marginBottom: 6 }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: C.navyFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: C.navy, width: "100%", fontFamily: "inherit", background: "transparent" }} />
    </div>
  );
}

function WizFoot({ step, setStep, canNext, busy, onSalva, onInvia }: any) {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 14px 16px 14px", background: C.white, borderTop: "1px solid " + C.border, display: "flex", gap: 7 }}>
      {step > 1 && (
        <button onClick={() => setStep((step - 1) as any)} disabled={busy} style={{ flex: "0 0 80px", padding: 12, borderRadius: 11, background: C.whiteOff, color: C.navy, border: "1.5px solid " + C.borderStrong, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Indietro</button>
      )}
      {step < 3 ? (
        <button onClick={() => canNext && setStep((step + 1) as any)} disabled={!canNext || busy} style={{ flex: 1, padding: 12, borderRadius: 11, background: canNext ? C.navy : C.navyFaint, color: C.white, border: "none", fontSize: 13, fontWeight: 800, cursor: canNext && !busy ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Avanti
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      ) : (
        <>
          <button onClick={onSalva} disabled={busy} style={{ flex: 1, padding: 12, borderRadius: 11, background: C.whiteOff, color: C.navy, border: "1.5px solid " + C.borderStrong, fontSize: 12, fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>{busy ? "..." : "Salva bozza"}</button>
          <button onClick={onInvia} disabled={busy} style={{ flex: 1, padding: 12, borderRadius: 11, background: C.greenBright, color: C.white, border: "none", fontSize: 13, fontWeight: 800, cursor: busy ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {busy ? "Invio..." : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Invia ora</>}
          </button>
        </>
      )}
    </div>
  );
}
