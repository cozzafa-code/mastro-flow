"use client";
// @ts-nocheck
import React, { useState, useMemo, useRef } from "react";

const AMBER = "#D08008"; const DARK = "#1A1A1C"; const BDR = "#333";
const ALUMINIUM = "#A0A0A0";

export default function DisegnoTecnico({ realW, realH, onUpdate }) {
  const [L, setL] = useState(parseInt(realW) || 3000);
  const [H, setH] = useState(parseInt(realH) || 2500);
  const [montanti, setMontanti] = useState([{ id: "m1", x: 1500 }]);
  const [traversi, setTraversi] = useState([{ id: "t1", y: 2000 }]);
  const [config, setConfig] = useState({}); 

  const TIPI = ["fisso", "anta", "porta", "cieco"];
  const spP = 65; // Spessore profilo reale

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

  // --- DISEGNO DEI COMPONENTI REALI ---
  const renderCella = (c) => {
    const isSpecial = c.tipo !== "fisso";
    return (
      <g key={c.key} onClick={() => {
        const next = TIPI[(TIPI.indexOf(c.tipo) + 1) % TIPI.length];
        const newC = { ...config, [c.key]: next };
        setConfig(newC);
        onUpdate?.({ L, H, montanti, traversi, config: newC });
      }} style={{ cursor: "pointer" }}>
        
        {/* Vetro con riflesso reale */}
        <rect x={c.x + 5} y={c.y + 5} width={c.w - 10} height={c.h - 10} fill={c.tipo === "cieco" ? "#444" : "#1A2B3C"} stroke={BDR} />
        {!isSpecial && <path d={`M ${c.x+20} ${c.y+20} L ${c.x+50} ${c.y+50}`} stroke="#3A4B5C" strokeWidth="2" opacity="0.5" />}

        {/* Profilo anta interno (se non è fisso) */}
        {isSpecial && (
          <rect x={c.x + 10} y={c.y + 10} width={c.w - 20} height={c.h - 20} fill="none" stroke={ALUMINIUM} strokeWidth="4" />
        )}

        {/* Simboli di Apertura e Ferramenta */}
        {c.tipo === "anta" && (
          <>
            <path d={`M ${c.x+15} ${c.y+c.h/2} L ${c.x+c.w-20} ${c.y+20} V ${c.y+c.h-20} Z`} fill="none" stroke={AMBER} strokeWidth="2" strokeDasharray="8,4" />
            <rect x={c.x+c.w-35} y={c.y+c.h/2-25} width={8} height={50} rx={4} fill={AMBER} /> {/* Maniglia reale */}
          </>
        )}

        {c.tipo === "porta" && (
          <>
            <rect x={c.x+15} y={c.y+15} width={c.w-30} height={c.h-30} fill="none" stroke={ALUMINIUM} strokeWidth="6" />
            <rect x={c.x+c.w-45} y={c.y+c.h/2-60} width={12} height={120} rx={6} fill={AMBER} /> {/* Maniglione */}
            <circle cx={c.x+c.w-39} cy={c.y+c.h/2+80} r={5} fill="#666" /> {/* Serratura */}
          </>
        )}

        <text x={c.x+c.w/2} y={c.y+c.h-20} textAnchor="middle" fill="#888" fontSize="22" fontWeight="800">{c.w} x {c.h}</text>
      </g>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 20, display: "flex", gap: 15, background: DARK }}>
        <button onClick={() => setMontanti([...montanti, { id: Date.now(), x: L/2 }])} style={btn}>+ MONTANTE</button>
        <button onClick={() => setTraversi([...traversi, { id: Date.now(), y: H/2 }])} style={btn}>+ TRAVERSO</button>
      </div>

      <svg width="100%" height="100%" viewBox={`-100 -100 ${L + 200} ${H + 250}`} preserveAspectRatio="xMidYMid meet">
        {/* Telaio Perimetrale Esterno */}
        <rect x={0} y={0} width={L} height={H} fill="none" stroke={ALUMINIUM} strokeWidth="12" />
        
        {/* Griglia Montanti e Traversi */}
        {montanti.map(m => <line key={m.id} x1={m.x} y1={0} x2={m.x} y2={H} stroke={ALUMINIUM} strokeWidth="10" />)}
        {traversi.map(t => <line key={t.id} x1={0} y1={t.y} x2={L} y2={t.y} stroke={ALUMINIUM} strokeWidth="10" />)}

        {/* Render delle celle con componenti veri */}
        {grid.map(c => renderCella(c))}

        {/* Quote Gialle Professionali */}
        <g style={{ fontWeight: 900, fontSize: 80, fill: AMBER }}>
          <text x={L/2} y="-30" textAnchor="middle">{L} mm</text>
          <text x="-30" y={H/2} textAnchor="middle" transform={`rotate(-90,-30,${H/2})`}>{H} mm</text>
        </g>
      </svg>
    </div>
  );
}

const btn = { padding: "12px 25px", background: AMBER, border: "none", borderRadius: 10, fontWeight: 900, cursor: "pointer" };