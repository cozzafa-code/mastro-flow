"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — PreventivoConfiguratoreTab v1.0
// Sostituisce il contenuto di prevTab === "preventivo"
// in CMDetailPanel.tsx
//
// INTEGRAZIONE (CMDetailPanel.tsx):
//   import PreventivoConfiguratoreTab from "./PreventivoConfiguratoreTab";
//   ...
//   {prevTab === "preventivo" && (
//     <PreventivoConfiguratoreTab />
//   )}
//
// Legge dal MastroContext:
//   - selectedCM, setCantieri, setSelectedCM (commessa attiva)
//   - aziendaInfo (dati azienda per PDF)
//   - generaPreventivoPDF, generaPreventivoCondivisibile
//   - T (tema colori)
//
// Salva su Supabase tramite updCM() → MastroContext → SyncEngine
// ═══════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMastro } from "./MastroContext";

// ─── Costanti configuratore ──────────────────────────────────────────────────
const PRATICHE = ["nessuna", "50", "65", "75"];
const PRATICHE_LABEL: Record<string, string> = {
  nessuna: "Nessuna",
  "50": "Ristrutturazione 50%",
  "65": "Ecobonus 65%",
  "75": "Barriere 75%",
};
const IVA_OPTS = [4, 10, 22];
const SCONTO_OPTS = [0, 5, 10, 15, 20];
const TIPI_VANO = ["F2A", "F1", "PF", "PF-sc", "Fisso", "Vasistas", "Scorrevole", "Bilico"];
const APERTURE = ["Anta/Ribalta", "Solo anta", "Solo ribalta", "Bilico", "Scorrevole"];
const PROFILI = ["Aluplast 70mm", "Aluplast 82mm", "Rehau 70mm", "Veka 82mm", "Kommerling 76mm"];
const VETRI = ["4/16/4 Ar basso-e", "4/12/4 std", "4/20/4 Ar triplo", "4/16/4 basso-e triplo", "Personalizzato"];
const FORNITORI_LIST = ["Aluplast", "Rehau", "Veka", "Kommerling", "Schuco"];
const COLORI_STD = ["Bianco RAL 9016", "RAL 7016 Antracite", "RAL 9005 Nero", "Inox F9", "Oro", "Bronzo", "Personalizzato"];
const TIPI_TAPPARELLA = ["RAL 7016 Mot.", "Bianco Mot.", "RAL 7016 Man.", "Bianco Man.", "Non inclusa"];
const TIPI_ZANZARIERA = ["Plisse bianco", "Plisse antracite", "Avvolgibile", "Laterale", "Non inclusa"];

const DOCS_MAP: Record<string, { doc: string; obblig: boolean }[]> = {
  "50": [
    { doc: "Carta d'identita committente", obblig: true },
    { doc: "Codice fiscale committente", obblig: true },
    { doc: "CILA / SCIA / Permesso di costruire", obblig: true },
    { doc: "Bonifico parlante (bancario/postale)", obblig: true },
    { doc: "Fatture con dicitura detrazione", obblig: true },
    { doc: "Comunicazione ENEA (entro 90gg)", obblig: true },
    { doc: "Visura catastale immobile", obblig: false },
    { doc: "Consenso proprietario (se inquilino)", obblig: false },
  ],
  "65": [
    { doc: "Carta d'identita committente", obblig: true },
    { doc: "Codice fiscale committente", obblig: true },
    { doc: "APE pre-intervento", obblig: true },
    { doc: "APE post-intervento", obblig: true },
    { doc: "Certificazione trasmittanza termica (Uw)", obblig: true },
    { doc: "Asseverazione tecnico abilitato", obblig: true },
    { doc: "Comunicazione ENEA (entro 90gg)", obblig: true },
    { doc: "Schede tecniche prodotti installati", obblig: true },
    { doc: "Fatture + bonifico parlante", obblig: true },
    { doc: "Visura catastale immobile", obblig: false },
  ],
  "75": [
    { doc: "Carta d'identita committente", obblig: true },
    { doc: "Codice fiscale committente", obblig: true },
    { doc: "Certificazione conformita barriere architettoniche", obblig: true },
    { doc: "Asseverazione tecnico abilitato", obblig: true },
    { doc: "Comunicazione ENEA (entro 90gg)", obblig: true },
    { doc: "Fatture + bonifico parlante", obblig: true },
    { doc: "Schede tecniche prodotti", obblig: false },
    { doc: "Visura catastale immobile", obblig: false },
  ],
};

// ─── fmt ─────────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n || 0);
}

// ─── Calcoli locali (per vani "preventivo style") ────────────────────────────
// I vani in questo configuratore usano prezzoUnitario diretto (non griglia sistemi)
function calcolaVanoPreventivo(v: any) {
  const base = (v.prezzoUnitario || 0) * (v.nPezzi || 1);
  const accTot = (v.accessori || []).filter((a: any) => a.attiva).reduce((s: number, a: any) => s + (a.prezzo || 0), 0);
  const tappPrezzo = v.tapparella?.inclusa ? (v.tapparella?.prezzo || 0) : 0;
  const zanzPrezzo = v.zanzariera?.inclusa ? (v.zanzariera?.prezzo || 0) : 0;
  const posa = Number(v.prezzoPosa) || 0;
  return base + accTot + tappPrezzo + zanzPrezzo + posa;
}

