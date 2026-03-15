"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD ENGINE — Componente React con Fabric.js
// Motore disegno tecnico parametrico per serramenti
// Tablet-first, touch nativo, profili reali, quote automatiche
// ═══════════════════════════════════════════════════════════════
import React, {
  useEffect, useRef, useState, useCallback, useMemo
} from "react";

// ── TIPI ────────────────────────────────────────────────────
export interface Profilo {
  id: string;
  nome: string;
  sistema: string;
  tipo: "telaio" | "anta" | "montante" | "traverso" | "soglia";
  larghezza: number;
  profondita: number;
  ala_sx?: number;
  ala_dx?: number;
  battuta_vetro: number;
  color: string;
}

export interface Cella {
  tipo: "fisso" | "anta" | "portafinestra" | "scorrevole" | "alzante" | "vasistas" | "vuoto";
  verso: "sx" | "dx";
}

export interface Tipologia {
  id: string;
  nome: string;
  cols: number[];        // percentuali larghezza colonne
  righe: number[][];     // righe[ci] = array percentuali altezze
  celle: Cella[];
}

export interface CadConfig {
  W: number;
  H: number;
  tipologia: Tipologia;
  montanti: number[];    // posizioni mm dal bordo sx
  traversi: number[];    // posizioni mm dall'alto
  profili: {
    telaio: Profilo;
    anta: Profilo;
    montante: Profilo;
  };
  cassonetto?: boolean;
  cassH?: number;
  showQuote?: boolean;
  showSezOrizzontale?: boolean;
}

export interface MastroCadEngineProps {
  config: CadConfig;
  onChange?: (config: CadConfig) => void;
  readonly?: boolean;
  height?: number;
}

// ── DATABASE PROFILI DEFAULT ─────────────────────────────────
export const PROFILI_DEFAULT: Profilo[] = [
  {
    id: "gen-telaio-60",
    nome: "Generico 60mm",
    sistema: "Generico",
    tipo: "telaio",
    larghezza: 60, profondita: 80,
    ala_sx: 20, ala_dx: 20,
    battuta_vetro: 14,
    color: "#3a5a7a"
  },
  {
    id: "gen-anta-50",
    nome: "Anta 50mm",
    sistema: "Generico",
    tipo: "anta",
    larghezza: 50, profondita: 70,
    battuta_vetro: 12,
    color: "#2c4060"
  },
  {
    id: "gen-mont-60",
    nome: "Montante 60mm",
    sistema: "Generico",
    tipo: "montante",
    larghezza: 60, profondita: 80,
    battuta_vetro: 14,
    color: "#3a5a7a"
  },
  {
    id: "schuco-aws75",
    nome: "Schüco AWS 75",
    sistema: "Schüco",
    tipo: "telaio",
    larghezza: 75, profondita: 90,
    ala_sx: 22, ala_dx: 22,
    battuta_vetro: 16,
    color: "#1a3a5a"
  },
  {
    id: "reynaers-cs68",
    nome: "Reynaers CS68",
    sistema: "Reynaers",
    tipo: "telaio",
    larghezza: 68, profondita: 82,
    battuta_vetro: 15,
    color: "#2a4a6a"
  },
];

