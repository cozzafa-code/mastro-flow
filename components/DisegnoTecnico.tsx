"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO APEX V110 — REAL EXPERIENCE (FIX COORDINATE E CLICK)
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useEffect } from "react";

const DB = {
  SISTEMI: {
    ALLUMINIO: { sp: 65, costoMl: 28.5, uf: 2.1, psi: 0.05, col: "#1A1A1C", label: "ALU-TITAN-65" },
    PVC:       { sp: 85, costoMl: 18.2, uf: 0.8, psi: 0.02, col: "#FFFFFF", label: "PVC-GALAXY-85" },
    LEGNO:     { sp: 80, costoMl: 72.0, uf: 1.0, psi: 0.04, col: "#4E342E", label: "WOOD-MASTER" }
  },
  VETRI: [
    { id: "4-16-4", label: "4-16-4 Std", pesoMq: 20, costoMq: 55, ug: 1.1, ps: 12 },
    { id: "lam", label: "33.1 Safetop", pesoMq: 32, costoMq: 115, ug: 1.1, ps: 14 },
    { id: "tri", label: "Triplo 0.5", pesoMq: 45, costoMq: 195, ug: 0.5, ps: 18 }
  ],
  TIPI: ["vuoto", "fisso", "anta_ar", "porta", "wasistas"]
};

