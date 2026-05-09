// HomePanelMobileV2 - Home titolare mobile - REBUILD v11 mockup approvato
// Hero navy gradient + banner priorita + stat 2x2 + 11 card riordinabili
'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import { useMastro } from './MastroContext'

const NAVY = '#1B3A5C'
const NAVY_DEEP = '#0F1F33'
const BG = '#7A8A9A'
const RED = '#C73E1D'
const AMBER = '#BA7517'
const GREEN = '#0F6E56'
const TEXT = '#0F1F33'
const MUTED = '#5C6B7A'

// Card disponibili e ordine default
const ALL_CARDS = [
  { id: 'urgente', title: 'URGENTE' },
  { id: 'task', title: 'TASK' },
  { id: 'prossimo-montaggio', title: 'PROSSIMO MONTAGGIO' },
  { id: 'agenda', title: 'AGENDA' },
  { id: 'cassa', title: 'CASSA' },
  { id: 'squadra', title: 'SQUADRA' },
  { id: 'produzione', title: 'PRODUZIONE' },
  { id: 'magazzino', title: 'MAGAZZINO' },
  { id: 'statistiche', title: 'STATISTICHE' },
]
const DEFAULT_ORDER = ALL_CARDS.map(c => c.id)

export default function HomePanelMobileV2(props: any) {
  const { data } = useHomeMobile()
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [editMode, setEditMode] = useState(false)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('mastro_home_order_v11')
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
    try { localStorage.setItem('mastro_home_order_v11', JSON.stringify(order)) } catch {}
  }, [order])

  const goto = (tab: string) => {
    if (ctx?.setTab) ctx.setTab(tab)
    else if (props?.onNavigate) props.onNavigate(tab)
  }
  const apriCommessa = (id: string) => {
    if (ctx?.setSelectedCM) ctx.setSelectedCM(id)
    goto('commesse')
  }

  // Drag & drop
  const dragState = useRef<{ id: string; el: HTMLElement; offsetY: number; placeholder: HTMLElement } | null>(null)
  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const handleEl = e.currentTarget as HTMLElement
    const cardEl = handleEl.closest('[data-card-id]') as HTMLElement
    if (!cardEl) return
    const container = cardEl.parentElement
    if (!container) return
    const rect = cardEl.getBoundingClientRect()
    const placeholder = document.createElement('div')
    placeholder.style.cssText = `height: ${rect.height}px; background: rgba(27,58,92,0.08); border: 2px dashed ${NAVY}; border-radius: 14px;`
    container.insertBefore(placeholder, cardEl)
    cardEl.style.position = 'fixed'
    cardEl.style.zIndex = '1000'
    cardEl.style.width = `${rect.width}px`
    cardEl.style.left = `${rect.left}px`
    cardEl.style.top = `${rect.top}px`
    cardEl.style.pointerEvents = 'none'
    cardEl.style.opacity = '0.92'
    cardEl.style.boxShadow = '0 12px 32px rgba(15,31,51,0.4)'
    dragState.current = { id, el: cardEl, offsetY: e.clientY - rect.top, placeholder }
    document.body.style.userSelect = 'none'
    document.body.style.touchAction = 'none'
    const onMove = (ev: PointerEvent) => {
      const ds = dragState.current; if (!ds) return
      ds.el.style.top = `${ev.clientY - ds.offsetY}px`
      const others = Array.from(container.querySelectorAll<HTMLElement>('[data-card-id]')).filter(c => c !== ds.el)
      let inserted = false
      for (const c of others) {
        const r = c.getBoundingClientRect()
        if (ev.clientY < r.top + r.height / 2) {
          if (ds.placeholder.nextSibling !== c) container.insertBefore(ds.placeholder, c)
          inserted = true; break
        }
      }
      if (!inserted && others.length > 0) {
        const last = others[others.length - 1]
        if (ds.placeholder.previousSibling !== last) container.insertBefore(ds.placeholder, last.nextSibling)
      }
    }
    const onUp = () => {
      const ds = dragState.current; if (!ds) return
      ds.placeholder.parentNode?.insertBefore(ds.el, ds.placeholder)
      ds.placeholder.remove()
      ds.el.style.cssText = ''
      const newOrder = Array.from(container.querySelectorAll<HTMLElement>('[data-card-id]')).map(c => c.dataset.cardId!).filter(Boolean)
      setOrder(newOrder)
      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      dragState.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  // Dati reali da context/data
  const cantieri = (ctx?.cantieri || []).filter((c: any) => !c?.deleted_at && !c?.archived_at)
  const fattureDB = ctx?.fattureDB || []
  const team = ctx?.team || []
  const eventiOggi = data?.agenda?.eventi || []
  const eventiCount = eventiOggi.length
  const ferme = cantieri.filter((c: any) => {
    const upd = c?.updated_at ? new Date(c.updated_at).getTime() : 0
    const days = (Date.now() - upd) / 86400000
    return days > 5 && (c?.fase === 'preventivo' || c?.fase === 'sopralluogo')
  })
  const tasks = (ctx?.tasks || []).filter((t: any) => !t?.completata).slice(0, 4)
  const daIncassare = fattureDB.reduce((s: number, f: any) => s + (f?.pagata ? 0 : Number(f?.totale || 0)), 0)
  const daIncassareLabel = daIncassare >= 1000 ? `${(daIncassare / 1000).toFixed(1)}k€` : `${Math.round(daIncassare)}€`
  const messaggiNonLetti = ctx?.talkUnread || 0
  const prossimoMontaggio = (ctx?.montaggi || []).filter((m: any) => new Date(m?.data || 0).getTime() > Date.now()).sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())[0]

  const renderCard = (id: string) => {
    const card = ALL_CARDS.find(c => c.id === id)
    if (!card) return null
    return (
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
          {id === 'urgente' && <CardUrgente ferme={ferme} onClick={() => goto('commesse')} />}
          {id === 'task' && <CardTask tasks={tasks} onClick={() => goto('team')} />}
          {id === 'prossimo-montaggio' && <CardProssimoMontaggio mont={prossimoMontaggio} onClick={() => goto('agenda')} />}
          {id === 'agenda' && <CardAgenda eventi={eventiOggi} onClick={() => goto('agenda')} />}
          {id === 'cassa' && <CardCassa daIncassare={daIncassareLabel} onClick={() => goto('contabilita')} />}
          {id === 'squadra' && <CardSquadra team={team} onClick={() => goto('team')} />}
          {id === 'produzione' && <CardProduzione cantieri={cantieri} onClick={() => goto('commesse')} />}
          {id === 'magazzino' && <CardMagazzino onClick={() => goto('magazzino')} />}
          {id === 'statistiche' && <CardStatistiche cantieri={cantieri} onClick={() => goto('contabilita')} />}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingBottom: 110 }}>
      {/* HERO */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        padding: '14px 18px 22px', borderRadius: '0 0 22px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>fliwoX</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setEditMode(v => !v)} style={{
              background: editMode ? '#FFF' : 'rgba(255,255,255,0.12)',
              color: editMode ? NAVY_DEEP : '#FFF',
              fontSize: 10, padding: '5px 10px', borderRadius: 6,
              fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: 'pointer',
            }}>{editMode ? 'FATTO' : 'RIORDINA'}</button>
            <button onClick={() => goto('settings')} style={{
              width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)',
              border: 'none', color: '#FFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}>
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{
              width: 30, height: 30, borderRadius: 50, background: 'rgba(255,255,255,0.95)',
              color: NAVY_DEEP, fontWeight: 600, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{(data?.user?.iniziali || 'T').slice(0, 2)}</div>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: 1.5, fontWeight: 500 }}>BUONGIORNO</div>
        <div style={{ color: '#FFF', fontSize: 30, fontWeight: 600, marginTop: 4, letterSpacing: 0.8, lineHeight: 1.05 }}>
          {(data?.user?.nome || 'TITOLARE').toUpperCase()}
        </div>
      </div>

      {/* PRIORITY BANNER */}
      <div onClick={() => goto('agenda')} style={{
        margin: '12px 12px 8px', background: NAVY, borderRadius: 14,
        padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 50, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, letterSpacing: 0.5, fontWeight: 700 }}>PRIORITÀ OGGI</div>
          <div style={{ color: '#FFF', fontSize: 12, fontWeight: 600, marginTop: 1 }}>{eventiCount} eventi · {ferme.length} commesse ferme</div>
        </div>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      {/* STAT GRID 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 8px' }}>
        <Stat onClick={() => goto('commesse')} icon="briefcase" value={cantieri.length} label="Commesse attive" />
        <Stat onClick={() => goto('contabilita')} icon="cash" value={daIncassareLabel} label="In attesa" />
        <Stat onClick={() => goto('agenda')} icon="calendar" value={eventiCount} label="Eventi oggi" />
        <Stat onClick={() => goto('talk')} icon="msg" value={messaggiNonLetti} label="Messaggi" badge={messaggiNonLetti > 0 ? messaggiNonLetti : null} />
      </div>

      {/* LISTA CARD RIORDINABILI */}
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
        {icon ? <div style={{ color: NAVY, fontSize: 16 }}>{icon}</div> : null}
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{title}</span>
        {badge != null ? <span style={{ background: '#F1F4F7', color: NAVY, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{badge}</span> : null}
      </div>
      {link && <span onClick={onClick} style={{ color: NAVY, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{link} ›</span>}
    </div>
  )
}

function CardUrgente({ ferme, onClick }: any) {
  return (
    <div style={{ background: '#FCEFEC', margin: -12 + 'px ' + -14 + 'px', padding: '12px 14px', borderRadius: 14, position: 'relative' }}>
      <span style={{ position: 'absolute', top: -6, left: 12, background: RED, color: '#FFF', fontSize: 9, padding: '3px 9px', borderRadius: 5, fontWeight: 700, letterSpacing: 0.5 }}>URGENTE</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 4 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill={RED}><path d="M12 2L2 22h20L12 2zm0 6l7 12H5l7-12zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{ferme.length} commesse ferme</span>
      </div>
      {ferme.slice(0, 3).map((c: any, i: number) => (
        <div key={i} style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{c?.codice || c?.code || '?'} — {c?.fase || ''}</div>
      ))}
      <button onClick={onClick} style={{ marginTop: 10, background: '#FFF', border: '1px solid #D8DDE0', padding: '9px 10px', borderRadius: 10, fontSize: 11, color: TEXT, cursor: 'pointer', width: '100%', fontWeight: 600, letterSpacing: 0.5 }}>SBLOCCA →</button>
    </div>
  )
}

function CardTask({ tasks, onClick }: any) {
  return (
    <>
      <CardHead title="Task" badge={tasks.length} link="vedi tutte" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
      {tasks.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessuna task aperta</div>}
      {tasks.map((t: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < tasks.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid #B5C2D6', flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: TEXT, fontWeight: 500 }}>{t?.titolo || t?.title || 'Task'}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{t?.scadenza || ''}</div>
          </div>
        </div>
      ))}
    </>
  )
}

function CardProssimoMontaggio({ mont, onClick }: any) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: MUTED, fontSize: 9, letterSpacing: 0.5, fontWeight: 600 }}>PROSSIMO MONTAGGIO</span>
        <span style={{ color: NAVY, fontSize: 11, fontWeight: 600 }}>{mont?.data || '—'}</span>
      </div>
      <div style={{ color: TEXT, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{mont?.cliente || 'Nessun montaggio programmato'}</div>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{mont?.indirizzo || ''}</div>
    </>
  )
}

