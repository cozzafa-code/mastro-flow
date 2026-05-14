"use client";
import React, { useState, useEffect } from "react";
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

// ============================================================
// MODAL ARCHIVIA ARTICOLO
// ============================================================

interface ArchProps {
  articolo: any;
  onClose: () => void;
  onDone: () => void;
}

export function ModalArchiviaArticolo({ articolo, onClose, onDone }: ArchProps) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isArchiviato = !articolo.attivo;

  const conferma = async () => {
    setLoading(true); setErr(null);
    const rpc = isArchiviato ? "articolo_riattiva" : "articolo_archivia";
    const params: any = { p_articolo_id: articolo.id };
    if (!isArchiviato) params.p_motivo = motivo || null;
    
    const { data, error } = await supabase.rpc(rpc, params);
    setLoading(false);
    if (error || !data?.ok) {
      setErr(error?.message || data?.error || "Errore");
      return;
    }
    onDone();
  };

  return (
    <ModalShell onClose={onClose}
      kicker={isArchiviato ? "RIATTIVA" : "ARCHIVIA"}
      title={articolo.nome}>
      {err && <Banner kind="err">{err}</Banner>}
      <div style={{
        background: isArchiviato ? "#D5EBE0" : "#FBF0DC",
        borderLeft: `3px solid ${isArchiviato ? GREEN : AMBER}`,
        padding: "10px 12px", borderRadius: 8, marginBottom: 11,
        fontSize: 11, color: isArchiviato ? GREEN : "#8B6926", fontWeight: 600,
      }}>
        {isArchiviato 
          ? "L'articolo verrà riattivato e tornerà visibile nelle liste."
          : "L'articolo NON sarà eliminato. Verrà solo nascosto dalle liste. Tutto lo storico resta accessibile."}
      </div>
      
      <div style={{ background: "#fff", borderRadius: 9, padding: 10, marginBottom: 11 }}>
        <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{articolo.codice}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{articolo.nome}</div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
          Scorta attuale: <b style={{ color: articolo.scorta_attuale > 0 ? RED : GREEN }}>{articolo.scorta_attuale}</b> {articolo.unita_misura}
        </div>
      </div>

      {!isArchiviato && (
        <Field label="Motivo archiviazione">
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder="es. fornitore non più disponibile"
            style={inputStyle} />
        </Field>
      )}

      <button onClick={conferma} disabled={loading} style={{
        width: "100%", padding: 13, marginTop: 9,
        background: isArchiviato 
          ? `linear-gradient(180deg, ${GREEN}, #0a4d3c)`
          : `linear-gradient(180deg, ${AMBER}, #8B6926)`,
        color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
        letterSpacing: 0.5, textTransform: "uppercase", border: "none",
        cursor: loading ? "not-allowed" : "pointer",
      }}>
        {loading ? "..." : isArchiviato ? "RIATTIVA ARTICOLO" : "ARCHIVIA ARTICOLO"}
      </button>
    </ModalShell>
  );
}

// ============================================================
// MODAL AUDIT STORICO MODIFICHE
// ============================================================

interface AuditProps {
  articolo: any;
  onClose: () => void;
}

export function ModalAuditArticolo({ articolo, onClose }: AuditProps) {
  const [eventi, setEventi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("articoli_audit")
      .select("*").eq("articolo_id", articolo.id)
      .order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setEventi(data || []); setLoading(false); });
  }, [articolo.id]);

  return (
    <ModalShell onClose={onClose} kicker="STORICO MODIFICHE" title={articolo.nome}>
      <div style={{ background: "#fff", borderRadius: 9, padding: 10, marginBottom: 11 }}>
        <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{articolo.codice}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{articolo.nome}</div>
      </div>

      {loading ? <Loader /> : eventi.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessuna modifica registrata
        </div>
      ) : eventi.map(e => <RigaAudit key={e.id} e={e} />)}
    </ModalShell>
  );
}

