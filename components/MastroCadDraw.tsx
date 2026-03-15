"use client";
// @ts-nocheck
// MASTRO CAD DRAW v3 — Rendering Solido + TECNICO/RENDER + Numpad + Foto
import React, { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  onClose: () => void;
  onSalva?: (data: any) => void;
  onMisureUpdate?: (misure: { lCentro: number; hCentro: number }) => void;
  vanoNome?: string;
  vanoId?: any;
  misureIniziali?: { lCentro?: number; hCentro?: number };
}

const PROF: any = {
  telaio:   { n:"Telaio",    sp:60, zOrder:0, tCol:"#3a5a7a", rFill:"#3a5a7a", rCol:"#5a8ab0" },
  anta:     { n:"Anta",      sp:50, zOrder:1, tCol:"#2a5070", rFill:"#243a54", rCol:"#3a6a90" },
  montante: { n:"Montante",  sp:58, zOrder:0, tCol:"#3a5a7a", rFill:"#3a5a7a", rCol:"#5a8ab0" },
  traverso: { n:"Traverso",  sp:52, zOrder:0, tCol:"#3a5a7a", rFill:"#3a5a7a", rCol:"#5a8ab0" },
  soglia:   { n:"Soglia",    sp:38, zOrder:0, tCol:"#4a6a5a", rFill:"#3a5a4a", rCol:"#5a8a6a" },
  ferro:    { n:"Ferro",     sp:40, zOrder:0, tCol:"#6a5a4a", rFill:"#5a4a3a", rCol:"#8a7a6a" },
  legno:    { n:"Legno",     sp:68, zOrder:0, tCol:"#8a6a40", rFill:"#7a5a30", rCol:"#aa8a58" },
  free:     { n:"Libero",    sp:0,  zOrder:2, tCol:"#D08008", rFill:"#a06000", rCol:"#D08008" },
};

const APERT: any = {
  fisso:"Fisso", anta_dx:"Anta →", anta_sx:"← Anta",
  scor_dx:"Scorr →", scor_sx:"← Scorr", vasistas:"Vasistas", vuoto:"Vuoto",
};

const JOIN: any = { deg45:"45°", deg90:"90°", butt:"Battuta" };

const AMB = "#D08008", GRN = "#1A9E73", RED = "#DC4444", BLU = "#3B7FE0";

