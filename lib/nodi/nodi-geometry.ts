// lib/nodi/nodi-geometry.ts
// Funzioni pure per geometria nodi tecnici (snap, transform, quote).
// Estratte 1:1 dal NodiTecniciPanel desktop. Riusabili da mobile/tablet/desktop.

import type { NodoLayer, NodoTecnico, QuoteRef, QuoteResolved, SnapPoint } from './nodi-types';

// ─── Trasformazione punto: applica rotation + flip + translate del layer ──
export function transformPoint(
  x: number,
  y: number,
  layer: NodoLayer
): { x: number; y: number } {
  const rad = (layer.rotation * Math.PI) / 180;
  const px = layer.flipH ? -x : x;
  const py = layer.flipV ? -y : y;
  const rx = px * Math.cos(rad) - py * Math.sin(rad);
  const ry = px * Math.sin(rad) + py * Math.cos(rad);
  return { x: rx + layer.x, y: ry + layer.y };
}

// ─── Estrai punti di snap dai layer ──
// Riproduce esattamente la logica desktop con Y-flip correction.
export function getSnapPoints(nodo: NodoTecnico | null): SnapPoint[] {
  if (!nodo) return [];
  const points: SnapPoint[] = [];

  nodo.layers.filter((l) => l.visible).forEach((layer) => {
    if (!layer.svg) return;
    const svg = layer.svg;

    // Estrai Y-flip offset dal transform interno SVG
    let yFlipOffset = 0;
    const translateMatch = svg.match(/translate\(0[,\s]+([-\d.]+)\)/);
    if (translateMatch) {
      yFlipOffset = -parseFloat(translateMatch[1]);
    } else {
      const vbMatch = svg.match(/viewBox="([\d.\s-]+)"/);
      if (vbMatch) {
        const vbParts = vbMatch[1].split(/\s+/).map(Number);
        yFlipOffset = vbParts[1] + vbParts[3];
      }
    }

    const addPoint = (rawX: number, rawY: number) => {
      const svgX = rawX;
      const svgY = -rawY + yFlipOffset;
      const tp = transformPoint(svgX, svgY, layer);
      points.push({ ...tp, layerId: layer.id });
    };

    // points="x,y x,y ..."
    const pointsRegex = /points="([^"]+)"/g;
    let match;
    while ((match = pointsRegex.exec(svg)) !== null) {
      const pairs = match[1]
        .split(/\s+/)
        .map((pair) => {
          const [x, y] = pair.split(',').map(Number);
          return { x, y };
        })
        .filter((p) => isFinite(p.x) && isFinite(p.y));

      pairs.forEach((p) => addPoint(p.x, p.y));
      // Midpoints
      for (let k = 0; k < pairs.length - 1; k++) {
        addPoint((pairs[k].x + pairs[k + 1].x) / 2, (pairs[k].y + pairs[k + 1].y) / 2);
      }
    }

    // path d="M ... L ... A ..."
    const pathRegex = /d="([^"]+)"/g;
    while ((match = pathRegex.exec(svg)) !== null) {
      const d = match[1];
      const coordRegex = /[ML]\s*([\d.-]+)[,\s]([\d.-]+)/g;
      let cm;
      while ((cm = coordRegex.exec(d)) !== null) {
        addPoint(parseFloat(cm[1]), parseFloat(cm[2]));
      }
      const arcRegex = /A[\d.,\s]+\s+([\d.-]+)[,\s]([\d.-]+)/g;
      while ((cm = arcRegex.exec(d)) !== null) {
        addPoint(parseFloat(cm[1]), parseFloat(cm[2]));
      }
    }

    // circle cx cy
    const circleRegex = /cx="([\d.-]+)"\s*cy="([\d.-]+)"/g;
    while ((match = circleRegex.exec(svg)) !== null) {
      addPoint(parseFloat(match[1]), parseFloat(match[2]));
    }
  });

  return points;
}

// ─── Proiezione punto su segmento ──
export function projectOnSegment(
  px: number, py: number,
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return null;
  let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

// ─── Trova snap più vicino (vertex + segmenti) ──
export function findNearestSnap(
  cx: number, cy: number,
  nodo: NodoTecnico | null,
  zoom: number,
  maxDist = 25
): SnapPoint | null {
  if (!nodo) return null;
  const snaps = getSnapPoints(nodo);
  let best: SnapPoint | null = null;
  let bestDist = maxDist / zoom;

  // 1. Vertex snap
  snaps.forEach((s) => {
    const d = Math.sqrt((s.x - cx) ** 2 + (s.y - cy) ** 2);
    if (d < bestDist) {
      bestDist = d;
      best = { x: s.x, y: s.y, layerId: s.layerId };
    }
  });

  // 2. Nearest point on segments (polyline/polygon)
  nodo.layers.filter((l) => l.visible).forEach((layer) => {
    if (!layer.svg) return;
    const ptRegex = /points="([^"]+)"/g;
    let m;
    while ((m = ptRegex.exec(layer.svg)) !== null) {
      const pts = m[1]
        .split(/\s+/)
        .map((pair) => {
          const [x, y] = pair.split(',').map(Number);
          return isFinite(x) && isFinite(y) ? transformPoint(x, y, layer) : null;
        })
        .filter(Boolean) as { x: number; y: number }[];

      for (let i = 0; i < pts.length - 1; i++) {
        const proj = projectOnSegment(cx, cy, pts[i], pts[i + 1]);
        if (proj) {
          const d = Math.sqrt((proj.x - cx) ** 2 + (proj.y - cy) ** 2);
          if (d < bestDist) {
            bestDist = d;
            best = { ...proj, layerId: layer.id };
          }
        }
      }
    }
  });

  return best;
}

// ─── Risolvi quota in coordinate world (segue i layer) ──
export function resolveQuote(
  q: QuoteRef,
  nodo: NodoTecnico | null
): QuoteResolved {
  if (!nodo) return { x1: 0, y1: 0, x2: 0, y2: 0, dist: 0 };
  const l1 = nodo.layers.find((l) => l.id === q.layerId1);
  const l2 = nodo.layers.find((l) => l.id === q.layerId2);
  const x1 = (l1?.x || 0) + q.offX1;
  const y1 = (l1?.y || 0) + q.offY1;
  const x2 = (l2?.x || 0) + q.offX2;
  const y2 = (l2?.y || 0) + q.offY2;
  return { x1, y1, x2, y2, dist: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) };
}

// ─── Genera SVG combinato per preview/salvataggio ──
export function generateCombinedSVG(nodo: NodoTecnico | null): string {
  if (!nodo) return '';
  const parts = nodo.layers
    .filter((l) => l.visible)
    .map((l) => {
      const transform = `translate(${l.x},${l.y}) rotate(${l.rotation}) scale(${l.flipH ? -1 : 1},${l.flipV ? -1 : 1})`;
      return `<g transform="${transform}">${l.svg.replace(/<\/?svg[^>]*>/g, '')}</g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">${parts}</svg>`;
}

// ─── Estrai contenuto SVG senza il tag esterno ──
export function extractSVGContent(svgString: string): string {
  if (!svgString) return '';
  const inner = svgString.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
  return inner;
}

// ─── Schermo → coordinate canvas ──
export function screenToCanvas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: (clientX - rect.left - rect.width / 2 - panX) / zoom,
    y: (clientY - rect.top - rect.height / 2 - panY) / zoom,
  };
}
