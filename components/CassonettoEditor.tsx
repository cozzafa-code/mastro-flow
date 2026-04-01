"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════
// MASTRO — CassonettoEditor
// CAD sezione cassonetto: materiali per lato, scala, misure
// ═══════════════════════════════════════════════════════
import React, { useState, useRef } from "react";

const MAT_LIST = [
  { id:"pvc",      label:"PVC",         color:"#93C5FD", border:"#3B7FE0", sp:4  },
  { id:"alluminio",label:"Alluminio",   color:"#CBD5E1", border:"#64748B", sp:2  },
  { id:"eps",      label:"Coib. EPS",   color:"#FDE68A", border:"#D08008", sp:30 },
  { id:"legno",    label:"Legno",       color:"#D6B896", border:"#92400E", sp:18 },
  { id:"acciaio",  label:"Acciaio",     color:"#9CA3AF", border:"#374151", sp:2  },
  { id:"poliur",   label:"Poliuretano", color:"#A7F3D0", border:"#059669", sp:20 },
  { id:"aria",     label:"Aria",        color:"#F0F9FF", border:"#BAE6FD", sp:0  },
];

const VW = 560, VH = 420, PAD = 55;

export default function CassonettoEditor({ misure, onUpdate, onClose }) {
  const cP  = misure.casP  || 250;
  const cH  = misure.casH  || 200;
  const cLC = misure.casLCiel  || 120;
  const cPC = misure.casPCiel  || 100;

  const [mats, setMats]           = useState([...MAT_LIST]);
  const [latiMat, setLatiMat]     = useState({ sup:"pvc", sx:"pvc", dx:"pvc", inf:"pvc" });
  const [selLato, setSelLato]     = useState(null);
  const [toolMis, setToolMis]     = useState(false);
  const [misA, setMisA]           = useState(null);
  const [misB, setMisB]           = useState(null);
  const [showLib, setShowLib]     = useState(false);
  const svgRef                    = useRef(null);
  const dragRef                   = useRef(null);

  // Scala: fit dentro PAD*2 con margine
  const availW = VW - PAD*2;
  const availH = VH - PAD*2 - 30; // 30 per feritoia
  const sc = Math.min(availW / Math.max(cP,60), availH / Math.max(cH,60), 1.4);

  // Box cassonetto — centrato
  const bw = cP * sc;
  const bh = cH * sc;
  const bx = (VW - bw) / 2;
  const by = VH - PAD - 24; // 24 = feritoia

  const ferH = 18;
  const getMat = id => mats.find(m => m.id === id) || mats[0];
  const spT = Math.max(getMat(latiMat.sup).sp * sc, 3);
  const spS = Math.max(getMat(latiMat.sx).sp  * sc, 3);
  const spD = Math.max(getMat(latiMat.dx).sp  * sc, 3);
  const spB = Math.max(getMat(latiMat.inf).sp * sc, 3);

  const rulloR = Math.min((bw-spS-spD)*0.25, (bh-spT-spB)*0.45, 36);
  const rCx = bx + spS + (bw-spS-spD)/2;
  const rCy = by - bh + spT + rulloR + 4;
  const cielW = Math.min(cPC * sc, bw-spS-spD);
  const cielH = Math.max(8, Math.min(cLC*sc*0.06, 20));

  const svgPt = e => {
    const r = svgRef.current.getBoundingClientRect();
    return { x:(e.clientX-r.left)*(VW/r.width), y:(e.clientY-r.top)*(VH/r.height) };
  };

  const onPtrMove = e => {
    if (!dragRef.current) return;
    const {x,y} = svgPt(e);
    if (dragRef.current==="P") onUpdate("casP", Math.max(50, Math.round((x-bx)/sc)));
    if (dragRef.current==="H") onUpdate("casH", Math.max(50, Math.round((by-y)/sc)));
  };

  const onPtrUp = e => {
    if (toolMis) {
      const pt = svgPt(e);
      if (!misA) { setMisA(pt); }
      else if (!misB) { setMisB(pt); }
    }
    dragRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  const misDist = misA && misB
    ? Math.round(Math.hypot(misB.x-misA.x, misB.y-misA.y) / sc)
    : null;

  const onSvgClick = e => {
    if (toolMis) return;
    const {x,y} = svgPt(e);
    const tol = 14;
    if (Math.abs(y-(by-bh))<tol && x>bx && x<bx+bw) { setSelLato("sup"); return; }
    if (Math.abs(y-by)<tol       && x>bx && x<bx+bw) { setSelLato("inf"); return; }
    if (Math.abs(x-bx)<tol       && y>by-bh && y<by) { setSelLato("sx");  return; }
    if (Math.abs(x-(bx+bw))<tol  && y>by-bh && y<by) { setSelLato("dx");  return; }
    setSelLato(null);
  };

  const latoLabels = { sup:"Superiore", sx:"Sinistro", dx:"Destro", inf:"Inferiore" };

  return (
    <div style={{position:"fixed",inset:0,zIndex:4000,background:"#fff",display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif"}}>

      {/* HEADER */}
      <div style={{background:"#1A2B4A",padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontSize:13,fontWeight:800}}>Editor cassonetto</div>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:10}}>Tap lato → materiale · Trascina ↔↕ per ridimensionare</div>
        </div>
        <div onClick={()=>{setToolMis(t=>{if(t){setMisA(null);setMisB(null);}return !t;})}}
          style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,
            background:toolMis?"#DC4444":"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>
          📐 Misura
        </div>
        <div onClick={()=>setShowLib(s=>!s)}
          style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,
            background:showLib?"#D08008":"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>
          🎨 Materiali
        </div>
        {onClose && <div onClick={onClose} style={{color:"rgba(255,255,255,0.6)",fontSize:24,cursor:"pointer",padding:"0 4px"}}>×</div>}
      </div>

      {/* LIBRERIA MATERIALI */}
      {showLib && (
        <div style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",padding:"8px 12px",flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:800,color:"#1A2B4A",marginBottom:6,textTransform:"uppercase"}}>
            Modifica spessori materiali
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {mats.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:7,
                border:`1.5px solid ${m.border}`,background:m.color+"50"}}>
                <div style={{width:10,height:10,borderRadius:2,background:m.color,border:`1px solid ${m.border}`}}/>
                <span style={{fontSize:10,fontWeight:700,color:"#0F172A"}}>{m.label}</span>
                <input type="number" value={m.sp}
                  onChange={e=>setMats(ms=>ms.map(x=>x.id===m.id?{...x,sp:parseInt(e.target.value)||0}:x))}
                  style={{width:36,padding:"2px 3px",borderRadius:4,border:"1px solid #E2E8F0",
                    fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                <span style={{fontSize:9,color:"#64748B"}}>mm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SVG AREA */}
      <div style={{flex:1,background:"#EFF8FF",position:"relative",overflow:"hidden",minHeight:0}}>
        {toolMis && (
          <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",
            background:"#DC4444",color:"#fff",padding:"4px 14px",borderRadius:8,
            fontSize:11,fontWeight:700,zIndex:10,pointerEvents:"none"}}>
            {!misA?"Tap punto A":!misB?"Tap punto B":`${misDist}mm`}
          </div>
        )}
        {toolMis && misB && (
          <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
            <div onClick={()=>{setMisA(null);setMisB(null);}}
              style={{background:"#DC4444",color:"#fff",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700}}>
              Nuova misura
            </div>
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%"
          viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
          style={{cursor:toolMis?"crosshair":"default",userSelect:"none",display:"block"}}
          onClick={onSvgClick}
          onPointerMove={onPtrMove}
          onPointerUp={onPtrUp}
          onPointerLeave={()=>{dragRef.current=null;}}>

          {/* Griglia */}
          {Array.from({length:12}).map((_,i)=>(
            <line key={"gx"+i} x1={i*50} y1={0} x2={i*50} y2={VH} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}
          {Array.from({length:9}).map((_,i)=>(
            <line key={"gy"+i} x1={0} y1={i*50} x2={VW} y2={i*50} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}

          {/* Muro */}
          <rect x={bx-20} y={by-bh-8} width={14} height={bh+ferH+16}
            fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5"/>
          <text x={bx-13} y={by-bh/2} textAnchor="middle" fontSize="8" fill="#64748B"
            transform={`rotate(-90,${bx-13},${by-bh/2})`}>MURO</text>

          {/* Lato sup */}
          <rect x={bx} y={by-bh} width={bw} height={spT}
            fill={getMat(latiMat.sup).color}
            stroke={selLato==="sup"?"#F59E0B":getMat(latiMat.sup).border}
            strokeWidth={selLato==="sup"?2.5:1.5} style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelLato("sup");}}/>

          {/* Lato sx */}
          <rect x={bx} y={by-bh} width={spS} height={bh}
            fill={getMat(latiMat.sx).color}
            stroke={selLato==="sx"?"#F59E0B":getMat(latiMat.sx).border}
            strokeWidth={selLato==="sx"?2.5:1.5} style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelLato("sx");}}/>

          {/* Lato dx */}
          <rect x={bx+bw-spD} y={by-bh} width={spD} height={bh}
            fill={getMat(latiMat.dx).color}
            stroke={selLato==="dx"?"#F59E0B":getMat(latiMat.dx).border}
            strokeWidth={selLato==="dx"?2.5:1.5} style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelLato("dx");}}/>

          {/* Lato inf */}
          <rect x={bx} y={by-spB} width={bw} height={spB}
            fill={getMat(latiMat.inf).color}
            stroke={selLato==="inf"?"#F59E0B":getMat(latiMat.inf).border}
            strokeWidth={selLato==="inf"?2.5:1.5} style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setSelLato("inf");}}/>

          {/* Sfondo interno */}
          <rect x={bx+spS} y={by-bh+spT} width={bw-spS-spD} height={bh-spT-spB}
            fill="#EFF8FF" opacity="0.8"/>

          {/* Rullo */}
          {rulloR > 4 && <>
            <circle cx={rCx} cy={rCy} r={rulloR}
              fill="#DBEAFE" stroke="#3B7FE0" strokeWidth="1.5" strokeDasharray="5,3"/>
            <circle cx={rCx} cy={rCy} r={rulloR*0.28} fill="#3B7FE0" opacity="0.5"/>
            <text x={rCx} y={rCy+3} textAnchor="middle" fontSize="8" fill="#1E40AF" fontWeight="700">RULLO</text>
          </>}

          {/* Feritoia */}
          <rect x={bx} y={by} width={bw} height={ferH}
            fill="#1A2B4A18" stroke="#1A2B4A" strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x={bx+bw/2} y={by+12} textAnchor="middle" fontSize="8" fill="#1A2B4A" fontWeight="700">feritoia</text>

          {/* Cielino */}
          <rect x={bx+spS} y={by-spB-cielH} width={cielW} height={cielH}
            fill="#FDE68A" stroke="#D08008" strokeWidth="1.2" strokeDasharray="4,2" rx="2"/>
          {cielW>40 && <text x={bx+spS+cielW/2} y={by-spB-cielH/2+3} textAnchor="middle"
            fontSize="8" fill="#92400E" fontWeight="700">cielino</text>}

          {/* Label mat su ogni lato */}
          {[
            {l:"sup", tx:bx+bw/2,    ty:by-bh-8,  rot:0},
            {l:"sx",  tx:bx-2,        ty:by-bh/2,  rot:-90},
            {l:"dx",  tx:bx+bw+2,    ty:by-bh/2,  rot:90},
            {l:"inf", tx:bx+bw/2,    ty:by-spB-8, rot:0},
          ].map(({l,tx,ty,rot})=>{
            const m=getMat(latiMat[l]);
            return (
              <text key={l} x={tx} y={ty} textAnchor="middle" fontSize="8"
                fill={m.border} fontWeight="700" style={{pointerEvents:"none"}}
                transform={rot?`rotate(${rot},${tx},${ty})`:""}>
                {m.label} {m.sp}mm
              </text>
            );
          })}

          {/* Quote P */}
          <line x1={bx} y1={by+ferH+12} x2={bx+bw} y2={by+ferH+12} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx}    y1={by+ferH+8} x2={bx}    y2={by+ferH+16} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx+bw} y1={by+ferH+8} x2={bx+bw} y2={by+ferH+16} stroke="#1A2B4A" strokeWidth="1"/>
          <text x={bx+bw/2} y={by+ferH+26} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">{cP}mm</text>

          {/* Quote H */}
          <line x1={bx+bw+14} y1={by-bh} x2={bx+bw+14} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx+bw+10} y1={by-bh} x2={bx+bw+18} y2={by-bh} stroke="#1A2B4A" strokeWidth="1"/>
          <line x1={bx+bw+10} y1={by}    x2={bx+bw+18} y2={by}    stroke="#1A2B4A" strokeWidth="1"/>
          <text x={bx+bw+26} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
            transform={`rotate(90,${bx+bw+26},${by-bh/2+4})`}>{cH}mm</text>

          {/* Handle P */}
          <circle cx={bx+bw} cy={by-bh/2} r={9}
            fill="#1A2B4A" stroke="#fff" strokeWidth="2" style={{cursor:"ew-resize"}}
            onPointerDown={e=>{e.stopPropagation();dragRef.current="P";svgRef.current?.setPointerCapture(e.pointerId);}}/>
          <text x={bx+bw} y={by-bh/2+4} textAnchor="middle" fontSize="12" fill="#fff" style={{pointerEvents:"none"}}>↔</text>

          {/* Handle H */}
          <circle cx={bx+bw/2} cy={by-bh} r={9}
            fill="#1A2B4A" stroke="#fff" strokeWidth="2" style={{cursor:"ns-resize"}}
            onPointerDown={e=>{e.stopPropagation();dragRef.current="H";svgRef.current?.setPointerCapture(e.pointerId);}}/>
          <text x={bx+bw/2} y={by-bh+4} textAnchor="middle" fontSize="12" fill="#fff" style={{pointerEvents:"none"}}>↕</text>

          {/* Scala */}
          <g transform={`translate(${PAD},${VH-16})`}>
            <line x1={0} y1={0} x2={100*sc} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
            <line x1={0}      y1={-4} x2={0}      y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
            <line x1={100*sc} y1={-4} x2={100*sc} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
            <text x={50*sc} y={-6} textAnchor="middle" fontSize="9" fill="#1A2B4A" fontWeight="700">100mm</text>
          </g>

          {/* Misura */}
          {misA && <circle cx={misA.x} cy={misA.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>}
          {misA && misB && <>
            <line x1={misA.x} y1={misA.y} x2={misB.x} y2={misB.y}
              stroke="#DC4444" strokeWidth="1.5" strokeDasharray="5,3"/>
            <circle cx={misB.x} cy={misB.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>
            <rect x={(misA.x+misB.x)/2-26} y={(misA.y+misB.y)/2-10} width={52} height={18} rx="5" fill="#DC4444"/>
            <text x={(misA.x+misB.x)/2} y={(misA.y+misB.y)/2+5} textAnchor="middle"
              fontSize="11" fill="#fff" fontWeight="800">{misDist}mm</text>
          </>}
        </svg>
      </div>

      {/* SELEZIONE MATERIALE */}
      {selLato && (
        <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.45)",
          display:"flex",alignItems:"flex-end"}}
          onClick={()=>setSelLato(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px 16px 0 0",
            padding:"16px",width:"100%",maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A",marginBottom:12}}>
              Lato {latoLabels[selLato]} — materiale
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {mats.map(m=>(
                <div key={m.id} onClick={()=>{setLatiMat(l=>({...l,[selLato]:m.id}));setSelLato(null);}}
                  style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",
                    border:`2px solid ${latiMat[selLato]===m.id?m.border:"#E2E8F0"}`,
                    background:m.color+"60",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:14,height:14,borderRadius:3,background:m.color,border:`1.5px solid ${m.border}`}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{m.label}</div>
                    <div style={{fontSize:10,color:"#64748B"}}>{m.sp}mm</div>
                  </div>
                  {latiMat[selLato]===m.id && <span style={{marginLeft:"auto",color:m.border}}>✓</span>}
                </div>
              ))}
            </div>
            <div onClick={()=>setSelLato(null)}
              style={{marginTop:10,padding:"10px",textAlign:"center",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>
              Annulla
            </div>
          </div>
        </div>
      )}

      {/* CAMPI NUMERICI */}
      <div style={{background:"#fff",borderTop:"1px solid #E2E8F0",padding:"8px 10px",flexShrink:0,
        display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
        {[
          {label:"Larghezza",field:"casL",val:misure.casL},
          {label:"Altezza",  field:"casH",val:misure.casH},
          {label:"Profond.", field:"casP",val:misure.casP},
          {label:"Ciel. L",  field:"casLCiel",val:misure.casLCiel},
          {label:"Ciel. P",  field:"casPCiel",val:misure.casPCiel},
        ].map(({label,field,val})=>(
          <div key={field}>
            <div style={{fontSize:9,color:"#64748B",fontWeight:700,marginBottom:2}}>{label}</div>
            <input type="number" inputMode="numeric" value={val||""}
              placeholder="mm"
              onChange={e=>onUpdate(field,parseInt(e.target.value)||0)}
              style={{width:"100%",padding:"5px 3px",borderRadius:6,border:"1px solid #E2E8F0",
                fontSize:12,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                textAlign:"center",background:"#F8FAFC",color:"#1A2B4A",boxSizing:"border-box"}}/>
          </div>
        ))}
      </div>
    </div>
  );
}
