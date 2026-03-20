"use client";
// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect } from "react";

const AMBER = "#D08008"; const DARK = "#1A1A1C"; const GREEN = "#1A9E73";
const RED = "#DC4444"; const BLUE = "#3B7FE0"; const BDR = "#E0DED8";

export default function DisegnoTecnico({ realW, realH, onUpdate, mode = "marketing" }) {
  const [L, setL] = useState(parseInt(realW) || 2000);
  const [H, setH] = useState(parseInt(realH) || 2500);
  
  // STATO STRUTTURALE: Montanti e Traversi liberi
  const [montanti, setMontanti] = useState([{ id: "m1", x: L / 2 }]);
  const [traversi, setTraversi] = useState([{ id: "t1", y: H / 2 }]);
  const [config, setConfig] = useState({}); // Mappa delle celle: { "0-0": "fisso", "1-0": "porta" }
  
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npTarget, setNpTarget] = useState(null);
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);

  const spP = 65; // Spessore profilo standard
  const TIPI = ["fisso", "anta_ar", "porta", "wasistas", "cieco"];

  // Calcolo delle Celle (La "Matrice" della Facciata)
  const grid = useMemo(() => {
    const xPts = [0, ...montanti.map(m => m.x), L].sort((a, b) => a - b);
    const yPts = [0, ...traversi.map(t => t.y), H].sort((a, b) => a - b);
    const cells = [];
    for (let iy = 0; iy < yPts.length - 1; iy++) {
      for (let ix = 0; ix < xPts.length - 1; ix++) {
        const key = `${ix}-${iy}`;
        cells.push({
          key, x: xPts[ix], y: yPts[iy],
          w: xPts[ix+1] - xPts[ix], h: yPts[iy+1] - yPts[iy],
          tipo: config[key] || "fisso"
        });
      }
    }
    return cells;
  }, [montanti, traversi, L, H, config]);

  const sendUpdate = (newL = L, newH = H) => {
    const ml = (newL*2 + newH*2 + montanti.length*newH + traversi.length*newL) / 1000;
    const mq = (newL * newH) / 1000000;
    onUpdate?.({
      L: newL, H: newH, montanti, traversi, config,
      stats: {
        uw: (1.2 + (ml * 0.02)).toFixed(2),
        peso: Math.round(mq * 25),
        sfrido: (ml % 6).toFixed(1),
        ore: (grid.length * 1.5).toFixed(1)
      }
    });
  };

  const isMkt = mode === "marketing";
  const stroke = isMkt ? AMBER : DARK;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", background: isMkt ? DARK : "#F2F1EC", overflow: "hidden" }}
         onMouseMove={(e) => {
            if (!dragging || !svgRef.current) return;
            const CTM = svgRef.current.getScreenCTM();
            const pt = { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
            if (dragging.type === 'm') setMontanti(prev => prev.map(m => m.id === dragging.id ? { ...m, x: Math.round(Math.max(100, Math.min(L - 100, pt.x))) } : m));
            if (dragging.type === 't') setTraversi(prev => prev.map(t => t.id === dragging.id ? { ...t, y: Math.round(Math.max(100, Math.min(H - 100, pt.y))) } : t));
         }} onMouseUp={() => { if(dragging) sendUpdate(); setDragging(null); }}>
      
      {/* TOOLBAR INTERNA CAD */}
      <div style={{ position:"absolute", top:20, left:20, display:"flex", gap:10, zIndex:10 }}>
        <button onClick={() => setMontanti([...montanti, {id:Date.now(), x:L/2}])} style={toolBtn}>+ MONTANTE</button>
        <button onClick={() => setTraversi([...traversi, {id:Date.now(), y:H/2}])} style={toolBtn}>+ TRAVERSO</button>
      </div>

      <svg ref={svgRef} width="100%" height="100%" viewBox={`-150 -150 ${L + 300} ${H + 400}`} preserveAspectRatio="xMidYMid meet">
        <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill={stroke}/></marker></defs>
        
        {/* DISEGNO STRUTTURA */}
        {grid.map(c => (
          <g key={c.key} style={{ cursor: "pointer" }} onClick={() => {
            const next = TIPI[(TIPI.indexOf(c.tipo) + 1) % TIPI.length];
            setConfig({...config, [c.key]: next}); sendUpdate();
          }}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.tipo==="fisso"?"transparent":AMBER+"15"} stroke={stroke} strokeWidth="2" />
            <text x={c.x + c.w/2} y={c.y + c.h/2} textAnchor="middle" fontSize="30" fontWeight="800" fill={stroke} opacity="0.5">{c.tipo.toUpperCase()}</text>
            {c.tipo === "anta_ar" && <path d={`M ${c.x+20} ${c.y+c.h/2} L ${c.x+c.w-20} ${c.y+20} V ${c.y+c.h-20} Z`} fill="none" stroke={stroke} strokeDasharray="10,5" opacity="0.3" />}
          </g>
        ))}

        {/* HANDLE DI TRASCINAMENTO */}
        {montanti.map(m => <rect key={m.id} x={m.x-15} y={0} width={30} height={H} fill={AMBER} style={{cursor:"ew-resize"}} onMouseDown={()=>setDragging({id:m.id,type:'m'})} />)}
        {traversi.map(t => <rect key={t.id} x={0} y={t.y-15} width={L} height={30} fill={AMBER} style={{cursor:"ns-resize"}} onMouseDown={()=>setDragging({id:t.id,type:'t'})} />)}

        {/* QUOTE DINAMICHE */}
        <text x={L/2} y="-80" textAnchor="middle" fontSize="100" fontWeight="900" fill={stroke} onClick={()=>{setNpTarget("L");setNpValue(L.toString());setShowNumpad(true)}}>{L} mm</text>
        <text x="-120" y={H/2} textAnchor="middle" fontSize="100" fontWeight="900" fill={stroke} transform={`rotate(-90,-120,${H/2})`} onClick={()=>{setNpTarget("H");setNpValue(H.toString());setShowNumpad(true)}}>{H} mm</text>
      </svg>

      {showNumpad && (
        <div style={numpadBox}>
          <div style={{fontSize:80, color:AMBER, textAlign:"right", marginBottom:20}}>{npValue}</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:15}}>
            {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k => (
              <button key={k} onClick={() => {
                if(k==="OK") { if(npTarget==="L") setL(parseInt(npValue)); else setH(parseInt(npValue)); setShowNumpad(false); sendUpdate(); }
                else if(k==="⌫") setNpValue(v => v.slice(0,-1));
                else setNpValue(v => v + k);
              }} style={npBtn}>{k}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const toolBtn = { padding:"10px 20px", background:AMBER, color:"#000", border:"none", borderRadius:8, fontWeight:900, cursor:"pointer", fontSize:12 };
const numpadBox = { position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:DARK, padding:40, borderRadius:30, border:`8px solid ${AMBER}`, zIndex:100 };
const npBtn = { width:80, height:80, background:"#333", color:"#fff", border:"none", borderRadius:15, fontSize:24, fontWeight:900 };