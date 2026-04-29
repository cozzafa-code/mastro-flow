"use client";
import React, { useState, useRef, useEffect } from "react";

const T = {
  bg: "#FFFFFF", card: "#FFFFFF", bdr: "#C8E4E4",
  acc: "#0F766E", accLt: "#E1F5EE", text: "#0D1F1F", sub: "#5F7575",
  warn: "#D11A1A", arrow: "#E5A23A"
};

type Pt = { x:number; y:number };
type Braccio = { top:Pt; bot:Pt };
type Detail = { dataUrl:string; img:HTMLImageElement|null; anchor:Pt; thumb:{x:number;y:number;w:number;h:number}; caption:string };
type Quota = { p1:Pt; p2:Pt; label:string };
type Props = { onClose:()=>void; onSave?:(data:any)=>void; initial?:any };

export default function RilievoTende({ onClose, onSave, initial }: Props){
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
      ctx.fillStyle="#F1EFE8"; ctx.fillRect(0,0,W,H);
      ctx.drawImage(img,ox,oy,dw,dh);
    } else {
      ctx.fillStyle="#F1EFE8"; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#888"; ctx.font="14px sans-serif"; ctx.textAlign="center";
      ctx.fillText("Carica una foto del punto di installazione", W/2, H/2);
      ctx.textAlign="start";
    }
    if(show.tenda && model && model!=="none" && tCorners){
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
    if(m==="none"){ setTCorners(null); setBracci(null); setAggancio([]); return; }
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

  const btn:React.CSSProperties = { padding:"6px 12px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", color:T.text, fontSize:13, cursor:"pointer" };
  const btnAcc:React.CSSProperties = { ...btn, background:T.accLt, color:T.acc, borderColor:T.acc };
  const lbl:React.CSSProperties = { fontSize:12, color:T.sub, display:"block", marginBottom:3 };
  const inp:React.CSSProperties = { width:"100%", fontSize:13, padding:"6px 8px", border:"1px solid "+T.bdr, borderRadius:6, background:"#fff", color:T.text };

  return (
    <div style={{position:"fixed", inset:0, background:"#fff", zIndex:9000, overflow:"auto", padding:16}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
        <div style={{fontSize:16, fontWeight:700, color:T.acc}}>Rilievo Tendaggio</div>
        <button onClick={onClose} style={{...btn, marginLeft:"auto"}}>Chiudi</button>
        <button onClick={saveAndClose} style={btnAcc}>Salva</button>
      </div>

      <div style={{display:"flex", gap:8, marginBottom:10, flexWrap:"wrap"}}>
        <input ref={fileMain} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target as HTMLInputElement, (im)=>setImg(im))} />
        <input ref={fileDetail} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target as HTMLInputElement, (im, url)=>{
          const idx=details.length;
          const draft:Detail = { img:im, dataUrl:url, anchor:{x:320,y:200}, thumb:{x:20+idx*30, y:20+idx*20, w:110, h:80}, caption:"" };
          setPopup({ kind:"caption", title:"Etichetta del particolare", value:"Particolare "+(idx+1), x:320, y:200, payload:draft });
          (e.target as HTMLInputElement).value="";
        })} />
        <button onClick={()=>fileMain.current?.click()} style={btn}>Carica foto</button>
        <button onClick={()=>fileDetail.current?.click()} style={btn}>+ Particolare</button>
      </div>

      <div style={{display:"flex", gap:6, marginBottom:8, flexWrap:"wrap", alignItems:"center"}}>
        <button onClick={()=>setTool("select")} style={tool==="select"?btnAcc:btn}>Sposta</button>
        <button onClick={()=>setTool("quota")} style={tool==="quota"?btnAcc:btn}>Quota</button>
        <label style={{fontSize:13, display:"flex", alignItems:"center", gap:4}}><input type="checkbox" checked={show.tenda} onChange={e=>setShow({...show, tenda:e.target.checked})}/>Tenda</label>
        <label style={{fontSize:13, display:"flex", alignItems:"center", gap:4}}><input type="checkbox" checked={show.bracci} onChange={e=>setShow({...show, bracci:e.target.checked})}/>Bracci</label>
        <label style={{fontSize:13, display:"flex", alignItems:"center", gap:4}}><input type="checkbox" checked={show.aggancio} onChange={e=>setShow({...show, aggancio:e.target.checked})}/>Aggancio</label>
      </div>

      <div style={{position:"relative", background:"#F4F4F1", borderRadius:12, padding:12}}>
        <canvas ref={cvRef} width={W} height={H}
          style={{width:"100%", maxWidth:W+"px", display:"block", background:"#fff", borderRadius:8, border:"1px solid "+T.bdr, cursor: tool==="select"?"default":"crosshair"}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
        {popup && (
          <div style={{position:"absolute", left:Math.max(8, popup.x-110)+"px", top:Math.max(8, popup.y-60)+"px", zIndex:50, background:"#fff", border:"2px solid "+T.acc, borderRadius:8, padding:10, minWidth:220}}>
            <div style={{fontSize:12, color:T.acc, fontWeight:600, marginBottom:6}}>{popup.title}</div>
            <input autoFocus value={popup.value} onChange={e=>setPopup({...popup, value:e.target.value})}
              onKeyDown={e=>{ if(e.key==="Enter") commitPopup(); if(e.key==="Escape") setPopup(null); }}
              style={{...inp, fontSize:14}} />
            <div style={{display:"flex", gap:6, marginTop:8, justifyContent:"flex-end"}}>
              <button onClick={()=>setPopup(null)} style={btn}>Annulla</button>
              <button onClick={commitPopup} style={btnAcc}>OK</button>
            </div>
          </div>
        )}
      </div>

      <div style={{marginTop:10, padding:"10px 12px", border:"1px solid "+T.bdr, borderRadius:8, background:"#fff"}}>
        <div style={{fontSize:13, marginBottom:8, fontWeight:600, color:T.text}}>Modello</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {[["cassonetto","Cassonetto"],["bracci","Solo telo"],["capottina","Capottina"],["caduta","A caduta"],["rullo","Rullo"],["none","Togli"]].map(([id,lab])=>(
            <button key={id} onClick={()=>selectModel(id)} style={model===id?btnAcc:btn}>{lab}</button>
          ))}
        </div>
      </div>

      <div style={{marginTop:10, padding:"10px 12px", border:"1px solid "+T.bdr, borderRadius:8, background:"#fff"}}>
        <div style={{fontSize:13, marginBottom:10, fontWeight:600, color:T.text}}>Misure</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10}}>
          <div><label style={lbl}>Larghezza (cm)</label><input style={inp} type="number" placeholder="es. 300" value={misure.L} onChange={e=>setMisure({...misure, L:e.target.value})} /></div>
          <div><label style={lbl}>Sporgenza (cm)</label><input style={inp} type="number" placeholder="es. 250" value={misure.S} onChange={e=>setMisure({...misure, S:e.target.value})} /></div>
          <div><label style={lbl}>H attacco (cm)</label><input style={inp} type="number" placeholder="es. 280" value={misure.A} onChange={e=>setMisure({...misure, A:e.target.value})} /></div>
          <div><label style={lbl}>Tipo muro</label>
            <select style={inp} value={misure.muro} onChange={e=>setMisure({...misure, muro:e.target.value})}>
              <option value="">---</option><option>Pieno</option><option>Forato</option><option>Cemento</option><option>Cappotto</option>
            </select>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <label style={lbl}>Note</label>
          <textarea rows={2} style={{...inp, resize:"vertical"}} value={misure.note} onChange={e=>setMisure({...misure, note:e.target.value})} />
        </div>
      </div>

      {lightbox && (
        <div onClick={e=>{ if((e.target as any).id==="lb") setLightbox(null); }} id="lb"
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{position:"relative", maxWidth:"90vw", maxHeight:"90vh"}}>
            <img src={lightbox.dataUrl} style={{maxWidth:"90vw", maxHeight:"80vh", display:"block", borderRadius:8}} />
            <div style={{color:"#fff", fontSize:14, textAlign:"center", marginTop:10}}>{lightbox.caption}</div>
            <button onClick={()=>setLightbox(null)} style={{position:"absolute", top:-10, right:-10, width:36, height:36, borderRadius:"50%", background:"#fff", border:"none", fontSize:18, cursor:"pointer"}}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}