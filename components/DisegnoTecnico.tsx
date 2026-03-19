"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO — DisegnoTecnico v4
// Rendering identico a Opera Company v3.9
// Sfondo nero · profili etichettati · tratteggio anta · quote gialle
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useId } from "react";

const C = {
  bg: "#000000", profilo: "#FFFFFF", quota: "#CCCC00",
  tratt: "#FFFFFF", maniglia: "#CCCCCC",
  vetroFill: "#003344", vetroTratt: "#005566",
  labelVetro: "#0099BB", label: "#FFFFFF",
  toolBg: "#0F0F1A", toolBdr: "#222222", toolTxt: "#AAAAAA",
  panelBg: "#0D0D18",
};

export type TipApertura =
  | "fisso" | "1anta_ar" | "2ante_ar" | "1anta_ab" | "2ante_ab"
  | "balcone_1ar" | "balcone_2ar" | "wasistas"
  | "scorrevole_2" | "ribalta_scorre";

const TIPOLOGIE = [
  { id: "fisso",         label: "Fisso",          nAnte: 0 },
  { id: "1anta_ar",      label: "1A A-R",         nAnte: 1 },
  { id: "2ante_ar",      label: "2A A-R",         nAnte: 2 },
  { id: "1anta_ab",      label: "1A A-B",         nAnte: 1 },
  { id: "2ante_ab",      label: "2A A-B",         nAnte: 2 },
  { id: "balcone_1ar",   label: "Balc. 1A",       nAnte: 1 },
  { id: "balcone_2ar",   label: "Balc. 2A",       nAnte: 2 },
  { id: "wasistas",      label: "Wasistas",       nAnte: 1 },
  { id: "scorrevole_2",  label: "Scorr. 2A",      nAnte: 2 },
  { id: "ribalta_scorre","label":"Rib+Sc.",        nAnte: 2 },
];

interface Props {
  vanoId?: string; vanoNome?: string; vanoDisegno?: any;
  realW: number; realH: number;
  onUpdate?: (d: any) => void; onUpdateField?: (f: string, v: any) => void;
  onClose?: () => void; T?: any; sistemiDB?: any[];
}

