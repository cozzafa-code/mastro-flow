// lib/types/team.ts

export type OperatorStatus = 'attivo' | 'pausa' | 'viaggio' | 'problema' | 'offline' | 'fermo';

export interface Operator {
  id: string;
  name: string;
  avatar_url?: string;
  status: OperatorStatus;
  position_label?: string;
  current_job?: string;
  commessa_id?: string;
  commessa_code?: string;
  cliente?: string;
  team_id?: string;
  timer_label?: string;        // "2h 15m" / "Pausa da 25m" / "Arrivo 14:30"
  progress?: number;            // 0-100
  problem_title?: string;
  problem_reported_ago?: string; // "10m fa"
  destination_label?: string;
  arrival_eta?: string;
  last_seen?: string;
  phone?: string;
  fermo_minutes?: number;
  lat?: number;
  lng?: number;
}

export interface Team {
  id: string;
  name: string;
  members: string[];           // operator names
  member_ids: string[];
  current_job?: string;        // "Cantiere Rossi"
  status_label?: string;       // "2 attivi" / "1 problema"
  problem_count: number;
  active_count: number;
  progress: number;            // 0-100
  capo_id?: string;
}

export interface TeamProblem {
  id: string;
  title: string;
  commessa_id?: string;
  commessa_label?: string;     // "S-0001 · Verdi"
  ordine_label?: string;       // "Ordine 9131G · Produzione"
  reported_by: string;
  reported_at: string;          // ISO
  reported_ago: string;         // "10m fa"
  priority: 'alta' | 'media' | 'bassa';
  status: 'aperto' | 'risolto' | 'in_lavorazione';
  blocca_cantiere?: boolean;
}

export interface WorkSession {
  id: string;
  operator_id: string;
  commessa_id: string;
  commessa_code?: string;
  phase: string;                // "Montaggio" / "Produzione" / etc
  sub_phase?: string;
  started_at: string;           // ISO
  paused_at?: string | null;
  ended_at?: string | null;
  status: 'running' | 'paused' | 'stopped' | 'completed';
  progress: number;             // 0-100
}

export interface TeamTask {
  id: string;
  operator_id: string;
  operator_name?: string;
  commessa_id?: string;
  commessa_code?: string;
  title: string;
  priority: 'alta' | 'media' | 'bassa';
  due_date?: string;            // ISO date
  due_time?: string;            // "HH:mm"
  notes?: string;
  status: 'aperto' | 'in_corso' | 'completato';
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  operator_id: string;
  time: string;                 // "08:30"
  type: 'partenza' | 'arrivo' | 'inizio_lavoro' | 'pausa' | 'ripresa' | 'foto' | 'problema' | 'completamento' | 'previsto';
  label: string;
  detail?: string;
  photo_url?: string;
}

// === COLORI STATO ===
export const STATUS_COLORS: Record<OperatorStatus, { dot: string; bgPastel: string; text: string; tag: string }> = {
  attivo:   { dot: '#22C55E', bgPastel: '#DCFCE7', text: 'Attivo ora',    tag: '#15803D' },
  pausa:    { dot: '#F59E0B', bgPastel: '#FEF3C7', text: 'In pausa',      tag: '#B45309' },
  viaggio:  { dot: '#3B82F6', bgPastel: '#DBEAFE', text: 'In viaggio',    tag: '#1D4ED8' },
  problema: { dot: '#EF4444', bgPastel: '#FEE2E2', text: 'Problema',      tag: '#B91C1C' },
  offline:  { dot: '#9CA3AF', bgPastel: '#F3F4F6', text: 'Offline',       tag: '#4B5563' },
  fermo:    { dot: '#F97316', bgPastel: '#FFEDD5', text: 'Fermo',         tag: '#C2410C' },
};

// === THEME fliwoX ===
export const TT = {
  card: '#FFFFFF',
  bg: '#FBF8F3',          // sfondo chiaro caldo
  bdr: '#E8E4DC',
  text: '#0D1F1F',
  sub: '#71717A',
  acc: '#28A0A0',         // teal
  accDark: '#0D7C6B',
  headerGrad: 'linear-gradient(160deg, #1F8B8B 0%, #176868 60%, #0F4040 100%)',
};
