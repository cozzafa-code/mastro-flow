"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — ConfiguratoreControtelaio
// Disegno libero sezione controtelaio + riempimento materiali
// Stesso engine di FormaEditor in DisegnoTecnico
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from "react";

const FM = "'SF Mono','JetBrains Mono',monospace";

// ── Materiali controtelaio ──────────────────────────────────
const CT_MAT = [
  { id:"eps",    label:"EPS",     icon:"⬡", color:"#C8DEF2", stroke:"#1A3A6A", fill:"eps"   },
  { id:"legno",  label:"Legno",   icon:"≡", color:"#F5A623", stroke:"#C07010", fill:"wood"  },
  { id:"sede",   label:"Sede",    icon:"□", color:"#FFFFFF", stroke:"#DC1414", fill:"white", dash:true },
  { id:"profilo",label:"Profilo", icon:"▪", color:"#E0E8F0", stroke:"#1A3A6A", fill:"solid" },
  { id:"vuoto",  label:"Vuoto",   icon:"○", color:"#F8F8F8", stroke:"#CCCCCC", fill:"white" },
];

// ── Presets sezione controtelaio ────────────────────────────
const CT_PRESETS = [
  { n:"STH5",  label:"EPS filo muro",  pts:[{x:0,y:0},{x:350,y:0},{x:350,y:60},{x:0,y:60}],
    divs:[{axis:"v",pos:50},{axis:"v",pos:300}],
    cells:{"0-0":"sede","0-1":"eps","0-2":"sede"} },
  { n:"PROS",  label:"Singolo",
    pts:[{x:0,y:0},{x:280,y:0},{x:280,y:150},{x:230,y:150},{x:230,y:80},{x:0,y:80}],
    divs:[], cells:{} },
  { n:"STH3",  label:"EPS centro muro",
    pts:[{x:0,y:0},{x:325,y:0},{x:325,y:80},{x:0,y:80}],
    divs:[{axis:"v",pos:50}],
    cells:{"0-0":"sede","0-1":"eps"} },
  { n:"STF5",  label:"Fibrocemento",
    pts:[{x:0,y:0},{x:350,y:0},{x:350,y:44},{x:0,y:44}],
    divs:[{axis:"v",pos:50},{axis:"v",pos:300}],
    cells:{"0-0":"sede","0-1":"profilo","0-2":"sede"} },
  { n:"PROGCP",label:"PRO+cassonetto",
    pts:[{x:0,y:0},{x:280,y:0},{x:280,y:200},{x:230,y:200},{x:230,y:80},{x:0,y:80}],
    divs:[{axis:"h",pos:60}],
    cells:{"0-0":"legno","1-0":"eps"} },
  { n:"Libero", label:"Forma libera",
    pts:[{x:0,y:0},{x:300,y:0},{x:300,y:100},{x:0,y:100}],
    divs:[], cells:{} },
];

function makeRectPts(w=300, h=100) {
  return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
}

function segLenPt(a,b) {
  return Math.round(Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2));
}

function ptOnSeg(px,py,ax,ay,bx,by,thr=12) {
  const dx=bx-ax, dy=by-ay, len2=dx*dx+dy*dy;
  if(len2===0) return false;
  const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len2));
  return Math.hypot(px-ax-t*dx,py-ay-t*dy)<thr;
}