// ── Tratteggio diagonale vetro stile Opera ─────────────────────
function VetroHatch({ x, y, w, h, clipId }: any) {
  const step = 10;
  const lines = [];
  for (let i = -Math.ceil(h / step); i <= Math.ceil(w / step) + 2; i++) {
    lines.push(
      <line key={i}
        x1={i * step} y1={h}
        x2={i * step + h} y2={0}
        stroke={C.vetroTratt} strokeWidth={0.7} opacity={0.45}
      />
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={w} height={h} />
        </clipPath>
      </defs>
      <g transform={`translate(${x},${y})`} clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={w} height={h} fill={C.vetroFill} />
        {lines}
      </g>
    </g>
  );
}

// ── SVG Opera rendering ────────────────────────────────────────
function SvgOpera({
  tipo, L, H, nMontanti, nTraversi, showQuote,
  codTel, codAnt, codVet, bautiefe = 70, w, h,
}: any) {
  const uid = `sv${L}${H}${tipo}`;

  // Layout
  const QH = 32; const QL = 48; const PAD = 18;
  const fw = w - PAD * 2 - QL;
  const fh = h - PAD * 2 - QH - 20;
  const ox = PAD + QL; const oy = PAD + QH;

  const sc = Math.min(fw / L, fh / H);
  const SW = L * sc; const SH = H * sc;
  const cx = ox + (fw - SW) / 2; const cy = oy + (fh - SH) / 2;

  // Spessore profilo in px — dalla bautiefe reale del sistema
  const spT = Math.max(7, bautiefe * sc);  // telaio
  const spA = Math.max(6, (bautiefe - 5) * sc);  // anta (leggermente meno)

  const t = TIPOLOGIE.find(x => x.id === tipo);
  const nAnte = t?.nAnte ?? 1;
  const isAR  = tipo.includes("ar");
  const isAB  = tipo.includes("ab");
  const isWas = tipo === "wasistas";
  const isFis = tipo === "fisso";
  const isSc  = tipo === "scorrevole_2";

  // Montanti (pixel da sx telaio)
  const monPx: number[] = nAnte === 2 && nMontanti === 0
    ? [SW / 2]
    : Array.from({ length: nMontanti }, (_, i) => SW * (i + 1) / (nMontanti + 1));

  // Traversi
  const travPx = Array.from({ length: nTraversi }, (_, i) => SH * (i + 1) / (nTraversi + 1));

  // Colonne ante
  const cols: number[] = monPx.length > 0
    ? (() => { const r: number[] = []; let p = 0; for (const m of monPx) { r.push(m - p); p = m; } r.push(SW - p); return r; })()
    : nAnte > 0 ? [SW] : [SW];

  const renderAnta = (ai: number, ax: number, ay: number, aw: number, ah: number) => {
    const isSx = ai === 0;
    const vx = ax + spA; const vy = ay + spA;
    const vw = aw - spA * 2; const vh = ah - spA * 2;
    if (vw <= 0 || vh <= 0) return null;

    const clipId = `${uid}-v${ai}`;
    const pivX = nAnte >= 2 ? (isSx ? ax + aw : ax) : ax; // punto cardine

    return (
      <g key={ai}>
        {/* Vetro */}
        <VetroHatch x={vx} y={vy} w={vw} h={vh} clipId={clipId} />

        {/* Label vetro */}
        <text x={vx + vw / 2} y={vy + vh - 8}
          textAnchor="middle" fontSize={Math.max(7, Math.min(11, vw / 10))}
          fill={C.labelVetro} fontFamily="monospace">{codVet}</text>

        {/* Profili anta etichettati */}
        {[
          { rx: ax,            ry: ay, rw: spA,  rh: ah,  rot: true,  lx: ax + spA / 2,       ly: ay + ah / 2 },
          { rx: ax + aw - spA, ry: ay, rw: spA,  rh: ah,  rot: true,  lx: ax + aw - spA / 2,  ly: ay + ah / 2 },
          { rx: ax,            ry: ay, rw: aw,   rh: spA, rot: false, lx: ax + aw / 2,         ly: ay + spA / 2 },
          { rx: ax, ry: ay + ah - spA, rw: aw,   rh: spA, rot: false, lx: ax + aw / 2,         ly: ay + ah - spA / 2 },
        ].map((p, pi) => (
          <g key={pi}>
            <rect x={p.rx} y={p.ry} width={p.rw} height={p.rh}
              fill="#111" stroke={C.profilo} strokeWidth={0.8} />
            <text x={p.lx} y={p.ly + 3} textAnchor="middle"
              fontSize={Math.max(5, Math.min(8, spA * 0.55))}
              fill={C.label} fontFamily="monospace"
              transform={p.rot ? `rotate(-90,${p.lx},${p.ly})` : undefined}>
              {codAnt}
            </text>
          </g>
        ))}

        {/* Bordo anta */}
        <rect x={ax} y={ay} width={aw} height={ah}
          fill="none" stroke={C.profilo} strokeWidth={1.2}
          strokeDasharray={isSc ? "6,3" : "none"} />

        {/* Linee tratteggio apertura stile Opera */}
        {isAR && !isSc && !isWas && (
          <g stroke={C.tratt} strokeWidth={0.65} strokeDasharray="4,2.5" opacity={0.85}>
            {/* Triangolo laterale */}
            <line x1={pivX} y1={ay} x2={isSx ? ax : ax + aw} y2={ay + ah / 2} />
            <line x1={pivX} y1={ay + ah} x2={isSx ? ax : ax + aw} y2={ay + ah / 2} />
            <line x1={isSx ? ax : ax + aw} y1={ay} x2={isSx ? ax : ax + aw} y2={ay + ah} />
            {/* Arco ribalta in basso */}
            <path d={`M ${ax} ${ay + ah} Q ${ax + aw / 2} ${ay + ah + Math.min(aw * 0.32, 60)} ${ax + aw} ${ay + ah}`}
              fill="none" />
            <line x1={ax} y1={ay + ah} x2={ax + aw / 2} y2={ay + ah + Math.min(aw * 0.32, 60)} />
            <line x1={ax + aw} y1={ay + ah} x2={ax + aw / 2} y2={ay + ah + Math.min(aw * 0.32, 60)} />
          </g>
        )}

        {isAB && !isSc && (
          <g stroke={C.tratt} strokeWidth={0.65} strokeDasharray="4,2.5" opacity={0.85}>
            <path d={`M ${pivX} ${ay} Q ${pivX + (isSx ? -aw * 0.38 : aw * 0.38)} ${ay + ah / 2} ${pivX} ${ay + ah}`}
              fill="none" />
            <line x1={pivX} y1={ay} x2={pivX + (isSx ? -aw * 0.38 : aw * 0.38)} y2={ay + ah / 2} />
            <line x1={pivX} y1={ay + ah} x2={pivX + (isSx ? -aw * 0.38 : aw * 0.38)} y2={ay + ah / 2} />
          </g>
        )}

        {isWas && (
          <g stroke={C.tratt} strokeWidth={0.65} strokeDasharray="4,2.5" opacity={0.85}>
            <path d={`M ${ax} ${ay} Q ${ax + aw / 2} ${ay - Math.min(aw * 0.3, 50)} ${ax + aw} ${ay}`} fill="none" />
            <line x1={ax} y1={ay} x2={ax + aw / 2} y2={ay - Math.min(aw * 0.3, 50)} />
            <line x1={ax + aw} y1={ay} x2={ax + aw / 2} y2={ay - Math.min(aw * 0.3, 50)} />
            {/* Linea cerniera bassa */}
            <line x1={ax + spA} y1={ay + ah - spA / 2} x2={ax + aw - spA} y2={ay + ah - spA / 2}
              stroke={C.profilo} strokeWidth={1} strokeDasharray="none" />
          </g>
        )}

        {isSc && (
          <g>
            <line x1={ax + (isSx ? aw * 0.75 : aw * 0.25)} y1={ay + ah / 2}
                  x2={ax + (isSx ? aw * 0.15 : aw * 0.85)} y2={ay + ah / 2}
              stroke={C.quota} strokeWidth={1.5} markerEnd="url(#scArr)" />
          </g>
        )}

        {/* Maniglia */}
        {(isAR || isAB) && !isFis && !isSc && !isWas && (() => {
          const mX = nAnte >= 2
            ? (isSx ? ax + aw - spA * 2.2 : ax + spA * 1.2)
            : ax + aw - spA * 2.2;
          const mY = ay + ah / 2;
          return (
            <g key="man">
              <rect x={mX} y={mY - 12} width={7} height={24} rx={3}
                fill={C.maniglia} stroke="#777" strokeWidth={0.5} />
              <rect x={mX + 7} y={mY - 5} width={16} height={10} rx={3}
                fill={C.maniglia} stroke="#777" strokeWidth={0.5} />
              {/* Linea leader */}
              <line x1={mX + 20} y1={mY} x2={mX + 36} y2={mY - 16}
                stroke={C.quota} strokeWidth={0.6} />
              <text x={mX + 38} y={mY - 18}
                fontSize={8} fill={C.quota} fontFamily="monospace">
                {Math.round((isSx ? (L / 2) - 35 : (L / 2) - 35))}
              </text>
            </g>
          );
        })()}
      </g>
    );
  };

  // Ante positions
  let anteRects: any[] = [];
  if (nAnte === 0) {
    anteRects = [{ ax: cx, ay: cy, aw: SW, ah: SH }];
  } else {
    let x = cx;
    anteRects = cols.map(cw => { const r = { ax: x, ay: cy, aw: cw, ah: SH }; x += cw; return r; });
  }

  return (
    <svg width={w} height={h} style={{ display: "block", background: C.bg }}>
      <defs>
        <marker id="scArr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0,0 6,3 0,6" fill={C.quota} />
        </marker>
      </defs>

      {/* Quote totali gialle */}
      {showQuote && (
        <g>
          {/* Larghezza */}
          <line x1={cx} y1={cy - 18} x2={cx + SW} y2={cy - 18} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx} y1={cy - 24} x2={cx} y2={cy - 12} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx + SW} y1={cy - 24} x2={cx + SW} y2={cy - 12} stroke={C.quota} strokeWidth={0.8} />
          <text x={cx + SW / 2} y={cy - 5} textAnchor="middle"
            fontSize={13} fill={C.quota} fontFamily="monospace" fontWeight="bold">{L}</text>
          {/* Altezza */}
          <line x1={cx - 18} y1={cy} x2={cx - 18} y2={cy + SH} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx - 24} y1={cy} x2={cx - 12} y2={cy} stroke={C.quota} strokeWidth={0.8} />
          <line x1={cx - 24} y1={cy + SH} x2={cx - 12} y2={cy + SH} stroke={C.quota} strokeWidth={0.8} />
          <text x={cx - 5} y={cy + SH / 2} textAnchor="middle"
            fontSize={13} fill={C.quota} fontFamily="monospace" fontWeight="bold"
            transform={`rotate(-90,${cx - 5},${cy + SH / 2})`}>{H}</text>
        </g>
      )}

      {/* Sfondo telaio */}
      <rect x={cx} y={cy} width={SW} height={SH} fill="#0A0A0A" />

      {/* Profili telaio esterno etichettati */}
      {[
        { rx: cx,          ry: cy,          rw: spT, rh: SH, rot: true,  lx: cx + spT / 2,      ly: cy + SH / 2 },
        { rx: cx + SW - spT, ry: cy,        rw: spT, rh: SH, rot: true,  lx: cx + SW - spT / 2, ly: cy + SH / 2 },
        { rx: cx,          ry: cy,          rw: SW,  rh: spT, rot: false, lx: cx + SW / 2,        ly: cy + spT / 2 },
        { rx: cx,          ry: cy + SH - spT, rw: SW, rh: spT, rot: false, lx: cx + SW / 2,       ly: cy + SH - spT / 2 },
      ].map((p, pi) => (
        <g key={pi}>
          <rect x={p.rx} y={p.ry} width={p.rw} height={p.rh}
            fill="#141414" stroke={C.profilo} strokeWidth={1} />
          <text x={p.lx} y={p.ly + 3} textAnchor="middle"
            fontSize={Math.max(6, Math.min(9, spT * 0.6))}
            fill={C.label} fontFamily="monospace"
            transform={p.rot ? `rotate(-90,${p.lx},${p.ly})` : undefined}>
            {codTel}
          </text>
        </g>
      ))}

      {/* Montanti */}
      {monPx.map((mx2, mi) => (
        <g key={mi}>
          <rect x={cx + mx2 - spT / 2} y={cy} width={spT} height={SH}
            fill="#141414" stroke={C.profilo} strokeWidth={1} />
          <text x={cx + mx2} y={cy + SH / 2} textAnchor="middle"
            fontSize={Math.max(6, spT * 0.5)} fill={C.label} fontFamily="monospace"
            transform={`rotate(-90,${cx + mx2},${cy + SH / 2})`}>{codTel}</text>
        </g>
      ))}

      {/* Traversi */}
      {travPx.map((ty, ti) => (
        <g key={ti}>
          <rect x={cx} y={cy + ty - spT / 2} width={SW} height={spT}
            fill="#141414" stroke={C.profilo} strokeWidth={1} />
          <text x={cx + SW / 2} y={cy + ty + 3} textAnchor="middle"
            fontSize={Math.max(6, spT * 0.5)} fill={C.label} fontFamily="monospace">{codTel}</text>
        </g>
      ))}

      {/* Ante */}
      {nAnte === 0
        ? (() => {
            const vx = cx + spT; const vy = cy + spT;
            const vw = SW - spT * 2; const vh = SH - spT * 2;
            return (
              <g>
                <VetroHatch x={vx} y={vy} w={vw} h={vh} clipId={`${uid}-fisso`} />
                <text x={vx + vw / 2} y={vy + vh - 10} textAnchor="middle"
                  fontSize={Math.max(8, vw / 10)} fill={C.labelVetro} fontFamily="monospace">{codVet}</text>
              </g>
            );
          })()
        : anteRects.map((r, i) => renderAnta(i, r.ax, r.ay, r.aw, r.ah))
      }

      {/* Bordo telaio sopra tutto */}
      <rect x={cx} y={cy} width={SW} height={SH}
        fill="none" stroke={C.profilo} strokeWidth={1.5} />

      {/* Label Vista Interna */}
      <text x={w - 10} y={h - 8} textAnchor="end"
        fontSize={11} fill={C.quota} fontFamily="monospace">Vista Interna</text>
    </svg>
  );
}

