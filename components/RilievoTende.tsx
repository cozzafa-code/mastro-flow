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

const MODELS:Array<[string,string]> = [
  ["cassonetto","Cassonetto"],
  ["bracci","Solo telo"],
  ["capottina","Capottina"],
  ["caduta","A caduta"],
  ["rullo","Rullo"]
];

function uid(){ return "t_"+Math.random().toString(36).slice(2,9); }

function defaultCorners(offset:number):Pt[]{
  return [{x:160+offset,y:130},{x:480+offset,y:130},{x:480+offset,y:280},{x:160+offset,y:280}];
}
function defaultBracci(c:Pt[]):Braccio[]{
  return [
    {top:{x:c[0].x+10,y:c[0].y+15}, bot:{x:c[3].x+15,y:c[3].y-5}},
    {top:{x:c[1].x-10,y:c[1].y+15}, bot:{x:c[2].x-15,y:c[2].y-5}}
  ];
}
function defaultAggancio(c:Pt[]):Pt[]{
  return [
    {x:c[0].x+25,y:c[0].y-8},
    {x:(c[0].x+c[1].x)/2,y:(c[0].y+c[1].y)/2-8},
    {x:c[1].x-25,y:c[1].y-8}
  ];
}
function newTenda(model:string, offset:number):Tenda{
  const c = defaultCorners(offset);
  return { id: uid(), model, corners: c, bracci: defaultBracci(c), aggancio: defaultAggancio(c), misure:{} };
}