function CardAgenda({ eventi, onClick }: any) {
  return (
    <>
      <CardHead title="Agenda oggi" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/></svg>} />
      {eventi.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun evento oggi</div>}
      {eventi.slice(0, 3).map((e: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
          <div style={{ width: 7, height: 7, borderRadius: 50, background: e?.tipo === 'firma' ? RED : e?.tipo === 'sopralluogo' ? AMBER : NAVY, flexShrink: 0 }}/>
          <div style={{ fontSize: 10, color: MUTED, minWidth: 38, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>{e?.ora || '—'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{e?.titolo || ''}</div>
            <div style={{ fontSize: 9, color: NAVY, marginTop: 1 }}>{e?.meta || ''}</div>
          </div>
        </div>
      ))}
    </>
  )
}

function CardCassa({ daIncassare, onClick }: any) {
  return (
    <>
      <CardHead title="Cassa" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={6} width={20} height={12} rx={2}/><circle cx={12} cy={12} r={2}/></svg>} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: 11, color: MUTED }}>Da incassare</span>
        <span style={{ fontSize: 13, color: TEXT, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{daIncassare}</span>
      </div>
    </>
  )
}

function CardSquadra({ team, onClick }: any) {
  const attivi = team.filter((t: any) => t?.attivo !== false).slice(0, 4)
  return (
    <>
      <CardHead title="Squadra" badge={`${attivi.length}/${team.length}`} link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>} />
      {attivi.map((t: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < attivi.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 50, background: '#D8E5F0', color: TEXT, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{(t?.nome || '?').slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: TEXT, fontWeight: 500 }}>{t?.nome || 'Operatore'}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{t?.stato || 'disponibile'}</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: 50, background: t?.attivo !== false ? GREEN : '#C8D2DA' }}/>
        </div>
      ))}
    </>
  )
}