function RigaAudit({ e }: any) {
  const cfg: any = {
    INSERT: { col: GREEN, lbl: "CREATO" },
    UPDATE: { col: TEAL, lbl: "MODIFICATO" },
    ARCHIVE: { col: AMBER, lbl: "ARCHIVIATO" },
    UNARCHIVE: { col: GREEN, lbl: "RIATTIVATO" },
    DELETE: { col: RED, lbl: "ELIMINATO" },
  };
  const c = cfg[e.operazione] || cfg.UPDATE;
  return (
    <div style={{
      background: "#fff", padding: "8px 10px", borderRadius: 8,
      marginBottom: 5, borderLeft: `3px solid ${c.col}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          background: `${c.col}25`, color: c.col,
          padding: "2px 7px", borderRadius: 4,
          fontSize: 8.5, fontWeight: 800, letterSpacing: 0.3,
        }}>{c.lbl}</span>
        <span style={{ fontSize: 9, color: MUTED }}>
          {new Date(e.created_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {e.campo_modificato && (
        <div style={{ fontSize: 11, marginTop: 5, color: NAVY }}>
          <b>{e.campo_modificato}</b>: 
          <span style={{ color: RED, marginLeft: 4, textDecoration: "line-through" }}>{e.valore_prima || "—"}</span>
          <span style={{ margin: "0 5px", color: MUTED }}>→</span>
          <span style={{ color: GREEN, fontWeight: 700 }}>{e.valore_dopo || "—"}</span>
        </div>
      )}
      {e.utente_nome && (
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
          da <b>{e.utente_nome}</b>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MODAL STAMPA ETICHETTE QR
// ============================================================

interface EtichettaProps {
  articoli: any[];
  onClose: () => void;
}

export function ModalStampaEtichette({ articoli, onClose }: EtichettaProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);

  const toggle = (id: string) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };
  
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  };

  const filtered = articoli.filter(a => 
    !search || 
    a.nome?.toLowerCase().includes(search.toLowerCase()) ||
    a.codice?.toLowerCase().includes(search.toLowerCase())
  );

  const stampa = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    const { data, error } = await supabase.rpc("genera_dati_etichette", { 
      p_articolo_ids: Array.from(selected) 
    });
    setGenerating(false);
    if (error || !data?.ok) { alert("Errore: " + (error?.message || "")); return; }
    
    // Apri finestra di stampa con HTML formattato
    const html = `<!DOCTYPE html>
<html><head><title>Etichette MASTRO</title><style>
  @page { size: A4; margin: 8mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
  .et { 
    border: 1px solid #333; padding: 4mm; height: 35mm;
    page-break-inside: avoid; box-sizing: border-box; position: relative;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .cod { font-family: monospace; font-size: 8pt; color: #666; font-weight: 700; }
  .nm { font-size: 11pt; font-weight: 800; color: #1B3A5C; line-height: 1.15; margin: 2mm 0; }
  .meta { font-size: 7pt; color: #666; }
  .scf { background: #1B3A5C; color: #fff; padding: 1mm 3mm; border-radius: 1mm; font-size: 10pt; font-weight: 800; display: inline-block; }
  .qr { position: absolute; top: 3mm; right: 3mm; width: 14mm; height: 14mm; }
  .ean { font-size: 7pt; color: #333; letter-spacing: 0.5pt; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style></head><body>
<div class="grid">
${data.etichette.map((e: any) => `
  <div class="et">
    <div>
      <div class="cod">${e.codice}</div>
      <div class="nm">${e.nome}</div>
      ${e.fornitore ? `<div class="meta">${e.fornitore}</div>` : ''}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <span class="scf">${e.scaffale}</span>
      ${e.ean ? `<span class="ean">${e.ean}</span>` : ''}
    </div>
    <img class="qr" alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(e.qr_payload)}" />
  </div>
`).join("")}
</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),500)}</script>
</body></html>`;
    
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <ModalShell onClose={onClose} kicker="ETICHETTE QR" title={`${selected.size} selezionate`}>
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca articolo..."
        style={{ ...inputStyle, marginBottom: 10 }} />
      
      <button onClick={toggleAll} style={{
        background: "transparent", color: TEAL, border: "none",
        fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 9,
      }}>
        {selected.size === filtered.length ? "Deseleziona tutto" : "Seleziona tutto"}
      </button>
      
      <div style={{ background: "#fff", borderRadius: 9, padding: 6, maxHeight: 320, overflowY: "auto" }}>
        {filtered.map(a => (
          <div key={a.id} onClick={() => toggle(a.id)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 9px", borderRadius: 6, cursor: "pointer",
            background: selected.has(a.id) ? "rgba(40,160,160,0.1)" : "transparent",
            borderBottom: "1px solid #F1F4F7",
          }}>
            <input type="checkbox" checked={selected.has(a.id)} readOnly
              style={{ width: 16, height: 16, accentColor: TEAL }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{a.codice}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
            </div>
            {a.posizione_magazzino && (
              <span style={{ background: NAVY, color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{a.posizione_magazzino}</span>
            )}
          </div>
        ))}
      </div>

      <button onClick={stampa} disabled={selected.size === 0 || generating} style={{
        width: "100%", padding: 13, marginTop: 11,
        background: selected.size === 0 ? "#D8DEE5" : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
        color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
        letterSpacing: 0.5, textTransform: "uppercase", border: "none",
        cursor: selected.size === 0 ? "not-allowed" : "pointer",
      }}>
        {generating ? "..." : `STAMPA ${selected.size} ETICHETTE`}
      </button>
    </ModalShell>
  );
}

// ============================================================
// MODAL RICONCILIA FATTURA PASSIVA
// ============================================================

interface FattProps {
  ordine: any;
  onClose: () => void;
  onDone: () => void;
}

export function ModalRiconciliaFattura({ ordine, onClose, onDone }: FattProps) {
  const [fNum, setFNum] = useState(ordine.fattura_numero || "");
  const [fData, setFData] = useState(ordine.fattura_data || new Date().toISOString().split("T")[0]);
  const [imp, setImp] = useState(ordine.totale_euro || 0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const scost = (parseFloat(imp.toString()) || 0) - (ordine.totale_euro || 0);
  
  const conferma = async () => {
    if (!fNum || !fData) { setErr("Numero e data fattura obbligatori"); return; }
    setLoading(true); setErr(null);
    const { data, error } = await supabase.rpc("ordine_riconcilia_fattura", {
      p_ordine_id: ordine.id,
      p_fattura_numero: fNum,
      p_fattura_data: fData,
      p_importo: imp,
    });
    setLoading(false);
    if (error || !data?.ok) { setErr(error?.message || "Errore"); return; }
    onDone();
  };
  
  return (
    <ModalShell onClose={onClose} kicker="RICONCILIA FATTURA" title={ordine.fornitore_nome}>
      {err && <Banner kind="err">{err}</Banner>}
      <div style={{ background: "#fff", borderRadius: 9, padding: 11, marginBottom: 11 }}>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>ORDINE</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{ordine.fornitore_nome}</div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
          Totale ordinato: <b style={{ color: NAVY, fontSize: 12 }}>€ {(ordine.totale_euro || 0).toFixed(2)}</b>
        </div>
      </div>
      
      <Field label="N° Fattura" required>
        <input value={fNum} onChange={(e) => setFNum(e.target.value)} placeholder="es. FATT-2026/0123" style={inputStyle} />
      </Field>
      <Field label="Data Fattura" required>
        <input type="date" value={fData} onChange={(e) => setFData(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Importo Fatturato €" required>
        <input type="number" step="0.01" value={imp} onChange={(e) => setImp(parseFloat(e.target.value) || 0)} style={inputStyle} />
      </Field>
      
      {scost !== 0 && (
        <div style={{
          background: Math.abs(scost) > (ordine.totale_euro || 1) * 0.05 ? "#FCE3E3" : "#FBF0DC",
          borderLeft: `3px solid ${Math.abs(scost) > (ordine.totale_euro || 1) * 0.05 ? RED : AMBER}`,
          padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
          color: Math.abs(scost) > (ordine.totale_euro || 1) * 0.05 ? RED : "#8B6926",
          fontWeight: 700,
        }}>
          Scostamento: <b>{scost > 0 ? "+" : ""}€ {scost.toFixed(2)}</b>
          {Math.abs(scost) > (ordine.totale_euro || 1) * 0.05 && " — Sopra soglia 5%, verifica"}
        </div>
      )}
      
      <button onClick={conferma} disabled={loading} style={{
        width: "100%", padding: 13, marginTop: 11,
        background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
        color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
        letterSpacing: 0.5, textTransform: "uppercase", border: "none",
        cursor: loading ? "not-allowed" : "pointer",
      }}>{loading ? "..." : "CONFERMA RICONCILIAZIONE"}</button>
    </ModalShell>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function ModalShell({ onClose, kicker, title, children }: any) {
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
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>{kicker}</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
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
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function Banner({ kind, children }: any) {
  const cfg = kind === "err" ? { bg: "#FCE3E3", col: RED } : { bg: "#D5EBE0", col: GREEN };
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
      background: cfg.bg, color: cfg.col, marginBottom: 10,
      fontWeight: 700, borderLeft: `3px solid ${cfg.col}`,
    }}>{children}</div>
  );
}

function Field({ label, required, children }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function Loader() {
  return <div style={{ padding: 25, textAlign: "center", color: MUTED, fontSize: 11 }}>Caricamento...</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #D8DEE5", borderRadius: 8,
  fontSize: 13, color: NAVY, fontWeight: 600,
  outline: "none", background: "#fff", fontFamily: "inherit",
  boxSizing: "border-box",
};
