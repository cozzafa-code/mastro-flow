"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — ConfiguratoreControtelaio
// Engine identico alle lamiere: segmenti direzionali
// + fill zone chiuse con materiali (EPS / Legno / Sede / Profilo)
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from "react";

const FMono = "'JetBrains Mono','SF Mono',monospace";

const CT_MAT = [
  { id:"eps",    label:"EPS",     color:"#C8DEF2", stroke:"#1A3A6A" },
  { id:"legno",  label:"Legno",   color:"#F5A623", stroke:"#C07010" },
  { id:"sede",   label:"Sede",    color:"#FFFFFF", stroke:"#DC1414", dash:true },
  { id:"profilo",label:"Profilo", color:"#E0E8F0", stroke:"#334455" },
  { id:"vuoto",  label:"Vuoto",   color:"#F8F8F8", stroke:"#CCCCCC" },
];

const DIRS = [
  { d:"dx",  label:"→", name:"Destra"   },
  { d:"su",  label:"↑", name:"Su"       },
  { d:"sx",  label:"←", name:"Sinistra" },
  { d:"giu", label:"↓", name:"Giù"     },
];

const CT_PRESETS = [
  { n:"STH5",   segs:[{dir:"dx",mm:350},{dir:"giu",mm:60}] },
  { n:"PROS",   segs:[{dir:"dx",mm:280},{dir:"giu",mm:80},{dir:"sx",mm:60},{dir:"su",mm:40}] },
  { n:"PROGCP", segs:[{dir:"dx",mm:280},{dir:"giu",mm:60},{dir:"sx",mm:50},{dir:"giu",mm:110},{dir:"sx",mm:230}] },
  { n:"STH3",   segs:[{dir:"dx",mm:325},{dir:"giu",mm:80}] },
  { n:"Libero", segs:[] },
];

function buildNodes(segs, VW=640, VH=340, PAD=50) {
  let cx=0, cy=0;
  const raw = [{x:0,y:0}];
  segs.forEach(s => {
    if(s.dir==="dx")  cx += s.mm;
    if(s.dir==="sx")  cx -= s.mm;
    if(s.dir==="su")  cy -= s.mm;
    if(s.dir==="giu") cy += s.mm;
    raw.push({x:cx, y:cy});
  });
  if(raw.length<2) return raw.map(n=>({...n, sx:VW/2, sy:VH/2, scale:1, offX:0, offY:0}));
  const xs=raw.map(n=>n.x), ys=raw.map(n=>n.y);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const rangeX=maxX-minX||1, rangeY=maxY-minY||1;
  const scale=Math.min((VW-PAD*2)/rangeX,(VH-PAD*2)/rangeY);
  const offX=PAD+((VW-PAD*2)-rangeX*scale)/2-minX*scale;
  const offY=PAD+((VH-PAD*2)-rangeY*scale)/2-minY*scale;
  return raw.map(n=>({...n, sx:n.x*scale+offX, sy:n.y*scale+offY, scale, offX, offY}));
}

// Rileva zone rettangolari nella sagoma
function detectZones(nodes) {
  if(nodes.length<3) return [];
  const xs=[...new Set(nodes.map(n=>n.x))].sort((a,b)=>a-b);
  const ys=[...new Set(nodes.map(n=>n.y))].sort((a,b)=>a-b);
  if(xs.length<2||ys.length<2) return [];
  const zones = [];
  for(let xi=0;xi<xs.length-1;xi++) {
    for(let yi=0;yi<ys.length-1;yi++) {
      const mx=(xs[xi]+xs[xi+1])/2, my=(ys[yi]+ys[yi+1])/2;
      // Verifica che il centro sia dentro la sagoma (ray casting semplificato)
      const pts=nodes.map(n=>({x:n.x,y:n.y}));
      let inside=false;
      for(let i=0,j=pts.length-1;i<pts.length;j=i++){
        const xi2=pts[i].x, yi2=pts[i].y, xj=pts[j].x, yj=pts[j].y;
        if(((yi2>my)!=(yj>my))&&(mx<(xj-xi2)*(my-yi2)/(yj-yi2)+xi2)) inside=!inside;
      }
      if(inside) zones.push({id:`${xi}_${yi}`,x1:xs[xi],y1:ys[yi],x2:xs[xi+1],y2:ys[yi+1]});
    }
  }
  return zones;
}

