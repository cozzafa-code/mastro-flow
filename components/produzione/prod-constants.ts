export const PROD_COLORS = {
  navy: '#1B3A5C',
  teal: '#28A0A0',
  amber: '#E8B05C',
  red: '#C73E1D',
  green: '#0F6E56',
  bgPage: '#EEF8F8',
  bgCard: '#FFFFFF',
  borderSoft: '#C8E4E4',
  textDim: '#6B7280',
  amberBg: '#FBF0DC',
  amberText: '#B07820',
  redBg: '#FCEBEB',
  greenBg: '#E1F5EE',
  tealLight: '#9FE1CB',
} as const

export const FASE_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  '#3B82F6': { bg: PROD_COLORS.teal, text: '#FFFFFF' },
  '#F59E0B': { bg: PROD_COLORS.amber, text: '#FFFFFF' },
  '#14B8A6': { bg: PROD_COLORS.red, text: '#FFFFFF' },
  '#8B5CF6': { bg: '#8B5CF6', text: '#FFFFFF' },
  '#10B981': { bg: PROD_COLORS.green, text: '#FFFFFF' },
  '#6B7280': { bg: PROD_COLORS.navy, text: '#FFFFFF' },
}

export function getFaseColor(dbHex: string): { bg: string; text: string } {
  return FASE_COLOR_MAP[dbHex] || { bg: PROD_COLORS.navy, text: '#FFFFFF' }
}

export const STATO_LABEL: Record<string, string> = {
  pianificato: 'IN CODA',
  in_corso: 'IN CORSO',
  in_pausa: 'PAUSA',
  completato: 'COMPLETATO',
  bloccato: 'BLOCCATO',
  annullato: 'ANNULLATO',
}

export const STATO_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  pianificato: { bg: '#F1EFE8', text: '#5F5E5A', border: '#B4B2A9' },
  in_corso:    { bg: PROD_COLORS.teal, text: '#FFFFFF', border: PROD_COLORS.teal },
  in_pausa:    { bg: PROD_COLORS.amberBg, text: PROD_COLORS.amberText, border: PROD_COLORS.amber },
  completato:  { bg: PROD_COLORS.greenBg, text: PROD_COLORS.green, border: PROD_COLORS.green },
  bloccato:    { bg: PROD_COLORS.red, text: '#FFFFFF', border: PROD_COLORS.red },
  annullato:   { bg: '#F1EFE8', text: '#5F5E5A', border: '#B4B2A9' },
}
