// HomePanelMobileV2 - REBUILD v13 con calendario + swipe orizzontale ovunque
'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import { useMastro } from './MastroContext'

const NAVY = '#1B3A5C', NAVY_DEEP = '#0F1F33', BG = '#7A8A9A'
const RED = '#C73E1D', AMBER = '#BA7517', GREEN = '#0F6E56'
const TEXT = '#0F1F33', MUTED = '#5C6B7A', BORDER = '#E5E7EB'
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
const DOW = ['L','M','M','G','V','S','D']

const ALL_CARDS = [
  { id: 'agenda', title: 'AGENDA' },
  { id: 'urgente', title: 'URGENTE' },
  { id: 'task', title: 'TASK' },
  { id: 'prossimo-montaggio', title: 'PROSSIMI MONTAGGI' },
  { id: 'commesse', title: 'COMMESSE ATTIVE' },
  { id: 'cassa', title: 'CASSA' },
  { id: 'squadra', title: 'SQUADRA' },
  { id: 'produzione', title: 'PRODUZIONE' },
  { id: 'magazzino', title: 'MAGAZZINO' },
  { id: 'statistiche', title: 'STATISTICHE' },
]
const DEFAULT_ORDER = ALL_CARDS.map(c => c.id)

// ============ SWIPE TRACK orizzontale riusabile ============
function SwipeTrack({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch' as any,
      scrollbarWidth: 'none' as any,
      paddingBottom: 4, marginRight: -14, paddingRight: 14,
    }}
    onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY }}
    >
      <style>{`.mastro-swipe::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  )
}
function SwipeItem({ children, width = 'calc(50% - 4px)' }: any) {
  return (
    <div style={{
      flex: `0 0 ${width}`, scrollSnapAlign: 'start',
      background: '#F1F4F7', borderRadius: 10, padding: '8px 10px',
      minWidth: 0,
    }}>{children}</div>
  )
}

export default function HomePanelMobileV2(props: any) {
  const { data } = useHomeMobile()
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [editMode, setEditMode] = useState(false)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('mastro_home_order_v13')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed, ...DEFAULT_ORDER.filter(id => !parsed.includes(id))]
          setOrder(merged)
        }
      }
    } catch {}
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem('mastro_home_order_v13', JSON.stringify(order)) } catch {}
  }, [order])

  const goto = (tab: string) => { if (ctx?.setTab) ctx.setTab(tab); else if (props?.onNavigate) props.onNavigate(tab) }
  const apriCM = (id: string) => { if (ctx?.setSelectedCM) ctx.setSelectedCM(id); goto('commesse') }

  // Drag drop
  const dragState = useRef<any>(null)
  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const handleEl = e.currentTarget as HTMLElement
    const cardEl = handleEl.closest('[data-card-id]') as HTMLElement
    if (!cardEl) return
    const container = cardEl.parentElement; if (!container) return
    const rect = cardEl.getBoundingClientRect()
    const ph = document.createElement('div')
    ph.style.cssText = `height: ${rect.height}px; background: rgba(27,58,92,0.08); border: 2px dashed ${NAVY}; border-radius: 14px;`
    container.insertBefore(ph, cardEl)
    cardEl.style.position = 'fixed'; cardEl.style.zIndex = '1000'
    cardEl.style.width = `${rect.width}px`; cardEl.style.left = `${rect.left}px`; cardEl.style.top = `${rect.top}px`
    cardEl.style.pointerEvents = 'none'; cardEl.style.opacity = '0.92'
    cardEl.style.boxShadow = '0 12px 32px rgba(15,31,51,0.4)'
    dragState.current = { id, el: cardEl, offsetY: e.clientY - rect.top, ph }
    document.body.style.userSelect = 'none'; document.body.style.touchAction = 'none'
    const onMove = (ev: PointerEvent) => {
      const ds = dragState.current; if (!ds) return
      ds.el.style.top = `${ev.clientY - ds.offsetY}px`
      const others = Array.from(container.querySelectorAll<HTMLElement>('[data-card-id]')).filter(c => c !== ds.el)
      let inserted = false
      for (const c of others) {
        const r = c.getBoundingClientRect()
        if (ev.clientY < r.top + r.height / 2) { if (ds.ph.nextSibling !== c) container.insertBefore(ds.ph, c); inserted = true; break }
      }
      if (!inserted && others.length > 0) {
        const last = others[others.length - 1]
        if (ds.ph.previousSibling !== last) container.insertBefore(ds.ph, last.nextSibling)
      }
    }
    const onUp = () => {
      const ds = dragState.current; if (!ds) return
      ds.ph.parentNode?.insertBefore(ds.el, ds.ph); ds.ph.remove()
      ds.el.style.cssText = ''
      const newOrder = Array.from(container.querySelectorAll<HTMLElement>('[data-card-id]')).map(c => c.dataset.cardId!).filter(Boolean)
      setOrder(newOrder)
      document.body.style.userSelect = ''; document.body.style.touchAction = ''
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp)
      dragState.current = null
    }
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp)
  }

  const cantieri = (ctx?.cantieri || []).filter((c: any) => !c?.deleted_at && !c?.archived_at)
  const fattureDB = ctx?.fattureDB || []
  const team = ctx?.team || []
  const eventi = ctx?.events || data?.agenda?.eventi || []
  const tasks = (ctx?.tasks || []).filter((t: any) => !t?.completata)
  const montaggi = ctx?.montaggi || []
  const ferme = cantieri.filter((c: any) => {
    const upd = c?.updated_at ? new Date(c.updated_at).getTime() : 0
    return ((Date.now() - upd) / 86400000) > 5 && (c?.fase === 'preventivo' || c?.fase === 'sopralluogo')
  })
  const daIncassare = fattureDB.reduce((s: number, f: any) => s + (f?.pagata ? 0 : Number(f?.totale || 0)), 0)
  const daIncassareLabel = daIncassare >= 1000 ? `${(daIncassare / 1000).toFixed(1)}k€` : `${Math.round(daIncassare)}€`
  const messaggi = ctx?.talkUnread || 0
  const eventiOggi = eventi.filter((e: any) => {
    const d = new Date(e?.data || e?.start || 0); return d.toDateString() === new Date().toDateString()
  })
  const prossimiMontaggi = montaggi.filter((m: any) => new Date(m?.data || 0).getTime() > Date.now())
    .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())

  const renderCard = (id: string) => (
    <div key={id} data-card-id={id} style={{
      background: '#FFF', borderRadius: 14, position: 'relative',
      border: editMode ? `2px dashed ${NAVY}` : 'none',
      boxShadow: '0 1px 4px rgba(15,31,51,0.08)',
    }}>
      {editMode && (
        <div onPointerDown={(e) => startDrag(e, id)} style={{
          position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
          width: 30, height: 30, borderRadius: 8, background: NAVY, color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab',
          touchAction: 'none', zIndex: 10, boxShadow: '0 3px 8px rgba(15,31,51,0.4)',
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <circle cx={9} cy={6} r={1.5}/><circle cx={15} cy={6} r={1.5}/>
            <circle cx={9} cy={12} r={1.5}/><circle cx={15} cy={12} r={1.5}/>
            <circle cx={9} cy={18} r={1.5}/><circle cx={15} cy={18} r={1.5}/>
          </svg>
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>
        {id === 'agenda' && <CardCalendar eventi={eventi} onClick={() => goto('agenda')} />}
        {id === 'urgente' && <CardUrgente ferme={ferme} apri={apriCM} />}
        {id === 'task' && <CardTask tasks={tasks} onClick={() => goto('team')} />}
        {id === 'prossimo-montaggio' && <CardMontaggi montaggi={prossimiMontaggi} onClick={() => goto('agenda')} />}
        {id === 'commesse' && <CardCommesse cantieri={cantieri} apri={apriCM} />}
        {id === 'cassa' && <CardCassa daIncassare={daIncassareLabel} fatture={fattureDB} onClick={() => goto('contabilita')} />}
        {id === 'squadra' && <CardSquadra team={team} onClick={() => goto('team')} />}
        {id === 'produzione' && <CardProduzione cantieri={cantieri} apri={apriCM} />}
        {id === 'magazzino' && <CardMagazzino onClick={() => goto('magazzino')} />}
        {id === 'statistiche' && <CardStatistiche cantieri={cantieri} onClick={() => goto('contabilita')} />}
      </div>
    </div>
  )

  const userInit = (data?.user?.iniziali || ctx?.user?.email?.[0] || 'T').toUpperCase().slice(0, 2)
  const userNome = (data?.user?.nome || ctx?.azienda?.nome || 'TITOLARE').toUpperCase()

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingBottom: 110 }}>
      {/* HERO */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, padding: '14px 18px 22px', borderRadius: '0 0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>fliwoX</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setEditMode(v => !v)} style={{
              background: editMode ? '#FFF' : 'rgba(255,255,255,0.12)',
              color: editMode ? NAVY_DEEP : '#FFF', fontSize: 10, padding: '5px 10px', borderRadius: 6,
              fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: 'pointer',
            }}>{editMode ? 'FATTO' : 'RIORDINA'}</button>
            <button onClick={() => goto('settings')} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div style={{ width: 30, height: 30, borderRadius: 50, background: 'rgba(255,255,255,0.95)', color: NAVY_DEEP, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{userInit}</div>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: 1.5, fontWeight: 500 }}>BUONGIORNO</div>
        <div style={{ color: '#FFF', fontSize: 30, fontWeight: 600, marginTop: 4, letterSpacing: 0.8, lineHeight: 1.05 }}>{userNome}</div>
      </div>

      {/* PRIORITY */}
      <div onClick={() => goto('agenda')} style={{ margin: '12px 12px 8px', background: NAVY, borderRadius: 14, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div style={{ width: 30, height: 30, borderRadius: 50, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, letterSpacing: 0.5, fontWeight: 700 }}>PRIORITÀ OGGI</div>
          <div style={{ color: '#FFF', fontSize: 12, fontWeight: 600, marginTop: 1 }}>{eventiOggi.length} eventi · {ferme.length} ferme · {tasks.length} task</div>
        </div>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      {/* STAT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 8px' }}>
        <Stat onClick={() => goto('commesse')} icon="briefcase" value={cantieri.length} label="Commesse attive" />
        <Stat onClick={() => goto('contabilita')} icon="cash" value={daIncassareLabel} label="In attesa" />
        <Stat onClick={() => goto('agenda')} icon="calendar" value={eventiOggi.length} label="Eventi oggi" />
        <Stat onClick={() => goto('talk')} icon="msg" value={messaggi} label="Messaggi" badge={messaggi > 0 ? messaggi : null} />
      </div>

      {/* CARD LIST */}
      <div style={{ padding: '0 12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.map(id => renderCard(id))}
      </div>
    </div>
  )
}

function Stat({ icon, value, label, badge, onClick }: any) {
  const Ico = () => {
    if (icon === 'briefcase') return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    if (icon === 'cash') return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={6} width={20} height={12} rx={2}/><circle cx={12} cy={12} r={2}/></svg>
    if (icon === 'calendar') return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
    return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  }
  return (
    <div onClick={onClick} style={{ background: '#FFF', borderRadius: 14, padding: 12, cursor: 'pointer', position: 'relative', boxShadow: '0 1px 4px rgba(15,31,51,0.08)' }}>
      <div style={{ color: NAVY, marginBottom: 6 }}><Ico /></div>
      <div style={{ color: TEXT, fontSize: 22, fontWeight: 700, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{value}</div>
      <div style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{label}</div>
      {badge ? <div style={{ position: 'absolute', top: 10, right: 10, background: RED, color: '#FFF', fontSize: 9, padding: '2px 6px', borderRadius: 7, fontWeight: 700 }}>{badge}</div> : null}
    </div>
  )
}

function CardHead({ title, link, badge, onClick, icon }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon ? <div style={{ color: NAVY }}>{icon}</div> : null}
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{title}</span>
        {badge != null ? <span style={{ background: '#F1F4F7', color: NAVY, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{badge}</span> : null}
      </div>
      {link && <span onClick={onClick} style={{ color: NAVY, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{link} ›</span>}
    </div>
  )
}

// ===== CALENDARIO =====
function CardCalendar({ eventi, onClick }: any) {
  const [view, setView] = useState<'giorno' | 'settimana' | 'mese'>('mese')
  const [cursor, setCursor] = useState(new Date())
  const today = new Date()
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const eventByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    eventi.forEach((e: any) => {
      const d = new Date(e?.data || e?.start || 0)
      if (isNaN(d.getTime())) return
      const k = d.toDateString(); if (!map[k]) map[k] = []
      map[k].push(e)
    })
    return map
  }, [eventi])
  const eventiSel = eventByDay[cursor.toDateString()] || []
  const buildMonth = () => {
    const y = cursor.getFullYear(), m = cursor.getMonth()
    const last = new Date(y, m + 1, 0)
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7
    const days: { date: Date; muted: boolean }[] = []
    for (let i = startDow; i > 0; i--) days.push({ date: new Date(y, m, 1 - i), muted: true })
    for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(y, m, d), muted: false })
    while (days.length % 7 !== 0) {
      const ld = days[days.length - 1].date
      days.push({ date: new Date(ld.getFullYear(), ld.getMonth(), ld.getDate() + 1), muted: true })
    }
    return days
  }
  const dotColor = (e: any) => {
    const t = (e?.tipo || '').toLowerCase()
    if (t.includes('firma')) return RED
    if (t.includes('sopral') || t.includes('rilievo')) return AMBER
    if (t.includes('mont') || t.includes('posa')) return NAVY
    return GREEN
  }
  const navPrev = (e: any) => { e.stopPropagation(); if (view === 'mese') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); else if (view === 'settimana') setCursor(new Date(cursor.getTime() - 7 * 86400000)); else setCursor(new Date(cursor.getTime() - 86400000)) }
  const navNext = (e: any) => { e.stopPropagation(); if (view === 'mese') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); else if (view === 'settimana') setCursor(new Date(cursor.getTime() + 7 * 86400000)); else setCursor(new Date(cursor.getTime() + 86400000)) }
  const navOggi = (e: any) => { e.stopPropagation(); setCursor(new Date()) }
  const monthLabel = `${MESI[cursor.getMonth()]} ${cursor.getFullYear()}`
  const days = buildMonth()
  const navBtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, background: '#F1F4F7', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, cursor: 'pointer', border: 'none' }

  return (
    <>
      <div style={{ display: 'flex', gap: 4, background: '#F1F4F7', padding: 3, borderRadius: 10, marginBottom: 10 }}>
        {(['giorno','settimana','mese'] as const).map(v => (
          <div key={v} onClick={(e) => { e.stopPropagation(); setView(v) }} style={{
            flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
            color: view === v ? TEXT : MUTED, background: view === v ? '#FFF' : 'transparent',
            borderRadius: 7, cursor: 'pointer',
          }}>{v.toUpperCase()}</div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={navPrev} style={navBtn}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg></button>
          <button onClick={navOggi} style={{ ...navBtn, padding: '0 10px', width: 'auto' }}>OGGI</button>
          <button onClick={navNext} style={navBtn}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
      {view === 'mese' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {DOW.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#8FA8B8', padding: '2px 0' }}>{d}</div>)}
          {days.map((d, i) => {
            const isT = isSameDay(d.date, today), isS = isSameDay(d.date, cursor)
            const has = (eventByDay[d.date.toDateString()] || []).length > 0
            return (
              <div key={i} onClick={(e) => { e.stopPropagation(); setCursor(d.date) }} style={{
                aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: d.muted ? '#C8D2DA' : (isT ? '#FFF' : TEXT),
                cursor: 'pointer', borderRadius: '50%', position: 'relative',
                background: isT ? NAVY : (isS && !d.muted ? '#E5EAF0' : 'transparent'),
                fontWeight: isT ? 600 : 400,
              }}>
                {d.date.getDate()}
                {has && !d.muted && <div style={{ position: 'absolute', bottom: 2, width: 4, height: 4, background: isT ? '#FFF' : NAVY, borderRadius: '50%' }}/>}
              </div>
            )
          })}
        </div>
      )}
      {view === 'settimana' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const dow = (cursor.getDay() + 6) % 7
            const start = new Date(cursor.getTime() - dow * 86400000)
            const d = new Date(start.getTime() + i * 86400000)
            const isT = isSameDay(d, today), isS = isSameDay(d, cursor)
            const evs = eventByDay[d.toDateString()] || []
            return (
              <div key={i} onClick={(e) => { e.stopPropagation(); setCursor(d) }} style={{
                background: isT ? NAVY : (isS ? '#E5EAF0' : '#F7F9FB'),
                color: isT ? '#FFF' : TEXT, padding: '6px 4px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 9, opacity: 0.7 }}>{DOW[i]}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{d.getDate()}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4, minHeight: 6 }}>
                  {evs.slice(0, 3).map((e: any, j: number) => <div key={j} style={{ width: 4, height: 4, background: isT ? '#FFF' : dotColor(e), borderRadius: '50%' }}/>)}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {view === 'giorno' && (
        <div style={{ background: '#F7F9FB', borderRadius: 8, padding: 10, minHeight: 100 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' })}</div>
          {eventiSel.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '12px 0' }}>Nessun evento</div>}
          {eventiSel.map((e: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <div style={{ width: 7, height: 7, borderRadius: 50, background: dotColor(e), flexShrink: 0 }}/>
              <div style={{ fontSize: 10, color: MUTED, minWidth: 40, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>{e?.ora || (e?.data ? new Date(e.data).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '—')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{e?.titolo || e?.title || ''}</div>
                <div style={{ fontSize: 9, color: NAVY }}>{e?.note || e?.luogo || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {view !== 'giorno' && eventiSel.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>{cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' }).toUpperCase()} · {eventiSel.length} EVENTI</div>
          <SwipeTrack>
            {eventiSel.map((e: any, i: number) => (
              <SwipeItem key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 50, background: dotColor(e) }}/>
                  <div style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{e?.ora || (e?.data ? new Date(e.data).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '—')}</div>
                </div>
                <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, marginTop: 2 }}>{e?.titolo || e?.title || ''}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{e?.note || e?.luogo || ''}</div>
              </SwipeItem>
            ))}
          </SwipeTrack>
        </div>
      )}
      <button onClick={onClick} style={{ marginTop: 10, background: 'transparent', border: 'none', color: NAVY, fontSize: 10, fontWeight: 600, cursor: 'pointer', width: '100%', padding: 4 }}>APRI AGENDA COMPLETA →</button>
    </>
  )
}

// ===== URGENTE swipe =====
function CardUrgente({ ferme, apri }: any) {
  return (
    <div style={{ background: '#FCEFEC', margin: '-12px -14px', padding: '12px 14px', borderRadius: 14, position: 'relative' }}>
      <span style={{ position: 'absolute', top: -6, left: 12, background: RED, color: '#FFF', fontSize: 9, padding: '3px 9px', borderRadius: 5, fontWeight: 700, letterSpacing: 0.5 }}>URGENTE</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill={RED}><path d="M12 2L2 22h20L12 2zm-1 6v8h2V8h-2zm0 10v2h2v-2h-2z"/></svg>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{ferme.length} commesse ferme</span>
      </div>
      {ferme.length === 0 && <div style={{ fontSize: 11, color: MUTED }}>Tutto sotto controllo</div>}
      {ferme.length > 0 && (
        <SwipeTrack>
          {ferme.map((c: any, i: number) => (
            <SwipeItem key={i} width="180px">
              <div style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code || '?'}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c?.cliente || ''}</div>
              <div style={{ fontSize: 9, color: RED, marginTop: 4, fontWeight: 600 }}>{c?.fase?.toUpperCase()}</div>
              <button onClick={() => apri(c?.id)} style={{ marginTop: 6, background: '#FFF', border: `1px solid ${BORDER}`, padding: '4px 8px', borderRadius: 6, fontSize: 9, color: TEXT, cursor: 'pointer', fontWeight: 600 }}>APRI →</button>
            </SwipeItem>
          ))}
        </SwipeTrack>
      )}
    </div>
  )
}

// ===== TASK swipe =====
function CardTask({ tasks, onClick }: any) {
  return (
    <>
      <CardHead title="Task" badge={tasks.length} link="vedi tutte" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
      {tasks.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessuna task aperta</div>}
      {tasks.length > 0 && (
        <SwipeTrack>
          {tasks.map((t: any, i: number) => (
            <SwipeItem key={i} width="200px">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid #B5C2D6', flexShrink: 0, marginTop: 1 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: TEXT, fontWeight: 600, lineHeight: 1.3 }}>{t?.titolo || t?.title || 'Task'}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{t?.scadenza ? new Date(t.scadenza).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : ''}</div>
                  {t?.priorita && <div style={{ fontSize: 9, color: t?.priorita === 'alta' ? RED : MUTED, marginTop: 2, fontWeight: 600 }}>{t?.priorita?.toUpperCase()}</div>}
                </div>
              </div>
            </SwipeItem>
          ))}
        </SwipeTrack>
      )}
    </>
  )
}

// ===== PROSSIMI MONTAGGI swipe =====
function CardMontaggi({ montaggi, onClick }: any) {
  return (
    <>
      <CardHead title="Prossimi montaggi" badge={montaggi.length} link="agenda" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>} />
      {montaggi.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun montaggio programmato</div>}
      {montaggi.length > 0 && (
        <SwipeTrack>
          {montaggi.map((m: any, i: number) => {
            const d = new Date(m?.data || Date.now())
            return (
              <SwipeItem key={i} width="190px">
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, marginTop: 2 }}>{m?.cliente || m?.titolo || 'Cliente'}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · {m?.indirizzo || m?.luogo || ''}</div>
              </SwipeItem>
            )
          })}
        </SwipeTrack>
      )}
    </>
  )
}

// ===== COMMESSE ATTIVE swipe =====
function CardCommesse({ cantieri, apri }: any) {
  return (
    <>
      <CardHead title="Commesse attive" badge={cantieri.length} link="vedi tutte" onClick={() => apri('')} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/></svg>} />
      {cantieri.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessuna commessa attiva</div>}
      {cantieri.length > 0 && (
        <SwipeTrack>
          {cantieri.map((c: any, i: number) => (
            <SwipeItem key={i} width="200px">
              <div style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code}</div>
              <div style={{ fontSize: 11, color: TEXT, marginTop: 2 }}>{c?.cliente || ''}</div>
              <div style={{ fontSize: 9, color: NAVY, marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>{c?.fase || ''}</div>
              <button onClick={() => apri(c?.id)} style={{ marginTop: 6, background: '#FFF', border: `1px solid ${BORDER}`, padding: '4px 8px', borderRadius: 6, fontSize: 9, color: TEXT, cursor: 'pointer', fontWeight: 600 }}>APRI →</button>
            </SwipeItem>
          ))}
        </SwipeTrack>
      )}
    </>
  )
}

// ===== CASSA con righe =====
function CardCassa({ daIncassare, fatture, onClick }: any) {
  const scadute = fatture.filter((f: any) => !f?.pagata && f?.scadenza && new Date(f.scadenza).getTime() < Date.now())
  const scaduteAmt = scadute.reduce((s: number, f: any) => s + Number(f?.totale || 0), 0)
  const incassate = fatture.filter((f: any) => f?.pagata)
  const incassateAmt = incassate.reduce((s: number, f: any) => s + Number(f?.totale || 0), 0)
  return (
    <>
      <CardHead title="Cassa" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={6} width={20} height={12} rx={2}/><circle cx={12} cy={12} r={2}/></svg>} />
      <Row label="Da incassare" value={daIncassare} color={TEXT} />
      {scadute.length > 0 && <Row label={`Scadute (${scadute.length})`} value={`${Math.round(scaduteAmt)}€`} color={RED} />}
      {incassate.length > 0 && <Row label={`Incassate (${incassate.length})`} value={`${Math.round(incassateAmt)}€`} color={GREEN} last />}
    </>
  )
}
function Row({ label, value, color, last }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: last ? 'none' : `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 13, color: color || TEXT, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{value}</span>
    </div>
  )
}

