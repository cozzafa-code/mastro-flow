// lib/ferro/profiles.ts
// Cataloghi profili e specifiche strutture
import type { FerroProfile, FerroStructureSpec, StructureType } from "./types";

export const PILASTRI: FerroProfile[] = [
  { name: "Tub. 80x80x3",   kgm: 7.2,  eurm: 5.80,  taglia: "piccolo" },
  { name: "Tub. 100x100x4", kgm: 11.4, eurm: 9.20,  taglia: "medio" },
  { name: "Tub. 120x120x4", kgm: 14.0, eurm: 11.20, taglia: "medio" },
  { name: "Tub. 150x150x5", kgm: 22.1, eurm: 17.50, taglia: "grande" },
  { name: "HEA 160",        kgm: 30.4, eurm: 24.00, taglia: "grande" },
  { name: "HEB 160",        kgm: 42.6, eurm: 33.50, taglia: "grande" },
];

export const TRAVI: FerroProfile[] = [
  { name: "IPE 140", kgm: 12.9, eurm: 10.20 },
  { name: "IPE 160", kgm: 15.8, eurm: 12.50 },
  { name: "IPE 200", kgm: 22.4, eurm: 17.80 },
  { name: "IPE 220", kgm: 26.2, eurm: 20.80 },
  { name: "IPE 240", kgm: 30.7, eurm: 24.40 },
  { name: "HEA 200", kgm: 42.3, eurm: 33.50 },
];

export const ARCARECCI: FerroProfile[] = [
  { name: "Tub. 50x30x2",  kgm: 2.5,  eurm: 1.90 },
  { name: "Tub. 60x40x3",  kgm: 4.4,  eurm: 3.50 },
  { name: "Tub. 80x40x3",  kgm: 5.4,  eurm: 4.30 },
  { name: "Tub. 100x50x3", kgm: 6.6,  eurm: 5.30 },
  { name: "UPN 100",       kgm: 10.6, eurm: 8.40 },
];

export const DEFAULT_PILASTRO = PILASTRI[2];
export const DEFAULT_TRAVE = TRAVI[2];
export const DEFAULT_ARCARECCIO = ARCARECCI[2];

export const STRUTTURE: Record<StructureType, FerroStructureSpec> = {
  mono: {
    label: "Tettoia monopendenza",
    code: "MONO-001",
    fixType: "terra",
    dims: [
      { key: "larghezza", label: "Larghezza",     min: 3000, max: 12000, step: 500, def: 6000 },
      { key: "lunghezza", label: "Lunghezza",     min: 4000, max: 24000, step: 500, def: 12000 },
      { key: "hgronda",   label: "Altezza fronte", min: 2500, max: 5000,  step: 100, def: 3000 },
      { key: "hcolmo",    label: "Altezza retro",  min: 2700, max: 6000,  step: 100, def: 3800 },
      { key: "campate",   label: "Campate",        min: 1,    max: 8,     step: 1,   def: 3, unit: "" },
      { key: "arcarecci", label: "Arcarecci",      min: 3,    max: 8,     step: 1,   def: 4, unit: "" },
    ],
  },
  doppia: {
    label: "Tettoia doppia pendenza",
    code: "DOP-001",
    fixType: "terra",
    dims: [
      { key: "larghezza", label: "Larghezza",      min: 4000, max: 14000, step: 500, def: 8000 },
      { key: "lunghezza", label: "Lunghezza",      min: 4000, max: 24000, step: 500, def: 12000 },
      { key: "hgronda",   label: "Altezza gronda", min: 2500, max: 5000,  step: 100, def: 3000 },
      { key: "hcolmo",    label: "Altezza colmo",  min: 3500, max: 7000,  step: 100, def: 4500 },
      { key: "campate",   label: "Campate",        min: 1,    max: 8,     step: 1,   def: 3, unit: "" },
      { key: "arcarecci", label: "Arcarecci/falda", min: 2,   max: 6,     step: 1,   def: 3, unit: "" },
    ],
  },
  capannone: {
    label: "Capannone semplice",
    code: "CAP-001",
    fixType: "terra",
    dims: [
      { key: "larghezza", label: "Larghezza",      min: 6000, max: 20000, step: 500, def: 10000 },
      { key: "lunghezza", label: "Lunghezza",      min: 8000, max: 40000, step: 500, def: 20000 },
      { key: "hgronda",   label: "Altezza gronda", min: 4000, max: 8000,  step: 200, def: 5000 },
      { key: "hcolmo",    label: "Altezza colmo",  min: 5000, max: 10000, step: 200, def: 6500 },
      { key: "campate",   label: "Capriate",       min: 2,    max: 10,    step: 1,   def: 5, unit: "" },
      { key: "arcarecci", label: "Arcarecci/falda", min: 3,   max: 7,     step: 1,   def: 4, unit: "" },
    ],
  },
  pensilina: {
    label: "Pensilina a sbalzo",
    code: "PEN-001",
    fixType: "muro",
    dims: [
      { key: "larghezza", label: "Sporgenza",       min: 1500, max: 4000,  step: 100, def: 2500 },
      { key: "lunghezza", label: "Lunghezza",       min: 3000, max: 12000, step: 500, def: 6000 },
      { key: "hgronda",   label: "Altezza muro",    min: 2200, max: 4000,  step: 100, def: 2800 },
      { key: "hcolmo",    label: "Altezza fronte",  min: 2000, max: 3800,  step: 100, def: 2500 },
      { key: "campate",   label: "Mensole",         min: 2,    max: 6,     step: 1,   def: 3, unit: "" },
      { key: "arcarecci", label: "Arcarecci",       min: 2,    max: 5,     step: 1,   def: 3, unit: "" },
    ],
  },
  pergola: {
    label: "Pergola in ferro",
    code: "PER-001",
    fixType: "terra",
    dims: [
      { key: "larghezza", label: "Larghezza", min: 2500, max: 6000, step: 100, def: 4000 },
      { key: "lunghezza", label: "Lunghezza", min: 3000, max: 8000, step: 100, def: 5000 },
      { key: "hgronda",   label: "Altezza",   min: 2200, max: 3200, step: 100, def: 2500 },
      { key: "hcolmo",    label: "Altezza",   min: 2200, max: 3200, step: 100, def: 2500 },
      { key: "campate",   label: "Campate",   min: 1,    max: 4,    step: 1,   def: 2, unit: "" },
      { key: "arcarecci", label: "Listelli",  min: 4,    max: 14,   step: 1,   def: 8, unit: "" },
    ],
  },
};

// Default config builder per nuovo strumento ferro su un vano
export function defaultFerroConfig(tipo: StructureType = "mono") {
  const dims = STRUTTURE[tipo].dims;
  const get = (k: string): number => dims.find((d) => d.key === k)?.def ?? 0;
  return {
    tipo,
    larghezza: get("larghezza"),
    lunghezza: get("lunghezza"),
    hgronda: get("hgronda"),
    hcolmo: get("hcolmo"),
    campate: get("campate"),
    arcarecci: get("arcarecci"),
    pilastro: DEFAULT_PILASTRO,
    trave: DEFAULT_TRAVE,
    arcareccio: DEFAULT_ARCARECCIO,
    collegamento: "bullonato" as const,
    fixTerra: "tasselli" as const,
    fixMuro: "tasselli-chim" as const,
    carico: "medio" as const,
  };
}
