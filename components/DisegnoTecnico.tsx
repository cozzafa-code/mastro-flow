"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO APEX PREDATOR V100 — INTEGRATED EDITION
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useEffect } from "react";

const DB = {
  SISTEMI: {
    ALLUMINIO: { sp: 65, costoMl: 28.5, uf: 2.1, psi: 0.05, col: "#1A1A1C", label: "TITAN-ALU-65" },
    PVC:       { sp: 85, costoMl: 18.2, uf: 0.8, psi: 0.02, col: "#FFFFFF", label: "GALAXY-PVC-85" },
    LEGNO:     { sp: 80, costoMl: 72.0, uf: 1.0, psi: 0.04, col: "#4E342E", label: "MASTER-WOOD-80" }
  },
  VETRI: [
    { id: "4-16-4", label: "4-16-4 Std", pesoMq: 20, costoMq: 55, ug: 1.1, limiteMq: 2.5, ps: 12 },
    { id: "lam", label: "33.1 Safetop", pesoMq: 32, costoMq: 115, ug: 1.1, limiteMq: 5.5, ps: 14 },
    { id: "triplo", label: "Triplo 0.5", pesoMq: 45, costoMq: 195, ug: 0.5, limiteMq: 4.2, ps: 18 },
    { id: "blind", label: "P8B Blindato", pesoMq: 85, costoMq: 550, ug: 1.3, limiteMq: 8.0, ps: 10 }
  ],
  OFFICINA: { cerniera: 18.0, maniglia: 28.0, guarnizioneMl: 2.5, costoOra: 50.0 }
};

