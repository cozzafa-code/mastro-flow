"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — RENDERER SVG TECNICO v2.0
// Aggiunto: fermavetro, riporto, maniglia reale, cerniere reali,
//           quote interne celle, anta-ribalta corretta, scorrevole
// ═══════════════════════════════════════════════════════════════
import React from "react";
import type { Infisso } from "./types_cad";

const AMBER = "#D08008"; const DARK = "#1A1A1C"; const TEAL = "#1A9E73";
const GRIGIO_PROFILO = "#9CA3AF";
const GRIGIO_TELAIO  = "#6B7280";
const VETRO_FILL     = "rgba(186,214,232,0.30)";
const VETRO_STROKE   = "rgba(100,160,200,0.5)";
const FERMAVETRO_COL = "#4B5563";
const FM = "JetBrains Mono,monospace";

// ── COMPONENTI SIMBOLI APERTURA ────────────────────────────────

// Anta battente: linee tratteggiate dal cardine al centro anta
function SymAntaBattente({ x, y, w, h, verso, stroke }: any) {
  // Cardine a sx = apertura verso dx (anta sx dal punto di vista frontale)
  if (verso === "sx") {
    return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="18 7" opacity="0.65">
      <line x1={x} y1={y} x2={x+w} y2={y+h/2}/>
      <line x1={x} y1={y+h} x2={x+w} y2={y+h/2}/>
      <line x1={x+w} y1={y} x2={x+w} y2={y+h}/>
    </g>;
  }
  return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="18 7" opacity="0.65">
    <line x1={x+w} y1={y} x2={x} y2={y+h/2}/>
    <line x1={x+w} y1={y+h} x2={x} y2={y+h/2}/>
    <line x1={x} y1={y} x2={x} y2={y+h}/>
  </g>;
}

// Anta-ribalta: battente + wasistas combinato
function SymAntaRibalta({ x, y, w, h, verso, stroke }: any) {
  return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="18 7" opacity="0.65">
    {/* Battente */}
    {verso==="sx"
      ? <><line x1={x} y1={y} x2={x+w} y2={y+h/2}/><line x1={x} y1={y+h} x2={x+w} y2={y+h/2}/></>
      : <><line x1={x+w} y1={y} x2={x} y2={y+h/2}/><line x1={x+w} y1={y+h} x2={x} y2={y+h/2}/></>
    }
    {/* Ribalta in basso */}
    <line x1={x} y1={y+h} x2={x+w/2} y2={y+h*0.7}/>
    <line x1={x+w} y1={y+h} x2={x+w/2} y2={y+h*0.7}/>
  </g>;
}

// Wasistas: apertura in alto verso interno
function SymWasistas({ x, y, w, h, stroke }: any) {
  return <g stroke={stroke} strokeWidth="1.5" fill="none" strokeDasharray="18 7" opacity="0.65">
    <line x1={x} y1={y} x2={x+w/2} y2={y+h*0.6}/>
    <line x1={x+w} y1={y} x2={x+w/2} y2={y+h*0.6}/>
    <line x1={x} y1={y} x2={x+w} y2={y}/>
  </g>;
}

// Scorrevole: freccia bidirezionale con anta sovrapposta
function SymScorevole({ x, y, w, h, stroke }: any) {
  const mid = y + h/2;
  const aw = w * 0.4; // larghezza anta mobile
  return <g stroke={stroke} fill="none" opacity="0.75">
    {/* Anta mobile (tratteggiata) */}
    <rect x={x + w*0.1} y={y+4} width={aw} height={h-8} strokeDasharray="12 5" strokeWidth="1.5"/>
    {/* Freccia spostamento */}
    <line x1={x+10} y1={mid} x2={x+w-10} y2={mid} strokeWidth="2"/>
    <polyline points={`${x+25},${mid-15} ${x+10},${mid} ${x+25},${mid+15}`} strokeWidth="2"/>
    <polyline points={`${x+w-25},${mid-15} ${x+w-10},${mid} ${x+w-25},${mid+15}`} strokeWidth="2"/>
  </g>;
}

