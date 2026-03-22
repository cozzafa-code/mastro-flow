"use client";
// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";

const FMono = "'JetBrains Mono','SF Mono',monospace";

const CT_MAT = [
  { id:"eps",    label:"EPS",     color:"#C8DEF2", stroke:"#1A3A6A" },
  { id:"legno",  label:"Legno",   color:"#F5A623", stroke:"#C07010" },
  { id:"sede",   label:"Sede",    color:"#FFFFFF", stroke:"#DC1414", dash:true },
  { id:"profilo",label:"Profilo", color:"#E0E8F0", stroke:"#334455" },
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

function buildNodes(segs, VW=600, VH=240, PAD=44) {
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
  return {
    nodes: raw.map(n=>({...n, sx:n.x*scale+offX, sy:n.y*scale+offY})),
    scale, offX, offY
  };
}

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
  return {minX,maxX,minY,maxY,w:maxX-minX||1,h:maxY-minY||1};
}

export default function ConfiguratoreControtelaio({ value, onChange, T }) {
  const Tc = T || {bg:"#F2F1EC",card:"#FFFFFF",bdr:"#E5E3DC",text:"#1A1A1C",
    sub:"#8E8E93",acc:"#D08008",grn:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};

  const init = value||{};
  const [segs,    setSegs]    = useState(init.segs    || []);
  const [divs,    setDivs]    = useState(init.divs    || []);
  const [zoneMat, setZoneMat] = useState(init.zoneMat || {"0_0":"eps"});
  const [pDir,    setPDir]    = useState("dx");
  const [pMm,     setPMm]     = useState("");
  const [selIdx,  setSelIdx]  = useState(null);
  const [selZone, setSelZone] = useState("0_0"); // default prima zona selezionata
  const [misuraL, setMisuraL] = useState(init.misuraL||"");
  const [misuraH, setMisuraH] = useState(init.misuraH||"");
  const touches = useRef([]);
  const zoomRef = useRef(1);
  const panRef  = useRef({x:0,y:0});
  const svgRef  = useRef(null);

  const VW=600, VH=240, PAD=44;
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

  const mToSx = (mx) => mx*scale+offX;
  const mToSy = (my) => my*scale+offY;

  // Calcola colonne e righe in mm
  const vBreaks = [bbox.minX, ...[...new Set(divs.filter(d=>d.axis==="v").map(d=>d.pos))].sort((a,b)=>a-b), bbox.maxX];
  const hBreaks = [bbox.minY, ...[...new Set(divs.filter(d=>d.axis==="h").map(d=>d.pos))].sort((a,b)=>a-b), bbox.maxY];
  const pathPts = nodes.map(n=>n.sx.toFixed(1)+","+n.sy.toFixed(1)).join(" ");

  const applyTransform = () => {
    if(svgRef.current)
      svgRef.current.style.transform=
        `translate(${panRef.current.x}px,${panRef.current.y}px) scale(${zoomRef.current})`;
  };

  const currentMat = CT_MAT.find(m=>m.id===(zoneMat[selZone||"0_0"]||"eps"))||CT_MAT[0];

  return (
    <div style={{borderRadius:8,overflow:"hidden",border:"1px solid "+Tc.bdr,background:Tc.card}}>

      {/* Presets */}
      <div style={{display:"flex",gap:4,padding:"6px 8px",overflowX:"auto",
        borderBottom:"1px solid "+Tc.bdr,background:Tc.bg}}>
        {CT_PRESETS.map(p=>(
          <button key={p.n} onClick={()=>{
            setSegs(p.segs);setDivs(p.divs||[]);
            setZoneMat({"0_0":"eps"});setSelIdx(null);setSelZone("0_0");
          }} style={{padding:"4px 10px",borderRadius:6,border:"1.5px solid "+Tc.bdr,
            background:Tc.card,fontSize:10,fontWeight:700,cursor:"pointer",
            color:Tc.text,whiteSpace:"nowrap"}}>
            {p.n}
          </button>
        ))}
      </div>

      {/* Canvas SVG */}
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
          <div style={{position:"absolute",top:6,right:6,zIndex:10,display:"flex",flexDirection:"column",gap:3}}>
            {[{l:"+",d:1.3},{l:"−",d:0.77},{l:"↺",d:0}].map(btn=>(
              <div key={btn.l} onClick={()=>{
                if(!btn.d){zoomRef.current=1;panRef.current={x:0,y:0};}
                else zoomRef.current=Math.min(5,Math.max(0.3,zoomRef.current*btn.d));
                applyTransform();
              }} style={{width:26,height:26,borderRadius:5,background:"rgba(255,255,255,0.9)",
                border:"1px solid "+Tc.bdr,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:btn.l==="↺"?12:16,fontWeight:800,cursor:"pointer",color:Tc.acc}}>
                {btn.l}
              </div>
            ))}
          </div>
        )}

        {!segs.length&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",
            flexDirection:"column",gap:5,color:"#94A3B8",padding:"24px 20px",
            pointerEvents:"none"}}>
            <div style={{fontSize:24}}>✏️</div>
            <div style={{fontSize:12,fontWeight:600}}>Disegna la sagoma</div>
            <div style={{fontSize:10,textAlign:"center"}}>Scegli direzione → mm → +</div>
          </div>
        )}

        {segs.length>0&&(
          <svg ref={svgRef} width="100%" viewBox={"0 0 "+VW+" "+VH}
            style={{display:"block",transformOrigin:"center",transition:"transform 0.05s"}}>
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
              <pattern id="ctG" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ECEEF3" strokeWidth="0.5"/>
              </pattern>
              <clipPath id="sgClip">
                <polygon points={pathPts}/>
              </clipPath>
            </defs>

            <rect width={VW} height={VH} fill="url(#ctG)"/>

            {/* Riempimenti — dentro clipPath sagoma */}
            <g clipPath="url(#sgClip)">
              {hBreaks.slice(0,-1).map((_,ri)=>
                vBreaks.slice(0,-1).map((_,ci)=>{
                  const x1=vBreaks[ci], y1=hBreaks[ri];
                  const x2=vBreaks[ci+1], y2=hBreaks[ri+1];
                  const key=`${ri}_${ci}`;
                  const matId=zoneMat[key]||"eps";
                  const mat=CT_MAT.find(m=>m.id===matId)||CT_MAT[0];
                  const sx=mToSx(x1), sy=mToSy(y1);
                  const sw=(x2-x1)*scale, sh=(y2-y1)*scale;
                  const isSel=selZone===key;
                  const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
                  return (
                    <g key={key} style={{cursor:"pointer"}}
                      onClick={e=>{e.stopPropagation();setSelZone(isSel?key:key);setSelIdx(null);}}>
                      <rect x={sx} y={sy} width={sw} height={sh} fill={fill}/>
                      {isSel&&(
                        <rect x={sx+1} y={sy+1} width={sw-2} height={sh-2}
                          fill="none" stroke="#D08008" strokeWidth={2.5} strokeDasharray="6,3"/>
                      )}
                      {sw>36&&sh>18&&mat.id!=="sede"&&(
                        <text x={sx+sw/2} y={sy+sh/2+4} textAnchor="middle"
                          fontSize={Math.min(11,sw*0.15,sh*0.4)} fontWeight="800"
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

            {/* Bordo sagoma */}
            <polygon points={pathPts} fill="none" stroke="#1A3A6A"
              strokeWidth="2.5" strokeLinejoin="round"/>

            {/* Divisori */}
            {divs.map(d=>{
              if(d.axis==="v"){
                const sx=mToSx(d.pos);
                return <line key={d.id} x1={sx} y1={mToSy(bbox.minY)} x2={sx} y2={mToSy(bbox.maxY)}
                  stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4,3"/>;
              }
              const sy=mToSy(d.pos);
              return <line key={d.id} x1={mToSx(bbox.minX)} y1={sy} x2={mToSx(bbox.maxX)} y2={sy}
                stroke="#0D9488" strokeWidth={1.5} strokeDasharray="4,3"/>;
            })}

            {/* Highlight segmento in edit */}
            {selIdx!==null&&selIdx<nodes.length-1&&(
              <line x1={nodes[selIdx].sx} y1={nodes[selIdx].sy}
                x2={nodes[selIdx+1].sx} y2={nodes[selIdx+1].sy}
                stroke="#D08008" strokeWidth={5} strokeLinecap="round" opacity={0.7}/>
            )}

            {/* Nodi */}
            {nodes.map((n,i)=>(
              <circle key={i} cx={n.sx} cy={n.sy} r={i===0?7:4}
                fill={i===0?"#1A9E73":"#1A3A6A"} stroke="#fff" strokeWidth={1.5}/>
            ))}
            {nodes[0]&&(
              <text x={nodes[0].sx-10} y={nodes[0].sy-10} fontSize={8}
                fill="#1A9E73" fontWeight="800">S</text>
            )}

            {/* Quote */}
            {nodes.slice(1).map((n,i)=>{
              const prev=nodes[i],seg=segs[i]; if(!seg) return null;
              const mx=(prev.sx+n.sx)/2, my=(prev.sy+n.sy)/2;
              const isH=Math.abs(n.sy-prev.sy)<Math.abs(n.sx-prev.sx);
              const qx=mx+(isH?0:-24), qy=my+(isH?-15:0);
              return (
                <g key={i}>
                  <rect x={qx-18} y={qy-8} width={36} height={12} rx={3} fill="rgba(255,255,255,0.9)"/>
                  <text x={qx} y={qy+1} textAnchor="middle" fontSize={10}
                    fill="#0F172A" fontWeight="800" fontFamily={FMono}>{seg.mm}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Chips segmenti */}
      {segs.length>0&&(
        <div style={{padding:"4px 8px",borderTop:"1px solid "+Tc.bdr,
          display:"flex",gap:3,flexWrap:"wrap",alignItems:"center",background:"#fff"}}>
          {segs.map((s,i)=>{
            const isSel=selIdx===i;
            const sym=s.dir==="dx"?"→":s.dir==="sx"?"←":s.dir==="giu"?"↓":"↑";
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:2,
                padding:"3px 5px",borderRadius:6,cursor:"pointer",fontSize:11,
                fontWeight:700,color:isSel?"#fff":Tc.acc,
                background:isSel?Tc.acc:"#FFF8E8",
                border:"1.5px solid "+(isSel?Tc.acc:"#D0800840")}}>
                <span onClick={()=>{
                  if(isSel){setSelIdx(null);setPMm("");}
                  else{setSelIdx(i);setPDir(s.dir);setPMm(String(s.mm));}
                }} style={{display:"flex",alignItems:"center",gap:2}}>
                  <span>{sym}</span>
                  <span style={{fontFamily:FMono}}>{s.mm}</span>
                </span>
                <span onClick={e=>{e.stopPropagation();
                  setSegs(prev=>prev.filter((_,j)=>j!==i));
                  if(selIdx===i)setSelIdx(null);}}
                  style={{fontSize:10,color:isSel?"rgba(255,255,255,0.7)":"#DC4444",
                    fontWeight:900,marginLeft:1}}>×</span>
              </div>
            );
          })}
          <span style={{fontSize:9,color:Tc.sub,fontFamily:FMono}}>📏{sviluppata}mm</span>
        </div>
      )}

      {/* ── SELETTORE MATERIALE — sempre visibile quando c'è la sagoma ── */}
      {segs.length>0&&(
        <div style={{padding:"8px 10px",borderTop:"2px solid "+Tc.bdr,background:Tc.bg}}>
          {/* Intestazione */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{fontSize:10,fontWeight:800,color:Tc.sub,
              textTransform:"uppercase",letterSpacing:0.5}}>
              {selZone&&divs.length>0 ? "ZONA "+(selZone.split("_").map(n=>parseInt(n)+1).join("-"))+" — " : "RIEMPIMENTO — "}
              <span style={{color:currentMat.stroke,fontWeight:900}}>{currentMat.label}</span>
            </div>
            {divs.length===0&&(
              <div style={{marginLeft:"auto",fontSize:9,color:Tc.sub}}>
                Aggiungi divisori per zone multiple →
              </div>
            )}
          </div>
          {/* 4 bottoni materiale */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
            {CT_MAT.map(mat=>{
              const isAct=(zoneMat[selZone||"0_0"]||"eps")===mat.id;
              const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
              return (
                <div key={mat.id}
                  onClick={()=>{
                    const key=selZone||"0_0";
                    setZoneMat({...zoneMat,[key]:mat.id});
                  }}
                  style={{padding:"6px 4px",borderRadius:7,textAlign:"center",cursor:"pointer",
                    border:"2px solid "+(isAct?mat.stroke:Tc.bdr),
                    background:isAct?mat.color:"#fff",
                    boxShadow:isAct?"0 2px 6px "+mat.stroke+"30":"none",
                    transition:"all 0.1s"}}>
                  {/* Preview materiale */}
                  <svg width={36} height={22} style={{display:"block",margin:"0 auto 3px",borderRadius:3,overflow:"hidden"}}>
                    <defs>
                      <pattern id={"p_e_"+mat.id} x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
                        <rect width="7" height="7" fill="#C8DEF2"/>
                        <circle cx="3.5" cy="3.5" r="2.2" fill="none" stroke="#1A3A6A" strokeWidth="0.6"/>
                      </pattern>
                      <pattern id={"p_w_"+mat.id} x="0" y="0" width="7" height="4" patternUnits="userSpaceOnUse">
                        <rect width="7" height="4" fill="#F5A623"/>
                        <line x1="0" y1="2" x2="7" y2="2" stroke="#C07010" strokeWidth="0.7"/>
                      </pattern>
                    </defs>
                    <rect width={36} height={22} rx={2}
                      fill={mat.id==="eps"?"url(#p_e_"+mat.id+")":mat.id==="legno"?"url(#p_w_"+mat.id+")":mat.color}
                      stroke={mat.stroke} strokeWidth={1}
                      strokeDasharray={mat.dash?"4,2":undefined}/>
                  </svg>
                  <div style={{fontSize:9,fontWeight:isAct?800:600,
                    color:isAct?mat.stroke:Tc.sub,lineHeight:1}}>
                    {mat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divisori */}
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:9,fontWeight:700,color:Tc.sub}}>DIVIDI:</span>
            <button onClick={()=>{
              const pos=Math.round(bbox.w/2)+bbox.minX;
              setDivs(d=>[...d,{axis:"v",pos,id:Date.now()}]);
              setSelZone("0_0");
            }} style={{padding:"3px 7px",borderRadius:5,background:"#8B5CF612",
              border:"1px solid #8B5CF640",cursor:"pointer",fontSize:9,fontWeight:700,color:"#8B5CF6"}}>
              +│ Vert.
            </button>
            <button onClick={()=>{
              const pos=Math.round(bbox.h/2)+bbox.minY;
              setDivs(d=>[...d,{axis:"h",pos,id:Date.now()}]);
              setSelZone("0_0");
            }} style={{padding:"3px 7px",borderRadius:5,background:"#0D948812",
              border:"1px solid #0D948840",cursor:"pointer",fontSize:9,fontWeight:700,color:"#0D9488"}}>
              +─ Oriz.
            </button>
            {divs.map(d=>(
              <div key={d.id} style={{display:"flex",alignItems:"center",gap:2,
                padding:"2px 5px",borderRadius:4,
                background:(d.axis==="v"?"#8B5CF6":"#0D9488")+"12"}}>
                <input type="number" value={d.pos}
                  onChange={e=>setDivs(divs.map(x=>x.id===d.id?{...x,pos:parseInt(e.target.value)||0}:x))}
                  style={{width:38,padding:"1px",border:"none",borderRadius:3,
                    fontSize:9,fontWeight:700,fontFamily:FMono,textAlign:"center",
                    background:"transparent",color:d.axis==="v"?"#8B5CF6":"#0D9488"}}/>
                <span onClick={()=>setDivs(divs.filter(x=>x.id!==d.id))}
                  style={{fontSize:10,color:Tc.red,cursor:"pointer",fontWeight:700}}>×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pannello aggiunta segmenti */}
      <div style={{background:Tc.card,borderTop:"1px solid "+Tc.bdr,padding:"10px 12px 14px"}}>

        {/* Misure esterne telaio */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:3,
              textTransform:"uppercase",letterSpacing:0.5}}>Telaio L</div>
            <input inputMode="decimal" value={misuraL}
              onChange={e=>setMisuraL(e.target.value)} placeholder="mm"
              style={{width:"100%",padding:"8px 10px",borderRadius:8,boxSizing:"border-box",
                border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",
                color:"#0F172A",outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:3,
              textTransform:"uppercase",letterSpacing:0.5}}>Telaio H</div>
            <input inputMode="decimal" value={misuraH}
              onChange={e=>setMisuraH(e.target.value)} placeholder="mm"
              style={{width:"100%",padding:"8px 10px",borderRadius:8,boxSizing:"border-box",
                border:"1.5px solid "+Tc.bdr,fontSize:18,fontWeight:800,
                fontFamily:FMono,textAlign:"center",background:"#fff",
                color:"#0F172A",outline:"none"}}/>
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

        {/* Direzioni */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:8}}>
          {DIRS.map(({d,label,name})=>(
            <div key={d} onClick={()=>setPDir(d)}
              style={{padding:"9px 4px",borderRadius:10,textAlign:"center",cursor:"pointer",
                border:"2px solid "+(pDir===d?Tc.acc:Tc.bdr),
                background:pDir===d?Tc.acc:"#fff",
                boxShadow:pDir===d?"0 3px 0 "+Tc.acc+"88":"0 2px 0 rgba(0,0,0,0.06)",
                transition:"all 0.1s"}}>
              <div style={{fontSize:20,color:pDir===d?"#fff":"#94A3B8",lineHeight:1}}>{label}</div>
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
              style={{width:"100%",padding:"12px 44px 12px 16px",borderRadius:10,
                border:"1.5px solid "+Tc.bdr,fontSize:24,fontWeight:800,
                fontFamily:FMono,textAlign:"center",boxSizing:"border-box",
                background:"#fff",color:"#0F172A",outline:"none"}}/>
            <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              fontSize:12,color:"#94A3B8",fontWeight:600}}>mm</span>
          </div>
          <div onClick={addSeg}
            style={{width:56,borderRadius:10,
              background:selIdx!==null?Tc.acc:"#1A9E73",color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:selIdx!==null?12:28,fontWeight:800,cursor:"pointer",
              boxShadow:"0 4px 0 "+(selIdx!==null?"#A06006":"#157A56"),flexShrink:0}}>
            {selIdx!==null?"✓":"＋"}
          </div>
        </div>

        {segs.length>0&&(
          <button onClick={()=>{setSegs([]);setDivs([]);setZoneMat({"0_0":"eps"});
            setSelIdx(null);setSelZone("0_0");}}
            style={{marginTop:8,width:"100%",padding:"5px",borderRadius:8,
              border:"1px solid "+Tc.bdr,background:"white",
              color:Tc.sub,fontSize:10,cursor:"pointer",fontWeight:600}}>
            🗑 Azzera
          </button>
        )}
      </div>
    </div>
  );
}
