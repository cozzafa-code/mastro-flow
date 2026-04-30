// lib/ferro/renderers/iso.ts
import type { FerroConfig } from "../types";
import { el, COLORS, makeClickable } from "./helpers";

export function drawIso(svg: SVGElement, c: FerroConfig, selectedId: string | null, onSelect: (id: string) => void): void {
  const { tipo, larghezza: W, lunghezza: L, hgronda: Hg, hcolmo: Hc, campate, arcarecci } = c;
  const VBW = 900, VBH = 540;
  svg.appendChild(el("rect", { width: VBW, height: VBH, fill: "url(#ff-gridM)" }));
  const cx = VBW / 2, cy = VBH / 2 + 60;
  const s = 280 / Math.max(L * 1.2, Hc * 2);
  const c30 = Math.cos(Math.PI / 6), s30 = Math.sin(Math.PI / 6);
  const P = (x: number, y: number, z: number) => ({ x: cx + (x - z) * s * c30, y: cy + (x + z) * s * s30 - y * s });

  const g0 = P(-200, 0, -200), g1 = P(L + 200, 0, -200), g2 = P(L + 200, 0, W + 200), g3 = P(-200, 0, W + 200);
  svg.appendChild(el("polygon", { points: [g0, g1, g2, g3].map((p) => p.x + "," + p.y).join(" "), fill: "#F8F7F2", stroke: "#D8D5CA" }));

  if (tipo === "mono") {
    const cv = [P(0, Hg, 0), P(L, Hg, 0), P(L, Hc, W), P(0, Hc, W)];
    svg.appendChild(el("polygon", { points: cv.map((p) => p.x + "," + p.y).join(" "), fill: "rgba(42,107,74,0.18)", stroke: COLORS.trave }));
  } else if (tipo === "doppia" || tipo === "capannone") {
    const a = [P(0, Hg, 0), P(L, Hg, 0), P(L, Hc, W / 2), P(0, Hc, W / 2)];
    const b = [P(0, Hc, W / 2), P(L, Hc, W / 2), P(L, Hg, W), P(0, Hg, W)];
    svg.appendChild(el("polygon", { points: a.map((p) => p.x + "," + p.y).join(" "), fill: "rgba(42,107,74,0.20)", stroke: COLORS.trave }));
    svg.appendChild(el("polygon", { points: b.map((p) => p.x + "," + p.y).join(" "), fill: "rgba(42,107,74,0.13)", stroke: COLORS.trave }));
  } else if (tipo === "pergola") {
    const cv = [P(0, Hg, 0), P(L, Hg, 0), P(L, Hg, W), P(0, Hg, W)];
    svg.appendChild(el("polygon", { points: cv.map((p) => p.x + "," + p.y).join(" "), fill: "rgba(180,178,169,0.18)", stroke: COLORS.copertura, "stroke-dasharray": "4,2" }));
  } else if (tipo === "pensilina") {
    const m = [P(0, 0, 0), P(L, 0, 0), P(L, Hg + 500, 0), P(0, Hg + 500, 0)];
    svg.appendChild(el("polygon", { points: m.map((p) => p.x + "," + p.y).join(" "), fill: "#E5E3D8", stroke: "#888780" }));
    const cv = [P(0, Hg, 0), P(L, Hg, 0), P(L, Hc, W), P(0, Hc, W)];
    svg.appendChild(el("polygon", { points: cv.map((p) => p.x + "," + p.y).join(" "), fill: "rgba(42,107,74,0.20)", stroke: COLORS.trave }));
  }

  const pilCol = (xPos: number, h: number, zPos: number, id: string): SVGElement => {
    const w = 80;
    const pts = [P(xPos - w / 2, 0, zPos), P(xPos + w / 2, 0, zPos), P(xPos + w / 2, h, zPos), P(xPos - w / 2, h, zPos)];
    return makeClickable(el("polygon", { points: pts.map((p) => p.x + "," + p.y).join(" "), fill: COLORS.pilastro, stroke: "#243F60" }), id, selectedId, onSelect);
  };

  if (tipo === "mono") {
    for (let i = 0; i <= campate; i++) {
      const xPos = L * i / campate;
      svg.appendChild(pilCol(xPos, Hg, 40, "P01"));
      svg.appendChild(pilCol(xPos, Hc, W - 40, "P02"));
      const a = P(xPos, Hg, 40), b = P(xPos, Hc, W - 40);
      svg.appendChild(makeClickable(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: COLORS.trave, "stroke-width": "3" }), "T01", selectedId, onSelect));
    }
  } else if (tipo === "doppia" || tipo === "capannone") {
    for (let i = 0; i <= campate; i++) {
      const xPos = L * i / campate;
      svg.appendChild(pilCol(xPos, Hg, 40, "P01"));
      svg.appendChild(pilCol(xPos, Hg, W - 40, "P01"));
      const a = P(xPos, Hg, 40), apex = P(xPos, Hc, W / 2), b = P(xPos, Hg, W - 40);
      svg.appendChild(makeClickable(el("line", { x1: a.x, y1: a.y, x2: apex.x, y2: apex.y, stroke: COLORS.trave, "stroke-width": "3" }), "T01", selectedId, onSelect));
      svg.appendChild(makeClickable(el("line", { x1: apex.x, y1: apex.y, x2: b.x, y2: b.y, stroke: COLORS.trave, "stroke-width": "3" }), tipo === "doppia" ? "T02" : "T01", selectedId, onSelect));
    }
  } else if (tipo === "pergola") {
    for (let i = 0; i <= campate; i++) {
      const xPos = L * i / campate;
      svg.appendChild(pilCol(xPos, Hg, 40, "P01"));
      svg.appendChild(pilCol(xPos, Hg, W - 40, "P01"));
    }
  } else if (tipo === "pensilina") {
    for (let i = 0; i < campate; i++) {
      const xPos = L * (i + 0.5) / campate;
      const a = P(xPos, Hg, 0), b = P(xPos, Hc, W);
      svg.appendChild(makeClickable(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: COLORS.trave, "stroke-width": "3" }), "M01", selectedId, onSelect));
    }
  }

  const nArc = (tipo === "doppia" || tipo === "capannone") ? arcarecci * 2 : arcarecci;
  for (let r = 0; r < nArc; r++) {
    const t = nArc > 1 ? r / (nArc - 1) : 0.5;
    let yArc = Hg + 60, zArc = 40 + (W - 80) * t;
    if (tipo === "mono") yArc = Hg + (Hc - Hg) * t + 60;
    const a = P(0, yArc, zArc), b = P(L, yArc, zArc);
    svg.appendChild(makeClickable(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: COLORS.arcareccio, "stroke-width": "2" }), "A01", selectedId, onSelect));
  }
}
