"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════
// MASTRO — CassonettoEditor
// Mini-CAD sezione cassonetto: materiali per lato, scala, misure
// ═══════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from "react";

// ── MATERIALI DEFAULT ────────────────────────────────
const MAT_DEFAULT = [
  { id: "pvc",      label: "PVC",           color: "#93C5FD", border: "#3B7FE0", spessore: 4  },
  { id: "alluminio",label: "Alluminio",     color: "#CBD5E1", border: "#64748B", spessore: 2  },
  { id: "eps",      label: "Coib. EPS",     color: "#FDE68A", border: "#D08008", spessore: 30 },
  { id: "legno",    label: "Legno",         color: "#D6B896", border: "#92400E", spessore: 18 },
  { id: "acciaio",  label: "Acciaio",       color: "#9CA3AF", border: "#374151", spessore: 2  },
  { id: "poliur",   label: "Poliuretano",   color: "#A7F3D0", border: "#059669", spessore: 20 },
  { id: "vuoto",    label: "Aria",          color: "#F0F9FF", border: "#BAE6FD", spessore: 0  },
];

const LATI = ["superiore", "sinistro", "destro", "inferiore"] as const;
type Lato = typeof LATI[number];

interface LatiMat {
  superiore: string;
  sinistro:  string;
  destro:    string;
  inferiore: string;
}

interface Props {
  misure: {
    casL: number; casH: number; casP: number;
    casLCiel: number; casPCiel: number;
  };
  onUpdate: (field: string, val: number) => void;
  onClose?: () => void;
}

const SVG_W = 600, SVG_H = 480, PAD = 60;

