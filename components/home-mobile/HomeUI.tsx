// components/mobile/home/HomeUI.tsx
// UI primitives + design tokens fliwoX. v2: numeri nitidi (700, tabular, letter-spacing).

'use client'

import React from 'react'
import { IconCheck, IconClock } from './HomeIcons'

// palette fliwoX - colori desaturati dai token ufficiali
export const T = {
  // base
  bg: '#EEF8F8',
  card: '#FFFFFF',
  bdr: '#C8E4E4',
  text: '#0F2A2A',
  muted: '#6B8585',

  // accent teal (per bottoni primari, link, accenti)
  acc: '#0F766E',
  accDeep: '#0B5F58',

  // numeri / status (DESATURATI da palette fliwoX)
  numTeal: '#0F6E56',     // teal 600 - successo / positivo
  numAmber: '#854F0B',    // amber 800 - attenzione / waiting
  numRed: '#A32D2D',      // red 600 - critico / problema
  numBlue: '#185FA5',     // blue 600 - info / viaggio

  // soft fills (sfondi card secondarie, pills)
  tealSoft: '#E1F5EE',    // teal 50
  amberSoft: '#FAEEDA',   // amber 50
  redSoft: '#FCEBEB',     // red 50
  blueSoft: '#E6F1FB',    // blue 50
  graySoft: '#F1EFE8',

  // shadow
  shadow: '0 1px 2px rgba(15,118,110,0.04), 0 4px 12px rgba(15,118,110,0.06)',
  shadowLg: '0 4px 20px rgba(15,118,110,0.08)',
}

// ───────── number style (nitido) ─────────
// peso 700 (non 800), letter-spacing -0.02em, tabular numbers, antialiasing
export const numStyle = (size: number, color: string): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontFeatureSettings: '"tnum"',
  fontVariantNumeric: 'tabular-nums',
  color,
  lineHeight: 1,
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale' as const,
})

export const btnBaseStyle: React.CSSProperties = {
  border: 'none', borderRadius: 8, padding: '8px 12px',
  fontSize: 11, fontWeight: 600, cursor: 'pointer',
  letterSpacing: 0.3, height: 36,
}

// ───────── primitives ─────────

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.bdr}`,
      borderRadius: 16, padding: 14, boxShadow: T.shadow,
      WebkitFontSmoothing: 'antialiased',
    }}>
      {children}
    </div>
  )
}

export function CardHeader({
  index, title, link, indexBg,
}: { index: number; title: string; link?: string; indexBg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: indexBg, color: '#FFF',
          fontSize: 11, fontWeight: 700,
          padding: '3px 8px', borderRadius: 6,
        }}>{index}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 0.4 }}>{title}</span>
      </div>
      {link && <span style={{ fontSize: 11, color: T.acc, fontWeight: 600 }}>{link} ›</span>}
    </div>
  )
}

// KPI v2: numero dark + label + pill stato opzionale
export function Kpi({
  value, label, statusColor, icon,
}: {
  value: number
  label: string
  statusColor?: string  // se presente, accenta il numero (sobrio)
  icon?: 'check' | 'clock'
}) {
  const numColor = statusColor ?? T.text
  return (
    <div style={{
      background: '#F8FCFC', borderRadius: 12,
      padding: '14px 10px', textAlign: 'center',
      border: `1px solid ${T.bdr}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {icon === 'check' && <IconCheck color={numColor} size={16} />}
        {icon === 'clock' && <IconClock color={numColor} size={16} />}
        <span style={numStyle(28, numColor)}>{value}</span>
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// importo in stile finanziario: dark text grosso + label sopra + pill variazione
export function Importo({
  value, label, variazione, alertSoft,
}: {
  value: number
  label: string
  variazione?: { delta: number; testo: string } // es. { delta: 12, testo: 'vs ieri' }
  alertSoft?: boolean // se true, stile attesa pagamento (no enfasi rosso, sobrio)
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={numStyle(26, alertSoft ? T.numAmber : T.text)}>
          € {value.toLocaleString('it-IT')}
        </span>
        {variazione && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: variazione.delta >= 0 ? T.numTeal : T.numRed,
            background: variazione.delta >= 0 ? T.tealSoft : T.redSoft,
            padding: '2px 8px', borderRadius: 6,
          }}>
            {variazione.delta >= 0 ? '↑' : '↓'} {Math.abs(variazione.delta)}% {variazione.testo}
          </span>
        )}
      </div>
    </div>
  )
}

export function Pill({
  bg, fg, dot, text,
}: { bg: string; fg: string; dot?: string; text: string }) {
  return (
    <div style={{
      background: bg, color: fg,
      fontSize: 11, fontWeight: 600,
      padding: '5px 10px', borderRadius: 999,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
      {text}
    </div>
  )
}

// pill stato compatta (per tag IN LAVORAZIONE / FERMO ecc)
export function PillStatus({ text, kind }: { text: string; kind: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  const palette =
    kind === 'ok' ? { bg: T.tealSoft, fg: T.numTeal } :
    kind === 'warn' ? { bg: T.amberSoft, fg: T.numAmber } :
    kind === 'danger' ? { bg: T.redSoft, fg: T.numRed } :
    { bg: T.graySoft, fg: T.muted }
  return (
    <span style={{
      background: palette.bg, color: palette.fg,
      fontSize: 10, fontWeight: 700,
      padding: '4px 8px', borderRadius: 6,
      letterSpacing: 0.3,
    }}>{text}</span>
  )
}

export function Avatar({
  text, bg, size,
}: { text: string; bg: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#FFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
      WebkitFontSmoothing: 'antialiased',
    }}>{text}</div>
  )
}

export function BtnPrimary({ label, small, onClick }: { label: string; small?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      ...btnBaseStyle, background: T.acc, color: '#FFF',
      padding: small ? '4px 10px' : '8px 12px',
      fontSize: small ? 10 : 11, height: small ? 28 : 36,
    }}>{label}</button>
  )
}

export function BtnSecondary({ label, small, onClick }: { label: string; small?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      ...btnBaseStyle, background: '#FFF', color: T.text,
      border: `1px solid ${T.bdr}`,
      padding: small ? '4px 10px' : '8px 12px',
      fontSize: small ? 10 : 11, height: small ? 28 : 36,
    }}>{label}</button>
  )
}

export function BtnFull({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', marginTop: 12,
      background: '#FFF', border: `1px solid ${T.bdr}`,
      borderRadius: 12, padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer',
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.text, letterSpacing: 0.3 }}>{label}</span>
      <span style={{ color: T.acc, fontWeight: 700 }}>›</span>
    </button>
  )
}

export function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  )
}