export default function ConfiguratoreControtelaio({ value, onChange, T }) {
  const Tc = T || {bg:"#F2F1EC",card:"#FFFFFF",bdr:"#E5E3DC",text:"#1A1A1C",
    sub:"#8E8E93",acc:"#D08008",grn:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};

  const init = value||{};
  const [segs,    setSegs]    = useState(init.segs    || []);
  const [zones,   setZones]   = useState(init.zones   || {});
  const [pDir,    setPDir]    = useState("dx");
  const [pMm,     setPMm]     = useState("");
  const [selIdx,  setSelIdx]  = useState(null);
  const [selZone, setSelZone] = useState(null);
  const [misuraL, setMisuraL] = useState(init.misuraL || "");
  const [misuraH, setMisuraH] = useState(init.misuraH || "");
  const touches = useRef([]);
  const zoomRef = useRef(1);
  const panRef  = useRef({x:0,y:0});
  const svgRef  = useRef(null);

  const VW=640, VH=300, PAD=48;
  const nodes = buildNodes(segs,VW,VH,PAD);
  const sviluppata = segs.reduce((a,s)=>a+s.mm,0);
  const detZones = detectZones(nodes);

  useEffect(()=>{
    onChange?.({segs,zones,misuraL,misuraH});
  },[segs,zones,misuraL,misuraH]);

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

  const pathPts = nodes.map(n=>n.sx.toFixed(1)+","+n.sy.toFixed(1)).join(" ");

  // Converti mm → svg px
  const mToS = (mx,my) => {
    if(!nodes.length||!nodes[0].scale) return {sx:mx,sy:my};
    const {scale,offX,offY} = nodes[0];
    return {sx:mx*scale+offX, sy:my*scale+offY};
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
          <button key={p.n} onClick={()=>{setSegs(p.segs);setZones({});setSelIdx(null);setSelZone(null);}}
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

        {segs.length>0&&(
          <div style={{position:"absolute",top:6,right:6,zIndex:10,
            display:"flex",flexDirection:"column",gap:3}}>
            {[{l:"+",d:1.3},{l:"−",d:0.77},{l:"↺",d:0}].map(btn=>(
              <div key={btn.l} onClick={()=>{
                if(!btn.d){zoomRef.current=1;panRef.current={x:0,y:0};}
                else zoomRef.current=Math.min(5,Math.max(0.3,zoomRef.current*btn.d));
                applyTransform();
              }} style={{width:28,height:28,borderRadius:5,background:"rgba(255,255,255,0.9)",
                border:"1px solid "+Tc.bdr,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:btn.l==="↺"?13:17,fontWeight:800,
                cursor:"pointer",color:Tc.acc}}>
                {btn.l}
              </div>
            ))}
          </div>
        )}

        {!segs.length&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",flexDirection:"column",gap:6,color:"#94A3B8",
            pointerEvents:"none",padding:20}}>
            <div style={{fontSize:28}}>✏️</div>
            <div style={{fontSize:13,fontWeight:600}}>Disegna la sagoma del controtelaio</div>
            <div style={{fontSize:10,textAlign:"center"}}>
              Scegli una direzione, inserisci i mm e premi +<br/>
              Poi tocca una zona per riempirla
            </div>
          </div>
        )}

        <svg ref={svgRef} width="100%" viewBox={"0 0 "+VW+" "+VH}
          style={{display:"block",transformOrigin:"center",transition:"transform 0.05s",
            minHeight:160,maxHeight:260}}>
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
          </defs>
          <rect width={VW} height={VH} fill="url(#ctG)"/>

          {/* Zone riempite */}
          {segs.length>=2&&detZones.map(z=>{
            const matId=zones[z.id]||"vuoto";
            const mat=CT_MAT.find(m=>m.id===matId)||CT_MAT[4];
            const p1=mToS(z.x1,z.y1), p2=mToS(z.x2,z.y2);
            const zx=Math.min(p1.sx,p2.sx), zy=Math.min(p1.sy,p2.sy);
            const zw=Math.abs(p2.sx-p1.sx), zh=Math.abs(p2.sy-p1.sy);
            const isSel=selZone===z.id;
            const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
            return (
              <g key={z.id} style={{cursor:"pointer"}}
                onClick={()=>setSelZone(isSel?null:z.id)}>
                <rect x={zx} y={zy} width={zw} height={zh} fill={fill}
                  stroke={isSel?"#D08008":mat.stroke} strokeWidth={isSel?2.5:0.8}
                  strokeDasharray={mat.dash?"6,3":undefined}/>
                {zw>28&&zh>14&&(
                  <text x={zx+zw/2} y={zy+zh/2+4} textAnchor="middle"
                    fontSize={Math.min(10,zw*0.2,zh*0.5)} fontWeight="700"
                    fontFamily={FMono} fill={mat.dash?"#DC1414":"#1A3A6A"}>
                    {mat.id==="vuoto"?"":mat.label}
                  </text>
                )}
                {isSel&&<polygon
                  points={(zx+zw/2-5)+","+(zy-2)+" "+(zx+zw/2+5)+","+(zy-2)+" "+(zx+zw/2)+","+(zy+5)}
                  fill="#D08008"/>}
              </g>
            );
          })}

          {/* Sagoma */}
          {segs.length>0&&(
            <polyline points={pathPts} fill="none" stroke="#1A3A6A"
              strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          )}

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
                <rect x={qx-20} y={qy-9} width={40} height={14} rx={4}
                  fill="rgba(255,255,255,0.9)"/>
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
            fontSize:10,fontWeight:600,color:"#64748B"}}>
            📏 {sviluppata}mm
          </span>
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
              const isAct=(zones[selZone]||"vuoto")===mat.id;
              return (
                <div key={mat.id}
                  onClick={()=>setZones({...zones,[selZone]:mat.id})}
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
            <span style={{fontSize:11,fontWeight:700,color:Tc.acc}}>
              ✏️ Modifica segmento {selIdx+1}
            </span>
            <span onClick={()=>{setSelIdx(null);setPMm("");}}
              style={{fontSize:16,color:Tc.acc,cursor:"pointer",fontWeight:800}}>✕</span>
          </div>
        )}

        {/* Direzioni */}
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

        {/* mm + pulsante */}
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
              boxShadow:"0 4px 0 "+(selIdx!==null?"#A06006":"#157A56"),
              flexShrink:0}}>
            {selIdx!==null?"✓":"＋"}
          </div>
        </div>

        {segs.length>0&&(
          <button onClick={()=>{setSegs([]);setZones({});setSelIdx(null);setSelZone(null);}}
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