// ===== SQUADRA swipe =====
function CardSquadra({ team, onClick }: any) {
  const attivi = team.filter((t: any) => t?.attivo !== false).length
  return (
    <>
      <CardHead title="Squadra" badge={`${attivi}/${team.length}`} link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>} />
      {team.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun operatore</div>}
      {team.length > 0 && (
        <SwipeTrack>
          {team.map((t: any, i: number) => (
            <SwipeItem key={i} width="160px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 50, background: '#D8E5F0', color: TEXT, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, position: 'relative' }}>
                  {(t?.nome || '?').slice(0, 1).toUpperCase()}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: 50, background: t?.attivo !== false ? GREEN : '#C8D2DA', border: '1.5px solid #F1F4F7' }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.nome || 'Op'}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{t?.ruolo || t?.stato || 'disponibile'}</div>
                </div>
              </div>
            </SwipeItem>
          ))}
        </SwipeTrack>
      )}
    </>
  )
}

// ===== PRODUZIONE swipe =====
function CardProduzione({ cantieri, apri }: any) {
  const inProd = cantieri.filter((c: any) => c?.fase === 'produzione' || c?.fase === 'ordine')
  return (
    <>
      <CardHead title="Produzione" badge={inProd.length} link="apri" onClick={() => apri('')} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={3}/></svg>} />
      {inProd.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun lavoro in produzione</div>}
      {inProd.length > 0 && (
        <SwipeTrack>
          {inProd.map((c: any, i: number) => (
            <SwipeItem key={i} width="190px">
              <div style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c?.cliente || ''}</div>
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#FFF', color: NAVY, fontWeight: 600 }}>{(c?.fase || '').toUpperCase()}</span>
            </SwipeItem>
          ))}
        </SwipeTrack>
      )}
    </>
  )
}

function CardMagazzino({ onClick }: any) {
  return (
    <>
      <CardHead title="Magazzino" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 8V21H3V8M1 3h22v5H1z"/></svg>} />
      <div style={{ fontSize: 11, color: MUTED, padding: '6px 0' }}>Modulo MASTRO MAGAZZINO in arrivo</div>
    </>
  )
}

function CardStatistiche({ cantieri, onClick }: any) {
  const sopr = cantieri.filter((c: any) => c?.fase === 'sopralluogo').length
  const prev = cantieri.filter((c: any) => c?.fase === 'preventivo').length
  const conf = cantieri.filter((c: any) => c?.fase === 'conferma' || c?.fase === 'ordine').length
  const fatt = cantieri.filter((c: any) => c?.fase === 'fattura' || c?.fase === 'pagata').length
  return (
    <>
      <CardHead title="Statistiche" link="report" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>} />
      <Row label="Sopralluoghi" value={sopr} />
      <Row label="Preventivi" value={prev} />
      <Row label="Confermate" value={conf} />
      <Row label="Fatturate" value={fatt} last />
    </>
  )
}
