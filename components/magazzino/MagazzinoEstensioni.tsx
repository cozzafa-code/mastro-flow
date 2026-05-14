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
const PURPLE = "#5C2D8C";
const MUTED = "#5C6B7A";

function Shell({ onClose, kicker, title, children, footer }: any) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20, width: "100%", maxWidth: 500, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>{kicker}</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>{children}</div>
        {footer && <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>{footer}</div>}
      </div>
    </div>
  );
}

function Banner({ kind, children }: any) {
  const cfg = kind === "err" ? { bg: "#FCE3E3", col: RED } : kind === "warn" ? { bg: "#FBF0DC", col: "#8B6926" } : { bg: "#D5EBE0", col: GREEN };
  return <div style={{ padding: "9px 11px", borderRadius: 8, fontSize: 11.5, background: cfg.bg, color: cfg.col, marginBottom: 10, fontWeight: 700, borderLeft: `3px solid ${cfg.col}` }}>{children}</div>;
}

function Lbl({ children }: any) {
  return <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #D8DEE5", borderRadius: 8, fontSize: 13, color: NAVY, fontWeight: 600, outline: "none", background: "#fff", boxSizing: "border-box", fontFamily: "inherit" };
const btnPrimary: React.CSSProperties = { width: "100%", padding: 13, background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`, color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", border: "none", cursor: "pointer" };

// ============================================================
// 1. IMPORT CSV/XLSX
// ============================================================
export function ModalImport({ aziendaId, onClose, onDone }: any) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [rows, setRows] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setErr(null);
    const ext = f.name.split(".").pop()?.toLowerCase();
    try {
      let parsed: any[] = [];
      if (ext === "csv" || ext === "txt") {
        const text = await f.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error("File senza dati");
        const sep = lines[0].split(";").length > lines[0].split(",").length ? ";" : ",";
        const h = lines[0].split(sep).map(x => x.trim().toLowerCase());
        parsed = lines.slice(1).map(line => {
          const v = line.split(sep).map(x => x.trim());
          const o: any = {};
          h.forEach((hd, i) => { o[hd] = v[i] || ""; });
          return o;
        });
      } else if (ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx").catch(() => null);
        if (!XLSX) throw new Error("xlsx non disponibile");
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        parsed = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      } else throw new Error(`.${ext} non supportato`);

      const mapped = parsed.map(r => {
        const n: any = {};
        for (const [k, v] of Object.entries(r)) {
          const kl = k.toLowerCase().trim();
          if (kl.includes("codice") || kl === "code" || kl === "sku") n.codice = String(v);
          else if (kl.includes("nome") || kl.includes("descr")) n.nome = String(v);
          else if (kl === "um" || kl.includes("unita")) n.unita_misura = String(v);
          else if (kl.includes("prezzo") && kl.includes("vendita")) n.prezzo_vendita = String(v);
          else if (kl.includes("prezzo") || kl.includes("costo")) n.prezzo_acquisto = String(v);
          else if (kl.includes("scorta") && (kl.includes("min") || kl.includes("riordino"))) n.scorta_minima = String(v);
          else if (kl.includes("scorta") || kl.includes("qta") || kl.includes("quant")) n.scorta_attuale = String(v);
          else if (kl.includes("scaffale") || kl.includes("posiz")) n.scaffale = String(v);
          else if (kl.includes("forn")) n.fornitore_nome = String(v);
          else if (kl === "ean" || kl.includes("barcode")) n.ean = String(v);
          else if (kl === "marca") n.marca = String(v);
        }
        return n;
      }).filter(r => r.codice && r.nome);

      if (mapped.length === 0) throw new Error("Nessuna riga valida. Servono colonne codice + nome");
      setRows(mapped);
      setStep("preview");
    } catch (e: any) { setErr(e.message); }
  };

  const esegui = async () => {
    setLoading(true); setErr(null);
    let creati = 0, aggiornati = 0;
    const errori: any[] = [];
    for (let i = 0; i < rows.length; i += 200) {
      const ch = rows.slice(i, i + 200);
      const { data, error } = await supabase.rpc("magazzino_import_bulk", { p_righe: ch });
      if (error) { setErr(error.message); setLoading(false); return; }
      if (data?.ok) { creati += data.creati || 0; aggiornati += data.aggiornati || 0; if (data.errori) errori.push(...data.errori); }
    }
    setResult({ creati, aggiornati, errori, totale: rows.length });
    setStep("done");
    setLoading(false);
    if (onDone) onDone();
  };

  const template = () => {
    const csv = "codice;nome;um;prezzo_acquisto;prezzo_vendita;scorta_attuale;scorta_minima;fornitore_nome;scaffale\nFER-CER-001;Cerniera Maico RC2;pz;87;120;30;50;Maico;A-01";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "template.csv";
    a.click();
  };

  return (
    <Shell onClose={onClose} kicker="IMPORT MAGAZZINO" title={step === "upload" ? "Carica file" : step === "preview" ? `${rows.length} righe` : "Completato"} footer={
      step === "preview" ? <button onClick={esegui} disabled={loading} style={btnPrimary}>{loading ? "Import..." : `IMPORTA ${rows.length} RIGHE`}</button> :
      step === "done" ? <button onClick={onClose} style={btnPrimary}>FATTO</button> : null
    }>
      {err && <Banner kind="err">{err}</Banner>}
      {step === "upload" && (
        <>
          <div onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${TEAL}`, borderRadius: 13, padding: "30px 20px", textAlign: "center", cursor: "pointer", background: "#fff", marginBottom: 11 }}>
            <div style={{ fontSize: 36, color: TEAL, marginBottom: 6, fontWeight: 800 }}>⬆</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>Scegli file</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3, fontWeight: 600 }}>CSV · XLSX</div>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <button onClick={template} style={{ width: "100%", padding: 11, background: "#fff", color: TEAL, border: `1.5px solid ${TEAL}`, borderRadius: 9, fontSize: 11, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>↓ Template CSV</button>
        </>
      )}
      {step === "preview" && (
        <div style={{ background: "#fff", borderRadius: 9, padding: 9, fontSize: 10, maxHeight: 380, overflowY: "auto" }}>
          {rows.slice(0, 30).map((r, i) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #F1F4F7" }}>
              <div style={{ fontFamily: "monospace", color: MUTED, fontWeight: 700, fontSize: 9 }}>{r.codice}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>{r.nome}</div>
            </div>
          ))}
          {rows.length > 30 && <div style={{ padding: 7, textAlign: "center", color: MUTED, fontStyle: "italic" }}>...e altre {rows.length - 30}</div>}
        </div>
      )}
      {step === "done" && result && (
        <div style={{ background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)`, color: "#fff", borderRadius: 13, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>✓ Completato</div>
          <div style={{ fontSize: 11, marginTop: 7 }}>Creati: <b>{result.creati}</b> · Aggiornati: <b>{result.aggiornati}</b> · Errori: <b>{result.errori.length}</b></div>
        </div>
      )}
    </Shell>
  );
}

// ============================================================
// 2. ETICHETTE QR
// ============================================================
export function ModalEtichette({ articoli, onClose }: any) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [gen, setGen] = useState(false);

  const filt = articoli.filter((a: any) => !search || a.nome?.toLowerCase().includes(search.toLowerCase()) || a.codice?.toLowerCase().includes(search.toLowerCase()));

  const stampa = async () => {
    if (sel.size === 0) return;
    setGen(true);
    const { data } = await supabase.rpc("genera_dati_etichette", { p_articolo_ids: Array.from(sel) });
    setGen(false);
    if (!data?.ok) { alert("Errore"); return; }
    const html = `<!DOCTYPE html><html><head><title>Etichette</title><style>@page{size:A4;margin:8mm}body{font-family:Arial;margin:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.et{border:1px solid #333;padding:4mm;height:35mm;page-break-inside:avoid;box-sizing:border-box;position:relative;display:flex;flex-direction:column;justify-content:space-between}.cod{font-family:monospace;font-size:8pt;color:#666;font-weight:700}.nm{font-size:11pt;font-weight:800;color:#1B3A5C;margin:2mm 0}.scf{background:#1B3A5C;color:#fff;padding:1mm 3mm;border-radius:1mm;font-size:10pt;font-weight:800;display:inline-block}.qr{position:absolute;top:3mm;right:3mm;width:14mm;height:14mm}</style></head><body><div class="grid">${data.etichette.map((e: any) => `<div class="et"><div><div class="cod">${e.codice}</div><div class="nm">${e.nome}</div></div><div><span class="scf">${e.scaffale}</span></div><img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(e.qr_payload)}"/></div>`).join("")}</div><script>window.onload=()=>setTimeout(()=>window.print(),500)</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <Shell onClose={onClose} kicker="ETICHETTE QR" title={`${sel.size} selez.`} footer={
      <button onClick={stampa} disabled={sel.size === 0 || gen} style={{ ...btnPrimary, background: sel.size === 0 ? "#D8DEE5" : btnPrimary.background }}>{gen ? "..." : `STAMPA ${sel.size}`}</button>
    }>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." style={{ ...inputStyle, marginBottom: 9 }} />
      <button onClick={() => sel.size === filt.length ? setSel(new Set()) : setSel(new Set(filt.map((a: any) => a.id)))} style={{ background: "transparent", color: TEAL, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>{sel.size === filt.length ? "Deseleziona" : "Seleziona tutto"}</button>
      <div style={{ background: "#fff", borderRadius: 9, padding: 6, maxHeight: 360, overflowY: "auto" }}>
        {filt.map((a: any) => (
          <div key={a.id} onClick={() => { const n = new Set(sel); n.has(a.id) ? n.delete(a.id) : n.add(a.id); setSel(n); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", cursor: "pointer", background: sel.has(a.id) ? "rgba(40,160,160,0.1)" : "transparent", borderBottom: "1px solid #F1F4F7" }}>
            <input type="checkbox" checked={sel.has(a.id)} readOnly style={{ width: 16, height: 16, accentColor: TEAL }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: MUTED, fontFamily: "monospace", fontWeight: 700 }}>{a.codice}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
            </div>
            {a.posizione_magazzino && <span style={{ background: NAVY, color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{a.posizione_magazzino}</span>}
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ============================================================
// 3. ARCHIVIA + AUDIT
// ============================================================
export function ModalArchivia({ articolo, onClose, onDone }: any) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isArch = !articolo.attivo;

  const conferma = async () => {
    setLoading(true); setErr(null);
    const rpc = isArch ? "articolo_riattiva" : "articolo_archivia";
    const params: any = { p_articolo_id: articolo.id };
    if (!isArch) params.p_motivo = motivo || null;
    const { data, error } = await supabase.rpc(rpc, params);
    setLoading(false);
    if (error || !data?.ok) { setErr(error?.message || data?.error); return; }
    if (onDone) onDone();
  };

  return (
    <Shell onClose={onClose} kicker={isArch ? "RIATTIVA" : "ARCHIVIA"} title={articolo.nome} footer={
      <button onClick={conferma} disabled={loading} style={{ ...btnPrimary, background: isArch ? `linear-gradient(180deg, ${GREEN}, #0a4d3c)` : `linear-gradient(180deg, ${AMBER}, #8B6926)` }}>{loading ? "..." : isArch ? "RIATTIVA" : "ARCHIVIA"}</button>
    }>
      {err && <Banner kind="err">{err}</Banner>}
      <Banner kind="warn">{isArch ? "Tornerà visibile nelle liste." : "Non eliminato, solo nascosto. Storico restano."}</Banner>
      {!isArch && (
        <>
          <Lbl>Motivo</Lbl>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="es. fuori produzione" style={inputStyle} />
        </>
      )}
    </Shell>
  );
}

export function ModalAudit({ articolo, onClose }: any) {
  const [eventi, setEventi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("articoli_audit").select("*").eq("articolo_id", articolo.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setEventi(data || []); setLoading(false); });
  }, [articolo.id]);

  return (
    <Shell onClose={onClose} kicker="STORICO MODIFICHE" title={articolo.nome}>
      {loading ? <div style={{ padding: 20, textAlign: "center", color: MUTED }}>Caricamento...</div> :
       eventi.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: MUTED }}>Nessuna modifica</div> :
       eventi.map(e => {
         const cfg: any = { INSERT: { col: GREEN, lbl: "CREATO" }, UPDATE: { col: TEAL, lbl: "MOD" }, ARCHIVE: { col: AMBER, lbl: "ARCH" }, UNARCHIVE: { col: GREEN, lbl: "RIATT" } };
         const c = cfg[e.operazione] || cfg.UPDATE;
         return (
           <div key={e.id} style={{ background: "#fff", padding: "8px 10px", borderRadius: 8, marginBottom: 5, borderLeft: `3px solid ${c.col}` }}>
             <div style={{ display: "flex", justifyContent: "space-between" }}>
               <span style={{ background: `${c.col}25`, color: c.col, padding: "2px 7px", borderRadius: 4, fontSize: 8.5, fontWeight: 800 }}>{c.lbl}</span>
               <span style={{ fontSize: 9, color: MUTED }}>{new Date(e.created_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
             </div>
             {e.campo_modificato && <div style={{ fontSize: 11, marginTop: 5, color: NAVY }}><b>{e.campo_modificato}</b>: <span style={{ color: RED, textDecoration: "line-through" }}>{e.valore_prima || "—"}</span> → <span style={{ color: GREEN, fontWeight: 700 }}>{e.valore_dopo || "—"}</span></div>}
             {e.utente_nome && <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>da <b>{e.utente_nome}</b></div>}
           </div>
         );
       })
      }
    </Shell>
  );
}

// ============================================================
// 4. LISTA SPESA
// ============================================================
export function VistaListaSpesa({ aziendaId, mag }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [gen, setGen] = useState(false);
  const [result, setResult] = useState<any>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("lista_spesa").select("*, articoli_magazzino(codice, unita_misura, fornitori(nome))").eq("azienda_id", aziendaId).eq("stato", "da_ordinare").order("created_at", { ascending: false });
    setItems((data || []).map((d: any) => ({ ...d, art_codice: d.articoli_magazzino?.codice, art_um: d.articoli_magazzino?.unita_misura, art_fornitore: d.articoli_magazzino?.fornitori?.nome })));
    setLoading(false);
  };

  useEffect(() => { reload(); }, [aziendaId]);

  const generaOrdini = async () => {
    if (sel.size === 0) return;
    setGen(true);
    const { data, error } = await supabase.rpc("genera_ordini_da_lista_spesa", { p_ids: Array.from(sel) });
    setGen(false);
    if (error) { alert(error.message); return; }
    if (data?.ok) { setResult(data); setSel(new Set()); reload(); }
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: MUTED }}>Caricamento...</div>;

  const totGen = items.reduce((s, i) => s + (i.quantita_da_ordinare * (i.prezzo_stimato || 0)), 0);

  return (
    <div>
      <div style={{ background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff", borderRadius: 13, padding: "12px 14px", marginBottom: 9 }}>
        <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>Lista spesa</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>€ {totGen.toFixed(0)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{items.length} articoli da ordinare</div>
      </div>

      {result && <div style={{ background: GREEN, color: "#fff", padding: "11px 13px", borderRadius: 10, marginBottom: 9, fontSize: 12, fontWeight: 700 }}>✓ Creati {result.n_ordini} ordini fornitore<button onClick={() => setResult(null)} style={{ float: "right", background: "transparent", color: "#fff", border: "none", cursor: "pointer", fontSize: 16 }}>×</button></div>}

      <div style={{ display: "flex", gap: 5, marginBottom: 9 }}>
        <button onClick={() => setShowAdd(true)} style={{ flex: 1, padding: 11, background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)`, color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800, textTransform: "uppercase", border: "none", cursor: "pointer" }}>+ AGGIUNGI</button>
        {sel.size > 0 && <button onClick={generaOrdini} disabled={gen} style={{ flex: 1, padding: 11, background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`, color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800, textTransform: "uppercase", border: "none", cursor: "pointer" }}>{gen ? "..." : `→ ${sel.size} ORDINI`}</button>}
      </div>

      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 13, padding: 30, textAlign: "center", color: MUTED }}>Lista vuota</div>
      ) : items.map(i => (
        <div key={i.id} style={{ background: "#fff", borderRadius: 10, padding: "9px 11px", marginBottom: 6, display: "flex", alignItems: "center", gap: 9, borderLeft: `3px solid ${TEAL}` }}>
          <input type="checkbox" checked={sel.has(i.id)} onChange={() => { const n = new Set(sel); n.has(i.id) ? n.delete(i.id) : n.add(i.id); setSel(n); }} style={{ width: 17, height: 17, accentColor: TEAL, cursor: "pointer" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: MUTED, fontFamily: "monospace", fontWeight: 700 }}>{i.art_codice || "—"} {i.art_fornitore && `· ${i.art_fornitore}`}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{i.articolo_nome}</div>
            {i.urgenza && i.urgenza !== "normale" && <span style={{ background: i.urgenza === "urgente" ? RED : AMBER, color: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 8, fontWeight: 800, textTransform: "uppercase", marginTop: 2, display: "inline-block" }}>{i.urgenza}</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{i.quantita_da_ordinare}</div>
            <div style={{ fontSize: 9, color: MUTED }}>{i.art_um || "pz"}</div>
          </div>
          <button onClick={async () => { await supabase.from("lista_spesa").delete().eq("id", i.id); reload(); }} style={{ width: 22, height: 22, background: "transparent", color: RED, border: "none", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      ))}

      {showAdd && <ModalAggiungiLista aziendaId={aziendaId} mag={mag} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); reload(); }} />}
    </div>
  );
}

function ModalAggiungiLista({ aziendaId, mag, onClose, onDone }: any) {
  const [search, setSearch] = useState("");
  const [sa, setSa] = useState<any | null>(null);
  const [qta, setQta] = useState(1);
  const [urg, setUrg] = useState("normale");
  const [loading, setLoading] = useState(false);
  const articoli = mag.articoli || [];
  const filt = !search ? articoli.slice(0, 15) : articoli.filter((a: any) => a.nome?.toLowerCase().includes(search.toLowerCase()) || a.codice?.toLowerCase().includes(search.toLowerCase())).slice(0, 15);

  const conferma = async () => {
    if (!sa) return;
    setLoading(true);
    const { error } = await supabase.rpc("lista_spesa_aggiungi", { p_articolo_id: sa.id, p_quantita: qta, p_urgenza: urg });
    setLoading(false);
    if (error) { alert(error.message); return; }
    if (onDone) onDone();
  };

  return (
    <Shell onClose={onClose} kicker="AGGIUNGI" title="Lista spesa" footer={sa && <button onClick={conferma} disabled={loading} style={{ ...btnPrimary, background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)` }}>{loading ? "..." : "+ AGGIUNGI"}</button>}>
      {!sa ? (
        <>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." autoFocus style={inputStyle} />
          <div style={{ background: "#fff", borderRadius: 9, padding: 6, marginTop: 9, maxHeight: 400, overflowY: "auto" }}>
            {filt.map((a: any) => (
              <div key={a.id} onClick={() => setSa(a)} style={{ padding: "8px 9px", cursor: "pointer", borderBottom: "1px solid #F1F4F7" }}>
                <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "monospace", fontWeight: 700 }}>{a.codice}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{a.nome}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ background: "#fff", borderRadius: 9, padding: 11, marginBottom: 11, borderLeft: `3px solid ${TEAL}` }}>
            <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "monospace", fontWeight: 700 }}>{sa.codice}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{sa.nome}</div>
          </div>
          <Lbl>Quantità</Lbl>
          <div style={{ display: "flex", gap: 9, background: "#fff", borderRadius: 9, padding: 5, marginBottom: 11 }}>
            <button onClick={() => setQta(Math.max(1, qta - 1))} style={{ width: 36, height: 36, borderRadius: 7, background: NAVY, color: "#fff", fontSize: 18, fontWeight: 800, border: "none", cursor: "pointer" }}>−</button>
            <input type="number" value={qta} onChange={(e) => setQta(Math.max(1, parseInt(e.target.value) || 1))} style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: NAVY, border: "none", outline: "none", background: "transparent" }} />
            <button onClick={() => setQta(qta + 1)} style={{ width: 36, height: 36, borderRadius: 7, background: NAVY, color: "#fff", fontSize: 18, fontWeight: 800, border: "none", cursor: "pointer" }}>+</button>
          </div>
          <Lbl>Urgenza</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
            {(["bassa", "normale", "alta", "urgente"] as const).map(u => (
              <button key={u} onClick={() => setUrg(u)} style={{ padding: 8, background: urg === u ? (u === "urgente" ? RED : u === "alta" ? AMBER : TEAL) : "#fff", color: urg === u ? "#fff" : MUTED, borderRadius: 7, fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", border: `1px solid ${urg === u ? "transparent" : "#D8DEE5"}`, cursor: "pointer" }}>{u}</button>
            ))}
          </div>
          <button onClick={() => setSa(null)} style={{ width: "100%", padding: 9, marginTop: 11, background: "transparent", color: MUTED, border: "1px solid #D8DEE5", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>← Cambia</button>
        </>
      )}
    </Shell>
  );
}