// ── TBtn ───────────────────────────────────────────────────────
const TBtn = ({ active, onClick, label }: any) => (
  <div onClick={onClick} style={{
    padding: "3px 8px", borderRadius: 3, fontSize: 10, cursor: "pointer",
    fontFamily: "monospace", userSelect: "none",
    background: active ? "#223355" : "transparent",
    color: active ? "#88AAFF" : "#777",
    border: `1px solid ${active ? "#3355AA" : "#2A2A2A"}`,
  }}>{label}</div>
);

// ── Main ───────────────────────────────────────────────────────
export default function DisegnoTecnico({
  vanoNome = "Vano", vanoDisegno, realW, realH,
  onUpdate, onUpdateField, onClose, T, sistemiDB = [],
}: Props) {
  const [tipo, setTipo] = useState<TipApertura>(vanoDisegno?.tipologia || "2ante_ar");
  const [nMontanti, setNMontanti] = useState(vanoDisegno?.nMontanti || 0);
  const [nTraversi, setNTraversi] = useState(vanoDisegno?.nTraversi || 0);
  const [showQuote, setShowQuote] = useState(true);
  const [sistema, setSistema] = useState(vanoDisegno?.sistema || "IDEAL_5000");

  const L = parseInt(String(realW)) || 1200;
  const H = parseInt(String(realH)) || 2100;

  // Leggi bautiefe reale dal sistemiDB (aggiunto in mastro-constants)
  const sistemaRec = sistemiDB.find((s: any) =>
    s.sistema === sistema || s.nome === sistema ||
    (s.marca + " " + s.sistema) === sistema
  );
  const bautiefe: number = sistemaRec?.bautiefe || 70;

  // Codici profilo dal sistema
  const codTel = sistema.includes("5000") ? "14XX07+R" : sistema.includes("4000") ? "140X07+R" : sistema.includes("CT70") ? "040x02" : "14XX07+R";
  const codAnt  = sistema.includes("5000") ? "14XX22+R" : sistema.includes("4000") ? "140X22+R" : sistema.includes("CT70") ? "040x22" : "14XX22+R";
  const codVet  = "V4T-16ARGON-4TSG";

  const save = useCallback((patch: any = {}) => {
    onUpdate?.({ ...vanoDisegno, tipologia: tipo, nMontanti, nTraversi, sistema, ...patch });
  }, [vanoDisegno, tipo, nMontanti, nTraversi, sistema, onUpdate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#050508", fontFamily: "monospace" }}>

      {/* Toolbar */}
      <div style={{ background: C.toolBg, borderBottom: `1px solid ${C.toolBdr}`, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: C.quota, fontWeight: "bold", marginRight: 4 }}>{vanoNome}</span>
        <span style={{ fontSize: 10, color: "#5588CC" }}>{L}×{H}</span>
        <div style={{ width: 1, height: 16, background: "#2A2A2A" }} />

        {/* Tipologie */}
        {TIPOLOGIE.map(t => (
          <TBtn key={t.id} active={tipo === t.id}
            onClick={() => { setTipo(t.id as TipApertura); save({ tipologia: t.id }); }}
            label={t.label} />
        ))}

        <div style={{ width: 1, height: 16, background: "#2A2A2A" }} />

        {/* Montanti */}
        <span style={{ fontSize: 9, color: "#444" }}>Mont.</span>
        {[0, 1, 2, 3].map(n => (
          <TBtn key={n} active={nMontanti === n}
            onClick={() => { setNMontanti(n); save({ nMontanti: n }); }}
            label={String(n)} />
        ))}

        <span style={{ fontSize: 9, color: "#444" }}>Trav.</span>
        {[0, 1, 2].map(n => (
          <TBtn key={n} active={nTraversi === n}
            onClick={() => { setNTraversi(n); save({ nTraversi: n }); }}
            label={String(n)} />
        ))}

        <div style={{ width: 1, height: 16, background: "#2A2A2A" }} />
        <TBtn active={showQuote} onClick={() => setShowQuote(q => !q)} label="Quote" />

        {/* Sistema */}
        {sistemiDB.length > 0 && (
          <select value={sistema} onChange={e => { setSistema(e.target.value); save({ sistema: e.target.value }); }}
            style={{ padding: "2px 6px", background: "#111", border: "1px solid #2A2A2A", borderRadius: 3, color: "#88AAFF", fontSize: 10, fontFamily: "monospace" }}>
            {sistemiDB.map((s: any) => <option key={s.id || s.nome} value={s.nome || s.id}>{s.nome}</option>)}
          </select>
        )}

        {onClose && (
          <div onClick={onClose}
            style={{ marginLeft: "auto", padding: "3px 9px", borderRadius: 3, background: "#220000", border: "1px solid #440000", color: "#FF4444", fontSize: 10, cursor: "pointer" }}>
            ✕
          </div>
        )}
      </div>

      {/* Canvas + pannello */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* SVG Canvas */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 12, background: "#050508" }}>
          <SvgOpera
            tipo={tipo} L={L} H={H}
            nMontanti={nMontanti} nTraversi={nTraversi}
            showQuote={showQuote}
            codTel={codTel} codAnt={codAnt} codVet={codVet}
            bautiefe={bautiefe}
            w={Math.max(420, Math.min(780, L / 2.8 + 140))}
            h={Math.max(360, Math.min(680, H / 3.8 + 140))}
          />
        </div>

        {/* Info panel */}
        <div style={{ width: 180, flexShrink: 0, background: C.panelBg, borderLeft: `1px solid ${C.toolBdr}`, padding: 10, overflowY: "auto" }}>
          <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Dati tecnici</div>
          {[
            ["Serie", sistema],
            ["Tipo", TIPOLOGIE.find(t => t.id === tipo)?.label || tipo],
            ["L", `${L} mm`],
            ["H", `${H} mm`],
            ["Area", `${((L / 1000) * (H / 1000)).toFixed(3)} m²`],
            ["Perim.", `${(2 * (L + H) / 1000).toFixed(2)} m`],
            ["Ante", String(TIPOLOGIE.find(t => t.id === tipo)?.nAnte ?? "—")],
            ["Mont.+", String(nMontanti)],
            ["Trav.+", String(nTraversi)],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #111", fontSize: 9 }}>
              <span style={{ color: "#444" }}>{l}</span>
              <span style={{ color: C.quota, fontWeight: "bold" }}>{v}</span>
            </div>
          ))}

          <div style={{ marginTop: 10, fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Profili</div>
          {[["Telaio", codTel], ["Anta", codAnt], ["Vetro", codVet]].map(([l, v], i) => (
            <div key={i} style={{ padding: "3px 0", borderBottom: "1px solid #111" }}>
              <div style={{ fontSize: 8, color: "#333" }}>{l}</div>
              <div style={{ fontSize: 9, color: "#5588CC", fontWeight: "bold" }}>{v}</div>
            </div>
          ))}

          {(onUpdate || onUpdateField) && (
            <button onClick={() => save()}
              style={{ width: "100%", marginTop: 12, padding: "6px", borderRadius: 3, background: "#112233", color: "#5588CC", border: "1px solid #223344", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>
              Salva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
