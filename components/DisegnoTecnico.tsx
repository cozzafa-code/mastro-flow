// Last update: 2026-05-02 force redeploy
"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — DisegnoTecnico (Shared Drawing Module)
// Usato da: CMDetailPanel (preventivo) + VanoDetailPanel (rilievo)
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from "react";
import GestioneTipologie from "./GestioneTipologie";
import SelettoreVetri from "./SelettoreVetri";
import SelettoreProfilo from "./SelettoreProfilo";
import SelettoreNodo from "./SelettoreNodo";

// ═══════════════════════════════════════════════════════════
// 3D ISOMETRIC VIEW — 6 Faces + Per-face drawing + Render
// ═══════════════════════════════════════════════════════════
const FM3 = "'SF Mono','JetBrains Mono',monospace";
const FF3 = "'SF Pro Display',-apple-system,sans-serif";

const EL3D = [
  { id: "telaio", icon: "□", label: "Telaio", color: "#3A3A3C" },
  { id: "montante", icon: "│", label: "Mont.", color: "#3A3A3C" },
  { id: "traverso", icon: "─", label: "Trav.", color: "#3A3A3C" },
  { id: "anta", icon: "▨", label: "Anta", color: "#3B7FE0" },
  { id: "porta", icon: "▮", label: "Porta", color: "#D08008" },
  { id: "scorrevole", icon: "▤", label: "Scorr.", color: "#0D9488" },
  { id: "persiana", icon: "▦", label: "Pers.", color: "#8B5CF6" },
  { id: "vetro", icon: "◇", label: "Vetro", color: "#3B7FE0" },
  { id: "oblo", icon: "○", label: "Oblo", color: "#3B7FE0" },
  { id: "pannello", icon: "▣", label: "Pann.", color: "#8E8E93" },
  { id: "linea", icon: "╱", label: "Linea", color: "#DC4444" },
  { id: "testo", icon: "Aa", label: "Testo", color: "#1A1A1C" },
];
const FA3: any = {
  front: { label: "Prospetto", icon: "🪟", s: "F" },
  back: { label: "Esterno", icon: "↩", s: "E" },
  left: { label: "Spall.SX", icon: "◀", s: "SX" },
  right: { label: "Spall.DX", icon: "▶", s: "DX" },
  top: { label: "Architrave", icon: "⬆", s: "A" },
  bottom: { label: "Davanzale", icon: "⬇", s: "D" },
};
const FK3 = ["front", "back", "left", "right", "top", "bottom"];

function getFields3D(fk: string) {
  const n = { k: "note", l: "Note", type: "text" };
  if (fk === "front") return [{ k: "luce_l", l: "Luce L", u: "mm" }, { k: "luce_h", l: "Luce H", u: "mm" }, { k: "fuori_squadra", l: "Fuori squadra", u: "mm" }, { k: "tipo_apertura", l: "Tipo apertura", type: "text" }, n];
  if (fk === "back") return [{ k: "tipo_muro", l: "Tipo muro", type: "text" }, { k: "finitura", l: "Finitura est.", type: "text" }, { k: "spessore_intonaco", l: "Spess. intonaco", u: "mm" }, n];
  if (fk === "top") return [{ k: "arch_h", l: "Altezza", u: "mm" }, { k: "arch_tipo", l: "Tipo", type: "text" }, { k: "cassH", l: "Cassonetto H", u: "mm" }, { k: "cassP", l: "Cassonetto P", u: "mm" }, n];
  if (fk === "bottom") return [{ k: "dav_prof", l: "Profondita", u: "mm" }, { k: "dav_sporg", l: "Sporgenza", u: "mm" }, { k: "dav_mat", l: "Materiale", type: "text" }, n];
  return [{ k: "sp_larg", l: "Larghezza", u: "mm" }, { k: "sp_prof", l: "Profondita", u: "mm" }, { k: "sp_tipo", l: "Tipo muro", type: "text" }, { k: "fuori_piombo", l: "Fuori piombo", u: "mm" }, n];
}

function renderEl3D(el: any, sc: number, ox: number, oy: number) {
  const x = ox + el.x * sc, y = oy + el.y * sc, w = el.w * sc, h = el.h * sc;
  const et = EL3D.find(t => t.id === el.type); const c = et?.color || "#666"; const s = el._sel;
  const sb = s ? <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="none" stroke="#3B7FE0" strokeWidth={1} strokeDasharray="3,2" /> : null;
  if (el.type === "telaio") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="none" stroke={c} strokeWidth={s ? 2.5 : 1.5} rx={1} />{sb}</g>;
  if (el.type === "montante") return <g key={el.id}><rect x={x} y={y} width={Math.max(w, 3)} height={h} fill={c} opacity={0.7} />{sb}</g>;
  if (el.type === "traverso") return <g key={el.id}><rect x={x} y={y} width={w} height={Math.max(h, 3)} fill={c} opacity={0.7} />{sb}</g>;
  if (el.type === "anta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "15"} stroke={c} strokeWidth={1.2} rx={1} /><line x1={x} y1={y} x2={x + w} y2={y + h / 2} stroke={c + "40"} strokeWidth={0.5} /><line x1={x} y1={y + h} x2={x + w} y2={y + h / 2} stroke={c + "40"} strokeWidth={0.5} />{sb}</g>;
  if (el.type === "porta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "12"} stroke={c} strokeWidth={1.5} rx={1} /><line x1={x + w * .15} y1={y + h * .35} x2={x + w * .15} y2={y + h * .65} stroke={c} strokeWidth={2} />{sb}</g>;
  if (el.type === "scorrevole") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#D6EEFF50" stroke={c} strokeWidth={1} strokeDasharray="4,2" rx={1} /><text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={6} fill={c} fontFamily={FM3}>SCORR.</text>{sb}</g>;
  if (el.type === "persiana") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill={c + "10"} stroke={c} strokeWidth={1} />{Array.from({ length: Math.max(2, Math.floor(h / 5)) }).map((_, i, a) => <line key={i} x1={x + 2} y1={y + (i / a.length) * h + h / a.length / 2} x2={x + w - 2} y2={y + (i / a.length) * h + h / a.length / 2} stroke={c + "50"} strokeWidth={0.5} />)}{sb}</g>;
  if (el.type === "vetro") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#D6EEFF" stroke={c} strokeWidth={0.8} rx={1} /><line x1={x} y1={y} x2={x + w} y2={y + h} stroke={c + "20"} strokeWidth={0.3} />{sb}</g>;
  if (el.type === "oblo") return <g key={el.id}><ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="#D6EEFF" stroke={c} strokeWidth={1} />{sb}</g>;
  if (el.type === "pannello") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#E8E4DF" stroke={c} strokeWidth={0.8} />{sb}</g>;
  if (el.type === "linea") return <g key={el.id}><line x1={x} y1={y} x2={x + w} y2={y + h} stroke={c} strokeWidth={1.5} /></g>;
  if (el.type === "testo") return <g key={el.id}><text x={x} y={y + 12} fontSize={10} fill="#1A1A1C" fontFamily={FM3} fontWeight={600}>{el.text || "Testo"}</text>{sb}</g>;
  return <rect key={el.id} x={x} y={y} width={w} height={h} fill="#ccc" stroke="#999" strokeWidth={0.5} />;
}

function Iso3D({ T, realW, realH, profMuro, faceData, activeFace, onSelectFace }: any) {
  const mx = Math.max(realW, realH, profMuro), bs = 110 / mx, W = realW * bs, H = realH * bs, D = profMuro * bs;
  const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
  const iX = (x: number, y: number, z: number) => (x - z) * c30, iY = (x: number, y: number, z: number) => (x + z) * s30 - y;
  const cx = 170, cy = 165;
  const co = { fbl: { x: 0, y: 0, z: 0 }, fbr: { x: W, y: 0, z: 0 }, ftl: { x: 0, y: H, z: 0 }, ftr: { x: W, y: H, z: 0 }, bbl: { x: 0, y: 0, z: D }, bbr: { x: W, y: 0, z: D }, btl: { x: 0, y: H, z: D }, btr: { x: W, y: H, z: D } };
  const p = (v: any) => `${cx + iX(v.x, v.y, v.z)},${cy + iY(v.x, v.y, v.z)}`;
  const fp: any = { front: { pts: `${p(co.fbl)} ${p(co.fbr)} ${p(co.ftr)} ${p(co.ftl)}`, fill: "#B8D4E8" }, right: { pts: `${p(co.fbr)} ${p(co.bbr)} ${p(co.btr)} ${p(co.ftr)}`, fill: "#9AB8CC" }, top: { pts: `${p(co.ftl)} ${p(co.ftr)} ${p(co.btr)} ${p(co.btl)}`, fill: "#D4CFC4" }, left: { pts: `${p(co.fbl)} ${p(co.bbl)} ${p(co.btl)} ${p(co.ftl)}`, fill: "#C8C4B8" }, bottom: { pts: `${p(co.fbl)} ${p(co.fbr)} ${p(co.bbr)} ${p(co.bbl)}`, fill: "#E8D8B0" }, back: { pts: `${p(co.bbl)} ${p(co.bbr)} ${p(co.btr)} ${p(co.btl)}`, fill: "#A8C4D8" } };
  const G = T.grn || "#1A9E73";
  const lps: any = { front: { x: W / 2, y: H / 2, z: 0 }, right: { x: W, y: H / 2, z: D / 2 }, top: { x: W / 2, y: H, z: D / 2 }, left: { x: 0, y: H / 2, z: D / 2 }, bottom: { x: W / 2, y: 0, z: D / 2 }, back: { x: W / 2, y: H / 2, z: D } };
  return (<svg width={340} height={280} style={{ background: "#fff", borderRadius: 6, border: `1px solid ${T.bdr}`, maxWidth: "100%" }}>
    {[0, 1, 2, 3, 4].map(i => <line key={`z${i}`} x1={cx + iX(0, 0, (i / 4) * D)} y1={cy + iY(0, 0, (i / 4) * D)} x2={cx + iX(W, 0, (i / 4) * D)} y2={cy + iY(W, 0, (i / 4) * D)} stroke="#E8E8E8" strokeWidth={0.5} />)}
    {[0, 1, 2, 3, 4].map(i => <line key={`x${i}`} x1={cx + iX((i / 4) * W, 0, 0)} y1={cy + iY((i / 4) * W, 0, 0)} x2={cx + iX((i / 4) * W, 0, D)} y2={cy + iY((i / 4) * W, 0, D)} stroke="#E8E8E8" strokeWidth={0.5} />)}
    {["back", "bottom", "left", "right", "front", "top"].map(fk => { const f = fp[fk], sel = activeFace === fk, els = faceData[fk]?.elements || [], has = els.length > 0; const lp = lps[fk], lx = cx + iX(lp.x, lp.y, lp.z), ly = cy + iY(lp.x, lp.y, lp.z);
      return (<g key={fk} onClick={() => onSelectFace(fk)} style={{ cursor: "pointer" }}><polygon points={f.pts} fill={sel ? "#1A9E73" + "40" : has ? G + "15" : f.fill} stroke={sel ? "#1A9E73" : has ? G : "#666"} strokeWidth={sel ? 2.5 : 1} strokeLinejoin="round" /><text x={lx} y={ly - 3} textAnchor="middle" fontSize={sel ? 10 : 7} fontWeight={sel ? 800 : 600} fontFamily={FM3} fill={sel ? "#1A9E73" : has ? G : "#555"}>{FA3[fk].label}</text>{has && <text x={lx} y={ly + 8} textAnchor="middle" fontSize={7} fontFamily={FM3} fill={G}>{els.length} el.</text>}</g>); })}
    <text x={(cx + iX(0, 0, 0) + cx + iX(W, 0, 0)) / 2} y={(cy + iY(0, 0, 0) + cy + iY(W, 0, 0)) / 2 + 22} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM3} fill={T.acc}>L {realW}</text>
    <text x={cx + iX(0, H / 2, 0) - 22} y={cy + iY(0, H / 2, 0) + 3} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM3} fill={T.acc}>H {realH}</text>
    <text x={170} y={270} textAnchor="middle" fontSize={8} fill={T.sub} fontFamily={FF3}>Tap su una faccia per disegnare</text>
  </svg>);
}

function FaceCanvas3D({ T, faceKey, realW, realH, elements, onUpdateElements, activeTool }: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ds, setDs] = useState<any>(null); const [dc, setDc] = useState<any>(null); const [selId, setSelId] = useState<string | null>(null);
  const face = FA3[faceKey]; const sc = Math.min(0.16, 280 / Math.max(realW, realH));
  const W = realW * sc, H = realH * sc, pad = 35, svgW = W + pad * 2 + 20, svgH = H + pad * 2 + 20;
  const gpt = (e: any) => { const r = svgRef.current?.getBoundingClientRect(); const ct = e.touches ? e.touches[0] : e; return r ? { x: (ct.clientX - r.left - pad) / sc, y: (ct.clientY - r.top - pad) / sc } : { x: 0, y: 0 }; };
  const hDown = (e: any) => { if (!activeTool || activeTool === "select") { const pt = gpt(e); const hit = [...(elements || [])].reverse().find((el: any) => pt.x >= el.x && pt.x <= el.x + el.w && pt.y >= el.y && pt.y <= el.y + el.h); setSelId(hit?.id || null); return; } setDs(gpt(e)); setDc(gpt(e)); };
  const hMove = (e: any) => { if (ds) { const ct = e.touches ? e.touches[0] : e; setDc(gpt(e)); } };
  const hUp = () => { if (!ds || !dc || !activeTool) { setDs(null); setDc(null); return; } const x = Math.min(ds.x, dc.x), y = Math.min(ds.y, dc.y), w = Math.abs(dc.x - ds.x), h = Math.abs(dc.y - ds.y); if (w < 10 && h < 10) { setDs(null); setDc(null); return; } onUpdateElements([...(elements || []), { id: `el_${Date.now()}`, type: activeTool, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), face: faceKey }]); setDs(null); setDc(null); };
  const els = (elements || []).map((el: any) => ({ ...el, _sel: el.id === selId }));
  return (<div>
    <div style={{ display: "flex", alignItems: "center", padding: "6px 10px", gap: 6, background: `${"#1A9E73"}06`, borderBottom: `1px solid ${T.bdr}` }}>
      <span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73", flex: 1 }}>{face.label}</span><span style={{ fontSize: 8, color: T.sub, fontFamily: FM3 }}>{realW}x{realH}mm</span>
      {elements?.length > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, background: `${T.grn || "#1A9E73"}18`, fontSize: 8, fontWeight: 800, color: T.grn || "#1A9E73" }}>{elements.length} el.</span>}
      {selId && <span onClick={() => { onUpdateElements((elements || []).filter((el: any) => el.id !== selId)); setSelId(null); }} style={{ padding: "2px 6px", borderRadius: 4, background: `${T.red || "#DC4444"}15`, fontSize: 8, fontWeight: 700, color: T.red || "#DC4444", cursor: "pointer" }}>🗑 Elimina</span>}
    </div>
    <div style={{ display: "flex", justifyContent: "center", padding: 6, background: "#FAFAF7" }}>
      <svg ref={svgRef} width={svgW} height={svgH} onPointerDown={hDown} onPointerMove={hMove} onPointerUp={hUp} style={{ background: "#fff", borderRadius: 6, border: `1px solid ${T.bdr}`, cursor: activeTool && activeTool !== "select" ? "crosshair" : "default", touchAction: "none", maxWidth: "100%" }}>
        {Array.from({ length: Math.ceil(W / 20) + 1 }).map((_, i) => <line key={`v${i}`} x1={pad + i * 20} y1={pad} x2={pad + i * 20} y2={pad + H} stroke="#F0F0F0" strokeWidth={0.5} />)}
        {Array.from({ length: Math.ceil(H / 20) + 1 }).map((_, i) => <line key={`h${i}`} x1={pad} y1={pad + i * 20} x2={pad + W} y2={pad + i * 20} stroke="#F0F0F0" strokeWidth={0.5} />)}
        <rect x={pad} y={pad} width={W} height={H} fill="#F8F7F4" stroke="#3A3A3C" strokeWidth={1.5} rx={1} />
        {els.map((el: any) => renderEl3D(el, sc, pad, pad))}
        {ds && dc && activeTool && (() => { const x = Math.min(ds.x, dc.x) * sc + pad, y = Math.min(ds.y, dc.y) * sc + pad, w = Math.abs(dc.x - ds.x) * sc, h = Math.abs(dc.y - ds.y) * sc; const et = EL3D.find(t => t.id === activeTool); return <rect x={x} y={y} width={w} height={h} fill={(et?.color || "#666") + "15"} stroke={et?.color || "#666"} strokeWidth={1} strokeDasharray="4,2" />; })()}
      </svg>
    </div>
  </div>);
}

function RenderPreview3D({ T, realW, realH, faceData }: any) {
  const sc = Math.min(0.15, 280 / Math.max(realW, realH)), W = realW * sc, H = realH * sc, pad = 30; const els = faceData["front"]?.elements || [];
  return (<div style={{ padding: 8 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>RENDERING PROSPETTO</div>
    <svg width={W + pad * 2} height={H + pad * 2 + 10} style={{ background: "#fff", borderRadius: 8, border: `1px solid ${T.bdr}`, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", maxWidth: "100%" }}>
      <defs><linearGradient id="sky3d" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#87CEEB" /><stop offset="100%" stopColor="#E0F0FF" /></linearGradient></defs>
      <rect x={0} y={0} width={W + pad * 2} height={pad + 5} fill="url(#sky3d)" rx={8} />
      <rect x={pad} y={pad} width={W} height={H} fill="#F5F0E8" stroke="#8B7D6B" strokeWidth={2} rx={2} />
      {els.map((el: any) => { const x = pad + el.x * sc, y = pad + el.y * sc, w = el.w * sc, h = el.h * sc;
        if (el.type === "vetro" || el.type === "anta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#A8D8EA" stroke="#5B8FA8" strokeWidth={1.5} rx={2} /></g>;
        if (el.type === "porta") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#C4A882" stroke="#8B7D6B" strokeWidth={2} rx={2} /><circle cx={x + w * .15} cy={y + h * .5} r={2} fill="#8B7D6B" /></g>;
        if (el.type === "scorrevole") return <g key={el.id}><rect x={x} y={y} width={w} height={h} fill="#B0D8EA90" stroke="#5B8FA8" strokeWidth={1} rx={1} /><line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#5B8FA860" strokeWidth={1} /></g>;
        if (el.type === "telaio") return <rect key={el.id} x={x} y={y} width={w} height={h} fill="none" stroke="#5B5B5B" strokeWidth={2} rx={1} />;
        return <rect key={el.id} x={x} y={y} width={w} height={h} fill="#DDD" stroke="#AAA" strokeWidth={0.5} />; })}
      <rect x={0} y={pad + H - 2} width={W + pad * 2} height={pad + 12} fill="#D4C8B0" />
    </svg>
    {els.length === 0 && <div style={{ textAlign: "center", padding: 12, fontSize: 10, color: T.sub }}>Disegna elementi sul Prospetto per il rendering</div>}
  </div>);
}

function FDataPanel3D({ T, faceKey, faceData, setFaceData, onClose }: any) {
  const face = FA3[faceKey], data = faceData[faceKey]?.fields || {}, fields = getFields3D(faceKey);
  const setF = (k: string, v: any) => setFaceData((prev: any) => ({ ...prev, [faceKey]: { ...(prev[faceKey] || {}), fields: { ...(prev[faceKey]?.fields || {}), [k]: v } } }));
  return (<div style={{ borderTop: `1.5px solid ${"#1A9E73"}40`, background: T.card || "#fff", padding: "8px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73" }}>{face.label} - Dati</span><span style={{ flex: 1 }} /><span onClick={onClose} style={{ fontSize: 11, cursor: "pointer", color: T.sub }}>✕</span></div>
    {fields.map((f: any) => (<div key={f.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, minWidth: 72 }}>{f.l}</span>
      {f.type === "text" ? <input value={data[f.k] || ""} placeholder="..." onChange={(e: any) => setF(f.k, e.target.value)} style={{ flex: 1, padding: "4px 8px", border: `1px solid ${T.bdr}`, borderRadius: 5, fontSize: 10, fontFamily: FF3, color: T.text }} />
        : <div style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="number" value={data[f.k] || ""} placeholder="—" onChange={(e: any) => setF(f.k, parseInt(e.target.value) || 0)} style={{ width: 56, padding: "4px", border: `1px solid ${T.bdr}`, borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: FM3, textAlign: "center", color: T.text }} />{f.u && <span style={{ fontSize: 8, color: T.sub }}>{f.u}</span>}</div>}
    </div>))}
  </div>);
}

function View3D({ T, realW, realH, vanoDisegno, onUpdate, pts, H, sp, mats, onMatsChange, onHChange, onSpChange }: any) {
  // Dimensioni dai pts condivisi
  const xs3 = (pts||[]).map((p:any)=>p.x), ys3 = (pts||[]).map((p:any)=>p.y);
  const L = xs3.length ? Math.max(...xs3)-Math.min(...xs3) : realW||1200;
  const P = ys3.length ? Math.max(...ys3)-Math.min(...ys3) : 350;
  const [selFace, setSelFace] = useState<string|null>(null);

  const MAT3D = [
    {id:"alluminio",l:"Alluminio",c:"#CBD5E1",b:"#475569"},
    {id:"pvc",      l:"PVC",      c:"#93C5FD",b:"#3B7FE0"},
    {id:"acciaio",  l:"Acciaio",  c:"#9CA3AF",b:"#374151"},
    {id:"vetro",    l:"Vetro",    c:"#BAE6FD",b:"#0EA5E9"},
    {id:"legno",    l:"Legno",    c:"#D6B896",b:"#92400E"},
    {id:"eps",      l:"Coib.",    c:"#FDE68A",b:"#D08008"},
  ];
  const getMat = (id:string) => MAT3D.find(m=>m.id===id)||MAT3D[0];

  // Isometrica
  const mx = Math.max(L, H, P, 1);
  const sc3 = 90/mx;
  const W3=L*sc3, H3=H*sc3, D3=P*sc3;
  const s3=sp*sc3;
  const c30=Math.cos(Math.PI/6), s30=0.5;
  const iX=(x:number,_y:number,z:number)=>(x-z)*c30;
  const iY=(x:number,y:number,z:number)=>(x+z)*s30-y;
  const CX=185, CY=170;
  const p3=(x:number,y:number,z:number)=>`${(CX+iX(x,y,z)).toFixed(1)},${(CY+iY(x,y,z)).toFixed(1)}`;

  // Normalizza i pts della pianta in coordinate 0..L, 0..P
  const normPts = (pts||[]).map((p:any) => ({
    x: (p.x - Math.min(...(pts||[{x:0}]).map((q:any)=>q.x))) / Math.max(L,1) * W3,
    z: (p.y - Math.min(...(pts||[{y:0}]).map((q:any)=>q.y))) / Math.max(P,1) * D3,
  }));
  const isBox = normPts.length === 4;

  // Genera le facce laterali dalla pianta estrusa
  const sideFaces = normPts.length >= 3 ? normPts.map((np:any, i:number) => {
    const next = normPts[(i+1)%normPts.length];
    const pts3 = `${p3(np.x,0,np.z)} ${p3(next.x,0,next.z)} ${p3(next.x,H3,next.z)} ${p3(np.x,H3,np.z)}`;
    return {id:`side${i}`, pts:pts3, matKey:"front", op:0.85};
  }) : [];

  // Pianta in basso e tetto
  const bottomPts3 = normPts.map((np:any)=>p3(np.x,0,np.z)).join(" ");
  const topPts3    = normPts.map((np:any)=>p3(np.x,H3,np.z)).join(" ");

  const FACES = isBox ? [
    {id:"back",   pts:`${p3(0,0,D3)} ${p3(W3,0,D3)} ${p3(W3,H3,D3)} ${p3(0,H3,D3)}`, op:0.6, matKey:"back"},
    {id:"bottom", pts:`${p3(0,0,0)} ${p3(W3,0,0)} ${p3(W3,0,D3)} ${p3(0,0,D3)}`,     op:0.7, matKey:"bottom"},
    {id:"left",   pts:`${p3(0,0,0)} ${p3(0,0,D3)} ${p3(0,H3,D3)} ${p3(0,H3,0)}`,     op:0.85,matKey:"left"},
    {id:"right",  pts:`${p3(W3,0,0)} ${p3(W3,0,D3)} ${p3(W3,H3,D3)} ${p3(W3,H3,0)}`, op:0.9, matKey:"right"},
    {id:"front",  pts:`${p3(0,0,0)} ${p3(W3,0,0)} ${p3(W3,H3,0)} ${p3(0,H3,0)}`,     op:1.0, matKey:"front"},
    {id:"top",    pts:`${p3(0,H3,0)} ${p3(W3,H3,0)} ${p3(W3,H3,D3)} ${p3(0,H3,D3)}`, op:0.95,matKey:"top"},
  ] : [
    // Forma libera: fondo + lati laterali + tetto
    {id:"bottom", pts:bottomPts3, op:0.7, matKey:"bottom"},
    ...sideFaces,
    {id:"top",    pts:topPts3,    op:0.95,matKey:"top"},
  ];

  const faceLabels:any = {
    front:"Fronte", back:"Retro", left:"Sx", right:"Dx", top:"Coperchio", bottom:"Fondo"
  };
  const visibleLabels = [
    {id:"front", lx:CX+iX(W3/2,H3/2,0),     ly:CY+iY(W3/2,H3/2,0)},
    {id:"right", lx:CX+iX(W3,H3/2,D3/2),    ly:CY+iY(W3,H3/2,D3/2)},
    {id:"top",   lx:CX+iX(W3/2,H3,D3/2),    ly:CY+iY(W3/2,H3,D3/2)},
  ];

  const inp = { width:"100%", padding:"5px 3px", border:`1.5px solid ${T.bdr}`,
    borderRadius:6, fontSize:13, fontWeight:800,
    fontFamily:"'JetBrains Mono',monospace", textAlign:"center" as const,
    color:T.text, background:T.card||"#fff", boxSizing:"border-box" as const };

  return (
    <div>
      {/* 3D SVG */}
      <div style={{display:"flex",justifyContent:"center",padding:"10px 6px",background:"#F0F8FF"}}>
        <svg width={370} height={290} style={{maxWidth:"100%",background:"#fff",
          borderRadius:8,border:`1px solid ${T.bdr}`}}>

          {/* Piano griglia */}
          {[0,0.25,0.5,0.75,1].map((t,i)=>(
            <line key={"gz"+i}
              x1={CX+iX(0,0,t*D3)} y1={CY+iY(0,0,t*D3)}
              x2={CX+iX(W3,0,t*D3)} y2={CY+iY(W3,0,t*D3)}
              stroke="#E8F0FF" strokeWidth="0.6"/>
          ))}
          {[0,0.5,1].map((t,i)=>(
            <line key={"gx"+i}
              x1={CX+iX(t*W3,0,0)} y1={CY+iY(t*W3,0,0)}
              x2={CX+iX(t*W3,0,D3)} y2={CY+iY(t*W3,0,D3)}
              stroke="#E8F0FF" strokeWidth="0.6"/>
          ))}

          {/* Facce */}
          {FACES.map(f=>{
            const mat = getMat(mats?.[f.matKey||f.id]||"alluminio");
            const isSel = selFace===f.id;
            return (
              <polygon key={f.id} points={f.pts}
                fill={mat.c + Math.round(f.op*255).toString(16).padStart(2,"0")}
                stroke={isSel?"#F59E0B":mat.b}
                strokeWidth={isSel?2.5:1}
                strokeLinejoin="round"
                style={{cursor:"pointer"}}
                onClick={()=>setSelFace(selFace===f.id?null:f.id)}/>
            );
          })}

          {/* Label facce visibili */}
          {visibleLabels.map(f=>{
            const mat=getMat(mats[f.id]);
            const isSel=selFace===f.id;
            return (
              <g key={f.id} style={{pointerEvents:"none"}}>
                <text x={f.lx} y={f.ly-3} textAnchor="middle" fontSize={isSel?"11":"9"}
                  fontWeight="800" fill={isSel?"#F59E0B":mat.b}>
                  {faceLabels[f.id]}
                </text>
                <text x={f.lx} y={f.ly+9} textAnchor="middle" fontSize="8" fill={mat.b}>
                  {mat.l}
                </text>
              </g>
            );
          })}

          {/* Quote L */}
          <line x1={CX+iX(0,0,0)} y1={CY+iY(0,0,0)}
            x2={CX+iX(W3,0,0)} y2={CY+iY(W3,0,0)}
            stroke="#D08008" strokeWidth="1" strokeDasharray="4,2"/>
          <text x={(CX+iX(0,0,0)+CX+iX(W3,0,0))/2}
            y={(CY+iY(0,0,0)+CY+iY(W3,0,0))/2+16}
            textAnchor="middle" fontSize="9" fontWeight="800" fill="#D08008">L {L}mm</text>

          {/* Quote H */}
          <line x1={CX+iX(W3,0,0)} y1={CY+iY(W3,0,0)}
            x2={CX+iX(W3,H3,0)} y2={CY+iY(W3,H3,0)}
            stroke="#D08008" strokeWidth="1" strokeDasharray="4,2"/>
          <text x={CX+iX(W3,0,0)+28} y={(CY+iY(W3,0,0)+CY+iY(W3,H3,0))/2}
            textAnchor="start" fontSize="9" fontWeight="800" fill="#D08008">H {H}mm</text>

          {/* Quote P */}
          <line x1={CX+iX(W3,0,0)} y1={CY+iY(W3,0,0)}
            x2={CX+iX(W3,0,D3)} y2={CY+iY(W3,0,D3)}
            stroke="#D08008" strokeWidth="1" strokeDasharray="4,2"/>
          <text x={(CX+iX(W3,0,0)+CX+iX(W3,0,D3))/2+16}
            y={(CY+iY(W3,0,0)+CY+iY(W3,0,D3))/2}
            textAnchor="start" fontSize="9" fontWeight="800" fill="#D08008">P {P}mm</text>

          <text x={185} y={282} textAnchor="middle" fontSize="8" fill="#94A3B8">
            Tap faccia → assegna materiale
          </text>
        </svg>
      </div>

      {/* Dimensioni compatte */}
      <div style={{padding:"7px 10px",borderTop:`1px solid ${T.bdr}`,background:T.bg||"#F2F1EC"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
          {[{l:"L",v:L,set:(v:number)=>{/* readonly */}},{l:"H",v:H||280,set:onHChange},{l:"P",v:P,set:(v:number)=>{/* readonly */}},{l:"Sp.",v:sp||40,set:onSpChange}].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,marginBottom:2}}>{l} (mm)</div>
              <input type="number" value={v}
                onChange={(e:any)=>set(Math.max(1,parseInt(e.target.value)||1))}
                style={inp}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:6,padding:"4px 8px",borderRadius:6,background:"#EFF8FF",
          display:"flex",justifyContent:"space-around"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#3B7FE0"}}>Int. {Math.max(0,L-sp*2)}×{Math.max(0,H-sp*2)}×{Math.max(0,P-sp*2)}mm</span>
        </div>
      </div>

      {/* Selezione materiale */}
      {selFace && (
        <div style={{padding:"8px 10px",borderTop:`1px solid ${T.bdr}`,background:"#fff"}}>
          <div style={{fontSize:11,fontWeight:800,color:T.text,marginBottom:8}}>
            {faceLabels[selFace]}
            <span style={{fontSize:9,color:T.sub,fontWeight:400,marginLeft:6}}>
              {["front","back"].includes(selFace)?"(stesso per fronte/retro)":
               ["left","right"].includes(selFace)?"(stesso per sx/dx)":"(stesso per top/fondo)"}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
            {MAT3D.map(m=>{
              const cur=mats[selFace];
              const isSel=cur===m.id;
              const apply = (id:string) => {
                const pair:any = {front:["front","back"],left:["left","right"],right:["left","right"],back:["front","back"],top:["top","bottom"],bottom:["top","bottom"]};
                const keys=pair[selFace]||[selFace];
                const next:any={...mats};
                keys.forEach((k:string)=>next[k]=id);
                onMatsChange(next);
              };
              return (
                <div key={m.id} onClick={()=>apply(m.id)}
                  style={{padding:"8px 5px",borderRadius:8,cursor:"pointer",textAlign:"center",
                    border:`2px solid ${isSel?m.b:"#E2E8F0"}`,background:m.c+"80"}}>
                  <div style={{width:18,height:18,borderRadius:4,background:m.c,
                    border:`2px solid ${m.b}`,margin:"0 auto 4px"}}/>
                  <div style={{fontSize:11,fontWeight:700,color:"#0F172A"}}>{m.l}</div>
                  {isSel&&<div style={{fontSize:8,color:m.b}}>✓</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FORMA EDITOR — Polygon-based shape builder
// ═══════════════════════════════════════════════════════════
const FM2 = "'SF Mono','JetBrains Mono',monospace";
const distPt = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const segLenPt = (a: any, b: any) => Math.round(distPt(a, b));
function nearSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  if (len2 === 0) return { t: 0, dist: distPt({ x: px, y: py }, { x: ax, y: ay }), x: ax, y: ay };
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return { t, dist: distPt({ x: px, y: py }, { x: cx, y: cy }), x: cx, y: cy };
}
const makeRectPts = (w = 1200, h = 1400) => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];

function FormaEditor({ T, realW, realH, pts, onPtsChange, H, onHChange, sp, onSpChange }: any) {
  // Legge L e P dai pts condivisi
  const xs = pts.map((p:any)=>p.x), ys = pts.map((p:any)=>p.y);
  const L = Math.max(...xs) - Math.min(...xs) || realW || 1200;
  const P = Math.max(...ys) - Math.min(...ys) || 350;
  const setL = (v:number) => {
    onPtsChange([{x:0,y:0},{x:v,y:0},{x:v,y:P},{x:0,y:P}]);
  };
  const setP2 = (v:number) => {
    onPtsChange([{x:0,y:0},{x:L,y:0},{x:L,y:v},{x:0,y:v}]);
  };

  const SVW = 300, SVH = 260, PAD = 40;
  const scL = (SVW - PAD*2) / Math.max(L, 1);
  const scP = (SVH - PAD*2) / Math.max(P, 1);
  const sc = Math.min(scL, scP, 0.5);
  const bw = L*sc, bd = P*sc;
  const ox = (SVW - bw)/2, oy = (SVH - bd)/2;
  const spx = sp*sc;

  const inp = { width:"100%", padding:"6px 4px", border:`1.5px solid ${T.bdr}`,
    borderRadius:6, fontSize:14, fontWeight:800,
    fontFamily:"'JetBrains Mono',monospace", textAlign:"center" as const, color:T.text,
    background:T.card||"#fff", boxSizing:"border-box" as const };

  // Dimensioni interne
  const Li = L - sp*2, Pi = P - sp*2;

  return (
    <div>
      {/* SVG pianta con spessori */}
      <div style={{display:"flex",justifyContent:"center",padding:"12px 8px",background:"#F8FAFC"}}>
        <svg width={SVW} height={SVH} style={{borderRadius:8,border:`1px solid ${T.bdr}`,background:"#fff",maxWidth:"100%"}}>
          {/* Griglia */}
          {Array.from({length:7}).map((_,i)=>(
            <line key={"gx"+i} x1={ox+i*bw/6} y1={oy} x2={ox+i*bw/6} y2={oy+bd} stroke="#F0EEE8" strokeWidth="0.4"/>
          ))}
          {Array.from({length:6}).map((_,i)=>(
            <line key={"gy"+i} x1={ox} y1={oy+i*bd/5} x2={ox+bw} y2={oy+i*bd/5} stroke="#F0EEE8" strokeWidth="0.4"/>
          ))}

          {/* Muro esterno */}
          <rect x={ox} y={oy} width={bw} height={bd}
            fill="#CBD5E1" stroke="#475569" strokeWidth="2"/>

          {/* Interno */}
          <rect x={ox+spx} y={oy+spx} width={Math.max(bw-spx*2,2)} height={Math.max(bd-spx*2,2)}
            fill="#EFF8FF" stroke="#3B7FE0" strokeWidth="1" strokeDasharray="4,2"/>

          {/* Label interno */}
          <text x={SVW/2} y={SVH/2-4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#3B7FE0">
            {Li > 0 ? `${Li}×${Pi}` : "—"}
          </text>
          <text x={SVW/2} y={SVH/2+10} textAnchor="middle" fontSize="8" fill="#94A3B8">int. mm</text>

          {/* Quote esterne L */}
          <line x1={ox} y1={oy-14} x2={ox+bw} y2={oy-14} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox} y1={oy-10} x2={ox} y2={oy-18} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox+bw} y1={oy-10} x2={ox+bw} y2={oy-18} stroke="#D08008" strokeWidth="1"/>
          <text x={SVW/2} y={oy-18} textAnchor="middle" fontSize="10" fontWeight="800" fill="#D08008">{L}mm</text>

          {/* Quote esterne P */}
          <line x1={ox+bw+14} y1={oy} x2={ox+bw+14} y2={oy+bd} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox+bw+10} y1={oy} x2={ox+bw+18} y2={oy} stroke="#D08008" strokeWidth="1"/>
          <line x1={ox+bw+10} y1={oy+bd} x2={ox+bw+18} y2={oy+bd} stroke="#D08008" strokeWidth="1"/>
          <text x={ox+bw+26} y={SVH/2+4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#D08008"
            transform={`rotate(90,${ox+bw+26},${SVH/2+4})`}>{P}mm</text>

          {/* Label spessore muro */}
          <text x={ox+spx/2} y={SVH/2} textAnchor="middle" fontSize="8" fontWeight="700"
            fill="#475569" transform={`rotate(-90,${ox+spx/2},${SVH/2})`}>{sp}mm</text>

          {/* Label vista */}
          <text x={SVW/2} y={SVH-6} textAnchor="middle" fontSize="8" fill="#94A3B8">pianta (vista dall'alto)</text>
        </svg>
      </div>

      {/* Campi */}
      <div style={{padding:"8px 10px",borderTop:`1px solid ${T.bdr}`,background:T.bg||"#F2F1EC"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
          {[{l:"Larghezza",v:L,set:setL},{l:"Profondità",v:P,set:setP2}].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,marginBottom:3}}>{l} (mm)</div>
              <input type="number" value={v} onChange={(e:any)=>set(Math.max(1,parseInt(e.target.value)||1))} style={inp}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[{l:"Altezza",v:H,set:onHChange},{l:"Spessore muri",v:sp,set:onSpChange}].map(({l,v,set})=>(
            <div key={l}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,marginBottom:3}}>{l} (mm)</div>
              <input type="number" value={v} onChange={(e:any)=>set(Math.max(1,parseInt(e.target.value)||1))} style={inp}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:8,padding:"6px 8px",borderRadius:8,background:"#EFF8FF",
          display:"flex",justifyContent:"space-around"}}>
          <span style={{fontSize:10,fontWeight:700,color:"#3B7FE0"}}>Int. L: {Math.max(0,L-sp*2)}mm</span>
          <span style={{fontSize:10,fontWeight:700,color:"#3B7FE0"}}>Int. P: {Math.max(0,P-sp*2)}mm</span>
          <span style={{fontSize:10,fontWeight:700,color:"#3B7FE0"}}>Int. H: {Math.max(0,H-sp*2)}mm</span>
          <div style={{width:"100%",textAlign:"center",marginTop:6}}>
            <span style={{fontSize:10,color:"#1A9E73",fontWeight:700}}>
              → Vai al tab 3D per vedere il modello
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// LIBERO EDITOR — disegno libero infisso con Paper.js
// ═══════════════════════════════════════════════════════════
function LiberoEditor({ T, realW, realH, onPtsChange, onGoTo3D }: any) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({x:60, y:60});
  const [tool, setTool] = React.useState<"muro"|"oggetto"|"select">("muro");
  const [spessore, setSpessore] = React.useState(15);
  const [shapes, setShapes] = React.useState<any[]>([]);
  const [curPt, setCurPt] = React.useState<any>(null);
  const [mousePos, setMousePos] = React.useState<any>(null);
  const [joinMenu, setJoinMenu] = React.useState<any>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const isPanRef = React.useRef(false);
  const lastPanPt = React.useRef({x:0,y:0});
  const lastPinch = React.useRef<number|null>(null);

  const GRID = 20;
  const scale = GRID / 10;

  function toSvg(e: any) {
    const svg = svgRef.current; if (!svg) return {x:0,y:0};
    const r = svg.getBoundingClientRect();
    const ct = e.touches ? e.touches[0] : e;
    return {
      x: (ct.clientX - r.left) / zoom - pan.x,
      y: (ct.clientY - r.top)  / zoom - pan.y,
    };
  }

  function snapPt(pt: any) {
    const g = GRID;
    let sx = Math.round(pt.x/g)*g, sy = Math.round(pt.y/g)*g;
    for (const s of shapes) {
      for (const p of [s.a, s.b]) {
        if (p && Math.hypot(p.x-pt.x,p.y-pt.y) < 18/zoom) return {x:p.x,y:p.y};
      }
    }
    if (curPt) {
      const dx=Math.abs(sx-curPt.x), dy=Math.abs(sy-curPt.y);
      if (dx>dy*1.8) sy=curPt.y;
      else if (dy>dx*1.8) sx=curPt.x;
    }
    return {x:sx,y:sy};
  }

  function pxToCm(px: number) { return Math.round(Math.abs(px)/scale); }
  function lenLabel(px: number) {
    const cm = pxToCm(px);
    return cm>=100?(cm/100).toFixed(2)+"m":cm+"cm";
  }
  function segLen(a:any,b:any) { return Math.hypot(b.x-a.x,b.y-a.y); }

  function lineIntersect(p1:any,d1:any,p2:any,d2:any) {
    const cross = d1.x*d2.y - d1.y*d2.x;
    if (Math.abs(cross)<0.001) return null;
    const t=((p2.x-p1.x)*d2.y-(p2.y-p1.y)*d2.x)/cross;
    return {x:p1.x+d1.x*t, y:p1.y+d1.y*t};
  }

  // Genera i 4 punti del poligono di un segmento
  // join="miter" | "wins" (rimane intatto, si estende) | "loses" (si accorcia al bordo del vincitore)
  // winnerSpA/winnerSpB = spessore del segmento vincitore (usato per calcolare il ritiro corretto del perdente)
  function segPolygon(a:any, b:any, sp:number,
    prevB:any=null, nextA:any=null,
    joinAtA="miter", joinAtB="miter",
    winnerSpA:number=sp, winnerSpB:number=sp) {
    const sp2 = sp*scale*0.5;
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy)||1;
    const ux=dx/len, uy=dy/len;
    const nx=-uy, ny=ux; // normale (sinistra)

    // Base: taglio dritto
    let aL={x:a.x+nx*sp2, y:a.y+ny*sp2};
    let aR={x:a.x-nx*sp2, y:a.y-ny*sp2};
    let bL={x:b.x+nx*sp2, y:b.y+ny*sp2};
    let bR={x:b.x-nx*sp2, y:b.y-ny*sp2};

    // LATO A
    if (prevB) {
      const pdx=a.x-prevB.x, pdy=a.y-prevB.y, pl=Math.hypot(pdx,pdy)||1;
      const pux=pdx/pl, puy=pdy/pl;
      const pnx=-puy, pny=pux;

      if (joinAtA==="miter") {
        // Miter: intersezione geometrica delle due pareti
        const prevSp2 = winnerSpA*scale*0.5;
        const iL=lineIntersect({x:prevB.x+pnx*prevSp2,y:prevB.y+pny*prevSp2},{x:pux,y:puy},{x:a.x+nx*sp2,y:a.y+ny*sp2},{x:ux,y:uy});
        if(iL&&isFinite(iL.x)) aL=iL;
        const iR=lineIntersect({x:prevB.x-pnx*prevSp2,y:prevB.y-pny*prevSp2},{x:pux,y:puy},{x:a.x-nx*sp2,y:a.y-ny*sp2},{x:ux,y:uy});
        if(iR&&isFinite(iR.x)) aR=iR;
      } else if (joinAtA==="wins") {
        // Vince: il segmento corrente passa sopra — si estende di metà spessore del perdente
        // nella direzione opposta al segmento prev (cioè fuori dal punto di giunzione)
        const retract = winnerSpA*scale*0.5;
        aL={x:a.x+nx*sp2-pux*retract, y:a.y+ny*sp2-puy*retract};
        aR={x:a.x-nx*sp2-pux*retract, y:a.y-ny*sp2-puy*retract};
      } else if (joinAtA==="loses") {
        // Perde: il segmento si ritira dentro il vincitore
        // Il suo endpoint A si sposta di metà spessore del vincitore verso l'interno
        const retract = winnerSpA*scale*0.5;
        aL={x:a.x+nx*sp2+ux*retract, y:a.y+ny*sp2+uy*retract};
        aR={x:a.x-nx*sp2+ux*retract, y:a.y-ny*sp2+uy*retract};
      }
    }

    // LATO B
    if (nextA) {
      const ndx=nextA.x-b.x, ndy=nextA.y-b.y, nl=Math.hypot(ndx,ndy)||1;
      const nux=ndx/nl, nuy=ndy/nl;
      const nnx=-nuy, nny=nux;

      if (joinAtB==="miter") {
        const nextSp2 = winnerSpB*scale*0.5;
        const iL=lineIntersect({x:b.x+nx*sp2,y:b.y+ny*sp2},{x:ux,y:uy},{x:b.x+nnx*nextSp2,y:b.y+nny*nextSp2},{x:nux,y:nuy});
        if(iL&&isFinite(iL.x)) bL=iL;
        const iR=lineIntersect({x:b.x-nx*sp2,y:b.y-ny*sp2},{x:ux,y:uy},{x:b.x-nnx*nextSp2,y:b.y-nny*nextSp2},{x:nux,y:nuy});
        if(iR&&isFinite(iR.x)) bR=iR;
      } else if (joinAtB==="wins") {
        // Vince: si estende oltre il punto B nella direzione del segmento corrente
        // di metà spessore del perdente
        const retract = winnerSpB*scale*0.5;
        bL={x:b.x+nx*sp2+ux*retract, y:b.y+ny*sp2+uy*retract};
        bR={x:b.x-nx*sp2+ux*retract, y:b.y-ny*sp2+uy*retract};
      } else if (joinAtB==="loses") {
        // Perde: il bordo B arretra di metà spessore del vincitore
        const retract = winnerSpB*scale*0.5;
        bL={x:b.x+nx*sp2-ux*retract, y:b.y+ny*sp2-uy*retract};
        bR={x:b.x-nx*sp2-ux*retract, y:b.y-ny*sp2-uy*retract};
      }
    }

    return `${aL.x},${aL.y} ${bL.x},${bL.y} ${bR.x},${bR.y} ${aR.x},${aR.y}`;
  }

  function onDown(e: any) {
    if (e.button===1||(e.touches?.length>=2)) {
      isPanRef.current=true;
      const ct=e.touches
        ?{clientX:(e.touches[0].clientX+e.touches[1].clientX)/2,clientY:(e.touches[0].clientY+e.touches[1].clientY)/2}:e;
      lastPanPt.current={x:ct.clientX,y:ct.clientY};
      if(e.touches?.length===2)
        lastPinch.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      return;
    }
    const raw = toSvg(e);
    const pt = snapPt(raw);

    if (tool==="select") {
      const join = findJoin(raw);
      if (join) {
        const r = svgRef.current!.getBoundingClientRect();
        setJoinMenu({...join, screenX:(join.jPt.x+pan.x)*zoom, screenY:(join.jPt.y+pan.y)*zoom});
      } else setJoinMenu(null);
      return;
    }
    setJoinMenu(null);
    if (!curPt) { setCurPt(pt); }
    else {
      if (segLen(curPt,pt)>4)
        setShapes(s=>[...s,{id:Date.now(),type:tool,a:curPt,b:pt,spessore,joinA:"miter",joinB:"miter"}]);
      setCurPt(pt);
    }
  }

  function onMove(e: any) {
    const ct = e.touches ? e.touches[0] : e;
    if (isPanRef.current) {
      if (e.touches?.length===2 && lastPinch.current) {
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        setZoom(z=>Math.max(0.1,Math.min(8,z*(d/lastPinch.current))));
        lastPinch.current=d;
      }
      setPan(p=>({x:p.x+(ct.clientX-lastPanPt.current.x)/zoom,y:p.y+(ct.clientY-lastPanPt.current.y)/zoom}));
      lastPanPt.current={x:ct.clientX,y:ct.clientY};
      return;
    }
    setMousePos(snapPt(toSvg(e)));
  }

  function onUp() { isPanRef.current=false; lastPinch.current=null; }
  function onDblClick() { if(tool!=="select") setCurPt(null); }
  function onWheel(e: any) {
    e.preventDefault();
    const nz=Math.max(0.1,Math.min(8,zoom*(e.deltaY<0?1.12:0.89)));
    const r=svgRef.current!.getBoundingClientRect();
    const mx=(e.clientX-r.left)/zoom,my=(e.clientY-r.top)/zoom;
    setPan(p=>({x:p.x-mx*(1-zoom/nz),y:p.y-my*(1-zoom/nz)}));
    setZoom(nz);
  }
  function onKeyDown(e: any) {
    if (e.key==="Escape") { setCurPt(null); setJoinMenu(null); }
    if ((e.key==="z"||e.key==="Z")&&(e.ctrlKey||e.metaKey)) {
      if(curPt) setCurPt(null); else setShapes(s=>s.slice(0,-1));
    }
  }

  function findJoin(pt: any) {
    const tol = 20/zoom;
    for(let i=0;i<shapes.length;i++) {
      for(let j=i+1;j<shapes.length;j++) {
        const si=shapes[i], sj=shapes[j];
        for(const pi of [si.a,si.b]) {
          for(const pj of [sj.a,sj.b]) {
            if(Math.hypot(pi.x-pj.x,pi.y-pj.y)<2 && Math.hypot(pt.x-pi.x,pt.y-pi.y)<tol) {
              return {
                jPt:pi, segA:si, segB:sj,
                endA:Math.hypot(si.a.x-pi.x,si.a.y-pi.y)<2?"a":"b",
                endB:Math.hypot(sj.a.x-pi.x,sj.a.y-pi.y)<2?"a":"b"
              };
            }
          }
        }
      }
    }
    return null;
  }

  // A vince → A wins al suo endpoint, B loses al suo endpoint
  // B vince → B wins al suo endpoint, A loses al suo endpoint
  function applyJoin(winner: "A"|"B") {
    if(!joinMenu) return;
    const {segA,segB,endA,endB}=joinMenu;
    setShapes(s=>s.map(sh=>{
      if(sh.id===segA.id) {
        const k=endA==="a"?"joinA":"joinB";
        return {...sh,[k]:winner==="A"?"wins":"loses"};
      }
      if(sh.id===segB.id) {
        const k=endB==="a"?"joinA":"joinB";
        return {...sh,[k]:winner==="B"?"wins":"loses"};
      }
      return sh;
    }));
    setJoinMenu(null);
  }

  function getAdj(s:any) {
    const EPS = 3; // tolleranza snap
    // Solo segmenti dello stesso tipo — muro non si fonde con oggetto
    const others=shapes.filter((x:any)=>x.id!==s.id && x.type===s.type);

    // Cerca segmento il cui endpoint tocca s.a
    // prevB = il punto OPPOSTO dell'adiacente (per calcolare la direzione entrante)
    let prevSeg:any=null, prevB:any=null;
    for(const x of others) {
      if(Math.hypot(x.b.x-s.a.x,x.b.y-s.a.y)<EPS) { prevSeg=x; prevB=x.a; break; }
      if(Math.hypot(x.a.x-s.a.x,x.a.y-s.a.y)<EPS) { prevSeg=x; prevB=x.b; break; }
    }

    // Cerca segmento il cui endpoint tocca s.b
    let nextSeg:any=null, nextA:any=null;
    for(const x of others) {
      if(x.id===prevSeg?.id) continue; // non riusare lo stesso
      if(Math.hypot(x.a.x-s.b.x,x.a.y-s.b.y)<EPS) { nextSeg=x; nextA=x.b; break; }
      if(Math.hypot(x.b.x-s.b.x,x.b.y-s.b.y)<EPS) { nextSeg=x; nextA=x.a; break; }
    }

    return {
      prevB,
      nextA,
      prevSp:prevSeg?.spessore||s.spessore,
      nextSp:nextSeg?.spessore||s.spessore,
    };
  }

  function renderSeg(a:any,b:any,type:string,sp:number,preview=false,id:any=null,
    prevB:any=null,nextA:any=null,joinA="miter",joinB="miter",
    winnerSpA:number=sp,winnerSpB:number=sp) {
    const col=type==="oggetto"?"#3B7FE0":"#1A2B4A";
    const fill=type==="oggetto"?"rgba(59,127,224,0.12)":"rgba(26,43,74,0.14)";
    const len=segLen(a,b);
    const poly=segPolygon(a,b,sp,
      preview?null:prevB, preview?null:nextA,
      preview?"miter":joinA, preview?"miter":joinB,
      winnerSpA, winnerSpB
    );
    const mx2=(a.x+b.x)/2,my2=(a.y+b.y)/2;
    const ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    const fixAng=Math.abs(ang)>90?ang+180:ang;
    return (
      <g key={id||"prev"}>
        <polygon points={poly}
          fill={preview?fill.replace("0.12","0.04").replace("0.14","0.04"):fill}
          stroke={col} strokeWidth={preview?"1":"1.5"} strokeLinejoin="miter" strokeMiterlimit="10"/>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={type==="oggetto"?"#93C5FD":"#94A3B8"} strokeWidth="0.5" strokeDasharray="5,4"/>
        {!preview&&len>15&&<g>
          <rect x={mx2-18} y={my2-8} width={36} height={14} rx="3"
            fill={type==="oggetto"?"rgba(59,127,224,0.9)":"rgba(26,43,74,0.9)"}/>
          <text x={mx2} y={my2+4} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="800"
            transform={`rotate(${fixAng},${mx2},${my2})`}>{lenLabel(len)}</text>
        </g>}
      </g>
    );
  }

  const joinPoints=React.useMemo(()=>{
    const pts:any[]=[];
    for(let i=0;i<shapes.length;i++)
      for(let j=i+1;j<shapes.length;j++){
        const si=shapes[i],sj=shapes[j];
        for(const pi of [si.a,si.b])
          for(const pj of [sj.a,sj.b])
            if(Math.hypot(pi.x-pj.x,pi.y-pj.y)<2) pts.push({x:pi.x,y:pi.y,si,sj});
      }
    return pts;
  },[shapes]);

  const liveLen=curPt&&mousePos&&tool!=="select"?lenLabel(segLen(curPt,mousePos)):"";
  const col=tool==="muro"?"#1A2B4A":tool==="oggetto"?"#3B7FE0":"#D08008";
  const bs2=(on=false,c="#031631")=>({
    padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,
    background:on?c:"#fff",color:on?"#fff":"#44474d",
    border:"1.5px solid "+(on?c:"rgba(197,198,206,0.5)"),
  });

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,outline:"none"}}
      tabIndex={0} onKeyDown={onKeyDown}>
      <div style={{display:"flex",gap:5,padding:"7px 10px",flexWrap:"wrap",alignItems:"center",
        background:"#fff",borderBottom:"1px solid rgba(197,198,206,0.3)",flexShrink:0}}>
        <div onClick={()=>{setTool("muro");setCurPt(null);setJoinMenu(null);}} style={bs2(tool==="muro","#1A2B4A")}>▬ Muro</div>
        <div onClick={()=>{setTool("oggetto");setCurPt(null);setJoinMenu(null);}} style={bs2(tool==="oggetto","#3B7FE0")}>⬜ Oggetto</div>
        <div onClick={()=>{setTool("select");setCurPt(null);}} style={bs2(tool==="select","#D08008")}>✂ Angoli</div>
        <div style={{width:1,height:22,background:"rgba(197,198,206,0.4)"}}/>
        <select value={spessore} onChange={e=>setSpessore(parseInt(e.target.value))}
          style={{padding:"5px 8px",borderRadius:7,border:"1.5px solid rgba(197,198,206,0.5)",
            fontSize:12,fontWeight:700,cursor:"pointer",background:"#fff"}}>
          {[5,8,10,12,15,20,25,30].map(v=><option key={v} value={v}>{v}cm</option>)}
        </select>
        <div style={{width:1,height:22,background:"rgba(197,198,206,0.4)"}}/>
        <div onClick={()=>setZoom(z=>Math.min(8,z*1.2))} style={bs2()}>＋</div>
        <div style={{fontSize:11,fontWeight:700,color:"#64748B",minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</div>
        <div onClick={()=>setZoom(z=>Math.max(0.1,z*0.83))} style={bs2()}>－</div>
        <div onClick={()=>{setZoom(1);setPan({x:60,y:60});}} style={bs2()}>↺</div>
        <div style={{flex:1}}/>
        <div onClick={()=>{if(curPt)setCurPt(null);else setShapes(s=>s.slice(0,-1));}} style={bs2()}>↩</div>
        <div onClick={()=>{setShapes([]);setCurPt(null);setJoinMenu(null);}} style={{...bs2(),color:"#dc4444",borderColor:"#dc444440"}}>Reset</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 12px",
        background:"#F8FAFC",borderBottom:"1px solid rgba(197,198,206,0.2)",flexShrink:0}}>
        <span style={{fontSize:10,color:"#64748B",fontWeight:500}}>
          {tool==="select"?"Tap punto arancione → scegli quale lato vince"
           :!curPt?`Clic punto iniziale ${tool}`
           :"Clic punto finale · continua · Doppio clic per fermare"}
        </span>
        {liveLen&&<span style={{fontSize:13,fontWeight:800,color:col,
          background:"#EFF8FF",padding:"2px 10px",borderRadius:6,marginLeft:"auto"}}>{liveLen}</span>}
      </div>
      <div style={{flex:1,minHeight:0,position:"relative"}}>
        <svg ref={svgRef}
          style={{width:"100%",height:"100%",display:"block",background:"#F9F9FB",
            cursor:isPanRef.current?"grabbing":tool==="select"?"pointer":"crosshair",
            touchAction:"none",userSelect:"none"}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onDoubleClick={onDblClick}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onWheel={onWheel}>
          <g transform={`scale(${zoom}) translate(${pan.x},${pan.y})`}>
            <defs>
              <pattern id="lib-sm" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
              </pattern>
              <pattern id="lib-lg" width={GRID*5} height={GRID*5} patternUnits="userSpaceOnUse">
                <rect width={GRID*5} height={GRID*5} fill="url(#lib-sm)"/>
                <path d={`M ${GRID*5} 0 L 0 0 0 ${GRID*5}`} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect x={-9999} y={-9999} width={19998} height={19998} fill="url(#lib-lg)"/>
            <line x1={-9999} y1={0} x2={9999} y2={0} stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
            <line x1={0} y1={-9999} x2={0} y2={9999} stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
            {shapes.map((s:any)=>{
              const {prevB,nextA,prevSp,nextSp}=getAdj(s);
              return renderSeg(s.a,s.b,s.type,s.spessore,false,s.id,prevB,nextA,s.joinA||"miter",s.joinB||"miter",prevSp,nextSp);
            })}
            {curPt&&mousePos&&tool!=="select"&&renderSeg(curPt,mousePos,tool==="select"?"muro":tool,spessore,true)}
            {curPt&&<circle cx={curPt.x} cy={curPt.y} r={6/zoom} fill="#dc4444" stroke="#fff" strokeWidth={2/zoom}/>}
            {tool==="select"&&joinPoints.map((jp:any,i:number)=>(
              <circle key={i} cx={jp.x} cy={jp.y} r={8/zoom}
                fill={joinMenu&&Math.hypot(joinMenu.jPt.x-jp.x,joinMenu.jPt.y-jp.y)<2?"#dc4444":"#D08008"}
                stroke="#fff" strokeWidth={2/zoom} style={{cursor:"pointer"}}/>
            ))}
            {mousePos&&tool!=="select"&&<circle cx={mousePos.x} cy={mousePos.y} r={3/zoom}
              stroke={col} strokeWidth={1/zoom} fill="rgba(59,127,224,0.2)"/>}
          </g>
        </svg>

        {joinMenu&&(
          <div style={{
            position:"absolute",
            left:Math.min(Math.max(joinMenu.screenX-75,8),240),
            top:Math.max(joinMenu.screenY-110,8),
            background:"#fff",borderRadius:12,padding:"12px",
            boxShadow:"0 4px 24px rgba(0,0,0,0.18)",
            border:"1px solid #E2E8F0",zIndex:100,width:160,
          }}>
            <div style={{fontSize:11,fontWeight:800,color:"#1A2B4A",marginBottom:10,textAlign:"center"}}>
              Chi passa sopra?
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <div onClick={()=>applyJoin("A")}
                style={{flex:1,padding:"10px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",
                  background:"rgba(26,43,74,0.08)",border:"2px solid #1A2B4A"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A"}}>A</div>
                <div style={{fontSize:9,color:"#64748B",marginTop:2}}>vince</div>
              </div>
              <div onClick={()=>applyJoin("B")}
                style={{flex:1,padding:"10px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",
                  background:"rgba(59,127,224,0.08)",border:"2px solid #3B7FE0"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#3B7FE0"}}>B</div>
                <div style={{fontSize:9,color:"#64748B",marginTop:2}}>vince</div>
              </div>
            </div>
            <div onClick={()=>{
              const {segA,segB,endA,endB}=joinMenu;
              setShapes(s=>s.map(sh=>{
                if(sh.id===segA.id) return {...sh,[endA==="a"?"joinA":"joinB"]:"miter"};
                if(sh.id===segB.id) return {...sh,[endB==="a"?"joinA":"joinB"]:"miter"};
                return sh;
              }));
              setJoinMenu(null);
            }} style={{textAlign:"center",fontSize:10,color:"#94A3B8",cursor:"pointer",padding:"4px"}}>
              ↺ Ripristina miter
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DisegnoTecnico({ vanoId, vanoNome, vanoDisegno, realW: propRealW, realH: propRealH, onUpdate, onUpdateField, onClose, T, vanoSistema, vanoColore, vanoProfilo, vanoTipologiaId, vanoTipologiaNome }) {
  const [viewTab, setViewTab] = React.useState("disegno");
  const [menuTab, setMenuTab] = React.useState<"struttura"|"profili"|"aperture"|"accessori"|"sensi"|"strumenti"|null>(null);
  const [telaioBatch, setTelaioBatch] = React.useState<{open: boolean, L: string, H: string, N: string} | null>(null);
  const [shapePicker, setShapePicker] = React.useState<{open: boolean, shape: string | null, L: string, H: string, H2: string, H3: string, H4: string, N: string} | null>(null);
  const telaioTapRef = React.useRef<number>(0);
  const [savingTipologia, setSavingTipologia] = React.useState<{open: boolean, nome: string, categoria: string, n_ante: string, note: string} | null>(null);
  const [savingTipoStatus, setSavingTipoStatus] = React.useState<string>("");
  const [showGestioneTipo, setShowGestioneTipo] = React.useState<boolean>(false);
  // Accessori: sub-tab + modal catalogo
  const [accSubTab, setAccSubTab] = React.useState<"catalogo" | "veloci">("veloci");
  const [showCatalogo, setShowCatalogo] = React.useState<boolean>(false);
  // Selettore vetri intelligente
  const [showSelettoreVetri, setShowSelettoreVetri] = React.useState<boolean>(false);
  const [selectedVetro, setSelectedVetro] = React.useState<any | null>(null);
  // Selettore profili (catalogo articoli)
  const [showSelettoreProfilo, setShowSelettoreProfilo] = React.useState<boolean>(false);
  const [profiloTargetEl, setProfiloTargetEl] = React.useState<{ id: number; ruolo: string } | null>(null);
  // Selettore nodi costruttivi
  const [showSelettoreNodo, setShowSelettoreNodo] = React.useState<boolean>(false);
  const [nodoTarget, setNodoTarget] = React.useState<{ key: string; x: number; y: number; profili: string[] } | null>(null);
  const [showNodi, setShowNodi] = React.useState<boolean>(false); // toggle visibilità nodi nel disegno // vetro scelto da applicare al prossimo place-vetro
  const [catalogoData, setCatalogoData] = React.useState<any[]>([]);
  const [pendingCatAcc, setPendingCatAcc] = React.useState<any | null>(null); // accessorio scelto, in attesa di click sul disegno
  const [pendingVeloce, setPendingVeloce] = React.useState<string | null>(null); // pittogramma veloce in attesa
  React.useEffect(() => {
    if (showCatalogo && catalogoData.length === 0) {
      fetch("/api/catalogo-accessori")
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (Array.isArray(d)) setCatalogoData(d); })
        .catch(() => {});
    }
  }, [showCatalogo, catalogoData.length]);
  const [vista, setVista] = React.useState<"interna"|"esterna">("interna");

  const [dimEdit, setDimEdit] = React.useState<{id: any, val: string, x: number, y: number} | null>(null);
  const [cornerEdit, setCornerEdit] = React.useState<{vx: number, vy: number, _t?: number} | null>(null);
  const openCornerEdit = React.useCallback((data: any) => setCornerEdit({ ...data, _t: Date.now() }), []);
  const realW = propRealW || 1200;
  const realH = propRealH || 1000;
                            const dw = vanoDisegno || { elements: [], selectedId: null, drawMode: null, history: [] };
                            const els = dw.elements || [];
                            const selId = dw.selectedId || null;
                            const drawMode = dw.drawMode || null; // "line"|"apertura"|"place-anta"|"place-vetro"|"place-ap"
                            // dwRef: sempre aggiornato, usato nei click handler per evitare stale closure
                            const dwRef = React.useRef(dw);
                            dwRef.current = dw;
                            // Stato gesture multi-touch per pinch-zoom + pan a 2 dita
                            const pinchRef = React.useRef<any>({ active: false, startDist: 0, startZoom: 1, startPanX: 0, startPanY: 0, startMidX: 0, startMidY: 0 });
                            const placeApType = dw._placeApType || "SX";
                            const zoom = dw._zoom || 1;
                            const panX = dw._panX || 0, panY = dw._panY || 0;
                            const canvasW = Math.min(window.innerWidth > 768 ? 900 : window.innerWidth - 8, window.innerWidth - 8);
                            const GRID = 1; // movimento fluido al pixel
                            // Touch detection: dita richiedono raggio molto piu' grande del mouse
                            const _isTouch = typeof window !== "undefined" && (("ontouchstart" in window) || (navigator.maxTouchPoints > 0));
                            // Base: 120 su touch (pollice + imprecisione), 28 mouse. Diviso per zoom.
                            const SNAP_R = (_isTouch ? 300 : 60) / Math.max(0.4, (dw._zoom || 1));

                            const aspect = realW / realH;
                            const PAD = 24, PAD_DIM = 28;
                            const maxW = canvasW - PAD * 2 - PAD_DIM;
                            // Compute content bounds (considering multiple frames and freeLines)
                            let contentW = maxW, contentH = maxW / aspect;
                            // No height cap — use full space
                            if (contentH > maxW * 1.5) { contentH = maxW * 1.5; contentW = contentH * aspect; }
                            let fW = contentW, fH = contentH;
                            // For multi-frame: compute bounding box of all frames
                            const allFrames = els.filter(e => e.type === "rect");
                            if (allFrames.length > 1) {
                              const bx1 = Math.min(...allFrames.map(f => f.x));
                              const by1 = Math.min(...allFrames.map(f => f.y));
                              const bx2 = Math.max(...allFrames.map(f => f.x + f.w));
                              const by2 = Math.max(...allFrames.map(f => f.y + f.h));
                              fW = bx2 - bx1 + PAD; fH = by2 - by1 + PAD;
                            }
                            const baseCanvasH = Math.max(400, fH + PAD * 2 + PAD_DIM);
                            const canvasH = baseCanvasH;
                            const fX = PAD, fY = PAD;
                            const snap = (v2) => Math.round(v2 / GRID) * GRID;

                            // ══ CELL DETECTION ══
                            const frames = els.filter(e => e.type === "rect");
                            const frame = frames[0] || null; // primary frame for compat
                            const allMontanti = els.filter(e => e.type === "montante");
                            const allTraversi = els.filter(e => e.type === "traverso");
                            const TK_FRAME = 6, TK_MONT = 7, TK_ANTA = 9, TK_PORTA = 10, TK_SOGLIA = 3, TK_ZOCCOLO = 8, TK_FASCIA = 5, TK_PROFCOMP = 4;
                            const HM = TK_MONT / 2;

                            // ══ POLYGONS from freeLines — tutte le catene chiuse ══
                            // FIX: solo freeLine SENZA subType (cioè il telaio puro TEL.LIB.).
                            // Se includessimo zoccoli/soglie/fasce/profili, la catena risulterebbe
                            // distorta o spezzata e il render del telaio sparirebbe.
                            const getPolygons = () => {
                              const lines = els.filter(e => e.type === "freeLine" && !e.subType);
                              if (lines.length < 3) return [];
                              const CONN = 15;
                              const usedGlobal = new Set();
                              const result = [];
                              const buildChain = (startIdx) => {
                                const used = new Set();
                                const pts = [];
                                const addP = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                const fl = lines[startIdx];
                                addP(fl.x1, fl.y1); addP(fl.x2, fl.y2); used.add(startIdx);
                                for (let it = 0; it < lines.length; it++) {
                                  const last = pts[pts.length-1];
                                  let found = false;
                                  for (let li = 0; li < lines.length; li++) {
                                    if (used.has(li) || usedGlobal.has(li)) continue;
                                    const l = lines[li];
                                    if (Math.hypot(l.x1-last[0],l.y1-last[1])<CONN) { addP(l.x2,l.y2); used.add(li); found=true; break; }
                                    if (Math.hypot(l.x2-last[0],l.y2-last[1])<CONN) { addP(l.x1,l.y1); used.add(li); found=true; break; }
                                  }
                                  if (!found) break;
                                }
                                if (pts.length < 3) return null;
                                const first = pts[0], lastPt = pts[pts.length-1];
                                if (Math.hypot(first[0]-lastPt[0],first[1]-lastPt[1]) < CONN) {
                                  used.forEach(i => usedGlobal.add(i));
                                  return pts;
                                }
                                return null;
                              };
                              for (let i = 0; i < lines.length; i++) {
                                if (usedGlobal.has(i)) continue;
                                const chain = buildChain(i);
                                if (chain) result.push(chain);
                              }
                              return result;
                            };
                            const polys = !frame ? getPolygons() : [];
                            const poly = polys.length > 0 ? polys.reduce((a,b) => {
                              const area = (p) => Math.abs(p.reduce((s,pt,i)=>{ const q=p[(i+1)%p.length]; return s+(pt[0]*q[1]-q[0]*pt[1]); },0)/2);
                              return area(a) >= area(b) ? a : b;
                            }) : null;

                            // ══ Line-segment intersection helpers ══
                            const segIntersectV = (x, pts2) => {
                              // Find Y values where vertical line x=X intersects polygon edges
                              const ys = [];
                              for (let i = 0; i < pts2.length; i++) {
                                const a = pts2[i], b = pts2[(i + 1) % pts2.length];
                                const minX = Math.min(a[0], b[0]), maxX = Math.max(a[0], b[0]);
                                if (x >= minX - 1 && x <= maxX + 1 && Math.abs(b[0] - a[0]) > 0.5) {
                                  const t = (x - a[0]) / (b[0] - a[0]);
                                  if (t >= -0.01 && t <= 1.01) ys.push(a[1] + t * (b[1] - a[1]));
                                }
                              }
                              ys.sort((a2, b2) => a2 - b2);
                              return ys.length >= 2 ? [ys[0], ys[ys.length - 1]] : null;
                            };
                            const segIntersectH = (y, pts2) => {
                              const xs = [];
                              for (let i = 0; i < pts2.length; i++) {
                                const a = pts2[i], b = pts2[(i + 1) % pts2.length];
                                const minY = Math.min(a[1], b[1]), maxY = Math.max(a[1], b[1]);
                                if (y >= minY - 1 && y <= maxY + 1 && Math.abs(b[1] - a[1]) > 0.5) {
                                  const t = (y - a[1]) / (b[1] - a[1]);
                                  if (t >= -0.01 && t <= 1.01) xs.push(a[0] + t * (b[0] - a[0]));
                                }
                              }
                              xs.sort((a2, b2) => a2 - b2);
                              return xs.length >= 2 ? [xs[0], xs[xs.length - 1]] : null;
                            };

                            // ══ BSP Cell Splitting ══
                            const bspSplit = (startCells) => {
                              let cl = startCells;
                              allMontanti.forEach((m, mi) => {
                                const next = [];
                                cl.forEach(c => {
                                  const my1 = m.y1 !== undefined ? m.y1 : c.y;
                                  const my2 = m.y2 !== undefined ? m.y2 : c.y + c.h;
                                  if (m.x > c.x + HM + 2 && m.x < c.x + c.w - HM - 2 && my1 <= c.y + c.h * 0.4 && my2 >= c.y + c.h * 0.6) {
                                    next.push({ x: c.x, y: c.y, w: m.x - HM - c.x, h: c.h, id: c.id + "L" + mi });
                                    next.push({ x: m.x + HM, y: c.y, w: c.x + c.w - m.x - HM, h: c.h, id: c.id + "R" + mi });
                                  } else { next.push(c); }
                                });
                                cl = next;
                              });
                              allTraversi.forEach((t, ti) => {
                                const next = [];
                                cl.forEach(c => {
                                  const tx1 = t.x1 !== undefined ? t.x1 : c.x;
                                  const tx2 = t.x2 !== undefined ? t.x2 : c.x + c.w;
                                  if (t.y > c.y + HM + 2 && t.y < c.y + c.h - HM - 2 && tx1 <= c.x + 2 && tx2 >= c.x + c.w - 2) {
                                    next.push({ x: c.x, y: c.y, w: c.w, h: t.y - HM - c.y, id: c.id + "T" + ti });
                                    next.push({ x: c.x, y: t.y + HM, w: c.w, h: c.y + c.h - t.y - HM, id: c.id + "B" + ti });
                                  } else { next.push(c); }
                                });
                                cl = next;
                              });
                              return cl;
                            };
                            const getCells = () => {
                              // Multi-frame support (zoppi): each frame gets its own cells
                              if (frames.length > 0) {
                                let allCells = [];
                                frames.forEach((fr, fi) => {
                                  const iX = fr.x + TK_FRAME, iY = fr.y + TK_FRAME;
                                  const iW = fr.w - TK_FRAME * 2, iH = fr.h - TK_FRAME * 2;
                                  if (iW < 4 || iH < 4) return;
                                  const startCells = [{ x: iX, y: iY, w: iW, h: iH, id: `F${fi}` }];
                                  allCells = allCells.concat(bspSplit(startCells));
                                });
                                return allCells;
                              }
                              // Polygon cells
                              if (poly) {
                                const allX2 = poly.map(p => p[0]), allY2 = poly.map(p => p[1]);
                                const pL = Math.min(...allX2) + TK_FRAME, pR = Math.max(...allX2) - TK_FRAME;
                                const pT = Math.min(...allY2) + TK_FRAME, pB = Math.max(...allY2) - TK_FRAME;
                                return bspSplit([{ x: pL, y: pT, w: pR - pL, h: pB - pT, id: "P0" }]);
                              }
                              // Fallback: poly non chiuso — usa bbox delle freeLine senza subType
                              const _bboxLines = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                              if (_bboxLines.length >= 2) {
                                const _bX = _bboxLines.flatMap((l: any) => [l.x1, l.x2]);
                                const _bY = _bboxLines.flatMap((l: any) => [l.y1, l.y2]);
                                const _bbox = { x: Math.min(..._bX) + TK_FRAME, y: Math.min(..._bY) + TK_FRAME, w: Math.max(..._bX) - Math.min(..._bX) - TK_FRAME * 2, h: Math.max(..._bY) - Math.min(..._bY) - TK_FRAME * 2, id: "BBOX" };
                                if (_bbox.w > 10 && _bbox.h > 10) return bspSplit([_bbox]);
                              }
                              return [];
                            };
                            const cells = getCells();

                            const findCellAt = (mx, my) => {
                              return cells.find(c2 => mx >= c2.x && mx <= c2.x + c2.w && my >= c2.y && my <= c2.y + c2.h);
                            };

                            // ══ Snap points ══
                            const getSnapPoints = () => {
                              const pts = [];
                              // Frame: angoli + mezzerie + bordi continui
                              frames.forEach(fr => {
                                const fx = fr.x, fy = fr.y, fw = fr.w, fh2 = fr.h;
                                pts.push({x:fx,y:fy},{x:fx+fw,y:fy},{x:fx,y:fy+fh2},{x:fx+fw,y:fy+fh2});
                                pts.push({x:fx+fw/2,y:fy},{x:fx+fw/2,y:fy+fh2},{x:fx,y:fy+fh2/2},{x:fx+fw,y:fy+fh2/2});
                                for (let t = GRID; t < fw; t += GRID) pts.push({x:fx+t,y:fy},{x:fx+t,y:fy+fh2});
                                for (let t = GRID; t < fh2; t += GRID) pts.push({x:fx,y:fy+t},{x:fx+fw,y:fy+t});
                                // ── BORDO INTERNO del telaio (dove si aggancia lo zoccolo/soglia al telaio) ──
                                // Lati interni a filo TK_FRAME dall'esterno
                                // Flag _antaSnap + _antaOri, così profileMode (zoccolo/soglia) li vede.
                                const ix1 = fx + TK_FRAME, ix2 = fx + fw - TK_FRAME;
                                const iy1 = fy + TK_FRAME, iy2 = fy + fh2 - TK_FRAME;
                                // 4 angoli interni (senza _antaSnap, per snap generale)
                                pts.push({x:ix1,y:iy1},{x:ix2,y:iy1},{x:ix1,y:iy2},{x:ix2,y:iy2});
                                // Bordi interni continui ogni 2px, con flag _antaSnap per attivarsi in profileMode
                                // Top (ori H) e Bot (ori H): per soglia/zoccolo orizzontali
                                for (let xx = ix1; xx <= ix2; xx += 2) {
                                  pts.push({x:xx, y:iy1, _antaSnap:true, _antaOri:"H"});
                                  pts.push({x:xx, y:iy2, _antaSnap:true, _antaOri:"H"});
                                }
                                // Left (ori V) e Right (ori V): per profili verticali
                                for (let yy = iy1; yy <= iy2; yy += 2) {
                                  pts.push({x:ix1, y:yy, _antaSnap:true, _antaOri:"V"});
                                  pts.push({x:ix2, y:yy, _antaSnap:true, _antaOri:"V"});
                                }
                              });
                              // Celle
                              cells.forEach(c2 => {
                                pts.push({x:c2.x,y:c2.y},{x:c2.x+c2.w,y:c2.y},{x:c2.x,y:c2.y+c2.h},{x:c2.x+c2.w,y:c2.y+c2.h});
                              });
                              // Montanti — estremità + mezza altezza
                              els.filter(e => e.type === "montante").forEach(m => {
                                const my1 = m.y1 ?? (frame ? frame.y : fY);
                                const my2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                pts.push({x:m.x, y:my1},{x:m.x, y:my2},{x:m.x, y:(my1+my2)/2});
                                // Snap lungo tutto il montante (ogni GRID pixel)
                                for (let y = my1 + GRID; y < my2; y += GRID) pts.push({x:m.x, y});
                              });
                              // Traversi — bordi superiore e inferiore + centro
                              els.filter(e => e.type === "traverso").forEach(t => {
                                const tx1 = t.x1 ?? (frame ? frame.x : fX);
                                const tx2 = t.x2 ?? (frame ? frame.x + frame.w : fX + fW);
                                const HT2 = TK_MONT / 2;
                                // centro, bordo sup, bordo inf
                                pts.push({x:tx1, y:t.y},{x:tx2, y:t.y},{x:(tx1+tx2)/2, y:t.y});
                                pts.push({x:tx1, y:t.y-HT2},{x:tx2, y:t.y-HT2},{x:(tx1+tx2)/2, y:t.y-HT2});
                                pts.push({x:tx1, y:t.y+HT2},{x:tx2, y:t.y+HT2},{x:(tx1+tx2)/2, y:t.y+HT2});
                                for (let x = tx1 + GRID; x < tx2; x += GRID) pts.push({x, y:t.y});
                              });
                              // FreeLine — snap a bordi esatti del profilo renderizzato
                              // Bordo sup zoccolo = l.y1 - halfT + TK_FRAME, bordo inf = l.y1 + halfT + TK_FRAME
                              const tkSnapMap: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                              els.filter(e => e.type === "freeLine").forEach(l => {
                                const len = Math.hypot(l.x2-l.x1, l.y2-l.y1) || 1;
                                const ux = (l.x2-l.x1)/len, uy = (l.y2-l.y1)/len;
                                const hT = l.subType ? (tkSnapMap[l.subType] || TK_FRAME) : TK_FRAME;
                                const isHz = l.subType && Math.abs(l.y2-l.y1) <= Math.abs(l.x2-l.x1) + 0.5;
                                const mx2 = (l.x1+l.x2)/2, my2 = (l.y1+l.y2)/2;
                                // Estremità e centro sulla linea
                                pts.push({x:l.x1,y:l.y1},{x:l.x2,y:l.y2},{x:mx2,y:my2});
                                if (isHz) {
                                  // Bordo superiore renderizzato: ey1 = l.y1 - hT + TK_FRAME
                                  const yTop = l.y1 - hT + TK_FRAME;
                                  // Bordo inferiore renderizzato: ey1 + ny*2 = yTop + hT*2
                                  const yBot = yTop + hT * 2;
                                  pts.push({x:l.x1,y:yTop},{x:l.x2,y:yTop},{x:mx2,y:yTop});
                                  pts.push({x:l.x1,y:yBot},{x:l.x2,y:yBot},{x:mx2,y:yBot});
                                  // Snap ogni GRID lungo i bordi
                                  for (let d = GRID; d < len; d += GRID) {
                                    pts.push({x:l.x1+ux*d, y:yTop});
                                    pts.push({x:l.x1+ux*d, y:yBot});
                                  }
                                }
                                // Snap lungo la linea ogni GRID pixel
                                for (let d = GRID; d < len; d += GRID) pts.push({x:l.x1+ux*d, y:l.y1+uy*d});
                              });
                              // ── SNAP sui lati ELIMINATI delle ante (aggancio profilo allo spazio vuoto) ──
                              // Flag _antaSnap = true → questi punti hanno raggio snap più ampio (vedi findSnap)
                              els.filter(e => e.type === "innerRect" && (e.hiddenSides || []).length > 0).forEach(a => {
                                const TK = a.subType === "porta" ? TK_PORTA : TK_ANTA;
                                const hid = a.hiddenSides || [];
                                const offLeft = hid.includes("left") ? 0 : TK;
                                const offRight = hid.includes("right") ? 0 : TK;
                                const offTop = hid.includes("top") ? 0 : TK;
                                const offBot = hid.includes("bot") ? 0 : TK;
                                const pushA = (p: any) => pts.push({ ...p, _antaSnap: true });
                                const pushAO = (p: any, ori: string) => pts.push({ ...p, _antaSnap: true, _antaOri: ori });
                                hid.forEach((side: string) => {
                                  if (side === "top") {
                                    const y = a.y + TK + 2;
                                    const x1 = a.x + offLeft - 2, x2 = a.x + a.w - offRight + 2;
                                    pushAO({x: x1, y}, "H"); pushAO({x: x2, y}, "H"); pushAO({x: (x1+x2)/2, y}, "H");
                                    for (let d = GRID; d < (x2-x1); d += GRID) pushAO({x: x1+d, y}, "H");
                                  } else if (side === "bot") {
                                    const y = a.y + a.h - TK + 2;
                                    const x1 = a.x + offLeft - 2, x2 = a.x + a.w - offRight + 2;
                                    pushAO({x: x1, y}, "H"); pushAO({x: x2, y}, "H"); pushAO({x: (x1+x2)/2, y}, "H");
                                    for (let d = GRID; d < (x2-x1); d += GRID) pushAO({x: x1+d, y}, "H");
                                  } else if (side === "left") {
                                    const x = a.x + TK + 2;
                                    const y1 = a.y + offTop - 2, y2 = a.y + a.h - offBot + 2;
                                    pushAO({x, y: y1}, "V"); pushAO({x, y: y2}, "V"); pushAO({x, y: (y1+y2)/2}, "V");
                                    for (let d = GRID; d < (y2-y1); d += GRID) pushAO({x, y: y1+d}, "V");
                                  } else if (side === "right") {
                                    const x = a.x + a.w - TK + 2;
                                    const y1 = a.y + offTop - 2, y2 = a.y + a.h - offBot + 2;
                                    pushAO({x, y: y1}, "V"); pushAO({x, y: y2}, "V"); pushAO({x, y: (y1+y2)/2}, "V");
                                    for (let d = GRID; d < (y2-y1); d += GRID) pushAO({x, y: y1+d}, "V");
                                  }
                                });
                              });
                              // ── SNAP esteso: spazio tra 2+ ante con stesso lato hidden allineato ──
                              // Esempio: 2 ante affiancate con lato "bot" eliminato → zoccolo deve passare anche nello spazio centrale
                              // FIX: pushAG ora porta anche _antaOri (H/V) così il secondo click forza l'allineamento rigido
                              const pushAG = (p: any, ori: string) => pts.push({ ...p, _antaSnap: true, _antaOri: ori });
                              const antasWithHidden = els.filter(e => e.type === "innerRect" && (e.hiddenSides || []).length > 0);
                              ["top", "bot"].forEach(sideKey => {
                                const group = antasWithHidden.filter(a => (a.hiddenSides || []).includes(sideKey));
                                if (group.length < 2) return;
                                // Raggruppa per Y allineata (tolleranza 5px)
                                const getY = (a: any) => { const tkA = a.subType==="porta"?TK_PORTA:TK_ANTA; return sideKey === "top" ? a.y + tkA + 2 : a.y + a.h - tkA + 2; };
                                const sorted = [...group].sort((a,b) => a.x - b.x);
                                for (let i = 0; i < sorted.length - 1; i++) {
                                  const a1 = sorted[i], a2 = sorted[i+1];
                                  const y1 = getY(a1), y2 = getY(a2);
                                  if (Math.abs(y1 - y2) > 5) continue; // non allineate
                                  const y = (y1 + y2) / 2;
                                  const xStart = a1.x + a1.w, xEnd = a2.x;
                                  if (xEnd <= xStart) continue;
                                  // Punti lungo lo spazio tra le due ante (orizzontale → _antaOri="H")
                                  pushAG({x: xStart, y}, "H"); pushAG({x: xEnd, y}, "H"); pushAG({x: (xStart+xEnd)/2, y}, "H");
                                  for (let d = 0; d <= (xEnd-xStart); d += GRID) pushAG({x: xStart+d, y}, "H");
                                }
                              });
                              ["left", "right"].forEach(sideKey => {
                                const group = antasWithHidden.filter(a => (a.hiddenSides || []).includes(sideKey));
                                if (group.length < 2) return;
                                const getX = (a: any) => { const tkA = a.subType==="porta"?TK_PORTA:TK_ANTA; return sideKey === "left" ? a.x + tkA + 2 : a.x + a.w - tkA + 2; };
                                const sorted = [...group].sort((a,b) => a.y - b.y);
                                for (let i = 0; i < sorted.length - 1; i++) {
                                  const a1 = sorted[i], a2 = sorted[i+1];
                                  const x1 = getX(a1), x2 = getX(a2);
                                  if (Math.abs(x1 - x2) > 5) continue;
                                  const x = (x1 + x2) / 2;
                                  const yStart = a1.y + a1.h, yEnd = a2.y;
                                  if (yEnd <= yStart) continue;
                                  // Verticale → _antaOri="V"
                                  pushAG({x, y: yStart}, "V"); pushAG({x, y: yEnd}, "V"); pushAG({x, y: (yStart+yEnd)/2}, "V");
                                  for (let d = 0; d <= (yEnd-yStart); d += GRID) pushAG({x, y: yStart+d}, "V");
                                }
                              });
                              // ── ZOCCOLI LIBERI: NIENTE snap. Il montante deve passare a fianco e proseguire fino al telaio.
                              // (Nessun punto agganciabile sui bordi dello zoccoloLibero per evitare che il Mont.Lib. si fermi sopra.)
                              return pts;
                            };
                            const findSnap = (mx, my) => {
                              const pts = getSnapPoints();
                              const chainStart = dw._chainStart;
                              const freeLines = els.filter(e => e.type === "freeLine");
                              const canClose = freeLines.length >= 3;
                              let best = null, bestD = SNAP_R;
                              const ANTA_SNAP_R = 60; // raggio snap per lati ante eliminati (domina su vertici telaio)
                              const isProfileMode = dw.drawMode === "line" && ["zoccolo","soglia","fascia","profcomp","soglia_rib"].includes(dw._lineSubType);

                              // ════════════════════════════════════════════════════════════════
                              // TEL.LIB. PURO (no subType) — logica SEMPLICE come nei mesi passati.
                              // Solo Endpoint vicini + chainStart vicino. Niente alignment, niente OSNAP avanzati,
                              // niente punti artificiali. Massima libertà di disegno.
                              // ════════════════════════════════════════════════════════════════
                              if (dw.drawMode === "line" && !dw._lineSubType) {
                                const SR = SNAP_R;
                                // Endpoint linee esistenti
                                freeLines.forEach((l: any) => {
                                  [{x: l.x1, y: l.y1}, {x: l.x2, y: l.y2}].forEach(p => {
                                    const d = Math.hypot(p.x - mx, p.y - my);
                                    if (d < SR && d < bestD) { bestD = d; best = { x: p.x, y: p.y, _osnap: 'END' }; }
                                  });
                                });
                                // Vertici di rect (telaio classico)
                                els.filter((e: any) => e.type === "rect").forEach((r: any) => {
                                  [{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x,y:r.y+r.h},{x:r.x+r.w,y:r.y+r.h}].forEach(p => {
                                    const d = Math.hypot(p.x - mx, p.y - my);
                                    if (d < SR && d < bestD) { bestD = d; best = { x: p.x, y: p.y, _osnap: 'END' }; }
                                  });
                                });
                                // Snap al chainStart per chiudere la forma — solo se ≥3 lati esistenti
                                if (canClose && chainStart) {
                                  const d = Math.hypot(chainStart.x - mx, chainStart.y - my);
                                  if (d < SR && d < bestD + 2) { best = { x: chainStart.x, y: chainStart.y, _osnap: 'END' }; bestD = d; }
                                }
                                // FINE: niente alignment, niente weld, niente forzature.
                                return best;
                              }
                              // ════════════════════════════════════════════════════════════════

                              // ══ OSNAP AVANZATI ══ (priorità alta su disegni TEL.LIB.)
                              // Solo se non siamo in profileMode (i profili hanno snap dedicato).
                              if (!isProfileMode && dw.drawMode === "line" && !dw._lineSubType) {
                                const OSNAP_R = SNAP_R * 0.8;
                                const lines = freeLines.filter(l => l.x1 !== undefined);
                                // 1. ENDPOINT (già coperto da pts ma con label esplicita)
                                lines.forEach(l => {
                                  [{x:l.x1, y:l.y1}, {x:l.x2, y:l.y2}].forEach(p => {
                                    const d = Math.hypot(p.x - mx, p.y - my);
                                    if (d < OSNAP_R && d < bestD) { bestD = d; best = { ...p, _osnap: 'END' }; }
                                  });
                                });
                                // 2. MIDPOINT — punto medio di ogni linea
                                lines.forEach(l => {
                                  const mp = { x: (l.x1+l.x2)/2, y: (l.y1+l.y2)/2 };
                                  const d = Math.hypot(mp.x - mx, mp.y - my);
                                  if (d < OSNAP_R && d < bestD) { bestD = d; best = { ...mp, _osnap: 'MID' }; }
                                });
                                // 3. INTERSECTION — intersezione tra coppie di linee
                                for (let i = 0; i < lines.length; i++) {
                                  for (let j = i+1; j < lines.length; j++) {
                                    const a = lines[i], b = lines[j];
                                    const ax1=a.x1,ay1=a.y1,ax2=a.x2,ay2=a.y2;
                                    const bx1=b.x1,by1=b.y1,bx2=b.x2,by2=b.y2;
                                    const denom = (ax1-ax2)*(by1-by2) - (ay1-ay2)*(bx1-bx2);
                                    if (Math.abs(denom) < 0.01) continue; // linee parallele
                                    const t = ((ax1-bx1)*(by1-by2) - (ay1-by1)*(bx1-bx2)) / denom;
                                    const u = -((ax1-ax2)*(ay1-by1) - (ay1-ay2)*(ax1-bx1)) / denom;
                                    // Intersezione effettiva sui segmenti (0<=t<=1 e 0<=u<=1) → 'INT' rosso
                                    // Se proiezione fuori → 'EXT' (extension) opzionale
                                    if (t >= -0.1 && t <= 1.1 && u >= -0.1 && u <= 1.1) {
                                      const ix = ax1 + t*(ax2-ax1);
                                      const iy = ay1 + t*(ay2-ay1);
                                      const d = Math.hypot(ix - mx, iy - my);
                                      if (d < OSNAP_R && d < bestD) { bestD = d; best = { x: ix, y: iy, _osnap: 'INT' }; }
                                    }
                                  }
                                }
                                // 4. PERPENDICULAR — dal pending point, perpendicolare a una linea
                                const pp = dw._pendingLine;
                                if (pp) {
                                  lines.forEach(l => {
                                    const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
                                    const len2 = dx*dx + dy*dy;
                                    if (len2 < 1) return;
                                    // Proiezione di pp su linea
                                    const t = ((pp.x1 - l.x1)*dx + (pp.y1 - l.y1)*dy) / len2;
                                    const px = l.x1 + t*dx;
                                    const py = l.y1 + t*dy;
                                    // Filtro: il punto deve essere sul segmento (0..1) e vicino al cursore
                                    if (t >= 0 && t <= 1) {
                                      const d = Math.hypot(px - mx, py - my);
                                      if (d < OSNAP_R && d < bestD) { bestD = d; best = { x: px, y: py, _osnap: 'PERP' }; }
                                    }
                                  });
                                }
                                // 5. NEAREST — punto più vicino su una linea (lower priority)
                                lines.forEach(l => {
                                  const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
                                  const len2 = dx*dx + dy*dy;
                                  if (len2 < 1) return;
                                  const t = Math.max(0, Math.min(1, ((mx - l.x1)*dx + (my - l.y1)*dy) / len2));
                                  const npx = l.x1 + t*dx, npy = l.y1 + t*dy;
                                  const d = Math.hypot(npx - mx, npy - my);
                                  // Solo se molto vicino, e solo se nessun snap forte è stato trovato
                                  if (d < OSNAP_R * 0.4 && d < bestD - 3) { bestD = d; best = { x: npx, y: npy, _osnap: 'NEAR' }; }
                                });
                                // 6. EXTENSION — estensione di una linea oltre i suoi endpoint
                                lines.forEach(l => {
                                  const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
                                  const len2 = dx*dx + dy*dy;
                                  if (len2 < 1) return;
                                  const t = ((mx - l.x1)*dx + (my - l.y1)*dy) / len2;
                                  if (t > 1.05 || t < -0.05) {
                                    // Punto sull'estensione
                                    const ex = l.x1 + t*dx, ey = l.y1 + t*dy;
                                    const d = Math.hypot(ex - mx, ey - my);
                                    if (d < OSNAP_R * 0.5 && d < bestD - 5) { bestD = d; best = { x: ex, y: ey, _osnap: 'EXT' }; }
                                  }
                                });
                                // 7. QUADRANT — 4 punti cardinali di rect (zoccoloLibero, fermavetroRect, innerRect)
                                els.filter(e => ["zoccoloLibero","fermavetroRect","innerRect","rect"].includes(e.type)).forEach(r => {
                                  const cx = r.x + r.w/2, cy = r.y + r.h/2;
                                  const quads = [
                                    {x: cx, y: r.y}, {x: r.x + r.w, y: cy}, {x: cx, y: r.y + r.h}, {x: r.x, y: cy}
                                  ];
                                  quads.forEach(q => {
                                    const d = Math.hypot(q.x - mx, q.y - my);
                                    if (d < OSNAP_R && d < bestD) { bestD = d; best = { ...q, _osnap: 'QUAD' }; }
                                  });
                                });
                              }
                              // FIX: in profileMode, i punti _antaSnap hanno PRIORITA' ASSOLUTA.
                              // Prima passo: cerco solo tra i punti _antaSnap con raggio esteso. Se trovo, vince.
                              if (isProfileMode) {
                                let bestAnta = null, bestAntaD = ANTA_SNAP_R;
                                pts.forEach(p => {
                                  if (!p._antaSnap) return;
                                  if (!canClose && chainStart && Math.hypot(p.x - chainStart.x, p.y - chainStart.y) < 20) return;
                                  const d = Math.hypot(p.x - mx, p.y - my);
                                  if (d < bestAntaD) { bestAntaD = d; bestAnta = p; }
                                });
                                if (bestAnta) { best = bestAnta; bestD = bestAntaD; }
                              }
                              // Secondo passo: fallback su punti normali solo se nessun anta ha matchato
                              if (!best) {
                                pts.forEach(p => {
                                  if (p._antaSnap) return; // già valutati sopra
                                  if (!canClose && chainStart && Math.hypot(p.x - chainStart.x, p.y - chainStart.y) < 20) return;
                                  const d = Math.hypot(p.x - mx, p.y - my);
                                  if (d < SNAP_R && d < bestD) { bestD = d; best = p; }
                                });
                              }
                              // Snap al chainStart (chiusura forma) solo se ≥3 segmenti e non montante/traverso
                              if (canClose && chainStart && !dw._lineSubType) {
                                const d = Math.hypot(chainStart.x - mx, chainStart.y - my);
                                if (d < bestD + 4) { best = chainStart; }
                              }
                              // ALIGNMENT SNAP: forza allineamento Y/X con vertici esistenti (PRIORITA' ALTA)
                              // FIX CRITICO: in profileMode (zoccolo/soglia/etc.) DISABILITIAMO l'alignment snap
                              // perche' creava punti artificiali sul telaio che deformavano il profilo.
                              // L'alignment serve solo per la costruzione del telaio, NON per i profili che si agganciano all'anta.
                              if (!isProfileMode) {
                                const ALIGN_TOL = 20;
                                const freeLineVertices = els.filter(e => e.type === "freeLine" && !e.subType)
                                  .flatMap(l => [{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]);
                                // Deduplica vertici
                                const seenV = new Set();
                                const uVerts = freeLineVertices.filter(p => {
                                  const k = Math.round(p.x/3) + "," + Math.round(p.y/3);
                                  if (seenV.has(k)) return false;
                                  seenV.add(k); return true;
                                });
                                // Cerca allineamento Y (orizzontale) — solo vertici DISTANTI in X (>50px)
                                let alignY = null, alignDY = ALIGN_TOL;
                                uVerts.forEach(p => {
                                  if (Math.abs(p.x - mx) < 50) return; // ignora vertici sulla stessa colonna
                                  const dy = Math.abs(p.y - my);
                                  if (dy < alignDY) { alignDY = dy; alignY = p.y; }
                                });
                                // Cerca allineamento X (verticale) — solo vertici DISTANTI in Y (>50px)
                                let alignX = null, alignDX = ALIGN_TOL;
                                uVerts.forEach(p => {
                                  if (Math.abs(p.y - my) < 50) return;
                                  const dx = Math.abs(p.x - mx);
                                  if (dx < alignDX) { alignDX = dx; alignX = p.x; }
                                });
                                // Applica allineamento al risultato (solo fuori da profileMode)
                                if (alignY !== null || alignX !== null) {
                                  const rx = alignX !== null ? alignX : (best ? best.x : mx);
                                  const ry = alignY !== null ? alignY : (best ? best.y : my);
                                  best = { x: rx, y: ry };
                                }
                              }
                              return best;
                            };

                            // ══ State helpers ══
                            const pushHistory = () => {
                              const hist = dw.history || [];
                              return [...hist.slice(-20), JSON.stringify(els)];
                            };
                            const setDW = (newEls, extra = {}) => {
                              const hist = pushHistory();
                              onUpdate({ ...dw, elements: newEls, history: hist, ...extra });
                            };
                            const setMode = (extra) => onUpdate({ ...dw, ...extra });

                            // ══ ARTICOLI PROFILO — chiede UNA volta l'articolo per ogni tipo, lo memorizza in dw._articoli ══
                            const askArticolo = (tipo: string): string | null => {
                              const articoli = dw._articoli || {};
                              if (articoli[tipo]) return articoli[tipo]; // già impostato
                              const labels: any = {
                                telaio: "TELAIO", anta: "ANTA", montante: "MONTANTE", traverso: "TRAVERSO",
                                zoccolo: "ZOCCOLO", soglia: "SOGLIA", soglia_rib: "SOGLIA RIB.", fascia: "FASCIA",
                                profcomp: "PROF.COMP.", fermavetro: "FERMAVETRO", maniglione: "ANTIPANICO",
                              };
                              const lbl = labels[tipo] || tipo.toUpperCase();
                              const placeholder = vanoSistema ? `es. ${vanoSistema} - ${lbl}` : `es. IDEAL 7000 - ${lbl}`;
                              const v = prompt(`Articolo ${lbl}\n(verrà usato per tutti i ${lbl.toLowerCase()} di questo vano)`, placeholder);
                              if (!v || v === placeholder) return null;
                              onUpdate({ ...dw, _articoli: { ...articoli, [tipo]: v } });
                              return v;
                            };
                            // Helper: chiede altezza installazione in mm da terra
                            const askAltezzaInstall = (tipo: string, defaultMm: number): { altezza: number; mostra: boolean } | null => {
                              const lblMap: any = {
                                martellina: "Martellina", maniglia: "Maniglia", leva: "Maniglia leva",
                                leva_cilindro: "Maniglia+cilindro", pomolo: "Pomolo", antipanico: "Antipanico",
                                cremonese: "Cremonese", oliva: "Oliva", paletto: "Paletto",
                              };
                              const lbl = lblMap[tipo] || tipo;
                              const inp = prompt(`${lbl} — altezza da terra (mm):\n(misura da pavimento a centro accessorio)\n\nLascia vuoto per default ${defaultMm}mm`, String(defaultMm));
                              if (inp === null) return null;
                              const v = inp.trim() === "" ? defaultMm : parseInt(inp.trim());
                              if (isNaN(v) || v < 0 || v > 5000) { alert("Altezza non valida (0-5000mm)"); return null; }
                              return { altezza: v, mostra: true };
                            };
                            // Helper: attiva mode E chiede l'articolo se non già salvato per quel tipo
                            const setProfileMode = (tipo: string, modeExtra: any) => {
                              const articoli = dw._articoli || {};
                              if (!articoli[tipo]) askArticolo(tipo);
                              setMode(modeExtra);
                            };

                            // ══ JUNCTIONS — rilevamento automatico punti di contatto ══
                            const junctions = React.useMemo(() => {
                              const result: any[] = [];
                              const JTOL = 18; // tolleranza px per rilevare contatto
                              const freeLines = els.filter(e => e.type === "freeLine");
                              const montanti = els.filter(e => e.type === "montante");
                              const traversi = els.filter(e => e.type === "traverso");
                              // freeLine vs freeLine
                              for (let i = 0; i < freeLines.length; i++) {
                                for (let j = i + 1; j < freeLines.length; j++) {
                                  const a = freeLines[i], b = freeLines[j];
                                  const pts = [{x:a.x1,y:a.y1},{x:a.x2,y:a.y2}];
                                  const pts2 = [{x:b.x1,y:b.y1},{x:b.x2,y:b.y2}];
                                  for (const pa of pts) for (const pb of pts2) {
                                    if (Math.hypot(pa.x-pb.x, pa.y-pb.y) < JTOL) {
                                      const existing = dw._junctions?.find((jj:any) => jj.elA === a.id && jj.elB === b.id);
                                      result.push({ id: `j_${a.id}_${b.id}`, ptX: (pa.x+pb.x)/2, ptY: (pa.y+pb.y)/2, elA: a.id, elB: b.id, type: existing?.type || "90", winner: existing?.winner || "A" });
                                    }
                                  }
                                }
                              }
                              // montante vs freeLine orizzontale
                              for (const m of montanti) {
                                const mx = m.x, my1 = m.y1 ?? (frame?.y || fY), my2 = m.y2 ?? (frame?.y+frame?.h || fY+fH);
                                for (const l of freeLines) {
                                  const pts = [{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}];
                                  for (const p of pts) {
                                    if (Math.abs(p.x - mx) < JTOL && (Math.abs(p.y - my1) < JTOL || Math.abs(p.y - my2) < JTOL)) {
                                      const existing = dw._junctions?.find((jj:any) => jj.elA === m.id && jj.elB === l.id);
                                      result.push({ id: `j_${m.id}_${l.id}`, ptX: mx, ptY: p.y, elA: m.id, elB: l.id, type: existing?.type || "90", winner: existing?.winner || "A" });
                                    }
                                  }
                                }
                              }
                              // montante vs traverso
                              for (const m of montanti) {
                                for (const t of traversi) {
                                  const tx1 = t.x1 ?? fX, tx2 = t.x2 ?? fX+fW;
                                  const my1 = m.y1 ?? fY, my2 = m.y2 ?? fY+fH;
                                  if (m.x > tx1 && m.x < tx2 && t.y > my1 && t.y < my2) {
                                    const existing = dw._junctions?.find((jj:any) => jj.elA === m.id && jj.elB === t.id);
                                    result.push({ id: `j_${m.id}_${t.id}`, ptX: m.x, ptY: t.y, elA: m.id, elB: t.id, type: existing?.type || "90", winner: existing?.winner || "A" });
                                  }
                                }
                              }
                              // Deduplica per id
                              const seen = new Set();
                              return result.filter(j => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
                            }, [els, dw._junctions]);

                            const [junctionEdit, setJunctionEdit] = React.useState<any>(null);

                            const undo = () => {
                              const hist = dw.history || [];
                              if (hist.length === 0) return;
                              const prev = JSON.parse(hist[hist.length - 1]);
                              onUpdate({ ...dw, elements: prev, history: hist.slice(0, -1), selectedId: null });
                            };

                            const getSvgXY = (e2, svg) => {
                              const r2 = svg.getBoundingClientRect();
                              const clientX = e2.touches ? e2.touches[0].clientX : e2.clientX;
                              const clientY = e2.touches ? e2.touches[0].clientY : e2.clientY;
                              // Use SVG native coordinate transform (handles viewBox + scaling correctly)
                              const pt = svg.createSVGPoint();
                              pt.x = clientX;
                              pt.y = clientY;
                              const ctm = svg.getScreenCTM();
                              if (ctm) {
                                const svgPt = pt.matrixTransform(ctm.inverse());
                                return { mx: svgPt.x, my: svgPt.y };
                              }
                              // Fallback manuale se getScreenCTM non disponibile
                              const px = clientX - r2.left;
                              const py = clientY - r2.top;
                              const scaleX = canvasW / r2.width;
                              const scaleY = canvasH / r2.height;
                              return { mx: panX + px * scaleX / zoom, my: panY + py * scaleY / zoom };
                            };

                            // ── Drag ──
                            const onDrag = (e2, elId) => {
                              if (drawMode) return;
                              e2.stopPropagation(); e2.preventDefault();
                              const svg = e2.currentTarget.closest("svg");
                              if (!svg) return;
                              const el = els.find(x => x.id === elId);
                              if (!el) return;
                              setMode({ selectedId: elId });
                              const { mx: sx, my: sy } = getSvgXY(e2, svg);
                              const orig = { ...el };
                              let latestEls = els;
                              const onM = (ev) => {
                                ev.preventDefault();
                                const { mx, my } = getSvgXY(ev, svg);
                                const dx = snap(mx - sx), dy = snap(my - sy);
                                const upd = els.map(x => {
                                  if (x.id !== elId) return x;
                                  // Snap a vertici vicini durante drag
                                  if (x.type === "montante") {
                                    const newX = snap(orig.x + dx);
                                    // Recalculate y1/y2 from polygon if present
                                    if (poly) {
                                      const ys = segIntersectV(newX, poly);
                                      if (ys) return { ...x, x: newX, y1: ys[0], y2: ys[1] };
                                    }
                                    return { ...x, x: newX };
                                  }
                                  if (x.type === "traverso") {
                                    const newY = snap(orig.y + dy);
                                    if (poly) {
                                      const xs2 = segIntersectH(newY, poly);
                                      if (xs2) return { ...x, y: newY, x1: xs2[0], x2: xs2[1] };
                                    }
                                    return { ...x, y: newY };
                                  }
                                  if (x.type === "circle") return { ...x, cx: orig.cx + dx, cy: orig.cy + dy };
                                  if (x.x1 !== undefined) return { ...x, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy };
                                  if (x.x !== undefined) return { ...x, x: orig.x + dx, y: orig.y + dy };
                                  return x;
                                });
                                latestEls = upd;
                                // Live dim for montante/traverso
                                let dragDim = null;
                                if (el.type === "montante") {
                                  const newX = snap(orig.x + dx);
                                  if (frame) {
                                    const innerW = frame.w - TK_FRAME * 2;
                                    const posRatio = innerW > 0 ? (newX - frame.x - TK_FRAME) / innerW : 0.5;
                                    const leftMM = Math.round(Math.max(0, Math.min(realW, posRatio * realW)));
                                    const rightMM = realW - leftMM;
                                    const my1 = el.y1 !== undefined ? el.y1 : frame.y;
                                    const my2 = el.y2 !== undefined ? el.y2 : frame.y + frame.h;
                                    dragDim = { type: "v", x: newX, y1: my1, y2: my2, leftMM, rightMM };
                                  } else if (poly) {
                                    const pxs = poly.map(p => p[0]);
                                    const pL = Math.min(...pxs), pR = Math.max(...pxs);
                                    const posRatio = pR > pL ? (newX - pL) / (pR - pL) : 0.5;
                                    const leftMM = Math.round(Math.max(0, Math.min(realW, posRatio * realW)));
                                    const rightMM = realW - leftMM;
                                    const ys = segIntersectV(newX, poly);
                                    const my1 = ys ? ys[0] : Math.min(...poly.map(p => p[1]));
                                    const my2 = ys ? ys[1] : Math.max(...poly.map(p => p[1]));
                                    dragDim = { type: "v", x: newX, y1: my1, y2: my2, leftMM, rightMM };
                                  }
                                }
                                if (el.type === "traverso") {
                                  const newY = snap(orig.y + dy);
                                  if (frame) {
                                    const innerH = frame.h - TK_FRAME * 2;
                                    const posRatio = innerH > 0 ? (newY - frame.y - TK_FRAME) / innerH : 0.5;
                                    const topMM = Math.round(Math.max(0, Math.min(realH, posRatio * realH)));
                                    const botMM = realH - topMM;
                                    const tx1 = el.x1 !== undefined ? el.x1 : frame.x;
                                    const tx2 = el.x2 !== undefined ? el.x2 : frame.x + frame.w;
                                    dragDim = { type: "h", y: newY, x1: tx1, x2: tx2, topMM, botMM };
                                  } else if (poly) {
                                    const pys = poly.map(p => p[1]);
                                    const pT = Math.min(...pys), pB = Math.max(...pys);
                                    const posRatio = pB > pT ? (newY - pT) / (pB - pT) : 0.5;
                                    const topMM = Math.round(Math.max(0, Math.min(realH, posRatio * realH)));
                                    const botMM = realH - topMM;
                                    const xs2 = segIntersectH(newY, poly);
                                    const tx1 = xs2 ? xs2[0] : Math.min(...poly.map(p => p[0]));
                                    const tx2 = xs2 ? xs2[1] : Math.max(...poly.map(p => p[0]));
                                    dragDim = { type: "h", y: newY, x1: tx1, x2: tx2, topMM, botMM };
                                  }
                                }
                                onUpdate({ ...dw, elements: upd, selectedId: elId, _dragDim: dragDim });
                              };
                              const onU = () => {
                                document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU);
                                document.removeEventListener("touchmove", onM); document.removeEventListener("touchend", onU);
                                // Saldatura: snap finale a TUTTI i punti rilevanti (frame, montanti, traversi, freeLine)
                                const WELD = SNAP_R;
                                const buildWeldPts = (allEls) => {
                                  const pts = [];
                                  allEls.forEach(o => {
                                    // freeLine / apLine / righello — punti estremi
                                    if (o.x1 !== undefined) { pts.push({x:o.x1,y:o.y1}); pts.push({x:o.x2,y:o.y2}); }
                                    // frame rect — 4 angoli
                                    if (o.type === "rect") { pts.push({x:o.x,y:o.y},{x:o.x+o.w,y:o.y},{x:o.x,y:o.y+o.h},{x:o.x+o.w,y:o.y+o.h}); }
                                    // montante — top/bottom
                                    if (o.type === "montante") { const my1=o.y1??o.y, my2=o.y2??(o.y+(o.h||0)); pts.push({x:o.x,y:my1},{x:o.x,y:my2}); }
                                    // traverso — left/right
                                    if (o.type === "traverso") { const tx1=o.x1??o.x, tx2=o.x2??(o.x+(o.w||0)); pts.push({x:tx1,y:o.y},{x:tx2,y:o.y}); }
                                  });
                                  return pts;
                                };
                                const welded = latestEls.map(x => {
                                  if (x.id !== elId || x.x1 === undefined) return x;
                                  const otherPts = buildWeldPts(latestEls.filter(o => o.id !== elId));
                                  let nx1=x.x1, ny1=x.y1, nx2=x.x2, ny2=x.y2;
                                  otherPts.forEach(p => {
                                    if (Math.hypot(p.x-x.x1,p.y-x.y1)<WELD) { nx1=p.x; ny1=p.y; }
                                    if (Math.hypot(p.x-x.x2,p.y-x.y2)<WELD) { nx2=p.x; ny2=p.y; }
                                  });
                                  if (nx1!==x.x1||ny1!==x.y1||nx2!==x.x2||ny2!==x.y2) return {...x,x1:nx1,y1:ny1,x2:nx2,y2:ny2};
                                  return x;
                                });
                                onUpdate({ ...dw, elements: welded, selectedId: elId, _dragDim: null });
                              };
                              document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
                              document.addEventListener("touchmove", onM, { passive: false }); document.addEventListener("touchend", onU);
                            };

                            // ── SVG Click ──
                            const onSvgClick = (e2) => {
                              const svg = e2.currentTarget;
                              const { mx, my } = getSvgXY(e2, svg);
                              // Usa dwRef.current per avere sempre lo stato fresco (evita stale closure)
                              const dw = dwRef.current;
                              const els = dw.elements || [];
                              const drawMode = dw.drawMode || null;

                              // Place montante/traverso — click on cell OR polygon
                              if (drawMode === "place-mont") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cx = snap(mx);
                                  const clampedX = Math.max(cell.x + 10, Math.min(cell.x + cell.w - 10, cx));
                                  const tkMapLocal: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                                  const adjY = (y: number, dir: number) => {
                                    let result = y;
                                    els.filter(e => e.type === "freeLine" && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+1).forEach(l => {
                                      const lHT = tkMapLocal[l.subType] || TK_FRAME;
                                      const lY = (l.y1+l.y2)/2;
                                      if (Math.abs(lY - y) < lHT*2+10) result = dir > 0 ? lY + lHT : lY - lHT;
                                    });
                                    return result;
                                  };
                                  if (poly) {
                                    const ys = segIntersectV(clampedX, poly);
                                    if (ys) setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: adjY(ys[0],-1), y2: adjY(ys[1],1) }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: adjY(cell.y,-1), y2: adjY(cell.y+cell.h,1) }]);
                                  }
                                } else if (poly) {
                                  const cx = snap(mx);
                                  const ys = segIntersectV(cx, poly);
                                  if (ys) {
                                    // FIX: il montante deve fermarsi tra i traversi adiacenti al click (se presenti)
                                    let y1f = ys[0], y2f = ys[1];
                                    const trAtX = els.filter((e: any) => {
                                      if (e.type !== "traverso") return false;
                                      const tx1 = e.x1 ?? -Infinity, tx2 = e.x2 ?? Infinity;
                                      return cx >= Math.min(tx1, tx2) && cx <= Math.max(tx1, tx2);
                                    });
                                    // Trova traverso sopra e sotto il click
                                    const above = trAtX.filter((t: any) => t.y < my).sort((a: any, b: any) => b.y - a.y)[0];
                                    const below = trAtX.filter((t: any) => t.y > my).sort((a: any, b: any) => a.y - b.y)[0];
                                    if (above) y1f = Math.max(y1f, above.y);
                                    if (below) y2f = Math.min(y2f, below.y);
                                    setDW([...els, { id: Date.now(), type: "montante", x: cx, y1: y1f, y2: y2f }]);
                                  }
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "montante", x: snap(mx), y1: fY, y2: fY + fH }]);
                                }
                                return;
                              }
                              if (drawMode === "place-trav") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cy = snap(my);
                                  const clampedY = Math.max(cell.y + 10, Math.min(cell.y + cell.h - 10, cy));
                                  if (poly) {
                                    const xs = segIntersectH(clampedY, poly);
                                    if (xs) setDW([...els, { id: Date.now(), type: "traverso", y: clampedY, x1: xs[0], x2: xs[1] }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "traverso", y: clampedY, x1: cell.x, x2: cell.x + cell.w }]);
                                  }
                                } else if (poly) {
                                  const cy = snap(my);
                                  const xs = segIntersectH(cy, poly);
                                  if (xs) {
                                    // FIX: il traverso deve fermarsi tra i montanti adiacenti al click (se presenti)
                                    let x1f = xs[0], x2f = xs[1];
                                    const mtAtY = els.filter((e: any) => {
                                      if (e.type !== "montante") return false;
                                      const my1 = e.y1 ?? -Infinity, my2 = e.y2 ?? Infinity;
                                      return cy >= Math.min(my1, my2) && cy <= Math.max(my1, my2);
                                    });
                                    // Trova montante a sinistra e a destra del click
                                    const left = mtAtY.filter((m: any) => m.x < mx).sort((a: any, b: any) => b.x - a.x)[0];
                                    const right = mtAtY.filter((m: any) => m.x > mx).sort((a: any, b: any) => a.x - b.x)[0];
                                    if (left) x1f = Math.max(x1f, left.x);
                                    if (right) x2f = Math.min(x2f, right.x);
                                    setDW([...els, { id: Date.now(), type: "traverso", y: cy, x1: x1f, x2: x2f }]);
                                  }
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "traverso", y: snap(my), x1: fX, x2: fX + fW }]);
                                }
                                return;
                              }

                              // Mont.Lib — due click. Snap solo se molto vicino (< 25px) al punto del dito.
                              if (drawMode === "place-mont-free") {
                                const pending = dw._pendingLine;
                                const SNAP_LIM = 25;
                                const snapNear = (px: number, py: number) => {
                                  const sp = findSnap(Math.round(px), Math.round(py));
                                  if (!sp) return null;
                                  return Math.hypot(sp.x - px, sp.y - py) < SNAP_LIM ? sp : null;
                                };
                                if (!pending) {
                                  const sn = snapNear(mx, my);
                                  const rx = sn ? sn.x : Math.round(mx);
                                  const ry = sn ? sn.y : Math.round(my);
                                  setMode({ _pendingLine: { x1: rx, y1: ry, _subType: "montante" } });
                                } else {
                                  const x = pending.x1;
                                  const sn2 = snapNear(mx, my);
                                  const finalY = sn2 ? sn2.y : Math.round(my);
                                  let y1 = Math.min(pending.y1, finalY);
                                  let y2 = Math.max(pending.y1, finalY);
                                  // Aggiusta y1/y2 al bordo del profilo orizzontale più vicino (zoccolo/soglia/fascia)
                                  const tkMapLocal: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                                  els.filter(e => e.type === "freeLine" && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+1).forEach(l => {
                                    const lHT = tkMapLocal[l.subType] || TK_FRAME;
                                    const lY = (l.y1+l.y2)/2;
                                    if (Math.abs(lY - y2) < lHT*2+10) y2 = lY + lHT;
                                    if (Math.abs(lY - y1) < lHT*2+10) y1 = lY - lHT;
                                  });
                                  if (Math.abs(y2 - y1) < 3) return;
                                  setDW([...els, { id: Date.now(), type: "montante", x, y1, y2, _libero: true }], { _pendingLine: null });
                                }
                                return;
                              }

                              // Trav.Lib — due click con snap: primo=inizio, secondo=fine
                              if (drawMode === "place-trav-free") {
                                const pending = dw._pendingLine;
                                const snapPt = findSnap(Math.round(mx), Math.round(my));
                                let rx = snapPt ? snapPt.x : Math.round(mx);
                                let ry = snapPt ? snapPt.y : Math.round(my);
                                if (!pending) {
                                  setMode({ _pendingLine: { x1: rx, y1: ry, _subType: "traverso" } });
                                } else {
                                  // Y fisso al primo click, snap X al secondo
                                  const y = pending.y1;
                                  // FIX: cerco snap al punto reale (mx,my) NON solo sulla riga y fissa
                                  // Così posso agganciarmi a bordi verticali del telaio anche se la y non combacia
                                  const snap2 = findSnap(Math.round(mx), Math.round(my));
                                  const finalX = snap2 ? snap2.x : Math.round(mx);
                                  const x1 = Math.min(pending.x1, finalX);
                                  const x2 = Math.max(pending.x1, finalX);
                                  if (Math.abs(x2 - x1) < 3) return;
                                  setDW([...els, { id: Date.now(), type: "traverso", y, x1, x2 }], { _pendingLine: null });
                                }
                                return;
                              }

                              // FERMAVETRO — un tap dentro una cella o un'anta. Crea 4 fermavetri autonomi (anello)
                              // attorno al rettangolo del vetro: bordo interno offset di TK_ANTA o TK_FRAME.
                              // Place ACCESSORIO CATALOGO (con articolo/prezzo/fornitore)
                              if (drawMode === "place-catalogo" && pendingCatAcc) {
                                const anta = els.find((e: any) => e.type === "innerRect" &&
                                  mx >= e.x && mx <= e.x + e.w && my >= e.y && my <= e.y + e.h);
                                // Default altezza basato sul pittogramma o categoria del catalogo
                                const pittog = pendingCatAcc.pittogramma || "leva";
                                const ALTEZZE_DEFAULT: any = {
                                  martellina: 1500, leva: 1050, leva_cilindro: 1050, pomolo: 1050,
                                  pomolo_girevole: 1050, oliva: 1050, cremonese: 1500, paletto: 1900,
                                  catenaccio: 1500, spioncino: 1600, antipanico_1p: 1050, antipanico_3p: 1050,
                                };
                                const defH = ALTEZZE_DEFAULT[pittog] || 1050;
                                const altInfo = askAltezzaInstall(pittog, defH);
                                if (!altInfo) return;
                                let wPx = 24, hPx = 24, ax = mx - 12, ay = my - 12;
                                if (anta) {
                                  wPx = Math.max(20, Math.min(40, Math.round(anta.w * 0.08)));
                                  hPx = wPx;
                                  ax = Math.round(mx - wPx / 2);
                                  if (altInfo.altezza > 0) {
                                    const ratio = Math.max(0, Math.min(1, altInfo.altezza / realH));
                                    ay = Math.round(anta.y + anta.h - ratio * anta.h - hPx / 2);
                                  } else {
                                    ay = Math.round(my - hPx / 2);
                                  }
                                }
                                setDW([...els, {
                                  id: Date.now(), type: "accessorio_catalogo",
                                  x: ax, y: ay, w: wPx, h: hPx,
                                  catalogo_id: pendingCatAcc.id,
                                  codice: pendingCatAcc.codice,
                                  nome: pendingCatAcc.nome,
                                  prezzo: pendingCatAcc.prezzo_unitario || pendingCatAcc.prezzo || 0,
                                  fornitore: pendingCatAcc.fornitore,
                                  pittogramma: pendingCatAcc.pittogramma || "leva",
                                  altezza_install: altInfo.altezza,
                                  mostra_quota: altInfo.mostra,
                                }], { drawMode: null });
                                setPendingCatAcc(null);
                                return;
                              }

                              // Place ACCESSORIO VELOCE (solo grafico, nessun articolo)
                              if (drawMode === "place-veloce" && pendingVeloce) {
                                const anta = els.find((e: any) => e.type === "innerRect" &&
                                  mx >= e.x && mx <= e.x + e.w && my >= e.y && my <= e.y + e.h);
                                // Altezze default per tipo accessorio (mm da terra)
                                const ALTEZZE_DEFAULT: any = {
                                  martellina: 1500, leva: 1050, leva_cilindro: 1050, pomolo: 1050,
                                  pomolo_girevole: 1050, oliva: 1050, cremonese: 1500, paletto: 1900,
                                  catenaccio: 1500, spioncino: 1600, molla_aerea: 2050, cerniera_vista: 0,
                                };
                                const defH = ALTEZZE_DEFAULT[pendingVeloce] || 1050;
                                // Chiedi altezza solo se accessorio è tipo "puntuale" (non cerniere o aste)
                                const skipAltezza = ["cerniera_vista", "molla_aerea"].includes(pendingVeloce);
                                let altInfo = { altezza: defH, mostra: false };
                                if (!skipAltezza) {
                                  const a = askAltezzaInstall(pendingVeloce, defH);
                                  if (!a) return;
                                  altInfo = a;
                                }
                                let wPx = 24, hPx = 24, ax = mx - 12, ay = my - 12;
                                if (anta) {
                                  wPx = Math.max(20, Math.min(40, Math.round(anta.w * 0.08)));
                                  hPx = wPx;
                                  ax = Math.round(mx - wPx / 2);
                                  // Se altezza specificata: posiziona Y in base all'altezza scelta
                                  if (!skipAltezza && altInfo.altezza > 0) {
                                    const ratio = Math.max(0, Math.min(1, altInfo.altezza / realH));
                                    ay = Math.round(anta.y + anta.h - ratio * anta.h - hPx / 2);
                                  } else {
                                    ay = Math.round(my - hPx / 2);
                                  }
                                }
                                setDW([...els, {
                                  id: Date.now(), type: "accessorio_veloce",
                                  x: ax, y: ay, w: wPx, h: hPx,
                                  pittogramma: pendingVeloce,
                                  altezza_install: altInfo.altezza,
                                  mostra_quota: altInfo.mostra,
                                }], { drawMode: null });
                                setPendingVeloce(null);
                                return;
                              }

                              if (drawMode === "place-maniglione") {
                                // Trova anta sotto il click
                                const anta = els.find((e: any) => e.type === "innerRect" &&
                                  mx >= e.x && mx <= e.x + e.w && my >= e.y && my <= e.y + e.h);
                                // Chiedi tipo chiusura
                                const tipoStr = prompt("Tipo chiusura antipanico:\n1 = solo barra centrale\n3 = 3 punti (alto + barra + basso)\n4 = 4 punti (alto + barra + basso, doppia asta)\n\nDigita 1, 3, o 4:", "3");
                                if (tipoStr === null) return;
                                const tp = tipoStr.trim();
                                if (!["1","3","4"].includes(tp)) { alert("Inserire 1, 3, o 4"); return; }
                                const tipoChiusura = tp + "p"; // "1p" | "3p" | "4p"
                                // Chiedi altezza installazione (default 1050mm)
                                const altInfo = askAltezzaInstall("antipanico", 1050);
                                if (!altInfo) return;
                                const articolo = askArticolo("maniglione");
                                let wPx = 110, hPx = 22, ax = mx - 55, ay = my - 11;
                                let antaRect: any = undefined;
                                if (anta) {
                                  // Determina lato CENTRO PORTA
                                  const otherAnta = els.filter((e: any) => e.type === "innerRect" && e.id !== anta.id);
                                  let side: "left" | "right" = "right";
                                  if (otherAnta.length > 0) {
                                    const closest = otherAnta.reduce((best: any, e: any) => {
                                      const dx = Math.abs((e.x + e.w/2) - (anta.x + anta.w/2));
                                      const dy = Math.abs((e.y + e.h/2) - (anta.y + anta.h/2));
                                      const d = dx + dy * 0.3;
                                      return !best || d < best.d ? { e, d } : best;
                                    }, null);
                                    if (closest) {
                                      side = (closest.e.x + closest.e.w/2) > (anta.x + anta.w/2) ? "right" : "left";
                                    }
                                  }
                                  // Antipanico proporzionato all'anta
                                  wPx = Math.round(anta.w * 0.85);
                                  hPx = Math.max(18, Math.round(anta.h * 0.04));
                                  ax = Math.round(anta.x + (anta.w - wPx) / 2);
                                  // Posizione Y in base all'altezza scelta: altezza_install in mm → px sull'anta
                                  // Convertiamo: anta.h px = realH mm → 1px = realH/anta.h mm
                                  // Ma realH è altezza VANO. Per posizionare a 1050mm da terra serve sapere
                                  // dove inizia l'anta dal pavimento. Usiamo: l'anta inizia a anta.y (top) e finisce a anta.y+anta.h (bottom = pavimento).
                                  // Quindi y_px = anta.y + anta.h - (altezza_mm / realH * anta.h)
                                  const ratio = altInfo.altezza / realH;
                                  const yMm = Math.max(0, Math.min(1, ratio));
                                  ay = Math.round(anta.y + anta.h - yMm * anta.h - hPx / 2);
                                  antaRect = { x: anta.x, y: anta.y, w: anta.w, h: anta.h, side };
                                }
                                setDW([...els, {
                                  id: Date.now(), type: "maniglione",
                                  x: ax, y: ay, w: wPx, h: hPx, orient: "H",
                                  tipoChiusura,
                                  antaRect,
                                  altezza_install: altInfo.altezza,
                                  mostra_quota: altInfo.mostra,
                                  articolo: articolo || undefined,
                                }], { drawMode: null });
                                return;
                              }

                              if (drawMode === "place-fermavetro") {
                                let bx = 0, by = 0, bw = 0, bh = 0;
                                // 1. Anta innerRect (rettangolare) sotto il dito
                                const anta = els.find((e: any) => e.type === "innerRect" &&
                                  mx >= e.x && mx <= e.x + e.w && my >= e.y && my <= e.y + e.h);
                                // 2. Anta poligonale sotto il dito
                                const polyAnta = !anta && els.find((e: any) => e.type === "polyAnta" && e.poly &&
                                  (() => {
                                    const xs = e.poly.map((p: number[]) => p[0]);
                                    const ys = e.poly.map((p: number[]) => p[1]);
                                    return mx >= Math.min(...xs) && mx <= Math.max(...xs) && my >= Math.min(...ys) && my <= Math.max(...ys);
                                  })()
                                );
                                if (anta) {
                                  // Fermavetro dentro anta: offset = TK_ANTA dal bordo dell'anta
                                  bx = anta.x + TK_ANTA; by = anta.y + TK_ANTA;
                                  bw = anta.w - TK_ANTA * 2; bh = anta.h - TK_ANTA * 2;
                                } else if (polyAnta) {
                                  const xs = polyAnta.poly.map((p: number[]) => p[0]);
                                  const ys = polyAnta.poly.map((p: number[]) => p[1]);
                                  const xMin = Math.min(...xs), xMax = Math.max(...xs);
                                  const yMin = Math.min(...ys), yMax = Math.max(...ys);
                                  bx = xMin + TK_ANTA; by = yMin + TK_ANTA;
                                  bw = (xMax - xMin) - TK_ANTA * 2; bh = (yMax - yMin) - TK_ANTA * 2;
                                } else {
                                  // 3. Cella telaio (parte fissa). Fermavetro aderente al telaio: offset minimo (1px).
                                  let cell = findCellAt(mx, my);
                                  if (!cell && cells.length > 0) {
                                    let best = null, bestD = Infinity;
                                    cells.forEach(c2 => {
                                      const cx2 = c2.x + c2.w / 2, cy2 = c2.y + c2.h / 2;
                                      const d = Math.hypot(mx - cx2, my - cy2);
                                      if (d < bestD) { bestD = d; best = c2; }
                                    });
                                    cell = best;
                                  }
                                  if (cell) {
                                    // Aderente: solo 1px di gap dal bordo cella
                                    bx = cell.x + 1; by = cell.y + 1;
                                    bw = cell.w - 2; bh = cell.h - 2;
                                  } else { return; }
                                }
                                if (bw < 20 || bh < 20) return;
                                setDW([...els, {
                                  id: Date.now(), type: "fermavetroRect",
                                  x: bx, y: by, w: bw, h: bh,
                                }], { drawMode: null });
                                return;
                              }

                              // Zocc.Lib — due tap. Crea un rect autonomo (NON freeLine subType).
                              // Niente weld, niente offset, niente fusione col telaio.
                              if (drawMode === "place-zocc-free") {
                                const pending = dw._pendingLine;
                                const TK_ZOCC = 8;
                                if (!pending) {
                                  // 1° tap: salva punto inizio. Y libera dove tappa l'utente.
                                  setMode({ _pendingLine: { x1: Math.round(mx), y1: Math.round(my), _subType: "zoccolo_free" } });
                                } else {
                                  // 2° tap: crea rect con SNAP FINALE a bordi telaio + altri zoccolo.
                                  const finalX = Math.round(mx);
                                  let x1 = Math.min(pending.x1, finalX);
                                  let x2 = Math.max(pending.x1, finalX);
                                  let yBot = pending.y1;  // bordo basso (dove ha tappato)
                                  if (Math.abs(x2 - x1) < 5) return;

                                  const SNAP = 25;  // raggio snap finale
                                  const TK_FR = 6;

                                  // Trova bbox telaio (freeLine senza subType)
                                  const frameLines = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                                  let frameTop = Infinity, frameBot = -Infinity, frameLeft = Infinity, frameRight = -Infinity;
                                  frameLines.forEach((l: any) => {
                                    frameTop = Math.min(frameTop, l.y1, l.y2);
                                    frameBot = Math.max(frameBot, l.y1, l.y2);
                                    frameLeft = Math.min(frameLeft, l.x1, l.x2);
                                    frameRight = Math.max(frameRight, l.x1, l.x2);
                                  });
                                  const innerTop = frameTop + TK_FR;
                                  const innerBot = frameBot - TK_FR;
                                  const innerLeft = frameLeft + TK_FR;
                                  const innerRight = frameRight - TK_FR;

                                  // Snap Y: bordo basso del rect aggancia al bordo bot del telaio (esterno!),
                                  // così lo zoccolo si appoggia direttamente sotto al traverso bot del telaio (1cm più sotto del bordo interno)
                                  if (frameLines.length > 0) {
                                    if (Math.abs(yBot - frameBot) < SNAP) yBot = frameBot;
                                    else if (Math.abs(yBot - innerBot) < SNAP) yBot = frameBot;  // anche se sei vicino al bordo interno → scendi al bordo esterno
                                    else if (Math.abs(yBot - frameTop) < SNAP) yBot = frameTop + TK_ZOCC * 2;
                                    else if (Math.abs(yBot - innerTop) < SNAP) yBot = frameTop + TK_ZOCC * 2;
                                  }

                                  // Snap X1/X2: ai bordi ESTERNI del telaio (zoccolo va da bordo a bordo)
                                  if (frameLines.length > 0) {
                                    if (Math.abs(x1 - frameLeft) < SNAP) x1 = frameLeft;
                                    else if (Math.abs(x1 - innerLeft) < SNAP) x1 = frameLeft;
                                    if (Math.abs(x2 - frameRight) < SNAP) x2 = frameRight;
                                    else if (Math.abs(x2 - innerRight) < SNAP) x2 = frameRight;
                                  }
                                  // Snap a montanti (verticali)
                                  els.forEach((m: any) => {
                                    if (m.type === "montante") {
                                      const mxL = m.x - TK_MONT / 2, mxR = m.x + TK_MONT / 2;
                                      if (Math.abs(x1 - mxR) < SNAP) x1 = mxR;
                                      if (Math.abs(x2 - mxL) < SNAP) x2 = mxL;
                                      if (Math.abs(x1 - mxL) < SNAP) x1 = mxL;
                                      if (Math.abs(x2 - mxR) < SNAP) x2 = mxR;
                                    }
                                    if (m.type === "freeLine" && m.subType === "montante") {
                                      const mvX = (m.x1 + m.x2) / 2;
                                      const mxL2 = mvX - TK_MONT / 2, mxR2 = mvX + TK_MONT / 2;
                                      if (Math.abs(x1 - mxR2) < SNAP) x1 = mxR2;
                                      if (Math.abs(x2 - mxL2) < SNAP) x2 = mxL2;
                                    }
                                    if (m.type === "zoccoloLibero") {
                                      if (Math.abs(x1 - (m.x + m.w)) < SNAP) x1 = m.x + m.w;
                                      if (Math.abs(x2 - m.x) < SNAP) x2 = m.x;
                                    }
                                  });

                                  const rectEl = {
                                    id: Date.now(),
                                    type: "zoccoloLibero",
                                    x: x1 - 6,
                                    y: yBot - TK_ZOCC * 2 + 6,
                                    w: x2 - x1,
                                    h: TK_ZOCC * 2,
                                  };
                                  setDW([...els, rectEl], { drawMode: null, _pendingLine: null, _lineSubType: null });
                                }
                                return;
                              }

                              // Place modes — click on cell OR polygon fallback for complex shapes
                              if (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") {
                                let cell = findCellAt(mx, my);
                                // Se findCellAt fallisce ma ci sono celle, prendi la più vicina
                                if (!cell && cells.length > 0) {
                                  let best = null, bestD = Infinity;
                                  cells.forEach(c2 => {
                                    const cx = c2.x + c2.w / 2, cy = c2.y + c2.h / 2;
                                    const d = Math.hypot(mx - cx, my - cy);
                                    if (d < bestD) { bestD = d; best = c2; }
                                  });
                                  cell = best;
                                }
                                // Per telaio libero (no frame), converti cella BSP in poly per usare il path polyAnta
                                // La cella BSP è GIÀ insetata di TK_FRAME da getCells, quindi il poly è il bordo interno
                                if (cell && !cell.poly && !frame && poly) {
                                  cell = { id: cell.id, poly: [
                                    [cell.x, cell.y], [cell.x + cell.w, cell.y],
                                    [cell.x + cell.w, cell.y + cell.h], [cell.x, cell.y + cell.h]
                                  ], _bspInset: true };
                                }
                                if (!cell && cells.length === 0) {
                                  // Calcola BBOX delle freeLine telaio (senza subType) come cella per anta
                                  const telLines = els.filter(e => e.type === "freeLine" && !e.subType);
                                  if (telLines.length >= 2) {
                                    const allX = telLines.flatMap(l => [l.x1, l.x2]);
                                    const allY = telLines.flatMap(l => [l.y1, l.y2]);
                                    const bMinX = Math.min(...allX), bMaxX = Math.max(...allX);
                                    const bMinY = Math.min(...allY), bMaxY = Math.max(...allY);
                                    cell = { id: "poly", poly: [
                                      [bMinX, bMinY], [bMaxX, bMinY], [bMaxX, bMaxY], [bMinX, bMaxY]
                                    ]};
                                  }
                                  // Fallback apLine
                                  if (!cell) {
                                    const apLines = els.filter(e => e.type === "apLine");
                                    if (apLines.length > 0) {
                                      const allX = apLines.flatMap(l => [l.x1, l.x2]);
                                      const allY = apLines.flatMap(l => [l.y1, l.y2]);
                                      cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                    }
                                  }
                                }
                                if (!cell) return;
                                
                                // Polygon shape handling
                                if (cell.poly) {
                                  // Bordi del polygon esterno (linea centrale delle freeLine)
                                  const _cpAllX = cell.poly.map(p => p[0]);
                                  const _cpAllY = cell.poly.map(p => p[1]);
                                  const _cpMinX = Math.min(..._cpAllX), _cpMaxX = Math.max(..._cpAllX);
                                  const _cpMinY = Math.min(..._cpAllY), _cpMaxY = Math.max(..._cpAllY);
                                  // Divisori verticali: montanti classici + freeLine verticali INTERNE al telaio
                                  const classicMont = els.filter(e => e.type === "montante");
                                  // freeLine verticali interne (non sono i bordi sx/dx del telaio)
                                  const vertFreeLines = els.filter(e => 
                                    e.type === "freeLine" && !e.subType && 
                                    Math.abs(e.x2 - e.x1) < Math.abs(e.y2 - e.y1) + 1 &&
                                    e.x1 > _cpMinX + 10 && e.x1 < _cpMaxX - 10
                                  );
                                  const freeMontanti = [...classicMont, ...vertFreeLines.map(l => ({ x: (l.x1 + l.x2) / 2 }))];
                                  // Inseta il poly di TK_FRAME per stare dentro il telaio (bordo INTERNO del profilo)
                                  // Se la cella viene da BSP (getCells), è GIÀ insetata — usa offset 0
                                  const _cpInset = cell._bspInset ? 0 : TK_FRAME;
                                  let cellPoly = [
                                    [_cpMinX + _cpInset, _cpMinY + _cpInset],
                                    [_cpMaxX - _cpInset, _cpMinY + _cpInset],
                                    [_cpMaxX - _cpInset, _cpMaxY - _cpInset],
                                    [_cpMinX + _cpInset, _cpMaxY - _cpInset]
                                  ];
                                  if (freeMontanti.length > 0) {
                                    // Trova i montanti che attraversano il polygon verticalmente
                                    const allPolyX = cell.poly.map(p => p[0]);
                                    const polyMinX = Math.min(...allPolyX);
                                    const polyMaxX = Math.max(...allPolyX);
                                    // Ordina montanti per X
                                    const montX = freeMontanti
                                      .map(m => m.x !== undefined ? m.x : (m.x1 + m.x2) / 2)
                                      .filter(x => x > polyMinX + 5 && x < polyMaxX - 5)
                                      .sort((a, b) => a - b);
                                    if (montX.length > 0) {
                                      // Determina i bounds X della sotto-cella cliccata
                                      let subX1 = polyMinX, subX2 = polyMaxX;
                                      for (let i = 0; i < montX.length; i++) {
                                        if (mx < montX[i]) { subX2 = montX[i]; break; }
                                        subX1 = montX[i];
                                      }
                                      cellPoly = [
                                        [subX1 + _cpInset, _cpMinY + _cpInset],
                                        [subX2 - _cpInset, _cpMinY + _cpInset],
                                        [subX2 - _cpInset, _cpMaxY - _cpInset],
                                        [subX1 + _cpInset, _cpMaxY - _cpInset]
                                      ];
                                    }
                                  }
                                  // ── Clip Y per zoccolo/soglia/fascia/traverso orizzontali dentro la cella ──
                                  const cpLeft = Math.min(cellPoly[0][0], cellPoly[3][0]);
                                  const cpRight = Math.max(cellPoly[1][0], cellPoly[2][0]);
                                  let cpTop = cellPoly[0][1];
                                  let cpBot = cellPoly[2][1];
                                  const horzSubEls = els.filter(e => 
                                    e.type === "freeLine" && e.subType && 
                                    Math.abs(e.y2 - e.y1) <= Math.abs(e.x2 - e.x1) + 1
                                  );
                                  horzSubEls.forEach(h => {
                                    const hMidY = (h.y1 + h.y2) / 2;
                                    const hMinX = Math.min(h.x1, h.x2), hMaxX = Math.max(h.x1, h.x2);
                                    // Controlla che la freeLine si sovrapponga alla sotto-cella in X
                                    if (hMaxX < cpLeft + 5 || hMinX > cpRight - 5) return;
                                    // Usa la linea centrale come confine: l'anta non attraversa il profilo
                                    const cellMidY = (cpTop + cpBot) / 2;
                                    if (hMidY > cellMidY && hMidY < cpBot) {
                                      cpBot = Math.min(cpBot, hMidY);
                                    }
                                    if (hMidY < cellMidY && hMidY > cpTop) {
                                      cpTop = Math.max(cpTop, hMidY);
                                    }
                                  });
                                  // document.title = `POLY cpT=${cpTop.toFixed(0)} cpB=${cpBot.toFixed(0)} subs=${horzSubEls.length} ${horzSubEls.map(h=>`${h.subType||"?"}@y=${((h.y1+h.y2)/2).toFixed(0)}`).join(",")}`;
                                  cellPoly = [
                                    [cellPoly[0][0], cpTop],
                                    [cellPoly[1][0], cpTop],
                                    [cellPoly[2][0], cpBot],
                                    [cellPoly[3][0], cpBot]
                                  ];
                                  if (drawMode === "place-anta" || drawMode === "place-porta") {
                                    // FIX: clippa cellPoly contro il poligono delle freeLine telaio
                                    // (Sutherland-Hodgman) cosi' l'anta segue la forma del telaio (arco, casetta...)
                                    const _telLines = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                                    if (_telLines.length >= 3) {
                                      // Costruisci poligono telaio: orderdo i punti seguendo le linee
                                      // Algoritmo: parto da un punto, cerco la linea successiva che condivide quel punto
                                      const _shapePts: number[][] = [];
                                      const _used = new Set<number>();
                                      const _eq = (a: number, b: number) => Math.abs(a - b) < 2;
                                      const _matchEnd = (l: any, x: number, y: number) => {
                                        if (_eq(l.x1, x) && _eq(l.y1, y)) return [l.x2, l.y2];
                                        if (_eq(l.x2, x) && _eq(l.y2, y)) return [l.x1, l.y1];
                                        return null;
                                      };
                                      // Parti dalla prima linea
                                      _shapePts.push([_telLines[0].x1, _telLines[0].y1]);
                                      _shapePts.push([_telLines[0].x2, _telLines[0].y2]);
                                      _used.add(0);
                                      let _curX = _telLines[0].x2, _curY = _telLines[0].y2;
                                      let _safety = 0;
                                      while (_used.size < _telLines.length && _safety < _telLines.length * 2) {
                                        _safety++;
                                        let _found = false;
                                        for (let _i = 0; _i < _telLines.length; _i++) {
                                          if (_used.has(_i)) continue;
                                          const _next = _matchEnd(_telLines[_i], _curX, _curY);
                                          if (_next) {
                                            _shapePts.push(_next);
                                            _curX = _next[0]; _curY = _next[1];
                                            _used.add(_i);
                                            _found = true;
                                            break;
                                          }
                                        }
                                        if (!_found) break;
                                      }
                                      // Se ho almeno un poligono valido (>=3 punti), clippo
                                      if (_shapePts.length >= 3) {
                                        // Sutherland-Hodgman: clippa cellPoly contro _shapePts
                                        // Inseta il telaio di TK_FRAME verso interno per stare dentro il profilo
                                        const _cx = _shapePts.reduce((s, p) => s + p[0], 0) / _shapePts.length;
                                        const _cy = _shapePts.reduce((s, p) => s + p[1], 0) / _shapePts.length;
                                        const _insetShape = _shapePts.map(p => {
                                          const _dx = p[0] - _cx, _dy = p[1] - _cy;
                                          const _d = Math.hypot(_dx, _dy) || 1;
                                          return [p[0] - (_dx / _d) * TK_FRAME, p[1] - (_dy / _d) * TK_FRAME];
                                        });
                                        // S-H clipping
                                        const _inside = (p: number[], a: number[], b: number[]) =>
                                          (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) <= 0;
                                        const _intersect = (p1: number[], p2: number[], a: number[], b: number[]) => {
                                          const x1=p1[0], y1=p1[1], x2=p2[0], y2=p2[1];
                                          const x3=a[0], y3=a[1], x4=b[0], y4=b[1];
                                          const denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
                                          if (Math.abs(denom) < 0.001) return p2;
                                          const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
                                          return [x1 + t*(x2-x1), y1 + t*(y2-y1)];
                                        };
                                        let _output: number[][] = cellPoly.slice();
                                        for (let _e = 0; _e < _insetShape.length; _e++) {
                                          if (_output.length === 0) break;
                                          const _a = _insetShape[_e];
                                          const _b = _insetShape[(_e + 1) % _insetShape.length];
                                          const _input = _output;
                                          _output = [];
                                          for (let _i2 = 0; _i2 < _input.length; _i2++) {
                                            const _p = _input[_i2];
                                            const _pPrev = _input[(_i2 - 1 + _input.length) % _input.length];
                                            const _inP = _inside(_p, _a, _b);
                                            const _inPrev = _inside(_pPrev, _a, _b);
                                            if (_inP) {
                                              if (!_inPrev) _output.push(_intersect(_pPrev, _p, _a, _b));
                                              _output.push(_p);
                                            } else if (_inPrev) {
                                              _output.push(_intersect(_pPrev, _p, _a, _b));
                                            }
                                          }
                                        }
                                        // Aggiungi tutti i punti delle freeLine telaio che cadono dentro cellPoly
                                        // Cosi' la curva viene catturata con tutti i suoi vertici
                                        if (_output.length >= 3) {
                                          // Confronta con cellPoly: solo se ho effettivamente clippato (output diverso da rect)
                                          const _origArea = Math.abs((cellPoly[2][0]-cellPoly[0][0]) * (cellPoly[2][1]-cellPoly[0][1]));
                                          let _newArea = 0;
                                          for (let _i = 0; _i < _output.length; _i++) {
                                            const _p1 = _output[_i], _p2 = _output[(_i+1) % _output.length];
                                            _newArea += _p1[0] * _p2[1] - _p2[0] * _p1[1];
                                          }
                                          _newArea = Math.abs(_newArea / 2);
                                          // Solo se area significativa (>5% rect originale) usa clip
                                          if (_newArea > _origArea * 0.05) {
                                            cellPoly = _output;
                                          }
                                        }
                                      }
                                    }
                                    // Rimuovi solo le polyAnta nella stessa zona X
                                    const subMinX = Math.min(...cellPoly.map((p: number[]) => p[0]));
                                    const subMaxX = Math.max(...cellPoly.map((p: number[]) => p[0]));
                                    const newEls = els.filter(e => {
                                      if (e.type !== "polyAnta") return true;
                                      const eMinX = Math.min(...e.poly.map((p: number[]) => p[0]));
                                      const eMaxX = Math.max(...e.poly.map((p: number[]) => p[0]));
                                      // Rimuovi se si sovrappone alla zona cliccata
                                      return !(eMinX < subMaxX - 5 && eMaxX > subMinX + 5);
                                    });
                                    newEls.push({ id: Date.now(), type: "polyAnta", poly: cellPoly, subType: drawMode === "place-porta" ? "porta" : undefined });
                                    setDW(newEls);
                                  } else if (drawMode === "place-vetro") {
                                    const newEls = els.filter(e => e.type !== "polyGlass");
                                    const vetroData = selectedVetro ? {
                                      vetro_id: selectedVetro.id,
                                      vetro_codice: selectedVetro.codice,
                                      vetro_nome: selectedVetro.nome,
                                      vetro_composizione: selectedVetro.composizione,
                                      vetro_ug: selectedVetro.ug,
                                      vetro_rw: selectedVetro.abbattimento_acustico,
                                      vetro_prezzo_mq: selectedVetro.prezzo_mq,
                                    } : {};
                                    newEls.push({ id: Date.now(), type: "polyGlass", poly: cellPoly, ...vetroData });
                                    setDW(newEls);
                                  } else if (drawMode === "place-persiana") {
                                    const newEls = els.filter(e => e.type !== "polyPersiana");
                                    newEls.push({ id: Date.now(), type: "polyPersiana", poly: cellPoly });
                                    setDW(newEls);
                                  }
                                  return;
                                }
                                
                                // Match elements to cell by position overlap (BSP IDs change dynamically)
                                const inCell = (el2) => el2.x !== undefined && el2.w !== undefined &&
                                  el2.x >= cell.x - 2 && el2.y >= cell.y - 2 &&
                                  el2.x + el2.w <= cell.x + cell.w + 2 && el2.y + el2.h <= cell.y + cell.h + 2;
                                
                                // ── Clip Y cella per zoccolo/soglia/fascia dentro la cella ──
                                let cellY = cell.y, cellH = cell.h;
                                const horzSubInCell = els.filter(e => 
                                  e.type === "freeLine" && e.subType && 
                                  Math.abs(e.y2 - e.y1) <= Math.abs(e.x2 - e.x1) + 1
                                );
                                // document.title = `cell[${cell.y.toFixed(0)}-${(cell.y+cell.h).toFixed(0)}] hSubs=${horzSubInCell.length} ${horzSubInCell.map(h=>`${h.subType}@${((h.y1+h.y2)/2).toFixed(0)}`).join(",")}`;
                                horzSubInCell.forEach(h => {
                                  const hMidY = (h.y1 + h.y2) / 2;
                                  const hMinX = Math.min(h.x1, h.x2), hMaxX = Math.max(h.x1, h.x2);
                                  if (hMaxX < cell.x + 5 || hMinX > cell.x + cell.w - 5) return;
                                  const cellMidY = cellY + cellH / 2;
                                  if (hMidY > cellMidY && hMidY < cellY + cellH) {
                                    cellH = hMidY - cellY;
                                  }
                                  if (hMidY < cellMidY && hMidY > cellY) {
                                    cellH = cellH - (hMidY - cellY);
                                    cellY = hMidY;
                                  }
                                });

                                // Regular cell handling
                                if (drawMode === "place-anta") {
                                  // Conta ante esistenti nella cella; ogni click ne aggiunge una.
                                  const existingAnte = els.filter(e => e.type === "innerRect" && !e.subType && inCell(e));
                                  const existingRiporti = els.filter(e => e.type === "profiloRiporto" && e.cellId === cell.id);
                                  // Rimuovi tutto e ricrea con N+1 ante e N riporti
                                  const numAnte = existingAnte.length + 1;
                                  const newEls = els.filter(e => !(
                                    (e.type === "innerRect" && !e.subType && inCell(e)) ||
                                    (e.type === "profiloRiporto" && e.cellId === cell.id) ||
                                    (e.type === "glass" && inCell(e))
                                  ));
                                  // Larghezza divisa equamente tra le ante
                                  const TK_RIP = 6; // spessore profilo di riporto (px canvas)
                                  const usableW = cell.w - 2;
                                  const totalRiporti = numAnte - 1;
                                  const antaW = (usableW - totalRiporti * TK_RIP) / numAnte;
                                  let curX = cell.x + 1;
                                  for (let i = 0; i < numAnte; i++) {
                                    // Anta i-esima
                                    newEls.push({
                                      id: Date.now() + i * 7,
                                      type: "innerRect",
                                      x: Math.round(curX),
                                      y: cellY + 1,
                                      w: Math.round(antaW),
                                      h: cellH - 2,
                                      cellId: cell.id,
                                      _antaIndex: i,            // indice nella sequenza ante (0=primo apri)
                                      _antaCount: numAnte,      // totale ante in questa cella
                                    });
                                    curX += antaW;
                                    // Profilo di riporto fra anta-i e anta-(i+1) — solo se c'è un'anta successiva
                                    // Sta sull'anta che apri per prima, cioè l'anta i (la sinistra)
                                    if (i < numAnte - 1) {
                                      newEls.push({
                                        id: Date.now() + i * 7 + 100,
                                        type: "profiloRiporto",
                                        x: Math.round(curX),
                                        y: cellY + 1,
                                        w: TK_RIP,
                                        h: cellH - 2,
                                        cellId: cell.id,
                                        _ownerAntaIndex: i,     // appartiene all'anta i (sinistra)
                                      });
                                      curX += TK_RIP;
                                    }
                                  }
                                  setDW(newEls); // drawMode resta attivo: il prossimo click aggiunge un'altra anta
                                } else if (drawMode === "place-porta") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now() + Math.floor(Math.random()*10000), type: "innerRect", subType: "porta", x: cell.x + 1, y: cellY + 1, w: cell.w - 2, h: cellH - 2, cellId: cell.id });
                                  setDW(newEls);
                                  setMode({ drawMode: null });
                                } else if (drawMode === "place-persiana") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "persiana", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                  setDW(newEls);
                                  setMode({ drawMode: null });
                                } else if (drawMode === "place-vetro") {
                                  const anta = els.find(e => (e.type === "innerRect") && inCell(e));
                                  const tk = anta ? (anta.subType === "porta" ? TK_PORTA : TK_ANTA) : 1;
                                  const base = anta || { x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2 };
                                  const newEls = els.filter(e => !(e.type === "glass" && inCell(e)));
                                  const vetroData = selectedVetro ? {
                                    vetro_id: selectedVetro.id,
                                    vetro_codice: selectedVetro.codice,
                                    vetro_nome: selectedVetro.nome,
                                    vetro_composizione: selectedVetro.composizione,
                                    vetro_ug: selectedVetro.ug,
                                    vetro_rw: selectedVetro.abbattimento_acustico,
                                    vetro_prezzo_mq: selectedVetro.prezzo_mq,
                                  } : {};
                                  newEls.push({ id: Date.now(), type: "glass", x: base.x + tk, y: base.y + tk, w: base.w - tk * 2, h: base.h - tk * 2, cellId: cell.id, ...vetroData });
                                  setDW(newEls);
                                }
                                return;
                              }

                              if (drawMode === "place-ap") {
                                let cell = findCellAt(mx, my);
                                // document.title = "mx="+mx.toFixed(0)+" celle="+cells.map(c=>"["+c.x.toFixed(0)+"-"+(c.x+c.w).toFixed(0)+"]").join("")+" hit="+(cell?cell.id:"null");
                                if (!cell && cells.length === 0) {
                                  const lines = els.filter(e => e.type === "freeLine" || e.type === "apLine");
                                  if (lines.length > 0) {
                                    const allX = lines.flatMap(l => [l.x1, l.x2]);
                                    const allY = lines.flatMap(l => [l.y1, l.y2]);
                                    cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                  }
                                }
                                if (!cell) return;
                                const t = Date.now();
                                // Remove old aperture elements in this cell by position
                                const inC = (el2) => el2.x !== undefined ? (el2.x >= cell.x - 3 && el2.x <= cell.x + cell.w + 3 && el2.y >= cell.y - 3 && el2.y <= cell.y + cell.h + 3) :
                                  (el2.x1 !== undefined && el2.x1 >= cell.x - 3 && el2.x1 <= cell.x + cell.w + 3 && el2.y1 >= cell.y - 3 && el2.y1 <= cell.y + cell.h + 3);
                                const newEls = els.filter(e => !((e.type === "apLine" || e.type === "apLabel") && inC(e)));
                                const P = 6;
                                const L = cell.x + P, R = cell.x + cell.w - P;
                                const T2 = cell.y + P, B = cell.y + cell.h - P;
                                const MX = cell.x + cell.w / 2, MY = cell.y + cell.h / 2;
                                const ap = placeApType;
                                if (ap === "SX") {
                                  // Cardine sinistro: triangolo simmetrico, cardine a SX
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: R, y2: B, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: L, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX - cell.w * 0.2, y: MY + 5, label: "← SX", cellId: cell.id });
                                } else if (ap === "DX") {
                                  // Cardine destro: triangolo simmetrico, cardine a DX
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: R, y2: B, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX + cell.w * 0.2, y: MY + 5, label: "DX →", cellId: cell.id });
                                } else if (ap === "RIB") {
                                  // Ribalta: triangolo simmetrico dal basso-centro verso alto
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: T2, x2: R, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: MX, y1: B, x2: L, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: MX, y1: B, x2: R, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY + 5, label: "↕ RIB", cellId: cell.id });
                                } else if (ap === "OB") {
                                  // Anta-ribalta: SX simmetrico (solido) + RIB (tratteggiato)
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: MX, y1: B, x2: L, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 2, type: "apLine", x1: MX, y1: B, x2: R, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY, label: "↙↕ OB", cellId: cell.id });
                                } else if (ap === "ALZ") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: MY, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R - 12, y1: MY - 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: R - 12, y1: MY + 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY - 14, label: "→ ALZ", cellId: cell.id });
                                } else if (ap === "SCO") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: MY, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: L + 10, y1: MY - 8, x2: L, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: R - 10, y1: MY - 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY - 14, label: "↔ SCO", cellId: cell.id });
                                } else if (ap === "FISSO") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: T2, x2: R, y2: B, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R, y1: T2, x2: L, y2: B, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX, y: MY, label: "FISSO", cellId: cell.id });
                                }
                                setDW(newEls);
                                return;
                              }

                              // Line / apertura draw modes
                              // ═══ AGGANCIO AUTOMATICO: click su lato anta vuoto crea freeLine esatta ═══
                              if (drawMode === "line" && dw._lineSubType && !dw._pendingLine) {
                                const profileSub = dw._lineSubType;
                                if (["zoccolo","soglia","fascia","profcomp","soglia_rib"].includes(profileSub)) {
                                  // Cerca un'anta il cui lato hidden contiene il click
                                  const TK_anta = (a: any) => a.subType === "porta" ? TK_PORTA : TK_ANTA;
                                  const antaFound = els.find((e: any) => {
                                    if (e.type !== "innerRect") return false;
                                    const hidden = e.hiddenSides || [];
                                    if (hidden.length === 0) return false;
                                    const TK = TK_anta(e);
                                    // Definizione area di ogni lato hidden con AMPIA tolleranza verso l'interno dell'anta
                                    // Per top/bot: strip orizzontale che occupa 30% dell'altezza dall'estremo
                                    // Per left/right: strip verticale che occupa 30% della larghezza dall'estremo
                                    const TOL = 30; // tolleranza ESTERNA (oltre il bordo dell'anta)
                                    const sidesZone: any = {
                                      top: { x: e.x - TOL, y: e.y - TOL, w: e.w + TOL*2, h: e.h * 0.3 + TOL },
                                      bot: { x: e.x - TOL, y: e.y + e.h * 0.7, w: e.w + TOL*2, h: e.h * 0.3 + TOL },
                                      left: { x: e.x - TOL, y: e.y - TOL, w: e.w * 0.3 + TOL, h: e.h + TOL*2 },
                                      right: { x: e.x + e.w * 0.7, y: e.y - TOL, w: e.w * 0.3 + TOL, h: e.h + TOL*2 }
                                    };
                                    return hidden.some((side: string) => {
                                      const r = sidesZone[side];
                                      if (!r) return false;
                                      return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
                                    });
                                  });
                                  if (antaFound) {
                                    const hidden = antaFound.hiddenSides || [];
                                    const TK = TK_anta(antaFound);
                                    const sides: any = {
                                      top: { x: antaFound.x, y: antaFound.y, w: antaFound.w, h: TK },
                                      bot: { x: antaFound.x, y: antaFound.y + antaFound.h - TK, w: antaFound.w, h: TK },
                                      left: { x: antaFound.x, y: antaFound.y + TK, w: TK, h: Math.max(0, antaFound.h - TK*2) },
                                      right: { x: antaFound.x + antaFound.w - TK, y: antaFound.y + TK, w: TK, h: Math.max(0, antaFound.h - TK*2) }
                                    };
                                    // Trova quale lato hidden è stato cliccato (il primo che contiene il click)
                                    const TOL2 = 30;
                                    const zonesForClicked: any = {
                                      top: { x: antaFound.x - TOL2, y: antaFound.y - TOL2, w: antaFound.w + TOL2*2, h: antaFound.h * 0.3 + TOL2 },
                                      bot: { x: antaFound.x - TOL2, y: antaFound.y + antaFound.h * 0.7, w: antaFound.w + TOL2*2, h: antaFound.h * 0.3 + TOL2 },
                                      left: { x: antaFound.x - TOL2, y: antaFound.y - TOL2, w: antaFound.w * 0.3 + TOL2, h: antaFound.h + TOL2*2 },
                                      right: { x: antaFound.x + antaFound.w * 0.7, y: antaFound.y - TOL2, w: antaFound.w * 0.3 + TOL2, h: antaFound.h + TOL2*2 }
                                    };
                                    const clickedSide = hidden.find((side: string) => {
                                      const r = zonesForClicked[side];
                                      if (!r) return false;
                                      return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
                                    });
                                    if (clickedSide) {
                                      const r = sides[clickedSide];
                                      // Offset dai lati ADIACENTI ancora presenti (non hidden)
                                      // Per top/bot: offset sx/dx. Per left/right: offset top/bot.
                                      const offLeft = hidden.includes("left") ? 0 : TK;
                                      const offRight = hidden.includes("right") ? 0 : TK;
                                      const offTop = hidden.includes("top") ? 0 : TK;
                                      const offBot = hidden.includes("bot") ? 0 : TK;
                                      // Coordinate della freeLine: linea centrale del lato, con offset dai lati presenti
                                      let lx1, ly1, lx2, ly2;
                                      // Fine-tune: profilo 4px più lungo (2 per lato) + 2px più in basso
                                    if (clickedSide === "top") {
                                        const cy = antaFound.y + TK + 2;
                                        lx1 = antaFound.x + offLeft - 2; ly1 = cy;
                                        lx2 = antaFound.x + antaFound.w - offRight + 2; ly2 = cy;
                                      } else if (clickedSide === "bot") {
                                        const cy = antaFound.y + antaFound.h - TK + 2;
                                        lx1 = antaFound.x + offLeft - 2; ly1 = cy;
                                        lx2 = antaFound.x + antaFound.w - offRight + 2; ly2 = cy;
                                      } else if (clickedSide === "left") {
                                        const cx = antaFound.x + TK + 2;
                                        lx1 = cx; ly1 = antaFound.y + offTop - 2;
                                        lx2 = cx; ly2 = antaFound.y + antaFound.h - offBot + 2;
                                      } else {
                                        const cx = antaFound.x + antaFound.w - TK + 2;
                                        lx1 = cx; ly1 = antaFound.y + offTop - 2;
                                        lx2 = cx; ly2 = antaFound.y + antaFound.h - offBot + 2;
                                      }
                                      const newEls = [...els, {
                                        id: Date.now() + Math.floor(Math.random()*10000),
                                        type: "freeLine",
                                        subType: profileSub,
                                        x1: lx1, y1: ly1, x2: lx2, y2: ly2
                                      }];
                                      setDW(newEls, { drawMode: null, _lineSubType: null, _pendingLine: null });
                                      return;
                                    }
                                  }
                                }
                              }

                              if (drawMode === "line" || drawMode === "apertura") {
                                const pending = dw._pendingLine;
                                // Leggi subType sia da dw che da pending (pending è più affidabile)
                                const subTypeVal = (pending && pending._subType) || dw._lineSubType || null;
                                const isMont = subTypeVal === "montante";
                                const isTrav = subTypeVal === "traverso";

                                // Coordinate raw del click
                                let px = Math.round(mx);
                                let py = Math.round(my);

                                // GRID SNAP DINAMICO DISATTIVATO: arrotondava i tap a una griglia ma rompeva la concatenazione
                                // dei lati quando il pending era a coords non-multiple della griglia.
                                // Lasciamo px,py raw — la fluidità del dito viene garantita dal mirino visivo durante il preview.
                                if (!pending) {
                                  // PRIMO CLICK
                                  if (isMont) {
                                    // Montante: X rimane dove clicchi, snap Y solo agli elementi interni (traversi, bordi frame)
                                    // Prima guarda traversi/altri elementi orizzontali
                                    const horzPts = els.filter(e=>e.x1!==undefined && e.subType!=="montante")
                                      .flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]);
                                    let bestY=null, bestDY=SNAP_R;
                                    horzPts.forEach(p=>{ const d=Math.abs(p.y-py); if(d<bestDY){bestDY=d;bestY=p.y;} });
                                    if(bestY!==null) { py=bestY; }
                                    else if (frame) {
                                      // Snap ai bordi interni del frame
                                      const distTop = Math.abs(py - frame.y);
                                      const distBot = Math.abs(py - (frame.y + frame.h));
                                      if (distTop < SNAP_R) py = frame.y;
                                      else if (distBot < SNAP_R) py = frame.y + frame.h;
                                    }
                                    setMode({ _pendingLine: { x1: px, y1: py, _subType: subTypeVal }, _chainStart: { x: px, y: py }, _lineSubType: subTypeVal });
                                  } else if (isTrav) {
                                    // Traverso: Y rimane dove clicchi, snap X agli elementi verticali o bordi frame
                                    const vertPts = els.filter(e=>e.x1!==undefined && e.subType!=="traverso")
                                      .flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]);
                                    let bestX=null, bestDX=SNAP_R;
                                    vertPts.forEach(p=>{ const d=Math.abs(p.x-px); if(d<bestDX){bestDX=d;bestX=p.x;} });
                                    if(bestX!==null) { px=bestX; }
                                    else if (frame) {
                                      const distL = Math.abs(px - frame.x);
                                      const distR = Math.abs(px - (frame.x + frame.w));
                                      if (distL < SNAP_R) px = frame.x;
                                      else if (distR < SNAP_R) px = frame.x + frame.w;
                                    }
                                    setMode({ _pendingLine: { x1: px, y1: py, _subType: subTypeVal }, _chainStart: { x: px, y: py }, _lineSubType: subTypeVal });
                                  } else {
                                    // Soglia, zoccolo, fascia, profcomp, tel.libero — snap unificato
                                    const snapPt = findSnap(px, py);
                                    let antaOri = null;
                                    if (snapPt) {
                                      px = snapPt.x; py = snapPt.y;
                                      if (snapPt._antaSnap && snapPt._antaOri) antaOri = snapPt._antaOri;
                                    }
                                    setMode({ _pendingLine: { x1: px, y1: py, _subType: subTypeVal, _antaOri: antaOri }, _chainStart: dw._chainStart || { x: px, y: py }, _lineSubType: subTypeVal });
                                  }
                                } else {
                                  // SECONDO CLICK — crea il segmento

                                  // Montante: X SEMPRE uguale al primo punto, Y libera
                                  if (isMont) {
                                    px = pending.x1;
                                    // Snap Y: bordi frame + punti freeLine sulla stessa colonna, escludi punto di partenza
                                    const framePtsY = frames.flatMap(f=>[{x:f.x,y:f.y},{x:f.x,y:f.y+f.h},{x:f.x+f.w,y:f.y},{x:f.x+f.w,y:f.y+f.h}]);
                                    const colPts = [
                                      ...els.filter(e=>e.x1!==undefined).flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]),
                                      ...framePtsY
                                    ].filter(p=>Math.abs(p.x-px)<12 && Math.abs(p.y-pending.y1)>5);
                                    let bestY=null, bestDY=SNAP_R;
                                    colPts.forEach(p=>{const d=Math.abs(p.y-py);if(d<bestDY){bestDY=d;bestY=p.y;}});
                                    if(bestY!==null) py=bestY;
                                    // Se nessuno snap: accetta py grezzo (non bloccare il click)
                                  }
                                  // Traverso: Y SEMPRE uguale al primo punto, X libera
                                  else if (isTrav) {
                                    py = pending.y1;
                                    // Snap X: bordi frame + punti freeLine sulla stessa riga, escludi punto di partenza
                                    const framePtsX = frames.flatMap(f=>[{x:f.x,y:f.y},{x:f.x,y:f.y+f.h},{x:f.x+f.w,y:f.y},{x:f.x+f.w,y:f.y+f.h}]);
                                    const rowPts = [
                                      ...els.filter(e=>e.x1!==undefined).flatMap(l=>[{x:l.x1,y:l.y1},{x:l.x2,y:l.y2}]),
                                      ...framePtsX
                                    ].filter(p=>Math.abs(p.y-py)<12 && Math.abs(p.x-pending.x1)>5);
                                    let bestX=null, bestDX=SNAP_R;
                                    rowPts.forEach(p=>{const d=Math.abs(p.x-px);if(d<bestDX){bestDX=d;bestX=p.x;}});
                                    if(bestX!==null) px=bestX;
                                    // Se nessuno snap: accetta px grezzo
                                  }
                                  // Telaio libero / altri: snap normale, ma scarta snap troppo distanti dal dito
                                  else {
                                    const origPx = px, origPy = py;
                                    const sp = findSnap(px, py);
                                    let snapApplied = "no";
                                    let snapInfo = "";
                                    if (sp) {
                                      const snapDist = Math.hypot(sp.x - origPx, sp.y - origPy);
                                      snapInfo = `sp=${Math.round(sp.x)},${Math.round(sp.y)} d=${Math.round(snapDist)}`;
                                      if (snapDist < 140) { px = sp.x; py = sp.y; snapApplied = "yes"; }
                                    }
                                    // ═══ ORTHO FORTE su click finale: ratio 2:1 → snap a H o V ═══
                                    const adxC = Math.abs(px-pending.x1), adyC = Math.abs(py-pending.y1);
                                    if (adyC > adxC * 2 && adyC > 8) px = pending.x1;
                                    else if (adxC > adyC * 2 && adxC > 8) py = pending.y1;
                                    // chiusura forma — solo per telaio libero senza subType, ≥3 lati, snap ravvicinato 30px
                                    let closeApplied = "no";
                                    if (!subTypeVal) {
                                      const cs = dw._chainStart;
                                      const freeLines = els.filter(e=>e.type==="freeLine");
                                      if (cs && freeLines.length>=3 && Math.hypot(px-cs.x,py-cs.y)<90) { px=cs.x; py=cs.y; closeApplied="yes"; }
                                      if (typeof document !== 'undefined') {
                                        // debug rimosso (era document.title)
                                      }
                                    }
                                  }

                                  // Se è aggancio ANTA → forza allineamento H o V rigido e salta tutti gli altri snap
                                  if (pending._antaOri === "H") {
                                    py = pending.y1; // forza Y uguale al primo click (linea orizzontale)
                                    // Snap X all'estremo anta più vicino
                                    const snapX = findSnap(px, py);
                                    if (snapX && snapX._antaSnap && Math.abs(snapX.y - py) < 2) px = snapX.x;
                                  } else if (pending._antaOri === "V") {
                                    px = pending.x1; // forza X uguale al primo click (linea verticale)
                                    const snapY = findSnap(px, py);
                                    if (snapY && snapY._antaSnap && Math.abs(snapY.x - px) < 2) py = snapY.y;
                                  }
                                  // Per montante X è sempre = pending.x1, per traverso Y è sempre = pending.y1
                                  // → il guard "punto uguale" va saltato per questi subType
                                  if (!isMont && !isTrav && px===pending.x1 && py===pending.y1) return;
                                  if (isMont && py===pending.y1) return;   // zero-length verticale
                                  if (isTrav && px===pending.x1) return;   // zero-length orizzontale
                                  const lineType = drawMode==="apertura" ? "apLine" : "freeLine";
                                  // Clamp al frame
                                  let [nx1,ny1,nx2,ny2] = [pending.x1,pending.y1,px,py];
                                  const fr=els.find(e=>e.type==="rect");
                                  if(fr&&lineType==="freeLine"){const isH=Math.abs(nx2-nx1)>=Math.abs(ny2-ny1);if(isH){nx1=Math.max(fr.x,Math.min(fr.x+fr.w,nx1));nx2=Math.max(fr.x,Math.min(fr.x+fr.w,nx2));}else{ny1=Math.max(fr.y,Math.min(fr.y+fr.h,ny1));ny2=Math.max(fr.y,Math.min(fr.y+fr.h,ny2));}}
                                  // Clamp anche per Tel.Lib. (freeLine senza subType come telaio)
                                  if(!fr&&subTypeVal&&lineType==="freeLine"){
                                    const telV=els.filter(e=>e.type==="freeLine"&&!e.subType&&Math.abs(e.x2-e.x1)<Math.abs(e.y2-e.y1)+1);
                                    const telH=els.filter(e=>e.type==="freeLine"&&!e.subType&&Math.abs(e.y2-e.y1)<=Math.abs(e.x2-e.x1)+1);
                                    if(telV.length>=2){
                                      const vXs=telV.flatMap(l=>[(l.x1+l.x2)/2]);
                                      const cL=Math.min(...vXs), cR=Math.max(...vXs);
                                      nx1=Math.max(cL,Math.min(cR,nx1)); nx2=Math.max(cL,Math.min(cR,nx2));
                                    }
                                    if(telV.length>=1){
                                      const vYs=telV.flatMap(l=>[l.y1,l.y2]);
                                      const cT=Math.min(...vYs), cB=Math.max(...vYs);
                                      ny1=Math.max(cT,Math.min(cB,ny1)); ny2=Math.max(cT,Math.min(cB,ny2));
                                    }
                                  }                                  const newEl = { id: Date.now(), type: lineType, x1: nx1, y1: ny1, x2: nx2, y2: ny2, ...(subTypeVal ? { subType: subTypeVal } : {}) };
                                  // Saldatura immediata bidirezionale: frame + montanti + traversi + freeLine
                                  const WELD2 = SNAP_R;
                                  const buildWeldPts2 = (allEls) => {
                                    const wpts = [];
                                    allEls.forEach(o => {
                                      if (o.x1 !== undefined) { wpts.push({x:o.x1,y:o.y1}); wpts.push({x:o.x2,y:o.y2}); wpts.push({x:(o.x1+o.x2)/2,y:(o.y1+o.y2)/2}); }
                                      if (o.type === "rect") { wpts.push({x:o.x,y:o.y},{x:o.x+o.w,y:o.y},{x:o.x,y:o.y+o.h},{x:o.x+o.w,y:o.y+o.h}); }
                                      if (o.type === "montante") {
                                        const my1=o.y1??o.y, my2=o.y2??(o.y+(o.h||0));
                                        wpts.push({x:o.x,y:my1},{x:o.x,y:my2},{x:o.x,y:(my1+my2)/2});
                                      }
                                      if (o.type === "traverso") {
                                        const tx1=o.x1??o.x, tx2=o.x2??(o.x+(o.w||0));
                                        wpts.push({x:tx1,y:o.y},{x:tx2,y:o.y},{x:(tx1+tx2)/2,y:o.y});
                                      }
                                    });
                                    return wpts;
                                  };
                                  // Snap i punti del NUOVO elemento ai vicini esistenti
                                  let snappedX1=pending.x1, snappedY1=pending.y1, snappedX2=px, snappedY2=py;
                                  const existingWeldPts = buildWeldPts2(els);
                                  // FIX: per telaio libero (no subType), escludi chainStart dalla weld finché non puoi chiudere (≥3 lati).
                                  // Altrimenti il 3° click salda P3 al primo vertice → triangolo.
                                  const cs0 = dw._chainStart;
                                  const flCount0 = els.filter((e:any) => e.type === "freeLine").length;
                                  const filteredWeldPts = (cs0 && !subTypeVal && flCount0 < 3)
                                    ? existingWeldPts.filter(p => Math.hypot(p.x - cs0.x, p.y - cs0.y) > 4)
                                    : existingWeldPts;
                                  // FIX: per TELAIO LIBERO il raggio weld è MINIMO (8px). L'utente passa vicino a vertici
                                  // esistenti senza agganciarli per sbaglio. Per i profili WELD2 piena resta.
                                  const WELD_NEW = subTypeVal ? WELD2 : 8;
                                  filteredWeldPts.forEach(p => {
                                    if (Math.hypot(p.x-snappedX1,p.y-snappedY1)<WELD_NEW) { snappedX1=p.x; snappedY1=p.y; }
                                    if (Math.hypot(p.x-snappedX2,p.y-snappedY2)<WELD_NEW) { snappedX2=p.x; snappedY2=p.y; }
                                  });
                                  newEl.x1=snappedX1; newEl.y1=snappedY1; newEl.x2=snappedX2; newEl.y2=snappedY2;
                                  // Per TELAIO LIBERO (no subType): NESSUNA modifica dei lati esistenti.
                                  // I vertici già piazzati restano dove sono — l'utente è libero di disegnare qualsiasi forma.
                                  // Solo i profili (subType) hanno weld a 120px per saldarli al telaio.
                                  const WELD_EXIST = subTypeVal ? WELD2 : 0;
                                  const weldedEls = WELD_EXIST === 0 ? els : els.map(x => {
                                    if (x.x1 === undefined) return x;
                                    let nx1=x.x1, ny1=x.y1, nx2=x.x2, ny2=x.y2;
                                    if (Math.hypot(nx1-snappedX1, ny1-snappedY1)<WELD_EXIST) { nx1=snappedX1; ny1=snappedY1; }
                                    if (Math.hypot(nx2-snappedX1, ny2-snappedY1)<WELD_EXIST) { nx2=snappedX1; ny2=snappedY1; }
                                    if (Math.hypot(nx1-snappedX2, ny1-snappedY2)<WELD_EXIST) { nx1=snappedX2; ny1=snappedY2; }
                                    if (Math.hypot(nx2-snappedX2, ny2-snappedY2)<WELD_EXIST) { nx2=snappedX2; ny2=snappedY2; }
                                    if (nx1!==x.x1||ny1!==x.y1||nx2!==x.x2||ny2!==x.y2) return {...x,x1:nx1,y1:ny1,x2:nx2,y2:ny2};
                                    return x;
                                  });
                                  // Per montante/traverso: reset pendingLine (no catena), per telaio libero: concatena
                                  // FIX CATENA: il prossimo lato deve cominciare ESATTAMENTE dove finisce questo (snappedX2/Y2),
                                  // non dal punto raw px/py (che può essere stato deviato dallo snap).
                                  const newChainStart = (isMont || isTrav) ? null : dw._chainStart;
                                  const newPending = (isMont || isTrav) ? null : { x1: snappedX2, y1: snappedY2, _subType: subTypeVal || null };
                                  setDW([...weldedEls, newEl], { _pendingLine: newPending, _chainStart: newChainStart, _lineSubType: subTypeVal });
                                }
                                return;
                              }

                              // Righello — traccia misura con punti di riferimento
                              if (drawMode === "righello") {
                                const sp = findSnap(mx, my);
                                let px2 = sp ? sp.x : snap(mx);
                                let py2 = sp ? sp.y : snap(my);
                                const pending2 = dw._pendingLine;
                                if (!pending2) {
                                  setMode({ _pendingLine: { x1: px2, y1: py2 }, _chainStart: { x: px2, y: py2 } });
                                } else {
                                  if (px2 === pending2.x1 && py2 === pending2.y1) return;
                                  const dx2r = px2 - pending2.x1, dy2r = py2 - pending2.y1;
                                  const lenPxR = Math.hypot(dx2r, dy2r) || 1;
                                  const refLenR = frame ? Math.max(frame.w, frame.h) : Math.max(fW, fH);
                                  const refRealR = frame ? (frame.w >= frame.h ? realW : realH) : Math.max(realW, realH);
                                  const mmR = Math.round(lenPxR / refLenR * refRealR);
                                  const hist = pushHistory();
                                  // Una sola chiamata — aggiunge elemento e resetta drawMode
                                  onUpdate({ ...dw, elements: [...els, { id: Date.now(), type: "righello", x1: pending2.x1, y1: pending2.y1, x2: px2, y2: py2, label: String(mmR) }], history: hist, drawMode: "righello", _pendingLine: null, _chainStart: null });
                                }
                                return;
                              }

                              // ═══ Angolo 45°/90° — click su angolo intersezione ═══
                              if (drawMode === "corner-45" || drawMode === "corner-90") {
                                const TOL = 20;
                                const angle = drawMode === "corner-45" ? 45 : 90;
                                // Trova angoli: intersezione tra montante/verticale e freeLine orizzontale
                                const horzEls = els.filter(e => (e.type === "freeLine" && e.subType) && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+0.5);
                                const vertEls = [
                                  ...els.filter(e => e.type === "montante"),
                                  ...els.filter(e => e.type === "freeLine" && !e.subType && Math.abs(e.x2-e.x1) < Math.abs(e.y2-e.y1)+1),
                                ];
                                let bestCorner: any = null, bestD = TOL;
                                horzEls.forEach(h => {
                                  vertEls.forEach(v => {
                                    const vx = v.type === "montante" ? v.x : (v.x1+v.x2)/2;
                                    const hy = (h.y1+h.y2)/2;
                                    // Check intersezione X e Y
                                    const hx1 = Math.min(h.x1,h.x2), hx2 = Math.max(h.x1,h.x2);
                                    const vy1 = v.type==="montante" ? (v.y1??fY) : Math.min(v.y1,v.y2);
                                    const vy2 = v.type==="montante" ? (v.y2??fY+fH) : Math.max(v.y1,v.y2);
                                    if (vx < hx1-TOL || vx > hx2+TOL) return;
                                    if (hy < vy1-TOL || hy > vy2+TOL) return;
                                    // Corner point
                                    const cx2 = vx, cy2 = hy;
                                    const d = Math.hypot(mx-cx2, my-cy2);
                                    if (d < bestD) {
                                      bestD = d;
                                      bestCorner = { hId: h.id, vId: v.id, cx: cx2, cy: cy2, angle };
                                    }
                                  });
                                });
                                if (bestCorner) {
                                  const hist = pushHistory();
                                  const updEls = els.map(e => {
                                    if (e.id === bestCorner.hId || e.id === bestCorner.vId) {
                                      const corners = e.corners ? [...e.corners.filter(c => Math.hypot(c.cx-bestCorner.cx,c.cy-bestCorner.cy)>5)] : [];
                                      if (angle !== 90) corners.push({ cx: bestCorner.cx, cy: bestCorner.cy, angle });
                                      return { ...e, corners };
                                    }
                                    return e;
                                  });
                                  onUpdate({ ...dw, elements: updEls, history: hist });
                                }
                                return;
                              }

                              // ═══ Angolo 45°/90° ═══
                              if (drawMode === "corner-45" || drawMode === "corner-90") {
                                const TOL = 20;
                                const angle = drawMode === "corner-45" ? 45 : 90;
                                const horzEls = els.filter(e => e.type === "freeLine" && e.subType && Math.abs(e.y2-e.y1) <= Math.abs(e.x2-e.x1)+0.5);
                                const vertEls = [
                                  ...els.filter(e => e.type === "montante"),
                                  ...els.filter(e => e.type === "freeLine" && !e.subType && Math.abs(e.x2-e.x1) < Math.abs(e.y2-e.y1)+1),
                                ];
                                let bestCorner = null, bestD = TOL;
                                horzEls.forEach(h => {
                                  vertEls.forEach(v => {
                                    const vx = v.type === "montante" ? v.x : (v.x1+v.x2)/2;
                                    const hy = (h.y1+h.y2)/2;
                                    const hx1 = Math.min(h.x1,h.x2), hx2 = Math.max(h.x1,h.x2);
                                    const vy1 = v.type==="montante" ? (v.y1??fY) : Math.min(v.y1,v.y2);
                                    const vy2 = v.type==="montante" ? (v.y2??(fY+fH)) : Math.max(v.y1,v.y2);
                                    if (vx < hx1-TOL || vx > hx2+TOL) return;
                                    if (hy < vy1-TOL || hy > vy2+TOL) return;
                                    const d = Math.hypot(mx-vx, my-hy);
                                    if (d < bestD) { bestD = d; bestCorner = { hId: h.id, vId: v.id, cx: vx, cy: hy, angle }; }
                                  });
                                });
                                if (bestCorner) {
                                  const hist = pushHistory();
                                  const updEls = els.map(e => {
                                    if (e.id === bestCorner.hId || e.id === bestCorner.vId) {
                                      const corners = (e.corners||[]).filter(c => Math.hypot(c.cx-bestCorner.cx,c.cy-bestCorner.cy)>5);
                                      if (angle !== 90) corners.push({ cx: bestCorner.cx, cy: bestCorner.cy, angle });
                                      return { ...e, corners };
                                    }
                                    return e;
                                  });
                                  onUpdate({ ...dw, elements: updEls, history: hist });
                                }
                                return;
                              }


                              // Modalità giunzione — click su marker apre pannello
                              if (drawMode === "junction") {
                                const JTOL = 24;
                                const nearest = junctions.reduce((best: any, j: any) => {
                                  const d = Math.hypot(j.ptX - mx, j.ptY - my);
                                  return (!best || d < best.d) ? { ...j, d } : best;
                                }, null);
                                if (nearest && nearest.d < JTOL) {
                                  setJunctionEdit(nearest);
                                }
                                return;
                              }

                              // Default — deselect
                              setMode({ selectedId: null });
                            };

                            // ══ Styles ══
                            const bs = (active = false) => ({ padding: "3px 6px", borderRadius: 5, border: `1px solid ${active ? "#1A9E73" : T.bdr}`, background: active ? `${"#1A9E73"}12` : T.card, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: active ? "#1A9E73" : T.text });
                            const bAp = (active = false) => ({ padding: "3px 6px", borderRadius: 5, border: `1px solid ${active ? T.blue : T.blue + "30"}`, background: active ? `${T.blue}12` : `${T.blue}05`, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: T.blue });
                            const bDel = (c2 = T.red) => ({ padding: "5px 9px", borderRadius: 6, border: `1px solid ${c2}30`, background: `${c2}08`, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: c2 });

                            const cursorMode = drawMode === "line" || drawMode === "apertura" || drawMode === "righello" || drawMode === "place-mont-free" || drawMode === "place-trav-free" || drawMode === "place-zocc-free" || drawMode === "place-fermavetro" || drawMode === "place-maniglione" || drawMode === "place-catalogo" || drawMode === "place-veloce" ? "crosshair" : drawMode ? "pointer" : "default";

                            // ══ Apply dim change con propagazione catena ══
                            const dimEditRef = dimEdit; // accessibile in applyDimChange
                            const applyDimChange = (elId, valStr, isDim = false, side = 'right') => {
                              const newMM = parseInt(valStr);
                              if (isNaN(newMM) || newMM <= 0) return;

                              // Caso 1: dim di tipo "dim" (misure telaio)
                              if (isDim) {
                                const dimEl = els.find(x => x.id === elId);
                                if (!dimEl) return;
                                const oldVal = parseInt(dimEl.label);
                                if (isNaN(oldVal) || oldVal <= 0 || oldVal === newMM) return;
                                const isH = Math.abs(dimEl.y1 - dimEl.y2) < 2;
                                let upd = els.map(x => x.id === elId ? { ...x, label: String(newMM) } : x);
                                if (frame) {
                                  // Scala px→mm: quanti px vale 1mm in questo disegno
                                  const pxPerMmW = frame.w / (oldVal > 0 ? oldVal : 1);
                                  const pxPerMmH = frame.h / (oldVal > 0 ? oldVal : 1);
                                  if (isH) {
                                    // Larghezza — cambia solo frame.w, aggiorna dim label
                                    const newPxW = Math.round(newMM * pxPerMmW);
                                    const diff = newPxW - frame.w;
                                    upd = upd.map(x => {
                                      if (x.type === "rect") return { ...x, w: newPxW };
                                      if (x.type === "montante") {
                                        // Mantieni proporzione relativa
                                        const ratio = frame.w > 0 ? (x.x - frame.x) / frame.w : 0.5;
                                        return { ...x, x: Math.round(frame.x + ratio * newPxW) };
                                      }
                                      if (x.type === "dim" && x.id !== elId && isH) {
                                        // Aggiorna dim della larghezza totale
                                        return { ...x, x2: Math.round(x.x1 + newPxW) };
                                      }
                                      if ((x.type === "innerRect" || x.type === "glass")) {
                                        const ratio = frame.w > 0 ? (x.x - frame.x) / frame.w : 0;
                                        return { ...x, x: Math.round(frame.x + ratio * newPxW), w: Math.round(x.w * newPxW / frame.w) };
                                      }
                                      return x;
                                    });
                                    onUpdateField && onUpdateField("larghezza", newMM);
                                  } else {
                                    // Altezza — cambia solo frame.h
                                    const newPxH = Math.round(newMM * pxPerMmH);
                                    upd = upd.map(x => {
                                      if (x.type === "rect") return { ...x, h: newPxH };
                                      if (x.type === "traverso") {
                                        const ratio = frame.h > 0 ? (x.y - frame.y) / frame.h : 0.5;
                                        return { ...x, y: Math.round(frame.y + ratio * newPxH) };
                                      }
                                      if ((x.type === "innerRect" || x.type === "glass")) {
                                        const ratio = frame.h > 0 ? (x.y - frame.y) / frame.h : 0;
                                        return { ...x, y: Math.round(frame.y + ratio * newPxH), h: Math.round(x.h * newPxH / frame.h) };
                                      }
                                      return x;
                                    });
                                    onUpdateField && onUpdateField("altezza", newMM);
                                  }
                                }
                                setDW(upd);
                                return;
                              }
                              // Caso 2: freeLine — side: 'left'|'right'|'both'
                              if (isNaN(newMM) || newMM <= 0) return;
                              const el2 = els.find(x => x.id === elId);
                              if (!el2 || el2.type !== "freeLine") return;
                              const dx2 = el2.x2 - el2.x1, dy2 = el2.y2 - el2.y1;
                              const lenPx = Math.hypot(dx2, dy2) || 1;
                              const curMM = (dimEditRef as any)?.curMM ?? el2._mmOverride ?? Math.round(lenPx);
                              if (curMM <= 0) return;
                              const newLenPx = lenPx * newMM / curMM;
                              const ux = dx2 / lenPx, uy = dy2 / lenPx;
                              const CONN = 15;
                              // Calcola spostamento per ogni modalità
                              // right: sposta x2 (punto finale), left: sposta x1 (punto iniziale), both: metà per ciascuno
                              let updEls;
                              if (side === 'right') {
                                // Allunga/accorcia dal lato destro: x2 si sposta, x1 fisso
                                const newX2 = Math.round(el2.x1 + ux * newLenPx);
                                const newY2 = Math.round(el2.y1 + uy * newLenPx);
                                const ddx = newX2 - el2.x2, ddy = newY2 - el2.y2;
                                updEls = els.map(x => {
                                  if (x.id === elId) return { ...x, x2: newX2, y2: newY2, _mmOverride: newMM };
                                  if (x.type !== "freeLine") return x;
                                  if (Math.hypot(x.x1 - el2.x2, x.y1 - el2.y2) < CONN) return { ...x, x1: Math.round(x.x1 + ddx), y1: Math.round(x.y1 + ddy) };
                                  if (Math.hypot(x.x2 - el2.x2, x.y2 - el2.y2) < CONN) return { ...x, x2: Math.round(x.x2 + ddx), y2: Math.round(x.y2 + ddy) };
                                  return x;
                                });
                              } else if (side === 'left') {
                                // Allunga/accorcia dal lato sinistro: x1 si sposta, x2 fisso
                                const newX1 = Math.round(el2.x2 - ux * newLenPx);
                                const newY1 = Math.round(el2.y2 - uy * newLenPx);
                                const ddx = newX1 - el2.x1, ddy = newY1 - el2.y1;
                                updEls = els.map(x => {
                                  if (x.id === elId) return { ...x, x1: newX1, y1: newY1, _mmOverride: newMM };
                                  if (x.type !== "freeLine") return x;
                                  if (Math.hypot(x.x1 - el2.x1, x.y1 - el2.y1) < CONN) return { ...x, x1: Math.round(x.x1 + ddx), y1: Math.round(x.y1 + ddy) };
                                  if (Math.hypot(x.x2 - el2.x1, x.y2 - el2.y1) < CONN) return { ...x, x2: Math.round(x.x2 + ddx), y2: Math.round(x.y2 + ddy) };
                                  return x;
                                });
                              } else {
                                // both: distribuisce la differenza a metà su entrambi i lati
                                const diff = newLenPx - lenPx;
                                const halfDiff = diff / 2;
                                const newX1 = Math.round(el2.x1 - ux * halfDiff);
                                const newY1 = Math.round(el2.y1 - uy * halfDiff);
                                const newX2 = Math.round(el2.x2 + ux * halfDiff);
                                const newY2 = Math.round(el2.y2 + uy * halfDiff);
                                const ddxL = newX1 - el2.x1, ddyL = newY1 - el2.y1;
                                const ddxR = newX2 - el2.x2, ddyR = newY2 - el2.y2;
                                updEls = els.map(x => {
                                  if (x.id === elId) return { ...x, x1: newX1, y1: newY1, x2: newX2, y2: newY2, _mmOverride: newMM };
                                  if (x.type !== "freeLine") return x;
                                  if (Math.hypot(x.x1 - el2.x1, x.y1 - el2.y1) < CONN) return { ...x, x1: Math.round(x.x1 + ddxL), y1: Math.round(x.y1 + ddyL) };
                                  if (Math.hypot(x.x2 - el2.x1, x.y2 - el2.y1) < CONN) return { ...x, x2: Math.round(x.x2 + ddxL), y2: Math.round(x.y2 + ddyL) };
                                  if (Math.hypot(x.x1 - el2.x2, x.y1 - el2.y2) < CONN) return { ...x, x1: Math.round(x.x1 + ddxR), y1: Math.round(x.y1 + ddyR) };
                                  if (Math.hypot(x.x2 - el2.x2, x.y2 - el2.y2) < CONN) return { ...x, x2: Math.round(x.x2 + ddxR), y2: Math.round(x.y2 + ddyR) };
                                  return x;
                                });
                              }
                              setDW(updEls);
                            };

                            return (
                              <>
                              <div style={{
                                marginTop: window.innerWidth > 768 ? 8 : 0,
                                background: T.card,
                                borderRadius: window.innerWidth > 768 ? 12 : 0,
                                border: window.innerWidth > 768 ? `1.5px solid ${"#1A9E73"}` : "none",
                                overflow: "hidden",
                                // Mobile: posizione fissa fullscreen
                                ...(window.innerWidth <= 768 ? {
                                  position: "fixed" as const,
                                  top: 0, left: 0, right: 0, bottom: 0,
                                  paddingTop: "env(safe-area-inset-top)",
                                  paddingLeft: "env(safe-area-inset-left)",
                                  paddingRight: "env(safe-area-inset-right)",
                                  paddingBottom: "env(safe-area-inset-bottom)",
                                  zIndex: 1000,
                                  display: "flex",
                                  flexDirection: "column" as const,
                                  overflow: "hidden",
                                  borderRadius: 0,
                                  margin: 0,
                                  background: T.card,
                                } : {})
                              }}>
                                {/* Header */}
                                <div style={{ padding: "8px 12px", background: `${"#1A9E73"}10`, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14 }}>✏️</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: "#1A9E73", flex: 1 }}>Disegno — {vanoNome || "Vano"} ({realW}×{realH})</span>
                                  {/* Toggle Vista Interna / Esterna */}
                                  <div onClick={() => setVista(vista === "interna" ? "esterna" : "interna")}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                                      padding: "3px 8px", borderRadius: 12,
                                      background: vista === "interna" ? "#1A9E7320" : "#D0800820",
                                      border: `1.5px solid ${vista === "interna" ? "#1A9E73" : "#D08008"}`,
                                      fontSize: 10, fontWeight: 800,
                                      color: vista === "interna" ? "#1A9E73" : "#D08008",
                                    }}>
                                    {vista === "interna" ? "🏠 INT" : "🌳 EST"} ⇄
                                  </div>
                                  <span onClick={() => onClose()} style={{ fontSize: 16, cursor: "pointer", color: T.sub, padding: "2px 6px" }}>✕</span>
                                </div>

                                {/* Info bar Sistema / Colore / Profilo (ereditati dal vano se presenti) */}
                                <div style={{ display: "flex", gap: 6, padding: "5px 10px", background: "#FAFAF7", borderBottom: `1px solid ${T.bdr}`, alignItems: "center", flexWrap: "wrap", fontSize: 9 }}>
                                  {[
                                    { lbl: "Sistema", val: vanoSistema, icon: "⚙", color: "#1A9E73" },
                                    { lbl: "Colore", val: vanoColore, icon: "●", color: "#D08008" },
                                    { lbl: "Profilo", val: vanoProfilo, icon: "▭", color: "#3B7FE0" },
                                  ].map(item => (
                                    <div key={item.lbl} onClick={() => {
                                      const v = prompt(`${item.lbl}:`, item.val || "");
                                      if (v && onUpdateField) {
                                        const fieldMap: any = { Sistema: "sistema", Colore: "colore", Profilo: "profilo" };
                                        onUpdateField(fieldMap[item.lbl], v);
                                      }
                                    }} style={{
                                      display: "flex", alignItems: "center", gap: 3,
                                      padding: "2px 7px", borderRadius: 4,
                                      background: item.val ? `${item.color}15` : "#fff",
                                      border: `1px solid ${item.val ? item.color : T.bdr}`,
                                      cursor: "pointer", fontWeight: 700,
                                      color: item.val ? item.color : T.sub,
                                    }}>
                                      <span style={{ fontSize: 8 }}>{item.icon}</span>
                                      <span style={{ fontSize: 8, opacity: 0.7 }}>{item.lbl}:</span>
                                      <span>{item.val || "—"}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* ═══ TAB BAR ═══ */}
                                <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}` }}>
                                  {[{ id: "disegno", l: "✏️ Disegno", c: "#1A9E73" }, { id: "libero", l: "✍️ Libero", c: "#6366f1" }].map(tab => (
                                    <div key={tab.id} onClick={() => setViewTab(tab.id)}
                                      style={{ flex: 1, padding: "7px 0", textAlign: "center", fontSize: 11, fontWeight: viewTab === tab.id ? 800 : 500, color: viewTab === tab.id ? tab.c : T.sub, borderBottom: viewTab === tab.id ? `2.5px solid ${tab.c}` : "2.5px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>
                                      {tab.l}
                                    </div>
                                  ))}
                                </div>

                                {/* ═══ TAB: FORMA ═══ */}
                                

                                {/* ═══ TAB: 3D ═══ */}
                                

                                {/* ═══ TAB: LIBERO (Paper.js) ═══ */}
                                {viewTab === "libero" && <LiberoEditor T={T} realW={realW} realH={realH} />}

                                {/* ═══ TAB: DISEGNO (originale) ═══ */}
                                {viewTab === "disegno" && <>
                                {/* Mode indicators */}
                                <div style={{ padding: "4px 8px 0", display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {drawMode === "line" && <span style={{ fontSize: 9, background: "#333", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>╱ STRUTTURA</span>}
                                  {drawMode === "apertura" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>↗ APERTURA</span>}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") && <span style={{ fontSize: 9, background: T.grn, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 CLICK su cella</span>}
                                  {(drawMode === "place-mont" || drawMode === "place-trav") && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 {drawMode === "place-mont" ? "MONTANTE" : "TRAVERSO"} — click cella</span>}
                                  {drawMode === "place-mont-free" && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>{dw._pendingLine ? "2° click → fine montante" : "1° click → inizio montante"}</span>}
                                  {drawMode === "place-trav-free" && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>{dw._pendingLine ? "2° click → fine traverso" : "1° click → inizio traverso"}</span>}
                                  {drawMode === "place-zocc-free" && <span style={{ fontSize: 9, background: "#8B5E3C", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>{dw._pendingLine ? "2° tap → fine zoccolo" : "1° tap → inizio zoccolo"}</span>}
                                  {drawMode === "place-ap" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 {placeApType} — click cella</span>}
                                </div>

                                {/* ═══ TAB BAR MENU a 5 sezioni ═══ */}
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px", borderBottom: `1px solid ${T.bdr}`, background: "#F8FAFA" }}>
                                  {[
                                    {id:"struttura",l:"Struttura",c:"#1A9E73"},
                                    {id:"profili",l:"Profili",c:"#1A7070"},
                                    {id:"aperture",l:"Aperture",c:"#3B7FE0"},
                                    {id:"accessori",l:"Access.",c:"#8B5E3C"},
                                    {id:"sensi",l:"Sensi",c:"#D08008"},
                                    {id:"strumenti",l:"Strumenti",c:"#6366f1"},
                                  ].map(mt => (
                                    <div key={mt.id} onClick={() => setMenuTab(menuTab === mt.id ? null : mt.id as any)} style={{
                                      flex: 1, padding: "5px 0", textAlign: "center", fontSize: 9, fontWeight: 800,
                                      borderRadius: 6, cursor: "pointer",
                                      background: menuTab === mt.id ? mt.c : "white",
                                      color: menuTab === mt.id ? "white" : T.sub,
                                      border: `1px solid ${menuTab === mt.id ? mt.c : T.bdr}`,
                                    }}>{mt.l}</div>
                                  ))}
                                </div>

                                {/* ═══ TAB 1: STRUTTURA ═══ */}
                                {menuTab === "struttura" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => {
                                    const now = Date.now();
                                    if (now - telaioTapRef.current < 400) {
                                      // Doppio tap → modal batch
                                      telaioTapRef.current = 0;
                                      setTelaioBatch({ open: true, L: String(realW || 1200), H: String(realH || 1400), N: "1" });
                                      return;
                                    }
                                    telaioTapRef.current = now;
                                    if (frames.length === 0) {
                                      setDW([...els, { id: Date.now(), type: "rect", x: fX, y: fY, w: fW, h: fH }]);
                                    }
                                    // FIX: single tap non aggiunge piu un secondo rettangolo affiancato.
                                    // Per modificare misura o creare telaio composto multi-pezzo: doppio tap.
                                  }} style={bs()} title="Tap singolo: aggiungi telaio · Doppio tap: pannello L×H×N pezzi"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>Telaio</div>
                                  <div onClick={() => setProfileMode("telaio", { drawMode: drawMode === "line" && !dw._lineSubType ? null : "line", _lineSubType: null, _pendingLine: null })} style={bs(drawMode === "line" && !dw._lineSubType)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polygon points="12,3 21,8 21,17 12,22 3,17 3,8"/></svg>Tel.Lib.</div>
                                  {drawMode === "line" && !dw._lineSubType && els.filter(e => e.type === "freeLine" && !e.subType).length >= 2 && (
                                    <div onClick={() => {
                                      const fl = els.filter(e => e.type === "freeLine");
                                      const ptCount = {};
                                      fl.forEach(l => { const k1 = Math.round(l.x1)+","+Math.round(l.y1); const k2 = Math.round(l.x2)+","+Math.round(l.y2); ptCount[k1]=(ptCount[k1]||0)+1; ptCount[k2]=(ptCount[k2]||0)+1; });
                                      const freePts = [];
                                      fl.forEach(l => { const k1=Math.round(l.x1)+","+Math.round(l.y1); const k2=Math.round(l.x2)+","+Math.round(l.y2); if(ptCount[k1]===1)freePts.push({x:l.x1,y:l.y1}); if(ptCount[k2]===1)freePts.push({x:l.x2,y:l.y2}); });
                                      if (freePts.length >= 2) { setDW([...els, { id: Date.now(), type: "freeLine", x1: freePts[0].x, y1: freePts[0].y, x2: freePts[1].x, y2: freePts[1].y }], { _pendingLine: null }); }
                                      else { setDW([...els, { id: Date.now(), type: "freeLine", x1: fl[fl.length-1].x2, y1: fl[fl.length-1].y2, x2: fl[0].x1, y2: fl[0].y1 }], { _pendingLine: null }); }
                                    }} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #1A9E73", background: "#1A9E73", fontSize: 9, fontWeight: 800, cursor: "pointer", color: "#fff", whiteSpace: "nowrap" }}>Chiudi</div>
                                  )}
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-mont" ? null : "place-mont", _pendingLine: null, _lineSubType: null })} style={bs(drawMode === "place-mont")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="12" y1="3" x2="12" y2="21"/></svg>Mont.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-trav" ? null : "place-trav", _pendingLine: null, _lineSubType: null })} style={bs(drawMode === "place-trav")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12"/></svg>Trav.</div>
                                  <div onClick={() => {
                                    // Calcolo frame virtuale: usa rect se esiste, altrimenti bounding box freeLine
                                    let fbX, fbY, fbW, fbH;
                                    if (frame) {
                                      fbX = frame.x; fbY = frame.y; fbW = frame.w; fbH = frame.h;
                                    } else {
                                      const fls = els.filter((e: any) => e.type === "freeLine");
                                      if (fls.length === 0) { alert("Crea prima un telaio o una forma"); return; }
                                      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
                                      for (const l of fls) {
                                        xMin = Math.min(xMin, l.x1, l.x2);
                                        xMax = Math.max(xMax, l.x1, l.x2);
                                        yMin = Math.min(yMin, l.y1, l.y2);
                                        yMax = Math.max(yMax, l.y1, l.y2);
                                      }
                                      fbX = xMin; fbY = yMin; fbW = xMax - xMin; fbH = yMax - yMin;
                                    }
                                    const inputN = prompt("Quanti montanti vuoi inserire? (es. 4)", "4");
                                    if (!inputN) return;
                                    const n = parseInt(inputN, 10);
                                    if (!Number.isFinite(n) || n < 1 || n > 50) { alert("Numero non valido (1-50)"); return; }
                                    const existing = els.filter(e => e.type === "montante");
                                    let elsBase = els;
                                    if (existing.length > 0) {
                                      const r = confirm(`Ci sono gia' ${existing.length} montanti.\n\nOK = sostituisci con ${n} nuovi equidistanti\nAnnulla = aggiungi ${n} nuovi`);
                                      if (r) elsBase = els.filter(e => e.type !== "montante");
                                    }
                                    const innerL = fbX + TK_FRAME;
                                    const innerR = fbX + fbW - TK_FRAME;
                                    const innerW = innerR - innerL;
                                    const step = innerW / (n + 1);
                                    const newMonts = [];
                                    const t0 = Date.now();
                                    for (let i = 1; i <= n; i++) {
                                      newMonts.push({
                                        id: t0 + i,
                                        type: "montante",
                                        x: Math.round(innerL + step * i),
                                        y1: fbY + TK_FRAME,
                                        y2: fbY + fbH - TK_FRAME,
                                      });
                                    }
                                    setDW([...elsBase, ...newMonts]);
                                  }} style={bs()} title="Inserisci N montanti equidistanti (anche dentro forme)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="6" y1="3" x2="6" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="18" y1="3" x2="18" y2="21"/></svg>Mont.xN</div>
                                  <div onClick={() => {
                                    let fbX, fbY, fbW, fbH;
                                    if (frame) {
                                      fbX = frame.x; fbY = frame.y; fbW = frame.w; fbH = frame.h;
                                    } else {
                                      const fls = els.filter((e: any) => e.type === "freeLine");
                                      if (fls.length === 0) { alert("Crea prima un telaio o una forma"); return; }
                                      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
                                      for (const l of fls) {
                                        xMin = Math.min(xMin, l.x1, l.x2);
                                        xMax = Math.max(xMax, l.x1, l.x2);
                                        yMin = Math.min(yMin, l.y1, l.y2);
                                        yMax = Math.max(yMax, l.y1, l.y2);
                                      }
                                      fbX = xMin; fbY = yMin; fbW = xMax - xMin; fbH = yMax - yMin;
                                    }
                                    const inputN = prompt("Quanti traversi vuoi inserire? (es. 3)", "3");
                                    if (!inputN) return;
                                    const n = parseInt(inputN, 10);
                                    if (!Number.isFinite(n) || n < 1 || n > 50) { alert("Numero non valido (1-50)"); return; }
                                    const existing = els.filter(e => e.type === "traverso");
                                    let elsBase = els;
                                    if (existing.length > 0) {
                                      const r = confirm(`Ci sono gia' ${existing.length} traversi.\n\nOK = sostituisci con ${n} nuovi equidistanti\nAnnulla = aggiungi ${n} nuovi`);
                                      if (r) elsBase = els.filter(e => e.type !== "traverso");
                                    }
                                    const innerT = fbY + TK_FRAME;
                                    const innerB = fbY + fbH - TK_FRAME;
                                    const innerH = innerB - innerT;
                                    const step = innerH / (n + 1);
                                    const newTravs = [];
                                    const t0 = Date.now();
                                    for (let i = 1; i <= n; i++) {
                                      newTravs.push({
                                        id: t0 + i,
                                        type: "traverso",
                                        y: Math.round(innerT + step * i),
                                        x1: fbX + TK_FRAME,
                                        x2: fbX + fbW - TK_FRAME,
                                      });
                                    }
                                    setDW([...elsBase, ...newTravs]);
                                  }} style={bs()} title="Inserisci N traversi equidistanti (anche dentro forme)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>Trav.xN</div>
                                  <div onClick={() => {
                                    if (!frame) { alert("Crea prima un telaio"); return; }
                                    const inputD = prompt("Crea 4 punti di riferimento a quanti mm dal centro?\n(usali come snap per disegnare il colmo casetta o altre forme)", "800");
                                    if (!inputD) return;
                                    const Dmm = parseFloat(inputD);
                                    if (!Number.isFinite(Dmm) || Dmm < 1) { alert("Distanza non valida"); return; }
                                    const pxPerMm = fW / (realW || 1200);
                                    const Dpx = Math.round(Dmm * pxPerMm);
                                    const cx = frame.x + frame.w / 2;
                                    const cy = frame.y + frame.h / 2;
                                    const t0 = Date.now();
                                    // 4 marker: SOPRA, SOTTO, SX, DX (linee tratteggiate corte di 4px = visibili come marker, endpoints snap-target)
                                    const refs = [
                                      { id: t0 + 1, type: "freeLine", x1: cx, y1: cy - Dpx - 2, x2: cx, y2: cy - Dpx + 2, _isReference: true },
                                      { id: t0 + 2, type: "freeLine", x1: cx, y1: cy + Dpx - 2, x2: cx, y2: cy + Dpx + 2, _isReference: true },
                                      { id: t0 + 3, type: "freeLine", x1: cx - Dpx - 2, y1: cy, x2: cx - Dpx + 2, y2: cy, _isReference: true },
                                      { id: t0 + 4, type: "freeLine", x1: cx + Dpx - 2, y1: cy, x2: cx + Dpx + 2, y2: cy, _isReference: true },
                                    ];
                                    setDW([...els, ...refs]);
                                  }} style={bs()} title="Crea 4 punti di riferimento a distanza N mm dal centro telaio"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="21"/><line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/></svg>Rif.</div>
                                  <div onClick={() => setShapePicker({ open: true, shape: null, L: "1500", H: "1400", H2: "800", H3: "400", H4: "1200", N: "16" })} style={bs()} title="Forme preset: casetta, arco, trapezio"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polygon points="12,3 21,10 21,21 3,21 3,10"/></svg>Forme</div>
                                  <div onClick={() => setProfileMode("telaio", { drawMode: drawMode === "line" && !dw._lineSubType ? null : "line", _lineSubType: null, _pendingLine: null })} style={bs(drawMode === "line" && !dw._lineSubType)} title="Casetta Live: tap punti notevoli per tracciare la forma a mano libera"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M3 21 V11 L12 3 L21 11 V21 Z"/><circle cx="12" cy="14" r="2" fill="currentColor"/></svg>Casetta</div>
                                </div>
                                </>}

                                {/* ═══ TAB 2: PROFILI ═══ */}
                                {menuTab === "profili" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => setProfileMode("montante", { drawMode: drawMode === "place-mont-free" ? null : "place-mont-free", _pendingLine: null })}
                                    style={bs(drawMode === "place-mont-free")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="12" y1="3" x2="12" y2="21"/></svg>Mont.Lib.</div>
                                  <div onClick={() => setProfileMode("traverso", { drawMode: drawMode === "place-trav-free" ? null : "place-trav-free", _pendingLine: null })}
                                    style={bs(drawMode === "place-trav-free")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12"/></svg>Trav.Lib.</div>
                                  <div onClick={() => setProfileMode("zoccolo", { drawMode: drawMode === "place-zocc-free" ? null : "place-zocc-free", _pendingLine: null })}
                                    style={bs(drawMode === "place-zocc-free")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="16" width="18" height="6" rx="0.5" fill="currentColor" fillOpacity="0.15"/></svg>Zocc.Lib.</div>
                                  <div onClick={() => setProfileMode("fermavetro", { drawMode: drawMode === "place-fermavetro" ? null : "place-fermavetro", _pendingLine: null })}
                                    style={bs(drawMode === "place-fermavetro")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="4" y="4" width="16" height="16" rx="0.5"/><rect x="7" y="7" width="10" height="10" rx="0.5"/></svg>Fermavetro</div>
                                  <div onClick={() => setProfileMode("soglia", { drawMode: drawMode === "line" && dw._lineSubType === "soglia" ? null : "line", _lineSubType: "soglia", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "soglia")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="14" width="18" height="4" rx="0.5"/></svg>Soglia</div>
                                  <div onClick={() => setProfileMode("zoccolo", { drawMode: drawMode === "line" && dw._lineSubType === "zoccolo" ? null : "line", _lineSubType: "zoccolo", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "zoccolo")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="16" width="18" height="6" rx="0.5" fill="currentColor" fillOpacity="0.15"/></svg>Zoccolo</div>
                                  <div onClick={() => setProfileMode("fascia", { drawMode: drawMode === "line" && dw._lineSubType === "fascia" ? null : "line", _lineSubType: "fascia", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "fascia")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="2" width="18" height="5" rx="0.5"/></svg>Fascia</div>
                                  <div onClick={() => setProfileMode("soglia_rib", { drawMode: drawMode === "line" && dw._lineSubType === "soglia_rib" ? null : "line", _lineSubType: "soglia_rib", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "soglia_rib")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M3 18 L8 14 L16 14 L21 18 Z"/></svg>Sog.Rib.</div>
                                  <div onClick={() => setProfileMode("profcomp", { drawMode: drawMode === "line" && dw._lineSubType === "profcomp" ? null : "line", _lineSubType: "profcomp", _pendingLine: null })}
                                    style={bs(drawMode === "line" && dw._lineSubType === "profcomp")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12" strokeWidth="3"/></svg>Prof.Comp.</div>
                                </div>
                                </>}

                                {/* ═══ TAB 3: APERTURE (tipo) ═══ */}
                                {menuTab === "aperture" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-anta" ? null : "place-anta", _pendingLine: null })} style={bs(drawMode === "place-anta")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="4" y="3" width="16" height="18" rx="0.5"/><line x1="12" y1="3" x2="12" y2="21"/></svg>Anta</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-porta" ? null : "place-porta", _pendingLine: null })} style={bs(drawMode === "place-porta")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M4 21 V4 Q4 3 5 3 H19 Q20 3 20 4 V21"/><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>Porta</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "place-persiana" ? null : "place-persiana", _pendingLine: null })} style={bs(drawMode === "place-persiana")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="3" width="18" height="18" rx="0.5"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>Pers.</div>
                                  <div onClick={() => {
                                    if (drawMode === "place-vetro") {
                                      setMode({ drawMode: null, _pendingLine: null });
                                      setSelectedVetro(null);
                                    } else {
                                      // Apri selettore vetri PRIMA di andare in modalità placement
                                      setShowSelettoreVetri(true);
                                    }
                                  }} style={bs(drawMode === "place-vetro")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="3" y="3" width="18" height="18" rx="0.5"/><line x1="6" y1="6" x2="10" y2="6"/><line x1="6" y1="6" x2="6" y2="10"/></svg>Vetro{selectedVetro ? ` ✓` : ""}</div>
                                  <div onClick={() => { const cx=frame?frame.x+frame.w/2:fX+fW/2; const cy=frame?frame.y+frame.h/2:fY+fH/2; setDW([...els,{id:Date.now(),type:"circle",cx,cy,r:Math.min(fW,fH)/4}]); }} style={bs()}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><circle cx="12" cy="12" r="9"/></svg>Oblò</div>
                                </div>
                                </>}

                                {/* ═══ TAB 4: SENSI APERTURA ═══ */}
                                {menuTab === "sensi" && <>
                                <div style={{ display: "flex", gap: 3, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  {[
                                    {id:"SX",l:"SX",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="15,6 9,12 15,18"/></svg>},
                                    {id:"DX",l:"DX",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="9,6 15,12 9,18"/></svg>},
                                    {id:"RIB",l:"Rib.",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="6,9 12,3 18,9"/><polyline points="6,15 12,21 18,15"/></svg>},
                                    {id:"OB",l:"OB",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="6,15 4,21 10,19"/><polyline points="6,9 12,3 18,9"/><line x1="12" y1="3" x2="4" y2="21"/></svg>},
                                    {id:"ALZ",l:"Alz.",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="6,14 12,8 18,14"/><line x1="4" y1="20" x2="20" y2="20"/></svg>},
                                    {id:"SCO",l:"Sco.",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><polyline points="7,9 3,12 7,15"/><polyline points="17,9 21,12 17,15"/><line x1="3" y1="12" x2="21" y2="12"/></svg>},
                                    {id:"FISSO",l:"Fisso",icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="4" y="4" width="16" height="16" rx="0.5"/><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>},
                                  ].map(ap => (
                                    <div key={ap.id} onClick={() => setMode({ drawMode: "place-ap", _placeApType: ap.id, _pendingLine: null })} style={bAp(drawMode === "place-ap" && placeApType === ap.id)}>{ap.icon}{ap.l}</div>
                                  ))}
                                </div>
                                </>}

                                {/* ═══ GRUPPO 3: ANNOTAZIONI + STRUMENTI ═══ */}
                                {menuTab === "accessori" && <>
                                {/* Sub-tab toggle: Catalogo vs Veloci */}
                                <div style={{ display: "flex", gap: 4, padding: "6px 6px 3px", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => setAccSubTab("catalogo")}
                                    style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textAlign: "center", cursor: "pointer",
                                      background: accSubTab === "catalogo" ? "#1A9E73" : T.card,
                                      color: accSubTab === "catalogo" ? "#fff" : T.sub,
                                      border: `1.5px solid ${accSubTab === "catalogo" ? "#1A9E73" : T.bdr}` }}>
                                    📦 Catalogo
                                  </div>
                                  <div onClick={() => setAccSubTab("veloci")}
                                    style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textAlign: "center", cursor: "pointer",
                                      background: accSubTab === "veloci" ? "#D08008" : T.card,
                                      color: accSubTab === "veloci" ? "#fff" : T.sub,
                                      border: `1.5px solid ${accSubTab === "veloci" ? "#D08008" : T.bdr}` }}>
                                    ⚡ Veloci
                                  </div>
                                </div>

                                {/* SEZIONE CATALOGO: apre modal per scegliere articolo + traccia per distinta */}
                                {accSubTab === "catalogo" && (
                                  <div style={{ padding: "8px 6px", borderBottom: `1px solid ${T.bdr}` }}>
                                    <div onClick={() => setShowCatalogo(true)}
                                      style={{ padding: "10px 12px", borderRadius: 8, background: "#1A9E73", color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
                                      📦 Sfoglia catalogo accessori
                                    </div>
                                    {pendingCatAcc && (
                                      <div style={{ marginTop: 6, padding: "6px 8px", borderRadius: 6, background: "#1A9E7315", border: "1px solid #1A9E73", fontSize: 9, color: "#1A9E73", fontWeight: 600 }}>
                                        ✓ {pendingCatAcc.nome} — tap sul disegno per piazzare
                                      </div>
                                    )}
                                    <div style={{ marginTop: 6, fontSize: 9, color: T.sub, lineHeight: 1.4 }}>
                                      Articoli con codice/prezzo/fornitore tracciati in distinta materiali.
                                    </div>
                                  </div>
                                )}

                                {/* SEZIONE VELOCI: pittogrammi senza articolo, solo grafici */}
                                {accSubTab === "veloci" && (
                                  <div style={{ padding: "6px", borderBottom: `1px solid ${T.bdr}` }}>
                                    {/* Antipanico - speciale, ha multi-punto */}
                                    <div onClick={() => setMode({ drawMode: drawMode === "place-maniglione" ? null : "place-maniglione", _pendingLine: null })}
                                      style={{ ...bs(drawMode === "place-maniglione"), marginBottom: 4, color: drawMode === "place-maniglione" ? "#cc2222" : undefined, border: `1.5px solid ${drawMode === "place-maniglione" ? "#cc2222" : T.bdr}` }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{display:"inline",verticalAlign:"middle",marginRight:3}}>
                                        <rect x="2" y="9" width="3" height="6" rx="0.5" fill="#1c1c1e"/>
                                        <rect x="19" y="9" width="3" height="6" rx="0.5" fill="#1c1c1e"/>
                                        <rect x="5" y="11" width="14" height="2" fill="#cc2222"/>
                                      </svg>
                                      Antipanico (1/3/4 punti)
                                    </div>
                                    {/* Griglia pittogrammi veloci */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                                      {[
                                        { id: "martellina", nome: "Martellina" },
                                        { id: "cremonese", nome: "Cremonese" },
                                        { id: "leva", nome: "Maniglia leva" },
                                        { id: "leva_cilindro", nome: "Leva+cilindro" },
                                        { id: "pomolo", nome: "Pomolo" },
                                        { id: "pomolo_girevole", nome: "Pomolo girev." },
                                        { id: "oliva", nome: "Oliva scorr." },
                                        { id: "molla_aerea", nome: "Molla aerea" },
                                        { id: "cerniera_vista", nome: "Cerniera" },
                                        { id: "paletto", nome: "Paletto" },
                                        { id: "catenaccio", nome: "Catenaccio" },
                                        { id: "spioncino", nome: "Spioncino" },
                                      ].map(p => (
                                        <div key={p.id} onClick={() => { setPendingVeloce(p.id); setMode({ drawMode: "place-veloce", _pendingLine: null }); }}
                                          title={p.nome}
                                          style={{ padding: "6px 2px", borderRadius: 5, fontSize: 8, fontWeight: 600, textAlign: "center", cursor: "pointer",
                                            background: pendingVeloce === p.id ? "#D0800815" : T.card,
                                            color: pendingVeloce === p.id ? "#D08008" : T.text,
                                            border: `1px solid ${pendingVeloce === p.id ? "#D08008" : T.bdr}` }}>
                                          {p.nome}
                                        </div>
                                      ))}
                                    </div>
                                    {pendingVeloce && (
                                      <div style={{ marginTop: 6, padding: "5px 8px", borderRadius: 6, background: "#D0800815", border: "1px solid #D08008", fontSize: 9, color: "#D08008", fontWeight: 600 }}>
                                        ⚡ {pendingVeloce} — tap sul disegno per piazzare
                                      </div>
                                    )}
                                  </div>
                                )}
                                </>}

                                {menuTab === "strumenti" && <>
                                <div style={{ display: "flex", gap: 2, padding: "4px 6px 3px", flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={() => setMode({ drawMode: drawMode === "apertura" ? null : "apertura", _pendingLine: null })} style={bAp(drawMode === "apertura")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10,5 19,5 19,14"/></svg>Linea lib.</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "pen" ? null : "pen", _penPath: null })} style={bs(drawMode === "pen")}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><line x1="2" y1="2" x2="7.586" y2="7.586"/></svg>Penna</div>
                                  <div onClick={() => { const txt = prompt("Testo:"); if (!txt) return; const cx2=frame?frame.x+frame.w/2:fX+fW/2; const cy2=frame?frame.y+frame.h/2:fY+fH/2; setDW([...els,{id:Date.now(),type:"label",x:cx2,y:cy2,text:txt,fontSize:11}]); }} style={bs()}>Aa Testo</div>
                                  <div onClick={() => setShowNodi(!showNodi)}
                                    style={{ ...bs(showNodi), background: showNodi ? "#3B7FE012" : undefined, color: showNodi ? "#3B7FE0" : undefined, border: `1.5px solid ${showNodi ? "#3B7FE0" : T.bdr}` }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}>
                                      <circle cx="6" cy="6" r="3"/>
                                      <circle cx="18" cy="6" r="3"/>
                                      <circle cx="12" cy="18" r="3"/>
                                      <line x1="9" y1="6" x2="15" y2="6"/>
                                      <line x1="7.5" y1="8.5" x2="10.5" y2="15.5"/>
                                      <line x1="16.5" y1="8.5" x2="13.5" y2="15.5"/>
                                    </svg>
                                    Nodi {(dw._nodi || []).length > 0 ? `(${(dw._nodi || []).length})` : ""}
                                  </div>
                                  <div onClick={() => {
                                    const nEls = els.filter(e => e.type !== "dim");
                                    if (frame) {
                                      nEls.push({id:Date.now()+300,type:"dim",x1:frame.x,y1:frame.y+frame.h+14,x2:frame.x+frame.w,y2:frame.y+frame.h+14,label:String(realW)},{id:Date.now()+301,type:"dim",x1:frame.x+frame.w+14,y1:frame.y,x2:frame.x+frame.w+14,y2:frame.y+frame.h,label:String(realH)});
                                      const iT=frame.y+TK_FRAME,iL=frame.x+TK_FRAME;
                                      const topCells=cells.filter(c2=>Math.abs(c2.y-iT)<4).sort((a,b)=>a.x-b.x);
                                      if(topCells.length>1)topCells.forEach((c2,i)=>nEls.push({id:Date.now()+310+i,type:"dim",x1:c2.x,y1:frame.y-10,x2:c2.x+c2.w,y2:frame.y-10,label:String(Math.round(c2.w/fW*realW))}));
                                      const leftCells=cells.filter(c2=>Math.abs(c2.x-iL)<4).sort((a,b)=>a.y-b.y);
                                      if(leftCells.length>1)leftCells.forEach((c2,i)=>nEls.push({id:Date.now()+330+i,type:"dim",x1:frame.x-14,y1:c2.y,x2:frame.x-14,y2:c2.y+c2.h,label:String(Math.round(c2.h/fH*realH))}));
                                    } else if (poly) {
                                      const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
                                      const bL=Math.min(...xs),bR=Math.max(...xs),bT=Math.min(...ys),bB=Math.max(...ys);
                                      nEls.push({id:Date.now()+300,type:"dim",x1:bL,y1:bB+14,x2:bR,y2:bB+14,label:String(realW)},{id:Date.now()+301,type:"dim",x1:bR+14,y1:bT,x2:bR+14,y2:bB,label:String(realH)});
                                      els.filter(e=>e.type==="freeLine").forEach((fl,fi)=>{const dx2=fl.x2-fl.x1,dy2=fl.y2-fl.y1;const segPx=Math.hypot(dx2,dy2);const diagMM=Math.hypot(realW,realH);const totalPx=Math.hypot(bR-bL,bB-bT);const segMM=Math.round(segPx/totalPx*diagMM);const cx=(bL+bR)/2,cy=(bT+bB)/2;const mx=(fl.x1+fl.x2)/2,my=(fl.y1+fl.y2)/2;const toCx=cx-mx,toCy=cy-my;const dist=Math.hypot(toCx,toCy)||1;const offX=-toCx/dist*16,offY=-toCy/dist*16;nEls.push({id:Date.now()+350+fi,type:"dim",x1:fl.x1+offX,y1:fl.y1+offY,x2:fl.x2+offX,y2:fl.y2+offY,label:String(segMM)});});
                                    }
                                    setDW(nEls);
                                  }} style={bs()}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="9" x2="3" y2="15"/><line x1="21" y1="9" x2="21" y2="15"/></svg>Misure</div>
                                  {/* Righello / Metro */}
                                  <div onClick={() => setMode({ drawMode: drawMode === "righello" ? null : "righello", _pendingLine: null })} style={{ ...bs(drawMode === "righello"), background: drawMode === "righello" ? "#3B7FE012" : undefined, color: drawMode === "righello" ? T.blue : undefined, border: `1px solid ${drawMode === "righello" ? T.blue : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><path d="M3 21L21 3L21 9L3 21Z"/><line x1="7" y1="17" x2="9" y2="15"/><line x1="11" y1="13" x2="13" y2="11"/><line x1="15" y1="9" x2="17" y2="7"/></svg>Righello</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "corner-45" ? null : "corner-45", _pendingLine: null })} style={{ ...bs(drawMode === "corner-45"), color: drawMode === "corner-45" ? "#D08008" : undefined, border: `1.5px solid ${drawMode === "corner-45" ? "#D08008" : T.bdr}` }}>⌐ 45°</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "corner-90" ? null : "corner-90", _pendingLine: null })} style={bs(drawMode === "corner-90")}>⌐ 90°</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "corner-45" ? null : "corner-45", _pendingLine: null })} style={{ ...bs(drawMode === "corner-45"), color: drawMode === "corner-45" ? "#D08008" : undefined, border: `1.5px solid ${drawMode === "corner-45" ? "#D08008" : T.bdr}` }}>⌐ 45°</div>
                                  <div onClick={() => setMode({ drawMode: drawMode === "corner-90" ? null : "corner-90", _pendingLine: null })} style={bs(drawMode === "corner-90")}>⌐ 90°</div>
                                  <div onClick={() => {
                                    // Riattiva pallini angoli su tutte le ante (innerRect + polyAnta)
                                    // E rimuove anche i flag _hidden manuali sul telaio
                                    const upd = els.map(e => {
                                      if (e.type === "innerRect" || e.type === "polyAnta") return { ...e, _userSetCorners: false };
                                      if (e.type === "freeLine" && e.cornerModes) {
                                        const cm = { ...e.cornerModes };
                                        delete cm.start_hidden; delete cm.end_hidden;
                                        return { ...e, cornerModes: cm };
                                      }
                                      return e;
                                    });
                                    setDW(upd);
                                  }} style={{ ...bs(), color: "#3B7FE0", border: `1.5px solid #3B7FE0` }}>● Pallini Angoli</div>
                                  <div onClick={() => {
                                    // Se il vano ha già una tipologia caricata, chiedi se sovrascrivere o salvare nuova
                                    if (vanoTipologiaId) {
                                      const choice = confirm(`Stai modificando la tipologia "${vanoTipologiaNome || 'esistente'}".\n\n• OK = AGGIORNA tipologia esistente\n• Annulla = SALVA come NUOVA tipologia`);
                                      if (choice) {
                                        // Edit: pre-popola con dati esistenti
                                        setSavingTipologia({ open: true, nome: vanoTipologiaNome || "", categoria: "Finestre", n_ante: "", note: "", id: vanoTipologiaId } as any);
                                      } else {
                                        setSavingTipologia({ open: true, nome: "", categoria: "Finestre", n_ante: "", note: "" });
                                      }
                                    } else {
                                      setSavingTipologia({ open: true, nome: "", categoria: "Finestre", n_ante: "", note: "" });
                                    }
                                  }}
                                    style={{ ...bs(), color: "#1A9E73", border: `1.5px solid #1A9E73`, background: "#1A9E7308" }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}>
                                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinejoin="round"/>
                                      <polyline points="17 21 17 13 7 13 7 21" strokeLinejoin="round"/>
                                      <polyline points="7 3 7 8 15 8" strokeLinejoin="round"/>
                                    </svg>
                                    Salva tipologia
                                  </div>
                                  <div onClick={() => setShowGestioneTipo(true)}
                                    style={{ ...bs(), color: "#3B7FE0", border: `1.5px solid #3B7FE0`, background: "#3B7FE008" }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}>
                                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinejoin="round"/>
                                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinejoin="round"/>
                                    </svg>
                                    Gestione
                                  </div>
                                  <div onClick={() => setMode({ _showDistinta: !dw._showDistinta })} style={{ ...bs(dw._showDistinta), background: dw._showDistinta ? "#D0800812" : undefined, color: dw._showDistinta ? "#D08008" : undefined, border: `1px solid ${dw._showDistinta ? "#D08008" : T.bdr}` }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display:"inline",verticalAlign:"middle",marginRight:3}}><rect x="5" y="3" width="14" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>Distinta</div>
                                  {/* Giunzioni */}
                                  {junctions.length > 0 && <div onClick={() => setMode({ drawMode: drawMode === "junction" ? null : "junction", _pendingLine: null })} style={{ ...bs(drawMode === "junction"), background: drawMode === "junction" ? "#3B7FE012" : undefined, color: drawMode === "junction" ? T.blue : undefined, border: `1.5px solid ${drawMode === "junction" ? T.blue : T.bdr}` }}>⌐ Giunzioni ({junctions.length})</div>}
                                </div>
                                </>}



                                {/* Row 3: Azioni */}
                                <div style={{ display: "flex", gap: 3, padding: "0 8px 6px", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={undo} style={bDel(T.acc)}>↩ Annulla</div>
                                  {selId && <div onClick={() => {
                                    // Se selId è "antaId:side", elimina solo quel lato aggiungendolo a hiddenSides
                                    const selStr = String(selId);
                                    if (selStr.includes(":")) {
                                      const [antaIdStr, side] = selStr.split(":");
                                      const antaId = isNaN(Number(antaIdStr)) ? antaIdStr : Number(antaIdStr);
                                      const upd = els.map(e => {
                                        if (e.id !== antaId) return e;
                                        const hidden = [...(e.hiddenSides || []), side];
                                        return { ...e, hiddenSides: hidden };
                                      });
                                      setDW(upd, { selectedId: null });
                                    } else {
                                      setDW(els.filter(e => e.id !== selId), { selectedId: null });
                                    }
                                  }} style={bDel()}>Elimina</div>}
                                  {selId && String(selId).includes(":") && (() => {
                                    const selStr = String(selId);
                                    const [antaIdStr, side] = selStr.split(":");
                                    const antaId = isNaN(Number(antaIdStr)) ? antaIdStr : Number(antaIdStr);
                                    const antaEl = els.find(e => e.id === antaId);
                                    if (!antaEl || antaEl.type !== "innerRect") return null;
                                    const curType = (antaEl.sideTypes || {})[side] || 'anta';
                                    const setSideType = (newType: string) => {
                                      const upd = els.map(e => {
                                        if (e.id !== antaId) return e;
                                        const newST = { ...(e.sideTypes || {}) };
                                        if (newType === 'anta') delete newST[side];
                                        else newST[side] = newType;
                                        return { ...e, sideTypes: newST };
                                      });
                                      setDW(upd, { selectedId: selId });
                                    };
                                    const TBtn = ({ t, label, color }: any) => (
                                      <div onClick={() => setSideType(t)} style={{ ...bDel(curType === t ? color : undefined), background: curType === t ? `${color}25` : undefined, borderColor: curType === t ? color : undefined, color: curType === t ? color : undefined }}>{label}</div>
                                    );
                                    return <>
                                      <TBtn t="anta" label="Anta" color="#777" />
                                      <TBtn t="zoccolo" label="Zoccolo" color="#8B5E3C" />
                                      <TBtn t="soglia" label="Soglia" color="#8B5E3C" />
                                      <TBtn t="fascia" label="Fascia" color="#666" />
                                    </>;
                                  })()}
                                  {selId && !String(selId).includes(":") && (() => {
                                    const selEl = els.find(e => e.id === selId);
                                    if (!selEl || selEl.type !== "freeLine") return null;
                                    const curSub = selEl.subType || 'telaio';
                                    const setSub = (newSub: string) => {
                                      const upd = els.map(e => {
                                        if (e.id !== selId) return e;
                                        if (newSub === 'telaio') { const { subType, ...rest } = e; return rest; }
                                        return { ...e, subType: newSub };
                                      });
                                      setDW(upd, { selectedId: selId });
                                    };
                                    const FBtn = ({ s, label, color }: any) => (
                                      <div onClick={() => setSub(s)} style={{ ...bDel(curSub === s ? color : undefined), background: curSub === s ? `${color}25` : undefined, borderColor: curSub === s ? color : undefined, color: curSub === s ? color : undefined }}>{label}</div>
                                    );
                                    return <>
                                      <FBtn s="telaio" label="Telaio" color="#1A9E73" />
                                      <FBtn s="soglia" label="Soglia" color="#8B5E3C" />
                                      <FBtn s="soglia_rib" label="Sog.Rib." color="#A0522D" />
                                      <FBtn s="zoccolo" label="Zoccolo" color="#8B5E3C" />
                                      <FBtn s="fascia" label="Fascia" color="#666" />
                                    </>;
                                  })()}
                                  {selId && (() => {
                                    const selEl = els.find(e => e.id === selId);
                                    if (!selEl) return null;
                                    const canChange = ["polyAnta","polyGlass","polyPersiana","innerRect","persiana","glass"].includes(selEl.type);
                                    if (!canChange) return null;
                                    const changeType = (newType, newSubType) => {
                                      const upd = els.map(e => {
                                        if (e.id !== selId) return e;
                                        if (newType === "polyAnta") return { ...e, type: "polyAnta", subType: newSubType || undefined };
                                        if (newType === "polyGlass") return { ...e, type: "polyGlass", subType: undefined };
                                        if (newType === "polyPersiana") return { ...e, type: "polyPersiana", subType: undefined };
                                        return e;
                                      });
                                      setDW(upd, { selectedId: selId });
                                    };
                                    return <>
                                      {selEl.type !== "polyAnta" && <div onClick={() => changeType("polyAnta")} style={bDel("#1A9E73")}>Anta</div>}
                                      {(selEl.type !== "polyAnta" || selEl.subType !== "porta") && <div onClick={() => changeType("polyAnta","porta")} style={bDel("#D08008")}>Porta</div>}
                                      {selEl.type !== "polyGlass" && <div onClick={() => changeType("polyGlass")} style={bDel("#3B7FE0")}>Vetro</div>}
                                      {selEl.type !== "polyPersiana" && <div onClick={() => changeType("polyPersiana")} style={bDel("#666")}>Persiana</div>}
                                    </>;
                                  })()}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setDW([], { selectedId: null, drawMode: null, _pendingLine: null, history: [] })} style={bDel()}>🗑 Reset</div>
                                  {frame && <div onClick={() => {
                                    // Aggiusta tutti i freeLine al bordo interno del frame
                                    const TKF = 6;
                                    const fi = {l:frame.x+TKF, r:frame.x+frame.w-TKF, t:frame.y+TKF, b:frame.y+frame.h-TKF};
                                    const fixed = els.map(e => {
                                      if (e.type !== "freeLine") return e;
                                      const isH = Math.abs(e.x2-e.x1) >= Math.abs(e.y2-e.y1);
                                      if (isH) {
                                        const dTop = Math.abs(e.y1 - fi.t), dBot = Math.abs(e.y1 - fi.b);
                                        const newY = dTop <= dBot ? fi.t : fi.b;
                                        return {...e, x1:Math.max(fi.l,Math.min(fi.r,e.x1)), x2:Math.max(fi.l,Math.min(fi.r,e.x2)), y1:newY, y2:newY};
                                      } else {
                                        const dL = Math.abs(e.x1 - fi.l), dR = Math.abs(e.x1 - fi.r);
                                        const newX = dL <= dR ? fi.l : fi.r;
                                        return {...e, y1:Math.max(fi.t,Math.min(fi.b,e.y1)), y2:Math.max(fi.t,Math.min(fi.b,e.y2)), x1:newX, x2:newX};
                                      }
                                    });
                                    setDW(fixed);
                                  }} style={{...bDel("#1A9E73"), background:"#1A9E7312"}}>⚡ Aggiusta</div>}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setMode({ _zoom: Math.max(0.2, (zoom || 1) - 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>−</div>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: T.sub, minWidth: 32, textAlign: "center" }}>{Math.round(zoom * 100)}%</div>
                                  <div onClick={() => setMode({ _zoom: Math.min(8, (zoom || 1) + 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>+</div>
                                  <div onClick={() => {
                                    // FIT auto: calcola bbox di tutti gli elementi e zooma per inquadrarli
                                    if (els.length === 0) { setMode({ _zoom: 1, _panX: 0, _panY: 0 }); return; }
                                    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
                                    els.forEach((e: any) => {
                                      if (e.x !== undefined && e.w !== undefined) {
                                        xMin = Math.min(xMin, e.x); xMax = Math.max(xMax, e.x + e.w);
                                        yMin = Math.min(yMin, e.y); yMax = Math.max(yMax, e.y + e.h);
                                      } else if (e.x1 !== undefined) {
                                        xMin = Math.min(xMin, e.x1, e.x2); xMax = Math.max(xMax, e.x1, e.x2);
                                        yMin = Math.min(yMin, e.y1, e.y2); yMax = Math.max(yMax, e.y1, e.y2);
                                      } else if (e.poly) {
                                        e.poly.forEach((p: number[]) => { xMin = Math.min(xMin, p[0]); xMax = Math.max(xMax, p[0]); yMin = Math.min(yMin, p[1]); yMax = Math.max(yMax, p[1]); });
                                      }
                                    });
                                    if (!isFinite(xMin)) { setMode({ _zoom: 1, _panX: 0, _panY: 0 }); return; }
                                    const margin = 80;
                                    const bw = (xMax - xMin) + margin * 2;
                                    const bh = (yMax - yMin) + margin * 2;
                                    const zw = canvasW / bw, zh = canvasH / bh;
                                    const newZoom = Math.max(0.15, Math.min(8, Math.min(zw, zh)));
                                    setMode({ _zoom: newZoom, _panX: xMin - margin, _panY: yMin - margin });
                                  }} style={{ ...bs(), fontSize: 9 }}>Fit</div>
                                  {/* Pan controls — sposta il disegno (utile su disegni grandi) */}
                                  <div style={{ display: "flex", gap: 1, marginLeft: 4, padding: "1px", background: "#f5f5f5", borderRadius: 4 }}>
                                    <div onClick={() => setMode({ _panX: panX - 80/zoom })} style={{ ...bs(), padding: "2px 6px", fontSize: 12 }} title="Sposta a sinistra">◀</div>
                                    <div onClick={() => setMode({ _panY: panY - 80/zoom })} style={{ ...bs(), padding: "2px 6px", fontSize: 12 }} title="Sposta in alto">▲</div>
                                    <div onClick={() => setMode({ _panY: panY + 80/zoom })} style={{ ...bs(), padding: "2px 6px", fontSize: 12 }} title="Sposta in basso">▼</div>
                                    <div onClick={() => setMode({ _panX: panX + 80/zoom })} style={{ ...bs(), padding: "2px 6px", fontSize: 12 }} title="Sposta a destra">▶</div>
                                  </div>
                                </div>

                                {/* SVG Canvas — zoomable with wheel + pannable */}
                                <div style={{ overflow: "hidden", position: "relative", flex: "1 1 0", minHeight: 300, border: `1px solid ${T.bdr}` }}>
                                {/* Badge Vista — fisso sopra al canvas */}
                                <div style={{
                                  position: "absolute", top: 8, left: 8, zIndex: 10,
                                  padding: "4px 10px", borderRadius: 14,
                                  background: vista === "interna" ? "#1A9E73" : "#D08008",
                                  color: "white", fontSize: 10, fontWeight: 900,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                                  pointerEvents: "none",
                                  letterSpacing: 0.5,
                                }}>
                                  {vista === "interna" ? "🏠 VISTA INTERNA" : "🌳 VISTA ESTERNA (specchiata)"}
                                </div>

                                {/* Mini-mappa overview (visibile quando zoom > 1.2) */}
                                {zoom > 1.2 && els.length > 0 && (() => {
                                  // Calcola bbox di tutti gli elementi
                                  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
                                  els.forEach((e: any) => {
                                    if (e.x !== undefined && e.w !== undefined) {
                                      xMin = Math.min(xMin, e.x); xMax = Math.max(xMax, e.x + e.w);
                                      yMin = Math.min(yMin, e.y); yMax = Math.max(yMax, e.y + e.h);
                                    } else if (e.x1 !== undefined) {
                                      xMin = Math.min(xMin, e.x1, e.x2); xMax = Math.max(xMax, e.x1, e.x2);
                                      yMin = Math.min(yMin, e.y1, e.y2); yMax = Math.max(yMax, e.y1, e.y2);
                                    }
                                  });
                                  if (!isFinite(xMin)) return null;
                                  const padM = 30;
                                  const bw = (xMax - xMin) + padM * 2;
                                  const bh = (yMax - yMin) + padM * 2;
                                  if (bw < 10 || bh < 10) return null;
                                  const MM_W = 130, MM_H = Math.max(60, Math.min(120, MM_W * bh / bw));
                                  const sf = MM_W / bw;
                                  // Viewport corrente nella mini-mappa
                                  const viewX = panX, viewY = panY;
                                  const viewW = canvasW / zoom, viewH = canvasH / zoom;
                                  const mmX = (viewX - (xMin - padM)) * sf;
                                  const mmY = (viewY - (yMin - padM)) * sf;
                                  const mmVW = viewW * sf;
                                  const mmVH = viewH * sf;
                                  return (
                                    <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, background: "rgba(255,255,255,0.95)", border: "1.5px solid #1A9E73", borderRadius: 6, padding: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
                                      onClick={(e) => {
                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                        const tx = e.clientX - rect.left - 3;
                                        const ty = e.clientY - rect.top - 3;
                                        const newPanX = (tx / sf) + (xMin - padM) - viewW / 2;
                                        const newPanY = (ty / sf) + (yMin - padM) - viewH / 2;
                                        setMode({ _panX: newPanX, _panY: newPanY });
                                      }}>
                                      <svg width={MM_W} height={MM_H} style={{ display: "block", cursor: "pointer" }}>
                                        {/* Sfondo bbox */}
                                        <rect x={0} y={0} width={MM_W} height={MM_H} fill="#FAFAF7" />
                                        {/* Elementi semplificati */}
                                        {els.map((e: any, i: number) => {
                                          const tx = (v: number) => (v - (xMin - padM)) * sf;
                                          const ty = (v: number) => (v - (yMin - padM)) * sf;
                                          if (e.type === "freeLine" && e.x1 !== undefined) {
                                            return <line key={i} x1={tx(e.x1)} y1={ty(e.y1)} x2={tx(e.x2)} y2={ty(e.y2)} stroke="#666" strokeWidth={0.8} />;
                                          }
                                          if ((e.type === "innerRect" || e.type === "zoccoloLibero" || e.type === "fermavetroRect" || e.type === "maniglione" || e.type === "rect") && e.x !== undefined) {
                                            const c = e.type === "zoccoloLibero" ? "#c8c6c0" : e.type === "innerRect" ? "#1A9E7320" : "#888";
                                            return <rect key={i} x={tx(e.x)} y={ty(e.y)} width={e.w * sf} height={e.h * sf} fill={c} stroke="#444" strokeWidth={0.4} />;
                                          }
                                          return null;
                                        })}
                                        {/* Viewport corrente */}
                                        <rect x={mmX} y={mmY} width={mmVW} height={mmVH} fill="rgba(26,158,115,0.15)" stroke="#1A9E73" strokeWidth={1.2} />
                                      </svg>
                                    </div>
                                  );
                                })()}
                                <svg width="100%" height="100%"
                                  viewBox={`${panX} ${panY} ${canvasW / zoom} ${canvasH / zoom}`}
                                  style={{ display: "block", background: "#fff", touchAction: "none", cursor: drawMode ? cursorMode : (zoom > 1 ? "grab" : "default"), transform: vista === "esterna" ? "scaleX(-1)" : "none", transition: "transform 0.3s ease" }}
                                  onClick={onSvgClick}
                                  onWheelDISABLED={(e2: any) => {
                                    e2.preventDefault();
                                    const newZoom = Math.max(0.15, Math.min(6, zoom + (e2.deltaY < 0 ? 0.15 : -0.15)));
                                    setMode({ _zoom: newZoom });
                                  }}
                                  onMouseDownDISABLED={(e2: any) => {
                                    // Pen mode — inizia tracciato
                                    if (drawMode === "pen" && e2.button === 0) {
                                      const svg = e2.currentTarget;
                                      const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                      onUpdate({ ...dw, _penActive: true, _penPath: [[Math.round(gmx), Math.round(gmy)]] });
                                      return;
                                    }
                                    // Pan with middle mouse or shift+left
                                    if (e2.button === 1 || (e2.shiftKey && e2.button === 0)) {
                                      e2.preventDefault();
                                      const sx = e2.clientX, sy = e2.clientY;
                                      const sp = panX, spp = panY;
                                      const onPM = (ev) => {
                                        const ndx = (ev.clientX - sx) / zoom;
                                        const ndy = (ev.clientY - sy) / zoom;
                                        onUpdate({ ...dw, _panX: sp - ndx, _panY: spp - ndy });
                                      };
                                      const onPU = () => { document.removeEventListener("mousemove", onPM); document.removeEventListener("mouseup", onPU); };
                                      document.addEventListener("mousemove", onPM);
                                      document.addEventListener("mouseup", onPU);
                                    }
                                  }}
                                  onMouseMoveDISABLED={(e2: any) => {
                                    const dw = dwRef.current;
                                    const els = dw.elements || [];
                                    const drawMode = dw.drawMode || null;
                                    const svg = e2.currentTarget;
                                    // Pen mode — traccia path
                                    if (drawMode === "pen" && dw._penActive) {
                                      const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                      const cur = dw._penPath || [];
                                      onUpdate({ ...dw, _penPath: [...cur, [Math.round(gmx), Math.round(gmy)]] });
                                      return;
                                    }
                                    if (!dw._pendingLine || !(drawMode === "line" || drawMode === "apertura" || drawMode === "righello" || drawMode === "place-mont-free" || drawMode === "place-trav-free" || drawMode === "place-zocc-free")) return;
                                    const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                    let gx = Math.round(gmx), gy = Math.round(gmy);
                                    const p = dw._pendingLine;
                                    // Snap a punti esistenti durante il movimento
                                    const snapPt = findSnap(gx, gy);
                                    if (snapPt) { gx = snapPt.x; gy = snapPt.y; }
                                    // ═══ ORTHO FORTE: ratio 2:1 → snap a H o V ═══
                                    let orthoApplied: "h" | "v" | null = null;
                                    if (!snapPt) {
                                      const adx = Math.abs(gx - p.x1), ady = Math.abs(gy - p.y1);
                                      // Se ady > 2*adx → snap verticale
                                      if (ady > adx * 2 && ady > 8) { gx = p.x1; orthoApplied = "v"; }
                                      // Se adx > 2*ady → snap orizzontale
                                      else if (adx > ady * 2 && adx > 8) { gy = p.y1; orthoApplied = "h"; }
                                    }
                                    // Mont.Lib: forza verticale
                                    if (drawMode === "place-mont-free" || dw._lineSubType === "montante") {
                                      gx = p.x1;
                                      if (frame) gy = Math.max(frame.y, Math.min(frame.y + frame.h, gy));
                                      orthoApplied = "v";
                                    }
                                    // Trav.Lib: forza orizzontale
                                    if (drawMode === "place-trav-free" || drawMode === "place-zocc-free" || dw._lineSubType === "traverso") {
                                      gy = p.y1;
                                      if (frame) gx = Math.max(frame.x, Math.min(frame.x + frame.w, gx));
                                      orthoApplied = "h";
                                    }
                                    const deg = Math.round(Math.atan2(-(gy - p.y1), gx - p.x1) * 180 / Math.PI);
                                    const len = Math.round(Math.hypot(gx - p.x1, gy - p.y1) / fW * realW);
                                    if (dw._guideX !== gx || dw._guideY !== gy || dw._orthoActive !== orthoApplied) {
                                      onUpdate({ ...dw, _guideX: gx, _guideY: gy, _guideDeg: deg, _guideLen: len, _orthoActive: orthoApplied });
                                    }
                                  }}
                                  onMouseUpDISABLED={(e2: any) => {
                                    // Pen mode — salva path come elemento
                                    if (drawMode === "pen" && dw._penActive) {
                                      const pts2 = dw._penPath || [];
                                      if (pts2.length > 2) {
                                        const d = pts2.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
                                        setDW([...els, { id: Date.now(), type: "penPath", d }], { _penActive: false, _penPath: null });
                                      } else {
                                        onUpdate({ ...dw, _penActive: false, _penPath: null });
                                      }
                                    }
                                  }}
                                  onTouchStart={(e2: any) => {
                                    // Avvia gesture pinch+pan se 2 dita
                                    if (e2.touches.length === 2) {
                                      const t1 = e2.touches[0], t2 = e2.touches[1];
                                      const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
                                      pinchRef.current = {
                                        active: true,
                                        startDist: Math.hypot(dx, dy),
                                        startZoom: dw._zoom || 1,
                                        startPanX: dw._panX || 0,
                                        startPanY: dw._panY || 0,
                                        startMidX: (t1.clientX + t2.clientX) / 2,
                                        startMidY: (t1.clientY + t2.clientY) / 2,
                                      };
                                      e2.preventDefault();
                                    }
                                  }}
                                  onTouchStartDISABLED={(e2: any) => {
                                    if (drawMode === "pen") {
                                      e2.preventDefault();
                                      const svg = e2.currentTarget;
                                      const t = e2.touches[0];
                                      const rect = svg.getBoundingClientRect();
                                      const vb = svg.viewBox?.baseVal;
                                      const sx = vb ? vb.width / rect.width : 1;
                                      const sy2 = vb ? vb.height / rect.height : 1;
                                      const gmx = Math.round((t.clientX - rect.left) * sx);
                                      const gmy = Math.round((t.clientY - rect.top) * sy2);
                                      onUpdate({ ...dw, _penActive: true, _penPath: [[gmx, gmy]] });
                                    }
                                  }}
                                  onTouchMove={(e2) => {
                                    // Gesture pinch+pan a 2 dita
                                    if (e2.touches.length === 2 && pinchRef.current.active) {
                                      e2.preventDefault();
                                      const t1 = e2.touches[0], t2 = e2.touches[1];
                                      const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
                                      const newDist = Math.hypot(dx, dy);
                                      const ratio = newDist / Math.max(1, pinchRef.current.startDist);
                                      const newZoom = Math.max(0.15, Math.min(8, pinchRef.current.startZoom * ratio));
                                      const newMidX = (t1.clientX + t2.clientX) / 2;
                                      const newMidY = (t1.clientY + t2.clientY) / 2;
                                      const dPanX = (newMidX - pinchRef.current.startMidX) / newZoom;
                                      const dPanY = (newMidY - pinchRef.current.startMidY) / newZoom;
                                      onUpdate({ ...dwRef.current,
                                        _zoom: newZoom,
                                        _panX: pinchRef.current.startPanX - dPanX,
                                        _panY: pinchRef.current.startPanY - dPanY,
                                      });
                                      return;
                                    }
                                    const dw = dwRef.current;
                                    const els = dw.elements || [];
                                    const drawMode = dw.drawMode || null;
                                    e2.preventDefault();
                                    const svg = e2.currentTarget;
                                    const t = e2.touches[0];
                                    const rect = svg.getBoundingClientRect();
                                    const vb = svg.viewBox?.baseVal;
                                    const sx = vb ? vb.width / rect.width : 1;
                                    const sy2 = vb ? vb.height / rect.height : 1;
                                    const gmx = (t.clientX - rect.left) * sx;
                                    const gmy = (t.clientY - rect.top) * sy2;
                                    // Pen mode touch
                                    if (drawMode === "pen" && dw._penActive) {
                                      const cur = dw._penPath || [];
                                      onUpdate({ ...dw, _penPath: [...cur, [Math.round(gmx), Math.round(gmy)]] });
                                      return;
                                    }
                                    if (!dw._pendingLine || !(drawMode === "line" || drawMode === "apertura" || drawMode === "righello" || drawMode === "place-mont-free" || drawMode === "place-trav-free" || drawMode === "place-zocc-free")) return;
                                    let gx = Math.round(gmx), gy = Math.round(gmy);
                                    const pp = dw._pendingLine;
                                    // Per Zocc.Lib. niente snap durante il preview live: il dito segue al millimetro.
                                    // Per altri modi: snap solo se entro 25px dal dito (no jump a bordi lontani).
                                    if (drawMode !== "place-zocc-free") {
                                      const snapPtT = findSnap(gx, gy);
                                      if (snapPtT && Math.hypot(snapPtT.x - gx, snapPtT.y - gy) < 70) {
                                        gx = snapPtT.x; gy = snapPtT.y;
                                      }
                                    }
                                    // ═══ ORTHO FORTE: ratio 2:1 → snap a H o V ═══
                                    let orthoTouchApplied: "h" | "v" | null = null;
                                    const adxT = Math.abs(gx - pp.x1), adyT = Math.abs(gy - pp.y1);
                                    if (adyT > adxT * 2 && adyT > 8) { gx = pp.x1; orthoTouchApplied = "v"; }
                                    else if (adxT > adyT * 2 && adxT > 8) { gy = pp.y1; orthoTouchApplied = "h"; }
                                    if (drawMode === "place-mont-free" || dw._lineSubType === "montante") { gx = pp.x1; if (frame) gy = Math.max(frame.y, Math.min(frame.y + frame.h, gy)); orthoTouchApplied = "v"; }
                                    if (drawMode === "place-trav-free" || drawMode === "place-zocc-free" || dw._lineSubType === "traverso") { gy = pp.y1; if (frame) gx = Math.max(frame.x, Math.min(frame.x + frame.w, gx)); orthoTouchApplied = "h"; }
                                    const deg = Math.round(Math.atan2(-(gy - pp.y1), gx - pp.x1) * 180 / Math.PI);
                                    const len = Math.round(Math.hypot(gx - pp.x1, gy - pp.y1) / fW * realW);
                                    if (dw._guideX !== gx || dw._guideY !== gy || dw._orthoActive !== orthoTouchApplied) {
                                      onUpdate({ ...dw, _guideX: gx, _guideY: gy, _guideDeg: deg, _guideLen: len, _orthoActive: orthoTouchApplied });
                                    }
                                  }}
                                  onTouchEnd={(e2) => {
                                    // Reset gesture pinch quando si rilascia
                                    if (pinchRef.current.active && e2.touches.length < 2) {
                                      pinchRef.current.active = false;
                                    }
                                    if (drawMode === "pen" && dw._penActive) {
                                      const pts2 = dw._penPath || [];
                                      if (pts2.length > 2) {
                                        const d = pts2.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
                                        setDW([...els, { id: Date.now(), type: "penPath", d }], { _penActive: false, _penPath: null });
                                      } else {
                                        onUpdate({ ...dw, _penActive: false, _penPath: null });
                                      }
                                    }
                                  }}
                                  onMouseLeave={() => { if (dw._guideX != null) onUpdate({ ...dw, _guideX: null, _guideY: null }); }}>
                                  <defs>
                                    <pattern id={`dg-${vanoId}`} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                                      <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                                    </pattern>
                                    {poly && <clipPath id={`polyClip-${vanoId}`}><polygon points={poly.map(p => p.join(",")).join(" ")} /></clipPath>}
                                    {frame && <clipPath id={`frameClip-${vanoId}`}><rect x={frame.x+6} y={frame.y+6} width={frame.w-12} height={frame.h-12} /></clipPath>}
                                  </defs>
                                  <rect x={panX - 100} y={panY - 100} width={canvasW / zoom + 200} height={canvasH / zoom + 200} fill={`url(#dg-${vanoId})`} />

                                  {/* Cell highlights in place mode — clipped to polygon if present */}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-ap" || drawMode === "place-mont" || drawMode === "place-trav" || drawMode === "place-porta" || drawMode === "place-persiana") && cells.length > 0 && (
                                    <g clipPath={poly ? `url(#polyClip-${vanoId})` : undefined}>
                                      {cells.map(c2 => (
                                        <rect key={`cell-${c2.id}`} x={c2.x + 1} y={c2.y + 1} width={c2.w - 2} height={c2.h - 2}
                                          fill={drawMode === "place-ap" ? T.blue : drawMode === "place-mont" || drawMode === "place-trav" ? "#555" : T.grn} fillOpacity={0.06}
                                          stroke={drawMode === "place-ap" ? T.blue : drawMode === "place-mont" || drawMode === "place-trav" ? "#555" : T.grn} strokeWidth={1} strokeDasharray="4,3" rx={2} />
                                      ))}
                                    </g>
                                  )}
                                  {/* Polygon shape highlight when no cells but freeLines exist */}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-ap" || drawMode === "place-porta" || drawMode === "place-persiana") && cells.length === 0 && (() => {
                                    const lines = els.filter(e => e.type === "freeLine");
                                    if (lines.length < 2) return null;
                                    // Build point chain from connected lines
                                    const pts = [];
                                    const used = new Set();
                                    const addPt = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                    addPt(lines[0].x1, lines[0].y1); addPt(lines[0].x2, lines[0].y2); used.add(0);
                                    for (let iter = 0; iter < lines.length; iter++) {
                                      const last = pts[pts.length - 1];
                                      for (let li = 0; li < lines.length; li++) {
                                        if (used.has(li)) continue;
                                        const l = lines[li];
                                        if (Math.hypot(l.x1 - last[0], l.y1 - last[1]) < 2) { addPt(l.x2, l.y2); used.add(li); break; }
                                        if (Math.hypot(l.x2 - last[0], l.y2 - last[1]) < 2) { addPt(l.x1, l.y1); used.add(li); break; }
                                      }
                                    }
                                    const clr = drawMode === "place-ap" ? T.blue : T.grn;
                                    if (pts.length >= 4) {
                                      return <polygon points={pts.map(p => p.join(",")).join(" ")} fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" />;
                                    }
                                    // Fallback to bbox
                                    const allX = lines.flatMap(l => [l.x1, l.x2]), allY = lines.flatMap(l => [l.y1, l.y2]);
                                    return <rect x={Math.min(...allX)+1} y={Math.min(...allY)+1} width={Math.max(...allX)-Math.min(...allX)-2} height={Math.max(...allY)-Math.min(...allY)-2}
                                      fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" rx={2} />;
                                  })()}

                                  {/* Snap points in draw mode */}
                                  {(drawMode === "line" || drawMode === "apertura" || drawMode === "righello") && dw._pendingLine && getSnapPoints().map((p, pi) => (
                                    <circle key={`sp${pi}`} cx={p.x} cy={p.y} r={3} fill={drawMode === "apertura" ? T.blue : "#1A9E73"} fillOpacity={0.2} />
                                  ))}

                                  {/* ══ PUNTI DI RIFERIMENTO — vertici telaio visibili SEMPRE in draw mode ══ */}
                                  {drawMode && (() => {
                                    const verts = [];
                                    // Vertici freeLine (telaio + profili)
                                    els.filter(e => e.type === "freeLine").forEach(l => {
                                      verts.push({x:l.x1,y:l.y1,sub:l.subType||"telaio"});
                                      verts.push({x:l.x2,y:l.y2,sub:l.subType||"telaio"});
                                    });
                                    // Vertici frame
                                    frames.forEach(fr => {
                                      verts.push({x:fr.x,y:fr.y,sub:"frame"});
                                      verts.push({x:fr.x+fr.w,y:fr.y,sub:"frame"});
                                      verts.push({x:fr.x,y:fr.y+fr.h,sub:"frame"});
                                      verts.push({x:fr.x+fr.w,y:fr.y+fr.h,sub:"frame"});
                                    });
                                    // Montanti
                                    els.filter(e => e.type === "montante").forEach(m => {
                                      const my1 = m.y1 ?? (frame ? frame.y : fY);
                                      const my2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                      verts.push({x:m.x,y:my1,sub:"montante"});
                                      verts.push({x:m.x,y:my2,sub:"montante"});
                                    });
                                    // Traversi
                                    els.filter(e => e.type === "traverso").forEach(t => {
                                      const tx1 = t.x1 ?? (frame ? frame.x : fX);
                                      const tx2 = t.x2 ?? (frame ? frame.x + frame.w : fX + fW);
                                      verts.push({x:tx1,y:t.y,sub:"traverso"});
                                      verts.push({x:tx2,y:t.y,sub:"traverso"});
                                    });
                                    // Deduplica
                                    const seen2 = new Set();
                                    const uv = verts.filter(p => {
                                      const k = Math.round(p.x/4)+","+Math.round(p.y/4);
                                      if (seen2.has(k)) return false;
                                      seen2.add(k); return true;
                                    });
                                    const colMap = {telaio:"#1A9E73",frame:"#555",montante:"#D08008",traverso:"#D08008",soglia:"#8B5E3C",zoccolo:"#8B5E3C",fascia:"#666"};
                                    return uv.map((v,vi) => {
                                      const c = colMap[v.sub] || "#1A9E73";
                                      return <g key={`ref-${vi}`}>
                                        <line x1={v.x-6} y1={v.y} x2={v.x+6} y2={v.y} stroke={c} strokeWidth={1.5} opacity={0.7} />
                                        <line x1={v.x} y1={v.y-6} x2={v.x} y2={v.y+6} stroke={c} strokeWidth={1.5} opacity={0.7} />
                                      </g>;
                                    });
                                  })()}

                                  {/* ══ CLOSED POLYGON PROFILES ══ */}
                                  {polys.map((polyPts, polyIdx) => {
                                    if (polyPts.length < 3) return null;
                                    const TK = TK_FRAME * 2; // spessore profilo
                                    const ptStr = polyPts.map(p => `${p[0]},${p[1]}`).join(" ");
                                    return (
                                      <g key={`pp${polyIdx}`}>
                                        {/* 1. Stroke spesso nero — va TK/2 dentro e TK/2 fuori */}
                                        <polygon points={ptStr} fill="none" stroke="#1A1A1C" strokeWidth={TK + 1} strokeLinejoin="miter" strokeMiterlimit="20" />
                                        {/* 2. Stroke beige più stretto — colore profilo */}
                                        <polygon points={ptStr} fill="none" stroke="#eceae0" strokeWidth={TK - 0.5} strokeLinejoin="miter" strokeMiterlimit="20" />
                                        {/* 3. Fill bianco — copre la metà interna dello stroke */}
                                        <polygon points={ptStr} fill="#fff" stroke="none" />
                                        {/* 4. Bordo interno netto */}
                                        <polygon points={ptStr} fill="none" stroke="#1A1A1C" strokeWidth={0.8} strokeLinejoin="miter" />
                                        {/* Corner dots */}
                                        {polyPts.map((p,pi)=><circle key={`pc${polyIdx}-${pi}`} cx={p[0]} cy={p[1]} r={3} fill="#333" />)}
                                      </g>
                                    );
                                  })}

                                                                    {/* ══ SOGLIA / ZOCCOLO / FASCIA / PROFCOMP ══ */}
                                  {els.filter(e => ["soglia","fascia","profcomp"].includes(e.type)).map(el => {
                                    const sel = el.id === selId;
                                    const hc = sel ? "#1A9E73" : undefined;
                                    const isSoglia = el.subType === "soglia";
                                    const isZoccolo = el.subType === "zoccolo";
                                    const isFascia = el.type === "fascia";
                                    const isProfComp = el.type === "profcomp";
                                    const tkH = isSoglia ? TK_SOGLIA*2 : isZoccolo ? TK_ZOCCOLO*2 : isFascia ? TK_FASCIA*2 : TK_PROFCOMP*2;
                                    const fillC = isSoglia ? "#e8e6de" : isZoccolo ? "#d8d6ce" : isFascia ? "#eeecea" : "#e0dedc";
                                    const refX = el.x !== undefined ? el.x : (frame ? frame.x : fX);
                                    const refW = el.w !== undefined ? el.w : (frame ? frame.w : fW);
                                    const refY = el.y !== undefined ? el.y : (frame ? frame.y + frame.h - tkH : fY);
                                    const labelTxt = el.profilo || el.subType || el.type;
                                    return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                        {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "move" }}>
                                        <rect x={refX} y={refY} width={refW} height={tkH} fill={hc ? hc+"20" : fillC} stroke={hc || "#555"} strokeWidth={sel ? 1.5 : 0.8} />
                                        {/* Etichetta profilo */}
                                        <text x={refX + refW/2} y={refY + tkH/2 + 3} textAnchor="middle" fontSize={7} fontWeight={700} fill={hc || "#333"} fontFamily="monospace">{labelTxt}</text>
                                        {sel && <><circle cx={refX} cy={refY+tkH/2} r={3} fill={"#1A9E73"}/><circle cx={refX+refW} cy={refY+tkH/2} r={3} fill={"#1A9E73"}/></>}
                                      </g>
                                    );
                                  })}

                                  {/* ══ DISTINTA MATERIALI ══ */}
                                  {dw._showDistinta && (() => {
                                    const distinta = [];
                                    // Telaio
                                    if (frame) {
                                      const perim = Math.round(2*(realW+realH));
                                      distinta.push({ tipo: "Telaio", profilo: "Telaio", q: 1, lung: `${realW}×${realH}`, note: `Perimetro ${perim}mm` });
                                    }
                                    // Montanti
                                    const monts = els.filter(e => e.type === "montante");
                                    if (monts.length > 0) distinta.push({ tipo: "Montante", profilo: "Montante", q: monts.length, lung: `${Math.round(realH)}`, note: `×${monts.length} pz` });
                                    // Traversi
                                    const travs = els.filter(e => e.type === "traverso");
                                    if (travs.length > 0) distinta.push({ tipo: "Traverso", profilo: "Traverso", q: travs.length, lung: `${Math.round(realW)}`, note: `×${travs.length} pz` });
                                    // Soglie/Zoccoli/Fasce
                                    els.filter(e => ["soglia","fascia","profcomp"].includes(e.type)).forEach(el => {
                                      distinta.push({ tipo: el.profilo || el.subType, profilo: el.profilo || el.type, q: 1, lung: String(realW), note: el.subType || el.type });
                                    });
                                    // FreeLine
                                    const fls = els.filter(e => e.type === "freeLine");
                                    if (fls.length > 0) {
                                      const allFL2 = fls;
                                      const allXs2 = allFL2.flatMap(l => [l.x1,l.x2]), allYs2 = allFL2.flatMap(l => [l.y1,l.y2]);
                                      const bboxW2 = Math.max(...allXs2)-Math.min(...allXs2)||1, bboxH2 = Math.max(...allYs2)-Math.min(...allYs2)||1;
                                      const mmPerPx2 = Math.max(realW/bboxW2, realH/bboxH2);
                                      fls.forEach(fl => {
                                        const mmL = fl._mmOverride ?? Math.round(Math.hypot(fl.x2-fl.x1,fl.y2-fl.y1)*mmPerPx2);
                                        distinta.push({ tipo: "Tel.Libero", profilo: "Profilo telaio", q: 1, lung: String(mmL), note: `${mmL}mm` });
                                      });
                                    }
                                    if (distinta.length === 0) return null;
                                    const bx = canvasW - 180, by = 20;
                                    return (
                                      <g>
                                        <rect x={bx-8} y={by-8} width={188} height={distinta.length*16+32} fill="#fff" stroke="#D08008" strokeWidth={1.2} rx={6} opacity={0.97} />
                                        <text x={bx} y={by+8} fontSize={9} fontWeight={800} fill="#D08008" fontFamily="monospace">📋 DISTINTA MATERIALI</text>
                                        {distinta.map((d, i) => (
                                          <g key={i}>
                                            <text x={bx} y={by+22+i*16} fontSize={8} fontWeight={700} fill="#1A1A1C" fontFamily="monospace">{d.tipo}</text>
                                            <text x={bx+75} y={by+22+i*16} fontSize={8} fill="#555" fontFamily="monospace">{d.lung}mm</text>
                                            <text x={bx+130} y={by+22+i*16} fontSize={8} fill="#888" fontFamily="monospace">{d.note}</text>
                                          </g>
                                        ))}
                                      </g>
                                    );
                                  })()}

                                  {/* ══ ELEMENTS ══ */}
                                  {/* Render in z-order: montanti/traversi prima, freeLine in mezzo, zoccoloLibero ULTIMO (sopra a tutto) */}
                                  {[
                                    ...els.filter(e => e.type === "montante" || e.type === "traverso"),
                                    ...els.filter(e => e.type !== "montante" && e.type !== "traverso" && e.type !== "zoccoloLibero" && e.type !== "maniglione"),
                                    ...els.filter(e => e.type === "zoccoloLibero"),
                                    ...els.filter(e => e.type === "maniglione"),
                                  ].map(el => {
                                    const sel = el.id === selId;
                                    const hc = sel ? "#1A9E73" : undefined;
                                    const dp = !drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id), style: { cursor: "move" } } : {};

                                    // ═══ TELAIO — doppio rettangolo con spessore ═══
                                    // ═══ ZOCCOLO LIBERO — rect autonomo, indipendente da telaio ═══
                                    // ═══ MANIGLIONE TUBOLARE — accessorio maniglia tubolare U-shape ═══
                                    if (el.type === "maniglione") {
                                      // ANTIPANICO CISA multi-punto: 1, 3, 4 punti chiusura
                                      const isH = el.orient !== "V";
                                      const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
                                      const rot = isH ? 0 : 90;
                                      const W = el.w, H = el.h;
                                      // Testate proporzionate
                                      const headW = Math.max(8, Math.min(14, W * 0.10));
                                      const headH = Math.max(10, Math.min(18, H * 0.85));
                                      const headY = (H - headH) / 2;
                                      // Push-bar centrale
                                      const barH = Math.max(4, H * 0.28);
                                      const barY = (H - barH) / 2;
                                      const barInner = barH * 0.85;
                                      const barInnerY = barY + (barH - barInner) / 2;
                                      const headColor = sel ? "#1A9E73" : "#1c1c1e";
                                      const redColor = sel ? "#1A9E73" : "#cc2222";
                                      const redLight = sel ? "#5BC9A0" : "#e84444";
                                      // Multi-punto config
                                      const tipoChiusura = el.tipoChiusura || "1p"; // 1p | 3p | 4p
                                      const ar = el.antaRect; // {x,y,w,h, side: "left"|"right"} se piazzato dentro un'anta
                                      const hasAste = (tipoChiusura === "3p" || tipoChiusura === "4p") && ar;
                                      // Asta verticale: sul profilo verticale dell'anta lato CENTRO porta
                                      // side="right" → asta a destra (anta sx, lato centrale a destra)
                                      // side="left"  → asta a sinistra (anta dx, lato centrale a sinistra)
                                      const profT = 6; // spessore profilo
                                      const astaX = ar ? (ar.side === "right" ? ar.x + ar.w - profT/2 - 1 : ar.x + profT/2 - 1) : 0;
                                      const astaTop = ar ? ar.y + 4 : 0;
                                      const astaBottom = ar ? ar.y + ar.h - 4 : 0;
                                      // Testata a contatto con asta (la testata centrale del maniglione)
                                      const testataCentraleX = ar ? (ar.side === "right" ? el.x + W - headW : el.x) : 0;
                                      // Segmenti neri sopra/sotto (chiusure verticali nel telaio)
                                      const segH = Math.max(8, ar ? ar.h * 0.04 : 8);
                                      return (
                                        <g key={el.id} {...dp} transform={`rotate(${rot} ${cx} ${cy})`} style={drawMode ? { pointerEvents: "none" } : { cursor: "move" }}>
                                          {/* Sfondo trasparente cliccabile */}
                                          <rect x={el.x} y={el.y} width={W} height={H} fill="transparent" />
                                          {/* Aste verticali (3p/4p) — disegnate PRIMA del maniglione così passano sotto */}
                                          {hasAste && (
                                            <>
                                              {/* Asta superiore: dal punto chiusura alto fino alla testata centrale */}
                                              <rect x={astaX - 1} y={astaTop} width={2} height={cy - astaTop} fill="#9a9aa3" />
                                              {/* Segmento nero sopra (chiusura nel telaio sopra) */}
                                              <rect x={astaX - 2.5} y={astaTop - segH} width={5} height={segH} rx={1} fill={headColor} />
                                              {/* Asta inferiore (solo per 4p): dalla testata centrale fino al pavimento */}
                                              {tipoChiusura === "4p" && (
                                                <>
                                                  <rect x={astaX - 1} y={cy} width={2} height={astaBottom - cy} fill="#9a9aa3" />
                                                  <rect x={astaX - 2.5} y={astaBottom} width={5} height={segH} rx={1} fill={headColor} />
                                                </>
                                              )}
                                            </>
                                          )}
                                          {/* Testata sinistra */}
                                          <rect x={el.x} y={el.y + headY} width={headW} height={headH} rx={2} fill={headColor} />
                                          <rect x={el.x + 2} y={el.y + headY + headH * 0.35} width={headW - 4} height={headH * 0.3} rx={1} fill="#3a3a3e" opacity={sel ? 0 : 1} />
                                          {/* Testata destra */}
                                          <rect x={el.x + W - headW} y={el.y + headY} width={headW} height={headH} rx={2} fill={headColor} />
                                          <rect x={el.x + W - headW + 2} y={el.y + headY + headH * 0.35} width={headW - 4} height={headH * 0.3} rx={1} fill="#3a3a3e" opacity={sel ? 0 : 1} />
                                          {/* Push-bar: contorno nero + barra rossa + highlight */}
                                          <rect x={el.x + headW} y={el.y + barY} width={W - headW * 2} height={barH} fill={headColor} />
                                          <rect x={el.x + headW} y={el.y + barInnerY} width={W - headW * 2} height={barInner} fill={redColor} />
                                          <rect x={el.x + headW} y={el.y + barInnerY} width={W - headW * 2} height={barInner * 0.3} fill={redLight} />
                                          {/* Selezione */}
                                          {sel && <rect x={el.x - 4} y={el.y - 4} width={W + 8} height={H + 8} fill="none" stroke="#1A9E73" strokeWidth={1.2} strokeDasharray="4,3" rx={4} />}
                                          {/* Etichetta articolo + tipo */}
                                          {(el.articolo || hasAste) && <text x={cx} y={el.y - 6} textAnchor="middle" fontSize={7} fontWeight={700} fill="#1A9E73" fontFamily="monospace">{el.articolo || ""}{el.articolo && tipoChiusura !== "1p" ? " · " : ""}{tipoChiusura !== "1p" ? tipoChiusura.toUpperCase() : ""}</text>}
                                          {/* Badge altezza installazione - cliccabile */}
                                          {el.altezza_install != null && (el.mostra_quota || sel) && (
                                            <g onClick={(e3: any) => {
                                              e3?.stopPropagation?.();
                                              const inp = prompt("Altezza antipanico (mm da terra):", String(el.altezza_install));
                                              if (!inp) return;
                                              const newH = parseInt(inp.trim());
                                              if (isNaN(newH) || newH < 0 || newH > 5000) return;
                                              const ant = ar;
                                              let newY = el.y;
                                              if (ant) {
                                                const ratio = Math.max(0, Math.min(1, newH / realH));
                                                newY = Math.round(ant.y + ant.h - ratio * ant.h - H / 2);
                                              }
                                              setDW(els.map((e2: any) => e2.id === el.id ? { ...e2, altezza_install: newH, y: newY, mostra_quota: true } : e2));
                                            }} style={{ cursor: "pointer" }}>
                                              <rect x={el.x + W + 3} y={cy - 8} width={36} height={16} rx={3} fill="#1A1A1C" opacity={0.85} />
                                              <text x={el.x + W + 21} y={cy + 3} textAnchor="middle" fontSize={8} fontWeight={800} fill="#fff" fontFamily="'JetBrains Mono',monospace">↕{el.altezza_install}</text>
                                            </g>
                                          )}
                                          {sel && el.altezza_install != null && (
                                            <g onClick={(e3: any) => {
                                              e3?.stopPropagation?.();
                                              setDW(els.map((e2: any) => e2.id === el.id ? { ...e2, mostra_quota: !el.mostra_quota } : e2));
                                            }} style={{ cursor: "pointer" }}>
                                              <circle cx={el.x - 10} cy={cy} r={7} fill={el.mostra_quota ? "#1A9E73" : "#fff"} stroke="#1A9E73" strokeWidth={1.2} />
                                              <text x={el.x - 10} y={cy + 3} textAnchor="middle" fontSize={8} fontWeight={800} fill={el.mostra_quota ? "#fff" : "#1A9E73"}>👁</text>
                                            </g>
                                          )}
                                        </g>
                                      );
                                    }

                                    // ═══ ACCESSORI (catalogo + veloci) — render pittogramma comune ═══
                                    if (el.type === "accessorio_catalogo" || el.type === "accessorio_veloce") {
                                      const W = el.w, H = el.h;
                                      const cx = el.x + W / 2, cy = el.y + H / 2;
                                      const C = sel ? "#1A9E73" : "#1c1c1e";
                                      const accentC = el.type === "accessorio_catalogo" ? (sel ? "#1A9E73" : "#1A9E73") : (sel ? "#1A9E73" : "#D08008");
                                      const sw = Math.max(0.5, W * 0.04);
                                      // Helper: scala pittogramma 0..24 → el.x..el.x+W
                                      const sx = (n: number) => el.x + (n / 24) * W;
                                      const sy = (n: number) => el.y + (n / 24) * H;
                                      const sl = (n: number) => (n / 24) * Math.min(W, H); // length scaled
                                      const pittog = el.pittogramma || "leva";
                                      let shape: any = null;
                                      switch (pittog) {
                                        case "martellina":
                                          shape = <>
                                            <rect x={sx(7)} y={sy(6)} width={sl(10)} height={sl(12)} rx={1.5} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <rect x={cx - sl(1.5)} y={cy - sl(1.5)} width={sl(3)} height={sl(3)} fill={C} />
                                            <rect x={el.x} y={cy - sl(1)} width={sl(7)} height={sl(2)} rx={0.5} fill={C} />
                                            <circle cx={el.x + sl(0.5)} cy={cy} r={sl(1.5)} fill={C} />
                                          </>;
                                          break;
                                        case "cremonese":
                                          shape = <>
                                            <rect x={sx(7)} y={sy(2)} width={sl(10)} height={sl(12)} rx={1.5} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <rect x={cx - sl(1.5)} y={cy - sl(7)} width={sl(3)} height={sl(3)} fill={C} />
                                            <rect x={cx - sl(1)} y={cy - sl(2)} width={sl(2)} height={sl(11)} fill={C} />
                                            <circle cx={cx} cy={cy + sl(9)} r={sl(1.5)} fill={C} />
                                          </>;
                                          break;
                                        case "leva":
                                          shape = <>
                                            <rect x={sx(7)} y={sy(6)} width={sl(10)} height={sl(12)} rx={1.5} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <circle cx={cx} cy={cy} r={sl(1.3)} fill={C} />
                                            <rect x={el.x} y={cy - sl(1)} width={sl(7)} height={sl(2)} rx={0.5} fill={C} />
                                            <rect x={el.x - sl(0.5)} y={cy - sl(1.5)} width={sl(2)} height={sl(3)} rx={0.5} fill={C} />
                                          </>;
                                          break;
                                        case "leva_cilindro":
                                          shape = <>
                                            <rect x={sx(7)} y={sy(6)} width={sl(10)} height={sl(12)} rx={1.5} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <circle cx={cx} cy={cy - sl(1.5)} r={sl(1.5)} fill={C} />
                                            <rect x={cx - sl(0.7)} y={cy} width={sl(1.5)} height={sl(4)} fill={C} />
                                            <rect x={el.x} y={cy - sl(0.7)} width={sl(7)} height={sl(1.5)} rx={0.5} fill={C} />
                                          </>;
                                          break;
                                        case "pomolo":
                                          shape = <>
                                            <circle cx={cx} cy={cy} r={sl(7)} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <circle cx={cx} cy={cy} r={sl(2.5)} fill={C} />
                                            <rect x={cx - sl(1.5)} y={cy - sl(1.5)} width={sl(3)} height={sl(3)} fill="#fff" stroke={C} strokeWidth={0.4} />
                                          </>;
                                          break;
                                        case "pomolo_girevole":
                                          shape = <>
                                            <circle cx={cx} cy={cy} r={sl(8)} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <rect x={cx - sl(0.7)} y={cy - sl(8)} width={sl(1.5)} height={sl(16)} fill={C} />
                                            <rect x={cx - sl(8)} y={cy - sl(0.7)} width={sl(16)} height={sl(1.5)} fill={C} />
                                          </>;
                                          break;
                                        case "oliva":
                                          shape = <>
                                            <circle cx={cx} cy={cy} r={sl(7)} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <rect x={cx - sl(1.2)} y={cy - sl(7)} width={sl(2.4)} height={sl(4.5)} fill={C} />
                                            <rect x={cx - sl(1.2)} y={cy + sl(2.5)} width={sl(2.4)} height={sl(4.5)} fill={C} />
                                            <rect x={cx - sl(7)} y={cy - sl(1.2)} width={sl(4.5)} height={sl(2.4)} fill={C} />
                                            <rect x={cx + sl(2.5)} y={cy - sl(1.2)} width={sl(4.5)} height={sl(2.4)} fill={C} />
                                            <circle cx={cx} cy={cy} r={sl(1.6)} fill={C} />
                                          </>;
                                          break;
                                        case "molla_aerea":
                                          shape = <>
                                            <rect x={el.x + sl(2)} y={cy - sl(1.5)} width={sl(8)} height={sl(3)} rx={0.5} fill={C} />
                                            <line x1={el.x + sl(10)} y1={cy} x2={el.x + sl(18)} y2={cy - sl(8)} stroke={C} strokeWidth={sw * 1.5} strokeLinecap="round" />
                                            <line x1={el.x + sl(18)} y1={cy - sl(8)} x2={el.x + sl(18)} y2={cy - sl(15)} stroke={C} strokeWidth={sw * 1.5} strokeLinecap="round" />
                                            <rect x={el.x + sl(16)} y={cy - sl(20)} width={sl(4)} height={sl(5)} rx={0.5} fill={C} />
                                          </>;
                                          break;
                                        case "cerniera_vista":
                                          shape = <>
                                            <rect x={cx - sl(7)} y={cy - sl(2)} width={sl(14)} height={sl(4)} rx={2} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <line x1={cx - sl(7)} y1={cy - sl(7)} x2={cx - sl(7)} y2={cy - sl(2)} stroke={C} strokeWidth={sw} />
                                            <line x1={cx + sl(7)} y1={cy - sl(7)} x2={cx + sl(7)} y2={cy - sl(2)} stroke={C} strokeWidth={sw} />
                                            <line x1={cx - sl(7)} y1={cy + sl(2)} x2={cx - sl(7)} y2={cy + sl(7)} stroke={C} strokeWidth={sw} />
                                            <line x1={cx + sl(7)} y1={cy + sl(2)} x2={cx + sl(7)} y2={cy + sl(7)} stroke={C} strokeWidth={sw} />
                                          </>;
                                          break;
                                        case "paletto":
                                          shape = <>
                                            <rect x={cx - sl(8)} y={cy - sl(2)} width={sl(16)} height={sl(4)} rx={0.5} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <rect x={cx - sl(1.5)} y={cy - sl(2)} width={sl(3)} height={sl(8)} fill={C} />
                                            <rect x={cx - sl(2.5)} y={cy + sl(6)} width={sl(5)} height={sl(2.5)} rx={0.5} fill={C} />
                                          </>;
                                          break;
                                        case "catenaccio":
                                          shape = <>
                                            <rect x={cx - sl(8)} y={cy - sl(2)} width={sl(16)} height={sl(4)} fill={C} />
                                            <rect x={cx - sl(1.5)} y={cy + sl(2)} width={sl(3)} height={sl(4)} fill={C} />
                                          </>;
                                          break;
                                        case "spioncino":
                                          shape = <>
                                            <rect x={cx - sl(6)} y={cy - sl(6)} width={sl(12)} height={sl(12)} rx={2} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <circle cx={cx} cy={cy} r={sl(2.5)} fill={C} />
                                            <rect x={cx - sl(1.2)} y={cy - sl(6)} width={sl(2.5)} height={sl(2.5)} fill={C} />
                                          </>;
                                          break;
                                        default:
                                          // Fallback: pomolo generico
                                          shape = <>
                                            <circle cx={cx} cy={cy} r={sl(7)} fill="#fff" stroke={C} strokeWidth={sw} />
                                            <circle cx={cx} cy={cy} r={sl(2)} fill={C} />
                                          </>;
                                      }
                                      return (
                                        <g key={el.id} {...dp} style={drawMode ? { pointerEvents: "none" } : { cursor: "move" }}>
                                          <rect x={el.x} y={el.y} width={W} height={H} fill="transparent" />
                                          {shape}
                                          {sel && <rect x={el.x - 3} y={el.y - 3} width={W + 6} height={H + 6} fill="none" stroke="#1A9E73" strokeWidth={1.2} strokeDasharray="3,2" rx={3} />}
                                          {el.codice && <text x={cx} y={el.y - 4} textAnchor="middle" fontSize={6} fontWeight={700} fill={accentC} fontFamily="monospace">{el.codice}</text>}
                                          {/* Indicatore catalogo vs veloce */}
                                          {el.type === "accessorio_catalogo" && <circle cx={el.x + W - 2} cy={el.y + 2} r={1.5} fill="#1A9E73" />}
                                          {el.type === "accessorio_veloce" && <circle cx={el.x + W - 2} cy={el.y + 2} r={1.2} fill="#D08008" />}
                                          {/* Quota altezza - cliccabile per editare */}
                                          {el.altezza_install != null && (el.mostra_quota || sel) && (
                                            <g onClick={(e3: any) => {
                                              e3?.stopPropagation?.();
                                              const inp = prompt(`Altezza installazione (mm da terra):`, String(el.altezza_install));
                                              if (!inp) return;
                                              const newH = parseInt(inp.trim());
                                              if (isNaN(newH) || newH < 0 || newH > 5000) return;
                                              // Trova anta sotto + ricalcola Y
                                              const ant = els.find((e2: any) => e2.type === "innerRect" &&
                                                el.x >= e2.x && el.x + W <= e2.x + e2.w && el.y >= e2.y && el.y + H <= e2.y + e2.h);
                                              let newY = el.y;
                                              if (ant) {
                                                const ratio = Math.max(0, Math.min(1, newH / realH));
                                                newY = Math.round(ant.y + ant.h - ratio * ant.h - H / 2);
                                              }
                                              setDW(els.map((e2: any) => e2.id === el.id ? { ...e2, altezza_install: newH, y: newY, mostra_quota: true } : e2));
                                            }} style={{ cursor: "pointer" }}>
                                              <rect x={el.x + W + 3} y={el.y + H/2 - 7} width={32} height={14} rx={3} fill="#1A1A1C" opacity={0.85} />
                                              <text x={el.x + W + 19} y={el.y + H/2 + 3} textAnchor="middle" fontSize={7} fontWeight={800} fill="#fff" fontFamily="'JetBrains Mono',monospace">↕{el.altezza_install}</text>
                                            </g>
                                          )}
                                          {/* Toggle "mostra quota": se accessorio selezionato + ha altezza, bottoncino on/off */}
                                          {sel && el.altezza_install != null && (
                                            <g onClick={(e3: any) => {
                                              e3?.stopPropagation?.();
                                              setDW(els.map((e2: any) => e2.id === el.id ? { ...e2, mostra_quota: !el.mostra_quota } : e2));
                                            }} style={{ cursor: "pointer" }}>
                                              <circle cx={el.x - 8} cy={el.y + H/2} r={6} fill={el.mostra_quota ? "#1A9E73" : "#fff"} stroke="#1A9E73" strokeWidth={1} />
                                              <text x={el.x - 8} y={el.y + H/2 + 3} textAnchor="middle" fontSize={7} fontWeight={800} fill={el.mostra_quota ? "#fff" : "#1A9E73"}>👁</text>
                                            </g>
                                          )}
                                        </g>
                                      );
                                    }

                                    // ═══ FERMAVETRO — anello sottile attorno al vetro ═══
                                    // ═══ PROFILO DI RIPORTO — sta sull'anta che apre per prima (a sinistra) ═══
                                    if (el.type === "profiloRiporto") {
                                      return (
                                        <g key={el.id} {...dp} style={drawMode ? { pointerEvents: "none" } : { cursor: "move" }}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill={sel ? "#1A9E7322" : "#b8b6b0"} stroke={sel ? "#1A9E73" : "#3A3A3C"} strokeWidth={sel ? 1.2 : 0.5} />
                                          {/* Linea verticale al centro per look profilo */}
                                          <line x1={el.x + el.w / 2} y1={el.y + 4} x2={el.x + el.w / 2} y2={el.y + el.h - 4} stroke="#3A3A3C" strokeWidth={0.4} opacity={0.5} />
                                        </g>
                                      );
                                    }

                                    if (el.type === "fermavetroRect") {
                                      const T = 3;
                                      return (
                                        <g key={el.id} {...dp} style={drawMode ? { pointerEvents: "none" } : undefined}>
                                          {/* Lato top */}
                                          <rect x={el.x} y={el.y} width={el.w} height={T} fill={sel ? "#1A9E73" : "#a8a89c"} />
                                          {/* Lato bot */}
                                          <rect x={el.x} y={el.y + el.h - T} width={el.w} height={T} fill={sel ? "#1A9E73" : "#a8a89c"} />
                                          {/* Lato sx */}
                                          <rect x={el.x} y={el.y} width={T} height={el.h} fill={sel ? "#1A9E73" : "#a8a89c"} />
                                          {/* Lato dx */}
                                          <rect x={el.x + el.w - T} y={el.y} width={T} height={el.h} fill={sel ? "#1A9E73" : "#a8a89c"} />
                                          {sel && [[el.x,el.y],[el.x+el.w,el.y],[el.x,el.y+el.h],[el.x+el.w,el.y+el.h]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={3} fill="#1A9E73" />)}
                                        </g>
                                      );
                                    }

                                    if (el.type === "zoccoloLibero") {
                                      // Se ci sono Mont.Lib. che attraversano in verticale e il loro bordo
                                      // tocca il rect dello zoccolo, lo zoccolo si accorcia per non sovrapporsi.
                                      let zx = el.x, zw = el.w;
                                      els.filter((m: any) => m.type === "montante" && m._libero).forEach((m: any) => {
                                        const HM = TK_MONT / 2;
                                        const mLeft = m.x - HM, mRight = m.x + HM;
                                        // Il montante attraversa in altezza l'area dello zoccolo?
                                        const my1 = m.y1 ?? -Infinity, my2 = m.y2 ?? Infinity;
                                        const overlapY = Math.min(my2, el.y + el.h) > Math.max(my1, el.y);
                                        if (!overlapY) return;
                                        // Bordo destro del montante intersecta bordo sinistro zoccolo
                                        if (mRight > zx && mRight < zx + zw && mLeft <= zx + 2) {
                                          const newLeft = mRight;
                                          zw = zx + zw - newLeft;
                                          zx = newLeft;
                                        }
                                        // Bordo sinistro del montante intersecta bordo destro zoccolo
                                        if (mLeft < zx + zw && mLeft > zx && mRight >= zx + zw - 2) {
                                          zw = mLeft - zx;
                                        }
                                      });
                                      return (
                                        <g key={el.id} {...dp} style={drawMode ? { pointerEvents: "none" } : undefined}>
                                          <rect x={zx} y={el.y} width={zw} height={el.h} fill={sel ? "#1A9E7322" : "#c8c6c0"} stroke={sel ? "#1A9E73" : "#3A3A3C"} strokeWidth={sel ? 1.5 : 0.7} />
                                          {zw > 30 && <text x={zx + zw / 2} y={el.y + el.h / 2 + 3} textAnchor="middle" fontSize={6} fontWeight={800} fill="#fff" pointerEvents="none">ZOCCOLO</text>}
                                        </g>
                                      );
                                    }

                                    if (el.type === "rect") {
                                      // Rendering esteticamente identico al telaio libero (TEL.LIB.):
                                      // 4 lati polygon con angoli a 45° + spessore TK_FRAME pieno + ombra leggera.
                                      const x1 = el.x, x2 = el.x + el.w, y1 = el.y, y2 = el.y + el.h;
                                      const T = TK_FRAME;
                                      // Polygon esterno (path completo del telaio chiuso con spessore)
                                      // Esterno: x1,y1 → x2,y1 → x2,y2 → x1,y2
                                      // Interno: x1+T,y1+T → x2-T,y1+T → x2-T,y2-T → x1+T,y2-T
                                      const outerPts = `${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2}`;
                                      const innerPts = `${x1+T},${y1+T} ${x1+T},${y2-T} ${x2-T},${y2-T} ${x2-T},${y1+T}`;
                                      const fillC = "#f0efe8";
                                      const strokeC = sel ? "#1A9E73" : "#3A3A3C";
                                      return (
                                        <g key={el.id} {...dp} style={drawMode ? { pointerEvents: "none" } : undefined}>
                                          {/* Bordo esterno con riempimento */}
                                          <path d={`M${outerPts}Z M${innerPts}Z`} fillRule="evenodd" fill={fillC} stroke={strokeC} strokeWidth={sel ? 1.2 : 0.7} strokeLinejoin="miter" />
                                          {/* Ombra interna sottile per profondità */}
                                          <polygon points={innerPts} fill="none" stroke="#00000020" strokeWidth={0.4} />
                                          {/* Selezione angoli */}
                                          {sel && [[x1,y1],[x2,y1],[x1,y2],[x2,y2]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill="#1A9E73" />)}
                                        </g>
                                      );
                                    }

                                    // ═══ MONTANTE — render semplice, freeLine non si estende verso di lui ═══
                                    if (el.type === "montante") {
                                      let my1raw = el.y1 !== undefined ? el.y1 : (frame ? frame.y : fY);
                                      let my2raw = el.y2 !== undefined ? el.y2 : (frame ? frame.y + frame.h : fY + fH);
                                      // Mont.Lib.: forza SEMPRE top e bot al telaio (passa a fianco di zoccoli/altro).
                                      if (el._libero) {
                                        const frameLines = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                                        if (frameLines.length > 0) {
                                          let frameTop = Infinity, frameBot = -Infinity;
                                          frameLines.forEach((l: any) => {
                                            frameTop = Math.min(frameTop, l.y1, l.y2);
                                            frameBot = Math.max(frameBot, l.y1, l.y2);
                                          });
                                          // FORZATURA: la cima va al bordo interno top, la base scende fino a frameBot - TK_FRAME + 12,
                                          // a prescindere dal punto cliccato (così passa a fianco dello zoccolo).
                                          my1raw = frameTop + TK_FRAME;
                                          my2raw = frameBot - TK_FRAME + 12;
                                        }
                                      }
                                      // Aggancio zoccolo: cerca SOLO freeLine subType=zoccolo (vecchio sistema, fonde sopra).
                                      // Lo zoccoloLibero è separato: il montante NON si ferma su di lui, gli passa a fianco e va fino al bordo telaio.
                                      const zoccoloEl = els.find((e: any) => e.type === "freeLine" && e.subType === "zoccolo" &&
                                        Math.max(e.x1, e.x2) >= el.x - TK_MONT && Math.min(e.x1, e.x2) <= el.x + TK_MONT);
                                      let my2 = my2raw;
                                      if (zoccoloEl) my2 = zoccoloEl.y1 + TK_FRAME;
                                      const HM2 = TK_MONT / 2;
                                      const mX1 = el.x - HM2, mX2 = el.x + HM2;
                                      // Calcola tagli 45° agli angoli
                                      const mCorners = el.corners || [];
                                      // Costruisci polygon con tagli 45° dove richiesto
                                      const buildMontPoly = () => {
                                        // Angoli: TL, TR, BR, BL
                                        let pts = [[mX1,my1raw],[mX2,my1raw],[mX2,my2],[mX1,my2]];
                                        mCorners.forEach(c => {
                                          const cut = HM2; // dimensione taglio = mezza larghezza
                                          if (Math.abs(c.cy - my1raw) < 8) {
                                            // Angolo top
                                            if (Math.abs(c.cx - mX1) < 8) pts = [[mX1+cut,my1raw],[mX2,my1raw],[mX2,my2],[mX1,my2],[mX1,my1raw+cut]];
                                            else pts = [[mX1,my1raw],[mX2-cut,my1raw],[mX2,my1raw+cut],[mX2,my2],[mX1,my2]];
                                          } else if (Math.abs(c.cy - my2) < 8) {
                                            // Angolo bottom
                                            if (Math.abs(c.cx - mX1) < 8) pts = [[mX1,my1raw],[mX2,my1raw],[mX2,my2],[mX1+cut,my2],[mX1,my2-cut]];
                                            else pts = [[mX1,my1raw],[mX2,my1raw],[mX2,my2-cut],[mX2-cut,my2],[mX1,my2]];
                                          } else {
                                            // Angolo intermedio (intersezione con profilo orizzontale)
                                            const isRight = c.cx > el.x;
                                            if (isRight) {
                                              // Taglia angolo in basso-destra e alto-destra
                                              pts = pts.map(p => p);
                                            }
                                          }
                                        });
                                        return pts.map(p => p.join(",")).join(" ");
                                      };
                                      const hasCuts = mCorners.length > 0;
                                      const fillC = sel ? "#1A9E7318" : "#e8e8e4";
                                      const strokeC = sel ? "#1A9E73" : "#3A3A3C";
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ew-resize" }}>
                                          {hasCuts
                                            ? <polygon points={buildMontPoly()} fill={fillC} stroke={strokeC} strokeWidth={sel ? 1.5 : 0.8} />
                                            : <rect x={mX1} y={my1raw} width={TK_MONT} height={my2 - my1raw} fill={fillC} stroke={strokeC} strokeWidth={sel ? 1.5 : 0.8} />
                                          }
                                          {sel && <><circle cx={el.x} cy={my1raw} r={4} fill="#1A9E73"/><circle cx={el.x} cy={my2} r={4} fill="#1A9E73"/></>}
                                          {/* Marker angoli */}
                                          {mCorners.map((c,ci) => (
                                            <circle key={ci} cx={c.cx} cy={c.cy} r={3} fill="#D08008" opacity={0.6} />
                                          ))}
                                          {/* Badge ARTICOLO */}
                                          {(() => {
                                            const hasC = !!el.profilo_codice;
                                            const cy = (my1raw + my2) / 2;
                                            const handleArt = (e3: any) => {
                                              e3.stopPropagation();
                                              if (drawMode) return;
                                              setProfiloTargetEl({ id: el.id, ruolo: "montante" });
                                              setShowSelettoreProfilo(true);
                                            };
                                            return (
                                              <g onClick={handleArt} onTouchEnd={handleArt} style={{ cursor: "pointer" }}>
                                                <rect x={el.x + TK_MONT/2 + 4} y={cy - 6} width={hasC ? 44 : 28} height={12} rx={3}
                                                  fill={hasC ? "#3B7FE0" : "#fff"} stroke="#3B7FE0" strokeWidth={0.8} opacity={0.92} strokeDasharray={hasC ? "0" : "2,2"} />
                                                <text x={el.x + TK_MONT/2 + 4 + (hasC ? 22 : 14)} y={cy + 3} textAnchor="middle" fontSize={6} fontWeight={800}
                                                  fill={hasC ? "#fff" : "#3B7FE0"} fontFamily="monospace">
                                                  {hasC ? el.profilo_codice : "+ ART"}
                                                </text>
                                              </g>
                                            );
                                          })()}
                                        </g>
                                      );
                                    }

                                    // ═══ TRAVERSO — tagliato ai montanti, esteso ai profili verticali adiacenti ═══
                                    if (el.type === "traverso") {
                                      const tx1raw = el.x1 !== undefined ? el.x1 : (frame ? frame.x : fX);
                                      const tx2raw = el.x2 !== undefined ? el.x2 : (frame ? frame.x + frame.w : fX + fW);
                                      const HM2 = TK_MONT / 2;
                                      const tkMapLocal: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP };
                                      const ETOL = 30;
                                      const vertLines = els.filter(e => e.type === "freeLine" && e.x1 !== undefined);
                                      let extL = 0, extR = 0;
                                      vertLines.forEach(l => {
                                        const lHalfT = tkMapLocal[l.subType] || TK_FRAME;
                                        const isVert = Math.abs(l.x2 - l.x1) < Math.abs(l.y2 - l.y1) + 1;
                                        if (!isVert) return;
                                        const lX = (l.x1 + l.x2) / 2;
                                        const dL = Math.abs(lX - tx1raw);
                                        if (dL < ETOL) extL = Math.max(extL, lHalfT - (tx1raw - lX));
                                        const dR = Math.abs(lX - tx2raw);
                                        if (dR < ETOL) extR = Math.max(extR, lHalfT - (lX - tx2raw));
                                      });
                                      const tx1 = tx1raw - Math.max(0, extL);
                                      const tx2 = tx2raw + Math.max(0, extR);
                                      // Taglia il traverso ai montanti che lo attraversano
                                      const intersectingMonts = allMontanti.filter(m => {
                                        const mx1 = m.x - HM2, mx2 = m.x + HM2;
                                        const mmy1 = m.y1 ?? (frame ? frame.y : fY);
                                        const mmy2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                        return mx1 > tx1 + 2 && mx2 < tx2 - 2 && mmy1 <= el.y + HM2 && mmy2 >= el.y - HM2;
                                      });
                                      const segments: {x1:number,x2:number}[] = [];
                                      let cur = tx1;
                                      const cuts = intersectingMonts.map(m => ({ x1: m.x - HM2, x2: m.x + HM2 })).sort((a,b) => a.x1 - b.x1);
                                      cuts.forEach(cut => { if (cur < cut.x1) segments.push({ x1: cur, x2: cut.x1 }); cur = cut.x2; });
                                      if (cur < tx2) segments.push({ x1: cur, x2: tx2 });
                                      if (segments.length === 0) segments.push({ x1: tx1, x2: tx2 });
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ns-resize" }}>
                                          {segments.map((seg, si) => (
                                            <rect key={si} x={seg.x1} y={el.y - HM2} width={seg.x2 - seg.x1} height={TK_MONT} fill={sel ? "#1A9E7318" : "#e8e8e4"} stroke={sel ? "#1A9E73" : "#3A3A3C"} strokeWidth={sel ? 1.5 : 0.8} />
                                          ))}
                                          {sel && <><circle cx={tx1raw} cy={el.y} r={4} fill="#1A9E73"/><circle cx={tx2raw} cy={el.y} r={4} fill="#1A9E73"/></>}
                                          {/* Badge ARTICOLO traverso */}
                                          {(() => {
                                            const hasC = !!el.profilo_codice;
                                            const cx = (tx1raw + tx2raw) / 2;
                                            const handleArt = (e3: any) => {
                                              e3.stopPropagation();
                                              if (drawMode) return;
                                              setProfiloTargetEl({ id: el.id, ruolo: "traverso" });
                                              setShowSelettoreProfilo(true);
                                            };
                                            return (
                                              <g onClick={handleArt} onTouchEnd={handleArt} style={{ cursor: "pointer" }}>
                                                <rect x={cx - (hasC ? 22 : 14)} y={el.y - HM2 - 16} width={hasC ? 44 : 28} height={12} rx={3}
                                                  fill={hasC ? "#3B7FE0" : "#fff"} stroke="#3B7FE0" strokeWidth={0.8} opacity={0.92} strokeDasharray={hasC ? "0" : "2,2"} />
                                                <text x={cx} y={el.y - HM2 - 7} textAnchor="middle" fontSize={6} fontWeight={800}
                                                  fill={hasC ? "#fff" : "#3B7FE0"} fontFamily="monospace">
                                                  {hasC ? el.profilo_codice : "+ ART"}
                                                </text>
                                              </g>
                                            );
                                          })()}
                                        </g>
                                      );
                                    }

                                    // ═══ ANTA — doppio rettangolo, clipped to polygon ═══
                                    if (el.type === "innerRect") {
                                      const hiddenSides = el.hiddenSides || [];
                                      const clrBase = hc || "#1A1A1C";
                                      const TK = el.subType === "porta" ? TK_PORTA : TK_ANTA;
                                      const acm = el.cornerModes || {};
                                      const mTL = acm.tl || '45';
                                      const mTR = acm.tr || '45';
                                      const mBR = acm.br || '45';
                                      const mBL = acm.bl || '45';
                                      // Per ogni angolo a 45°, i due lati che convergono si accorciano di TK creando un gap diagonale
                                      const cutTL = mTL === '45';
                                      const cutTR = mTR === '45';
                                      const cutBR = mBR === '45';
                                      const cutBL = mBL === '45';
                                      const hasAnySide = ["top","bot","left","right"].some(s => !hiddenSides.includes(s));
                                      const bgTop = hiddenSides.includes("top") ? el.y : el.y + TK;
                                      const bgBot = hiddenSides.includes("bot") ? el.y + el.h : el.y + el.h - TK;
                                      const bgLeft = hiddenSides.includes("left") ? el.x : el.x + TK;
                                      const bgRight = hiddenSides.includes("right") ? el.x + el.w : el.x + el.w - TK;
                                      const hidTop = hiddenSides.includes("top");
                                      const hidBot = hiddenSides.includes("bot");
                                      const hidLeft = hiddenSides.includes("left");
                                      const hidRight = hiddenSides.includes("right");
                                      // Top/Bot: si accorciano da sinistra se TL/BL a 45, da destra se TR/BR a 45
                                      const topXStart = el.x + (cutTL ? TK : 0);
                                      const topXEnd = el.x + el.w - (cutTR ? TK : 0);
                                      const botXStart = el.x + (cutBL ? TK : 0);
                                      const botXEnd = el.x + el.w - (cutBR ? TK : 0);
                                      // Left/Right: si accorciano da top se TL/TR a 45, da bot se BL/BR a 45
                                      const leftYStart = (hidTop ? el.y : el.y + TK) + (cutTL && !hidTop ? 0 : 0);
                                      const leftYEnd = (hidBot ? el.y + el.h : el.y + el.h - TK);
                                      const rightYStart = leftYStart;
                                      const rightYEnd = leftYEnd;
                                      const sideTypes = el.sideTypes || {};
                                      const sideShape = (side: string) => {
                                        if (hiddenSides.includes(side)) return null;
                                        const sideId = `${el.id}:${side}`;
                                        const isSelSide = selId === sideId;
                                        // Tipo del lato: anta (default) | zoccolo | soglia | fascia | profcomp
                                        const sideType = sideTypes[side] || 'anta';
                                        const fillBySide: any = { anta: "#e8e8e4", zoccolo: "#c8c6c0", soglia: "#d8d6d0", fascia: "#e8e4dc", profcomp: "#dcdad4" };
                                        const labelBySide: any = { zoccolo: "ZOCCOLO", soglia: "SOGLIA", fascia: "FASCIA", profcomp: "PROF.COMP." };
                                        const tkBySide: any = { anta: TK, zoccolo: TK_ZOCCOLO * 2, soglia: TK_SOGLIA * 2, fascia: TK_FASCIA * 2, profcomp: TK_PROFCOMP * 2 };
                                        const thisTK = tkBySide[sideType] || TK;
                                        const sideClr = isSelSide ? "#1A9E73" : clrBase;
                                        const sideFill = isSelSide ? "#1A9E7333" : (fillBySide[sideType] || "#e8e8e4");
                                        const sideSw = isSelSide ? 2 : 1;
                                        const sideLabel = labelBySide[sideType];
                                        let pts = "";
                                        let labelX = 0, labelY = 0;
                                        if (side === "top") {
                                          const xL = el.x, xR = el.x + el.w;
                                          const yT = el.y, yB = el.y + thisTK;
                                          const ixL = xL + (cutTL ? thisTK : 0);
                                          const ixR = xR - (cutTR ? thisTK : 0);
                                          pts = `${xL},${yT} ${xR},${yT} ${ixR},${yB} ${ixL},${yB}`;
                                          labelX = (xL + xR) / 2; labelY = (yT + yB) / 2 + 3;
                                        } else if (side === "bot") {
                                          const xL = el.x, xR = el.x + el.w;
                                          const yB = el.y + el.h;
                                          const yT = yB - thisTK;
                                          const ixL = xL + (cutBL ? thisTK : 0);
                                          const ixR = xR - (cutBR ? thisTK : 0);
                                          pts = `${ixL},${yT} ${ixR},${yT} ${xR},${yB} ${xL},${yB}`;
                                          labelX = (xL + xR) / 2; labelY = (yT + yB) / 2 + 3;
                                        } else if (side === "left") {
                                          const yT = el.y, yB = el.y + el.h;
                                          const xL = el.x, xR = el.x + thisTK;
                                          const iyT = yT + (cutTL ? thisTK : 0);
                                          const iyB = yB - (cutBL ? thisTK : 0);
                                          pts = `${xL},${yT} ${xR},${iyT} ${xR},${iyB} ${xL},${yB}`;
                                          labelX = (xL + xR) / 2; labelY = (yT + yB) / 2 + 3;
                                        } else if (side === "right") {
                                          const yT = el.y, yB = el.y + el.h;
                                          const xR = el.x + el.w;
                                          const xL = xR - thisTK;
                                          const iyT = yT + (cutTR ? thisTK : 0);
                                          const iyB = yB - (cutBR ? thisTK : 0);
                                          pts = `${xL},${iyT} ${xR},${yT} ${xR},${yB} ${xL},${iyB}`;
                                          labelX = (xL + xR) / 2; labelY = (yT + yB) / 2 + 3;
                                        }
                                        return (
                                          <g key={side}>
                                            <polygon points={pts} fill={sideFill} stroke={sideClr} strokeWidth={sideSw}
                                              onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: sideId }); }}
                                              style={{ cursor: drawMode ? undefined : "pointer" }}
                                            />
                                            {sideLabel && (side === 'top' || side === 'bot') && thisTK >= 8 && (
                                              <text x={labelX} y={labelY} textAnchor="middle" fontSize={6} fontWeight={800} fill="#555" pointerEvents="none">{sideLabel}</text>
                                            )}
                                          </g>
                                        );
                                      };
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined}>
                                          {hasAnySide && <rect x={bgLeft} y={bgTop} width={Math.max(0, bgRight - bgLeft)} height={Math.max(0, bgBot - bgTop)} fill="#f8f8f6" stroke="none" pointerEvents="none" />}
                                          {sideShape("top")}
                                          {sideShape("bot")}
                                          {sideShape("left")}
                                          {sideShape("right")}
                                          {el.subType === "porta" && <text x={el.x + el.w / 2} y={el.y + 12} textAnchor="middle" fontSize={7} fill="#555" fontWeight={700} pointerEvents="none">PORTA</text>}
                                          {/* Badge ARTICOLO ANTA */}
                                          {(() => {
                                            const hasC = !!el.profilo_codice;
                                            const cx = el.x + el.w / 2;
                                            const cy = el.y + el.h - 14;
                                            const handleArt = (e3: any) => {
                                              e3.stopPropagation();
                                              if (drawMode) return;
                                              const r = el.subType === "porta" ? "anta" : "anta";
                                              setProfiloTargetEl({ id: el.id, ruolo: r });
                                              setShowSelettoreProfilo(true);
                                            };
                                            return (
                                              <g onClick={handleArt} onTouchEnd={handleArt} style={{ cursor: "pointer" }}>
                                                <rect x={cx - (hasC ? 22 : 14)} y={cy - 6} width={hasC ? 44 : 28} height={12} rx={3}
                                                  fill={hasC ? "#3B7FE0" : "#fff"} stroke="#3B7FE0" strokeWidth={0.8} opacity={0.92} strokeDasharray={hasC ? "0" : "2,2"} />
                                                <text x={cx} y={cy + 3} textAnchor="middle" fontSize={6} fontWeight={800}
                                                  fill={hasC ? "#fff" : "#3B7FE0"} fontFamily="monospace">
                                                  {hasC ? el.profilo_codice : "+ ART ANTA"}
                                                </text>
                                              </g>
                                            );
                                          })()}
                                        </g>
                                      );
                                    }

                                    // ═══ PERSIANA — clipped to polygon ═══
                                    if (el.type === "persiana") {
                                      const slats = [];
                                      const gap = 8;
                                      const pk = 3;
                                      for (let sy = el.y + pk + gap; sy < el.y + el.h - pk; sy += gap) slats.push(sy);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#f5f0e8" stroke={hc || "#8a7a60"} strokeWidth={1} />
                                          <rect x={el.x + pk} y={el.y + pk} width={el.w - pk * 2} height={el.h - pk * 2} fill="none" stroke={hc || "#8a7a60"} strokeWidth={0.5} />
                                          {slats.map((sy2, si) => <line key={si} x1={el.x + pk + 1} y1={sy2} x2={el.x + el.w - pk - 1} y2={sy2} stroke={hc || "#a09080"} strokeWidth={0.8} />)}
                                          <text x={el.x + el.w / 2} y={el.y + 10} textAnchor="middle" fontSize={6} fill="#8a7a60" fontWeight={700}>PERSIANA</text>
                                        </g>
                                      );
                                    }

                                    // ═══ VETRO — clipped to polygon ═══
                                    if (el.type === "glass") return (
                                      <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#d8ecf8" fillOpacity={0.25} stroke={hc || "#8bb8e8"} strokeWidth={0.5} />
                                        <line x1={el.x} y1={el.y} x2={el.x + Math.min(el.w, el.h) * 0.3} y2={el.y + Math.min(el.w, el.h) * 0.3} stroke="#b0d4f0" strokeWidth={0.5} />
                                      </g>
                                    );

                                    // ═══ POLYGON ANTA — follows actual shape ═══
                                    if (el.type === "polyAnta" && el.poly) {
                                      const pts = el.poly;
                                      const tk = el.subType === "porta" ? 4 : 3;
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      const apAllX = pts.map(p => p[0]);
                                      const apAllY = pts.map(p => p[1]);
                                      const apMinX = Math.min(...apAllX), apMaxX = Math.max(...apAllX);
                                      const apMinY = Math.min(...apAllY), apMaxY = Math.max(...apAllY);
                                      // 4 angoli base (TL, TR, BR, BL) — coordinate inset di tk
                                      const ix1 = apMinX + tk, ix2 = apMaxX - tk;
                                      const iy1 = apMinY + tk, iy2 = apMaxY - tk;
                                      // cornerModes anta: default 45 su tutti
                                      const acm = el.cornerModes || {};
                                      const mTL = acm.tl || '45';
                                      const mTR = acm.tr || '45';
                                      const mBR = acm.br || '45';
                                      const mBL = acm.bl || '45';
                                      // Costruisco inner polygon: per ogni angolo decido se è 1 punto (no taglio) o 2 punti (taglio 45)
                                      // Step 45 = arretramento dall'angolo lungo i due lati
                                      const cut = tk * 1.5;
                                      const innerPoly: number[][] = [];
                                      // TL
                                      if (mTL === '45') { innerPoly.push([ix1+cut, iy1]); innerPoly.push([ix1, iy1+cut]); }
                                      else { innerPoly.push([ix1, iy1]); }
                                      // BL (going CCW: TL -> BL on left edge)
                                      // riordino: TL -> TR -> BR -> BL (CW)
                                      // Riazzero e rifaccio in ordine CW
                                      innerPoly.length = 0;
                                      // TL corner
                                      if (mTL === '45') { innerPoly.push([ix1+cut, iy1], [ix1, iy1+cut]); }
                                      else { innerPoly.push([ix1, iy1]); }
                                      // BL corner
                                      if (mBL === '45') { innerPoly.push([ix1, iy2-cut], [ix1+cut, iy2]); }
                                      else { innerPoly.push([ix1, iy2]); }
                                      // BR corner
                                      if (mBR === '45') { innerPoly.push([ix2-cut, iy2], [ix2, iy2-cut]); }
                                      else { innerPoly.push([ix2, iy2]); }
                                      // TR corner
                                      if (mTR === '45') { innerPoly.push([ix2, iy1+cut], [ix2-cut, iy1]); }
                                      else { innerPoly.push([ix2, iy1]); }
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const innerStr = innerPoly.map(p => p.join(",")).join(" ");
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <polygon points={outerPts} fill="#f8f8f6" fillOpacity={0.3} stroke={hc || "#777"} strokeWidth={1} />
                                          <polygon points={innerStr} fill="none" stroke={hc || "#777"} strokeWidth={0.6} />
                                          {el.subType === "porta" && <text x={cx2} y={cy2} textAnchor="middle" fontSize={8} fill="#555" fontWeight={700}>PORTA</text>}
                                        </g>
                                      );
                                    }

                                    // ═══ POLYGON VETRO — glass following shape ═══
                                    if (el.type === "polyGlass" && el.poly) {
                                      const pts = el.poly;
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const shrink = TK_ANTA + 2;
                                      const glassPts = pts.map(p => {
                                        const dx2 = cx2 - p[0], dy2 = cy2 - p[1];
                                        const dist = Math.hypot(dx2, dy2) || 1;
                                        return [(p[0] + dx2 / dist * shrink), (p[1] + dy2 / dist * shrink)];
                                      });
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <polygon points={glassPts.map(p => p.join(",")).join(" ")} fill="#d8ecf8" fillOpacity={0.25} stroke={hc || "#8bb8e8"} strokeWidth={0.5} />
                                          <line x1={glassPts[0][0]} y1={glassPts[0][1]} x2={cx2} y2={cy2} stroke="#b0d4f0" strokeWidth={0.4} />
                                        </g>
                                      );
                                    }

                                    // ═══ POLYGON PERSIANA — slats following shape ═══
                                    if (el.type === "polyPersiana" && el.poly) {
                                      const pts = el.poly;
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      const allY2 = pts.map(p => p[1]);
                                      const minY2 = Math.min(...allY2), maxY2 = Math.max(...allY2);
                                      const allX2 = pts.map(p => p[0]);
                                      const minX2 = Math.min(...allX2), maxX2 = Math.max(...allX2);
                                      const clipId = `pers-${el.id}`;
                                      const slats = [];
                                      for (let sy = minY2 + 10; sy < maxY2 - 4; sy += 8) slats.push(sy);
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <defs><clipPath id={clipId}><polygon points={outerPts} /></clipPath></defs>
                                          <polygon points={outerPts} fill="#f5f0e8" stroke={hc || "#8a7a60"} strokeWidth={1} />
                                          <g clipPath={`url(#${clipId})`}>
                                            {slats.map((sy, si) => <line key={si} x1={minX2 + 4} y1={sy} x2={maxX2 - 4} y2={sy} stroke="#a09080" strokeWidth={0.8} />)}
                                          </g>
                                        </g>
                                      );
                                    }

                                    if (el.type === "circle") return (
                                      <g key={el.id} {...dp}>
                                        <circle cx={el.cx} cy={el.cy} r={el.r} fill="#e8f4fc" fillOpacity={0.2} stroke={hc || "#4a90d9"} strokeWidth={sel ? 2.5 : 1.5} />
                                        {sel && [[el.cx,el.cy-el.r],[el.cx+el.r,el.cy],[el.cx,el.cy+el.r],[el.cx-el.r,el.cy]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={"#1A9E73"} />)}
                                      </g>
                                    );

                                    // ═══ TEXT LABEL — draggable, editable on double-click ═══
                                    if (el.type === "label") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                        {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})}
                                        onDoubleClick={() => {
                                          const newTxt = prompt("Modifica testo:", el.text);
                                          if (newTxt !== null) setDW(els.map(x => x.id === el.id ? { ...x, text: newTxt } : x));
                                        }}
                                        style={{ cursor: drawMode ? undefined : "move" }}>
                                        {sel && <rect x={el.x - 4} y={el.y - (el.fontSize || 11) - 2} width={Math.max(40, (el.text || "").length * 6)} height={(el.fontSize || 11) + 8} fill={`${"#1A9E73"}10`} stroke={"#1A9E73"} strokeWidth={1} strokeDasharray="3,2" rx={3} />}
                                        <text x={el.x} y={el.y} fontSize={el.fontSize || 11} fontWeight={700} fill={hc || "#333"} fontFamily="Inter, sans-serif">{el.text}</text>
                                      </g>
                                    );

                                    if (el.type === "freeLine") {
                                      // (Nessun aggancio Mont.Lib. → zoccoloLibero: il montante va a fianco dello zoccolo, non sopra.)
                                      const dx2 = el.x2 - el.x1, dy2 = el.y2 - el.y1;
                                      const len = Math.hypot(dx2, dy2) || 1;
                                      const subType = el.subType || null;
                                      const tkMap: any = { soglia: TK_SOGLIA, zoccolo: TK_ZOCCOLO, fascia: TK_FASCIA, profcomp: TK_PROFCOMP, montante: TK_MONT, traverso: TK_MONT, soglia_rib: TK_SOGLIA };
                                      const halfT = subType ? (tkMap[subType] || TK_FRAME) : TK_FRAME;
                                      const fillMap: any = { soglia: "#d8d6d0", zoccolo: "#c8c6c0", fascia: "#e8e4dc", profcomp: "#dcdad4", montante: "#e4e2d8", traverso: "#e4e2d8", soglia_rib: "#c0beb8" };
                                      const fillC = subType ? (fillMap[subType] || "#f0efe8") : "#f0efe8";
                                      const labelMap: any = { soglia: "SOGLIA", zoccolo: "ZOCCOLO", fascia: "FASCIA", profcomp: "PROF.COMP.", montante: "MONTANTE", traverso: "TRAVERSO", soglia_rib: "SOGLIA RIB." };
                                      const labelTxt = subType ? (labelMap[subType] !== undefined ? labelMap[subType] : subType.toUpperCase()) : null;
                                      const refLen = frame ? Math.max(frame.w, frame.h) : Math.max(fW, fH);
                                      const refReal = frame ? (frame.w >= frame.h ? realW : realH) : Math.max(realW, realH);
                                      const mmLen = el._mmOverride != null ? el._mmOverride : Math.round(len / refLen * refReal);
                                      const isPartOfPoly = poly && poly.length >= 3;
                                      // ── Determina se la linea è orizzontale o verticale ──
                                      const isHorzLine = Math.abs(dy2) <= Math.abs(dx2) + 0.5;
                                      // ── SubType con spessore fisso: usa RECT agganciato al frame (come il telaio) ──
                                      // ── Tutte le freeLine usano logica polygon con spessore halfT ──
                                      const ux = dx2 / len, uy = dy2 / len;
                                      const nx = -uy * halfT, ny = ux * halfT;
                                      const midX = (el.x1 + el.x2) / 2, midY = (el.y1 + el.y2) / 2;
                                      const ang = Math.atan2(dy2, dx2) * 180 / Math.PI;
                                      const lx = midX + nx * 2, ly = midY + ny * 2;
                                      const lxN = midX - nx * (halfT + 8), lyN = midY - ny * (halfT + 8);
                                      const WCONN = halfT * 2 + TK_MONT;
                                      const HM_loc = TK_MONT / 2;
                                      const hasMontAt1 = els.some(m => m.type === "montante" && Math.abs(m.x - el.x1) < WCONN && ((m.y1 ?? fY) <= el.y1 + WCONN) && ((m.y2 ?? fY+fH) >= el.y1 - WCONN));
                                      const hasMontAt2 = els.some(m => m.type === "montante" && Math.abs(m.x - el.x2) < WCONN && ((m.y1 ?? fY) <= el.y2 + WCONN) && ((m.y2 ?? fY+fH) >= el.y2 - WCONN));
                                      // Per freeLine orizzontali con subType: considera anche le freeLine verticali del Tel.Lib.
                                      const isHorzEl = subType && Math.abs(dy2) <= Math.abs(dx2) + 0.5;
                                      const hasVertAt1 = isHorzEl && els.some(v => v.type === "freeLine" && !v.subType && Math.abs(v.x2-v.x1) < Math.abs(v.y2-v.y1)+1 && Math.abs((v.x1+v.x2)/2 - el.x1) < WCONN);
                                      const hasVertAt2 = isHorzEl && els.some(v => v.type === "freeLine" && !v.subType && Math.abs(v.x2-v.x1) < Math.abs(v.y2-v.y1)+1 && Math.abs((v.x1+v.x2)/2 - el.x2) < WCONN);
                                      
                                      // ext1: si estende verso montante sx (SVG) = dx utente
                                      // ext2: si ferma su el.x2, non esce
                                      const _autoExt1 = (hasMontAt1 || hasVertAt1) ? -TK_MONT : halfT;
                                      const _autoExt2 = (hasMontAt2 || hasVertAt2) ? -HM_loc : halfT;
                                      const _cm = el.cornerModes || {};
                                      // Se subType è un complemento (soglia/soglia_rib/zoccolo/fascia/profcomp), il pezzo è ISOLATO:
                                      // niente estensione automatica verso vertici, niente offset Y al frame.
                                      const isComplemento = subType && ["soglia","soglia_rib","zoccolo","fascia","profcomp"].includes(subType);
                                      const _resolveE = (m: any, autoVal: number) => {
                                        if (m === 'V') return halfT;
                                        if (m === 'H') return -TK_MONT;
                                        if (m === '45') return halfT;
                                        return autoVal;
                                      };
                                      const ext1 = isComplemento ? halfT : _resolveE(_cm.start, _autoExt1);
                                      const ext2 = isComplemento ? halfT : _resolveE(_cm.end, _autoExt2);
                                      let ex1 = el.x1 - ux * ext1, ey1 = el.y1 - uy * ext1;
                                      let ex2 = el.x2 + ux * ext2, ey2 = el.y2 + uy * ext2;
                                      // Per orizzontali: bordo basso polygon = el.y1
                                      // Solo per profili "ancorati" (montante/traverso) non per complementi isolati
                                      if (isHorzEl && !isPartOfPoly && !isComplemento) {
                                        ey1 = el.y1 - halfT + TK_FRAME;
                                        ey2 = el.y2 - halfT + TK_FRAME;
                                      }
                                      // Taglio 45° sul profilo: usa cornerModes esplicito (non tocca el.corners legacy)
                                      const cut45Start = _cm.start === '45';
                                      const cut45End = _cm.end === '45';
                                      const flCorners = (cut45Start || cut45End) ? [] : (el.corners || []);
                                      // Per giunto 45° pulito: il lato ESTERNO (verso angolo telaio) ha lunghezza piena,
                                      // il lato INTERNO è accorciato di halfT*2 lato per ogni estremo a 45.
                                      // Identifico l'esterno via baricentro delle altre freeLine telaio.
                                      const elsAll2 = els || [];
                                      const otherFL2 = elsAll2.filter((o: any) => o.type === "freeLine" && !o.subType && o.id !== el.id);
                                      let bcX = 0, bcY = 0, bcN = 0;
                                      otherFL2.forEach((o: any) => { bcX += (o.x1+o.x2)/2; bcY += (o.y1+o.y2)/2; bcN++; });
                                      if (bcN > 0) { bcX /= bcN; bcY /= bcN; } else { bcX = midX; bcY = midY; }
                                      const dotN2 = (bcX - midX) * nx + (bcY - midY) * ny;
                                      const innerSign = dotN2 >= 0 ? 1 : -1;
                                      const outerSign = -innerSign;
                                      const buildPts45 = () => {
                                        const back = halfT * 2;
                                        // Outer edge: punti pieni ex1, ex2 (estesi normalmente)
                                        const outStart: number[] = [ex1 + nx * outerSign, ey1 + ny * outerSign];
                                        const outEnd: number[] = [ex2 + nx * outerSign, ey2 + ny * outerSign];
                                        // Inner edge: arretrato lungo la direzione se l'estremo è a 45
                                        const inStartShift = cut45Start ? back : 0;
                                        const inEndShift = cut45End ? back : 0;
                                        const inStart: number[] = [ex1 + ux * inStartShift + nx * innerSign, ey1 + uy * inStartShift + ny * innerSign];
                                        const inEnd: number[] = [ex2 - ux * inEndShift + nx * innerSign, ey2 - uy * inEndShift + ny * innerSign];
                                        // Ordine: out_start -> out_end -> in_end -> in_start
                                        return [outStart, outEnd, inEnd, inStart];
                                      };
                                      const buildFreePoly = () => {
                                        // pts4 base: TL, TR, BR, BL (top=ey+ny, bot=ey-ny)
                                        let p = [
                                          [ex1+nx, ey1+ny], [ex2+nx, ey2+ny],
                                          [ex2-nx, ey2-ny], [ex1-nx, ey1-ny]
                                        ];
                                        flCorners.forEach(c => {
                                          // Per orizzontale: cx = x del taglio, cy ~ ey
                                          // Lato sinistro = ex1, lato destro = ex2
                                          const cut = halfT; // dimensione taglio diagonale
                                          const isLeft = Math.abs(c.cx - ex1) < halfT * 3;
                                          const isRight = Math.abs(c.cx - ex2) < halfT * 3;
                                          if (isLeft) {
                                            // Taglia angolo TL e BL
                                            p = [[ex1+cut+nx, ey1+ny],[ex2+nx, ey2+ny],[ex2-nx, ey2-ny],[ex1+cut-nx, ey1-ny],[ex1-nx, ey1-ny+cut],[ex1+nx, ey1+ny-cut]];
                                          } else if (isRight) {
                                            // Taglia angolo TR e BR
                                            p = [[ex1+nx, ey1+ny],[ex2-cut+nx, ey2+ny],[ex2+nx, ey2+ny-cut],[ex2-nx, ey2-ny+cut],[ex2-cut-nx, ey2-ny],[ex1-nx, ey1-ny]];
                                          }
                                        });
                                        return p.map(pt => pt.join(",")).join(" ");
                                      };
                                      const has45 = cut45Start || cut45End;
                                      const pts4 = has45
                                        ? buildPts45().map(pt => pt.join(",")).join(" ")
                                        : (flCorners.length > 0 ? buildFreePoly() : `${ex1+nx},${ey1+ny} ${ex2+nx},${ey2+ny} ${ex2-nx},${ey2-ny} ${ex1-nx},${ey1-ny}`);
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id) } : {})}>
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="transparent" strokeWidth={Math.max(14, halfT * 3)} />
                                          {!isPartOfPoly && <>
                                            <polygon points={pts4} fill={sel ? "#1A9E7318" : fillC} stroke="none" />
                                            <polygon points={pts4} fill="none" stroke={sel ? "#1A9E73" : "#3A3A3C"} strokeWidth={sel ? 1.5 : 0.7} strokeLinejoin="miter" strokeMiterlimit={20} />
                                          </>}
                                          {sel && <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#1A9E73" strokeWidth={2} opacity={0.3} />}
                                          {labelTxt && (
                                            <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${lxN}, ${lyN})`}>
                                              <rect x={lxN - labelTxt.length*3.5} y={lyN - 7} width={labelTxt.length*7+4} height={13} fill="#1A1A1C" rx={3} opacity={0.85} />
                                              <text x={lxN} y={lyN + 3} textAnchor="middle" fontSize={7} fontWeight={800} fill="#fff" fontFamily="monospace">{labelTxt}</text>
                                            </g>
                                          )}
                                          {/* Badge ARTICOLO PROFILO — cliccabile per assegnare/cambiare codice articolo */}
                                          {(() => {
                                            const ruoloMap: any = { soglia: "soglia", soglia_rib: "soglia", zoccolo: "zoccolo", fascia: "fascia", profcomp: "profcomp", montante: "montante", traverso: "traverso" };
                                            const ruolo = subType ? (ruoloMap[subType] || subType) : "telaio";
                                            const hasCodice = !!el.profilo_codice;
                                            const handleClickArt = (e3: any) => {
                                              e3.stopPropagation();
                                              if (drawMode) return;
                                              setProfiloTargetEl({ id: el.id, ruolo });
                                              setShowSelettoreProfilo(true);
                                            };
                                            // Posiziona il badge sull'altro lato (lx + nx*4 invece che lx - nx*8)
                                            const ax = midX + nx * 4, ay2 = midY + ny * 4;
                                            return (
                                              <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${ax}, ${ay2})`}
                                                onClick={handleClickArt} onTouchEnd={handleClickArt}
                                                style={{ cursor: "pointer", touchAction: "manipulation" }}>
                                                <rect x={ax - (hasCodice ? 22 : 14)} y={ay2 - 6} width={hasCodice ? 44 : 28} height={12} rx={3}
                                                  fill={hasCodice ? "#3B7FE0" : "#fff"}
                                                  stroke={hasCodice ? "#3B7FE0" : "#3B7FE0"} strokeWidth={0.8} opacity={0.92} strokeDasharray={hasCodice ? "0" : "2,2"} />
                                                <text x={ax} y={ay2 + 3} textAnchor="middle" fontSize={6} fontWeight={800}
                                                  fill={hasCodice ? "#fff" : "#3B7FE0"} fontFamily="monospace">
                                                  {hasCodice ? el.profilo_codice : "+ ART"}
                                                </text>
                                              </g>
                                            );
                                          })()}
                                          <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${lx}, ${ly})`}
                                            onClick={(e3) => { e3.stopPropagation(); if (drawMode) return; const svgEl = e3.currentTarget.closest("svg"); const r = svgEl?.getBoundingClientRect(); setDimEdit({ id: el.id, val: String(mmLen), curMM: mmLen, lenPx: len, x: r ? r.left + r.width / 2 : 200, y: r ? r.top + 80 : 80 }); }}
                                            style={{ cursor: "pointer" }}>
                                            <rect x={lx - 18} y={ly - 7} width={36} height={14} fill={dimEdit?.id === el.id ? "#1A9E73" : "#fff"} rx={3} stroke={dimEdit?.id === el.id ? "#1A9E73" : T.acc} strokeWidth={dimEdit?.id === el.id ? 1.5 : 0.6} opacity={0.9} />
                                            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={dimEdit?.id === el.id ? "#fff" : T.acc} fontFamily="monospace">{mmLen}</text>
                                          </g>
                                          {sel && <><circle cx={el.x1} cy={el.y1} r={5} fill="#1A9E73" /><circle cx={el.x2} cy={el.y2} r={5} fill="#1A9E73" /></>}
                                        </g>
                                      );
                                    }

                                    if (el.type === "apLine") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={hc || T.blue} strokeWidth={sel ? 3 : 2} strokeDasharray={el.dash ? "6,4" : "none"} />
                                        <circle cx={el.x1} cy={el.y1} r={sel ? 5 : 3} fill={hc || T.blue} />
                                        <circle cx={el.x2} cy={el.y2} r={sel ? 5 : 3} fill={hc || T.blue} />
                                      </g>
                                    );

                                    if (el.type === "apLabel") {
                                      const tw = String(el.label).length * 7 + 14;
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x - tw / 2} y={el.y - 8} width={tw} height={16} fill={hc || T.blue} rx={3} fillOpacity={0.85} />
                                          <text x={el.x} y={el.y + 4} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff">{el.label}</text>
                                        </g>
                                      );
                                    }

                                    if (el.type === "dim") {
                                      const isH = Math.abs(el.y1 - el.y2) < 2;
                                      const mx2 = (el.x1 + el.x2) / 2, my2 = (el.y1 + el.y2) / 2;
                                      const labelStr = String(el.label);
                                      // Inverse zoom: tutti gli elementi UI delle quote restano leggibili
                                      const iz = 1 / zoom;
                                      const fs = 8 * iz;
                                      const tw = (labelStr.length * 5.5 + 10) * iz;
                                      const th = 13 * iz;
                                      const DIM_C = "#1A1A1C";
                                      const tickL = 4 * iz;
                                      const sw = 0.5 * iz, sw2 = 0.7 * iz;
                                      return (
                                        <g key={el.id} onClick={(e3) => {
                                          e3.stopPropagation();
                                          if (drawMode) return;
                                          setDimEdit({ id: el.id, val: el.label, x: 0, y: 0, isDim: true });
                                        }} style={{ cursor: "pointer" }}>
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={DIM_C} strokeWidth={sw} />
                                          {isH ? <>
                                            <line x1={el.x1-tickL} y1={el.y1-tickL} x2={el.x1+tickL} y2={el.y1+tickL} stroke={DIM_C} strokeWidth={sw2}/>
                                            <line x1={el.x2-tickL} y1={el.y2-tickL} x2={el.x2+tickL} y2={el.y2+tickL} stroke={DIM_C} strokeWidth={sw2}/>
                                          </> : <>
                                            <line x1={el.x1-tickL} y1={el.y1-tickL} x2={el.x1+tickL} y2={el.y1+tickL} stroke={DIM_C} strokeWidth={sw2}/>
                                            <line x1={el.x2-tickL} y1={el.y2-tickL} x2={el.x2+tickL} y2={el.y2+tickL} stroke={DIM_C} strokeWidth={sw2}/>
                                          </>}
                                          <rect x={mx2-tw/2} y={my2-th/2} width={tw} height={th} fill={dimEdit?.id === el.id ? "#1A9E73" : "#fff"} rx={2*iz} stroke={dimEdit?.id === el.id ? "#1A9E73" : DIM_C} strokeWidth={0.4*iz} opacity={0.95}/>
                                          <text x={mx2} y={my2+fs/3} textAnchor="middle" fontSize={fs} fontWeight={700} fill={dimEdit?.id === el.id ? "#fff" : DIM_C} fontFamily="'SF Mono', 'Menlo', monospace" letterSpacing="0.3">{labelStr}</text>
                                        </g>
                                      );
                                    }
                                    if (el.type === "penPath") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <path d={el.d} fill="none" stroke={sel ? "#1A9E73" : "#1A1A1C"} strokeWidth={sel ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
                                        {sel && <path d={el.d} fill="none" stroke={"#1A9E73"} strokeWidth={8} opacity={0.12} strokeLinecap="round" />}
                                      </g>
                                    );

                                    if (el.type === "righello") {
                                      const dx2r = el.x2 - el.x1, dy2r = el.y2 - el.y1;
                                      const lenR = Math.hypot(dx2r, dy2r) || 1;
                                      const angR = Math.atan2(dy2r, dx2r) * 180 / Math.PI;
                                      const midXR = (el.x1 + el.x2) / 2, midYR = (el.y1 + el.y2) / 2;
                                      // Vettore normale (perpendicolare alla linea)
                                      const nxR = -dy2r / lenR, nyR = dx2r / lenR;
                                      // Offset per le tacche (8px)
                                      const tackOff = 9;
                                      // Direzione lungo linea
                                      const ux = dx2r / lenR, uy = dy2r / lenR;
                                      const BLUE = T.blue || "#3B7FE0";
                                      const SEL_COLOR = sel ? "#1A9E73" : BLUE;
                                      const handleEdit = (e3: any) => {
                                        e3?.stopPropagation?.();
                                        const cur = parseInt(el.label) || 0;
                                        const inp = prompt("Misura righello (mm):", String(cur));
                                        if (!inp) return;
                                        const newLen = parseInt(inp.trim());
                                        if (isNaN(newLen) || newLen < 1) return;
                                        // Aggiorna solo il label (la lunghezza pixel non cambia, è una misura riferita)
                                        const newEls = els.map(e => e.id === el.id ? { ...e, label: String(newLen), labelOverride: true } : e);
                                        setDW(newEls);
                                      };
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                          {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "move" }}>
                                          {/* Linea PRINCIPALE (più spessa) */}
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={SEL_COLOR} strokeWidth={2} opacity={0.95} />
                                          {/* Linea tratteggiata sottile sopra (effetto quotatura tecnica) */}
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#fff" strokeWidth={0.6} strokeDasharray="3,3" opacity={0.6} />
                                          {/* FRECCE alle estremità (tipo quotatura tecnica) */}
                                          <polygon points={`${el.x1},${el.y1} ${el.x1 + ux*8 + nxR*3},${el.y1 + uy*8 + nyR*3} ${el.x1 + ux*8 - nxR*3},${el.y1 + uy*8 - nyR*3}`} fill={SEL_COLOR} />
                                          <polygon points={`${el.x2},${el.y2} ${el.x2 - ux*8 + nxR*3},${el.y2 - uy*8 + nyR*3} ${el.x2 - ux*8 - nxR*3},${el.y2 - uy*8 - nyR*3}`} fill={SEL_COLOR} />
                                          {/* Tacche perpendicolari estremità (più grandi) */}
                                          <line x1={el.x1+nxR*tackOff} y1={el.y1+nyR*tackOff} x2={el.x1-nxR*tackOff} y2={el.y1-nyR*tackOff} stroke={SEL_COLOR} strokeWidth={2} />
                                          <line x1={el.x2+nxR*tackOff} y1={el.y2+nyR*tackOff} x2={el.x2-nxR*tackOff} y2={el.y2-nyR*tackOff} stroke={SEL_COLOR} strokeWidth={2} />
                                          {/* Tacche intermedie ogni 25% */}
                                          {[0.25, 0.5, 0.75].map(p => (
                                            <line key={p} x1={el.x1 + ux*lenR*p + nxR*4} y1={el.y1 + uy*lenR*p + nyR*4} x2={el.x1 + ux*lenR*p - nxR*4} y2={el.y1 + uy*lenR*p - nyR*4} stroke={SEL_COLOR} strokeWidth={1} opacity={0.5} />
                                          ))}
                                          {/* Punti di ancoraggio finali */}
                                          <circle cx={el.x1} cy={el.y1} r={sel ? 5 : 3.5} fill={SEL_COLOR} stroke="#fff" strokeWidth={1.2} />
                                          <circle cx={el.x2} cy={el.y2} r={sel ? 5 : 3.5} fill={SEL_COLOR} stroke="#fff" strokeWidth={1.2} />
                                          {/* Badge misura GRANDE e cliccabile */}
                                          <g transform={`rotate(${angR > 90 || angR < -90 ? angR + 180 : angR}, ${midXR + nxR*16}, ${midYR + nyR*16})`}
                                            onClick={handleEdit} onTouchEnd={handleEdit} style={{ cursor: "pointer", touchAction: "manipulation" }}>
                                            <rect x={midXR + nxR*16 - 28} y={midYR + nyR*16 - 11} width={56} height={22} fill={SEL_COLOR} rx={5} opacity={0.98} />
                                            <text x={midXR + nxR*16} y={midYR + nyR*16 + 2} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff" fontFamily="'JetBrains Mono',monospace">{el.label}</text>
                                            <text x={midXR + nxR*16} y={midYR + nyR*16 + 11} textAnchor="middle" fontSize={6} fontWeight={700} fill="#fff" opacity={0.85} fontFamily="'JetBrains Mono',monospace">mm ✏</text>
                                          </g>
                                        </g>
                                      );
                                    }

                                    return null;
                                  })}

                                  {/* ═══ NODI COSTRUTTIVI ═══ */}
                                  {/* Pallini per gli incroci - cliccabili per assegnare nodo da catalogo */}
                                  {showNodi && !drawMode && (() => {
                                    const nodi = dw._nodi || [];
                                    const items: any[] = [];

                                    // 1. VERTICI ANGOLO TELAIO (intersezioni di freeLine senza subType)
                                    const flTelaio = els.filter((e: any) => e.type === "freeLine" && !e.subType);
                                    const vMap: any = {};
                                    flTelaio.forEach((l: any) => {
                                      [[l.x1, l.y1], [l.x2, l.y2]].forEach(([x, y]: any) => {
                                        const k = `${Math.round(x)},${Math.round(y)}`;
                                        if (!vMap[k]) vMap[k] = { x, y, count: 0 };
                                        vMap[k].count++;
                                      });
                                    });
                                    Object.entries(vMap).forEach(([k, v]: any) => {
                                      if (v.count >= 2) {
                                        items.push({ key: `tel-${k}`, x: v.x, y: v.y, profili: ["telaio", "telaio"], tipo: "angolo" });
                                      }
                                    });

                                    // 2. VERTICI ANGOLO RECT TELAIO (4 angoli del rect classico)
                                    els.filter((e: any) => e.type === "rect").forEach((r: any) => {
                                      [
                                        [r.x, r.y, "tl"], [r.x + r.w, r.y, "tr"],
                                        [r.x, r.y + r.h, "bl"], [r.x + r.w, r.y + r.h, "br"]
                                      ].forEach(([x, y, c]: any) => {
                                        items.push({ key: `rect-${r.id}-${c}`, x, y, profili: ["telaio", "telaio"], tipo: "angolo" });
                                      });
                                    });

                                    // 3. T-JUNCTION: estremi montanti/traversi che toccano il telaio
                                    const ftAll = els.filter((e: any) => e.type === "freeLine"); // tutte (anche complementi)
                                    els.filter((e: any) => e.type === "montante").forEach((m: any) => {
                                      const my1 = m.y1 ?? (frame ? frame.y : fY);
                                      const my2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                      [[m.x, my1, "top"], [m.x, my2, "bot"]].forEach(([x, y, w]: any) => {
                                        items.push({ key: `mont-${m.id}-${w}`, x, y, profili: ["telaio", "montante"], tipo: "T" });
                                      });
                                    });
                                    els.filter((e: any) => e.type === "traverso").forEach((t: any) => {
                                      const tx1 = t.x1 ?? (frame ? frame.x : fX);
                                      const tx2 = t.x2 ?? (frame ? frame.x + frame.w : fX + fW);
                                      [[tx1, t.y, "left"], [tx2, t.y, "right"]].forEach(([x, y, w]: any) => {
                                        // Filtra: skip se questo punto coincide con un vertice telaio già aggiunto
                                        const k2 = `${Math.round(x)},${Math.round(y)}`;
                                        if (vMap[k2] && vMap[k2].count >= 2) return;
                                        items.push({ key: `trav-${t.id}-${w}`, x, y, profili: ["telaio", "traverso"], tipo: "T" });
                                      });
                                    });

                                    // 4. INCROCIO MONTANTE x TRAVERSO
                                    els.filter((e: any) => e.type === "traverso").forEach((t: any) => {
                                      const tx1 = t.x1 ?? (frame ? frame.x : fX);
                                      const tx2 = t.x2 ?? (frame ? frame.x + frame.w : fX + fW);
                                      els.filter((e: any) => e.type === "montante").forEach((m: any) => {
                                        const my1 = m.y1 ?? (frame ? frame.y : fY);
                                        const my2 = m.y2 ?? (frame ? frame.y + frame.h : fY + fH);
                                        if (m.x >= tx1 - 2 && m.x <= tx2 + 2 && t.y >= my1 - 2 && t.y <= my2 + 2) {
                                          items.push({ key: `cross-${m.id}-${t.id}`, x: m.x, y: t.y, profili: ["montante", "traverso"], tipo: "X" });
                                        }
                                      });
                                    });

                                    // Dedup by key
                                    const seen = new Set();
                                    const uniq = items.filter(it => { if (seen.has(it.key)) return false; seen.add(it.key); return true; });

                                    return uniq.map(it => {
                                      const assigned = nodi.find((n: any) => n.key === it.key);
                                      const r = 9 / zoom;
                                      const handleClick = (e3: any) => {
                                        e3.stopPropagation();
                                        setNodoTarget({ key: it.key, x: it.x, y: it.y, profili: it.profili });
                                        setShowSelettoreNodo(true);
                                      };
                                      return (
                                        <g key={it.key} onClick={handleClick} onTouchEnd={handleClick} style={{ cursor: "pointer" }}>
                                          <circle cx={it.x} cy={it.y} r={r * 1.6} fill="transparent" />
                                          {assigned ? (
                                            <>
                                              <circle cx={it.x} cy={it.y} r={r} fill="#1A9E73" stroke="#fff" strokeWidth={2/zoom} />
                                              <text x={it.x} y={it.y + r/2} textAnchor="middle" fontSize={9/zoom} fontWeight={800} fill="#fff" fontFamily="'SF Mono',monospace">✓</text>
                                            </>
                                          ) : (
                                            <>
                                              <circle cx={it.x} cy={it.y} r={r} fill="#fff" stroke="#3B7FE0" strokeWidth={2/zoom} strokeDasharray={`${3/zoom},${2/zoom}`} />
                                              <text x={it.x} y={it.y + r/2} textAnchor="middle" fontSize={10/zoom} fontWeight={800} fill="#3B7FE0" fontFamily="'SF Mono',monospace">?</text>
                                            </>
                                          )}
                                        </g>
                                      );
                                    });
                                  })()}

                                  {/* Pallini d'angolo: vertici condivisi da 2+ freeLine telaio */}
                                  {(() => {
                                    if (drawMode) return null;
                                    const flAll = els.filter(e => e.type === "freeLine" && !e.subType);
                                    if (flAll.length < 2) return null;
                                    // Raggruppa endpoint per vertice (chiave x,y arrotondati)
                                    const vmap: any = {};
                                    flAll.forEach(l => {
                                      [['start', l.x1, l.y1], ['end', l.x2, l.y2]].forEach(([w, x, y]: any) => {
                                        const k = `${Math.round(x)},${Math.round(y)}`;
                                        if (!vmap[k]) vmap[k] = { x, y, refs: [] };
                                        vmap[k].refs.push({ id: l.id, which: w, line: l });
                                      });
                                    });
                                    const verts = Object.values(vmap).filter((v: any) => v.refs.length >= 2);
                                    return verts.map((v: any, i: number) => {
                                      let curMode = 'auto';
                                      let manuallyHidden = false;
                                      for (const r of v.refs) {
                                        const cm = (r.line.cornerModes || {})[r.which];
                                        if (cm && cm !== 'auto') { curMode = cm; break; }
                                        if ((r.line.cornerModes || {})[`${r.which}_hidden`]) manuallyHidden = true;
                                      }
                                      const isConfigured = curMode !== 'auto' || manuallyHidden;
                                      // Doppio-tap = nascondi manualmente questo pallino
                                      const onDblTap = () => {
                                        const upd = (dw.elements || []).map((e: any) => {
                                          const r = v.refs.find((rr: any) => rr.id === e.id);
                                          if (!r) return e;
                                          return { ...e, cornerModes: { ...(e.cornerModes || {}), [`${r.which}_hidden`]: true } };
                                        });
                                        setDW(upd);
                                      };
                                      return (
                                        <g key={`vtx-${i}`} style={{ cursor: 'pointer' }}
                                          onClick={(e3) => {
                                            e3.stopPropagation();
                                            const now = Date.now();
                                            const last = (e3.currentTarget as any).__lastTap || 0;
                                            if (now - last < 400) { onDblTap(); (e3.currentTarget as any).__lastTap = 0; return; }
                                            (e3.currentTarget as any).__lastTap = now;
                                            openCornerEdit({ vx: v.x, vy: v.y });
                                          }}
                                          onTouchStart={(e3) => { e3.stopPropagation(); }}>
                                          <circle cx={v.x} cy={v.y} r={18} fill="transparent" />
                                          {!isConfigured && <>
                                            <circle cx={v.x} cy={v.y} r={14/zoom} fill="#fff" stroke="#888" strokeWidth={2/zoom} opacity={0.85} />
                                            <circle cx={v.x} cy={v.y} r={6/zoom} fill="#888" />
                                          </>}
                                        </g>
                                      );
                                    });
                                  })()}

                                  {/* Pallini d'angolo ANTE: 4 vertici di ogni anta (innerRect + polyAnta) — sempre visibili */}
                                  {(() => {
                                    if (drawMode) return null;
                                    const polyAntas = els.filter((e: any) => e.type === "polyAnta" && e.poly);
                                    const rectAntas = els.filter((e: any) => e.type === "innerRect");
                                    if (polyAntas.length === 0 && rectAntas.length === 0) return null;
                                    const dots: any[] = [];
                                    polyAntas.forEach((a: any) => {
                                      const xs = a.poly.map((p: number[]) => p[0]);
                                      const ys = a.poly.map((p: number[]) => p[1]);
                                      const xMin = Math.min(...xs), xMax = Math.max(...xs);
                                      const yMin = Math.min(...ys), yMax = Math.max(...ys);
                                      const acm = a.cornerModes || {};
                                      const userSet = !!a._userSetCorners;
                                      [
                                        { key: 'tl', x: xMin, y: yMin, mode: acm.tl || '45' },
                                        { key: 'tr', x: xMax, y: yMin, mode: acm.tr || '45' },
                                        { key: 'br', x: xMax, y: yMax, mode: acm.br || '45' },
                                        { key: 'bl', x: xMin, y: yMax, mode: acm.bl || '45' },
                                      ].forEach(c => dots.push({ ...c, antaId: a.id, userSet }));
                                    });
                                    rectAntas.forEach((a: any) => {
                                      const acm = a.cornerModes || {};
                                      const userSet = !!a._userSetCorners;
                                      [
                                        { key: 'tl', x: a.x, y: a.y, mode: acm.tl || '45' },
                                        { key: 'tr', x: a.x + a.w, y: a.y, mode: acm.tr || '45' },
                                        { key: 'br', x: a.x + a.w, y: a.y + a.h, mode: acm.br || '45' },
                                        { key: 'bl', x: a.x, y: a.y + a.h, mode: acm.bl || '45' },
                                      ].forEach(c => dots.push({ ...c, antaId: a.id, userSet }));
                                    });
                                    return dots.map((v, i) => {
                                      // Pallino visibile solo finché l'utente non ha mai scelto un angolo per quell'anta
                                      const showDot = !v.userSet;
                                      const dotColor = v.mode === '45' ? '#3B7FE0' : v.mode === 'V' ? '#1A9E73' : v.mode === 'H' ? '#D08008' : '#888';
                                      const onTap = (e3: any) => {
                                        e3.stopPropagation();
                                        if (e3.preventDefault) e3.preventDefault();
                                        const now = Date.now();
                                        const last = (e3.currentTarget as any).__lastTap || 0;
                                        if (now - last < 400) {
                                          // Doppio tap = nascondi i 4 pallini di quest'anta
                                          (e3.currentTarget as any).__lastTap = 0;
                                          const upd = (dw.elements || []).map((e: any) =>
                                            e.id === v.antaId ? { ...e, _userSetCorners: true } : e
                                          );
                                          setDW(upd);
                                          return;
                                        }
                                        (e3.currentTarget as any).__lastTap = now;
                                        setCornerEdit({ ...{ vx: v.x, vy: v.y, antaId: v.antaId, antaCorner: v.key }, _t: Date.now() } as any);
                                      };
                                      return (
                                        <g key={`avx-${i}`} style={{ cursor: 'pointer' }} onClick={onTap}>
                                          <circle cx={v.x} cy={v.y} r={18} fill="transparent" />
                                          {showDot && <>
                                            <circle cx={v.x} cy={v.y} r={9/zoom} fill="#fff" stroke={dotColor} strokeWidth={1.5/zoom} opacity={0.9} />
                                            <circle cx={v.x} cy={v.y} r={4/zoom} fill={dotColor} />
                                          </>}
                                        </g>
                                      );
                                    });
                                  })()}

                                  {/* Path live penna durante disegno */}
                                  {drawMode === "pen" && dw._penPath && dw._penPath.length > 1 && (
                                    <path d={dw._penPath.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#1A1A1C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
                                  )}
                                  {dw._pendingLine && (() => {
                                    const clr = drawMode === "apertura" ? T.blue : "#333";
                                    const p = dw._pendingLine;
                                    // Per Mont.Lib forza sempre gx=p.x1, per Trav.Lib forza gy=p.y1
                                    let gx = dw._guideX, gy = dw._guideY;
                                    const _subType = p._subType || dw._lineSubType;
                                    if (_subType === "montante" || drawMode === "place-mont-free") gx = p.x1;
                                    if (_subType === "traverso" || drawMode === "place-trav-free" || drawMode === "place-zocc-free") gy = p.y1;
                                    // debug rimosso (era document.title)
                                    // Raccoglie tutti i vertici esistenti dei freeLine
                                    const existingPts = els.filter(e => e.type === "freeLine").flatMap(l => [
                                      { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }
                                    ]);
                                    // Deduplica (arrotonda a 5px)
                                    const seen = new Set();
                                    const uniquePts = existingPts.filter(pt => {
                                      const k = `${Math.round(pt.x/5)*5},${Math.round(pt.y/5)*5}`;
                                      if (seen.has(k)) return false;
                                      seen.add(k); return true;
                                    });
                                    return <>
                                      {/* Guide H/V dai vertici esistenti — solo visive */}
                                      {uniquePts.map((pt, i) => (
                                        <g key={`guide-${i}`} opacity={0.45}>
                                          <line x1={panX - 500} y1={pt.y} x2={panX + canvasW/zoom + 500} y2={pt.y} stroke="#1A9E73" strokeWidth={0.6} strokeDasharray="6,6" />
                                          <line x1={pt.x} y1={panY - 500} x2={pt.x} y2={panY + canvasH/zoom + 500} stroke="#1A9E73" strokeWidth={0.6} strokeDasharray="6,6" />
                                        </g>
                                      ))}
                                      {/* H/V guide lines from pending point */}
                                      <line x1={panX - 500} y1={p.y1} x2={panX + canvasW/zoom + 500} y2={p.y1} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      <line x1={p.x1} y1={panY - 500} x2={p.x1} y2={panY + canvasH/zoom + 500} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      {/* ALIGNMENT INDICATORS — quando il cursore è allineato H/V con un vertice */}
                                      {gx != null && gy != null && uniquePts.map((pt, ai) => {
                                        const alignH = Math.abs(gy - pt.y) < 15;
                                        const alignV = Math.abs(gx - pt.x) < 15;
                                        if (!alignH && !alignV) return null;
                                        return <g key={`align-${ai}`}>
                                          {alignH && <>
                                            <line x1={Math.min(gx, pt.x)} y1={pt.y} x2={Math.max(gx, pt.x)} y2={pt.y} stroke="#DC4444" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.9} />
                                            <circle cx={pt.x} cy={pt.y} r={5} fill="none" stroke="#DC4444" strokeWidth={1.5} />
                                            <circle cx={gx} cy={gy} r={5} fill="none" stroke="#DC4444" strokeWidth={1.5} />
                                          </>}
                                          {alignV && <>
                                            <line x1={pt.x} y1={Math.min(gy, pt.y)} x2={pt.x} y2={Math.max(gy, pt.y)} stroke="#3B7FE0" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.9} />
                                            <circle cx={pt.x} cy={pt.y} r={5} fill="none" stroke="#3B7FE0" strokeWidth={1.5} />
                                            <circle cx={gx} cy={gy} r={5} fill="none" stroke="#3B7FE0" strokeWidth={1.5} />
                                          </>}
                                        </g>;
                                      })}
                                      {/* Live guide line to mouse */}
                                      {gx != null && gy != null && <>
                                        {/* Linea principale: VERDE GRASSA quando ORTHO attivo, altrimenti normale */}
                                        {dw._orthoActive ? (
                                          <>
                                            <line x1={p.x1} y1={p.y1} x2={gx} y2={gy} stroke="#1A9E73" strokeWidth={5} opacity={0.45} />
                                            <line x1={p.x1} y1={p.y1} x2={gx} y2={gy} stroke="#1A9E73" strokeWidth={2.5} strokeDasharray="10,4" opacity={1} />
                                          </>
                                        ) : (
                                          <line x1={p.x1} y1={p.y1} x2={gx} y2={gy} stroke={clr} strokeWidth={2.5} strokeDasharray="8,4" opacity={0.8} />
                                        )}
                                        {/* H/V snap indicator: linee guida full-canvas più visibili */}
                                        {dw._orthoActive === "v" && (
                                          <>
                                            <line x1={gx} y1={0} x2={gx} y2={canvasH} stroke="#1A9E73" strokeWidth={2} strokeDasharray="8,4" opacity={0.9} />
                                            <rect x={gx + 8} y={(p.y1 + gy) / 2 - 12} width={56} height={20} fill="#1A9E73" rx={4} />
                                            <text x={gx + 36} y={(p.y1 + gy) / 2 + 1} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff" fontFamily="'SF Mono',monospace">ORTHO ⊥</text>
                                          </>
                                        )}
                                        {dw._orthoActive === "h" && (
                                          <>
                                            <line x1={0} y1={gy} x2={canvasW} y2={gy} stroke="#1A9E73" strokeWidth={2} strokeDasharray="8,4" opacity={0.9} />
                                            <rect x={(p.x1 + gx) / 2 - 28} y={gy - 26} width={56} height={20} fill="#1A9E73" rx={4} />
                                            <text x={(p.x1 + gx) / 2} y={gy - 12} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff" fontFamily="'SF Mono',monospace">ORTHO —</text>
                                          </>
                                        )}
                                        {/* Snap indicator sul punto target — cerchio verde se agganciato */}
                                        {(() => {
                                          const snapped = findSnap(gx, gy);
                                          const iz = 1 / zoom;
                                          if (snapped && Math.hypot(snapped.x - gx, snapped.y - gy) < 3) {
                                            // Colore + simbolo per ogni tipo OSNAP (standard CAD)
                                            const osnapType = (snapped as any)._osnap || 'END';
                                            const osnapColors: any = { END:"#1A9E73", MID:"#D08008", INT:"#DC4444", PERP:"#3B7FE0", NEAR:"#999", EXT:"#9333EA", QUAD:"#0EA5E9" };
                                            const osnapLabels: any = { END:"ANGOLO", MID:"CENTRO", INT:"INCROCIO", PERP:"PERP.", NEAR:"VICINO", EXT:"ESTENS.", QUAD:"QUAD." };
                                            const oc = osnapColors[osnapType] || "#1A9E73";
                                            const lbl = osnapLabels[osnapType] || "";
                                            const shape = osnapType;
                                            return <>
                                              {/* Forma del marker: ogni OSNAP ha simbolo CAD standard */}
                                              {shape === 'END' && <rect x={gx-7*iz} y={gy-7*iz} width={14*iz} height={14*iz} fill="none" stroke={oc} strokeWidth={2*iz} />}
                                              {shape === 'MID' && <polygon points={`${gx},${gy-9*iz} ${gx+9*iz},${gy} ${gx},${gy+9*iz} ${gx-9*iz},${gy}`} fill="none" stroke={oc} strokeWidth={2*iz} />}
                                              {shape === 'INT' && <><line x1={gx-9*iz} y1={gy-9*iz} x2={gx+9*iz} y2={gy+9*iz} stroke={oc} strokeWidth={2.2*iz}/><line x1={gx-9*iz} y1={gy+9*iz} x2={gx+9*iz} y2={gy-9*iz} stroke={oc} strokeWidth={2.2*iz}/></>}
                                              {shape === 'PERP' && <><rect x={gx-7*iz} y={gy-7*iz} width={14*iz} height={14*iz} fill="none" stroke={oc} strokeWidth={1.8*iz}/><line x1={gx-7*iz} y1={gy} x2={gx} y2={gy} stroke={oc} strokeWidth={1.8*iz}/><line x1={gx} y1={gy-7*iz} x2={gx} y2={gy} stroke={oc} strokeWidth={1.8*iz}/></>}
                                              {shape === 'NEAR' && <><line x1={gx-9*iz} y1={gy-9*iz} x2={gx+9*iz} y2={gy+9*iz} stroke={oc} strokeWidth={1.5*iz} strokeDasharray={`${3*iz},${2*iz}`}/></>}
                                              {shape === 'EXT' && <><line x1={gx-12*iz} y1={gy} x2={gx+12*iz} y2={gy} stroke={oc} strokeWidth={1.5*iz} strokeDasharray={`${4*iz},${2*iz}`}/><line x1={gx} y1={gy-3*iz} x2={gx} y2={gy+3*iz} stroke={oc} strokeWidth={2*iz}/></>}
                                              {shape === 'QUAD' && <polygon points={`${gx},${gy-9*iz} ${gx+9*iz},${gy} ${gx},${gy+9*iz} ${gx-9*iz},${gy}`} fill={oc} fillOpacity={0.2} stroke={oc} strokeWidth={2*iz} />}
                                              {/* Punto centrale */}
                                              <circle cx={gx} cy={gy} r={3*iz} fill={oc} />
                                              {/* Etichetta tipo OSNAP */}
                                              <rect x={gx + 12*iz} y={gy - 9*iz} width={Math.max(32, lbl.length * 6.5)*iz} height={13*iz} fill={oc} rx={2.5*iz} />
                                              <text x={gx + 12*iz + (Math.max(32, lbl.length * 6.5)*iz)/2} y={gy + 0.5*iz} textAnchor="middle" fontSize={7.5*iz} fontWeight={800} fill="#fff" fontFamily="'SF Mono',monospace" letterSpacing="0.3">{lbl}</text>
                                            </>;
                                          }
                                          if (drawMode === "place-mont-free" || drawMode === "place-trav-free") return null;
                                          // Mirino grande nel preview live: SEMPRE visibile sul punto del tap
                                          return <>
                                            <circle cx={gx} cy={gy} r={12*iz} fill="none" stroke={clr} strokeWidth={2*iz} opacity={0.85} />
                                            <circle cx={gx} cy={gy} r={4*iz} fill={clr} />
                                            <line x1={gx-18*iz} y1={gy} x2={gx+18*iz} y2={gy} stroke={clr} strokeWidth={1.2*iz} opacity={0.5} />
                                            <line x1={gx} y1={gy-18*iz} x2={gx} y2={gy+18*iz} stroke={clr} strokeWidth={1.2*iz} opacity={0.5} />
                                          </>;
                                        })()}
                                        {/* Angle + length label */}
                                        {/* Badge — si adatta per restare visibile, TAP per editare misura */}
                                        {(() => {
                                          const bw = 110, bh = 66;
                                          const bx = gx + 16 + bw > canvasW ? gx - bw - 16 : gx + 16;
                                          const by = gy - bh - 8 < 0 ? gy + 8 : gy - bh - 8;
                                          const isH = gy === p.y1, isV = gx === p.x1;
                                          const line2 = isV ? "\u2195 VERT" : isH ? "\u2194 ORIZ" : dw._guideDeg != null ? `${dw._guideDeg}\u00b0` : "";
                                          const handleEditMisura = (ev: any) => {
                                            ev?.stopPropagation?.();
                                            ev?.preventDefault?.();
                                            const cur = dw._guideLen || 0;
                                            const inp = prompt(`Misura del lato in mm:\n(direzione: ${line2 || "libera"})`, String(cur));
                                            if (!inp) return;
                                            const newLen = parseInt(inp.trim());
                                            if (isNaN(newLen) || newLen < 1) { alert("Misura non valida"); return; }
                                            // Calcola nuovo endpoint mantenendo direzione corrente
                                            const dx0 = gx - p.x1, dy0 = gy - p.y1;
                                            const distPx = Math.hypot(dx0, dy0);
                                            if (distPx < 0.5) return;
                                            // Px corrispondenti alla nuova misura
                                            const newDistPx = (newLen / realW) * fW;
                                            const ux = dx0 / distPx, uy = dy0 / distPx;
                                            const newGx = p.x1 + ux * newDistPx;
                                            const newGy = p.y1 + uy * newDistPx;
                                            // Conferma il punto (simula click finale: aggiunge linea + sposta start)
                                            const newLine = { id: Date.now(), type: "freeLine", subType: dw._pendingLine?.subType || null, x1: p.x1, y1: p.y1, x2: newGx, y2: newGy };
                                            const els2 = [...(dw.elements || []), newLine];
                                            const newPending = { x1: newGx, y1: newGy, subType: dw._pendingLine?.subType || null };
                                            onUpdate({ ...dw, elements: els2, _pendingLine: newPending, _guideX: newGx, _guideY: newGy, _guideLen: 0, _chainStart: dw._chainStart || { x: p.x1, y: p.y1 } });
                                          };
                                          return <>
                                            <rect x={bx} y={by} width={bw} height={bh} fill="#1A1A1C" rx={6} opacity={0.96}
                                              style={{ cursor: "pointer", touchAction: "manipulation" }}
                                              onClick={handleEditMisura}
                                              onTouchEnd={handleEditMisura}
                                            />
                                            <text x={bx+bw/2} y={by+22} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff" fontFamily="'JetBrains Mono',monospace"
                                              style={{ cursor: "pointer", pointerEvents: "none" }}>
                                              {`${dw._guideLen ?? ""} mm`}
                                            </text>
                                            <text x={bx+bw/2} y={by+50} textAnchor="middle" fontSize={14} fontWeight={700} fill={isH||isV ? "#1A9E73" : "rgba(255,255,255,0.8)"} fontFamily="'JetBrains Mono',monospace"
                                              style={{ pointerEvents: "none" }}>
                                              {line2}
                                            </text>
                                            {/* Indicatore "tap qui" piccolo in alto a destra */}
                                            <text x={bx+bw-6} y={by+12} textAnchor="end" fontSize={9} fontWeight={800} fill="#1A9E73" fontFamily="'SF Mono',monospace"
                                              style={{ pointerEvents: "none" }}>
                                              ✏ TAP
                                            </text>
                                          </>;
                                        })()}
                                      </>}
                                      <circle cx={p.x1} cy={p.y1} r={8} fill={clr} fillOpacity={0.5} />
                                      <circle cx={p.x1} cy={p.y1} r={14} fill="none" stroke={clr} strokeWidth={2} strokeDasharray="4,2" />
                                      <circle cx={p.x1} cy={p.y1} r={3} fill={clr} />
                                    </>;
                                  })()}

                                  {/* Live drag dimension */}
                                  {dw._dragDim && (() => {
                                    const dd = dw._dragDim;
                                    const midY = (dd.y1 + dd.y2) / 2;
                                    if (dd.type === "v") {
                                      // Vertical montante — show ← left mm | right mm →
                                      return <>
                                        <rect x={dd.x - 62} y={midY - 8} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={dd.x - 34} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">← {dd.leftMM}</text>
                                        <rect x={dd.x + 6} y={midY - 8} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={dd.x + 34} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">{dd.rightMM} →</text>
                                      </>;
                                    }
                                    if (dd.type === "h") {
                                      const midX = (dd.x1 + dd.x2) / 2;
                                      return <>
                                        <rect x={midX - 28} y={dd.y - 22} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={midX} y={dd.y - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">↑ {dd.topMM}</text>
                                        <rect x={midX - 28} y={dd.y + 6} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={midX} y={dd.y + 18} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">{dd.botMM} ↓</text>
                                      </>;
                                    }
                                    return null;
                                  })()}
                                  {/* ══ JUNCTION MARKERS ══ */}
                                  {(drawMode === "junction" || junctions.some((j:any) => dw._junctions?.find((jj:any) => jj.id === j.id))) && junctions.map((j: any) => {
                                    const saved = dw._junctions?.find((jj:any) => jj.id === j.id);
                                    const jType = saved?.type || "90";
                                    const isSelected = junctionEdit?.id === j.id;
                                    return (
                                      <g key={j.id} style={{ cursor: "pointer" }} onClick={(e3) => { e3.stopPropagation(); if (drawMode === "junction") setJunctionEdit(j); }}>
                                        <circle cx={j.ptX} cy={j.ptY} r={9} fill={jType === "45" ? "#D08008" : T.blue} fillOpacity={0.15} stroke={jType === "45" ? "#D08008" : T.blue} strokeWidth={isSelected ? 2.5 : 1.5} />
                                        <text x={j.ptX} y={j.ptY + 4} textAnchor="middle" fontSize={8} fontWeight={800} fill={jType === "45" ? "#D08008" : T.blue} fontFamily="monospace">{jType}°</text>
                                      </g>
                                    );
                                  })}
                                </svg>
                                </div>

                                {/* ══ PANNELLO GIUNZIONE ══ */}
                                {junctionEdit && (
                                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}
                                    onClick={() => setJunctionEdit(null)}>
                                    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}
                                      onClick={e => e.stopPropagation()}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A1C" }}>⌐ Modifica Giunzione</div>
                                      <div style={{ fontSize: 11, color: "#888" }}>Scegli il tipo di taglio angolare</div>
                                      {/* Tipo giunzione */}
                                      <div style={{ display: "flex", gap: 8 }}>
                                        {[{id:"90",label:"90°",desc:"Un profilo passa"},{id:"45",label:"45°",desc:"Taglio a 45°"}].map(opt => {
                                          const saved = dw._junctions?.find((jj:any) => jj.id === junctionEdit.id);
                                          const curType = saved?.type || "90";
                                          const isSel = curType === opt.id;
                                          return (
                                            <div key={opt.id} onClick={() => {
                                              const newJ = { ...junctionEdit, type: opt.id, winner: saved?.winner || "A" };
                                              const existing = dw._junctions || [];
                                              const updated = existing.filter((jj:any) => jj.id !== junctionEdit.id);
                                              setMode({ _junctions: [...updated, newJ] });
                                              setJunctionEdit(newJ);
                                            }} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: `2px solid ${isSel ? T.blue : "#ddd"}`, background: isSel ? `${T.blue}12` : "#fff", cursor: "pointer", textAlign: "center" }}>
                                              <div style={{ fontSize: 18, fontWeight: 800, color: isSel ? T.blue : "#555" }}>{opt.label}</div>
                                              <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{opt.desc}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {/* Chi vince */}
                                      {(() => {
                                        const saved = dw._junctions?.find((jj:any) => jj.id === junctionEdit.id);
                                        const curType = saved?.type || "90";
                                        if (curType !== "90") return null;
                                        const elA = els.find((e:any) => e.id === junctionEdit.elA);
                                        const elB = els.find((e:any) => e.id === junctionEdit.elB);
                                        const nameA = elA?.subType || elA?.type || "A";
                                        const nameB = elB?.subType || elB?.type || "B";
                                        const curWinner = saved?.winner || "A";
                                        return (
                                          <div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 6 }}>Chi vince (passa sopra)</div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                              {[{id:"A",label:nameA.toUpperCase()},{id:"B",label:nameB.toUpperCase()}].map(opt => {
                                                const isSel = curWinner === opt.id;
                                                return (
                                                  <div key={opt.id} onClick={() => {
                                                    const newJ = { ...(saved || junctionEdit), winner: opt.id };
                                                    const existing = dw._junctions || [];
                                                    const updated = existing.filter((jj:any) => jj.id !== junctionEdit.id);
                                                    setMode({ _junctions: [...updated, newJ] });
                                                    setJunctionEdit(newJ);
                                                  }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `2px solid ${isSel ? "#1A9E73" : "#ddd"}`, background: isSel ? "#1A9E7312" : "#fff", cursor: "pointer", textAlign: "center", fontSize: 11, fontWeight: 800, color: isSel ? "#1A9E73" : "#555" }}>
                                                    {opt.label}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                        <div onClick={() => setJunctionEdit(null)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Chiudi</div>
                                        <div onClick={() => {
                                          const existing = dw._junctions || [];
                                          setMode({ _junctions: existing.filter((jj:any) => jj.id !== junctionEdit.id) });
                                          setJunctionEdit(null);
                                        }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #DC4444", background: "#DC444408", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#DC4444" }}>Reset</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Footer */}
                                <div style={{ padding: "4px 10px 5px", fontSize: 9, textAlign: "center", color: (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") ? T.grn : (drawMode === "apertura" || drawMode === "place-ap") ? T.blue : (drawMode === "line" || drawMode === "place-mont" || drawMode === "place-trav") ? "#555" : T.sub, fontWeight: drawMode ? 700 : 400 }}>
                                  {drawMode === "line" ? "⚫ Click per tracciare struttura · Le linee si concatenano"
                                    : drawMode === "apertura" ? "🔵 Click libero per disegnare apertura in blu"
                                    : drawMode === "place-mont" ? "⬛ Click su una CELLA per aggiungere il montante verticale"
                                    : drawMode === "place-trav" ? "⬛ Click su una CELLA per aggiungere il traverso orizzontale"
                                    : drawMode === "place-anta" ? "🟢 Click sulla CELLA per inserire l'anta"
                                    : drawMode === "place-porta" ? "🟢 Click sulla CELLA per inserire anta porta (profilo spesso)"
                                    : drawMode === "place-persiana" ? "🟢 Click sulla CELLA per inserire persiana con stecche"
                                    : drawMode === "place-vetro" ? "🟢 Click sulla CELLA per inserire il vetro (dentro l'anta)"
                                    : drawMode === "place-ap" ? `🔵 Click sulla CELLA per apertura ${placeApType}`
                                    : `${els.length} el. · ${cells.length} celle · Click per selezionare`}
                                </div>
                                </>}
                              </div>

                              {/* ══ OVERLAY MODIFICA MISURA ══ */}
                              {dimEdit && (
                                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}
                                  onClick={() => setDimEdit(null)}>
                                  <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 240, display: "flex", flexDirection: "column", gap: 12 }}
                                    onClick={e => e.stopPropagation()}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A1C" }}>✏️ Modifica misura lato</div>
                                    <div style={{ fontSize: 11, color: "#888" }}>Inserisci la misura reale in mm</div>
                                    <input
                                      autoFocus
                                      type="number"
                                      value={dimEdit.val}
                                      onChange={e => setDimEdit({ ...dimEdit, val: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") {
                                          applyDimChange(dimEdit.id, dimEdit.val, (dimEdit as any).isDim);
                                          setDimEdit(null);
                                        }
                                        if (e.key === "Escape") setDimEdit(null);
                                      }}
                                      style={{ padding: "10px 14px", border: `2px solid ${"#1A9E73"}`, borderRadius: 8, fontSize: 22, fontWeight: 800, fontFamily: "monospace", textAlign: "center", outline: "none", color: "#1A1A1C", width: "100%", display: "block", boxSizing: "border-box" as any }}
                                    />
                                    {/* Bottoni inclinazione — solo per freeLine */}
                                    {!(dimEdit as any).isDim && (
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <div onClick={() => { applyDimChange(dimEdit.id, dimEdit.val, false, 'right'); setDimEdit(null); }}
                                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, background: "#F2F1EC", border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A1A1C" }}>← SX</div>
                                        <div onClick={() => { applyDimChange(dimEdit.id, dimEdit.val, false, 'both'); setDimEdit(null); }}
                                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, background: "#F2F1EC", border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A1A1C" }}>↔ Entrambi</div>
                                        <div onClick={() => { applyDimChange(dimEdit.id, dimEdit.val, false, 'left'); setDimEdit(null); }}
                                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, background: "#F2F1EC", border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A1A1C" }}>DX →</div>
                                      </div>
                                    )}
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <div onClick={() => setDimEdit(null)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Chiudi</div>
                                      <div onClick={() => { undo(); setDimEdit(null); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #DC4444", background: "#DC444408", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#DC4444" }}>↩ Ripristina</div>
                                      {(dimEdit as any).isDim && <div onClick={() => {
                                        applyDimChange(dimEdit.id, dimEdit.val, true);
                                        setDimEdit(null);
                                      }} style={{ flex: 1, padding: "9px", borderRadius: 8, background: "#1A9E73", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff" }}>✓ Conferma</div>}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ══ POPUP SCELTA ANGOLO ══ */}
                              {/* Modal TELAIO BATCH (doppio-tap su Telaio) */}
                              {telaioBatch && telaioBatch.open && (
                                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
                                  onClick={() => setTelaioBatch(null)}>
                                  <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, minWidth: 280, maxWidth: 340, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73", marginBottom: 4 }}>📐 Telaio multiplo</div>
                                    <div style={{ fontSize: 10, color: "#888", marginBottom: 14 }}>Inserisci dimensioni reali (mm) e numero pezzi</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                                      <div>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Larghezza (L)</div>
                                        <input type="number" value={telaioBatch.L} onChange={(e) => setTelaioBatch({ ...telaioBatch, L: e.target.value })}
                                          style={{ width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 700, border: "1.5px solid #ddd", borderRadius: 6, fontFamily: "monospace" }} />
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Altezza (H)</div>
                                        <input type="number" value={telaioBatch.H} onChange={(e) => setTelaioBatch({ ...telaioBatch, H: e.target.value })}
                                          style={{ width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 700, border: "1.5px solid #ddd", borderRadius: 6, fontFamily: "monospace" }} />
                                      </div>
                                    </div>
                                    <div style={{ marginBottom: 14 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>N° pezzi</div>
                                      <input type="number" min="1" max="20" value={telaioBatch.N} onChange={(e) => setTelaioBatch({ ...telaioBatch, N: e.target.value })}
                                        style={{ width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 700, border: "1.5px solid #ddd", borderRadius: 6, fontFamily: "monospace" }} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                                      <div onClick={() => setTelaioBatch(null)} style={{ padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Annulla</div>
                                      <div onClick={() => {
                                        const Lmm = parseFloat(telaioBatch.L);
                                        const Hmm = parseFloat(telaioBatch.H);
                                        const Nv = Math.max(1, Math.min(20, parseInt(telaioBatch.N) || 1));
                                        if (!Lmm || !Hmm) { setTelaioBatch(null); return; }
                                        // Conversione mm → px canvas. Usa il rapporto del vano corrente.
                                        const pxPerMm = fW / (realW || 1200);
                                        const wPx = Math.round(Lmm * pxPerMm);
                                        const hPx = Math.round(Hmm * pxPerMm);
                                        const gap = Math.round(15 * pxPerMm); // 15mm spazio tra telai
                                        const newRects: any[] = [];
                                        const t0 = Date.now();
                                        let curX = fX;
                                        for (let i = 0; i < Nv; i++) {
                                          newRects.push({ id: t0 + i, type: "rect", x: Math.round(curX), y: fY, w: wPx, h: hPx });
                                          curX += wPx + gap;
                                        }
                                        // FIX: sostituisce i telai esistenti invece di aggiungerne altri.
                                        // Rimuovo anche montanti/traversi/zoccoli che finirebbero orfani fuori dal nuovo telaio.
                                        const totalW = (wPx * Nv) + (gap * Math.max(0, Nv - 1));
                                        const xMin = fX, xMax = fX + totalW;
                                        const yMin = fY, yMax = fY + hPx;
                                        const elsKept = els.filter((e: any) => {
                                          if (e.type === "rect") return false; // tutti i vecchi telai via
                                          // Tieni solo elementi che cadono dentro la nuova area complessiva
                                          if (e.type === "montante") {
                                            return e.x >= xMin && e.x <= xMax;
                                          }
                                          if (e.type === "traverso") {
                                            return e.y >= yMin && e.y <= yMax;
                                          }
                                          // Tutto il resto (aperture, vetri, accessori) lo tengo: l'utente puo' rimuoverlo a mano
                                          return true;
                                        });
                                        setDW([...elsKept, ...newRects]);
                                        setTelaioBatch(null);
                                      }} style={{ padding: "10px", borderRadius: 8, background: "#1A9E73", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff" }}>Crea {telaioBatch.N} telaio{parseInt(telaioBatch.N)>1?"i":""}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Modal FORME PRESET (Casetta / Arco / Trapezio) */}
                              {shapePicker && shapePicker.open && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}
                                  onClick={() => setShapePicker(null)}>
                                  <div style={{ background: "#fff", borderRadius: 12, padding: 18, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
                                    onClick={(e) => e.stopPropagation()}>
                                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, color: "#1A9E73" }}>FORME PRESET</div>
                                    <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Scegli forma e inserisci le misure in mm</div>
                                    {/* Step 1: scelta forma */}
                                    {!shapePicker.shape && (
                                      <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Tetti / Forme miste</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "casetta" })}
                                            style={{ border: "2px solid #1A9E73", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#F0FDF4" }}>
                                            <svg width="70" height="60" viewBox="0 0 100 90" fill="none" stroke="#1A9E73" strokeWidth="3">
                                              <polygon points="10,40 50,10 90,40 90,80 10,80" fill="#1A9E7320"/>
                                            </svg>
                                            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: "#1A9E73" }}>CASETTA</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "trapezio" })}
                                            style={{ border: "2px solid #D08008", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#FFFBEB" }}>
                                            <svg width="70" height="60" viewBox="0 0 100 90" fill="none" stroke="#D08008" strokeWidth="3">
                                              <polygon points="10,80 10,30 90,10 90,80" fill="#D0800820"/>
                                            </svg>
                                            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: "#D08008" }}>TRAPEZIO</div>
                                          </div>
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Archi base</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_tutto_sesto" })}
                                            style={{ border: "2px solid #2563EB", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#EFF6FF" }}>
                                            <svg width="70" height="60" viewBox="0 0 100 90" fill="none" stroke="#2563EB" strokeWidth="3">
                                              <path d="M10,80 L10,50 Q10,10 50,10 Q90,10 90,50 L90,80 Z" fill="#2563EB20"/>
                                            </svg>
                                            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: "#2563EB" }}>TUTTO SESTO</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>semicerchio</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_ribassato" })}
                                            style={{ border: "2px solid #2563EB", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#EFF6FF" }}>
                                            <svg width="70" height="60" viewBox="0 0 100 90" fill="none" stroke="#2563EB" strokeWidth="3">
                                              <path d="M10,80 L10,50 Q50,15 90,50 L90,80 Z" fill="#2563EB20"/>
                                            </svg>
                                            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: "#2563EB" }}>RIBASSATO</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>schiacciato</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_acuto" })}
                                            style={{ border: "2px solid #2563EB", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#EFF6FF" }}>
                                            <svg width="70" height="60" viewBox="0 0 100 90" fill="none" stroke="#2563EB" strokeWidth="3">
                                              <path d="M10,80 L10,50 Q10,5 50,5 Q90,5 90,50 L90,80 Z M10,50 Q30,15 50,5 M50,5 Q70,15 90,50" fill="#2563EB20"/>
                                            </svg>
                                            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: "#2563EB" }}>SESTO ACUTO</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>gotico</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_rialzato" })}
                                            style={{ border: "2px solid #2563EB", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#EFF6FF" }}>
                                            <svg width="70" height="60" viewBox="0 0 100 90" fill="none" stroke="#2563EB" strokeWidth="3">
                                              <path d="M10,80 L10,50 Q10,5 50,5 Q90,5 90,50 L90,80 Z" fill="#2563EB20" transform="scale(1,1.05) translate(0,-3)"/>
                                            </svg>
                                            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: "#2563EB" }}>RIALZATO</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>oltre semicerchio</div>
                                          </div>
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginTop: 14, marginBottom: 6, textTransform: "uppercase" }}>Archi tecnici</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_3_centri" })}
                                            style={{ border: "2px solid #7C3AED", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#F5F3FF" }}>
                                            <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#7C3AED" strokeWidth="3">
                                              <path d="M10,80 L10,55 Q10,40 25,40 Q50,20 75,40 Q90,40 90,55 L90,80 Z" fill="#7C3AED20"/>
                                            </svg>
                                            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: "#7C3AED" }}>3 CENTRI</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>cesto</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_ellittico" })}
                                            style={{ border: "2px solid #7C3AED", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#F5F3FF" }}>
                                            <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#7C3AED" strokeWidth="3">
                                              <path d="M10,80 L10,55 A 40,30 0 0 1 90,55 L90,80 Z" fill="#7C3AED20"/>
                                            </svg>
                                            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: "#7C3AED" }}>ELLITTICO</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>elegante</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_policentrico" })}
                                            style={{ border: "2px solid #7C3AED", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#F5F3FF" }}>
                                            <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#7C3AED" strokeWidth="3">
                                              <path d="M10,80 L10,55 Q10,42 22,38 Q35,28 50,25 Q65,28 78,38 Q90,42 90,55 L90,80 Z" fill="#7C3AED20"/>
                                            </svg>
                                            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: "#7C3AED" }}>POLICENTR.</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>5 archi</div>
                                          </div>
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginTop: 14, marginBottom: 6, textTransform: "uppercase" }}>Archi speciali</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_asimmetrico" })}
                                            style={{ border: "2px solid #DC2626", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#FEF2F2" }}>
                                            <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#DC2626" strokeWidth="3">
                                              <path d="M10,80 L10,55 Q10,15 50,15 Q90,15 90,40 L90,80 Z" fill="#DC262620"/>
                                            </svg>
                                            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: "#DC2626" }}>ASIMMETR.</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>spalle diverse</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_spezzato" })}
                                            style={{ border: "2px solid #DC2626", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#FEF2F2" }}>
                                            <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#DC2626" strokeWidth="3">
                                              <path d="M10,80 L10,40 L50,15 L90,40 L90,80 Z" fill="#DC262620"/>
                                            </svg>
                                            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: "#DC2626" }}>SPEZZATO</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>2 segmenti</div>
                                          </div>
                                          <div onClick={() => setShapePicker({ ...shapePicker, shape: "arco_ribassato_piedritti" })}
                                            style={{ border: "2px solid #DC2626", borderRadius: 10, padding: 8, cursor: "pointer", textAlign: "center", background: "#FEF2F2" }}>
                                            <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#DC2626" strokeWidth="3">
                                              <path d="M10,80 L10,30 Q50,18 90,30 L90,80 Z" fill="#DC262620"/>
                                            </svg>
                                            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: "#DC2626" }}>RIB.+PIED.</div>
                                            <div style={{ fontSize: 8, color: "#666" }}>piedritti alti</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {/* Step 2: misure */}
                                    {shapePicker.shape && (
                                      <div>
                                        <div onClick={() => setShapePicker({ ...shapePicker, shape: null })}
                                          style={{ fontSize: 11, color: "#1A9E73", cursor: "pointer", marginBottom: 10, fontWeight: 700 }}>← Cambia forma</div>
                                        {/* Anteprima grande */}
                                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                                          {shapePicker.shape === "casetta" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#1A9E73" strokeWidth="2.5">
                                              <polygon points="20,80 100,20 180,80 180,160 20,160" fill="#1A9E7315"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#1A9E73" fontWeight="700">L = base</text>
                                              <text x="195" y="120" textAnchor="end" fontSize="11" fill="#1A9E73" fontWeight="700">H</text>
                                              <text x="100" y="50" textAnchor="middle" fontSize="11" fill="#1A9E73" fontWeight="700">H2</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_tutto_sesto" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#2563EB" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q20,20 100,20 Q180,20 180,100 L180,160 Z" fill="#2563EB15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#2563EB" fontWeight="700">H</text>
                                              <text x="100" y="50" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">freccia = L/2</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_ribassato" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#2563EB" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q100,40 180,100 L180,160 Z" fill="#2563EB15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#2563EB" fontWeight="700">H</text>
                                              <text x="100" y="65" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">freccia (&lt; L/2)</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_acuto" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#2563EB" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q40,30 100,15 Q160,30 180,100 L180,160 Z" fill="#2563EB15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#2563EB" fontWeight="700">H</text>
                                              <text x="100" y="45" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">freccia (a punta)</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_rialzato" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#2563EB" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q20,5 100,5 Q180,5 180,100 L180,160 Z" fill="#2563EB15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#2563EB" fontWeight="700">H</text>
                                              <text x="100" y="35" textAnchor="middle" fontSize="11" fill="#2563EB" fontWeight="700">freccia (&gt; L/2)</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_3_centri" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#7C3AED" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q20,75 50,72 Q100,40 150,72 Q180,75 180,100 L180,160 Z" fill="#7C3AED15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#7C3AED" fontWeight="700">H</text>
                                              <text x="100" y="55" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">freccia</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_ellittico" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#7C3AED" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 A 80,55 0 0 1 180,100 L180,160 Z" fill="#7C3AED15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#7C3AED" fontWeight="700">H</text>
                                              <text x="100" y="60" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">freccia (semi-asse)</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_policentrico" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#7C3AED" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q20,80 45,72 Q75,52 100,48 Q125,52 155,72 Q180,80 180,100 L180,160 Z" fill="#7C3AED15"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#7C3AED" fontWeight="700">H</text>
                                              <text x="100" y="42" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">freccia</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_asimmetrico" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 Q20,30 100,30 Q180,30 180,75 L180,160 Z" fill="#DC262615"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#DC2626" fontWeight="700">L = base</text>
                                              <text x="10" y="135" textAnchor="start" fontSize="11" fill="#DC2626" fontWeight="700">Hsx</text>
                                              <text x="195" y="120" textAnchor="end" fontSize="11" fill="#DC2626" fontWeight="700">Hdx</text>
                                              <text x="100" y="55" textAnchor="middle" fontSize="11" fill="#DC2626" fontWeight="700">freccia</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_spezzato" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                              <path d="M20,160 L20,100 L100,30 L180,100 L180,160 Z" fill="#DC262615"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#DC2626" fontWeight="700">L = base</text>
                                              <text x="195" y="130" textAnchor="end" fontSize="11" fill="#DC2626" fontWeight="700">H</text>
                                              <text x="100" y="55" textAnchor="middle" fontSize="11" fill="#DC2626" fontWeight="700">altezza punta</text>
                                              <text x="105" y="80" textAnchor="start" fontSize="9" fill="#DC2626" fontWeight="600">posiz.</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "arco_ribassato_piedritti" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                              <path d="M20,160 L20,55 Q100,25 180,55 L180,160 Z" fill="#DC262615"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#DC2626" fontWeight="700">L = base</text>
                                              <text x="195" y="120" textAnchor="end" fontSize="11" fill="#DC2626" fontWeight="700">H (alti)</text>
                                              <text x="100" y="42" textAnchor="middle" fontSize="11" fill="#DC2626" fontWeight="700">freccia</text>
                                            </svg>
                                          )}
                                          {shapePicker.shape === "trapezio" && (
                                            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" stroke="#D08008" strokeWidth="2.5">
                                              <polygon points="20,160 20,80 180,30 180,160" fill="#D0800815"/>
                                              <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#D08008" fontWeight="700">L = base</text>
                                              <text x="10" y="120" textAnchor="start" fontSize="11" fill="#D08008" fontWeight="700">H</text>
                                              <text x="195" y="100" textAnchor="end" fontSize="11" fill="#D08008" fontWeight="700">H2</text>
                                            </svg>
                                          )}
                                        </div>
                                        {/* Caselle misure */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                                          <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4 }}>BASE L (mm)</div>
                                            <input type="number" value={shapePicker.L} onChange={(e) => setShapePicker({ ...shapePicker, L: e.target.value })}
                                              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700 }} />
                                          </div>
                                          <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4 }}>{shapePicker.shape === "trapezio" ? "ALT. SX H (mm)" : "ALTEZZA H (mm)"}</div>
                                            <input type="number" value={shapePicker.H} onChange={(e) => setShapePicker({ ...shapePicker, H: e.target.value })}
                                              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700 }} />
                                          </div>
                                          {/* Casella H2 dinamica: tutto sesto la nasconde */}
                                          {shapePicker.shape !== "arco_tutto_sesto" && (
                                            <div style={{ gridColumn: "1 / span 2" }}>
                                              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4 }}>
                                                {shapePicker.shape === "casetta" && "ALT. COLMO H2 (mm dal punto piu alto dei lati)"}
                                                {shapePicker.shape === "arco_ribassato" && `FRECCIA (mm) — deve essere < ${Math.round(parseFloat(shapePicker.L)/2) || "L/2"}`}
                                                {shapePicker.shape === "arco_acuto" && "ALTEZZA PUNTA (mm)"}
                                                {shapePicker.shape === "arco_rialzato" && `FRECCIA (mm) — deve essere > ${Math.round(parseFloat(shapePicker.L)/2) || "L/2"}`}
                                                {shapePicker.shape === "arco_3_centri" && "FRECCIA totale (mm) = altezza dal piedritto al colmo"}
                                                {shapePicker.shape === "arco_ellittico" && "SEMI-ASSE VERTICALE (mm)"}
                                                {shapePicker.shape === "arco_policentrico" && "FRECCIA (mm)"}
                                                {shapePicker.shape === "arco_asimmetrico" && "FRECCIA (mm) — colmo dal punto piu alto"}
                                                {shapePicker.shape === "arco_spezzato" && "ALTEZZA PUNTA (mm) — dal punto piu alto dei lati"}
                                                {shapePicker.shape === "arco_ribassato_piedritti" && `FRECCIA (mm) — deve essere < ${Math.round(parseFloat(shapePicker.L)/2) || "L/2"}`}
                                                {shapePicker.shape === "trapezio" && "ALT. DX H2 (mm)"}
                                              </div>
                                              <input type="number" value={shapePicker.H2} onChange={(e) => setShapePicker({ ...shapePicker, H2: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700 }} />
                                              {/* Hint visivo per archi con vincoli */}
                                              {shapePicker.shape === "arco_ribassato" && parseFloat(shapePicker.H2) >= parseFloat(shapePicker.L)/2 && (
                                                <div style={{ fontSize: 10, color: "#DC4444", marginTop: 4, fontWeight: 700 }}>⚠ Per essere ribassato, freccia &lt; {Math.round(parseFloat(shapePicker.L)/2)} mm</div>
                                              )}
                                              {shapePicker.shape === "arco_rialzato" && parseFloat(shapePicker.H2) <= parseFloat(shapePicker.L)/2 && (
                                                <div style={{ fontSize: 10, color: "#DC4444", marginTop: 4, fontWeight: 700 }}>⚠ Per essere rialzato, freccia &gt; {Math.round(parseFloat(shapePicker.L)/2)} mm</div>
                                              )}
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_tutto_sesto" && (
                                            <div style={{ gridColumn: "1 / span 2", padding: "10px 12px", background: "#EFF6FF", borderRadius: 8, fontSize: 11, color: "#2563EB", fontWeight: 700 }}>
                                              ℹ Freccia automatica = {Math.round(parseFloat(shapePicker.L)/2) || "L/2"} mm (semicerchio perfetto)
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_3_centri" && (
                                            <div style={{ gridColumn: "1 / span 2" }}>
                                              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4 }}>
                                                RAGGIO ARCHI LATERALI Rl (mm) — quanto curvano i lati
                                              </div>
                                              <input type="number" value={shapePicker.H3} onChange={(e) => setShapePicker({ ...shapePicker, H3: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700 }} />
                                              <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 4, fontWeight: 600 }}>ℹ Suggerito: ~{Math.round(parseFloat(shapePicker.H2 || "800") * 0.6)} mm (60% della freccia)</div>
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_ellittico" && (
                                            <div style={{ gridColumn: "1 / span 2", padding: "10px 12px", background: "#F5F3FF", borderRadius: 8, fontSize: 11, color: "#7C3AED", fontWeight: 700 }}>
                                              ℹ Ellisse: semi-asse orizz = L/2 = {Math.round(parseFloat(shapePicker.L)/2) || "L/2"} mm, semi-asse vert = freccia
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_policentrico" && (
                                            <div style={{ gridColumn: "1 / span 2", padding: "10px 12px", background: "#F5F3FF", borderRadius: 8, fontSize: 11, color: "#7C3AED", fontWeight: 700 }}>
                                              ℹ Curva super-ellittica armonica con 5 archi tangenti
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_asimmetrico" && (
                                            <div style={{ gridColumn: "1 / span 2" }}>
                                              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4 }}>
                                                ALTEZZA SPALLA DX (mm) — la H del campo sopra e' la sx
                                              </div>
                                              <input type="number" value={shapePicker.H4} onChange={(e) => setShapePicker({ ...shapePicker, H4: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700 }} />
                                              <div style={{ fontSize: 10, color: "#DC2626", marginTop: 4, fontWeight: 600 }}>ℹ Se Hsx = Hdx, l'arco e' simmetrico</div>
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_spezzato" && (
                                            <div style={{ gridColumn: "1 / span 2" }}>
                                              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 4 }}>
                                                POSIZIONE PUNTA da SX (mm) — di solito = L/2 (centro)
                                              </div>
                                              <input type="number" value={shapePicker.H4} onChange={(e) => setShapePicker({ ...shapePicker, H4: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700 }} />
                                              <div style={{ fontSize: 10, color: "#DC2626", marginTop: 4, fontWeight: 600 }}>ℹ Centro = {Math.round(parseFloat(shapePicker.L || "1500") / 2)} mm. Sposta a sx/dx per asimmetria.</div>
                                            </div>
                                          )}
                                          {shapePicker.shape === "arco_ribassato_piedritti" && (
                                            <div style={{ gridColumn: "1 / span 2", padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, fontSize: 11, color: "#DC2626", fontWeight: 700 }}>
                                              ℹ Stesso arco ribassato ma usa piedritti H grandi (es. 1800-2500 mm tipici per ingressi)
                                            </div>
                                          )}
                                        </div>
                                        {/* Bottoni */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                          <div onClick={() => setShapePicker(null)}
                                            style={{ padding: "12px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#888" }}>Annulla</div>
                                          <div onClick={() => {
                                            const Lmm = parseFloat(shapePicker.L);
                                            const Hmm = parseFloat(shapePicker.H);
                                            let H2mm = parseFloat(shapePicker.H2);
                                            if (!Lmm || !Hmm) { alert("Inserisci base e altezza"); return; }
                                            // Tutto sesto: freccia automatica = L/2 (sovrascrive H2 se mancante)
                                            if (shapePicker.shape === "arco_tutto_sesto") H2mm = Lmm / 2;
                                            // Validazioni specifiche
                                            if (shapePicker.shape === "casetta" && (!H2mm || H2mm <= 0)) { alert("Inserisci altezza colmo"); return; }
                                            if (shapePicker.shape === "trapezio" && (!H2mm || H2mm <= 0)) { alert("Inserisci altezza DX"); return; }
                                            if (shapePicker.shape === "arco_ribassato") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci freccia"); return; }
                                              if (H2mm >= Lmm / 2) { alert("Per arco ribassato la freccia deve essere < L/2 = " + (Lmm/2) + " mm"); return; }
                                            }
                                            if (shapePicker.shape === "arco_rialzato") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci freccia"); return; }
                                              if (H2mm <= Lmm / 2) { alert("Per arco rialzato la freccia deve essere > L/2 = " + (Lmm/2) + " mm"); return; }
                                            }
                                            if (shapePicker.shape === "arco_acuto") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci altezza punta"); return; }
                                            }
                                            if (shapePicker.shape === "arco_3_centri" || shapePicker.shape === "arco_ellittico" || shapePicker.shape === "arco_policentrico") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci freccia"); return; }
                                            }
                                            if (shapePicker.shape === "arco_asimmetrico") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci freccia"); return; }
                                              const H4mm = parseFloat(shapePicker.H4);
                                              if (!H4mm || H4mm <= 0) { alert("Inserisci altezza spalla DX"); return; }
                                            }
                                            if (shapePicker.shape === "arco_spezzato") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci altezza punta"); return; }
                                              const H4mm = parseFloat(shapePicker.H4);
                                              if (!H4mm || H4mm <= 0) { alert("Inserisci posizione punta"); return; }
                                              if (H4mm >= Lmm) { alert("Posizione punta deve essere < L"); return; }
                                            }
                                            if (shapePicker.shape === "arco_ribassato_piedritti") {
                                              if (!H2mm || H2mm <= 0) { alert("Inserisci freccia"); return; }
                                              if (H2mm >= Lmm / 2) { alert("Freccia deve essere < L/2 = " + (Lmm/2) + " mm"); return; }
                                            }
                                            // Per casetta H2 puo essere anche 0 per fare un rettangolo, ma normalmente >0
                                            const pxPerMm = fW / (realW || 1200);
                                            const Lpx = Math.round(Lmm * pxPerMm);
                                            const Hpx = Math.round(Hmm * pxPerMm);
                                            const H2px = Math.round((H2mm || 0) * pxPerMm);
                                            const x0 = fX, y0 = fY;
                                            // Rimuovo rect/freeLine shape preesistenti
                                            const elsKept = els.filter((e: any) => e.type !== "rect" && !e._isFromShape && e.type !== "freeLine");
                                            const newEls: any[] = [];
                                            const t0 = Date.now();
                                            if (shapePicker.shape === "casetta") {
                                              // Pentagono: SX-base, SX-spalla, COLMO, DX-spalla, DX-base
                                              const xL = x0, xR = x0 + Lpx;
                                              const yBase = y0 + H2px + Hpx;
                                              const ySpalla = y0 + H2px;
                                              const xColmo = x0 + Lpx / 2;
                                              const yColmo = y0;
                                              // 5 freeLine identiche a quelle utente Tel.Lib. (renderer applica TK_FRAME + miter)
                                              const pts = [
                                                { x: xL, y: yBase }, { x: xL, y: ySpalla }, { x: xColmo, y: yColmo },
                                                { x: xR, y: ySpalla }, { x: xR, y: yBase }, { x: xL, y: yBase }
                                              ];
                                              for (let i = 0; i < pts.length - 1; i++) {
                                                newEls.push({ id: t0 + i, type: "freeLine", x1: pts[i].x, y1: pts[i].y, x2: pts[i+1].x, y2: pts[i+1].y });
                                              }
                                            } else if (shapePicker.shape && shapePicker.shape.startsWith("arco_")) {
                                              // ARCHI BASE: piedritto SX -> curva top -> piedritto DX -> base
                                              const xL = x0, xR = x0 + Lpx;
                                              const cxA = x0 + Lpx / 2;
                                              const SEGS = 24;
                                              // Calcolo freccia in base al tipo
                                              let frec = H2px;
                                              if (shapePicker.shape === "arco_tutto_sesto") frec = Lpx / 2;
                                              const yBase = y0 + frec + Hpx;
                                              const ySpalla = y0 + frec;
                                              // Piedritto SX
                                              newEls.push({ id: t0, type: "freeLine", x1: xL, y1: yBase, x2: xL, y2: ySpalla });
                                              if (shapePicker.shape === "arco_3_centri") {
                                                // ARCO A 3 CENTRI: 2 archi piccoli ai lati + 1 arco centrale grande
                                                // Raggio laterale: utente lo specifica via H3, default 60% freccia
                                                const rlMm = parseFloat(shapePicker.H3) || frec * 0.6 / pxPerMm;
                                                const rl = rlMm * pxPerMm;
                                                const rc = frec * 1.5;
                                                const yColmo = ySpalla - frec;
                                                // Centri laterali: a quota ySpalla, a distanza rl da xL e xR
                                                const cxLat1 = xL + rl;
                                                const cxLat2 = xR - rl;
                                                // Arco SX (90° -> tangente alla verticale)
                                                const SEGS_LAT = 8;
                                                for (let i = 0; i < SEGS_LAT; i++) {
                                                  const t1 = i / SEGS_LAT, t2 = (i + 1) / SEGS_LAT;
                                                  const a1 = Math.PI - (Math.PI / 4) * t1;
                                                  const a2 = Math.PI - (Math.PI / 4) * t2;
                                                  const x1a = cxLat1 + rl * Math.cos(a1);
                                                  const y1a = ySpalla + rl * Math.sin(a1) - rl;
                                                  const x2a = cxLat1 + rl * Math.cos(a2);
                                                  const y2a = ySpalla + rl * Math.sin(a2) - rl;
                                                  newEls.push({ id: t0 + 1 + i, type: "freeLine", x1: x1a, y1: y1a, x2: x2a, y2: y2a });
                                                }
                                                // Arco centrale (riempie il gap tra i due archi laterali)
                                                const xMidL = cxLat1 + rl * Math.cos(Math.PI - Math.PI/4);
                                                const yMidL = ySpalla + rl * Math.sin(Math.PI - Math.PI/4) - rl;
                                                const xMidR = cxLat2 + rl * Math.cos(Math.PI/4);
                                                const yMidR = ySpalla + rl * Math.sin(Math.PI/4) - rl;
                                                const SEGS_CTR = 12;
                                                for (let i = 0; i < SEGS_CTR; i++) {
                                                  const t1 = i / SEGS_CTR, t2 = (i + 1) / SEGS_CTR;
                                                  const x1a = xMidL + (xMidR - xMidL) * t1;
                                                  const x2a = xMidL + (xMidR - xMidL) * t2;
                                                  // Curvatura quadratica passante per (cxA, yColmo)
                                                  const tt1 = (x1a - xMidL) / (xMidR - xMidL);
                                                  const tt2 = (x2a - xMidL) / (xMidR - xMidL);
                                                  const interpY = (tt: number) => {
                                                    const ya = (1-tt)*(1-tt)*yMidL + 2*(1-tt)*tt*yColmo + tt*tt*yMidR;
                                                    return ya;
                                                  };
                                                  newEls.push({ id: t0 + 50 + i, type: "freeLine", x1: x1a, y1: interpY(tt1), x2: x2a, y2: interpY(tt2) });
                                                }
                                                // Arco DX
                                                for (let i = 0; i < SEGS_LAT; i++) {
                                                  const t1 = i / SEGS_LAT, t2 = (i + 1) / SEGS_LAT;
                                                  const a1 = (Math.PI / 4) - (Math.PI / 4) * t1;
                                                  const a2 = (Math.PI / 4) - (Math.PI / 4) * t2;
                                                  const x1a = cxLat2 + rl * Math.cos(a1);
                                                  const y1a = ySpalla + rl * Math.sin(a1) - rl;
                                                  const x2a = cxLat2 + rl * Math.cos(a2);
                                                  const y2a = ySpalla + rl * Math.sin(a2) - rl;
                                                  newEls.push({ id: t0 + 100 + i, type: "freeLine", x1: x1a, y1: y1a, x2: x2a, y2: y2a });
                                                }
                                              } else if (shapePicker.shape === "arco_ellittico") {
                                                // ELLISSE: semi-asse orizz = L/2, semi-asse vert = freccia
                                                const a = Lpx / 2;
                                                const b = frec;
                                                const SEGS_E = 32;
                                                for (let i = 0; i < SEGS_E; i++) {
                                                  const ang1 = Math.PI - (Math.PI * i) / SEGS_E;
                                                  const ang2 = Math.PI - (Math.PI * (i + 1)) / SEGS_E;
                                                  const x1a = cxA + a * Math.cos(ang1);
                                                  const y1a = ySpalla - b * Math.sin(ang1);
                                                  const x2a = cxA + a * Math.cos(ang2);
                                                  const y2a = ySpalla - b * Math.sin(ang2);
                                                  newEls.push({ id: t0 + 1 + i, type: "freeLine", x1: x1a, y1: y1a, x2: x2a, y2: y2a });
                                                }
                                              } else if (shapePicker.shape === "arco_policentrico") {
                                                // POLICENTRICO 5 archi: come ellittico ma più armonico
                                                // Uso una curva super-ellittica con n=2.5 (più "panciuta" di un'ellisse)
                                                const a = Lpx / 2;
                                                const b = frec;
                                                const SEGS_P = 36;
                                                for (let i = 0; i < SEGS_P; i++) {
                                                  const ang1 = Math.PI - (Math.PI * i) / SEGS_P;
                                                  const ang2 = Math.PI - (Math.PI * (i + 1)) / SEGS_P;
                                                  const sgn = (v: number) => v >= 0 ? 1 : -1;
                                                  const supX = (ang: number) => sgn(Math.cos(ang)) * Math.pow(Math.abs(Math.cos(ang)), 2/2.5) * a;
                                                  const supY = (ang: number) => Math.pow(Math.abs(Math.sin(ang)), 2/2.5) * b;
                                                  const x1a = cxA + supX(ang1);
                                                  const y1a = ySpalla - supY(ang1);
                                                  const x2a = cxA + supX(ang2);
                                                  const y2a = ySpalla - supY(ang2);
                                                  newEls.push({ id: t0 + 1 + i, type: "freeLine", x1: x1a, y1: y1a, x2: x2a, y2: y2a });
                                                }
                                              } else if (shapePicker.shape === "arco_asimmetrico") {
                                                // ARCO ASIMMETRICO: H = spalla SX, H4 = spalla DX, freccia da punto piu alto
                                                const Hsx_px = Hpx; // gia calcolato
                                                const Hdx_px = (parseFloat(shapePicker.H4) || 1200) * pxPerMm;
                                                const xL = x0, xR = x0 + Lpx;
                                                // Spalla piu alta determina il colmo
                                                const ySpallaSX = y0 + frec + (Math.max(Hsx_px, Hdx_px) - Hsx_px);
                                                const ySpallaDX = y0 + frec + (Math.max(Hsx_px, Hdx_px) - Hdx_px);
                                                const yBaseSX = ySpallaSX + Hsx_px;
                                                const yBaseDX = ySpallaDX + Hdx_px;
                                                const yColmo = y0;
                                                const xColmo = x0 + Lpx / 2;
                                                // Curva ellittica asimmetrica: 2 archi quadratici verso il colmo
                                                const SEGS_A = 16;
                                                // Lato SX
                                                for (let i = 0; i < SEGS_A; i++) {
                                                  const t1 = i / SEGS_A, t2 = (i + 1) / SEGS_A;
                                                  const interp = (t: number) => ({
                                                    x: (1-t)*(1-t)*xL + 2*(1-t)*t*xL + t*t*xColmo,
                                                    y: (1-t)*(1-t)*ySpallaSX + 2*(1-t)*t*yColmo + t*t*yColmo
                                                  });
                                                  const p1 = interp(t1), p2 = interp(t2);
                                                  newEls.push({ id: t0 + 1 + i, type: "freeLine", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
                                                }
                                                // Lato DX
                                                for (let i = 0; i < SEGS_A; i++) {
                                                  const t1 = i / SEGS_A, t2 = (i + 1) / SEGS_A;
                                                  const interp = (t: number) => ({
                                                    x: (1-t)*(1-t)*xColmo + 2*(1-t)*t*xR + t*t*xR,
                                                    y: (1-t)*(1-t)*yColmo + 2*(1-t)*t*yColmo + t*t*ySpallaDX
                                                  });
                                                  const p1 = interp(t1), p2 = interp(t2);
                                                  newEls.push({ id: t0 + 50 + i, type: "freeLine", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
                                                }
                                                // Override piedritti e base perche asimmetrici
                                                newEls.push({ id: t0 + 200, type: "freeLine", x1: xL, y1: ySpallaSX, x2: xL, y2: yBaseSX });
                                                newEls.push({ id: t0 + 201, type: "freeLine", x1: xR, y1: ySpallaDX, x2: xR, y2: yBaseDX });
                                                newEls.push({ id: t0 + 202, type: "freeLine", x1: xL, y1: yBaseSX, x2: xR, y2: yBaseDX });
                                                // Skip piedritto/base default che venivano dopo - usiamo return implicito
                                                setDW([...elsKept, ...newEls]);
                                                setShapePicker(null);
                                                return;
                                              } else if (shapePicker.shape === "arco_spezzato") {
                                                // SPEZZATO: 2 segmenti retti che formano la punta
                                                const xL = x0, xR = x0 + Lpx;
                                                const xPunta = x0 + (parseFloat(shapePicker.H4) || Lpx/pxPerMm/2) * pxPerMm;
                                                const ySpalla = y0 + frec;
                                                const yBase = ySpalla + Hpx;
                                                const yPunta = y0;
                                                // Lato spezzato SX (1 segmento)
                                                newEls.push({ id: t0 + 1, type: "freeLine", x1: xL, y1: ySpalla, x2: xPunta, y2: yPunta });
                                                // Lato spezzato DX (1 segmento)
                                                newEls.push({ id: t0 + 2, type: "freeLine", x1: xPunta, y1: yPunta, x2: xR, y2: ySpalla });
                                                // Piedritti DX e base
                                                newEls.push({ id: t0 + 200, type: "freeLine", x1: xR, y1: ySpalla, x2: xR, y2: yBase });
                                                newEls.push({ id: t0 + 201, type: "freeLine", x1: xR, y1: yBase, x2: xL, y2: yBase });
                                                // Piedritto SX
                                                newEls.unshift({ id: t0, type: "freeLine", x1: xL, y1: yBase, x2: xL, y2: ySpalla });
                                                setDW([...elsKept, ...newEls]);
                                                setShapePicker(null);
                                                return;
                                              } else if (shapePicker.shape === "arco_ribassato_piedritti") {
                                                // RIBASSATO + PIEDRITTI ALTI: stesso algoritmo del ribassato standard, ma H grande
                                                // Cade nella branch generica di sotto perche frec < L/2 e arco circolare
                                                // Forzo trattamento come ribassato standard
                                                shapePicker.shape = "arco_ribassato"; // hack: tratta come ribassato
                                              } else if (shapePicker.shape === "arco_acuto") {
                                                // 2 archi che si incontrano in punta. Centri ai piedritti opposti, raggio = L
                                                const yPunta = y0;
                                                // Arco SX: centro DX, raggio L
                                                for (let i = 0; i < SEGS / 2; i++) {
                                                  // Interpolo lineare tra (xL, ySpalla) e (cxA, yPunta) con curvatura
                                                  const t1 = i / (SEGS / 2);
                                                  const t2 = (i + 1) / (SEGS / 2);
                                                  const interp = (t: number) => {
                                                    // Quadratic Bezier verso il control point (xL, yPunta)
                                                    const px = (1-t)*(1-t)*xL + 2*(1-t)*t*xL + t*t*cxA;
                                                    const py = (1-t)*(1-t)*ySpalla + 2*(1-t)*t*yPunta + t*t*yPunta;
                                                    return { x: px, y: py };
                                                  };
                                                  const p1 = interp(t1), p2 = interp(t2);
                                                  newEls.push({ id: t0 + 1 + i, type: "freeLine", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
                                                }
                                                // Arco DX
                                                for (let i = 0; i < SEGS / 2; i++) {
                                                  const t1 = i / (SEGS / 2);
                                                  const t2 = (i + 1) / (SEGS / 2);
                                                  const interp = (t: number) => {
                                                    const px = (1-t)*(1-t)*cxA + 2*(1-t)*t*xR + t*t*xR;
                                                    const py = (1-t)*(1-t)*yPunta + 2*(1-t)*t*yPunta + t*t*ySpalla;
                                                    return { x: px, y: py };
                                                  };
                                                  const p1 = interp(t1), p2 = interp(t2);
                                                  newEls.push({ id: t0 + 50 + i, type: "freeLine", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
                                                }
                                              } else {
                                                // arco_tutto_sesto / ribassato / rialzato: arco circolare con freccia variabile
                                                const yColmo = ySpalla - frec;
                                                // Calcolo centro e raggio del cerchio passante per (xL, ySpalla), (cxA, yColmo), (xR, ySpalla)
                                                // Per simmetria: centro = (cxA, ySpalla + yc), dove yc si trova dalla equazione
                                                // (Lpx/2)^2 + (yc)^2 = (frec + yc)^2 -> yc = (Lpx^2/4 - frec^2) / (2*frec)
                                                const halfL = Lpx / 2;
                                                if (frec <= 0) frec = 1; // safeguard
                                                const yc = (halfL * halfL - frec * frec) / (2 * frec);
                                                const cxC = cxA;
                                                const cyC = ySpalla + yc;
                                                const R = Math.sqrt(halfL * halfL + yc * yc);
                                                // Angoli da xL (a sinistra del centro) a xR (a destra)
                                                const angL = Math.atan2(ySpalla - cyC, xL - cxC);
                                                const angR = Math.atan2(ySpalla - cyC, xR - cxC);
                                                // Per archi rialzati (yc < 0) il centro e' SOTTO la spalla -> arco passa SOPRA
                                                // per ribassati (yc > 0) il centro e' SOPRA la spalla -> arco corto
                                                // L'arco DEVE passare per il colmo (cxA, yColmo)
                                                // Per andare dalla spalla SX al colmo al spalla DX, l'angolo va da angL (Pi-something) attraverso Pi/2 verso angR
                                                // Calcolo l'angolo del colmo
                                                const angTop = Math.atan2(yColmo - cyC, cxC - cxC); // sempre verticale, ma cos(0)=1
                                                // Genera punti in modo che attraversino il colmo
                                                for (let i = 0; i < SEGS; i++) {
                                                  const t1 = i / SEGS;
                                                  const t2 = (i + 1) / SEGS;
                                                  // Interpolo l'angolo: parto da angL e vado verso angR passando per angolo del colmo
                                                  // Per un cerchio: angolo del colmo è -PI/2 (verso l'alto) se cyC > yColmo
                                                  const aTop = -Math.PI / 2;
                                                  // angL > aTop > angR di solito; vado in linea retta da angL a angR
                                                  // Ma se l'arco va sopra il centro, devo fare percorso passante per aTop
                                                  // Soluzione semplice: genero pt usando atan2 diretto
                                                  const a1 = angL + (angR - angL) * t1;
                                                  const a2 = angL + (angR - angL) * t2;
                                                  // FIX: invece di interp lineare angoli, interpolo come il cerchio "naturale"
                                                  // Uso il fatto che y deve raggiungere yColmo a t=0.5
                                                  // Approccio diretto: param x da xL a xR, y dal cerchio
                                                  const x1param = xL + (xR - xL) * t1;
                                                  const x2param = xL + (xR - xL) * t2;
                                                  const dx1 = x1param - cxC;
                                                  const dy1sq = R * R - dx1 * dx1;
                                                  const y1param = cyC - Math.sqrt(Math.max(0, dy1sq));
                                                  const dx2 = x2param - cxC;
                                                  const dy2sq = R * R - dx2 * dx2;
                                                  const y2param = cyC - Math.sqrt(Math.max(0, dy2sq));
                                                  newEls.push({ id: t0 + 1 + i, type: "freeLine", x1: x1param, y1: y1param, x2: x2param, y2: y2param });
                                                }
                                              }
                                              // Piedritto DX
                                              newEls.push({ id: t0 + 200, type: "freeLine", x1: xR, y1: ySpalla, x2: xR, y2: yBase });
                                              // Base
                                              newEls.push({ id: t0 + 201, type: "freeLine", x1: xR, y1: yBase, x2: xL, y2: yBase });
                                            } else if (shapePicker.shape === "trapezio") {
                                              const xL = x0, xR = x0 + Lpx;
                                              const yBase = y0 + Math.max(Hpx, H2px);
                                              const ySX = yBase - Hpx;
                                              const yDX = yBase - H2px;
                                              const pts = [
                                                { x: xL, y: yBase }, { x: xL, y: ySX }, { x: xR, y: yDX }, { x: xR, y: yBase }, { x: xL, y: yBase }
                                              ];
                                              for (let i = 0; i < pts.length - 1; i++) {
                                                newEls.push({ id: t0 + i, type: "freeLine", x1: pts[i].x, y1: pts[i].y, x2: pts[i+1].x, y2: pts[i+1].y });
                                              }
                                            }
                                            setDW([...elsKept, ...newEls]);
                                            setShapePicker(null);
                                          }} style={{ padding: "12px", borderRadius: 8, background: "#1A9E73", textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 800, color: "#fff" }}>Crea forma</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Modal SELETTORE VETRI INTELLIGENTE */}
                              <SelettoreVetri
                                open={showSelettoreVetri}
                                onClose={() => setShowSelettoreVetri(false)}
                                currentVetroId={selectedVetro?.id}
                                onSelect={(v) => {
                                  setSelectedVetro(v);
                                  setShowSelettoreVetri(false);
                                  setMode({ drawMode: "place-vetro", _pendingLine: null });
                                }}
                              />

                              {/* Modal SELETTORE PROFILO (catalogo articoli) */}
                              <SelettoreProfilo
                                open={showSelettoreProfilo}
                                onClose={() => { setShowSelettoreProfilo(false); setProfiloTargetEl(null); }}
                                ruolo={profiloTargetEl?.ruolo}
                                vanoSistema={vanoSistema}
                                onSelect={(p) => {
                                  if (!profiloTargetEl) { setShowSelettoreProfilo(false); return; }
                                  // Applica il profilo all'elemento target
                                  const newEls = els.map((e: any) => {
                                    if (e.id !== profiloTargetEl.id) return e;
                                    return {
                                      ...e,
                                      profilo_id: p.id,
                                      profilo_codice: p.codice,
                                      profilo_descrizione: p.descrizione,
                                      profilo_prezzo_ml: p.prezzo_ml,
                                      profilo_larghezza: p.larghezza_mm,
                                      profilo_altezza: p.altezza_mm,
                                    };
                                  });
                                  setDW(newEls);
                                  setShowSelettoreProfilo(false);
                                  setProfiloTargetEl(null);
                                }}
                              />

                              {/* Modal SELETTORE NODO COSTRUTTIVO */}
                              <SelettoreNodo
                                open={showSelettoreNodo}
                                onClose={() => { setShowSelettoreNodo(false); setNodoTarget(null); }}
                                profiliCoinvolti={nodoTarget?.profili}
                                vanoSistema={vanoSistema}
                                currentNodoId={nodoTarget ? (dw._nodi || []).find((n: any) => n.key === nodoTarget.key)?.nodo_id : null}
                                onSelect={(n) => {
                                  if (!nodoTarget) { setShowSelettoreNodo(false); return; }
                                  // Salva nodo nel campo dw._nodi
                                  const existing = dw._nodi || [];
                                  const newNodi = existing.filter((x: any) => x.key !== nodoTarget.key);
                                  newNodi.push({
                                    key: nodoTarget.key,
                                    x: nodoTarget.x, y: nodoTarget.y,
                                    profili: nodoTarget.profili,
                                    nodo_id: n.id,
                                    nodo_nome: n.nome,
                                    nodo_tipo: n.tipo,
                                    pdf_url: n.pdf_url,
                                    dxf_url: n.dxf_url,
                                  });
                                  onUpdate({ ...dw, _nodi: newNodi });
                                  setShowSelettoreNodo(false);
                                  setNodoTarget(null);
                                }}
                              />

                              {/* Modal CATALOGO ACCESSORI */}
                              {showCatalogo && (
                                <div onClick={() => setShowCatalogo(false)}
                                  style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "min(94vw, 540px)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
                                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                      <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73" }}>📦 Catalogo Accessori</div>
                                        <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{catalogoData.length} articoli · seleziona e tap sul disegno</div>
                                      </div>
                                      <div onClick={() => setShowCatalogo(false)} style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#666" }}>✕</div>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                                      {catalogoData.length === 0 ? (
                                        <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: "#888" }}>
                                          Caricamento catalogo...<br/>
                                          <span style={{ fontSize: 9, color: "#aaa" }}>Se persiste, controlla `/api/catalogo-accessori`</span>
                                        </div>
                                      ) : (
                                        catalogoData
                                          .filter((a: any) => a.attivo !== false)
                                          .filter((a: any) => !vanoSistema || !a.compatibile_serie || (Array.isArray(a.compatibile_serie) && a.compatibile_serie.length === 0) || (Array.isArray(a.compatibile_serie) && a.compatibile_serie.includes(vanoSistema)))
                                          .map((a: any) => (
                                            <div key={a.id} onClick={() => { setPendingCatAcc(a); setShowCatalogo(false); setMode({ drawMode: "place-catalogo", _pendingLine: null }); }}
                                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}>
                                              <div style={{ width: 44, height: 44, flexShrink: 0, border: "1px solid #eee", borderRadius: 6, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {a.immagine_url ? (
                                                  <img src={a.immagine_url} alt={a.nome} style={{ maxWidth: 40, maxHeight: 40 }} />
                                                ) : (
                                                  <div style={{ fontSize: 9, color: "#bbb", fontWeight: 700 }}>{(a.categoria || "?").substring(0, 3).toUpperCase()}</div>
                                                )}
                                              </div>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                                                <div style={{ fontSize: 9, color: "#888", marginTop: 2, display: "flex", gap: 8 }}>
                                                  {a.codice && <span style={{ fontFamily: "monospace" }}>{a.codice}</span>}
                                                  {a.fornitore && <span>· {a.fornitore}</span>}
                                                  {a.categoria && <span style={{ background: "#f0efe8", padding: "1px 5px", borderRadius: 3 }}>{a.categoria}</span>}
                                                </div>
                                              </div>
                                              <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: "#1A9E73" }}>
                                                {a.prezzo_unitario ? `€${(a.prezzo_unitario as number).toFixed(2)}` : a.prezzo ? `€${(a.prezzo as number).toFixed(2)}` : "—"}
                                              </div>
                                            </div>
                                          ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Modal GESTIONE TIPOLOGIE */}
                              <GestioneTipologie
                                open={showGestioneTipo}
                                onClose={() => setShowGestioneTipo(false)}
                                onSelect={(t) => {
                                  // Carica il disegno della tipologia nel vano corrente
                                  if (t.disegno && t.disegno.elements) {
                                    if (confirm(`Caricare la tipologia "${t.nome}" nel vano corrente?\n\n⚠ Il disegno attuale verrà sostituito.`)) {
                                      onUpdate({ ...dw, elements: t.disegno.elements, _articoli: t.disegno._articoli || {} });
                                      if (onUpdateField) {
                                        onUpdateField("tipologia_id", t.id);
                                        onUpdateField("tipologia_nome", t.nome);
                                      }
                                      setShowGestioneTipo(false);
                                    }
                                  }
                                }}
                              />

                              {/* Modal SALVA TIPOLOGIA */}
                              {savingTipologia && savingTipologia.open && (
                                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
                                  onClick={() => { setSavingTipologia(null); setSavingTipoStatus(""); }}>
                                  <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, minWidth: 300, maxWidth: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73", marginBottom: 4 }}>{(savingTipologia as any).id ? "✏️ Modifica tipologia" : "💾 Salva come tipologia"}</div>
                                    <div style={{ fontSize: 10, color: "#888", marginBottom: 14 }}>{(savingTipologia as any).id ? "Aggiornamento tipologia esistente" : "Il disegno sarà disponibile in libreria per altri vani"}</div>
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Nome tipologia *</div>
                                      <input type="text" value={savingTipologia.nome} onChange={(e) => setSavingTipologia({ ...savingTipologia, nome: e.target.value })}
                                        placeholder="es. Bilico 1 anta DX"
                                        style={{ width: "100%", padding: "8px 10px", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd", borderRadius: 6 }} />
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Categoria</div>
                                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                        {["Finestre", "Balconi", "Scorrevoli", "Porte", "Altro"].map(cat => (
                                          <div key={cat} onClick={() => setSavingTipologia({ ...savingTipologia, categoria: cat })}
                                            style={{
                                              padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                              background: savingTipologia.categoria === cat ? "#1A9E73" : "#fff",
                                              color: savingTipologia.categoria === cat ? "#fff" : "#666",
                                              border: `1.5px solid ${savingTipologia.categoria === cat ? "#1A9E73" : "#ddd"}`,
                                            }}>{cat}</div>
                                        ))}
                                      </div>
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>N° ante (opz.)</div>
                                      <input type="number" value={savingTipologia.n_ante} onChange={(e) => setSavingTipologia({ ...savingTipologia, n_ante: e.target.value })}
                                        placeholder="es. 2" min="1" max="10"
                                        style={{ width: "100%", padding: "8px 10px", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd", borderRadius: 6, fontFamily: "monospace" }} />
                                    </div>
                                    <div style={{ marginBottom: 14 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: "#666", marginBottom: 3 }}>Note (opz.)</div>
                                      <textarea value={savingTipologia.note} onChange={(e) => setSavingTipologia({ ...savingTipologia, note: e.target.value })}
                                        placeholder="Apertura DX, vetro doppio, ecc."
                                        style={{ width: "100%", padding: "8px 10px", fontSize: 11, border: "1.5px solid #ddd", borderRadius: 6, minHeight: 50, resize: "vertical", fontFamily: "inherit" }} />
                                    </div>
                                    {savingTipoStatus && (
                                      <div style={{ padding: 8, marginBottom: 10, borderRadius: 6, fontSize: 10, fontWeight: 600,
                                        background: savingTipoStatus.startsWith("OK") ? "#1A9E7315" : "#DC444415",
                                        color: savingTipoStatus.startsWith("OK") ? "#1A9E73" : "#DC4444",
                                      }}>{savingTipoStatus}</div>
                                    )}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                                      <div onClick={() => { setSavingTipologia(null); setSavingTipoStatus(""); }} style={{ padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Annulla</div>
                                      <div onClick={async () => {
                                        if (!savingTipologia.nome.trim()) { setSavingTipoStatus("⚠ Nome obbligatorio"); return; }
                                        setSavingTipoStatus("Salvataggio in corso...");
                                        try {
                                          // ── GENERAZIONE THUMBNAIL SVG ──
                                          const els = dw.elements || [];
                                          let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
                                          els.forEach((e: any) => {
                                            if (e.x !== undefined && e.w !== undefined) {
                                              xMin = Math.min(xMin, e.x); xMax = Math.max(xMax, e.x + e.w);
                                              yMin = Math.min(yMin, e.y); yMax = Math.max(yMax, e.y + e.h);
                                            } else if (e.x1 !== undefined) {
                                              xMin = Math.min(xMin, e.x1, e.x2); xMax = Math.max(xMax, e.x1, e.x2);
                                              yMin = Math.min(yMin, e.y1, e.y2); yMax = Math.max(yMax, e.y1, e.y2);
                                            }
                                          });
                                          let thumbnail = "";
                                          if (isFinite(xMin)) {
                                            const padT = 10;
                                            const tW = (xMax - xMin) + padT * 2;
                                            const tH = (yMax - yMin) + padT * 2;
                                            const shapes: string[] = [];
                                            els.forEach((e: any) => {
                                              if (e.type === "rect") {
                                                shapes.push(`<rect x="${e.x-xMin+padT}" y="${e.y-yMin+padT}" width="${e.w}" height="${e.h}" fill="#f0efe8" stroke="#3A3A3C" stroke-width="2"/>`);
                                              } else if (e.type === "freeLine" && !e.subType) {
                                                shapes.push(`<line x1="${e.x1-xMin+padT}" y1="${e.y1-yMin+padT}" x2="${e.x2-xMin+padT}" y2="${e.y2-yMin+padT}" stroke="#3A3A3C" stroke-width="3"/>`);
                                              } else if (e.type === "freeLine" && e.subType) {
                                                shapes.push(`<line x1="${e.x1-xMin+padT}" y1="${e.y1-yMin+padT}" x2="${e.x2-xMin+padT}" y2="${e.y2-yMin+padT}" stroke="#888" stroke-width="2"/>`);
                                              } else if (e.type === "innerRect") {
                                                shapes.push(`<rect x="${e.x-xMin+padT}" y="${e.y-yMin+padT}" width="${e.w}" height="${e.h}" fill="#f8f8f6" stroke="#3A3A3C" stroke-width="1.5"/>`);
                                              } else if (e.type === "montante") {
                                                const my1 = e.y1 ?? yMin, my2 = e.y2 ?? yMax;
                                                shapes.push(`<line x1="${e.x-xMin+padT}" y1="${my1-yMin+padT}" x2="${e.x-xMin+padT}" y2="${my2-yMin+padT}" stroke="#3A3A3C" stroke-width="6"/>`);
                                              } else if (e.type === "traverso") {
                                                const tx1 = e.x1 ?? xMin, tx2 = e.x2 ?? xMax;
                                                shapes.push(`<line x1="${tx1-xMin+padT}" y1="${e.y-yMin+padT}" x2="${tx2-xMin+padT}" y2="${e.y-yMin+padT}" stroke="#3A3A3C" stroke-width="6"/>`);
                                              }
                                            });
                                            thumbnail = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tW} ${tH}" width="120" height="${Math.round(120*tH/tW)}">${shapes.join("")}</svg>`;
                                          }
                                          // ──────────────────────────────────
                                          const payload: any = {
                                            nome: savingTipologia.nome.trim(),
                                            categoria: savingTipologia.categoria,
                                            n_ante: savingTipologia.n_ante ? parseInt(savingTipologia.n_ante) : null,
                                            note: savingTipologia.note.trim() || null,
                                            disegno: { elements: dw.elements || [], realW, realH, _articoli: dw._articoli || {} },
                                            dimensioni_default: `${realW}x${realH}`,
                                            thumbnail,
                                            sistemi_compatibili: vanoSistema ? [vanoSistema] : [],
                                            attivo: true,
                                          };
                                          // EDIT modalità: se savingTipologia ha id, fa PATCH invece di POST
                                          const editId = (savingTipologia as any).id;
                                          if (editId) payload.id = editId;
                                          const res = await fetch("/api/tipologie-infisso", {
                                            method: editId ? "PATCH" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(payload),
                                          });
                                          if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                          setSavingTipoStatus(`OK Tipologia "${savingTipologia.nome}" salvata`);
                                          setTimeout(() => { setSavingTipologia(null); setSavingTipoStatus(""); }, 1500);
                                        } catch (err: any) {
                                          setSavingTipoStatus(`Errore: ${err.message}`);
                                        }
                                      }} style={{ padding: "10px", borderRadius: 8, background: "#1A9E73", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff" }}>💾 Salva tipologia</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {cornerEdit && (() => {
                                const ce: any = cornerEdit;
                                // Caso ANTA: angolo singolo di un polyAnta
                                if (ce.antaId !== undefined) {
                                  const antaEl = (dw.elements || []).find((e: any) => e.id === ce.antaId);
                                  if (!antaEl) return null;
                                  const acm = antaEl.cornerModes || {};
                                  const curMode = acm[ce.antaCorner] || '45';
                                  const apply = (m: string) => {
                                    const upd = (dw.elements || []).map((e: any) => {
                                      if (e.id !== ce.antaId) return e;
                                      const newCm = { ...(e.cornerModes || {}) };
                                      newCm[ce.antaCorner] = m;
                                      return { ...e, cornerModes: newCm, _userSetCorners: true };
                                    });
                                    setDW(upd);
                                    setCornerEdit(null);
                                  };
                                  const CornerIcon = ({ m, active }: any) => {
                                    const V_C = "#1A9E73", H_C = "#D08008", BG = active ? "#fff" : "#888";
                                    const sw = 5;
                                    if (m === 'V') return (<svg width="40" height="40" viewBox="0 0 40 40"><rect x="6" y="6" width={sw} height="28" fill={active ? "#fff" : V_C} /><rect x="11" y="6" width="23" height={sw} fill={active ? "#fff" : H_C} /></svg>);
                                    if (m === 'H') return (<svg width="40" height="40" viewBox="0 0 40 40"><rect x="6" y="6" width="28" height={sw} fill={active ? "#fff" : H_C} /><rect x="6" y="11" width={sw} height="23" fill={active ? "#fff" : V_C} /></svg>);
                                    if (m === '45') return (<svg width="40" height="40" viewBox="0 0 40 40"><polygon points="11,6 34,6 34,11 11,11" fill={active ? "#fff" : H_C} /><polygon points="6,11 11,11 11,34 6,34" fill={active ? "#fff" : V_C} /><line x1="6" y1="11" x2="11" y2="6" stroke={active ? "#fff" : "#1A1A1C"} strokeWidth="1.5" /></svg>);
                                    return (<svg width="40" height="40" viewBox="0 0 40 40"><rect x="6" y="6" width="28" height={sw} fill={active ? "#fff" : BG} opacity="0.4"/><rect x="6" y="6" width={sw} height="28" fill={active ? "#fff" : BG} opacity="0.4"/><text x="20" y="28" textAnchor="middle" fontSize="14" fontWeight="900" fill={active ? "#fff" : BG}>?</text></svg>);
                                  };
                                  const Btn = ({ m, hint, color }: any) => (
                                    <div onClick={() => apply(m)}
                                      style={{ flex: 1, padding: "12px 4px 8px", borderRadius: 10, background: curMode === m ? color : "#F2F1EC", border: curMode === m ? `2px solid ${color}` : "1.5px solid #ddd", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                      <CornerIcon m={m} active={curMode === m} />
                                      <div style={{ fontSize: 9, fontWeight: 700, color: curMode === m ? "#fff" : "#1A1A1C", opacity: 0.9 }}>{hint}</div>
                                    </div>
                                  );
                                  return (
                                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}
                                      onClick={() => { const ce: any = cornerEdit; if (ce && ce._t && Date.now() - ce._t < 800) return; setCornerEdit(null); }}
                                      >
                                      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}
                                        onClick={e => e.stopPropagation()}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1C" }}>📐 Angolo anta</div>
                                        <div style={{ fontSize: 11, color: "#888" }}>Default: taglio 45°</div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                          <Btn m="V" hint="Vert. vince" color="#1A9E73" />
                                          <Btn m="H" hint="Oriz. vince" color="#D08008" />
                                          <Btn m="45" hint="Taglio 45°" color="#3B7FE0" />
                                          <Btn m="auto" hint="Squadra" color="#666" />
                                        </div>
                                        <div onClick={() => setCornerEdit(null)} style={{ padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Chiudi</div>
                                      </div>
                                    </div>
                                  );
                                }
                                // Caso TELAIO (esistente)
                                const flAll = (dw.elements || []).filter((e: any) => e.type === "freeLine" && !e.subType);
                                const tol = 2;
                                const refs: any[] = [];
                                flAll.forEach((l: any) => {
                                  if (Math.abs(l.x1 - cornerEdit.vx) < tol && Math.abs(l.y1 - cornerEdit.vy) < tol) refs.push({ id: l.id, which: 'start', line: l });
                                  if (Math.abs(l.x2 - cornerEdit.vx) < tol && Math.abs(l.y2 - cornerEdit.vy) < tol) refs.push({ id: l.id, which: 'end', line: l });
                                });
                                if (refs.length < 2) return null;
                                let curMode = 'auto';
                                for (const r of refs) {
                                  const cm = (r.line.cornerModes || {})[r.which];
                                  if (cm && cm !== 'auto') { curMode = cm; break; }
                                }
                                const isVert = (l: any) => Math.abs(l.x2 - l.x1) < Math.abs(l.y2 - l.y1);
                                const apply = (m: string) => {
                                  const upd = (dw.elements || []).map((e: any) => {
                                    const myRefs = refs.filter((rr: any) => rr.id === e.id);
                                    if (myRefs.length === 0) return e;
                                    const newCm = { ...(e.cornerModes || {}) };
                                    myRefs.forEach((r: any) => {
                                      if (m === 'auto') newCm[r.which] = 'auto';
                                      else if (m === '45') newCm[r.which] = '45';
                                      else if (m === 'V') newCm[r.which] = isVert(e) ? 'V' : 'H';
                                      else if (m === 'H') newCm[r.which] = isVert(e) ? 'H' : 'V';
                                      // Pulisci flag _hidden quando l'utente sceglie un mode esplicito
                                      delete newCm[`${r.which}_hidden`];
                                    });
                                    return { ...e, cornerModes: newCm };
                                  });
                                  setDW(upd);
                                  setCornerEdit(null);
                                };
                                const CornerIcon = ({ m, active }: any) => {
                                  // 36x36 viewBox, mostra angolo top-left del telaio (V=verde verticale, H=ambra orizzontale)
                                  const V_C = "#1A9E73", H_C = "#D08008", BG = active ? "#fff" : "#888";
                                  const sw = 5;
                                  if (m === 'V') return (
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                      <rect x="6" y="6" width={sw} height="28" fill={active ? "#fff" : V_C} />
                                      <rect x="11" y="6" width="23" height={sw} fill={active ? "#fff" : H_C} />
                                    </svg>
                                  );
                                  if (m === 'H') return (
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                      <rect x="6" y="6" width="28" height={sw} fill={active ? "#fff" : H_C} />
                                      <rect x="6" y="11" width={sw} height="23" fill={active ? "#fff" : V_C} />
                                    </svg>
                                  );
                                  if (m === '45') return (
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                      <polygon points="11,6 34,6 34,11 11,11" fill={active ? "#fff" : H_C} />
                                      <polygon points="6,11 11,11 11,34 6,34" fill={active ? "#fff" : V_C} />
                                      <line x1="6" y1="11" x2="11" y2="6" stroke={active ? "#fff" : "#1A1A1C"} strokeWidth="1.5" />
                                    </svg>
                                  );
                                  // auto = pittogramma con "?" dentro un angolo neutro
                                  return (
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                      <rect x="6" y="6" width="28" height={sw} fill={active ? "#fff" : BG} opacity="0.4"/>
                                      <rect x="6" y="6" width={sw} height="28" fill={active ? "#fff" : BG} opacity="0.4"/>
                                      <text x="20" y="28" textAnchor="middle" fontSize="14" fontWeight="900" fill={active ? "#fff" : BG}>?</text>
                                    </svg>
                                  );
                                };
                                const Btn = ({ m, hint, color }: any) => (
                                  <div onClick={() => apply(m)}
                                    style={{ flex: 1, padding: "12px 4px 8px", borderRadius: 10, background: curMode === m ? color : "#F2F1EC", border: curMode === m ? `2px solid ${color}` : "1.5px solid #ddd", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <CornerIcon m={m} active={curMode === m} />
                                    <div style={{ fontSize: 9, fontWeight: 700, color: curMode === m ? "#fff" : "#1A1A1C", opacity: 0.9 }}>{hint}</div>
                                  </div>
                                );
                                return (
                                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}
                                    onClick={() => { const ce: any = cornerEdit; if (ce && ce._t && Date.now() - ce._t < 800) return; setCornerEdit(null); }}
                                    >
                                    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}
                                      onClick={e => e.stopPropagation()}>
                                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1C" }}>📐 Angolo</div>
                                      <div style={{ fontSize: 11, color: "#888" }}>Come si chiude questo angolo?</div>
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <Btn m="V" hint="Vert. vince" color="#1A9E73" />
                                        <Btn m="H" hint="Oriz. vince" color="#D08008" />
                                        <Btn m="45" hint="Taglio 45°" color="#3B7FE0" />
                                        <Btn m="auto" hint="Auto" color="#666" />
                                      </div>
                                      <div onClick={() => setCornerEdit(null)} style={{ padding: "10px", borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#888" }}>Chiudi</div>
                                    </div>
                                  </div>
                                );
                              })()}
                              </>
                            );
}


