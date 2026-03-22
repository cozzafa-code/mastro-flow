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

function buildNodes(segs) {
  let cx=0, cy=0;
  const raw = [{x:0,y:0}];
  segs.forEach(s => {
    if(s.dir==="dx")  cx += s.mm;
    if(s.dir==="sx")  cx -= s.mm;
    if(s.dir==="su")  cy -= s.mm;
    if(s.dir==="giu") cy += s.mm;
    raw.push({x:cx, y:cy});
  });
  return raw;
}

function getBBox(pts) {
  if(!pts.length) return {minX:0,maxX:300,minY:0,maxY:100,w:300,h:100};
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  return {minX,maxX,minY,maxY,w:(maxX-minX)||1,h:(maxY-minY)||1};
}

function scaleNodes(pts, VW, VH, PAD) {
  const bb = getBBox(pts);
  const scale = Math.min((VW-PAD*2)/bb.w, (VH-PAD*2)/bb.h);
  const offX = PAD + ((VW-PAD*2) - bb.w*scale)/2 - bb.minX*scale;
  const offY = PAD + ((VH-PAD*2) - bb.h*scale)/2 - bb.minY*scale;
  return { scale, offX, offY,
    toSvg: (p) => ({sx: p.x*scale+offX, sy: p.y*scale+offY}),
    toWorld: (sx,sy) => ({x:(sx-offX)/scale, y:(sy-offY)/scale})
  };
}

