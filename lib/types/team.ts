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
  timer_label?: string;
  progress?: number;
  problem_title?: string;
  problem_reported_ago?: string;
  destination_label?: string;
  arrival_eta?: string;
  last_seen?: string;
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

// Palette esatta dai mockup HD
export const PAL = {
  pageBg: '#FFFFFF',
  card: '#FFFFFF',
  headerGrad: 'linear-gradient(160deg, #1F8B8B 0%, #176868 100%)',
  tabActive: '#0D1F1F',
  tabInactive: '#FFFFFF',
  tabInactiveText: '#0D1F1F',
  tabBorder: '#E5E0D6',
  text: '#0D1F1F',
  textSub: '#71717A',
  cardBorder: '#EAE6DE',
  teal: '#28A0A0',
  tealDark: '#176868',
  attivoBg: '#E8F5EC',
  pausaBg: '#FEF3C7',
  problemaBg: '#FFE4E1',
  viaggioBg: '#DBEAFE',
  fermoBg: '#FFEDD5',
  attivoDot: '#22C55E',
  pausaDot: '#F59E0B',
  problemaDot: '#EF4444',
  viaggioDot: '#3B82F6',
  fermoDot: '#F97316',
  offlineDot: '#9CA3AF',
  attivoText: '#16A34A',
  pausaText: '#D97706',
  problemaText: '#DC2626',
  viaggioText: '#2563EB',
  fermoText: '#EA580C',
  altaBg: '#FEE2E2', altaTx: '#DC2626',
  mediaBg: '#FEF3C7', mediaTx: '#D97706',
};

export const STATUS_INFO: Record<OperatorStatus, { dot: string; text: string; bg: string; tx: string }> = {
  attivo:   { dot: PAL.attivoDot,   text: 'Attivo ora', bg: PAL.attivoBg,   tx: PAL.attivoText },
  pausa:    { dot: PAL.pausaDot,    text: 'In pausa',   bg: PAL.pausaBg,    tx: PAL.pausaText },
  viaggio:  { dot: PAL.viaggioDot,  text: 'In viaggio', bg: PAL.viaggioBg,  tx: PAL.viaggioText },
  problema: { dot: PAL.problemaDot, text: 'Problema',   bg: PAL.problemaBg, tx: PAL.problemaText },
  offline:  { dot: PAL.offlineDot,  text: 'Offline',    bg: '#F3F4F6',      tx: '#4B5563' },
  fermo:    { dot: PAL.fermoDot,    text: 'Fermo',      bg: PAL.fermoBg,    tx: PAL.fermoText },
};

// Avatar foto reali via DiceBear (no auth, no API key)
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
