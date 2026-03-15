"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO CAD v2 — Motore Parametrico Gerarchico
// Gesto libero con dito → Infisso tecnico strutturato
// Gerarchia: Telaio → Montanti/Traversi → Ante → Vetro
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from "react";

// ── SISTEMI PROFILI ──────────────────────────────────────
const SISTEMI: Record<string, any> = {
  alu:   { n:"Alluminio", telaio:65,  anta:55,  mont:62,  trav:55,  col:"#4a7a9b", fill:"#d0e8f8" },
  pvc:   { n:"PVC",       telaio:80,  anta:70,  mont:76,  trav:70,  col:"#5a8a5a", fill:"#d8f0d8" },
  legno: { n:"Legno",     telaio:92,  anta:78,  mont:86,  trav:78,  col:"#8a6a40", fill:"#f0e0c8" },
  ferro: { n:"Ferro",     telaio:45,  anta:38,  mont:42,  trav:38,  col:"#5a5a6a", fill:"#e0e0e8" },
};

const RAL: Record<string, string> = {
  "RAL 9016":"#f1f0ea","RAL 9005":"#0e0e10","RAL 7016":"#383e42",
  "RAL 8014":"#4a3728","RAL 6005":"#2f4538","Naturale":"#c8a87a",
  "Rovere":"#9b6a3a","Noce":"#6b4226","RAL 1013":"#e9e5ce",
};

const AMB="#D08008", GRN="#1A9E73", RED="#DC4444", BLU="#3B7FE0";
const VETRO_COL = "rgba(180,220,255,0.35)";
const VETRO_STROKE = "rgba(100,180,255,0.6)";

// ── TIPI DATI ────────────────────────────────────────────
// Un Infisso è la struttura radice
// Contiene: telaio (perimetro), divisori (montanti+traversi), ante, vetri
interface Punto { x: number; y: number; }

interface Telaio {
  id: string;
  tipo: "rettangolo" | "arco" | "poligono";
  // Per rettangolo: x,y,w,h in mm
  x: number; y: number; w: number; h: number;
  // Spessore profilo in mm (dal sistema)
  spessore: number;
  sistema: string;
  colore: string;
  // Punti per forme libere (normalizzati in mm relativi al bbox)
  punti?: Punto[];
}

interface Divisore {
  id: string;
  tipo: "montante" | "traverso";
  // Posizione relativa (0-1) rispetto al telaio interno
  pos: number;
  // In mm dal bordo interno sinistro (montante) o superiore (traverso)
  posMm: number;
  spessore: number;
}

interface Anta {
  id: string;
  // Indice specchiatura (colonna, riga)
  col: number; row: number;
  apertura: "fisso" | "sx" | "dx" | "bilico" | "vasistas" | "scorrevole";
}

interface Infisso {
  id: string;
  telaio: Telaio;
  montanti: Divisore[];  // verticali
  traversi: Divisore[];  // orizzontali
  ante: Anta[];
  // Misure reali
  lCentro: number;
  hCentro: number;
}

// ── PROPS ────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSalva?: (data: any) => void;
  onMisureUpdate?: (mis: { lCentro: number; hCentro: number }) => void;
  vanoNome?: string;
  piano?: number;
  lCentroIniziale?: number;
  hCentroIniziale?: number;
}

// ── UTILITÀ ──────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function snap(v: number, grid: number = 10) {
  return Math.round(v / grid) * grid;
}

