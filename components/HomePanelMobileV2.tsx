// HomePanelMobileV2 - Home titolare mobile
// Header navy + card collassabili + modalita Riordina con drag & drop

'use client'

import React, { useState, createContext, useContext, useRef, useEffect } from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import * as UI from './home-mobile/HomeUI'
import { IconCalendar, IconMenu } from './home-mobile/HomeIcons'
import {
  CardOggiOperativo, CardTeamLive, CardCommesseCritiche, CardProblemi,
  CardAgendaLive, CardProduzione, CardCaricoLavoro, CardCassa,
  CardOperatoreFermo, CardAzioniRapide,
} from './home-mobile/HomeWidgets'
import { useMastro } from './MastroContext'

const DEFAULT_ORDER = [
  'oggi-operativo','team-live','commesse-critiche','problemi','agenda-live',
  'produzione','carico-lavoro','cassa','operatore-fermo','azioni-rapide',
]

// ============================================================
// EditModeContext: condivide editMode tra Header e cards senza prop drilling
// ============================================================
type EditCtx = { editMode: boolean; startDrag: (e: React.PointerEvent, id: string) => void }
const EditModeContext = createContext<EditCtx>({ editMode: false, startDrag: () => {} })
export const useEditMode = () => useContext(EditModeContext)

export default function HomePanelMobileV2(props: any) {
  const { data } = useHomeMobile()
  const palette = UI.T

  const [editMode, setEditMode] = useState(false)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [expanded, setExpanded] = useState<string[]>(['oggi-operativo'])

  // ═══ PERSISTENZA: carica da localStorage al mount ═══
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedOrder = localStorage.getItem('mastro_home_order')
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantisce che tutti i widget DEFAULT siano presenti (per nuovi widget aggiunti dopo)
          const merged = [...parsed, ...DEFAULT_ORDER.filter(id => !parsed.includes(id))]
          setOrder(merged)
        }
      }
      const savedExp = localStorage.getItem('mastro_home_expanded')
      if (savedExp) {
        const parsedExp = JSON.parse(savedExp)
        if (Array.isArray(parsedExp)) setExpanded(parsedExp)
      }
    } catch (e) { console.warn('[home] errore caricamento preferenze:', e) }
  }, [])

  // Salva ordine quando cambia
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem('mastro_home_order', JSON.stringify(order)) } catch {}
  }, [order])

  // Salva expanded quando cambia
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem('mastro_home_expanded', JSON.stringify(expanded)) } catch {}
  }, [expanded])

  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const goto = (tab: string) => {
    if (ctx?.setTab) ctx.setTab(tab)
    else if (props?.onNavigate) props.onNavigate(tab)
  }
  const apriCommessa = (id: string) => {
    if (ctx?.setSelectedCM) ctx.setSelectedCM(id)
    goto('commesse')
  }
  const apriSettings = () => goto('settings')

  const toggleCard = (id: string) => {
    if (editMode) return
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // ============================================================
  // DRAG & DROP semplice via pointer events
  // ============================================================
  const dragState = useRef<{ id: string; el: HTMLElement; offsetY: number; placeholder: HTMLElement } | null>(null)

  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const handleEl = e.currentTarget as HTMLElement
    const cardEl = handleEl.closest('[data-card-id]') as HTMLElement
    if (!cardEl) return
    const container = cardEl.parentElement
    if (!container) return

    const rect = cardEl.getBoundingClientRect()
    const placeholder = document.createElement('div')
    placeholder.style.cssText = `height: ${rect.height}px; background: rgba(30,58,95,0.08); border: 2px dashed #1E3A5F; border-radius: 16px;`
    container.insertBefore(placeholder, cardEl)

    cardEl.style.position = 'fixed'
    cardEl.style.zIndex = '1000'
    cardEl.style.width = `${rect.width}px`
    cardEl.style.left = `${rect.left}px`
    cardEl.style.top = `${rect.top}px`
    cardEl.style.pointerEvents = 'none'
    cardEl.style.opacity = '0.9'
    cardEl.style.transform = 'scale(0.97)'
    cardEl.style.boxShadow = '0 12px 32px rgba(15,23,42,0.4)'

    dragState.current = { id, el: cardEl, offsetY: e.clientY - rect.top, placeholder }

    document.body.style.userSelect = 'none'
    document.body.style.touchAction = 'none'

    const handleMove = (ev: PointerEvent) => {
      const ds = dragState.current
      if (!ds) return
      ds.el.style.top = `${ev.clientY - ds.offsetY}px`

      const others = Array.from(container.querySelectorAll<HTMLElement>('[data-card-id]')).filter(c => c !== ds.el)
      let inserted = false
      for (const c of others) {
        const r = c.getBoundingClientRect()
        if (ev.clientY < r.top + r.height / 2) {
          if (ds.placeholder.nextSibling !== c) container.insertBefore(ds.placeholder, c)
          inserted = true
          break
        }
      }
      if (!inserted && others.length > 0) {
        const last = others[others.length - 1]
        if (ds.placeholder.previousSibling !== last) container.insertBefore(ds.placeholder, last.nextSibling)
      }
    }

    const handleUp = () => {
      const ds = dragState.current
      if (!ds) return
      ds.placeholder.parentNode?.insertBefore(ds.el, ds.placeholder)
      ds.placeholder.remove()

      // FIX: rimuovo solo gli style che HO IMPOSTATO (non cssText) cosi React mantiene il controllo
      ds.el.style.position = ''
      ds.el.style.zIndex = ''
      ds.el.style.width = ''
      ds.el.style.left = ''
      ds.el.style.top = ''
      ds.el.style.pointerEvents = ''
      ds.el.style.opacity = ''
      ds.el.style.transform = ''
      ds.el.style.boxShadow = ''

      const newOrder = Array.from(container.querySelectorAll<HTMLElement>('[data-card-id]'))
        .map(c => c.dataset.cardId!)
        .filter(Boolean)

      // FIX: aggiorno state DOPO aver pulito DOM, e restoro l'ordine via React (non via DOM hack)
      // Il DOM tornera in linea con state alla prossima render
      setOrder(newOrder)

      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
      dragState.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
  }

  const renderCard = (id: string) => {
    const isExp = expanded.includes(id)
    const wrap = (children: React.ReactNode) => (
      <CardWrapper key={id} cardId={id} editMode={editMode} expanded={isExp} onToggle={() => toggleCard(id)}>
        {children}
      </CardWrapper>
    )
    switch (id) {
      case 'oggi-operativo': return wrap(
        <CardOggiOperativo
          lavori={data.oggi.lavori} task={data.oggi.task}
          problemi={data.oggi.problemi} attivita={data.oggi.attivita}
          onVedi={() => goto('agenda')}
        />
      )
      case 'team-live': return wrap(
        <CardTeamLive
          operatori={data.team.operatori} attivi={data.team.attivi}
          problemi={data.team.problemi} onApri={() => goto('team')}
        />
      )
      case 'commesse-critiche': return wrap(
        <CardCommesseCritiche commesse={data.commesse} onApri={apriCommessa} />
      )
      case 'problemi': return wrap(
        <CardProblemi problemi={data.problemi} onApri={() => goto('problemi')} />
      )
      case 'agenda-live': return wrap(
        <CardAgendaLive
          giorni={data.agenda.giorni} eventi={data.agenda.eventi}
          onApri={() => goto('agenda')}
        />
      )
      case 'produzione': return wrap(
        <CardProduzione
          ordini={data.produzione.ordini} inCorso={data.produzione.in_corso}
          fermi={data.produzione.fermi} onApri={() => goto('produzione')}
        />
      )
      case 'carico-lavoro': return wrap(
        <CardCaricoLavoro settimana={data.carico.settimana} onApri={() => goto('agenda')} />
      )
      case 'cassa': return wrap(
        <CardCassa soldi={data.soldi} onApri={() => goto('contabilita')} />
      )
      case 'operatore-fermo': return wrap(
        data.operatore_fermo ? (
          <CardOperatoreFermo op={data.operatore_fermo} onApri={() => goto('team')} />
        ) : (
          <div style={{ padding: '20px 14px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ background: '#92400E', color: '#FFF', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>9</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1628', letterSpacing: 0.4 }}>OPERATORE FERMO</span>
            </div>
            <div style={{ fontSize: 13, color: '#065F46', fontWeight: 600, marginTop: 12 }}>Tutti operativi</div>
            <div style={{ fontSize: 11, color: '#475A75', marginTop: 4 }}>Nessun operatore fermo al momento</div>
          </div>
        )
      )
      case 'azioni-rapide': return wrap(
        <CardAzioniRapide
          onTask={() => goto('team')} onCommessa={() => goto('commesse')}
          onMappa={() => goto('team')} onFoto={() => goto('commesse')}
          onFirma={() => goto('contabilita')} onPreventivo={() => goto('preventivi')}
        />
      )
      default: return null
    }
  }

  return (
    <EditModeContext.Provider value={{ editMode, startDrag }}>
      <div style={{ background: palette.bg, minHeight: '100vh', paddingBottom: 110 }}>
        <Header
          user={data.user} palette={palette}
          onMenu={apriSettings}
          editMode={editMode}
          onToggleEdit={() => setEditMode(v => !v)}
        />
        <PriorityBanner data={data} onClick={() => goto('agenda')} />
        <StatsGrid data={data} ctx={ctx} onTab={goto} />
        <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {order.map(id => renderCard(id))}

        </div>
      </div>
    </EditModeContext.Provider>
  )
}

// ============================================================
// CardWrapper: gestisce edit mode (wiggle + drag handle) + collapse
// ============================================================
function CardWrapper({
  cardId, editMode, expanded, onToggle, children,
}: {
  cardId: string
  editMode: boolean
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const { startDrag } = useEditMode()

  return (
    <div
      data-card-id={cardId}
      style={{
        background: '#FFFFFF',
        border: editMode ? '2px dashed #1E3A5F' : '1px solid #94A3B8',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
        position: 'relative',
        animation: editMode ? 'mastroWiggle 0.4s ease-in-out infinite alternate' : undefined,
        transition: 'border 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {editMode && (
        <div
          onPointerDown={(e) => startDrag(e, cardId)}
          style={{
            position: 'absolute', left: -10, top: '50%',
            transform: 'translateY(-50%)',
            width: 32, height: 32, borderRadius: 8,
            background: '#1E3A5F', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', touchAction: 'none',
            boxShadow: '0 3px 8px rgba(15,23,42,0.4)',
            zIndex: 10,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <circle cx={9} cy={6} r={1.5}/><circle cx={15} cy={6} r={1.5}/>
            <circle cx={9} cy={12} r={1.5}/><circle cx={15} cy={12} r={1.5}/>
            <circle cx={9} cy={18} r={1.5}/><circle cx={15} cy={18} r={1.5}/>
          </svg>
        </div>
      )}
      <div onClick={editMode ? undefined : onToggle} style={{ cursor: editMode ? 'default' : 'pointer' }}>
        <div style={{ padding: 14, paddingLeft: editMode ? 28 : 14 }}>
          {expanded || editMode ? children : <CardCollapsedHead cardId={cardId} />}
        </div>
      </div>
    </div>
  )
}

// Header collassato minimal: mostra solo num + titolo + chevron
function CardCollapsedHead({ cardId }: { cardId: string }) {
  const map: Record<string, { n: number | string; title: string; bg: string }> = {
    'oggi-operativo':    { n: 1, title: 'OGGI OPERATIVO', bg: '#1E3A5F' },
    'team-live':         { n: 2, title: 'TEAM LIVE', bg: '#1E3A5F' },
    'commesse-critiche': { n: 3, title: 'COMMESSE CRITICHE', bg: '#991B1B' },
    'problemi':          { n: 4, title: 'PROBLEMI', bg: '#92400E' },
    'agenda-live':       { n: 5, title: 'AGENDA LIVE', bg: '#1E3A5F' },
    'produzione':        { n: 6, title: 'PRODUZIONE', bg: '#1E3A5F' },
    'carico-lavoro':     { n: 7, title: 'CARICO LAVORO', bg: '#1E3A5F' },
    'cassa':             { n: 8, title: 'CASSA', bg: '#065F46' },
    'operatore-fermo':   { n: 9, title: 'OPERATORE FERMO', bg: '#92400E' },
    'azioni-rapide':     { n: 10, title: 'AZIONI RAPIDE', bg: '#1E3A5F' },
  }
  const m = map[cardId] ?? { n: '?', title: cardId, bg: '#1E3A5F' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{
          background: m.bg, color: '#FFF',
          fontSize: 11, fontWeight: 700,
          padding: '3px 8px', borderRadius: 6, flexShrink: 0,
        }}>{m.n}</span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#0A1628',
          letterSpacing: 0.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{m.title}</span>
      </div>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.5}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  )
}

// ============================================================
// HEADER navy con bottone Riordina/Fatto
// ============================================================
function Header({
  user, palette, onMenu, editMode, onToggleEdit,
}: {
  user: any; palette: any; onMenu?: () => void
  editMode: boolean; onToggleEdit: () => void
}) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${palette.acc} 0%, ${palette.accDeep} 100%)`,
      padding: '14px 16px 28px',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      color: '#FFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: 0.3 }}>fliwoX</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onToggleEdit}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: 11, fontWeight: 800,
              letterSpacing: 0.5, textTransform: 'uppercase' as const,
              background: editMode ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
              color: editMode ? '#0F1B2D' : '#FFFFFF',
              border: 'none', cursor: 'pointer',
            }}
          >{editMode ? 'Fatto' : 'Riordina'}</button>
          <UI.IconBtn onClick={onMenu}><IconMenu /></UI.IconBtn>
          <UI.Avatar text={user.iniziali} bg="rgba(255,255,255,0.18)" size={36} />
        </div>
      </div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>BUONGIORNO</div>
      <div style={{
        fontSize: 38, fontWeight: 700,
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>{user.nome}</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>{user.dataLabel}</div>
    </div>
  )
}

function DayBadge({ palette }: { palette: any }) {
  const tasks = 0
  return (
    <div style={{
      background: '#FFFFFF', color: '#0F1B2D',
      padding: '6px 10px', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <IconCalendar />
      <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.1 }}>
        DAY<br />
        <span style={{ fontWeight: 500 }}>{tasks} task</span>
      </div>
    </div>
  )
}

// ============================================================
// PRIORITY BANNER navy
// ============================================================
function PriorityBanner({ data, onClick }: { data: any; onClick: () => void }) {
  const eventiOggi = data?.agenda?.eventi?.length || 0
  const lavoriUrgenti = data?.oggi?.problemi || 0
  const text = eventiOggi > 0
    ? `${eventiOggi} eventi oggi${lavoriUrgenti > 0 ? ` · ${lavoriUrgenti} urgenti` : ''}`
    : 'Nessun evento programmato'
  return (
    <div onClick={onClick} style={{
      margin: '12px 16px 0',
      background: '#1E3A5F',
      borderRadius: 14,
      padding: '11px 13px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 50,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, letterSpacing: 0.5, fontWeight: 700 }}>PRIORITÀ OGGI</div>
        <div style={{ color: '#FFF', fontSize: 12, fontWeight: 600, marginTop: 1 }}>{text}</div>
      </div>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}

// ============================================================
// STATS GRID 2x2 (Commesse / Cassa / Eventi / Messaggi)
// ============================================================
function StatsGrid({ data, ctx, onTab }: { data: any; ctx: any; onTab: (tab: string) => void }) {
  const commesseAttive = (ctx?.cantieri || []).filter((c: any) => !c?.deleted_at && !c?.archived_at).length
  const fattureDB = ctx?.fattureDB || []
  const daIncassare = fattureDB.reduce((s: number, f: any) => s + (f?.pagata ? 0 : Number(f?.totale || 0)), 0)
  const daIncassareLabel = daIncassare >= 1000 ? `${(daIncassare / 1000).toFixed(1)}k€` : `${Math.round(daIncassare)}€`
  const eventiOggi = data?.agenda?.eventi?.length || 0
  const messaggiNonLetti = ctx?.talkUnread || 0

  const Stat = ({ icon, value, label, badge, onClick }: any) => (
    <div onClick={onClick} style={{
      background: '#FFF',
      borderRadius: 14,
      padding: 12,
      cursor: 'pointer',
      position: 'relative',
      boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
    }}>
      <div style={{ color: '#1E3A5F', fontSize: 18, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: '#0A1628', fontSize: 22, fontWeight: 700, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{value}</div>
      <div style={{ color: '#475A75', fontSize: 11, marginTop: 3 }}>{label}</div>
      {badge ? (
        <div style={{ position: 'absolute', top: 10, right: 10, background: '#991B1B', color: '#FFF', fontSize: 9, padding: '2px 6px', borderRadius: 7, fontWeight: 700 }}>{badge}</div>
      ) : null}
    </div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      padding: '8px 16px 0',
    }}>
      <Stat
        onClick={() => onTab('commesse')}
        icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
        value={commesseAttive}
        label="Commesse attive"
      />
      <Stat
        onClick={() => onTab('contabilita')}
        icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={6} width={20} height={12} rx={2}/><circle cx={12} cy={12} r={2}/><path d="M6 12h.01M18 12h.01"/></svg>}
        value={daIncassareLabel}
        label="In attesa"
      />
      <Stat
        onClick={() => onTab('agenda')}
        icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        value={eventiOggi}
        label="Eventi oggi"
      />
      <Stat
        onClick={() => onTab('talk')}
        icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
        value={messaggiNonLetti}
        label="Messaggi"
        badge={messaggiNonLetti > 0 ? messaggiNonLetti : null}
      />
    </div>
  )
}

