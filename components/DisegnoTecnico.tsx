"use client";
// @ts-nocheck
// MASTRO — DisegnoTecnico v7
// Base: Verdel v5 completo + integrazione MASTRO (props onUpdate/sistemiDB/vanoDisegno)
import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const C = {
  bg:"#FFFFFF", telaio:"#000000", telaio_fill:"#E8E8E8",
  anta:"#000000", anta_fill:"#F4F4F4", riporto:"#000000", riporto_fill:"#D0D0D0",
  fermavetro:"#333333", quota:"#0055CC", tratt:"#444444",
  vetroFill:"#C8DFF0", vetroTratt:"#90B8D8", sel:"#0077FF", drag:"#009944", maniglia:"#555555",
};
const LW = { telaio:1.2, anta:1.0, fv:0.7, quota:0.6, tratt:0.7, riporto:0.8 };

const DEFAULT_PROFILES = {
  tel_top:"14XX07+R", tel_bottom:"14XX07+R", tel_left:"14XX07+R", tel_right:"14XX07+R",
  ant_top:"14XX22+R", ant_bottom:"14XX22+R", ant_left:"14XX22+R", ant_right:"14XX22+R",
  riporto:"RP-16", fermavetro:"FV-18", vetro:"V4T-16Ar-4TSG",
};

const TIPOLOGIE = [
  {id:"fisso",label:"Fisso",nAnte:0},{id:"1anta_ar",label:"1A A-R",nAnte:1},
  {id:"2ante_ar",label:"2A A-R",nAnte:2},{id:"1anta_ab",label:"1A A-B",nAnte:1},
  {id:"wasistas",label:"Wasistas",nAnte:1},{id:"scorrevole_2",label:"Scorr.2A",nAnte:2},
];

function useProfiliDB(sistema) {
  const [profileList, setProfileList] = useState(["14XX07+R","14XX22+R","14XX05+R","140X07+R","140X22+R","040x02","040x22","FV-18","FV-22","RP-12","RP-16","V4T-16Ar-4TSG","V6T-20Ar-6TSG","V4-12A-4"]);
  const [bautiefe, setBautiefe] = useState(70);
  useEffect(() => {
    if (!sistema) return;
    supabase.from("profili_sezioni").select("codice,larghezza_mm,tipo").eq("sistema",sistema).eq("attivo",true)
      .then(({data}) => {
        if (!data?.length) return;
        const c = data.map(p=>p.codice).filter(Boolean);
        if (c.length) setProfileList(c);
        const t = data.find(p=>p.tipo==="telaio");
        if (t?.larghezza_mm) setBautiefe(t.larghezza_mm);
      });
  }, [sistema]);
  return { profileList, bautiefe };
}

function cornerLines(ox,oy,W,H,sp,stroke,sw) {
  return [
    <line key="tl" x1={ox} y1={oy+sp} x2={ox+sp} y2={oy} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>,
    <line key="tr" x1={ox+W-sp} y1={oy} x2={ox+W} y2={oy+sp} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>,
    <line key="bl" x1={ox} y1={oy+H-sp} x2={ox+sp} y2={oy+H} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>,
    <line key="br" x1={ox+W-sp} y1={oy+H} x2={ox+W} y2={oy+H-sp} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>,
  ];
}

function cornerLinesAnta(ox,oy,W,H,sp,ai,nCols,stroke,sw) {
  const lines=[];
  const tl=nCols===1||ai===0, tr=nCols===1||ai===nCols-1;
  const bl=nCols===1||ai===0, br=nCols===1||ai===nCols-1;
  if(tl)lines.push(<line key="tl" x1={ox} y1={oy+sp} x2={ox+sp} y2={oy} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>);
  if(tr)lines.push(<line key="tr" x1={ox+W-sp} y1={oy} x2={ox+W} y2={oy+sp} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>);
  if(bl)lines.push(<line key="bl" x1={ox} y1={oy+H-sp} x2={ox+sp} y2={oy+H} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>);
  if(br)lines.push(<line key="br" x1={ox+W-sp} y1={oy+H} x2={ox+W} y2={oy+H-sp} stroke={stroke} strokeWidth={sw} pointerEvents="none"/>);
  return lines;
}

function VetroHatch({x,y,w,h,id}) {
  if(w<=0||h<=0)return null;
  const step=12,lines=[];
  for(let i=-Math.ceil(h/step);i<=Math.ceil(w/step)+2;i++)
    lines.push(<line key={i} x1={i*step} y1={h} x2={i*step+h} y2={0} stroke={C.vetroTratt} strokeWidth={0.6} opacity={0.5}/>);
  return(<g><defs><clipPath id={id}><rect x={0} y={0} width={w} height={h}/></clipPath></defs><g transform={`translate(${x},${y})`} clipPath={`url(#${id})`}><rect x={0} y={0} width={w} height={h} fill={C.vetroFill}/>{lines}</g></g>);
}

