"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — PreventivoConfiguratoreTab v2
// Tab preventivo completo: misure, accessori catalogo, prezzo
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FM } from "./mastro-constants";

// ── Palette colori ──
const GRN = "#1A9E73";
const AMB = "#D08008";
const RED = "#DC4444";
const ACC_COLOR = "#8B5CF6"; // viola per accessori catalogo
const BLU = "#3B7FE0";

// ── Helpers ──
const fmt = (n: number) => n?.toFixed(2).replace(".", ",") ?? "0,00";
const fmtInt = (n: number) => Math.round(n ?? 0).toLocaleString("it-IT");

// ── Input numerico che mostra vuoto se 0 ──
function NumInput({ value, onChange, placeholder = "0", style = {} }: any) {
  const [local, setLocal] = useState(value > 0 ? String(value) : "");
  useEffect(() => { setLocal(value > 0 ? String(value) : ""); }, [value]);
  return (
    <input
      type="number"
      value={local}
      placeholder={placeholder}
      onChange={e => { setLocal(e.target.value); onChange(e.target.value === "" ? 0 : Number(e.target.value)); }}
      style={{ fontFamily: FM, textAlign: "right", ...style }}
    />
  );
}

// ── Label sezione ──
function SectionLabel({ children }: any) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, marginTop: 2 }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CANVAS DISEGNO LIBERO
// ═══════════════════════════════════════════════════════
function DisegnoLiberoModal({ vano, onSave, onClose, T }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1A1A1C");
  const [size, setSize] = useState(2);
  const [drawing, setDrawing] = useState(false);
  const [paths, setPaths] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const lastPt = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Griglia
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    // Ripristina paths
    if (vano.prevPaths) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = vano.prevPaths;
    }
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] ?? e;
    return { x: (touch.clientX - rect.left) * (canvas.width / rect.width), y: (touch.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pt = getPos(e, canvas);
    setDrawing(true);
    lastPt.current = pt;
    ctx.beginPath();
    ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
    ctx.lineWidth = tool === "eraser" ? 18 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(pt.x, pt.y);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pt = getPos(e, canvas);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPt.current = pt;
  };

  const endDraw = (e: any) => {
    e.preventDefault();
    setDrawing(false);
    const canvas = canvasRef.current!;
    setUndoStack(s => [...s, canvas.toDataURL()]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 2];
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (prev) {
      const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = prev;
    } else {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setUndoStack(s => s.slice(0, -1));
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current!.toDataURL();
    onSave(dataUrl);
  };

  const loadPhoto = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const TOOLS = [
    { id: "pen", label: "✏️" }, { id: "eraser", label: "⬜" },
  ];
  const COLORS = ["#1A1A1C", RED, GRN, AMB, BLU, "#fff"];
  const SIZES = [1, 2, 4, 8];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 500, margin: "0 auto", background: T.card, borderRadius: "16px 16px 0 0", display: "flex", flexDirection: "column", maxHeight: "95vh" }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.bdr, margin: "8px auto 4px" }} />

        {/* Header */}
        <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.bdr}` }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: AMB }}>✏️ Disegno libero — {vano.nome}</div>
          <div onClick={onClose} style={{ fontSize: 20, cursor: "pointer", color: T.sub }}>×</div>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
          {TOOLS.map(t => (
            <div key={t.id} onClick={() => setTool(t.id)} style={{
              padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 16,
              background: tool === t.id ? AMB + "20" : T.bg, border: `2px solid ${tool === t.id ? AMB : T.bdr}`
            }}>{t.label}</div>
          ))}
          <div style={{ width: 1, height: 24, background: T.bdr }} />
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{
              width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
              border: `3px solid ${color === c ? AMB : T.bdr}`, boxShadow: c === "#fff" ? `inset 0 0 0 1px ${T.bdr}` : "none"
            }} />
          ))}
          <div style={{ width: 1, height: 24, background: T.bdr }} />
          {SIZES.map(s => (
            <div key={s} onClick={() => setSize(s)} style={{
              width: 28, height: 28, borderRadius: 6, background: size === s ? AMB + "20" : T.bg,
              border: `2px solid ${size === s ? AMB : T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
              <div style={{ width: s * 2.5, height: s * 2.5, borderRadius: "50%", background: color }} />
            </div>
          ))}
          <div style={{ width: 1, height: 24, background: T.bdr }} />
          <label style={{ padding: "6px 10px", borderRadius: 8, background: BLU + "15", border: `1px solid ${BLU}40`, fontSize: 11, fontWeight: 700, color: BLU, cursor: "pointer" }}>
            📷 Foto
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={loadPhoto} />
          </label>
          <div onClick={undo} style={{ padding: "6px 10px", borderRadius: 8, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 11, fontWeight: 700, color: T.sub, cursor: "pointer" }}>↩ Undo</div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          <canvas
            ref={canvasRef}
            width={460} height={320}
            style={{ width: "100%", borderRadius: 10, border: `1px solid ${T.bdr}`, touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair", background: "#fff" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px 28px", borderTop: `1px solid ${T.bdr}`, display: "flex", gap: 8 }}>
          <div onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 14, fontWeight: 700, color: T.sub, cursor: "pointer" }}>Annulla</div>
          <div onClick={handleSave} style={{ flex: 2, padding: "12px", borderRadius: 12, textAlign: "center", background: GRN, fontSize: 14, fontWeight: 900, color: "#fff", cursor: "pointer" }}>✓ Salva disegno</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEZIONE ACCESSORI CATALOGO (integrata nel tab)
