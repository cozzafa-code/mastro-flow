// lib/types/nodi.ts

export interface NodoTecnico {
  id: string;
  sistema_id: string | null;
  azienda_id: string | null;
  nome: string;
  tipo: string | null;
  descrizione: string | null;
  profili_coinvolti: string[] | null;
  note: string | null;
  immagine_url: string | null;
  dxf_url: string | null;
  pdf_url: string | null;
  attivo: boolean | null;
  created_at?: string | null;
}

export type TipoNodo =
  | 'laterale'
  | 'angolo_telaio'
  | 'angolo_anta'
  | 'centrale'
  | 'incrocio'
  | 'soglia'
  | 'cassa_avvolgibile'
  | 'aggancio_persiana'
  | 'altro';

export const TIPI_NODO_LABEL: Record<TipoNodo, string> = {
  laterale: 'Nodo laterale',
  angolo_telaio: 'Angolo telaio',
  angolo_anta: 'Angolo anta',
  centrale: 'Centrale',
  incrocio: 'Incrocio',
  soglia: 'Soglia',
  cassa_avvolgibile: 'Cassa avvolgibile',
  aggancio_persiana: 'Aggancio persiana',
  altro: 'Altro',
};