function CardProduzione({ cantieri, onClick }: any) {
  const inProd = cantieri.filter((c: any) => c?.fase === 'produzione' || c?.fase === 'ordine').slice(0, 3)
  return (
    <>
      <CardHead title="Produzione" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 7l-5 5 5 5"/></svg>} />
      {inProd.length === 0 && <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun lavoro in produzione</div>}
      {inProd.map((c: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < inProd.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
          <div>
            <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{c?.codice || c?.code} · {c?.cliente || ''}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{c?.fase}</div>
          </div>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#F1F4F7', color: NAVY, fontWeight: 600 }}>{c?.fase?.toUpperCase()}</span>
        </div>
      ))}
    </>
  )
}

function CardMagazzino({ onClick }: any) {
  return (
    <>
      <CardHead title="Magazzino" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 8V21H3V8M1 3h22v5H1zM10 12h4"/></svg>} />
      <div style={{ fontSize: 11, color: MUTED, padding: '6px 0' }}>Modulo MASTRO MAGAZZINO in arrivo</div>
    </>
  )
}

function CardStatistiche({ cantieri, onClick }: any) {
  const sopralluoghi = cantieri.filter((c: any) => c?.fase === 'sopralluogo').length
  const preventivi = cantieri.filter((c: any) => c?.fase === 'preventivo').length
  return (
    <>
      <CardHead title="Statistiche" link="vedi report" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: 11, color: MUTED }}>Sopralluoghi</span>
        <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{sopralluoghi}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}>
        <span style={{ fontSize: 11, color: MUTED }}>Preventivi inviati</span>
        <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{preventivi}</span>
      </div>
    </>
  )
}
