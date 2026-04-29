"use client";
import React, { useState, useRef, useEffect } from "react";

const T = {
  bg:"#FFFFFF", card:"#FFFFFF", bdr:"#C8E4E4",
  acc:"#0F766E", accLt:"#E1F5EE", accDk:"#0A5A4F",
  text:"#0D1F1F", sub:"#5F7575",
  warn:"#D11A1A", arrow:"#E5A23A"
};

type Pt = { x:number; y:number };
type Braccio = { top:Pt; bot:Pt };
type Detail = { dataUrl:string; img:HTMLImageElement|null; anchor:Pt; thumb:{x:number;y:number;w:number;h:number}; caption:string };
type Quota = { p1:Pt; p2:Pt; label:string };
type Tenda = {
  id:string;
  model:string;
  corners:Pt[];
  bracci:Braccio[];
  aggancio:Pt[];
  misure:{ L?:string; S?:string; A?:string; muro?:string; note?:string };
};
type CatalogoItem = { id:string; tipo:string; nome:string; fornitore?:string; png_url?:string; prezzo?:number };
type Props = { onClose:()=>void; onSave?:(data:any)=>void; initial?:any; catalogo?:CatalogoItem[] };

const MODELS:[string,string][] = [["cassonetto","Cassonetto"],["bracci","Solo telo"],["capottina","Capottina"],["caduta","A caduta"],["rullo","Rullo"]];

function uid(){ return "t_"+Math.random().toString(36).slice(2,9); }
function defaultCorners(offset=0):Pt[]{ return [{x:160+offset,y:130},{x:480+offset,y:130},{x:480+offset,y:280},{x:160+offset,y:280}]; }
function defaultBracci(c:Pt[]):Braccio[]{
  return [
    {top:{x:c[0].x+10,y:c[0].y+15}, bot:{x:c[3].x+15,y:c[3].y-5}},
    {top:{x:c[1].x-10,y:c[1].y+15}, bot:{x:c[2].x-15,y:c[2].y-5}}
  ];
}
function defaultAggancio(c:Pt[]):Pt[]{
  return [{x:c[0].x+25,y:c[0].y-8},{x:(c[0].x+c[1].x)/2,y:(c[0].y+c[1].y)/2-8},{x:c[1].x-25,y:c[1].y-8}];
}
function newTenda(model:string, offset=0):Tenda{
  const c = defaultCorners(offset);
  return { id: uid(), model, corners: c, bracci: defaultBracci(c), aggancio: defaultAggancio(c), misure:{} };
}

