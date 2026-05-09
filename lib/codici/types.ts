export type CodiceTipo =
  | 'pezzo_cnc' | 'vano' | 'commessa' | 'collo'
  | 'articolo' | 'cantiere' | 'documento'
  | 'macchina' | 'furgone' | 'fornitore_esterno';

export type CodiceStato =
  | 'creato' | 'in_lavorazione' | 'lavorato' | 'pronto'
  | 'in_consegna' | 'consegnato' | 'installato'
  | 'scaduto' | 'annullato';

export type Ruolo =
  | 'titolare' | 'operatore' | 'montaggio'
  | 'autista' | 'magazziniere' | 'cliente' | 'anonimo';

export interface Codice {
  id: string;
  short: string;
  tipo: CodiceTipo;
  entita_id: string;
  azienda_id: string;
  payload: Record<string, any>;
  stato: CodiceStato;
  stato_history: Array<{ stato: string; at: string; by?: string }>;
  scansioni_count: number;
  ultima_scansione: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NextAction {
  azione: string;
  label: string;
  priorita: 'normal' | 'high';
  tipo: CodiceTipo;
  stato: CodiceStato;
  distanza_km: number | null;
  codice: Codice;
  error?: string;
}

export interface DeviceInfo {
  modello?: string;
  os?: string;
  browser?: string;
  user_agent?: string;
}
