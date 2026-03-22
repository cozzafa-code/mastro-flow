"use client";
// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";

const FMono = "'JetBrains Mono','SF Mono',monospace";

const CT_MAT = [
  { id:"eps",    label:"EPS",     color:"#C8DEF2", stroke:"#1A3A6A" },
  { id:"legno",  label:"Legno",   color:"#F5A623", stroke:"#C07010" },
  { id:"sede",   label:"Sede",    color:"#FFFFFF", stroke:"#DC1414", dash:true },
  { id:"profilo",label:"Profilo", color:"#E0E8F0", stroke:"#334455" },
];

const DIRS = [
  { d:"dx", label:"→", name:"Destra"   },
  { d:"su", label:"↑", name:"Su"       },
  { d:"sx", label:"←", name:"Sinistra" },
  { d:"giu",label:"↓", name:"Giù"     },
];

const CT_PRESETS = [
  { n:"STH5",  ids:["STH5","STH6","STH5I","STH6I"],
    segs:[{dir:"dx",mm:350},{dir:"giu",mm:60}],
    divs:[{axis:"v",pos:50,id:1},{axis:"v",pos:300,id:2}],
    mat:{"0_0":"sede","0_1":"eps","0_2":"sede"} },
  { n:"PROS",  ids:["PROS","PROI"],
    segs:[{dir:"dx",mm:280},{dir:"giu",mm:80},{dir:"sx",mm:60},{dir:"su",mm:40}],
    divs:[], mat:{"0_0":"eps"} },
  { n:"PROGCP",ids:["PROGCP","PROGC","PROIG","PROG"],
    segs:[{dir:"dx",mm:280},{dir:"giu",mm:60},{dir:"sx",mm:50},{dir:"giu",mm:110},{dir:"sx",mm:230}],
    divs:[], mat:{"0_0":"legno"} },
  { n:"STH3",  ids:["STH3","STH3I"],
    segs:[{dir:"dx",mm:325},{dir:"giu",mm:80}],
    divs:[{axis:"v",pos:50,id:3}], mat:{"0_0":"sede","0_1":"eps"} },
  { n:"STF5",  ids:["STF5","STF6","STF5I","STF6I","STF3","STF3I"],
    segs:[{dir:"dx",mm:350},{dir:"giu",mm:44}],
    divs:[{axis:"v",pos:50,id:4},{axis:"v",pos:300,id:5}],
    mat:{"0_0":"sede","0_1":"profilo","0_2":"sede"} },
];

function buildNodes(segs) {
  let cx=0,cy=0;
  const raw=[{x:0,y:0}];
  (segs||[]).forEach(s=>{
    if(s.dir==="dx") cx+=s.mm;
    if(s.dir==="sx") cx-=s.mm;
    if(s.dir==="su") cy-=s.mm;
    if(s.dir==="giu") cy+=s.mm;
    raw.push({x:cx,y:cy});
  });
  return raw;
}

function getBBox(pts) {
  if(!pts||!pts.length) return {minX:0,maxX:300,minY:0,maxY:100,w:300,h:100};
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  return {minX,maxX,minY,maxY,w:(maxX-minX)||1,h:(maxY-minY)||1};
}

function scaleFor(pts,VW,VH,PAD) {
  const bb=getBBox(pts);
  const sc=Math.min((VW-PAD*2)/bb.w,(VH-PAD*2)/bb.h);
  const offX=PAD+((VW-PAD*2)-bb.w*sc)/2-bb.minX*sc;
  const offY=PAD+((VH-PAD*2)-bb.h*sc)/2-bb.minY*sc;
  return {sc,offX,offY,bb,
    toSvg:(p)=>({sx:p.x*sc+offX,sy:p.y*sc+offY}),
    toWorld:(sx,sy)=>({x:(sx-offX)/sc,y:(sy-offY)/sc})};
}