function snapAngle(dx: number, dy: number): [number, number] {
  const angle = Math.atan2(dy, dx);
  const len = Math.sqrt(dx*dx + dy*dy);
  const snapped = Math.round(angle / (Math.PI/4)) * (Math.PI/4);
  return [Math.cos(snapped)*len, Math.sin(snapped)*len];
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════
export default function MastroCAD2({
  onClose, onSalva, onMisureUpdate,
  vanoNome = "Vano",
  piano: pianoProp = 1,
  lCentroIniziale = 1200,
  hCentroIniziale = 1400,
}: Props) {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  // ── STATE UI ─────────────────────────────────────────
  const [sistema, setSistema] = useState("alu");
  const [colore,  setColore]  = useState("RAL 7016");
  const [mode,    setMode]    = useState<"tecnico"|"render">("tecnico");
  const [tool,    setTool]    = useState<"disegna"|"montante"|"traverso"|"anta"|"sel">("disegna");

  // Infisso corrente (uno alla volta per ora)
  const [infisso, setInfisso] = useState<Infisso | null>(null);
  const [selItem, setSelItem] = useState<{tipo:string,id:string}|null>(null);

  // Numpad per quote
  const [numpad,    setNumpad]    = useState<{campo:string,val:string,label:string}|null>(null);

  // Disegno in corso (gesto libero)
  const drawing = useRef<{
    active: boolean;
    startX: number; startY: number;
    curX: number; curY: number;
    pts: Punto[]; // per forme libere
  }>({ active:false, startX:0, startY:0, curX:0, curY:0, pts:[] });

  // Viewport (pan/zoom)
  const vp = useRef({ zoom: 1, panX: 0, panY: 0 });

  // ── CONVERSIONI COORDINATE ───────────────────────────
  // Da px schermo → mm logici (l'infisso vive in spazio mm)
  // Il canvas ha uno spazio virtuale in mm centrato
  const SCALE = useRef(1); // px per mm al zoom=1

  function initScale() {
    const cvs = canvasRef.current;
    if (!cvs) return;
    // Fit l'infisso nel canvas con padding
    const pad = 80;
    const availW = cvs.width - pad*2;
    const availH = cvs.height - pad*2;
    if (infisso) {
      SCALE.current = Math.min(availW/infisso.lCentro, availH/infisso.hCentro) * 0.8;
    } else {
      SCALE.current = Math.min(availW/lCentroIniziale, availH/hCentroIniziale) * 0.8;
    }
  }

  function s2mm(sx: number, sy: number): Punto {
    const cvs = canvasRef.current!;
    const cx = cvs.width/2 + vp.current.panX;
    const cy = cvs.height/2 + vp.current.panY;
    const sc = SCALE.current * vp.current.zoom;
    return {
      x: (sx - cx) / sc,
      y: (sy - cy) / sc,
    };
  }

  function mm2s(mx: number, my: number): Punto {
    const cvs = canvasRef.current!;
    const cx = cvs.width/2 + vp.current.panX;
    const cy = cvs.height/2 + vp.current.panY;
    const sc = SCALE.current * vp.current.zoom;
    return { x: cx + mx*sc, y: cy + my*sc };
  }

  // ── RESIZE CANVAS ────────────────────────────────────
  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cvs || !wrap) return;
    const resize = () => {
      cvs.width  = wrap.clientWidth;
      cvs.height = wrap.clientHeight;
      initScale();
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [infisso]);

  // ── DISEGNO CANVAS ───────────────────────────────────
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const W = cvs.width, H = cvs.height;
    const isTec = mode === "tecnico";

    // Background
    ctx.fillStyle = isTec ? "#F2F1EC" : "#0f1117";
    ctx.fillRect(0, 0, W, H);

    // Griglia
    if (isTec) drawGrid(ctx, W, H);

    // Se c'è un infisso, disegnalo
    if (infisso) {
      drawInfisso(ctx, infisso);
    }

    // Gesto in corso
    if (drawing.current.active && tool === "disegna") {
      const s = SCALE.current * vp.current.zoom;
      const { startX, startY, curX, curY } = drawing.current;
      ctx.strokeStyle = AMB;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      const dx = curX - startX, dy = curY - startY;
      ctx.strokeRect(startX, startY, dx, dy);
      ctx.setLineDash([]);

      // Quote live
      const mmW = Math.abs(dx) / s;
      const mmH = Math.abs(dy) / s;
      ctx.fillStyle = AMB;
      ctx.font = "bold 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(snap(mmW))} mm`, startX + dx/2, Math.min(startY, curY) - 8);
      ctx.save();
      ctx.translate(Math.max(startX, curX) + 16, startY + dy/2);
      ctx.rotate(Math.PI/2);
      ctx.fillText(`${Math.round(snap(mmH))} mm`, 0, 0);
      ctx.restore();
    }
  }, [infisso, mode, tool]);

  function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const s = SCALE.current * vp.current.zoom;
    // Griglia 100mm
    const step = s * 100;
    if (step < 8) return;
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    const cx = W/2 + vp.current.panX;
    const cy = H/2 + vp.current.panY;
    for (let x = cx % step; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = cy % step; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Assi
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  }

  function drawInfisso(ctx: CanvasRenderingContext2D, inf: Infisso) {
    const s = SCALE.current * vp.current.zoom;
    const isTec = mode === "tecnico";
    const sys = SISTEMI[inf.telaio.sistema];
    const ral = RAL[inf.telaio.colore] || "#383e42";

    // Coordinate schermo del telaio esterno
    const ox = inf.telaio.x, oy = inf.telaio.y;
    const W = inf.telaio.w, H = inf.telaio.h;
    const sp = inf.telaio.spessore; // spessore telaio in mm

    const ps = mm2s(ox, oy);
    const sW = W * s, sH = H * s;
    const sSp = sp * s; // spessore in px

    // ── Telaio esterno ──────────────────────────────
    // Profilo esterno
    ctx.fillStyle = isTec ? (selItem?.tipo==="telaio" ? AMB+"40" : "#e8e0d8") : ral;
    ctx.fillRect(ps.x, ps.y, sW, sH);

    // Foro interno (area trasparente/vetro)
    ctx.fillStyle = isTec ? "#fff" : "#1a2030";
    ctx.fillRect(ps.x + sSp, ps.y + sSp, sW - sSp*2, sH - sSp*2);

    // Bordo telaio
    ctx.strokeStyle = isTec ? "#333" : ral;
    ctx.lineWidth = isTec ? 1.5 : 2;
    ctx.strokeRect(ps.x, ps.y, sW, sH);
    ctx.strokeRect(ps.x + sSp, ps.y + sSp, sW - sSp*2, sH - sSp*2);

    // Ombra interna profilo
    if (isTec) {
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(ps.x + 2, ps.y + 2, sW - 4, sH - 4);
    }

    // ── Montanti ────────────────────────────────────
    const innerX = ps.x + sSp;
    const innerY = ps.y + sSp;
    const innerW = sW - sSp*2;
    const innerH = sH - sSp*2;

    inf.montanti.forEach(m => {
      const mx = innerX + m.pos * innerW;
      const mSp = m.spessore * s / 2;
      ctx.fillStyle = isTec ? "#e0d8cc" : ral;
      ctx.fillRect(mx - mSp, innerY, mSp*2, innerH);
      ctx.strokeStyle = isTec ? "#444" : ral;
      ctx.lineWidth = isTec ? 1 : 1.5;
      ctx.strokeRect(mx - mSp, innerY, mSp*2, innerH);
      if (isTec) {
        // Linea centrale
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(mx, innerY); ctx.lineTo(mx, innerY+innerH); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // ── Traversi ────────────────────────────────────
    inf.traversi.forEach(t => {
      const ty = innerY + t.pos * innerH;
      const tSp = t.spessore * s / 2;
      ctx.fillStyle = isTec ? "#e0d8cc" : ral;
      ctx.fillRect(innerX, ty - tSp, innerW, tSp*2);
      ctx.strokeStyle = isTec ? "#444" : ral;
      ctx.lineWidth = isTec ? 1 : 1.5;
      ctx.strokeRect(innerX, ty - tSp, innerW, tSp*2);
      if (isTec) {
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(innerX, ty); ctx.lineTo(innerX+innerW, ty); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // ── Specchiature (vetri + ante) ──────────────────
    const colPosArr = [0, ...inf.montanti.map(m=>m.pos), 1];
    const rowPosArr = [0, ...inf.traversi.map(t=>t.pos), 1];

    for (let r = 0; r < rowPosArr.length-1; r++) {
      for (let c = 0; c < colPosArr.length-1; c++) {
        const x0 = innerX + colPosArr[c]*innerW;
        const y0 = innerY + rowPosArr[r]*innerH;
        const sw = (colPosArr[c+1]-colPosArr[c]) * innerW;
        const sh = (rowPosArr[r+1]-rowPosArr[r]) * innerH;

        // Aggiungi offset per spessore montante/traverso
        const montSp = inf.montanti.length > 0 ? inf.montanti[0].spessore * s / 2 : 0;
        const travSp = inf.traversi.length > 0 ? inf.traversi[0].spessore * s / 2 : 0;
        const gx = c > 0 ? x0 + montSp : x0;
        const gy = r > 0 ? y0 + travSp : y0;
        const gw = sw - (c > 0 ? montSp : 0) - (c < colPosArr.length-2 ? montSp : 0);
        const gh = sh - (r > 0 ? travSp : 0) - (r < rowPosArr.length-2 ? travSp : 0);

        // Anta corrente
        const anta = inf.ante.find(a => a.col===c && a.row===r);
        const hasAnta = anta && anta.apertura !== "fisso";
        const antaSp = sys.anta * s;

        if (hasAnta) {
          // Profilo anta — doppio rettangolo
          ctx.fillStyle = isTec ? "#ddd5c8" : ral;
          ctx.fillRect(gx, gy, gw, gh);
          ctx.strokeStyle = isTec ? "#555" : ral;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(gx, gy, gw, gh);
          ctx.strokeStyle = isTec ? "#777" : ral;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(gx+antaSp, gy+antaSp, gw-antaSp*2, gh-antaSp*2);
          // Vetro dentro anta
          ctx.fillStyle = isTec ? VETRO_COL : "rgba(100,160,220,0.3)";
          ctx.fillRect(gx+antaSp, gy+antaSp, gw-antaSp*2, gh-antaSp*2);
          ctx.strokeStyle = VETRO_STROKE; ctx.lineWidth = 0.5;
          ctx.strokeRect(gx+antaSp, gy+antaSp, gw-antaSp*2, gh-antaSp*2);
          // Simbolo apertura
          drawAntaSymbol(ctx, gx+antaSp, gy+antaSp, gw-antaSp*2, gh-antaSp*2, anta.apertura, isTec);
        } else {
          // Fisso — solo vetro
          ctx.fillStyle = isTec ? VETRO_COL : "rgba(100,160,220,0.25)";
          ctx.fillRect(gx, gy, gw, gh);
          ctx.strokeStyle = VETRO_STROKE; ctx.lineWidth = 0.5;
          ctx.strokeRect(gx, gy, gw, gh);
        }
        if (!isTec) {
          const vx=hasAnta?gx+antaSp:gx, vy=hasAnta?gy+antaSp:gy;
          const vw2=hasAnta?gw-antaSp*2:gw, vh2=hasAnta?gh-antaSp*2:gh;
          const grad=ctx.createLinearGradient(vx,vy,vx+vw2*0.4,vy+vh2*0.4);
          grad.addColorStop(0,"rgba(255,255,255,0.2)");
          grad.addColorStop(1,"rgba(255,255,255,0)");
          ctx.fillStyle=grad; ctx.fillRect(vx,vy,vw2,vh2);
        }

        // Quote specchiatura (solo tecnico, se è l'unica o selezionata)
        if (isTec && inf.montanti.length === 0 && inf.traversi.length === 0) {
          // Quote principali
          drawQuote(ctx, ps.x, ps.y, sW, sH, inf.lCentro, inf.hCentro);
        }
      }
    }

    // Quote totali sempre visibili in tecnico
    if (isTec) {
      drawQuote(ctx, ps.x, ps.y, sW, sH, inf.lCentro, inf.hCentro);
    }
  }

  function drawAntaSymbol(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    apertura: string, isTec: boolean
  ) {
    const col = isTec ? "#1A4A8A" : "rgba(150,200,255,0.8)";
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.setLineDash([]);

    if (apertura === "sx") {
      // ISO: cerniera in basso a sinistra, anta apre verso sinistra
      // Linea diagonale dal cardine (basso-sx) all'angolo opposto (alto-dx)
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x, y+h);     // cardine basso sx
      ctx.lineTo(x+w, y);     // diagonale principale
      ctx.stroke();
      // Arco traiettoria (quarto di cerchio)
      ctx.lineWidth = 1;
      ctx.setLineDash([6,4]);
      ctx.beginPath();
      ctx.arc(x, y+h, w, -Math.PI/2, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      // Cardine
      ctx.beginPath(); ctx.arc(x, y+h, 5, 0, Math.PI*2); ctx.fill();

    } else if (apertura === "dx") {
      // ISO: cerniera basso destra
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x+w, y+h);   // cardine basso dx
      ctx.lineTo(x, y);       // diagonale
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.setLineDash([6,4]);
      ctx.beginPath();
      ctx.arc(x+w, y+h, w, Math.PI, Math.PI/2, true);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x+w, y+h, 5, 0, Math.PI*2); ctx.fill();

    } else if (apertura === "bilico") {
      // Bilico verticale: asse centrale, due diagonali simmetriche
      ctx.lineWidth = 1.5;
      // Asse
      ctx.beginPath();
      ctx.moveTo(x+w/2, y); ctx.lineTo(x+w/2, y+h);
      ctx.stroke();
      // Apertura sinistra e destra
      ctx.setLineDash([5,4]);
      ctx.beginPath();
      ctx.moveTo(x+w/2, y+h/2); ctx.lineTo(x, y+h*0.1);
      ctx.moveTo(x+w/2, y+h/2); ctx.lineTo(x+w, y+h*0.1);
      ctx.stroke();
      ctx.setLineDash([]);
      // Cardini top e bottom
      ctx.beginPath(); ctx.arc(x+w/2, y, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2, y+h, 4, 0, Math.PI*2); ctx.fill();

    } else if (apertura === "vasistas") {
      // Cerniere in alto, apertura basso
      ctx.lineWidth = 1.5;
      // Diagonali da angoli alti al punto centrale in basso
      ctx.beginPath();
      ctx.moveTo(x, y);       ctx.lineTo(x+w/2, y+h*0.7);
      ctx.moveTo(x+w, y);     ctx.lineTo(x+w/2, y+h*0.7);
      ctx.stroke();
      ctx.setLineDash([5,4]);
      ctx.beginPath();
      ctx.moveTo(x+w*0.1, y+h*0.15);
      ctx.quadraticCurveTo(x+w/2, y+h*0.9, x+w*0.9, y+h*0.15);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w, y, 4, 0, Math.PI*2); ctx.fill();

    } else if (apertura === "scorrevole") {
      const cy = y+h/2;
      // Freccia doppia orizzontale
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x+w*0.12, cy); ctx.lineTo(x+w*0.88, cy);
      ctx.stroke();
      // Punta sx
      ctx.beginPath();
      ctx.moveTo(x+w*0.27, cy-h*0.1); ctx.lineTo(x+w*0.12, cy); ctx.lineTo(x+w*0.27, cy+h*0.1);
      ctx.stroke();
      // Punta dx
      ctx.beginPath();
      ctx.moveTo(x+w*0.73, cy-h*0.1); ctx.lineTo(x+w*0.88, cy); ctx.lineTo(x+w*0.73, cy+h*0.1);
      ctx.stroke();
      // Binari tratteggiati
      ctx.lineWidth = 0.8;
      ctx.setLineDash([5,4]);
      ctx.beginPath();
      ctx.moveTo(x, cy-h*0.07); ctx.lineTo(x+w, cy-h*0.07);
      ctx.moveTo(x, cy+h*0.07); ctx.lineTo(x+w, cy+h*0.07);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Label piccola in basso a destra
    const labels: Record<string,string> = {
      sx:"SX", dx:"DX", bilico:"BIL", vasistas:"VAS", scorrevole:"SCO"
    };
    ctx.font = `bold ${Math.max(9, Math.min(12, w*0.1))}px system-ui`;
    ctx.textAlign = "right";
    ctx.fillText(labels[apertura]||"", x+w-3, y+h-3);
    ctx.restore();
  }

  function drawQuote(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number, sw: number, sh: number,
    mmW: number, mmH: number
  ) {
    const offset = 28;
    ctx.strokeStyle = "#888";
    ctx.fillStyle = "#555";
    ctx.lineWidth = 1;
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";

    // Quota larghezza (sotto)
    const qy = sy + sh + offset;
    ctx.beginPath();
    ctx.moveTo(sx, sy+sh+4); ctx.lineTo(sx, qy+6);
    ctx.moveTo(sx+sw, sy+sh+4); ctx.lineTo(sx+sw, qy+6);
    ctx.moveTo(sx, qy); ctx.lineTo(sx+sw, qy);
    ctx.stroke();
    ctx.fillText(`${Math.round(mmW)} mm`, sx+sw/2, qy-4);

    // Quota altezza (destra)
    ctx.textAlign = "left";
    const qx = sx + sw + offset;
    ctx.beginPath();
    ctx.moveTo(sx+sw+4, sy); ctx.lineTo(qx+6, sy);
    ctx.moveTo(sx+sw+4, sy+sh); ctx.lineTo(qx+6, sy+sh);
    ctx.moveTo(qx, sy); ctx.lineTo(qx, sy+sh);
    ctx.stroke();
    ctx.save();
    ctx.translate(qx+4, sy+sh/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(mmH)} mm`, 0, 0);
    ctx.restore();
  }

  // ── TOUCH / MOUSE HANDLERS ──────────────────────────
  function getPos(e: any): {sx:number, sy:number} {
    const cvs = canvasRef.current!;
    const r = cvs.getBoundingClientRect();
    if (e.touches) {
      return {
        sx: e.touches[0].clientX - r.left,
        sy: e.touches[0].clientY - r.top,
      };
    }
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  }

  const lastTap = useRef<{t:number,x:number,y:number}>({t:0,x:0,y:0});

  function handleDown(e: any) {
    e.preventDefault();
    const { sx, sy } = getPos(e);
    const now = Date.now();

    // Double tap → aggiungi divisore o anta
    if (now - lastTap.current.t < 300 &&
        Math.abs(sx - lastTap.current.x) < 30 &&
        Math.abs(sy - lastTap.current.y) < 30) {
      handleDoubleTap(sx, sy);
      lastTap.current.t = 0;
      return;
    }
    lastTap.current = { t:now, x:sx, y:sy };

    if (tool === "disegna" && !infisso) {
      drawing.current = { active:true, startX:sx, startY:sy, curX:sx, curY:sy, pts:[] };
    } else if (tool === "montante" && infisso) {
      addMontante(sx);
    } else if (tool === "traverso" && infisso) {
      addTraverso(sy);
    } else if (tool === "anta" && infisso) {
      cycleAnta(sx, sy);
    } else if (tool === "sel") {
      handleSel(sx, sy);
    }
  }

  function handleMove(e: any) {
    e.preventDefault();
    if (!drawing.current.active) return;
    const { sx, sy } = getPos(e);
    drawing.current.curX = sx;
    drawing.current.curY = sy;
    draw();
  }

  function handleUp(e: any) {
    e.preventDefault();
    if (!drawing.current.active) return;
    const { startX, startY, curX, curY } = drawing.current;
    drawing.current.active = false;

    const dx = curX - startX, dy = curY - startY;
    if (Math.abs(dx) < 20 || Math.abs(dy) < 20) { draw(); return; }

    // Crea infisso dal gesto
    const s = SCALE.current * vp.current.zoom;
    const mmW = snap(Math.abs(dx) / s, 10);
    const mmH = snap(Math.abs(dy) / s, 10);
    const mm0 = s2mm(Math.min(startX,curX), Math.min(startY,curY));
    const sys = SISTEMI[sistema];

    const newInfisso: Infisso = {
      id: uid(),
      telaio: {
        id: uid(),
        tipo: "rettangolo",
        x: mm0.x, y: mm0.y,
        w: mmW, h: mmH,
        spessore: sys.telaio,
        sistema,
        colore,
      },
      montanti: [],
      traversi: [],
      ante: [{ id:uid(), col:0, row:0, apertura:"fisso" }],
      lCentro: mmW,
      hCentro: mmH,
    };
    setInfisso(newInfisso);
    setTool("sel");
    if (onMisureUpdate) onMisureUpdate({ lCentro: mmW, hCentro: mmH });
    draw();
  }

  function handleDoubleTap(sx: number, sy: number) {
    if (!infisso) return;
    // Determina se il tap è nel telaio
    const { x,y,w,h,spessore } = infisso.telaio;
    const s = SCALE.current * vp.current.zoom;
    const ps = mm2s(x,y);
    const sSp = spessore * s;
    const innerX = ps.x + sSp, innerY = ps.y + sSp;
    const innerW = w*s - sSp*2, innerH = h*s - sSp*2;

    if (sx > innerX && sx < innerX+innerW && sy > innerY && sy < innerY+innerH) {
      // Dentro il telaio interno — aggiungi montante o traverso in base alla posizione
      const relX = (sx - innerX) / innerW;
      const relY = (sy - innerY) / innerH;
      // Se più vicino ai lati verticali → montante, altrimenti → traverso
      const distH = Math.min(relX, 1-relX);
      const distV = Math.min(relY, 1-relY);

      if (distH < distV) {
        // Montante
        addMontanteAtPos(relX);
      } else {
        // Traverso
        addTraversoAtPos(relY);
      }
    }
  }

  function addMontante(sx: number) {
    if (!infisso) return;
    const { x,y,w,h,spessore } = infisso.telaio;
    const s = SCALE.current * vp.current.zoom;
    const ps = mm2s(x,y);
    const sSp = spessore * s;
    const innerX = ps.x + sSp;
    const innerW = w*s - sSp*2;
    const relX = (sx - innerX) / innerW;
    if (relX <= 0.05 || relX >= 0.95) return;
    addMontanteAtPos(relX);
  }

  function addMontanteAtPos(relX: number) {
    if (!infisso) return;
    const sys = SISTEMI[infisso.telaio.sistema];
    const posMm = relX * (infisso.lCentro - infisso.telaio.spessore*2);
    const newMont: Divisore = {
      id: uid(), tipo:"montante",
      pos: relX, posMm,
      spessore: sys.mont,
    };
    const updated = {
      ...infisso,
      montanti: [...infisso.montanti, newMont].sort((a,b)=>a.pos-b.pos),
    };
    // Aggiorna ante
    updated.ante = ricalcolaAnte(updated);
    setInfisso(updated);
  }

  function addTraverso(sy: number) {
    if (!infisso) return;
    const { x,y,w,h,spessore } = infisso.telaio;
    const s = SCALE.current * vp.current.zoom;
    const ps = mm2s(x,y);
    const sSp = spessore * s;
    const innerY = ps.y + sSp;
    const innerH = h*s - sSp*2;
    const relY = (sy - innerY) / innerH;
    if (relY <= 0.05 || relY >= 0.95) return;
    addTraversoAtPos(relY);
  }

  function addTraversoAtPos(relY: number) {
    if (!infisso) return;
    const sys = SISTEMI[infisso.telaio.sistema];
    const posMm = relY * (infisso.hCentro - infisso.telaio.spessore*2);
    const newTrav: Divisore = {
      id: uid(), tipo:"traverso",
      pos: relY, posMm,
      spessore: sys.trav,
    };
    const updated = {
      ...infisso,
      traversi: [...infisso.traversi, newTrav].sort((a,b)=>a.pos-b.pos),
    };
    updated.ante = ricalcolaAnte(updated);
    setInfisso(updated);
  }

  function ricalcolaAnte(inf: Infisso): Anta[] {
    const cols = inf.montanti.length + 1;
    const rows = inf.traversi.length + 1;
    const ante: Anta[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const existing = inf.ante.find(a=>a.col===c && a.row===r);
        ante.push(existing || { id:uid(), col:c, row:r, apertura:"fisso" });
      }
    }
    return ante;
  }

  function dividiInAnte(n: number) {
    if (!infisso) return;
    const sys = SISTEMI[infisso.telaio.sistema];
    // Crea n-1 montanti equidistanti
    const montanti: Divisore[] = [];
    for (let i = 1; i < n; i++) {
      const pos = i / n;
      montanti.push({
        id: uid(), tipo: "montante",
        pos, posMm: pos * (infisso.lCentro - infisso.telaio.spessore*2),
        spessore: sys.mont,
      });
    }
    // Assegna aperture di default: sx per dispari, dx per pari
    const defaultAperture: Record<number, string> = {
      1: "sx",
      2: "dx",
      3: "sx",
      4: "dx",
      5: "sx",
      6: "dx",
      7: "sx",
      8: "dx",
    };
    // Se n=1 → fisso, n=2 → sx+dx, n>2 → alterna
    const updated = { ...infisso, montanti, traversi: infisso.traversi };
    const rows = infisso.traversi.length + 1;
    const ante: Anta[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < n; c++) {
        let apertura: string = "fisso";
        if (n === 1) apertura = "sx";
        else if (n === 2) apertura = c === 0 ? "sx" : "dx";
        else apertura = defaultAperture[c+1] || (c%2===0?"sx":"dx");
        ante.push({ id: uid(), col: c, row: r, apertura: apertura as any });
      }
    }
    updated.ante = ante;
    setInfisso(updated);
  }

  function cycleAnta(sx: number, sy: number) {
    if (!infisso) return;
    const { col, row } = findSpecchiatura(sx, sy);
    if (col < 0) return;
    setMenuAnta({ col, row });
  }

  function setApertura(col: number, row: number, apertura: string) {
    if (!infisso) return;
    setInfisso({ ...infisso, ante: infisso.ante.map(a =>
      a.col===col && a.row===row ? { ...a, apertura: apertura as any } : a
    )});
    setMenuAnta(null);
  }

  function findSpecchiatura(sx: number, sy: number): {col:number,row:number} {
    if (!infisso) return {col:-1,row:-1};
    const { x,y,w,h,spessore } = infisso.telaio;
    const s = SCALE.current * vp.current.zoom;
    const ps = mm2s(x,y);
    const sSp = spessore * s;
    const innerX = ps.x+sSp, innerY = ps.y+sSp;
    const innerW = w*s-sSp*2, innerH = h*s-sSp*2;

    if (sx<innerX||sx>innerX+innerW||sy<innerY||sy>innerY+innerH) return {col:-1,row:-1};

    const relX = (sx-innerX)/innerW;
    const relY = (sy-innerY)/innerH;

    const colPosArr = [0,...infisso.montanti.map(m=>m.pos),1];
    const rowPosArr = [0,...infisso.traversi.map(t=>t.pos),1];

    let col = 0, row = 0;
    for (let c=0; c<colPosArr.length-1; c++) {
      if (relX >= colPosArr[c] && relX < colPosArr[c+1]) { col=c; break; }
    }
    for (let r=0; r<rowPosArr.length-1; r++) {
      if (relY >= rowPosArr[r] && relY < rowPosArr[r+1]) { row=r; break; }
    }
    return { col, row };
  }

  function handleSel(sx: number, sy: number) {
    if (!infisso) return;
    // Hit test telaio
    const { x,y,w,h } = infisso.telaio;
    const ps = mm2s(x,y);
    const s = SCALE.current * vp.current.zoom;
    if (sx>=ps.x && sx<=ps.x+w*s && sy>=ps.y && sy<=ps.y+h*s) {
      setSelItem({tipo:"telaio", id:infisso.telaio.id});
    }
  }

  // ── EFFETTI ──────────────────────────────────────────
  useEffect(() => { draw(); }, [infisso, mode, draw]);

  // ── AZIONI ──────────────────────────────────────────
  function resetDisegno() {
    setInfisso(null);
    setSelItem(null);
    setTool("disegna");
    draw();
  }

  function cambiaSistema(id: string) {
    setSistema(id);
    if (!infisso) return;
    const sys = SISTEMI[id];
    setInfisso(prev => prev ? {
      ...prev,
      telaio: { ...prev.telaio, sistema:id, spessore:sys.telaio },
      montanti: prev.montanti.map(m=>({...m,spessore:sys.mont})),
      traversi: prev.traversi.map(t=>({...t,spessore:sys.trav})),
    } : null);
  }

  function apriNumpad(campo: string, label: string, val: number) {
    setNumpad({ campo, label, val: String(Math.round(val)) });
  }

  function confermaNUmpad() {
    if (!numpad || !infisso) return;
    const v = parseInt(numpad.val) || 0;
    if (v <= 0) { setNumpad(null); return; }
    if (numpad.campo === "larghezza") {
      const updated = { ...infisso, lCentro:v, telaio:{...infisso.telaio,w:v} };
      setInfisso(updated);
      if (onMisureUpdate) onMisureUpdate({ lCentro:v, hCentro:infisso.hCentro });
    } else if (numpad.campo === "altezza") {
      const updated = { ...infisso, hCentro:v, telaio:{...infisso.telaio,h:v} };
      setInfisso(updated);
      if (onMisureUpdate) onMisureUpdate({ lCentro:infisso.lCentro, hCentro:v });
    }
    setNumpad(null);
    initScale();
  }

  function numpadTap(k: string) {
    if (!numpad) return;
    if (k === "⌫") { setNumpad(p=>p?{...p,val:p.val.slice(0,-1)}:null); return; }
    if (numpad.val.length >= 5) return;
    setNumpad(p=>p?{...p,val:p.val+k}:null);
  }

  // BOM
  function calcolaBOM() {
    if (!infisso) return [];
    const sys = SISTEMI[infisso.telaio.sistema];
    const bom: any[] = [];
    const L = infisso.lCentro, H = infisso.hCentro;
    const perim = (L+H)*2;
    bom.push({voce:`Telaio ${sys.n} ${sys.telaio}mm`, qta:Math.ceil(perim/1000*1.05), um:"ml"});
    infisso.montanti.forEach(()=>bom.push({voce:`Montante ${sys.n} ${sys.mont}mm`,qta:Math.ceil(H/1000*1.05),um:"ml"}));
    infisso.traversi.forEach(()=>bom.push({voce:`Traverso ${sys.n} ${sys.trav}mm`,qta:Math.ceil(L/1000*1.05),um:"ml"}));

    const cols = infisso.montanti.length+1;
    const rows = infisso.traversi.length+1;
    const colPosArr=[0,...infisso.montanti.map(m=>m.pos),1];
    const rowPosArr=[0,...infisso.traversi.map(t=>t.pos),1];
    const innerW = L - infisso.telaio.spessore*2;
    const innerH = H - infisso.telaio.spessore*2;

    infisso.ante.forEach(a => {
      const wAnta = (colPosArr[a.col+1]-colPosArr[a.col])*innerW;
      const hAnta = (rowPosArr[a.row+1]-rowPosArr[a.row])*innerH;
      if (a.apertura !== "fisso") {
        const perimAnta = (wAnta+hAnta)*2;
        bom.push({voce:`Anta ${sys.n} ${sys.anta}mm`,qta:Math.ceil(perimAnta/1000*1.05),um:"ml"});
        const nCern = hAnta>1400?3:2;
        bom.push({voce:"Cerniere",qta:nCern,um:"pz"});
        bom.push({voce:"Maniglia",qta:1,um:"pz"});
      }
      bom.push({voce:"Vetro camera 4/12/4",qta:Math.ceil(wAnta*hAnta/1000000*1.1),um:"mq"});
    });
    return bom;
  }

  const [showBOM, setShowBOM] = useState(false);
  const [menuAnta, setMenuAnta] = useState<{col:number,row:number}|null>(null);
  const bom = calcolaBOM();
  const sys = SISTEMI[sistema];
  const isTec = mode === "tecnico";

  // ── RENDER ──────────────────────────────────────────
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:600,
      display:"flex",flexDirection:"column",
      fontFamily:"system-ui",
      background: isTec ? "#F2F1EC" : "#0f1117"
    }}>

      {/* ── TOPBAR ── */}
      <div style={{
        background:"#1A1A1C",padding:"8px 12px",
        display:"flex",alignItems:"center",gap:6,flexShrink:0,
        borderBottom:`2px solid ${AMB}`
      }}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#888",fontSize:22,cursor:"pointer",padding:"0 4px"}}>←</button>
        <div style={{color:"#fff",fontSize:13,fontWeight:700,flex:1}}>
          {vanoNome}
          {infisso && <span style={{fontSize:10,color:"#666",marginLeft:8}}>
            {Math.round(infisso.lCentro)}×{Math.round(infisso.hCentro)}mm
          </span>}
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid #333"}}>
          {[["tecnico","▤"],["render","◉"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m as any)} style={{
              padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",border:"none",fontFamily:"inherit",
              background:mode===m?(m==="tecnico"?"#2a3a4a":AMB):"#1a1a1a",
              color:mode===m?"#fff":"#555",
            }}>{l} {m==="tecnico"?"TEC":"RENDER"}</button>
          ))}
        </div>

        {infisso && (
          <button onClick={()=>setShowBOM(!showBOM)} style={{
            padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:700,
            cursor:"pointer",border:"none",fontFamily:"inherit",
            background:showBOM?AMB:AMB+"20",color:showBOM?"#fff":AMB,
          }}>BOM</button>
        )}

        {infisso && (
          <button onClick={()=>{
            if(onSalva) onSalva({infisso,bom,sistema,colore});
            onClose();
          }} style={{
            padding:"6px 14px",borderRadius:8,border:"none",
            background:GRN,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"
          }}>Salva</button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{
        background:isTec?"#f0ede6":"#111",
        borderBottom:`1px solid ${isTec?"#ddd":"#222"}`,
        padding:"6px 10px",display:"flex",gap:6,alignItems:"center",
        flexWrap:"wrap",flexShrink:0,overflowX:"auto"
      }}>

        {/* Tool */}
        {[
          {id:"disegna",l:"✏️ Disegna",dis:!!infisso},
          {id:"montante",l:"⬍ Montante",dis:!infisso},
          {id:"traverso",l:"⬌ Traverso",dis:!infisso},
          {id:"anta",l:"🔄 Anta",dis:!infisso},
          {id:"sel",l:"↖ Sel",dis:false},
        ].map(t=>(
          <button key={t.id}
            onClick={()=>!t.dis&&setTool(t.id as any)}
            style={{
              padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:600,
              cursor:t.dis?"not-allowed":"pointer",border:`1px solid ${tool===t.id?AMB:isTec?"#ccc":"#333"}`,
              background:tool===t.id?AMB+"20":isTec?"#fff":"#1a1a1a",
              color:tool===t.id?AMB:t.dis?"#aaa":isTec?"#333":"#888",
              opacity:t.dis?0.4:1,
            }}>{t.l}</button>
        ))}

        <div style={{width:1,height:18,background:isTec?"#ccc":"#333"}}/>

        {/* Sistema */}
        {Object.entries(SISTEMI).map(([id,ss]:any)=>(
          <button key={id} onClick={()=>cambiaSistema(id)} style={{
            padding:"4px 9px",borderRadius:6,fontSize:10,fontWeight:700,
            cursor:"pointer",border:`1px solid ${sistema===id?ss.col:isTec?"#ccc":"#333"}`,
            background:sistema===id?ss.col+"20":isTec?"#fff":"#1a1a1a",
            color:sistema===id?ss.col:isTec?"#555":"#777",
          }}>{ss.n}</button>
        ))}

        <div style={{width:1,height:18,background:isTec?"#ccc":"#333"}}/>

        {/* Numero ante rapido */}
        {infisso && (<>
          <div style={{width:1,height:18,background:isTec?"#ccc":"#333"}}/>
          <span style={{fontSize:10,color:isTec?"#888":"#666",fontWeight:600}}>Ante:</span>
          {[1,2,3,4,5].map(n => {
            const nAnteCorrente = infisso.montanti.length + 1;
            const isActive = nAnteCorrente === n;
            return (
              <button key={n} onPointerDown={()=>dividiInAnte(n)} style={{
                width:30,height:28,borderRadius:6,
                border:`1.5px solid ${isActive?"#D08008":isTec?"#ccc":"#333"}`,
                background:isActive?"#D0800820":isTec?"#fff":"#1a1a1a",
                color:isActive?"#D08008":isTec?"#555":"#888",
                fontSize:12,fontWeight:800,cursor:"pointer",
              }}>{n}</button>
            );
          })}
          <div style={{width:1,height:18,background:isTec?"#ccc":"#333"}}/>
        </>)}

        {/* Reset */}
        {infisso && (
          <button onClick={resetDisegno} style={{
            padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700,
            cursor:"pointer",border:"1px solid "+RED+"60",
            background:RED+"12",color:RED,
          }}>✕ Reset</button>
        )}
      </div>

      {/* ── CANVAS + SIDEBAR ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Canvas */}
        <div ref={wrapRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none"}}>
          <canvas ref={canvasRef}
            style={{display:"block",touchAction:"none"}}
            onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp}
            onTouchStart={handleDown} onTouchMove={handleMove} onTouchEnd={handleUp}
          />

          {/* Empty state */}
          {!infisso && !drawing.current.active && (
            <div style={{
              position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",
              textAlign:"center",opacity:0.35,pointerEvents:"none"
            }}>
              <div style={{fontSize:48,marginBottom:8}}>✏️</div>
              <div style={{fontSize:14,fontWeight:700,color:isTec?"#666":"#888"}}>
                Trascina per disegnare il telaio
              </div>
              <div style={{fontSize:11,color:isTec?"#999":"#666",marginTop:4}}>
                Poi: doppio tap per aggiungere montanti/traversi
              </div>
            </div>
          )}

          {/* Quote cliccabili */}
          {infisso && (
            <div style={{
              position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",
              display:"flex",gap:8
            }}>
              <button onClick={()=>apriNumpad("larghezza","Larghezza",infisso.lCentro)} style={{
                padding:"6px 14px",borderRadius:8,border:`1px solid ${AMB}`,
                background:AMB+"15",color:AMB,fontSize:12,fontWeight:700,cursor:"pointer"
              }}>L: {Math.round(infisso.lCentro)} mm</button>
              <button onClick={()=>apriNumpad("altezza","Altezza",infisso.hCentro)} style={{
                padding:"6px 14px",borderRadius:8,border:`1px solid ${BLU}`,
                background:BLU+"15",color:BLU,fontSize:12,fontWeight:700,cursor:"pointer"
              }}>H: {Math.round(infisso.hCentro)} mm</button>
              {infisso.montanti.length>0 && (
                <span style={{padding:"6px 10px",borderRadius:8,background:"#8B5CF620",color:"#8B5CF6",fontSize:11,fontWeight:600}}>
                  {infisso.montanti.length+1} campate
                </span>
              )}
            </div>
          )}

          {/* Hint tool corrente */}
          <div style={{
            position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",
            background:"rgba(0,0,0,0.65)",color:"#fff",borderRadius:20,
            padding:"4px 14px",fontSize:11,fontWeight:600,pointerEvents:"none",
            opacity: tool==="disegna"&&!infisso ? 1 : tool!=="sel"&&tool!=="disegna"&&infisso ? 1 : 0,
            transition:"opacity 0.2s"
          }}>
            {tool==="disegna" && !infisso && "Trascina per disegnare il telaio"}
            {tool==="montante" && "Tocca per inserire un montante verticale"}
            {tool==="traverso" && "Tocca per inserire un traverso orizzontale"}
            {tool==="anta"     && "Tocca una specchiatura per cambiare apertura"}
          </div>
        </div>

        {/* BOM Sidebar */}
        {showBOM && (
          <div style={{
            width:220,background:isTec?"#fff":"#141820",
            borderLeft:`1px solid ${isTec?"#ddd":"#222"}`,
            overflowY:"auto",flexShrink:0,padding:12
          }}>
            <div style={{fontSize:11,fontWeight:800,color:AMB,textTransform:"uppercase",marginBottom:8}}>
              Distinta Materiali
            </div>
            {bom.map((b,i)=>(
              <div key={i} style={{
                padding:"5px 0",borderBottom:`1px solid ${isTec?"#f0f0f0":"#1e2430"}`,
                fontSize:11
              }}>
                <div style={{fontWeight:600,color:isTec?"#333":"#ccc"}}>{b.voce}</div>
                <div style={{color:AMB,fontWeight:700}}>{b.qta} {b.um}</div>
              </div>
            ))}
            {bom.length===0&&<div style={{color:"#aaa",fontSize:11}}>Nessun elemento</div>}
          </div>
        )}
      </div>

      {/* ── MENU ANTA ── */}
      {menuAnta && infisso && (
        <div style={{
          position:"fixed",inset:0,zIndex:850,background:"rgba(0,0,0,0.6)",
          display:"flex",alignItems:"flex-end"
        }} onClick={()=>setMenuAnta(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%",background:"#1a1a1c",borderTop:"2px solid #D08008",
            borderRadius:"16px 16px 0 0",padding:"16px 16px 32px"
          }}>
            <div style={{fontSize:13,fontWeight:700,color:"#D08008",marginBottom:12}}>
              Apertura specchiatura ({menuAnta.col+1},{menuAnta.row+1})
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[
                {id:"fisso",   l:"Fisso",      icon:"▭"},
                {id:"sx",      l:"Anta SX",    icon:"◁"},
                {id:"dx",      l:"Anta DX",    icon:"▷"},
                {id:"bilico",  l:"Bilico",     icon:"⬡"},
                {id:"vasistas",l:"Vasistas",   icon:"△"},
                {id:"scorrevole",l:"Scorrevole",icon:"↔"},
              ].map(opt => {
                const current = infisso.ante.find(a=>a.col===menuAnta.col&&a.row===menuAnta.row)?.apertura;
                const isActive = current === opt.id;
                return (
                  <button key={opt.id}
                    onPointerDown={()=>setApertura(menuAnta.col,menuAnta.row,opt.id)}
                    style={{
                      padding:"12px 8px",borderRadius:10,
                      border:`2px solid ${isActive?"#D08008":"#333"}`,
                      background:isActive?"#D0800820":"#111",
                      color:isActive?"#D08008":"#aaa",
                      fontSize:11,fontWeight:700,cursor:"pointer",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:4
                    }}>
                    <span style={{fontSize:20}}>{opt.icon}</span>
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── NUMPAD QUOTE ── */}
      {numpad && (
        <div style={{
          position:"fixed",inset:0,zIndex:900,
          background:"rgba(0,0,0,0.7)",
          display:"flex",alignItems:"flex-end"
        }} onClick={()=>setNumpad(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%",background:"#0a0c10",
            borderTop:`2px solid ${AMB}`,borderRadius:"16px 16px 0 0",
            padding:"16px 16px 32px"
          }}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:AMB,textTransform:"uppercase"}}>
                {numpad.label}
              </div>
              <button onClick={()=>setNumpad(null)} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer"}}>×</button>
            </div>
            <div style={{
              fontSize:36,fontWeight:800,fontFamily:"monospace",
              textAlign:"right",color:"#fff",
              padding:"10px 14px",background:"#131318",
              borderRadius:10,border:"1px solid #333",marginBottom:12,
            }}>
              {numpad.val||"—"} <span style={{fontSize:16,color:"#888"}}>mm</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:8}}>
              {["7","8","9","4","5","6","1","2","3"].map(k=>(
                <button key={k} onPointerDown={e=>{e.preventDefault();numpadTap(k);}} style={{
                  minHeight:56,borderRadius:10,border:"1px solid #2a2a2a",
                  background:"#1a1a1a",color:"#fff",fontSize:22,fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit",
                }}>{k}</button>
              ))}
              <button onPointerDown={e=>{e.preventDefault();numpadTap("0");}} style={{minHeight:56,borderRadius:10,border:"1px solid #2a2a2a",background:"#1a1a1a",color:"#fff",fontSize:22,fontWeight:700,cursor:"pointer"}}>0</button>
              <button onPointerDown={e=>{e.preventDefault();numpadTap("⌫");}} style={{minHeight:56,borderRadius:10,border:"1px solid #DC444440",background:"#DC444418",color:"#DC4444",fontSize:20,fontWeight:700,cursor:"pointer"}}>⌫</button>
              <button onPointerDown={e=>{e.preventDefault();confermaNUmpad();}} style={{minHeight:56,borderRadius:10,border:"none",background:GRN,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>OK ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
