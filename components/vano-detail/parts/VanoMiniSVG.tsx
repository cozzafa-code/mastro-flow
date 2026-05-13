// ======================================================================
// MASTRO ERP - Vano Detail / VanoMiniSVG
// Estratto da components/VanoDetailPanel.tsx (refactor S2)
// ======================================================================

import React from "react";

export default function VanoMiniSVG({ type, stepColor }: { type: string; stepColor: string }) {
  const w = 60, h = 70;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <rect x={5} y={5} width={w-10} height={h-10} fill={stepColor + "12"} stroke={stepColor + "40"} strokeWidth={1.5} rx={3} />
      {type === "larghezze" && <>
        <line x1={10} y1={18} x2={w-10} y2={18} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={10} y1={h/2} x2={w-10} y2={h/2} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={10} y1={h-18} x2={w-10} y2={h-18} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
      </>}
      {type === "altezze" && <>
        <line x1={14} y1={10} x2={14} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={w/2} y1={10} x2={w/2} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={w-14} y1={10} x2={w-14} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
      </>}
      {type === "diagonali" && <>
        <line x1={10} y1={10} x2={w-10} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={w-10} y1={10} x2={10} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
      </>}
      {type === "spallette" && <>
        <rect x={2} y={5} width={10} height={h-10} fill={stepColor + "25"} stroke={stepColor+"60"} rx={1} />
        <rect x={w-12} y={5} width={10} height={h-10} fill={stepColor + "25"} stroke={stepColor+"60"} rx={1} />
        <rect x={5} y={2} width={w-10} height={8} fill={stepColor + "18"} stroke={stepColor+"40"} rx={1} />
      </>}
      {type === "davanzale" && <>
        <rect x={5} y={h-16} width={w-10} height={10} fill={stepColor + "25"} stroke={stepColor+"60"} rx={1} />
      </>}
    </svg>
  );
}