export default function ConfiguratoreControtelaio({ value, onChange, T }: any) {
  const Tc = T || {
    bg:"#F2F1EC", card:"#FFFFFF", bdr:"#E5E3DC",
    text:"#1A1A1C", sub:"#8E8E93",
    acc:"#D08008", grn:"#1A9E73", red:"#DC4444",
    blue:"#3B7FE0"
  };

  // Carica stato salvato o default
  const init = value || {};
  const [pts, setPts] = useState<any[]>(init.pts || makeRectPts(300,100));
  const [dividers, setDividers] = useState<any[]>(init.dividers || []);
  const [cellMat, setCellMat] = useState<any>(init.cellMat || {});
  const [sel, setSel] = useState<number|null>(null);
  const [selCell, setSelCell] = useState<string|null>(null);
  const [dragIdx, setDragIdx] = useState<number|null>(null);
  const [fMode, setFMode] = useState("move");
  const [inputW, setInputW] = useState(init.dimW || 300);
  const [inputH, setInputH] = useState(init.dimH || 100);
  const svgRef = useRef<SVGSVGElement>(null);

  // Notifica parent ad ogni cambio
  useEffect(() => {
    onChange?.({ pts, dividers, cellMat, dimW:inputW, dimH:inputH });
  }, [pts, dividers, cellMat]);

  // ── Scale SVG ──────────────────────────────────────────────
  const SVG_W = 320, SVG_H = 220;
  const PAD = 28;
  const allX = pts.map(p=>p.x), allY = pts.map(p=>p.y);
  const minX=Math.min(...allX), maxX=Math.max(...allX);
  const minY=Math.min(...allY), maxY=Math.max(...allY);
  const bW = maxX-minX || 1, bH = maxY-minY || 1;
  const sc = Math.min((SVG_W-PAD*2)/bW, (SVG_H-PAD*2)/bH);
  const ox = PAD + (SVG_W-PAD*2-bW*sc)/2 - minX*sc;
  const oy = PAD + (SVG_H-PAD*2-bH*sc)/2 - minY*sc;

  const toSvg = (p) => ({ x: ox+p.x*sc, y: oy+p.y*sc });
  const toWorld = (sx,sy) => ({ x:(sx-ox)/sc, y:(sy-oy)/sc });

  const snap = (v,g=5) => Math.round(v/g)*g;
  const pathD = pts.map((p,i)=>`${i===0?"M":"L"}${ox+p.x*sc},${oy+p.y*sc}`).join(" ")+" Z";

  // ── Celle (griglia divisori) ───────────────────────────────
  const vDivs = dividers.filter(d=>d.axis==="v").map(d=>d.pos+minX).sort((a,b)=>a-b);
  const hDivs = dividers.filter(d=>d.axis==="h").map(d=>d.pos+minY).sort((a,b)=>a-b);
  const colEdges = [minX,...vDivs,maxX];
  const rowEdges = [minY,...hDivs,maxY];
  const cells: any[] = [];
  for(let r=0;r<rowEdges.length-1;r++)
    for(let c=0;c<colEdges.length-1;c++)
      cells.push({key:`${r}-${c}`, x:colEdges[c], y:rowEdges[r],
        w:colEdges[c+1]-colEdges[c], h:rowEdges[r+1]-rowEdges[r]});

  // ── Pointer handlers ───────────────────────────────────────
  const getSvgXY = useCallback((e) => {
    const svg = svgRef.current; if(!svg) return {x:0,y:0};
    const rect = svg.getBoundingClientRect();
    const cl = e.touches?.[0] || e;
    return { x: cl.clientX-rect.left, y: cl.clientY-rect.top };
  },[]);

  const onDown = useCallback((e) => {
    e.preventDefault();
    const {x,y} = getSvgXY(e);
    const wp = toWorld(x,y);

    if(fMode==="del") {
      // trova vertice più vicino
      let closest=-1, minD=20;
      pts.forEach((p,i)=>{const d=Math.hypot(x-(ox+p.x*sc),y-(oy+p.y*sc));if(d<minD){minD=d;closest=i;}});
      if(closest>=0&&pts.length>3){setPts(pts.filter((_,i)=>i!==closest));setSel(null);}
      return;
    }
    if(fMode==="add") {
      // aggiunge punto su lato più vicino
      let bestI=-1, bestD=15, bestPt=null;
      pts.forEach((_,i)=>{
        const a=pts[i], b=pts[(i+1)%pts.length];
        if(ptOnSeg(x,y,ox+a.x*sc,oy+a.y*sc,ox+b.x*sc,oy+b.y*sc,15)){
          const dx=(ox+b.x*sc)-(ox+a.x*sc), dy=(oy+b.y*sc)-(oy+a.y*sc);
          const len2=dx*dx+dy*dy;
          const t=Math.max(0,Math.min(1,((x-(ox+a.x*sc))*dx+(y-(oy+a.y*sc))*dy)/len2));
          const d=Math.hypot(x-((ox+a.x*sc)+t*dx),y-((oy+a.y*sc)+t*dy));
          if(d<bestD){bestD=d;bestI=i;bestPt={x:snap((a.x+t*(b.x-a.x))),y:snap((a.y+t*(b.y-a.y)))};}
        }
      });
      if(bestI>=0&&bestPt){const np=[...pts];np.splice(bestI+1,0,bestPt);setPts(np);}
      return;
    }
    // move — trova vertice
    let vi=-1, minD=22;
    pts.forEach((p,i)=>{const d=Math.hypot(x-(ox+p.x*sc),y-(oy+p.y*sc));if(d<minD){minD=d;vi=i;}});
    if(vi>=0){setSel(vi);setDragIdx(vi);setSelCell(null);return;}
    // seleziona cella
    const wc = toWorld(x,y);
    const found = cells.find(c=>wc.x>=c.x&&wc.x<=c.x+c.w&&wc.y>=c.y&&wc.y<=c.y+c.h);
    if(found){setSelCell(found.key);setSel(null);}
    else{setSel(null);setSelCell(null);}
  },[fMode,pts,cells,ox,oy,sc,getSvgXY]);

  const onMove = useCallback((e) => {
    if(dragIdx===null) return;
    e.preventDefault();
    const {x,y} = getSvgXY(e);
    const wp = toWorld(x,y);
    setPts(pts.map((p,i)=>i===dragIdx?{x:snap(wp.x),y:snap(wp.y)}:p));
  },[dragIdx,pts,ox,oy,sc,getSvgXY]);

  const onUp = useCallback(()=>{ setDragIdx(null); },[]);

  useEffect(()=>{
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:false});
    window.addEventListener("touchend",onUp);
    return()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("touchend",onUp);
    };
  },[onMove,onUp]);

  const applyDims = () => {
    const sX=inputW/bW, sY=inputH/bH;
    setPts(pts.map(p=>({x:Math.round((p.x-minX)*sX+minX),y:Math.round((p.y-minY)*sY+minY)})));
  };

  const loadPreset = (p) => {
    setPts(p.pts); setDividers(p.divs||[]); setCellMat(p.cells||{});
    setSel(null); setSelCell(null);
    const w=Math.max(...p.pts.map(x=>x.x))-Math.min(...p.pts.map(x=>x.x));
    const h=Math.max(...p.pts.map(x=>x.y))-Math.min(...p.pts.map(x=>x.y));
    setInputW(w); setInputH(h);
  };

  const addDiv = (axis) => {
    const total = axis==="v"?bW:bH;
    setDividers(d=>[...d,{axis,pos:Math.round(total/2),id:Date.now()}]);
  };

  const selMat = selCell ? (CT_MAT.find(m=>m.id===cellMat[selCell])||CT_MAT[0]) : null;

  // ── Render materiale cella ─────────────────────────────────
  const getCellFill = (key) => {
    const mat = CT_MAT.find(m=>m.id===cellMat[key]) || CT_MAT[4]; // default vuoto
    if(mat.fill==="eps") return "url(#ctEps)";
    if(mat.fill==="wood") return "url(#ctWood)";
    return mat.color;
  };

  const bs = (active,col="#D08008") => ({
    padding:"5px 8px", borderRadius:6,
    border:`1.5px solid ${active?col:Tc.bdr}`,
    background:active?col+"18":Tc.card,
    fontSize:10, fontWeight:700, cursor:"pointer",
    color:active?col:Tc.text, whiteSpace:"nowrap" as any
  });

  return (
    <div style={{borderRadius:8,overflow:"hidden",border:`1px solid ${Tc.bdr}`}}>

      {/* ── Presets ─────────────────────────────────────────── */}
      <div style={{display:"flex",gap:3,padding:"6px 8px",overflowX:"auto",
        borderBottom:`1px solid ${Tc.bdr}`,background:Tc.bg}}>
        {CT_PRESETS.map(p=>(
          <button key={p.n} onClick={()=>loadPreset(p)} style={bs(false)}>
            {p.n}
          </button>
        ))}
      </div>

      {/* ── Mode toolbar ──────────────────────────────────────── */}
      <div style={{display:"flex",gap:3,padding:"4px 8px",
        borderBottom:`1px solid ${Tc.bdr}`,background:Tc.card}}>
        {[
          {id:"move",l:"✋ Sposta",  c:Tc.blue},
          {id:"add", l:"＋ Punto",  c:Tc.grn},
          {id:"del", l:"✕ Elimina",c:Tc.red},
        ].map(m=>(
          <div key={m.id} onClick={()=>setFMode(m.id)}
            style={{flex:1,padding:"5px 0",borderRadius:5,textAlign:"center",
              background:fMode===m.id?m.c+"15":Tc.card,
              border:`1.5px solid ${fMode===m.id?m.c:Tc.bdr}`,
              fontSize:10,fontWeight:700,color:fMode===m.id?m.c:Tc.sub,cursor:"pointer"}}>
            {m.l}
          </div>
        ))}
      </div>

      {/* ── Canvas SVG ────────────────────────────────────────── */}
      <div style={{display:"flex",justifyContent:"center",padding:6,
        background:"white",overflow:"auto"}}>
        <svg ref={svgRef} width={SVG_W} height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{touchAction:"none",maxWidth:"100%",cursor:
            fMode==="add"?"crosshair":fMode==="del"?"not-allowed":"default"}}
          onMouseDown={onDown} onTouchStart={onDown}>

          <defs>
            {/* EPS pattern — bolle blu */}
            <pattern id="ctEps" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#C8DEF2"/>
              <circle cx="4" cy="4" r="2.5" fill="none" stroke="#1A3A6A" strokeWidth="0.7"/>
            </pattern>
            {/* Legno — righe arancione */}
            <pattern id="ctWood" x="0" y="0" width="8" height="5" patternUnits="userSpaceOnUse">
              <rect width="8" height="5" fill="#F5A623"/>
              <line x1="0" y1="2.5" x2="8" y2="2.5" stroke="#C07010" strokeWidth="0.8"/>
              <line x1="0" y1="4" x2="8" y2="4" stroke="#C07010" strokeWidth="0.3"/>
            </pattern>
            {/* Frecce quote */}
            <marker id="ctA" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
              <polygon points="0,0 5,2.5 0,5" fill="#DC1414"/>
            </marker>
            <marker id="ctAL" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
              <polygon points="5,0 0,2.5 5,5" fill="#DC1414"/>
            </marker>
          </defs>

          {/* Griglia fondo */}
          <defs>
            <pattern id="ctGrid" width={10*sc} height={10*sc} patternUnits="userSpaceOnUse">
              <path d={`M ${10*sc} 0 L 0 0 0 ${10*sc}`} fill="none" stroke="#F0EFEA" strokeWidth={0.5}/>
            </pattern>
          </defs>
          <rect width={SVG_W} height={SVG_H} fill="url(#ctGrid)"/>

          {/* Fill celle con materiali */}
          {cells.map(cell=>{
            const cx1=ox+cell.x*sc, cy1=oy+cell.y*sc;
            const cw=cell.w*sc, ch=cell.h*sc;
            const mat=CT_MAT.find(m=>m.id===cellMat[cell.key])||CT_MAT[4];
            const fill=getCellFill(cell.key);
            const isSel=selCell===cell.key;
            return (
              <g key={cell.key}>
                <rect x={cx1} y={cy1} width={cw} height={ch}
                  fill={fill}
                  stroke={isSel?"#D08008":mat.stroke}
                  strokeWidth={isSel?2:0.8}
                  strokeDasharray={mat.dash?"6,3":undefined}/>
                {/* Label materiale nella cella */}
                {cw>22&&ch>14&&(
                  <text x={cx1+cw/2} y={cy1+ch/2+4} textAnchor="middle"
                    fontSize={Math.min(9,cw*0.22,ch*0.4)}
                    fontWeight="700" fontFamily={FM}
                    fill={mat.id==="sede"?"#DC1414":"#1A3A6A"}>
                    {mat.id==="vuoto"?"":mat.label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Sagoma controtelaio */}
          <path d={pathD} fill="none" stroke="#1A3A6A" strokeWidth={2.5} strokeLinejoin="round"/>

          {/* Divisori */}
          {dividers.map(d=>d.axis==="v"?(
            <g key={d.id}>
              <line x1={ox+(d.pos+minX)*sc} y1={oy+minY*sc}
                x2={ox+(d.pos+minX)*sc} y2={oy+maxY*sc}
                stroke="#8B5CF6" strokeWidth={1.5}/>
              <text x={ox+(d.pos+minX)*sc} y={oy+maxY*sc+14}
                textAnchor="middle" fontSize={8} fontWeight={700}
                fontFamily={FM} fill="#8B5CF6">{d.pos}</text>
            </g>
          ):(
            <g key={d.id}>
              <line x1={ox+minX*sc} y1={oy+(d.pos+minY)*sc}
                x2={ox+maxX*sc} y2={oy+(d.pos+minY)*sc}
                stroke="#0D9488" strokeWidth={1.5}/>
              <text x={ox+maxX*sc+8} y={oy+(d.pos+minY)*sc+3}
                fontSize={8} fontWeight={700} fontFamily={FM} fill="#0D9488">{d.pos}</text>
            </g>
          ))}

          {/* Quote lati */}
          {pts.map((p,i)=>{
            const next=pts[(i+1)%pts.length];
            const a=toSvg(p), b=toSvg(next);
            const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
            const len=segLenPt(p,next);
            const nx=-(b.y-a.y), ny=b.x-a.x;
            const nd=Math.sqrt(nx*nx+ny*ny)||1;
            const tx=mx+(nx/nd)*16, ty=my+(ny/nd)*16;
            const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
            return (
              <text key={`q${i}`} x={tx} y={ty+3} textAnchor="middle"
                fontSize={9} fontWeight={700} fontFamily={FM} fill="#D08008"
                transform={`rotate(${Math.abs(angle)>90?angle+180:angle},${tx},${ty+3})`}>
                {len}
              </text>
            );
          })}

          {/* Vertici */}
          {pts.map((p,i)=>{
            const s=toSvg(p), isSel=sel===i;
            return (
              <g key={`v${i}`}>
                <circle cx={s.x} cy={s.y} r={isSel?10:7}
                  fill={isSel?Tc.blue:"#1A3A6A"} stroke="#fff" strokeWidth={2}
                  style={{cursor:fMode==="del"?"not-allowed":"grab"}}/>
                {isSel&&(
                  <text x={s.x} y={s.y-14} textAnchor="middle"
                    fontSize={8} fontWeight={700} fontFamily={FM} fill={Tc.blue}>
                    {p.x},{p.y}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Dimensioni ──────────────────────────────────────── */}
      <div style={{display:"flex",gap:4,padding:"5px 8px",
        borderTop:`1px solid ${Tc.bdr}`,alignItems:"center",flexWrap:"wrap",
        background:Tc.bg}}>
        <span style={{fontSize:10,fontWeight:700,color:Tc.acc}}>L</span>
        <input type="number" value={inputW} onChange={e=>setInputW(parseInt(e.target.value)||0)}
          onBlur={applyDims}
          style={{width:52,padding:"4px 2px",border:`1.5px solid ${Tc.bdr}`,borderRadius:5,
            fontSize:11,fontWeight:700,fontFamily:FM,textAlign:"center"}}/>
        <span style={{fontSize:10,fontWeight:700,color:Tc.acc}}>H</span>
        <input type="number" value={inputH} onChange={e=>setInputH(parseInt(e.target.value)||0)}
          onBlur={applyDims}
          style={{width:52,padding:"4px 2px",border:`1.5px solid ${Tc.bdr}`,borderRadius:5,
            fontSize:11,fontWeight:700,fontFamily:FM,textAlign:"center"}}/>
        <span style={{fontSize:9,color:Tc.sub,fontFamily:FM}}>mm</span>
        {sel!==null&&(
          <div style={{marginLeft:"auto",display:"flex",gap:3,alignItems:"center"}}>
            <span style={{fontSize:8,fontWeight:700,color:Tc.blue}}>P{sel+1}</span>
            <input type="number" value={pts[sel]?.x||0}
              onChange={e=>setPts(pts.map((p,i)=>i===sel?{...p,x:parseInt(e.target.value)||0}:p))}
              style={{width:42,padding:"2px",border:`1px solid ${Tc.blue}40`,borderRadius:4,
                fontSize:9,fontWeight:700,fontFamily:FM,textAlign:"center",
                background:"transparent",color:Tc.blue}}/>
            <input type="number" value={pts[sel]?.y||0}
              onChange={e=>setPts(pts.map((p,i)=>i===sel?{...p,y:parseInt(e.target.value)||0}:p))}
              style={{width:42,padding:"2px",border:`1px solid ${Tc.blue}40`,borderRadius:4,
                fontSize:9,fontWeight:700,fontFamily:FM,textAlign:"center",
                background:"transparent",color:Tc.blue}}/>
          </div>
        )}
      </div>

      {/* ── Divisori ────────────────────────────────────────── */}
      <div style={{display:"flex",gap:3,padding:"4px 8px",
        borderTop:`1px solid ${Tc.bdr}`,alignItems:"center",flexWrap:"wrap",
        background:Tc.card}}>
        <button onClick={()=>addDiv("v")}
          style={{padding:"4px 8px",borderRadius:5,
            background:"#8B5CF612",border:"1px solid #8B5CF630",cursor:"pointer"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#8B5CF6"}}>+│ Verticale</span>
        </button>
        <button onClick={()=>addDiv("h")}
          style={{padding:"4px 8px",borderRadius:5,
            background:"#0D948812",border:"1px solid #0D948830",cursor:"pointer"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#0D9488"}}>+─ Orizzontale</span>
        </button>
        {dividers.map(d=>(
          <div key={d.id} style={{display:"flex",alignItems:"center",gap:2,
            padding:"2px 5px",borderRadius:4,
            background:(d.axis==="v"?"#8B5CF6":"#0D9488")+"10"}}>
            <input type="number" value={d.pos}
              onChange={e=>setDividers(dividers.map(x=>x.id===d.id?{...x,pos:parseInt(e.target.value)||0}:x))}
              style={{width:36,padding:"1px",border:"none",borderRadius:3,
                fontSize:9,fontWeight:700,fontFamily:FM,textAlign:"center",
                background:"transparent",
                color:d.axis==="v"?"#8B5CF6":"#0D9488"}}/>
            <span onClick={()=>setDividers(dividers.filter(x=>x.id!==d.id))}
              style={{fontSize:10,color:Tc.red,cursor:"pointer",fontWeight:700}}>×</span>
          </div>
        ))}
      </div>

      {/* ── Selettore materiale cella ───────────────────────── */}
      {selCell!==null&&(
        <div style={{padding:"8px",borderTop:`1.5px solid ${Tc.blue}30`,background:Tc.card}}>
          <div style={{fontSize:10,fontWeight:700,color:Tc.blue,
            marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
            <span>ZONA SELEZIONATA</span>
            {(()=>{const c=cells.find(x=>x.key===selCell);return c?<span style={{fontSize:9,color:Tc.sub,fontFamily:FM}}>{Math.round(c.w)}×{Math.round(c.h)}mm</span>:null;})()}
            <span onClick={()=>setSelCell(null)}
              style={{marginLeft:"auto",fontSize:16,color:Tc.sub,cursor:"pointer"}}>×</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
            {CT_MAT.map(mat=>{
              const isAct=(cellMat[selCell]||"vuoto")===mat.id;
              return (
                <div key={mat.id}
                  onClick={()=>setCellMat({...cellMat,[selCell]:mat.id})}
                  style={{padding:"6px 2px",borderRadius:6,textAlign:"center",cursor:"pointer",
                    border:`1.5px solid ${isAct?mat.stroke:Tc.bdr}`,
                    background:isAct?mat.color:Tc.card}}>
                  {/* Anteprima materiale */}
                  <svg width={28} height={18} style={{display:"block",margin:"0 auto 2px"}}>
                    <defs>
                      <pattern id={`prev_eps_${mat.id}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                        <rect width="6" height="6" fill="#C8DEF2"/>
                        <circle cx="3" cy="3" r="1.8" fill="none" stroke="#1A3A6A" strokeWidth="0.5"/>
                      </pattern>
                      <pattern id={`prev_wood_${mat.id}`} x="0" y="0" width="6" height="4" patternUnits="userSpaceOnUse">
                        <rect width="6" height="4" fill="#F5A623"/>
                        <line x1="0" y1="2" x2="6" y2="2" stroke="#C07010" strokeWidth="0.6"/>
                      </pattern>
                    </defs>
                    <rect width={28} height={18} rx={3}
                      fill={mat.fill==="eps"?`url(#prev_eps_${mat.id})`:mat.fill==="wood"?`url(#prev_wood_${mat.id})`:mat.color}
                      stroke={mat.stroke} strokeWidth={1}
                      strokeDasharray={mat.dash?"4,2":undefined}/>
                  </svg>
                  <div style={{fontSize:7,fontWeight:isAct?800:500,
                    color:isAct?mat.stroke:Tc.sub}}>
                    {mat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer info ─────────────────────────────────────── */}
      <div style={{padding:"4px 8px",fontSize:9,color:Tc.sub,
        textAlign:"center",borderTop:`1px solid ${Tc.bdr}`,background:Tc.bg}}>
        {fMode==="move"?"Trascina i vertici":fMode==="add"?"Tocca un lato per aggiungere punto":"Tocca un vertice per eliminarlo"}
        {" · "}{cells.length} zone · {pts.length} punti
      </div>
    </div>
  );
}
