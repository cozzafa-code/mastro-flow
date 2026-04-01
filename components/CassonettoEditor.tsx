"use client";
// @ts-nocheck
// CassonettoEditor v2 — 3 proiezioni + elementi aggiungibili
import React, { useState, useRef } from "react";

// ── COSTANTI ────────────────────────────────────────────
const MAT_LIST = [
  { id:"pvc",      label:"PVC",         color:"#93C5FD", border:"#3B7FE0", sp:4  },
  { id:"alluminio",label:"Alluminio",   color:"#CBD5E1", border:"#64748B", sp:2  },
  { id:"eps",      label:"Coib. EPS",   color:"#FDE68A", border:"#D08008", sp:30 },
  { id:"legno",    label:"Legno",       color:"#D6B896", border:"#92400E", sp:18 },
  { id:"acciaio",  label:"Acciaio",     color:"#9CA3AF", border:"#374151", sp:2  },
  { id:"poliur",   label:"Poliuretano", color:"#A7F3D0", border:"#059669", sp:20 },
  { id:"aria",     label:"Aria",        color:"#F0F9FF", border:"#BAE6FD", sp:0  },
];

const ELEM_TYPES = [
  { id:"sportello",  label:"Sportello ispezione", color:"#F97316", w:200, h:null },
  { id:"zanzariera", label:"Sede zanzariera",      color:"#8B5CF6", w:null, h:20  },
  { id:"cintino",    label:"Foro cintino",          color:"#DC4444", w:30,  h:30  },
  { id:"motore",     label:"Foro motore",           color:"#059669", w:60,  h:60  },
  { id:"guida",      label:"Guida tapparella",      color:"#0EA5E9", w:15,  h:null},
];

const TABS = [
  { id:"sezione",  label:"Sezione" },
  { id:"frontale", label:"Frontale" },
  { id:"basso",    label:"Dal basso" },
];

const VW = 540, VH = 380, PAD = 52;

// ── HELPER: disegna un singolo lato ──────────────────────
function Lato({ x, y, w, h, mat, selected, onClick }) {
  return (
    <rect x={x} y={y} width={w} height={h}
      fill={mat.color}
      stroke={selected ? "#F59E0B" : mat.border}
      strokeWidth={selected ? 2.5 : 1.5}
      style={{ cursor:"pointer" }}
      onClick={e=>{ e.stopPropagation(); onClick(); }}/>
  );
}