export default function CassonettoEditor({ misure, onUpdate, onClose }: Props) {
  const { casL = 1200, casH = 200, casP = 250, casLCiel = 120, casPCiel = 100 } = misure;

  // ── STATE ────────────────────────────────────────────
  const [materiali, setMateriali] = useState<typeof MAT_DEFAULT>([...MAT_DEFAULT]);
  const [latiMat, setLatiMat] = useState<LatiMat>({
    superiore: "pvc", sinistro: "pvc", destro: "pvc", inferiore: "pvc"
  });
  const [selectedLato, setSelectedLato] = useState<Lato | null>(null);
  const [showMatPanel, setShowMatPanel] = useState(false);
  const [toolMisura, setToolMisura] = useState(false);
  const [misuraA, setMisuraA] = useState<{x:number,y:number}|null>(null);
  const [misuraB, setMisuraB] = useState<{x:number,y:number}|null>(null);
  const [editMat, setEditMat] = useState<string|null>(null);
  const [showMatEditor, setShowMatEditor] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<string|null>(null);

  // ── SCALA ────────────────────────────────────────────
  const scP = (SVG_W - PAD*2) / Math.max(casP, 50);
  const scH = (SVG_H - PAD*2 - 30) / Math.max(casH + 30, 80);
  const sc  = Math.min(scP, scH, 1.5);

  // Coordinate box cassonetto nel SVG
  const bx = PAD, by = SVG_H - PAD - 20; // 20 = feritoia
  const bw = casP * sc, bh = casH * sc;
  const ferH = 18;

  // Spessori lati in pixel
  const getMat = (id: string) => materiali.find(m => m.id === id) || materiali[0];
  const spT = Math.max(getMat(latiMat.superiore).spessore * sc, 3);
  const spS = Math.max(getMat(latiMat.sinistro).spessore * sc, 3);
  const spD = Math.max(getMat(latiMat.destro).spessore * sc, 3);
  const spB = Math.max(getMat(latiMat.inferiore).spessore * sc, 3);

  // Rullo
  const rulloR = Math.min(bw * 0.22, (bh - spT) * 0.45, 35);
  const rCx = bx + spS + (bw - spS - spD) / 2;
  const rCy = by - bh + spT + rulloR + 4;

  // Cielino
  const cielW = Math.min(casPCiel * sc, bw - spS - spD);
  const cielH = Math.max(8, Math.min(casLCiel * sc * 0.06, 20));

  // Scala grafica (mm per pixel)
  const mmPerPx = 1 / sc;

  // ── SVG POINT ────────────────────────────────────────
  const svgPoint = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (SVG_W / r.width),
      y: (e.clientY - r.top)  * (SVG_H / r.height),
    };
  };

  // ── DRAG RESIZE ──────────────────────────────────────
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { x, y } = svgPoint(e);
    if (dragRef.current === "P") onUpdate("casP", Math.max(50, Math.round((x - bx) / sc)));
    if (dragRef.current === "H") onUpdate("casH", Math.max(50, Math.round((by - y) / sc)));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (toolMisura && misuraA === null) {
      setMisuraA(svgPoint(e));
    } else if (toolMisura && misuraA !== null && misuraB === null) {
      setMisuraB(svgPoint(e));
    }
    dragRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  // ── MISURA DISTANZA ──────────────────────────────────
  const misuraDist = misuraA && misuraB
    ? Math.round(Math.hypot(misuraB.x - misuraA.x, misuraB.y - misuraA.y) * mmPerPx)
    : null;

  // ── HIT TEST LATO ────────────────────────────────────
  const hitLato = (x: number, y: number): Lato | null => {
    const tol = 12;
    if (Math.abs(y - (by - bh)) < tol && x > bx && x < bx + bw) return "superiore";
    if (Math.abs(y - by)        < tol && x > bx && x < bx + bw) return "inferiore";
    if (Math.abs(x - bx)        < tol && y > by - bh && y < by) return "sinistro";
    if (Math.abs(x - (bx + bw)) < tol && y > by - bh && y < by) return "destro";
    return null;
  };

  const onSvgClick = (e: React.MouseEvent) => {
    if (toolMisura) return;
    const { x, y } = svgPoint(e as any);
    const lato = hitLato(x, y);
    if (lato) { setSelectedLato(lato); setShowMatPanel(true); }
    else { setSelectedLato(null); setShowMatPanel(false); }
  };

  // ── MAT HELPERS ──────────────────────────────────────
  const assignMat = (matId: string) => {
    if (!selectedLato) return;
    setLatiMat(l => ({ ...l, [selectedLato]: matId }));
    setShowMatPanel(false);
    setSelectedLato(null);
  };

  const latoLabel: Record<Lato, string> = {
    superiore: "Lato superiore", sinistro: "Lato sinistro",
    destro: "Lato destro", inferiore: "Lato inferiore"
  };

  // ── RENDER ───────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 4000,
      background: "#fff", display: "flex", flexDirection: "column",
      fontFamily: "'Inter',sans-serif"
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background: "#1A2B4A", padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>
            Editor cassonetto
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>
            Tap lato → assegna materiale · Trascina handle per ridimensionare
          </div>
        </div>
        {/* Tool misura */}
        <div
          onClick={() => { setToolMisura(t => !t); setMisuraA(null); setMisuraB(null); }}
          style={{
            padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
            background: toolMisura ? "#3B7FE0" : "rgba(255,255,255,0.12)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.2)"
          }}>
          📐 Misura
        </div>
        {/* Editor materiali */}
        <div
          onClick={() => setShowMatEditor(m => !m)}
          style={{
            padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
            background: showMatEditor ? "#D08008" : "rgba(255,255,255,0.12)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.2)"
          }}>
          🎨 Materiali
        </div>
        {onClose && (
          <div onClick={onClose}
            style={{ color: "rgba(255,255,255,0.6)", fontSize: 24, cursor: "pointer", padding: "0 4px" }}>
            ×
          </div>
        )}
      </div>

      {/* ── EDITOR MATERIALI ── */}
      {showMatEditor && (
        <div style={{
          background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
          padding: "10px 16px", flexShrink: 0
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#1A2B4A", marginBottom: 8, textTransform: "uppercase" }}>
            Libreria materiali
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {materiali.map(mat => (
              <div key={mat.id} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 10px", borderRadius: 8,
                border: `1.5px solid ${mat.border}`,
                background: mat.color + "40"
              }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: mat.color, border: `1px solid ${mat.border}` }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{mat.label}</span>
                <input
                  type="number"
                  value={mat.spessore}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 0;
                    setMateriali(ms => ms.map(m => m.id === mat.id ? { ...m, spessore: v } : m));
                  }}
                  style={{
                    width: 40, padding: "2px 4px", borderRadius: 4,
                    border: "1px solid #E2E8F0", fontSize: 11,
                    fontFamily: "'JetBrains Mono',monospace", textAlign: "center"
                  }}
                />
                <span style={{ fontSize: 9, color: "#64748B" }}>mm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SVG AREA ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", background: "#EFF8FF" }}>
        <svg
          ref={svgRef}
          width="100%" height="100%"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ cursor: toolMisura ? "crosshair" : "default", userSelect: "none" }}
          onClick={onSvgClick}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => { dragRef.current = null; }}
        >
          {/* Griglia */}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={"gx"+i} x1={i*50} y1={0} x2={i*50} y2={SVG_H} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={"gy"+i} x1={0} y1={i*50} x2={SVG_W} y2={i*50} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}

          {/* Muro sx */}
          <rect x={bx-18} y={by-bh-8} width={14} height={bh+ferH+16}
            fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5"/>
          <text x={bx-11} y={by-bh/2} textAnchor="middle" fontSize="8" fill="#64748B"
            transform={`rotate(-90,${bx-11},${by-bh/2})`}>MURO</text>

          {/* Lato superiore */}
          <rect x={bx} y={by-bh} width={bw} height={spT}
            fill={getMat(latiMat.superiore).color}
            stroke={selectedLato==="superiore" ? "#F59E0B" : getMat(latiMat.superiore).border}
            strokeWidth={selectedLato==="superiore" ? 2.5 : 1.5}
            style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelectedLato("superiore");setShowMatPanel(true);}}/>

          {/* Lato sinistro */}
          <rect x={bx} y={by-bh} width={spS} height={bh}
            fill={getMat(latiMat.sinistro).color}
            stroke={selectedLato==="sinistro" ? "#F59E0B" : getMat(latiMat.sinistro).border}
            strokeWidth={selectedLato==="sinistro" ? 2.5 : 1.5}
            style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelectedLato("sinistro");setShowMatPanel(true);}}/>

          {/* Lato destro */}
          <rect x={bx+bw-spD} y={by-bh} width={spD} height={bh}
            fill={getMat(latiMat.destro).color}
            stroke={selectedLato==="destro" ? "#F59E0B" : getMat(latiMat.destro).border}
            strokeWidth={selectedLato==="destro" ? 2.5 : 1.5}
            style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelectedLato("destro");setShowMatPanel(true);}}/>

          {/* Lato inferiore */}
          <rect x={bx} y={by-spB} width={bw} height={spB}
            fill={getMat(latiMat.inferiore).color}
            stroke={selectedLato==="inferiore" ? "#F59E0B" : getMat(latiMat.inferiore).border}
            strokeWidth={selectedLato==="inferiore" ? 2.5 : 1.5}
            style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelectedLato("inferiore");setShowMatPanel(true);}}/>

          {/* Sfondo interno */}
          <rect x={bx+spS} y={by-bh+spT} width={bw-spS-spD} height={bh-spT-spB}
            fill="#EFF8FF" opacity="0.7"/>

          {/* Rullo */}
          <circle cx={rCx} cy={rCy} r={rulloR}
            fill="#DBEAFE" stroke="#3B7FE0" strokeWidth="1.5" strokeDasharray="5,3"/>
          <circle cx={rCx} cy={rCy} r={rulloR*0.28}
            fill="#3B7FE0" opacity="0.5"/>
          <text x={rCx} y={rCy+4} textAnchor="middle" fontSize="9" fill="#1E40AF" fontWeight="700">RULLO</text>

          {/* Feritoia */}
          <rect x={bx} y={by} width={bw} height={ferH}
            fill="#1A2B4A18" stroke="#1A2B4A" strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x={bx+bw/2} y={by+ferH*0.72} textAnchor="middle" fontSize="8" fill="#1A2B4A" fontWeight="700">
            feritoia tapparella
          </text>

          {/* Cielino */}
          <rect x={bx+spS} y={by-spB-cielH} width={cielW} height={cielH}
            fill="#FDE68A" stroke="#D08008" strokeWidth="1.2" strokeDasharray="4,2" rx="2"/>
          {cielW > 40 && (
            <text x={bx+spS+cielW/2} y={by-spB-cielH/2+3} textAnchor="middle"
              fontSize="8" fill="#92400E" fontWeight="700">cielino</text>
          )}

          {/* Label mat lati */}
          {(["superiore","sinistro","destro","inferiore"] as Lato[]).map(l => {
            const mat = getMat(latiMat[l]);
            let tx=0, ty=0;
            if(l==="superiore"){tx=bx+bw/2; ty=by-bh-10;}
            if(l==="inferiore"){tx=bx+bw/2; ty=by-spB-10;}
            if(l==="sinistro"){tx=bx+2; ty=by-bh/2;}
            if(l==="destro"){tx=bx+bw-2; ty=by-bh/2;}
            return (
              <text key={l} x={tx} y={ty} textAnchor="middle" fontSize="8"
                fill={mat.border} fontWeight="700"
                transform={l==="sinistro"?`rotate(-90,${tx},${ty})`:l==="destro"?`rotate(90,${tx},${ty})`:""}
                style={{pointerEvents:"none"}}>
                {mat.label} {mat.spessore}mm
              </text>
            );
          })}

          {/* Quote Profondità */}
          <line x1={bx} y1={by+ferH+14} x2={bx+bw} y2={by+ferH+14} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx} y1={by+ferH+10} x2={bx} y2={by+ferH+18} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx+bw} y1={by+ferH+10} x2={bx+bw} y2={by+ferH+18} stroke="#1A2B4A" strokeWidth="1"/>
          <text x={bx+bw/2} y={by+ferH+26} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">
            {casP}mm
          </text>

          {/* Quote Altezza */}
          <line x1={bx+bw+16} y1={by-bh} x2={bx+bw+16} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx+bw+12} y1={by-bh} x2={bx+bw+20} y2={by-bh} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx+bw+12} y1={by} x2={bx+bw+20} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
          <text x={bx+bw+28} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
            transform={`rotate(90,${bx+bw+28},${by-bh/2+4})`}>{casH}mm</text>

          {/* Handle Profondità */}
          <circle cx={bx+bw} cy={by-bh/2} r={8}
            fill="#1A2B4A" stroke="#fff" strokeWidth="2" style={{cursor:"ew-resize"}}
            onPointerDown={e=>{e.stopPropagation();dragRef.current="P";svgRef.current?.setPointerCapture(e.pointerId);}}/>
          <text x={bx+bw} y={by-bh/2+4} textAnchor="middle" fontSize="11" fill="#fff" style={{pointerEvents:"none"}}>↔</text>

          {/* Handle Altezza */}
          <circle cx={bx+bw/2} cy={by-bh} r={8}
            fill="#1A2B4A" stroke="#fff" strokeWidth="2" style={{cursor:"ns-resize"}}
            onPointerDown={e=>{e.stopPropagation();dragRef.current="H";svgRef.current?.setPointerCapture(e.pointerId);}}/>
          <text x={bx+bw/2} y={by-bh+4} textAnchor="middle" fontSize="11" fill="#fff" style={{pointerEvents:"none"}}>↕</text>

          {/* Scala grafica */}
          <g transform={`translate(${PAD},${SVG_H-18})`}>
            <line x1={0} y1={0} x2={100*sc} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
            <line x1={0} y1={-4} x2={0} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
            <line x1={100*sc} y1={-4} x2={100*sc} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
            <text x={50*sc} y={-6} textAnchor="middle" fontSize="9" fill="#1A2B4A" fontWeight="700">100mm</text>
          </g>

          {/* Strumento misura */}
          {toolMisura && misuraA && (
            <circle cx={misuraA.x} cy={misuraA.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>
          )}
          {toolMisura && misuraA && misuraB && (
            <>
              <line x1={misuraA.x} y1={misuraA.y} x2={misuraB.x} y2={misuraB.y}
                stroke="#DC4444" strokeWidth="1.5" strokeDasharray="5,3"/>
              <circle cx={misuraB.x} cy={misuraB.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>
              <rect x={(misuraA.x+misuraB.x)/2-24} y={(misuraA.y+misuraB.y)/2-10} width={48} height={16} rx="4"
                fill="#DC4444"/>
              <text x={(misuraA.x+misuraB.x)/2} y={(misuraA.y+misuraB.y)/2+4} textAnchor="middle"
                fontSize="10" fill="#fff" fontWeight="800">{misuraDist}mm</text>
            </>
          )}
        </svg>

        {/* Hint misura */}
        {toolMisura && (
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            background: "#DC4444", color: "#fff", padding: "4px 12px", borderRadius: 8,
            fontSize: 11, fontWeight: 700, pointerEvents: "none"
          }}>
            {!misuraA ? "Tap punto A" : !misuraB ? "Tap punto B" : `${misuraDist}mm — tap per nuova misura`}
          </div>
        )}
        {toolMisura && misuraB && (
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)" }}>
            <div onClick={() => { setMisuraA(null); setMisuraB(null); }}
              style={{
                background: "#DC4444", color: "#fff", padding: "6px 16px",
                borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700
              }}>Nuova misura</div>
          </div>
        )}
      </div>

      {/* ── PANNELLO SELEZIONE MATERIALE ── */}
      {showMatPanel && selectedLato && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 5000,
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "flex-end", justifyContent: "center"
        }} onClick={() => { setShowMatPanel(false); setSelectedLato(null); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "16px 16px 0 0",
            padding: "16px", width: "100%", maxWidth: 480
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1A2B4A", marginBottom: 12 }}>
              {latoLabel[selectedLato]} — scegli materiale
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {materiali.map(mat => (
                <div key={mat.id}
                  onClick={() => assignMat(mat.id)}
                  style={{
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${latiMat[selectedLato]===mat.id ? mat.border : "#E2E8F0"}`,
                    background: mat.color + "60",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: mat.color, border: `1.5px solid ${mat.border}` }}/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{mat.label}</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>{mat.spessore}mm</div>
                  </div>
                  {latiMat[selectedLato]===mat.id && (
                    <span style={{ marginLeft: "auto", color: mat.border, fontSize: 14 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "10px", textAlign: "center", color: "#94A3B8",
              fontSize: 12, cursor: "pointer" }}
              onClick={() => { setShowMatPanel(false); setSelectedLato(null); }}>
              Annulla
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPI NUMERICI ── */}
      <div style={{
        background: "#fff", borderTop: "1px solid #E2E8F0",
        padding: "8px 12px", flexShrink: 0,
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6
      }}>
        {[
          { label: "Larghezza", field: "casL", val: casL },
          { label: "Altezza",   field: "casH", val: casH },
          { label: "Profondità",field: "casP", val: casP },
          { label: "Ciel. L",   field: "casLCiel", val: casLCiel },
          { label: "Ciel. P",   field: "casPCiel", val: casPCiel },
        ].map(({ label, field, val }) => (
          <div key={field}>
            <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginBottom: 2 }}>{label}</div>
            <input type="number" inputMode="numeric" value={val || ""}
              placeholder="mm"
              onChange={e => onUpdate(field, parseInt(e.target.value) || 0)}
              style={{
                width: "100%", padding: "6px 4px", borderRadius: 6,
                border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 800,
                fontFamily: "'JetBrains Mono',monospace", textAlign: "center",
                background: "#F8FAFC", color: "#1A2B4A", boxSizing: "border-box"
              }}/>
          </div>
        ))}
      </div>
    </div>
  );
}
