"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO ULTRA-DOMINATOR V100 — THE ETERNAL FACTORY SYSTEM
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef } from "react";

// --- DATABASE SUPREMO ---
const DB = {
  SISTEMI: {
    ALLUMINIO: { sp: 65, costoMl: 28.5, uf: 2.1, psi: 0.05, col: "#0a0a0a", label: "ALU-TITAN-PRO" },
    PVC:       { sp: 85, costoMl: 18.2, uf: 0.8, psi: 0.02, col: "#fcfcfc", label: "PVC-GALAXY-85" },
    LEGNO:     { sp: 80, costoMl: 72.0, uf: 1.0, psi: 0.04, col: "#3e2723", label: "WOOD-MASTER-80" }
  },
  VETRI: [
    { id: "4-16-4", label: "4-16-4 Std", pesoMq: 20, costoMq: 55, ug: 1.1, limiteMq: 2.5, ps: 12 }, // ps = punto rugiada stimato
    { id: "lam", label: "33.1 Safetop", pesoMq: 32, costoMq: 115, ug: 1.1, limiteMq: 5.5, ps: 14 },
    { id: "triplo", label: "Triplo 0.5", pesoMq: 45, costoMq: 195, ug: 0.5, limiteMq: 4.2, ps: 18 },
    { id: "blind", label: "P8B Blindato", pesoMq: 85, costoMq: 550, ug: 1.3, limiteMq: 8.0, ps: 10 }
  ],
  OFFICINA: { cerniera: 18.0, maniglia: 28.0, guarnizioneMl: 2.5, costoOra: 50.0 }
};

