"use client";
// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";

const FMono = "'JetBrains Mono','SF Mono',monospace";

const CT_MAT = [
  { id:"eps",    label:"EPS",     color:"#C8DEF2", stroke:"#1A3A6A" },
  { id:"legno",  label:"Legno",   color:"#F5A623", stroke:"#C07010" },
  { id:"sede",   label:"Sede",    color:"#FFFFFF", stroke:"#DC1414", dash:true },
  { id:"profilo",label:"Profilo", color:"#E0E8F0", stroke:"#334455" },
  { id:"vuoto",  label:"Vuoto",   color:"transparent", stroke:"none" },
];

const DIRS = [
  { d:"dx",  label:"→", name:"Destra"   },
  { d:"su",  label:"↑", name:"Su"       },
  { d:"sx",  label:"←", name:"Sinistra" },
  { d:"giu", label:"↓", name:"Giù"     },
];

const CT_PRESETS = [
  { n:"STH5",   segs:[{dir:"dx",mm:350},{dir:"giu",mm:60}],   divs:[] },
  { n:"PROS",   segs:[{dir:"dx",mm:280},{dir:"giu",mm:80},{dir:"sx",mm:60},{dir:"su",mm:40}], divs:[] },
  { n:"PROGCP", segs:[{dir:"dx",mm:280},{dir:"giu",mm:60},{dir:"sx",mm:50},{dir:"giu",mm:110},{dir:"sx",mm:230}], divs:[] },
  { n:"STH3",   segs:[{dir:"dx",mm:325},{dir:"giu",mm:80}],   divs:[] },
  { n:"Libero", segs:[], divs:[] },
];

function buildNodes(segs, VW=640, VH=300, PAD=48) {
  let cx=0, cy=0;
  const raw = [{x:0,y:0}];
  segs.forEach(s => {
    if(s.dir==="dx")  cx += s.mm;
    if(s.dir==="sx")  cx -= s.mm;
    if(s.dir==="su")  cy -= s.mm;
    if(s.dir==="giu") cy += s.mm;
    raw.push({x:cx, y:cy});
  });
  if(raw.length<2) return {nodes:raw.map(n=>({...n,sx:VW/2,sy:VH/2})), scale:1, offX:0, offY:0};
  const xs=raw.map(n=>n.x), ys=raw.map(n=>n.y);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const rangeX=maxX-minX||1, rangeY=maxY-minY||1;
  const scale=Math.min((VW-PAD*2)/rangeX,(VH-PAD*2)/rangeY);
  const offX=PAD+((VW-PAD*2)-rangeX*scale)/2-minX*scale;
  const offY=PAD+((VH-PAD*2)-rangeY*scale)/2-minY*scale;
  const nodes = raw.map(n=>({...n, sx:n.x*scale+offX, sy:n.y*scale+offY}));
  return {nodes, scale, offX, offY};
}

// Calcola bounding box della sagoma in mm
function getBBox(segs) {
  let cx=0,cy=0,minX=0,maxX=0,minY=0,maxY=0;
  segs.forEach(s=>{
    if(s.dir==="dx")  cx+=s.mm;
    if(s.dir==="sx")  cx-=s.mm;
    if(s.dir==="su")  cy-=s.mm;
    if(s.dir==="giu") cy+=s.mm;
    minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);
    minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
  });
  return {minX,maxX,minY,maxY,w:maxX-minX,h:maxY-minY};
}