// ── TIPOLOGIE DEFAULT ────────────────────────────────────────
export const TIPOLOGIE_DEFAULT: Tipologia[] = [
  {
    id: "F2A", nome: "2 ante battenti",
    cols: [50, 50], righe: [[100], [100]],
    celle: [{ tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "F1A_DX", nome: "1 anta destra",
    cols: [100], righe: [[100]],
    celle: [{ tipo: "anta", verso: "dx" }]
  },
  {
    id: "F3A", nome: "3 ante",
    cols: [33, 34, 33], righe: [[100], [100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "SOPRALUCE", nome: "2A + sopraluce",
    cols: [50, 50], righe: [[28, 72], [28, 72]],
    celle: [
      { tipo: "fisso" }, { tipo: "fisso" },
      { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }
    ]
  },
  {
    id: "SC2", nome: "Scorrevole 2",
    cols: [50, 50], righe: [[100], [100]],
    celle: [{ tipo: "scorrevole", verso: "dx" }, { tipo: "fisso" }]
  },
  {
    id: "PF2", nome: "Portafinestra 2a",
    cols: [50, 50], righe: [[100], [100]],
    celle: [{ tipo: "portafinestra", verso: "sx" }, { tipo: "portafinestra", verso: "dx" }]
  },
  {
    id: "VETRINA5", nome: "Vetrina 5 camp.",
    cols: [20, 20, 20, 20, 20],
    righe: [[100], [100], [100], [100], [100]],
    celle: [
      { tipo: "fisso" }, { tipo: "anta", verso: "sx" },
      { tipo: "scorrevole", verso: "dx" },
      { tipo: "anta", verso: "dx" }, { tipo: "fisso" }
    ]
  },
  {
    id: "PORTA_VET", nome: "Porta + Vetrina",
    cols: [25, 25, 25, 25],
    righe: [[100], [100], [100], [100]],
    celle: [
      { tipo: "fisso" }, { tipo: "portafinestra", verso: "sx" },
      { tipo: "portafinestra", verso: "dx" }, { tipo: "fisso" }
    ]
  },
];

// ── CONFIG DEFAULT ───────────────────────────────────────────
export const defaultCadConfig = (): CadConfig => ({
  W: 1800, H: 1500,
  tipologia: TIPOLOGIE_DEFAULT[0],
  montanti: [],
  traversi: [],
  profili: {
    telaio: PROFILI_DEFAULT[0],
    anta: PROFILI_DEFAULT[1],
    montante: PROFILI_DEFAULT[2],
  },
  cassonetto: false,
  cassH: 180,
  showQuote: true,
  showSezOrizzontale: false,
});

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════
export default function MastroCadEngine({
  config,
  onChange,
  readonly = false,
  height = 520,
}: MastroCadEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<string>("sel");
  const [vista, setVista] = useState<string>("prospetto");
  const [selData, setSelData] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rightTab, setRightTab] = useState<"profili" | "tipologie">("tipologie");

  const SCALE = 0.2; // mm → px nel canvas

  // ── Carica Fabric.js dinamicamente ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).fabric) { setIsLoaded(true); return; }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Fabric.js non caricato");
    document.head.appendChild(script);
  }, []);

  // ── Init canvas ──────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || fabricRef.current) return;
    const fabric = (window as any).fabric;
    const container = containerRef.current;
    if (!container) return;

    const cW = container.clientWidth;
    const cH = container.clientHeight;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#1e2028",
      selection: !readonly,
      preserveObjectStacking: true,
      width: cW,
      height: cH,
    });

    fabricRef.current = canvas;

    // Mouse move → coordinate
    canvas.on("mouse:move", (e: any) => {
      const p = canvas.getPointer(e.e);
      updateStatus(p.x / SCALE, p.y / SCALE);
    });

    // Click → aggiungi elementi
    canvas.on("mouse:down", (e: any) => {
      if (readonly) return;
      const p = canvas.getPointer(e.e);
      handleCanvasClick(p.x / SCALE, p.y / SCALE);
    });

    // Selezione
    canvas.on("selection:created", (e: any) => {
      const obj = e.selected?.[0];
      const data = obj?.get?.("cadData");
      if (data) setSelData(data);
    });
    canvas.on("selection:cleared", () => setSelData(null));

    // Zoom con rotella
    canvas.on("mouse:wheel", (e: any) => {
      const delta = e.e.deltaY;
      let z = canvas.getZoom() * (0.999 ** delta);
      z = Math.max(0.05, Math.min(15, z));
      canvas.zoomToPoint({ x: e.e.offsetX, y: e.e.offsetY }, z);
      setZoomLevel(z);
      e.e.preventDefault();
      e.e.stopPropagation();
    });

    // Touch pan
    let lastTouch: any = null;
    canvas.on("touch:drag", (e: any) => {
      if (e.e.touches?.length === 2) {
        const touch = e.e.touches;
        if (lastTouch) {
          const dx = ((touch[0].clientX + touch[1].clientX) / 2) -
            ((lastTouch[0].clientX + lastTouch[1].clientX) / 2);
          const dy = ((touch[0].clientY + touch[1].clientY) / 2) -
            ((lastTouch[0].clientY + lastTouch[1].clientY) / 2);
          const vpt = canvas.viewportTransform!.slice();
          vpt[4] += dx; vpt[5] += dy;
          canvas.setViewportTransform(vpt);
        }
        lastTouch = touch;
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [isLoaded]);

  // ── Ridisegna quando config cambia ──────────────────────────
  useEffect(() => {
    if (!fabricRef.current || !isLoaded) return;
    drawAll();
  }, [config, isLoaded, vista]);

  // ── Resize ──────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (!fabricRef.current || !containerRef.current) return;
      fabricRef.current.setWidth(containerRef.current.clientWidth);
      fabricRef.current.setHeight(containerRef.current.clientHeight);
      fitScreen();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLoaded]);

  // ════════════════════════════════════════════════════════════
  // MOTORE DISEGNO
  // ════════════════════════════════════════════════════════════
  const drawAll = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabric = (window as any).fabric;
    if (!fabric) return;

    canvas.clear();
    canvas.backgroundColor = "#1e2028";

    const { W, H, tipologia: tip, montanti, traversi, profili, cassonetto, cassH, showQuote } = config;
    const TF = profili.telaio.larghezza;
    const TA = profili.anta.larghezza;
    const TM = profili.montante.larghezza;
    const TT = 52; // traverso fisso per ora

    const ox = 65; // offset px
    const cassHpx = cassonetto ? (cassH || 180) * SCALE : 0;
    const oy = 50 + cassHpx;

    // ── GRIGLIA ──
    drawGrid(canvas, fabric, ox, oy, W, H);

    // ── CASSONETTO ──
    if (cassonetto && cassHpx > 0) {
      drawCassonetto(canvas, fabric, ox, 50, W * SCALE, cassHpx);
    }

    // ── TELAIO ──
    drawTelaio(canvas, fabric, ox, oy, W * SCALE, H * SCALE, TF * SCALE, profili.telaio.color);

    // ── MONTANTI ──
    montanti.forEach((mm, mi) => {
      const x = ox + mm * SCALE;
      drawMontante(canvas, fabric, x, oy + TF * SCALE, H * SCALE - TF * SCALE * 2, TM * SCALE, mi, mm);
    });

    // ── TRAVERSI ──
    const montsX = montanti.map(m => ox + m * SCALE);
    traversi.forEach((mm, ti) => {
      const y = oy + mm * SCALE;
      drawTraverso(canvas, fabric, ox + TF * SCALE, y, W * SCALE - TF * SCALE * 2, TT * SCALE, ti, mm, montsX, TM * SCALE);
    });

    // ── CAMPITURE ──
    const celle = calcolaCelle(ox, oy, W, H, TF, TA, TM, TT, tip);
    celle.forEach(c => drawCampitura(canvas, fabric, c));

    // ── QUOTE ──
    if (showQuote !== false) {
      drawQuote(canvas, fabric, ox, oy, W, H, TF, TA, TM, TT, tip, montanti, traversi);
    }

    // ── SEZIONE ORIZZONTALE ──
    if (vista === "sez-h") {
      drawSezioneOrizzontale(canvas, fabric, ox, oy + H * SCALE + 50, W, TF, TA, TM, tip);
    }

    canvas.renderAll();
    fitScreen();

    // Aggiorna badge
    const nCelle = celle.length;
  }, [config, vista]);

  // ── GRIGLIA ─────────────────────────────────────────────────
  function drawGrid(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number) {
    const step = 100 * SCALE;
    for (let x = 0; x <= W * SCALE; x += step) {
      canvas.add(new fabric.Line([ox + x, oy - 10, ox + x, oy + H * SCALE + 10], {
        stroke: "#252530", strokeWidth: 0.4, selectable: false, evented: false
      }));
    }
    for (let y = 0; y <= H * SCALE; y += step) {
      canvas.add(new fabric.Line([ox - 10, oy + y, ox + W * SCALE + 10, oy + y], {
        stroke: "#252530", strokeWidth: 0.4, selectable: false, evented: false
      }));
    }
  }

  // ── CASSONETTO ──────────────────────────────────────────────
  function drawCassonetto(canvas: any, fabric: any, ox: number, oy: number, W: number, cH: number) {
    const c45 = Math.min(cH * 0.4, 10);
    const pts = ptsToFabric([
      ox + c45, oy, ox + W - c45, oy,
      ox + W, oy + c45, ox + W, oy + cH - c45,
      ox + W - c45, oy + cH, ox + c45, oy + cH,
      ox, oy + cH - c45, ox, oy + c45
    ]);
    canvas.add(new fabric.Polygon(pts, {
      fill: createHatchPattern("#3a5070"),
      stroke: "#6a8aaa", strokeWidth: 1.5,
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Text("CASSONETTO / TAPPARELLA", {
      left: ox + W / 2, top: oy + cH / 2,
      fontSize: 10, fill: "#D08008", fontFamily: "system-ui",
      fontWeight: "bold", originX: "center", originY: "center",
      selectable: false, evented: false
    }));
  }

  // ── TELAIO ESTERNO ──────────────────────────────────────────
  function drawTelaio(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number, TF: number, color: string) {
    const c = TF * 0.65;

    // Barra top
    addBarra(canvas, fabric, [
      ox, oy, ox + W, oy, ox + W, oy + TF - c * 0.3,
      ox + W - c * 0.7, oy + TF, ox + c * 0.7, oy + TF, ox, oy + TF - c * 0.3
    ]);
    // Barra bottom
    addBarra(canvas, fabric, [
      ox + c * 0.7, oy + H - TF, ox + W - c * 0.7, oy + H - TF,
      ox + W, oy + H - TF + c * 0.3, ox + W, oy + H,
      ox, oy + H, ox, oy + H - TF + c * 0.3
    ]);
    // Barra sx
    addBarra(canvas, fabric, [
      ox, oy + TF - c * 0.3, ox + TF - c * 0.3, oy + TF,
      ox + TF, oy + TF + c * 0.3, ox + TF, oy + H - TF - c * 0.3,
      ox + TF - c * 0.3, oy + H - TF, ox, oy + H - TF + c * 0.3
    ]);
    // Barra dx
    addBarra(canvas, fabric, [
      ox + W - TF, oy + TF + c * 0.3, ox + W, oy + TF - c * 0.3,
      ox + W, oy + H - TF + c * 0.3, ox + W - TF, oy + H - TF - c * 0.3,
      ox + W - TF + c * 0.3, oy + H - TF, ox + W - TF, oy + H - TF,
      ox + W - TF + c * 0.3, oy + TF, ox + W - TF, oy + TF + c * 0.3
    ]);

    // Outline esterno
    canvas.add(new fabric.Rect({
      left: ox, top: oy, width: W, height: H,
      fill: "transparent", stroke: "#c8d8e8", strokeWidth: 2,
      selectable: false, evented: false
    }));
  }

  function addBarra(canvas: any, fabric: any, coords: number[]) {
    const pts = ptsToFabric(coords);
    canvas.add(new fabric.Polygon(pts, {
      fill: createHatchPattern("#4a6a8a"),
      stroke: "#8aaabb", strokeWidth: 0.8,
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Polygon(pts, {
      fill: "transparent", stroke: "#c0d0e0", strokeWidth: 0.8,
      selectable: false, evented: false
    }));
  }

  // ── MONTANTE ────────────────────────────────────────────────
  function drawMontante(canvas: any, fabric: any, cx: number, y1: number, h: number, TM: number, idx: number, mm: number) {
    const c = TM * 0.45;
    const x1 = cx - TM / 2, x2 = cx + TM / 2;
    const pts = ptsToFabric([
      x1 + c, y1, x2 - c, y1, x2, y1 + c, x2, y1 + h - c,
      x2 - c, y1 + h, x1 + c, y1 + h, x1, y1 + h - c, x1, y1 + c
    ]);

    const body = new fabric.Polygon(pts, {
      fill: createHatchPattern("#3a5a7a"),
      stroke: "#a0b8c8", strokeWidth: 1.2,
      selectable: !readonly, evented: !readonly,
      hoverCursor: "pointer",
    });
    body.set("cadData", { tipo: "montante", mm, idx });
    canvas.add(body);

    // Asse tratto-punto
    canvas.add(new fabric.Line([cx, y1, cx, y1 + h], {
      stroke: "#D08008", strokeWidth: 0.8,
      strokeDashArray: [8, 4, 2, 4],
      selectable: false, evented: false, opacity: 0.5
    }));

    // Quota posizione montante
    canvas.add(new fabric.Text(mm + "mm", {
      left: cx, top: y1 - 16,
      fontSize: 9, fill: "#D08008", fontFamily: "monospace",
      originX: "center", selectable: false, evented: false, opacity: 0.8
    }));
  }

  // ── TRAVERSO ────────────────────────────────────────────────
  function drawTraverso(canvas: any, fabric: any, x1: number, cy: number, w: number, TT: number, idx: number, mm: number, montsX: number[], TM: number) {
    const segs = calcSegmenti(x1, x1 + w, montsX, TM);
    const c = TT * 0.45;

    segs.forEach(([sx1, sx2]) => {
      const pts = ptsToFabric([
        sx1 + c, cy - TT / 2, sx2 - c, cy - TT / 2,
        sx2, cy - TT / 2 + c, sx2, cy + TT / 2 - c,
        sx2 - c, cy + TT / 2, sx1 + c, cy + TT / 2,
        sx1, cy + TT / 2 - c, sx1, cy - TT / 2 + c
      ]);
      canvas.add(new fabric.Polygon(pts, {
        fill: createHatchPattern("#3a5a7a"),
        stroke: "#9ab0c0", strokeWidth: 1,
        selectable: false, evented: false
      }));
    });

    // Asse orizzontale
    canvas.add(new fabric.Line([x1, cy, x1 + w, cy], {
      stroke: "#3B7FE0", strokeWidth: 0.8,
      strokeDashArray: [8, 4, 2, 4],
      selectable: false, evented: false, opacity: 0.4
    }));
  }

  function calcSegmenti(x1: number, x2: number, montsX: number[], TM: number): [number, number][] {
    const punti = [x1, ...montsX.flatMap(mx => [mx - TM / 2, mx + TM / 2]), x2];
    punti.sort((a, b) => a - b);
    const segs: [number, number][] = [];
    for (let i = 0; i < punti.length - 1; i += 2) {
      if (punti[i + 1] - punti[i] > 2) segs.push([punti[i], punti[i + 1]]);
    }
    return segs.length > 0 ? segs : [[x1, x2]];
  }

  // ── CAMPITURE ───────────────────────────────────────────────
  function calcolaCelle(ox: number, oy: number, W: number, H: number, TF: number, TA: number, TM: number, TT: number, tip: Tipologia) {
    const cols = tip.cols;
    const righeT = tip.righe;
    const totalW = cols.reduce((s, c) => s + c, 0);
    const availW = W - TF * 2 - TM * (cols.length - 1);
    const celle: any[] = [];
    let curX = TF;

    cols.forEach((cw, ci) => {
      const colW = (cw / totalW) * availW;
      const righe = righeT[ci] || [100];
      const totalH = righe.reduce((s, r) => s + r, 0);
      const availH = H - TF * 2 - TT * (righe.length - 1);
      let curY = TF;

      righe.forEach((rh, ri) => {
        const cellH = (rh / totalH) * availH;
        const cellaIdx = cols.slice(0, ci).reduce((s, _, i) => (righeT[i] || [1]).length + s, 0) + ri;
        const conf = tip.celle[cellaIdx] || { tipo: "fisso", verso: "dx" };

        celle.push({
          x: (ox + curX) * SCALE,
          y: (oy + curY) * SCALE,
          w: colW * SCALE,
          h: cellH * SCALE,
          wMm: colW,
          hMm: cellH,
          TA: TA * SCALE,
          ci, ri, cellaIdx,
          ...conf,
        });
        curY += cellH + TT;
      });
      curX += colW + TM;
    });
    return celle;
  }

  function drawCampitura(canvas: any, fabric: any, cell: any) {
    const { x, y, w, h, TA, tipo, verso, wMm, hMm, ci, ri } = cell;
    const c45 = Math.min(TA * 0.7, 8);

    // 4 barre profilo anta con tagli 45°
    const bars = [
      // top
      [x+c45,y, x+w-c45,y, x+w,y+c45, x+w,y+TA-c45, x+w-c45,y+TA, x+c45,y+TA, x,y+TA-c45, x,y+c45],
      // bot
      [x+c45,y+h-TA, x+w-c45,y+h-TA, x+w,y+h-TA+c45, x+w,y+h-c45, x+w-c45,y+h, x+c45,y+h, x,y+h-c45, x,y+h-TA+c45],
      // sx
      [x,y+TA, x+TA-c45,y+TA, x+TA,y+TA+c45, x+TA,y+h-TA-c45, x+TA-c45,y+h-TA, x,y+h-TA],
      // dx
      [x+w-TA,y+TA, x+w,y+TA, x+w,y+h-TA, x+w-TA,y+h-TA, x+w-TA,y+h-TA-c45, x+w-TA+c45,y+h-TA, x+w,y+h-TA, x+w,y+TA, x+w-TA+c45,y+TA, x+w-TA,y+TA+c45],
    ];

    bars.forEach(coords => {
      const pts = ptsToFabric(coords);
      canvas.add(new fabric.Polygon(pts, {
        fill: createHatchPattern("#2c4060"),
        stroke: "#8aaabb", strokeWidth: 0.8,
        selectable: false, evented: false
      }));
      canvas.add(new fabric.Polygon(pts, {
        fill: "transparent", stroke: "#b0c8d8", strokeWidth: 0.6,
        selectable: false, evented: false
      }));
    });

    // Outline anta — selezionabile
    const outline = new fabric.Rect({
      left: x, top: y, width: w, height: h,
      fill: "transparent", stroke: "#aac8d8", strokeWidth: 1.5,
      selectable: !readonly, evented: !readonly,
      hoverCursor: "pointer",
    });
    outline.set("cadData", { tipo: "cella", ci, ri, wMm, hMm, apertura: tipo, verso });
    canvas.add(outline);

    // VETRO
    const gx = x + TA, gy = y + TA, gw = w - TA * 2, gh = h - TA * 2;
    if (gw > 2 && gh > 2) {
      canvas.add(new fabric.Rect({
        left: gx, top: gy, width: gw, height: gh,
        fill: createVetroPattern(),
        stroke: "#4a96b8", strokeWidth: 0.8,
        selectable: false, evented: false
      }));
      // Riflessione
      canvas.add(new fabric.Line([gx + gw * 0.07, gy + gh * 0.05, gx + gw * 0.2, gy + gh * 0.3], {
        stroke: "rgba(200,230,255,0.35)", strokeWidth: gw * 0.035,
        selectable: false, evented: false
      }));
    }

    // APERTURA specifica
    if (tipo === "anta" || tipo === "portafinestra") {
      drawArcoBattente(canvas, fabric, x, y, w, h, TA, verso);
      drawManiglia(canvas, fabric, x, y, w, h, TA, verso);
    } else if (tipo === "scorrevole" || tipo === "alzante") {
      drawScorrevole(canvas, fabric, x, y, w, h, verso, tipo);
    } else if (tipo === "vasistas") {
      drawVasistas(canvas, fabric, x, y, w, h, TA);
    } else if (tipo === "fisso" && gw > 4 && gh > 4) {
      // Croce fisso
      canvas.add(new fabric.Line([gx + 4, gy + 4, gx + gw - 4, gy + gh - 4], { stroke: "#4a7a9a", strokeWidth: 0.7, opacity: 0.5, selectable: false, evented: false }));
      canvas.add(new fabric.Line([gx + gw - 4, gy + 4, gx + 4, gy + gh - 4], { stroke: "#4a7a9a", strokeWidth: 0.7, opacity: 0.5, selectable: false, evented: false }));
    }

    // Quota cella
    if (w > 30 && h > 20) {
      canvas.add(new fabric.Text(`${Math.round(wMm)}×${Math.round(hMm)}`, {
        left: x + w / 2, top: y + h / 2,
        fontSize: 9, fill: "#5a8898", fontFamily: "monospace",
        originX: "center", originY: "center",
        selectable: false, evented: false, opacity: 0.7
      }));
    }
  }

  // ── ARCO BATTENTE ISO ───────────────────────────────────────
  function drawArcoBattente(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, TA: number, verso: string) {
    const r = Math.min((aw - TA) * 0.88, (ah - TA) * 0.85);
    const cx = verso === "sx" ? ax + aw - TA : ax + TA;
    const cy = ay + ah;
    const ex = verso === "sx" ? ax + TA : ax + aw - TA;

    canvas.add(new fabric.Path(
      `M ${cx} ${cy} A ${r} ${r} 0 0 ${verso === "sx" ? 0 : 1} ${ex} ${cy}`,
      {
        fill: "rgba(26,158,115,0.07)",
        stroke: "#1A9E73", strokeWidth: 1.4,
        strokeDashArray: [10, 5],
        selectable: false, evented: false
      }
    ));

    // Asse cerniera
    const asseX = verso === "sx" ? ax + TA / 2 : ax + aw - TA / 2;
    canvas.add(new fabric.Line([asseX, ay + TA / 2, asseX, ay + ah - TA / 2], {
      stroke: "#1A9E73", strokeWidth: 0.8,
      strokeDashArray: [4, 3], opacity: 0.6,
      selectable: false, evented: false
    }));

    // Simboli cerniera
    [0.25, 0.75].forEach(f => {
      canvas.add(new fabric.Circle({
        left: asseX - 4, top: ay + ah * f - 4, radius: 4,
        fill: "#1A9E7340", stroke: "#1A9E73", strokeWidth: 1,
        selectable: false, evented: false
      }));
    });
  }

  // ── MANIGLIA ────────────────────────────────────────────────
  function drawManiglia(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, TA: number, verso: string) {
    const mx = verso === "dx" ? ax + aw - TA - 4 : ax + TA + 4;
    const my = ay + ah / 2;
    const hH = Math.min(ah * 0.14, 26);

    canvas.add(new fabric.Rect({
      left: mx - 3, top: my - hH / 2, width: 6, height: hH, rx: 3,
      fill: "#D08008", stroke: "#a06000", strokeWidth: 1,
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Circle({
      left: mx - 5, top: my - 5, radius: 5,
      fill: "#c07000", stroke: "#a05000", strokeWidth: 1,
      selectable: false, evented: false
    }));
  }

  // ── SCORREVOLE / ALZANTE ────────────────────────────────────
  function drawScorrevole(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, verso: string, tipo: string) {
    const dir = verso === "dx" ? 1 : -1;
    const cx = ax + aw / 2 + dir * 8;
    const cy = ay + ah / 2;
    const len = Math.min(aw * 0.32, 44);

    canvas.add(new fabric.Path(
      `M ${cx - len * dir} ${cy} L ${cx + len * dir} ${cy}`,
      { stroke: "#1A9E73", strokeWidth: 2.2, fill: "transparent", selectable: false, evented: false }
    ));
    canvas.add(new fabric.Triangle({
      left: dir === 1 ? cx + len - 5 : cx - len - 5,
      top: cy - 5, width: 10, height: 10,
      angle: dir === 1 ? 90 : 270,
      fill: "#1A9E73", selectable: false, evented: false
    }));

    // Guide scorrimento
    ["top", "bot"].forEach(pos => {
      const gy = pos === "top" ? ay + 8 : ay + ah - 8;
      canvas.add(new fabric.Line([ax + 8, gy, ax + aw - 8, gy], {
        stroke: "#1A9E7360", strokeWidth: 2, selectable: false, evented: false
      }));
    });

    if (tipo === "alzante") {
      canvas.add(new fabric.Text("ALZ", {
        left: ax + aw / 2, top: ay + ah - 14,
        fontSize: 9, fill: "#1A9E73", fontFamily: "system-ui",
        fontWeight: "bold", originX: "center",
        selectable: false, evented: false
      }));
    }
  }

  // ── VASISTAS ────────────────────────────────────────────────
  function drawVasistas(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, TA: number) {
    const gx = ax + TA, gy = ay + TA, gw = aw - TA * 2, gh = ah - TA * 2;
    const vH = gh * 0.38;
    canvas.add(new fabric.Path(
      `M ${gx} ${gy + vH} L ${gx + gw / 2} ${gy + 4} L ${gx + gw} ${gy + vH}`,
      {
        fill: "rgba(26,158,115,0.1)",
        stroke: "#1A9E73", strokeWidth: 1.3,
        strokeDashArray: [6, 3],
        selectable: false, evented: false
      }
    ));
  }

  // ── QUOTE ───────────────────────────────────────────────────
  function drawQuote(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number, TF: number, TA: number, TM: number, TT: number, tip: Tipologia, montanti: number[], traversi: number[]) {
    const qOff = 22;

    // Larghezza totale
    addQuota(canvas, fabric, ox, oy - qOff - 14, ox + W * SCALE, oy - qOff - 14, W + " mm", true, "#b0c0d0", 11);

    // Altezza totale
    addQuota(canvas, fabric, ox + W * SCALE + qOff, oy, ox + W * SCALE + qOff, oy + H * SCALE, H + " mm", false, "#b0c0d0", 11);

    // Quote colonne
    const cols = tip.cols;
    const totalW = cols.reduce((s, c) => s + c, 0);
    const availW = W - TF * 2 - TM * (cols.length - 1);
    let curX = TF;
    if (cols.length > 1) {
      cols.forEach((cw, ci) => {
        const colW = (cw / totalW) * availW;
        addQuota(canvas, fabric,
          (ox + curX) * SCALE, oy + H * SCALE + 16,
          (ox + curX + colW) * SCALE, oy + H * SCALE + 16,
          Math.round(colW) + "", true, "#D08008", 9
        );
        curX += colW + TM;
      });
    }

    // Quote montanti
    montanti.forEach(mm => {
      canvas.add(new fabric.Text(mm + "mm", {
        left: (ox + mm) * SCALE, top: oy - 10,
        fontSize: 8, fill: "#D08008", fontFamily: "monospace",
        originX: "center", selectable: false, evented: false, opacity: 0.7
      }));
    });
  }

  function addQuota(canvas: any, fabric: any, x1: number, y1: number, x2: number, y2: number, label: string, horiz: boolean, color: string, fontSize: number) {
    if (horiz) {
      canvas.add(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x1, y1 - 4, x1, y1 + 4], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x2, y2 - 4, x2, y2 + 4], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x1 + 1, top: y1 - 4, width: 6, height: 6, angle: 270, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x2 - 7, top: y2 - 4, width: 6, height: 6, angle: 90, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Text(label, { left: (x1 + x2) / 2, top: y1 - fontSize - 3, fontSize, fill: color, fontFamily: "system-ui", originX: "center", selectable: false, evented: false }));
    } else {
      canvas.add(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x1 - 4, y1, x1 + 4, y1], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x2 - 4, y2, x2 + 4, y2], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x1 - 3, top: y1, width: 6, height: 6, angle: 0, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x2 - 3, top: y2 - 7, width: 6, height: 6, angle: 180, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Text(label, {
        left: x1 + fontSize + 5, top: (y1 + y2) / 2,
        fontSize, fill: color, fontFamily: "system-ui", angle: 90,
        originX: "center", originY: "center",
        selectable: false, evented: false
      }));
    }
  }

  // ── SEZIONE ORIZZONTALE ─────────────────────────────────────
  function drawSezioneOrizzontale(canvas: any, fabric: any, ox: number, oy: number, W: number, TF: number, TA: number, TM: number, tip: Tipologia) {
    const sH = 70;
    canvas.add(new fabric.Text("SEZ. ORIZZONTALE", {
      left: ox, top: oy - 14, fontSize: 8, fill: "#3B7FE0",
      fontFamily: "system-ui", fontWeight: "bold",
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Rect({
      left: ox, top: oy, width: W * SCALE, height: sH,
      fill: "#12181e", stroke: "#2a3a4a", strokeWidth: 1,
      selectable: false, evented: false
    }));

    const cols = tip.cols;
    const totalW = cols.reduce((s, c) => s + c, 0);
    const availW = W - TF * 2 - TM * (cols.length - 1);
    let curX = TF;

    // Telai sx e dx
    [0, (W - TF) * SCALE].forEach(x => {
      canvas.add(new fabric.Rect({
        left: ox + x, top: oy + sH * 0.1, width: TF * SCALE, height: sH * 0.8,
        fill: createHatchPattern("#3a5070"), stroke: "#8aaabb", strokeWidth: 1,
        selectable: false, evented: false
      }));
    });

    cols.forEach((cw) => {
      const colW = (cw / totalW) * availW;
      // Ante sx e dx della colonna
      canvas.add(new fabric.Rect({ left: (ox + curX) * SCALE, top: oy + sH * 0.1, width: TA * SCALE, height: sH * 0.8, fill: createHatchPattern("#2c4060"), stroke: "#8aaabb", strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Rect({ left: (ox + curX + colW - TA) * SCALE, top: oy + sH * 0.1, width: TA * SCALE, height: sH * 0.8, fill: createHatchPattern("#2c4060"), stroke: "#8aaabb", strokeWidth: 0.8, selectable: false, evented: false }));
      // Vetro
      canvas.add(new fabric.Rect({ left: (ox + curX + TA) * SCALE, top: oy + sH * 0.22, width: (colW - TA * 2) * SCALE, height: sH * 0.56, fill: createVetroPattern(), stroke: "#4a96b8", strokeWidth: 0.5, selectable: false, evented: false }));
      curX += colW + TM;
    });
  }

  // ── HELPERS ─────────────────────────────────────────────────
  function ptsToFabric(coords: number[]) {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < coords.length; i += 2) pts.push({ x: coords[i], y: coords[i + 1] });
    return pts;
  }

  function createHatchPattern(color: string) {
    const c = document.createElement("canvas");
    c.width = 6; c.height = 6;
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(6, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(1, -1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 7); ctx.lineTo(7, 5); ctx.stroke();
    const fabric = (window as any).fabric;
    return new fabric.Pattern({ source: c, repeat: "repeat" });
  }

  function createVetroPattern() {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 16;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(168,216,234,0.18)";
    ctx.fillRect(0, 0, 16, 16);
    ctx.strokeStyle = "rgba(74,150,184,0.35)";
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(16, 0); ctx.stroke();
    const fabric = (window as any).fabric;
    return new fabric.Pattern({ source: c, repeat: "repeat" });
  }

  // ── TOOL HANDLERS ───────────────────────────────────────────
  const handleCanvasClick = useCallback((mmX: number, mmY: number) => {
    if (!onChange) return;
    if (tool === "mont") {
      const mm = Math.round(mmX / 5) * 5;
      if (mm > 0 && mm < config.W) {
        const newM = [...config.montanti, mm].sort((a, b) => a - b);
        onChange({ ...config, montanti: newM });
      }
    } else if (tool === "trav") {
      const mm = Math.round(mmY / 5) * 5;
      if (mm > 0 && mm < config.H) {
        const newT = [...config.traversi, mm].sort((a, b) => a - b);
        onChange({ ...config, traversi: newT });
      }
    }
  }, [tool, config, onChange]);

  const fitScreen = useCallback(() => {
    const canvas = fabricRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const aW = container.clientWidth - 80;
    const aH = container.clientHeight - 80;
    const cW = (config.W + 140) * SCALE;
    const cH = (config.H + 140) * SCALE;
    const z = Math.min(aW / cW, aH / cH, 2);
    canvas.setZoom(z);
    canvas.absolutePan({ x: -(aW / 2 - cW * z / 2) + 20, y: -(aH / 2 - cH * z / 2) + 20 });
    setZoomLevel(z);
    canvas.renderAll();
  }, [config.W, config.H]);

  const zoomIn = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const c = canvas.getCenter();
    let z = Math.min(canvas.getZoom() * 1.25, 15);
    canvas.zoomToPoint({ x: c.left, y: c.top }, z);
    setZoomLevel(z);
  };
  const zoomOut = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const c = canvas.getCenter();
    let z = Math.max(canvas.getZoom() * 0.8, 0.05);
    canvas.zoomToPoint({ x: c.left, y: c.top }, z);
    setZoomLevel(z);
  };

  function updateStatus(x: number, y: number) {
    // Gestita internamente nel canvas event
  }

  // ── RENDER ──────────────────────────────────────────────────
  const AMB = "#D08008";
  const GRN = "#1A9E73";
  const BLU = "#3B7FE0";

  const toolBtnStyle = (t: string) => ({
    display: "flex", alignItems: "center", gap: 6,
    width: "100%", padding: "7px 10px", borderRadius: 7,
    border: `1px solid ${tool === t ? AMB : "#2a2a2a"}`,
    background: tool === t ? AMB + "15" : "#1a1a1a",
    color: tool === t ? AMB : "#888",
    fontSize: 11, fontWeight: 500, cursor: "pointer",
    fontFamily: "inherit", marginBottom: 4, textAlign: "left" as const,
  });

  const iconStyle = { fontSize: 13, width: 18, textAlign: "center" as const };

  if (!isLoaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height, background: "#1a1a1c", borderRadius: 12, color: "#555", fontSize: 13 }}>
        Caricamento motore CAD...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height, background: "#1a1a1c", borderRadius: 12, overflow: "hidden", fontFamily: "system-ui" }}>

      {/* TOOLBAR */}
      {!readonly && (
        <div style={{ background: "#111", padding: "6px 12px", display: "flex", gap: 6, borderBottom: "1px solid #2a2a2a", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          {[
            { id: "sel", ico: "↖", l: "Seleziona" },
            { id: "mont", ico: "|", l: "Montante" },
            { id: "trav", ico: "—", l: "Traverso" },
          ].map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} style={{
              padding: "5px 10px", borderRadius: 7,
              border: `1px solid ${tool === t.id ? AMB : "#2a2a2a"}`,
              background: tool === t.id ? AMB + "15" : "#1a1a1a",
              color: tool === t.id ? AMB : "#888",
              fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 13 }}>{t.ico}</span>{t.l}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "#2a2a2a", margin: "0 2px" }} />

          <button onClick={() => setVista(v => v === "prospetto" ? "sez-h" : "prospetto")} style={{
            padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${vista !== "prospetto" ? BLU : "#2a2a2a"}`,
            background: vista !== "prospetto" ? BLU + "15" : "#1a1a1a",
            color: vista !== "prospetto" ? BLU : "#888",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>
            {vista === "prospetto" ? "Vista sez." : "Vista prosp."}
          </button>

          {onChange && (
            <>
              <button onClick={() => onChange({ ...config, montanti: [] })} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#DC4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Mont.
              </button>
              <button onClick={() => onChange({ ...config, traversi: [] })} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#DC4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Trav.
              </button>
            </>
          )}

          <div style={{ flex: 1 }} />

          <button onClick={fitScreen} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>⊡ Fit</button>
          <button onClick={zoomIn} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#888", fontSize: 14, cursor: "pointer" }}>+</button>
          <span style={{ fontSize: 10, color: "#555", padding: "0 4px" }}>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={zoomOut} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#888", fontSize: 14, cursor: "pointer" }}>−</button>
        </div>
      )}

      {/* CANVAS */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} />

        {/* Info selezione */}
        {selData && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            background: "#111e", padding: "6px 12px", borderRadius: 8,
            border: `1px solid ${AMB}40`, fontSize: 11, color: AMB,
          }}>
            {selData.tipo === "cella"
              ? `${selData.apertura} ${selData.verso || ""} — ${Math.round(selData.wMm)}×${Math.round(selData.hMm)} mm`
              : `Montante @ ${selData.mm}mm`
            }
          </div>
        )}
      </div>
    </div>
  );
}
