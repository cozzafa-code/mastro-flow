// lib/types/mastro-win.ts
// Tipi condivisi per il modulo MASTRO WIN (UI + hook).

export interface FerramentaArticolo {
  id: string;
  fornitore: string;
  sistema: string;
  categoria: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  lunghezza_mm: number | null;
  e_mm: number | null;
  materiale: string | null;
  hbb_min: number | null;
  hbb_max: number | null;
  lbb_min: number | null;
  lbb_max: number | null;
  peso_max_kg: number | null;
  prezzo_listino: number | null;
  prezzo_netto: number | null;
  sconto_perc: number | null;
  conf_pezzi: number | null;
  immagine_url: string | null;
  altezza_maniglia_mm: number | null;
  note: string | null;
  attivo: boolean | null;
  created_at?: string | null;
}

export interface FerramentaCremonese {
  id: string;
  fornitore: string;
  sistema: string;
  tipo: string;
  codice: string;
  hbb_da: number;
  hbb_a: number;
  altezza_maniglia: number;
  n_chiusure_centrali: number | null;
  passo_chiusure: number | null;
  con_bilanciere: boolean | null;
  con_scrocco_porta: boolean | null;
  note: string | null;
  created_at?: string | null;
}

export interface CatalogoFerramenta {
  id: string;
  azienda_id: string;
  sistema_id: string | null;
  codice: string;
  descrizione: string;
  tipo: string | null;
  portata_max_kg: number | null;
  larghezza_anta_max_mm: number | null;
  altezza_anta_max_mm: number | null;
  attivo: boolean | null;
  note: string | null;
}

export interface CatalogoFerramentaDimensione {
  id: string;
  ferramenta_id: string;
  n_cerniere: number | null;
  larghezza_max_mm: number | null;
  altezza_max_mm: number | null;
}

export interface CatalogoFerramentaPortata {
  id: string;
  ferramenta_id: string;
  altezza_mm: number | null;
  portata_pct: number | null;
}

export type CategoriaArticolo =
  | 'cremonese'
  | 'asta_cremonese'
  | 'cerniera'
  | 'forbice'
  | 'forbice_suppl'
  | 'maniglia'
  | 'compasso'
  | 'movimento_angolare'
  | 'chiusura_centrale'
  | 'scontro'
  | 'prolunga'
  | 'chiavistello'
  | 'ecklager'
  | 'supporto_forbice'
  | 'altro';

export const CATEGORIE_LABEL: Record<CategoriaArticolo, string> = {
  cremonese: 'Cremonese',
  asta_cremonese: 'Asta cremonese',
  cerniera: 'Cerniera',
  forbice: 'Forbice',
  forbice_suppl: 'Forbice suppl.',
  maniglia: 'Maniglia',
  compasso: 'Compasso',
  movimento_angolare: 'Movimento angolare',
  chiusura_centrale: 'Chiusura centrale',
  scontro: 'Scontro',
  prolunga: 'Prolunga',
  chiavistello: 'Chiavistello',
  ecklager: 'Ecklager',
  supporto_forbice: 'Supporto forbice',
  altro: 'Altro',
};

export type WinTab = 'calcolo' | 'articoli' | 'cremonesi' | 'dimensioni';