// ── VISTA SEZIONE (P × H) ────────────────────────────────
function VistaSez({ cP, cH, cLC, cPC, sc, bx, by, bw, bh, latiMat, getMat, selLato, onLato, elementi, onUpdate }) {
  const spT = Math.max(getMat(latiMat.sup).sp*sc, 3);
  const spS = Math.max(getMat(latiMat.sx).sp*sc,  3);
  const spD = Math.max(getMat(latiMat.dx).sp*sc,  3);
  const spB = Math.max(getMat(latiMat.inf).sp*sc,  3);
  const ferH = 16;
  const rulloR = Math.min((bw-spS-spD)*0.24, (bh-spT-spB)*0.42, 34);
  const rCx = bx + spS + (bw-spS-spD)/2;
  const rCy = by - bh + spT + rulloR + 4;
  const cielW = Math.min(cPC*sc, bw-spS-spD);
  const cielH = Math.max(7, Math.min(cLC*sc*0.05, 18));

  return (
    <g>
      {/* Muro */}
      <rect x={bx-18} y={by-bh-6} width={12} height={bh+ferH+12} fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5"/>
      <text x={bx-12} y={by-bh/2} textAnchor="middle" fontSize="7" fill="#64748B"
        transform={`rotate(-90,${bx-12},${by-bh/2})`}>MURO</text>
      {/* Lati */}
      <Lato x={bx} y={by-bh} w={bw} h={spT} mat={getMat(latiMat.sup)} selected={selLato==="sup"} onClick={()=>onLato("sup")}/>
      <Lato x={bx} y={by-bh} w={spS} h={bh} mat={getMat(latiMat.sx)}  selected={selLato==="sx"}  onClick={()=>onLato("sx")}/>
      <Lato x={bx+bw-spD} y={by-bh} w={spD} h={bh} mat={getMat(latiMat.dx)} selected={selLato==="dx"} onClick={()=>onLato("dx")}/>
      <Lato x={bx} y={by-spB} w={bw} h={spB} mat={getMat(latiMat.inf)} selected={selLato==="inf"} onClick={()=>onLato("inf")}/>
      {/* Interno */}
      <rect x={bx+spS} y={by-bh+spT} width={bw-spS-spD} height={bh-spT-spB} fill="#EFF8FF" opacity="0.8"/>
      {/* Rullo */}
      {rulloR>4 && <>
        <circle cx={rCx} cy={rCy} r={rulloR} fill="#DBEAFE" stroke="#3B7FE0" strokeWidth="1.5" strokeDasharray="5,3"/>
        <circle cx={rCx} cy={rCy} r={rulloR*0.28} fill="#3B7FE0" opacity="0.5"/>
        <text x={rCx} y={rCy+3} textAnchor="middle" fontSize="8" fill="#1E40AF" fontWeight="700">RULLO</text>
      </>}
      {/* Feritoia */}
      <rect x={bx} y={by} width={bw} height={ferH} fill="#1A2B4A18" stroke="#1A2B4A" strokeWidth="1.5" strokeDasharray="4,3"/>
      <text x={bx+bw/2} y={by+11} textAnchor="middle" fontSize="7" fill="#1A2B4A" fontWeight="700">feritoia</text>
      {/* Cielino */}
      <rect x={bx+spS} y={by-spB-cielH} width={cielW} height={cielH}
        fill="#FDE68A" stroke="#D08008" strokeWidth="1.2" strokeDasharray="4,2" rx="2"/>
      {cielW>30 && <text x={bx+spS+cielW/2} y={by-spB-cielH/2+3} textAnchor="middle" fontSize="7" fill="#92400E" fontWeight="700">cielino</text>}
      {/* Quote */}
      <line x1={bx} y1={by+ferH+10} x2={bx+bw} y2={by+ferH+10} stroke="#1A2B4A" strokeWidth="1"/>
      <text x={bx+bw/2} y={by+ferH+22} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">{cP}mm</text>
      <line x1={bx+bw+12} y1={by-bh} x2={bx+bw+12} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
      <text x={bx+bw+24} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
        transform={`rotate(90,${bx+bw+24},${by-bh/2+4})`}>{cH}mm</text>
      {/* Scala */}
      <g transform={`translate(${PAD-10},${VH-14})`}>
        <line x1={0} y1={0} x2={100*sc} y2={0} stroke="#1A2B4A" strokeWidth="1.5"/>
        <line x1={0} y1={-4} x2={0} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
        <line x1={100*sc} y1={-4} x2={100*sc} y2={4} stroke="#1A2B4A" strokeWidth="1.5"/>
        <text x={50*sc} y={-6} textAnchor="middle" fontSize="9" fill="#1A2B4A" fontWeight="700">100mm</text>
      </g>
    </g>
  );
}

