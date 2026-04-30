// lib/ferro/renderers/frontale-pergola.ts
import type { FerroConfig } from "../types";
import { el, COLORS, dim, ground, callout, makeClickable } from "./helpers";

export function drawFrontalePergola(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { larghezza: W, hgronda: H, arcarecci: nArc } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const scale = Math.min((VBW - 200) / W, (VBH - 200) / H);
  const cx = VBW / 2, baseY = VBH - 90;
  const half = (W * scale) / 2;
  const yT = baseY - H * scale;
  const xL = cx - half, xR = cx + half;

  ground(svg, xL, xR, baseY);

  svg.appendChild(makeClickable(el("rect", { x: xL - 6, y: yT - 6, width: xR - xL + 12, height: 8, fill: COLORS.trave, stroke: "#1F4F36" }), "T02", selectedId, onSelect));

  for (let i = 0; i < nArc; i++) {
    const ax = xL + ((xR - xL) / Math.max(1, nArc - 1)) * i;
    svg.appendChild(makeClickable(el("rect", { x: ax - 2, y: yT - 12, width: 4, height: 6, fill: COLORS.arcareccio, stroke: "#5C2F1A" }), "A01", selectedId, onSelect));
  }

  const pilW = 9;
  [xL, xR].forEach((x) => {
    svg.appendChild(makeClickable(el("rect", { x: x - pilW / 2, y: yT, width: pilW, height: H * scale, fill: COLORS.pilastro, stroke: "#243F60" }), "P01", selectedId, onSelect));
    svg.appendChild(makeClickable(el("rect", { x: x - 11, y: baseY - 3, width: 22, height: 5, fill: COLORS.piastra, stroke: "#0D1F1F" }), "PB01", selectedId, onSelect));
  });

  callout(svg, xL - 14, baseY - 4, "A");
  callout(svg, xL + 22, yT + 4, "B");

  dim(svg, { x1: xL, y1: baseY, x2: xR, y2: baseY, offset: 30, label: W + " mm" });
  dim(svg, { x1: xL, y1: yT, x2: xL, y2: baseY, offset: -45, label: H + " mm" });
}