function Tratteggio({tipo,ax,ay,aw,ah,isSx,nAnte,spA}) {
  const isAR=tipo.includes("ar"),isAB=tipo.includes("ab"),isWas=tipo==="wasistas",isSc=tipo==="scorrevole_2";
  const pivX=nAnte>=2?(isSx?ax:ax+aw):ax;
  const oppX=nAnte>=2?(isSx?ax+aw:ax):ax+aw;
  const g=(ch)=><g stroke={C.tratt} strokeWidth={LW.tratt} strokeDasharray="5,3" opacity={0.7} fill="none">{ch}</g>;
  if(isSc)return(<g fill="none"><line x1={ax+(isSx?aw*0.7:aw*0.3)} y1={ay+ah/2} x2={ax+(isSx?aw*0.2:aw*0.8)} y2={ay+ah/2} stroke={C.quota} strokeWidth={1.2}/><polygon points={`${ax+(isSx?aw*0.2:aw*0.8)},${ay+ah/2-4} ${ax+(isSx?aw*0.14:aw*0.86)},${ay+ah/2} ${ax+(isSx?aw*0.2:aw*0.8)},${ay+ah/2+4}`} fill={C.quota} stroke="none"/></g>);
  if(isAR)return g(<><line x1={pivX} y1={ay} x2={pivX} y2={ay+ah} strokeDasharray="none" strokeWidth={0.7} opacity={0.4}/><line x1={pivX} y1={ay} x2={oppX} y2={ay+ah/2}/><line x1={pivX} y1={ay+ah} x2={oppX} y2={ay+ah/2}/><path d={`M${ax} ${ay+ah} A${aw/2} ${Math.min(aw*0.36,48)} 0 0 ${isSx?0:1} ${ax+aw} ${ay+ah}`}/></>);
  if(isAB)return g(<><line x1={ax} y1={ay+ah} x2={ax+aw} y2={ay+ah} strokeDasharray="none" strokeWidth={0.7} opacity={0.4}/><line x1={ax} y1={ay+ah} x2={ax+aw/2} y2={ay}/><line x1={ax+aw} y1={ay+ah} x2={ax+aw/2} y2={ay}/><path d={`M${pivX} ${ay} A${ah*0.38} ${ah*0.38} 0 0 ${isSx?1:0} ${pivX} ${ay+ah}`}/></>);
  if(isWas)return g(<><line x1={ax+spA} y1={ay+ah-spA} x2={ax+aw-spA} y2={ay+ah-spA} strokeDasharray="none" strokeWidth={0.7} opacity={0.4}/><line x1={ax} y1={ay+ah-spA} x2={ax+aw/2} y2={ay}/><line x1={ax+aw} y1={ay+ah-spA} x2={ax+aw/2} y2={ay}/><path d={`M${ax} ${ay+ah-spA} A${aw*0.52} ${Math.min(aw*0.38,46)} 0 0 1 ${ax+aw} ${ay+ah-spA}`}/></>);
  return null;
}

function ManigliaDK({mx,my,verso="dx"}) {
  const rw=6,rh=44,rr=3,gw=10,gh=28,gr=5,llen=24,lh=7,lr=3.5;
  const lx=verso==="dx"?mx+gw/2:mx-gw/2-llen;
  return(<g>
    <rect x={mx-rw/2} y={my-rh/2} width={rw} height={rh} rx={rr} fill="#CCCCCC" stroke="#333333" strokeWidth={0.8}/>
    <circle cx={mx} cy={my-rh/2+6} r={1.5} fill="#555" stroke="none"/>
    <circle cx={mx} cy={my+rh/2-6} r={1.5} fill="#555" stroke="none"/>
    <rect x={mx-gw/2} y={my-gh/2} width={gw} height={gh} rx={gr} fill="#AAAAAA" stroke="#333333" strokeWidth={1}/>
    <rect x={mx-gw/2+2} y={my-gh/2+4} width={gw*0.3} height={gh-8} rx={2} fill="#FFFFFF" opacity={0.35}/>
    <line x1={mx-gw/2+2} y1={my} x2={mx+gw/2-2} y2={my} stroke="#666" strokeWidth={0.6} opacity={0.7}/>
    <rect x={lx} y={my-lh/2} width={llen} height={lh} rx={lr} fill="#AAAAAA" stroke="#333333" strokeWidth={0.8}/>
    <rect x={mx-2.5} y={my-2.5} width={5} height={5} rx={0.8} fill="#666" stroke="#333" strokeWidth={0.5}/>
  </g>);
}