export default function ConfiguratoreControtelaio({ value, onChange, T }) {
  const Tc = T || {bg:"#F2F1EC",card:"#FFFFFF",bdr:"#E5E3DC",text:"#1A1A1C",
    sub:"#8E8E93",acc:"#D08008",grn:"#1A9E73",red:"#DC4444",blue:"#3B7FE0"};

  const init = value||{};
  // pts = array di punti mm (modificabili dall'utente trascinando)
  const [pts,     setPts]     = useState(init.pts || buildNodes(init.segs || []));
  const [segs,    setSegs]    = useState(init.segs || []);
  const [divs,    setDivs]    = useState(init.divs || []);
  const [zoneMat, setZoneMat] = useState(init.zoneMat || {"0_0":"eps"});
  const [pDir,    setPDir]    = useState("dx");
  const [pMm,     setPMm]     = useState("");
  const [selIdx,  setSelIdx]  = useState(null);
  const [selZone, setSelZone] = useState("0_0");
  const [misuraL, setMisuraL] = useState(init.misuraL||"");
  const [misuraH, setMisuraH] = useState(init.misuraH||"");
  const [fullscreen, setFullscreen] = useState(false);

  // Zoom/pan stato (come viewBox)
  const [zoom,  setZoom]  = useState(1);
  const [panX,  setPanX]  = useState(0);
  const [panY,  setPanY]  = useState(0);

  // Drag vertici
  const [dragIdx, setDragIdx] = useState(null);
  const svgRef = useRef(null);
  const touchesRef = useRef([]);
  const lastPinchDist = useRef(null);

  const sviluppata = segs.reduce((a,s)=>a+s.mm,0);

  // Sync pts quando cambiano i segs
  useEffect(()=>{
    setPts(buildNodes(segs));
    setZoom(1); setPanX(0); setPanY(0);
  },[segs]);

  useEffect(()=>{ onChange?.({segs,pts,divs,zoneMat,misuraL,misuraH}); },
    [segs,pts,divs,zoneMat,misuraL,misuraH]);

  const VW = fullscreen ? (typeof window!=="undefined"?window.innerWidth:400) : 340;
  const PAD = fullscreen ? 60 : 40;

  // Altezza canvas proporzionale alla sagoma (min 140, max 300 inline / tutto in fullscreen)
  const bbox = getBBox(pts);
  const aspect = bbox.h > 0 ? bbox.h / bbox.w : 0.4;
  const VH = fullscreen
    ? (typeof window!=="undefined"?window.innerHeight-220:300)
    : Math.min(300, Math.max(140, VW * aspect + PAD * 2));

  // Coordinate SVG — scala uniforme (preserva proporzioni reali)
  const sc = scaleNodes(pts, VW, VH, PAD);

  // ViewBox con zoom/pan
  const vbW = VW/zoom, vbH = VH/zoom;
  const vbX = panX + (VW - vbW)/2;
  const vbY = panY + (VH - vbH)/2;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  // Converte punto SVG client → world mm
  const clientToWorld = useCallback((cx, cy) => {
    const svg = svgRef.current; if(!svg) return {x:0,y:0};
    const rect = svg.getBoundingClientRect();
    const svgX = vbX + (cx - rect.left) / rect.width * vbW;
    const svgY = vbY + (cy - rect.top) / rect.height * vbH;
    return sc.toWorld(svgX, svgY);
  }, [vbX, vbY, vbW, vbH, sc]);

  // ── Pointer handlers per dragging vertici ─────────────────
  const onPointerDown = useCallback((e, idx) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIdx(idx);
  }, []);

  const onPointerMove = useCallback((e) => {
    if(dragIdx===null) return;
    const w = clientToWorld(e.clientX, e.clientY);
    const snap = 5;
    const snapped = {x: Math.round(w.x/snap)*snap, y: Math.round(w.y/snap)*snap};
    setPts(prev => prev.map((p,i)=>i===dragIdx?snapped:p));
  }, [dragIdx, clientToWorld]);

  const onPointerUp = useCallback(() => { setDragIdx(null); }, []);

  // ── Touch handlers per zoom/pan ───────────────────────────
  const onTouchStart = useCallback((e) => {
    touchesRef.current = Array.from(e.touches);
    lastPinchDist.current = null;
  }, []);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const ts = Array.from(e.touches);
    if(ts.length===1 && dragIdx===null) {
      // Pan
      const prev = touchesRef.current[0];
      if(!prev) return;
      const dx = (ts[0].clientX - prev.clientX) / zoom * -1;
      const dy = (ts[0].clientY - prev.clientY) / zoom * -1;
      setPanX(x => x + dx);
      setPanY(y => y + dy);
    } else if(ts.length===2) {
      // Pinch zoom
      const dist = Math.hypot(
        ts[0].clientX-ts[1].clientX,
        ts[0].clientY-ts[1].clientY
      );
      if(lastPinchDist.current) {
        const ratio = dist / lastPinchDist.current;
        setZoom(z => Math.min(8, Math.max(0.3, z*ratio)));
      }
      lastPinchDist.current = dist;
    }
    touchesRef.current = ts;
  }, [dragIdx, zoom]);

  const onTouchEnd = useCallback((e) => {
    touchesRef.current = Array.from(e.touches);
    lastPinchDist.current = null;
  }, []);

  const resetView = () => { setZoom(1); setPanX(0); setPanY(0); };

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

  const mToSx = (mx) => mx*sc.scale+sc.offX;
  const mToSy = (my) => my*sc.scale+sc.offY;

  const vBreaks = [bbox.minX,...[...new Set(divs.filter(d=>d.axis==="v").map(d=>d.pos))].sort((a,b)=>a-b),bbox.maxX];
  const hBreaks = [bbox.minY,...[...new Set(divs.filter(d=>d.axis==="h").map(d=>d.pos))].sort((a,b)=>a-b),bbox.maxY];
  const pathPts = pts.map(p=>{const s=sc.toSvg(p);return s.sx.toFixed(1)+","+s.sy.toFixed(1);}).join(" ");

  const currentMat = CT_MAT.find(m=>m.id===(zoneMat[selZone||"0_0"]||"eps"))||CT_MAT[0];

  // ── Render ─────────────────────────────────────────────────
  const canvas = (
    <div style={{position:"relative",background:"#F0FDF9",
      flex:fullscreen?1:undefined,
      height:fullscreen?undefined:VH,
      overflow:"hidden",touchAction:"none"}}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}>

      {/* Pulsanti zoom */}
      <div style={{position:"absolute",top:8,right:8,zIndex:20,
        display:"flex",flexDirection:"column",gap:4}}>
        {[{l:"+",fn:()=>setZoom(z=>Math.min(8,z*1.35))},
          {l:"−",fn:()=>setZoom(z=>Math.max(0.3,z*0.74))},
          {l:"↺",fn:resetView}].map(btn=>(
          <div key={btn.l} onClick={btn.fn}
            style={{width:32,height:32,borderRadius:7,background:"rgba(255,255,255,0.92)",
              border:"1px solid "+Tc.bdr,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:btn.l==="↺"?15:20,fontWeight:800,
              cursor:"pointer",color:"#0F766E",boxShadow:"0 1px 4px rgba(0,0,0,0.12)"}}>
            {btn.l}
          </div>
        ))}
      </div>

      {!pts.length&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
          justifyContent:"center",flexDirection:"column",gap:6,color:"#94A3B8",
          pointerEvents:"none"}}>
          <div style={{fontSize:28}}>✏️</div>
          <div style={{fontSize:13,fontWeight:600}}>Disegna la sagoma</div>
          <div style={{fontSize:10}}>Direzione → mm → +</div>
        </div>
      )}

      <svg ref={svgRef} width="100%" height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{display:"block",touchAction:"none"}}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}>

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
          <pattern id="ctG" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E8EEF5" strokeWidth="0.5"/>
          </pattern>
          {pts.length>1&&(
            <clipPath id="sgClip">
              <polygon points={pathPts}/>
            </clipPath>
          )}
        </defs>

        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#ctG)"/>

        {/* Riempimenti zona */}
        {pts.length>1&&(
          <g clipPath="url(#sgClip)">
            {hBreaks.slice(0,-1).map((_,ri)=>
              vBreaks.slice(0,-1).map((_,ci)=>{
                const x1=vBreaks[ci],y1=hBreaks[ri],x2=vBreaks[ci+1],y2=hBreaks[ri+1];
                const key=`${ri}_${ci}`;
                const matId=zoneMat[key]||"eps";
                const mat=CT_MAT.find(m=>m.id===matId)||CT_MAT[0];
                const sx=mToSx(x1),sy=mToSy(y1);
                const sw=(x2-x1)*sc.scale,sh=(y2-y1)*sc.scale;
                const isSel=selZone===key;
                const fill=mat.id==="eps"?"url(#ctE)":mat.id==="legno"?"url(#ctW)":mat.color;
                return (
                  <g key={key} style={{cursor:"pointer"}}
                    onClick={e=>{e.stopPropagation();setSelZone(key);}}>
                    <rect x={sx} y={sy} width={sw} height={sh} fill={fill}/>
                    {isSel&&<rect x={sx+1} y={sy+1} width={sw-2} height={sh-2}
                      fill="none" stroke="#D08008" strokeWidth={2} strokeDasharray="5,3"/>}
                    {sw>40&&sh>20&&mat.id!=="sede"&&(
                      <text x={sx+sw/2} y={sy+sh/2+4} textAnchor="middle"
                        fontSize={Math.min(12,sw*0.14,sh*0.38)} fontWeight="800"
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

        {/* Bordo sagoma */}
        {pts.length>1&&(
          <polygon points={pathPts} fill="none" stroke="#1A3A6A"
            strokeWidth={fullscreen?2.5:2} strokeLinejoin="round"/>
        )}

        {/* Divisori */}
        {divs.map(d=>{
          if(d.axis==="v") return <line key={d.id}
            x1={mToSx(d.pos)} y1={mToSy(bbox.minY)}
            x2={mToSx(d.pos)} y2={mToSy(bbox.maxY)}
            stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4,3"/>;
          return <line key={d.id}
            x1={mToSx(bbox.minX)} y1={mToSy(d.pos)}
            x2={mToSx(bbox.maxX)} y2={mToSy(d.pos)}
            stroke="#0D9488" strokeWidth={1.5} strokeDasharray="4,3"/>;
        })}

        {/* Quote segmenti */}
        {pts.slice(1).map((p,i)=>{
          const prev=sc.toSvg(pts[i]), cur=sc.toSvg(p);
          const seg=segs[i]; if(!seg) return null;
          const mx=(prev.sx+cur.sx)/2, my=(prev.sy+cur.sy)/2;
          const isH=Math.abs(cur.sy-prev.sy)<Math.abs(cur.sx-prev.sx);
          const qx=mx+(isH?0:-22), qy=my+(isH?-14:0);
          return (
            <g key={i}>
              <rect x={qx-16} y={qy-8} width={32} height={12} rx={3}
                fill="rgba(255,255,255,0.92)"/>
              <text x={qx} y={qy+1} textAnchor="middle"
                fontSize={fullscreen?12:10} fill="#0F172A"
                fontWeight="800" fontFamily={FMono}>{seg.mm}</text>
            </g>
          );
        })}

        {/* Vertici trascinabili */}
        {pts.map((p,i)=>{
          const s=sc.toSvg(p);
          const r = fullscreen?14:10;
          return (
            <g key={i} style={{cursor:"grab"}}>
              <circle cx={s.sx} cy={s.sy} r={r+4} fill="transparent"
                onPointerDown={e=>onPointerDown(e,i)}/>
              <circle cx={s.sx} cy={s.sy} r={r}
                fill={i===0?"#1A9E73":dragIdx===i?"#D08008":"#1A3A6A"}
                stroke="#fff" strokeWidth={2}/>
              {i===0&&(
                <text x={s.sx} y={s.sy-r-4} textAnchor="middle"
                  fontSize={9} fill="#1A9E73" fontWeight="800">S</text>
              )}
              {dragIdx===i&&(
                <text x={s.sx} y={s.sy-r-4} textAnchor="middle"
                  fontSize={8} fill="#D08008" fontWeight="800">
                  {Math.round(p.x)},{Math.round(p.y)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );

  const toolbar = (
    <div style={{background:Tc.card,borderTop:"1px solid "+Tc.bdr,padding:"8px 12px 12px"}}>

      {/* Misure telaio */}
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:2,
            textTransform:"uppercase"}}>Telaio L</div>
          <input inputMode="decimal" value={misuraL}
            onChange={e=>setMisuraL(e.target.value)} placeholder="mm"
            style={{width:"100%",padding:"7px 8px",borderRadius:7,boxSizing:"border-box",
              border:"1.5px solid "+Tc.bdr,fontSize:16,fontWeight:800,
              fontFamily:FMono,textAlign:"center",background:"#fff",outline:"none"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:9,fontWeight:800,color:Tc.sub,marginBottom:2,
            textTransform:"uppercase"}}>Telaio H</div>
          <input inputMode="decimal" value={misuraH}
            onChange={e=>setMisuraH(e.target.value)} placeholder="mm"
            style={{width:"100%",padding:"7px 8px",borderRadius:7,boxSizing:"border-box",
              border:"1.5px solid "+Tc.bdr,fontSize:16,fontWeight:800,
              fontFamily:FMono,textAlign:"center",background:"#fff",outline:"none"}}/>
        </div>
      </div>

      {selIdx!==null&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"5px 10px",borderRadius:8,background:"#FFF8EC",
          border:"1.5px solid "+Tc.acc,marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:700,color:Tc.acc}}>✏️ Seg. {selIdx+1}</span>
          <span onClick={()=>{setSelIdx(null);setPMm("");}}
            style={{fontSize:16,color:Tc.acc,cursor:"pointer",fontWeight:800}}>✕</span>
        </div>
      )}

      {/* Direzioni */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:7}}>
        {DIRS.map(({d,label,name})=>(
          <div key={d} onClick={()=>setPDir(d)}
            style={{padding:"8px 4px",borderRadius:9,textAlign:"center",cursor:"pointer",
              border:"2px solid "+(pDir===d?Tc.acc:Tc.bdr),
              background:pDir===d?Tc.acc:"#fff",
              boxShadow:pDir===d?"0 3px 0 "+Tc.acc+"88":"0 2px 0 rgba(0,0,0,0.05)",
              transition:"all 0.1s"}}>
            <div style={{fontSize:20,color:pDir===d?"#fff":"#94A3B8",lineHeight:1}}>{label}</div>
            <div style={{fontSize:8,fontWeight:600,
              color:pDir===d?"rgba(255,255,255,0.8)":"#CBD5E1",marginTop:2}}>{name}</div>
          </div>
        ))}
      </div>

      {/* mm + */}
      <div style={{display:"flex",gap:7}}>
        <div style={{flex:1,position:"relative"}}>
          <input inputMode="decimal" value={pMm}
            onChange={e=>setPMm(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")addSeg();}}
            placeholder="mm"
            style={{width:"100%",padding:"11px 40px 11px 14px",borderRadius:9,
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
  );

  const matPanel = segs.length>0&&(
    <div style={{padding:"7px 10px",borderTop:"2px solid "+Tc.bdr,background:Tc.bg}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
        <div style={{fontSize:9,fontWeight:800,color:Tc.sub,textTransform:"uppercase"}}>
          Materiale — <span style={{color:currentMat.stroke}}>{currentMat.label}</span>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          <button onClick={()=>{
            setDivs(d=>[...d,{axis:"v",pos:Math.round(bbox.w/2)+bbox.minX,id:Date.now()}]);
          }} style={{padding:"2px 6px",borderRadius:4,background:"#8B5CF612",
            border:"1px solid #8B5CF640",fontSize:9,fontWeight:700,color:"#8B5CF6",cursor:"pointer"}}>
            +│
          </button>
          <button onClick={()=>{
            setDivs(d=>[...d,{axis:"h",pos:Math.round(bbox.h/2)+bbox.minY,id:Date.now()}]);
          }} style={{padding:"2px 6px",borderRadius:4,background:"#0D948812",
            border:"1px solid #0D948840",fontSize:9,fontWeight:700,color:"#0D9488",cursor:"pointer"}}>
            +─
          </button>
          {divs.map(d=>(
            <div key={d.id} style={{display:"flex",alignItems:"center",gap:1,
              padding:"1px 4px",borderRadius:4,
              background:(d.axis==="v"?"#8B5CF6":"#0D9488")+"15"}}>
              <input type="number" value={d.pos}
                onChange={e=>setDivs(divs.map(x=>x.id===d.id?{...x,pos:parseInt(e.target.value)||0}:x))}
                style={{width:34,border:"none",borderRadius:2,fontSize:9,fontWeight:700,
                  fontFamily:FMono,textAlign:"center",background:"transparent",
                  color:d.axis==="v"?"#8B5CF6":"#0D9488"}}/>
              <span onClick={()=>setDivs(divs.filter(x=>x.id!==d.id))}
                style={{fontSize:10,color:Tc.red,cursor:"pointer",fontWeight:700}}>×</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
        {CT_MAT.map(mat=>{
          const isAct=(zoneMat[selZone||"0_0"]||"eps")===mat.id;
          return (
            <div key={mat.id}
              onClick={()=>setZoneMat({...zoneMat,[selZone||"0_0"]:mat.id})}
              style={{padding:"5px 3px",borderRadius:7,textAlign:"center",cursor:"pointer",
                border:"2px solid "+(isAct?mat.stroke:Tc.bdr),
                background:isAct?mat.color:"#fff",
                boxShadow:isAct?"0 2px 5px "+mat.stroke+"30":"none",
                transition:"all 0.1s"}}>
              <svg width={34} height={20} style={{display:"block",margin:"0 auto 2px",
                borderRadius:3,overflow:"hidden"}}>
                <defs>
                  <pattern id={"pe"+mat.id} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                    <rect width="6" height="6" fill="#C8DEF2"/>
                    <circle cx="3" cy="3" r="1.8" fill="none" stroke="#1A3A6A" strokeWidth="0.5"/>
                  </pattern>
                  <pattern id={"pw"+mat.id} x="0" y="0" width="6" height="4" patternUnits="userSpaceOnUse">
                    <rect width="6" height="4" fill="#F5A623"/>
                    <line x1="0" y1="2" x2="6" y2="2" stroke="#C07010" strokeWidth="0.6"/>
                  </pattern>
                </defs>
                <rect width={34} height={20} rx={2}
                  fill={mat.id==="eps"?"url(#pe"+mat.id+")":mat.id==="legno"?"url(#pw"+mat.id+")":mat.color}
                  stroke={mat.stroke} strokeWidth={1}
                  strokeDasharray={mat.dash?"4,2":undefined}/>
              </svg>
              <div style={{fontSize:8,fontWeight:isAct?800:500,color:isAct?mat.stroke:Tc.sub}}>
                {mat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Chips segmenti
  const chips = segs.length>0&&(
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
      {segs.length>0&&<button onClick={()=>{setSegs([]);setPts([]);setDivs([]);
        setZoneMat({"0_0":"eps"});setSelIdx(null);setSelZone("0_0");resetView();}}
        style={{marginLeft:"auto",padding:"2px 6px",borderRadius:5,border:"1px solid "+Tc.bdr,
          background:"white",color:Tc.sub,fontSize:9,cursor:"pointer"}}>🗑</button>}
    </div>
  );

  // FULLSCREEN
  if(fullscreen) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:3000,background:"#fff",
        display:"flex",flexDirection:"column"}}>
        {/* Header fullscreen */}
        <div style={{background:"#0F766E",padding:"10px 14px",display:"flex",
          alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{color:"#fff",fontSize:14,fontWeight:800}}>Controtelaio</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:10}}>
              Trascina i vertici · Pizzica per zoom
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {/* Presets */}
            <div style={{display:"flex",gap:4}}>
              {CT_PRESETS.map(p=>(
                <button key={p.n} onClick={()=>{
                  setSegs(p.segs);setDivs([]);setZoneMat({"0_0":"eps"});
                  setSelIdx(null);setSelZone("0_0");resetView();
                }} style={{padding:"3px 8px",borderRadius:5,border:"1px solid rgba(255,255,255,0.3)",
                  background:"rgba(255,255,255,0.15)",color:"#fff",
                  fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  {p.n}
                </button>
              ))}
            </div>
            <div onClick={()=>setFullscreen(false)}
              style={{color:"rgba(255,255,255,0.8)",fontSize:24,cursor:"pointer",padding:"0 4px"}}>×</div>
          </div>
        </div>
        {canvas}
        {chips}
        {matPanel}
        {toolbar}
      </div>
    );
  }

  // INLINE (compatto)
  return (
    <div style={{borderRadius:8,overflow:"hidden",border:"1px solid "+Tc.bdr,background:Tc.card}}>
      {/* Presets */}
      <div style={{display:"flex",gap:4,padding:"5px 8px",overflowX:"auto",
        borderBottom:"1px solid "+Tc.bdr,background:Tc.bg}}>
        {CT_PRESETS.map(p=>(
          <button key={p.n} onClick={()=>{
            setSegs(p.segs);setDivs([]);setZoneMat({"0_0":"eps"});
            setSelIdx(null);setSelZone("0_0");resetView();
          }} style={{padding:"4px 10px",borderRadius:6,border:"1.5px solid "+Tc.bdr,
            background:Tc.card,fontSize:10,fontWeight:700,cursor:"pointer",
            color:Tc.text,whiteSpace:"nowrap"}}>
            {p.n}
          </button>
        ))}
        {/* Apri fullscreen */}
        <button onClick={()=>setFullscreen(true)}
          style={{marginLeft:"auto",padding:"4px 8px",borderRadius:6,
            border:"1.5px solid "+Tc.acc,background:Tc.acc+"15",
            fontSize:10,fontWeight:700,cursor:"pointer",color:Tc.acc,whiteSpace:"nowrap"}}>
          ⛶ Apri
        </button>
      </div>
      {canvas}
      {chips}
      {matPanel}
      {toolbar}
    </div>
  );
}
