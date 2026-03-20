"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO — DisegnoTecnico v5
// Legge profili reali da Supabase (profili_sezioni + sistemi)
// Un solo renderer, un solo archivio
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const C = {
  bg: "#000000", profilo: "#FFFFFF", quota: "#CCCC00",
  tratt: "#FFFFFF", maniglia: "#CCCCCC",
  vetroFill: "#003344", vetroTratt: "#005566",
  labelVetro: "#0099BB", label: "#FFFFFF",
  toolBg: "#0F0F1A", toolBdr: "#222222",
  panelBg: "#0D0D18",
};

export type TipApertura =
  | "fisso" | "1anta_ar" | "2ante_ar" | "1anta_ab" | "2ante_ab"
  | "balcone_1ar" | "balcone_2ar" | "wasistas"
  | "scorrevole_2" | "ribalta_scorre";

const TIPOLOGIE = [
  { id: "fisso",          label: "Fisso",     nAnte: 0 },
  { id: "1anta_ar",       label: "1A A-R",    nAnte: 1 },
  { id: "2ante_ar",       label: "2A A-R",    nAnte: 2 },
  { id: "1anta_ab",       label: "1A A-B",    nAnte: 1 },
  { id: "2ante_ab",       label: "2A A-B",    nAnte: 2 },
  { id: "balcone_1ar",    label: "Balc. 1A",  nAnte: 1 },
  { id: "balcone_2ar",    label: "Balc. 2A",  nAnte: 2 },
  { id: "wasistas",       label: "Wasistas",  nAnte: 1 },
  { id: "scorrevole_2",   label: "Scorr. 2A", nAnte: 2 },
  { id: "ribalta_scorre", label: "Rib+Sc.",   nAnte: 2 },
];

interface Props {
  vanoId?: string; vanoNome?: string; vanoDisegno?: any;
  realW: number; realH: number;
  onUpdate?: (d: any) => void; onUpdateField?: (f: string, v: any) => void;
  onClose?: () => void; T?: any; sistemiDB?: any[];
}

// ── Hook profili da Supabase ───────────────────────────────────
function useProfiliSezioni(sistema: string) {
  const [profili, setProfili] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!sistema) { setProfili({}); return; }
    setLoading(true);
    supabase
      .from("profili_sezioni")
      .select("*")
      .eq("sistema", sistema)
      .eq("attivo", true)
      .then(({ data }) => {
        const byTipo: Record<string, any> = {};
        (data || []).forEach(p => { byTipo[p.tipo] = p; });
        setProfili(byTipo);
        setLoading(false);
      });
  }, [sistema]);
  return { profili, loading };
}

// ── VetroHatch ─────────────────────────────────────────────────
function VetroHatch({ x, y, w, h, clipId }: any) {
  const step = 10; const lines = [];
  for (let i = -Math.ceil(h / step); i <= Math.ceil(w / step) + 2; i++) {
    lines.push(<line key={i} x1={i * step} y1={h} x2={i * step + h} y2={0}
      stroke={C.vetroTratt} strokeWidth={0.7} opacity={0.45} />);
  }
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={0} y={0} width={w} height={h} /></clipPath></defs>
      <g transform={`translate(${x},${y})`} clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={w} height={h} fill={C.vetroFill} />
        {lines}
      </g>
    </g>
  );
}