// ─── DisegnoCanvas (canvas disegno libero per singolo vano) ──────────────────
function DisegnoCanvas({ vano, onSave }: { vano: any; onSave: (dataUrl: string, quotes: any[]) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState("#1A1A1C");
  const [activeSize, setActiveSize] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const s = useRef<any>({
    drawing: false, tool: "pen", color: "#1A1A1C", lineWidth: 2,
    history: [], quotes: [], arrowStart: null, startX: 0, startY: 0,
    snapshot: null, showGrid: true, bgImage: null,
  }).current;

  function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!s.showGrid) return;
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    ctx.restore();
  }

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string) {
    ctx.save();
    ctx.strokeStyle = "#3B7FE0"; ctx.fillStyle = "#3B7FE0"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ah = 8;
    [0, 1].forEach((end) => {
      const [ex, ey, dir] = end === 0 ? [x1, y1, angle + Math.PI] : [x2, y2, angle];
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(dir - 0.4), ey - ah * Math.sin(dir - 0.4));
      ctx.lineTo(ex - ah * Math.cos(dir + 0.4), ey - ah * Math.sin(dir + 0.4));
      ctx.closePath(); ctx.fill();
    });
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.fillStyle = "#fff"; ctx.fillRect(mx - 22, my - 10, 44, 16);
    ctx.fillStyle = "#3B7FE0"; ctx.font = "bold 11px Inter,sans-serif"; ctx.textAlign = "center";
    ctx.fillText(label, mx, my + 3);
    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 340 * window.devicePixelRatio;
    canvas.style.height = "340px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas);
    if (vano.disegno) {
      const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = vano.disegno;
    }
  }, []);

  function getPos(e: any) {
    const canvas = canvasRef.current!; const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / window.devicePixelRatio / r.width;
    const scaleY = canvas.height / window.devicePixelRatio / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
  }

  function saveHistory() {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    s.history.push(canvas.toDataURL());
    if (s.history.length > 40) s.history.shift();
  }

  function handleMouseDown(e: any) {
    e.preventDefault();
    const { x, y } = getPos(e);
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    if (s.tool === "arrow") {
      if (!s.arrowStart) { s.arrowStart = { x, y }; return; }
      saveHistory();
      drawArrow(ctx, s.arrowStart.x, s.arrowStart.y, x, y, "?");
      setPopupPos({ x, y }); setShowQuotePopup(true);
      s.arrowEnd = { x, y }; s.arrowStart = null; return;
    }
    saveHistory(); s.drawing = true; s.startX = x; s.startY = y;
    s.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = s.tool === "eraser" ? "#fff" : s.color;
    ctx.lineWidth = s.tool === "eraser" ? 24 : s.lineWidth;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (s.tool === "text") {
      const t = prompt("Testo:"); if (!t) { s.drawing = false; return; }
      ctx.font = `${12 + s.lineWidth * 2}px Inter,sans-serif`;
      ctx.fillStyle = s.color; ctx.fillText(t, x, y);
      s.drawing = false;
    }
  }

  function handleMouseMove(e: any) {
    e.preventDefault(); if (!s.drawing) return;
    const { x, y } = getPos(e);
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    if (s.tool === "pen" || s.tool === "eraser") { ctx.lineTo(x, y); ctx.stroke(); return; }
    ctx.putImageData(s.snapshot, 0, 0);
    ctx.strokeStyle = s.color; ctx.lineWidth = s.lineWidth; ctx.lineCap = "round";
    if (s.tool === "line") { ctx.beginPath(); ctx.moveTo(s.startX, s.startY); ctx.lineTo(x, y); ctx.stroke(); }
    if (s.tool === "rect") { ctx.strokeRect(s.startX, s.startY, x - s.startX, y - s.startY); }
  }

  function handleMouseUp(e: any) { s.drawing = false; }

  function confirmQuota() {
    if (!quoteInput) { setShowQuotePopup(false); return; }
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    const a = s.arrowEnd || popupPos;
    const b = { x: a.x - 60, y: a.y - 40 };
    drawArrow(ctx, b.x, b.y, a.x, a.y, quoteInput + "mm");
    s.quotes.push({ x1: b.x, y1: b.y, x2: a.x, y2: a.y, valore: quoteInput });
    setShowQuotePopup(false); setQuoteInput("");
  }

  function undo() {
    if (!s.history.length) return;
    const prev = s.history.pop();
    const img = new Image();
    img.onload = () => { const ctx = canvasRef.current!.getContext("2d")!; ctx.clearRect(0, 0, 9999, 9999); ctx.drawImage(img, 0, 0); };
    img.src = prev;
  }

  function clearAll() {
    if (!confirm("Cancellare il disegno?")) return;
    saveHistory();
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas); s.quotes = [];
  }

  function loadImage(e: any) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        saveHistory();
        const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.globalAlpha = 0.45;
        const ratio = Math.min((canvas.width / window.devicePixelRatio) / img.width, 340 / img.height);
        const w = img.width * ratio, h = img.height * ratio;
        ctx.drawImage(img, ((canvas.width / window.devicePixelRatio) - w) / 2, (340 - h) / 2, w, h);
        ctx.restore(); drawGrid(ctx, canvas);
      };
      img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  }

  const COLORS = ["#1A1A1C", "#DC4444", "#3B7FE0", "#1A9E73", "#D08008"];
  const TOOLS = [
    { id: "pen", label: "✏️", title: "Matita libera" },
    { id: "line", label: "╱", title: "Linea retta" },
    { id: "rect", label: "▭", title: "Rettangolo" },
    { id: "arrow", label: "↔", title: "Freccia quota" },
    { id: "text", label: "T", title: "Testo libero" },
    { id: "eraser", label: "◻", title: "Gomma" },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", padding: 7, background: "#F2F1EC", borderRadius: 8, border: "0.5px solid #ddd", marginBottom: 8 }}>
        {TOOLS.map((t) => (
          <button key={t.id} title={t.title} onClick={() => { s.tool = t.id; setActiveTool(t.id); s.arrowStart = null; }}
            style={{ width: 30, height: 30, border: "0.5px solid " + (activeTool === t.id ? "#1A9E73" : "#ccc"), borderRadius: 6, background: activeTool === t.id ? "#1A9E73" : "#fff", color: activeTool === t.id ? "#fff" : "#333", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {t.label}
          </button>
        ))}
        <div style={{ width: 1, height: 24, background: "#ddd", margin: "0 2px" }} />
        {COLORS.map((c) => (
          <div key={c} onClick={() => { s.color = c; setActiveColor(c); }}
            style={{ width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", border: activeColor === c ? "2.5px solid #1A1A1C" : "2px solid transparent" }} />
        ))}
        <div style={{ width: 1, height: 24, background: "#ddd", margin: "0 2px" }} />
        {[{ sz: 2, lbl: "S" }, { sz: 4, lbl: "M" }, { sz: 8, lbl: "L" }].map(({ sz, lbl }) => (
          <button key={sz} onClick={() => { s.lineWidth = sz; setActiveSize(sz); }}
            style={{ padding: "2px 8px", border: "0.5px solid " + (activeSize === sz ? "#1A9E73" : "#ccc"), borderRadius: 6, fontSize: 11, cursor: "pointer", background: activeSize === sz ? "#1A9E73" : "#fff", color: activeSize === sz ? "#fff" : "#666" }}>
            {lbl}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <label title="Carica foto" style={{ width: 30, height: 30, border: "0.5px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
          📷<input type="file" accept="image/*" onChange={loadImage} style={{ display: "none" }} />
        </label>
        <button title="Annulla" onClick={undo} style={{ width: 30, height: 30, border: "0.5px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>↩</button>
        <button title="Cancella tutto" onClick={clearAll} style={{ width: 30, height: 30, border: "0.5px solid #DC4444", borderRadius: 6, background: "#fff", color: "#DC4444", cursor: "pointer", fontSize: 13 }}>✕</button>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", background: "#fff", cursor: activeTool === "eraser" ? "cell" : activeTool === "text" ? "text" : "crosshair" }}>
        <canvas ref={canvasRef} style={{ display: "block", touchAction: "none", width: "100%" }}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} />
        <div style={{ position: "absolute", top: 8, left: 10, fontSize: 10, color: "#888", background: "rgba(255,255,255,0.85)", padding: "2px 7px", borderRadius: 8, border: "0.5px solid #ddd", pointerEvents: "none" }}>
          {vano.nome} — {vano.misure?.lCentro || vano.larghezza || 0}×{vano.misure?.hCentro || vano.altezza || 0}mm
        </div>
        {activeTool === "arrow" && (
          <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, color: "#3B7FE0", background: "rgba(255,255,255,0.9)", padding: "2px 7px", borderRadius: 8, border: "0.5px solid #3B7FE0" }}>
            {s.arrowStart ? "Clicca 2° punto" : "Clicca 1° punto"}
          </div>
        )}
        {showQuotePopup && (
          <div style={{ position: "absolute", left: Math.min(popupPos.x, 280), top: Math.max(popupPos.y - 60, 4), background: "#fff", border: "0.5px solid #ddd", borderRadius: 8, padding: "10px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", zIndex: 10, minWidth: 150 }}>
            <div style={{ fontSize: 11, color: "#666", fontWeight: 500, marginBottom: 6 }}>Quota (mm)</div>
            <input type="number" value={quoteInput} onChange={(e) => setQuoteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmQuota()}
              style={{ width: "100%", padding: "5px 8px", border: "0.5px solid #ddd", borderRadius: 4, fontSize: 12, marginBottom: 6 }} autoFocus />
            <button onClick={confirmQuota} style={{ width: "100%", padding: "5px", background: "#1A9E73", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Aggiungi</button>
          </div>
        )}
      </div>

      {/* Salva */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onSave(canvasRef.current!.toDataURL("image/png"), s.quotes)}
          style={{ flex: 2, padding: "9px", background: "#1A9E73", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
          Salva disegno
        </button>
        <button onClick={() => { const a = document.createElement("a"); a.href = canvasRef.current!.toDataURL("image/png"); a.download = `disegno_${vano.nome}.png`; a.click(); }}
          style={{ flex: 1, padding: "9px", border: "0.5px solid #ddd", borderRadius: 8, background: "#F2F1EC", cursor: "pointer", fontSize: 13 }}>
          PNG
        </button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ───────────────────────────────────────────────────
export default function PreventivoConfiguratoreTab() {
  const {
    T,
    selectedCM,
    setCantieri,
    setSelectedCM,
    aziendaInfo,
    generaPreventivoPDF,
    generaPreventivoCondivisibile,
    calcolaVanoPrezzo,
    getVaniAttivi,
  } = useMastro();

  const c = selectedCM;
  if (!c) return null;

  // ── updCM: aggiorna commessa in cantieri + selectedCM + sync ────────────────
  function updCM(field: string, val: any) {
    setCantieri((cs: any[]) => cs.map((x: any) => x.id === c.id ? { ...x, [field]: val } : x));
    setSelectedCM((p: any) => ({ ...p, [field]: val }));
  }

  // ── Stato locale UI (non persistito su Supabase, solo UX) ─────────────────
  const [vanoExpanded, setVanoExpanded] = useState<Record<string, boolean>>({});
  const [disegnoOpen, setDisegnoOpen] = useState<Record<string, boolean>>({});
  const [praticaOpen, setPraticaOpen] = useState(false);
  const [ivaOpen, setIvaOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // ── Legge i dati della commessa (con fallback) ───────────────────────────
  const detrazione = c.detrazione || "nessuna";
  const ivaPerc = c.ivaPerc || 10;
  const scontoPerc = parseFloat(c.scontoPerc || c.sconto || 0);
  const checkedDocs = c.praticaChecklist || {};
  const uploadedFiles = c.praticaFiles || {};
  const vociLibere = c.vociLibere || [];
  const notePreventivo = c.notePreventivo || "";

  // ── Vani: usa getVaniAttivi dal context ───────────────────────────────────
  const vaniAttivi = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []);

  // ── Calcoli totale preventivo ─────────────────────────────────────────────
  const calcolaVanoPrev = (v: any) => {
    if (calcolaVanoPrezzo) return calcolaVanoPrezzo(v, c) * (v.pezzi || 1);
    return calcolaVanoPreventivo(v);
  };

  const totaleVani = vaniAttivi.reduce((s: number, v: any) => s + calcolaVanoPrev(v), 0);
  const totaleVoci = vociLibere.reduce((s: number, vl: any) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const lordo = totaleVani + totaleVoci;
  const scontoVal = lordo * scontoPerc / 100;
  const imponibile = lordo - scontoVal;
  const iva = imponibile * ivaPerc / 100;
  const totIva = imponibile + iva;

  // ── Conteggio documenti pratica ───────────────────────────────────────────
  const baseDocs = DOCS_MAP[detrazione] || [];
  const customDocs = (c.praticaDocsCustom || []) as { doc: string; obblig: boolean }[];
  const allDocs = [...baseDocs, ...customDocs];
  const obligCount = allDocs.filter((d) => d.obblig).length;
  const obligChecked = allDocs.filter((d) => d.obblig && (checkedDocs[d.doc] || uploadedFiles[d.doc])).length;
  const docCount = allDocs.filter((d) => checkedDocs[d.doc] || uploadedFiles[d.doc]).length;

  // ── Upload documento ─────────────────────────────────────────────────────
  function uploadDoc(docName: string, capture?: string) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = capture ? "image/*" : "image/*,application/pdf,.doc,.docx";
    if (capture) (inp as any).capture = capture;
    inp.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const newFiles = { ...uploadedFiles, [docName]: { name: file.name, dataUrl: reader.result, date: new Date().toISOString().split("T")[0], size: file.size } };
        updCM("praticaFiles", newFiles);
        updCM("praticaChecklist", { ...checkedDocs, [docName]: true });
        setSavedMsg("Documento salvato");
        setTimeout(() => setSavedMsg(""), 2500);
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  }

  // ── Salva disegno vano ────────────────────────────────────────────────────
  function salvaDisegnoVano(vanoId: any, dataUrl: string, quotes: any[]) {
    const newVani = vaniAttivi.map((v: any) => v.id === vanoId ? { ...v, disegno: { paths: [dataUrl], pagine: [dataUrl] }, prevDisegno: dataUrl, prevQuote: quotes } : v);
    updCM("vani", newVani);
    setDisegnoOpen((d) => ({ ...d, [vanoId]: false }));
    setSavedMsg("Disegno salvato");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  // ── Stili ─────────────────────────────────────────────────────────────────
  const card = { background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 };
  const catLabel = { fontSize: 10, fontWeight: 700 as any, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.06em", paddingTop: 10, paddingBottom: 5 };
  const inp = { padding: "7px 10px", border: `1px solid ${T.bdr}`, borderRadius: 8, fontSize: 12, background: T.bg, color: T.text, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as any };
  const sel = { ...inp };
  const pill = (active: boolean, col = T.acc) => ({
    padding: "6px 13px", border: `1px solid ${active ? col : T.bdr}`, borderRadius: 20, fontSize: 12, cursor: "pointer",
    background: active ? col : "transparent", color: active ? "#fff" : T.sub, fontWeight: active ? 700 : 400,
  });
  const toggle = (on: boolean) => ({ width: 34, height: 18, borderRadius: 9, background: on ? "#1A9E73" : T.bdr, position: "relative" as any, cursor: "pointer", flexShrink: 0, transition: "background 0.2s", display: "inline-block" as any });
  const toggleDot = (on: boolean) => ({ position: "absolute" as any, top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" });

  return (
    <div style={{ padding: "0 0 80px" }}>

      {/* Toast */}
      {savedMsg && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#1A9E73", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          {savedMsg}
        </div>
      )}

      {/* ── PRATICA FISCALE ─────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pratica fiscale</span>
            {detrazione !== "nessuna" && (
              <span style={{ background: obligChecked === obligCount && obligCount > 0 ? "#E1F5EE" : "#FAEEDA", color: obligChecked === obligCount && obligCount > 0 ? "#1A9E73" : "#D08008", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                {obligChecked === obligCount && obligCount > 0 ? `✓ ${docCount} doc` : `⚠ ${obligChecked}/${obligCount} doc obbl.`}
              </span>
            )}
          </div>
          {detrazione !== "nessuna" && (
            <button onClick={() => setPraticaOpen((o) => !o)}
              style={{ padding: "4px 12px", border: `1px solid ${T.bdr}`, borderRadius: 8, background: praticaOpen ? "#1A9E73" : T.bg, color: praticaOpen ? "#fff" : T.sub, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
              {praticaOpen ? "▲ Chiudi" : "📎 Documenti"}
            </button>
          )}
        </div>

        {/* Selezione pratica */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: praticaOpen && detrazione !== "nessuna" ? 12 : 0 }}>
          {PRATICHE.map((p) => (
            <div key={p} style={pill(detrazione === p)} onClick={() => {
              updCM("detrazione", p);
              if (p !== "nessuna") setPraticaOpen(true);
            }}>
              {PRATICHE_LABEL[p]}
            </div>
          ))}
        </div>

        {/* Pannello documenti pratica */}
        {praticaOpen && detrazione !== "nessuna" && (
          <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: 12 }}>
            {/* Progresso */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1A9E73" }}>Documenti ({obligChecked}/{obligCount} obbligatori)</span>
              <div onClick={() => {
                const nome = prompt("Nome documento aggiuntivo:");
                if (!nome) return;
                updCM("praticaDocsCustom", [...customDocs, { doc: nome, obblig: false }]);
              }} style={{ fontSize: 10, color: "#1A9E73", cursor: "pointer", padding: "3px 8px", border: "1px solid #1A9E73", borderRadius: 6, fontWeight: 700 }}>+ Aggiungi</div>
            </div>
            <div style={{ height: 4, background: T.bdr, borderRadius: 2, marginBottom: 10 }}>
              <div style={{ height: "100%", borderRadius: 2, background: obligChecked === obligCount ? "#1A9E73" : "#D08008", width: `${obligCount > 0 ? (obligChecked / obligCount) * 100 : 0}%`, transition: "width 0.3s" }} />
            </div>

            {/* Lista documenti */}
            {allDocs.map((d, di) => {
              const isChecked = !!(checkedDocs[d.doc] || uploadedFiles[d.doc]);
              const hasFile = !!uploadedFiles[d.doc];
              const isCustom = di >= baseDocs.length;
              return (
                <div key={di} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: di < allDocs.length - 1 ? `1px solid ${T.bdr}30` : "none" }}>
                  <div onClick={() => updCM("praticaChecklist", { ...checkedDocs, [d.doc]: !isChecked })}
                    style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: `1.5px solid ${isChecked ? "#1A9E73" : T.bdr}`, background: isChecked ? "#1A9E7318" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#1A9E73", fontWeight: 800 }}>
                    {isChecked ? "✓" : ""}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isChecked ? T.sub : T.text, textDecoration: isChecked ? "line-through" : "none" }}>{d.doc}</div>
                    {hasFile && <div style={{ fontSize: 9, color: "#1A9E73", marginTop: 1 }}>📎 {uploadedFiles[d.doc].name} · {uploadedFiles[d.doc].date}</div>}
                  </div>
                  {d.obblig
                    ? <span style={{ fontSize: 7, fontWeight: 800, color: "#DC4444", background: "#DC444410", padding: "2px 5px", borderRadius: 3 }}>OBBL.</span>
                    : <span style={{ fontSize: 7, fontWeight: 700, color: T.sub, background: T.bg, padding: "2px 5px", borderRadius: 3 }}>OPZ.</span>
                  }
                  <div style={{ display: "flex", gap: 3 }}>
                    <div onClick={() => uploadDoc(d.doc, "environment")} title="Scansiona" style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer", background: hasFile ? "#1A9E7312" : "#3B7FE008", border: `1px solid ${hasFile ? "#1A9E7330" : "#3B7FE020"}` }}>📷</div>
                    <div onClick={() => uploadDoc(d.doc)} title="Carica" style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer", background: hasFile ? "#1A9E7312" : `${T.acc}08`, border: `1px solid ${hasFile ? "#1A9E7330" : T.acc + "20"}` }}>📎</div>
                    {hasFile && (
                      <div onClick={() => { const f = uploadedFiles[d.doc]; if (f?.dataUrl) { const w = window.open(""); w?.document.write(`<img src="${f.dataUrl}" style="max-width:100%"/>`); } }}
                        title="Visualizza" style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer", background: "#3B7FE008", border: "1px solid #3B7FE020" }}>👁</div>
                    )}
                    {isCustom && (
                      <div onClick={() => updCM("praticaDocsCustom", customDocs.filter((_, i) => i !== di - baseDocs.length))}
                        style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer", background: "#DC444408", border: "1px solid #DC444420", color: "#DC4444" }}>✕</div>
                    )}
                  </div>
                </div>
              );
            })}
            {obligChecked === obligCount && obligCount > 0 && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#E1F5EE", borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 800, color: "#1A9E73" }}>✅ Tutti i documenti obbligatori raccolti!</div>
            )}
          </div>
        )}
      </div>

      {/* ── IVA + SCONTO ────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* IVA */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>IVA Infissi</span>
                {ivaPerc !== 22 && (
                  <span style={{ background: uploadedFiles["Autocertificazione"] ? "#E1F5EE" : "#FAEEDA", color: uploadedFiles["Autocertificazione"] ? "#1A9E73" : "#D08008", padding: "2px 6px", borderRadius: 8, fontSize: 9, fontWeight: 700 }}>
                    {uploadedFiles["Autocertificazione"] ? "✓ doc" : "⚠ doc"}
                  </span>
                )}
              </div>
              {ivaPerc !== 22 && (
                <button onClick={() => setIvaOpen((o) => !o)} style={{ padding: "3px 8px", border: `1px solid ${T.bdr}`, borderRadius: 7, background: ivaOpen ? "#3B7FE0" : T.bg, color: ivaOpen ? "#fff" : T.sub, fontSize: 10, cursor: "pointer" }}>
                  {ivaOpen ? "▲" : "📎"}
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {IVA_OPTS.map((iv) => (
                <div key={iv} style={pill(ivaPerc === iv)} onClick={() => { updCM("ivaPerc", iv); if (iv !== 22) setIvaOpen(true); }}>{iv}%</div>
              ))}
            </div>

            {/* IVA info */}
            {ivaPerc !== 22 && !ivaOpen && (
              <div style={{ marginTop: 8, padding: "6px 10px", background: "#FAEEDA", borderRadius: 6, fontSize: 10, color: "#8a6200", border: "1px solid #F5DFA0" }}>
                {ivaPerc === 4 ? "IVA 4%: prima casa o disabilità — allegare autocertificazione." : "IVA 10%: manutenzione straordinaria residenziale."}
              </div>
            )}

            {/* Pannello doc IVA */}
            {ivaOpen && ivaPerc !== 22 && (
              <div style={{ marginTop: 10, borderTop: `1px solid ${T.bdr}`, paddingTop: 10 }}>
                {(ivaPerc === 4
                  ? ["Autocertificazione prima casa / disabilita", "Visura catastale", "Contratto acquisto immobile"]
                  : ["Autocertificazione manutenzione straordinaria", "Visura catastale", "Titolo abitativo"]
                ).map((doc) => {
                  const hasFile = !!uploadedFiles[doc];
                  return (
                    <div key={doc} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: hasFile ? "#F0FBF7" : "#FEF9F0", borderRadius: 7, border: `1px solid ${hasFile ? "#B6E8D6" : "#F5DFA0"}`, marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: hasFile ? "#0F6E56" : "#8a6200" }}>{hasFile ? "✅" : "📋"} {doc}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {hasFile && (
                          <div onClick={() => { const f = uploadedFiles[doc]; if (f?.dataUrl) { const w = window.open(""); w?.document.write(`<img src="${f.dataUrl}" style="max-width:100%"/>`); } }}
                            style={{ fontSize: 10, color: "#3B7FE0", padding: "2px 7px", border: "1px solid #3B7FE0", borderRadius: 5, cursor: "pointer" }}>Apri</div>
                        )}
                        <label style={{ fontSize: 10, color: "#D08008", cursor: "pointer", padding: "2px 7px", border: "1px solid #D08008", borderRadius: 5 }}>
                          {hasFile ? "Sostituisci" : "Carica"}
                          <input type="file" accept=".pdf,.jpg,.png" style={{ display: "none" }} onChange={(e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              updCM("praticaFiles", { ...uploadedFiles, [doc]: { name: file.name, dataUrl: reader.result, date: new Date().toISOString().split("T")[0] } });
                              setSavedMsg("Documento IVA salvato"); setTimeout(() => setSavedMsg(""), 2500);
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sconto */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>Sconto globale</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {SCONTO_OPTS.map((s) => (
                <div key={s} style={pill(scontoPerc === s)} onClick={() => updCM("scontoPerc", s)}>{s === 0 ? "No" : s + "%"}</div>
              ))}
            </div>
            {scontoPerc > 0 && (
              <div style={{ marginTop: 8, padding: "8px 10px", background: "#FAEEDA", borderRadius: 8, border: "1px solid #F5DFA0" }}>
                <div style={{ fontSize: 11, color: "#8a6200" }}>Sconto: <strong>-{fmt(scontoVal)}</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── VANI (configuratore prezzi per ogni vano) ────────────────────── */}
      {vaniAttivi.map((vano: any, vi: number) => {
        const totVano = calcolaVanoPrev(vano);
        const isExp = vanoExpanded[vano.id] !== false;
        const lv = vano.misure?.lCentro || vano.larghezza || vano.l || 0;
        const hv = vano.misure?.hCentro || vano.altezza || vano.h || 0;

        // helper per aggiornare un singolo vano nella commessa
        const updV = (patch: any) => {
          const newVani = vaniAttivi.map((v: any) => v.id === vano.id ? { ...v, ...patch } : v);
          updCM("vani", newVani);
        };

        return (
          <div key={vano.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
            {/* Header vano */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", padding: "12px 14px", borderBottom: isExp ? `1px solid ${T.bdr}` : "none" }}
              onClick={() => setVanoExpanded((e) => ({ ...e, [vano.id]: !isExp }))}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A9E73", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{vi + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                    {vano.nome || `Vano ${vi + 1}`} <span style={{ fontWeight: 400, fontSize: 11, color: T.sub }}>{vano.tipo || vano.settore} · {vano.pezzi || vano.nPezzi || 1}pz</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>{lv}×{hv}mm{vano.sistema ? ` · ${vano.sistema}` : ""}{vano.coloreEsterno ? ` · ${vano.coloreEsterno}` : ""}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A9E73" }}>{fmt(totVano)}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{fmt(totVano / (vano.pezzi || vano.nPezzi || 1))}/pz</div>
              </div>
            </div>

            {/* Corpo vano espandibile */}
            {isExp && (
              <div style={{ padding: "12px 14px" }}>

                {/* PREZZO INFISSO */}
                <div style={catLabel}>Prezzo infisso</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>Prezzo unitario (€)</label>
                    <input type="number" style={inp} value={vano.prezzoUnitario || vano.prezzoTotale || 0}
                      onChange={(e) => updV({ prezzoUnitario: Number(e.target.value), prezzoTotale: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>N. pezzi</label>
                    <input type="number" style={inp} value={vano.pezzi || vano.nPezzi || 1}
                      onChange={(e) => updV({ pezzi: Number(e.target.value), nPezzi: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>Subtotale</label>
                    <div style={{ ...inp, background: T.bg, color: "#1A9E73", fontWeight: 700 }}>{fmt((vano.prezzoUnitario || vano.prezzoTotale || 0) * (vano.pezzi || vano.nPezzi || 1))}</div>
                  </div>
                </div>

                {/* TAPPARELLA */}
                <div style={catLabel}>Accessori</div>
                <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.bdr}30` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: T.sub }}>└</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, minWidth: 80 }}>Tapparella</span>
                      <select style={{ fontSize: 11, padding: "3px 7px", border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.bg, color: T.text }}
                        value={(vano.accessori as any)?.tapparella?.tipo || vano.tapparella?.tipo || "Non inclusa"}
                        onChange={(e) => {
                          const included = e.target.value !== "Non inclusa";
                          updV({ tapparella: { ...vano.tapparella, tipo: e.target.value, inclusa: included, attivo: included } });
                        }}>
                        {TIPI_TAPPARELLA.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {(vano.tapparella?.inclusa || vano.tapparella?.attivo) && (
                        <span style={{ background: "#E1F5EE", color: "#1A9E73", padding: "2px 7px", borderRadius: 8, fontSize: 9, fontWeight: 700 }}>incluso</span>
                      )}
                      <div style={toggle(vano.tapparella?.inclusa || vano.tapparella?.attivo)} onClick={() => updV({ tapparella: { ...vano.tapparella, inclusa: !vano.tapparella?.inclusa, attivo: !vano.tapparella?.attivo } })}>
                        <div style={toggleDot(vano.tapparella?.inclusa || vano.tapparella?.attivo)} />
                      </div>
                    </div>
                  </div>
                  {/* Dettagli tapparella espansi */}
                  {(vano.tapparella?.inclusa || vano.tapparella?.attivo) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6, paddingLeft: 22, paddingTop: 8 }}>
                      {[
                        { k: "colore", lbl: "Colore", type: "select", opts: ["Bianco", "RAL 7016", "RAL 9005", "Beige", "Marrone"] },
                        { k: "larghezza", lbl: "Larg. (mm)", type: "number", placeholder: String(lv) },
                        { k: "altezza", lbl: "Alt. (mm)", type: "number", placeholder: String(Math.round(hv * 0.6)) },
                        { k: "spessore", lbl: "Spessore", type: "select", opts: ["8mm", "10mm", "14mm"] },
                        { k: "prezzo", lbl: "Prezzo (€)", type: "number" },
                      ].map(({ k, lbl, type, opts, placeholder }) => (
                        <div key={k}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 600, display: "block", marginBottom: 2 }}>{lbl}</label>
                          {type === "select"
                            ? <select style={{ ...sel, fontSize: 10, padding: "3px 5px" }} value={vano.tapparella?.[k] || (opts as string[])[0]} onChange={(e) => updV({ tapparella: { ...vano.tapparella, [k]: e.target.value } })}>{(opts as string[]).map((o) => <option key={o}>{o}</option>)}</select>
                            : <input type="number" style={{ ...inp, fontSize: 11, padding: "3px 6px" }} value={vano.tapparella?.[k] || ""} placeholder={placeholder || "0"} onChange={(e) => updV({ tapparella: { ...vano.tapparella, [k]: Number(e.target.value) } })} />
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ZANZARIERA */}
                <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.bdr}30` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: T.sub }}>└</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, minWidth: 80 }}>Zanzariera</span>
                      <select style={{ fontSize: 11, padding: "3px 7px", border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.bg, color: T.text }}
                        value={(vano.accessori as any)?.zanzariera?.tipo || vano.zanzariera?.tipo || "Non inclusa"}
                        onChange={(e) => {
                          const included = e.target.value !== "Non inclusa";
                          updV({ zanzariera: { ...vano.zanzariera, tipo: e.target.value, inclusa: included, attivo: included } });
                        }}>
                        {TIPI_ZANZARIERA.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {(vano.zanzariera?.inclusa || vano.zanzariera?.attivo) && (
                        <span style={{ background: "#E1F5EE", color: "#1A9E73", padding: "2px 7px", borderRadius: 8, fontSize: 9, fontWeight: 700 }}>incluso</span>
                      )}
                      <div style={toggle(vano.zanzariera?.inclusa || vano.zanzariera?.attivo)} onClick={() => updV({ zanzariera: { ...vano.zanzariera, inclusa: !vano.zanzariera?.inclusa, attivo: !vano.zanzariera?.attivo } })}>
                        <div style={toggleDot(vano.zanzariera?.inclusa || vano.zanzariera?.attivo)} />
                      </div>
                    </div>
                  </div>
                  {(vano.zanzariera?.inclusa || vano.zanzariera?.attivo) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6, paddingLeft: 22, paddingTop: 8 }}>
                      {[
                        { k: "colore", lbl: "Colore", type: "select", opts: ["Bianco", "RAL 7016", "Bronzo", "Argento", "Marrone"] },
                        { k: "larghezza", lbl: "Larg. (mm)", type: "number", placeholder: String(lv) },
                        { k: "altezza", lbl: "Alt. (mm)", type: "number", placeholder: String(hv) },
                        { k: "rete", lbl: "Rete", type: "select", opts: ["Standard", "Anti-polline", "Anti-insetti", "Rinforzata"] },
                        { k: "prezzo", lbl: "Prezzo (€)", type: "number" },
                      ].map(({ k, lbl, type, opts, placeholder }) => (
                        <div key={k}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 600, display: "block", marginBottom: 2 }}>{lbl}</label>
                          {type === "select"
                            ? <select style={{ ...sel, fontSize: 10, padding: "3px 5px" }} value={vano.zanzariera?.[k] || (opts as string[])[0]} onChange={(e) => updV({ zanzariera: { ...vano.zanzariera, [k]: e.target.value } })}>{(opts as string[]).map((o) => <option key={o}>{o}</option>)}</select>
                            : <input type="number" style={{ ...inp, fontSize: 11, padding: "3px 6px" }} value={vano.zanzariera?.[k] || ""} placeholder={placeholder || "0"} onChange={(e) => updV({ zanzariera: { ...vano.zanzariera, [k]: Number(e.target.value) } })} />
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* POSA */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>Posa</label>
                    <select style={sel} value={vano.posa || "Inclusa"} onChange={(e) => updV({ posa: e.target.value })}>
                      {["Inclusa", "Esclusa", "Voce separata"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>Smontaggio</label>
                    <select style={sel} value={vano.smontaggio || "Non richiesto"} onChange={(e) => updV({ smontaggio: e.target.value })}>
                      {["Non richiesto", "Incluso", "Voce separata"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>Prezzo posa (€)</label>
                    <input type="number" style={inp} value={vano.prezzoPosa || 0} onChange={(e) => updV({ prezzoPosa: Number(e.target.value) })} />
                  </div>
                </div>

                {/* NOTE VANO */}
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 10, color: T.sub, fontWeight: 600, display: "block", marginBottom: 3 }}>Note vano</label>
                  <textarea rows={2} style={{ ...inp, resize: "none", fontSize: 11 }} placeholder="Note specifiche per questo vano..." value={vano.noteVano || vano.note || ""} onChange={(e) => updV({ noteVano: e.target.value, note: e.target.value })} />
                </div>

                {/* DISEGNO LIBERO */}
                <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: 12, paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: disegnoOpen[vano.id] ? "#1A9E73" : T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✏️</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Disegno libero vano</div>
                        <div style={{ fontSize: 10, color: T.sub }}>
                          {(vano.disegno?.pagine?.length || vano.prevDisegno)
                            ? `Salvato${vano.prevQuote?.length ? ` · ${vano.prevQuote.length} quote` : ""}`
                            : "Disegna a mano, carica foto, annota quote"}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setDisegnoOpen((d) => ({ ...d, [vano.id]: !d[vano.id] }))}
                      style={{ padding: "6px 14px", border: `1px solid ${disegnoOpen[vano.id] ? "#1A9E73" : "#1A9E73"}`, borderRadius: 8, background: disegnoOpen[vano.id] ? "#1A9E73" : "#E1F5EE", cursor: "pointer", fontSize: 12, fontWeight: 700, color: disegnoOpen[vano.id] ? "#fff" : "#1A9E73" }}>
                      {disegnoOpen[vano.id] ? "▲ Chiudi" : "✏️ Apri disegno"}
                    </button>
                  </div>
                  {/* Anteprima */}
                  {(vano.prevDisegno || vano.disegno?.pagine?.[0]) && !disegnoOpen[vano.id] && (
                    <div style={{ border: `1px solid ${T.bdr}`, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                      <img src={vano.prevDisegno || vano.disegno?.pagine?.[0]} alt="Disegno" style={{ width: "100%", display: "block" }} />
                    </div>
                  )}
                  {/* Canvas */}
                  {disegnoOpen[vano.id] && (
                    <div style={{ border: `1px solid #1A9E73`, borderRadius: 10, padding: 10, background: "#F9FEF9", marginTop: 10 }}>
                      <DisegnoCanvas vano={{ ...vano, larghezza: lv, altezza: hv, disegno: vano.prevDisegno || null }}
                        onSave={(dataUrl, quotes) => salvaDisegnoVano(vano.id, dataUrl, quotes)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── VOCI LIBERE ─────────────────────────────────────────────────── */}
      {vociLibere.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Voci aggiuntive</div>
          {vociLibere.map((vl: any, vli: number) => (
            <div key={vl.id || vli} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <input style={{ ...inp, flex: 3 }} placeholder="Descrizione..." value={vl.desc || ""} onChange={(e) => {
                const nv = vociLibere.map((x: any, i: number) => i === vli ? { ...x, desc: e.target.value } : x);
                updCM("vociLibere", nv);
              }} />
              <input type="number" style={{ ...inp, flex: 1 }} placeholder="€" value={vl.importo || 0} onChange={(e) => {
                const nv = vociLibere.map((x: any, i: number) => i === vli ? { ...x, importo: Number(e.target.value) } : x);
                updCM("vociLibere", nv);
              }} />
              <div onClick={() => updCM("vociLibere", vociLibere.filter((_: any, i: number) => i !== vli))}
                style={{ fontSize: 16, color: "#DC4444", cursor: "pointer", padding: "0 4px" }}>✕</div>
            </div>
          ))}
        </div>
      )}

      <div onClick={() => updCM("vociLibere", [...vociLibere, { id: Date.now(), desc: "", importo: 0, qta: 1 }])}
        style={{ padding: "10px 14px", border: `1.5px dashed ${T.bdr}`, borderRadius: 10, textAlign: "center", cursor: "pointer", color: T.sub, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
        + Aggiungi voce
      </div>

      {/* ── NOTE PREVENTIVO ─────────────────────────────────────────────── */}
      <div style={card}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 6 }}>Note preventivo</label>
        <textarea rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} placeholder="Condizioni, garanzie, validita offerta..." value={notePreventivo} onChange={(e) => updCM("notePreventivo", e.target.value)} />
      </div>

      {/* ── TOTALI ──────────────────────────────────────────────────────── */}
      <div style={card}>
        {scontoPerc > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#D08008", marginBottom: 6 }}><span>Sconto {scontoPerc}%</span><span>-{fmt(scontoVal)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 6 }}><span>Imponibile</span><span>{fmt(imponibile)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 12 }}><span>IVA {ivaPerc}%</span><span>{fmt(iva)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, paddingTop: 12, borderTop: `2px solid ${T.text}`, color: T.text }}>
          <span>TOTALE</span><span style={{ color: "#1A9E73" }}>{fmt(totIva)}</span>
        </div>
        {parseFloat(c.accontoRicevuto || 0) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#1A9E73", marginTop: 8, fontWeight: 700 }}>
            <span>Saldo da incassare</span><span>{fmt(totIva - parseFloat(c.accontoRicevuto))}</span>
          </div>
        )}
      </div>

      {/* ── FIRMA + PDF ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => generaPreventivoPDF && generaPreventivoPDF(c)}
          style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1A9E73,#0F6E56)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          📄 Genera PDF preventivo
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => generaPreventivoCondivisibile && generaPreventivoCondivisibile(c)}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            👁 Anteprima link
          </button>
          <button onClick={() => {
            const acconto = prompt("Acconto ricevuto (€):", c.accontoRicevuto || "0");
            if (acconto !== null) updCM("accontoRicevuto", parseFloat(acconto) || 0);
          }} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            💶 Acconto {c.accontoRicevuto > 0 ? fmt(c.accontoRicevuto) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
