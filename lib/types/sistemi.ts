// lib/types/sistemi.ts
// Tipi per il modulo SISTEMI (shared catalog + attivazione per azienda).

export interface Sistema {
  id: string;
  marca: string;
  sistema: string;
  materiale: string;
  created_at?: string | null;
}

export interface AziendaSistemaAttivo {
  id: string;
  azienda_id: string;
  sistema_id: string;
  attivo: boolean | null;
  preferito: boolean | null;
  prezzo_kg_listino: number | null;
  prezzo_kg_netto: number | null;
  sconto_perc: number | null;
  note: string | null;
}

export interface ProfiloCatalogo {
  id: number;
  azienda_id: string | null;
  sistema_id: string;
  codice: string;
  nome: string;
  tipo: string | null;
  materiale: string | null;
  marca: string | null;
  profondita_mm: number | null;
  camere: number | null;
  uf: number | null;
  peso_kg_ml: number | null;
  gr_ml: number | null;
  utilizzo: string | null;
  battuta: number | null;
  aria: number | null;
  frontale: number | null;
  sede_fermavetro: number | null;
  tubolare: number | null;
  spessore_lama: number | null;
  quota_fusione: number | null;
  sviluppo: number | null;
  immagine_url: string | null;
  dxf_url: string | null;
  pdf_url: string | null;
  note: string | null;
  attivo: boolean | null;
}

export interface ColoreSistema {
  id: number;
  colore_id: number;
  sistema_id: string;
}

export interface ColoreCatalogo {
  id: number;
  nome: string;
  codice_ral?: string;
  hex?: string;
  finitura?: string;
  immagine_url?: string;
}

export interface VetroSistema {
  id: string;
  sistema_id: string;
  vetro_id?: string;
  spessore_min?: number;
  spessore_max?: number;
  note?: string;
}

export type SistemaTab = 'overview' | 'profili' | 'colori' | 'vetri' | 'tecnico';

export interface SistemaConStats extends Sistema {
  attivo_azienda: boolean;
  preferito: boolean;
  attivazione_id: string | null;
  n_profili: number;
  n_colori: number;
  n_vetri: number;
}

export interface ParametroTecnico {
  categoria: string;
  count: number;
}