// ── ProfiloRect: rettangolo profilo con svg_path reale o fallback ──
function ProfiloRect({ x, y, w, h, profilo, rotated = false, uid }: any) {
  const codice = profilo?.codice || "";
  const hasSvg = profilo?.svg_path && profilo.svg_path.length > 10;
  const lx = x + w / 2; const ly = y + h / 2;
  const fs = Math.max(5, Math.min(8, Math.min(w, h) * 0.55));

  if (hasSvg) {
    const [, , vw = 100, vh = 100] = (profilo.svg_viewbox || "0 0 100 100").split(" ").map(Number);
    const sx = w / vw; const sy = h / vh;
    const tf = rotated
      ? `translate(${x},${y + h}) rotate(-90) scale(${sy},${sx})`
      : `translate(${x},${y}) scale(${sx},${sy})`;
    return (
      <g>
        <defs><clipPath id={`c-${uid}`}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
        <g transform={tf} clipPath={`url(#c-${uid})`}>
          <path d={profilo.svg_path} fill="#1A1A1A" stroke={C.profilo} strokeWidth={0.6} />
        </g>
        {codice && <text x={lx} y={ly + 3} textAnchor="middle" fontSize={fs}
          fill={C.label} fontFamily="monospace"
          transform={rotated ? `rotate(-90,${lx},${ly})` : undefined}>{codice}</text>}
      </g>
    );
  }

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#141414" stroke={C.profilo} strokeWidth={0.9} />
      {codice && <text x={lx} y={ly + 3} textAnchor="middle" fontSize={fs}
        fill={C.label} fontFamily="monospace"
        transform={rotated ? `rotate(-90,${lx},${ly})` : undefined}>{codice}</text>}
    </g>
  );
}

