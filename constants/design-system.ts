// ============================================================
// MASTRO — Design System (light Google-style, IMMUTABILE)
// File unico. Tutti i moduli importano da qui.
// ============================================================

import type { CSSProperties } from 'react';

// ---------------------------------------------------------------
// COLORI
// ---------------------------------------------------------------
export const MC = {
  // Sfondi
  bg:         '#F8FAFC',  // pagina
  bgSubtle:   '#F1F5F9',  // hover/selezione
  bgSoft:     '#FAFBFC',  // alternato/header tabelle
  card:       '#FFFFFF',  // superficie elevata

  // Bordi
  border:     '#E2E8F0',
  borderSoft: '#EEF2F6',
  borderStrong: '#CBD5E1',

  // Testo
  text:       '#0F172A',  // primario
  textSoft:   '#334155',  // secondario
  muted:      '#64748B',  // labels, meta
  mutedSoft:  '#94A3B8',  // disabled

  // Accenti MASTRO
  teal:       '#14B8A6',  // logo, accent leggero
  tealDark:   '#0F766E',  // bottoni primari, link
  tealHover:  '#115E59',  // hover bottoni primari
  tealSoft:   '#CCFBF1',  // sfondo pill attivo
  tealBg:     '#F0FDFA',  // sfondo card teal

  // Topbar (unica eccezione dark — solo barra alta)
  topbar:     '#0B1F2A',
  topbarText: '#FFFFFF',

  // Stati
  success:      '#16A34A',
  successSoft:  '#DCFCE7',
  warn:         '#D97706',
  warnSoft:     '#FEF3C7',
  danger:       '#DC2626',
  dangerSoft:   '#FEE2E2',
  info:         '#3B7FE0',
  infoSoft:     '#DBEAFE',
};

// ---------------------------------------------------------------
// FONT
// ---------------------------------------------------------------
export const MF = {
  ui:   'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

// ---------------------------------------------------------------
// OMBRE Google-style
// ---------------------------------------------------------------
export const MS = {
  card:       '0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)',
  cardHover:  '0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.06)',
  cardElev:   '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.05)',
  button:     '0 1px 2px 0 rgba(15,23,42,0.05)',
  buttonPrimary: '0 1px 3px 0 rgba(15,118,110,0.30), 0 1px 2px 0 rgba(15,118,110,0.20)',
  modal:      '0 25px 50px -12px rgba(15,23,42,0.25)',
  topbar:     '0 1px 3px 0 rgba(0,0,0,0.10)',
};

// ---------------------------------------------------------------
// RADIUS
// ---------------------------------------------------------------
export const MR = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999,
};

// ---------------------------------------------------------------
// SPACING (ricalca Tailwind in pixel — usabile in CSS inline)
// ---------------------------------------------------------------
export const MP = {
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32, s10: 40, s12: 48,
};

// ---------------------------------------------------------------
// MIXIN: card MASTRO base
// ---------------------------------------------------------------
export const cardStyle = (elevated = false): CSSProperties => ({
  background: MC.card,
  border: `1px solid ${MC.border}`,
  borderRadius: MR.lg,
  boxShadow: elevated ? MS.cardElev : MS.card,
});

// ---------------------------------------------------------------
// MIXIN: badge stato (uso unificato MASTRO)
// ---------------------------------------------------------------
export const stateBadge = (
  variant: 'attivo' | 'pending' | 'success' | 'warn' | 'danger' | 'info'
): CSSProperties => {
  const map = {
    attivo:  { color: MC.tealDark, background: MC.tealSoft },
    pending: { color: MC.warn,     background: MC.warnSoft },
    success: { color: MC.success,  background: MC.successSoft },
    warn:    { color: MC.warn,     background: MC.warnSoft },
    danger:  { color: MC.danger,   background: MC.dangerSoft },
    info:    { color: MC.info,     background: MC.infoSoft },
  };
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 9px',
    borderRadius: MR.full,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    ...map[variant],
  };
};

// ---------------------------------------------------------------
// MIXIN: bottone primario MASTRO
// ---------------------------------------------------------------
export const btnPrimary = (size: 'md' | 'lg' | 'xl' = 'md'): CSSProperties => {
  const sizes = {
    md: { padding: '10px 18px', fontSize: 14 },
    lg: { padding: '14px 24px', fontSize: 16 },
    xl: { padding: '20px 32px', fontSize: 18 },
  };
  return {
    background: MC.tealDark,
    color: '#fff',
    border: 'none',
    borderRadius: MR.md,
    fontWeight: 600,
    fontFamily: MF.ui,
    cursor: 'pointer',
    boxShadow: MS.buttonPrimary,
    transition: 'background 0.15s, transform 0.05s',
    ...sizes[size],
  };
};

// ---------------------------------------------------------------
// MIXIN: bottone secondario (contorno)
// ---------------------------------------------------------------
export const btnSecondary = (size: 'md' | 'lg' = 'md'): CSSProperties => {
  const sizes = {
    md: { padding: '10px 18px', fontSize: 14 },
    lg: { padding: '14px 24px', fontSize: 16 },
  };
  return {
    background: MC.card,
    color: MC.text,
    border: `1px solid ${MC.border}`,
    borderRadius: MR.md,
    fontWeight: 600,
    fontFamily: MF.ui,
    cursor: 'pointer',
    boxShadow: MS.button,
    transition: 'background 0.15s',
    ...sizes[size],
  };
};

// ---------------------------------------------------------------
// MIXIN: label maiuscoletto MASTRO
// ---------------------------------------------------------------
export const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: MC.muted,
};

// ---------------------------------------------------------------
// MIXIN: input/select MASTRO base
// ---------------------------------------------------------------
export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  background: MC.card,
  color: MC.text,
  border: `1px solid ${MC.border}`,
  borderRadius: MR.md,
  outline: 'none',
  fontFamily: MF.ui,
  boxSizing: 'border-box',
  boxShadow: MS.button,
};
