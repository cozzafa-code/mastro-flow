// lib/ferro/renderers/frontale-capannone.ts
import type { FerroConfig } from "../types";
import { el, COLORS, dim, ground, callout, pendBadge, makeClickable } from "./helpers";

export function drawFrontaleCapannone(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { larghezza: W, hgronda: Hg, hcolmo: Hc } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const scale = Math.min((VBW - 200) / W, (VBH - 200) / Hc);
  const cx = VBW / 2, baseY = VBH - 90;
  const half = (W * scale) / 2;
  const yG = baseY - Hg * scale, yC = baseY - Hc * scale;
  const xL = cx - half, xR = cx + half;

  ground(svg, xL, xR, baseY);
  svg.appendChild(el("polyline", { points: (xL - 12) + "," + (yG - 3) + " " + cx + "," + (yC - 3) + " " + (xR + 12) + "," + (yG - 3), fill: "none", stroke: COLORS.copertura, "stroke-width": "7", opacity: "0.4" }));

  const drawF = (x1: number, x2: number, y1: number, y2: number, id: string): SVGElement => {
    const tT = 9;
    const a = Math.atan2(y2 - y1, x2 - x1);
    const dxL = Math.sin(a) * tT, dyL = Math.cos(a) * tT;
    const pts = [[x1, y1 - dyL], [x2, y2 - dyL], [x2 + dxL, y2 - dyL + tT], [x1 + dxL, y1 - dyL + tT]].map((p) => p.join(",")).join(" ");
    return makeClickable(el("polygon", { points: pts, fill: COLORS.trave, stroke: "#1F4F36" }), id, selectedId, onSelect);
  };
  svg.appendChild(drawF(xL, cx, yG, yC, "T01"));
  svg.appendChild(drawF(cx, xR, yC, yG, "T01"));

  svg.appendChild(makeClickable(el("rect", { x: xL, y: yG - 3, width: xR - xL, height: 5, fill: COLORS.traverso, stroke: "#7A2A2A" }), "T02", selectedId, onSelect));
  svg.appendChild(el("line", { x1: xL + 4, y1: yG, x2: cx, y2: yC + 2, stroke: "#999", "stroke-width": "0.8", "stroke-dasharray": "3,2" }));
  svg.appendChild(el("line", { x1: xR - 4, y1: yG, x2: cx, y2: yC + 2, stroke: "#999", "stroke-width": "0.8", "stroke-dasharray": "3,2" }));

  const pilW = 14;
  [xL, xR].forEach((x) => {
    svg.appendChild(makeClickable(el("rect", { x: x - pilW / 2, y: yG, width: pilW, height: Hg * scale, fill: COLORS.pilastro, stroke: "#243F60" }), "P01", selectedId, onSelect));
    svg.appendChild(makeClickable(el("rect", { x: x - 18, y: baseY - 4, width: 36, height: 8, fill: COLORS.piastra, stroke: "#0D1F1F" }), "PB01", selectedId, onSelect));
  });

  callout(svg, xL - 14, baseY - 4, "A");
  callout(svg, cx + 14, yC - 14, "B");
  callout(svg, xL + 24, yG + 4, "C");

  dim(svg, { x1: xL, y1: baseY, x2: xR, y2: baseY, offset: 35, label: W + " mm" });
  dim(svg, { x1: xL, y1: yG, x2: xL, y2: baseY, offset: -50, label: Hg + " mm" });
  dim(svg, { x1: cx, y1: yC, x2: cx, y2: baseY, offset: 70, label: "Hc " + Hc });

  const halfW = W / 2;
  pendBadge(svg, (xL + cx) / 2, (yG + yC) / 2 - 26, Math.round((Hc - Hg) / halfW * 100), (Math.atan2(Hc - Hg, halfW) * 180 / Math.PI).toFixed(1));
}
