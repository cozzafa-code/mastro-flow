// ============================================================
// MASTRO — TimerLavoroMobile styles
// ============================================================

import type { CSSProperties } from 'react';
import { MC, MF, MS, MR, MP, sectionLabel } from '@/constants/design-system';

export const SM = {
  root: {
    minHeight: '100vh', background: MC.bg, color: MC.text,
    fontFamily: MF.ui, display: 'flex', flexDirection: 'column',
    boxSizing: 'border-box',
  } as CSSProperties,

  hero: {
    padding: '20px 20px 20px', background: MC.card,
    borderBottom: `1px solid ${MC.border}`,
    display: 'flex', alignItems: 'center', gap: 14,
  } as CSSProperties,
  heroText: { flex: 1, minWidth: 0 } as CSSProperties,
  heroLabel: { ...sectionLabel, marginBottom: 2 } as CSSProperties,
  heroName: { fontSize: 18, fontWeight: 600, color: MC.text } as CSSProperties,
  heroPill: {
    fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    padding: '5px 12px', borderRadius: MR.full,
    minWidth: 110, textAlign: 'center' as const,
    transition: 'background 0.2s, color 0.2s',
  } as CSSProperties,

  body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: MP.s4 } as CSSProperties,

  card: {
    background: MC.card, border: `1px solid ${MC.border}`,
    borderRadius: MR.xl, padding: 24,
    boxShadow: MS.card,
    display: 'flex', flexDirection: 'column', gap: MP.s4,
  } as CSSProperties,

  row: { display: 'flex', flexDirection: 'column', gap: 6 } as CSSProperties,
  rowLabel: { ...sectionLabel } as CSSProperties,
  rowSelect: {
    width: '100%', padding: '12px 14px', fontSize: 15,
    background: MC.card, color: MC.text,
    border: `1px solid ${MC.border}`, borderRadius: MR.md,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: MF.ui, boxShadow: MS.button,
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'><path fill=\'%2364748B\' d=\'M6 8L0 0h12z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
  } as CSSProperties,
  rowReadonly: {
    padding: '12px 14px', fontSize: 15, fontWeight: 500,
    background: MC.bgSubtle, color: MC.text,
    borderRadius: MR.md,
  } as CSSProperties,

  display: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '12px 0', transition: 'all 0.25s',
  } as CSSProperties,
  timerNum: {
    fontFamily: MF.mono, fontSize: 56, fontWeight: 600,
    letterSpacing: -2, lineHeight: 1, transition: 'color 0.25s',
  } as CSSProperties,
  timerNumPlaceholder: {
    fontFamily: MF.mono, fontSize: 56, fontWeight: 600,
    letterSpacing: -2, lineHeight: 1, color: MC.borderStrong, opacity: 0.7,
  } as CSSProperties,

  barWrap: { width: '100%', marginTop: 12 } as CSSProperties,
  barTrack: {
    width: '100%', height: 6, borderRadius: MR.full,
    background: MC.bgSubtle, overflow: 'hidden',
  } as CSSProperties,
  barFill: {
    height: '100%', borderRadius: MR.full,
    transition: 'width 0.5s, background 0.3s',
  } as CSSProperties,
  barInfo: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 11, marginTop: 6, color: MC.muted, fontWeight: 500,
  } as CSSProperties,

  ctaWrap: { display: 'flex', flexDirection: 'column', gap: MP.s3 } as CSSProperties,
  bigBtn: {
    width: '100%', padding: '22px 0', fontSize: 22,
    fontWeight: 700, letterSpacing: 1, color: '#fff',
    border: 'none', borderRadius: MR.xl, cursor: 'pointer',
    fontFamily: MF.ui, boxShadow: MS.buttonPrimary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    transition: 'background 0.2s',
  } as CSSProperties,
  secBtn: {
    width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 600,
    background: MC.card, border: `1px solid ${MC.border}`, color: MC.text,
    borderRadius: MR.lg, cursor: 'pointer',
    fontFamily: MF.ui, boxShadow: MS.button,
  } as CSSProperties,

  voceBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    background: MC.tealBg, border: `1px solid ${MC.tealSoft}`,
    borderRadius: MR.lg, fontSize: 12, color: MC.tealHover,
    fontWeight: 500, gap: 8,
  } as CSSProperties,
  voceLed: {
    width: 8, height: 8, borderRadius: MR.full, background: MC.success,
    animation: 'mastroBlink 1.2s infinite',
  } as CSSProperties,
  voceBtn: {
    border: `1px solid ${MC.tealDark}`,
    padding: '4px 12px', borderRadius: MR.full,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  err: {
    margin: `${MP.s3}px 20px 0`, padding: MP.s3,
    background: MC.dangerSoft, color: MC.danger,
    border: `1px solid ${MC.danger}`, borderRadius: MR.md, fontSize: 14,
  } as CSSProperties,

  loading: {
    minHeight: '100vh', background: MC.bg, fontFamily: MF.ui,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: MC.muted, fontSize: 14,
  } as CSSProperties,
};

export const KEYFRAMES = `@keyframes mastroBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }`;
