// lib/nodi/nodi-types.ts
// Modello dati Nodi Tecnici (compatibile con NodiTecniciPanel desktop esistente).

export interface NodoLayer {
  id: string;
  profiloId: string | null;
  codice: string;
  svg: string;
  x: number;
  y: number;
  rotation: number;   // gradi
  flipH: boolean;
  flipV: boolean;
  color: string;
  label: string;
  visible: boolean;
  groupId: string | null;
}

export interface QuoteRef {
  layerId1: string; offX1: number; offY1: number;
  layerId2: string; offX2: number; offY2: number;
}

export interface QuoteResolved {
  x1: number; y1: number;
  x2: number; y2: number;
  dist: number;
}

export interface NodoTecnico {
  id?: string;
  codice: string;
  nome: string;
  fornitore: string;
  serie: string;
  tipo_nodo: string;
  layers: NodoLayer[];
}

export interface SnapPoint {
  x: number;
  y: number;
  layerId: string;
}

export type ToolMode = 'select' | 'quota' | 'link';

export const NODO_TIPI = [
  'orizzontale_alto',
  'orizzontale_basso',
  'verticale_cerniera',
  'verticale_chiusura',
  'verticale_montante',
  'soglia',
  'davanzale',
  'cassonetto',
  'controtelaio',
] as const;

export const LAYER_COLORS = [
  '#0D1F1F', '#28A0A0', '#DC4444', '#3B7FE0',
  '#D08008', '#1A9E73', '#7C5FBF', '#E06B3B',
];

export const GROUP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96E6A1', '#DDA0DD', '#F0E68C',
];