export default function RilievoTende(props: Props){
  const onClose = props.onClose;
  const onSave = props.onSave;
  const initial = props.initial;
  const catalogo = props.catalogo;

  const cvRef = useRef<HTMLCanvasElement>(null);
  const W = 640;
  const H = 440;

  const [img, setImg] = useState<HTMLImageElement|null>(null);
  const [tende, setTende] = useState<Tenda[]>(initial && initial.tende ? initial.tende : []);
  const [activeIdx, setActiveIdx] = useState<number>(initial && initial.tende && initial.tende.length ? 0 : -1);
  const [details, setDetails] = useState<Detail[]>([]);
  const [quote, setQuote] = useState<Quota[]>(initial && initial.quote ? initial.quote : []);
  const [show, setShow] = useState({ tenda:true, bracci:true, aggancio:true });
  const [tool, setTool] = useState<"select"|"quota">("select");
  const [drag, setDrag] = useState<any>(null);
  const [quotaPending, setQuotaPending] = useState<Pt|null>(null);
  const [popup, setPopup] = useState<any>(null);
  const [lightbox, setLightbox] = useState<Detail|null>(null);
  const [sheetOpen, setSheetOpen] = useState<"modello"|"misure"|null>("modello");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{x:number;y:number}>({x:0, y:0});
  const [dbg, setDbg] = useState<string>("");

  const mouseRef = useRef({x:0,y:0});
  const dragRef = useRef<any>(null);
  const pinchRef = useRef<any>(null);
  const zoomRef = useRef({zoom:1, pan:{x:0,y:0}});
  zoomRef.current = { zoom: zoom, pan: pan };

  const fileMain = useRef<HTMLInputElement>(null);
  const fileDetail = useRef<HTMLInputElement>(null);

  const active = activeIdx>=0 && activeIdx<tende.length ? tende[activeIdx] : null;

  function updateActive(patch: Partial<Tenda>){
    if(activeIdx<0) return;
    setTende(tende.map(function(t,i){ return i===activeIdx ? Object.assign({}, t, patch) : t; }));
  }

  function tendaPNG(m:string, w:number, h:number){
    const c = document.createElement("canvas");
    c.width = Math.max(80, Math.round(w));
    c.height = Math.max(60, Math.round(h));
    const x = c.getContext("2d");
    if(!x) return c;
    const W2 = c.width;
    const H2 = c.height;
    if(m==="cassonetto"){
      x.fillStyle="#E2DDCF"; x.fillRect(0,0,W2,18);
      x.strokeStyle="rgba(80,75,65,0.7)"; x.strokeRect(0,0,W2,18);
      const colori=["#E5D7B0","#D4C29A"];
      for(let i=0;i<10;i++){
        x.fillStyle=colori[i%2];
        x.beginPath();
        x.moveTo(W2*i/10,18);
        x.lineTo(W2*(i+1)/10,18);
        x.lineTo(W2*0.06+W2*0.88*(i+1)/10,H2-8);
        x.lineTo(W2*0.06+W2*0.88*i/10,H2-8);
        x.closePath();
        x.fill();
      }
    } else if(m==="bracci"){
      x.fillStyle="#3F6E8A";
      x.beginPath();
      x.moveTo(0,2); x.lineTo(W2,2);
      x.lineTo(W2*0.93,H2-8); x.lineTo(W2*0.07,H2-8);
      x.closePath(); x.fill();
    } else if(m==="capottina"){
      x.fillStyle="#2A8C8C";
      x.beginPath();
      x.moveTo(0,0); x.lineTo(W2,0); x.lineTo(W2,H2*0.4);
      x.quadraticCurveTo(W2/2,H2*1.05,0,H2*0.4);
      x.closePath(); x.fill();
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
  function drawTri(ctx:CanvasRenderingContext2D, image:HTMLCanvasElement, sT:Pt[], dT:Pt[]){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dT[0].x,dT[0].y);
    ctx.lineTo(dT[1].x,dT[1].y);
    ctx.lineTo(dT[2].x,dT[2].y);
    ctx.closePath();
    ctx.clip();
    const det=(sT[1].x-sT[0].x)*(sT[2].y-sT[0].y)-(sT[2].x-sT[0].x)*(sT[1].y-sT[0].y);
    if(Math.abs(det)<1e-6){ ctx.restore(); return; }
    const a=((dT[1].x-dT[0].x)*(sT[2].y-sT[0].y)-(dT[2].x-dT[0].x)*(sT[1].y-sT[0].y))/det;
    const b=((dT[2].x-dT[0].x)*(sT[1].x-sT[0].x)-(dT[1].x-dT[0].x)*(sT[2].x-sT[0].x))/det;
    const c2=((dT[1].y-dT[0].y)*(sT[2].y-sT[0].y)-(dT[2].y-dT[0].y)*(sT[1].y-sT[0].y))/det;
    const d2=((dT[2].y-dT[0].y)*(sT[1].x-sT[0].x)-(dT[1].y-dT[0].y)*(sT[2].x-sT[0].x))/det;
    const e=dT[0].x-a*sT[0].x-b*sT[0].y;
    const f=dT[0].y-c2*sT[0].x-d2*sT[0].y;
    ctx.transform(a,c2,b,d2,e,f);
    ctx.drawImage(image,0,0);
    ctx.restore();
  }
  function meshWarp(ctx:CanvasRenderingContext2D, src:HTMLCanvasElement, dst:Pt[]){
    const NX=10;
    const NY=6;
    for(let iy=0;iy<NY;iy++) for(let ix=0;ix<NX;ix++){
      const u0=ix/NX, u1=(ix+1)/NX, v0=iy/NY, v1=(iy+1)/NY;
      const s00={x:u0*src.width,y:v0*src.height};
      const s10={x:u1*src.width,y:v0*src.height};
      const s11={x:u1*src.width,y:v1*src.height};
      const s01={x:u0*src.width,y:v1*src.height};
      const d00=bilinear(dst,u0,v0);
      const d10=bilinear(dst,u1,v0);
      const d11=bilinear(dst,u1,v1);
      const d01=bilinear(dst,u0,v1);
      drawTri(ctx,src,[s00,s10,s11],[d00,d10,d11]);
      drawTri(ctx,src,[s00,s11,s01],[d00,d11,d01]);
    }
  }

  function render(){
    const cv = cvRef.current;
    if(!cv) return;
    const ctx = cv.getContext("2d");
    if(!ctx) return;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#1a1a1a";
    ctx.fillRect(0,0,W,H);
    ctx.setTransform(zoom,0,0,zoom,pan.x,pan.y);
    if(img){
      const ir=img.width/img.height;
      const cr=W/H;
      let dw, dh, ox, oy;
      if(ir>cr){ dw=W; dh=W/ir; ox=0; oy=(H-dh)/2; }
      else { dh=H; dw=H*ir; oy=0; ox=(W-dw)/2; }
      ctx.fillStyle="#F4F1EA";
      ctx.fillRect(0,0,W,H);
      ctx.drawImage(img,ox,oy,dw,dh);
    } else {
      ctx.fillStyle="#F4F1EA";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle=T.sub;
      ctx.font="13px sans-serif";
      ctx.textAlign="center";
      ctx.fillText("Tocca 'Foto' per iniziare", W/2, H/2);
      ctx.textAlign="start";
    }
    tende.forEach(function(t, idx){
      const isActive = idx===activeIdx;
      if(show.tenda){
        const xs = t.corners.map(function(p){ return p.x; });
        const ys = t.corners.map(function(p){ return p.y; });
        const bw=Math.max.apply(null,xs)-Math.min.apply(null,xs);
        const bh=Math.max.apply(null,ys)-Math.min.apply(null,ys);
        const src=tendaPNG(t.model, Math.max(120,bw), Math.max(80,bh));
        ctx.save();
        ctx.globalAlpha = isActive ? 0.94 : 0.7;
        meshWarp(ctx, src, t.corners);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = isActive ? T.acc : "rgba(15,118,110,0.4)";
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.setLineDash([5,3]);
        ctx.beginPath();
        ctx.moveTo(t.corners[0].x,t.corners[0].y);
        for(let i=1;i<4;i++) ctx.lineTo(t.corners[i].x,t.corners[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        const cx=(t.corners[0].x+t.corners[2].x)/2;
        const cy=(t.corners[0].y+t.corners[2].y)/2;
        ctx.fillStyle = isActive ? T.acc : "rgba(15,118,110,0.6)";
        ctx.beginPath();
        ctx.arc(cx,cy,16,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle="#fff";
        ctx.font="bold 14px sans-serif";
        ctx.textAlign="center";
        ctx.fillText(String(idx+1), cx, cy+5);
        ctx.textAlign="start";
        if(isActive){
          t.corners.forEach(function(p, i){
            ctx.fillStyle=T.acc;
            ctx.beginPath();
            ctx.arc(p.x,p.y,12,0,Math.PI*2);
            ctx.fill();
            ctx.fillStyle="#fff";
            ctx.font="bold 10px sans-serif";
            ctx.textAlign="center";
            ctx.fillText("T"+(i+1), p.x, p.y+3);
            ctx.textAlign="start";
          });
        }
        ctx.restore();
      }
      if(show.bracci) t.bracci.forEach(function(b, i){
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.strokeStyle="#666";
        ctx.lineWidth=6;
        ctx.lineCap="round";
        ctx.beginPath();
        ctx.moveTo(b.top.x,b.top.y);
        ctx.lineTo(b.bot.x,b.bot.y);
        ctx.stroke();
        if(isActive){
          ctx.fillStyle=T.arrow;
          ctx.beginPath();
          ctx.arc(b.top.x,b.top.y,10,0,Math.PI*2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(b.bot.x,b.bot.y,10,0,Math.PI*2);
          ctx.fill();
          ctx.fillStyle="#fff";
          ctx.font="bold 9px sans-serif";
          ctx.textAlign="center";
          ctx.fillText("B"+(i+1), b.top.x, b.top.y+3);
          ctx.fillText("B"+(i+1), b.bot.x, b.bot.y+3);
          ctx.textAlign="start";
        }
        ctx.restore();
      });
      if(show.aggancio) t.aggancio.forEach(function(a, i){
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.strokeStyle=T.warn;
        ctx.lineWidth=2.5;
        ctx.beginPath();
        ctx.arc(a.x,a.y,12,0,Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x-9,a.y);
        ctx.lineTo(a.x+9,a.y);
        ctx.moveTo(a.x,a.y-9);
        ctx.lineTo(a.x,a.y+9);
        ctx.stroke();
        ctx.fillStyle=T.warn;
        ctx.beginPath();
        ctx.arc(a.x,a.y,3,0,Math.PI*2);
        ctx.fill();
        if(isActive){
          ctx.font="bold 11px sans-serif";
          ctx.textAlign="center";
          ctx.fillText("A"+(i+1), a.x+22, a.y-10);
          ctx.textAlign="start";
        }
        ctx.restore();
      });
    });
    quote.forEach(function(q){
      ctx.save();
      ctx.strokeStyle=T.acc;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(q.p1.x,q.p1.y);
      ctx.lineTo(q.p2.x,q.p2.y);
      ctx.stroke();
      const dx=q.p2.x-q.p1.x;
      const dy=q.p2.y-q.p1.y;
      const len=Math.hypot(dx,dy)||1;
      const nx=-dy/len*8;
      const ny=dx/len*8;
      [q.p1,q.p2].forEach(function(p){
        ctx.beginPath();
        ctx.moveTo(p.x-nx,p.y-ny);
        ctx.lineTo(p.x+nx,p.y+ny);
        ctx.stroke();
      });
      if(q.label){
        const mx=(q.p1.x+q.p2.x)/2;
        const my=(q.p1.y+q.p2.y)/2;
        ctx.font="bold 13px sans-serif";
        const tw=ctx.measureText(q.label).width+14;
        ctx.fillStyle="#fff";
        ctx.fillRect(mx-tw/2,my-22,tw,20);
        ctx.strokeStyle=T.acc;
        ctx.strokeRect(mx-tw/2,my-22,tw,20);
        ctx.fillStyle=T.text;
        ctx.textAlign="center";
        ctx.fillText(q.label, mx, my-8);
        ctx.textAlign="start";
      }
      ctx.restore();
    });
    details.forEach(function(d, i){
      const tx=d.thumb.x;
      const ty=d.thumb.y;
      const tw=d.thumb.w;
      const th=d.thumb.h;
      ctx.save();
      ctx.strokeStyle=T.arrow;
      ctx.lineWidth=2;
      ctx.setLineDash([4,3]);
      ctx.beginPath();
      ctx.moveTo(d.anchor.x,d.anchor.y);
      ctx.lineTo(tx+tw/2,ty+th/2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=T.arrow;
      ctx.beginPath();
      ctx.arc(d.anchor.x,d.anchor.y,7,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#fff";
      ctx.font="bold 10px sans-serif";
      ctx.textAlign="center";
      ctx.fillText("P"+(i+1), d.anchor.x, d.anchor.y+3);
      ctx.textAlign="start";
      ctx.fillStyle="#fff";
      ctx.fillRect(tx-3,ty-3,tw+6,th+6);
      ctx.strokeStyle=T.arrow;
      ctx.lineWidth=3;
      ctx.strokeRect(tx-3,ty-3,tw+6,th+6);
      if(d.img) ctx.drawImage(d.img, tx, ty, tw, th);
      ctx.restore();
    });
    if(quotaPending){
      ctx.save();
      ctx.fillStyle=T.acc;
      ctx.beginPath();
      ctx.arc(quotaPending.x,quotaPending.y,6,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }
  useEffect(function(){ render(); });

  function getPosE(e:any):Pt{
    const cv = cvRef.current;
    if(!cv) return {x:0,y:0};
    const r = cv.getBoundingClientRect();
    const sx = cv.width/r.width;
    const sy = cv.height/r.height;
    const cx = (e.clientX != null ? e.clientX : e.touches[0].clientX) - r.left;
    const cy = (e.clientY != null ? e.clientY : e.touches[0].clientY) - r.top;
    const rx = cx*sx;
    const ry = cy*sy;
    return { x:(rx - pan.x)/zoom, y:(ry - pan.y)/zoom };
  }

  function inlineHit(p:Pt){
    const a = activeIdx>=0 ? tende[activeIdx] : null;
    if(a){
      if(show.tenda) for(let i=0;i<4;i++){
        if(Math.hypot(p.x-a.corners[i].x, p.y-a.corners[i].y)<=30) return {what:"tCorner", i:i};
      }
      if(show.bracci) for(let i=0;i<a.bracci.length;i++){
        if(Math.hypot(p.x-a.bracci[i].top.x, p.y-a.bracci[i].top.y)<=24) return {what:"bTop", i:i};
        if(Math.hypot(p.x-a.bracci[i].bot.x, p.y-a.bracci[i].bot.y)<=24) return {what:"bBot", i:i};
      }
      if(show.aggancio) for(let i=0;i<a.aggancio.length;i++){
        if(Math.hypot(p.x-a.aggancio[i].x, p.y-a.aggancio[i].y)<=26) return {what:"agg", i:i};
      }
    }
    for(let ti=0; ti<tende.length; ti++){
      if(ti===activeIdx) continue;
      const t = tende[ti];
      const xs = t.corners.map(function(pp){ return pp.x; });
      const ys = t.corners.map(function(pp){ return pp.y; });
      if(p.x>=Math.min.apply(null,xs) && p.x<=Math.max.apply(null,xs) && p.y>=Math.min.apply(null,ys) && p.y<=Math.max.apply(null,ys)){
        return {what:"selectTenda", i:ti};
      }
    }
    for(let i=details.length-1;i>=0;i--){
      const d=details[i];
      if(p.x>=d.thumb.x && p.x<=d.thumb.x+d.thumb.w && p.y>=d.thumb.y && p.y<=d.thumb.y+d.thumb.h){
        if(Math.abs(p.x-(d.thumb.x+d.thumb.w))<14 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<14) return {what:"thumbResize",i:i};
        return {what:"thumbMove",i:i,ox:p.x-d.thumb.x,oy:p.y-d.thumb.y};
      }
    }
    return null;
  }

  function handleDown(p:Pt){
    if(popup) return;
    if(tool==="quota"){
      if(!quotaPending){ setQuotaPending(p); return; }
      const mx=(quotaPending.x+p.x)/2;
      const my=(quotaPending.y+p.y)/2;
      setPopup({ kind:"quota", title:"Misura (es. 300 cm)", value:"", x:mx, y:my, payload:{p1:quotaPending, p2:p} });
      setQuotaPending(null);
      return;
    }
    const h = inlineHit(p);
    if(!h){ setDbg("tap "+p.x.toFixed(0)+","+p.y.toFixed(0)+" -> NESSUN HIT"); return; }
    if(h.what==="selectTenda"){ setActiveIdx(h.i); setDbg("seleziona tenda "+(h.i+1)); return; }
    dragRef.current = h;
    setDrag(h);
    setDbg("drag "+h.what+"#"+(h.i+1));
  }

  function applyDrag(p:Pt, dr:any){
    if(activeIdx<0) return;
    setTende(function(prev){
      return prev.map(function(t, i){
        if(i!==activeIdx) return t;
        if(dr.what==="tCorner"){ const c = t.corners.slice(); c[dr.i]=p; return Object.assign({}, t, {corners:c}); }
        if(dr.what==="bTop"){ const b = t.bracci.slice(); b[dr.i] = Object.assign({}, b[dr.i], {top:p}); return Object.assign({}, t, {bracci:b}); }
        if(dr.what==="bBot"){ const b = t.bracci.slice(); b[dr.i] = Object.assign({}, b[dr.i], {bot:p}); return Object.assign({}, t, {bracci:b}); }
        if(dr.what==="agg"){ const ag = t.aggancio.slice(); ag[dr.i]=p; return Object.assign({}, t, {aggancio:ag}); }
        return t;
      });
    });
  }

  // Mouse handlers
  function onMouseDown(e:any){ handleDown(getPosE(e)); }
  function onMouseMove(e:any){
    const p = getPosE(e);
    mouseRef.current = p;
    if(!dragRef.current) return;
    applyDrag(p, dragRef.current);
  }
  function onMouseUp(){ dragRef.current=null; setDrag(null); }

  // Touch handlers via useEffect (passive:false)
  useEffect(function(){
    const cv = cvRef.current;
    if(!cv) return;

    function getPosT(e:TouchEvent):Pt{
      const r = cv.getBoundingClientRect();
      const sx = cv.width/r.width;
      const sy = cv.height/r.height;
      const t = e.touches[0] || e.changedTouches[0];
      const cx = (t.clientX-r.left)*sx;
      const cy = (t.clientY-r.top)*sy;
      const z = zoomRef.current.zoom;
      const pn = zoomRef.current.pan;
      return { x:(cx - pn.x)/z, y:(cy - pn.y)/z };
    }

    let lastTap = 0;

    const onStart = function(e:TouchEvent){
      e.preventDefault();
      // Pinch start
      if(e.touches.length>=2){
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX-t1.clientX, t2.clientY-t1.clientY);
        const cx = (t1.clientX+t2.clientX)/2;
        const cy = (t1.clientY+t2.clientY)/2;
        pinchRef.current = { dist:dist, cx:cx, cy:cy, startZoom: zoomRef.current.zoom, startPan: Object.assign({}, zoomRef.current.pan) };
        dragRef.current = null;
        setDrag(null);
        setDbg("pinch start");
        return;
      }
      // Double-tap zoom
      const now = Date.now();
      if(now - lastTap < 300){
        const r = cv.getBoundingClientRect();
        const sx = cv.width/r.width;
        const sy = cv.height/r.height;
        const t = e.touches[0];
        const cx = (t.clientX-r.left)*sx;
        const cy = (t.clientY-r.top)*sy;
        const z = zoomRef.current.zoom;
        const newZoom = z >= 2.5 ? 1 : Math.min(3, z + 1);
        const newPanX = newZoom===1 ? 0 : cx - (cx - zoomRef.current.pan.x) * (newZoom/z);
        const newPanY = newZoom===1 ? 0 : cy - (cy - zoomRef.current.pan.y) * (newZoom/z);
        setZoom(newZoom);
        setPan({x:newPanX, y:newPanY});
        setDbg("double-tap zoom "+newZoom+"x");
        lastTap = 0;
        return;
      }
      lastTap = now;
      handleDown(getPosT(e));
    };

    const onMoveT = function(e:TouchEvent){
      e.preventDefault();
      // Pinch move
      if(e.touches.length>=2 && pinchRef.current){
        const pi = pinchRef.current;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX-t1.clientX, t2.clientY-t1.clientY);
        const ratio = newDist / pi.dist;
        const newZoom = Math.max(0.5, Math.min(5, pi.startZoom * ratio));
        const r = cv.getBoundingClientRect();
        const sx = cv.width/r.width;
        const sy = cv.height/r.height;
        const cxLocal = (pi.cx - r.left)*sx;
        const cyLocal = (pi.cy - r.top)*sy;
        const newPanX = cxLocal - (cxLocal - pi.startPan.x) * (newZoom/pi.startZoom);
        const newPanY = cyLocal - (cyLocal - pi.startPan.y) * (newZoom/pi.startZoom);
        setZoom(newZoom);
        setPan({x:newPanX, y:newPanY});
        return;
      }
      const dr = dragRef.current;
      if(!dr) return;
      const p = getPosT(e);
      mouseRef.current = p;
      applyDrag(p, dr);
    };

    const onEnd = function(e:TouchEvent){
      if(e.touches.length===0){
        dragRef.current = null;
        pinchRef.current = null;
        setDrag(null);
      } else if(e.touches.length===1 && pinchRef.current){
        pinchRef.current = null;
      }
    };

    cv.addEventListener("touchstart", onStart, {passive:false});
    cv.addEventListener("touchmove", onMoveT, {passive:false});
    cv.addEventListener("touchend", onEnd);
    cv.addEventListener("touchcancel", onEnd);
    return function(){
      cv.removeEventListener("touchstart", onStart);
      cv.removeEventListener("touchmove", onMoveT);
      cv.removeEventListener("touchend", onEnd);
      cv.removeEventListener("touchcancel", onEnd);
    };
  });

  function aggiungiTenda(model:string){
    const offset = tende.length * 30;
    const nuova = newTenda(model, offset);
    const nuoveTende = tende.concat([nuova]);
    setTende(nuoveTende);
    setActiveIdx(nuoveTende.length - 1);
  }
  function selezionaModello(m:string){
    if(activeIdx<0){ aggiungiTenda(m); return; }
    updateActive({ model: m });
  }
  function eliminaTendaAttiva(){
    if(activeIdx<0) return;
    const filtrate = tende.filter(function(_, i){ return i!==activeIdx; });
    setTende(filtrate);
    setActiveIdx(filtrate.length>0 ? Math.max(0, activeIdx-1) : -1);
  }
  function duplicaTendaAttiva(){
    if(!active) return;
    const off = 30;
    const dup:Tenda = {
      id: uid(),
      model: active.model,
      corners: active.corners.map(function(p){ return {x:p.x+off, y:p.y+off}; }),
      bracci: active.bracci.map(function(b){ return {top:{x:b.top.x+off,y:b.top.y+off}, bot:{x:b.bot.x+off,y:b.bot.y+off}}; }),
      aggancio: active.aggancio.map(function(p){ return {x:p.x+off,y:p.y+off}; }),
      misure: Object.assign({}, active.misure)
    };
    const nuove = tende.concat([dup]);
    setTende(nuove);
    setActiveIdx(nuove.length-1);
  }

  function loadFile(input:HTMLInputElement, cb:(im:HTMLImageElement, dataUrl:string)=>void){
    if(!input.files || !input.files[0]) return;
    const f = input.files[0];
    const r = new FileReader();
    r.onload = function(ev){
      const im = new Image();
      im.onload = function(){ cb(im, ev.target!.result as string); };
      im.src = ev.target!.result as string;
    };
    r.readAsDataURL(f);
  }

  function commitPopup(){
    if(!popup) return;
    const v = (popup.value||"").trim();
    if(popup.kind==="quota" && v){
      setQuote(quote.concat([{p1:popup.payload.p1, p2:popup.payload.p2, label:v}]));
    }
    if(popup.kind==="caption"){
      const d = Object.assign({}, popup.payload, { caption: v||"Particolare "+(details.length+1) });
      setDetails(details.concat([d]));
    }
    setPopup(null);
  }

  function saveAndClose(){
    if(onSave) onSave({
      tende: tende,
      quote: quote,
      details: details.map(function(d){
        return { dataUrl:d.dataUrl, anchor:d.anchor, thumb:d.thumb, caption:d.caption };
      })
    });
    onClose();
  }

  const chip = function(active:boolean):React.CSSProperties { return {
    padding:"7px 12px", borderRadius:999,
    border:"1px solid "+(active?T.acc:T.bdr),
    background: active?T.accLt:"#fff",
    color: active?T.acc:T.text,
    fontSize:12, fontWeight:600, cursor:"pointer",
    whiteSpace:"nowrap", flexShrink:0
  }};
  const lbl:React.CSSProperties = { fontSize:11, color:T.sub, display:"block", marginBottom:4, fontWeight:500 };
  const inp:React.CSSProperties = { width:"100%", fontSize:14, padding:"9px 10px", border:"1px solid "+T.bdr, borderRadius:8, background:"#fff", color:T.text, boxSizing:"border-box" };

  return (
    <div style={{position:"fixed", inset:0, background:"#fff", zIndex:9000, display:"flex", flexDirection:"column", paddingTop:"env(safe-area-inset-top)", paddingBottom:"env(safe-area-inset-bottom)", paddingLeft:"env(safe-area-inset-left)", paddingRight:"env(safe-area-inset-right)"}}>
      <div style={{padding:"10px 12px", borderBottom:"1px solid "+T.bdr, background:"#fff", display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
        <button onClick={onClose} style={{width:36, height:36, borderRadius:10, border:"none", background:"transparent", fontSize:20, cursor:"pointer"}}>{"\u2190"}</button>
        <div style={{flex:1, fontSize:15, fontWeight:700, color:T.acc}}>Rilievo Tendaggio</div>
        <button onClick={saveAndClose} style={{padding:"8px 14px", borderRadius:8, border:"none", background:T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>Salva</button>
      </div>

      <div style={{padding:"6px 8px", display:"flex", gap:4, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#FAFBFB", overflowX:"auto", flexShrink:0}}>
        {tende.map(function(t, i){ return (
          <button key={t.id} onClick={function(){ setActiveIdx(i); }}
            style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+(i===activeIdx?T.acc:T.bdr),
              background: i===activeIdx?T.acc:"#fff", color: i===activeIdx?"#fff":T.text,
              fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0,
              display:"flex", alignItems:"center", gap:6}}>
            <span style={{width:18, height:18, borderRadius:"50%", background: i===activeIdx?"#fff":T.accLt, color:T.acc, fontSize:11, display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:700}}>{i+1}</span>
            {(MODELS.find(function(m){ return m[0]===t.model; }) || ["",""])[1] || t.model}
          </button>
        );})}
        <button onClick={function(){ aggiungiTenda("cassonetto"); }}
          style={{padding:"6px 12px", borderRadius:8, border:"1px dashed "+T.acc, background:T.accLt, color:T.acc, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0}}>+ Tenda</button>
        {active && (
          <>
            <button onClick={duplicaTendaAttiva} style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:11, cursor:"pointer", flexShrink:0}}>{"\u29C9"}</button>
            <button onClick={eliminaTendaAttiva} style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+T.warn, background:"#fff", color:T.warn, fontSize:11, cursor:"pointer", flexShrink:0}}>{"\u00D7"}</button>
          </>
        )}
      </div>

      <div style={{padding:"8px 12px", display:"flex", gap:6, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#fff", flexShrink:0, overflowX:"auto"}}>
        <input ref={fileMain} type="file" accept="image/*" capture="environment" style={{display:"none"}}
          onChange={function(e){ loadFile(e.target as HTMLInputElement, function(im){ setImg(im); }); }} />
        <input ref={fileDetail} type="file" accept="image/*" capture="environment" style={{display:"none"}}
          onChange={function(e){
            loadFile(e.target as HTMLInputElement, function(im, url){
              const idx = details.length;
              const draft:Detail = { img:im, dataUrl:url, anchor:{x:320,y:200}, thumb:{x:20+idx*30, y:20+idx*20, w:110, h:80}, caption:"" };
              setPopup({ kind:"caption", title:"Etichetta del particolare", value:"Particolare "+(idx+1), x:320, y:200, payload:draft });
              (e.target as HTMLInputElement).value="";
            });
          }} />
        <button onClick={function(){ fileMain.current && fileMain.current.click(); }} style={chip(false)}>Foto</button>
        <button onClick={function(){ fileDetail.current && fileDetail.current.click(); }} style={chip(false)}>+ Particolare</button>
        <div style={{width:1, height:24, background:T.bdr, margin:"0 4px"}}/>
        <button onClick={function(){ setTool("select"); }} style={chip(tool==="select")}>Sposta</button>
        <button onClick={function(){ setTool("quota"); }} style={chip(tool==="quota")}>Quota</button>
      </div>

      <div style={{flex:1, position:"relative", background:"#1a1a1a", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center"}}>
        <canvas ref={cvRef} width={W} height={H}
          style={{width:"100%", height:"100%", maxWidth:"100vw", display:"block", touchAction:"none", cursor: tool==="select"?"default":"crosshair", objectFit:"contain"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        />

        <div style={{position:"absolute", bottom:10, left:10, display:"flex", gap:6, zIndex:5}}>
          <button onClick={function(){ const z=Math.max(0.5, zoom-0.25); setZoom(z); }} style={{width:36, height:36, borderRadius:8, border:"none", background:"rgba(255,255,255,0.9)", color:T.text, fontSize:18, fontWeight:700, cursor:"pointer"}}>-</button>
          <div style={{minWidth:48, padding:"6px 10px", borderRadius:8, background:"rgba(255,255,255,0.9)", color:T.text, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center"}}>{Math.round(zoom*100)}%</div>
          <button onClick={function(){ const z=Math.min(5, zoom+0.25); setZoom(z); }} style={{width:36, height:36, borderRadius:8, border:"none", background:"rgba(255,255,255,0.9)", color:T.text, fontSize:18, fontWeight:700, cursor:"pointer"}}>+</button>
          <button onClick={function(){ setZoom(1); setPan({x:0,y:0}); }} style={{padding:"6px 10px", borderRadius:8, border:"none", background:"rgba(255,255,255,0.9)", color:T.text, fontSize:11, fontWeight:600, cursor:"pointer"}}>Reset</button>
        </div>

        <div style={{position:"absolute", top:10, right:10, display:"flex", flexDirection:"column", gap:6}}>
          {[{k:"tenda",lab:"Tenda"},{k:"bracci",lab:"Bracci"},{k:"aggancio",lab:"Aggancio"}].map(function(o){
            const k = o.k as keyof typeof show;
            return (
              <button key={k} onClick={function(){ setShow(Object.assign({}, show, {[k]: !show[k]})); }}
                style={{padding:"5px 10px", borderRadius:999, border:"none",
                  background: show[k]?T.acc:"rgba(255,255,255,0.85)",
                  color: show[k]?"#fff":T.sub,
                  fontSize:11, fontWeight:600, cursor:"pointer"}}>{o.lab}</button>
            );
          })}
        </div>

        {popup && (
          <div style={{position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:50, background:"#fff", border:"2px solid "+T.acc, borderRadius:12, padding:14, minWidth:260, boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:13, color:T.acc, fontWeight:600, marginBottom:8}}>{popup.title}</div>
            <input autoFocus value={popup.value} onChange={function(e){ setPopup(Object.assign({}, popup, {value:e.target.value})); }}
              onKeyDown={function(e){ if(e.key==="Enter") commitPopup(); if(e.key==="Escape") setPopup(null); }}
              style={Object.assign({}, inp, {fontSize:15})} />
            <div style={{display:"flex", gap:6, marginTop:10, justifyContent:"flex-end"}}>
              <button onClick={function(){ setPopup(null); }} style={{padding:"7px 14px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:13, cursor:"pointer"}}>Annulla</button>
              <button onClick={commitPopup} style={{padding:"7px 14px", borderRadius:8, border:"none", background:T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>OK</button>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid "+T.bdr, background:"#fff", flexShrink:0}}>
        <div style={{display:"flex", padding:"6px 8px 0", gap:4}}>
          {[["modello","Modello"],["misure","Misure"]].map(function(item){
            const k = item[0] as "modello"|"misure";
            const lab = item[1];
            return (
              <button key={k} onClick={function(){ setSheetOpen(sheetOpen===k?null:k); }}
                style={{flex:1, padding:"10px 12px", border:"none", background:"transparent",
                  borderBottom:"2px solid "+(sheetOpen===k?T.acc:"transparent"),
                  color: sheetOpen===k?T.acc:T.sub,
                  fontSize:13, fontWeight:600, cursor:"pointer"}}>
                {lab}
              </button>
            );
          })}
        </div>

        {sheetOpen==="modello" && (
          <div style={{padding:"10px 12px 14px"}}>
            <div style={{fontSize:12, color:T.sub, marginBottom:8}}>{!active ? "Tocca un modello per aggiungere la prima tenda:" : "Cambia modello tenda T"+(activeIdx+1)+":"}</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {MODELS.map(function(m){
                const id = m[0];
                const lab = m[1];
                return <button key={id} onClick={function(){ selezionaModello(id); }} style={chip(active && active.model===id)}>{lab}</button>;
              })}
            </div>
            {catalogo && catalogo.length>0 && (
              <div style={{marginTop:10, paddingTop:10, borderTop:"1px solid "+T.bdr}}>
                <div style={{fontSize:11, color:T.sub, marginBottom:6, fontWeight:600}}>Catalogo aziendale</div>
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  {catalogo.map(function(c){
                    return <button key={c.id} onClick={function(){ selezionaModello(c.tipo); }} style={chip(false)}>{c.nome}{c.fornitore?" - "+c.fornitore:""}</button>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {sheetOpen==="misure" && active && (
          <div style={{padding:"10px 12px 14px"}}>
            <div style={{fontSize:11, color:T.sub, marginBottom:8}}>Misure tenda T{activeIdx+1}</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <div><label style={lbl}>Larghezza</label><input style={inp} type="number" placeholder="cm" value={active.misure.L||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {L:e.target.value})}); }} /></div>
              <div><label style={lbl}>Sporgenza</label><input style={inp} type="number" placeholder="cm" value={active.misure.S||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {S:e.target.value})}); }} /></div>
              <div><label style={lbl}>H attacco</label><input style={inp} type="number" placeholder="cm" value={active.misure.A||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {A:e.target.value})}); }} /></div>
              <div><label style={lbl}>Tipo muro</label>
                <select style={inp} value={active.misure.muro||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {muro:e.target.value})}); }}>
                  <option value="">---</option><option>Pieno</option><option>Forato</option><option>Cemento</option><option>Cappotto</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:8}}>
              <textarea rows={2} style={Object.assign({}, inp, {resize:"vertical"})} placeholder="Note" value={active.misure.note||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {note:e.target.value})}); }} />
            </div>
          </div>
        )}
        {sheetOpen==="misure" && !active && (
          <div style={{padding:"10px 12px 14px", fontSize:12, color:T.sub}}>Aggiungi prima una tenda dal tab Modello.</div>
        )}
      </div>

      {dbg && (
        <div style={{position:"fixed", bottom:8, left:8, right:8, zIndex:9998, background:"rgba(0,0,0,0.85)", color:"#9FE1CB", padding:"6px 10px", borderRadius:6, fontSize:11, fontFamily:"monospace", pointerEvents:"none"}}>
          DBG: {dbg}
        </div>
      )}

      {lightbox && (
        <div onClick={function(e){ if((e.target as any).id==="lb") setLightbox(null); }} id="lb"
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{position:"relative", maxWidth:"95vw", maxHeight:"95vh"}}>
            <img src={lightbox.dataUrl} style={{maxWidth:"95vw", maxHeight:"85vh", display:"block", borderRadius:10}} />
            <div style={{color:"#fff", fontSize:14, textAlign:"center", marginTop:10}}>{lightbox.caption}</div>
            <button onClick={function(){ setLightbox(null); }} style={{position:"absolute", top:-12, right:-12, width:40, height:40, borderRadius:"50%", background:"#fff", border:"none", fontSize:20, cursor:"pointer"}}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}
