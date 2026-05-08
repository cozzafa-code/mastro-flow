// components/home-mobile/HomeUI.tsx
// UI primitives + design tokens fliwoX. v3 con Chip + SwipeTrack.

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { IconCheck, IconClock } from './HomeIcons'

export const T = {
  bg: '#94A3B8',           // body grigio acciaio medio
  card: '#FFFFFF',
  bdr: '#94A3B8',          // bordi grigio definito
  text: '#0A1628',         // testi forti
  muted: '#475A75',        // testi secondari
  acc: '#1E3A5F',          // accent navy opaco 50/20
  accDeep: '#0F1B2D',      // navy header top
  numTeal: '#065F46',      // verde scuro (success)
  numAmber: '#92400E',     // arancio scuro (warning)
  numRed: '#991B1B',       // rosso scuro (danger)
  numBlue: '#1E3A5F',      // blu navy (info)
  tealSoft: '#ECFDF5',
  amberSoft: '#FEF3C7',
  redSoft: '#FEE2E2',
  blueSoft: '#DBE6F1',
  graySoft: '#F1F5F9',
  shadow: '0 2px 8px rgba(15,23,42,0.18)',
  shadowLg: '0 4px 16px rgba(15,23,42,0.22)',
}

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


// ============================================================
// HOME STATE CONTEXT — opt-in per expand/collapse cards
// ============================================================
type HomeStateCtx = {
  isExpanded: (id: string) => boolean
  toggle: (id: string) => void
  expandAll: () => void
  collapseAll: () => void
  allIds: string[]
  expandedCount: number
  enabled: boolean
  editMode: boolean
  setEditMode: (v: boolean) => void
  registerDragStart: (handler: (e: React.PointerEvent, cardId: string) => void) => void
  triggerDragStart: (e: React.PointerEvent, cardId: string) => void
}
const HomeStateContext = createContext<HomeStateCtx>({
  isExpanded: () => true,
  toggle: () => {},
  expandAll: () => {},
  collapseAll: () => {},
  allIds: [],
  expandedCount: 0,
  enabled: false,
  editMode: false,
  setEditMode: () => {},
  registerDragStart: () => {},
  triggerDragStart: () => {},
})

export function useHomeState() {
  return useContext(HomeStateContext)
}

export function HomeStateProvider({
  children,
  defaultExpandedIds,
  allIds,
  onChange,
  editMode: editModeProp,
  setEditMode: setEditModeProp,
}: {
  children: React.ReactNode
  defaultExpandedIds?: string[]
  allIds?: string[]
  onChange?: (expanded: string[]) => void
  editMode?: boolean
  setEditMode?: (v: boolean) => void
}) {
  const [expanded, setExpanded] = useState<string[]>(defaultExpandedIds ?? [])
  const [editModeLocal, setEditModeLocal] = useState(false)
  const editMode = editModeProp ?? editModeLocal
  const setEditMode = setEditModeProp ?? setEditModeLocal

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const dragStartHandlerRef = useRef<((e: React.PointerEvent, cardId: string) => void) | null>(null)
  const registerDragStart = useCallback((handler: (e: React.PointerEvent, cardId: string) => void) => {
    dragStartHandlerRef.current = handler
  }, [])
  const triggerDragStart = useCallback((e: React.PointerEvent, cardId: string) => {
    dragStartHandlerRef.current?.(e, cardId)
  }, [])

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { onChangeRef.current?.(next) } catch {}
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const ids = allIds ?? []
    setExpanded(ids)
    try { onChangeRef.current?.(ids) } catch {}
  }, [allIds])

  const collapseAll = useCallback(() => {
    setExpanded([])
    try { onChangeRef.current?.([]) } catch {}
  }, [])

  const isExpanded = useCallback((id: string) => expanded.includes(id), [expanded])

  return (
    <HomeStateContext.Provider value={{
      isExpanded, toggle, expandAll, collapseAll,
      allIds: allIds ?? [],
      expandedCount: expanded.length,
      enabled: true,
      editMode, setEditMode,
      registerDragStart, triggerDragStart,
    }}>
      {children}
    </HomeStateContext.Provider>
  )
}