// ── VISTA FRONTALE (L × H) ───────────────────────────────
function VistaFront({ cL, cH, sc, bx, by, bw, bh, latiMat, getMat, selLato, onLato, elementi }) {
  const spT = Math.max(getMat(latiMat.sup).sp*sc, 3);
  const spS = Math.max(getMat(latiMat.sx).sp*sc,  3);
  const spD = Math.max(getMat(latiMat.dx).sp*sc,  3);
  const spB = Math.max(getMat(latiMat.inf).sp*sc,  3);

  return (
    <g>
      <text x={bx+bw/2} y={by-bh-18} textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="600">vista frontale (interno →)</text>
      <Lato x={bx} y={by-bh} w={bw} h={spT} mat={getMat(latiMat.sup)} selected={selLato==="sup"} onClick={()=>onLato("sup")}/>
      <Lato x={bx} y={by-bh} w={spS} h={bh} mat={getMat(latiMat.sx)}  selected={selLato==="sx"}  onClick={()=>onLato("sx")}/>
      <Lato x={bx+bw-spD} y={by-bh} w={spD} h={bh} mat={getMat(latiMat.dx)} selected={selLato==="dx"} onClick={()=>onLato("dx")}/>
      <Lato x={bx} y={by-spB} w={bw} h={spB} mat={getMat(latiMat.inf)} selected={selLato==="inf"} onClick={()=>onLato("inf")}/>
      <rect x={bx+spS} y={by-bh+spT} width={bw-spS-spD} height={bh-spT-spB} fill="#EFF8FF" opacity="0.8"/>
      {/* Elementi posizionati */}
      {elementi.filter(el=>el.vista==="frontale").map(el=>{
        const etype = ELEM_TYPES.find(e=>e.id===el.tipo);
        if(!etype) return null;
        const ew = (el.w || etype.w || 100)*sc;
        const eh = (el.h || etype.h || 40)*sc;
        const ex = bx+spS + (bw-spS-spD-ew)*(el.px||0.5);
        const ey = by-bh+spT + (bh-spT-spB-eh)*(el.py||0.1);
        return (
          <g key={el.id}>
            <rect x={ex} y={ey} width={ew} height={eh}
              fill={etype.color+"30"} stroke={etype.color} strokeWidth="1.5" strokeDasharray="4,2" rx="2"/>
            <text x={ex+ew/2} y={ey+eh/2+4} textAnchor="middle" fontSize="8" fill={etype.color} fontWeight="700">
              {etype.label}
            </text>
          </g>
        );
      })}
      {/* Quote */}
      <line x1={bx} y1={by+14} x2={bx+bw} y2={by+14} stroke="#1A2B4A" strokeWidth="1"/>
      <text x={bx+bw/2} y={by+26} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">{cL}mm</text>
      <line x1={bx+bw+12} y1={by-bh} x2={bx+bw+12} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
      <text x={bx+bw+24} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
        transform={`rotate(90,${bx+bw+24},${by-bh/2+4})`}>{cH}mm</text>
    </g>
  );
}

