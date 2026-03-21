"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — DisegnoTecnico (Shared Drawing Module)
// Usato da: CMDetailPanel (preventivo) + VanoDetailPanel (rilievo)
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from "react";

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
      return (<g key={fk} onClick={() => onSelectFace(fk)} style={{ cursor: "pointer" }}><polygon points={f.pts} fill={sel ? T.purple + "40" : has ? G + "15" : f.fill} stroke={sel ? T.purple : has ? G : "#666"} strokeWidth={sel ? 2.5 : 1} strokeLinejoin="round" /><text x={lx} y={ly - 3} textAnchor="middle" fontSize={sel ? 10 : 7} fontWeight={sel ? 800 : 600} fontFamily={FM3} fill={sel ? T.purple : has ? G : "#555"}>{FA3[fk].label}</text>{has && <text x={lx} y={ly + 8} textAnchor="middle" fontSize={7} fontFamily={FM3} fill={G}>{els.length} el.</text>}</g>); })}
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
    <div style={{ display: "flex", alignItems: "center", padding: "6px 10px", gap: 6, background: `${T.purple}06`, borderBottom: `1px solid ${T.bdr}` }}>
      <span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: T.purple, flex: 1 }}>{face.label}</span><span style={{ fontSize: 8, color: T.sub, fontFamily: FM3 }}>{realW}x{realH}mm</span>
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
  return (<div style={{ borderTop: `1.5px solid ${T.purple}40`, background: T.card || "#fff", padding: "8px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ fontSize: 12 }}>{face.icon}</span><span style={{ fontSize: 11, fontWeight: 800, color: T.purple }}>{face.label} - Dati</span><span style={{ flex: 1 }} /><span onClick={onClose} style={{ fontSize: 11, cursor: "pointer", color: T.sub }}>✕</span></div>
    {fields.map((f: any) => (<div key={f.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, minWidth: 72 }}>{f.l}</span>
      {f.type === "text" ? <input value={data[f.k] || ""} placeholder="..." onChange={(e: any) => setF(f.k, e.target.value)} style={{ flex: 1, padding: "4px 8px", border: `1px solid ${T.bdr}`, borderRadius: 5, fontSize: 10, fontFamily: FF3, color: T.text }} />
        : <div style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="number" value={data[f.k] || ""} placeholder="—" onChange={(e: any) => setF(f.k, parseInt(e.target.value) || 0)} style={{ width: 56, padding: "4px", border: `1px solid ${T.bdr}`, borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: FM3, textAlign: "center", color: T.text }} />{f.u && <span style={{ fontSize: 8, color: T.sub }}>{f.u}</span>}</div>}
    </div>))}
  </div>);
}

