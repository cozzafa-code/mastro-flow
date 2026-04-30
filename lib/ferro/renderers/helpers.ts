// lib/ferro/renderers/helpers.ts
// Helper SVG: defs, marker, dimensioni, ground, callout, badge, legenda

export const SVG_NS = "http://www.w3.org/2000/svg";

export const COLORS = {
  pilastro: "#3B5C8A", trave: "#2A6B4A", arcareccio: "#A8542C",
  piastra: "#4A4A47", controvento: "#8A5A8A", traverso: "#B85C50",
  copertura: "#B4B2A9", ground: "#4A4A47", dim: "#4A4A47",
  dimText: "#0D1F1F", guide: "#C8C5BA", selected: "#28A0A0",
  bullone: "#0D1F1F", saldatura: "#D04A2A",
};

export function el(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const e = document.createElementNS(SVG_NS, tag) as SVGElement;
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (text != null) e.textContent = text;
  return e;
}

export function newSvg(viewBox = "0 0 900 540"): SVGSVGElement {
  const svg = el("svg", { viewBox, xmlns: SVG_NS, style: "width:100%;height:100%;min-height:380px;display:block;" }) as SVGSVGElement;
  const defs = el("defs", {});
  const m1 = el("marker", { id: "ff-arr", viewBox: "0 0 12 12", refX: "11", refY: "6", markerWidth: "8", markerHeight: "8", orient: "auto" });
  m1.appendChild(el("path", { d: "M0,0 L11,6 L0,12 Z", fill: "#4A4A47" }));
  defs.appendChild(m1);
  const m2 = el("marker", { id: "ff-arrs", viewBox: "0 0 12 12", refX: "1", refY: "6", markerWidth: "8", markerHeight: "8", orient: "auto" });
  m2.appendChild(el("path", { d: "M12,0 L1,6 L12,12 Z", fill: "#4A4A47" }));
  defs.appendChild(m2);
  const pat = el("pattern", { id: "ff-grid", width: "40", height: "40", patternUnits: "userSpaceOnUse" });
  pat.appendChild(el("path", { d: "M 40 0 L 0 0 0 40", fill: "none", stroke: "#EFEDE5", "stroke-width": "0.4" }));
  defs.appendChild(pat);
  const pat2 = el("pattern", { id: "ff-gridM", width: "200", height: "200", patternUnits: "userSpaceOnUse" });
  pat2.appendChild(el("rect", { width: "200", height: "200", fill: "url(#ff-grid)" }));
  pat2.appendChild(el("path", { d: "M 200 0 L 0 0 0 200", fill: "none", stroke: "#E0DED5", "stroke-width": "0.6" }));
  defs.appendChild(pat2);
  svg.appendChild(defs);
  return svg;
}

interface DimOpts { x1: number; y1: number; x2: number; y2: number; label: string; offset?: number; }

export function dim(svg: SVGElement, opts: DimOpts): void {
  const { x1, y1, x2, y2, label, offset = 0 } = opts;
  const g = el("g", {});
  let dx1 = x1, dy1 = y1, dx2 = x2, dy2 = y2;
  const isHoriz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  if (isHoriz) {
    dy1 = dy2 = y1 + offset;
    g.appendChild(el("line", { x1, y1, x2: x1, y2: dy1 + (offset > 0 ? 4 : -4), stroke: COLORS.guide, "stroke-width": "0.5" }));
    g.appendChild(el("line", { x1: x2, y1: y2, x2: x2, y2: dy2 + (offset > 0 ? 4 : -4), stroke: COLORS.guide, "stroke-width": "0.5" }));
  } else {
    dx1 = dx2 = x1 + offset;
    g.appendChild(el("line", { x1, y1, x2: dx1 + (offset > 0 ? 4 : -4), y2: y1, stroke: COLORS.guide, "stroke-width": "0.5" }));
    g.appendChild(el("line", { x1: x2, y1: y2, x2: dx2 + (offset > 0 ? 4 : -4), y2: y2, stroke: COLORS.guide, "stroke-width": "0.5" }));
  }
  g.appendChild(el("line", { x1: dx1, y1: dy1, x2: dx2, y2: dy2, stroke: COLORS.dim, "stroke-width": "0.7", "marker-start": "url(#ff-arrs)", "marker-end": "url(#ff-arr)" }));
  const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
  const lW = label.length * 5.3 + 8;
  if (isHoriz) {
    g.appendChild(el("rect", { x: mx - lW / 2, y: my - 6, width: lW, height: 12, fill: "white" }));
    g.appendChild(el("text", { x: mx, y: my, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": "10", fill: COLORS.dimText, "font-family": "JetBrains Mono, monospace", "font-weight": "500" }, label));
  } else {
    g.appendChild(el("rect", { x: mx - 6, y: my - lW / 2, width: 12, height: lW, fill: "white" }));
    g.appendChild(el("text", { x: mx, y: my, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": "10", fill: COLORS.dimText, "font-family": "JetBrains Mono, monospace", "font-weight": "500", transform: "rotate(-90, " + mx + ", " + my + ")" }, label));
  }
  svg.appendChild(g);
}

export function ground(svg: SVGElement, xL: number, xR: number, baseY: number): void {
  const g = el("g", {});
  g.appendChild(el("line", { x1: xL - 60, y1: baseY, x2: xR + 60, y2: baseY, stroke: COLORS.ground, "stroke-width": "1.2" }));
  for (let i = 0; i < 24; i++) {
    const gx = xL - 55 + i * ((xR - xL + 110) / 23);
    g.appendChild(el("line", { x1: gx, y1: baseY, x2: gx + 6, y2: baseY + 8, stroke: COLORS.ground, "stroke-width": "0.6" }));
  }
  svg.appendChild(g);
}

export function callout(svg: SVGElement, x: number, y: number, letter: string): void {
  const g = el("g", {});
  g.appendChild(el("circle", { cx: x, cy: y, r: "10", fill: "#28A0A0", stroke: "#0D1F1F", "stroke-width": "0.8" }));
  g.appendChild(el("text", { x, y: y + 0.5, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": "11", "font-family": "JetBrains Mono, monospace", "font-weight": "700", fill: "#FFFFFF" }, letter));
  svg.appendChild(g);
}

export function pendBadge(svg: SVGElement, x: number, y: number, perc: number, deg: number | string): void {
  const g = el("g", {});
  g.appendChild(el("rect", { x: x - 52, y: y - 11, width: 104, height: 22, fill: "#0D1F1F", rx: "4" }));
  g.appendChild(el("text", { x, y: y + 1, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": "10", fill: "#28A0A0", "font-family": "JetBrains Mono, monospace", "font-weight": "600" }, perc + "% ? " + deg + "?"));
  svg.appendChild(g);
}

export function makeClickable(node: SVGElement, partId: string, selectedId: string | null, onSelect: (id: string) => void): SVGElement {
  node.setAttribute("data-part-id", partId);
  node.style.cursor = "pointer";
  if (selectedId === partId) {
    const tag = node.tagName.toLowerCase();
    if (tag === "rect" || tag === "polygon" || tag === "circle") {
      node.setAttribute("fill", COLORS.selected);
      node.setAttribute("stroke", "#0D1F1F");
    } else {
      node.setAttribute("stroke", COLORS.selected);
      node.setAttribute("stroke-width", "4");
    }
  }
  node.addEventListener("click", (e) => { e.stopPropagation(); onSelect(partId); });
  return node;
}
