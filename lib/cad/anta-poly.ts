// lib/cad/anta-poly.ts
// Funzioni pure per ante poligonali su forme libere (casetta, archi, spezzato).
// Estratto da costruttore.html v61. Zero dipendenze, testabile in isolamento.

export type Pt = { x: number; y: number };

export type AntaSlice = {
  antaId: string;
  antaIdx: number;
  antaCount: number;
  verts: Pt[];
  sliceX1: number;
  sliceX2: number;
  dir: 'SX' | 'DX';
  hasHandle: boolean;
  riporto: boolean;
};

export function clipPolyEdge(
  poly: Pt[],
  val: number,
  axis: 0 | 1,
  dir: 1 | -1
): Pt[] {
  if (poly.length < 2) return poly;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const cVal = axis === 0 ? cur.x : cur.y;
    const pVal = axis === 0 ? prev.x : prev.y;
    const cIn = dir > 0 ? cVal >= val - 0.5 : cVal <= val + 0.5;
    const pIn = dir > 0 ? pVal >= val - 0.5 : pVal <= val + 0.5;
    if (cIn !== pIn) {
      const denom = (axis === 0 ? cur.x - prev.x : cur.y - prev.y) || 0.001;
      const t = (val - (axis === 0 ? prev.x : prev.y)) / denom;
      out.push({
        x: prev.x + (cur.x - prev.x) * t,
        y: prev.y + (cur.y - prev.y) * t,
      });
    }
    if (cIn) out.push(cur);
  }
  return out;
}

export function splitCellIntoAnte(
  cellVerts: Pt[],
  cellId: string,
  nAnte: number
): AntaSlice[] {
  if (nAnte < 1) return [];
  if (cellVerts.length < 3) return [];

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const v of cellVerts) {
    if (v.x < xMin) xMin = v.x;
    if (v.x > xMax) xMax = v.x;
    if (v.y < yMin) yMin = v.y;
    if (v.y > yMax) yMax = v.y;
  }
  const cellW = xMax - xMin;
  if (cellW <= 0) return [];

  const slices: AntaSlice[] = [];

  for (let ai = 0; ai < nAnte; ai++) {
    const antaId = cellId + '_a' + ai;
    const sliceX1 = xMin + cellW * (ai / nAnte);
    const sliceX2 = xMin + cellW * ((ai + 1) / nAnte);

    let sliceVerts: Pt[] = cellVerts.map((v) => ({ x: v.x, y: v.y }));
    sliceVerts = clipPolyEdge(sliceVerts, sliceX1, 0, 1);
    sliceVerts = clipPolyEdge(sliceVerts, sliceX2, 0, -1);

    if (sliceVerts.length < 3) {
      sliceVerts = [
        { x: sliceX1, y: yMin },
        { x: sliceX2, y: yMin },
        { x: sliceX2, y: yMax },
        { x: sliceX1, y: yMax },
      ];
    }

    const dir: 'SX' | 'DX' = ai % 2 === 0 ? 'SX' : 'DX';
    const hasHandle = ai === 0;
    const riporto = nAnte >= 2 && ai === 0;

    slices.push({
      antaId,
      antaIdx: ai,
      antaCount: nAnte,
      verts: sliceVerts,
      sliceX1,
      sliceX2,
      dir,
      hasHandle,
      riporto,
    });
  }

  return slices;
}