// ═══════════════════════════════════════════════════════
const CATEGORIE_LABEL = [
  { id: "maniglie", nome: "Maniglie", icon: "🚪" },
  { id: "cremonesi", nome: "Cremonesi", icon: "🔩" },
  { id: "cerniere", nome: "Cerniere", icon: "📎" },
  { id: "ferramenta_ar", nome: "Ferr. AR", icon: "🔧" },
  { id: "serrature", nome: "Serrature", icon: "🔐" },
  { id: "cilindri", nome: "Cilindri", icon: "🔑" },
  { id: "maniglioni", nome: "Maniglioni", icon: "🚨" },
  { id: "soglie", nome: "Soglie", icon: "▬" },
  { id: "motorizzazioni", nome: "Motoriz.", icon: "⚡" },
  { id: "controtelai", nome: "Controtel.", icon: "🏗" },
  { id: "varie", nome: "Varie", icon: "🔩" },
];

function AccessoriCatalogoSection({ vano, updV, T }: any) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const items: any[] = vano.accessoriCatalogo || [];
  const totale = items.reduce((s, a) => s + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);

  // Catalogo interno minimale (le voci che vediamo nelle commesse)
  // In produzione importa da catalogo-accessori-default
  const CATALOGO_QUICK = [
    { id: "MI-001", categoria: "maniglie", codice: "3060", nome: "Martellina Karma DK", fornitore: "Master Italy", prezzo: 18, unitaMisura: "pz" },
    { id: "MI-002", categoria: "maniglie", codice: "3060K", nome: "Martellina Karma DK con chiave", fornitore: "Master Italy", prezzo: 25, unitaMisura: "pz" },
    { id: "MI-003", categoria: "maniglie", codice: "3060R", nome: "Martellina Karma Ribassata", fornitore: "Master Italy", prezzo: 20, unitaMisura: "pz" },
    { id: "MI-004", categoria: "maniglie", codice: "3067", nome: "Doppia Maniglia Karma", fornitore: "Master Italy", prezzo: 32, unitaMisura: "pz" },
    { id: "MI-005", categoria: "maniglie", codice: "3060MD", nome: "Martellina Karma Minimal Design", fornitore: "Master Italy", prezzo: 22, unitaMisura: "pz" },
    { id: "CR-001", categoria: "cremonesi", codice: "6065", nome: "Cremonese Karma Apertura Esterna", fornitore: "Master Italy", prezzo: 28, unitaMisura: "pz" },
    { id: "CR-002", categoria: "cremonesi", codice: "6060", nome: "Cremonese Karma Standard", fornitore: "Master Italy", prezzo: 22, unitaMisura: "pz" },
    { id: "CR-003", categoria: "cremonesi", codice: "6060L", nome: "Cremonese Karma Logica", fornitore: "Master Italy", prezzo: 35, unitaMisura: "pz" },
    { id: "SE-001", categoria: "serrature", codice: "CISA-1", nome: "Serratura CISA Standard", fornitore: "CISA", prezzo: 45, unitaMisura: "pz" },
    { id: "SE-002", categoria: "serrature", codice: "CISA-2", nome: "Serratura CISA Blindata", fornitore: "CISA", prezzo: 89, unitaMisura: "pz" },
    { id: "CI-001", categoria: "cilindri", codice: "CIL-1", nome: "Cilindro europeo standard", fornitore: "Yale", prezzo: 28, unitaMisura: "pz" },
    { id: "CI-002", categoria: "cilindri", codice: "CIL-2", nome: "Cilindro europeo alta sicurezza", fornitore: "Yale", prezzo: 65, unitaMisura: "pz" },
    { id: "CE-001", categoria: "cerniere", codice: "CER-1", nome: "Cerniera MACO standard", fornitore: "MACO", prezzo: 12, unitaMisura: "pz" },
    { id: "CE-002", categoria: "cerniere", codice: "CER-2", nome: "Cerniera MACO con molla", fornitore: "MACO", prezzo: 18, unitaMisura: "pz" },
    { id: "MO-001", categoria: "motorizzazioni", codice: "MOT-1", nome: "Motorizzazione tapparella 230V", fornitore: "Generico", prezzo: 120, unitaMisura: "pz" },
    { id: "MO-002", categoria: "motorizzazioni", codice: "MOT-2", nome: "Motorizzazione radio 433MHz", fornitore: "Generico", prezzo: 155, unitaMisura: "pz" },
    { id: "CT-001", categoria: "controtelai", codice: "CT-STD", nome: "Controtelaio standard", fornitore: "Generico", prezzo: 35, unitaMisura: "pz" },
    { id: "SG-001", categoria: "soglie", codice: "SOG-1", nome: "Soglia alluminio standard", fornitore: "Generico", prezzo: 22, unitaMisura: "ml" },
    { id: "VA-001", categoria: "varie", codice: "MIN-1", nome: "Kit minuteria", fornitore: "Generico", prezzo: 8, unitaMisura: "kit" },
    { id: "VA-002", categoria: "varie", codice: "SIG-1", nome: "Silicone neutro", fornitore: "Generico", prezzo: 5, unitaMisura: "pz" },
  ];

  const filtered = CATALOGO_QUICK.filter(p => {
    const qOk = !query || p.nome.toLowerCase().includes(query.toLowerCase()) || p.codice.toLowerCase().includes(query.toLowerCase());
    const cOk = !catFilter || p.categoria === catFilter;
    return qOk && cOk;
  });

  const addItem = (p: any) => {
    const existing = items.find(a => a.catalogoId === p.id);
    if (existing) {
      updV({ accessoriCatalogo: items.map(a => a.catalogoId === p.id ? { ...a, quantita: a.quantita + 1 } : a) });
    } else {
      updV({ accessoriCatalogo: [...items, { catalogoId: p.id, codice: p.codice, nome: p.nome, fornitore: p.fornitore, quantita: 1, prezzoUnitario: p.prezzo, unitaMisura: p.unitaMisura, nota: "" }] });
    }
  };

  const updateQta = (catalogoId: string, delta: number) => {
    const updated = items.map(a => a.catalogoId !== catalogoId ? a : { ...a, quantita: Math.max(0, (a.quantita || 1) + delta) }).filter(a => a.quantita > 0);
    updV({ accessoriCatalogo: updated });
  };

  const updatePrezzo = (catalogoId: string, val: number) => {
    updV({ accessoriCatalogo: items.map(a => a.catalogoId !== catalogoId ? a : { ...a, prezzoUnitario: val }) });
  };

  const removeItem = (catalogoId: string) => updV({ accessoriCatalogo: items.filter(a => a.catalogoId !== catalogoId) });

  return (
    <div style={{ marginTop: 12 }}>
      <SectionLabel>🏷 Accessori catalogo</SectionLabel>

      {/* Items aggiunti */}
      {items.map(a => (
        <div key={a.catalogoId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: T.bg, borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
            <div style={{ fontSize: 9, color: T.sub }}>{a.codice} · {a.fornitore}</div>
          </div>
          {/* Quantità */}
          <div style={{ display: "flex", alignItems: "center", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}` }}>
            <div onClick={() => updateQta(a.catalogoId, -1)} style={{ padding: "5px 9px", cursor: "pointer", fontSize: 14, fontWeight: 800, color: T.sub }}>−</div>
            <div style={{ padding: "5px 6px", fontSize: 12, fontWeight: 800, fontFamily: FM, color: T.text, minWidth: 18, textAlign: "center" }}>{a.quantita}</div>
            <div onClick={() => updateQta(a.catalogoId, 1)} style={{ padding: "5px 9px", cursor: "pointer", fontSize: 14, fontWeight: 800, color: ACC_COLOR }}>+</div>
          </div>
          {/* Prezzo unitario editabile */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10, color: T.sub }}>€</span>
            <input
              type="number"
              value={a.prezzoUnitario || 0}
              onChange={e => updatePrezzo(a.catalogoId, Number(e.target.value))}
              style={{ width: 52, padding: "5px 4px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FM, textAlign: "right", background: T.bg, color: T.text }}
            />
          </div>
          {/* Subtotale */}
          <div style={{ fontSize: 11, fontWeight: 800, color: ACC_COLOR, fontFamily: FM, minWidth: 46, textAlign: "right" }}>
            €{fmt((a.prezzoUnitario || 0) * (a.quantita || 1))}
          </div>
          <div onClick={() => removeItem(a.catalogoId)} style={{ padding: "4px 6px", cursor: "pointer", fontSize: 14, color: RED, fontWeight: 800 }}>×</div>
        </div>
      ))}

      {items.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "2px 4px 6px", fontSize: 11 }}>
          <span style={{ fontWeight: 800, color: ACC_COLOR, fontFamily: FM }}>Totale accessori: €{fmt(totale)}</span>
        </div>
      )}

      {/* Bottone aggiungi */}
      <div onClick={() => { setShowSearch(true); setQuery(""); setCatFilter(""); }}
        style={{ padding: "10px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: ACC_COLOR + "10", border: `1.5px dashed ${ACC_COLOR}40`, fontSize: 12, fontWeight: 700, color: ACC_COLOR }}>
        + Aggiungi accessorio da catalogo
      </div>

      {/* Bottom sheet ricerca */}
      {showSearch && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }} onClick={() => setShowSearch(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, margin: "0 auto", background: T.card, borderRadius: "16px 16px 0 0", maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.bdr, margin: "8px auto 4px" }} />
            <div style={{ padding: "8px 16px 10px" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: ACC_COLOR, marginBottom: 8 }}>🏷 Catalogo accessori</div>
              <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Cerca nome o codice..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${ACC_COLOR}40`, fontSize: 13, fontFamily: "Inter", background: T.bg, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4, marginTop: 8 }}>
                <div onClick={() => setCatFilter("")} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: !catFilter ? ACC_COLOR : T.bg, color: !catFilter ? "#fff" : T.sub, border: `1px solid ${!catFilter ? ACC_COLOR : T.bdr}` }}>Tutti</div>
                {CATEGORIE_LABEL.map(c => (
                  <div key={c.id} onClick={() => setCatFilter(catFilter === c.id ? "" : c.id)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", background: catFilter === c.id ? ACC_COLOR + "15" : T.bg, color: catFilter === c.id ? ACC_COLOR : T.sub, border: `1px solid ${catFilter === c.id ? ACC_COLOR + "40" : T.bdr}` }}>
                    {c.icon} {c.nome}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 80px" }}>
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: T.sub, fontSize: 11 }}>Nessun risultato</div>}
              {filtered.map(p => {
                const already = items.some(a => a.catalogoId === p.id);
                return (
                  <div key={p.id} onClick={() => addItem(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: already ? ACC_COLOR + "06" : T.card, borderRadius: 10, border: `1px solid ${already ? ACC_COLOR + "30" : T.bdr}`, marginBottom: 4, cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{p.nome}</div>
                      <div style={{ fontSize: 9, color: T.sub }}>{p.codice} · {p.fornitore}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ACC_COLOR, fontFamily: FM }}>€{p.prezzo}</div>
                      <div style={{ fontSize: 8, color: T.sub }}>/{p.unitaMisura}</div>
                    </div>
                    {already && <div style={{ fontSize: 10, fontWeight: 800, color: GRN, background: GRN + "15", padding: "3px 8px", borderRadius: 6 }}>✓</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "12px 16px 28px", background: T.card, borderTop: `1px solid ${T.bdr}` }}>
              <div onClick={() => setShowSearch(false)} style={{ padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: ACC_COLOR, color: "#fff", fontSize: 14, fontWeight: 900 }}>
                Fatto ({items.length} selezionati · €{fmt(totale)})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CARD VANO — tutto il dettaglio editabile
// ═══════════════════════════════════════════════════════
function VanoCard({ vano, idx, updVano, calcolaVanoPrezzo, selectedCM, T }: any) {
  const [open, setOpen] = useState(idx === 0);
  const [showDisegno, setShowDisegno] = useState(false);

  const m = vano.misure || {};
  const pezzi = vano.pezzi || 1;

  // Prezzo base dal context
  const prezzoBase = calcolaVanoPrezzo ? calcolaVanoPrezzo(vano, selectedCM) : 0;
  // Prezzo override manuale
  const prezzoOverride = vano.prevPrezzoOverride;
  const prezzoUnitario = prezzoOverride !== undefined && prezzoOverride !== null ? prezzoOverride : prezzoBase;
  const accCat = (vano.accessoriCatalogo || []).reduce((s: number, a: any) => s + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);
  const posaPrezzo = vano.prevPosaPrezzo || 0;
  const smontaggio = vano.prevSmontaggio || 0;
  const subtotale = (prezzoUnitario * pezzi) + accCat + posaPrezzo + smontaggio;

  const updV = (patch: any) => updVano(vano.id, patch);

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: "Inter",
    background: T.bg, color: T.text, boxSizing: "border-box" as const,
  };

  const labelStyle = { fontSize: 9, fontWeight: 700, color: "#8e8e93", letterSpacing: 0.8, textTransform: "uppercase" as const, marginBottom: 3, display: "block" };

  return (
    <>
      {showDisegno && (
        <DisegnoLiberoModal
          vano={vano} T={T}
          onSave={(dataUrl: string) => { updV({ prevPaths: dataUrl }); setShowDisegno(false); }}
          onClose={() => setShowDisegno(false)}
        />
      )}

      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${open ? GRN + "40" : T.bdr}`, marginBottom: 10, overflow: "hidden" }}>
        {/* Header vano */}
        <div onClick={() => setOpen(!open)} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: open ? GRN + "06" : "transparent" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: GRN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{idx + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{vano.nome || `Vano ${idx + 1}`}
              {vano.tipo && <span style={{ fontSize: 10, fontWeight: 600, color: T.sub, marginLeft: 6 }}>{vano.tipo}</span>}
              {pezzi > 1 && <span style={{ fontSize: 10, fontWeight: 700, color: GRN, marginLeft: 4 }}>×{pezzi}</span>}
            </div>
            <div style={{ fontSize: 10, color: T.sub }}>
              {m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro}mm` : "Misure da inserire"}
              {vano.coloreInt ? ` · ${vano.coloreInt}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: GRN, fontFamily: FM }}>€{fmt(subtotale)}</div>
            <div style={{ fontSize: 9, color: T.sub, fontFamily: FM }}>€{fmt(prezzoUnitario)}/pz</div>
          </div>
          <div style={{ fontSize: 14, color: T.sub, transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "0.2s" }}>▾</div>
        </div>

        {open && (
          <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${T.bdr}` }}>

            {/* ── MISURE ── */}
            <div style={{ marginTop: 12 }}>
              <SectionLabel>📐 Misure (mm)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[
                  { k: "lCentro", label: "L. Centro" },
                  { k: "hCentro", label: "H. Centro" },
                  { k: "lForo", label: "L. Foro" },
                  { k: "hForo", label: "H. Foro" },
                  { k: "lMuro", label: "L. Muro" },
                  { k: "hMuro", label: "H. Muro" },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type="number"
                      value={m[k] || ""}
                      placeholder="0"
                      onChange={e => updV({ misure: { ...m, [k]: Number(e.target.value) } })}
                      style={{ ...inputStyle }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                {[
                  { k: "davProf", label: "Dav. Prof" },
                  { k: "davSporg", label: "Dav. Sporg" },
                  { k: "soglia", label: "Soglia" },
                  { k: "imbotte", label: "Imbotte" },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type="number"
                      value={m[k] || ""}
                      placeholder="0"
                      onChange={e => updV({ misure: { ...m, [k]: Number(e.target.value) } })}
                      style={{ ...inputStyle }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── PREZZO INFISSO ── */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>💰 Prezzo infisso</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Prezzo unitario (€)</label>
                  <input
                    type="number"
                    value={prezzoOverride !== undefined && prezzoOverride !== null ? prezzoOverride : (prezzoBase || "")}
                    placeholder={prezzoBase > 0 ? `Auto: €${fmt(prezzoBase)}` : "0"}
                    onChange={e => updV({ prevPrezzoOverride: e.target.value === "" ? null : Number(e.target.value) })}
                    style={{ ...inputStyle, borderColor: prezzoOverride !== undefined && prezzoOverride !== null ? AMB : T.bdr }}
                  />
                  {prezzoOverride !== null && prezzoOverride !== undefined && (
                    <div onClick={() => updV({ prevPrezzoOverride: null })} style={{ fontSize: 9, color: T.sub, cursor: "pointer", marginTop: 2 }}>↩ Ripristina auto (€{fmt(prezzoBase)})</div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>N. pezzi</label>
                  <input
                    type="number"
                    value={pezzi > 1 ? pezzi : ""}
                    placeholder="1"
                    min={1}
                    onChange={e => updV({ pezzi: e.target.value === "" ? 1 : Math.max(1, Number(e.target.value)) })}
                    style={{ ...inputStyle }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Subtotale infisso</label>
                  <div style={{ padding: "8px 10px", borderRadius: 8, background: GRN + "12", border: `1px solid ${GRN}40`, fontSize: 13, fontWeight: 900, color: GRN, fontFamily: FM }}>
                    €{fmt(prezzoUnitario * pezzi)}
                  </div>
                </div>
              </div>
            </div>

            {/* ── TAPPARELLA ── */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>⬇ Tapparella</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <select value={(vano.accessori?.tapparella?.tipo) || "Non inclusa"}
                  onChange={e => updV({ accessori: { ...vano.accessori, tapparella: { ...(vano.accessori?.tapparella || {}), tipo: e.target.value, attivo: e.target.value !== "Non inclusa" } } })}
                  style={{ ...inputStyle, flex: 1 }}>
                  <option>Non inclusa</option>
                  <option>Motorizzata</option>
                  <option>Manuale</option>
                  <option>Avvolgibile</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: T.sub }}>Inclusa</span>
                  <div onClick={() => updV({ accessori: { ...vano.accessori, tapparella: { ...(vano.accessori?.tapparella || {}), inclusa: !vano.accessori?.tapparella?.inclusa } } })}
                    style={{ width: 40, height: 22, borderRadius: 11, background: vano.accessori?.tapparella?.inclusa ? GRN : T.bdr, position: "relative", cursor: "pointer", transition: "0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: vano.accessori?.tapparella?.inclusa ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "0.2s" }} />
                  </div>
                </div>
              </div>
              {vano.accessori?.tapparella?.attivo && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { k: "colore", label: "Colore", type: "text" },
                    { k: "larghezza", label: "L (mm)", type: "number" },
                    { k: "altezza", label: "H (mm)", type: "number" },
                    { k: "spessore", label: "Spessore", type: "text" },
                    { k: "prezzoTapp", label: "Prezzo €", type: "number" },
                  ].map(({ k, label, type }) => (
                    <div key={k}>
                      <label style={labelStyle}>{label}</label>
                      <input type={type} value={(vano.accessori?.tapparella || {})[k] || ""}
                        onChange={e => updV({ accessori: { ...vano.accessori, tapparella: { ...(vano.accessori?.tapparella || {}), [k]: type === "number" ? Number(e.target.value) : e.target.value } } })}
                        style={{ ...inputStyle }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ZANZARIERA ── */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>🕸 Zanzariera</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <select value={(vano.accessori?.zanzariera?.tipo) || "Non inclusa"}
                  onChange={e => updV({ accessori: { ...vano.accessori, zanzariera: { ...(vano.accessori?.zanzariera || {}), tipo: e.target.value, attivo: e.target.value !== "Non inclusa" } } })}
                  style={{ ...inputStyle, flex: 1 }}>
                  <option>Non inclusa</option>
                  <option>Avvolgente</option>
                  <option>Plissé</option>
                  <option>Laterale</option>
                  <option>Battente</option>
                  <option>ZIP</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: T.sub }}>Inclusa</span>
                  <div onClick={() => updV({ accessori: { ...vano.accessori, zanzariera: { ...(vano.accessori?.zanzariera || {}), inclusa: !vano.accessori?.zanzariera?.inclusa } } })}
                    style={{ width: 40, height: 22, borderRadius: 11, background: vano.accessori?.zanzariera?.inclusa ? GRN : T.bdr, position: "relative", cursor: "pointer", transition: "0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: vano.accessori?.zanzariera?.inclusa ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "0.2s" }} />
                  </div>
                </div>
              </div>
              {vano.accessori?.zanzariera?.attivo && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { k: "colore", label: "Colore", type: "text" },
                    { k: "larghezza", label: "L (mm)", type: "number" },
                    { k: "altezza", label: "H (mm)", type: "number" },
                    { k: "rete", label: "Rete", type: "text" },
                    { k: "prezzoZanz", label: "Prezzo €", type: "number" },
                  ].map(({ k, label, type }) => (
                    <div key={k}>
                      <label style={labelStyle}>{label}</label>
                      <input type={type} value={(vano.accessori?.zanzariera || {})[k] || ""}
                        onChange={e => updV({ accessori: { ...vano.accessori, zanzariera: { ...(vano.accessori?.zanzariera || {}), [k]: type === "number" ? Number(e.target.value) : e.target.value } } })}
                        style={{ ...inputStyle }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── POSA ── */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>🔧 Posa e smontaggio</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Posa</label>
                  <select value={vano.prevPosa || "Inclusa"} onChange={e => updV({ prevPosa: e.target.value })} style={{ ...inputStyle }}>
                    <option>Inclusa</option>
                    <option>A parte</option>
                    <option>Non prevista</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Smontaggio</label>
                  <select value={vano.prevSmDes || "Non richiesto"} onChange={e => updV({ prevSmDes: e.target.value })} style={{ ...inputStyle }}>
                    <option>Non richiesto</option>
                    <option>Incluso</option>
                    <option>A parte</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Prezzo posa (€)</label>
                  <input type="number" value={posaPrezzo || ""} placeholder="0"
                    onChange={e => updV({ prevPosaPrezzo: Number(e.target.value) })}
                    style={{ ...inputStyle }} />
                </div>
              </div>
            </div>

            {/* ── ACCESSORI CATALOGO ── */}
            <AccessoriCatalogoSection vano={vano} updV={updV} T={T} />

            {/* ── VOCI LIBERE VANO ── */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>➕ Voci libere vano</SectionLabel>
              {(vano.vociLibere || []).map((vl: any, vi: number) => (
                <div key={vi} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input value={vl.desc || ""} placeholder="Descrizione voce..."
                    onChange={e => { const nl = [...(vano.vociLibere || [])]; nl[vi] = { ...nl[vi], desc: e.target.value }; updV({ vociLibere: nl }); }}
                    style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" value={vl.qta || ""} placeholder="Qta"
                    onChange={e => { const nl = [...(vano.vociLibere || [])]; nl[vi] = { ...nl[vi], qta: Number(e.target.value) }; updV({ vociLibere: nl }); }}
                    style={{ ...inputStyle, width: 54 }} />
                  <input type="number" value={vl.prezzo || ""} placeholder="€"
                    onChange={e => { const nl = [...(vano.vociLibere || [])]; nl[vi] = { ...nl[vi], prezzo: Number(e.target.value) }; updV({ vociLibere: nl }); }}
                    style={{ ...inputStyle, width: 70 }} />
                  <div style={{ fontSize: 11, fontWeight: 800, color: GRN, fontFamily: FM, minWidth: 50, textAlign: "right" }}>€{fmt((vl.prezzo || 0) * (vl.qta || 1))}</div>
                  <div onClick={() => { const nl = (vano.vociLibere || []).filter((_: any, i: number) => i !== vi); updV({ vociLibere: nl }); }}
                    style={{ padding: "4px 6px", cursor: "pointer", color: RED, fontSize: 14, fontWeight: 800 }}>×</div>
                </div>
              ))}
              <div onClick={() => updV({ vociLibere: [...(vano.vociLibere || []), { desc: "", qta: 1, prezzo: 0 }] })}
                style={{ padding: "8px", borderRadius: 8, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${T.bdr}`, fontSize: 11, color: T.sub, marginTop: 2 }}>
                + Aggiungi voce
              </div>
            </div>

            {/* ── NOTE VANO ── */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>📝 Note vano</SectionLabel>
              <textarea value={vano.prevNote || ""} onChange={e => updV({ prevNote: e.target.value })}
                placeholder="Note specifiche per questo vano..."
                style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.5 }} />
            </div>

            {/* ── DISEGNO LIBERO ── */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>✏️ Disegno libero vano</div>
                  <div style={{ fontSize: 10, color: T.sub }}>Disegna a mano, carica foto, annota quote</div>
                </div>
                <div onClick={() => setShowDisegno(true)}
                  style={{ padding: "8px 14px", borderRadius: 10, background: AMB + "15", border: `1px solid ${AMB}40`, fontSize: 12, fontWeight: 700, color: AMB, cursor: "pointer" }}>
                  ✏️ {vano.prevPaths ? "Modifica" : "Apri"} disegno
                </div>
              </div>
              {vano.prevPaths && (
                <img src={vano.prevPaths} style={{ width: "100%", borderRadius: 10, border: `1px solid ${T.bdr}`, marginTop: 8, maxHeight: 180, objectFit: "contain", background: "#fff" }} alt="disegno" />
              )}
            </div>

            {/* ── SUBTOTALE VANO ── */}
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: GRN + "08", border: `1px solid ${GRN}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Totale vano</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: GRN, fontFamily: FM }}>€{fmt(subtotale)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════
export default function PreventivoConfiguratoreTab() {
  const {
    T, selectedCM, setSelectedCM, setCantieri,
    calcolaVanoPrezzo, getVaniAttivi,
    generaPreventivoPDF, generaPreventivoCondivisibile,
    aziendaInfo,
  } = useMastro();

  if (!selectedCM) return null;
  const c = selectedCM;

  // ── Aggiorna commessa ──
  const updCM = useCallback((field: string, val: any) => {
    setCantieri((cs: any[]) => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
    setSelectedCM((p: any) => ({ ...p, [field]: val }));
  }, [c.id, setCantieri, setSelectedCM]);

  // ── Aggiorna singolo vano ──
  const updVano = useCallback((vanoId: any, patch: any) => {
    const newVani = (c.vani || []).map((v: any) => v.id === vanoId ? { ...v, ...patch } : v);
    updCM("vani", newVani);
  }, [c.vani, updCM]);

  const vani = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []).filter((v: any) => !v.eliminato);

  // ── Calcolo totali ──
  const totVani = vani.reduce((s: number, v: any) => {
    const base = calcolaVanoPrezzo ? calcolaVanoPrezzo(v, c) : (v.prevPrezzoOverride ?? 0);
    const prezzoU = v.prevPrezzoOverride !== undefined && v.prevPrezzoOverride !== null ? v.prevPrezzoOverride : base;
    const accCat = (v.accessoriCatalogo || []).reduce((sa: number, a: any) => sa + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);
    const posa = v.prevPosaPrezzo || 0;
    return s + (prezzoU * (v.pezzi || 1)) + accCat + posa;
  }, 0);

  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const scontoPerc = parseFloat(c.sconto || c.scontoPerc || 0);
  const totBase = totVani + vociLib;
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.iva || c.aliquotaIva || c.ivaPerc || 10);
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: "Inter",
    background: T.bg, color: T.text, boxSizing: "border-box" as const,
  };

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ══ PRATICA FISCALE ══ */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 10 }}>📋 Pratica fiscale</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "nessuna", label: "Nessuna" },
            { id: "50", label: "Ristrutturazione 50%" },
            { id: "65", label: "Ecobonus 65%" },
            { id: "75", label: "Barriere 75%" },
          ].map(opt => (
            <div key={opt.id} onClick={() => updCM("detrazione", opt.id)}
              style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, border: `1.5px solid ${c.detrazione === opt.id || (!c.detrazione && opt.id === "nessuna") ? T.acc : T.bdr}`, background: c.detrazione === opt.id || (!c.detrazione && opt.id === "nessuna") ? T.acc + "15" : T.bg, color: c.detrazione === opt.id || (!c.detrazione && opt.id === "nessuna") ? T.acc : T.sub }}>
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {/* ══ IVA + SCONTO ══ */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>IVA Infissi</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["4", "10", "22"].map(p => (
              <div key={p} onClick={() => updCM("iva", p)}
                style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, background: String(ivaPerc) === p ? GRN : T.bg, color: String(ivaPerc) === p ? "#fff" : T.sub, border: `1.5px solid ${String(ivaPerc) === p ? GRN : T.bdr}` }}>
                {p}%
              </div>
            ))}
          </div>
        </div>
        {ivaPerc === 10 && <div style={{ fontSize: 11, color: AMB, background: AMB + "12", padding: "6px 10px", borderRadius: 8, marginBottom: 10 }}>IVA 10%: manutenzione straordinaria residenziale.</div>}
        {ivaPerc === 4 && <div style={{ fontSize: 11, color: AMB, background: AMB + "12", padding: "6px 10px", borderRadius: 8, marginBottom: 10 }}>IVA 4%: prima casa o disabilità — allegare documentazione.</div>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Sconto globale</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ v: 0, l: "No" }, { v: 5, l: "5%" }, { v: 10, l: "10%" }, { v: 15, l: "15%" }, { v: 20, l: "20%" }].map(opt => (
              <div key={opt.v} onClick={() => updCM("sconto", opt.v)}
                style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, background: scontoPerc === opt.v ? (opt.v === 0 ? GRN : AMB) : T.bg, color: scontoPerc === opt.v ? "#fff" : T.sub, border: `1.5px solid ${scontoPerc === opt.v ? (opt.v === 0 ? GRN : AMB) : T.bdr}` }}>
                {opt.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ VANI ══ */}
      {vani.map((v: any, i: number) => (
        <VanoCard key={v.id} vano={v} idx={i} updVano={updVano} calcolaVanoPrezzo={calcolaVanoPrezzo} selectedCM={c} T={T} />
      ))}

      {/* Aggiungi vano */}
      <div onClick={() => {
        const newV = { id: Date.now(), nome: `Vano ${vani.length + 1}`, tipo: "F1A", pezzi: 1, misure: {}, accessori: { tapparella: { attivo: false }, zanzariera: { attivo: false } }, accessoriCatalogo: [], vociLibere: [] };
        updCM("vani", [...(c.vani || []), newV]);
      }} style={{ padding: "14px", borderRadius: 14, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${T.bdr}`, fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10, background: T.card }}>
        + Aggiungi vano
      </div>

      {/* ══ VOCI EXTRA COMMESSA ══ */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 8 }}>📎 Voci extra</div>
        {(c.vociLibere || []).map((vl: any, vi: number) => (
          <div key={vi} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <input value={vl.desc || ""} placeholder="Descrizione..."
              onChange={e => { const nl = [...(c.vociLibere || [])]; nl[vi] = { ...nl[vi], desc: e.target.value }; updCM("vociLibere", nl); }}
              style={{ ...inputStyle, flex: 2 }} />
            <input type="number" value={vl.qta || ""} placeholder="Qta"
              onChange={e => { const nl = [...(c.vociLibere || [])]; nl[vi] = { ...nl[vi], qta: Number(e.target.value) }; updCM("vociLibere", nl); }}
              style={{ ...inputStyle, width: 54 }} />
            <input type="number" value={vl.importo || ""} placeholder="€"
              onChange={e => { const nl = [...(c.vociLibere || [])]; nl[vi] = { ...nl[vi], importo: Number(e.target.value) }; updCM("vociLibere", nl); }}
              style={{ ...inputStyle, width: 70 }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: GRN, fontFamily: FM, minWidth: 54, textAlign: "right" }}>€{fmt((vl.importo || 0) * (vl.qta || 1))}</div>
            <div onClick={() => { const nl = (c.vociLibere || []).filter((_: any, i: number) => i !== vi); updCM("vociLibere", nl); }}
              style={{ padding: "4px 6px", cursor: "pointer", color: RED, fontSize: 14, fontWeight: 800 }}>×</div>
          </div>
        ))}
        <div onClick={() => updCM("vociLibere", [...(c.vociLibere || []), { desc: "", qta: 1, importo: 0 }])}
          style={{ padding: "8px", borderRadius: 8, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${T.bdr}`, fontSize: 11, color: T.sub }}>
          + Aggiungi voce
        </div>
      </div>

      {/* ══ NOTE PREVENTIVO ══ */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <textarea value={c.notePreventivo || ""} onChange={e => updCM("notePreventivo", e.target.value)}
          placeholder="Note aggiuntive, condizioni speciali per questa commessa..."
          style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      {/* ══ TOTALI ══ */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "14px", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 10 }}>💳 Riepilogo economico</div>
        {[
          { label: "Totale vani", val: totVani, color: T.text },
          { label: "Voci extra", val: vociLib, color: T.text },
          scontoPerc > 0 ? { label: `Sconto ${scontoPerc}%`, val: -scontoVal, color: AMB } : null,
          { label: "Imponibile", val: imponibile, color: T.text, bold: true },
          { label: `IVA ${ivaPerc}%`, val: ivaVal, color: T.sub },
          { label: "TOTALE", val: totIva, color: GRN, big: true },
        ].filter(Boolean).map((row: any, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.big ? "8px 0" : "4px 0", borderTop: row.big ? `1.5px solid ${T.bdr}` : "none" }}>
            <span style={{ fontSize: row.big ? 14 : 12, fontWeight: row.bold || row.big ? 800 : 600, color: row.color }}>{row.label}</span>
            <span style={{ fontSize: row.big ? 18 : 13, fontWeight: 900, color: row.color, fontFamily: FM }}>€{fmt(Math.abs(row.val))}</span>
          </div>
        ))}

        {/* Acconto */}
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: T.bg, border: `1px solid ${T.bdr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Acconto ricevuto</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: T.sub }}>€</span>
              <input type="number" value={acconto || ""} placeholder="0"
                onChange={e => updCM("accontoRicevuto", Number(e.target.value))}
                style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontFamily: FM, textAlign: "right", background: T.card, color: T.text }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Saldo</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: saldo > 0 ? RED : GRN, fontFamily: FM }}>€{fmt(saldo)}</span>
          </div>
        </div>
      </div>

      {/* ══ PDF ══ */}
      <div style={{ display: "flex", gap: 8 }}>
        <div onClick={() => generaPreventivoPDF && generaPreventivoPDF(c, aziendaInfo)}
          style={{ flex: 1, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: GRN, color: "#fff", fontSize: 14, fontWeight: 900 }}>
          📄 Genera PDF
        </div>
        {generaPreventivoCondivisibile && (
          <div onClick={() => generaPreventivoCondivisibile(c, aziendaInfo)}
            style={{ flex: 1, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: BLU, color: "#fff", fontSize: 14, fontWeight: 900 }}>
            🔗 Link condivisibile
          </div>
        )}
      </div>
    </div>
  );
}