const TBtn=({active,onClick,label})=>(
  <div onClick={onClick} style={{padding:"3px 8px",borderRadius:3,fontSize:10,cursor:"pointer",fontFamily:"monospace",userSelect:"none",background:active?"#1A3A6A":"#F0F0F0",color:active?"#FFFFFF":"#333",border:`1px solid ${active?"#2255AA":"#CCCCCC"}`}}>{label}</div>
);

export default function DisegnoTecnico({
  vanoNome="Vano", vanoDisegno, realW, realH,
  onUpdate, onUpdateField, onClose, T, sistemiDB=[],
}) {
  const svgRef=useRef(null), dragRef=useRef(null);
  const [L,setL]=useState(parseInt(String(realW))||1200);
  const [H,setH]=useState(parseInt(String(realH))||2100);
  const [tipo,setTipo]=useState(vanoDisegno?.tipologia||"2ante_ar");
  const [nMontanti,setNMontanti]=useState(vanoDisegno?.nMontanti||0);
  const [nTraversi,setNTraversi]=useState(vanoDisegno?.nTraversi||0);
  const [showQuote,setShowQuote]=useState(true);
  const [showSez,setShowSez]=useState(true);
  const [profiles,setProfiles]=useState({...DEFAULT_PROFILES,...(vanoDisegno?.profiles||{})});
  const [selected,setSelected]=useState(null);
  const [hoverBar,setHoverBar]=useState(null);
  const [dragging,setDragging]=useState(false);
  const [sistema,setSistema]=useState(vanoDisegno?.sistema||"");

  const {profileList,bautiefe}=useProfiliDB(sistema);

  useEffect(()=>{setL(parseInt(String(realW))||1200);},[realW]);
  useEffect(()=>{setH(parseInt(String(realH))||2100);},[realH]);

  const save=useCallback((patch={})=>{
    onUpdate?.({...vanoDisegno,tipologia:tipo,nMontanti,nTraversi,sistema,profiles,...patch});
  },[vanoDisegno,tipo,nMontanti,nTraversi,sistema,profiles,onUpdate]);

  const PAD=20,QL=60,QH=46;
  const svgW=Math.max(500,Math.min(860,L/2.4+180));
  const svgH=Math.max(440,Math.min(780,H/3.1+190));
  const fw=svgW-PAD*2-QL, fh=svgH-PAD*2-QH-40;
  const sc=Math.min(fw/L,fh/H);
  const SW=L*sc, SH=H*sc;
  const cx=PAD+QL+(fw-SW)/2, cy=PAD+QH+(fh-SH)/2;
  const spT=Math.max(14,bautiefe*0.9*sc);
  const spA=Math.max(12,(bautiefe-8)*sc);
  const fgW=Math.max(2.5,5*sc);
  const spR=Math.max(5,18*sc);
  const iX=cx+spT, iY=cy+spT, iW=SW-spT*2, iH=SH-spT*2;
  const tObj=TIPOLOGIE.find(t=>t.id===tipo);
  const nAnte=tObj?.nAnte??1;
  const monPx=nAnte===2&&nMontanti===0?[iW/2]:Array.from({length:nMontanti},(_,i)=>iW*(i+1)/(nMontanti+1));
  const travPx=Array.from({length:nTraversi},(_,i)=>iH*(i+1)/(nTraversi+1));
  const cols=monPx.length>0?(()=>{const r=[],pts=[0,...monPx,iW];for(let i=0;i<pts.length-1;i++)r.push(pts[i+1]-pts[i]);return r;})():[iW];

  const scRef=useRef(sc);
  useLayoutEffect(()=>{scRef.current=sc;},[sc]);

  const getSvgPt=(e)=>{const r=svgRef.current?.getBoundingClientRect();if(!r)return{x:0,y:0};return{x:e.clientX-r.left,y:e.clientY-r.top};};

  const startDrag=(side,e)=>{
    e.stopPropagation();e.currentTarget?.setPointerCapture?.(e.pointerId);
    const pt=getSvgPt(e);
    dragRef.current={side,x0:pt.x,y0:pt.y,L0:L,H0:H,sc:scRef.current};
    setDragging(true);setSelected(`tel_${side}`);
  };

  const handleMove=useCallback((e)=>{
    if(!dragRef.current)return;
    const{side,x0,y0,L0,H0,sc:sc0}=dragRef.current;
    const pt=getSvgPt(e);
    if(side==="right"){const n=Math.max(300,Math.round(L0+(pt.x-x0)/sc0));setL(n);onUpdateField?.("larghezza",n);}
    if(side==="left"){const n=Math.max(300,Math.round(L0-(pt.x-x0)/sc0));setL(n);onUpdateField?.("larghezza",n);}
    if(side==="bottom"){const n=Math.max(300,Math.round(H0+(pt.y-y0)/sc0));setH(n);onUpdateField?.("altezza",n);}
    if(side==="top"){const n=Math.max(300,Math.round(H0-(pt.y-y0)/sc0));setH(n);onUpdateField?.("altezza",n);}
  },[onUpdateField]);

  const handleUp=useCallback(()=>{dragRef.current=null;setDragging(false);save();},[save]);
  const sideCursor=(s)=>s==="left"||s==="right"?"ew-resize":"ns-resize";
  const dragAreas=[
    {side:"top",x:cx,y:cy,w:SW,h:spT},{side:"bottom",x:cx,y:cy+SH-spT,w:SW,h:spT},
    {side:"left",x:cx,y:cy,w:spT,h:SH},{side:"right",x:cx+SW-spT,y:cy,w:spT,h:SH},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#F0F0F0",fontFamily:"monospace",userSelect:"none"}}
      onPointerMove={handleMove} onPointerUp={handleUp}>

      {/* Toolbar */}
      <div style={{background:"#FFFFFF",borderBottom:"2px solid #CCCCCC",padding:"6px 10px",display:"flex",alignItems:"center",gap:4,flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"#003399",fontWeight:"bold",marginRight:4}}>{vanoNome}</span>
        <span style={{fontSize:10,color:"#0055AA",minWidth:100,fontWeight:"bold"}}>{L} × {H} mm</span>
        <div style={{width:1,height:16,background:"#DDD"}}/>
        {TIPOLOGIE.map(t=><TBtn key={t.id} active={tipo===t.id} onClick={()=>{setTipo(t.id);save({tipologia:t.id});}} label={t.label}/>)}
        <div style={{width:1,height:16,background:"#DDD"}}/>
        <span style={{fontSize:9,color:"#888"}}>Mont.</span>
        {[0,1,2].map(n=><TBtn key={n} active={nMontanti===n} onClick={()=>{setNMontanti(n);save({nMontanti:n});}} label={String(n)}/>)}
        <span style={{fontSize:9,color:"#888"}}>Trav.</span>
        {[0,1,2].map(n=><TBtn key={n} active={nTraversi===n} onClick={()=>{setNTraversi(n);save({nTraversi:n});}} label={String(n)}/>)}
        <div style={{width:1,height:16,background:"#DDD"}}/>
        <TBtn active={showQuote} onClick={()=>setShowQuote(q=>!q)} label="Quote"/>
        <TBtn active={showSez} onClick={()=>setShowSez(s=>!s)} label="Sez."/>
        {sistemiDB.length>0&&(
          <select value={sistema} onChange={e=>{setSistema(e.target.value);save({sistema:e.target.value});}}
            style={{padding:"2px 6px",background:"#F8F8F8",border:"1px solid #CCC",borderRadius:3,color:"#003399",fontSize:10,fontFamily:"monospace"}}>
            <option value="">— Sistema —</option>
            {sistemiDB.map(s=><option key={s.id} value={s.marca+" "+s.sistema}>{s.marca} {s.sistema}</option>)}
          </select>
        )}
        {onClose&&<div onClick={onClose} style={{marginLeft:"auto",padding:"3px 9px",borderRadius:3,background:"#FFF0F0",border:"1px solid #FFAAAA",color:"#CC2222",fontSize:10,cursor:"pointer"}}>✕</div>}
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Canvas */}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",overflow:"auto",padding:12,background:"#E8E8E8"}}>
          <svg ref={svgRef} width={svgW} height={svgH}
            style={{display:"block",background:C.bg,cursor:dragging?"grabbing":"default",border:"1px solid #AAAAAA",boxShadow:"2px 2px 8px rgba(0,0,0,0.15)"}}
            onClick={()=>setSelected(null)}>

            {/* Quote */}
            {showQuote&&(<g fill={C.quota} stroke={C.quota} strokeWidth={LW.quota}>
              <line x1={cx} y1={cy-6} x2={cx} y2={cy-28}/><line x1={cx+SW} y1={cy-6} x2={cx+SW} y2={cy-28}/>
              <line x1={cx} y1={cy-24} x2={cx+SW} y2={cy-24}/>
              <polygon points={`${cx},${cy-24} ${cx+6},${cy-26.5} ${cx+6},${cy-21.5}`}/>
              <polygon points={`${cx+SW},${cy-24} ${cx+SW-6},${cy-26.5} ${cx+SW-6},${cy-21.5}`}/>
              <text x={cx+SW/2} y={cy-28} textAnchor="middle" fontSize={13} fontWeight="bold" stroke="none">{L}</text>
              <line x1={cx-6} y1={cy} x2={cx-38} y2={cy}/><line x1={cx-6} y1={cy+SH} x2={cx-38} y2={cy+SH}/>
              <line x1={cx-34} y1={cy} x2={cx-34} y2={cy+SH}/>
              <polygon points={`${cx-34},${cy} ${cx-31.5},${cy+6} ${cx-36.5},${cy+6}`}/>
              <polygon points={`${cx-34},${cy+SH} ${cx-31.5},${cy+SH-6} ${cx-36.5},${cy+SH-6}`}/>
              <text x={cx-40} y={cy+SH/2} textAnchor="middle" fontSize={13} fontWeight="bold" stroke="none" transform={`rotate(-90,${cx-40},${cy+SH/2})`}>{H}</text>
            </g>)}

            <rect x={cx} y={cy} width={SW} height={SH} fill="#F8F8F8"/>

            {/* Telaio 4 barre */}
            {[
              {pid:"tel_top",rx:cx,ry:cy,rw:SW,rh:spT},{pid:"tel_bottom",rx:cx,ry:cy+SH-spT,rw:SW,rh:spT},
              {pid:"tel_left",rx:cx,ry:cy,rw:spT,rh:SH},{pid:"tel_right",rx:cx+SW-spT,ry:cy,rw:spT,rh:SH},
            ].map(({pid,rx,ry,rw,rh})=>{
              const sel=selected===pid;
              return(<rect key={pid} x={rx} y={ry} width={rw} height={rh} fill={sel?"#CCE0FF":C.telaio_fill} stroke={sel?C.sel:C.telaio} strokeWidth={sel?1.8:LW.telaio} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelected(sel?null:pid);}}/>);
            })}
            {cornerLines(cx,cy,SW,SH,spT,C.telaio,LW.telaio+0.3)}
            {[
              {pid:"tel_left",x:cx+spT/2,y:cy+SH/2,rot:true},{pid:"tel_right",x:cx+SW-spT/2,y:cy+SH/2,rot:true},
              {pid:"tel_top",x:cx+SW/2,y:cy+spT/2,rot:false},{pid:"tel_bottom",x:cx+SW/2,y:cy+SH-spT/2,rot:false},
            ].map(({pid,x,y,rot})=>(
              <text key={pid} x={x} y={y+2} textAnchor="middle" fontSize={Math.max(5,Math.min(8,spT*0.38))} fill={selected===pid?"#0044AA":"#666"} fontFamily="monospace" transform={rot?`rotate(-90,${x},${y})`:undefined} pointerEvents="none">{profiles[pid]}</text>
            ))}

            {/* Montanti */}
            {monPx.map((mx2,mi)=>{const absX=iX+mx2-spT/2;return(<g key={mi} pointerEvents="none"><rect x={absX} y={cy} width={spT} height={SH} fill={C.telaio_fill} stroke={C.telaio} strokeWidth={LW.telaio}/><text x={absX+spT/2} y={cy+SH/2} textAnchor="middle" fontSize={Math.max(5,spT*0.35)} fill="#666" fontFamily="monospace" transform={`rotate(-90,${absX+spT/2},${cy+SH/2})`}>{profiles.tel_left}</text></g>);})}

            {/* Traversi */}
            {travPx.map((ty,ti)=>(<g key={ti} pointerEvents="none"><rect x={cx} y={iY+ty-spT/2} width={SW} height={spT} fill={C.telaio_fill} stroke={C.telaio} strokeWidth={LW.telaio}/><text x={cx+SW/2} y={iY+ty+3} textAnchor="middle" fontSize={Math.max(5,spT*0.35)} fill="#666" fontFamily="monospace">{profiles.tel_top}</text></g>))}

            {/* Ante o fisso */}
            {nAnte===0?(()=>{
              const vx=iX+fgW,vy=iY+fgW,vw=iW-fgW*2,vh=iH-fgW*2;
              return(<g>
                {[{rx:iX,ry:iY,rw:fgW,rh:iH},{rx:iX+iW-fgW,ry:iY,rw:fgW,rh:iH},{rx:iX,ry:iY,rw:iW,rh:fgW},{rx:iX,ry:iY+iH-fgW,rw:iW,rh:fgW}].map((p,pi)=>(
                  <rect key={pi} x={p.rx} y={p.ry} width={p.rw} height={p.rh} fill="#DDDDDD" stroke={selected==="fermavetro"?C.sel:C.fermavetro} strokeWidth={LW.fv} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelected(selected==="fermavetro"?null:"fermavetro");}}/>
                ))}
                <VetroHatch x={vx} y={vy} w={vw} h={vh} id="v-fisso"/>
                <text x={iX+iW/2} y={iY+iH/2+4} textAnchor="middle" fontSize={Math.max(7,iW/14)} fill="#336688" fontFamily="monospace" opacity={0.8} pointerEvents="none">{profiles.vetro}</text>
                <text x={iX+iW/2} y={iY+16} textAnchor="middle" fontSize={10} fill={C.quota} fontFamily="monospace" pointerEvents="none">FISSO</text>
              </g>);
            })():(()=>{
              let xOff=0;
              const showRiporto=nAnte===2&&!tipo.includes("scorr")&&cols.length===2;
              const riportoCenterX=iX+cols[0];
              const anteElements=cols.map((cw,ai)=>{
                const isSx=ai===0,ax=iX+xOff,ay=iY,aw=cw,ah=iH;
                xOff+=cw;
                const vx=ax+spA,vy=ay+spA,vw=aw-spA*2,vh=ah-spA*2;
                if(vw<=0||vh<=0)return null;
                const selFV=selected===`fv_${ai}`;
                const isAR=tipo.includes("ar"),isAB=tipo.includes("ab");
                const hasManiglia=(isAR||isAB)&&!tipo.includes("scorr")&&tipo!=="wasistas";
                const showManiglia=hasManiglia&&(nAnte<=1||ai===0);
                const manX=isSx?ax+aw-spA/2:ax+spA/2;
                return(<g key={ai}>
                  <VetroHatch x={vx} y={vy} w={vw} h={vh} id={`v-a${ai}`}/>
                  <text x={ax+aw/2} y={ay+ah/2+4} textAnchor="middle" fontSize={Math.max(6,Math.min(10,vw/14))} fill="#336688" fontFamily="monospace" opacity={0.7} pointerEvents="none">{profiles.vetro}</text>
                  {[{pid:"ant_top",rx:ax,ry:ay,rw:aw,rh:spA},{pid:"ant_bottom",rx:ax,ry:ay+ah-spA,rw:aw,rh:spA},{pid:"ant_left",rx:ax,ry:ay,rw:spA,rh:ah},{pid:"ant_right",rx:ax+aw-spA,ry:ay,rw:spA,rh:ah}].map(({pid,rx,ry,rw,rh})=>{
                    const sel=selected===pid;
                    return(<rect key={pid} x={rx} y={ry} width={rw} height={rh} fill={sel?"#CCE0FF":C.anta_fill} stroke={sel?C.sel:C.anta} strokeWidth={sel?1.5:LW.anta} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelected(sel?null:pid);}}/>);
                  })}
                  {cornerLinesAnta(ax,ay,aw,ah,spA,ai,cols.length,C.anta,LW.anta+0.2)}
                  {[{pid:"ant_left",x:ax+spA/2,y:ay+ah/2,rot:true},{pid:"ant_right",x:ax+aw-spA/2,y:ay+ah/2,rot:true},{pid:"ant_top",x:ax+aw/2,y:ay+spA/2,rot:false},{pid:"ant_bottom",x:ax+aw/2,y:ay+ah-spA/2,rot:false}].map(({pid,x,y,rot})=>(
                    <text key={pid} x={x} y={y+2} textAnchor="middle" fontSize={Math.max(4.5,Math.min(7,spA*0.38))} fill={selected===pid?"#0044AA":"#888"} fontFamily="monospace" transform={rot?`rotate(-90,${x},${y})`:undefined} pointerEvents="none">{profiles[pid]}</text>
                  ))}
                  {[{rx:ax+spA,ry:ay+spA,rw:fgW,rh:vh},{rx:ax+aw-spA-fgW,ry:ay+spA,rw:fgW,rh:vh},{rx:ax+spA,ry:ay+spA,rw:vw,rh:fgW},{rx:ax+spA,ry:ay+ah-spA-fgW,rw:vw,rh:fgW}].map((p,pi)=>(
                    <rect key={`fv${pi}`} x={p.rx} y={p.ry} width={p.rw} height={p.rh} fill="#BBBBBB" stroke={selFV?C.sel:C.fermavetro} strokeWidth={LW.fv} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelected(selFV?null:`fv_${ai}`);}}/>
                  ))}
                  <Tratteggio tipo={tipo} ax={ax} ay={ay} aw={aw} ah={ah} isSx={isSx} nAnte={nAnte} spA={spA}/>
                  {showManiglia&&<ManigliaDK mx={manX} my={ay+ah/2} verso={isSx?"dx":"sx"}/>}
                </g>);
              });
              return(<>{anteElements}{showRiporto&&(<g style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelected(selected==="riporto"?null:"riporto");}}>
                <rect x={riportoCenterX-spR/2} y={iY} width={spR} height={iH} fill={selected==="riporto"?"#CCE0FF":"#D8D8D8"} stroke={selected==="riporto"?C.sel:"#888888"} strokeWidth={0.6}/>
                <text x={riportoCenterX} y={iY+iH/2+3} textAnchor="middle" fontSize={Math.max(4,spR*0.5)} fill={selected==="riporto"?"#0044AA":"#666"} fontFamily="monospace" transform={`rotate(-90,${riportoCenterX},${iY+iH/2})`} pointerEvents="none">{profiles.riporto}</text>
              </g>)}</>);
            })()}

            <rect x={cx} y={cy} width={SW} height={SH} fill="none" stroke={C.telaio} strokeWidth={LW.telaio+0.4} pointerEvents="none"/>

            {/* Drag areas */}
            {dragAreas.map(({side,x,y,w,h})=>(
              <rect key={side} x={x} y={y} width={w} height={h} fill="transparent" style={{cursor:sideCursor(side)}}
                onPointerEnter={()=>setHoverBar(side)} onPointerLeave={()=>setHoverBar(null)} onPointerDown={e=>startDrag(side,e)}/>
            ))}

            {/* Hover drag indicators */}
            {hoverBar&&!dragging&&(()=>{
              const arrows=[];
              if(hoverBar==="right"){const mx=cx+SW-spT/2,my=cy+SH/2;arrows.push({x1:mx-8,y1:my,x2:mx+8,y2:my});}
              if(hoverBar==="left"){const mx=cx+spT/2,my=cy+SH/2;arrows.push({x1:mx-8,y1:my,x2:mx+8,y2:my});}
              if(hoverBar==="bottom"){const mx=cx+SW/2,my=cy+SH-spT/2;arrows.push({x1:mx,y1:my-8,x2:mx,y2:my+8});}
              if(hoverBar==="top"){const mx=cx+SW/2,my=cy+spT/2;arrows.push({x1:mx,y1:my-8,x2:mx,y2:my+8});}
              return arrows.map((a,i)=><line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={C.drag} strokeWidth={2.5} pointerEvents="none" markerEnd="url(#dragArrow)" markerStart="url(#dragArrowRev)"/>);
            })()}

            <defs>
              <marker id="dragArrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill={C.drag}/></marker>
              <marker id="dragArrowRev" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto"><polygon points="5,0 0,2.5 5,5" fill={C.drag}/></marker>
            </defs>

            {/* Sezione orizzontale */}
            {showSez&&(()=>{
              const ox=svgW-108,oy=svgH-66,tW=18,aW=14,fW=4,glW=12,bH=42;
              return(<g transform={`translate(${ox},${oy})`} pointerEvents="none">
                <rect x={0} y={0} width={102} height={bH+22} fill="#FFFFFF" stroke="#333333" strokeWidth={0.7} rx={2}/>
                <text x={3} y={9} fontSize={5.5} fill="#003399" fontFamily="monospace" fontWeight="bold">SEZ. ORIZZONTALE</text>
                <rect x={4} y={11} width={tW} height={bH-11} fill="#E0E0E0" stroke="#000" strokeWidth={0.8}/><text x={4+tW/2} y={11+(bH-11)/2+2} textAnchor="middle" fontSize={4} fill="#333" fontFamily="monospace">T</text>
                <rect x={4+tW} y={13} width={aW} height={bH-15} fill="#F0F0F0" stroke="#000" strokeWidth={0.7}/><text x={4+tW+aW/2} y={13+(bH-15)/2+2} textAnchor="middle" fontSize={4} fill="#333" fontFamily="monospace">A</text>
                <rect x={4+tW+aW} y={15} width={fW} height={bH-19} fill="#CCCCCC" stroke="#333" strokeWidth={0.5}/>
                <rect x={4+tW+aW+fW} y={17} width={glW} height={bH-23} fill={C.vetroFill} stroke="#336688" strokeWidth={0.5}/>
                <rect x={4+tW+aW+fW+glW} y={15} width={fW} height={bH-19} fill="#CCCCCC" stroke="#333" strokeWidth={0.5}/>
                <rect x={4+tW+aW+fW+glW+fW} y={13} width={aW} height={bH-15} fill="#F0F0F0" stroke="#000" strokeWidth={0.7}/>
                <rect x={4+tW+aW+fW+glW+fW+aW} y={11} width={tW} height={bH-11} fill="#E0E0E0" stroke="#000" strokeWidth={0.8}/>
                <line x1={4} y1={bH+15} x2={98} y2={bH+15} stroke={C.quota} strokeWidth={0.5}/>
                <polygon points={`4,${bH+15} 8,${bH+13} 8,${bH+17}`} fill={C.quota}/>
                <polygon points={`98,${bH+15} 94,${bH+13} 94,${bH+17}`} fill={C.quota}/>
                <text x={51} y={bH+13} textAnchor="middle" fontSize={5.5} fill={C.quota} fontFamily="monospace">{bautiefe}mm</text>
              </g>);
            })()}

            <text x={svgW-10} y={svgH-6} textAnchor="end" fontSize={8.5} fill="#999999" fontFamily="monospace" pointerEvents="none">Vista Interna</text>
          </svg>
        </div>

        {/* Pannello destra */}
        <div style={{width:210,flexShrink:0,background:"#FFFFFF",borderLeft:"1px solid #CCCCCC",padding:10,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
          {selected?(
            <div style={{background:"#EEF4FF",border:`1.5px solid ${C.sel}`,borderRadius:5,padding:8}}>
              <div style={{fontSize:7,color:C.sel,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Profilo selezionato</div>
              <div style={{fontSize:9.5,color:"#003388",fontWeight:"bold",marginBottom:6}}>{selected.replace(/_/g," ").toUpperCase()}</div>
              <select value={profiles[selected]||""} onChange={e=>setProfiles(p=>({...p,[selected]:e.target.value}))}
                style={{width:"100%",padding:"4px",background:"#FFFFFF",border:`1px solid ${C.sel}`,borderRadius:3,color:"#003388",fontSize:9.5,fontFamily:"monospace",marginBottom:5}}>
                {profileList.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <input value={profiles[selected]||""} onChange={e=>setProfiles(p=>({...p,[selected]:e.target.value}))} placeholder="Digita codice..."
                style={{width:"100%",boxSizing:"border-box",padding:"4px",background:"#F8F8F8",border:"1px solid #CCD",borderRadius:3,color:"#003388",fontSize:9.5,fontFamily:"monospace"}}/>
              <button onClick={()=>save()} style={{width:"100%",marginTop:8,padding:"5px",borderRadius:3,background:"#1A3A6A",color:"#FFF",border:"none",fontSize:10,cursor:"pointer",fontFamily:"monospace"}}>Salva</button>
            </div>
          ):(
            <div style={{background:"#F8F8F8",border:"1px solid #DDD",borderRadius:5,padding:10,fontSize:9,color:"#999",textAlign:"center",lineHeight:1.8}}>
              Clicca un profilo per modificarlo
              <div style={{marginTop:8,fontSize:7.5,color:"#CCC"}}>Trascina i lati del telaio per ridimensionare</div>
            </div>
          )}
          <div style={{background:"#F8F8F8",border:"1px solid #DDD",borderRadius:5,padding:8}}>
            <div style={{fontSize:7,color:"#999",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Dimensioni</div>
            {[{label:"L (larghezza)",val:L,set:setL},{label:"H (altezza)",val:H,set:setH}].map(({label,val,set})=>(
              <div key={label} style={{marginBottom:6}}>
                <div style={{fontSize:7.5,color:"#888",marginBottom:3}}>{label}</div>
                <input type="number" value={val} onChange={e=>set(Math.max(300,Math.min(4000,parseInt(e.target.value)||300)))}
                  style={{width:"100%",boxSizing:"border-box",padding:"4px 6px",background:"#FFFFFF",border:"1px solid #CCCCCC",borderRadius:3,color:C.quota,fontSize:13,fontFamily:"monospace",fontWeight:"bold",textAlign:"right"}}/>
              </div>
            ))}
          </div>
          <div style={{background:"#F8F8F8",border:"1px solid #DDD",borderRadius:5,padding:8}}>
            <div style={{fontSize:7,color:"#999",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Lista profili</div>
            {Object.entries(profiles).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #EEE",fontSize:7.5,background:selected===k?"#EEF4FF":undefined,cursor:"pointer"}}
                onClick={()=>setSelected(selected===k?null:k)}>
                <span style={{color:selected===k?C.sel:"#AAA"}}>{k.replace(/_/g," ")}</span>
                <span style={{color:selected===k?"#003388":C.quota,fontWeight:"bold"}}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
