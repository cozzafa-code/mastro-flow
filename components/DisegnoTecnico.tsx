"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO APEX V130 — UNIVERSAL CONNECTOR (DEPOLY READY)
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useEffect } from "react";

const DB = {
  SISTEMI: {
    ALLUMINIO: { sp: 65, costoMl: 28.5, uf: 2.1, psi: 0.05, col: "#1A1A1C" },
    PVC:       { sp: 85, costoMl: 18.2, uf: 0.8, psi: 0.02, col: "#F2F1EC" },
    LEGNO:     { sp: 80, costoMl: 72.0, uf: 1.0, psi: 0.04, col: "#4E342E" }
  },
  VETRI: [
    { id: "4-16-4", label: "4-16-4 Std", pesoMq: 20, costoMq: 55, ug: 1.1, ps: 12 },
    { id: "lam", label: "33.1 Safetop", pesoMq: 32, costoMq: 115, ug: 1.1, ps: 14 },
    { id: "tri", label: "Triplo 0.5", pesoMq: 45, costoMq: 195, ug: 0.5, ps: 18 }
  ],
  TIPI: ["vuoto", "fisso", "anta_ar", "porta", "wasistas"]
};

export default function DisegnoTecnico({ realW, realH, vanoNome, onUpdate, mode = "industrial" }: any) {
  // Inizializzazione dalle Props di Claude
  const [L, setL] = useState(parseInt(realW) || 1500);
  const [H, setH] = useState(parseInt(realH) || 2100);
  const [sistema, setSistema] = useState("ALLUMINIO");
  const [montanti, setMontanti] = useState([{ id: "m1", x: L / 2 }]);
  const [traversi, setTraversi] = useState([]);
  const [config, setConfig] = useState({});
  const [vetriConfig, setVetriConfig] = useState({});
  
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npTarget, setNpTarget] = useState(null);
  const [dragging, setDragging] = useState(null);

  const svgRef = useRef(null);
  const spP = DB.SISTEMI[sistema].sp;

  // Sincronizzazione Real-Time con i campi input di Claude
  useEffect(() => {
    const valW = parseInt(realW);
    const valH = parseInt(realH);
    if (valW && valW !== L) setL(valW);
    if (valH && valH !== H) setH(valH);
  }, [realW, realH]);

  // Calcolo Geometria e Business Stats
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
        cells.push({
          key, x: xPts[ix] + (ix > 0 ? spP/2 : 0), y: yPts[iy] + (iy > 0 ? spP/2 : 0),
          w, h, mq, tipo: config[key] || "vuoto", vId, qr: `QR-${key}`,
          peso: Math.round(mq * vDati.pesoMq), ug: vDati.ug, rugiada: vDati.ps < 13
        });
      }
    }
    return cells;
  }, [montanti, traversi, L, H, config, vetriConfig, spP]);

  const stats = useMemo(() => {
    const ml = (L*2 + H*2 + montanti.length*H + traversi.length*L) / 1000;
    const nBarre = Math.ceil(ml / 6);
    return {
      uw: "1.25", // Esempio calcolo
      peso: grid.reduce((acc, c) => acc + c.peso, 0),
      sfrido: (((nBarre * 6) - ml) / (nBarre * 6) * 100).toFixed(1),
      condensa: grid.some(c => c.rugiada)
    };
  }, [L, H, montanti, traversi, grid]);

  // Invio dati al componente Padre (Claude)
  const sendUpdate = (newL = L, newH = H) => {
    onUpdate?.({
      L: newL,
      H: newH,
      montanti,
      traversi,
      config,
      vetriConfig,
      sistema,
      stats
    });
  };

  const isMkt = mode === "marketing";
  const stroke = isMkt ? "#D08008" : "#1A1A1C";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: isMkt ? "#1A1A1C" : "transparent" }}
         onMouseMove={(e) => {
            if (!dragging || !svgRef.current) return;
            const CTM = svgRef.current.getScreenCTM();
            const pt = { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
            if (dragging.type === 'm') setMontanti(prev => prev.map(m => m.id === dragging.id ? { ...m, x: Math.round(Math.max(spP*2, Math.min(L - spP*2, pt.x))) } : m));
            else setTraversi(prev => prev.map(t => t.id === dragging.id ? { ...t, y: Math.round(Math.max(spP*2, Math.min(H - spP*2, pt.y))) } : t));
         }} onMouseUp={() => { if(dragging) sendUpdate(); setDragging(null); }}>
      
      <svg ref={svgRef} width="90%" height="90%" viewBox={`-200 -250 ${L + 400} ${H + 500}`} preserveAspectRatio="xMidYMid meet">
        <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill={stroke}/></marker></defs>
        
        {/* Disegno Infisso */}
        <g fill="none" stroke={stroke} strokeWidth={isMkt ? 6 : 2}>
          <rect x={0} y={0} width={L} height={H} />
          <line x1={0} y1={0} x2={spP} y2={spP} /><line x1={L} y1={0} x2={L-spP} y2={spP} />
          <line x1={0} y1={H} x2={spP} y2={H-spP} /><line x1={L} y1={H} x2={L-spP} y2={H-spP} />
        </g>

        {/* Celle Interattive */}
        {grid.map(c => (
          <g key={c.key} style={{ cursor: "pointer" }} onClick={() => {
            const next = DB.TIPI[(DB.TIPI.indexOf(c.tipo) + 1) % DB.TIPI.length];
            setConfig({...config, [c.key]: next}); sendUpdate();
          }}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="transparent" stroke={stroke} strokeWidth="1" strokeOpacity="0.2" />
            <text x={c.x + c.w/2} y={c.y + c.h/2} textAnchor="middle" fontSize="40" fontWeight="bold" fill={stroke} opacity="0.3">{c.tipo.toUpperCase()}</text>
          </g>
        ))}

        {/* Montanti / Traversi Mobili */}
        {montanti.map(m => <rect key={m.id} x={m.x-spP/2} y={0} width={spP} height={H} fill="#D08008" style={{cursor:"ew-resize"}} onMouseDown={()=>setDragging({id:m.id,type:'m'})} />)}
        {traversi.map(t => <rect key={t.id} x={0} y={t.y-spP/2} width={L} height={spP} fill="#D08008" style={{cursor:"ns-resize"}} onMouseDown={()=>setDragging({id:t.id,type:'t'})} />)}

        {/* Quote con Numpad Trigger */}
        <g cursor="pointer" onClick={() => { setNpTarget('L'); setShowNumpad(true); setNpValue(L.toString()); }}>
          <text x={L/2} y="-150" textAnchor="middle" fontSize="180" fontWeight="900" fill={stroke}>{L} mm</text>
          <path d={`M 0 -100 H ${L}`} stroke={stroke} strokeWidth="8" markerStart="url(#arr)" markerEnd="url(#arr)" />
        </g>
        <g cursor="pointer" onClick={() => { setNpTarget('H'); setShowNumpad(true); setNpValue(H.toString()); }}>
          <text x="-200" y={H/2} textAnchor="middle" fontSize="180" fontWeight="900" fill={stroke} transform={`rotate(-90,-200,${H/2})`}>{H} mm</text>
          <path d={`M -140 0 V ${H}`} stroke={stroke} strokeWidth="8" markerStart="url(#arr)" markerEnd="url(#arr)" />
        </g>
      </svg>

      {/* Numpad "Titan" Overlay */}
      {showNumpad && (
        <div style={{ position: "absolute", background: "#1A1A1C", padding: 40, borderRadius: 40, border: "10px solid #D08008", zIndex: 9999, boxShadow: "0 0 100px rgba(0,0,0,0.8)" }}>
          <div style={{ fontSize: 100, color: "#D08008", textAlign: "right", borderBottom: "4px solid #333", marginBottom: 30, fontWeight: 900 }}>{npValue}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k => (
              <button key={k} onClick={() => {
                if(k === "OK") { 
                  const v = parseInt(npValue); if(npTarget === 'L') { setL(v); sendUpdate(v, H); } else { setH(v); sendUpdate(L, v); }
                  setShowNumpad(false); setNpValue("");
                } else if(k === "⌫") setNpValue(v => v.slice(0,-1));
                else if(npValue.length < 5) setNpValue(v => v + k);
              }} style={{ width: 100, height: 100, borderRadius: 20, background: "#333", color: "#FFF", fontSize: 32, fontWeight: "bold", border: "none" }}>{k}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}