export default function DisegnoTecnico({ realW, realH, vanoNome, onUpdate }: any) {
  // Integrazione Props Esterne
  const [L, setL] = useState(parseInt(realW) || 1000);
  const [H, setH] = useState(parseInt(realH) || 1200);
  
  const [sistema, setSistema] = useState("ALLUMINIO");
  const [montanti, setMontanti] = useState([{ id: "m1", x: L / 2 }]);
  const [traversi, setTraversi] = useState([]);
  const [config, setConfig] = useState({}); 
  const [vetriConfig, setVetriConfig] = useState({}); 
  
  const [mode, setMode] = useState("industrial"); // "industrial" o "marketing"
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npTarget, setNpTarget] = useState(null);
  const [dragging, setDragging] = useState(null);

  const svgRef = useRef(null);
  const sis = DB.SISTEMI[sistema];
  const spP = sis.sp;
  const sc = 0.22;

  // Sincronizzazione se le props cambiano dall'esterno
  useEffect(() => {
    if (realW) setL(parseInt(realW));
    if (realH) setH(parseInt(realH));
  }, [realW, realH]);

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
        let cerniere = (tipo === "anta_ar" || tipo === "porta") ? (h > 1800 || mq*vDati.pesoMq > 100 ? 4 : 3) : 0;

        cells.push({
          key, x: xPts[ix] + (ix > 0 ? spP/2 : 0), y: yPts[iy] + (iy > 0 ? spP/2 : 0),
          w, h, mq, tipo, vId, qr: `QR-${key}`,
          peso: Math.round(mq * vDati.pesoMq), costoV: Math.round(mq * vDati.costoMq),
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

    return { 
        tot: Math.round(ml * sis.costoMl + grid.reduce((acc,c)=>acc+c.costoV+c.costoAcc,0) + (oreProd * DB.OFFICINA.costoOra)), 
        peso: grid.reduce((acc,c)=>acc+c.peso, 0), uw, sfrido: (((nBarre * 6) - ml) / (nBarre * 6) * 100).toFixed(1), 
        barre: nBarre, ore: oreProd.toFixed(1), condensa: grid.some(c => c.rugiada), critico: grid.some(c => c.danger) || H > 2800
    };
  }, [L, H, montanti, traversi, grid, sis]);

  // Funzione salvataggio unificata
  const handleSave = (newL = L, newH = H) => {
    onUpdate?.({
      L: newL,
      H: newH,
      montanti,
      traversi,
      config,
      vetriConfig,
      stats,
      sistema,
      vanoNome
    });
  };

  const handleNpKey = (k: string) => {
    if (k === "OK") {
      const v = parseInt(npValue) || 0;
      if (npTarget === 'L') { setL(v); handleSave(v, H); } 
      else { setH(v); handleSave(L, v); }
      setShowNumpad(false); setNpValue(""); return;
    }
    if (k === "⌫") { setNpValue(v => v.slice(0, -1)); return; }
    if (npValue.length < 5) setNpValue(v => v + k);
  };

  // Colori dinamici in base alla modalità
  const isMkt = mode === "marketing";
  const canvasBg = isMkt ? "#1A1A1C" : "#FFFFFF";
  const stroke = isMkt ? "#D08008" : "#1A1A1C";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F2F1EC", fontFamily: "Inter, sans-serif", color: "#1A1A1C", overflow: "hidden" }}
         onMouseMove={(e) => {
            if (!dragging || !svgRef.current) return;
            const CTM = svgRef.current.getScreenCTM();
            const pt = { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
            if (dragging.type === 'm') setMontanti(prev => prev.map(m => m.id === dragging.id ? { ...m, x: Math.round(Math.max(spP*2, Math.min(L - spP*2, pt.x))) } : m));
            else setTraversi(prev => prev.map(t => t.id === dragging.id ? { ...t, y: Math.round(Math.max(spP*2, Math.min(H - spP*2, pt.y))) } : t));
         }} onMouseUp={() => { if(dragging) handleSave(); setDragging(null); }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 440, background: "#FFFFFF", padding: 25, borderRight: "1px solid #E0DED8", display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "4px 0 15px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setMode("industrial")} style={modeBtn(mode === "industrial")}>INDUSTRIAL</button>
          <button onClick={() => setMode("marketing")} style={modeBtn(mode === "marketing")}>MARKETING</button>
        </div>

        <div style={{ background: "#1A1A1C", padding: 20, borderRadius: 16, border: `2px solid ${stats.critico ? "#DC4444" : "#D08008"}`, marginBottom: 15 }}>
          <div style={{ fontSize: 10, color: "#D08008", fontWeight: 700, letterSpacing: 1.5 }}>{vanoNome || "CONFIGURAZIONE"}</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#FFFFFF", margin: "5px 0" }}>€ {stats.tot}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
            <div style={{ color: "#1A9E73" }}>Uw: <b>{stats.uw}</b></div>
            <div style={{ color: "#3B7FE0" }}>Peso: <b>{stats.peso}kg</b></div>
            <div style={{ color: "#6B6B70" }}>Sfrido: {stats.sfrido}%</div>
            <div style={{ color: stats.condensa ? "#DC4444" : "#6B6B70" }}>{stats.condensa ? "⚠️ Rischio Muffa" : "✅ Termica OK"}</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: "#6B6B70", fontWeight: 600 }}>SISTEMA PROFILO</label>
          <select value={sistema} onChange={e => {setSistema(e.target.value); handleSave();}} style={selStyle}>
            {Object.keys(DB.SISTEMI).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {grid.map(c => c.tipo !== "vuoto" && (
            <div key={c.key} style={{ padding: 15, background: "#F2F1EC", borderRadius: 12, marginBottom: 8, border: `1px solid ${c.rugiada ? "#DC4444" : "#E0DED8"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
                <span>CEL {c.key}</span>
                <span style={{ color: "#D08008" }}>€ {c.costoV + c.costoAcc}</span>
              </div>
              <select value={c.vId} onChange={e => {setVetriConfig({...vetriConfig, [c.key]: e.target.value}); handleSave();}} style={selStyleMini}>
                {DB.VETRI.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button onClick={() => handleSave()} style={saveBtn}>SALVA COMMESSA</button>
      </div>

      {/* CAD AREA */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg ref={svgRef} width={L*sc+100} height={H*sc+100} viewBox={`-300 -300 ${L+600} ${H+600}`} style={{ background: canvasBg, borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
          <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill={stroke}/></marker></defs>
          
          <g fill={isMkt ? "none" : canvasBg} stroke={stroke} strokeWidth={isMkt ? 6 : 2}>
            <rect x={0} y={0} width={L} height={H} />
            <line x1={0} y1={0} x2={spP} y2={spP} /><line x1={L} y1={0} x2={L-spP} y2={spP} />
            <line x1={0} y1={H} x2={spP} y2={H-spP} /><line x1={L} y1={H} x2={L-spP} y2={H-spP} />
          </g>

          {grid.map(c => (
            <g key={c.key} onClick={() => {setConfig({...config, [c.key]: DB.TIPI_CELLA[(DB.TIPI_CELLA.indexOf(c.tipo)+1)%DB.TIPI_CELLA.length]}); handleSave();}}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.tipo==="vuoto"?"transparent":"#3B7FE010"} stroke={c.rugiada?"#DC4444":stroke} strokeWidth={c.rugiada?4:1} />
              <text x={c.x+c.w/2} y={c.y+c.h/2} textAnchor="middle" fontSize="50" fill={stroke} fontWeight="800" opacity="0.6">{c.tipo.toUpperCase()}</text>
            </g>
          ))}

          {montanti.map(m => <rect key={m.id} x={m.x-spP/2} y={0} width={spP} height={H} fill="#D08008" style={{cursor:"ew-resize"}} onMouseDown={()=>setDragging({id:m.id,type:'m'})} />)}
          {traversi.map(t => <rect key={t.id} x={0} y={t.y-spP/2} width={L} height={spP} fill="#D08008" style={{cursor:"ns-resize"}} onMouseDown={()=>setDragging({id:t.id,type:'t'})} />)}

          <g cursor="pointer" onClick={() => { setNpTarget('L'); setShowNumpad(true); setNpValue(L.toString()); }}>
            <text x={L/2} y="-160" fill={stroke} textAnchor="middle" fontSize="220" fontWeight="900">{L} mm</text>
            <path d={`M 0 -110 L ${L} -110`} stroke={stroke} strokeWidth="10" markerStart="url(#arr)" markerEnd="url(#arr)" />
          </g>
          <g cursor="pointer" onClick={() => { setNpTarget('H'); setShowNumpad(true); setNpValue(H.toString()); }}>
            <text x="-240" y={H/2} fill={stroke} textAnchor="middle" fontSize="220" fontWeight="900" transform={`rotate(-90,-240,${H/2})`}>{H} mm</text>
            <path d={`M -190 0 L -190 ${H}`} stroke={stroke} strokeWidth="10" markerStart="url(#arr)" markerEnd="url(#arr)" />
          </g>
          
          <g transform={`translate(0, ${H + 180})`} fontSize="24" fill={stroke} fontWeight="800">
             <text x="0" y="0">SEZIONE TECNICA: {sistema} ({spP}mm)</text>
             <rect x="0" y="30" width="300" height="60" fill={isMkt ? "#000" : "#F2F1EC"} stroke={stroke} />
             <rect x="320" y="30" width={spP} height="60" fill="#D08008" />
          </g>
        </svg>

        {showNumpad && (
          <div style={{ position: "absolute", right: 60, top: "5%", background: "#1A1A1C", padding: 60, borderRadius: 60, border: "20px solid #D08008", boxShadow: "0 0 500px rgba(0,0,0,0.8)", zIndex: 9999 }}>
            <div style={{ fontSize: 180, color: "#D08008", textAlign: "right", borderBottom: "10px solid #333", marginBottom: 30, paddingBottom: 20, fontWeight: 900 }}>{npValue || "0"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k => (
                <button key={k} onClick={()=>handleNpKey(k.toString())} style={{ width:160, height:160, background:k==="OK"?"#1A9E73":"#333", color:"#fff", border:"none", borderRadius:40, fontSize:70, fontWeight:950, cursor:"pointer" }}>{k}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const modeBtn = (a: boolean) => ({ flex:1, padding:12, fontSize:12, fontWeight:700, borderRadius:8, border:"none", background:a?"#D08008":"#F2F1EC", color:a?"#FFF":"#6B6B70", cursor:"pointer" });
const selStyle = { width: "100%", padding: 15, background: "#F2F1EC", color: "#1A1A1C", border: "1px solid #E0DED8", borderRadius: 10, fontSize: 16, fontWeight: 700, marginBottom: 20, marginTop: 5 };
const selStyleMini = { width: "100%", background: "#FFF", color: "#1A1A1C", border: "1px solid #E0DED8", padding: 10, fontSize: 14, borderRadius: 8, marginTop: 8 };
const saveBtn = { width: "100%", background: "#D08008", color: "#FFF", padding: 25, borderRadius: 16, fontWeight: 800, fontSize: 18, border: "none", cursor: "pointer", marginTop: 25 };