function View3D({ T, realW, realH, vanoDisegno, onUpdate }: any) {
  const [mode3d, setMode3d] = useState("3d");
  const [activeFace, setActiveFace] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<any>(vanoDisegno?.faceData || {});
  const [showFields, setShowFields] = useState(false);

  useEffect(() => { const t = setTimeout(() => { const all: any[] = []; FK3.forEach(fk => { (faceData[fk]?.elements || []).forEach((el: any) => all.push({ ...el, face: fk })); }); onUpdate({ ...(vanoDisegno || {}), faceData, elements: (vanoDisegno?.elements || []) }); }, 500); return () => clearTimeout(t); }, [faceData]);

  const pm = vanoDisegno?.profMuro || 350;
  const totalEls = FK3.reduce((s, fk) => s + (faceData[fk]?.elements?.length || 0), 0);
  const updateFaceEls = (fk: string, els: any[]) => setFaceData((prev: any) => ({ ...prev, [fk]: { ...(prev[fk] || {}), elements: els } }));
  const openFace = (fk: string) => { setActiveFace(fk); setMode3d("face"); setActiveTool(null); };
  const G = T.grn || "#1A9E73";

  return (<div>
    {/* Sub-tabs */}
    <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, background: `${T.acc}06` }}>
      {[{ id: "3d", l: "🧊 Isometrica" }, { id: "face", l: `🪟 ${activeFace ? FA3[activeFace].label : "Faccia"}` }, { id: "render", l: "🖼 Render" }].map(m => (
        <div key={m.id} onClick={() => setMode3d(m.id)} style={{ flex: 1, padding: "6px 0", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: mode3d === m.id ? 800 : 500, color: mode3d === m.id ? T.acc : T.sub, borderBottom: `2px solid ${mode3d === m.id ? T.acc : "transparent"}` }}>{m.l}</div>
      ))}
    </div>
    {/* 3D Iso */}
    {mode3d === "3d" && <div style={{ display: "flex", justifyContent: "center", padding: "8px 4px" }}><Iso3D T={T} realW={realW} realH={realH} profMuro={pm} faceData={faceData} activeFace={activeFace} onSelectFace={openFace} /></div>}
    {/* Face Canvas */}
    {mode3d === "face" && activeFace && (<>
      <div style={{ padding: "6px 8px", display: "flex", gap: 3, flexWrap: "wrap", borderBottom: `1px solid ${T.bdr}`, background: T.bg || "#F2F1EC" }}>
        {EL3D.map(et => (<div key={et.id} onClick={() => setActiveTool(activeTool === et.id ? null : et.id)} style={{ padding: "4px 7px", borderRadius: 5, border: `1.5px solid ${activeTool === et.id ? et.color : T.bdr}`, background: activeTool === et.id ? et.color + "12" : T.card || "#fff", fontSize: 9, fontWeight: activeTool === et.id ? 800 : 600, color: activeTool === et.id ? et.color : T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}><span style={{ fontSize: 10 }}>{et.icon}</span> {et.label}</div>))}
      </div>
      <FaceCanvas3D T={T} faceKey={activeFace} realW={realW} realH={realH} elements={faceData[activeFace]?.elements || []} onUpdateElements={(els: any[]) => updateFaceEls(activeFace!, els)} activeTool={activeTool} />
      <div onClick={() => setShowFields(!showFields)} style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: T.purple }}>Dati {FA3[activeFace].label}</span>
        <span style={{ fontSize: 8, color: T.sub, transform: showFields ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </div>
      {showFields && <FDataPanel3D T={T} faceKey={activeFace} faceData={faceData} setFaceData={setFaceData} onClose={() => setShowFields(false)} />}
    </>)}
    {/* Render */}
    {mode3d === "render" && <RenderPreview3D T={T} realW={realW} realH={realH} faceData={faceData} />}
    {/* Face chips */}
    <div style={{ padding: "6px 10px", borderTop: `1px solid ${T.bdr}`, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
      {FK3.map(k => { const els = faceData[k]?.elements || []; const active = activeFace === k && mode3d === "face"; return (
        <div key={k} onClick={() => openFace(k)} style={{ padding: "3px 7px", borderRadius: 5, border: `1.5px solid ${active ? T.purple : els.length > 0 ? G : T.bdr}`, background: active ? T.purple + "12" : els.length > 0 ? G + "08" : T.card || "#fff", cursor: "pointer", fontSize: 8, fontWeight: 700, color: active ? T.purple : els.length > 0 ? G : T.sub, display: "flex", alignItems: "center", gap: 2 }}>
          {FA3[k].icon} {FA3[k].s}{els.length > 0 && <span style={{ fontSize: 7, opacity: 0.7 }}>({els.length})</span>}
        </div>); })}
    </div>
  </div>);
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

function FormaEditor({ T, realW, realH }: any) {
  const [pts, setPts] = useState(makeRectPts(realW, realH));
  const [sel, setSel] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [fMode, setFMode] = useState("move");
  const [dividers, setDividers] = useState<any[]>([]);
  const [cellTypes, setCellTypes] = useState<any>({});
  const [selCell, setSelCell] = useState<string | null>(null);
  const [inputW, setInputW] = useState(realW || 1200);
  const [inputH, setInputH] = useState(realH || 1400);
  const svgRef = useRef<SVGSVGElement>(null);

  const minX = Math.min(...pts.map((p: any) => p.x)), maxX = Math.max(...pts.map((p: any) => p.x));
  const minY = Math.min(...pts.map((p: any) => p.y)), maxY = Math.max(...pts.map((p: any) => p.y));
  const bW = maxX - minX || 1, bH = maxY - minY || 1;
  const pad = 50, maxSvg = 320;
  const sc = Math.min((maxSvg - pad * 2) / bW, (maxSvg - pad * 2) / bH, 0.18);
  const svgW = bW * sc + pad * 2 + 30, svgH = bH * sc + pad * 2 + 30;
  const ox = pad + 15 - minX * sc, oy = pad + 10 - minY * sc;
  const toSvg = (p: any) => ({ x: ox + p.x * sc, y: oy + p.y * sc });
  const toMm = (sx: number, sy: number) => ({ x: Math.round((sx - ox) / sc), y: Math.round((sy - oy) / sc) });
  const pathD = pts.map((p: any, i: number) => { const s = toSvg(p); return `${i === 0 ? "M" : "L"}${s.x},${s.y}`; }).join(" ") + " Z";

  const getPos = (e: any) => { const svg = svgRef.current; if (!svg) return { x: 0, y: 0 }; const r = svg.getBoundingClientRect(); const ct = e.touches ? e.touches[0] : e; return { x: ct.clientX - r.left, y: ct.clientY - r.top }; };

  const onDown = (e: any) => {
    e.preventDefault(); const pos = getPos(e);
    if (fMode === "add") {
      let bestD = Infinity, bestIdx = -1, bestPt: any = null;
      for (let i = 0; i < pts.length; i++) {
        const a = toSvg(pts[i]), b = toSvg(pts[(i + 1) % pts.length]);
        const n = nearSegment(pos.x, pos.y, a.x, a.y, b.x, b.y);
        if (n.dist < bestD && n.dist < 30) { bestD = n.dist; bestIdx = i + 1; bestPt = toMm(n.x, n.y); }
      }
      if (bestPt && bestIdx >= 0) { const np = [...pts]; np.splice(bestIdx, 0, bestPt); setPts(np); setSel(bestIdx); }
      return;
    }
    if (fMode === "del") {
      for (let i = 0; i < pts.length; i++) { const s = toSvg(pts[i]); if (distPt(pos, s) < 20 && pts.length > 3) { setPts(pts.filter((_: any, j: number) => j !== i)); setSel(null); return; } }
      return;
    }
    for (let i = 0; i < pts.length; i++) { const s = toSvg(pts[i]); if (distPt(pos, s) < 24) { setDragIdx(i); setSel(i); return; } }
    setSel(null);
  };

  const onMove = useCallback((e: any) => {
    if (dragIdx === null) return; e.preventDefault();
    const pos = getPos(e); const mm = toMm(pos.x, pos.y);
    mm.x = Math.round(mm.x / 10) * 10; mm.y = Math.round(mm.y / 10) * 10;
    setPts((prev: any) => prev.map((p: any, i: number) => i === dragIdx ? mm : p));
  }, [dragIdx, ox, oy, sc]);
  const onUp = useCallback(() => setDragIdx(null), []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false }); window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [onMove, onUp]);

  const applyDims = () => { const sX = inputW / bW, sY = inputH / bH; setPts(pts.map((p: any) => ({ x: Math.round((p.x - minX) * sX + minX), y: Math.round((p.y - minY) * sY + minY) }))); };
  useEffect(() => { setInputW(bW); setInputH(bH); }, [bW, bH]);

  const resetF = (w?: number, h?: number) => { setPts(makeRectPts(w || inputW, h || inputH)); setDividers([]); setCellTypes({}); setSel(null); setSelCell(null); };
  const presets = [
    { n: "Rettangolo", fn: () => resetF(1200, 1400) }, { n: "Portafinestra", fn: () => resetF(900, 2200) },
    { n: "Quadrato", fn: () => resetF(1000, 1000) },
    { n: "Forma L", fn: () => { setPts([{x:0,y:0},{x:1200,y:0},{x:1200,y:800},{x:600,y:800},{x:600,y:1400},{x:0,y:1400}]); setDividers([]); setCellTypes({}); }},
    { n: "Trapezio", fn: () => { setPts([{x:200,y:0},{x:1000,y:0},{x:1200,y:1400},{x:0,y:1400}]); setDividers([]); setCellTypes({}); }},
    { n: "Pentagono", fn: () => { setPts([{x:600,y:0},{x:1200,y:500},{x:1000,y:1400},{x:200,y:1400},{x:0,y:500}]); setDividers([]); setCellTypes({}); }},
  ];
  const AP2 = [{ id:"fisso",l:"Fisso",ic:"▣" },{ id:"anta_dx",l:"Anta DX",ic:"◨" },{ id:"anta_sx",l:"Anta SX",ic:"◧" },{ id:"vasistas",l:"Vasistas",ic:"▽" },{ id:"ar_dx",l:"A+R DX",ic:"⊞" },{ id:"ar_sx",l:"A+R SX",ic:"⊞" }];

  const addDiv = (axis: string) => { const total = axis === "v" ? bW : bH; setDividers((d: any) => [...d, { axis, pos: Math.round(total / 2), id: Date.now() }]); };
  const vDivs = dividers.filter((d: any) => d.axis === "v").map((d: any) => d.pos + minX).sort((a: number, b: number) => a - b);
  const hDivs = dividers.filter((d: any) => d.axis === "h").map((d: any) => d.pos + minY).sort((a: number, b: number) => a - b);
  const colEdges = [minX, ...vDivs, maxX], rowEdges = [minY, ...hDivs, maxY];
  const fCells: any[] = [];
  for (let r = 0; r < rowEdges.length - 1; r++) for (let c = 0; c < colEdges.length - 1; c++) fCells.push({ key: `${r}-${c}`, x: colEdges[c], y: rowEdges[r], w: colEdges[c + 1] - colEdges[c], h: rowEdges[r + 1] - rowEdges[r] });

  const bs2 = (active = false) => ({ padding: "5px 9px", borderRadius: 6, border: `1.5px solid ${active ? T.purple : T.bdr}`, background: active ? `${T.purple}12` : T.card, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: active ? T.purple : T.text });

  return (
    <div>
      {/* Presets */}
      <div style={{ display: "flex", gap: 3, padding: "5px 8px", overflowX: "auto" }}>
        {presets.map(p => <div key={p.n} onClick={p.fn} style={bs2()}>{p.n}</div>)}
      </div>
      {/* Mode toolbar */}
      <div style={{ display: "flex", gap: 3, padding: "3px 8px", borderBottom: `1px solid ${T.bdr}` }}>
        {[{ id:"move",l:"✋ Sposta",c:T.blue||"#3B7FE0" },{ id:"add",l:"＋ Punto",c:T.grn||"#1A9E73" },{ id:"del",l:"✕ Elimina",c:T.red||"#DC4444" }].map(m => (
          <div key={m.id} onClick={() => setFMode(m.id)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, textAlign: "center", background: fMode === m.id ? m.c + "15" : T.card, border: `1.5px solid ${fMode === m.id ? m.c : T.bdr}`, fontSize: 10, fontWeight: 700, color: fMode === m.id ? m.c : T.sub, cursor: "pointer" }}>{m.l}</div>
        ))}
      </div>
      {/* SVG */}
      <div style={{ display: "flex", justifyContent: "center", padding: 6, overflow: "auto", maxHeight: "55vh" }}>
        <svg ref={svgRef} width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ background: "#fff", touchAction: "none", maxWidth: "100%" }} onMouseDown={onDown} onTouchStart={onDown}>
          <defs><pattern id="fgrid" width={100*sc} height={100*sc} patternUnits="userSpaceOnUse"><path d={`M ${100*sc} 0 L 0 0 0 ${100*sc}`} fill="none" stroke="#E8E8E5" strokeWidth={0.5}/></pattern></defs>
          <rect width={svgW} height={svgH} fill="url(#fgrid)"/>
          <path d={pathD} fill="#DCEEFF" stroke="#5A5A5C" strokeWidth={2.5} strokeLinejoin="round"/>
          {/* Inner frame line */}
          {(() => { const center = { x: pts.reduce((s: number, p: any) => s + p.x, 0) / pts.length, y: pts.reduce((s: number, p: any) => s + p.y, 0) / pts.length }; const inner = pts.map((p: any) => { const dx = center.x - p.x, dy = center.y - p.y, d = Math.sqrt(dx*dx+dy*dy)||1; return toSvg({ x: p.x+(dx/d)*65, y: p.y+(dy/d)*65 }); }); const iD = inner.map((p: any,i: number) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ")+" Z"; return <path d={iD} fill="none" stroke="#5A5A5C" strokeWidth={0.8} strokeDasharray="3,2"/>; })()}
          {/* Dividers */}
          {dividers.map((d: any) => d.axis === "v" ? <g key={d.id}><line x1={ox+(d.pos+minX)*sc} y1={oy+minY*sc} x2={ox+(d.pos+minX)*sc} y2={oy+maxY*sc} stroke={T.purple||"#8B5CF6"} strokeWidth={2}/><text x={ox+(d.pos+minX)*sc} y={oy+maxY*sc+14} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily={FM2} fill={T.purple||"#8B5CF6"}>{d.pos}</text></g> : <g key={d.id}><line x1={ox+minX*sc} y1={oy+(d.pos+minY)*sc} x2={ox+maxX*sc} y2={oy+(d.pos+minY)*sc} stroke="#0D9488" strokeWidth={2}/><text x={ox+maxX*sc+8} y={oy+(d.pos+minY)*sc+3} fontSize={8} fontWeight={700} fontFamily={FM2} fill="#0D9488">{d.pos}</text></g>)}
          {/* Cell labels */}
          {fCells.map((cell: any) => { const cx2=ox+(cell.x+cell.w/2)*sc, cy2=oy+(cell.y+cell.h/2)*sc, isSel=selCell===cell.key, type=cellTypes[cell.key]||"fisso", ap=AP2.find((a: any)=>a.id===type); return <g key={cell.key} onClick={(e: any)=>{e.stopPropagation();setSelCell(cell.key);setSel(null)}} style={{cursor:"pointer"}}>{isSel&&<rect x={ox+cell.x*sc+2} y={oy+cell.y*sc+2} width={cell.w*sc-4} height={cell.h*sc-4} fill={(T.blue||"#3B7FE0")+"10"} stroke={T.blue||"#3B7FE0"} strokeWidth={1.5} strokeDasharray="4,3" rx={3}/>}<text x={cx2} y={cy2-4} textAnchor="middle" fontSize={14} fill={isSel?T.blue||"#3B7FE0":"#8E8E9380"}>{ap?.ic||"▣"}</text><text x={cx2} y={cy2+10} textAnchor="middle" fontSize={7} fontWeight={700} fontFamily={FM2} fill={isSel?T.blue||"#3B7FE0":"#8E8E93"}>{Math.round(cell.w)}×{Math.round(cell.h)}</text></g>; })}
          {/* Edge lengths */}
          {pts.map((p: any, i: number) => { const next=pts[(i+1)%pts.length], a=toSvg(p), b=toSvg(next), mx2=(a.x+b.x)/2, my2=(a.y+b.y)/2, len=segLenPt(p,next), dx=b.x-a.x, dy=b.y-a.y, angle=Math.atan2(dy,dx)*180/Math.PI, nx=-(b.y-a.y), ny=b.x-a.x, nd=Math.sqrt(nx*nx+ny*ny)||1, tx=mx2+(nx/nd)*14, ty=my2+(ny/nd)*14; return <g key={`q${i}`}><text x={tx} y={ty+3} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FM2} fill={T.acc} transform={`rotate(${Math.abs(angle)>90?angle+180:angle},${tx},${ty+3})`}>{len}</text></g>; })}
          {/* Vertices */}
          {pts.map((p: any, i: number) => { const s=toSvg(p), isSel=sel===i; return <g key={`v${i}`}><circle cx={s.x} cy={s.y} r={isSel?10:7} fill={isSel?T.blue||"#3B7FE0":"#5A5A5C"} stroke="#fff" strokeWidth={2} style={{cursor:fMode==="del"?"not-allowed":"grab"}}/>{isSel&&<text x={s.x} y={s.y-14} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily={FM2} fill={T.blue||"#3B7FE0"}>{p.x},{p.y}</text>}</g>; })}
        </svg>
      </div>
      {/* Dims bar */}
      <div style={{ display: "flex", gap: 4, padding: "5px 8px", borderTop: `1px solid ${T.bdr}`, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>L</span>
        <input type="number" value={inputW} onChange={(e: any)=>setInputW(parseInt(e.target.value)||0)} onBlur={applyDims} style={{ width: 52, padding: "4px 2px", border: `1.5px solid ${T.bdr}`, borderRadius: 5, fontSize: 11, fontWeight: 700, fontFamily: FM2, textAlign: "center" }}/>
        <span style={{ fontSize: 11, color: T.sub }}>×</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>H</span>
        <input type="number" value={inputH} onChange={(e: any)=>setInputH(parseInt(e.target.value)||0)} onBlur={applyDims} style={{ width: 52, padding: "4px 2px", border: `1.5px solid ${T.bdr}`, borderRadius: 5, fontSize: 11, fontWeight: 700, fontFamily: FM2, textAlign: "center" }}/>
        <span style={{ fontSize: 9, color: T.sub, fontFamily: FM2 }}>mm</span>
        {sel !== null && <div style={{ marginLeft: "auto", display: "flex", gap: 3, alignItems: "center" }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: T.blue||"#3B7FE0" }}>P{sel+1}</span>
          <input type="number" value={pts[sel]?.x||0} onChange={(e: any)=>setPts(pts.map((p: any,i: number)=>i===sel?{...p,x:parseInt(e.target.value)||0}:p))} style={{ width: 42, padding: "2px", border: `1px solid ${(T.blue||"#3B7FE0")}40`, borderRadius: 4, fontSize: 9, fontWeight: 700, fontFamily: FM2, textAlign: "center", color: T.blue||"#3B7FE0" }}/>
          <input type="number" value={pts[sel]?.y||0} onChange={(e: any)=>setPts(pts.map((p: any,i: number)=>i===sel?{...p,y:parseInt(e.target.value)||0}:p))} style={{ width: 42, padding: "2px", border: `1px solid ${(T.blue||"#3B7FE0")}40`, borderRadius: 4, fontSize: 9, fontWeight: 700, fontFamily: FM2, textAlign: "center", color: T.blue||"#3B7FE0" }}/>
        </div>}
      </div>
      {/* Dividers bar */}
      <div style={{ display: "flex", gap: 3, padding: "4px 8px", borderTop: `1px solid ${T.bdr}`, alignItems: "center", flexWrap: "wrap" }}>
        <div onClick={()=>addDiv("v")} style={{ padding: "4px 8px", borderRadius: 5, background: (T.purple||"#8B5CF6")+"12", border: `1px solid ${(T.purple||"#8B5CF6")}30`, cursor: "pointer" }}><span style={{ fontSize: 9, fontWeight: 700, color: T.purple||"#8B5CF6" }}>+│ Mont.</span></div>
        <div onClick={()=>addDiv("h")} style={{ padding: "4px 8px", borderRadius: 5, background: "#0D948812", border: "1px solid #0D948830", cursor: "pointer" }}><span style={{ fontSize: 9, fontWeight: 700, color: "#0D9488" }}>+─ Trav.</span></div>
        {dividers.map((d: any)=><div key={d.id} style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 5px", borderRadius: 4, background: (d.axis==="v"?T.purple||"#8B5CF6":"#0D9488")+"10" }}>
          <input type="number" value={d.pos} onChange={(e: any)=>setDividers(dividers.map((x: any)=>x.id===d.id?{...x,pos:parseInt(e.target.value)||0}:x))} style={{ width: 36, padding: "1px", border: "none", borderRadius: 3, fontSize: 9, fontWeight: 700, fontFamily: FM2, textAlign: "center", background: "transparent", color: d.axis==="v"?T.purple||"#8B5CF6":"#0D9488" }}/>
          <span onClick={()=>setDividers(dividers.filter((x: any)=>x.id!==d.id))} style={{ fontSize: 9, color: T.red||"#DC4444", cursor: "pointer", fontWeight: 700 }}>×</span>
        </div>)}
      </div>
      {/* Cell type selector */}
      {selCell !== null && <div style={{ padding: "6px 8px", borderTop: `1.5px solid ${(T.blue||"#3B7FE0")}30` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.blue||"#3B7FE0", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <span>CELLA</span>
          {(()=>{ const c=fCells.find((x: any)=>x.key===selCell); return c?<span style={{ fontSize: 9, color: T.sub, fontFamily: FM2 }}>{Math.round(c.w)}×{Math.round(c.h)} mm</span>:null; })()}
          <span onClick={()=>setSelCell(null)} style={{ marginLeft: "auto", fontSize: 14, color: T.sub, cursor: "pointer" }}>×</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
          {AP2.map((a: any) => { const isSel2=(cellTypes[selCell]||"fisso")===a.id; return <div key={a.id} onClick={()=>setCellTypes({...cellTypes,[selCell as string]:a.id})} style={{ padding: "6px 3px", borderRadius: 6, border: `1.5px solid ${isSel2?T.blue||"#3B7FE0":T.bdr}`, background: isSel2?(T.blue||"#3B7FE0")+"12":T.card, textAlign: "center", cursor: "pointer" }}><div style={{ fontSize: 14 }}>{a.ic}</div><div style={{ fontSize: 7, fontWeight: isSel2?800:500, color: isSel2?T.blue||"#3B7FE0":T.sub }}>{a.l}</div></div>; })}
        </div>
      </div>}
      {/* Footer */}
      <div style={{ padding: "4px 8px", fontSize: 9, color: T.sub, textAlign: "center", borderTop: `1px solid ${T.bdr}` }}>
        {fMode === "move" ? "Trascina un vertice" : fMode === "add" ? "Tocca un lato per aggiungere punto" : "Tocca un punto per eliminarlo"} · {fCells.length} celle · {pts.length} punti
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function DisegnoTecnico({ vanoId, vanoNome, vanoDisegno, realW: propRealW, realH: propRealH, onUpdate, onUpdateField, onClose, T }) {
  const [viewTab, setViewTab] = React.useState("disegno"); // "disegno" | "forma" | "3d"
  const realW = propRealW || 1200;
  const realH = propRealH || 1000;
                            const dw = vanoDisegno || { elements: [], selectedId: null, drawMode: null, history: [] };
                            const els = dw.elements || [];
                            const selId = dw.selectedId || null;
                            const drawMode = dw.drawMode || null; // "line"|"apertura"|"place-anta"|"place-vetro"|"place-ap"
                            const placeApType = dw._placeApType || "SX";
                            const zoom = dw._zoom || 1;
                            const panX = dw._panX || 0, panY = dw._panY || 0;
                            const canvasW = Math.min(window.innerWidth - 32, 500);
                            const GRID = 10;
                            const SNAP_R = 18;

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
                            const baseCanvasH = Math.max(280, fH + PAD * 2 + PAD_DIM);
                            const canvasH = baseCanvasH;
                            const fX = PAD, fY = PAD;
                            const snap = (v2) => Math.round(v2 / GRID) * GRID;

                            // ══ CELL DETECTION ══
                            const frames = els.filter(e => e.type === "rect");
                            const frame = frames[0] || null; // primary frame for compat
                            const allMontanti = els.filter(e => e.type === "montante");
                            const allTraversi = els.filter(e => e.type === "traverso");
                            const TK_FRAME = 6, TK_MONT = 4, TK_ANTA = 4, TK_PORTA = 7;
                            const HM = TK_MONT / 2;

                            // ══ POLYGON from freeLines ══
                            const getPolygon = () => {
                              const lines = els.filter(e => e.type === "freeLine");
                              if (lines.length < 3) return null;
                              const pts = [];
                              const used = new Set();
                              const addP = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                              addP(lines[0].x1, lines[0].y1); addP(lines[0].x2, lines[0].y2); used.add(0);
                              for (let it = 0; it < lines.length; it++) {
                                const last = pts[pts.length - 1];
                                for (let li = 0; li < lines.length; li++) {
                                  if (used.has(li)) continue;
                                  const l = lines[li];
                                  if (Math.hypot(l.x1 - last[0], l.y1 - last[1]) < 15) { addP(l.x2, l.y2); used.add(li); break; }
                                  if (Math.hypot(l.x2 - last[0], l.y2 - last[1]) < 15) { addP(l.x1, l.y1); used.add(li); break; }
                                }
                              }
                              return pts.length >= 3 ? pts : null;
                            };
                            const poly = !frame ? getPolygon() : null;

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
                                  if (m.x > c.x + HM + 2 && m.x < c.x + c.w - HM - 2 && my1 <= c.y + 2 && my2 >= c.y + c.h - 2) {
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
                                const pL = Math.min(...allX2) + 2, pR = Math.max(...allX2) - 2;
                                const pT = Math.min(...allY2) + 2, pB = Math.max(...allY2) - 2;
                                return bspSplit([{ x: pL, y: pT, w: pR - pL, h: pB - pT, id: "P0" }]);
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
                              frames.forEach(fr => {
                                const fx = fr.x, fy = fr.y, fw = fr.w, fh2 = fr.h;
                                pts.push({x:fx,y:fy},{x:fx+fw,y:fy},{x:fx,y:fy+fh2},{x:fx+fw,y:fy+fh2});
                                pts.push({x:fx+fw/2,y:fy},{x:fx+fw/2,y:fy+fh2},{x:fx,y:fy+fh2/2},{x:fx+fw,y:fy+fh2/2});
                              });
                              cells.forEach(c2 => {
                                pts.push({x:c2.x,y:c2.y},{x:c2.x+c2.w,y:c2.y},{x:c2.x,y:c2.y+c2.h},{x:c2.x+c2.w,y:c2.y+c2.h});
                                pts.push({x:c2.x+c2.w/2,y:c2.y},{x:c2.x+c2.w/2,y:c2.y+c2.h});
                                pts.push({x:c2.x,y:c2.y+c2.h/2},{x:c2.x+c2.w,y:c2.y+c2.h/2});
                              });
                              els.filter(e => e.type === "freeLine" || e.type === "apLine").forEach(l => {
                                pts.push({x:l.x1,y:l.y1},{x:l.x2,y:l.y2});
                              });
                              return pts;
                            };
                            const findSnap = (mx, my) => {
                              const pts = getSnapPoints();
                              let best = null, bestD = SNAP_R;
                              pts.forEach(p => { const d = Math.hypot(p.x - mx, p.y - my); if (d < bestD) { bestD = d; best = p; } });
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
                              // Convert screen coords to viewBox coords
                              const px = clientX - r2.left;
                              const py = clientY - r2.top;
                              const vbW = canvasW / zoom, vbH = canvasH / zoom;
                              return { mx: panX + px / r2.width * vbW, my: panY + py / r2.height * vbH };
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
                                onUpdate({ ...dw, elements: latestEls, selectedId: elId, _dragDim: null });
                              };
                              document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
                              document.addEventListener("touchmove", onM, { passive: false }); document.addEventListener("touchend", onU);
                            };

                            // ── SVG Click ──
                            const onSvgClick = (e2) => {
                              const svg = e2.currentTarget;
                              const { mx, my } = getSvgXY(e2, svg);

                              // Place montante/traverso — click on cell OR polygon
                              if (drawMode === "place-mont") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cx = snap(mx);
                                  const clampedX = Math.max(cell.x + 10, Math.min(cell.x + cell.w - 10, cx));
                                  // If polygon exists, clip montante to polygon edges
                                  if (poly) {
                                    const ys = segIntersectV(clampedX, poly);
                                    if (ys) setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: ys[0], y2: ys[1] }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: cell.y, y2: cell.y + cell.h }]);
                                  }
                                } else if (poly) {
                                  // No cells yet but polygon exists — clip to polygon
                                  const cx = snap(mx);
                                  const ys = segIntersectV(cx, poly);
                                  if (ys) setDW([...els, { id: Date.now(), type: "montante", x: cx, y1: ys[0], y2: ys[1] }]);
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
                                  if (xs) setDW([...els, { id: Date.now(), type: "traverso", y: cy, x1: xs[0], x2: xs[1] }]);
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "traverso", y: snap(my), x1: fX, x2: fX + fW }]);
                                }
                                return;
                              }

                              // Place modes — click on cell OR polygon fallback for complex shapes
                              if (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") {
                                let cell = findCellAt(mx, my);
                                if (!cell && cells.length === 0) {
                                  // Extract polygon from freeLines
                                  const lines = els.filter(e => e.type === "freeLine");
                                  if (lines.length >= 3) {
                                    // Build ordered point chain from connected lines
                                    const pts = [];
                                    const used = new Set();
                                    const addPt = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                    // Start with first line
                                    addPt(lines[0].x1, lines[0].y1);
                                    addPt(lines[0].x2, lines[0].y2);
                                    used.add(0);
                                    for (let iter = 0; iter < lines.length; iter++) {
                                      const last = pts[pts.length - 1];
                                      for (let li = 0; li < lines.length; li++) {
                                        if (used.has(li)) continue;
                                        const l = lines[li];
                                        const d1 = Math.hypot(l.x1 - last[0], l.y1 - last[1]);
                                        const d2 = Math.hypot(l.x2 - last[0], l.y2 - last[1]);
                                        if (d1 < 15) { addPt(l.x2, l.y2); used.add(li); break; }
                                        if (d2 < 15) { addPt(l.x1, l.y1); used.add(li); break; }
                                      }
                                    }
                                    if (pts.length >= 3) {
                                      cell = { id: "poly", poly: pts };
                                    }
                                  }
                                  // Fallback to bbox if polygon extraction failed
                                  if (!cell) {
                                    const allLines = els.filter(e => e.type === "freeLine" || e.type === "apLine");
                                    if (allLines.length > 0) {
                                      const allX = allLines.flatMap(l => [l.x1, l.x2]);
                                      const allY = allLines.flatMap(l => [l.y1, l.y2]);
                                      cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                    }
                                  }
                                }
                                if (!cell) return;
                                
                                // Polygon shape handling
                                if (cell.poly) {
                                  if (drawMode === "place-anta" || drawMode === "place-porta") {
                                    const newEls = els.filter(e => e.type !== "polyAnta");
                                    newEls.push({ id: Date.now(), type: "polyAnta", poly: cell.poly, subType: drawMode === "place-porta" ? "porta" : undefined });
                                    setDW(newEls);
                                  } else if (drawMode === "place-vetro") {
                                    const newEls = els.filter(e => e.type !== "polyGlass");
                                    newEls.push({ id: Date.now(), type: "polyGlass", poly: cell.poly });
                                    setDW(newEls);
                                  } else if (drawMode === "place-persiana") {
                                    const newEls = els.filter(e => e.type !== "polyPersiana");
                                    newEls.push({ id: Date.now(), type: "polyPersiana", poly: cell.poly });
                                    setDW(newEls);
                                  }
                                  return;
                                }
                                
                                // Match elements to cell by position overlap (BSP IDs change dynamically)
                                const inCell = (el2) => el2.x !== undefined && el2.w !== undefined &&
                                  el2.x >= cell.x - 2 && el2.y >= cell.y - 2 &&
                                  el2.x + el2.w <= cell.x + cell.w + 2 && el2.y + el2.h <= cell.y + cell.h + 2;
                                
                                // Regular cell handling
                                if (drawMode === "place-anta") {
                                  const existingAnta = els.find(e => (e.type === "innerRect" || e.type === "persiana") && inCell(e));
                                  if (existingAnta) {
                                    const midX = snap(cell.x + cell.w / 2);
                                    const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana" || e.type === "glass") && inCell(e)));
                                    newEls.push({ id: Date.now(), type: "montante", x: midX, y1: cell.y - HM, y2: cell.y + cell.h + HM });
                                    setDW(newEls);
                                  } else {
                                    const newEls = [...els];
                                    newEls.push({ id: Date.now(), type: "innerRect", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                    setDW(newEls);
                                  }
                                } else if (drawMode === "place-porta") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "innerRect", subType: "porta", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                  setDW(newEls);
                                } else if (drawMode === "place-persiana") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "persiana", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                  setDW(newEls);
                                } else if (drawMode === "place-vetro") {
                                  const anta = els.find(e => (e.type === "innerRect") && inCell(e));
                                  const tk = anta ? (anta.subType === "porta" ? TK_PORTA : TK_ANTA) : 1;
                                  const base = anta || { x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2 };
                                  const newEls = els.filter(e => !(e.type === "glass" && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "glass", x: base.x + tk, y: base.y + tk, w: base.w - tk * 2, h: base.h - tk * 2, cellId: cell.id });
                                  setDW(newEls);
                                }
                                return;
                              }

                              if (drawMode === "place-ap") {
                                let cell = findCellAt(mx, my);
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
                              if (drawMode === "line" || drawMode === "apertura") {
                                const sp = findSnap(mx, my);
                                let px = sp ? sp.x : snap(mx);
                                let py = sp ? sp.y : snap(my);
                                const pending = dw._pendingLine;
                                if (pending) {
                                  // Snap to H/V if within 8px
                                  const adx = Math.abs(px - pending.x1), ady = Math.abs(py - pending.y1);
                                  if (adx < 8 && ady > 8) px = pending.x1; // vertical snap
                                  if (ady < 8 && adx > 8) py = pending.y1; // horizontal snap
                                }
                                if (!pending) {
                                  setMode({ _pendingLine: { x1: px, y1: py } });
                                } else {
                                  if (px === pending.x1 && py === pending.y1) return;
                                  const lineType = drawMode === "apertura" ? "apLine" : "freeLine";
                                  setDW([...els, { id: Date.now(), type: lineType, x1: pending.x1, y1: pending.y1, x2: px, y2: py }], { _pendingLine: { x1: px, y1: py } });
                                }
                                return;
                              }

                              // Default — deselect
                              setMode({ selectedId: null });
                            };

                            // ══ Styles ══
                            const bs = (active = false) => ({ padding: "5px 9px", borderRadius: 6, border: `1.5px solid ${active ? T.purple : T.bdr}`, background: active ? `${T.purple}12` : T.card, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: active ? T.purple : T.text });
                            const bAp = (active = false) => ({ padding: "5px 9px", borderRadius: 6, border: `1.5px solid ${active ? T.blue : T.blue + "30"}`, background: active ? `${T.blue}12` : `${T.blue}05`, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: T.blue });
                            const bDel = (c2 = T.red) => ({ padding: "5px 9px", borderRadius: 6, border: `1px solid ${c2}30`, background: `${c2}08`, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: c2 });

                            const cursorMode = drawMode === "line" || drawMode === "apertura" ? "crosshair" : drawMode ? "pointer" : "default";

                            return (
                              <div style={{ marginTop: 8, background: T.card, borderRadius: 12, border: `1.5px solid ${T.purple}`, overflow: "hidden" }}>
                                {/* Header */}
                                <div style={{ padding: "8px 12px", background: `${T.purple}10`, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14 }}>✏️</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: T.purple, flex: 1 }}>Disegno — {vanoNome || "Vano"} ({realW}×{realH})</span>
                                  <span onClick={() => onClose()} style={{ fontSize: 16, cursor: "pointer", color: T.sub, padding: "2px 6px" }}>✕</span>
                                </div>

                                {/* ═══ TAB BAR ═══ */}
                                <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}` }}>
                                  {[{ id: "disegno", l: "✏️ Disegno", c: T.purple }, { id: "forma", l: "🔷 Forma", c: T.blue || "#3B7FE0" }, { id: "3d", l: "🧊 3D", c: T.acc }].map(tab => (
                                    <div key={tab.id} onClick={() => setViewTab(tab.id)}
                                      style={{ flex: 1, padding: "7px 0", textAlign: "center", fontSize: 11, fontWeight: viewTab === tab.id ? 800 : 500, color: viewTab === tab.id ? tab.c : T.sub, borderBottom: viewTab === tab.id ? `2.5px solid ${tab.c}` : "2.5px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>
                                      {tab.l}
                                    </div>
                                  ))}
                                </div>

                                {/* ═══ TAB: FORMA ═══ */}
                                {viewTab === "forma" && <FormaEditor T={T} realW={realW} realH={realH} />}

                                {/* ═══ TAB: 3D ═══ */}
                                {viewTab === "3d" && <View3D T={T} realW={realW} realH={realH} vanoDisegno={vanoDisegno} onUpdate={onUpdate} />}

                                {/* ═══ TAB: DISEGNO (originale) ═══ */}
                                {viewTab === "disegno" && <>
                                {/* Mode indicators */}
                                <div style={{ padding: "4px 8px 0", display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {drawMode === "line" && <span style={{ fontSize: 9, background: "#333", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>╱ STRUTTURA</span>}
                                  {drawMode === "apertura" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>↗ APERTURA</span>}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") && <span style={{ fontSize: 9, background: T.grn, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 CLICK su cella</span>}
                                  {(drawMode === "place-mont" || drawMode === "place-trav") && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 {drawMode === "place-mont" ? "MONTANTE" : "TRAVERSO"} — click cella</span>}
                                  {drawMode === "place-ap" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>👆 {placeApType} — click cella</span>}
                                </div>

                                {/* Row 1: Struttura */}
                                <div style={{ display: "flex", gap: 3, padding: "5px 8px", overflowX: "auto" }}>
                                  <div onClick={() => {
                                    if (frames.length === 0) {
                                      // First telaio: fill canvas
                                      setDW([...els, { id: Date.now(), type: "rect", x: fX, y: fY, w: fW, h: fH }]);
                                    } else {
                                      // Additional telaio (zoppo): add offset
                                      const lastF = frames[frames.length - 1];
                                      const nw = lastF.w * 0.6, nh = lastF.h * 0.5;
                                      const nx = lastF.x + lastF.w - TK_FRAME;
                                      const ny = lastF.y + lastF.h - nh;
                                      setDW([...els, { id: Date.now(), type: "rect", x: snap(nx), y: snap(ny), w: snap(nw), h: snap(nh) }]);
                                    }
                                  }} style={bs()}>▭ Telaio</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-mont" ? null : "place-mont", _pendingLine: null })} style={bs(drawMode === "place-mont")}>┃ Mont.</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-trav" ? null : "place-trav", _pendingLine: null })} style={bs(drawMode === "place-trav")}>━ Trav.</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-anta" ? null : "place-anta", _pendingLine: null })} style={bs(drawMode === "place-anta")}>🪟 Anta</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-porta" ? null : "place-porta", _pendingLine: null })} style={bs(drawMode === "place-porta")}>🚪 Porta</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-persiana" ? null : "place-persiana", _pendingLine: null })} style={bs(drawMode === "place-persiana")}>▤ Pers.</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-vetro" ? null : "place-vetro", _pendingLine: null })} style={bs(drawMode === "place-vetro")}>💎 Vetro</div>

                                  <div onClick={() => {
                                    const cx = frame ? frame.x + frame.w / 2 : fX + fW / 2;
                                    const cy = frame ? frame.y + frame.h / 2 : fY + fH / 2;
                                    setDW([...els, { id: Date.now(), type: "circle", cx, cy, r: Math.min(fW, fH) / 4 }]);
                                  }} style={bs()}>⭕ Oblò</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "line" ? null : "line", _pendingLine: null })} style={bs(drawMode === "line")}>╱ Linea</div>

                                  <div onClick={() => {
                                    const txt = prompt("Testo etichetta:");
                                    if (!txt) return;
                                    const cx2 = frame ? frame.x + frame.w / 2 : fX + fW / 2;
                                    const cy2 = frame ? frame.y + frame.h / 2 : fY + fH / 2;
                                    setDW([...els, { id: Date.now(), type: "label", x: cx2, y: cy2, text: txt, fontSize: 11 }]);
                                  }} style={bs()}>Aa Testo</div>

                                  <div onClick={() => {
                                    const nEls = els.filter(e => e.type !== "dim");
                                    if (frame) {
                                      nEls.push(
                                        { id: Date.now() + 300, type: "dim", x1: frame.x, y1: frame.y + frame.h + 14, x2: frame.x + frame.w, y2: frame.y + frame.h + 14, label: String(realW) },
                                        { id: Date.now() + 301, type: "dim", x1: frame.x + frame.w + 14, y1: frame.y, x2: frame.x + frame.w + 14, y2: frame.y + frame.h, label: String(realH) }
                                      );
                                      const iT = frame.y + TK_FRAME, iL = frame.x + TK_FRAME;
                                      const topCells = cells.filter(c2 => Math.abs(c2.y - iT) < 4).sort((a, b) => a.x - b.x);
                                      if (topCells.length > 1) topCells.forEach((c2, i) => nEls.push({ id: Date.now() + 310 + i, type: "dim", x1: c2.x, y1: frame.y - 10, x2: c2.x + c2.w, y2: frame.y - 10, label: String(Math.round(c2.w / fW * realW)) }));
                                      const leftCells = cells.filter(c2 => Math.abs(c2.x - iL) < 4).sort((a, b) => a.y - b.y);
                                      if (leftCells.length > 1) leftCells.forEach((c2, i) => nEls.push({ id: Date.now() + 330 + i, type: "dim", x1: frame.x - 14, y1: c2.y, x2: frame.x - 14, y2: c2.y + c2.h, label: String(Math.round(c2.h / fH * realH)) }));
                                    } else if (poly) {
                                      const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
                                      const bL = Math.min(...xs), bR = Math.max(...xs), bT = Math.min(...ys), bB = Math.max(...ys);
                                      // Bounding box total dims
                                      nEls.push(
                                        { id: Date.now() + 300, type: "dim", x1: bL, y1: bB + 14, x2: bR, y2: bB + 14, label: String(realW) },
                                        { id: Date.now() + 301, type: "dim", x1: bR + 14, y1: bT, x2: bR + 14, y2: bB, label: String(realH) }
                                      );
                                      // Per-segment dimensions (each freeLine side)
                                      const freeLines = els.filter(e => e.type === "freeLine");
                                      const totalPx = Math.hypot(bR - bL, bB - bT);
                                      freeLines.forEach((fl, fi) => {
                                        const dx2 = fl.x2 - fl.x1, dy2 = fl.y2 - fl.y1;
                                        const segPx = Math.hypot(dx2, dy2);
                                        // Convert px to mm using diagonal ratio
                                        const diagMM = Math.hypot(realW, realH);
                                        const segMM = Math.round(segPx / totalPx * diagMM);
                                        // Offset dim line outward from polygon center
                                        const cx = (bL + bR) / 2, cy = (bT + bB) / 2;
                                        const mx = (fl.x1 + fl.x2) / 2, my = (fl.y1 + fl.y2) / 2;
                                        const toCx = cx - mx, toCy = cy - my;
                                        const dist = Math.hypot(toCx, toCy) || 1;
                                        const offX = -toCx / dist * 16, offY = -toCy / dist * 16;
                                        nEls.push({ id: Date.now() + 350 + fi, type: "dim", x1: fl.x1 + offX, y1: fl.y1 + offY, x2: fl.x2 + offX, y2: fl.y2 + offY, label: String(segMM) });
                                      });
                                      // Per-cell dims
                                      if (cells.length > 1) {
                                        const topCells = cells.filter(c2 => Math.abs(c2.y - bT) < 6).sort((a, b) => a.x - b.x);
                                        if (topCells.length > 1) topCells.forEach((c2, i) => nEls.push({ id: Date.now() + 370 + i, type: "dim", x1: c2.x, y1: bT - 10, x2: c2.x + c2.w, y2: bT - 10, label: String(Math.round(c2.w / (bR - bL) * realW)) }));
                                        const leftCells = cells.filter(c2 => Math.abs(c2.x - bL) < 6).sort((a, b) => a.y - b.y);
                                        if (leftCells.length > 1) leftCells.forEach((c2, i) => nEls.push({ id: Date.now() + 390 + i, type: "dim", x1: bL - 14, y1: c2.y, x2: bL - 14, y2: c2.y + c2.h, label: String(Math.round(c2.h / (bB - bT) * realH)) }));
                                      }
                                    }
                                    setDW(nEls);
                                  }} style={bs()}>↔ Misure</div>
                                </div>

                                {/* Row 2: Aperture (blu) */}
                                <div style={{ display: "flex", gap: 3, padding: "2px 8px 5px", overflowX: "auto" }}>
                                  <div onClick={() => setMode({ drawMode: drawMode === "apertura" ? null : "apertura", _pendingLine: null })} style={bAp(drawMode === "apertura")}>↗ Disegna</div>
                                  <span style={{ fontSize: 9, color: T.sub, alignSelf: "center" }}>|</span>
                                  {[
                                    { id: "SX", l: "← SX" }, { id: "DX", l: "DX →" }, { id: "RIB", l: "↕ Rib." },
                                    { id: "OB", l: "↙↕ OB" }, { id: "ALZ", l: "→ Alz." }, { id: "SCO", l: "↔ Sco." }, { id: "FISSO", l: "✕ Fisso" },
                                  ].map(ap => (
                                    <div key={ap.id} onClick={() => setMode({ drawMode: "place-ap", _placeApType: ap.id, _pendingLine: null })} style={bAp(drawMode === "place-ap" && placeApType === ap.id)}>{ap.l}</div>
                                  ))}
                                </div>

                                {/* Row 3: Azioni */}
                                <div style={{ display: "flex", gap: 3, padding: "0 8px 6px", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={undo} style={bDel(T.acc)}>↩ Annulla</div>
                                  {selId && <div onClick={() => setDW(els.filter(e => e.id !== selId), { selectedId: null })} style={bDel()}>🗑 Elimina sel.</div>}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setDW([], { selectedId: null, drawMode: null, _pendingLine: null, history: [] })} style={bDel()}>🗑 Reset</div>
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setMode({ _zoom: Math.max(0.5, (zoom || 1) - 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>−</div>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: T.sub, minWidth: 32, textAlign: "center" }}>{Math.round(zoom * 100)}%</div>
                                  <div onClick={() => setMode({ _zoom: Math.min(4, (zoom || 1) + 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>+</div>
                                  <div onClick={() => setMode({ _zoom: 1, _panX: 0, _panY: 0 })} style={{ ...bs(), fontSize: 9 }}>Fit</div>
                                </div>

                                {/* SVG Canvas — zoomable with wheel + pannable */}
                                <div style={{ overflow: "auto", position: "relative", maxHeight: "70vh", border: `1px solid ${T.bdr}` }}>
                                <svg width={canvasW * Math.max(1, zoom)} height={canvasH * Math.max(1, zoom)}
                                  viewBox={`${panX} ${panY} ${canvasW / zoom} ${canvasH / zoom}`}
                                  style={{ display: "block", background: "#fff", touchAction: "none", cursor: drawMode ? cursorMode : (zoom > 1 ? "grab" : "default") }}
                                  onClick={onSvgClick}
                                  onWheel={(e2) => {
                                    e2.preventDefault();
                                    const newZoom = Math.max(0.5, Math.min(4, zoom + (e2.deltaY < 0 ? 0.15 : -0.15)));
                                    setMode({ _zoom: newZoom });
                                  }}
                                  onMouseDown={(e2) => {
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
                                  onMouseMove={(e2) => {
                                    if (!dw._pendingLine || !(drawMode === "line" || drawMode === "apertura")) return;
                                    const svg = e2.currentTarget;
                                    const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                    let gx = snap(gmx), gy = snap(gmy);
                                    const p = dw._pendingLine;
                                    if (Math.abs(gx - p.x1) < 8 && Math.abs(gy - p.y1) > 8) gx = p.x1;
                                    if (Math.abs(gy - p.y1) < 8 && Math.abs(gx - p.x1) > 8) gy = p.y1;
                                    const deg = Math.round(Math.atan2(-(gy - p.y1), gx - p.x1) * 180 / Math.PI);
                                    const len = Math.round(Math.hypot(gx - p.x1, gy - p.y1) / fW * realW);
                                    if (dw._guideX !== gx || dw._guideY !== gy) {
                                      onUpdate({ ...dw, _guideX: gx, _guideY: gy, _guideDeg: deg, _guideLen: len });
                                    }
                                  }}
                                  onMouseLeave={() => { if (dw._guideX != null) onUpdate({ ...dw, _guideX: null, _guideY: null }); }}>
                                  <defs>
                                    <pattern id={`dg-${vanoId}`} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                                      <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                                    </pattern>
                                    {poly && <clipPath id={`polyClip-${vanoId}`}><polygon points={poly.map(p => p.join(",")).join(" ")} /></clipPath>}
                                  </defs>
                                  <rect width={canvasW} height={canvasH} fill={`url(#dg-${vanoId})`} />

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
                                        if (Math.hypot(l.x1 - last[0], l.y1 - last[1]) < 15) { addPt(l.x2, l.y2); used.add(li); break; }
                                        if (Math.hypot(l.x2 - last[0], l.y2 - last[1]) < 15) { addPt(l.x1, l.y1); used.add(li); break; }
                                      }
                                    }
                                    const clr = drawMode === "place-ap" ? T.blue : T.grn;
                                    if (pts.length >= 3) {
                                      return <polygon points={pts.map(p => p.join(",")).join(" ")} fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" />;
                                    }
                                    // Fallback to bbox
                                    const allX = lines.flatMap(l => [l.x1, l.x2]), allY = lines.flatMap(l => [l.y1, l.y2]);
                                    return <rect x={Math.min(...allX)+1} y={Math.min(...allY)+1} width={Math.max(...allX)-Math.min(...allX)-2} height={Math.max(...allY)-Math.min(...allY)-2}
                                      fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" rx={2} />;
                                  })()}

                                  {/* Snap points in draw mode */}
                                  {(drawMode === "line" || drawMode === "apertura") && getSnapPoints().map((p, pi) => (
                                    <circle key={`sp${pi}`} cx={p.x} cy={p.y} r={3} fill={drawMode === "apertura" ? T.blue : T.purple} fillOpacity={0.2} />
                                  ))}

                                  {/* ══ CLOSED POLYGON PROFILE (proper mitered corners) ══ */}
                                  {poly && poly.length >= 3 && (() => {
                                    const n = poly.length;
                                    const halfT = TK_FRAME;
                                    // Compute centroid for inner/outer direction
                                    const cx = poly.reduce((s, p) => s + p[0], 0) / n;
                                    const cy = poly.reduce((s, p) => s + p[1], 0) / n;
                                    // Offset each vertex outward and inward
                                    const outerPts = [];
                                    const innerPts = [];
                                    for (let i = 0; i < n; i++) {
                                      const prev = poly[(i - 1 + n) % n];
                                      const curr = poly[i];
                                      const next = poly[(i + 1) % n];
                                      // Edge normals (pointing outward from centroid)
                                      const d1x = curr[0] - prev[0], d1y = curr[1] - prev[1];
                                      const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
                                      const len1 = Math.hypot(d1x, d1y) || 1;
                                      const len2 = Math.hypot(d2x, d2y) || 1;
                                      let n1x = -d1y / len1, n1y = d1x / len1;
                                      let n2x = -d2y / len2, n2y = d2x / len2;
                                      // Ensure normals point outward (away from centroid)
                                      const midE1x = (prev[0] + curr[0]) / 2, midE1y = (prev[1] + curr[1]) / 2;
                                      if ((midE1x + n1x - cx) * (midE1x + n1x - cx) + (midE1y + n1y - cy) * (midE1y + n1y - cy) <
                                          (midE1x - n1x - cx) * (midE1x - n1x - cx) + (midE1y - n1y - cy) * (midE1y - n1y - cy)) {
                                        n1x = -n1x; n1y = -n1y;
                                      }
                                      const midE2x = (curr[0] + next[0]) / 2, midE2y = (curr[1] + next[1]) / 2;
                                      if ((midE2x + n2x - cx) * (midE2x + n2x - cx) + (midE2y + n2y - cy) * (midE2y + n2y - cy) <
                                          (midE2x - n2x - cx) * (midE2x - n2x - cx) + (midE2y - n2y - cy) * (midE2y - n2y - cy)) {
                                        n2x = -n2x; n2y = -n2y;
                                      }
                                      // Average normal at vertex (bisector)
                                      let bx = n1x + n2x, by = n1y + n2y;
                                      const bLen = Math.hypot(bx, by) || 1;
                                      bx /= bLen; by /= bLen;
                                      // Miter length
                                      const dot = n1x * bx + n1y * by;
                                      const miter = dot > 0.3 ? halfT / dot : halfT;
                                      outerPts.push([curr[0] + bx * miter, curr[1] + by * miter]);
                                      innerPts.push([curr[0] - bx * miter, curr[1] - by * miter]);
                                    }
                                    const outerStr = outerPts.map(p => p.join(",")).join(" ");
                                    const innerStr = innerPts.map(p => p.join(",")).join(" ");
                                    return (
                                      <g>
                                        {/* Fill between outer and inner */}
                                        <polygon points={outerStr} fill="#f0efe8" stroke="none" />
                                        <polygon points={innerStr} fill="#fff" stroke="none" />
                                        {/* Outer stroke */}
                                        <polygon points={outerStr} fill="none" stroke="#1A1A1C" strokeWidth={1.5} strokeLinejoin="miter" />
                                        {/* Inner stroke */}
                                        <polygon points={innerStr} fill="none" stroke="#1A1A1C" strokeWidth={1} strokeLinejoin="miter" />
                                        {/* Corner dots */}
                                        {poly.map((p, pi) => <circle key={`pc${pi}`} cx={p[0]} cy={p[1]} r={3.5} fill="#333" />)}
                                      </g>
                                    );
                                  })()}

                                  {/* ══ ELEMENTS ══ */}
                                  {els.map(el => {
                                    const sel = el.id === selId;
                                    const hc = sel ? T.purple : undefined;
                                    const dp = !drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id), style: { cursor: "move" } } : {};

                                    // ═══ TELAIO — doppio rettangolo con spessore ═══
                                    if (el.type === "rect") return (
                                      <g key={el.id} {...dp}>
                                        <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#f8f8f6" stroke={hc || "#1A1A1C"} strokeWidth={1.5} rx={1} />
                                        <rect x={el.x + TK_FRAME} y={el.y + TK_FRAME} width={el.w - TK_FRAME * 2} height={el.h - TK_FRAME * 2} fill="none" stroke={hc || "#1A1A1C"} strokeWidth={1} rx={0.5} />
                                        {sel && [[el.x,el.y],[el.x+el.w,el.y],[el.x,el.y+el.h],[el.x+el.w,el.y+el.h]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={T.purple} />)}
                                      </g>
                                    );

                                    // ═══ MONTANTE — clipped to polygon ═══
                                    if (el.type === "montante") {
                                      const my1 = el.y1 !== undefined ? el.y1 : (frame ? frame.y : fY);
                                      const my2 = el.y2 !== undefined ? el.y2 : (frame ? frame.y + frame.h : fY + fH);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ew-resize" }}>
                                          <rect x={el.x - TK_MONT / 2} y={my1} width={TK_MONT} height={my2 - my1} fill="#e8e8e4" stroke={hc || "#555"} strokeWidth={0.8} />
                                          {sel && <><circle cx={el.x} cy={my1} r={4} fill={T.purple}/><circle cx={el.x} cy={my2} r={4} fill={T.purple}/></>}
                                        </g>
                                      );
                                    }

                                    // ═══ TRAVERSO — clipped to polygon ═══
                                    if (el.type === "traverso") {
                                      const tx1 = el.x1 !== undefined ? el.x1 : (frame ? frame.x : fX);
                                      const tx2 = el.x2 !== undefined ? el.x2 : (frame ? frame.x + frame.w : fX + fW);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ns-resize" }}>
                                          <rect x={tx1} y={el.y - TK_MONT / 2} width={tx2 - tx1} height={TK_MONT} fill="#e8e8e4" stroke={hc || "#555"} strokeWidth={0.8} />
                                          {sel && <><circle cx={tx1} cy={el.y} r={4} fill={T.purple}/><circle cx={tx2} cy={el.y} r={4} fill={T.purple}/></>}
                                        </g>
                                      );
                                    }

                                    // ═══ ANTA — doppio rettangolo, clipped to polygon ═══
                                    if (el.type === "innerRect") {
                                      const tk = el.subType === "porta" ? TK_PORTA : TK_ANTA;
                                      const clr = hc || (el.subType === "porta" ? "#444" : "#777");
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${vanoId})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="none" stroke={clr} strokeWidth={1} />
                                          <rect x={el.x + tk} y={el.y + tk} width={el.w - tk * 2} height={el.h - tk * 2} fill="none" stroke={clr} strokeWidth={0.6} />
                                          {el.subType === "porta" && <text x={el.x + el.w / 2} y={el.y + 12} textAnchor="middle" fontSize={7} fill="#555" fontWeight={700}>PORTA</text>}
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
                                      const tk = el.subType === "porta" ? TK_PORTA : TK_ANTA;
                                      // Outer polygon
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      // Inner polygon — shrink by tk toward centroid
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const innerPts = pts.map(p => {
                                        const dx2 = cx2 - p[0], dy2 = cy2 - p[1];
                                        const dist = Math.hypot(dx2, dy2) || 1;
                                        return [(p[0] + dx2 / dist * tk), (p[1] + dy2 / dist * tk)];
                                      });
                                      const innerStr = innerPts.map(p => p.join(",")).join(" ");
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
                                        {sel && [[el.cx,el.cy-el.r],[el.cx+el.r,el.cy],[el.cx,el.cy+el.r],[el.cx-el.r,el.cy]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={T.purple} />)}
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
                                        {sel && <rect x={el.x - 4} y={el.y - (el.fontSize || 11) - 2} width={Math.max(40, (el.text || "").length * 6)} height={(el.fontSize || 11) + 8} fill={`${T.purple}10`} stroke={T.purple} strokeWidth={1} strokeDasharray="3,2" rx={3} />}
                                        <text x={el.x} y={el.y} fontSize={el.fontSize || 11} fontWeight={700} fill={hc || "#333"} fontFamily="Inter, sans-serif">{el.text}</text>
                                      </g>
                                    );

                                    if (el.type === "freeLine") {
                                      const dx2 = el.x2 - el.x1, dy2 = el.y2 - el.y1;
                                      const len = Math.hypot(dx2, dy2) || 1;
                                      const halfT = TK_FRAME;
                                      const nx = -dy2 / len * halfT, ny = dx2 / len * halfT;
                                      // Dimension in mm
                                      const refLen = frame ? Math.max(frame.w, frame.h) : fW;
                                      const refReal = frame ? (frame.w >= frame.h ? realW : realH) : realW;
                                      const mmLen = Math.round(len / refLen * refReal);
                                      const midX = (el.x1 + el.x2) / 2, midY = (el.y1 + el.y2) / 2;
                                      const ang = Math.atan2(dy2, dx2) * 180 / Math.PI;
                                      const lx = midX + nx * 2, ly = midY + ny * 2;
                                      const isPartOfPoly = poly && poly.length >= 3;
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})}>
                                          {/* Wide transparent hit area */}
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="transparent" strokeWidth={14} />
                                          {/* Individual profile only if NOT part of closed polygon */}
                                          {!isPartOfPoly && <polygon points={`${el.x1+nx},${el.y1+ny} ${el.x2+nx},${el.y2+ny} ${el.x2-nx},${el.y2-ny} ${el.x1-nx},${el.y1-ny}`} fill="#f0efe8" stroke="#1A1A1C" strokeWidth={1} strokeLinejoin="miter" />}
                                          {sel && <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={T.purple} strokeWidth={3} opacity={0.4} />}
                                          {/* Dimension label */}
                                          <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${lx}, ${ly})`}>
                                            <rect x={lx - 18} y={ly - 7} width={36} height={14} fill="#fff" rx={3} stroke={T.acc} strokeWidth={0.6} opacity={0.9} />
                                            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={T.acc} fontFamily="monospace">{mmLen}</text>
                                          </g>
                                          {sel && <><circle cx={el.x1} cy={el.y1} r={5} fill={T.purple} /><circle cx={el.x2} cy={el.y2} r={5} fill={T.purple} /></>}
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
                                      const tw = String(el.label).length * 6.5 + 16;
                                      return (
                                        <g key={el.id} onClick={(e3) => {
                                          e3.stopPropagation();
                                          const nv = prompt("Misura (mm):", el.label);
                                          if (nv === null || !nv.trim()) return;
                                          const newVal = parseInt(nv.trim());
                                          const oldVal = parseInt(el.label);
                                          let upd = els.map(x => x.id === el.id ? { ...x, label: nv.trim() } : x);
                                          
                                          // If this is a sub-dimension (column width or row height), adjust structure
                                          if (!isNaN(newVal) && !isNaN(oldVal) && newVal !== oldVal && frame) {
                                            // Is this a column width? (horizontal dim above or below frame)
                                            const isColDim = isH && el.y1 < frame.y + frame.h / 2;
                                            // Is this a row height? (vertical dim left of frame)
                                            const isRowDim = !isH && el.x1 < frame.x + frame.w / 2;
                                            // Is this total width/height?
                                            const isTotalW = isH && Math.abs(el.x2 - el.x1 - frame.w) < 5;
                                            const isTotalH = !isH && Math.abs(el.y2 - el.y1 - frame.h) < 5;
                                            
                                            if (isColDim && !isTotalW) {
                                              // Find which column this dim spans, adjust montante
                                              const dimLeft = el.x1;
                                              const oldPixelW = el.x2 - el.x1;
                                              const scale = newVal / oldVal;
                                              const newPixelW = oldPixelW * scale;
                                              const diff = newPixelW - oldPixelW;
                                              // Move all montanti and elements that are to the right of this dim's right edge
                                              upd = upd.map(x => {
                                                if (x.type === "montante" && x.x >= el.x2 - 3) return { ...x, x: snap(x.x + diff) };
                                                if (x.type === "dim" && x !== el && x.x1 >= el.x2 - 3) return { ...x, x1: x.x1 + diff, x2: x.x2 + diff };
                                                if ((x.type === "innerRect" || x.type === "glass") && x.x >= el.x2 - 5) return { ...x, x: x.x + diff };
                                                return x;
                                              });
                                              // Update frame width
                                              upd = upd.map(x => x.type === "rect" ? { ...x, w: x.w + diff } : x);
                                            }
                                            if (isRowDim && !isTotalH) {
                                              const oldPixelH = el.y2 - el.y1;
                                              const scale = newVal / oldVal;
                                              const newPixelH = oldPixelH * scale;
                                              const diff = newPixelH - oldPixelH;
                                              upd = upd.map(x => {
                                                if (x.type === "traverso" && x.y >= el.y2 - 3) return { ...x, y: snap(x.y + diff) };
                                                if (x.type === "dim" && x !== el && x.y1 >= el.y2 - 3) return { ...x, y1: x.y1 + diff, y2: x.y2 + diff };
                                                if ((x.type === "innerRect" || x.type === "glass") && x.y >= el.y2 - 5) return { ...x, y: x.y + diff };
                                                return x;
                                              });
                                              upd = upd.map(x => x.type === "rect" ? { ...x, h: x.h + diff } : x);
                                            }
                                          }
                                          setDW(upd);
                                          // Sync total dimensions to main fields
                                          if (frame) {
                                            const isTW = isH && Math.abs(el.x2 - el.x1 - frame.w) < 5;
                                            const isTH = !isH && Math.abs(el.y2 - el.y1 - frame.h) < 5;
                                            if (isTW && !isNaN(newVal)) onUpdateField && onUpdateField("larghezza", newVal);
                                            if (isTH && !isNaN(newVal)) onUpdateField && onUpdateField("altezza", newVal);
                                          }
                                        }} style={{ cursor: "pointer" }}>
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={T.acc} strokeWidth={0.8} />
                                          {isH ? <><line x1={el.x1} y1={el.y1-5} x2={el.x1} y2={el.y1+5} stroke={T.acc} strokeWidth={0.8}/><line x1={el.x2} y1={el.y2-5} x2={el.x2} y2={el.y2+5} stroke={T.acc} strokeWidth={0.8}/></>
                                            : <><line x1={el.x1-5} y1={el.y1} x2={el.x1+5} y2={el.y1} stroke={T.acc} strokeWidth={0.8}/><line x1={el.x2-5} y1={el.y2} x2={el.x2+5} y2={el.y2} stroke={T.acc} strokeWidth={0.8}/></>}
                                          <rect x={mx2-tw/2} y={my2-9} width={tw} height={18} fill="#fff" rx={3} stroke={T.acc} strokeWidth={0.6}/>
                                          <text x={mx2} y={my2+4} textAnchor="middle" fontSize={10} fontWeight={800} fill={T.acc} fontFamily="monospace">{el.label}</text>
                                        </g>
                                      );
                                    }
                                    return null;
                                  })}

                                  {/* Pending line point + GUIDE */}
                                  {dw._pendingLine && (() => {
                                    const clr = drawMode === "apertura" ? T.blue : "#333";
                                    const p = dw._pendingLine;
                                    const gx = dw._guideX, gy = dw._guideY;
                                    return <>
                                      {/* H/V guide lines from pending point */}
                                      <line x1={0} y1={p.y1} x2={canvasW} y2={p.y1} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      <line x1={p.x1} y1={0} x2={p.x1} y2={canvasH} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      {/* Live guide line to mouse */}
                                      {gx != null && gy != null && <>
                                        <line x1={p.x1} y1={p.y1} x2={gx} y2={gy} stroke={clr} strokeWidth={1} strokeDasharray="6,3" opacity={0.5} />
                                        {/* H/V snap indicator */}
                                        {gx === p.x1 && <line x1={gx} y1={0} x2={gx} y2={canvasH} stroke={T.grn} strokeWidth={0.7} strokeDasharray="2,2" opacity={0.5} />}
                                        {gy === p.y1 && <line x1={0} y1={gy} x2={canvasW} y2={gy} stroke={T.grn} strokeWidth={0.7} strokeDasharray="2,2" opacity={0.5} />}
                                        {/* Angle + length label */}
                                        <rect x={gx + 8} y={gy - 20} width={72} height={18} fill="#333" rx={4} opacity={0.85} />
                                        <text x={gx + 44} y={gy - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="monospace">
                                          {dw._guideDeg != null ? `${dw._guideDeg}° ${dw._guideLen}mm` : ""}
                                        </text>
                                      </>}
                                      <circle cx={p.x1} cy={p.y1} r={6} fill={clr} fillOpacity={0.4} />
                                      <circle cx={p.x1} cy={p.y1} r={10} fill="none" stroke={clr} strokeWidth={1.5} strokeDasharray="3,2" />
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
                                </svg>
                                </div>

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
                            );
}
