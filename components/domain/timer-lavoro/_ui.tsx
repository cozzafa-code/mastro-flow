'use client';

// ============================================================
// MASTRO — UI Kit (componenti riusabili da tutti i moduli)
// ============================================================

import type { CSSProperties, ReactNode } from 'react';
import { MC, MF, MS, MR, MP, cardStyle, sectionLabel } from '@/constants/design-system';

// ---------------------------------------------------------------
// Card
// ---------------------------------------------------------------
export function MastroCard({
  children,
  padding = MP.s6,
  elevated = false,
  style,
}: {
  children: ReactNode;
  padding?: number | string;
  elevated?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...cardStyle(elevated), padding, ...style }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------
// SectionLabel — etichetta maiuscoletta MASTRO
// ---------------------------------------------------------------
export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...sectionLabel, ...style }}>{children}</div>;
}

// ---------------------------------------------------------------
// KpiCard — usato in tutte le control room
// ---------------------------------------------------------------
export function KpiCard({
  label,
  value,
  sub,
  accent = false,
  variant = 'neutral',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
  variant?: 'neutral' | 'teal' | 'warn' | 'danger' | 'success';
}) {
  const variantColor = {
    neutral: MC.text,
    teal: MC.tealDark,
    warn: MC.warn,
    danger: MC.danger,
    success: MC.success,
  }[variant];
  return (
    <div style={{ ...cardStyle(false), padding: MP.s5 }}>
      <div style={sectionLabel}>{label}</div>
      <div
        style={{
          fontFamily: MF.mono,
          fontSize: 30,
          fontWeight: 600,
          color: accent ? variantColor : variantColor,
          marginTop: 8,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: MC.muted, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Topbar MASTRO — usato in tutte le pagine
// ---------------------------------------------------------------
export function MastroTopbar({
  breadcrumb,
  right,
}: {
  breadcrumb?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: MC.topbar,
        color: MC.topbarText,
        fontFamily: MF.ui,
        boxShadow: MS.topbar,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.5 }}>MASTRO</div>
        {breadcrumb && (
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>
            {breadcrumb}
          </div>
        )}
      </div>
      {right && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{right}</div>}
    </div>
  );
}

// ---------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------
export function MastroEmpty({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: MC.muted,
        fontFamily: MF.ui,
      }}
    >
      {icon && <div style={{ marginBottom: 12, opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontSize: 14, fontWeight: 500, color: MC.textSoft }}>{title}</div>
      {hint && <div style={{ fontSize: 13, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ---------------------------------------------------------------
// Avatar operatore (cerchio con iniziali)
// ---------------------------------------------------------------
export function OperatoreAvatar({
  nome,
  size = 32,
  color,
}: {
  nome: string | null;
  size?: number;
  color?: string;
}) {
  const initials = (nome ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: MR.full,
        background: color ?? MC.tealSoft,
        color: color ? '#fff' : MC.tealDark,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.4),
        fontWeight: 600,
        fontFamily: MF.ui,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