// Porta: soglia + apertura 90°
function SymPorta({ x, y, w, h, verso, stroke }: any) {
  // Soglia
  const arcR = w * 0.9;
  const sx = verso==="sx" ? x : x+w;
  const ex = verso==="sx" ? x+w : x;
  const sweep = verso==="sx" ? 1 : 0;
  return <g stroke={stroke} fill="none" opacity="0.7">
    {/* Soglia */}
    <line x1={x} y1={y+h} x2={x+w} y2={y+h} strokeWidth="3"/>
    {/* Arco apertura */}
    <path d={`M ${sx} ${y+h} A ${arcR} ${arcR} 0 0 ${sweep} ${ex} ${y+h-arcR}`}
      strokeWidth="1.5" strokeDasharray="15 6"/>
    {/* Anta aperta */}
    <line x1={sx} y1={y+h} x2={sx} y2={y} strokeWidth="2"/>
  </g>;
}

// Pannello cieco: tratteggio diagonale
function SymPannelloCieco({ x, y, w, h, stroke }: any) {
  return <g stroke={stroke} strokeWidth="1" opacity="0.3">
    <line x1={x} y1={y} x2={x+w} y2={y+h}/>
    <line x1={x+w} y1={y} x2={x} y2={y+h}/>
  </g>;
}

// ── FERMAVETRO ────────────────────────────────────────────────
// Profilo sottile intorno alla luce vetro, su tutti i lati
function Fermavetro({ x, y, w, h, sp }: any) {
  const fv = Math.max(6, sp * 0.15); // spessore fermavetro proporzionale
  return <g fill={FERMAVETRO_COL} opacity="0.55">
    <rect x={x}        y={y}        width={fv} height={h}/>   {/* sx */}
    <rect x={x+w-fv}   y={y}        width={fv} height={h}/>   {/* dx */}
    <rect x={x}        y={y}        width={w}  height={fv}/>   {/* top */}
    <rect x={x}        y={y+h-fv}   width={w}  height={fv}/>   {/* bottom */}
  </g>;
}

// ── RIPORTO (battuta profilo anta) ────────────────────────────
// Linea interna che separa telaio fisso da profilo anta mobile
function Riporto({ x, y, w, h, sp, tipo }: any) {
  if (tipo==="fisso"||tipo==="pannello_cieco") return null;
  const rp = Math.max(4, sp * 0.12);
  return <g stroke={GRIGIO_PROFILO} strokeWidth="1" fill="none" opacity="0.6" strokeDasharray="6 3">
    <rect x={x+rp} y={y+rp} width={w-rp*2} height={h-rp*2}/>
  </g>;
}

// ── MANIGLIA REALE ────────────────────────────────────────────
function Maniglia({ x, y, w, h, verso, tipo }: any) {
  if (tipo==="fisso"||tipo==="pannello_cieco"||tipo==="wasistas") return null;
  const isManiglione = tipo==="porta";
  // Posizione: opposta al cardine
  const mx = verso==="sx" ? x + w - 35 : x + 35;
  const cy = y + h/2;
  const brLen = isManiglione ? 120 : 60; // lunghezza barra
  const stLen = 18; // lunghezza stelo

  return <g fill={DARK} stroke={DARK} opacity="0.75">
    {/* Stelo */}
    <line x1={mx} y1={cy-brLen/2} x2={mx} y2={cy+brLen/2} strokeWidth="6"/>
    {/* Impugnatura */}
    <line x1={mx} y1={cy} x2={mx+(verso==="sx"?-stLen:stLen)} y2={cy} strokeWidth="8"/>
    {/* Rosetta */}
    <circle cx={mx} cy={cy-brLen/2+15} r={8} fill={GRIGIO_PROFILO} stroke={DARK} strokeWidth="1.5"/>
    <circle cx={mx} cy={cy+brLen/2-15} r={8} fill={GRIGIO_PROFILO} stroke={DARK} strokeWidth="1.5"/>
  </g>;
}

