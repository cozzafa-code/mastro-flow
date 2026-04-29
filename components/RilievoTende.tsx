"use client";
import React, { useState, useRef, useEffect } from "react";

const T = {
  bg: "#FFFFFF", card: "#FFFFFF", bdr: "#C8E4E4",
  acc: "#0F766E", accLt: "#E1F5EE", accDk: "#0A5A4F",
  text: "#0D1F1F", sub: "#5F7575",
  warn: "#D11A1A", arrow: "#E5A23A"
};

type Pt = { x:number; y:number };
type Braccio = { top:Pt; bot:Pt };
type Detail = { dataUrl:string; img:HTMLImageElement|null; anchor:Pt; thumb:{x:number;y:number;w:number;h:number}; caption:string };
type Quota = { p1:Pt; p2:Pt; label:string };
type CatalogoItem = { id:string; tipo:string; nome:string; fornitore?:string; png_url?:string; prezzo?:number };
type Props = { onClose:()=>void; onSave?:(data:any)=>void; initial?:any; catalogo?:CatalogoItem[] };

const MODELS:[string,string][] = [["cassonetto","Cassonetto"],["bracci","Solo telo"],["capottina","Capottina"],["caduta","A caduta"],["rullo","Rullo"]];

export default function RilievoTende({ onClose, onSave, initial, catalogo }: Props){
  const cvRef = useRef<HTMLCanvasElement>(null);
  const W = 640, H = 440;

  const [img, setImg] = useState<HTMLImageElement|null>(null);
  const [model, setModel] = useState<string|null>(initial?.model || null);
  const [tCorners, setTCorners] = useState<Pt[]|null>(initial?.tCorners || null);
  const [bracci, setBracci] = useState<Braccio[]|null>(initial?.bracci || null);
  const [aggancio, setAggancio] = useState<Pt[]>(initial?.aggancio || []);
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

  const [misure, setMisure] = useState({
    L: initial?.misure?.L || "",
    S: initial?.misure?.S || "",
    A: initial?.misure?.A || "",
    muro: initial?.misure?.muro || "",
    note: initial?.misure?.note || ""
  });

  const fileMain = useRef<HTMLInputElement>(null);
  const fileDetail = useRef<HTMLInputElement>(null);

  function defaultTenda():Pt[]{ return [{x:160,y:130},{x:480,y:130},{x:480,y:280},{x:160,y:280}]; }
  function defaultBracci(c:Pt[]):Braccio[]{
    return [
      {top:{x:c[0].x+10,y:c[0].y+15}, bot:{x:c[3].x+15,y:c[3].y-5}},
      {top:{x:c[1].x-10,y:c[1].y+15}, bot:{x:c[2].x-15,y:c[2].y-5}}
    ];
  }
  function defaultAggancio(c:Pt[]):Pt[]{
    return [{x:c[0].x+25,y:c[0].y-8},{x:(c[0].x+c[1].x)/2,y:(c[0].y+c[1].y)/2-8},{x:c[1].x-25,y:c[1].y-8}];
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
    if(show.tenda && model && tCorners){
      const xs=tCorners.map(p=>p.x), ys=tCorners.map(p=>p.y);
      const bw=Math.max(...xs)-Math.min(...xs), bh=Math.max(...ys)-Math.min(...ys);
      const src=tendaPNG(model, Math.max(120,bw), Math.max(80,bh));
      ctx.save(); ctx.globalAlpha=0.94; meshWarp(ctx, src, tCorners); ctx.restore();
      tCorners.forEach((p,i)=>{
        ctx.fillStyle=T.acc; ctx.beginPath(); ctx.arc(p.x,p.y,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#fff"; ctx.font="bold 10px sans-serif"; ctx.textAlign="center";
        ctx.fillText("T"+(i+1), p.x, p.y+3); ctx.textAlign="start";
      });
    }
    if(show.bracci && bracci) bracci.forEach((b,i)=>{
      ctx.save();
      ctx.strokeStyle="#666"; ctx.lineWidth=6; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(b.top.x,b.top.y); ctx.lineTo(b.bot.x,b.bot.y); ctx.stroke();
      ctx.fillStyle=T.arrow;
      ctx.beginPath(); ctx.arc(b.top.x,b.top.y,8,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(b.bot.x,b.bot.y,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.font="bold 9px sans-serif"; ctx.textAlign="center";
      ctx.fillText("B"+(i+1), b.top.x, b.top.y+3);
      ctx.fillText("B"+(i+1), b.bot.x, b.bot.y+3);
      ctx.textAlign="start"; ctx.restore();
    });
    if(show.aggancio) aggancio.forEach((a,i)=>{
      ctx.save();
      ctx.strokeStyle=T.warn; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(a.x,a.y,12,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a.x-9,a.y); ctx.lineTo(a.x+9,a.y);
      ctx.moveTo(a.x,a.y-9); ctx.lineTo(a.x,a.y+9); ctx.stroke();
      ctx.fillStyle=T.warn; ctx.beginPath(); ctx.arc(a.x,a.y,3,0,Math.PI*2); ctx.fill();
      ctx.font="bold 11px sans-serif"; ctx.textAlign="center";
      ctx.fillText("A"+(i+1), a.x+22, a.y-10); ctx.textAlign="start";
      ctx.restore();
    });
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

  // Touch nativi: useRef stale-closure-safe, registrato una sola volta
  const stateRef = useRef<any>(null);
  stateRef.current = { tCorners, bracci, aggancio, details, show, tool, model, popup, quotaPending };

  useEffect(()=>{
    const cv = cvRef.current; if(!cv) return;

    function getPosT(e:TouchEvent):Pt{
      const r = cv!.getBoundingClientRect();
      const sx = cv!.width/r.width, sy = cv!.height/r.height;
      const t = e.touches[0] || e.changedTouches[0];
      return { x:(t.clientX-r.left)*sx, y:(t.clientY-r.top)*sy };
    }
    function hitT(p:Pt){
      const s = stateRef.current;
      if(s.show.tenda && s.tCorners) for(let i=0;i<4;i++){
        if(Math.hypot(p.x-s.tCorners[i].x, p.y-s.tCorners[i].y)<=22) return {what:"tCorner",i};
      }
      if(s.show.bracci && s.bracci) for(let i=0;i<s.bracci.length;i++){
        if(Math.hypot(p.x-s.bracci[i].top.x, p.y-s.bracci[i].top.y)<=18) return {what:"bTop",i};
        if(Math.hypot(p.x-s.bracci[i].bot.x, p.y-s.bracci[i].bot.y)<=18) return {what:"bBot",i};
      }
      if(s.show.aggancio) for(let i=0;i<s.aggancio.length;i++){
        if(Math.hypot(p.x-s.aggancio[i].x, p.y-s.aggancio[i].y)<=20) return {what:"agg",i};
      }
      for(let i=s.details.length-1;i>=0;i--){ const d=s.details[i];
        if(p.x>=d.thumb.x && p.x<=d.thumb.x+d.thumb.w && p.y>=d.thumb.y && p.y<=d.thumb.y+d.thumb.h){
          if(Math.abs(p.x-(d.thumb.x+d.thumb.w))<14 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<14) return {what:"thumbResize",i};
          return {what:"thumbMove",i,ox:p.x-d.thumb.x,oy:p.y-d.thumb.y};
        }
      }
      return null;
    }

    const start = (e:TouchEvent)=>{
      e.preventDefault();
      const s = stateRef.current;
      if(s.popup) return;
      const p = getPosT(e);
      mouseRef.current = p;
      if(s.tool==="quota"){
        if(!s.quotaPending){ setQuotaPending(p); return; }
        const mx=(s.quotaPending.x+p.x)/2, my=(s.quotaPending.y+p.y)/2;
        setPopup({ kind:"quota", title:"Misura (es. 300 cm)", value:"", x:mx, y:my, payload:{p1:s.quotaPending, p2:p} });
        setQuotaPending(null);
        return;
      }
      const h = hitT(p);
      if(h) setDrag(h);
    };
    const move = (e:TouchEvent)=>{
      e.preventDefault();
      const s = stateRef.current;
      const p = getPosT(e);
      mouseRef.current = p;
      if(s.quotaPending){ render(); return; }
      const dr = (e as any)._drag || s_drag();
      function s_drag(){ return (window as any).__rilievo_drag; }
      // legge drag tramite chiusura via setDrag callback
    };
    cv.addEventListener("touchstart", start, {passive:false});
    cv.addEventListener("touchend", ()=>{ setDrag(null); });

    return ()=>{
      cv.removeEventListener("touchstart", start);
    };
  // eslint-disable-next-line
  },[]);

  // Touch move tramite ref-based state per evitare stale closure
  useEffect(()=>{
    const cv = cvRef.current; if(!cv) return;
    const move = (e:TouchEvent)=>{
      if(!drag) return;
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const sx = cv.width/r.width, sy = cv.height/r.height;
      const t = e.touches[0]; if(!t) return;
      const p = { x:(t.clientX-r.left)*sx, y:(t.clientY-r.top)*sy };
      mouseRef.current = p;
      if(drag.what==="tCorner" && tCorners){ const c=[...tCorners]; c[drag.i]=p; setTCorners(c); }
      else if(drag.what==="bTop" && bracci){ const b=[...bracci]; b[drag.i]={...b[drag.i], top:p}; setBracci(b); }
      else if(drag.what==="bBot" && bracci){ const b=[...bracci]; b[drag.i]={...b[drag.i], bot:p}; setBracci(b); }
      else if(drag.what==="agg"){ const a=[...aggancio]; a[drag.i]=p; setAggancio(a); }
      else if(drag.what==="anchor"){ const d=[...details]; d[drag.i]={...d[drag.i], anchor:p}; setDetails(d); }
      else if(drag.what==="thumbMove"){ const d=[...details]; d[drag.i]={...d[drag.i], thumb:{...d[drag.i].thumb, x:p.x-drag.ox, y:p.y-drag.oy}}; setDetails(d); }
      else if(drag.what==="thumbResize"){ const d=[...details]; d[drag.i]={...d[drag.i], thumb:{...d[drag.i].thumb, w:Math.max(60,p.x-d[drag.i].thumb.x), h:Math.max(45,p.y-d[drag.i].thumb.y)}}; setDetails(d); }
    };
    cv.addEventListener("touchmove", move, {passive:false});
    return ()=> cv.removeEventListener("touchmove", move);
  },[drag, tCorners, bracci, aggancio, details]);

  function getPos(e:any):Pt{
    const cv = cvRef.current!;
    const r = cv.getBoundingClientRect();
    const sx = cv.width/r.width, sy = cv.height/r.height;
    const cx = (e.clientX!=null?e.clientX:e.touches[0].clientX)-r.left;
    const cy = (e.clientY!=null?e.clientY:e.touches[0].clientY)-r.top;
    return {x:cx*sx, y:cy*sy};
  }
  function hitAny(p:Pt){
    for(let i=details.length-1;i>=0;i--){ const d=details[i];
      if(p.x>=d.thumb.x && p.x<=d.thumb.x+d.thumb.w && p.y>=d.thumb.y && p.y<=d.thumb.y+d.thumb.h){
        if(Math.abs(p.x-(d.thumb.x+d.thumb.w))<10 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<10) return {what:"thumbResize",i};
        return {what:"thumbMove",i,ox:p.x-d.thumb.x,oy:p.y-d.thumb.y};
      }
    }
    for(let i=0;i<details.length;i++){
      if(Math.hypot(p.x-details[i].anchor.x, p.y-details[i].anchor.y)<=12) return {what:"anchor",i};
    }
    if(show.aggancio) for(let i=0;i<aggancio.length;i++){
      if(Math.hypot(p.x-aggancio[i].x, p.y-aggancio[i].y)<=14) return {what:"agg",i};
    }
    if(show.bracci && bracci) for(let i=0;i<bracci.length;i++){
      if(Math.hypot(p.x-bracci[i].top.x, p.y-bracci[i].top.y)<=12) return {what:"bTop",i};
      if(Math.hypot(p.x-bracci[i].bot.x, p.y-bracci[i].bot.y)<=12) return {what:"bBot",i};
    }
    if(show.tenda && tCorners) for(let i=0;i<4;i++){
      if(Math.hypot(p.x-tCorners[i].x, p.y-tCorners[i].y)<=15) return {what:"tCorner",i};
    }
    return null;
  }

  function onDown(e:any){
    e.preventDefault();
    const p = getPos(e); mouseRef.current = p;
    if(popup) return;
    if(tool==="quota"){
      if(!quotaPending){ setQuotaPending(p); return; }
      const mx=(quotaPending.x+p.x)/2, my=(quotaPending.y+p.y)/2;
      setPopup({ kind:"quota", title:"Misura (es. 300 cm)", value:"", x:mx, y:my, payload:{p1:quotaPending, p2:p} });
      setQuotaPending(null);
      return;
    }
    const h = hitAny(p);
    if(h && h.what==="thumbMove"){ const d=details[h.i]; if(!(Math.abs(p.x-(d.thumb.x+d.thumb.w))<10 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<10)){ setLightbox(d); return; } }
    if(h) setDrag(h);
  }
  function onMove(e:any){
    const p = getPos(e); mouseRef.current = p;
    if(quotaPending){ render(); return; }
    if(!drag) return;
    if(drag.what==="tCorner" && tCorners){ const c=[...tCorners]; c[drag.i]=p; setTCorners(c); }
    else if(drag.what==="bTop" && bracci){ const b=[...bracci]; b[drag.i]={...b[drag.i], top:p}; setBracci(b); }
    else if(drag.what==="bBot" && bracci){ const b=[...bracci]; b[drag.i]={...b[drag.i], bot:p}; setBracci(b); }
    else if(drag.what==="agg"){ const a=[...aggancio]; a[drag.i]=p; setAggancio(a); }
    else if(drag.what==="anchor"){ const d=[...details]; d[drag.i]={...d[drag.i], anchor:p}; setDetails(d); }
    else if(drag.what==="thumbMove"){ const d=[...details]; d[drag.i]={...d[drag.i], thumb:{...d[drag.i].thumb, x:p.x-drag.ox, y:p.y-drag.oy}}; setDetails(d); }
    else if(drag.what==="thumbResize"){ const d=[...details]; d[drag.i]={...d[drag.i], thumb:{...d[drag.i].thumb, w:Math.max(60,p.x-d[drag.i].thumb.x), h:Math.max(45,p.y-d[drag.i].thumb.y)}}; setDetails(d); }
  }
  function onUp(){ setDrag(null); }

  function selectModel(m:string){
    setModel(m);
    const c = tCorners || defaultTenda();
    setTCorners(c);
    if(!bracci) setBracci(defaultBracci(c));
    if(!aggancio.length) setAggancio(defaultAggancio(c));
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
    if(onSave) onSave({ model, tCorners, bracci, aggancio, quote, misure, details: details.map(d=>({dataUrl:d.dataUrl, anchor:d.anchor, thumb:d.thumb, caption:d.caption})) });
    onClose();
  }

  // Stili base
  const chip = (active:boolean):React.CSSProperties => ({
    padding:"7px 12px", borderRadius:999, border:"1px solid "+(active?T.acc:T.bdr),
    background: active?T.accLt:"#fff", color: active?T.acc:T.text,
    fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0
  });
  const iconBtn:React.CSSProperties = {
    width:36, height:36, borderRadius:10, border:"1px solid "+T.bdr,
    background:"#fff", color:T.text, fontSize:16, cursor:"pointer",
    display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0
  };
  const lbl:React.CSSProperties = { fontSize:11, color:T.sub, display:"block", marginBottom:4, fontWeight:500 };
  const inp:React.CSSProperties = { width:"100%", fontSize:14, padding:"9px 10px", border:"1px solid "+T.bdr, borderRadius:8, background:"#fff", color:T.text, boxSizing:"border-box" };

  return (
    <div style={{position:"fixed", inset:0, background:"#fff", zIndex:9000, display:"flex", flexDirection:"column"}}>
      {/* HEADER sticky */}
      <div style={{padding:"10px 12px", borderBottom:"1px solid "+T.bdr, background:"#fff", display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
        <button onClick={onClose} style={{...iconBtn, border:"none", background:"transparent"}}>{"\u2190"}</button>
        <div style={{flex:1, fontSize:15, fontWeight:700, color:T.acc, lineHeight:1}}>Rilievo Tendaggio</div>
        <button onClick={saveAndClose} style={{padding:"8px 14px", borderRadius:8, border:"none", background:T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>Salva</button>
      </div>

      {/* TOOLBAR azioni */}
      <div style={{padding:"8px 12px", display:"flex", gap:6, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#fff", flexShrink:0, overflowX:"auto"}}>
        <input ref={fileMain} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>loadFile(e.target as HTMLInputElement, (im)=>setImg(im))} />
        <input ref={fileDetail} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>loadFile(e.target as HTMLInputElement, (im, url)=>{
          const idx=details.length;
          const draft:Detail = { img:im, dataUrl:url, anchor:{x:320,y:200}, thumb:{x:20+idx*30, y:20+idx*20, w:110, h:80}, caption:"" };
          setPopup({ kind:"caption", title:"Etichetta del particolare", value:"Particolare "+(idx+1), x:320, y:200, payload:draft });
          (e.target as HTMLInputElement).value="";
        })} />
        <button onClick={()=>fileMain.current?.click()} style={chip(false)}>{"\uD83D\uDCF7"} Foto</button>
        <button onClick={()=>fileDetail.current?.click()} style={chip(false)}>{"\u2295"} Particolare</button>
        <div style={{width:1, height:24, background:T.bdr, margin:"0 4px"}}/>
        <button onClick={()=>setTool("select")} style={chip(tool==="select")}>{"\u2725"} Sposta</button>
        <button onClick={()=>setTool("quota")} style={chip(tool==="quota")}>{"\uD83D\uDCCF"} Quota</button>
      </div>

      {/* CANVAS area */}
      <div style={{flex:1, position:"relative", background:"#1a1a1a", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center"}}>
        <canvas ref={cvRef} width={W} height={H}
          style={{width:"100%", height:"100%", maxWidth:"100vw", display:"block", touchAction:"none", cursor: tool==="select"?"default":"crosshair", objectFit:"contain"}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
        />

        {/* Layer toggle floating */}
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

        {/* Popup quota/caption */}
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

      {/* BOTTOM SHEET tabs */}
      <div style={{borderTop:"1px solid "+T.bdr, background:"#fff", flexShrink:0}}>
        <div style={{display:"flex", padding:"6px 8px 0", gap:4}}>
          {[["modello","Modello"],["misure","Misure"]].map(([k,lab])=>(
            <button key={k} onClick={()=>setSheetOpen(sheetOpen===k?null:k as any)}
              style={{flex:1, padding:"10px 12px", border:"none", background:"transparent",
                borderBottom:"2px solid "+(sheetOpen===k?T.acc:"transparent"),
                color: sheetOpen===k?T.acc:T.sub,
                fontSize:13, fontWeight:600, cursor:"pointer"}}>
              {lab} {k==="modello" && model ? <span style={{opacity:0.6, fontSize:11}}>({MODELS.find(m=>m[0]===model)?.[1]})</span> : null}
            </button>
          ))}
        </div>

        {sheetOpen==="modello" && (
          <div style={{padding:"10px 12px 14px", display:"flex", gap:6, flexWrap:"wrap"}}>
            {MODELS.map(([id,lab])=>(
              <button key={id} onClick={()=>selectModel(id)} style={chip(model===id)}>{lab}</button>
            ))}
            {model && (
              <button onClick={()=>{setModel(null); setTCorners(null); setBracci(null); setAggancio([]);}} style={{...chip(false), color:T.warn, borderColor:T.warn}}>Togli</button>
            )}
          </div>
        )}

        {sheetOpen==="misure" && (
          <div style={{padding:"10px 12px 14px"}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <div><label style={lbl}>Larghezza</label><input style={inp} type="number" placeholder="cm" value={misure.L} onChange={e=>setMisure({...misure, L:e.target.value})} /></div>
              <div><label style={lbl}>Sporgenza</label><input style={inp} type="number" placeholder="cm" value={misure.S} onChange={e=>setMisure({...misure, S:e.target.value})} /></div>
              <div><label style={lbl}>H attacco</label><input style={inp} type="number" placeholder="cm" value={misure.A} onChange={e=>setMisure({...misure, A:e.target.value})} /></div>
              <div><label style={lbl}>Tipo muro</label>
                <select style={inp} value={misure.muro} onChange={e=>setMisure({...misure, muro:e.target.value})}>
                  <option value="">---</option><option>Pieno</option><option>Forato</option><option>Cemento</option><option>Cappotto</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:8}}>
              <textarea rows={2} style={{...inp, resize:"vertical"}} placeholder="Note" value={misure.note} onChange={e=>setMisure({...misure, note:e.target.value})} />
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div onClick={e=>{ if((e.target as any).id==="lb") setLightbox(null); }} id="lb"
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{position:"relative", maxWidth:"95vw", maxHeight:"95vh"}}>
            <img src={lightbox.dataUrl} style={{maxWidth:"95vw", maxHeight:"85vh", display:"block", borderRadius:10}} />
            <div style={{color:"#fff", fontSize:14, textAlign:"center", marginTop:10}}>{lightbox.caption}</div>
            <button onClick={()=>setLightbox(null)} style={{position:"absolute", top:-12, right:-12, width:40, height:40, borderRadius:"50%", background:"#fff", border:"none", fontSize:20, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}