// ── VISTA DAL BASSO (L × P) ──────────────────────────────
function VistaBasso({ cL, cP, sc, bx, by, bw, bh, latiMat, getMat, selLato, onLato, elementi }) {
  const spS = Math.max(getMat(latiMat.sx).sp*sc,  3);
  const spD = Math.max(getMat(latiMat.dx).sp*sc,  3);
  const spF = 3; // fronte
  const spR = 3; // retro/muro
  const ferW = bw * 0.8; // feritoia largo

  return (
    <g>
      <text x={bx+bw/2} y={by-bh-18} textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="600">vista dal basso (feritoia)</text>
      {/* Pareti sx/dx */}
      <Lato x={bx} y={by-bh} w={spS} h={bh} mat={getMat(latiMat.sx)} selected={selLato==="sx"} onClick={()=>onLato("sx")}/>
      <Lato x={bx+bw-spD} y={by-bh} w={spD} h={bh} mat={getMat(latiMat.dx)} selected={selLato==="dx"} onClick={()=>onLato("dx")}/>
      {/* Retro (muro) */}
      <rect x={bx+spS} y={by-bh} width={bw-spS-spD} height={spR} fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
      <text x={bx+bw/2} y={by-bh-4} textAnchor="middle" fontSize="7" fill="#64748B">muro</text>
      {/* Feritoia (fronte) */}
      <rect x={bx+spS} y={by-spF} width={bw-spS-spD} height={spF}
        fill="#1A2B4A40" stroke="#1A2B4A" strokeWidth="1.5"/>
      <text x={bx+bw/2} y={by+10} textAnchor="middle" fontSize="8" fill="#1A2B4A" fontWeight="700">feritoia (fronte)</text>
      {/* Interno */}
      <rect x={bx+spS} y={by-bh+spR} width={bw-spS-spD} height={bh-spR-spF} fill="#EFF8FF" opacity="0.8"/>
      {/* Guida tapparella (sx e dx) */}
      {elementi.filter(el=>el.tipo==="guida").map((el,i)=>(
        <rect key={el.id} x={i===0?bx+spS:bx+bw-spD-12} y={by-bh+spR} width={12} height={bh-spR-spF}
          fill="#0EA5E930" stroke="#0EA5E9" strokeWidth="1" strokeDasharray="3,2"/>
      ))}
      {/* Quote */}
      <line x1={bx} y1={by+18} x2={bx+bw} y2={by+18} stroke="#1A2B4A" strokeWidth="1"/>
      <text x={bx+bw/2} y={by+30} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800">{cL}mm</text>
      <line x1={bx+bw+12} y1={by-bh} x2={bx+bw+12} y2={by} stroke="#1A2B4A" strokeWidth="1"/>
      <text x={bx+bw+24} y={by-bh/2+4} textAnchor="middle" fontSize="10" fill="#1A2B4A" fontWeight="800"
        transform={`rotate(90,${bx+bw+24},${by-bh/2+4})`}>{cP}mm</text>
    </g>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────
export default function CassonettoEditor({ misure, onUpdate, onClose }) {
  const cP  = misure.casP     || 250;
  const cH  = misure.casH     || 200;
  const cL  = misure.casL     || 1200;
  const cLC = misure.casLCiel || 120;
  const cPC = misure.casPCiel || 100;

  const [mats, setMats]       = useState([...MAT_LIST]);
  const [latiMat, setLatiMat] = useState({ sup:"pvc", sx:"pvc", dx:"pvc", inf:"pvc" });
  const [selLato, setSelLato] = useState(null);
  const [tab, setTab]         = useState("sezione");
  const [toolMis, setToolMis] = useState(false);
  const [misA, setMisA]       = useState(null);
  const [misB, setMisB]       = useState(null);
  const [showLib, setShowLib] = useState(false);
  const [showElem, setShowElem] = useState(false);
  const [elementi, setElem]   = useState([]);
  const svgRef                = useRef(null);
  const dragRef               = useRef(null);

  const getMat = id => mats.find(m=>m.id===id) || mats[0];

  // Scala basata sulla vista corrente
  const axisW = tab==="sezione" ? cP : cL;
  const axisH = tab==="basso"   ? cP : cH;
  const sc = Math.min((VW-PAD*2)/Math.max(axisW,50), (VH-PAD*2-30)/Math.max(axisH,50), 1.4);
  const bw = axisW * sc;
  const bh = axisH * sc;
  const bx = (VW-bw)/2;
  const by = VH - PAD - 22;

  const svgPt = e => {
    const r = svgRef.current.getBoundingClientRect();
    return { x:(e.clientX-r.left)*(VW/r.width), y:(e.clientY-r.top)*(VH/r.height) };
  };

  const onPtrMove = e => {
    if(!dragRef.current) return;
    const {x,y} = svgPt(e);
    if(dragRef.current==="P") onUpdate("casP", Math.max(50,Math.round((x-bx)/sc)));
    if(dragRef.current==="H") onUpdate("casH", Math.max(50,Math.round((by-y)/sc)));
    if(dragRef.current==="L") onUpdate("casL", Math.max(100,Math.round((x-bx)/sc)));
  };

  const onPtrUp = e => {
    if(toolMis) {
      const pt = svgPt(e);
      if(!misA){ setMisA(pt); } else if(!misB){ setMisB(pt); }
    }
    dragRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  const misDist = misA && misB ? Math.round(Math.hypot(misB.x-misA.x,misB.y-misA.y)/sc) : null;

  const addElem = tipo => {
    const etype = ELEM_TYPES.find(e=>e.id===tipo);
    setElem(el=>[...el, {
      id: Date.now().toString(), tipo,
      vista: tab==="sezione"?"frontale":tab,
      w: etype.w, h: etype.h,
      px:0.1, py:0.1
    }]);
    setShowElem(false);
  };

  const handles = tab==="sezione"
    ? [{drag:"P",cx:bx+bw,cy:by-bh/2,lbl:"↔"},{drag:"H",cx:bx+bw/2,cy:by-bh,lbl:"↕"}]
    : tab==="frontale"
    ? [{drag:"L",cx:bx+bw,cy:by-bh/2,lbl:"↔"},{drag:"H",cx:bx+bw/2,cy:by-bh,lbl:"↕"}]
    : [{drag:"L",cx:bx+bw,cy:by-bh/2,lbl:"↔"},{drag:"P",cx:bx+bw/2,cy:by-bh,lbl:"↕"}];

  return (
    <div style={{position:"fixed",inset:0,zIndex:4000,background:"#fff",display:"flex",flexDirection:"column",fontFamily:"'Inter',sans-serif"}}>

      {/* HEADER */}
      <div style={{background:"#1A2B4A",padding:"8px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontSize:13,fontWeight:800}}>Editor cassonetto</div>
        </div>
        <div onClick={()=>{setToolMis(t=>{if(t){setMisA(null);setMisB(null);}return !t;})}}
          style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,
            background:toolMis?"#DC4444":"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>
          📐
        </div>
        <div onClick={()=>setShowLib(s=>!s)}
          style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,
            background:showLib?"#D08008":"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>
          🎨
        </div>
        <div onClick={()=>setShowElem(s=>!s)}
          style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,
            background:showElem?"#059669":"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)"}}>
          ＋
        </div>
        {onClose && <div onClick={onClose} style={{color:"rgba(255,255,255,0.6)",fontSize:22,cursor:"pointer",padding:"0 4px"}}>×</div>}
      </div>

      {/* TAB */}
      <div style={{display:"flex",borderBottom:"1px solid #E2E8F0",flexShrink:0,background:"#F8FAFC"}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"9px 4px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,
              color:tab===t.id?"#1A2B4A":"#94A3B8",
              borderBottom:tab===t.id?"2.5px solid #1A2B4A":"2.5px solid transparent",
              background:tab===t.id?"#fff":"transparent"}}>
            {t.label}
          </div>
        ))}
      </div>

      {/* LIBRERIA */}
      {showLib && (
        <div style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",padding:"6px 10px",flexShrink:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {mats.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 7px",
                borderRadius:7,border:`1.5px solid ${m.border}`,background:m.color+"50"}}>
                <div style={{width:10,height:10,borderRadius:2,background:m.color,border:`1px solid ${m.border}`,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#0F172A",flex:1}}>{m.label}</span>
                <input type="number" value={m.sp}
                  onChange={e=>setMats(ms=>ms.map(x=>x.id===m.id?{...x,sp:parseInt(e.target.value)||0}:x))}
                  style={{width:36,padding:"2px 3px",borderRadius:4,border:"1px solid #E2E8F0",
                    fontSize:11,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                <span style={{fontSize:9,color:"#64748B"}}>mm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ELEMENTI */}
      {showElem && (
        <div style={{background:"#F0FDF4",borderBottom:"1px solid #BBF7D0",padding:"6px 10px",flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:800,color:"#059669",marginBottom:5,textTransform:"uppercase"}}>
            Aggiungi elemento (vista {tab})
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {ELEM_TYPES.map(et=>(
              <div key={et.id} onClick={()=>addElem(et.id)}
                style={{padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,
                  background:et.color+"20",border:`1.5px solid ${et.color}`,color:"#0F172A"}}>
                + {et.label}
              </div>
            ))}
          </div>
          {elementi.length>0 && (
            <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
              {elementi.map(el=>{
                const et=ELEM_TYPES.find(e=>e.id===el.tipo);
                return (
                  <div key={el.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",
                    borderRadius:6,background:"#fff",border:`1px solid ${et?.color||"#E2E8F0"}`,fontSize:10}}>
                    <span style={{color:et?.color}}>{et?.label}</span>
                    <span style={{color:"#94A3B8",fontSize:9}}>[{el.vista}]</span>
                    <span onClick={()=>setElem(es=>es.filter(e=>e.id!==el.id))}
                      style={{color:"#DC4444",cursor:"pointer",fontWeight:700,fontSize:12}}>×</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SVG */}
      <div style={{flex:1,background:"#EFF8FF",position:"relative",overflow:"hidden",minHeight:0}}>
        {toolMis && (
          <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",
            background:"#DC4444",color:"#fff",padding:"3px 12px",borderRadius:8,
            fontSize:11,fontWeight:700,zIndex:10,pointerEvents:"none"}}>
            {!misA?"Tap A":!misB?"Tap B":`${misDist}mm`}
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%"
          viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
          style={{cursor:toolMis?"crosshair":"default",userSelect:"none",display:"block"}}
          onClick={e=>{ if(!toolMis) setSelLato(null); }}
          onPointerMove={onPtrMove} onPointerUp={onPtrUp}
          onPointerLeave={()=>{dragRef.current=null;}}>

          {/* Griglia */}
          {Array.from({length:12}).map((_,i)=>(
            <line key={"gx"+i} x1={i*50} y1={0} x2={i*50} y2={VH} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}
          {Array.from({length:8}).map((_,i)=>(
            <line key={"gy"+i} x1={0} y1={i*50} x2={VW} y2={i*50} stroke="#DCF0FF" strokeWidth="0.5"/>
          ))}

          {/* Vista corrente */}
          {tab==="sezione" && <VistaSez cP={cP} cH={cH} cLC={cLC} cPC={cPC}
            sc={sc} bx={bx} by={by} bw={bw} bh={bh}
            latiMat={latiMat} getMat={getMat} selLato={selLato} onLato={setSelLato}
            elementi={elementi} onUpdate={onUpdate}/>}
          {tab==="frontale" && <VistaFront cL={cL} cH={cH}
            sc={sc} bx={bx} by={by} bw={bw} bh={bh}
            latiMat={latiMat} getMat={getMat} selLato={selLato} onLato={setSelLato}
            elementi={elementi}/>}
          {tab==="basso" && <VistaBasso cL={cL} cP={cP}
            sc={sc} bx={bx} by={by} bw={bw} bh={bh}
            latiMat={latiMat} getMat={getMat} selLato={selLato} onLato={setSelLato}
            elementi={elementi}/>}

          {/* Handle resize */}
          {handles.map(h=>(
            <g key={h.drag}>
              <circle cx={h.cx} cy={h.cy} r={9} fill="#1A2B4A" stroke="#fff" strokeWidth="2"
                style={{cursor:h.lbl==="↔"?"ew-resize":"ns-resize"}}
                onPointerDown={e=>{e.stopPropagation();dragRef.current=h.drag;svgRef.current?.setPointerCapture(e.pointerId);}}/>
              <text x={h.cx} y={h.cy+4} textAnchor="middle" fontSize="12" fill="#fff" style={{pointerEvents:"none"}}>{h.lbl}</text>
            </g>
          ))}

          {/* Misura */}
          {misA && <circle cx={misA.x} cy={misA.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>}
          {misA && misB && <>
            <line x1={misA.x} y1={misA.y} x2={misB.x} y2={misB.y} stroke="#DC4444" strokeWidth="1.5" strokeDasharray="5,3"/>
            <circle cx={misB.x} cy={misB.y} r={5} fill="#DC4444" stroke="#fff" strokeWidth="2"/>
            <rect x={(misA.x+misB.x)/2-26} y={(misA.y+misB.y)/2-10} width={52} height={18} rx="5" fill="#DC4444"/>
            <text x={(misA.x+misB.x)/2} y={(misA.y+misB.y)/2+5} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">{misDist}mm</text>
          </>}
          {toolMis && misB && (
            <g onClick={()=>{setMisA(null);setMisB(null);}} style={{cursor:"pointer"}}>
              <rect x={VW/2-40} y={VH-30} width={80} height={22} rx="6" fill="#DC4444"/>
              <text x={VW/2} y={VH-15} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">Nuova misura</text>
            </g>
          )}
        </svg>
      </div>

      {/* SELEZIONE MATERIALE */}
      {selLato && (
        <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.45)",
          display:"flex",alignItems:"flex-end"}} onClick={()=>setSelLato(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px 16px 0 0",
            padding:"14px",width:"100%",maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1A2B4A",marginBottom:10}}>
              Lato {selLato==="sup"?"superiore":selLato==="inf"?"inferiore":selLato==="sx"?"sinistro":"destro"} — materiale
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {mats.map(m=>(
                <div key={m.id} onClick={()=>{setLatiMat(l=>({...l,[selLato]:m.id}));setSelLato(null);}}
                  style={{padding:"9px 10px",borderRadius:10,cursor:"pointer",
                    border:`2px solid ${latiMat[selLato]===m.id?m.border:"#E2E8F0"}`,
                    background:m.color+"60",display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:14,height:14,borderRadius:3,background:m.color,border:`1.5px solid ${m.border}`}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{m.label}</div>
                    <div style={{fontSize:10,color:"#64748B"}}>{m.sp}mm</div>
                  </div>
                  {latiMat[selLato]===m.id && <span style={{marginLeft:"auto",color:m.border,fontSize:14}}>✓</span>}
                </div>
              ))}
            </div>
            <div onClick={()=>setSelLato(null)}
              style={{marginTop:10,padding:"8px",textAlign:"center",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>
              Annulla
            </div>
          </div>
        </div>
      )}

      {/* CAMPI */}
      <div style={{background:"#fff",borderTop:"1px solid #E2E8F0",padding:"7px 10px",flexShrink:0}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:5}}>
          {[{l:"Larghezza",f:"casL",v:misure.casL},{l:"Altezza",f:"casH",v:misure.casH},{l:"Profondità",f:"casP",v:misure.casP}].map(({l,f,v})=>(
            <div key={f}>
              <div style={{fontSize:9,color:"#64748B",fontWeight:700,marginBottom:2}}>{l}</div>
              <input type="number" inputMode="numeric" value={v||""} placeholder="mm"
                onChange={e=>onUpdate(f,parseInt(e.target.value)||0)}
                style={{width:"100%",padding:"5px 3px",borderRadius:6,border:"1px solid #E2E8F0",
                  fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  textAlign:"center",background:"#F8FAFC",color:"#1A2B4A",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {[{l:"Cielino L",f:"casLCiel",v:misure.casLCiel},{l:"Cielino P",f:"casPCiel",v:misure.casPCiel}].map(({l,f,v})=>(
            <div key={f}>
              <div style={{fontSize:9,color:"#64748B",fontWeight:700,marginBottom:2}}>{l}</div>
              <input type="number" inputMode="numeric" value={v||""} placeholder="mm"
                onChange={e=>onUpdate(f,parseInt(e.target.value)||0)}
                style={{width:"100%",padding:"5px 3px",borderRadius:6,border:"1px solid #E2E8F0",
                  fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  textAlign:"center",background:"#F8FAFC",color:"#1A2B4A",boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
