/**
 * MASTRO DAY · Types
 */

export type DayCategoria =
  | "mastro" | "vita" | "lidia" | "risolto" | "deep" | "pausa";

export type DayStato =
  | "pianificato" | "in_corso" | "fatto" | "saltato" | "spostato";

export interface DaySottoTask {
  id: string;
  testo: string;
  done: boolean;
  spuntato_at?: string;
  evento_match?: string;
}

export interface DayTask {
  id: string;
  azienda_id: string;
  user_id: string;
  titolo: string;
  descrizione?: string | null;
  categoria: DayCategoria;
  giorno: string;
  ora_inizio?: string | null;
  ora_fine?: string | null;
  durata_min?: number | null;
  energia: 1 | 2 | 3 | 4;
  stato: DayStato;
  completato_at?: string | null;
  cm_id?: string | null;
  modulo_target?: string | null;
  link_url?: string | null;
  sotto_task: DaySottoTask[];
  ordine: number;
  created_at: string;
  updated_at: string;
}

export type DayEventoTipo =
  | "misure_salvate" | "vano_creato" | "vano_aggiornato"
  | "prev_generato" | "prev_inviato" | "mail_inviata"
  | "foto_caricata" | "ordine_confermato" | "fattura_emessa"
  | "pagamento_ricevuto" | "commit_pushato" | "task_completato"
  | "risposta_cliente" | "vocale_ricevuto" | "chiamata_persa"
  | "mail_ricevuta" | "listino_aggiornato" | "evento_calendario";

export type DayDirezione = "uscita" | "entrata";

export type DayModuloOrigine =
  | "misure" | "preventivo" | "mail" | "commessa" | "ops"
  | "codice" | "contabilita" | "calendario" | "esterno";

export interface DayEvento {
  id: string;
  azienda_id: string;
  user_id: string;
  tipo: DayEventoTipo;
  modulo_origine: DayModuloOrigine;
  direzione: DayDirezione;
  cm_id?: string | null;
  task_id?: string | null;
  payload: Record<string, unknown>;
  durata_sec?: number | null;
  titolo_breve: string;
  contesto?: string | null;
  created_at: string;
}

export type DayProssimoColore = "verde" | "viola" | "teal" | "ambra" | "blu";

export interface DayWorkflow {
  step_now: number | null;
  step_total: number;        // 8
  pct: number | null;        // 0..100
  label: string | null;
  fase: string | null;
}

export interface DayProssimoStep {
  workflow?: DayWorkflow | null;
  azione: string;
  titolo: string;
  modulo: string | null;
  sub_modulo?: string;
  step?: string;
  cm_id: string | null;
  colore: DayProssimoColore;
  urgenza?: "alta" | "media" | "bassa";
  evento_origine?: string;
  allegato?: string;
}

export interface DayEventoInsert {
  tipo: DayEventoTipo;
  modulo_origine: DayModuloOrigine;
  direzione?: DayDirezione;
  cm_id?: string | null;
  task_id?: string | null;
  payload?: Record<string, unknown>;
  durata_sec?: number | null;
  titolo_breve: string;
  contesto?: string | null;
}

export interface DayStripItem {
  modulo_origine: DayModuloOrigine;
  ultimo_evento_id: string;
  ultimo_evento_tipo: DayEventoTipo;
  titolo_breve: string;
  contesto?: string | null;
  cm_id?: string | null;
  ultimo_at: string;
  attivo: boolean;
}

export interface DayStats {
  task_totali: number;
  task_fatti: number;
  ore_deep: number;
  cm_toccate: number;
}
