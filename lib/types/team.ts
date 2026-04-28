// lib/types/team.ts - palette ESATTA dalla specifica pixel-perfect
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
  timer_label?: string;
  progress?: number;
  problem_title?: string;
  problem_reported_ago?: string;
  destination_label?: string;
  arrival_eta?: string;
  phone?: string;
  fermo_minutes?: number;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
  member_ids: string[];
  current_job?: string;
  status_label?: string;
  problem_count: number;
  active_count: number;
  progress: number;
}

export interface TeamProblem {
  id: string;
  title: string;
  commessa_id?: string;
  commessa_label?: string;
  ordine_label?: string;
  reported_by: string;
  reported_at: string;
  reported_ago: string;
  priority: 'Alta' | 'Media' | 'Bassa';
  status: 'aperto' | 'risolto';
}

export interface TimelineEvent {
  id: string;
  operator_id: string;
  time: string;
  type: 'partenza' | 'arrivo' | 'inizio_lavoro' | 'pausa' | 'ripresa' | 'foto' | 'previsto';
  label: string;
  detail?: string;
  has_photo?: boolean;
}

// PALETTE ESATTA SPEC
export const PAL = {
  // Gradient header
  gradStart: '#1F8B8B',
  gradEnd: '#176868',
  headerGrad: 'linear-gradient(160deg, #1F8B8B 0%, #176868 100%)',
  // Base
  dark: '#0D1F1F',
  pageBg: '#F5F1EA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  // Text
  text: '#0F172A',
  textGrey: '#64748B',
  textBody2: '#64748B',
  // Status colors
  attivoGreen: '#22C55E',
  warningOrange: '#F59E0B',
  errorRed: '#EF4444',
  infoBlue: '#3B82F6',
  pauseYellow: '#FACC15',
  // Pastel backgrounds (specifica: pastelli per stati)
  attivoBg: '#E8F5EC',     // verde menta chiarissimo
  pausaBg: '#FEF3C7',      // giallo crema
  problemaBg: '#FFE4E1',   // rosa pastello
  viaggioBg: '#DBEAFE',    // azzurro chiaro
  // Stato testo (più scuro)
  attivoText: '#16A34A',
  pausaText: '#D97706',
  problemaText: '#DC2626',
  viaggioText: '#2563EB',
  // Priorità
  altaBg: '#FEE2E2', altaTx: '#DC2626',
  mediaBg: '#FEF3C7', mediaTx: '#D97706',
  // Tab pill
  pillActive: '#0D1F1F',
  pillInactiveBg: '#FFFFFF',
};

export const STATUS_INFO: Record<OperatorStatus, { dot: string; text: string; bg: string; tx: string }> = {
  attivo:   { dot: PAL.attivoGreen,   text: 'Attivo ora', bg: PAL.attivoBg,   tx: PAL.attivoText },
  pausa:    { dot: PAL.warningOrange, text: 'In pausa',   bg: PAL.pausaBg,    tx: PAL.pausaText },
  viaggio:  { dot: PAL.infoBlue,      text: 'In viaggio', bg: PAL.viaggioBg,  tx: PAL.viaggioText },
  problema: { dot: PAL.errorRed,      text: 'Problema',   bg: PAL.problemaBg, tx: PAL.problemaText },
  offline:  { dot: '#9CA3AF',          text: 'Offline',    bg: '#F3F4F6',      tx: '#4B5563' },
  fermo:    { dot: '#F97316',          text: 'Fermo',      bg: '#FFEDD5',      tx: '#EA580C' },
};

// Avatar URL via DiceBear (foto stile uomini)
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
