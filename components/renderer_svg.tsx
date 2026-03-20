"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — MODULO 3: RENDERER SVG TECNICO
// Legge solo il modello dati — nessuna logica business qui
// ═══════════════════════════════════════════════════════════════
import React from "react";
import type { Infisso, Cella, Griglia } from "./types_cad";

const AMBER = "#D08008"; const DARK = "#1A1A1C"; const TEAL = "#1A9E73";
const VETRO_FILL = "rgba(200,220,240,0.25)";
const PROFILO_FILL = "#C8C8C8";

interface Props {
  infisso: Infisso;
  width?: number | string;
  height?: number | string;
  onCellaClick?: (cellaId: string) => void;
  onMontanteDrag?: (id: string, newX: number) => void;
  onTraversoDrag?: (id: string, newY: number) => void;
  svgRef?: React.RefObject<SVGSVGElement>;
  dragging?: { id: string; type: "m"|"t" } | null;
  setDragging?: (v: any) => void;
}

// Simbolo apertura anta battente
function SymAntaBattente({ x, y, w, h, verso, stroke }: any) {
  const cx = x + w/2; const cy = y + h/2;
  if (verso === "sx") {
    return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="20 8" opacity="0.7">
      <line x1={x} y1={y+h} x2={x+w} y2={y+h/2} />
      <line x1={x} y1={y} x2={x+w} y2={y+h/2} />
    </g>;
  }
  return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="20 8" opacity="0.7">
    <line x1={x+w} y1={y+h} x2={x} y2={y+h/2} />
    <line x1={x+w} y1={y} x2={x} y2={y+h/2} />
  </g>;
}

// Simbolo wasistas
function SymWasistas({ x, y, w, h, stroke }: any) {
  return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="20 8" opacity="0.7">
    <line x1={x} y1={y} x2={x+w/2} y2={y+h} />
    <line x1={x+w} y1={y} x2={x+w/2} y2={y+h} />
  </g>;
}

// Simbolo scorrevole
function SymScorevole({ x, y, w, h, stroke }: any) {
  return <g stroke={stroke} strokeWidth="2" fill="none" opacity="0.7">
    <line x1={x+10} y1={y+h/2} x2={x+w-10} y2={y+h/2} />
    <polyline points={`${x+w*0.6},${y+h/2-20} ${x+w-10},${y+h/2} ${x+w*0.6},${y+h/2+20}`} />
  </g>;
}

// Maniglia
function Maniglia({ x, y, w, h, verso }: any) {
  const mx = verso === "sx" ? x + w - 30 : x + 30;
  return <g fill={DARK} opacity="0.6">
    <rect x={mx-4} y={y+h/2-20} width={8} height={40} rx={3} />
    <rect x={mx-12} y={y+h/2-4} width={24} height={8} rx={3} />
  </g>;
}

// Cerniere
function Cerniere({ x, y, h, nCerniere, verso }: any) {
  const cx = verso === "dx" ? x + 8 : x - 8;
  const positions = nCerniere === 2
    ? [y + h*0.2, y + h*0.8]
    : [y + h*0.15, y + h*0.5, y + h*0.85];
  return <g fill={DARK} opacity="0.5">
    {positions.map((py, i) => (
      <rect key={i} x={cx-4} y={py-8} width={8} height={16} rx={2} />
    ))}
  </g>;
}