export default function ConfiguratoreControtelaio({ value, onChange, T }) {
  const Tc = T || {bg:"#F2F1EC",card:"#FFFFFF",bdr:"#E5E3DC",text:"#1A1A1C",
    sub:"#8E8E93",acc:"#D08008",grn:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};

  const init = value||{};
  const [segs,    setSegs]    = useState(init.segs    || []);
  const [divs,    setDivs]    = useState(init.divs    || []); // {axis:"v"|"h", pos:mm, id}
  const [zoneMat, setZoneMat] = useState(init.zoneMat || {}); // "r_c" → matId
  const [pDir,    setPDir]    = useState("dx");
  const [pMm,     setPMm]     = useState("");
  const [selIdx,  setSelIdx]  = useState(null);
  const [selZone, setSelZone] = useState(null);
  const [misuraL, setMisuraL] = useState(init.misuraL||"");
  const [misuraH, setMisuraH] = useState(init.misuraH||"");
  const touches = useRef([]);
  const zoomRef = useRef(1);
  const panRef  = useRef({x:0,y:0});
  const svgRef  = useRef(null);

  const VW=640, VH=300, PAD=48;
  const {nodes,scale,offX,offY} = buildNodes(segs,VW,VH,PAD);
  const bbox = segs.length ? getBBox(segs) : {minX:0,maxX:300,minY:0,maxY:100,w:300,h:100};
  const sviluppata = segs.reduce((a,s)=>a+s.mm,0);

  useEffect(()=>{ onChange?.({segs,divs,zoneMat,misuraL,misuraH}); },[segs,divs,zoneMat,misuraL,misuraH]);

  const addSeg = () => {
    const mm=parseFloat(pMm); if(!mm||mm<=0) return;
    if(selIdx!==null){
      setSegs(prev=>prev.map((s,i)=>i===selIdx?{dir:pDir,mm}:s));
      setSelIdx(null);
    } else {
      setSegs(prev=>[...prev,{dir:pDir,mm}]);
    }
    setPMm("");
  };

  // mm → svg px
  const mToSx = (mx) => mx*scale+offX;
  const mToSy = (my) => my*scale+offY;

  // Calcola celle dalla griglia divisori (in mm)
  const vBreaks = [bbox.minX, ...[...new Set(divs.filter(d=>d.axis==="v").map(d=>d.pos))].sort((a,b)=>a-b), bbox.maxX];
  const hBreaks = [bbox.minY, ...[...new Set(divs.filter(d=>d.axis==="h").map(d=>d.pos))].sort((a,b)=>a-b), bbox.maxY];

  // Calcola SVG path della sagoma (per clipPath)
  const pathPts = nodes.map(n=>n.sx.toFixed(1)+","+n.sy.toFixed(1)).join(" ");
  const pathD   = nodes.map((n,i)=>(i===0?"M":"L")+n.sx.toFixed(1)+","+n.sy.toFixed(1)).join(" ")+" Z";

  // Gestione click su zona
  const handleZoneClick = (ri,ci,e) => {
    e.stopPropagation();
    const key=`${ri}_${ci}`;
    setSelZone(selZone===key?null:key);
    setSelIdx(null);
  };

  const applyTransform = () => {
    if(svgRef.current)
      svgRef.current.style.transform=
        `translate(${panRef.current.x}px,${panRef.current.y}px) scale(${zoomRef.current})`;
  };

  return (
    <div style={{borderRadius:8,overflow:"hidden",border:"1px solid "+Tc.bdr,background:Tc.card}}>

      {/* Presets */}
      <div style={{display:"flex",gap:4,padding:"6px 8px",overflowX:"auto",
        borderBottom:"1px solid "+Tc.bdr,background:Tc.bg}}>
        {CT_PRESETS.map(p=>(
          <button key={p.n} onClick={()=>{setSegs(p.segs);setDivs(p.divs||[]);setZoneMat({});setSelIdx(null);setSelZone(null);}}
            style={{padding:"4px 10px",borderRadius:6,border:"1.5px solid "+Tc.bdr,
              background:Tc.card,fontSize:10,fontWeight:700,cursor:"pointer",
              color:Tc.text,whiteSpace:"nowrap"}}>
            {p.n}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div style={{position:"relative",background:"#F8FAFC",overflow:"hidden",touchAction:"none"}}
        onTouchStart={e=>{touches.current=Array.from(e.touches);}}
        onTouchMove={e=>{
          e.preventDefault();
          const ts=Array.from(e.touches);
          if(ts.length===1&&touches.current.length===1){
            panRef.current={x:panRef.current.x+ts[0].clientX-touches.current[0].clientX,
                            y:panRef.current.y+ts[0].clientY-touches.current[0].clientY};
            touches.current=ts; applyTransform();
          } else if(ts.length===2&&touches.current.length===2){
            const d1=Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
            const d0=Math.hypot(touches.current[0].clientX-touches.current[1].clientX,
                                touches.current[0].clientY-touches.current[1].clientY);
            zoomRef.current=Math.min(5,Math.max(0.3,zoomRef.current*d1/d0));
            touches.current=ts; applyTransform();
          }
        }}
        onTouchEnd={e=>{touches.current=Array.from(e.touches);}}>

        {/* Zoom buttons */}
        {segs.length>0&&(
          <div style={{position:"absolute",top:6,right:6,zIndex:10,display:"flex",flexDirection:"column",gap:3}}>
            {[{l:"+",d:1.3},{l:"−",d:0.77},{l:"↺",d:0}].map(btn=>(
              <div key={btn.l} onClick={()=>{
                if(!btn.d){zoomRef.current=1;panRef.current={x:0,y:0};}
                else zoomRef.current=Math.min(5,Math.max(0.3,zoomRef.current*btn.d));
                applyTransform();
              }} style={{width:28,height:28,borderRadius:5,background:"rgba(255,255,255,0.9)",
                border:"1px solid "+Tc.bdr,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:btn.l==="↺"?13:17,fontWeight:800,cursor:"pointer",color:Tc.acc}}>
                {btn.l}
              </div>
            ))}
          </div>
        )}

        {!segs.length&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",flexDirection:"column",gap:6,color:"#94A3B8",pointerEvents:"none",padding:20}}>
            <div style={{fontSize:28}}>✏️</div>
            <div style={{fontSize:13,fontWeight:600}}>Disegna la sagoma del controtelaio</div>
            <div style={{fontSize:10,textAlign:"center"}}>Scegli direzione → inserisci mm → premi +</div>
          </div>
        )}

        <svg ref={svgRef} width="100%" viewBox={"0 0 "+VW+" "+VH}
          style={{display:"block",transformOrigin:"center",transition:"transform 0.05s",
            minHeight:160,maxHeight:280}}>

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
            <pattern id="ctG" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ECEEF3" strokeWidth="0.5"/>
            </pattern>
            {/* ClipPath della sagoma — taglia i riempimenti */}
            {segs.length>1&&(
              <clipPath id="sagoma_clip">
                <polygon points={pathPts}/>
              </clipPath>
            )}
          </defs>

          <rect width={VW} height={VH} fill="url(#ctG)"/>

          {/* ── RIEMPIMENTI ZONE (ritagliati dalla sagoma) ── */}
          {segs.length>1&&(
            <g clipPath="url(#sagoma_clip)">
              {hBreaks.slice(0,-1).map((y1,ri)=>
                vBreaks.slice(0,-1).map((x1,ci)=>{
                  const x2=vBreaks[ci+1], y2=hBreaks[ri+1];
                  const key=`${ri}_${ci}`;
                  const matId=zoneMat[key]||"vuoto";
                  const mat=CT_MAT.find(m=>m.id===matId)||CT_MAT[4];
                  const sx=mToSx(x1), sy=mToSy(y1);
                  const sw=(x2-x1)*scale, sh=(y2-y1)*scale;
                  const isSel=selZone===key;
                  const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
                  return (
                    <g key={key} style={{cursor:"pointer"}}
                      onClick={e=>handleZoneClick(ri,ci,e)}>
                      <rect x={sx} y={sy} width={sw} height={sh}
                        fill={fill}
                        stroke={isSel?"#D08008":mat.id==="sede"?"#DC1414":"none"}
                        strokeWidth={isSel?2.5:mat.id==="sede"?1:0}
                        strokeDasharray={mat.dash&&!isSel?"6,3":undefined}/>
                      {isSel&&(
                        <rect x={sx+1} y={sy+1} width={sw-2} height={sh-2}
                          fill="none" stroke="#D08008" strokeWidth={2.5}
                          strokeDasharray="6,3"/>
                      )}
                      {/* Label materiale */}
                      {sw>30&&sh>16&&mat.id!=="vuoto"&&(
                        <text x={sx+sw/2} y={sy+sh/2+4} textAnchor="middle"
                          fontSize={Math.min(11,sw*0.18,sh*0.45)} fontWeight="800"
                          fontFamily={FMono}
                          fill={mat.id==="sede"?"#DC1414":mat.id==="eps"?"#1A3A6A":"#774400"}>
                          {mat.label}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </g>
          )}

          {/* ── PROFILO SAGOMA (sopra i riempimenti) ── */}
          {segs.length>0&&(
            <polygon points={pathPts} fill="none" stroke="#1A3A6A"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          )}

          {/* Divisori */}
          {segs.length>1&&divs.map(d=>{
            if(d.axis==="v"){
              const sx=mToSx(d.pos);
              return (
                <g key={d.id}>
                  <line x1={sx} y1={mToSy(bbox.minY)} x2={sx} y2={mToSy(bbox.maxY)}
                    stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4,3"/>
                </g>
              );
            } else {
              const sy=mToSy(d.pos);
              return (
                <g key={d.id}>
                  <line x1={mToSx(bbox.minX)} y1={sy} x2={mToSx(bbox.maxX)} y2={sy}
                    stroke="#0D9488" strokeWidth={1.5} strokeDasharray="4,3"/>
                </g>
              );
            }
          })}

          {/* Segmento selezionato highlight */}
          {selIdx!==null&&selIdx<nodes.length-1&&(
            <line x1={nodes[selIdx].sx} y1={nodes[selIdx].sy}
              x2={nodes[selIdx+1].sx} y2={nodes[selIdx+1].sy}
              stroke="#D08008" strokeWidth={6} strokeLinecap="round" opacity={0.7}/>
          )}

          {/* Nodi */}
          {nodes.map((n,i)=>(
            <circle key={i} cx={n.sx} cy={n.sy} r={i===0?8:i===nodes.length-1?5:4}
              fill={i===0?"#1A9E73":i===nodes.length-1?"#fff":"#1A3A6A"}
              stroke={i===nodes.length-1?"#1A3A6A":"#fff"} strokeWidth={2}/>
          ))}
          {nodes.length>0&&(
            <text x={nodes[0].sx-12} y={nodes[0].sy-11} fontSize={9}
              fill="#1A9E73" fontWeight="800">START</text>
          )}

          {/* Quote */}
          {nodes.slice(1).map((n,i)=>{
            const prev=nodes[i],seg=segs[i]; if(!seg) return null;
            const mx=(prev.sx+n.sx)/2, my=(prev.sy+n.sy)/2;
            const isH=Math.abs(n.sy-prev.sy)<Math.abs(n.sx-prev.sx);
            const qx=mx+(isH?0:-28), qy=my+(isH?-18:0);
            return (
              <g key={i}>
                <rect x={qx-20} y={qy-9} width={40} height={14} rx={4} fill="rgba(255,255,255,0.92)"/>
                <text x={qx} y={qy+1} textAnchor="middle" fontSize={11}
                  fill="#0F172A" fontWeight="800" fontFamily={FMono}>{seg.mm}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chips segmenti */}
      {segs.length>0&&(
        <div style={{padding:"5px 8px",borderTop:"1px solid "+Tc.bdr,
          display:"flex",gap:4,flexWrap:"wrap",alignItems:"center",background:"#fff"}}>
          {segs.map((s,i)=>{
            const isSel=selIdx===i;
            const sym=s.dir==="dx"?"→":s.dir==="sx"?"←":s.dir==="giu"?"↓":"↑";
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:2,
                padding:"3px 6px",borderRadius:7,cursor:"pointer",fontSize:12,
                fontWeight:700,color:isSel?"#fff":Tc.acc,
                background:isSel?Tc.acc:"#FFF8E8",
                border:"1.5px solid "+(isSel?Tc.acc:"#D0800840")}}>
                <span onClick={()=>{
                  if(isSel){setSelIdx(null);setPMm("");}
                  else{setSelIdx(i);setPDir(s.dir);setPMm(String(s.mm));}
                }} style={{display:"flex",alignItems:"center",gap:3}}>
                  <span>{sym}</span>
                  <span style={{fontFamily:FMono}}>{s.mm}</span>
                </span>
                <span onClick={e=>{e.stopPropagation();
                  setSegs(prev=>prev.filter((_,j)=>j!==i));
                  if(selIdx===i)setSelIdx(null);}}
                  style={{fontSize:11,color:isSel?"rgba(255,255,255,0.8)":"#DC4444",
                    fontWeight:900,marginLeft:1,padding:"0 2px"}}>×</span>
              </div>
            );
          })}
          <span style={{padding:"3px 8px",background:"#F1F5F9",borderRadius:6,
            fontSize:10,fontWeight:600,color:"#64748B"}}>📏 {sviluppata}mm</span>
        </div>
      )}

      {/* Selettore materiale zona */}
      {selZone&&(
        <div style={{padding:"8px 10px",borderTop:"1.5px solid "+Tc.blue+"30",background:"#F0F7FF"}}>
          <div style={{fontSize:10,fontWeight:700,color:Tc.blue,marginBottom:6,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>MATERIALE ZONA</span>
            <span onClick={()=>setSelZone(null)} style={{cursor:"pointer",fontSize:16}}>×</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
            {CT_MAT.map(mat=>{
              const isAct=(zoneMat[selZone]||"vuoto")===mat.id;
              return (
                <div key={mat.id}
                  onClick={()=>setZoneMat({...zoneMat,[selZone]:mat.id})}
                  style={{padding:"5px 2px",borderRadius:6,textAlign:"center",
                    cursor:"pointer",border:"1.5px solid "+(isAct?mat.stroke:Tc.bdr),
                    background:isAct?mat.color:"#fff"}}>
                  <svg width={32} height={20} style={{display:"block",margin:"0 auto 2px"}}>
                    <defs>
                      <pattern id={"pvE"+mat.id} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                        <rect width="6" height="6" fill="#C8DEF2"/>
                        <circle cx="3" cy="3" r="1.8" fill="none" stroke="#1A3A6A" strokeWidth="0.5"/>
                      </pattern>
                      <pattern id={"pvW"+mat.id} x="0" y="0" width="6" height="4" patternUnits="userSpaceOnUse">
                        <rect width="6" height="4" fill="#F5A623"/>
                        <line x1="0" y1="2" x2="6" y2="2" stroke="#C07010" strokeWidth="0.6"/>
                      </pattern>
                    </defs>
                    <rect width={32} height={20} rx={3}
                      fill={mat.id==="eps"?"url(#pvE"+mat.id+")":mat.id==="legno"?"url(#pvW"+mat.id+")":mat.color}
                      stroke={mat.stroke} strokeWidth={1}
                      strokeDasharray={mat.dash?"4,2":undefined}/>
                  </svg>
                  <div style={{fontSize:7,fontWeight:isAct?800:500,color:isAct?mat.stroke:Tc.sub}}>
                    {mat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divisori */}
      {segs.length>1&&(
        <div style={{display:"flex",gap:4,padding:"5px 8px",
          borderTop:"1px solid "+Tc.bdr,alignItems:"center",flexWrap:"wrap",background:Tc.bg}}>
          <span style={{fontSize:9,fontWeight:700,color:Tc.sub}}>DIVIDI:</span>
          <button onClick={()=>setDivs(d=>[...d,{axis:"v",pos:Math.round(bbox.w/2)+bbox.minX,id:Date.now()}])}
            style={{padding:"3px 8px",borderRadius:5,background:"#8B5CF612",
              border:"1px solid #8B5CF630",cursor:"pointer",fontSize:9,fontWeight:700,color:"#8B5CF6"}}>
            +│ Verticale
          </button>
          <button onClick={()=>setDivs(d=>[...d,{axis:"h",pos:Math.round(bbox.h/2)+bbox.minY,id:Date.now()}])}
            style={{padding:"3px 8px",borderRadius:5,background:"#0D948812",
              border:"1px solid #0D948830",cursor:"pointer",fontSize:9,fontWeight:700,color:"#0D9488"}}>
            +─ Orizzontale
          </button>
          {divs.map(d=>(
            <div key={d.id} style={{display:"flex",alignItems:"center",gap:2,
              padding:"2px 5px",borderRadius:4,
              background:(d.axis==="v"?"#8B5CF6":"#0D9488")+"10"}}>
              <input type="number" value={d.pos}
                onChange={e=>setDivs(divs.map(x=>x.id===d.id?{...x,pos:parseInt(e.target.value)||0}:x))}
                style={{width:40,padding:"1px",border:"none",borderRadius:3,
                  fontSize:9,fontWeight:700,fontFamily:FMono,textAlign:"center",
                  background:"transparent",color:d.axis==="v"?"#8B5CF6":"#0D9488"}}/>
              <span onClick={()=>setDivs(divs.filter(x=>x.id!==d.id))}
                style={{fontSize:10,color:Tc.red,cursor:"pointer",fontWeight:700}}>×</span>
            </div>
          ))}
        </div>
      )}

      {/* Pannello aggiunta segmenti */}
      <div style={{background:Tc.card,borderTop:"1px solid "+Tc.bdr,padding:"10px 12px 14px"}}>

        {/* Misure esterne telaio */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:4,
              textTransform:"uppercase",letterSpacing:0.5}}>Telaio L (mm)</div>
            <input inputMode="decimal" value={misuraL}
              onChange={e=>setMisuraL(e.target.value)} placeholder="es. 1200"
              style={{width:"100%",padding:"9px 10px",borderRadius:8,boxSizing:"border-box",
                border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",
                color:"#0F172A",outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:4,
              textTransform:"uppercase",letterSpacing:0.5}}>Telaio H (mm)</div>
            <input inputMode="decimal" value={misuraH}
              onChange={e=>setMisuraH(e.target.value)} placeholder="es. 1400"
              style={{width:"100%",padding:"9px 10px",borderRadius:8,boxSizing:"border-box",
                border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",
                color:"#0F172A",outline:"none"}}/>
          </div>
        </div>

        {selIdx!==null&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"7px 10px",borderRadius:8,background:"#FFF8EC",
            border:"1.5px solid "+Tc.acc,marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:700,color:Tc.acc}}>✏️ Modifica segmento {selIdx+1}</span>
            <span onClick={()=>{setSelIdx(null);setPMm("");}}
              style={{fontSize:16,color:Tc.acc,cursor:"pointer",fontWeight:800}}>✕</span>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:8}}>
          {DIRS.map(({d,label,name})=>(
            <div key={d} onClick={()=>setPDir(d)}
              style={{padding:"10px 4px",borderRadius:10,textAlign:"center",cursor:"pointer",
                border:"2px solid "+(pDir===d?Tc.acc:Tc.bdr),
                background:pDir===d?Tc.acc:"#fff",
                boxShadow:pDir===d?"0 3px 0 "+Tc.acc+"88":"0 2px 0 rgba(0,0,0,0.06)",
                transition:"all 0.1s"}}>
              <div style={{fontSize:22,color:pDir===d?"#fff":"#94A3B8",lineHeight:1}}>{label}</div>
              <div style={{fontSize:9,fontWeight:600,
                color:pDir===d?"rgba(255,255,255,0.8)":"#CBD5E1",marginTop:2}}>{name}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,position:"relative"}}>
            <input inputMode="decimal" value={pMm}
              onChange={e=>setPMm(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addSeg();}}
              placeholder="mm"
              style={{width:"100%",padding:"13px 44px 13px 16px",borderRadius:10,
                border:"1.5px solid "+Tc.bdr,fontSize:26,fontWeight:800,
                fontFamily:FMono,textAlign:"center",boxSizing:"border-box",
                background:"#fff",color:"#0F172A",outline:"none"}}/>
            <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",
              fontSize:13,color:"#94A3B8",fontWeight:600}}>mm</span>
          </div>
          <div onClick={addSeg}
            style={{width:60,borderRadius:10,
              background:selIdx!==null?Tc.acc:"#1A9E73",color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:selIdx!==null?12:30,fontWeight:800,cursor:"pointer",
              boxShadow:"0 4px 0 "+(selIdx!==null?"#A06006":"#157A56"),flexShrink:0}}>
            {selIdx!==null?"✓":"＋"}
          </div>
        </div>

        {segs.length>0&&(
          <button onClick={()=>{setSegs([]);setDivs([]);setZoneMat({});setSelIdx(null);setSelZone(null);}}
            style={{marginTop:8,width:"100%",padding:"6px",borderRadius:8,
              border:"1px solid "+Tc.bdr,background:"white",
              color:Tc.sub,fontSize:10,cursor:"pointer",fontWeight:600}}>
            🗑 Azzera disegno
          </button>
        )}
      </div>
    </div>
  );
}
