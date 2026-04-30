// lib/ferro/rules.ts
// Regole automatiche: piastre, bulloni, tasselli, saldature
import type { FerroConfig, PiastraSpec, BulloneSpec, TasselloSpec, SaldaturaSpec } from "./types";

export function autoPiastraBase(c: FerroConfig): PiastraSpec {
  const t = c.pilastro.taglia;
  if (c.tipo === "capannone") {
    return { dim: 350, sp: 15, fori: 6, foroD: 22, interasse: 250, bullone: "M20", kg: 14.42, eur: 18.50 };
  }
  if (t === "piccolo") {
    return { dim: 200, sp: 10, fori: 4, foroD: 14, interasse: 140, bullone: "M12", kg: 3.14, eur: 4.50 };
  }
  if (t === "grande") {
    return { dim: 300, sp: 12, fori: 6, foroD: 22, interasse: 220, bullone: "M20", kg: 8.48, eur: 11.50 };
  }
  return { dim: 250, sp: 12, fori: 4, foroD: 18, interasse: 170, bullone: "M16", kg: 5.89, eur: 8.50 };
}

export function autoBulloni(c: FerroConfig): BulloneSpec {
  const t = c.pilastro.taglia;
  if (c.tipo === "capannone") return { tipo: "M20", classe: "8.8", kg: 0.108, eur: 1.20 };
  if (t === "piccolo")        return { tipo: "M12", classe: "8.8", kg: 0.045, eur: 0.55 };
  if (t === "grande")         return { tipo: "M20", classe: "8.8", kg: 0.108, eur: 1.20 };
  return { tipo: "M16", classe: "8.8", kg: 0.080, eur: 0.85 };
}

export function autoTassello(c: FerroConfig): TasselloSpec {
  const t = c.pilastro.taglia;
  if (c.tipo === "capannone") return { tipo: "HSL-3 M20", kg: 0.135, eur: 4.80 };
  if (t === "piccolo")        return { tipo: "HST3 M12",  kg: 0.055, eur: 1.90 };
  if (t === "grande")         return { tipo: "HSL-3 M20", kg: 0.135, eur: 4.80 };
  return { tipo: "HST3 M16", kg: 0.090, eur: 2.95 };
}

export function autoTassChim(): TasselloSpec {
  return { tipo: "HIT-HY 200 M16", kg: 0.090, eur: 4.50 };
}

export function autoSaldature(c: FerroConfig): SaldaturaSpec {
  const profPil = c.pilastro.name;
  let perim = 480;
  if (profPil.includes("80x80"))     perim = 320;
  if (profPil.includes("100x100"))   perim = 400;
  if (profPil.includes("120x120"))   perim = 480;
  if (profPil.includes("150x150"))   perim = 600;
  if (profPil.includes("HEA 160") || profPil.includes("HEB 160")) perim = 870;
  if (profPil.includes("HEA 200"))   perim = 1100;
  return { spessore: 6, lung: perim, simbolo: "a6", metodo: "MAG" };
}

export const FIX_TERRA_LABELS: Record<string, string> = {
  tasselli:  "Piastra + tasselli",
  tirafondi: "Piastra + tirafondi",
  annegato:  "Annegato nel cemento",
  staffa:    "Staffa laterale",
};

export const FIX_MURO_LABELS: Record<string, string> = {
  "tasselli-chim":   "Tasselli chimici",
  "barre-filettate": "Barre filettate",
  "piastra-murale":  "Piastra murale",
  "staffa-lat":      "Staffe laterali",
};

export const COLLEGAMENTO_LABELS: Record<string, string> = {
  bullonato: "Bullonato",
  saldato:   "Saldato",
  misto:     "Misto",
};

export const CARICO_LABELS: Record<string, string> = {
  leggero: "Leggero ? lamiera",
  medio:   "Medio ? pannello sandwich",
  pesante: "Pesante ? tegole/vetro",
};