export default function DisegnoTecnico({ realW, realH, vanoNome, onUpdate }: any) {
  const [L, setL] = useState(parseInt(realW) || 2400);
  const [H, setH] = useState(parseInt(realH) || 2200);
  const [sistema, setSistema] = useState("ALLUMINIO");
  const [montanti, setMontanti] = useState([{ id: "m1", x: 1200 }]);
  const [traversi, setTraversi] = useState([{ id: "t1", y: 1800 }]);
  const [config, setConfig] = useState({}); 
  const [vetriConfig, setVetriConfig] = useState({}); 
  const [mode, setMode] = useState("render"); 
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npTarget, setNpTarget] = useState(null);
  const [dragging, setDragging] = useState(null);

  const svgRef = useRef(null);
  const sis = DB.SISTEMI[sistema];
  const spP = sis.sp;
  const sc = 0.18;

  // --- ENGINE ANALITICO V100 ---
  const grid = useMemo(() => {
    const xPts = [spP, ...montanti.map(m => m.x), L - spP].sort((a, b) => a - b);
    const yPts = [spP, ...traversi.map(t => t.y), H - spP].sort((a, b) => a - b);
    const cells = [];
    for (let iy = 0; iy < yPts.length - 1; iy++) {
      for (let ix = 0; ix < xPts.length - 1; ix++) {
        const key = `${ix}-${iy}`;
        const w = xPts[ix+1] - xPts[ix] - (ix === 0 || ix === xPts.length-2 ? spP/2 : spP);
        const h = yPts[iy+1] - yPts[iy] - (iy === 0 || iy === yPts.length-2 ? spP/2 : spP);
        const vId = vetriConfig[key] || "4-16-4";
        const vDati = DB.VETRI.find(v => v.id === vId);
        const mq = (w * h) / 1000000;
        const tipo = config[key] || "vuoto";
        
        let cerniere = 0;
        if (tipo === "anta_ar" || tipo === "porta") cerniere = (h > 1800 || mq*vDati.pesoMq > 100) ? 4 : 3;

        cells.push({
          key, x: xPts[ix] + (ix > 0 ? spP/2 : 0), y: yPts[iy] + (iy > 0 ? spP/2 : 0),
          w, h, mq, tipo, vId, qr: `QR-${key}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          peso: Math.round(mq * vDati.pesoMq),
          costoV: Math.round(mq * vDati.costoMq),
          costoAcc: (cerniere * DB.OFFICINA.cerniera) + (tipo !== "vuoto" && tipo !== "fisso" ? DB.OFFICINA.maniglia : 0),
          ug: vDati.ug, danger: mq > vDati.limiteMq, rugiada: vDati.ps < 13, perim: (w*2 + h*2)/1000
        });
      }
    }
    return cells;
  }, [montanti, traversi, L, H, config, vetriConfig, spP]);

  const stats = useMemo(() => {
    const ml = (L*2 + H*2 + montanti.length*H + traversi.length*L) / 1000;
    const areaT = (L * H) / 1000000;
    const areaV = grid.reduce((acc, c) => acc + (c.tipo !== "vuoto" ? c.mq : 0), 0);
    const uw = ((areaV * (grid[0]?.ug || 1.1) + (areaT - areaV) * sis.uf + (grid.reduce((acc,c)=>acc+c.perim,0) * sis.psi)) / areaT).toFixed(2);
    const nBarre = Math.ceil(ml / 6);
    const oreProd = (grid.filter(c=>c.tipo!=="vuoto").length * 2) + (ml * 0.3);
    const volume = (areaT * 0.15).toFixed(2); // Volume stimato imballo (m3)

    return { 
        tot: Math.round(ml * sis.costoMl + grid.reduce((acc,c)=>acc+c.costoV+c.costoAcc,0) + (oreProd * DB.OFFICINA.costoOra)), 
        peso: grid.reduce((acc,c)=>acc+c.peso, 0), uw, sfrido: (((nBarre * 6) - ml) / (nBarre * 6) * 100).toFixed(1), 
        barre: nBarre, ore: oreProd.toFixed(1), vol: volume,
        condensa: grid.some(c => c.rugiada), critico: grid.some(c => c.danger) || H > 2800
    };
  }, [L, H, montanti, traversi, grid, sis]);

  const handleNpKey = (k: string) => {
    if (k === "OK") { setL(parseInt(npValue) || L); setShowNumpad(false); setNpValue(""); return; }
    if (k === "⌫") { setNpValue(v => v.slice(0, -1)); return; }
    setNpValue(v => v + k);
  };

  const isTec = mode === "tecnico";
  const stroke = isTec ? "#000" : "#fbbf24";

  return (
    <div style={{ display: "flex", height: "100vh", background: isTec ? "#FFF" : "#0d1117", fontFamily: "monospace", overflow: "hidden" }}
         onMouseMove={(e) => {
            if (!dragging || !svgRef.current) return;
            const CTM = svgRef.current.getScreenCTM();
            const pt = { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
            if (dragging.type === 'm') setMontanti(prev => prev.map(m => m.id === dragging.id ? { ...m, x: Math.round(Math.max(spP*2, Math.min(L - spP*2, pt.x))) } : m));
            else setTraversi(prev => prev.map(t => t.id === dragging.id ? { ...t, y: Math.round(Math.max(spP*2, Math.min(H - spP*2, pt.y))) } : t));
         }} onMouseUp={() => setDragging(null)}>
      
      {/* SIDEBAR V100 TOTAL CONTROL */}
      <div style={{ width: 480, background: isTec ? "#F0F2F5" : "#161b22", padding: 30, borderRight: "1px solid #333", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setMode("tecnico")} style={btnS(isTec)}>📐 INDUSTRIAL</button>
          <button onClick={() => setMode("render")} style={btnS(!isTec)}>🎨 MARKETING</button>
        </div>

        <div style={{ background: "#000", padding: 25, borderRadius: 25, border: `4px solid ${stats.critico ? "#F00" : "#fbbf24"}`, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 900, letterSpacing: 3 }}>MASTRO DOMINATOR V100</div>
          <div style={{ fontSize: 62, fontWeight: 950, color: "#fbbf24" }}>€ {stats.tot}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginTop: 20, fontSize: 14 }}>
            <div style={{ color: "#10B981" }}>Efficienza: <b>{stats.uw} Uw</b></div>
            <div style={{ color: "#3B82F6" }}>Massa: <b>{stats.peso}kg</b></div>
            <div style={{ color: "#888" }}>Sfrido: {stats.sfrido}%</div>
            <div style={{ color: stats.condensa ? "#F00" : "#888" }}>Condensa: {stats.condensa ? "ALTO RISCHIO" : "ASSENTE"}</div>
            <div style={{ color: "#888" }}>Volume: {stats.vol}m³</div>
            <div style={{ color: "#fbbf24" }}>Lavoro: {stats.ore}h</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <select value={sistema} onChange={e => setSistema(e.target.value)} style={selStyle}>
            {Object.keys(DB.SISTEMI).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {grid.map(c => c.tipo !== "vuoto" && (
            <div key={c.key} style={{ padding: 20, background: c.rugiada ? "#421" : "#0d1117", borderRadius: 20, marginBottom: 12, border: `2px solid ${c.rugiada ? "#F00" : "#333"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#eee" }}>
                <span>ID: {c.qr}</span>
                <span style={{ color: "#fbbf24", fontWeight: 900 }}>€ {c.costoV + c.costoAcc}</span>
              </div>
              <select value={c.vId} onChange={e => setVetriConfig({...vetriConfig, [c.key]: e.target.value})} style={selStyleMini}>
                {DB.VETRI.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              {c.rugiada && <div style={{ fontSize: 9, color: "#F00", marginTop: 8, fontWeight: "bold" }}>⚠️ RISCHIO CONDENSA/MUFFA - USA WARM EDGE</div>}
            </div>
          ))}
        </div>

        <button onClick={() => onUpdate?.({L, H, montanti, traversi, config, vetriConfig, stats, sistema})} style={saveBtn}>STAMPA ETICHETTE QR & SALVA ERP</button>
      </div>

      {/* CAD CANVAS V100 */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg ref={svgRef} width={L*sc+100} height={H*sc+100} viewBox={`-300 -300 ${L+600} ${H+600}`}>
          <g fill={isTec ? "none" : sis.col} stroke={stroke} strokeWidth={isTec ? 1 : 8}>
            <rect x={0} y={0} width={L} height={H} />
            <line x1={0} y1={0} x2={spP} y2={spP} /><line x1={L} y1={0} x2={L-spP} y2={spP} />
            <line x1={0} y1={H} x2={spP} y2={H-spP} /><line x1={L} y1={H} x2={L-spP} y2={H-spP} />
          </g>

          {grid.map(c => (
            <g key={c.key} onClick={() => setConfig({...config, [c.key]: DB.TIPI_CELLA[(DB.TIPI_CELLA.indexOf(c.tipo)+1)%DB.TIPI_CELLA.length]})}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.tipo==="vuoto"?"transparent":(c.rugiada?"#F002":"#1e3a8a30")} stroke={c.rugiada?"#F00":stroke} strokeWidth={c.rugiada?15:1} />
              <text x={c.x+c.w/2} y={c.y+c.h/2} textAnchor="middle" fontSize="65" fill={stroke} fontWeight="950">{c.tipo.toUpperCase()}</text>
              <text x={c.x+10} y={c.y+c.h-10} fontSize="12" fill="#888">{c.qr}</text>
            </g>
          ))}

          {montanti.map(m => <rect key={m.id} x={m.x-spP/2} y={0} width={spP} height={H} fill="#fbbf24" style={{cursor:"ew-resize"}} onMouseDown={()=>setDragging({id:m.id,type:'m'})} />)}
          {traversi.map(t => <rect key={t.id} x={0} y={t.y-spP/2} width={L} height={spP} fill="#fbbf24" style={{cursor:"ns-resize"}} onMouseDown={()=>setDragging({id:t.id,type:'t'})} />)}

          {/* QUOTE TITANICHE 2026 */}
          <g cursor="pointer" onClick={() => { setNpTarget('L'); setShowNumpad(true); setNpValue(L.toString()); }}>
            <text x={L/2} y="-220" fill={stroke} textAnchor="middle" fontSize="280" fontWeight="950">{L} mm</text>
            <path d={`M 0 -140 L ${L} -140`} stroke={stroke} strokeWidth="15" markerStart="url(#arr)" markerEnd="url(#arr)" />
          </g>
          <g cursor="pointer" onClick={() => { setNpTarget('H'); setShowNumpad(true); setNpValue(H.toString()); }}>
            <text x="-280" y={H/2} fill={stroke} textAnchor="middle" fontSize="280" fontWeight="950" transform={`rotate(-90,-280,${H/2})`}>{H} mm</text>
            <path d={`M -200 0 L -200 ${H}`} stroke={stroke} strokeWidth="15" markerStart="url(#arr)" markerEnd="url(#arr)" />
          </g>
          <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill={stroke}/></marker></defs>
        </svg>

        {/* NUMPAD GORILLA 9.0 — 240px */}
        {showNumpad && (
          <div style={{ position: "absolute", right: 60, top: "2%", background: "#000", padding: 80, borderRadius: 80, border: "30px solid #fbbf24", boxShadow: "0 0 500px rgba(0,0,0,1)", zIndex: 9999 }}>
            <div style={{ fontSize: 260, color: "#fbbf24", textAlign: "right", borderBottom: "25 Gemini " }}>{npValue || "0"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
              {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k => (
                <button key={k} onClick={()=>{ if(k==="OK"){ setL(parseInt(npValue)); setShowNumpad(false); setNpValue(""); } else if(k==="⌫") setNpValue(v=>v.slice(0,-1)); else setNpValue(v=>v+k); }} style={{ width:240, height:240, background:k==="OK"?"#10b981":"#222", color:"#fff", border:"none", borderRadius:70, fontSize:120, fontWeight:950, cursor:"pointer" }}>{k}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnS = (a: any) => ({ flex:1, padding:30, fontSize:22, fontWeight:900, borderRadius:25, border:"none", background:a?"#fbbf24":"#333", color:a?"#000":"#888", cursor:"pointer" });
const selStyle = { width: "100%", padding: 40, background: "#000", color: "#fbbf24", border: "5px solid #444", borderRadius: 35, fontSize: 34, fontWeight: 950, marginBottom: 40 };
const selStyleMini = { width: "100%", background: "#161b22", color: "#fbbf24", border: "1px solid #444", padding: 25, fontSize: 22, borderRadius: 25, marginTop: 20 };
const saveBtn = { width: "100%", background: "#fbbf24", color: "#000", padding: 50, borderRadius: 50, fontWeight: 950, fontSize: 34, border: "none", cursor: "pointer", marginTop: 50 };