// ── CERNIERE REALI ────────────────────────────────────────────
function Cerniere({ x, y, w, h, nCerniere, verso, tipo }: any) {
  if (tipo==="fisso"||tipo==="pannello_cieco"||tipo==="wasistas"||tipo==="scorrevole") return null;
  // Cerniere sul lato del cardine
  const cx = verso==="sx" ? x + 6 : x + w - 6;
  const pos = nCerniere===3
    ? [y+h*0.15, y+h*0.5, y+h*0.85]
    : [y+h*0.2, y+h*0.8];

  return <g fill={GRIGIO_PROFILO} stroke={DARK} strokeWidth="1" opacity="0.8">
    {pos.map((py, i) => (
      <g key={i}>
        {/* Corpo cerniera */}
        <rect x={cx-7} y={py-14} width={14} height={28} rx={2}/>
        {/* Perno centrale */}
        <circle cx={cx} cy={py} r={3} fill={DARK}/>
        {/* Alette */}
        <rect x={verso==="sx"?cx-14:cx} y={py-8} width={14} height={16} rx={1} opacity="0.6"/>
      </g>
    ))}
  </g>;
}

// ── QUOTE INTERNE CELLA ───────────────────────────────────────
function QuoteCella({ x, y, w, h, cella, isMkt }: any) {
  if (isMkt) return null;
  const fs = Math.min(28, Math.max(14, w/12));
  return <g opacity="0.45" fontFamily={FM}>
    {/* L x H */}
    <text x={x+w/2} y={y+h/2-fs*0.6} textAnchor="middle" fontSize={fs} fontWeight="700" fill={DARK}>
      {cella.larghezzaNetta}
    </text>
    <text x={x+w/2} y={y+h/2+fs*0.8} textAnchor="middle" fontSize={fs*0.85} fill={TEAL}>
      ×{cella.altezzaNetta}
    </text>
    {/* Tipo */}
    <text x={x+w/2} y={y+h/2+fs*2.2} textAnchor="middle" fontSize={fs*0.65} fill={DARK}>
      {cella.tipo.replace(/_/g," ")}
    </text>
    {/* Area */}
    <text x={x+w/2} y={y+h/2+fs*3.2} textAnchor="middle" fontSize={fs*0.6} fill={GRIGIO_TELAIO}>
      {cella.areaMq.toFixed(2)} m²
    </text>
  </g>;
}

// ── QUOTE INTERNE MONTANTI/TRAVERSI ───────────────────────────
function QuoteStruttura({ griglia, xPunti, yPunti, sp, stroke }: any) {
  const linee = [];
  // Quote larghezze colonne (sotto il telaio)
  for (let i = 0; i < xPunti.length-1; i++) {
    const x0 = xPunti[i] + (i>0?sp/2:0);
    const x1 = xPunti[i+1] - (i<xPunti.length-2?sp/2:0);
    const mid = (x0+x1)/2;
    const w = x1-x0;
    linee.push(
      <g key={`qx${i}`} opacity="0.6">
        <path d={`M ${x0} -40 H ${x1}`} stroke={stroke} strokeWidth="3"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
        <text x={mid} y={-55} textAnchor="middle" fontSize="20" fill={stroke} fontFamily={FM}>{Math.round(w)}</text>
      </g>
    );
  }
  // Quote altezze righe (a dx del telaio)
  const L = xPunti[xPunti.length-1];
  for (let i = 0; i < yPunti.length-1; i++) {
    const y0 = yPunti[i] + (i>0?sp/2:0);
    const y1 = yPunti[i+1] - (i<yPunti.length-2?sp/2:0);
    const mid = (y0+y1)/2;
    const h = y1-y0;
    linee.push(
      <g key={`qy${i}`} opacity="0.6">
        <path d={`M ${L+40} ${y0} V ${y1}`} stroke={stroke} strokeWidth="3"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
        <text x={L+65} y={mid+8} textAnchor="start" fontSize="20" fill={stroke} fontFamily={FM}>{Math.round(h)}</text>
      </g>
    );
  }
  return <>{linee}</>;
}

