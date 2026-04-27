// ============================================================
// MASTRO — TimerLavoro types
// Da appendere in lib/types.ts
// ============================================================

export type FaseLavoro =
  | 'rilievo'
  | 'taglio'
  | 'saldatura'
  | 'assemblaggio'
  | 'ferratura'
  | 'imballaggio'
  | 'carico'
  | 'trasporto'
  | 'posa'
  | 'collaudo'
  | 'altro';

export const FASI_LAVORO_LABEL: Record<FaseLavoro, string> = {
  rilievo: 'Rilievo',
  taglio: 'Taglio',
  saldatura: 'Saldatura',
  assemblaggio: 'Assemblaggio',
  ferratura: 'Ferratura',
  imballaggio: 'Imballaggio',
  carico: 'Carico',
  trasporto: 'Trasporto',
  posa: 'Posa',
  collaudo: 'Collaudo',
  altro: 'Altro',
};

export interface OraLavoro {
  id: string;
  azienda_id: string;
  operatore_id: string;
  commessa_id: string;

  fase: FaseLavoro | string;
  sottofase: string | null;

  start_at: string;          // ISO
  stop_at: string | null;    // null = attivo
  pause_total_seconds: number;
  pause_started_at: string | null; // non null = in pausa

  durata_minuti: number | null;

  note: string | null;
  approvata_da: string | null;
  approvata_at: string | null;

  created_at: string;
  updated_at: string;
}

export type OraLavoroInsert = Omit<
  OraLavoro,
  'id' | 'created_at' | 'updated_at' | 'durata_minuti'
> & {
  id?: string;
};

export interface CommessaMinima {
  id: string;
  numero: string | null;
  cliente_nome: string | null;
  indirizzo: string | null;
}

// Stato derivato del timer attivo (calcolato lato client)
export type StatoTimer = 'idle' | 'running' | 'paused';

export interface TimerSnapshot {
  stato: StatoTimer;
  sessione: OraLavoro | null;
  elapsedSeconds: number;     // tempo lavorato netto (escluse pause)
  pausedSeconds: number;      // pausa corrente in corso
}