export default function ConfiguratoreControtelaio({value,sistemaId,onChange,T}) {
  const Tc=T||{bg:"#F2F1EC",card:"#FFFFFF",bdr:"#E5E3DC",text:"#1A1A1C",
    sub:"#8E8E93",acc:"#D08008",grn:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};

  const getPreset=(sid)=>CT_PRESETS.find(p=>p.ids?.includes(sid))||null;

  const init=value||{};
  const initP=(!init.segs?.length&&sistemaId)?getPreset(sistemaId):null;

  const [segs,    setSegs]    = useState(initP?.segs||init.segs||[]);
  const [divs,    setDivs]    = useState(initP?.divs||init.divs||[]);
  const [zoneMat, setZoneMat] = useState(initP?.mat||init.zoneMat||{"0_0":"eps"});
  const [pDir,    setPDir]    = useState("dx");
  const [pMm,     setPMm]     = useState("");
  const [selIdx,  setSelIdx]  = useState(null);
  const [selZone, setSelZone] = useState("0_0");
  const [misuraL, setMisuraL] = useState(init.misuraL||"");
  const [misuraH, setMisuraH] = useState(init.misuraH||"");
  const [zoom,    setZoom]    = useState(1);
  const [panX,    setPanX]    = useState(0);
  const [panY,    setPanY]    = useState(0);
  const [dragIdx, setDragIdx] = useState(null);
  const [ptsOvr,  setPtsOvr]  = useState(null);
  const svgRef=useRef(null);
  const tRef=useRef([]);
  const pinchRef=useRef(null);
  const prevSis=useRef(sistemaId);

  // pts = buildNodes(segs) oppure override da drag
  const pts = ptsOvr || buildNodes(segs);
  const sviluppata=segs.reduce((a,s)=>a+s.mm,0);

  useEffect(()=>{setPtsOvr(null);setZoom(1);setPanX(0);setPanY(0);},[segs]);
  useEffect(()=>{onChange?.({segs,divs,zoneMat,misuraL,misuraH});},[segs,divs,zoneMat,misuraL,misuraH]);

  // Auto-load quando sistemaId cambia
  useEffect(()=>{
    if(sistemaId&&sistemaId!==prevSis.current){
      prevSis.current=sistemaId;
      const p=getPreset(sistemaId);
      if(p){setSegs(p.segs||[]);setDivs(p.divs||[]);setZoneMat(p.mat||{"0_0":"eps"});
        setPtsOvr(null);setSelZone("0_0");setZoom(1);setPanX(0);setPanY(0);}
    }
  },[sistemaId]);

  const resetView=()=>{setZoom(1);setPanX(0);setPanY(0);};

  const addSeg=()=>{
    const mm=parseFloat(pMm);if(!mm||mm<=0)return;
    if(selIdx!==null){setSegs(s=>s.map((x,i)=>i===selIdx?{dir:pDir,mm}:x));setSelIdx(null);}
    else setSegs(s=>[...s,{dir:pDir,mm}]);
    setPMm("");
  };

  const loadPreset=(p)=>{
    setSegs(p.segs||[]);setDivs(p.divs||[]);setZoneMat(p.mat||{"0_0":"eps"});
    setPtsOvr(null);setSelIdx(null);setSelZone("0_0");resetView();
  };

  // Canvas dimensions — GRANDE
  const VW=typeof window!=="undefined"?Math.min(window.innerWidth-32,520):400;
  const VH=Math.max(260, VW*0.55);
  const PAD=50;
  const S=scaleFor(pts,VW,VH,PAD);
  const vbW=VW/zoom, vbH=VH/zoom;
  const vbX=panX+(VW-vbW)/2, vbY=panY+(VH-vbH)/2;

  const clientToWorld=useCallback((cx,cy)=>{
    const svg=svgRef.current;if(!svg)return{x:0,y:0};
    const r=svg.getBoundingClientRect();
    const sx=vbX+(cx-r.left)/r.width*vbW;
    const sy=vbY+(cy-r.top)/r.height*vbH;
    return S.toWorld(sx,sy);
  },[vbX,vbY,vbW,vbH,S]);

  const onPtrDown=useCallback((e,idx)=>{
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIdx(idx);
  },[]);

  const onPtrMove=useCallback((e)=>{
    if(dragIdx===null)return;
    const w=clientToWorld(e.clientX,e.clientY);
    const snap=5;
    setPtsOvr(prev=>(prev||buildNodes(segs)).map((p,i)=>
      i===dragIdx?{x:Math.round(w.x/snap)*snap,y:Math.round(w.y/snap)*snap}:p));
  },[dragIdx,clientToWorld,segs]);

  const onPtrUp=useCallback(()=>setDragIdx(null),[]);

  const onTouchStart=useCallback((e)=>{
    tRef.current=Array.from(e.touches);
    pinchRef.current=null;
  },[]);

  const onTouchMove=useCallback((e)=>{
    e.preventDefault();
    const ts=Array.from(e.touches);
    if(ts.length===1&&dragIdx===null&&tRef.current[0]){
      const dx=(ts[0].clientX-tRef.current[0].clientX)/zoom;
      const dy=(ts[0].clientY-tRef.current[0].clientY)/zoom;
      setPanX(x=>x-dx);setPanY(y=>y-dy);
    }else if(ts.length===2&&tRef.current.length===2){
      const d=Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
      if(pinchRef.current)setZoom(z=>Math.min(8,Math.max(0.3,z*d/pinchRef.current)));
      pinchRef.current=d;
    }
    tRef.current=ts;
  },[dragIdx,zoom]);

  const onTouchEnd=useCallback((e)=>{
    tRef.current=Array.from(e.touches);
    pinchRef.current=null;
  },[]);

  const bbox=S.bb;
  const mToSx=(mx)=>mx*S.sc+S.offX;
  const mToSy=(my)=>my*S.sc+S.offY;

  const vBreaks=[bbox.minX,...[...new Set(divs.filter(d=>d.axis==="v").map(d=>d.pos))].sort((a,b)=>a-b),bbox.maxX];
  const hBreaks=[bbox.minY,...[...new Set(divs.filter(d=>d.axis==="h").map(d=>d.pos))].sort((a,b)=>a-b),bbox.maxY];
  const pathPts=pts.map(p=>{const s=S.toSvg(p);return s.sx.toFixed(1)+","+s.sy.toFixed(1);}).join(" ");

  const currentMat=CT_MAT.find(m=>m.id===(zoneMat[selZone||"0_0"]||"eps"))||CT_MAT[0];

  return (
    <div style={{borderRadius:8,overflow:"hidden",border:"1px solid "+Tc.bdr,background:Tc.card}}>

      {/* ── PRESET — solo nome, compatto ── */}
      <div style={{display:"flex",gap:4,padding:"6px 8px",overflowX:"auto",
        borderBottom:"1px solid "+Tc.bdr,background:Tc.bg,flexShrink:0}}>
        {CT_PRESETS.map(p=>{
          const isActive=p.ids?.includes(sistemaId);
          return (
            <button key={p.n} onClick={()=>loadPreset(p)}
              style={{padding:"4px 10px",borderRadius:6,whiteSpace:"nowrap",
                border:"1.5px solid "+(isActive?"#1A9E73":Tc.bdr),
                background:isActive?"#1A9E7318":Tc.card,
                fontSize:10,fontWeight:700,cursor:"pointer",
                color:isActive?"#1A9E73":Tc.text}}>
              {p.n}
            </button>
          );
        })}
        <button onClick={()=>{setSegs([]);setDivs([]);setZoneMat({"0_0":"eps"});
          setPtsOvr(null);setSelIdx(null);setSelZone("0_0");resetView();}}
          style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+Tc.bdr,
            background:"white",fontSize:10,cursor:"pointer",color:Tc.sub,marginLeft:"auto"}}>
          🗑
        </button>
      </div>

      {/* ── CANVAS SVG ── */}
      <div style={{position:"relative",background:"#F0FDF9",
        height:VH,overflow:"hidden",touchAction:"none"}}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}>

        {/* Zoom buttons */}
        <div style={{position:"absolute",top:8,right:8,zIndex:20,
          display:"flex",flexDirection:"column",gap:4}}>
          {[{l:"+",fn:()=>setZoom(z=>Math.min(8,z*1.35))},
            {l:"−",fn:()=>setZoom(z=>Math.max(0.3,z*0.74))},
            {l:"↺",fn:resetView}].map(b=>(
            <div key={b.l} onClick={b.fn}
              style={{width:32,height:32,borderRadius:7,background:"rgba(255,255,255,0.92)",
                border:"1px solid "+Tc.bdr,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:b.l==="↺"?15:20,fontWeight:800,
                cursor:"pointer",color:"#0F766E",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}}>
              {b.l}
            </div>
          ))}
        </div>

        {!pts.length&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",flexDirection:"column",gap:6,color:"#94A3B8",
            pointerEvents:"none"}}>
            <div style={{fontSize:28}}>✏️</div>
            <div style={{fontSize:13,fontWeight:600}}>Disegna la sagoma</div>
            <div style={{fontSize:10}}>Direzione + mm + ＋</div>
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%"
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{display:"block",touchAction:"none"}}
          onPointerMove={onPtrMove}
          onPointerUp={onPtrUp}
          onPointerLeave={onPtrUp}>

          <defs>
            <pattern id="ctE" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#C8DEF2"/>
              <circle cx="4" cy="4" r="2.5" fill="none" stroke="#1A3A6A" strokeWidth="0.7"/>
            </pattern>
            <pattern id="ctW" x="0" y="0" width="8" height="5" patternUnits="userSpaceOnUse">
              <rect width="8" height="5" fill="#F5A623"/>
              <line x1="0" y1="2.5" x2="8" y2="2.5" stroke="#C07010" strokeWidth="0.8"/>
              <line x1="0" y1="4" x2="8" y2="4" stroke="#C07010" strokeWidth="0.3"/>
            </pattern>
            <pattern id="ctG" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#E8EEF5" strokeWidth="0.5"/>
            </pattern>
            {pts.length>1&&<clipPath id="sgClip"><polygon points={pathPts}/></clipPath>}
          </defs>

          <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#ctG)"/>

          {/* Riempimenti */}
          {pts.length>1&&(
            <g clipPath="url(#sgClip)">
              {hBreaks.slice(0,-1).map((_,ri)=>
                vBreaks.slice(0,-1).map((_,ci)=>{
                  const x1=vBreaks[ci],y1=hBreaks[ri],x2=vBreaks[ci+1],y2=hBreaks[ri+1];
                  const key=`${ri}_${ci}`;
                  const mat=CT_MAT.find(m=>m.id===(zoneMat[key]||"eps"))||CT_MAT[0];
                  const sx=mToSx(x1),sy=mToSy(y1);
                  const sw=(x2-x1)*S.sc,sh=(y2-y1)*S.sc;
                  const isSel=selZone===key;
                  const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
                  return (
                    <g key={key} style={{cursor:"pointer"}}
                      onClick={e=>{e.stopPropagation();setSelZone(key);}}>
                      <rect x={sx} y={sy} width={sw} height={sh} fill={fill}/>
                      {isSel&&<rect x={sx+1} y={sy+1} width={sw-2} height={sh-2}
                        fill="none" stroke="#D08008" strokeWidth={2} strokeDasharray="5,3"/>}
                      {sw>40&&sh>18&&mat.id!=="sede"&&(
                        <text x={sx+sw/2} y={sy+sh/2+4} textAnchor="middle"
                          fontSize={Math.min(12,sw*0.13,sh*0.35)} fontWeight="800"
                          fontFamily={FMono}
                          fill={mat.id==="eps"?"#1A3A6A":mat.id==="legno"?"#774400":"#334455"}>
                          {mat.label}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </g>
          )}

          {/* Bordo */}
          {pts.length>1&&<polygon points={pathPts} fill="none" stroke="#1A3A6A"
            strokeWidth="2.5" strokeLinejoin="round"/>}

          {/* Divisori */}
          {divs.map(d=>d.axis==="v"
            ?<line key={d.id} x1={mToSx(d.pos)} y1={mToSy(bbox.minY)}
                x2={mToSx(d.pos)} y2={mToSy(bbox.maxY)}
                stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4,3"/>
            :<line key={d.id} x1={mToSx(bbox.minX)} y1={mToSy(d.pos)}
                x2={mToSx(bbox.maxX)} y2={mToSy(d.pos)}
                stroke="#0D9488" strokeWidth={1.5} strokeDasharray="4,3"/>
          )}

          {/* Highlight segmento in edit */}
          {selIdx!==null&&selIdx<pts.length-1&&(
            <line x1={S.toSvg(pts[selIdx]).sx} y1={S.toSvg(pts[selIdx]).sy}
              x2={S.toSvg(pts[selIdx+1]).sx} y2={S.toSvg(pts[selIdx+1]).sy}
              stroke="#D08008" strokeWidth={5} strokeLinecap="round" opacity={0.7}/>
          )}

          {/* Quote */}
          {pts.slice(1).map((p,i)=>{
            const prev=S.toSvg(pts[i]),cur=S.toSvg(p),seg=segs[i];if(!seg)return null;
            const mx=(prev.sx+cur.sx)/2,my=(prev.sy+cur.sy)/2;
            const isH=Math.abs(cur.sy-prev.sy)<Math.abs(cur.sx-prev.sx);
            const qx=mx+(isH?0:-24),qy=my+(isH?-16:0);
            return(
              <g key={i}>
                <rect x={qx-18} y={qy-8} width={36} height={13} rx={3} fill="rgba(255,255,255,0.93)"/>
                <text x={qx} y={qy+2} textAnchor="middle" fontSize={11}
                  fill="#0F172A" fontWeight="800" fontFamily={FMono}>{seg.mm}</text>
              </g>
            );
          })}

          {/* Vertici trascinabili */}
          {pts.map((p,i)=>{
            const s=S.toSvg(p);
            return(
              <g key={i} style={{cursor:"grab"}}>
                <circle cx={s.sx} cy={s.sy} r={16} fill="transparent"
                  onPointerDown={e=>onPtrDown(e,i)}/>
                <circle cx={s.sx} cy={s.sy} r={i===0?9:6}
                  fill={i===0?"#1A9E73":dragIdx===i?"#D08008":"#1A3A6A"}
                  stroke="#fff" strokeWidth={2}/>
                {i===0&&<text x={s.sx} y={s.sy-13} textAnchor="middle"
                  fontSize={9} fill="#1A9E73" fontWeight="800">S</text>}
                {dragIdx===i&&<text x={s.sx} y={s.sy-14} textAnchor="middle"
                  fontSize={8} fill="#D08008" fontWeight="800">
                  {Math.round(p.x)},{Math.round(p.y)}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── CHIPS segmenti ── */}
      {segs.length>0&&(
        <div style={{padding:"4px 8px",borderTop:"1px solid "+Tc.bdr,
          display:"flex",gap:3,flexWrap:"wrap",alignItems:"center",background:"#fff"}}>
          {segs.map((s,i)=>{
            const isSel=selIdx===i;
            const sym=s.dir==="dx"?"→":s.dir==="sx"?"←":s.dir==="giu"?"↓":"↑";
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:2,padding:"3px 5px",
                borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,
                color:isSel?"#fff":Tc.acc,background:isSel?Tc.acc:"#FFF8E8",
                border:"1.5px solid "+(isSel?Tc.acc:"#D0800840")}}>
                <span onClick={()=>{
                  if(isSel){setSelIdx(null);setPMm("");}
                  else{setSelIdx(i);setPDir(s.dir);setPMm(String(s.mm));}
                }} style={{display:"flex",alignItems:"center",gap:2}}>
                  <span>{sym}</span>
                  <span style={{fontFamily:FMono}}>{s.mm}</span>
                </span>
                <span onClick={e=>{e.stopPropagation();
                  setSegs(p=>p.filter((_,j)=>j!==i));if(selIdx===i)setSelIdx(null);}}
                  style={{fontSize:10,color:isSel?"rgba(255,255,255,0.7)":"#DC4444",fontWeight:900,marginLeft:1}}>×</span>
              </div>
            );
          })}
          <span style={{fontSize:9,color:Tc.sub,fontFamily:FMono}}>📏{sviluppata}mm</span>
        </div>
      )}

      {/* ── MATERIALI — sempre visibili quando c'è la sagoma ── */}
      {segs.length>0&&(
        <div style={{padding:"10px 10px 8px",borderTop:"2px solid "+Tc.bdr,background:Tc.bg}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:800,color:Tc.sub,textTransform:"uppercase",letterSpacing:0.5}}>
              Riempimento zona
              {divs.length>0&&<span style={{color:currentMat.stroke,marginLeft:4}}>— {currentMat.label}</span>}
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <button onClick={()=>setDivs(d=>[...d,{axis:"v",pos:Math.round(bbox.w/2)+bbox.minX,id:Date.now()}])}
                style={{padding:"3px 7px",borderRadius:5,background:"#8B5CF612",
                  border:"1px solid #8B5CF640",fontSize:9,fontWeight:700,color:"#8B5CF6",cursor:"pointer"}}>
                +│ Div.V
              </button>
              <button onClick={()=>setDivs(d=>[...d,{axis:"h",pos:Math.round(bbox.h/2)+bbox.minY,id:Date.now()}])}
                style={{padding:"3px 7px",borderRadius:5,background:"#0D948812",
                  border:"1px solid #0D948840",fontSize:9,fontWeight:700,color:"#0D9488",cursor:"pointer"}}>
                +─ Div.O
              </button>
              {divs.map(d=>(
                <div key={d.id} style={{display:"flex",alignItems:"center",gap:1,
                  padding:"2px 4px",borderRadius:4,background:(d.axis==="v"?"#8B5CF6":"#0D9488")+"15"}}>
                  <input type="number" value={d.pos}
                    onChange={e=>setDivs(divs.map(x=>x.id===d.id?{...x,pos:parseInt(e.target.value)||0}:x))}
                    style={{width:34,border:"none",fontSize:9,fontWeight:700,fontFamily:FMono,
                      textAlign:"center",background:"transparent",
                      color:d.axis==="v"?"#8B5CF6":"#0D9488"}}/>
                  <span onClick={()=>setDivs(divs.filter(x=>x.id!==d.id))}
                    style={{fontSize:10,color:Tc.red,cursor:"pointer",fontWeight:700}}>×</span>
                </div>
              ))}
            </div>
          </div>
          {/* 4 bottoni materiale — GRANDI */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {CT_MAT.map(mat=>{
              const isAct=(zoneMat[selZone||"0_0"]||"eps")===mat.id;
              return(
                <div key={mat.id}
                  onClick={()=>setZoneMat({...zoneMat,[selZone||"0_0"]:mat.id})}
                  style={{padding:"8px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                    border:"2px solid "+(isAct?mat.stroke:Tc.bdr),
                    background:isAct?mat.color:"#fff",
                    boxShadow:isAct?"0 2px 8px "+mat.stroke+"35":"none",
                    transition:"all 0.12s"}}>
                  <svg width={42} height={26} style={{display:"block",margin:"0 auto 4px",
                    borderRadius:4,overflow:"hidden"}}>
                    <defs>
                      <pattern id={"pE"+mat.id} x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
                        <rect width="7" height="7" fill="#C8DEF2"/>
                        <circle cx="3.5" cy="3.5" r="2.2" fill="none" stroke="#1A3A6A" strokeWidth="0.6"/>
                      </pattern>
                      <pattern id={"pW"+mat.id} x="0" y="0" width="7" height="4" patternUnits="userSpaceOnUse">
                        <rect width="7" height="4" fill="#F5A623"/>
                        <line x1="0" y1="2" x2="7" y2="2" stroke="#C07010" strokeWidth="0.7"/>
                      </pattern>
                    </defs>
                    <rect width={42} height={26} rx={3}
                      fill={mat.id==="eps"?"url(#pE"+mat.id+")":mat.id==="legno"?"url(#pW"+mat.id+")":mat.color}
                      stroke={mat.stroke} strokeWidth={1.2}
                      strokeDasharray={mat.dash?"4,2":undefined}/>
                  </svg>
                  <div style={{fontSize:10,fontWeight:isAct?800:600,
                    color:isAct?mat.stroke:Tc.sub,lineHeight:1}}>
                    {mat.label}
                  </div>
                </div>
              );
            })}
          </div>
          {divs.length===0&&segs.length>0&&(
            <div style={{marginTop:6,fontSize:9,color:Tc.sub,textAlign:"center"}}>
              Tocca la sagoma per selezionare una zona · Aggiungi divisori per zone multiple
            </div>
          )}
        </div>
      )}

      {/* ── TOOLBAR aggiunta segmenti ── */}
      <div style={{background:Tc.card,borderTop:"1px solid "+Tc.bdr,padding:"10px 12px 14px"}}>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:3,textTransform:"uppercase"}}>Telaio L</div>
            <input inputMode="decimal" value={misuraL} onChange={e=>setMisuraL(e.target.value)}
              placeholder="mm" style={{width:"100%",padding:"8px 10px",borderRadius:7,
                boxSizing:"border-box",border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:3,textTransform:"uppercase"}}>Telaio H</div>
            <input inputMode="decimal" value={misuraH} onChange={e=>setMisuraH(e.target.value)}
              placeholder="mm" style={{width:"100%",padding:"8px 10px",borderRadius:7,
                boxSizing:"border-box",border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",outline:"none"}}/>
          </div>
        </div>

        {selIdx!==null&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"6px 10px",borderRadius:8,background:"#FFF8EC",
            border:"1.5px solid "+Tc.acc,marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:700,color:Tc.acc}}>✏️ Seg. {selIdx+1}</span>
            <span onClick={()=>{setSelIdx(null);setPMm("");}}
              style={{fontSize:16,color:Tc.acc,cursor:"pointer",fontWeight:800}}>✕</span>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:8}}>
          {DIRS.map(({d,label,name})=>(
            <div key={d} onClick={()=>setPDir(d)}
              style={{padding:"9px 4px",borderRadius:9,textAlign:"center",cursor:"pointer",
                border:"2px solid "+(pDir===d?Tc.acc:Tc.bdr),
                background:pDir===d?Tc.acc:"#fff",
                boxShadow:pDir===d?"0 3px 0 "+Tc.acc+"88":"0 2px 0 rgba(0,0,0,0.05)",
                transition:"all 0.1s"}}>
              <div style={{fontSize:20,color:pDir===d?"#fff":"#94A3B8",lineHeight:1}}>{label}</div>
              <div style={{fontSize:9,fontWeight:600,color:pDir===d?"rgba(255,255,255,0.8)":"#CBD5E1",marginTop:2}}>
                {name}
              </div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:7}}>
          <div style={{flex:1,position:"relative"}}>
            <input inputMode="decimal" value={pMm}
              onChange={e=>setPMm(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addSeg();}}
              placeholder="mm"
              style={{width:"100%",padding:"12px 40px 12px 14px",borderRadius:9,
                border:"1.5px solid "+Tc.bdr,fontSize:24,fontWeight:800,
                fontFamily:FMono,textAlign:"center",boxSizing:"border-box",
                background:"#fff",color:"#0F172A",outline:"none"}}/>
            <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              fontSize:12,color:"#94A3B8",fontWeight:600}}>mm</span>
          </div>
          <div onClick={addSeg}
            style={{width:54,borderRadius:9,
              background:selIdx!==null?Tc.acc:"#1A9E73",color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:selIdx!==null?12:28,fontWeight:800,cursor:"pointer",
              boxShadow:"0 4px 0 "+(selIdx!==null?"#A06006":"#157A56"),flexShrink:0}}>
            {selIdx!==null?"✓":"＋"}
          </div>
        </div>
      </div>
    </div>
  );
}