// ── SVG Disegno ────────────────────────────────────────────────
function SvgDisegno({ tipo, L, H, nMontanti, nTraversi, showQuote, profili, bautiefe, w, h }: any) {
  const uid = `dt${L}${H}${tipo}`;
  const QH = 32; const QL = 48; const PAD = 18;
  const fw = w - PAD * 2 - QL; const fh = h - PAD * 2 - QH - 20;
  const ox = PAD + QL; const oy = PAD + QH;
  const sc = Math.min(fw / L, fh / H);
  const SW = L * sc; const SH = H * sc;
  const cx = ox + (fw - SW) / 2; const cy = oy + (fh - SH) / 2;

  // Spessori reali dall'archivio, fallback bautiefe
  const spT = Math.max(7, (profili.telaio?.larghezza_mm || bautiefe) * sc);
  const spA = Math.max(6, (profili.anta?.larghezza_mm || Math.max(bautiefe - 5, 60)) * sc);

  const t = TIPOLOGIE.find(x => x.id === tipo);
  const nAnte = t?.nAnte ?? 1;
  const isAR = tipo.includes("ar"); const isAB = tipo.includes("ab");
  const isWas = tipo === "wasistas"; const isFis = tipo === "fisso";
  const isSc = tipo === "scorrevole_2";

  const monPx: number[] = nAnte === 2 && nMontanti === 0
    ? [SW / 2]
    : Array.from({ length: nMontanti }, (_, i) => SW * (i + 1) / (nMontanti + 1));
  const travPx = Array.from({ length: nTraversi }, (_, i) => SH * (i + 1) / (nTraversi + 1));
  const cols: number[] = monPx.length > 0
    ? (() => { const r: number[] = []; let p = 0; for (const m of monPx) { r.push(m - p); p = m; } r.push(SW - p); return r; })()
    : [SW];

  const codVet = profili.vetro?.codice || "Vetro";

  const renderAnta = (ai: number, ax: number, ay: number, aw: number, ah: number) => {
    const isSx = ai === 0;
    const vx = ax + spA; const vy = ay + spA;
    const vw = aw - spA * 2; const vh = ah - spA * 2;
    if (vw <= 0 || vh <= 0) return null;
    const clipId = `${uid}-v${ai}`;
    const pivX = nAnte >= 2 ? (isSx ? ax + aw : ax) : ax;
    return (
      <g key={ai}>
        <VetroHatch x={vx} y={vy} w={vw} h={vh} clipId={clipId} />
        <text x={vx + vw / 2} y={vy + vh - 8} textAnchor="middle"
          fontSize={Math.max(7, Math.min(11, vw / 10))} fill={C.labelVetro} fontFamily="monospace">{codVet}</text>
        <ProfiloRect x={ax}            y={ay} w={spA} h={ah} profilo={profili.anta} rotated uid={`${uid}-a${ai}sx`} />
        <ProfiloRect x={ax + aw - spA} y={ay} w={spA} h={ah} profilo={profili.anta} rotated uid={`${uid}-a${ai}dx`} />
        <ProfiloRect x={ax} y={ay}            w={aw} h={spA} profilo={profili.anta} uid={`${uid}-a${ai}tp`} />
        <ProfiloRect x={ax} y={ay + ah - spA} w={aw} h={spA} profilo={profili.anta} uid={`${uid}-a${ai}bt`} />
        <rect x={ax} y={ay} width={aw} height={ah} fill="none" stroke={C.profilo} strokeWidth={1.2}
          strokeDasharray={isSc ? "6,3" : "none"} />
        {isAR && !isSc && !isWas && (
          <g stroke={C.tratt} strokeWidth={0.65} strokeDasharray="4,2.5" opacity={0.85}>
            <line x1={pivX} y1={ay} x2={isSx ? ax : ax + aw} y2={ay + ah / 2} />
            <line x1={pivX} y1={ay + ah} x2={isSx ? ax : ax + aw} y2={ay + ah / 2} />
            <line x1={isSx ? ax : ax + aw} y1={ay} x2={isSx ? ax : ax + aw} y2={ay + ah} />
            <path d={`M ${ax} ${ay + ah} Q ${ax + aw / 2} ${ay + ah + Math.min(aw * 0.32, 60)} ${ax + aw} ${ay + ah}`} fill="none" />
            <line x1={ax} y1={ay + ah} x2={ax + aw / 2} y2={ay + ah + Math.min(aw * 0.32, 60)} />
            <line x1={ax + aw} y1={ay + ah} x2={ax + aw / 2} y2={ay + ah + Math.min(aw * 0.32, 60)} />
          </g>
        )}
        {isAB && !isSc && (
          <g stroke={C.tratt} strokeWidth={0.65} strokeDasharray="4,2.5" opacity={0.85}>
            <path d={`M ${pivX} ${ay} Q ${pivX + (isSx ? -aw * 0.38 : aw * 0.38)} ${ay + ah / 2} ${pivX} ${ay + ah}`} fill="none" />
            <line x1={pivX} y1={ay} x2={pivX + (isSx ? -aw * 0.38 : aw * 0.38)} y2={ay + ah / 2} />
            <line x1={pivX} y1={ay + ah} x2={pivX + (isSx ? -aw * 0.38 : aw * 0.38)} y2={ay + ah / 2} />
          </g>
        )}
        {isWas && (
          <g stroke={C.tratt} strokeWidth={0.65} strokeDasharray="4,2.5" opacity={0.85}>
            <path d={`M ${ax} ${ay} Q ${ax + aw / 2} ${ay - Math.min(aw * 0.3, 50)} ${ax + aw} ${ay}`} fill="none" />
            <line x1={ax} y1={ay} x2={ax + aw / 2} y2={ay - Math.min(aw * 0.3, 50)} />
            <line x1={ax + aw} y1={ay} x2={ax + aw / 2} y2={ay - Math.min(aw * 0.3, 50)} />
          </g>
        )}
        {(isAR || isAB) && !isFis && !isSc && !isWas && (() => {
          const mX = nAnte >= 2 ? (isSx ? ax + aw - spA * 2.2 : ax + spA * 1.2) : ax + aw - spA * 2.2;
          const mY = ay + ah / 2;
          return (
            <g key="man">
              <rect x={mX} y={mY - 12} width={7} height={24} rx={3} fill={C.maniglia} stroke="#777" strokeWidth={0.5} />
              <rect x={mX + 7} y={mY - 5} width={16} height={10} rx={3} fill={C.maniglia} stroke="#777" strokeWidth={0.5} />
            </g>
          );
        })()}
      </g>
    );
  };

  let anteRects: any[] = [];
  if (nAnte === 0) { anteRects = []; }
  else { let x = cx; anteRects = cols.map(cw => { const r = { ax: x, ay: cy, aw: cw, ah: SH }; x += cw; return r; }); }

  return (
    <svg width={w} height={h} style={{ display: "block", background: C.bg }}>
      <defs>
        <marker id="scArr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0,0 6,3 0,6" fill={C.quota} />
        </marker>
      </defs>

      {/* Quote */}
      {showQuote && (
        <g>
          <line x1={cx} y1={cy - 18} x2={cx + SW} y2={cy - 18} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx} y1={cy - 24} x2={cx} y2={cy - 12} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx + SW} y1={cy - 24} x2={cx + SW} y2={cy - 12} stroke={C.quota} strokeWidth={0.8} />
          <text x={cx + SW / 2} y={cy - 5} textAnchor="middle"
            fontSize={13} fill={C.quota} fontFamily="monospace" fontWeight="bold">{L}</text>
          <line x1={cx - 18} y1={cy} x2={cx - 18} y2={cy + SH} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx - 24} y1={cy} x2={cx - 12} y2={cy} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx - 24} y1={cy + SH} x2={cx - 12} y2={cy + SH} stroke={C.quota} strokeWidth={0.8} />
          <text x={cx - 5} y={cy + SH / 2} textAnchor="middle"
            fontSize={13} fill={C.quota} fontFamily="monospace" fontWeight="bold"
            transform={`rotate(-90,${cx - 5},${cy + SH / 2})`}>{H}</text>
          {monPx.length > 0 && (() => {
            let prev = cx;
            return cols.map((cw, i) => {
              const el = (
                <g key={i}>
                  <line x1={prev} y1={cy + SH + 16} x2={prev + cw} y2={cy + SH + 16} stroke={C.quota} strokeWidth={0.6} />
                  <line x1={prev} y1={cy + SH + 12} x2={prev} y2={cy + SH + 20} stroke={C.quota} strokeWidth={0.6} />
                  <line x1={prev + cw} y1={cy + SH + 12} x2={prev + cw} y2={cy + SH + 20} stroke={C.quota} strokeWidth={0.6} />
                  <text x={prev + cw / 2} y={cy + SH + 28} textAnchor="middle"
                    fontSize={10} fill={C.quota} fontFamily="monospace">{Math.round(cw / sc)}</text>
                </g>
              );
              prev += cw; return el;
            });
          })()}
        </g>
      )}

      {/* Sfondo */}
      <rect x={cx} y={cy} width={SW} height={SH} fill="#0A0A0A" />

      {/* Telaio — z-order: prima */}
      <ProfiloRect x={cx}            y={cy} w={spT} h={SH} profilo={profili.telaio} rotated uid={`${uid}-tlsx`} />
      <ProfiloRect x={cx + SW - spT} y={cy} w={spT} h={SH} profilo={profili.telaio} rotated uid={`${uid}-tldx`} />
      <ProfiloRect x={cx} y={cy}            w={SW}  h={spT} profilo={profili.telaio} uid={`${uid}-tltp`} />
      <ProfiloRect x={cx} y={cy + SH - spT} w={SW}  h={spT} profilo={profili.telaio} uid={`${uid}-tlbt`} />

      {/* Montanti */}
      {monPx.map((mx2, mi) => (
        <ProfiloRect key={mi} x={cx + mx2 - spT / 2} y={cy} w={spT} h={SH}
          profilo={profili.montante || profili.telaio} rotated uid={`${uid}-mon${mi}`} />
      ))}

      {/* Traversi */}
      {travPx.map((ty, ti) => (
        <ProfiloRect key={ti} x={cx} y={cy + ty - spT / 2} w={SW} h={spT}
          profilo={profili.traverso || profili.telaio} uid={`${uid}-trav${ti}`} />
      ))}

      {/* Fisso */}
      {nAnte === 0 && (() => {
        const vx = cx + spT; const vy = cy + spT;
        const vw = SW - spT * 2; const vh = SH - spT * 2;
        return (
          <g>
            <VetroHatch x={vx} y={vy} w={vw} h={vh} clipId={`${uid}-fisso`} />
            <text x={vx + vw / 2} y={vy + vh - 10} textAnchor="middle"
              fontSize={Math.max(8, vw / 10)} fill={C.labelVetro} fontFamily="monospace">{codVet}</text>
          </g>
        );
      })()}

      {/* Ante */}
      {anteRects.map((r, i) => renderAnta(i, r.ax, r.ay, r.aw, r.ah))}

      {/* Bordo telaio sopra tutto */}
      <rect x={cx} y={cy} width={SW} height={SH} fill="none" stroke={C.profilo} strokeWidth={1.5} />
      <text x={w - 10} y={h - 8} textAnchor="end" fontSize={11} fill={C.quota} fontFamily="monospace">Vista Interna</text>
    </svg>
  );
}

