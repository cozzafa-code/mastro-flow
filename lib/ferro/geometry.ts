// lib/ferro/geometry.ts
// Calcoli geometrici puri: pendenze, interassi, lunghezze
import type { FerroConfig, FerroGeometry } from "./types";

export function geom(c: FerroConfig): FerroGeometry {
  const { larghezza: W, hgronda: Hg, hcolmo: Hc, tipo } = c;

  if (tipo === "mono") {
    const lungT = Math.round(Math.sqrt(W * W + (Hc - Hg) * (Hc - Hg)));
    const ang = +(Math.atan2(Hc - Hg, W) * 180 / Math.PI).toFixed(2);
    return { lungT, ang, falda: lungT };
  }

  if (tipo === "doppia" || tipo === "capannone") {
    const halfW = W / 2;
    const lungF = Math.round(Math.sqrt(halfW * halfW + (Hc - Hg) * (Hc - Hg)));
    const ang = +(Math.atan2(Hc - Hg, halfW) * 180 / Math.PI).toFixed(2);
    return { lungT: lungF, ang, falda: lungF };
  }

  if (tipo === "pensilina") {
    const lungT = Math.round(Math.sqrt(W * W + (Hg - Hc) * (Hg - Hc)));
    return { lungT, ang: 0, falda: lungT };
  }

  // pergola
  return { lungT: W, ang: 0, falda: W };
}

export function pendenzaPercentuale(c: FerroConfig): number {
  if (c.tipo === "pergola") return 0;
  const dh = c.hcolmo - c.hgronda;
  const base = c.tipo === "doppia" || c.tipo === "capannone" ? c.larghezza / 2 : c.larghezza;
  return Math.round((dh / base) * 100);
}

export function pendenzaGradi(c: FerroConfig): number {
  if (c.tipo === "pergola") return 0;
  const dh = c.hcolmo - c.hgronda;
  const base = c.tipo === "doppia" || c.tipo === "capannone" ? c.larghezza / 2 : c.larghezza;
  return +(Math.atan2(dh, base) * 180 / Math.PI).toFixed(1);
}

export function interasseCampate(c: FerroConfig): number {
  return Math.round(c.lunghezza / Math.max(1, c.campate));
}

export function interasseArcarecci(c: FerroConfig): number {
  const span = c.tipo === "doppia" || c.tipo === "capannone" ? c.larghezza / 2 : c.larghezza;
  return Math.round(span / Math.max(1, c.arcarecci - 1));
}

export function lungControvento(c: FerroConfig): number {
  const passo = c.lunghezza / Math.max(1, c.campate);
  return Math.round(Math.sqrt(c.hgronda * c.hgronda + passo * passo));
}
