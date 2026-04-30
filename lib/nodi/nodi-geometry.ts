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

// ─── Bounding box di un layer (in coordinate world dopo transform) ──
export function getLayerBBox(layer: NodoLayer): { x: number; y: number; w: number; h: number; cx: number; cy: number } | null {
  if (!layer.svg) return null;
  const vbMatch = layer.svg.match(/viewBox="([\d.\s-]+)"/);
  if (!vbMatch) return null;
  const [vx, vy, vw, vh] = vbMatch[1].split(/\s+/).map(Number);
  if (!isFinite(vx) || !isFinite(vw)) return null;
  // Applica scale (flip) e translate del layer alla bbox della viewBox
  const scaleX = layer.flipH ? -1 : 1;
  const scaleY = layer.flipV ? -1 : 1;
  // Quattro angoli della viewBox
  const corners = [
    { x: vx, y: vy },
    { x: vx + vw, y: vy },
    { x: vx, y: vy + vh },
    { x: vx + vw, y: vy + vh },
  ].map(p => transformPoint(p.x * scaleX / Math.abs(scaleX), p.y * scaleY / Math.abs(scaleY), { ...layer, flipH: false, flipV: false }));
  // (semplificato: useremo solo width/height per allineamento; il resto via translate)
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

// ─── Calcola posizione per allineare un layer rispetto a un target ──
// direction: 'left'|'right'|'top'|'bottom' = posizione del SOURCE rispetto al TARGET
// align: 'start'|'center'|'end' = come allineare l'asse perpendicolare
// offset: mm di spazio tra source e target (0 = combaciante)
export function calcAlignedPosition(
  source: NodoLayer,
  target: NodoLayer,
  direction: 'left' | 'right' | 'top' | 'bottom',
  offset: number = 0,
  align: 'start' | 'center' | 'end' = 'center'
): { x: number; y: number } {
  const sBox = getLayerBBox(source);
  const tBox = getLayerBBox(target);
  if (!sBox || !tBox) return { x: source.x, y: source.y };

  // Le bbox sono già in coordinate world per il target.
  // Per il source dobbiamo calcolare dove starebbe il suo CENTRO (layer.x,y) per posizionarlo dove vogliamo.
  // sBox.cx attuale = source.x + (offset_centro_bbox_dal_layer_origin)
  const sCenterOffsetX = sBox.cx - source.x;
  const sCenterOffsetY = sBox.cy - source.y;

  let newCx = sBox.cx;
  let newCy = sBox.cy;

  switch (direction) {
    case 'left':   // source a sinistra del target
      newCx = tBox.x - offset - sBox.w / 2;
      newCy = align === 'start' ? tBox.y + sBox.h / 2
            : align === 'end'   ? tBox.y + tBox.h - sBox.h / 2
            : tBox.cy;
      break;
    case 'right':  // source a destra del target
      newCx = tBox.x + tBox.w + offset + sBox.w / 2;
      newCy = align === 'start' ? tBox.y + sBox.h / 2
            : align === 'end'   ? tBox.y + tBox.h - sBox.h / 2
            : tBox.cy;
      break;
    case 'top':    // source sopra il target
      newCy = tBox.y - offset - sBox.h / 2;
      newCx = align === 'start' ? tBox.x + sBox.w / 2
            : align === 'end'   ? tBox.x + tBox.w - sBox.w / 2
            : tBox.cx;
      break;
    case 'bottom': // source sotto il target
      newCy = tBox.y + tBox.h + offset + sBox.h / 2;
      newCx = align === 'start' ? tBox.x + sBox.w / 2
            : align === 'end'   ? tBox.x + tBox.w - sBox.w / 2
            : tBox.cx;
      break;
  }

  // Calcola la nuova layer.x/y togliendo l'offset bbox-centro
  return {
    x: newCx - sCenterOffsetX,
    y: newCy - sCenterOffsetY,
  };
}