export default function RilievoTende({ onClose, onSave, initial, catalogo }: Props){
  const cvRef = useRef<HTMLCanvasElement>(null);
  const W = 640, H = 440;

  const [img, setImg] = useState<HTMLImageElement|null>(null);
  const [tende, setTende] = useState<Tenda[]>(initial?.tende || []);
  const [activeIdx, setActiveIdx] = useState<number>(initial?.tende?.length ? 0 : -1);
  const [details, setDetails] = useState<Detail[]>([]);
  const [quote, setQuote] = useState<Quota[]>(initial?.quote || []);
  const [show, setShow] = useState({ tenda:true, bracci:true, aggancio:true });
  const [tool, setTool] = useState<"select"|"quota">("select");
  const [drag, setDrag] = useState<any>(null);
  const [quotaPending, setQuotaPending] = useState<Pt|null>(null);
  const [popup, setPopup] = useState<any>(null);
  const [lightbox, setLightbox] = useState<Detail|null>(null);
  const [sheetOpen, setSheetOpen] = useState<"modello"|"misure"|null>("modello");
  const mouseRef = useRef({x:0,y:0});

  const fileMain = useRef<HTMLInputElement>(null);
  const fileDetail = useRef<HTMLInputElement>(null);

  const active = activeIdx>=0 && activeIdx<tende.length ? tende[activeIdx] : null;

  function updateActive(patch: Partial<Tenda>){
    if(activeIdx<0) return;
    setTende(tende.map((t,i)=> i===activeIdx ? {...t, ...patch} : t));
  }

  function tendaPNG(m:string, w:number, h:number){
    const c = document.createElement("canvas");
    c.width = Math.max(80, Math.round(w)); c.height = Math.max(60, Math.round(h));
    const x = c.getContext("2d")!; const W2=c.width, H2=c.height;
    if(m==="cassonetto"){
      x.fillStyle="#E2DDCF"; x.fillRect(0,0,W2,18);
      x.strokeStyle="rgba(80,75,65,0.7)"; x.strokeRect(0,0,W2,18);
      const s=["#E5D7B0","#D4C29A"];
      for(let i=0;i<10;i++){
        x.fillStyle=s[i%2];
        x.beginPath(); x.moveTo(W2*i/10,18); x.lineTo(W2*(i+1)/10,18);
        x.lineTo(W2*0.06+W2*0.88*(i+1)/10,H2-8); x.lineTo(W2*0.06+W2*0.88*i/10,H2-8); x.closePath(); x.fill();
      }
    } else if(m==="bracci"){
      x.fillStyle="#3F6E8A";
      x.beginPath(); x.moveTo(0,2); x.lineTo(W2,2); x.lineTo(W2*0.93,H2-8); x.lineTo(W2*0.07,H2-8); x.closePath(); x.fill();
    } else if(m==="capottina"){
      x.fillStyle="#2A8C8C";
      x.beginPath(); x.moveTo(0,0); x.lineTo(W2,0); x.lineTo(W2,H2*0.4);
      x.quadraticCurveTo(W2/2,H2*1.05,0,H2*0.4); x.closePath(); x.fill();
    } else if(m==="caduta"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,12);
      x.fillStyle="#D5BE82"; x.fillRect(3,12,W2-6,H2-12);
      x.fillStyle="#3A332A"; x.fillRect(0,12,3,H2-12); x.fillRect(W2-3,12,3,H2-12);
    } else if(m==="rullo"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,14);
      x.fillStyle="#F0DCB2"; x.fillRect(2,14,W2-4,H2-14);
    }
    return c;
  }

  function bilinear(c:Pt[], u:number, v:number):Pt {
    const top = {x:c[0].x+(c[1].x-c[0].x)*u, y:c[0].y+(c[1].y-c[0].y)*u};
    const bot = {x:c[3].x+(c[2].x-c[3].x)*u, y:c[3].y+(c[2].y-c[3].y)*u};
    return {x:top.x+(bot.x-top.x)*v, y:top.y+(bot.y-top.y)*v};
  }
  function drawTri(ctx:CanvasRenderingContext2D, img:HTMLCanvasElement, sT:Pt[], dT:Pt[]){
    ctx.save();
    ctx.beginPath(); ctx.moveTo(dT[0].x,dT[0].y); ctx.lineTo(dT[1].x,dT[1].y); ctx.lineTo(dT[2].x,dT[2].y); ctx.closePath(); ctx.clip();
    const det=(sT[1].x-sT[0].x)*(sT[2].y-sT[0].y)-(sT[2].x-sT[0].x)*(sT[1].y-sT[0].y);
    if(Math.abs(det)<1e-6){ ctx.restore(); return; }
    const a=((dT[1].x-dT[0].x)*(sT[2].y-sT[0].y)-(dT[2].x-dT[0].x)*(sT[1].y-sT[0].y))/det;
    const b=((dT[2].x-dT[0].x)*(sT[1].x-sT[0].x)-(dT[1].x-dT[0].x)*(sT[2].x-sT[0].x))/det;
    const c2=((dT[1].y-dT[0].y)*(sT[2].y-sT[0].y)-(dT[2].y-dT[0].y)*(sT[1].y-sT[0].y))/det;
    const d2=((dT[2].y-dT[0].y)*(sT[1].x-sT[0].x)-(dT[1].y-dT[0].y)*(sT[2].x-sT[0].x))/det;
    const e=dT[0].x-a*sT[0].x-b*sT[0].y, f=dT[0].y-c2*sT[0].x-d2*sT[0].y;
    ctx.transform(a,c2,b,d2,e,f);
    ctx.drawImage(img,0,0);
    ctx.restore();
  }
  function meshWarp(ctx:CanvasRenderingContext2D, src:HTMLCanvasElement, dst:Pt[]){
    const NX=10, NY=6;
    for(let iy=0;iy<NY;iy++) for(let ix=0;ix<NX;ix++){
      const u0=ix/NX,u1=(ix+1)/NX,v0=iy/NY,v1=(iy+1)/NY;
      const s00={x:u0*src.width,y:v0*src.height},s10={x:u1*src.width,y:v0*src.height};
      const s11={x:u1*src.width,y:v1*src.height},s01={x:u0*src.width,y:v1*src.height};
      const d00=bilinear(dst,u0,v0),d10=bilinear(dst,u1,v0),d11=bilinear(dst,u1,v1),d01=bilinear(dst,u0,v1);
      drawTri(ctx,src,[s00,s10,s11],[d00,d10,d11]);
      drawTri(ctx,src,[s00,s11,s01],[d00,d11,d01]);
    }
  }

  function render(){
    const cv = cvRef.current; if(!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0,0,W,H);
    if(img){
      const ir=img.width/img.height, cr=W/H;
      let dw,dh,ox,oy;
      if(ir>cr){ dw=W; dh=W/ir; ox=0; oy=(H-dh)/2; } else { dh=H; dw=H*ir; oy=0; ox=(W-dw)/2; }
      ctx.fillStyle="#F4F1EA"; ctx.fillRect(0,0,W,H);
      ctx.drawImage(img,ox,oy,dw,dh);
    } else {
      ctx.fillStyle="#F4F1EA"; ctx.fillRect(0,0,W,H);
      ctx.fillStyle=T.sub; ctx.font="13px sans-serif"; ctx.textAlign="center";
      ctx.fillText("Tocca 'Foto' per iniziare", W/2, H/2);
      ctx.textAlign="start";
    }
    // disegna tutte le tende, evidenzia attiva
    tende.forEach((t, idx)=>{
      const isActive = idx===activeIdx;
      if(show.tenda){
        const xs=t.corners.map(p=>p.x), ys=t.corners.map(p=>p.y);
        const bw=Math.max(...xs)-Math.min(...xs), bh=Math.max(...ys)-Math.min(...ys);
        const src=tendaPNG(t.model, Math.max(120,bw), Math.max(80,bh));
        ctx.save(); ctx.globalAlpha = isActive ? 0.94 : 0.7; meshWarp(ctx, src, t.corners); ctx.restore();
        // bordo + handle (handle solo per attiva)
        ctx.save();
        ctx.strokeStyle = isActive ? T.acc : "rgba(15,118,110,0.4)";
        ctx.lineWidth = isActive ? 2 : 1; ctx.setLineDash([5,3]);
        ctx.beginPath(); ctx.moveTo(t.corners[0].x,t.corners[0].y);
        for(let i=1;i<4;i++) ctx.lineTo(t.corners[i].x,t.corners[i].y);
        ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        // numero tenda al centro
        const cx=(t.corners[0].x+t.corners[2].x)/2, cy=(t.corners[0].y+t.corners[2].y)/2;
        ctx.fillStyle = isActive ? T.acc : "rgba(15,118,110,0.6)";
        ctx.beginPath(); ctx.arc(cx,cy,16,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#fff"; ctx.font="bold 14px sans-serif"; ctx.textAlign="center";
        ctx.fillText(String(idx+1), cx, cy+5);
        ctx.textAlign="start";
        if(isActive){
          t.corners.forEach((p,i)=>{
            ctx.fillStyle=T.acc; ctx.beginPath(); ctx.arc(p.x,p.y,12,0,Math.PI*2); ctx.fill();
            ctx.fillStyle="#fff"; ctx.font="bold 10px sans-serif"; ctx.textAlign="center";
            ctx.fillText("T"+(i+1), p.x, p.y+3); ctx.textAlign="start";
          });
        }
        ctx.restore();
      }
      if(show.bracci) t.bracci.forEach((b,i)=>{
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.strokeStyle="#666"; ctx.lineWidth=6; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(b.top.x,b.top.y); ctx.lineTo(b.bot.x,b.bot.y); ctx.stroke();
        if(isActive){
          ctx.fillStyle=T.arrow;
          ctx.beginPath(); ctx.arc(b.top.x,b.top.y,10,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(b.bot.x,b.bot.y,10,0,Math.PI*2); ctx.fill();
          ctx.fillStyle="#fff"; ctx.font="bold 9px sans-serif"; ctx.textAlign="center";
          ctx.fillText("B"+(i+1), b.top.x, b.top.y+3);
          ctx.fillText("B"+(i+1), b.bot.x, b.bot.y+3);
          ctx.textAlign="start";
        }
        ctx.restore();
      });
      if(show.aggancio) t.aggancio.forEach((a,i)=>{
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.strokeStyle=T.warn; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(a.x,a.y,12,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x-9,a.y); ctx.lineTo(a.x+9,a.y);
        ctx.moveTo(a.x,a.y-9); ctx.lineTo(a.x,a.y+9); ctx.stroke();
        ctx.fillStyle=T.warn; ctx.beginPath(); ctx.arc(a.x,a.y,3,0,Math.PI*2); ctx.fill();
        if(isActive){
          ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
          ctx.fillText("A"+(i+1), a.x+22, a.y-10); ctx.textAlign="start";
        }
        ctx.restore();
      });
    });
    // quote globali
    quote.forEach(q=>{
      ctx.save();
      ctx.strokeStyle=T.acc; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(q.p1.x,q.p1.y); ctx.lineTo(q.p2.x,q.p2.y); ctx.stroke();
      const dx=q.p2.x-q.p1.x, dy=q.p2.y-q.p1.y, len=Math.hypot(dx,dy)||1;
      const nx=-dy/len*8, ny=dx/len*8;
      [q.p1,q.p2].forEach(p=>{ ctx.beginPath(); ctx.moveTo(p.x-nx,p.y-ny); ctx.lineTo(p.x+nx,p.y+ny); ctx.stroke(); });
      if(q.label){
        const mx=(q.p1.x+q.p2.x)/2, my=(q.p1.y+q.p2.y)/2;
        ctx.font="bold 13px sans-serif";
        const tw=ctx.measureText(q.label).width+14;
        ctx.fillStyle="#fff"; ctx.fillRect(mx-tw/2,my-22,tw,20);
        ctx.strokeStyle=T.acc; ctx.strokeRect(mx-tw/2,my-22,tw,20);
        ctx.fillStyle=T.text; ctx.textAlign="center";
        ctx.fillText(q.label, mx, my-8); ctx.textAlign="start";
      }
      ctx.restore();
    });
    details.forEach((d,i)=>{
      const tx=d.thumb.x, ty=d.thumb.y, tw=d.thumb.w, th=d.thumb.h;
      ctx.save();
      ctx.strokeStyle=T.arrow; ctx.lineWidth=2; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(d.anchor.x,d.anchor.y); ctx.lineTo(tx+tw/2,ty+th/2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=T.arrow; ctx.beginPath(); ctx.arc(d.anchor.x,d.anchor.y,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.font="bold 10px sans-serif"; ctx.textAlign="center";
      ctx.fillText("P"+(i+1), d.anchor.x, d.anchor.y+3); ctx.textAlign="start";
      ctx.fillStyle="#fff"; ctx.fillRect(tx-3,ty-3,tw+6,th+6);
      ctx.strokeStyle=T.arrow; ctx.lineWidth=3; ctx.strokeRect(tx-3,ty-3,tw+6,th+6);
      if(d.img) ctx.drawImage(d.img, tx, ty, tw, th);
      ctx.restore();
    });
    if(quotaPending){
      ctx.save();
      ctx.fillStyle=T.acc; ctx.beginPath(); ctx.arc(quotaPending.x,quotaPending.y,6,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  useEffect(()=>{ render(); });

  // --- HIT TEST: cerca su tutte le tende, ma drag solo se è la attiva o passa attiva ---
  function getPos(e:any):Pt{
    const cv = cvRef.current!;
    const r = cv.getBoundingClientRect();
    const sx = cv.width/r.width, sy = cv.height/r.height;
    const cx = (e.clientX!=null?e.clientX:e.touches[0].clientX)-r.left;
    const cy = (e.clientY!=null?e.clientY:e.touches[0].clientY)-r.top;
    return {x:cx*sx, y:cy*sy};
  }
  function hitTest(p:Pt){
    // 1. handle dell'attiva (priorità max)
    if(active){
      if(show.tenda){
        for(let i=0;i<4;i++){
          if(Math.hypot(p.x-active.corners[i].x, p.y-active.corners[i].y)<=22) return {what:"tCorner", i};
        }
      }
      if(show.bracci){
        for(let i=0;i<active.bracci.length;i++){
          if(Math.hypot(p.x-active.bracci[i].top.x, p.y-active.bracci[i].top.y)<=18) return {what:"bTop", i};
          if(Math.hypot(p.x-active.bracci[i].bot.x, p.y-active.bracci[i].bot.y)<=18) return {what:"bBot", i};
        }
      }
      if(show.aggancio){
        for(let i=0;i<active.aggancio.length;i++){
          if(Math.hypot(p.x-active.aggancio[i].x, p.y-active.aggancio[i].y)<=20) return {what:"agg", i};
        }
      }
    }
    // 2. tap su altra tenda → la attiva
    for(let ti=0; ti<tende.length; ti++){
      if(ti===activeIdx) continue;
      const t = tende[ti];
      const cx=(t.corners[0].x+t.corners[2].x)/2, cy=(t.corners[0].y+t.corners[2].y)/2;
      // tap dentro bbox tenda
      const xs=t.corners.map(p=>p.x), ys=t.corners.map(p=>p.y);
      if(p.x>=Math.min(...xs) && p.x<=Math.max(...xs) && p.y>=Math.min(...ys) && p.y<=Math.max(...ys)){
        return {what:"selectTenda", i:ti};
      }
    }
    // 3. dettagli e ancore (globali)
    for(let i=details.length-1;i>=0;i--){ const d=details[i];
      if(p.x>=d.thumb.x && p.x<=d.thumb.x+d.thumb.w && p.y>=d.thumb.y && p.y<=d.thumb.y+d.thumb.h){
        if(Math.abs(p.x-(d.thumb.x+d.thumb.w))<14 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<14) return {what:"thumbResize",i};
        return {what:"thumbMove",i,ox:p.x-d.thumb.x,oy:p.y-d.thumb.y};
      }
    }
    for(let i=0;i<details.length;i++){
      if(Math.hypot(p.x-details[i].anchor.x, p.y-details[i].anchor.y)<=14) return {what:"anchor",i};
    }
    return null;
  }

  function handleDown(p:Pt){
    if(popup) return;
    if(tool==="quota"){
      if(!quotaPending){ setQuotaPending(p); return; }
      const mx=(quotaPending.x+p.x)/2, my=(quotaPending.y+p.y)/2;
      setPopup({ kind:"quota", title:"Misura (es. 300 cm)", value:"", x:mx, y:my, payload:{p1:quotaPending, p2:p} });
      setQuotaPending(null);
      return;
    }
    const h = hitTest(p);
    if(!h) return;
    if(h.what==="selectTenda"){ setActiveIdx(h.i); return; }
    if(h.what==="thumbMove"){ const d=details[h.i]; if(!(Math.abs(p.x-(d.thumb.x+d.thumb.w))<14 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<14)){ setLightbox(d); return; } }
    setDrag(h);
  }
  function handleMove(p:Pt){
    mouseRef.current = p;
    if(quotaPending){ render(); return; }
    if(!drag || !active) return;
    if(drag.what==="tCorner"){ const c=[...active.corners]; c[drag.i]=p; updateActive({corners:c}); }
    else if(drag.what==="bTop"){ const b=[...active.bracci]; b[drag.i]={...b[drag.i], top:p}; updateActive({bracci:b}); }
    else if(drag.what==="bBot"){ const b=[...active.bracci]; b[drag.i]={...b[drag.i], bot:p}; updateActive({bracci:b}); }
    else if(drag.what==="agg"){ const a=[...active.aggancio]; a[drag.i]=p; updateActive({aggancio:a}); }
    else if(drag.what==="anchor"){ const d=[...details]; d[drag.i]={...d[drag.i], anchor:p}; setDetails(d); }
    else if(drag.what==="thumbMove"){ const d=[...details]; d[drag.i]={...d[drag.i], thumb:{...d[drag.i].thumb, x:p.x-drag.ox, y:p.y-drag.oy}}; setDetails(d); }
    else if(drag.what==="thumbResize"){ const d=[...details]; d[drag.i]={...d[drag.i], thumb:{...d[drag.i].thumb, w:Math.max(60,p.x-d[drag.i].thumb.x), h:Math.max(45,p.y-d[drag.i].thumb.y)}}; setDetails(d); }
  }

  // --- TOUCH NATIVO con stateRef ---
  const sRef = useRef<any>(null);
  sRef.current = { tende, activeIdx, drag, popup, tool, quotaPending, details, show };

  useEffect(()=>{
    const cv = cvRef.current; if(!cv) return;
    function getPosT(e:TouchEvent):Pt{
      const r = cv!.getBoundingClientRect();
      const sx = cv!.width/r.width, sy = cv!.height/r.height;
      const t = e.touches[0] || e.changedTouches[0];
      return { x:(t.clientX-r.left)*sx, y:(t.clientY-r.top)*sy };
    }
    const start = (e:TouchEvent)=>{
      e.preventDefault();
      handleDown(getPosT(e));
    };
    const move = (e:TouchEvent)=>{
      e.preventDefault();
      handleMove(getPosT(e));
    };
    const end = ()=>{ setDrag(null); };
    cv.addEventListener("touchstart", start, {passive:false});
    cv.addEventListener("touchmove", move, {passive:false});
    cv.addEventListener("touchend", end);
    return ()=>{
      cv.removeEventListener("touchstart", start);
      cv.removeEventListener("touchmove", move);
      cv.removeEventListener("touchend", end);
    };
  });

  function onMouseDown(e:any){ handleDown(getPos(e)); }
  function onMouseMove(e:any){ handleMove(getPos(e)); }
  function onMouseUp(){ setDrag(null); }

  function aggiungiTenda(model:string){
    const offset = tende.length * 30;
    const nuova = newTenda(model, offset);
    const nuoveTende = [...tende, nuova];
    setTende(nuoveTende);
    setActiveIdx(nuoveTende.length - 1);
  }
  function selezionaModello(m:string){
    if(activeIdx<0){ aggiungiTenda(m); return; }
    updateActive({ model: m });
  }
  function eliminaTendaAttiva(){
    if(activeIdx<0) return;
    const filtrate = tende.filter((_,i)=>i!==activeIdx);
    setTende(filtrate);
    setActiveIdx(filtrate.length>0 ? Math.max(0, activeIdx-1) : -1);
  }
  function duplicaTendaAttiva(){
    if(!active) return;
    const offset = 30;
    const dup:Tenda = {
      ...active, id: uid(),
      corners: active.corners.map(p=>({x:p.x+offset, y:p.y+offset})),
      bracci: active.bracci.map(b=>({top:{x:b.top.x+offset,y:b.top.y+offset}, bot:{x:b.bot.x+offset,y:b.bot.y+offset}})),
      aggancio: active.aggancio.map(p=>({x:p.x+offset,y:p.y+offset}))
    };
    const nuove = [...tende, dup];
    setTende(nuove);
    setActiveIdx(nuove.length-1);
  }

  function loadFile(input:HTMLInputElement, cb:(im:HTMLImageElement, dataUrl:string)=>void){
    const f = input.files?.[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const im = new Image();
      im.onload = () => cb(im, ev.target!.result as string);
      im.src = ev.target!.result as string;
    };
    r.readAsDataURL(f);
  }

  function commitPopup(){
    if(!popup) return;
    const v = (popup.value||"").trim();
    if(popup.kind==="quota" && v) setQuote([...quote, {p1:popup.payload.p1, p2:popup.payload.p2, label:v}]);
    if(popup.kind==="caption"){ const d={...popup.payload, caption: v||"Particolare "+(details.length+1)}; setDetails([...details, d]); }
    setPopup(null);
  }

  function saveAndClose(){
    if(onSave) onSave({ tende, quote, details: details.map(d=>({dataUrl:d.dataUrl, anchor:d.anchor, thumb:d.thumb, caption:d.caption})) });
    onClose();
  }

  const chip = (active:boolean):React.CSSProperties => ({
    padding:"7px 12px", borderRadius:999, border:"1px solid "+(active?T.acc:T.bdr),
    background: active?T.accLt:"#fff", color: active?T.acc:T.text,
    fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0
  });
  const lbl:React.CSSProperties = { fontSize:11, color:T.sub, display:"block", marginBottom:4, fontWeight:500 };
  const inp:React.CSSProperties = { width:"100%", fontSize:14, padding:"9px 10px", border:"1px solid "+T.bdr, borderRadius:8, background:"#fff", color:T.text, boxSizing:"border-box" };

  return (
    <div style={{position:"fixed", inset:0, background:"#fff", zIndex:9000, display:"flex", flexDirection:"column"}}>
      <div style={{padding:"10px 12px", borderBottom:"1px solid "+T.bdr, background:"#fff", display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
        <button onClick={onClose} style={{width:36, height:36, borderRadius:10, border:"none", background:"transparent", fontSize:20, cursor:"pointer"}}>{"\u2190"}</button>
        <div style={{flex:1, fontSize:15, fontWeight:700, color:T.acc}}>Rilievo Tendaggio</div>
        <button onClick={saveAndClose} style={{padding:"8px 14px", borderRadius:8, border:"none", background:T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>Salva</button>
      </div>

      {/* Tab tende multiple */}
      <div style={{padding:"6px 8px", display:"flex", gap:4, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#FAFBFB", overflowX:"auto", flexShrink:0}}>
        {tende.map((t,i)=>(
          <button key={t.id} onClick={()=>setActiveIdx(i)}
            style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+(i===activeIdx?T.acc:T.bdr),
              background: i===activeIdx?T.acc:"#fff", color: i===activeIdx?"#fff":T.text,
              fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0,
              display:"flex", alignItems:"center", gap:6}}>
            <span style={{width:18, height:18, borderRadius:"50%", background: i===activeIdx?"#fff":T.accLt, color: i===activeIdx?T.acc:T.acc, fontSize:11, display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:700}}>{i+1}</span>
            {MODELS.find(m=>m[0]===t.model)?.[1] || t.model}
          </button>
        ))}
        <button onClick={()=>aggiungiTenda("cassonetto")}
          style={{padding:"6px 12px", borderRadius:8, border:"1px dashed "+T.acc, background:T.accLt, color:T.acc, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0}}>+ Tenda</button>
        {active && (
          <>
            <button onClick={duplicaTendaAttiva} style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:11, cursor:"pointer", flexShrink:0}} title="Duplica">{"\u29C9"}</button>
            <button onClick={eliminaTendaAttiva} style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+T.warn, background:"#fff", color:T.warn, fontSize:11, cursor:"pointer", flexShrink:0}} title="Elimina">{"\uD83D\uDDD1"}</button>
          </>
        )}
      </div>

      <div style={{padding:"8px 12px", display:"flex", gap:6, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#fff", flexShrink:0, overflowX:"auto"}}>
        <input ref={fileMain} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>loadFile(e.target as HTMLInputElement, (im)=>setImg(im))} />
        <input ref={fileDetail} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>loadFile(e.target as HTMLInputElement, (im, url)=>{
          const idx=details.length;
          const draft:Detail = { img:im, dataUrl:url, anchor:{x:320,y:200}, thumb:{x:20+idx*30, y:20+idx*20, w:110, h:80}, caption:"" };
          setPopup({ kind:"caption", title:"Etichetta del particolare", value:"Particolare "+(idx+1), x:320, y:200, payload:draft });
          (e.target as HTMLInputElement).value="";
        })} />
        <button onClick={()=>fileMain.current?.click()} style={chip(false)}>Foto</button>
        <button onClick={()=>fileDetail.current?.click()} style={chip(false)}>+ Particolare</button>
        <div style={{width:1, height:24, background:T.bdr, margin:"0 4px"}}/>
        <button onClick={()=>setTool("select")} style={chip(tool==="select")}>Sposta</button>
        <button onClick={()=>setTool("quota")} style={chip(tool==="quota")}>Quota</button>
      </div>

      <div style={{flex:1, position:"relative", background:"#1a1a1a", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center"}}>
        <canvas ref={cvRef} width={W} height={H}
          style={{width:"100%", height:"100%", maxWidth:"100vw", display:"block", touchAction:"none", cursor: tool==="select"?"default":"crosshair", objectFit:"contain"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        />
        <div style={{position:"absolute", top:10, right:10, display:"flex", flexDirection:"column", gap:6}}>
          {[
            {k:"tenda" as const, lab:"Tenda"},
            {k:"bracci" as const, lab:"Bracci"},
            {k:"aggancio" as const, lab:"Aggancio"}
          ].map(({k,lab})=>(
            <button key={k} onClick={()=>setShow({...show, [k]:!show[k]})}
              style={{padding:"5px 10px", borderRadius:999, border:"none",
                background: show[k]?T.acc:"rgba(255,255,255,0.85)",
                color: show[k]?"#fff":T.sub,
                fontSize:11, fontWeight:600, cursor:"pointer"}}>{lab}</button>
          ))}
        </div>
        {popup && (
          <div style={{position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:50, background:"#fff", border:"2px solid "+T.acc, borderRadius:12, padding:14, minWidth:260, boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:13, color:T.acc, fontWeight:600, marginBottom:8}}>{popup.title}</div>
            <input autoFocus value={popup.value} onChange={e=>setPopup({...popup, value:e.target.value})}
              onKeyDown={e=>{ if(e.key==="Enter") commitPopup(); if(e.key==="Escape") setPopup(null); }}
              style={{...inp, fontSize:15}} />
            <div style={{display:"flex", gap:6, marginTop:10, justifyContent:"flex-end"}}>
              <button onClick={()=>setPopup(null)} style={{padding:"7px 14px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:13, cursor:"pointer"}}>Annulla</button>
              <button onClick={commitPopup} style={{padding:"7px 14px", borderRadius:8, border:"none", background:T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>OK</button>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid "+T.bdr, background:"#fff", flexShrink:0}}>
        <div style={{display:"flex", padding:"6px 8px 0", gap:4}}>
          {[["modello","Modello"],["misure","Misure"]].map(([k,lab])=>(
            <button key={k} onClick={()=>setSheetOpen(sheetOpen===k?null:k as any)}
              style={{flex:1, padding:"10px 12px", border:"none", background:"transparent",
                borderBottom:"2px solid "+(sheetOpen===k?T.acc:"transparent"),
                color: sheetOpen===k?T.acc:T.sub,
                fontSize:13, fontWeight:600, cursor:"pointer"}}>
              {lab} {k==="modello" && active ? <span style={{opacity:0.6, fontSize:11}}>(T{activeIdx+1}: {MODELS.find(m=>m[0]===active.model)?.[1]})</span> : null}
            </button>
          ))}
        </div>

        {sheetOpen==="modello" && (
          <div style={{padding:"10px 12px 14px"}}>
            {!active ? (
              <div style={{fontSize:12, color:T.sub, marginBottom:8}}>Tocca un modello per aggiungere la prima tenda:</div>
            ) : (
              <div style={{fontSize:12, color:T.sub, marginBottom:8}}>Cambia modello per la tenda T{activeIdx+1}:</div>
            )}
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {MODELS.map(([id,lab])=>(
                <button key={id} onClick={()=>selezionaModello(id)} style={chip(active?.model===id)}>{lab}</button>
              ))}
            </div>
            {catalogo && catalogo.length>0 && (
              <div style={{marginTop:10, paddingTop:10, borderTop:"1px solid "+T.bdr}}>
                <div style={{fontSize:11, color:T.sub, marginBottom:6, fontWeight:600}}>Catalogo aziendale</div>
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  {catalogo.map(c=>(
                    <button key={c.id} onClick={()=>selezionaModello(c.tipo)} style={chip(false)}>{c.nome}{c.fornitore?` - ${c.fornitore}`:""}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sheetOpen==="misure" && active && (
          <div style={{padding:"10px 12px 14px"}}>
            <div style={{fontSize:11, color:T.sub, marginBottom:8}}>Misure tenda T{activeIdx+1}</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <div><label style={lbl}>Larghezza</label><input style={inp} type="number" placeholder="cm" value={active.misure.L||""} onChange={e=>updateActive({misure:{...active.misure, L:e.target.value}})} /></div>
              <div><label style={lbl}>Sporgenza</label><input style={inp} type="number" placeholder="cm" value={active.misure.S||""} onChange={e=>updateActive({misure:{...active.misure, S:e.target.value}})} /></div>
              <div><label style={lbl}>H attacco</label><input style={inp} type="number" placeholder="cm" value={active.misure.A||""} onChange={e=>updateActive({misure:{...active.misure, A:e.target.value}})} /></div>
              <div><label style={lbl}>Tipo muro</label>
                <select style={inp} value={active.misure.muro||""} onChange={e=>updateActive({misure:{...active.misure, muro:e.target.value}})}>
                  <option value="">---</option><option>Pieno</option><option>Forato</option><option>Cemento</option><option>Cappotto</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:8}}>
              <textarea rows={2} style={{...inp, resize:"vertical"}} placeholder="Note" value={active.misure.note||""} onChange={e=>updateActive({misure:{...active.misure, note:e.target.value}})} />
            </div>
          </div>
        )}
        {sheetOpen==="misure" && !active && (
          <div style={{padding:"10px 12px 14px", fontSize:12, color:T.sub}}>Aggiungi prima una tenda dal tab Modello.</div>
        )}
      </div>

      {lightbox && (
        <div onClick={e=>{ if((e.target as any).id==="lb") setLightbox(null); }} id="lb"
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{position:"relative", maxWidth:"95vw", maxHeight:"95vh"}}>
            <img src={lightbox.dataUrl} style={{maxWidth:"95vw", maxHeight:"85vh", display:"block", borderRadius:10}} />
            <div style={{color:"#fff", fontSize:14, textAlign:"center", marginTop:10}}>{lightbox.caption}</div>
            <button onClick={()=>setLightbox(null)} style={{position:"absolute", top:-12, right:-12, width:40, height:40, borderRadius:"50%", background:"#fff", border:"none", fontSize:20, cursor:"pointer"}}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}