export function Card({
  children, cardId,
}: {
  children: React.ReactNode
  cardId?: string
}) {
  const ctx = useContext(HomeStateContext)
  const isEdit = ctx.enabled && ctx.editMode && !!cardId

  return (
    <div data-card-id={cardId} style={{
      background: T.card,
      border: isEdit ? `2px dashed ${T.acc}` : `1px solid ${T.bdr}`,
      borderRadius: 16, padding: 14, boxShadow: T.shadow,
      WebkitFontSmoothing: 'antialiased',
      animation: isEdit ? 'mastroWiggle 0.4s ease-in-out infinite alternate' : undefined,
      position: 'relative' as const,
      transition: 'border 0.2s ease',
    }}>
      {isEdit && (
        <div
          data-handle
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            ctx.triggerDragStart(e, cardId!)
          }}
          style={{
            position: 'absolute' as const,
            left: -8, top: '50%', transform: 'translateY(-50%)',
            width: 28, height: 28, borderRadius: 6,
            background: T.acc, color: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', touchAction: 'none' as const,
            boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
            zIndex: 10,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <circle cx={9} cy={6} r={1.5}/><circle cx={15} cy={6} r={1.5}/>
            <circle cx={9} cy={12} r={1.5}/><circle cx={15} cy={12} r={1.5}/>
            <circle cx={9} cy={18} r={1.5}/><circle cx={15} cy={18} r={1.5}/>
          </svg>
        </div>
      )}
      {children}
    </div>
  )
}