// ════════════════════════════════════════════════════════════════
// RENDERER PRINCIPALE
// ════════════════════════════════════════════════════════════════
export function RendererSVG({ infisso, width="90%", height="90%", onCellaClick, svgRef, setDragging }: any) {
  const { larghezzaVano: L, altezzaVano: H, sistema, montanti, traversi, griglia } = infisso;
  const sp = sistema.spessoreTelaio;
  const isMkt = infisso._mode === "marketing";
  const stroke = isMkt ? AMBER : DARK;
  const strokeW = isMkt ? 5 : 2.5;
  const telaioFill = isMkt ? "#111" : "#D1D5DB";

  return (
    <svg ref={svgRef} width={width} height={height}
      viewBox={`-240 -300 ${L+480} ${H+600}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display:"block" }}>

      <defs>
        <marker id="arr-cad" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={stroke}/>
        </marker>
        <pattern id="vetro-hatch" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M0,50 L50,0" stroke="rgba(100,160,200,0.12)" strokeWidth="1"/>
          <path d="M-10,10 L10,-10" stroke="rgba(100,160,200,0.12)" strokeWidth="1"/>
          <path d="M40,60 L60,40" stroke="rgba(100,160,200,0.12)" strokeWidth="1"/>
        </pattern>
        <pattern id="pannello-hatch" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M0,0 L30,30 M30,0 L0,30" stroke="rgba(80,80,80,0.2)" strokeWidth="1"/>
        </pattern>
      </defs>

      {/* ── TELAIO ESTERNO ── */}
      {/* Fondo profilo */}
      <rect x={0} y={0} width={L} height={H} fill={telaioFill} stroke={stroke} strokeWidth={strokeW}/>
      {/* Luce interna */}
      <rect x={sp} y={sp} width={L-sp*2} height={H-sp*2} fill="none" stroke={stroke} strokeWidth={strokeW*0.6} opacity="0.4"/>
      {/* Smussi angoli */}
      {[[0,0,sp,sp],[L,0,L-sp,sp],[0,H,sp,H-sp],[L,H,L-sp,H-sp]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeW*0.7}/>
      ))}

      {/* ── MONTANTI INTERNI ── */}
      {montanti.map(m => (
        <g key={m.id}>
          <rect x={m.xMm-sp/2} y={sp} width={sp} height={H-sp*2}
            fill={isMkt?AMBER:GRIGIO_PROFILO} stroke={stroke} strokeWidth={1}
            style={{cursor:"ew-resize"}}
            onMouseDown={()=>setDragging?.({id:m.id,type:"m"})}/>
          {/* Linea asse montante */}
          <line x1={m.xMm} y1={sp} x2={m.xMm} y2={H-sp}
            stroke={isMkt?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)"} strokeWidth="1" strokeDasharray="4 4"/>
        </g>
      ))}

      {/* ── TRAVERSI INTERNI ── */}
      {traversi.map(t => (
        <g key={t.id}>
          <rect x={sp} y={t.yMm-sp/2} width={L-sp*2} height={sp}
            fill={isMkt?AMBER:GRIGIO_PROFILO} stroke={stroke} strokeWidth={1}
            style={{cursor:"ns-resize"}}
            onMouseDown={()=>setDragging?.({id:t.id,type:"t"})}/>
          <line x1={sp} y1={t.yMm} x2={L-sp} y2={t.yMm}
            stroke={isMkt?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)"} strokeWidth="1" strokeDasharray="4 4"/>
        </g>
      ))}

      {/* ── CELLE ── */}
      {griglia.celle.map(c => {
        const gx = griglia.xPunti[c.colIdx] + (c.colIdx>0 ? sp/2 : 0);
        const gy = griglia.yPunti[c.rowIdx] + (c.rowIdx>0 ? sp/2 : 0);
        const gw = c.larghezzaNetta;
        const gh = c.altezzaNetta;
        const isSel = infisso._cellaSel === c.id;

        return (
          <g key={c.id} style={{cursor:"pointer"}} onClick={()=>onCellaClick?.(c.id)}>
            {/* Fondo cella */}
            <rect x={gx} y={gy} width={gw} height={gh}
              fill={c.riempimento==="pannello"?"url(#pannello-hatch)":"url(#vetro-hatch)"}
              stroke={isSel?AMBER:stroke} strokeWidth={isSel?4:1} strokeOpacity={isSel?1:0.35}/>

            {/* Luce vetro interna */}
            {c.riempimento==="vetro" && (
              <rect x={gx+sp*0.3} y={gy+sp*0.3} width={gw-sp*0.6} height={gh-sp*0.6}
                fill={VETRO_FILL} stroke={VETRO_STROKE} strokeWidth="1"/>
            )}

            {/* Fermavetro */}
            {c.riempimento==="vetro" && !isMkt && (
              <Fermavetro x={gx+sp*0.3} y={gy+sp*0.3} w={gw-sp*0.6} h={gh-sp*0.6} sp={sp}/>
            )}

            {/* Riporto (profilo anta) */}
            <Riporto x={gx} y={gy} w={gw} h={gh} sp={sp} tipo={c.tipo}/>

            {/* Simboli apertura */}
            {c.tipo==="anta_battente" && <SymAntaBattente x={gx} y={gy} w={gw} h={gh} verso={c.verso} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="anta_ribalta"  && <SymAntaRibalta  x={gx} y={gy} w={gw} h={gh} verso={c.verso} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="wasistas"      && <SymWasistas      x={gx} y={gy} w={gw} h={gh} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="scorrevole"    && <SymScorevole     x={gx} y={gy} w={gw} h={gh} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="porta"         && <SymPorta         x={gx} y={gy} w={gw} h={gh} verso={c.verso} stroke={isMkt?AMBER:DARK}/>}
            {c.tipo==="pannello_cieco"&& <SymPannelloCieco x={gx} y={gy} w={gw} h={gh} stroke={isMkt?AMBER:DARK}/>}

            {/* Maniglia */}
            <Maniglia x={gx} y={gy} w={gw} h={gh} verso={c.verso} tipo={c.tipo}/>

            {/* Cerniere */}
            <Cerniere x={gx} y={gy} w={gw} h={gh}
              nCerniere={c.ferramenta?.nCerniere||2} verso={c.verso} tipo={c.tipo}/>

            {/* Quote interne */}
            <QuoteCella x={gx} y={gy} w={gw} h={gh} cella={c} isMkt={isMkt}/>

            {/* Highlight selezione */}
            {isSel && <rect x={gx} y={gy} width={gw} height={gh} fill={AMBER} fillOpacity="0.07" stroke="none"/>}
          </g>
        );
      })}

      {/* ── QUOTE STRUTTURA (colonne e righe) ── */}
      {!isMkt && (
        <QuoteStruttura
          griglia={griglia}
          xPunti={griglia.xPunti}
          yPunti={griglia.yPunti}
          sp={sp}
          stroke={AMBER}
        />
      )}

      {/* ── QUOTE ESTERNE PRINCIPALI ── */}
      {/* Larghezza totale */}
      <g>
        <text x={L/2} y={-170} textAnchor="middle" fontSize="155" fontWeight="900"
          fill={stroke} fontFamily={FM}>{L} mm</text>
        <path d={`M 0 -120 H ${L}`} stroke={stroke} strokeWidth="7"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      </g>
      {/* Altezza totale */}
      <g>
        <text x={-215} y={H/2} textAnchor="middle" fontSize="155" fontWeight="900"
          fill={stroke} fontFamily={FM} transform={`rotate(-90,-215,${H/2})`}>{H} mm</text>
        <path d={`M -155 0 V ${H}`} stroke={stroke} strokeWidth="7"
          markerStart="url(#arr-cad)" markerEnd="url(#arr-cad)"/>
      </g>
    </svg>
  );
}
