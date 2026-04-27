// ============================================================
// MASTRO — TimerLavoro types (v2)
// ============================================================

export type FaseLavoro =
  | 'rilievo' | 'taglio' | 'saldatura' | 'assemblaggio' | 'ferratura'
  | 'imballaggio' | 'carico' | 'trasporto' | 'posa' | 'collaudo' | 'altro';

export const FASI_LAVORO_LABEL: Record<FaseLavoro, string> = {
  rilievo: 'Rilievo', taglio: 'Taglio', saldatura: 'Saldatura',
  assemblaggio: 'Assemblaggio', ferratura: 'Ferratura',
  imballaggio: 'Imballaggio', carico: 'Carico', trasporto: 'Trasporto',
  posa: 'Posa', collaudo: 'Collaudo', altro: 'Altro',
};

export type MotivoStop =
  | 'completato' | 'pausa_pranzo' | 'cambio_commessa'
  | 'problema' | 'fine_giornata' | 'altro';

export const MOTIVO_STOP_LABEL: Record<MotivoStop, string> = {
  completato: 'Lavoro completato',
  pausa_pranzo: 'Pausa pranzo',
  cambio_commessa: 'Cambio commessa',
  problema: 'Problema / blocco',
  fine_giornata: 'Fine giornata',
  altro: 'Altro',
};

export const MOTIVI_CHE_NOTIFICANO: MotivoStop[] = ['problema'];

export interface OraLavoro {
  id: string;
  azienda_id: string;
  operatore_id: string;
  commessa_id: string;
  fase: FaseLavoro | string;
  sottofase: string | null;
  start_at: string;
  stop_at: string | null;
  pause_total_seconds: number;
  pause_started_at: string | null;
  durata_minuti: number | null;
  note: string | null;
  motivo_stop: MotivoStop | null;
  motivo_stop_dettaglio: string | null;
  parent_ora_id: string | null;
  auto_started_da: string | null;
  approvata_da: string | null;
  approvata_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommessaMinima {
  id: string;
  numero: string | null;
  cliente_nome: string | null;
  indirizzo: string | null;
}

export type StatoTimer = 'idle' | 'running' | 'paused';

export interface TimerSnapshot {
  stato: StatoTimer;
  sessione: OraLavoro | null;
  elapsedSeconds: number;
  pausedSeconds: number;
}

export interface StopArgs {
  motivo: MotivoStop;
  dettaglio?: string;
}