export function RendererSVG({ infisso, width="90%", height="90%", onCellaClick, onMontanteDrag, onTraversoDrag, svgRef, dragging, setDragging }: Props) {
  const { larghezzaVano: L, altezzaVano: H, sistema, montanti, traversi, griglia } = infisso;
  const sp = sistema.spessoreTelaio;
  const isMkt = infisso._mode === "marketing";
  const stroke = isMkt ? AMBER : DARK;
  const strokeW = isMkt ? 5 : 2;

  return (
    <svg ref={svgRef} width={width} height={height}
      viewBox={`-220 -280 ${L+440} ${H+560}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display:"block" }}>

      <defs>
        <marker id="arr-cad" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill={stroke}/>
        </marker>
        {/* Pattern vetro */}
        <pattern id="vetro-hatch" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0,40 L40,0" stroke="rgba(100,160,200,0.15)" strokeWidth="1"/>
        </pattern>
      </defs>

      {/* ── TELAIO ESTERNO ── */}
      <rect x={0} y={0} width={L} height={H} fill={isMkt?"#0a0a0a":"#E8E8E8"} stroke={stroke} strokeWidth={strokeW}/>
      {/* Smussi angolo */}
      <line x1={0} y1={0} x2={sp} y2={sp} stroke={stroke} strokeWidth={strokeW-1}/>
      <line x1={L} y1={0} x2={L-sp} y2={sp} stroke={stroke} strokeWidth={strokeW-1}/>
      <line x1={0} y1={H} x2={sp} y2={H-sp} stroke={stroke} strokeWidth={strokeW-1}/>
      <line x1={L} y1={H} x2={L-sp} y2={H-sp} stroke={stroke} strokeWidth={strokeW-1}/>

      {/* ── MONTANTI INTERNI ── */}
      {montanti.map(m => (
        <rect key={m.id}
          x={m.xMm - sp/2} y={sp} width={sp} height={H - sp*2}
          fill={isMkt?AMBER:"#B0B0B0"} stroke={stroke} strokeWidth={1}
          style={{ cursor:"ew-resize" }}
          onMouseDown={() => setDragging?.({ id: m.id, type:"m" })}
        />
      ))}

      {/* ── TRAVERSI INTERNI ── */}
      {traversi.map(t => (
        <rect key={t.id}
          x={sp} y={t.yMm - sp/2} width={L - sp*2} height={sp}
          fill={isMkt?AMBER:"#B0B0B0"} stroke={stroke} strokeWidth={1}
          style={{ cursor:"ns-resize" }}
          onMouseDown={() => setDragging?.({ id: t.id, type:"t" })}
        />
      ))}

      {/* ── CELLE ── */}
      {griglia.celle.map(c => {
        const gx = griglia.xPunti[c.colIdx] + (c.colIdx > 0 ? sp/2 : 0);
        const gy = griglia.yPunti[c.rowIdx] + (c.rowIdx > 0 ? sp/2 : 0);
        const gw = c.larghezzaNetta;
        const gh = c.altezzaNetta;
        const isSelected = infisso._cellaSel === c.id;

        return (
          <g key={c.id} style={{ cursor:"pointer" }} onClick={() => onCellaClick?.(c.id)}>
            {/* Sfondo vetro */}
            <rect x={gx} y={gy} width={gw} height={gh}
              fill={c.riempimento==="vetro" ? "url(#vetro-hatch)" : "#808080"}
              stroke={isSelected ? AMBER : stroke}
              strokeWidth={isSelected ? 4 : 1}
              strokeOpacity={isSelected ? 1 : 0.3}
            />
            {/* Luce vetro */}
            {c.riempimento==="vetro" && (
              <rect x={gx+4} y={gy+4} width={gw-8} height={gh-8}
                fill={VETRO_FILL} stroke="none"/>
            )}

            {/* Simbolo apertura */}
            {c.tipo==="anta_battente" && <SymAntaBattente x={gx} y={gy} w={gw} h={gh} verso={c.verso} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="wasistas" && <SymWasistas x={gx} y={gy} w={gw} h={gh} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="anta_ribalta" && <SymAntaBattente x={gx} y={gy} w={gw} h={gh} verso="sx" stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="scorrevole" && <SymScorevole x={gx} y={gy} w={gw} h={gh} stroke={isMkt?AMBER:DARK}/>}

            {/* Maniglia */}
            {(c.tipo==="anta_battente"||c.tipo==="anta_ribalta"||c.tipo==="porta") && c.ferramenta.maniglia && (
              <Maniglia x={gx} y={gy} w={gw} h={gh} verso={c.verso}/>
            )}

            {/* Cerniere */}
            {(c.tipo==="anta_battente"||c.tipo==="porta") && (
              <Cerniere x={gx} y={gy} h={gh} nCerniere={c.ferramenta.nCerniere} verso={c.verso}/>
            )}

            {/* Quote interne cella */}
            {!isMkt && (
              <g opacity="0.5">
                <text x={gx+gw/2} y={gy+gh/2-10} textAnchor="middle" fontSize="26" fill={DARK} fontFamily="JetBrains Mono,monospace">{c.larghezzaNetta}</text>
                <text x={gx+gw/2} y={gy+gh/2+30} textAnchor="middle" fontSize="22" fill={TEAL} fontFamily="JetBrains Mono,monospace">×{c.altezzaNetta}</text>
                <text x={gx+gw/2} y={gy+gh/2+70} textAnchor="middle" fontSize="18" fill={DARK} fontFamily="JetBrains Mono,monospace">{c.tipo.replace("_"," ")}</text>
              </g>
            )}

            {/* Highlight selezione */}
            {isSelected && <rect x={gx} y={gy} width={gw} height={gh} fill={AMBER} fillOpacity="0.08" stroke="none"/>}
          </g>
        );
      })}

      {/* ── QUOTE ESTERNE ── */}
      {/* Larghezza */}
      <g style={{ cursor:"pointer" }}>
        <text x={L/2} y={-160} textAnchor="middle" fontSize="160" fontWeight="900"
          fill={stroke} fontFamily="JetBrains Mono,monospace">{L} mm</text>
        <path d={`M 0 -110 H ${L}`} stroke={stroke} strokeWidth="8"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      </g>
      {/* Altezza */}
      <g style={{ cursor:"pointer" }}>
        <text x={-210} y={H/2} textAnchor="middle" fontSize="160" fontWeight="900"
          fill={stroke} fontFamily="JetBrains Mono,monospace"
          transform={`rotate(-90,-210,${H/2})`}>{H} mm</text>
        <path d={`M -150 0 V ${H}`} stroke={stroke} strokeWidth="8"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      </g>

      {/* Quote montanti */}
      {montanti.map((m, i) => (
        <text key={m.id} x={m.xMm} y={H+60} textAnchor="middle" fontSize="22"
          fill={AMBER} fontFamily="JetBrains Mono,monospace" opacity="0.8">{m.xMm}</text>
      ))}
      {traversi.map((t, i) => (
        <text key={t.id} x={L+60} y={t.yMm} textAnchor="start" fontSize="22"
          fill={AMBER} fontFamily="JetBrains Mono,monospace" dominantBaseline="middle" opacity="0.8">{t.yMm}</text>
      ))}
    </svg>
  );
}
