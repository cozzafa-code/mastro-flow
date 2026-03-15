"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO CAD — Motore Unificato v1
// Un solo componente: foto → calibra → disegna → configura → output
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from "react";

// ── COSTANTI SISTEMA ────────────────────────────────────
const SISTEMI: Record<string, any> = {
  alu:  { n:"Alluminio", telaio:65, anta:55, mont:62, trav:55, col:"#4a7a9b", rCol:"#6aaacb", tex:"metal" },
  pvc:  { n:"PVC",       telaio:80, anta:70, mont:76, trav:70, col:"#5a8a5a", rCol:"#7aaa7a", tex:"plastic" },
  legno:{ n:"Legno",     telaio:92, anta:78, mont:86, trav:78, col:"#8a6a40", rCol:"#aa8a58", tex:"wood" },
  ferro:{ n:"Ferro",     telaio:45, anta:38, mont:42, trav:38, col:"#5a5a6a", rCol:"#8a8a9a", tex:"metal" },
};

const RAL: Record<string, string> = {
  "RAL 9016":"#f1f0ea", "RAL 9005":"#0e0e10", "RAL 7016":"#383e42",
  "RAL 8014":"#4a3728", "RAL 6005":"#2f4538", "RAL 1013":"#e9e5ce",
  "Naturale":"#c8a87a", "Rovere":"#9b6a3a", "Noce":"#6b4226",
};

const AMB = "#D08008", GRN = "#1A9E73", RED = "#DC4444", BLU = "#3B7FE0";

// ── LOGISTICA AUTO ───────────────────────────────────────
function checkLogistica(objs: any[], piano: number, ascensore: boolean) {
  const flags: string[] = [];
  objs.forEach(o => {
    if (!o.confirmed) return;
    const h = o.mmH || 0, w = o.mmW || 0;
    if (h > 2500) flags.push("⚠ Infisso alto >2500mm — valuta GRU");
    if (w > 2000) flags.push("⚠ Infisso largo >2000mm — trasporto speciale");
    if (piano > 2 && !ascensore && (h > 1800 || w > 1200)) flags.push("⚠ Piano " + piano + " senza ascensore — squadra 3 persone");
  });
  return flags;
}

// ── BOM AUTO ─────────────────────────────────────────────
function calcolaBOM(objs: any[], sistemaId: string) {
  const s = SISTEMI[sistemaId];
  const bom: any[] = [];
  objs.filter(o => o.confirmed && o.type === "rect").forEach(o => {
    const L = o.mmW || 0, H = o.mmH || 0;
    if (L < 10 || H < 10) return;
    const perimetro = (L + H) * 2;
    bom.push({ voce: `Telaio ${s.n} ${s.telaio}mm`, qta: Math.ceil(perimetro / 1000 * 1.05), um: "ml" });
    bom.push({ voce: "Guarnizione perimetrale", qta: Math.ceil(perimetro / 1000 * 2), um: "ml" });
    const nAnte = o.nAnte || 1;
    for (let i = 0; i < nAnte; i++) {
      const wAnta = L / nAnte;
      const perimAnta = (wAnta + H) * 2;
      bom.push({ voce: `Anta ${s.n} ${s.anta}mm`, qta: Math.ceil(perimAnta / 1000 * 1.05), um: "ml" });
      const nCerniere = H > 1400 ? 3 : 2;
      bom.push({ voce: "Cerniere", qta: nCerniere, um: "pz" });
      if (H > 1400) bom.push({ voce: "Asta a leva antieffrazione", qta: 1, um: "pz" });
      bom.push({ voce: "Maniglia", qta: 1, um: "pz" });
      bom.push({ voce: "Vetro camera 4/12/4", qta: Math.ceil(wAnta * H / 1000000 * 1.1), um: "mq" });
    }
  });
  return bom;
}

