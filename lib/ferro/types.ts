// lib/ferro/types.ts
// Tipi del configuratore ferro per VanoDetailPanel

export type StructureType = "mono" | "doppia" | "capannone" | "pensilina" | "pergola";
export type ViewMode = "frontale" | "laterale" | "pianta" | "iso";
export type CanvasMode = "generale" | "dettagli" | "officina" | "montaggio";
export type Collegamento = "bullonato" | "saldato" | "misto";
export type FixTerra = "tasselli" | "tirafondi" | "annegato" | "staffa";
export type FixMuro = "tasselli-chim" | "barre-filettate" | "piastra-murale" | "staffa-lat";
export type Carico = "leggero" | "medio" | "pesante";
export type ProfileSize = "piccolo" | "medio" | "grande";
export type FixType = "terra" | "muro";

export interface FerroProfile {
  name: string;
  kgm: number;
  eurm: number;
  taglia?: ProfileSize;
}

export interface FerroDimSpec {
  key: keyof Pick<FerroConfig, "larghezza" | "lunghezza" | "hgronda" | "hcolmo" | "campate" | "arcarecci">;
  label: string;
  min: number;
  max: number;
  step: number;
  def: number;
  unit?: string;
}

export interface FerroStructureSpec {
  label: string;
  code: string;
  fixType: FixType;
  dims: FerroDimSpec[];
}

// FerroConfig va dentro vano.dati con prefisso ferro_*
export interface FerroConfig {
  tipo: StructureType;
  larghezza: number;
  lunghezza: number;
  hgronda: number;
  hcolmo: number;
  campate: number;
  arcarecci: number;
  pilastro: FerroProfile;
  trave: FerroProfile;
  arcareccio: FerroProfile;
  collegamento: Collegamento;
  fixTerra: FixTerra;
  fixMuro: FixMuro;
  carico: Carico;
}

export interface PiastraSpec {
  dim: number;
  sp: number;
  fori: number;
  foroD: number;
  interasse: number;
  bullone: string;
  kg: number;
  eur: number;
}

export interface BulloneSpec {
  tipo: string;
  classe: string;
  kg: number;
  eur: number;
}

export interface TasselloSpec {
  tipo: string;
  kg: number;
  eur: number;
}

export interface SaldaturaSpec {
  spessore: number;
  lung: number;
  simbolo: string;
  metodo: string;
}

export type BomSection = "profili" | "arcarecci" | "piastre" | "bulloneria" | "saldature" | "accessori";

export interface BomItem {
  id: string;
  codice: string;
  nome: string;
  profilo: string;
  qta: number;
  lungU: number;
  lungTot: number;
  kgm?: number;
  eurm?: number;
  peso: number;
  costo: number;
  nota: string;
  sezione: BomSection;
}

export interface BomTotals {
  totPeso: number;
  totCosto: number;
  oreStimate: number;
  manodopera: number;
  totGen: number;
}

export interface FerroGeometry {
  lungT: number;
  ang: number;
  falda: number;
}

export interface BomResult {
  items: BomItem[];
  sections: Record<BomSection, BomItem[]>;
  totals: BomTotals;
  config: {
    piastra: PiastraSpec;
    bull: BulloneSpec;
    tass: TasselloSpec;
    tassMuro: TasselloSpec;
    sald: SaldaturaSpec;
    geom: FerroGeometry;
  };
}