export default function MastroCadDraw({ onClose, onSalva, onMisureUpdate, vanoNome, vanoId, misureIniziali }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const S = useRef<any>({
    mode: "tecnico",
    tool: "line", snap: { grid: false, angle: true, obj: false },
    pts: [], objects: [], history: [],
    selIdx: -1, hoverMm: null,
    cal: { mmPerPx: 1, calibrated: false },
    calibMode: false, calibPts: [],
    curProf: "telaio", curJoin: "deg45", curApert: "fisso",
    zoom: 1, pan: { x: 70, y: 70 },
    bgImage: null, bgOpacity: 0.5,
    npValue: "", npTarget: null,
    lastTap: 0,
  });

  const [mode, setModeState] = useState<"tecnico"|"render">("tecnico");
  const [tool, setToolState] = useState("line");
  const [snap, setSnapState] = useState({ grid: false, angle: true, obj: false });
  const [calibrated, setCalibrated] = useState(false);
  const [showCalibModal, setShowCalibModal] = useState(false);
  const [calibStep, setCalibStep] = useState<"intro"|"draw"|"input">("intro");
  const [calibInputMm, setCalibInputMm] = useState("1000");
  const [misureEstratte, setMisureEstratte] = useState<{L:number,H:number}|null>(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npLabel, setNpLabel] = useState("Quota (mm)");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<any>(null);
  const [bgOpacity, setBgOpacity] = useState(50);
  const [objCount, setObjCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── CANVAS SETUP ───────────────────────────────────────
  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    // Touch events non-passive per preventDefault
    const cvs = canvasRef.current;
    if (cvs) {
      const opts = { passive: false };
      cvs.addEventListener("touchmove", onMove as any, opts);
      cvs.addEventListener("touchend", onTap as any, opts);
      return () => {
        cvs.removeEventListener("touchmove", onMove as any);
        cvs.removeEventListener("touchend", onTap as any);
        window.removeEventListener("resize", resize);
      };
    }
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => { S.current.bgOpacity = bgOpacity / 100; draw(); }, [bgOpacity]);

  function resize() {
    if (!canvasRef.current || !wrapRef.current) return;
    const w = wrapRef.current.clientWidth - (showNumpad ? 180 : 0);
    const h = wrapRef.current.clientHeight;
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    draw();
  }

  // ── COORD ──────────────────────────────────────────────
  const pxToMm = (px: number) => px * S.current.cal.mmPerPx;
  const mmToPx = (mm: number) => mm / S.current.cal.mmPerPx;
  const s2m = (sx: number, sy: number) => ({ x: pxToMm((sx - S.current.pan.x) / S.current.zoom), y: pxToMm((sy - S.current.pan.y) / S.current.zoom) });
  const m2s = (mx: number, my: number) => ({ x: mmToPx(mx) * S.current.zoom + S.current.pan.x, y: mmToPx(my) * S.current.zoom + S.current.pan.y });
  const dst = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  // ── SNAP ───────────────────────────────────────────────
  function applySnap(mx: number, my: number, prev: any) {
    const { snap: sn } = S.current;
    let rx = mx, ry = my;
    if (sn.grid) { const g = 50; rx = Math.round(rx/g)*g; ry = Math.round(ry/g)*g; }
    if (sn.angle && prev) {
      const dx = rx-prev.x, dy = ry-prev.y, len = Math.sqrt(dx*dx+dy*dy);
      if (len > 2) {
        const ang = Math.atan2(dy,dx)*180/Math.PI;
        const snaps = [0,45,90,135,180,-135,-90,-45];
        let best = snaps[0], bd = 999;
        snaps.forEach(a => { const d=Math.abs(ang-a); if(d<bd){bd=d;best=a;} });
        if (bd < 10) { const r=best*Math.PI/180; rx=prev.x+Math.round(len*Math.cos(r)); ry=prev.y+Math.round(len*Math.sin(r)); }
      }
    }
    if (sn.obj) {
      S.current.objects.forEach((o: any) => o.pts.forEach((p: any) => { if(dst(p,{x:rx,y:ry})<15){rx=p.x;ry=p.y;} }));
    }
    return { x: rx, y: ry };
  }

  // ══════════════════════════════════════════════════════
  // DRAW
  // ══════════════════════════════════════════════════════
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const { mode: m, objects: objs, pts: pts2, hoverMm, bgImage, bgOpacity: bgo, snap: sn } = S.current;
    const W = cvs.width, H = cvs.height;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = m === "tecnico" ? "#ffffff" : "#1a1c22";
    ctx.fillRect(0,0,W,H);

    // Punti calibrazione in corso
    if (S.current.calibMode && S.current.calibPts.length > 0) {
      S.current.calibPts.forEach((p: any) => {
        const s = m2s(p.x, p.y);
        ctx.beginPath(); ctx.arc(s.x,s.y,7,0,Math.PI*2);
        ctx.fillStyle=AMB; ctx.fill();
        ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
      });
      if (S.current.calibPts.length===2) {
        const s1=m2s(S.current.calibPts[0].x,S.current.calibPts[0].y);
        const s2=m2s(S.current.calibPts[1].x,S.current.calibPts[1].y);
        ctx.beginPath(); ctx.moveTo(s1.x,s1.y); ctx.lineTo(s2.x,s2.y);
        ctx.strokeStyle=AMB; ctx.lineWidth=2.5; ctx.setLineDash([8,4]); ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // Foto sfondo
    if (bgImage) {
      ctx.save(); ctx.globalAlpha = bgo;
      const ar = bgImage.width/bgImage.height;
      let bw=W, bh=W/ar;
      if (bh<H) { bh=H; bw=H*ar; }
      ctx.drawImage(bgImage,(W-bw)/2,(H-bh)/2,bw,bh);
      ctx.restore();
    }

    // Griglia
    if (sn.grid) drawGrid(ctx, m);

    // Oggetti per z-order
    const sorted = [...objs].map((o: any, i: number) => ({o,i})).sort((a: any,b: any) => (PROF[a.o.prof]?.zOrder||0)-(PROF[b.o.prof]?.zOrder||0));
    sorted.forEach(({o,i}: any) => drawObj(ctx, o, i===S.current.selIdx, m));

    // In progress
    if (pts2.length > 0) drawInProgress(ctx, pts2, hoverMm, m);

    // Crosshair
    if (hoverMm) drawCross(ctx, hoverMm, m);
  }, []);

  function drawGrid(ctx: any, m: string) {
    const gPx = mmToPx(50) * S.current.zoom;
    ctx.strokeStyle = m==="tecnico" ? "#e8edf0" : "#1e2028"; ctx.lineWidth = 0.4;
    const ox = S.current.pan.x % gPx, oy = S.current.pan.y % gPx;
    for(let x=ox;x<canvasRef.current!.width;x+=gPx){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvasRef.current!.height);ctx.stroke();}
    for(let y=oy;y<canvasRef.current!.height;y+=gPx){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvasRef.current!.width,y);ctx.stroke();}
  }

  function drawObj(ctx: any, o: any, sel: boolean, m: string) {
    if (!o?.pts || o.pts.length < 2) return;
    const p = PROF[o.prof] || PROF.telaio;
    ctx.globalAlpha = o.confirmed ? 1 : 0.52;
    if (o.type === "line") drawSolidLine(ctx, o, p, sel, m);
    else drawSolidPoly(ctx, o, p, sel, m);
    ctx.globalAlpha = 1;
    if (o.confirmed || sel) drawQuote(ctx, o, sel, m);
  }

  function drawSolidLine(ctx: any, o: any, p: any, sel: boolean, m: string) {
    const s1=m2s(o.pts[0].x,o.pts[0].y), s2=m2s(o.pts[1].x,o.pts[1].y);
    const dx=s2.x-s1.x, dy=s2.y-s1.y, len=Math.sqrt(dx*dx+dy*dy);
    if (len < 2) return;
    const nx=-dy/len, ny=dx/len;
    const sp = mmToPx(p.sp/2) * S.current.zoom;
    const corners = [
      {x:s1.x+nx*sp,y:s1.y+ny*sp},{x:s2.x+nx*sp,y:s2.y+ny*sp},
      {x:s2.x-nx*sp,y:s2.y-ny*sp},{x:s1.x-nx*sp,y:s1.y-ny*sp},
    ];

    if (m === "render") {
      // Gradiente solido
      const grad = ctx.createLinearGradient(s1.x+nx*sp,s1.y+ny*sp,s1.x-nx*sp,s1.y-ny*sp);
      grad.addColorStop(0, p.rCol);
      grad.addColorStop(0.5, p.rFill);
      grad.addColorStop(1, p.rFill+"aa");
      polyOp(ctx, corners, grad, null, 0);
      polyOp(ctx, corners, null, sel?"#D08008":"#0a1020", sel?2:0.8);
      // Riflessione
      ctx.save(); ctx.globalAlpha=0.2;
      ctx.strokeStyle="#ffffff"; ctx.lineWidth=sp*0.4; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(s1.x+nx*sp*0.5,s1.y+ny*sp*0.5); ctx.lineTo(s2.x+nx*sp*0.5,s2.y+ny*sp*0.5); ctx.stroke();
      ctx.restore();
    } else {
      // Tecnico: fill leggero + hatch
      ctx.save();
      const path = new Path2D();
      corners.forEach((c,i) => i===0?path.moveTo(c.x,c.y):path.lineTo(c.x,c.y));
      path.closePath();
      ctx.fillStyle = hexAlpha(p.tCol, 0.1); ctx.fill(path);
      ctx.clip(path);
      ctx.strokeStyle = hexAlpha(p.tCol, 0.45); ctx.lineWidth = 0.8;
      for(let t=-len-sp*4;t<len+sp*4;t+=6*S.current.zoom){
        const bx=s1.x+(dx/len)*t, by=s1.y+(dy/len)*t;
        ctx.beginPath(); ctx.moveTo(bx-nx*sp*2,by-ny*sp*2); ctx.lineTo(bx+nx*sp*2,by+ny*sp*2); ctx.stroke();
      }
      ctx.restore();
      polyOp(ctx, corners, null, sel?"#D08008":p.tCol, sel?2.5:1.5);
      // Asse
      ctx.setLineDash([7,4,1,4]); ctx.strokeStyle=p.tCol+"70"; ctx.lineWidth=0.7;
      ctx.beginPath(); ctx.moveTo(s1.x,s1.y); ctx.lineTo(s2.x,s2.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Tagli angolo
    drawCuts(ctx, s1, s2, nx, ny, sp, dx, dy, len, p, o.join||"deg45", m);

    // Punti terminali
    [s1,s2].forEach(pt => {
      ctx.beginPath(); ctx.arc(pt.x,pt.y,4*S.current.zoom,0,Math.PI*2);
      ctx.fillStyle = sel?AMB:(m==="render"?p.rCol:p.tCol); ctx.fill();
    });

    if (!o.confirmed) {
      const mx=(s1.x+s2.x)/2, my=(s1.y+s2.y)/2;
      ctx.fillStyle=AMB; ctx.font=`bold ${9*S.current.zoom}px system-ui`;
      ctx.textAlign="center"; ctx.fillText("GHOST",mx,my-sp-5*S.current.zoom);
    }
  }

  function drawCuts(ctx: any, p1: any, p2: any, nx: number, ny: number, sp: number, dx: number, dy: number, len: number, p: any, join: string, m: string) {
    const c = sp*0.65;
    const col = m==="render" ? "#0a1020" : p.tCol;
    ctx.strokeStyle=col; ctx.lineWidth=m==="render"?1.5:1.2;
    [[p1,1],[p2,-1]].forEach(([pt,dir]: any) => {
      const fx=dx/len*dir, fy=dy/len*dir;
      if (join==="deg45") {
        ctx.beginPath(); ctx.moveTo(pt.x+nx*sp,pt.y+ny*sp); ctx.lineTo(pt.x+nx*sp+fx*c,pt.y+ny*sp+fy*c); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pt.x-nx*sp,pt.y-ny*sp); ctx.lineTo(pt.x-nx*sp+fx*c,pt.y-ny*sp+fy*c); ctx.stroke();
        ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(pt.x+nx*sp,pt.y+ny*sp); ctx.lineTo(pt.x-nx*sp,pt.y-ny*sp); ctx.stroke();
      } else if (join==="deg90") {
        ctx.beginPath(); ctx.moveTo(pt.x+nx*sp,pt.y+ny*sp); ctx.lineTo(pt.x-nx*sp,pt.y-ny*sp); ctx.stroke();
      } else {
        ctx.setLineDash([3,2]);
        ctx.beginPath(); ctx.moveTo(pt.x+nx*sp,pt.y+ny*sp); ctx.lineTo(pt.x-nx*sp,pt.y-ny*sp); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  function drawSolidPoly(ctx: any, o: any, p: any, sel: boolean, m: string) {
    if (o.pts.length < 3) return;
    const spts = o.pts.map((pt: any) => m2s(pt.x, pt.y));
    const ap = o.apert || "fisso";
    const glassFill = m==="render" ? "rgba(140,200,230,0.2)" : "rgba(168,216,234,0.14)";

    // Fill vetro
    polyOp(ctx, spts, ap==="vuoto"?"rgba(255,255,255,0.02)":glassFill, null, 0);

    // Croce fisso
    if (ap==="fisso") {
      const bb = getBbox(spts);
      ctx.strokeStyle = m==="render"?"#5aaBcc":"#4a96b8"; ctx.lineWidth=0.8; ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.moveTo(bb.x1+4,bb.y1+4); ctx.lineTo(bb.x2-4,bb.y2-4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bb.x2-4,bb.y1+4); ctx.lineTo(bb.x1+4,bb.y2-4); ctx.stroke();
      ctx.globalAlpha=1;
    }

    // Riflessione vetro render
    if (m==="render" && ap!=="vuoto") {
      const bb=getBbox(spts);
      ctx.save(); ctx.globalAlpha=0.12;
      ctx.fillStyle="#ffffff"; ctx.fillRect(bb.x1+4,bb.y1+4,bb.w*0.12,bb.h*0.65);
      ctx.restore();
    }

    // Simbolo apertura ancorato ai nodi
    drawApertura(ctx, spts, ap, m);

    // Bordo profilo
    const sp = mmToPx(p.sp/2)*S.current.zoom;
    if (m==="render" && sp>3) {
      ctx.lineWidth=sp*2; ctx.strokeStyle=p.rFill; ctx.lineJoin="miter";
      ctx.beginPath(); spts.forEach((pt: any,i: number)=>i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y)); ctx.closePath(); ctx.stroke();
      ctx.lineWidth=1.2; ctx.strokeStyle="#0a1020";
      ctx.beginPath(); spts.forEach((pt: any,i: number)=>i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y)); ctx.closePath(); ctx.stroke();
      // Linea sormonto interna
      const inner = shrinkPoly(spts, sp*0.6);
      if (inner) { ctx.lineWidth=0.8; ctx.strokeStyle=p.rCol+"60"; polyOp(ctx, inner, null, p.rCol+"60", 0.8); }
    } else {
      ctx.lineWidth = Math.max(2, sp*1.0); ctx.strokeStyle = sel?AMB:p.tCol; ctx.lineJoin="miter";
      ctx.beginPath(); spts.forEach((pt: any,i: number)=>i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y)); ctx.closePath(); ctx.stroke();
      // Tagli 45° agli angoli
      for(let i=0;i<spts.length;i++) {
        cut45(ctx, spts[(i+spts.length-1)%spts.length], spts[i], spts[(i+1)%spts.length], p.tCol);
      }
    }
  }

  function drawApertura(ctx: any, spts: any[], ap: string, m: string) {
    const bb = getBbox(spts);
    if (bb.w<8||bb.h<8) return;

    if (ap.startsWith("anta")) {
      const cx = ap==="anta_dx" ? bb.x1 : bb.x2;
      const r = Math.min(bb.w, bb.h)*0.82;
      // Area triangolo
      ctx.beginPath(); ctx.moveTo(cx,bb.y2);
      ctx.lineTo(ap==="anta_dx"?bb.x2:bb.x1,bb.y2);
      ctx.lineTo(cx,bb.y2-r); ctx.closePath();
      ctx.fillStyle="rgba(26,158,115,0.07)"; ctx.fill();
      // Arco (linea continua = apertura interna standard)
      ctx.beginPath();
      if(ap==="anta_dx") ctx.arc(cx,bb.y2,r,-Math.PI/2,0,false);
      else ctx.arc(cx,bb.y2,r,Math.PI,-Math.PI/2,false);
      ctx.strokeStyle=GRN; ctx.lineWidth=1.4; ctx.setLineDash([]); ctx.stroke();
      // Asse cerniera
      ctx.strokeStyle=GRN+"80"; ctx.lineWidth=0.8; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(cx,bb.y1+4); ctx.lineTo(cx,bb.y2-4); ctx.stroke();
      ctx.setLineDash([]);
      // Maniglia
      const mx = ap==="anta_dx"?bb.x2-10:bb.x1+10;
      ctx.fillStyle=AMB; ctx.strokeStyle="#a06000"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(mx-3,bb.cy-11,6,22,3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx,bb.cy,5,0,Math.PI*2); ctx.fillStyle="#c07000"; ctx.fill();

    } else if (ap.startsWith("scor")) {
      const dir = ap==="scor_dx"?1:-1;
      const len = Math.min(bb.w*0.35,44);
      const cx = bb.cx+dir*bb.w*0.08, cy = bb.cy;
      ctx.strokeStyle=GRN+"60"; ctx.lineWidth=2;
      [bb.y1+6,bb.y2-6].forEach((gy: number) => { ctx.beginPath(); ctx.moveTo(bb.x1+6,gy); ctx.lineTo(bb.x2-6,gy); ctx.stroke(); });
      ctx.strokeStyle=GRN; ctx.lineWidth=2.2; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(cx-len*dir,cy); ctx.lineTo(cx+len*dir,cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+len*dir,cy); ctx.lineTo(cx+len*dir-12*dir,cy-6); ctx.lineTo(cx+len*dir-12*dir,cy+6); ctx.closePath();
      ctx.fillStyle=GRN; ctx.fill();

    } else if (ap==="vasistas") {
      const vH = bb.h*0.38;
      ctx.beginPath(); ctx.moveTo(bb.x1+4,bb.y1+vH); ctx.lineTo(bb.cx,bb.y1+4); ctx.lineTo(bb.x2-4,bb.y1+vH);
      ctx.strokeStyle=GRN; ctx.setLineDash([6,3]); ctx.lineWidth=1.3; ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawInProgress(ctx: any, pts2: any[], hover: any, m: string) {
    const spts = pts2.map((p: any) => m2s(p.x,p.y));
    ctx.strokeStyle=AMB; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(spts[0].x,spts[0].y);
    spts.forEach((p: any) => ctx.lineTo(p.x,p.y));
    if (hover) { const h=m2s(hover.x,hover.y); ctx.lineTo(h.x,h.y); }
    ctx.stroke(); ctx.setLineDash([]);
    spts.forEach((p: any, i: number) => {
      ctx.beginPath(); ctx.arc(p.x,p.y,5*S.current.zoom,0,Math.PI*2);
      ctx.fillStyle=AMB; ctx.fill();
      ctx.fillStyle=m==="tecnico"?"#1a2a3a":"#fff";
      ctx.font=`bold ${9*S.current.zoom}px system-ui`; ctx.textAlign="center";
      ctx.fillText(i+1,p.x,p.y-8*S.current.zoom);
    });
    if (pts2.length>0 && hover) {
      const last=pts2[pts2.length-1];
      const d=Math.round(dst(last,hover));
      const ang=Math.round(Math.atan2(hover.y-last.y,hover.x-last.x)*180/Math.PI);
      const mid=m2s((last.x+hover.x)/2,(last.y+hover.y)/2);
      ctx.fillStyle=AMB; ctx.font=`bold ${11*S.current.zoom}px monospace`;
      ctx.textAlign="center"; ctx.fillText(`${d}mm ∠${((ang%360)+360)%360}°`,mid.x,mid.y-14*S.current.zoom);
    }
  }

  function drawQuote(ctx: any, o: any, sel: boolean, m: string) {
    const col = sel?AMB:(m==="tecnico"?"#1a2a3a":"#b0c0d0");
    ctx.font=`${9.5*S.current.zoom}px monospace`;
    const len = o.type==="line"?o.pts.length-1:o.pts.length;
    if (!o.quoteHots) o.quoteHots=[];
    for(let i=0;i<len;i++) {
      const a=o.pts[i], b=o.pts[(i+1)%o.pts.length];
      if(!a||!b) continue;
      const d=Math.round(dst(a,b));
      if(d<15) continue;
      const sa=m2s(a.x,a.y), sb=m2s(b.x,b.y);
      const ddx=sb.x-sa.x, ddy=sb.y-sa.y, l=Math.sqrt(ddx*ddx+ddy*ddy);
      const nx=-ddy/l, ny=ddx/l, off=14*S.current.zoom;
      ctx.strokeStyle=col; ctx.lineWidth=0.6;
      ctx.beginPath(); ctx.moveTo(sa.x+nx*off*0.3,sa.y+ny*off*0.3); ctx.lineTo(sa.x+nx*off,sa.y+ny*off); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sb.x+nx*off*0.3,sb.y+ny*off*0.3); ctx.lineTo(sb.x+nx*off,sb.y+ny*off); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sa.x+nx*off,sa.y+ny*off); ctx.lineTo(sb.x+nx*off,sb.y+ny*off); ctx.stroke();
      const qx=(sa.x+sb.x)/2+nx*off, qy=(sa.y+sb.y)/2+ny*off;
      const label=d+"mm";
      // Box cliccabile quota (per numpad)
      const tw=ctx.measureText(label).width;
      ctx.fillStyle=sel?"#D0800820":"rgba(0,0,0,0)"; ctx.fillRect(qx-tw/2-5,qy-13,tw+10,16);
      ctx.fillStyle=col; ctx.textAlign="center"; ctx.fillText(label,qx,qy);
      o.quoteHots[i]={x:qx-tw/2-5,y:qy-13,w:tw+10,h:16,segIdx:i};
    }
    // Bbox totale
    if (o.pts.length>=3) {
      const mm2=o.pts.reduce((b: any,p: any)=>({x1:Math.min(b.x1,p.x),y1:Math.min(b.y1,p.y),x2:Math.max(b.x2,p.x),y2:Math.max(b.y2,p.y)}),{x1:1e9,y1:1e9,x2:-1e9,y2:-1e9});
      const W2=Math.round(mm2.x2-mm2.x1), H2=Math.round(mm2.y2-mm2.y1);
      const tl=m2s(mm2.x1,mm2.y1), br=m2s(mm2.x2,mm2.y2);
      const qcol=m==="tecnico"?"#1a2a3a":"#b0c0d0";
      ctx.strokeStyle=qcol; ctx.fillStyle=qcol; ctx.lineWidth=0.7;
      ctx.font=`bold ${11*S.current.zoom}px monospace`;
      const qY=tl.y-18*S.current.zoom;
      ctx.beginPath(); ctx.moveTo(tl.x,tl.y-3); ctx.lineTo(tl.x,qY-3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(br.x,tl.y-3); ctx.lineTo(br.x,qY-3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tl.x,qY); ctx.lineTo(br.x,qY); ctx.stroke();
      ctx.textAlign="center"; ctx.fillText(W2+"mm",(tl.x+br.x)/2,qY-5*S.current.zoom);
      const qX=br.x+18*S.current.zoom;
      ctx.beginPath(); ctx.moveTo(br.x+3,tl.y); ctx.lineTo(qX+3,tl.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(br.x+3,br.y); ctx.lineTo(qX+3,br.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(qX,tl.y); ctx.lineTo(qX,br.y); ctx.stroke();
      ctx.save(); ctx.translate(qX+12*S.current.zoom,(tl.y+br.y)/2); ctx.rotate(Math.PI/2);
      ctx.fillText(H2+"mm",0,0); ctx.restore();
    }
  }

  function drawCross(ctx: any, mm: any, m: string) {
    const s=m2s(mm.x,mm.y);
    ctx.strokeStyle=AMB; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(s.x-18,s.y); ctx.lineTo(s.x+18,s.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x,s.y-18); ctx.lineTo(s.x,s.y+18); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(s.x,s.y,4,0,Math.PI*2);
    ctx.strokeStyle=AMB; ctx.lineWidth=1.5; ctx.stroke();
  }

  // ── HELPERS ────────────────────────────────────────────
  function polyOp(ctx: any, pts2: any[], fill: any, stroke: any, lw: number) {
    ctx.beginPath(); pts2.forEach((p: any,i: number)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
    if (fill){ctx.fillStyle=fill;ctx.fill();}
    if (stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
  }
  function getBbox(pts2: any[]) {
    const xs=pts2.map((p: any)=>p.x), ys=pts2.map((p: any)=>p.y);
    const x1=Math.min(...xs),y1=Math.min(...ys),x2=Math.max(...xs),y2=Math.max(...ys);
    return {x1,y1,x2,y2,w:x2-x1,h:y2-y1,cx:(x1+x2)/2,cy:(y1+y2)/2};
  }
  function shrinkPoly(pts2: any[], amount: number) {
    const cx=pts2.reduce((s: number,p: any)=>s+p.x,0)/pts2.length;
    const cy=pts2.reduce((s: number,p: any)=>s+p.y,0)/pts2.length;
    return pts2.map((p: any)=>{const dx=p.x-cx,dy=p.y-cy,l=Math.sqrt(dx*dx+dy*dy);return l<amount?p:{x:cx+dx*(l-amount)/l,y:cy+dy*(l-amount)/l};});
  }
  function cut45(ctx: any, prev: any, cur: any, next: any, col: string) {
    const d1x=cur.x-prev.x,d1y=cur.y-prev.y,d2x=next.x-cur.x,d2y=next.y-cur.y;
    const l1=Math.sqrt(d1x*d1x+d1y*d1y),l2=Math.sqrt(d2x*d2x+d2y*d2y);
    if(l1<4||l2<4) return;
    const c=Math.min(12*S.current.zoom,l1*0.3,l2*0.3);
    ctx.strokeStyle=col; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cur.x-(d1x/l1)*c,cur.y-(d1y/l1)*c); ctx.lineTo(cur.x+(d2x/l2)*c,cur.y+(d2y/l2)*c); ctx.stroke();
  }
  function hexAlpha(hex: string, a: number) {
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── EVENTI ─────────────────────────────────────────────
  function getPos(e: any) {
    const r = canvasRef.current!.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { sx: 0, sy: 0 };
    }
    return { sx: clientX - r.left, sy: clientY - r.top };
  }

  function onMove(e: any) {
    try { e.preventDefault(); } catch(_) {}
    const {sx,sy}=getPos(e);
    if (sx===0 && sy===0) return;
    const raw=s2m(sx,sy);
    const prev=S.current.pts.length>0?S.current.pts[S.current.pts.length-1]:null;
    S.current.hoverMm=applySnap(raw.x,raw.y,prev);
    draw();
  }

  function onTap(e: any) {
    try { e.preventDefault(); } catch(_) {}
    const {sx,sy}=getPos(e);
    if (sx===0 && sy===0 && !e.clientX) return;
    // Check click su quote → numpad
    for(let i=0;i<S.current.objects.length;i++) {
      const o=S.current.objects[i];
      if(!o.quoteHots) continue;
      for(let j=0;j<o.quoteHots.length;j++) {
        const h=o.quoteHots[j];
        if(h&&sx>=h.x&&sx<=h.x+h.w&&sy>=h.y&&sy<=h.y+h.h) {
          const d=Math.round(dst(o.pts[j],o.pts[j+1]));
          S.current.npTarget={objIdx:i,segIdx:j};
          setNpValue(String(d));
          setNpLabel(`Segmento ${j+1} (mm)`);
          setShowNumpad(true);
          return;
        }
      }
    }
    if (S.current.calibMode) {
      const mm=s2m(sx,sy);
      S.current.calibPts.push(mm); draw();
      if (S.current.calibPts.length===2) {
        setCalibStep("input"); // mostra modale input mm
      } else {
        // Forza re-render per aggiornare il testo "Tocca il 2° punto"
        setCalibStep("draw");
      }
      return;
    }
    const raw=s2m(sx,sy);
    const prev=S.current.pts.length>0?S.current.pts[S.current.pts.length-1]:null;
    const snapped=applySnap(raw.x,raw.y,prev);
    if (S.current.tool==="sel") { selObj(snapped); return; }
    S.current.pts.push(snapped);
    if (S.current.tool==="line"&&S.current.pts.length===2) completeLine();
    else if (S.current.tool==="rect"&&S.current.pts.length===2) {
      const [p1,p2]=S.current.pts;
      S.current.pts=[{x:p1.x,y:p1.y},{x:p2.x,y:p1.y},{x:p2.x,y:p2.y},{x:p1.x,y:p2.y}];
      completePoly();
    }
    draw();
  }

  function completeLine() {
    S.current.history.push(JSON.stringify(S.current.objects));
    const obj={type:"line",pts:[...S.current.pts],prof:S.current.curProf,join:S.current.curJoin,confirmed:false};
    weld(obj); S.current.objects.push(obj); S.current.pts=[];
    setObjCount(S.current.objects.length); draw(); aggiornaDB();
    setPanelData({idx:S.current.objects.length-1,type:"line",obj}); setPanelOpen(true);
  }
  function completePoly() {
    S.current.history.push(JSON.stringify(S.current.objects));
    const obj={type:"poly",pts:[...S.current.pts],prof:S.current.curProf,apert:S.current.curApert,confirmed:false};
    S.current.objects.push(obj); S.current.pts=[];
    setObjCount(S.current.objects.length); draw(); aggiornaDB();
    setPanelData({idx:S.current.objects.length-1,type:"poly",obj}); setPanelOpen(true);
  }
  function weld(newObj: any) {
    const th=12;
    newObj.pts.forEach((p: any,pi: number) => {
      S.current.objects.forEach((other: any,oi: number) => {
        other.pts.forEach((op: any,opi: number) => {
          if(dst(p,op)<th){ newObj.pts[pi]={x:op.x,y:op.y}; if(!newObj.connections)newObj.connections=[]; newObj.connections.push({objIdx:oi,ptIdx:opi}); }
        });
      });
    });
  }
  // ── ESTRAI MISURE DAL DISEGNO ──────────────────────────
  // Cerca il rettangolo più grande (telaio esterno) e ne estrae L e H
  function estraiMisure() {
    const objs = S.current.objects.filter((o: any) => o.type==="poly" && o.confirmed);
    if (objs.length === 0) return null;
    // Prendi il bounding box più grande tra i poly confermati
    let maxArea = 0, best: any = null;
    objs.forEach((o: any) => {
      const bb = o.pts.reduce((b: any, p: any) => ({
        x1:Math.min(b.x1,p.x),y1:Math.min(b.y1,p.y),
        x2:Math.max(b.x2,p.x),y2:Math.max(b.y2,p.y)
      }), {x1:1e9,y1:1e9,x2:-1e9,y2:-1e9});
      const area = (bb.x2-bb.x1)*(bb.y2-bb.y1);
      if (area > maxArea) { maxArea=area; best=bb; }
    });
    if (!best) {
      // Fallback: usa tutte le linee
      const allPts = S.current.objects.flatMap((o: any) => o.pts);
      if (allPts.length < 2) return null;
      const bb = allPts.reduce((b: any, p: any) => ({
        x1:Math.min(b.x1,p.x),y1:Math.min(b.y1,p.y),
        x2:Math.max(b.x2,p.x),y2:Math.max(b.y2,p.y)
      }), {x1:1e9,y1:1e9,x2:-1e9,y2:-1e9});
      best = bb;
    }
    return {
      L: Math.round(best.x2 - best.x1),
      H: Math.round(best.y2 - best.y1),
    };
  }

  // Chiama ogni volta che si completa un oggetto
  function aggiornaDB() {
    const mis = estraiMisure();
    if (!mis || !onMisureUpdate) return;
    setMisureEstratte(mis);
    onMisureUpdate({ lCentro: mis.L, hCentro: mis.H });
  }

  function selObj(mm: any) {
    let found=-1;
    S.current.objects.forEach((o: any,i: number)=>o.pts.forEach((p: any)=>{if(dst(p,mm)<25)found=i;}));
    S.current.selIdx=found;
    if(found>=0){ const o=S.current.objects[found]; setPanelData({idx:found,type:o.type,obj:o}); setPanelOpen(true); }
    draw();
  }

  // ── CONFERMA CALIBRAZIONE ─────────────────────────────
  function confirmCalib() {
    const realMm = parseFloat(calibInputMm) || 1000;
    const dpx = dst(S.current.calibPts[0], S.current.calibPts[1]);
    if (dpx < 2) return;
    S.current.cal.mmPerPx = realMm / dpx;
    S.current.cal.calibrated = true;
    S.current.calibMode = false;
    S.current.calibPts = [];
    setCalibrated(true);
    setShowCalibModal(false);
    setCalibStep("intro");
    draw();
  }

  // ── NUMPAD ─────────────────────────────────────────────
  function npKey(k: string) {
    if (k==="OK") { npConfirm(); return; }
    if (k==="⌫") { setNpValue(v=>v.slice(0,-1)); return; }
    setNpValue(v=>v+k);
  }
  function npQuick(delta: number) { setNpValue(v=>String(Math.max(0,(parseFloat(v)||0)+delta))); }
  function npConfirm() {
    const mm=parseFloat(npValue);
    const {npTarget}=S.current;
    if(!isNaN(mm)&&npTarget) {
      const o=S.current.objects[npTarget.objIdx];
      if(o&&o.pts[npTarget.segIdx]&&o.pts[npTarget.segIdx+1]){
        const a=o.pts[npTarget.segIdx],b=o.pts[npTarget.segIdx+1];
        const ddx=b.x-a.x,ddy=b.y-a.y,cur=Math.sqrt(ddx*ddx+ddy*ddy);
        if(cur>0){const sc=mm/cur;o.pts[npTarget.segIdx+1]={x:a.x+ddx*sc,y:a.y+ddy*sc};}
      }
    }
    S.current.npTarget=null; setNpValue(""); setShowNumpad(false); draw();
  }

  // ── PANEL ──────────────────────────────────────────────
  function setObjProp(k: string, v: any) {
    if(!panelData) return;
    S.current.objects[panelData.idx][k]=v;
    setPanelData({...panelData,obj:{...panelData.obj,[k]:v}}); draw();
  }

  // ── UI STYLES ──────────────────────────────────────────
  const isTec = mode==="tecnico";
  const topBg = isTec?"#fff":"#0a0c10";
  const toolBg = isTec?"#f8f9fa":"#111";
  const textCol = isTec?"#1a2a3a":"#f0f0ee";
  const subCol = isTec?"#888":"#555";
  const bdrCol = isTec?"#ddd":"#2a2a2a";
  const cardBg = isTec?"#fff":"#131318";

  const tbtn = (active: boolean, col=AMB) => ({
    padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",
    display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap" as const,
    border:`1px solid ${active?col:bdrCol}`,background:active?col+"18":cardBg,color:active?col:subCol,
  });
  const pbtn = (sel: boolean, col=GRN) => ({
    padding:"8px 5px",borderRadius:7,border:`1px solid ${sel?col:bdrCol}`,
    background:sel?col+"18":cardBg,color:sel?col:subCol,
    fontSize:10,fontWeight:sel?700:500,cursor:"pointer",fontFamily:"inherit",textAlign:"center" as const,
  });
  const npbtnStyle = (type="num") => ({
    borderRadius:8,fontSize:type==="num"?20:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
    border:`1px solid ${bdrCol}`,background:cardBg,color:textCol,
    display:"flex",alignItems:"center",justifyContent:"center",minHeight:52,
    touchAction:"manipulation" as const,
  });

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column",fontFamily:"system-ui",background:isTec?"#fff":"#1a1c22"}}>

      {/* TOPBAR */}
      <div style={{background:topBg,padding:"7px 10px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${bdrCol}`,flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:subCol,fontSize:20,cursor:"pointer"}}>←</button>
        <div style={{color:textCol,fontSize:13,fontWeight:600,flex:1}}>{vanoNome||"Disegno"} {objCount>0&&<span style={{fontSize:10,color:subCol,marginLeft:6}}>{objCount} el.</span>}</div>
        {/* Mode toggle */}
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${bdrCol}`}}>
          {[["tecnico","▤ TECNICO"],["render","◉ RENDER"]].map(([m,l])=>(
            <button key={m} onClick={()=>{S.current.mode=m;setModeState(m as any);draw();}} style={{
              padding:"5px 11px",fontSize:11,fontWeight:700,cursor:"pointer",border:"none",fontFamily:"inherit",
              background:mode===m?(m==="tecnico"?"#1a2a3a":"#D08008"):isTec?"#f0f4f8":"#1a1a1a",
              color:mode===m?"#fff":subCol,transition:"all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        <div onClick={()=>{
              S.current.calibMode=true;
              S.current.calibPts=[];
              setCalibStep("draw");
              setShowCalibModal(true);
            }} style={{
          padding:"3px 10px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
          background:calibrated?GRN+"18":RED+"18",color:calibrated?GRN:RED,border:`1px solid ${calibrated?GRN+"40":RED+"40"}`,
        }}>{calibrated?"✓ Cal.":"⚠ Calibra"}</div>
        {objCount>0&&<button onClick={()=>{if(onSalva)onSalva({mode,oggetti:S.current.objects,cal:S.current.cal});onClose();}} style={{padding:"6px 14px",borderRadius:9,border:"none",background:GRN,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Salva</button>}
      </div>

      {/* TOOLS */}
      <div style={{background:toolBg,borderBottom:`1px solid ${bdrCol}`,padding:"5px 8px",display:"flex",gap:4,alignItems:"center",flexWrap:"wrap" as const,flexShrink:0}}>
        {[{id:"line",l:"╱ Profilo"},{id:"rect",l:"□ Rettangolo"},{id:"poly",l:"⬡ Poligono"},{id:"sel",l:"↖ Sel"}].map(t=>(
          <button key={t.id} onClick={()=>{S.current.tool=t.id;S.current.pts=[];setToolState(t.id);draw();}} style={tbtn(tool===t.id)}>{t.l}</button>
        ))}
        <div style={{width:1,height:18,background:bdrCol}}/>
        {[{k:"grid",l:"⊞"},{k:"angle",l:"∠45°"},{k:"obj",l:"⊕"}].map(s=>(
          <button key={s.k} onClick={()=>{S.current.snap[s.k]=!S.current.snap[s.k];setSnapState({...S.current.snap});draw();}} style={tbtn(snap[s.k as keyof typeof snap],GRN)}>{s.l}</button>
        ))}
        <div style={{width:1,height:18,background:bdrCol}}/>
        <button onClick={()=>{if(S.current.pts.length>0){S.current.pts=[];draw();}else if(S.current.history.length>0){S.current.objects=JSON.parse(S.current.history.pop());setObjCount(S.current.objects.length);draw();}}} style={tbtn(false,RED)}>↩</button>
        <button onClick={()=>{S.current.pts=[];S.current.objects=[];S.current.history=[];S.current.selIdx=-1;setObjCount(0);draw();}} style={tbtn(false,RED)}>✕</button>
        <div style={{width:1,height:18,background:bdrCol}}/>
        <label style={{fontSize:11,fontWeight:700,color:calibrated?subCol:AMB,cursor:"pointer",padding:"5px 10px",borderRadius:7,border:`1px solid ${calibrated?bdrCol:AMB+"60"}`,background:calibrated?cardBg:AMB+"12"}}>
          📷 {S.current.bgImage ? "Cambia foto" : "1. Carica foto"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
            const f=e.target.files?.[0];if(!f)return;
            const img=new Image();img.onload=()=>{S.current.bgImage=img;draw();};
            img.src=URL.createObjectURL(f);
          }}/>
        </label>
        <input type="range" min={0} max={100} value={bgOpacity} onChange={e=>{setBgOpacity(Number(e.target.value));S.current.bgOpacity=Number(e.target.value)/100;draw();}} style={{width:70,accentColor:AMB}}/>
        <span style={{fontSize:10,color:subCol}}>{bgOpacity}%</span>
      </div>

      {/* CANVAS + NUMPAD */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div ref={wrapRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none"}}>
          <canvas ref={canvasRef} style={{display:"block",touchAction:"none",cursor:tool==="sel"?"default":"crosshair"}}
            onMouseMove={onMove}
          onTouchMove={(e) => { try{e.preventDefault();}catch(_){} onMove(e); }}
          onClick={onTap}
          onTouchEnd={(e) => { try{e.preventDefault();}catch(_){} onTap(e); }}
          />
          {/* BADGE MISURE ESTRATTE */}
          {misureEstratte && (
            <div style={{position:"absolute",top:10,left:10,background:GRN+"ee",color:"#fff",padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:700,fontFamily:"monospace",pointerEvents:"none"}}>
              L {misureEstratte.L}mm × H {misureEstratte.H}mm
            </div>
          )}

          {/* BANNER CALIBRAZIONE — sempre in basso, non copre mai il canvas */}
          {showCalibModal && calibStep==="intro" && (
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:isTec?"#fffbe6":"#1a1400",borderTop:`2px solid ${AMB}`,padding:"12px 16px",zIndex:30,display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:22,flexShrink:0}}>📐</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:AMB}}>Calibra per misure reali</div>
                <div style={{fontSize:11,color:isTec?"#777":"#aaa",marginTop:1}}>Carica foto del vano, poi traccia una linea su una misura nota</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>{setCalibStep("draw");S.current.calibMode=true;S.current.calibPts=[];}} style={{padding:"8px 14px",borderRadius:9,border:"none",background:AMB,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Calibra</button>
                <button onClick={()=>setShowCalibModal(false)} style={{padding:"8px 10px",borderRadius:9,border:`1px solid ${isTec?"#ddd":"#333"}`,background:"transparent",color:isTec?"#888":"#666",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Salta</button>
              </div>
            </div>
          )}
          {showCalibModal && calibStep==="draw" && (
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:isTec?"#fffbe6":"#1a1400",borderTop:`2px solid ${AMB}`,padding:"10px 16px",zIndex:30,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:5,background:S.current.calibPts.length>0?GRN:AMB,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:AMB}}>
                  {S.current.calibPts.length===0?"Tocca il 1° punto sul canvas":"✓ Primo punto — tocca il 2°"}
                </div>
                <div style={{fontSize:10,color:isTec?"#888":"#aaa",marginTop:1}}>Traccia su metro, bordo muro o controtelaio</div>
              </div>
              <button onClick={()=>{S.current.calibMode=false;S.current.calibPts=[];setCalibStep("intro");}} style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${isTec?"#ddd":"#333"}`,background:"transparent",color:isTec?"#888":"#666",fontSize:11,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Annulla</button>
            </div>
          )}
          {showCalibModal && calibStep==="input" && (
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:isTec?"#fff":"#0e1016",borderTop:`2px solid ${AMB}`,padding:"14px 16px",zIndex:30}}>
              <div style={{fontSize:13,fontWeight:700,color:AMB,marginBottom:8,textAlign:"center" as const}}>Quanti mm è quella linea?</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
                {["100","500","1000","2000"].map(v=>(
                  <button key={v} onClick={()=>setCalibInputMm(v)} style={{padding:"11px 4px",borderRadius:8,border:`1px solid ${AMB}50`,background:calibInputMm===v?AMB:AMB+"15",color:calibInputMm===v?"#fff":AMB,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{v}</button>
                ))}
              </div>
              <div style={{fontSize:22,fontWeight:800,fontFamily:"monospace",textAlign:"right" as const,color:isTec?"#1a2a3a":"#fff",padding:"8px 12px",background:isTec?"#f8f9fa":"#131318",borderRadius:8,border:`1px solid ${isTec?"#ddd":"#333"}`,marginBottom:8}}>
                {calibInputMm||"—"} mm
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:6}}>
                {["7","8","9","4","5","6","1","2","3","0","⌫","OK"].map(k=>(
                  <button key={k} onClick={()=>{
                    if(k==="OK"){confirmCalib();return;}
                    if(k==="⌫"){setCalibInputMm((v:string)=>v.slice(0,-1));return;}
                    setCalibInputMm((v:string)=>v+k);
                  }} style={{
                    padding:"13px 4px",borderRadius:8,
                    border:`1px solid ${k==="OK"?GRN:k==="⌫"?RED:isTec?"#ddd":"#333"}`,
                    background:k==="OK"?GRN:k==="⌫"?RED:isTec?"#fff":"#1a1a1a",
                    color:k==="OK"||k==="⌫"?"#fff":isTec?"#1a2a3a":"#fff",
                    fontSize:k==="OK"||k==="⌫"?13:22,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  }}>{k}</button>
                ))}
              </div>
              <button onClick={()=>{S.current.calibPts=[];setCalibStep("draw");S.current.calibMode=true;}} style={{width:"100%",padding:9,borderRadius:9,border:`1px solid ${isTec?"#ddd":"#333"}`,background:"transparent",color:isTec?"#888":"#666",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>← Ridisegna la linea</button>
            </div>
          )}

                    {objCount===0&&!showCalibModal&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",opacity:0.3,pointerEvents:"none"}}>
            <div style={{fontSize:14,fontWeight:600,color:subCol,marginBottom:6}}>Disegna qui</div>
            <div style={{fontSize:11,color:subCol,lineHeight:1.8}}>╱ Linea = profilo<br/>□ Rettangolo = campitura<br/>Tocca una quota per modificarla</div>
          </div>}
        </div>

        {/* NUMPAD */}
        {showNumpad && (
          <div style={{width:180,background:toolBg,borderLeft:`1px solid ${bdrCol}`,padding:8,display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:0.6,color:subCol}}>{npLabel}</div>
            <div style={{padding:"10px 12px",borderRadius:8,fontSize:22,fontWeight:700,fontFamily:"monospace",textAlign:"right",background:cardBg,color:textCol,border:`1px solid ${bdrCol}`,marginBottom:2}}>{npValue||"—"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
              {[[-10,"−10"],[-2,"−2"],[+2,"+2"],[+10,"+10"]].map(([d,l])=>(
                <button key={l as string} onClick={()=>npQuick(d as number)} style={{borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:`1px solid ${GRN}40`,background:GRN+"10",color:GRN,padding:"6px 2px",textAlign:"center" as const,fontFamily:"inherit"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,flex:1}}>
              {["7","8","9","4","5","6","1","2","3","0","⌫","OK"].map(k=>(
                <button key={k} onClick={()=>npKey(k)} style={{
                  ...npbtnStyle(k==="OK"||k==="⌫"?"op":"num"),
                  background:k==="OK"?GRN:k==="⌫"?RED:cardBg,
                  color:k==="OK"||k==="⌫"?"#fff":textCol,
                  border:`1px solid ${k==="OK"?GRN:k==="⌫"?RED:bdrCol}`,
                  fontSize:k==="OK"||k==="⌫"?13:20,
                }}>{k}</button>
              ))}
            </div>
            <button onClick={()=>{setShowNumpad(false);S.current.npTarget=null;}} style={{padding:8,borderRadius:8,border:`1px solid ${bdrCol}`,background:cardBg,color:subCol,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>Chiudi</button>
          </div>
        )}
      </div>

      {/* PANEL PROPRIETÀ */}
      {panelOpen && panelData && (
        <div style={{position:"absolute",bottom:0,left:0,right:showNumpad?180:0,background:isTec?"#f8f9faee":"#0e1016ee",borderTop:`1px solid ${bdrCol}`,padding:"10px 12px 20px",borderRadius:"12px 12px 0 0",backdropFilter:"blur(8px)",zIndex:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:AMB}}>{panelData.type==="line"?`Profilo — ${PROF[panelData.obj?.prof]?.n}`:"Campitura"}</div>
            <div onClick={()=>{setPanelOpen(false);S.current.selIdx=-1;draw();}} style={{color:subCol,cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</div>
          </div>
          {panelData.type==="line"&&<>
            <div style={{fontSize:9,color:subCol,textTransform:"uppercase",letterSpacing:0.6,marginBottom:5}}>Tipo profilo</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
              {Object.entries(PROF).map(([k,v]: any)=>(
                <button key={k} onClick={()=>setObjProp("prof",k)} style={pbtn(panelData.obj?.prof===k)}>{v.n}<div style={{fontSize:8,opacity:0.6}}>{v.sp}mm</div></button>
              ))}
            </div>
            <div style={{fontSize:9,color:subCol,textTransform:"uppercase",letterSpacing:0.6,marginBottom:5}}>Taglio</div>
            <div style={{display:"flex",gap:5,marginBottom:8}}>
              {Object.entries(JOIN).map(([k,v]: any)=>(
                <button key={k} onClick={()=>setObjProp("join",k)} style={{...pbtn((panelData.obj?.join||"deg45")===k,BLU),flex:1}}>{v}</button>
              ))}
            </div>
          </>}
          {panelData.type!=="line"&&<>
            <div style={{fontSize:9,color:subCol,textTransform:"uppercase",letterSpacing:0.6,marginBottom:5}}>Apertura</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
              {Object.entries(APERT).map(([k,v]: any)=>(
                <button key={k} onClick={()=>setObjProp("apert",k)} style={pbtn((panelData.obj?.apert||"fisso")===k,AMB)}>{v}</button>
              ))}
            </div>
            <div style={{fontSize:9,color:subCol,textTransform:"uppercase",letterSpacing:0.6,marginBottom:5}}>Profilo bordo</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:8}}>
              {["telaio","anta","ferro","legno","free"].map(k=>(
                <button key={k} onClick={()=>setObjProp("prof",k)} style={pbtn(panelData.obj?.prof===k)}>{PROF[k].n}</button>
              ))}
            </div>
          </>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{S.current.objects[panelData.idx].confirmed=true;setPanelOpen(false);draw();}} style={{flex:1,padding:10,borderRadius:9,border:`1px solid ${GRN}`,background:GRN+"18",color:GRN,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Conferma</button>
            <button onClick={()=>{S.current.history.push(JSON.stringify(S.current.objects));S.current.objects.splice(panelData.idx,1);S.current.selIdx=-1;setObjCount(S.current.objects.length);setPanelOpen(false);draw();}} style={{flex:1,padding:10,borderRadius:9,border:`1px solid ${RED}`,background:RED+"18",color:RED,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕ Elimina</button>
          </div>
        </div>
      )}
    </div>
  );
}