// ── PROPS ────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSalva?: (data: any) => void;
  onMisureUpdate?: (mis: { lCentro: number; hCentro: number }) => void;
  vanoNome?: string;
  piano?: number;
}

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ════════════════════════════════════════════════════════
export default function MastroCAD({ onClose, onSalva, onMisureUpdate, vanoNome, piano: pianoProp = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ── STATO GLOBALE (ref per performance canvas) ────────
  const S = useRef<any>({
    // Modalità
    mode: "tecnico",   // tecnico | render
    tool: "rect",      // rect | line | sel | move
    sistema: "alu",

    // Canvas state
    zoom: 1, pan: { x: 60, y: 60 },
    objects: [],
    selIdx: -1,
    hoverMm: null,
    history: [],

    // Disegno in corso
    drawing: false,
    startSx: 0, startSy: 0,

    // Doppio tap
    pendingTap: null,
    pendingTimer: null,

    // Calibrazione
    cal: { mmPerPx: 1, calibrated: false },
    calibMode: false,
    calibPts: [],

    // Sfondo
    bgImage: null,
    bgOpacity: 0.6,

    // Colore RAL selezionato
    coloreRAL: "RAL 7016",
  });

  // ── STATO REACT (per UI) ──────────────────────────────
  const [mode, setMode] = useState<"tecnico"|"render">("tecnico");
  const [sistema, setSistemaState] = useState("alu");
  const [coloreRAL, setColoreRALState] = useState("RAL 7016");
  const [calibrated, setCalibrated] = useState(false);
  const [calibStep, setCalibStep] = useState<"idle"|"pt1"|"pt2"|"input">("idle");
  const [calibMm, setCalibMm] = useState("1000");
  const [objCount, setObjCount] = useState(0);
  const [selData, setSelData] = useState<any>(null);
  const [bom, setBom] = useState<any[]>([]);
  const [logFlags, setLogFlags] = useState<string[]>([]);
  const [piano, setPiano] = useState(pianoProp);
  const [ascensore, setAscensore] = useState(false);
  const [showBOM, setShowBOM] = useState(false);
  const [showLogistica, setShowLogistica] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(60);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── COORD ─────────────────────────────────────────────
  const pxToMm = (px: number) => px * S.current.cal.mmPerPx;
  const mmToPx = (mm: number) => mm / S.current.cal.mmPerPx;
  const s2m = (sx: number, sy: number) => ({
    x: pxToMm((sx - S.current.pan.x) / S.current.zoom),
    y: pxToMm((sy - S.current.pan.y) / S.current.zoom),
  });
  const m2s = (mx: number, my: number) => ({
    x: mmToPx(mx) * S.current.zoom + S.current.pan.x,
    y: mmToPx(my) * S.current.zoom + S.current.pan.y,
  });
  const dst = (a: any, b: any) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

  // ── SISTEMA ───────────────────────────────────────────
  function setSistema(id: string) {
    S.current.sistema = id;
    setSistemaState(id);
    draw();
  }

  function setColoreRAL(col: string) {
    S.current.coloreRAL = col;
    setColoreRALState(col);
    draw();
  }

  // ── AGGIORNA DATI ─────────────────────────────────────
  function aggiornaOutput() {
    const objs = S.current.objects.filter((o: any) => o.confirmed);
    setBom(calcolaBOM(objs, S.current.sistema));
    setLogFlags(checkLogistica(objs, piano, ascensore));
    // Bbox più grande → lCentro/hCentro
    const poli = objs.filter((o: any) => o.type === "rect" && o.mmW > 0 && o.mmH > 0);
    if (poli.length > 0 && onMisureUpdate) {
      const best = poli.reduce((b: any, o: any) => o.mmW * o.mmH > b.mmW * b.mmH ? o : b);
      onMisureUpdate({ lCentro: Math.round(best.mmW), hCentro: Math.round(best.mmH) });
    }
  }

  // ════════════════════════════════════════════════════════
  // DRAW
  // ════════════════════════════════════════════════════════
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const { mode: m, objects: objs, bgImage, bgOpacity: bgo, cal, calibPts, calibMode, zoom, pan } = S.current;
    const W = cvs.width, H = cvs.height;
    const isTec = m === "tecnico";
    const s = SISTEMI[S.current.sistema];

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = isTec ? "#ffffff" : "#0f1117";
    ctx.fillRect(0, 0, W, H);

    // Griglia tecnica
    if (isTec) {
      const gPx = mmToPx(100) * zoom;
      if (gPx > 20) {
        ctx.strokeStyle = "#e8edf0"; ctx.lineWidth = 0.4;
        const ox = pan.x % gPx, oy = pan.y % gPx;
        for (let x = ox; x < W; x += gPx) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = oy; y < H; y += gPx) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      }
    }

    // Foto sfondo
    if (bgImage) {
      ctx.save(); ctx.globalAlpha = bgo;
      const ar = bgImage.width / bgImage.height;
      let bw = W, bh = W / ar;
      if (bh < H) { bh = H; bw = H * ar; }
      ctx.drawImage(bgImage, (W-bw)/2, (H-bh)/2, bw, bh);
      ctx.restore();
    }

    // Oggetti (z-order: telaio 0, anta 1, coprifilo 2)
    const sorted = [...objs].sort((a: any, b: any) => (a.zOrder||0) - (b.zOrder||0));
    sorted.forEach((o: any, i: number) => drawObj(ctx, o, i === S.current.selIdx, isTec, s));

    // Punti calibrazione
    if (calibMode && calibPts.length > 0) {
      calibPts.forEach((p: any) => {
        const sp = m2s(p.x, p.y);
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 8, 0, Math.PI*2);
        ctx.fillStyle = AMB; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      });
      if (calibPts.length === 2) {
        const s1 = m2s(calibPts[0].x, calibPts[0].y);
        const s2 = m2s(calibPts[1].x, calibPts[1].y);
        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y);
        ctx.strokeStyle = AMB; ctx.lineWidth = 2; ctx.setLineDash([6,3]); ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // Crosshair hover
    if (S.current.hoverMm) {
      const sp = m2s(S.current.hoverMm.x, S.current.hoverMm.y);
      ctx.strokeStyle = AMB; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(sp.x-20, sp.y); ctx.lineTo(sp.x+20, sp.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y-20); ctx.lineTo(sp.x, sp.y+20); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Rettangolo in disegno
    if (S.current.drawing && S.current.tool === "rect") {
      const x0 = S.current.startSx, y0 = S.current.startSy;
      const x1 = S.current.hoverSx || x0, y1 = S.current.hoverSy || y0;
      const dx = x1-x0, dy = y1-y0;
      const mmW = Math.abs(pxToMm(dx/zoom)), mmH = Math.abs(pxToMm(dy/zoom));
      drawRectSolid(ctx, Math.min(x0,x1), Math.min(y0,y1), Math.abs(dx), Math.abs(dy), s, false, isTec, S.current.coloreRAL);
      ctx.fillStyle = AMB; ctx.font = `bold 14px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(mmW)}×${Math.round(mmH)} mm`, (x0+x1)/2, Math.min(y0,y1)-12);
    }

    // Linea misura in disegno
    if (S.current.drawing && S.current.tool === "line") {
      const x0 = S.current.startSx, y0 = S.current.startSy;
      const x1 = S.current.hoverSx || x0, y1 = S.current.hoverSy || y0;
      const dx = x1-x0, dy = y1-y0;
      const mmLen = Math.sqrt(pxToMm(dx/zoom)**2 + pxToMm(dy/zoom)**2);
      // Linea principale
      ctx.save();
      ctx.strokeStyle = BLU; ctx.lineWidth = 2.5; ctx.setLineDash([10,5]);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.setLineDash([]);
      // Tacche estremità
      const angle = Math.atan2(dy, dx);
      const perp = angle + Math.PI/2;
      [{ x:x0,y:y0 },{ x:x1,y:y1 }].forEach(pt => {
        ctx.beginPath();
        ctx.moveTo(pt.x + Math.cos(perp)*8, pt.y + Math.sin(perp)*8);
        ctx.lineTo(pt.x - Math.cos(perp)*8, pt.y - Math.sin(perp)*8);
        ctx.stroke();
      });
      // Quote
      ctx.fillStyle = BLU; ctx.font = `bold 13px monospace`;
      ctx.textAlign = "center";
      const midX = (x0+x1)/2, midY = (y0+y1)/2;
      // Badge bianco sotto il testo
      const label = `${Math.round(mmLen)} mm`;
      ctx.fillStyle = isTec ? "#ffffffcc" : "#111111cc";
      ctx.fillRect(midX - 38, midY - 22, 76, 20);
      ctx.fillStyle = BLU;
      ctx.fillText(label, midX, midY - 6);
      ctx.restore();
    }

    // Render linee misura salvate (type:"line")
    objs.filter((o:any) => o.type === "line").forEach((o:any, i:number) => {
      const p1 = m2s(o.x1, o.y1), p2 = m2s(o.x2, o.y2);
      const isSel = i === S.current.selIdx && objs[S.current.selIdx]?.type === "line";
      ctx.save();
      ctx.strokeStyle = isSel ? AMB : BLU+"99";
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      ctx.setLineDash([8,4]);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.setLineDash([]);
      // Tacche
      const angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);
      const perp = angle + Math.PI/2;
      [p1, p2].forEach(pt => {
        ctx.beginPath();
        ctx.moveTo(pt.x + Math.cos(perp)*6, pt.y + Math.sin(perp)*6);
        ctx.lineTo(pt.x - Math.cos(perp)*6, pt.y - Math.sin(perp)*6);
        ctx.stroke();
      });
      // Etichetta
      const mmLen = Math.round(Math.sqrt((o.x2-o.x1)**2 + (o.y2-o.y1)**2));
      ctx.fillStyle = isSel ? AMB : BLU;
      ctx.font = `bold ${isSel?13:11}px monospace`;
      ctx.textAlign = "center";
      const mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
      ctx.fillStyle = isTec ? "#ffffffcc" : "#0f1117cc";
      ctx.fillRect(mx-32, my-18, 64, 16);
      ctx.fillStyle = isSel ? AMB : BLU;
      ctx.fillText(`${mmLen}mm`, mx, my-5);
      ctx.restore();
    });
  }, []);

  function drawObj(ctx: any, o: any, sel: boolean, isTec: boolean, s: any) {
    ctx.globalAlpha = o.confirmed ? 1 : 0.55;
    if (o.type === "rect") {
      const p1 = m2s(o.x, o.y);
      const sw = mmToPx(o.mmW) * S.current.zoom;
      const sh = mmToPx(o.mmH) * S.current.zoom;
      drawRectSolid(ctx, p1.x, p1.y, sw, sh, s, sel, isTec, S.current.coloreRAL);
      // Quote
      if (o.confirmed) drawQuoteRect(ctx, p1.x, p1.y, sw, sh, o.mmW, o.mmH, isTec, sel);
      // Divisori ante
      const nAnte = o.nAnte || 1;
      if (o.confirmed && nAnte > 1) {
        const sp = mmToPx(s.telaio/2) * S.current.zoom;
        const antaW = sw / nAnte;
        ctx.save();
        ctx.strokeStyle = sel ? "#D08008" : (isTec ? s.col : "#fff8");
        ctx.lineWidth = isTec ? 1.5 : 1;
        ctx.setLineDash([]);
        for (let i = 1; i < nAnte; i++) {
          const lx = p1.x + antaW * i;
          ctx.beginPath();
          ctx.moveTo(lx, p1.y + sp);
          ctx.lineTo(lx, p1.y + sh - sp);
          ctx.stroke();
        }
        // Label nAnte
        ctx.font = `bold ${Math.max(10, 12 * S.current.zoom)}px system-ui`;
        ctx.fillStyle = sel ? "#D08008" : (isTec ? s.col : "#D08008");
        ctx.textAlign = "center";
        ctx.fillText(`${nAnte}A`, p1.x + sw / 2, p1.y + sh / 2 + 4);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawRectSolid(ctx: any, x: number, y: number, w: number, h: number, s: any, sel: boolean, isTec: boolean, ral: string) {
    const sp = mmToPx(s.telaio/2) * S.current.zoom;
    const ralCol = RAL[ral] || RAL["RAL 7016"];

    if (isTec) {
      // Modalità TECNICO — profilo con hatch sezione
      ctx.save();
      const outerPath = new Path2D();
      outerPath.rect(x, y, w, h);
      const innerPath = new Path2D();
      innerPath.rect(x+sp, y+sp, w-sp*2, h-sp*2);

      // Fill sezione profilo
      ctx.fillStyle = "#d0d8e0"; ctx.fill(outerPath);
      ctx.fillStyle = "#a0c0e0aa"; ctx.fill(innerPath); // vetro

      // Hatch sezione tecnica
      ctx.save();
      ctx.clip(outerPath);
      ctx.strokeStyle = s.col + "60"; ctx.lineWidth = 0.7;
      for (let t = -Math.max(w,h)*2; t < Math.max(w,h)*2; t += 5) {
        ctx.beginPath(); ctx.moveTo(x+t, y); ctx.lineTo(x+t+h, y+h); ctx.stroke();
      }
      ctx.restore();

      // Bordi profilo
      ctx.strokeStyle = sel ? AMB : s.col; ctx.lineWidth = sel ? 2.5 : 1.8;
      ctx.stroke(outerPath);
      // Vetro pattern
      ctx.strokeStyle = "#7ab0cc50"; ctx.lineWidth = 0.8; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(x+sp, y+sp); ctx.lineTo(x+w-sp, y+h-sp); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w-sp, y+sp); ctx.lineTo(x+sp, y+h-sp); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else {
      // Modalità RENDER — profilo solido con colore RAL
      ctx.save();

      // Telaio esterno con colore RAL
      const grad = ctx.createLinearGradient(x, y, x+w, y+h);
      grad.addColorStop(0, ralCol + "dd");
      grad.addColorStop(0.5, ralCol);
      grad.addColorStop(1, ralCol + "aa");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill();

      // Profilo spessore
      ctx.strokeStyle = "#000000aa"; ctx.lineWidth = sp*0.4; ctx.strokeRect(x+sp*0.2, y+sp*0.2, w-sp*0.4, h-sp*0.4);

      // Vetro camera — effetto reale
      const glassBg = ctx.createLinearGradient(x+sp, y+sp, x+w-sp, y+h-sp);
      glassBg.addColorStop(0, "#a8d4f080");
      glassBg.addColorStop(0.4, "#c8e8ff30");
      glassBg.addColorStop(1, "#80b8d860");
      ctx.fillStyle = glassBg;
      ctx.fillRect(x+sp, y+sp, w-sp*2, h-sp*2);

      // Riflessione vetro
      ctx.save(); ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x+sp+4, y+sp+4, (w-sp*2)*0.12, (h-sp*2)*0.7);
      ctx.restore();

      // Bordo selezione
      if (sel) { ctx.strokeStyle = AMB; ctx.lineWidth = 3; ctx.strokeRect(x-2, y-2, w+4, h+4); }

      ctx.restore();
    }
  }

  function drawQuoteRect(ctx: any, x: number, y: number, w: number, h: number, mmW: number, mmH: number, isTec: boolean, sel: boolean) {
    const col = sel ? AMB : (isTec ? "#2a3a4a" : "#b0c8e0");
    ctx.font = `bold ${Math.max(11, 13*S.current.zoom)}px monospace`;
    ctx.fillStyle = col; ctx.textAlign = "center";
    // Quota larghezza in cima
    const qY = y - 18;
    ctx.beginPath(); ctx.moveTo(x, y-4); ctx.lineTo(x, qY); ctx.stroke? null : null;
    ctx.strokeStyle = col; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, qY); ctx.lineTo(x+w, qY); ctx.stroke();
    ctx.fillText(`${Math.round(mmW)}mm`, x+w/2, qY-4);
    // Quota altezza a destra
    ctx.save(); ctx.translate(x+w+22, y+h/2); ctx.rotate(Math.PI/2);
    ctx.fillText(`${Math.round(mmH)}mm`, 0, 0);
    ctx.restore();
  }

  // ── RESIZE ────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      if (!canvasRef.current || !wrapRef.current) return;
      canvasRef.current.width = wrapRef.current.clientWidth;
      canvasRef.current.height = wrapRef.current.clientHeight;
      draw();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => { S.current.bgOpacity = bgOpacity / 100; draw(); }, [bgOpacity]);

  // ── TOUCH EVENTS ─────────────────────────────────────
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const getTouchPos = (e: TouchEvent) => {
      const r = cvs.getBoundingClientRect();
      const t = e.touches[0] || e.changedTouches[0];
      return { sx: t.clientX - r.left, sy: t.clientY - r.top };
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); e.stopPropagation();
      const { sx, sy } = getTouchPos(e);

      if (S.current.calibMode) {
        const mm = s2m(sx, sy);
        S.current.calibPts.push(mm);
        draw();
        if (S.current.calibPts.length === 2) {
          setCalibStep("input");
        } else {
          setCalibStep("pt2");
        }
        return;
      }

      // Primo tap — controlla se dentro telaio confermato (tool sel → incrementa ante)
      if (S.current.tool === "sel") {
        const objs = S.current.objects;
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i];
          if (!o.confirmed || o.type !== "rect") continue;
          // calcola posizione screen del rettangolo
          const p1x = (o.x / S.current.cal.mmPerPx) * S.current.zoom + S.current.pan.x;
          const p1y = (o.y / S.current.cal.mmPerPx) * S.current.zoom + S.current.pan.y;
          const sw = (o.mmW / S.current.cal.mmPerPx) * S.current.zoom;
          const sh = (o.mmH / S.current.cal.mmPerPx) * S.current.zoom;
          if (sx >= p1x && sx <= p1x + sw && sy >= p1y && sy <= p1y + sh) {
            o.nAnte = ((o.nAnte || 1) % 6) + 1;
            S.current.selIdx = i;
            setSelData({ idx: i, obj: o });
            draw();
            // aggiornaOutput è definita fuori, chiamiamo via ref workaround
            const confirmed = S.current.objects.filter((x:any) => x.confirmed);
            setBom(calcolaBOM(confirmed, S.current.sistema));
            return;
          }
        }
      }

      // Doppio tap: primo → mirino, secondo → conferma
      if (S.current.pendingTap) {
        const prev = S.current.pendingTap;
        const dist = Math.sqrt((sx-prev.sx)**2 + (sy-prev.sy)**2);
        if (dist < 80) {
          clearTimeout(S.current.pendingTimer);
          S.current.pendingTap = null;
          if (S.current.tool === "rect") {
            startRect(prev.sx, prev.sy);
          } else if (S.current.tool === "line") {
            startLine(prev.sx, prev.sy);
          }
          draw();
          return;
        }
      }

      // Primo tap — mostra mirino
      if (S.current.pendingTimer) clearTimeout(S.current.pendingTimer);
      S.current.pendingTap = { sx, sy };
      const mm = s2m(sx, sy);
      S.current.hoverMm = mm;
      drawPendingMirino(sx, sy);
      S.current.pendingTimer = setTimeout(() => {
        S.current.pendingTap = null;
        S.current.hoverMm = null;
        draw();
      }, 2500);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!S.current.drawing) return;
      const { sx, sy } = getTouchPos(e);
      S.current.hoverSx = sx; S.current.hoverSy = sy;
      const mm = s2m(sx, sy);
      S.current.hoverMm = mm;
      draw();
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (!S.current.drawing) return;
      const { sx, sy } = getTouchPos(e);
      if (S.current.tool === "rect") endRect(sx, sy);
      else if (S.current.tool === "line") endLine(sx, sy);
    };

    cvs.addEventListener("touchstart", onTouchStart, { passive: false });
    cvs.addEventListener("touchmove", onTouchMove, { passive: false });
    cvs.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      cvs.removeEventListener("touchstart", onTouchStart);
      cvs.removeEventListener("touchmove", onTouchMove);
      cvs.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // Mouse per desktop
  const onMouseMove = (e: any) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    S.current.hoverMm = s2m(sx, sy);
    if (S.current.drawing) { S.current.hoverSx = sx; S.current.hoverSy = sy; }
    draw();
  };
  // Hit test: punto screen inside rettangolo confermato
  function hitTestRect(sx: number, sy: number): number {
    const objs = S.current.objects;
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (!o.confirmed || o.type !== "rect") continue;
      const p1 = m2s(o.x, o.y);
      const sw = mmToPx(o.mmW) * S.current.zoom;
      const sh = mmToPx(o.mmH) * S.current.zoom;
      if (sx >= p1.x && sx <= p1.x + sw && sy >= p1.y && sy <= p1.y + sh) return i;
    }
    return -1;
  }

  const onMouseDown = (e: any) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (S.current.calibMode) {
      const mm = s2m(sx, sy);
      S.current.calibPts.push(mm); draw();
      if (S.current.calibPts.length === 2) setCalibStep("input");
      else setCalibStep("pt2");
      return;
    }
    if (S.current.tool === "sel") {
      // Prima controlla linee (priorità bassa z-order)
      const objs = S.current.objects;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (o.type !== "line") continue;
        const p1 = m2s(o.x1, o.y1), p2 = m2s(o.x2, o.y2);
        // Distanza punto-segmento
        const len2 = (p2.x-p1.x)**2 + (p2.y-p1.y)**2;
        if (len2 < 1) continue;
        const t = Math.max(0, Math.min(1, ((sx-p1.x)*(p2.x-p1.x) + (sy-p1.y)*(p2.y-p1.y)) / len2));
        const dist = Math.sqrt((sx - (p1.x + t*(p2.x-p1.x)))**2 + (sy - (p1.y + t*(p2.y-p1.y)))**2);
        if (dist < 14) {
          S.current.selIdx = i;
          setSelData({ idx: i, obj: o });
          draw();
          return;
        }
      }
      // Poi rettangoli confermati → incrementa ante
      const hit = hitTestRect(sx, sy);
      if (hit >= 0) {
        const obj = S.current.objects[hit];
        obj.nAnte = ((obj.nAnte || 1) % 6) + 1;
        S.current.selIdx = hit;
        setSelData({ idx: hit, obj });
        draw();
        aggiornaOutput();
        return;
      }
    }
    if (S.current.tool === "rect") startRect(sx, sy);
    if (S.current.tool === "line") startLine(sx, sy);
  };
  const onMouseUp = (e: any) => {
    if (!S.current.drawing) return;
    const r = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    if (S.current.tool === "rect") endRect(sx, sy);
    else if (S.current.tool === "line") endLine(sx, sy);
  };

  function startRect(sx: number, sy: number) {
    S.current.drawing = true;
    S.current.startSx = sx; S.current.startSy = sy;
    S.current.hoverSx = sx; S.current.hoverSy = sy;
  }

  function startLine(sx: number, sy: number) {
    S.current.drawing = true;
    S.current.startSx = sx; S.current.startSy = sy;
    S.current.hoverSx = sx; S.current.hoverSy = sy;
  }

  function endLine(sx: number, sy: number) {
    if (!S.current.drawing) return;
    S.current.drawing = false;
    const x0 = S.current.startSx, y0 = S.current.startSy;
    const dx = sx - x0, dy = sy - y0;
    if (Math.sqrt(dx*dx + dy*dy) < 10) { draw(); return; }
    const mm0 = s2m(x0, y0);
    const mm1 = s2m(sx, sy);
    const mmLen = Math.round(Math.sqrt((mm1.x-mm0.x)**2 + (mm1.y-mm0.y)**2));
    const obj: any = {
      type: "line", zOrder: -1,
      x1: mm0.x, y1: mm0.y,
      x2: mm1.x, y2: mm1.y,
      mmLen,
      confirmed: true,
    };
    S.current.history.push(JSON.stringify(S.current.objects));
    S.current.objects.push(obj);
    S.current.selIdx = S.current.objects.length - 1;
    setSelData({ idx: S.current.objects.length - 1, obj });
    setObjCount(S.current.objects.length);
    draw();
  }

  function endRect(sx: number, sy: number) {
    if (!S.current.drawing) return;
    S.current.drawing = false;
    const x0 = S.current.startSx, y0 = S.current.startSy;
    const dx = sx - x0, dy = sy - y0;
    if (Math.abs(dx) < 10 || Math.abs(dy) < 10) { draw(); return; }
    const mm0 = s2m(x0, y0);
    const mmW = Math.abs(pxToMm(dx / S.current.zoom));
    const mmH = Math.abs(pxToMm(dy / S.current.zoom));
    const obj: any = {
      type: "rect", zOrder: 0,
      x: Math.min(mm0.x, mm0.x + (dx > 0 ? mmW : -mmW)),
      y: Math.min(mm0.y, mm0.y + (dy > 0 ? mmH : -mmH)),
      mmW, mmH,
      sistema: S.current.sistema,
      colore: S.current.coloreRAL,
      confirmed: false,
      nAnte: 1,
    };
    S.current.history.push(JSON.stringify(S.current.objects));
    S.current.objects.push(obj);
    S.current.selIdx = S.current.objects.length - 1;
    setSelData({ idx: S.current.objects.length - 1, obj });
    setObjCount(S.current.objects.length);
    draw();
  }

  function drawPendingMirino(sx: number, sy: number) {
    draw();
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI*2);
    ctx.fillStyle = AMB; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = AMB; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx-32, sy); ctx.lineTo(sx+32, sy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy-32); ctx.lineTo(sx, sy+32); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2);
    ctx.fillStyle = AMB; ctx.fill();
    ctx.fillStyle = AMB; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center";
    const bg = "#0a0c10cc";
    ctx.fillStyle = bg; ctx.fillRect(sx-90, sy-56, 180, 20);
    ctx.fillStyle = AMB; ctx.fillText("Tocca di nuovo per iniziare", sx, sy-42);
  }

  // ── CALIBRAZIONE ─────────────────────────────────────
  function startCalib() {
    S.current.calibMode = true;
    S.current.calibPts = [];
    setCalibStep("pt1");
  }

  function confirmCalib() {
    const mm = parseFloat(calibMm) || 1000;
    const dpx = dst(S.current.calibPts[0], S.current.calibPts[1]);
    if (dpx < 2) return;
    S.current.cal.mmPerPx = mm / dpx;
    S.current.cal.calibrated = true;
    S.current.calibMode = false;
    S.current.calibPts = [];
    setCalibrated(true);
    setCalibStep("idle");
    draw();
  }

  // ── CONFERMA OGGETTO ─────────────────────────────────
  function confermaSel() {
    if (S.current.selIdx < 0) return;
    S.current.objects[S.current.selIdx].confirmed = true;
    S.current.selIdx = -1;
    setSelData(null);
    setObjCount(S.current.objects.length);
    aggiornaOutput();
    draw();
  }

  function eliminaSel() {
    if (S.current.selIdx < 0) return;
    S.current.history.push(JSON.stringify(S.current.objects));
    S.current.objects.splice(S.current.selIdx, 1);
    S.current.selIdx = -1;
    setSelData(null);
    setObjCount(S.current.objects.length);
    draw();
  }

  function undo() {
    if (S.current.history.length === 0) return;
    S.current.objects = JSON.parse(S.current.history.pop());
    S.current.selIdx = -1;
    setSelData(null);
    setObjCount(S.current.objects.length);
    draw();
  }

  const isTec = mode === "tecnico";
  const bg = isTec ? "#F2F1EC" : "#0f1117";
  const card = isTec ? "#ffffff" : "#141820";
  const text = isTec ? "#1A1A1C" : "#e8eef4";
  const sub = isTec ? "#888" : "#556";
  const bdr = isTec ? "#ddd" : "#2a2e38";
  const s = SISTEMI[sistema];

  // ── RENDER ────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, display:"flex", flexDirection:"column", fontFamily:"system-ui", background: bg }}>

      {/* ── TOPBAR ── */}
      <div style={{ background:"#1A1A1C", padding:"8px 12px", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#888", fontSize:22, cursor:"pointer" }}>←</button>
        <div style={{ color:"#fff", fontSize:14, fontWeight:700, flex:1 }}>
          {vanoNome || "Vano"} {objCount > 0 && <span style={{ fontSize:10, color:"#666", marginLeft:6 }}>{objCount} el.</span>}
        </div>

        {/* Toggle TECNICO/RENDER */}
        <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid #333` }}>
          {[["tecnico","▤ TECNICO"],["render","◉ RENDER"]].map(([m,l])=>(
            <button key={m} onClick={()=>{ S.current.mode=m; setMode(m as any); draw(); }} style={{
              padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer", border:"none", fontFamily:"inherit",
              background: mode===m ? (m==="tecnico"?"#2a3a4a":"#D08008") : "#1a1a1a",
              color: mode===m ? "#fff" : "#555",
            }}>{l}</button>
          ))}
        </div>

        {/* Calibra */}
        <button onClick={calibStep==="idle" ? startCalib : ()=>{ S.current.calibMode=false; S.current.calibPts=[]; setCalibStep("idle"); }} style={{
          padding:"5px 10px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", border:"none", fontFamily:"inherit",
          background: calibrated ? GRN+"20" : RED+"20",
          color: calibrated ? GRN : RED,
        }}>
          {calibrated ? "✓ Cal." : calibStep!=="idle" ? "Annulla" : "⚠ Calibra"}
        </button>

        {/* Salva */}
        {objCount > 0 && (
          <button onClick={()=>{ aggiornaOutput(); if(onSalva) onSalva({ mode, oggetti: S.current.objects, cal: S.current.cal, sistema, coloreRAL, bom }); onClose(); }} style={{
            padding:"6px 14px", borderRadius:9, border:"none", background:GRN, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>Salva</button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ background: isTec ? "#f8f9fa" : "#111", borderBottom:`1px solid ${bdr}`, padding:"5px 8px", display:"flex", gap:4, alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
        {/* Tool */}
        {[{id:"rect",l:"□ Rettangolo"},{id:"line",l:"╱ Linea"},{id:"sel",l:"↖ Sel"}].map(t=>(
          <button key={t.id} onClick={()=>{ S.current.tool=t.id; }} style={{
            padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
            border:`1px solid ${S.current.tool===t.id?AMB:bdr}`,
            background: S.current.tool===t.id ? AMB+"18" : card,
            color: S.current.tool===t.id ? AMB : sub,
          }}>{t.l}</button>
        ))}
        <div style={{ width:1, height:18, background:bdr }}/>

        {/* Sistema */}
        {Object.entries(SISTEMI).map(([id,ss]: any)=>(
          <button key={id} onClick={()=>setSistema(id)} style={{
            padding:"4px 9px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            border:`1px solid ${sistema===id ? ss.col : bdr}`,
            background: sistema===id ? ss.col+"20" : card,
            color: sistema===id ? ss.col : sub,
          }}>{ss.n}</button>
        ))}
        <div style={{ width:1, height:18, background:bdr }}/>

        {/* Foto */}
        <label style={{ fontSize:11, fontWeight:600, color: S.current.bgImage ? GRN : sub, cursor:"pointer", padding:"5px 10px", borderRadius:7, border:`1px solid ${bdr}`, background:card }}>
          📷 {S.current.bgImage ? "Foto" : "Carica foto"}
          <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} ref={fileRef} onChange={e=>{
            const f = e.target.files?.[0]; if(!f) return;
            const img = new Image();
            img.onload = ()=>{ S.current.bgImage=img; draw(); if(!calibrated){ startCalib(); } };
            img.src = URL.createObjectURL(f);
          }}/>
        </label>
        <input type="range" min={0} max={100} value={bgOpacity} onChange={e=>{ setBgOpacity(Number(e.target.value)); S.current.bgOpacity=Number(e.target.value)/100; draw(); }} style={{ width:60, accentColor:AMB }}/>

        <div style={{ width:1, height:18, background:bdr }}/>
        <button onClick={undo} style={{ padding:"5px 8px", borderRadius:7, fontSize:11, cursor:"pointer", border:`1px solid ${bdr}`, background:card, color:sub }}>↩</button>
      </div>

      {/* ── CANVAS + SIDEBAR ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Canvas */}
        <div ref={wrapRef} style={{ flex:1, position:"relative", overflow:"hidden", touchAction:"none" }}>
          <canvas ref={canvasRef}
            style={{ display:"block", touchAction:"none", cursor: S.current.tool==="rect"?"crosshair":"default" }}
            onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}
          />

          {/* Empty state */}
          {objCount === 0 && calibStep === "idle" && (
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", opacity:0.3, pointerEvents:"none" }}>
              <div style={{ fontSize:40, marginBottom:8 }}>□</div>
              <div style={{ fontSize:13, fontWeight:600, color:sub }}>Trascina per disegnare il vano</div>
              {!calibrated && <div style={{ fontSize:11, color:RED, marginTop:4 }}>Carica la foto e calibra prima</div>}
            </div>
          )}

          {/* Banner calibrazione */}
          {calibStep !== "idle" && calibStep !== "input" && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background: isTec?"#fffbe6":"#1a1400", borderTop:`2px solid ${AMB}`, padding:"10px 16px", zIndex:10, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1].map(i=>(
                  <div key={i} style={{ width:12, height:12, borderRadius:6, background: S.current.calibPts.length>i ? GRN : "transparent", border:`2px solid ${AMB}` }}/>
                ))}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800, color:AMB }}>
                  {calibStep==="pt1" ? "📍 Tocca il 1° punto sulla foto" : "📍 Tocca il 2° punto sulla foto"}
                </div>
                <div style={{ fontSize:10, color: isTec?"#888":"#aaa" }}>Es. bordo controtelaio o metro appoggiato al muro</div>
              </div>
              <button onClick={()=>{ S.current.calibMode=false; S.current.calibPts=[]; setCalibStep("idle"); }} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${bdr}`, background:"transparent", color:sub, fontSize:11, cursor:"pointer" }}>Salta</button>
            </div>
          )}

          {/* Numpad calibrazione */}
          {calibStep === "input" && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background: isTec?"#fff":"#0e1016", borderTop:`2px solid ${AMB}`, padding:"14px 16px", zIndex:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:AMB, marginBottom:8, textAlign:"center" }}>Quanti mm è quella linea?</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginBottom:8 }}>
                {["500","1000","1500","2000"].map(v=>(
                  <button key={v} onPointerDown={e=>{e.preventDefault();setCalibMm(v);}} style={{ padding:"11px", borderRadius:8, border:`1px solid ${AMB}40`, background:calibMm===v?AMB:AMB+"15", color:calibMm===v?"#fff":AMB, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{v}</button>
                ))}
              </div>
              <div style={{ fontSize:28, fontWeight:800, fontFamily:"monospace", textAlign:"right", color: isTec?"#1a2a3a":"#fff", padding:"8px 12px", background: isTec?"#f8f9fa":"#131318", borderRadius:8, border:`1px solid ${bdr}`, marginBottom:8 }}>
                {calibMm} mm
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4, marginBottom:6 }}>
                {["7","8","9","4","5","6","1","2","3","0","⌫","OK"].map(k=>(
                  <button key={k} onPointerDown={e=>{ e.preventDefault();
                    if(k==="OK"){confirmCalib();return;}
                    if(k==="⌫"){setCalibMm(v=>v.slice(0,-1));return;}
                    setCalibMm(v=>v+k);
                  }} style={{
                    padding:"12px", borderRadius:8, minHeight:52,
                    border:`1px solid ${k==="OK"?GRN:k==="⌫"?RED: isTec?"#ddd":"#333"}`,
                    background:k==="OK"?GRN:k==="⌫"?RED: isTec?"#fff":"#1a1a1a",
                    color:k==="OK"||k==="⌫"?"#fff": isTec?"#1a2a3a":"#fff",
                    fontSize:k==="OK"||k==="⌫"?13:22, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  }}>{k}</button>
                ))}
              </div>
            </div>
          )}

          {/* Panel oggetto selezionato */}
          {selData && (() => {
            const obj = S.current.objects[selData.idx];
            if (!obj) return null;

            // ── LINEA MISURA ──
            if (obj.type === "line") {
              return (
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background: isTec?"#f8f9faee":"#0e1016ee", borderTop:`2px solid ${BLU}`, padding:"12px 16px 20px", borderRadius:"12px 12px 0 0", backdropFilter:"blur(8px)", zIndex:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:BLU }}>╱ Linea misura — {Math.round(obj.mmLen)} mm</div>
                    <div onClick={()=>{ S.current.selIdx=-1; setSelData(null); draw(); }} style={{ color:sub, cursor:"pointer", fontSize:18 }}>×</div>
                  </div>
                  <div style={{ fontSize:11, color:sub, marginBottom:10 }}>
                    Larghezza da usare per il nuovo infisso: <strong style={{color:text}}>{Math.round(obj.mmLen)} mm</strong>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ fontSize:11, color:sub, whiteSpace:"nowrap" }}>Altezza (mm):</div>
                    <input
                      id="lineH"
                      type="number"
                      defaultValue={1200}
                      style={{ flex:1, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${BLU}`, fontSize:15, fontWeight:700, color:BLU, background: isTec?"#f8f9fa":"#111", fontFamily:"inherit", outline:"none" }}
                    />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{
                      const hInput = (document.getElementById("lineH") as HTMLInputElement);
                      const mmH = parseFloat(hInput?.value) || 1200;
                      const mmW = Math.round(obj.mmLen);
                      // Piazza il rettangolo sotto il punto iniziale della linea
                      const newObj: any = {
                        type:"rect", zOrder:0,
                        x: obj.x1, y: obj.y1,
                        mmW, mmH,
                        sistema: S.current.sistema,
                        colore: S.current.coloreRAL,
                        confirmed: false,
                        nAnte: 1,
                      };
                      S.current.history.push(JSON.stringify(S.current.objects));
                      S.current.objects.push(newObj);
                      S.current.selIdx = S.current.objects.length - 1;
                      setSelData({ idx: S.current.objects.length - 1, obj: newObj });
                      setObjCount(S.current.objects.length);
                      draw();
                    }} style={{ flex:2, padding:11, borderRadius:9, border:"none", background:GRN, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                      □ Crea infisso {Math.round(obj.mmLen)}mm
                    </button>
                    <button onClick={eliminaSel} style={{ flex:1, padding:10, borderRadius:9, border:`1px solid ${RED}`, background:RED+"18", color:RED, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                  </div>
                </div>
              );
            }

            // ── RETTANGOLO ──
            return (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background: isTec?"#f8f9faee":"#0e1016ee", borderTop:`1px solid ${bdr}`, padding:"10px 12px 20px", borderRadius:"12px 12px 0 0", backdropFilter:"blur(8px)", zIndex:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:AMB }}>
                    {Math.round(obj.mmW||0)} × {Math.round(obj.mmH||0)} mm
                    {(obj.nAnte||1) > 1 && <span style={{ marginLeft:8, color:BLU, fontSize:11 }}>{obj.nAnte} ante</span>}
                  </div>
                  <div onClick={()=>{ S.current.selIdx=-1; setSelData(null); draw(); }} style={{ color:sub, cursor:"pointer", fontSize:18 }}>×</div>
                </div>
                {/* Colore RAL */}
                <div style={{ fontSize:9, color:sub, textTransform:"uppercase", letterSpacing:0.6, marginBottom:5 }}>Colore</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
                  {Object.entries(RAL).map(([name,hex])=>(
                    <div key={name} onClick={()=>{ setColoreRAL(name); }} title={name} style={{
                      width:24, height:24, borderRadius:4, background:hex, cursor:"pointer",
                      border:`2px solid ${coloreRAL===name?AMB:"transparent"}`,
                      boxShadow: coloreRAL===name?`0 0 0 2px ${AMB}40`:"none",
                    }}/>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={confermaSel} style={{ flex:1, padding:10, borderRadius:9, border:`1px solid ${GRN}`, background:GRN+"18", color:GRN, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✓ Conferma</button>
                  <button onClick={eliminaSel} style={{ flex:1, padding:10, borderRadius:9, border:`1px solid ${RED}`, background:RED+"18", color:RED, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✕ Elimina</button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── SIDEBAR DESTRA — Colore + BOM + Logistica ── */}
        {objCount > 0 && !selData && (
          <div style={{ width:200, background: isTec?"#f8f9fa":"#111", borderLeft:`1px solid ${bdr}`, display:"flex", flexDirection:"column", overflow:"auto", flexShrink:0 }}>
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:sub, textTransform:"uppercase", letterSpacing:0.6, marginBottom:8 }}>Colore RAL</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4, marginBottom:8 }}>
                {Object.entries(RAL).map(([name,hex])=>(
                  <div key={name} onClick={()=>setColoreRAL(name)} title={name} style={{
                    height:32, borderRadius:6, background:hex, cursor:"pointer",
                    border:`2px solid ${coloreRAL===name?AMB:"transparent"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {coloreRAL===name&&<span style={{fontSize:10,color:hex<"#888"?"#fff":"#000",fontWeight:800}}>✓</span>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize:9, color:sub, marginBottom:4 }}>{coloreRAL}</div>

              {/* BOM */}
              {bom.length > 0 && <>
                <div style={{ fontSize:10, fontWeight:700, color:sub, textTransform:"uppercase", letterSpacing:0.6, marginTop:12, marginBottom:6 }}>Distinta materiali</div>
                {bom.map((b,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:text, padding:"3px 0", borderBottom:`1px solid ${bdr}` }}>
                    <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.voce}</span>
                    <span style={{ fontWeight:700, marginLeft:4, color:AMB }}>{b.qta} {b.um}</span>
                  </div>
                ))}
              </>}

              {/* Logistica */}
              {logFlags.length > 0 && <>
                <div style={{ fontSize:10, fontWeight:700, color:RED, textTransform:"uppercase", letterSpacing:0.6, marginTop:12, marginBottom:6 }}>Logistica</div>
                {logFlags.map((f,i)=>(
                  <div key={i} style={{ fontSize:9, color:RED, marginBottom:4 }}>{f}</div>
                ))}
              </>}

              {/* Piano */}
              <div style={{ fontSize:10, fontWeight:700, color:sub, textTransform:"uppercase", letterSpacing:0.6, marginTop:12, marginBottom:6 }}>Piano</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>setPiano(p=>Math.max(0,p-1))} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${bdr}`, background:card, color:text, fontSize:18, cursor:"pointer" }}>−</button>
                <div style={{ flex:1, textAlign:"center", fontSize:18, fontWeight:800, color:text }}>{piano}</div>
                <button onClick={()=>{ setPiano(p=>p+1); aggiornaOutput(); }} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${GRN}`, background:GRN+"15", color:GRN, fontSize:18, cursor:"pointer" }}>+</button>
              </div>
              <div onClick={()=>setAscensore(a=>!a)} style={{ marginTop:6, padding:"6px 8px", borderRadius:6, border:`1px solid ${ascensore?GRN:bdr}`, background:ascensore?GRN+"15":card, color:ascensore?GRN:sub, fontSize:10, fontWeight:700, cursor:"pointer", textAlign:"center" }}>
                {ascensore?"✓ Ascensore":"Ascensore"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