// ── TBtn ───────────────────────────────────────────────────────
const TBtn = ({ active, onClick, label }: any) => (
  <div onClick={onClick} style={{
    padding: "3px 8px", borderRadius: 3, fontSize: 10, cursor: "pointer",
    fontFamily: "monospace", userSelect: "none" as any,
    background: active ? "#223355" : "transparent",
    color: active ? "#88AAFF" : "#777",
    border: `1px solid ${active ? "#3355AA" : "#2A2A2A"}`,
  }}>{label}</div>
);

// ── MAIN ───────────────────────────────────────────────────────
export default function DisegnoTecnico({
  vanoId, vanoNome = "Vano", vanoDisegno, realW, realH,
  onUpdate, onUpdateField, onClose, T, sistemiDB = [],
}: Props) {
  const [tipo, setTipo]           = useState<TipApertura>(vanoDisegno?.tipologia || "2ante_ar");
  const [nMontanti, setNMontanti] = useState(vanoDisegno?.nMontanti || 0);
  const [nTraversi, setNTraversi] = useState(vanoDisegno?.nTraversi || 0);
  const [showQuote, setShowQuote] = useState(true);
  const [sistema, setSistema]     = useState(vanoDisegno?.sistema || "");

  const L = parseInt(String(realW)) || 1200;
  const H = parseInt(String(realH)) || 2100;

  const sistemaRec = sistemiDB.find((s: any) =>
    (s.marca + " " + s.sistema) === sistema || s.sistema === sistema
  );
  const bautiefe: number = sistemaRec?.bautiefe || 70;

  const { profili, loading } = useProfiliSezioni(sistema);

  const save = useCallback((patch: any = {}) => {
    onUpdate?.({ ...vanoDisegno, tipologia: tipo, nMontanti, nTraversi, sistema, ...patch });
  }, [vanoDisegno, tipo, nMontanti, nTraversi, sistema, onUpdate]);

  const svgW = Math.max(420, Math.min(780, L / 2.8 + 140));
  const svgH = Math.max(360, Math.min(680, H / 3.8 + 140));
  const tipRec = TIPOLOGIE.find(t => t.id === tipo);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#050508", fontFamily: "monospace" }}>

      {/* Toolbar */}
      <div style={{ background: C.toolBg, borderBottom: `1px solid ${C.toolBdr}`,
        padding: "6px 12px", display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0, flexWrap: "wrap" as any }}>
        <span style={{ fontSize: 11, color: C.quota, fontWeight: "bold", marginRight: 4 }}>{vanoNome}</span>
        <span style={{ fontSize: 10, color: "#5588CC" }}>{L}×{H}</span>
        <div style={{ width: 1, height: 16, background: "#2A2A2A" }} />
        {TIPOLOGIE.map(t => (
          <TBtn key={t.id} active={tipo === t.id}
            onClick={() => { setTipo(t.id as TipApertura); save({ tipologia: t.id }); }}
            label={t.label} />
        ))}
        <div style={{ width: 1, height: 16, background: "#2A2A2A" }} />
        <span style={{ fontSize: 9, color: "#444" }}>Mont.</span>
        {[0, 1, 2, 3].map(n => (
          <TBtn key={n} active={nMontanti === n}
            onClick={() => { setNMontanti(n); save({ nMontanti: n }); }} label={String(n)} />
        ))}
        <span style={{ fontSize: 9, color: "#444" }}>Trav.</span>
        {[0, 1, 2].map(n => (
          <TBtn key={n} active={nTraversi === n}
            onClick={() => { setNTraversi(n); save({ nTraversi: n }); }} label={String(n)} />
        ))}
        <div style={{ width: 1, height: 16, background: "#2A2A2A" }} />
        <TBtn active={showQuote} onClick={() => setShowQuote(q => !q)} label="Quote" />
        {sistemiDB.length > 0 && (
          <select value={sistema}
            onChange={e => { setSistema(e.target.value); save({ sistema: e.target.value }); }}
            style={{ padding: "2px 6px", background: "#111", border: "1px solid #2A2A2A",
              borderRadius: 3, color: "#88AAFF", fontSize: 10, fontFamily: "monospace" }}>
            <option value="">— Sistema —</option>
            {sistemiDB.map((s: any) => (
              <option key={s.id} value={s.marca + " " + s.sistema}>{s.marca} {s.sistema}</option>
            ))}
          </select>
        )}
        {sistema && (
          <span style={{ fontSize: 9, color: loading ? "#666" : "#1A9E73", fontFamily: "monospace" }}>
            {loading ? "…" : `${Object.keys(profili).length} profili`}
          </span>
        )}
        {onClose && (
          <div onClick={onClose} style={{ marginLeft: "auto", padding: "3px 9px", borderRadius: 3,
            background: "#220000", border: "1px solid #440000", color: "#FF4444", fontSize: 10, cursor: "pointer" }}>✕</div>
        )}
      </div>

      {/* Canvas + pannello */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "auto", padding: 12, background: "#050508" }}>
          <SvgDisegno tipo={tipo} L={L} H={H} nMontanti={nMontanti} nTraversi={nTraversi}
            showQuote={showQuote} profili={profili} bautiefe={bautiefe} w={svgW} h={svgH} />
        </div>
        <div style={{ width: 190, flexShrink: 0, background: C.panelBg,
          borderLeft: `1px solid ${C.toolBdr}`, padding: 10, overflowY: "auto" as any }}>
          <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase" as any, letterSpacing: 1, marginBottom: 8 }}>Dati tecnici</div>
          {[
            ["Sistema",  sistema || "—"],
            ["Tipo",     tipRec?.label || tipo],
            ["L",        `${L} mm`],
            ["H",        `${H} mm`],
            ["Area",     `${((L / 1000) * (H / 1000)).toFixed(3)} m²`],
            ["Perim.",   `${(2 * (L + H) / 1000).toFixed(2)} m`],
            ["Ante",     String(tipRec?.nAnte ?? "—")],
            ["Mont.+",   String(nMontanti)],
            ["Trav.+",   String(nTraversi)],
            ["Bautiefe", `${bautiefe} mm`],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between",
              padding: "3px 0", borderBottom: "1px solid #111", fontSize: 9 }}>
              <span style={{ color: "#444" }}>{l}</span>
              <span style={{ color: C.quota, fontWeight: "bold" }}>{v}</span>
            </div>
          ))}
          {Object.keys(profili).length > 0 && (
            <>
              <div style={{ marginTop: 10, fontSize: 9, color: "#333",
                textTransform: "uppercase" as any, letterSpacing: 1, marginBottom: 6 }}>Profili archivio</div>
              {Object.entries(profili).map(([t2, p]: any) => (
                <div key={t2} style={{ padding: "3px 0", borderBottom: "1px solid #111" }}>
                  <div style={{ fontSize: 8, color: "#333", textTransform: "capitalize" as any }}>{t2}</div>
                  <div style={{ fontSize: 9, color: "#5588CC", fontWeight: "bold" }}>{p.codice}</div>
                  <div style={{ fontSize: 8, color: "#444" }}>{p.larghezza_mm}×{p.altezza_mm}mm</div>
                </div>
              ))}
            </>
          )}
          {sistema && !loading && Object.keys(profili).length === 0 && (
            <div style={{ marginTop: 10, padding: "6px 8px", borderRadius: 4,
              background: "#220000", border: "1px solid #440000", fontSize: 9, color: "#FF6666" }}>
              Nessun profilo in archivio per questo sistema. Aggiungili da Impostazioni → Profili.
            </div>
          )}
          {(onUpdate || onUpdateField) && (
            <button onClick={() => save()} style={{ width: "100%", marginTop: 12, padding: "6px",
              borderRadius: 3, background: "#112233", color: "#5588CC",
              border: "1px solid #223344", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>
              Salva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
