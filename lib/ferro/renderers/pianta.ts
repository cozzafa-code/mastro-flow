// lib/ferro/renderers/pianta.ts
import type { FerroConfig } from "../types";
import { el, COLORS, dim, makeClickable } from "./helpers";

export function drawPianta(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { tipo, larghezza: W, lunghezza: L, campate, arcarecci } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const scale = Math.min((VBW - 200) / L, (VBH - 240) / W);
  const cx = VBW / 2, cy = VBH / 2 + 5;
  const halfL = (L * scale) / 2, halfW = (W * scale) / 2;
  const xL = cx - halfL, xR = cx + halfL;
  const yT = cy - halfW, yB = cy + halfW;
  const passo = (xR - xL) / campate;
  const arcN = (tipo === "doppia" || tipo === "capannone") ? arcarecci * 2 : arcarecci;
  const passoArc = (yB - yT) / Math.max(1, arcN - 1);

  svg.appendChild(el("rect", { x: xL, y: yT, width: xR - xL, height: yB - yT, fill: "rgba(180,178,169,0.08)", stroke: COLORS.copertura, "stroke-width": "0.8", "stroke-dasharray": "6,3" }));

  if (tipo === "doppia" || tipo === "capannone") {
    svg.appendChild(el("line", { x1: xL, y1: cy, x2: xR, y2: cy, stroke: "#0D1F1F", "stroke-width": "0.8", "stroke-dasharray": "4,2" }));
  }

  for (let r = 0; r < arcN; r++) {
    const ay = yT + r * passoArc;
    svg.appendChild(makeClickable(el("line", { x1: xL, y1: ay, x2: xR, y2: ay, stroke: COLORS.arcareccio, "stroke-width": "1.8" }), "A01", selectedId, onSelect));
  }
  for (let i = 0; i <= campate; i++) {
    const px = xL + i * passo;
    svg.appendChild(makeClickable(el("line", { x1: px, y1: yT - 4, x2: px, y2: yB + 4, stroke: COLORS.trave, "stroke-width": "4" }), "T01", selectedId, onSelect));
  }
  const pilSize = 9;
  const filari = (tipo === "pensilina") ? 1 : 2;
  for (let i = 0; i <= campate; i++) {
    const px = xL + i * passo;
    svg.appendChild(makeClickable(el("rect", { x: px - pilSize / 2, y: yT - pilSize / 2, width: pilSize, height: pilSize, fill: COLORS.pilastro, stroke: "#243F60" }), "P01", selectedId, onSelect));
    if (filari === 2) svg.appendChild(makeClickable(el("rect", { x: px - pilSize / 2, y: yB - pilSize / 2, width: pilSize, height: pilSize, fill: COLORS.pilastro, stroke: "#243F60" }), tipo === "mono" ? "P02" : "P01", selectedId, onSelect));
  }

  dim(svg, { x1: xL, y1: yB, x2: xR, y2: yB, offset: 40, label: L + " mm" });
  dim(svg, { x1: xR, y1: yT, x2: xR, y2: yB, offset: 40, label: W + " mm" });
  dim(svg, { x1: xL, y1: yT, x2: xL + passo, y2: yT, offset: -22, label: "i " + Math.round(L / campate) });
}
