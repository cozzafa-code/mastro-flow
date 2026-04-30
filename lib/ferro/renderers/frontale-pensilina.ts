// lib/ferro/renderers/frontale-pensilina.ts
import type { FerroConfig } from "../types";
import { el, COLORS, dim, ground, callout, makeClickable } from "./helpers";

export function drawFrontalePensilina(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { larghezza: sporg, hgronda: Hm, hcolmo: Hf } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const scale = Math.min((VBW - 300) / sporg, (VBH - 220) / Hm);
  const baseY = VBH - 90;
  const xMuro = 220;
  const xF = xMuro + sporg * scale;
  const yMuro = baseY - Hm * scale;
  const yF = baseY - Hf * scale;

  ground(svg, xMuro - 100, xF + 60, baseY);

  svg.appendChild(el("rect", { x: xMuro - 36, y: yMuro - 100, width: 36, height: baseY - yMuro + 100, fill: "#E5E3D8", stroke: "#888780" }));
  for (let i = 0; i < 7; i++) {
    svg.appendChild(el("line", { x1: xMuro - 36, y1: yMuro - 80 + i * 25, x2: xMuro, y2: yMuro - 80 + i * 25, stroke: "#B4B2A9", "stroke-width": "0.4" }));
  }

  const tT = 7;
  const a = Math.atan2(yF - yMuro, xF - xMuro);
  const dxL = Math.sin(a) * tT, dyL = Math.cos(a) * tT;
  const pts = [[xMuro, yMuro - dyL], [xF, yF - dyL], [xF + dxL, yF - dyL + tT], [xMuro + dxL, yMuro - dyL + tT]].map((p) => p.join(",")).join(" ");
  svg.appendChild(makeClickable(el("polygon", { points: pts, fill: COLORS.trave, stroke: "#1F4F36" }), "M01", selectedId, onSelect));

  const ytSup = yMuro - 80 * scale;
  svg.appendChild(makeClickable(el("line", { x1: xMuro, y1: ytSup, x2: xF, y2: yF, stroke: COLORS.controvento, "stroke-width": "4", "stroke-linecap": "round" }), "TR01", selectedId, onSelect));

  svg.appendChild(makeClickable(el("rect", { x: xMuro - 4, y: yMuro - 12, width: 14, height: 28, fill: COLORS.piastra, stroke: "#0D1F1F" }), "PB01", selectedId, onSelect));
  svg.appendChild(makeClickable(el("rect", { x: xMuro - 4, y: ytSup - 10, width: 14, height: 20, fill: COLORS.piastra, stroke: "#0D1F1F" }), "PB01", selectedId, onSelect));

  callout(svg, xMuro - 12, yMuro, "A");
  callout(svg, (xMuro + xF) / 2, yF + 14, "B");
  callout(svg, xMuro + 30, ytSup, "C");

  dim(svg, { x1: xMuro, y1: baseY, x2: xF, y2: baseY, offset: 30, label: "Sporg. " + sporg });
  dim(svg, { x1: xMuro, y1: yMuro, x2: xMuro, y2: baseY, offset: -45, label: "Hm " + Hm });
  dim(svg, { x1: xF, y1: yF, x2: xF, y2: baseY, offset: 45, label: "Hf " + Hf });
}