export function CardHeader({
  index, title, link, indexBg, onLink, cardId, summary,
}: {
  index: number
  title: string
  link?: string
  indexBg: string
  onLink?: () => void
  cardId?: string
  summary?: string
}) {
  const ctx = useContext(HomeStateContext)
  const useExpand = ctx.enabled && !!cardId
  const expanded = useExpand ? ctx.isExpanded(cardId!) : true

  const handleHeaderClick = useExpand && !ctx.editMode
    ? (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('[data-no-toggle]')) return
        if (target.closest('[data-handle]')) return
        ctx.toggle(cardId!)
      }
    : undefined

  return (
    <div
      onClick={handleHeaderClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: expanded ? 12 : 0,
        cursor: useExpand ? 'pointer' : 'default',
        userSelect: 'none' as const,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ background: indexBg, color: '#FFF', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>{index}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      {!expanded && summary && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: T.muted, background: T.graySoft,
          padding: '3px 8px', borderRadius: 6, marginRight: 8,
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>{summary}</span>
      )}
      {expanded && link && (
        <span data-no-toggle onClick={(e) => { e.stopPropagation(); onLink && onLink() }} style={{ fontSize: 11, color: T.acc, fontWeight: 600, cursor: onLink ? 'pointer' : 'default', flexShrink: 0 }}>
          {link} ›
        </span>
      )}
      {useExpand && (
        <svg
          width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke={T.acc} strokeWidth={2.5}
          style={{
            marginLeft: 8,
            transition: 'transform 0.25s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </div>
  )
}

export function CardBody({
  children, cardId,
}: {
  children: React.ReactNode
  cardId?: string
}) {
  const ctx = useContext(HomeStateContext)
  const visible = !ctx.enabled || !cardId || ctx.isExpanded(cardId)
  return (
    <div style={{
      maxHeight: visible ? 2000 : 0,
      overflow: 'hidden',
      transition: 'max-height 0.3s ease',
    }}>
      {children}
    </div>
  )
}

export function Kpi({
  value, label, statusColor, icon,
}: { value: number; label: string; statusColor?: string; icon?: 'check' | 'clock' }) {
  const numColor = statusColor ?? T.text
  return (
    <div style={{ background: '#F8FCFC', borderRadius: 12, padding: '14px 10px', textAlign: 'center', border: `1px solid ${T.bdr}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {icon === 'check' && <IconCheck color={numColor} size={16} />}
        {icon === 'clock' && <IconClock color={numColor} size={16} />}
        <span style={numStyle(28, numColor)}>{value}</span>
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export function Importo({
  value, label, variazione, alertSoft,
}: {
  value: number; label: string;
  variazione?: { delta: number; testo: string };
  alertSoft?: boolean;
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
    <div style={{ background: bg, color: fg, fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
      {text}
    </div>
  )
}

export function PillStatus({ text, kind }: { text: string; kind: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  const palette =
    kind === 'ok' ? { bg: T.tealSoft, fg: T.numTeal } :
    kind === 'warn' ? { bg: T.amberSoft, fg: T.numAmber } :
    kind === 'danger' ? { bg: T.redSoft, fg: T.numRed } :
    { bg: T.graySoft, fg: T.muted }
  return (
    <span style={{ background: palette.bg, color: palette.fg, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, letterSpacing: 0.3 }}>{text}</span>
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

// ============================================================
// CHIP — pillola tempo / stato in alto a destra di una swipe-card
// Variante v3: badge informativo per ogni item (tempo, durata, stato)
// ============================================================
export function Chip({
  text, kind = 'neutral',
}: {
  text: string
  kind?: 'neutral' | 'live' | 'warn' | 'alert' | 'info' | 'ok'
}) {
  const palette =
    kind === 'alert' ? { bg: T.redSoft, fg: T.numRed, bdr: '#FCA5A5' } :
    kind === 'warn'  ? { bg: T.amberSoft, fg: T.numAmber, bdr: '#FCD34D' } :
    kind === 'live'  ? { bg: T.tealSoft, fg: T.numTeal, bdr: '#6EE7B7' } :
    kind === 'ok'    ? { bg: T.tealSoft, fg: T.numTeal, bdr: '#6EE7B7' } :
    kind === 'info'  ? { bg: T.blueSoft, fg: T.numBlue, bdr: '#93B0CF' } :
                       { bg: '#FFF', fg: T.text, bdr: T.bdr }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: palette.bg, color: palette.fg,
      border: `1px solid ${palette.bdr}`,
      fontSize: 10, fontWeight: 600, padding: '4px 9px',
      borderRadius: 999, letterSpacing: 0.3, lineHeight: 1.2,
      WebkitFontSmoothing: 'antialiased' as const,
      whiteSpace: 'nowrap' as const,
    }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx={12} cy={12} r={10}/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      {text}
    </span>
  )
}

// ============================================================
// SWIPE TRACK — carosello orizzontale con scroll-snap + dots
// Mostra 1 card alla volta con peek prev/next per dare hint di altri item
// ============================================================
export function SwipeTrack({
  items, renderItem, emptyText, showDots = true,
}: {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  emptyText?: string
  showDots?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let raf: number | null = null
    const handler = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => {
        raf = null
        const cardW = el.clientWidth - 36 // peek 36px
        const idx = Math.round(el.scrollLeft / Math.max(1, cardW + 10))
        setActiveIdx(Math.min(items.length - 1, Math.max(0, idx)))
      })
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => {
      el.removeEventListener('scroll', handler)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [items.length])

  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    const cardW = el.clientWidth - 36
    el.scrollTo({ left: i * (cardW + 10), behavior: 'smooth' })
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '14px 8px', fontSize: 12, color: T.muted, textAlign: 'center' }}>
        {emptyText ?? 'Nessun elemento'}
      </div>
    )
  }

  return (
    <div>
      <div
        ref={trackRef}
        style={{
          display: 'flex', overflowX: 'auto',
          scrollSnapType: 'x mandatory' as const,
          WebkitOverflowScrolling: 'touch' as const,
          gap: 10, paddingBottom: 4,
          scrollbarWidth: 'none' as const,
        }}
        className="mastro-swipe-track"
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              flex: `0 0 calc(100% - 36px)`,
              scrollSnapAlign: 'start' as const,
            }}
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>
      {showDots && items.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 6, paddingTop: 10,
        }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Vai alla card ${i + 1}`}
              style={{
                width: i === activeIdx ? 18 : 6, height: 6,
                borderRadius: i === activeIdx ? 3 : '50%',
                background: i === activeIdx ? T.acc : '#CBD5E1',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
          <span style={{
            marginLeft: 8, fontSize: 10, color: T.muted, fontWeight: 600,
            letterSpacing: 0.4, fontVariantNumeric: 'tabular-nums' as const,
          }}>
            {String(activeIdx + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SwipeCard — wrapper standard per ogni item dentro SwipeTrack
// background grigio chiaro, padding, posizione relative per chip
// ============================================================
export function SwipeCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#F8FAFC',
      border: `1px solid ${T.graySoft}`,
      borderRadius: 14,
      padding: 14,
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 180,
      position: 'relative' as const,
      WebkitFontSmoothing: 'antialiased' as const,
    }}>
      {children}
    </div>
  )
}
