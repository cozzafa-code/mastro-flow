// ============================================================
// MASTRO — TimerLavoro design tokens
// Light Google-style. UN solo file per i colori. Modifica qui.
// ============================================================

import type { CSSProperties } from 'react';

export const C = {
  // Sfondi
  bg:        '#F8FAFC',  // pagina
  card:      '#FFFFFF',  // superficie
  bgSubtle:  '#F1F5F9',  // hover/selezione leggera
  bgSoft:    '#F8FAFC',  // alternato

  // Bordi
  border:    '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Testo
  text:      '#0F172A',
  textSoft:  '#334155',
  muted:     '#64748B',
  mutedSoft: '#94A3B8',

  // Accenti MASTRO (skill v1.0)
  teal:      '#14B8A6',  // logo/accent
  tealDark:  '#0F766E',  // bottone primario
  tealHover: '#115E59',
  tealSoft:  '#CCFBF1',  // background pill attivo

  // Stati
  success:   '#16A34A',
  successSoft: '#DCFCE7',
  warn:      '#D97706',
  warnSoft:  '#FEF3C7',
  danger:    '#DC2626',
  dangerSoft: '#FEE2E2',
  info:      '#3B7FE0',
  infoSoft:  '#DBEAFE',

  // Topbar
  topbar:    '#0B1F2A',
};

export const FONT = {
  ui:  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

export const SHADOW = {
  // Soft Google-style (no ombre 3D pesanti)
  card:       '0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)',
  cardHover:  '0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.06)',
  button:     '0 1px 2px 0 rgba(15,23,42,0.05)',
  buttonPrimary: '0 1px 2px 0 rgba(15,118,110,0.20)',
  modal:      '0 25px 50px -12px rgba(15,23,42,0.25)',
};

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Helper: pill di stato
export const stateBadge = (variant: 'attivo' | 'da_approvare' | 'approvato'): CSSProperties => {
  const map = {
    attivo: { color: C.tealDark, background: C.tealSoft },
    da_approvare: { color: C.warn, background: C.warnSoft },
    approvato: { color: C.success, background: C.successSoft },
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: RADIUS.sm,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    ...map[variant],
  };
};