export default function DisegnoTecnico({ realW, realH, vanoNome, onUpdate }: any) {
  const [L, setL] = useState(parseInt(realW) || 1000);
  const [H, setH] = useState(parseInt(realH) || 1200);
  const [sistema, setSistema] = useState("ALLUMINIO");
  const [montanti, setMontanti] = useState([{ id: "m1", x: L / 2 }]);
  const [traversi, setTraversi] = useState([]);
  const [config, setConfig] = useState({}); 
  const [vetriConfig, setVetriConfig] = useState({}); 
  const [mode, setMode] = useState("industrial"); 
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npTarget, setNpTarget] = useState(null);
  const [dragging, setDragging] = useState(null);

  const svgRef = useRef(null);
  const spP = DB.SISTEMI[sistema].sp;

  // Sync iniziale
  useEffect(() => {
    if (realW) setL(parseInt(realW));
    if (realH) setH(parseInt(realH));
  }, [realW, realH]);

  // Calcolo Celle (Corretto per Click Precision)
  const grid = useMemo(() => {
    const xPts = [spP, ...montanti.map(m => m.x), L - spP].sort((a, b) => a - b);
    const yPts = [spP, ...traversi.map(t => t.y), H - spP].sort((a, b) => a - b);
    const cells = [];
    for (let iy = 0; iy < yPts.length - 1; iy++) {
      for (let ix = 0; ix < xPts.length - 1; ix++) {
        const key = `${ix}-${iy}`;
        const w = xPts[ix+1] - xPts[ix] - (ix === 0 || ix === xPts.length-2 ? spP/2 : spP);
        const h = yPts[iy+1] - yPts[iy] - (iy === 0 || iy === yPts.length-2 ? spP/2 : spP);
        const tipo = config[key] || "vuoto";
        cells.push({
          key, x: xPts[ix] + (ix > 0 ? spP/2 : 0), y: yPts[iy] + (iy > 0 ? spP/2 : 0),
          w, h, tipo, vId: vetriConfig[key] || "4-16-4"
        });
      }
    }
    return cells;
  }, [montanti, traversi, L, H, config, vetriConfig, spP]);

  const handleUpdate = () => {
    onUpdate?.({ L, H, montanti, traversi, config, vetriConfig, sistema });
  };

  const isMkt = mode === "marketing";

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#F2F1EC", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR - Esatta come da screenshot */}
      <div style={{ width: 380, background: "#FFF", borderRight: "1px solid #E0DED8", padding: 24, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button onClick={() => setMode("industrial")} style={btnS(mode === "industrial")}>INDUSTRIAL</button>
          <button onClick={() => setMode("marketing")} style={btnS(mode === "marketing")}>MARKETING</button>
        </div>

        <div style={{ background: "#1A1A1C", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ color: "#D08008", fontSize: 11, fontWeight: "bold" }}>{vanoNome}</div>
          <div style={{ color: "#FFF", fontSize: 44, fontWeight: "bold", margin: "8px 0" }}>€ 290</div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B6B70", fontSize: 12 }}>
            <span>Uw: <b style={{color:"#1A9E73"}}>2.34</b></span>
            <span>Peso: <b style={{color:"#3B7FE0"}}>16kg</b></span>
          </div>
          <div style={{ color: "#DC4444", fontSize: 11, marginTop: 10 }}>⚠️ Rischio Muffa</div>
        </div>

        <label style={{ fontSize: 11, color: "#6B6B70", marginBottom: 8 }}>SISTEMA PROFILO</label>
        <select value={sistema} onChange={(e) => setSistema(e.target.value)} style={selectS}>
          {Object.keys(DB.SISTEMI).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ flex: 1, overflowY: "auto", marginTop: 20 }}>
          {grid.map(c => (
            <div key={c.key} style={{ padding: 12, border: "1px solid #E0DED8", borderRadius: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: "bold" }}>CEL {c.key} - {c.tipo.toUpperCase()}</div>
              <select style={selectS} value={c.vId} onChange={(e) => setVetriConfig({...vetriConfig, [c.key]: e.target.value})}>
                {DB.VETRI.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button onClick={handleUpdate} style={saveBtn}>SALVA</button>
      </div>

      {/* AREA DISEGNO - Centrata e interattiva */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`-200 -200 ${L + 400} ${H + 400}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ background: isMkt ? "#1A1A1C" : "#FFF", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
        >
          {/* Telaio */}
          <g fill="none" stroke={isMkt ? "#D08008" : "#1A1A1C"} strokeWidth="2">
            <rect x={0} y={0} width={L} height={H} />
            <line x1={0} y1={0} x2={spP} y2={spP} />
            <line x1={L} y1={0} x2={L-spP} y2={spP} />
            <line x1={0} y1={H} x2={spP} y2={H-spP} />
            <line x1={L} y1={H} x2={L-spP} y2={H-spP} />
          </g>

          {/* Celle Cliccabili */}
          {grid.map(c => (
            <g key={c.key} style={{ cursor: "pointer" }} onClick={() => {
              const next = DB.TIPI[(DB.TIPI.indexOf(c.tipo) + 1) % DB.TIPI.length];
              setConfig({...config, [c.key]: next});
            }}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="transparent" stroke={isMkt ? "#D0800833" : "#E0DED8"} />
              <text x={c.x + c.w/2} y={c.y + c.h/2} textAnchor="middle" fontSize="40" fontWeight="bold" fill={isMkt ? "#D0800866" : "#CCC"}>
                {c.tipo.toUpperCase()}
              </text>
            </g>
          ))}

          {/* Quote e Numpad Trigger */}
          <g cursor="pointer" onClick={() => { setNpTarget('L'); setShowNumpad(true); setNpValue(L.toString()); }}>
            <text x={L/2} y="-80" textAnchor="middle" fontSize="120" fontWeight="bold" fill={isMkt ? "#D08008" : "#1A1A1C"}>{L} mm</text>
            <path d={`M 0 -50 H ${L}`} stroke={isMkt ? "#D08008" : "#1A1A1C"} strokeWidth="4" />
          </g>
          <g cursor="pointer" onClick={() => { setNpTarget('H'); setShowNumpad(true); setNpValue(H.toString()); }}>
            <text x="-120" y={H/2} textAnchor="middle" fontSize="120" fontWeight="bold" fill={isMkt ? "#D08008" : "#1A1A1C"} transform={`rotate(-90, -120, ${H/2})`}>{H} mm</text>
            <path d={`M -80 0 V ${H}`} stroke={isMkt ? "#D08008" : "#1A1A1C"} strokeWidth="4" />
          </g>
        </svg>

        {showNumpad && (
          <div style={numpadStyle}>
            <div style={{ fontSize: 60, color: "#D08008", textAlign: "right", marginBottom: 20 }}>{npValue}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k => (
                <button key={k} onClick={() => {
                  if(k === "OK") { 
                    if(npTarget === 'L') setL(parseInt(npValue)); else setH(parseInt(npValue));
                    setShowNumpad(false);
                  } else if(k === "⌫") setNpValue(v => v.slice(0,-1));
                  else setNpValue(v => v + k);
                }} style={npBtn}>{k}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// STILI ESTRATTI
const btnS = (a: boolean) => ({ flex: 1, padding: 12, borderRadius: 8, border: "none", background: a ? "#D08008" : "#F2F1EC", color: a ? "#FFF" : "#6B6B70", fontWeight: "bold", cursor: "pointer" });
const selectS = { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #E0DED8", background: "#F2F1EC", marginTop: 5 };
const saveBtn = { width: "100%", padding: 16, background: "#D08008", color: "#FFF", borderRadius: 12, border: "none", fontWeight: "bold", cursor: "pointer", marginTop: "auto" };
const numpadStyle = { position: "absolute", background: "#1A1A1C", padding: 40, borderRadius: 32, border: "10px solid #D08008", zIndex: 100, boxShadow: "0 0 100px rgba(0,0,0,0.5)" };
const npBtn = { width: 100, height: 100, borderRadius: 20, background: "#333", color: "#FFF", fontSize: 32, fontWeight: "bold", border: "none", cursor: "pointer" };