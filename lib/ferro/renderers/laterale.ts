// lib/ferro/renderers/laterale.ts
import type { FerroConfig } from "../types";
import { el, COLORS, dim, ground, makeClickable } from "./helpers";

export function drawLaterale(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { lunghezza: L, hgronda: Hg, campate, arcarecci, tipo } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const scale = Math.min((VBW - 200) / L, (VBH - 220) / Hg);
  const cx = VBW / 2, baseY = VBH - 90;
  const halfL = (L * scale) / 2;
  const yG = baseY - Hg * scale;
  const xL = cx - halfL, xR = cx + halfL;
  const passo = (xR - xL) / campate;

  ground(svg, xL, xR, baseY);
  svg.appendChild(el("line", { x1: xL, y1: yG, x2: xR, y2: yG, stroke: COLORS.trave, "stroke-width": "5" }));

  const pilW = 10;
  for (let i = 0; i <= campate; i++) {
    const px = xL + i * passo;
    svg.appendChild(makeClickable(el("rect", { x: px - pilW / 2, y: yG, width: pilW, height: Hg * scale, fill: COLORS.pilastro, stroke: "#243F60" }), "P01", selectedId, onSelect));
    svg.appendChild(makeClickable(el("rect", { x: px - 12, y: baseY - 3, width: 24, height: 6, fill: COLORS.piastra, stroke: "#0D1F1F" }), "PB01", selectedId, onSelect));
  }

  for (let r = 0; r < arcarecci; r++) {
    const ay = yG - 14 - r * 5;
    svg.appendChild(makeClickable(el("line", { x1: xL - 8, y1: ay, x2: xR + 8, y2: ay, stroke: COLORS.arcareccio, "stroke-width": "2.5", "stroke-linecap": "round" }), "A01", selectedId, onSelect));
  }

  if (tipo !== "pergola" && campate >= 1) {
    svg.appendChild(makeClickable(el("line", { x1: xL + 4, y1: yG + 4, x2: xL + passo - 4, y2: baseY - 4, stroke: COLORS.controvento, "stroke-width": "1.5", "stroke-dasharray": "5,3" }), "C01", selectedId, onSelect));
    svg.appendChild(makeClickable(el("line", { x1: xL + passo - 4, y1: yG + 4, x2: xL + 4, y2: baseY - 4, stroke: COLORS.controvento, "stroke-width": "1.5", "stroke-dasharray": "5,3" }), "C01", selectedId, onSelect));
  }

  dim(svg, { x1: xL, y1: baseY, x2: xR, y2: baseY, offset: 50, label: L + " mm" });
  dim(svg, { x1: xL, y1: baseY, x2: xL + passo, y2: baseY, offset: 30, label: Math.round(L / campate) + " x " + campate });
  dim(svg, { x1: xL, y1: yG, x2: xL, y2: baseY, offset: -50, label: Hg + " mm" });
}
