// lib/ferro/renderers/frontale-mono.ts
import type { FerroConfig } from "../types";
import { el, COLORS, dim, ground, callout, pendBadge, makeClickable } from "./helpers";

export function drawFrontaleMono(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { larghezza: W, hgronda: Hg, hcolmo: Hc } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const scale = Math.min((VBW - 200) / W, (VBH - 200) / Hc);
  const cx = VBW / 2, baseY = VBH - 90;
  const half = (W * scale) / 2;
  const yG = baseY - Hg * scale, yC = baseY - Hc * scale;
  const xL = cx - half, xR = cx + half;

  ground(svg, xL, xR, baseY);

  // Trave inclinata
  const traveTh = 8;
  const ang = Math.atan2(yC - yG, xR - xL);
  const dx = Math.sin(ang) * traveTh, dy = Math.cos(ang) * traveTh;
  const pts = [[xL, yG - dy], [xR, yC - dy], [xR + dx, yC - dy + traveTh], [xL + dx, yG - dy + traveTh]].map((p) => p.join(",")).join(" ");
  svg.appendChild(makeClickable(el("polygon", { points: pts, fill: COLORS.trave, stroke: "#1F4F36", "stroke-width": "0.8" }), "T01", selectedId, onSelect));

  // Pilastri
  const pilW = 11;
  svg.appendChild(makeClickable(el("rect", { x: xL - pilW / 2, y: yG, width: pilW, height: Hg * scale, fill: COLORS.pilastro, stroke: "#243F60" }), "P01", selectedId, onSelect));
  svg.appendChild(makeClickable(el("rect", { x: xR - pilW / 2, y: yC, width: pilW, height: Hc * scale, fill: COLORS.pilastro, stroke: "#243F60" }), "P02", selectedId, onSelect));

  // Piastre base
  const platW = 28;
  [xL, xR].forEach((x) => {
    svg.appendChild(makeClickable(el("rect", { x: x - platW / 2, y: baseY - 3, width: platW, height: 6, fill: COLORS.piastra, stroke: "#0D1F1F" }), "PB01", selectedId, onSelect));
    [-platW / 4, platW / 4].forEach((d) => {
      svg.appendChild(el("circle", { cx: x + d, cy: baseY, r: "1.3", fill: "white", stroke: "#0D1F1F", "stroke-width": "0.4" }));
    });
  });

  // Callout A B C
  callout(svg, xL - 14, baseY - 4, "A");
  callout(svg, xR + 18, yC + 4, "B");
  callout(svg, (xL + xR) / 2, yG + 10, "C");

  // Quote
  dim(svg, { x1: xL, y1: baseY, x2: xR, y2: baseY, offset: 30, label: W + " mm" });
  dim(svg, { x1: xL, y1: yG, x2: xL, y2: baseY, offset: -45, label: Hg + " mm" });
  dim(svg, { x1: xR, y1: yC, x2: xR, y2: baseY, offset: 45, label: Hc + " mm" });

  pendBadge(svg, (xL + xR) / 2, (yG + yC) / 2 - 24, Math.round((Hc - Hg) / W * 100), (Math.atan2(Hc - Hg, W) * 180 / Math.PI).toFixed(1));
}
