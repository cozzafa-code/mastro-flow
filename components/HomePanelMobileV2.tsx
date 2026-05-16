// cache-bust-20260514213840
// HomePanelMobileV2 V20 - bottom sheet evento/task + swipe calendario + no frecce
'use client'
import CardPianificazione from "./home/CardPianificazione";
import MastroProduzioneSheet from './produzione/MastroProduzioneSheet'
import { useMastroData } from "@/hooks/useMastroData";
import CardAzioniVeloci from "./home/CardAzioniVeloci";
import OrganizzaLavoriPanel from "./OrganizzaLavoriPanel";
import CentroControlloMontaggi from "./CentroControlloMontaggi";
import MontaggiSheet from "@/components/montaggi/MontaggiSheet";
import OrdiniGlobaliSheet from "./ordini/OrdiniGlobaliSheet";
import CentroControlloMagazzino from "./CentroControlloMagazzino";
import { ModuloMagazzino } from "./magazzino";
import CentroPreparazioneFurgoni from "./CentroPreparazioneFurgoni";
import CentroClienti from "./CentroClienti";
import ProduzioneModulo from "./produzione/ProduzioneModulo";
import CentroFinanze from "./finanze/CentroFinanzeV2";
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import { useMastro } from './MastroContext'
import { supabase } from '../lib/supabase'

const NAVY = '#1B3A5C', NAVY_DEEP = '#0F1F33', BG = '#7A8A9A'
const RED = '#C73E1D', AMBER = '#BA7517', GREEN = '#0F6E56'
const TEXT = '#0F1F33', MUTED = '#5C6B7A', BORDER = '#E5E7EB'
const TEAL = '#28A0A0'
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
const DOW_SHORT = ['LUN','MAR','MER','GIO','VEN','SAB','DOM']
const DOW = ['L','M','M','G','V','S','D']
const SHOW_VERTICAL = 5
const SWIPE_THRESHOLD = 50

const ALL_CARDS = [
  { id: 'agenda', title: 'AGENDA' },
  { id: 'task', title: 'TASK' },
  { id: 'prossimo-montaggio', title: 'PROSSIMI MONTAGGI' },
  { id: 'commesse', title: 'COMMESSE ATTIVE' },
  { id: 'cassa', title: 'CASSA' },
  { id: 'squadra', title: 'SQUADRA' },
  { id: 'produzione', title: 'PRODUZIONE' },
  { id: 'gestione-materiali', title: 'GESTIONE MATERIALI' },
  { id: 'clienti', title: 'CLIENTI' },
  { id: 'pianificazione', title: 'PIANIFICAZIONE' },
    { id: 'statistiche', title: 'STATISTICHE' },
  { id: 'azioni-veloci', title: 'AZIONI VELOCI' },
]
const DEFAULT_ORDER = ALL_CARDS.map(c => c.id)

function SwipeTrack({ children }: { children: React.ReactNode }) {
  return (
    <div className="mastro-swipe" style={{
      display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any,
      paddingBottom: 4, marginRight: -14, paddingRight: 14,
    }}>
      <style>{`.mastro-swipe::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  )
}
function SwipeItem({ children, width = '180px', onClick }: any) {
  return (
    <div onClick={onClick} style={{
      flex: `0 0 ${width}`, scrollSnapAlign: 'start',
      background: '#F7F9FB', borderRadius: 10, padding: 10, minWidth: 0,
      border: `1px solid ${BORDER}`, cursor: onClick ? 'pointer' : 'default',
    }}>{children}</div>
  )
}

function SwipeArea({ children, onSwipeLeft, onSwipeRight, style }: any) {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    }
    touchStartX.current = null
    touchStartY.current = null
  }
  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={style}>
      {children}
    </div>
  )
}

const dotColor = (e: any) => {
  const t = (e?.tipo || e?.type || '').toLowerCase()
  if (t.includes('mont') || t.includes('posa') || t.includes('consegna')) return '#28A0A0'
  if (t.includes('sopral') || t.includes('rilievo') || t.includes('misura') || t.includes('firma')) return '#8FA8A8'
  if (t.includes('task') || t.includes('compito') || t.includes('fattura') || t.includes('pagamento')) return '#3B7FE0'
  return '#5FD0D0'
}

const parseEventDate = (e: any): Date => {
  if (e?.date) {
    const d = new Date(e.date)
    if (e?.time) {
      const [h, m] = String(e.time).split(':').map(Number)
      if (!isNaN(h)) d.setHours(h || 0, m || 0)
    }
    return d
  }
  if (e?.data) {
    const d = new Date(e.data)
    const oraStr = e?.ora_inizio || e?.ora
    if (oraStr) {
      const [h, m] = String(oraStr).split(':').map(Number)
      if (!isNaN(h)) d.setHours(h || 0, m || 0)
    }
    return d
  }
  return new Date(e?.start || 0)
}

const eventTitle = (e: any) => e?.text || e?.titolo || e?.title || ''
const eventLuogo = (e: any) => e?.addr || e?.indirizzo || e?.luogo || ''


// CardSafe ErrorBoundary - cattura crash singola card
class CardSafe extends React.Component<{children: React.ReactNode, name?: string}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: any) { console.warn('[CardSafe]', this.props.name, err) }
  render() {
    if (this.state.hasError) return <div style={{padding:12,background:'#FEE2E2',borderRadius:8,fontSize:11,color:'#991B1B'}}>Card {this.props.name} non caricabile</div>
    return this.props.children as any
  }
}


// [v-prod-bridge] Componente wrapper per gestione modal produzione
function ProduzioneBridge() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('mastro:open-produzione', h);
    return () => window.removeEventListener('mastro:open-produzione', h);
  }, []);
  if (!open) return null;
  const aziendaId = (typeof window !== 'undefined' && (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id'))) || 'ccca51c1-656b-4e7c-a501-55753e20da29';
  return <MastroProduzioneSheet aziendaId={aziendaId} onClose={() => setOpen(false)} onApriCommessa={(id: string) => { window.dispatchEvent(new CustomEvent('mastro:apri-commessa', { detail: id })); }} />;
}

export default function HomePanelMobileV2(props: any) {
  const [organizzaCm, setOrganizzaCm] = React.useState<any>(null);
  const [showCentroMontaggi, setShowCentroMontaggi] = React.useState(false);
  const [centroMontaggiDate, setCentroMontaggiDate] = React.useState<string|null>(null);
  const [showCentroProduzione, setShowCentroProduzione] = React.useState(false);
  const [showCentroOrdini, setShowCentroOrdini] = React.useState(false);
  const [showCentroMagazzino, setShowCentroMagazzino] = React.useState(false);
  const [showMagazzinoTop, setShowMagazzinoTop] = React.useState(false);
  const [showCentroFurgoni, setShowCentroFurgoni] = React.useState(false);
  const [showCentroClienti, setShowCentroClienti] = React.useState(false);
  const [showCentroFinanze, setShowCentroFinanze] = React.useState(false);
  const [sheetEvento, setSheetEvento] = React.useState<any>(null);
  const [sheetTask, setSheetTask] = React.useState<any>(null);
  const [hiddenEventi, setHiddenEventi] = React.useState<Record<string, boolean>>({})
  const [hiddenTasks, setHiddenTasks] = React.useState<Record<string, boolean>>({})
  const { data } = useHomeMobile()
  const ctx: any = useMastro() || {}
  const [editMode, setEditMode] = useState(false)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('mastro_home_order_v16')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrder([...parsed, ...DEFAULT_ORDER.filter(id => !parsed.includes(id))])
        }
      }
    } catch {}
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem('mastro_home_order_v16', JSON.stringify(order)) } catch {}
  }, [order])

  const goto = (tab: string) => { if (ctx?.setTab) ctx.setTab(tab); else if (props?.onNavigate) props.onNavigate(tab) }
  const apriCM = (id: string) => { if (id && ctx?.setSelectedCM) ctx.setSelectedCM(id); goto('commesse') }

  const [doneOptim, setDoneOptim] = useState<Record<string, boolean>>({})
  const toggleTask = async (taskId: string, currentDone: boolean) => {
    if (!taskId) return
    setDoneOptim(prev => ({ ...prev, [taskId]: !currentDone }))
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ done: !currentDone, done_at: !currentDone ? new Date().toISOString() : null })
        .eq('id', taskId)
      if (error) {
        console.error('toggleTask supabase error', error)
        setDoneOptim(prev => ({ ...prev, [taskId]: currentDone }))
        return
      }
      if (typeof ctx?.refresh === 'function') ctx.refresh()
      else if (typeof ctx?.reload === 'function') ctx.reload()
      else if (typeof ctx?.refreshTasks === 'function') ctx.refreshTasks()
    } catch (err) {
      console.error('toggle task error', err)
      setDoneOptim(prev => ({ ...prev, [taskId]: currentDone }))
    }
  }

  // SHEET EVENTO ACTIONS
  const completaEvento = async (id: string) => {
    if (!id) return
    setHiddenEventi(prev => ({ ...prev, [id]: true }))
    setSheetEvento(null)
    try {
      await supabase.from('eventi').update({ completato: true }).eq('id', id)
      if (typeof ctx?.refresh === 'function') ctx.refresh()
    } catch (err) { console.error('completa evento error', err) }
  }
  const eliminaEvento = async (id: string) => {
    if (!id) return
    setHiddenEventi(prev => ({ ...prev, [id]: true }))
    setSheetEvento(null)
    try {
      await supabase.from('eventi').update({ annullato: true }).eq('id', id)
      if (typeof ctx?.refresh === 'function') ctx.refresh()
    } catch (err) { console.error('elimina evento error', err) }
  }
  const aggiornaEvento = async (id: string, fields: any) => {
    if (!id) return
    try {
      await supabase.from('eventi').update(fields).eq('id', id)
      if (typeof ctx?.refresh === 'function') ctx.refresh()
    } catch (err) { console.error('aggiorna evento error', err) }
  }

  // SHEET TASK ACTIONS
  const eliminaTask = async (id: string) => {
    if (!id) return
    setHiddenTasks(prev => ({ ...prev, [id]: true }))
    setSheetTask(null)
    try {
      await supabase.from('tasks').delete().eq('id', id)
      if (typeof ctx?.refresh === 'function') ctx.refresh()
    } catch (err) { console.error('elimina task error', err) }
  }
  const aggiornaTask = async (id: string, fields: any) => {
    if (!id) return
    try {
      await supabase.from('tasks').update(fields).eq('id', id)
      if (typeof ctx?.refresh === 'function') ctx.refresh()
    } catch (err) { console.error('aggiorna task error', err) }
  }

  const dragState = useRef<any>(null)
  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    const handleEl = e.currentTarget as HTMLElement
    const cardEl = handleEl.closest('[data-card-id]') as HTMLElement
    if (!cardEl) return
    const container = cardEl.parentElement
    if (!container) return
    handleEl.setPointerCapture?.(e.pointerId)
    const rect = cardEl.getBoundingClientRect()
    const ph = document.createElement('div')
    ph.style.cssText = `height: ${rect.height}px; background: rgba(27,58,92,0.08); border: 2px dashed ${NAVY}; border-radius: 14px; margin: 4px 0;`
    container.insertBefore(ph, cardEl)
    cardEl.style.position = 'fixed'; cardEl.style.zIndex = '1000'
    cardEl.style.width = `${rect.width}px`; cardEl.style.left = `${rect.left}px`; cardEl.style.top = `${rect.top}px`
    cardEl.style.pointerEvents = 'none'; cardEl.style.opacity = '0.92'
    cardEl.style.boxShadow = '0 12px 32px rgba(15,31,51,0.4)'
    cardEl.style.transform = 'scale(1.02)'
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
  const fattureDB = (() => {
    const fromCtx = ctx?.fattureDB || []
    if (fromCtx.length > 0) return fromCtx
    try { return JSON.parse(localStorage.getItem('mastro:fatture') || '[]') } catch { return [] }
  })()
  const team = ctx?.team || []
  const _eventiBase = (ctx?.events || ctx?.eventi || data?.agenda?.eventi || []).filter((e: any) => !hiddenEventi[e?.id] && !e?.completato && !e?.annullato)
  const _montaggiEventi = (ctx?.montaggiDB || []).map((mt: any) => { const _cm = (cantieri||[]).find((c:any)=>c.id===mt.commessa_id); return { id: 'mt-'+mt.id, tipo: 'montaggio', data: mt.data_montaggio || '', ora_inizio: mt.ora_inizio ? String(mt.ora_inizio).slice(0,5) : '08:00', titolo: (_cm?.code||'') + ' ' + (_cm?.cliente||'Montaggio'), indirizzo: _cm?.indirizzo || '', commessa_id: mt.commessa_id }; })
  const eventi = [..._eventiBase, ..._montaggiEventi]
  const tasks = (ctx?.tasks || []).filter((t: any) => !t?.done && !hiddenTasks[t?.id])
  const montaggi = ctx?.montaggiDB || ctx?.montaggi || []
  const ferme = cantieri.filter((c: any) => {
    const upd = c?.updated_at ? new Date(c.updated_at).getTime() : 0
    return ((Date.now() - upd) / 86400000) > 5 && (c?.fase === 'preventivo' || c?.fase === 'sopralluogo')
  })
  const daIncassare = fattureDB.reduce((s: number, f: any) => s + (f?.pagata ? 0 : Number(f?.totale || 0)), 0)
  const daIncassareLabel = daIncassare >= 1000 ? `${(daIncassare / 1000).toFixed(1)}k€` : `${Math.round(daIncassare)}€`
  const messaggi = ctx?.talkUnread || 0
  const eventiOggi = eventi.filter((e: any) => {
    const d = parseEventDate(e); return d.toDateString() === new Date().toDateString()
  })
  const prossimiMontaggi = montaggi.filter((m: any) => {
    const dm = m?.data_montaggio || m?.data
    return dm && new Date(dm).getTime() > Date.now()
  }).sort((a: any, b: any) => new Date(a.data_montaggio || a.data).getTime() - new Date(b.data_montaggio || b.data).getTime())

  const aziendaIdResolved = ctx?.aziendaId || (typeof window !== 'undefined' ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id') || '') : '')

  const renderCard = (id: string) => (
    <div key={id} data-card-id={id} style={{
      background: '#FFF', borderRadius: 14, position: 'relative',
      border: editMode ? `2px dashed ${NAVY}` : 'none',
      boxShadow: '0 1px 4px rgba(15,31,51,0.08)',
      animation: editMode ? 'mastroWiggle 0.5s ease-in-out infinite alternate' : undefined,
    }}>
      <ProduzioneBridge />
      {editMode && (
        <>
          <style>{`@keyframes mastroWiggle { from { transform: rotate(-0.4deg); } to { transform: rotate(0.4deg); } }`}</style>
          <div onPointerDown={(e) => startDrag(e, id)} style={{
            position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: 8, background: NAVY, color: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab',
            touchAction: 'none', zIndex: 10, boxShadow: '0 3px 8px rgba(15,31,51,0.4)',
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <circle cx={9} cy={6} r={1.5}/><circle cx={15} cy={6} r={1.5}/>
              <circle cx={9} cy={12} r={1.5}/><circle cx={15} cy={12} r={1.5}/>
              <circle cx={9} cy={18} r={1.5}/><circle cx={15} cy={18} r={1.5}/>
            </svg>
          </div>
        </>
      )}
      <div style={{ padding: '12px 14px', pointerEvents: editMode ? 'none' : 'auto' }}>
        {id === 'agenda' && <CardCalendar eventi={eventi} cantieri={cantieri} apriCM={apriCM} onClick={() => goto('agenda')} apriSheetEvento={(e:any) => setSheetEvento(e)} />}
        {id === 'urgente' && <CardUrgente ferme={ferme} apri={apriCM} />}
        {id === 'task' && <CardTask tasks={tasks} cantieri={cantieri} apri={apriCM} toggleTask={toggleTask} doneOptim={doneOptim} onClick={() => goto('team')} apriSheetTask={(t:any) => setSheetTask(t)} />}
        {id === 'prossimo-montaggio' && <CardMontaggi montaggi={prossimiMontaggi} cantieri={cantieri} team={team} apri={apriCM} onAgenda={() => setShowCentroMontaggi(true)} onMontaggio={(data: string) => { setCentroMontaggiDate(data); setShowCentroMontaggi(true); }} />}
        {id === 'commesse' && <CardCommesse cantieri={cantieri} apri={apriCM} />}
        {id === 'cassa' && <CardCassa daIncassare={daIncassareLabel} fatture={fattureDB} onClick={() => setShowCentroFinanze(true)} />}
        {id === 'squadra' && <CardSquadra team={team} cantieri={cantieri} montaggiDB={montaggi} onClick={() => goto('team')} />}
        {id === 'produzione' && <CardProduzione cantieri={cantieri} apri={apriCM} />}
        {id === 'gestione-materiali' && <CardGestioneMateriali ordini={ctx?.ordiniFornDB || []} magazzino={ctx?.magazzinoArticoli || []} onClick={() => goto('materiali')} />}
        {id === 'clienti' && <CardClienti contatti={ctx?.contatti || ctx?.clienti || []} cantieri={cantieri} onClick={() => goto('clienti')} />}
        {id === 'pianificazione' && <CardPianificazione aziendaId={aziendaIdResolved || ctx?.aziendaId || ''} cantieri={cantieri || []} onClick={(cmId) => { const cm = (cantieri||[]).find((c:any)=>c.id===cmId); if(cm) setOrganizzaCm(cm); }} />}
          {id === 'statistiche' && <CardStatistiche cantieri={cantieri} onClick={() => setShowCentroFinanze(true)} />}
          {id === 'azioni-veloci' && <CardAzioniVeloci
            aziendaId={aziendaIdResolved}
            onProduzione={() => setShowCentroProduzione(true)}
            onMontaggi={() => setShowCentroMontaggi(true)}
            onOrdini={() => setShowCentroOrdini(true)}
            onMagazzino={() => setShowMagazzinoTop(true)}
            onFurgoni={() => setShowCentroFurgoni(true)}
            onFatturazione={() => setShowCentroFinanze(true)}
            onClienti={() => setShowCentroClienti(true)}
            onAgenda={() => goto('agenda')}
            onTeam={() => goto('team')}
            onStatistiche={() => setShowCentroFinanze(true)}
          />}
      </div>
    </div>
  )

  const userInit = (data?.user?.iniziali || ctx?.user?.email?.[0] || 'T').toUpperCase().slice(0, 2)
  const userNome = (data?.user?.nome || ctx?.azienda?.nome || 'TITOLARE').toUpperCase()

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingBottom: 110 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 8px' }}>
        <Stat onClick={() => goto('commesse')} icon="briefcase" value={cantieri.length} label="Commesse attive" />
        <Stat onClick={() => setShowCentroFinanze(true)} icon="cash" value={daIncassareLabel} label="In attesa" />
        <Stat onClick={() => goto('agenda')} icon="calendar" value={eventiOggi.length} label="Eventi oggi" />
        <Stat onClick={() => goto('talk')} icon="msg" value={messaggi} label="Messaggi" badge={messaggi > 0 ? messaggi : null} />
      </div>

      <div style={{ padding: '0 12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.map(id => <CardSafe key={id} name={id}>{renderCard(id)}</CardSafe>)}
      </div>

      {sheetEvento && (
        <SheetEvento
          evento={sheetEvento}
          cantieri={cantieri}
          onClose={() => setSheetEvento(null)}
          onCompleta={completaEvento}
          onElimina={eliminaEvento}
          onAggiorna={aggiornaEvento}
          onApriCM={apriCM}
        />
      )}
      {sheetTask && (
        <SheetTask
          task={sheetTask}
          cantieri={cantieri}
          team={team}
          onClose={() => setSheetTask(null)}
          onCompleta={(id: string) => { setHiddenTasks(prev => ({ ...prev, [id]: true })); setSheetTask(null); toggleTask(id, false) }}
          onElimina={eliminaTask}
          onAggiorna={aggiornaTask}
          onApriCM={apriCM}
        />
      )}

      {organizzaCm && (
        <OrganizzaLavoriPanel
          commessa={organizzaCm}
          aziendaId={(organizzaCm as any).azienda_id || (organizzaCm as any).aziendaId || aziendaIdResolved}
          onClose={() => setOrganizzaCm(null)}
        />
      )}
      <MontaggiSheet montaggiOverride={ctx?.montaggiDB || []} commesseOverride={cantieri || []} open={showCentroMontaggi} onClose={() => setShowCentroMontaggi(false)} onApriCommessa={(cmId) => { const cm = (cantieri||[]).find((c) => c.id===cmId); if(cm) { setShowCentroMontaggi(false); setOrganizzaCm(cm); } }} />
      {showCentroProduzione && (
        <ProduzioneModulo
          aziendaId={aziendaIdResolved}
          onChiudiModulo={() => setShowCentroProduzione(false)}
          onApriMagazzino={() => { setShowCentroProduzione(false); setShowMagazzinoTop(true); }}
        />
      )}
      {showCentroOrdini && (
        <OrdiniGlobaliSheet
          aziendaId={aziendaIdResolved}
          onClose={() => setShowCentroOrdini(false)}
          onApriOrdine={(ordId: string) => { console.log('apri ordine', ordId); }}
          onApriCommessa={(cmId: string) => { const cm = (cantieri||[]).find((c: any)=>c.id===cmId); if(cm) { setShowCentroOrdini(false); setOrganizzaCm(cm); } }}
        />
      )}
      {showMagazzinoTop && (
        <ModuloMagazzino
          aziendaId={String((typeof window !== "undefined" && (window as any).__AZIENDA_ID__) || "ccca51c1-656b-4e7c-a501-55753e20da29")}
          onClose={() => setShowMagazzinoTop(false)}
        />
      )}
      {showCentroMagazzino && (
        <CentroControlloMagazzino
          aziendaId={aziendaIdResolved}
          onClose={() => setShowCentroMagazzino(false)}
          onApriCommessa={(cmId: string) => { const cm = (cantieri||[]).find((c: any)=>c.id===cmId); if(cm) { setShowCentroMagazzino(false); setOrganizzaCm(cm); } }}
        />
      )}
      {showCentroFurgoni && (
        <CentroPreparazioneFurgoni
          aziendaId={aziendaIdResolved}
          onClose={() => setShowCentroFurgoni(false)}
          onApriCommessa={(cmCode: string) => { const cm = (cantieri||[]).find((c: any)=>c.code===cmCode); if(cm) { setShowCentroFurgoni(false); setOrganizzaCm(cm); } }}
        />
      )}
      {showCentroClienti && (
        <CentroClienti
          aziendaId={aziendaIdResolved}
          onClose={() => setShowCentroClienti(false)}
          onApriCommessa={(cmId: string) => { const cm = (cantieri||[]).find((c: any)=>c.id===cmId); if(cm) { setShowCentroClienti(false); setOrganizzaCm(cm); } }}
        />
      )}
      {showCentroFinanze && (
        <CentroFinanze
          aziendaId={aziendaIdResolved}
          onClose={() => setShowCentroFinanze(false)}
          onCreaFattura={() => window.dispatchEvent(new CustomEvent('mastro:fin:nuova-fattura'))}
          onPagamentoRicevuto={(fId) => window.dispatchEvent(new CustomEvent('mastro:fin:pagamento-in', { detail: { fatturaId: fId } }))}
          onNuovaSpesa={() => window.dispatchEvent(new CustomEvent('mastro:fin:nuova-spesa'))}
          onPagamentoFornitore={(fId) => window.dispatchEvent(new CustomEvent('mastro:fin:pagamento-out', { detail: { fatturaId: fId } }))}
          onFatturaRicevuta={() => window.dispatchEvent(new CustomEvent('mastro:fin:fattura-ricevuta'))}
        />
      )}
    </div>
  )
}

function SheetEvento({ evento, cantieri, onClose, onCompleta, onElimina, onAggiorna, onApriCM }: any) {
  const [editMode, setEditMode] = useState(false)
  const [data, setData] = useState(evento?.data || '')
  const [ora, setOra] = useState(evento?.ora_inizio || evento?.ora || '')
  const [note, setNote] = useState(evento?.note || '')
  const cm = cantieri.find((c: any) => c?.id === evento?.commessa_id)
  const telefono = evento?.telefono || cm?.telefono || cm?.cliente_telefono
  const indirizzo = evento?.indirizzo || cm?.indirizzo
  const tipo = (evento?.tipo || 'evento').toUpperCase()
  const titolo = eventTitle(evento)
  const dataObj = parseEventDate(evento)

  const handleSave = async () => {
    await onAggiorna(evento.id, { data, ora_inizio: ora, note })
    setEditMode(false)
  }

  const naviga = () => {
    if (!indirizzo) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}`, '_blank')
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,51,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 8 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 14, boxShadow: '0 4px 24px rgba(15,31,51,0.25)', width: '100%', maxWidth: 420, overflow: 'hidden', marginBottom: 70 }}>
        <div style={{ padding: '12px 14px 10px', background: '#F1F4F7', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ width: 6, height: 6, borderRadius: 50, background: NAVY }}/>
            <span style={{ fontSize: 9, color: NAVY, fontWeight: 700, letterSpacing: 0.5 }}>{tipo}</span>
            <span style={{ fontSize: 9, color: MUTED }}>· {dataObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} · {dataObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{titolo || 'Evento'}</div>
        </div>

        {!editMode ? (
          <>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {indirizzo ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
                <span style={{ fontSize: 11, color: TEXT }}>{indirizzo}</span>
              </div> : null}
              {cm ? <div onClick={() => { onClose(); onApriCM(cm.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.2}><rect x={2} y={7} width={20} height={14} rx={2}/></svg>
                <span style={{ fontSize: 11, color: NAVY, fontWeight: 600 }}>{cm?.codice || cm?.code} · {cm?.cliente || cm?.cliente_nome || ''}</span>
              </div> : null}
              {evento?.note ? <div style={{ fontSize: 11, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>{evento.note}</div> : null}
            </div>

            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button onClick={() => onCompleta(evento.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                Completa
              </button>
              {telefono ? <a href={`tel:${telefono}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, background: '#F1F4F7', color: NAVY, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2.5}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Chiama
              </a> : null}
              {indirizzo ? <button onClick={naviga} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, background: '#F1F4F7', color: NAVY, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2.5}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
                Naviga
              </button> : null}
              <button onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, background: '#F1F4F7', color: NAVY, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2.5}><path d="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Modifica
              </button>
            </div>

            <div style={{ padding: '8px 14px 12px', display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${BORDER}`, marginTop: 2 }}>
              <button onClick={() => onElimina(evento.id)} style={{ background: 'none', border: 'none', color: RED, fontSize: 10, cursor: 'pointer', padding: 4 }}>Elimina evento</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>DATA</div>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, background: '#F7F9FB', color: TEXT }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>ORA</div>
                <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, background: '#F7F9FB', color: TEXT }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>NOTE</div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, background: '#F7F9FB', color: TEXT, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ padding: '0 14px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button onClick={() => setEditMode(false)} style={{ padding: 9, background: '#F1F4F7', color: MUTED, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Annulla</button>
              <button onClick={handleSave} style={{ padding: 9, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Salva</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SheetTask({ task, cantieri, team, onClose, onCompleta, onElimina, onAggiorna, onApriCM }: any) {
  const [editMode, setEditMode] = useState(false)
  const [testo, setTesto] = useState(task?.testo || '')
  const [scadenza, setScadenza] = useState(task?.data || '')
  const cm = cantieri.find((c: any) => c?.id === task?.commessa_id)
  const op = team.find((t: any) => t?.id === task?.assegnata_a || t?.id === task?.utente_id)
  const prio = (task?.priorita || '').toLowerCase()
  const scad = task?.data ? new Date(task.data) : null
  const isLate = scad && scad.getTime() < Date.now() - 86400000

  const handleSave = async () => {
    await onAggiorna(task.id, { testo, data: scadenza })
    setEditMode(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,51,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 8 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 14, boxShadow: '0 4px 24px rgba(15,31,51,0.25)', width: '100%', maxWidth: 420, overflow: 'hidden', marginBottom: 70 }}>
        <div style={{ padding: '12px 14px 10px', background: '#F1F4F7', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <button onClick={() => onCompleta(task.id)} style={{ width: 22, height: 22, borderRadius: 5, border: `1.5px solid ${NAVY}`, background: '#FFF', cursor: 'pointer', flexShrink: 0, marginTop: 1, padding: 0 }} aria-label="Completa task" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {prio ? <span style={{ fontSize: 9, color: '#FFF', background: TEAL, padding: '2px 7px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>{prio.toUpperCase()}</span> : null}
              {scad ? <span style={{ fontSize: 9, color: isLate ? TEXT : MUTED, fontWeight: 700 }}>{scad.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}{isLate ? ' SCADUTA' : ''}</span> : null}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{(task?.testo || 'Task').replace(/[\u2705\u2611\u2713\u2714\uD83D\uDCC5]/g, '').replace(/\s+/g, ' ').trim()}</div>
          </div>
        </div>

        {!editMode ? (
          <>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cm ? <div onClick={() => { onClose(); onApriCM(cm.id) }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.2}><rect x={2} y={7} width={20} height={14} rx={2}/></svg>
                <span style={{ fontSize: 11, color: NAVY, fontWeight: 600 }}>{cm?.codice || cm?.code} · {cm?.cliente || cm?.cliente_nome || ''}</span>
              </div> : null}
              {op ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>
                <span style={{ fontSize: 11, color: TEXT }}>{op?.nome || 'Operatore'}{op?.cognome ? ` ${op.cognome[0]}.` : ''}</span>
              </div> : null}
            </div>

            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {cm ? <button onClick={() => { onClose(); onApriCM(cm.id) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Apri commessa
              </button> : null}
              <button onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, background: '#F1F4F7', color: NAVY, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Modifica
              </button>
            </div>

            <div style={{ padding: '8px 14px 12px', display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${BORDER}`, marginTop: 2 }}>
              <button onClick={() => onElimina(task.id)} style={{ background: 'none', border: 'none', color: RED, fontSize: 10, cursor: 'pointer', padding: 4 }}>Elimina task</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>TESTO</div>
                <textarea value={testo} onChange={(e) => setTesto(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, background: '#F7F9FB', color: TEXT, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>SCADENZA</div>
                <input type="date" value={scadenza} onChange={(e) => setScadenza(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, background: '#F7F9FB', color: TEXT }} />
              </div>
            </div>
            <div style={{ padding: '0 14px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button onClick={() => setEditMode(false)} style={{ padding: 9, background: '#F1F4F7', color: MUTED, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Annulla</button>
              <button onClick={handleSave} style={{ padding: 9, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Salva</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, value, label, badge, onClick }: any) {
  const Ico = () => {
    if (icon === 'briefcase') return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    if (icon === 'cash') return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={6} width={20} height={12} rx={2}/><circle cx={12} cy={12} r={2}/></svg>
    if (icon === 'calendar') return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/></svg>
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
      {link ? <span onClick={onClick} style={{ color: NAVY, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{link} ›</span> : null}
    </div>
  )
}

function Row({ label, value, color, last, onClick }: any) {
  return (
    <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: last ? 'none' : `1px solid ${BORDER}`, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 13, color: color || TEXT, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{value}</span>
    </div>
  )
}

function CardCalendar({ eventi, cantieri, apriCM, onClick, apriSheetEvento }: any) {
  const [view, setView] = useState<'giorno' | 'settimana' | 'mese'>('mese')
  const [cursor, setCursor] = useState(new Date())
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const today = new Date()
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const eventByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    eventi.forEach((e: any) => {
      const d = parseEventDate(e)
      if (isNaN(d.getTime())) return
      const k = d.toDateString(); if (!map[k]) map[k] = []
      map[k].push(e)
    })
    return map
  }, [eventi])
  const eventiSel = (eventByDay[cursor.toDateString()] || []).sort((a: any, b: any) =>
    parseEventDate(a).getTime() - parseEventDate(b).getTime()
  )
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
  const goPrev = () => { if (view === 'mese') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); else if (view === 'settimana') setCursor(new Date(cursor.getTime() - 7 * 86400000)); else setCursor(new Date(cursor.getTime() - 86400000)) }
  const goNext = () => { if (view === 'mese') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); else if (view === 'settimana') setCursor(new Date(cursor.getTime() + 7 * 86400000)); else setCursor(new Date(cursor.getTime() + 86400000)) }
  const navOggi = (e: any) => { e.stopPropagation(); setCursor(new Date()) }
  const goPrevDay = () => setCursor(new Date(cursor.getTime() - 86400000))
  const goNextDay = () => setCursor(new Date(cursor.getTime() + 86400000))
  const monthLabel = `${MESI[cursor.getMonth()]} ${cursor.getFullYear()}`
  const days = buildMonth()
  const weekDays = useMemo(() => {
    const dow = (cursor.getDay() + 6) % 7
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - dow)
    return Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 86400000))
  }, [cursor])

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
        <button onClick={navOggi} style={{ padding: '4px 12px', borderRadius: 6, background: '#F1F4F7', color: MUTED, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}>OGGI</button>
      </div>

      {view === 'mese' && (
        <SwipeArea onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {DOW.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#8FA8B8', padding: '2px 0' }}>{d}</div>)}
            {days.map((d, i) => {
              const isT = isSameDay(d.date, today), isS = isSameDay(d.date, cursor)
              const evs = !d.muted ? (eventByDay[d.date.toDateString()] || []) : []
              const hasEvs = evs.length > 0
              const numColor = d.muted ? '#C8D2DA' : isT ? '#FFF' : TEXT
              return (
                <div key={i} onClick={(e) => { e.stopPropagation(); setCursor(d.date) }} style={{
                  aspectRatio: '1/1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', borderRadius: 8, position: 'relative',
                  background: isT ? NAVY : (isS && !d.muted ? '#E5EAF0' : (hasEvs && !d.muted ? dotColor(evs[0]) + '15' : 'transparent')),
                }}>
                  <span style={{ fontSize: 12, fontWeight: isT ? 700 : 400, color: numColor, lineHeight: 1 }}>
                    {d.date.getDate()}
                  </span>
                  {hasEvs && !d.muted ? (
                    <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                      {evs.slice(0, 3).map((ev: any, ei: number) => (
                        <div key={ei} style={{
                          width: 10, height: 2.5, borderRadius: 2,
                          background: isT ? 'rgba(255,255,255,0.85)' : dotColor(ev),
                        }}/>
                      ))}
                    </div>
                  ) : <div style={{ height: 5 }}/>}
                </div>
              )
            })}
          </div>
        </SwipeArea>
      )}

      {view === 'settimana' && (
        <SwipeArea onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {weekDays.map((d, i) => {
              const isT = isSameDay(d, today), isS = isSameDay(d, cursor)
              const evs = (eventByDay[d.toDateString()] || []).sort((a: any, b: any) => parseEventDate(a).getTime() - parseEventDate(b).getTime())
              const dayKey = d.toDateString()
              const isExpanded = expandedDay === dayKey
              return (
                <div key={i} style={{
                  background: isT ? '#E5EAF0' : (isExpanded ? '#F1F4F7' : (isS ? '#F1F4F7' : '#F7F9FB')),
                  borderLeft: (isT || isExpanded) ? `3px solid ${NAVY}` : '3px solid transparent',
                  borderRadius: 8, padding: '8px 10px',
                }}>
                  <div onClick={(e) => { e.stopPropagation(); setCursor(d); setExpandedDay(isExpanded ? null : dayKey) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: isT ? NAVY : MUTED, minWidth: 28 }}>{DOW_SHORT[i]}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{d.getDate()}</div>
                      <div style={{ fontSize: 10, color: MUTED, textTransform: 'lowercase' }}>{MESI[d.getMonth()].slice(0, 3)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, color: isExpanded ? NAVY : MUTED, fontWeight: 700, background: isExpanded ? '#FFF' : 'transparent', padding: isExpanded ? '2px 6px' : 0, borderRadius: 4 }}>{evs.length === 0 ? '—' : `${evs.length} EVENTI`}</span>
                      {evs.length > 0 ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={isExpanded ? NAVY : MUTED} strokeWidth={2.5}>{isExpanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</svg> : null}
                    </div>
                  </div>
                  {isExpanded && evs.length > 0 ? (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, borderTop: `1px solid rgba(0,0,0,0.06)` }}>
                      {evs.map((e: any, j: number) => {
                        const data = parseEventDate(e)
                        return (
                          <div key={j} onClick={(ev) => { ev.stopPropagation(); apriSheetEvento(e) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', background: 'rgba(255,255,255,0.6)', borderRadius: 4, cursor: 'pointer' }}>
                            <div style={{ width: 6, height: 6, borderRadius: 50, background: dotColor(e), flexShrink: 0 }}/>
                            <span style={{ fontSize: 10, color: MUTED, fontFeatureSettings: '"tnum"', fontWeight: 600, minWidth: 36 }}>{data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ fontSize: 11, color: TEXT, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{eventTitle(e)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </SwipeArea>
      )}

      {view === 'giorno' && (
        <SwipeArea onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <div style={{ background: '#F7F9FB', borderRadius: 8, padding: 10, minHeight: 100 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 8, textTransform: 'capitalize' }}>{cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            {eventiSel.length === 0 ? <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '12px 0' }}>Nessun evento programmato</div> : null}
            {eventiSel.map((e: any, i: number) => {
              const data = parseEventDate(e)
              return (
                <div key={i} onClick={(ev) => { ev.stopPropagation(); apriSheetEvento(e) }} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < eventiSel.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 50, background: dotColor(e) }}/>
                    <div style={{ fontSize: 11, color: MUTED, fontFeatureSettings: '"tnum"', fontWeight: 700, minWidth: 38 }}>{data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{eventTitle(e)}</div>
                    {e?.tipo ? <div style={{ fontSize: 10, color: NAVY, marginTop: 1 }}>{e.tipo}</div> : null}
                    {eventLuogo(e) ? <div style={{ fontSize: 10, color: MUTED, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg>{eventLuogo(e)}</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </SwipeArea>
      )}

      {view === 'mese' && eventiSel.length > 0 ? (
        <SwipeArea onSwipeLeft={goNextDay} onSwipeRight={goPrevDay} style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>{cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' }).toUpperCase()} · {eventiSel.length} EVENTI</div>
          {eventiSel.map((e: any, i: number) => {
            const data = parseEventDate(e)
            return (
              <div key={i} onClick={(ev) => { ev.stopPropagation(); apriSheetEvento(e) }} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: i < eventiSel.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 50, background: dotColor(e) }}/>
                  <div style={{ fontSize: 10, color: MUTED, fontFeatureSettings: '"tnum"', fontWeight: 700, minWidth: 38 }}>{data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{eventTitle(e)}</div>
                  {eventLuogo(e) ? <div style={{ fontSize: 10, color: MUTED, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg>{eventLuogo(e)}</div> : null}
                </div>
              </div>
            )
          })}
        </SwipeArea>
      ) : null}

      <button onClick={onClick} style={{ marginTop: 10, background: 'transparent', border: 'none', color: NAVY, fontSize: 10, fontWeight: 600, cursor: 'pointer', width: '100%', padding: 4 }}>APRI AGENDA COMPLETA →</button>
    </>
  )
}

function CardUrgente({ ferme, apri }: any) {
  const top = ferme.slice(0, SHOW_VERTICAL)
  const rest = ferme.slice(SHOW_VERTICAL)
  return (
    <div style={{ background: '#FCEFEC', margin: '-12px -14px', padding: '12px 14px', borderRadius: 14, position: 'relative' }}>
      <span style={{ position: 'absolute', top: -6, left: 12, background: RED, color: '#FFF', fontSize: 9, padding: '3px 9px', borderRadius: 5, fontWeight: 700, letterSpacing: 0.5 }}>URGENTE</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill={RED}><path d="M12 2L2 22h20L12 2zm-1 6v8h2V8h-2zm0 10v2h2v-2h-2z"/></svg>
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{ferme.length} commesse ferme</span>
      </div>
      {ferme.length === 0 ? <div style={{ fontSize: 11, color: MUTED }}>Tutto sotto controllo</div> : null}
      {top.map((c: any, i: number) => {
        const upd = c?.updated_at ? new Date(c.updated_at).getTime() : 0
        const giorni = Math.floor((Date.now() - upd) / 86400000)
        return (
          <div key={i} onClick={() => apri(c?.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < top.length - 1 || rest.length > 0 ? `1px solid rgba(199,62,29,0.15)` : 'none', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code}</span>
                <span style={{ fontSize: 8, color: '#FFF', background: RED, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{giorni}g</span>
              </div>
              <div style={{ fontSize: 11, color: TEXT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.cliente || c?.cliente_nome || ''}</div>
              <div style={{ fontSize: 9, color: NAVY, marginTop: 1, fontWeight: 600, textTransform: 'uppercase' }}>{c?.fase}</div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )
      })}
      {rest.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: MUTED, fontWeight: 600, marginBottom: 4 }}>+{rest.length} altre · scorri →</div>
          <SwipeTrack>
            {rest.map((c: any, i: number) => (
              <SwipeItem key={i} width="180px" onClick={() => apri(c?.id)}>
                <div style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c?.cliente || c?.cliente_nome || ''}</div>
                <div style={{ fontSize: 9, color: RED, marginTop: 4, fontWeight: 700 }}>APRI →</div>
              </SwipeItem>
            ))}
          </SwipeTrack>
        </div>
      ) : null}
    </div>
  )
}

function CardTask({ tasks, cantieri, apri, toggleTask, doneOptim, onClick, apriSheetTask }: any) {
  return (
    <>
      <CardHead title="Task" badge={tasks.length} link="vedi tutte" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
      {tasks.length === 0 ? <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessuna task aperta</div> : null}
      <div className="mastro-tasks-scroll" style={{ maxHeight: 320, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <style>{`.mastro-tasks-scroll::-webkit-scrollbar{display:none}.mastro-tasks-scroll{scrollbar-width:none}`}</style>
        {tasks.map((t: any, i: number) => {
          const cm = cantieri.find((c: any) => c?.id === t?.commessa_id)
          const scad = t?.data ? new Date(t.data) : null
          const isLate = scad && scad.getTime() < Date.now() - 86400000
          const prio = (t?.priorita || '').toLowerCase()
          const prioColor = prio === 'alta' ? TEAL : prio === 'media' ? TEAL : MUTED
          const localDone = doneOptim?.[t?.id] !== undefined ? doneOptim[t.id] : !!t?.done
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < tasks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTask(t?.id, localDone) }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label={localDone ? 'Riapri task' : 'Completa task'}
                style={{ width: 22, height: 22, borderRadius: 5, border: '1.5px solid #C8E4E4', flexShrink: 0, background: localDone ? TEAL : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.15s ease' }}
              >
                {localDone ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : null}
              </button>
              <div onClick={() => apriSheetTask(t)} style={{ flex: 1, minWidth: 0, cursor: 'pointer', opacity: localDone ? 0.5 : 1 }}>
                <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, lineHeight: 1.3, textDecoration: localDone ? 'line-through' : 'none' }}>{(t?.testo || 'Task').replace(/[\u2705\u2611\u2713\u2714\uD83D\uDCC5]/g, '').replace(/\s+/g, ' ').trim()}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  {scad ? <span style={{ fontSize: 10, color: isLate ? TEXT : MUTED, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{scad.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}{isLate ? ' SCADUTA' : ''}</span> : null}
                  {prio ? <span style={{ fontSize: 9, color: '#FFF', background: prioColor, padding: '2px 7px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>{prio.toUpperCase()}</span> : null}
                  {cm ? <span style={{ fontSize: 10, color: NAVY, fontWeight: 600 }}>↗ {cm?.codice || cm?.code}</span> : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function CardMontaggi({ montaggi, cantieri, team, apri, onAgenda, onMontaggio }: any) {
  const top = montaggi.slice(0, SHOW_VERTICAL)
  const rest = montaggi.slice(SHOW_VERTICAL)
  return (
    <>
      <CardHead title="Prossimi montaggi" badge={montaggi.length} link="montaggi" onClick={() => onAgenda?.()} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>} />
      {montaggi.length === 0 ? <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun montaggio programmato</div> : null}
      {top.map((m: any, i: number) => {
        const dStr = m?.data_montaggio || m?.data
        const d = new Date(dStr)
        const cm = cantieri.find((c: any) => c?.id === m?.commessa_id)
        const dgg = Math.floor((d.getTime() - Date.now()) / 86400000)
        return (
          <div key={i} onClick={() => onMontaggio?.(dStr || '')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < top.length - 1 || rest.length > 0 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
            <div style={{ flex: '0 0 50px', textAlign: 'center', background: dgg <= 1 ? RED : (dgg <= 3 ? AMBER : NAVY), color: '#FFF', borderRadius: 6, padding: '4px 0' }}>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{d.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: TEXT, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cm?.cliente || cm?.cliente_nome || cm?.codice || 'Cliente'}</span>
                {cm?.codice ? <span style={{ fontSize: 8, color: NAVY, background: '#E5EAF0', padding: '1px 5px', borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>{cm.codice}</span> : null}
                {m?.urgente ? <span style={{ fontSize: 8, color: '#FFF', background: RED, padding: '1px 5px', borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>URGENTE</span> : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' as const }}>
                {m?.ora_inizio ? <span style={{ fontSize: 10, color: MUTED, display: 'flex', alignItems: 'center', gap: 3 }}><svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></svg>{String(m.ora_inizio).slice(0,5)}{m?.ora_fine ? ` → ${String(m.ora_fine).slice(0,5)}` : ''}</span> : null}
                {m?.durata_minuti ? <span style={{ fontSize: 10, color: MUTED }}>⏱ {m.durata_minuti >= 60 ? `${Math.round(m.durata_minuti/60)}h` : `${m.durata_minuti}min`}</span> : null}
                {m?.ore_preventivate ? <span style={{ fontSize: 10, color: MUTED }}>📋 {m.ore_preventivate}h</span> : null}
              </div>
              {cm?.indirizzo ? <div style={{ fontSize: 10, color: MUTED, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}><svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cm.indirizzo}</span></div> : null}
              {(m?.squadra || []).length > 0 ? <div style={{ fontSize: 10, color: TEAL, marginTop: 2, fontWeight: 600 }}>👷 {(m.squadra || []).slice(0,3).join(', ')}{(m.squadra||[]).length > 3 ? ` +${(m.squadra||[]).length-3}` : ''}</div> : null}
              {m?.stato && m.stato !== 'da_pianificare' ? <div style={{ fontSize: 9, fontWeight: 700, color: m.stato === 'completato' ? GREEN : AMBER, marginTop: 2, textTransform: 'uppercase' as const }}>{m.stato.replace(/_/g,' ')}</div> : null}
            </div>
          </div>
        )
      })}
      {rest.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: MUTED, fontWeight: 600, marginBottom: 4 }}>+{rest.length} altri · scorri →</div>
          <SwipeTrack>
            {rest.map((m: any, i: number) => {
              const dStr = m?.data_montaggio || m?.data
              const d = new Date(dStr)
              const cm = cantieri.find((c: any) => c?.id === m?.commessa_id)
              return (
                <SwipeItem key={i} width="180px" onClick={() => cm && apri(cm.id)}>
                  <div style={{ fontSize: 9, color: NAVY, fontWeight: 700 }}>{d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  <div style={{ fontSize: 11, color: TEXT, fontWeight: 700, marginTop: 2 }}>{cm?.cliente || cm?.codice || 'Cliente'}</div>
                </SwipeItem>
              )
            })}
          </SwipeTrack>
        </div>
      ) : null}
    </>
  )
}

function CardCommesse({ cantieri, apri }: any) {
  const top = cantieri.slice(0, SHOW_VERTICAL)
  const rest = cantieri.slice(SHOW_VERTICAL)
  return (
    <>
      <CardHead title="Commesse attive" badge={cantieri.length} link="vedi tutte" onClick={() => apri('')} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/></svg>} />
      {cantieri.length === 0 ? <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessuna commessa attiva</div> : null}
      {top.map((c: any, i: number) => (
        <div key={i} onClick={() => apri(c?.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < top.length - 1 || rest.length > 0 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code}</span>
              <span style={{ fontSize: 8, color: NAVY, background: '#E5EAF0', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(c?.fase || '').toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11, color: TEXT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.cliente || c?.cliente_nome || ''}</div>
            {c?.indirizzo ? <div style={{ fontSize: 9, color: MUTED, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}><svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.indirizzo}</span></div> : null}
          </div>
          {c?.totale ? <div style={{ fontSize: 11, color: TEXT, fontWeight: 700, flexShrink: 0 }}>{Math.round(Number(c.totale))}€</div> : null}
        </div>
      ))}
      {rest.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: MUTED, fontWeight: 600, marginBottom: 4 }}>+{rest.length} altre · scorri →</div>
          <SwipeTrack>
            {rest.map((c: any, i: number) => (
              <SwipeItem key={i} width="180px" onClick={() => apri(c?.id)}>
                <div style={{ fontSize: 11, color: TEXT, fontWeight: 700 }}>{c?.codice || c?.code}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c?.cliente || c?.cliente_nome || ''}</div>
                <div style={{ fontSize: 9, color: NAVY, marginTop: 4, fontWeight: 700 }}>APRI →</div>
              </SwipeItem>
            ))}
          </SwipeTrack>
        </div>
      ) : null}
    </>
  )
}

function CardCassa({ daIncassare, fatture, onClick }: any) {
  const scadute = fatture.filter((f: any) => !f?.pagata && f?.scadenza && new Date(f.scadenza).getTime() < Date.now())
  const scaduteAmt = scadute.reduce((s: number, f: any) => s + Number(f?.totale || 0), 0)
  const incassate = fatture.filter((f: any) => f?.pagata)
  const incassateAmt = incassate.reduce((s: number, f: any) => s + Number(f?.totale || 0), 0)
  return (
    <>
      <CardHead title="Cassa" link="apri Centro Finanze" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={6} width={20} height={12} rx={2}/><circle cx={12} cy={12} r={2}/></svg>} />
      <Row label="Da incassare" value={daIncassare} color={TEXT} onClick={onClick} />
      {scadute.length > 0 ? <Row label={`Scadute (${scadute.length})`} value={`${Math.round(scaduteAmt)}€`} color={RED} onClick={onClick} /> : null}
      {incassate.length > 0 ? <Row label={`Incassate (${incassate.length})`} value={`${Math.round(incassateAmt)}€`} color={GREEN} last onClick={onClick} /> : null}
    </>
  )
}

function OperatoreDrawer({ op, montaggi, cantieri, onClose }: { op: any; montaggi: any[]; cantieri: any[]; onClose: () => void }) {
  const STATO: Record<string, { dot: string; label: string }> = {
    attivo:   { dot: '#1D9E75', label: 'Attivo' },
    pausa:    { dot: '#EF9F27', label: 'In pausa' },
    problema: { dot: '#E24B4A', label: 'Problema' },
    viaggio:  { dot: '#378ADD', label: 'In viaggio' },
    libero:   { dot: '#8FA8A8', label: 'Libero' },
  }
  const stato = op?.stato || op?.status || 'libero'
  const cfg = STATO[stato] || STATO.libero
  const nome = op?.nome || op?.name || 'Operatore'
  const cognome = op?.cognome ? ` ${op.cognome}` : ''
  const nomeCompleto = nome + cognome

  // Montaggi futuri assegnati a questo operatore
  const todayStr = new Date().toISOString().slice(0, 10)
  const montaggiOp = montaggi.filter((m: any) => {
    const sq: string[] = m?.squadra || []
    const dataOk = (m?.data_montaggio || '') >= todayStr
    const isAssegnato = sq.includes(op?.id) || sq.includes(nome) || m?.operatore_id === op?.id
    return dataOk && isAssegnato
  }).sort((a: any, b: any) => (a.data_montaggio || '').localeCompare(b.data_montaggio || ''))

  const prossimo = montaggiOp[0] || null
  const cm = prossimo ? cantieri.find((c: any) => c.id === prossimo.commessa_id) : null

  const fmtData = (d: string) => {
    if (!d) return ''
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  const fmtOra = (o: string) => o ? String(o).slice(0, 5) : ''
  const fmtDurata = (min: number) => min >= 60 ? `${Math.round(min/60)}h` : `${min}min`

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFF', borderRadius: '20px 20px 0 0', padding: '0 0 36px', width: '100%', boxShadow: '0 -4px 32px rgba(0,0,0,0.18)' }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '12px auto 0' }}/>
        {/* Header colorato */}
        <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg.dot + '20', color: cfg.dot, fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, border: `2px solid ${cfg.dot}40` }}>
              {nome.slice(0,1).toUpperCase()}
              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 14, height: 14, borderRadius: 4, background: cfg.dot, border: '2px solid #FFF' }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{nomeCompleto}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{op?.ruolo || 'Operatore'}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: cfg.dot + '18', color: cfg.dot }}>● {cfg.label}</div>
          </div>
        </div>

        {/* Info prossimo lavoro */}
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prossimo ? (
            <div style={{ background: '#F0FAF9', borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${TEAL}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, marginBottom: 6, letterSpacing: '0.4px' }}>PROSSIMO LAVORO</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cm?.codice || cm?.code || '—'} · {cm?.cliente || cm?.ragione || 'Cliente'}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <div style={{ fontSize: 11, color: MUTED }}>
                  <span style={{ fontWeight: 600, color: TEXT }}>{fmtData(prossimo.data_montaggio)}</span>
                  {prossimo.ora_inizio ? <span> · {fmtOra(prossimo.ora_inizio)}</span> : null}
                </div>
                {prossimo.durata_minuti ? <div style={{ fontSize: 11, color: MUTED }}>⏱ {fmtDurata(prossimo.durata_minuti)}</div> : null}
                {prossimo.ore_preventivate ? <div style={{ fontSize: 11, color: MUTED }}>📋 {prossimo.ore_preventivate}h prev.</div> : null}
              </div>
              {prossimo.stato && prossimo.stato !== 'da_pianificare' ? (
                <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase' }}>{prossimo.stato.replace(/_/g, ' ')}</div>
              ) : null}
            </div>
          ) : (
            <div style={{ background: '#F7F9FB', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: MUTED, textAlign: 'center' }}>Nessun lavoro programmato</div>
            </div>
          )}

          {montaggiOp.length > 1 ? (
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>+{montaggiOp.length - 1} altri lavori in programma</div>
          ) : null}
        </div>

        {/* Azioni */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 10 }}>
          {op?.telefono ? (
            <>
              <a href={`tel:${op.telefono}`} style={{ flex: 1, padding: '13px 0', background: GREEN, color: '#FFF', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Chiama
              </a>
              <a href={`https://wa.me/39${op.telefono.replace(/[^\d]/g,'')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '13px 0', background: '#25D366', color: '#FFF', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.934 1.397 5.612L0 24l6.562-1.381A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.001-1.366l-.36-.214-3.719.782.802-3.619-.233-.372A9.818 9.818 0 1 1 12 21.818z"/></svg>
                WhatsApp
              </a>
            </>
          ) : (
            <div style={{ flex: 1, padding: '13px 0', background: '#F1F4F7', color: MUTED, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>Nessun telefono registrato</div>
          )}
        </div>
      </div>
    </div>
  )
}

function CardSquadra({ team, cantieri, montaggiDB, onClick }: any) {
  const [drawerOp, setDrawerOp] = useState<any>(null)
  const todayStr = new Date().toISOString().slice(0, 10)
  const montaggiOggi = (montaggiDB || []).filter((m: any) => {
    const d = m?.data || m?.dataMontaggio || m?.data_montaggio || ''
    return String(d).startsWith(todayStr)
  })
  const attivi   = team.filter((t: any) => (t?.stato || t?.status) === 'attivo').length
  const problemi = team.filter((t: any) => (t?.stato || t?.status) === 'problema').length
  const top  = team.slice(0, SHOW_VERTICAL)
  const rest = team.slice(SHOW_VERTICAL)

  const STATO: Record<string, { dot: string; label: string }> = {
    attivo:   { dot: '#1D9E75', label: 'Attivo' },
    pausa:    { dot: '#EF9F27', label: 'Pausa' },
    problema: { dot: '#E24B4A', label: 'Problema' },
    viaggio:  { dot: '#378ADD', label: 'Viaggio' },
    libero:   { dot: '#8FA8A8', label: 'Libero' },
  }

  return (
    <>
      <CardHead title="Squadra" badge={`${attivi}/${team.length}`} link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>} />

      {/* KPI bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1, background: 'rgba(29,158,117,0.1)', borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#04342C', lineHeight: 1 }}>{attivi}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#1D9E75', marginTop: 2 }}>ATTIVI</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(143,168,168,0.1)', borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{team.length}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: MUTED, marginTop: 2 }}>TOTALE</div>
        </div>
        <div style={{ flex: 1, background: montaggiOggi.length > 0 ? 'rgba(55,138,221,0.1)' : 'rgba(143,168,168,0.08)', borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: montaggiOggi.length > 0 ? '#042C53' : TEXT, lineHeight: 1 }}>{montaggiOggi.length}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: montaggiOggi.length > 0 ? '#378ADD' : MUTED, marginTop: 2 }}>OGGI</div>
        </div>
        {problemi > 0 && (
          <div style={{ flex: 1, background: 'rgba(226,75,74,0.1)', borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#8B1A1A', lineHeight: 1 }}>{problemi}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#E24B4A', marginTop: 2 }}>PROB.</div>
          </div>
        )}
      </div>

      {team.length === 0 ? <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun operatore</div> : null}
      {top.map((t: any, i: number) => {
        const stato = (t?.stato || t?.status || 'libero') as string
        const cfg = STATO[stato] || STATO.libero
        const cm = cantieri.find((c: any) => c?.id === t?.commessa_attuale_id)
        const montaggioOp = montaggiOggi.find((m: any) => {
          const sq: string[] = m?.squadra || m?.operatori || []
          return m?.operatoreId === t?.id || m?.operatore_id === t?.id || sq.includes(t?.id) || sq.includes(t?.nome)
        })
        const cmLabel = montaggioOp
          ? (montaggioOp?.cmCode || montaggioOp?.codice || montaggioOp?.cliente || 'Montaggio')
          : cm?.codice || null
        return (
          <div key={i} onClick={() => setDrawerOp(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < top.length - 1 || rest.length > 0 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: t?.colore || cfg.dot + '22', color: cfg.dot, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, position: 'relative', flexShrink: 0, border: `1.5px solid ${cfg.dot}40` }}>
              {(t?.nome || '?').slice(0, 1).toUpperCase()}
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 3, background: cfg.dot, border: '2px solid #FFF' }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.nome || 'Op'}{t?.cognome ? ` ${t.cognome[0]}.` : ''}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.ruolo || 'Operatore'}{cmLabel ? ` · ${cmLabel}` : ''}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: cfg.dot + '18', color: cfg.dot, letterSpacing: '0.3px' }}>● {cfg.label}</div>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        )
      })}
      {rest.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: MUTED, fontWeight: 600, marginBottom: 4 }}>+{rest.length} altri · scorri →</div>
          <SwipeTrack>
            {rest.map((t: any, i: number) => {
              const stato = (t?.stato || t?.status || 'libero') as string
              const cfg = STATO[stato] || STATO.libero
              return (
                <SwipeItem key={i} width="160px">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div onClick={() => setDrawerOp(t)} style={{ width: 30, height: 30, borderRadius: 8, background: cfg.dot + '22', color: cfg.dot, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, position: 'relative', border: `1.5px solid ${cfg.dot}40`, cursor: 'pointer' }}>
                      {(t?.nome || '?').slice(0, 1).toUpperCase()}
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: 3, background: cfg.dot, border: '1.5px solid #F7F9FB' }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.nome || 'Op'}</div>
                      <div style={{ fontSize: 9, color: cfg.dot, fontWeight: 700 }}>● {cfg.label}</div>
                    </div>
                  </div>
                </SwipeItem>
              )
            })}
          </SwipeTrack>
        </div>
      ) : null}
      {drawerOp && <OperatoreDrawer op={drawerOp} montaggi={montaggiDB || []} cantieri={cantieri || []} onClose={() => setDrawerOp(null)} />}
    </>
  )
}

function CardProduzione({ cantieri, apri }: any) {
  // [v-bidir] Leggo dati live dal hook globale - aggiornamenti realtime
  const { state: md } = useMastroData()
  const commesseGlob = (md.commesse && md.commesse.length > 0) ? md.commesse : (cantieri || [])
  const carichiGlob = md.produzioneCarichi || []
  const inProd = commesseGlob.filter((c: any) => c?.fase === 'produzione' || c?.fase === 'ordine')
  const top = inProd.slice(0, 3)
  
  // Capacita: default 30 vani/gg. Genera prossimi 5 giorni lavorativi
  const CAPACITA = 30
  const oggi = new Date(); oggi.setHours(0,0,0,0)
  const giorni: { d: Date; iso: string; lbl: string; carico: number }[] = []
  const dowLbl = ['DOM','LUN','MAR','MER','GIO','VEN','SAB']
  let cursor = new Date(oggi)
  while (giorni.length < 5) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      const iso = cursor.toISOString().split('T')[0]
      // Conta carichi per quel giorno (somma vani)
      // Carico reale: somma vani di tutti i produzione_carichi che includono questo giorno
      const carico = carichiGlob.reduce((s: number, cr: any) => {
        if (!cr?.data_avvio) return s
        const dataAvvio = cr.data_avvio
        const dataFine = cr.data_fine_prevista || cr.data_avvio
        if (iso >= dataAvvio && iso <= dataFine) return s + (Number(cr.vani_totali) || 0)
        return s
      }, 0)
      giorni.push({ d: new Date(cursor), iso, lbl: dowLbl[dow], carico })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  const totVaniSettimana = giorni.reduce((s, g) => s + g.carico, 0)
  const capacitaSettimana = CAPACITA * giorni.length
  const pctMedio = capacitaSettimana > 0 ? Math.round((totVaniSettimana / capacitaSettimana) * 100) : 0
  
  const colorePct = (p: number) => p < 60 ? '#10B981' : p < 90 ? '#F59E0B' : '#DC2626'
  
  return (
    <>
      <CardHead title="Produzione" badge={inProd.length} link="apri" onClick={() => window.dispatchEvent(new CustomEvent('mastro:open-produzione'))} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 21V8l9-5 9 5v13"/><path d="M9 22V12h6v10"/></svg>} />
      
      {/* KPI riga */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8, marginBottom: 10 }}>
        <div style={{ background: '#F2FAFA', borderRadius: 8, padding: '8px 6px', textAlign: 'center' as any }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as any, letterSpacing: 0.3 }}>ATTIVE</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1E3A5F', marginTop: 2 }}>{inProd.length}</div>
        </div>
        <div style={{ background: '#F2FAFA', borderRadius: 8, padding: '8px 6px', textAlign: 'center' as any }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as any, letterSpacing: 0.3 }}>VANI/SETT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1E3A5F', marginTop: 2 }}>{totVaniSettimana}</div>
        </div>
        <div style={{ background: '#F2FAFA', borderRadius: 8, padding: '8px 6px', textAlign: 'center' as any }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as any, letterSpacing: 0.3 }}>CARICO</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: colorePct(pctMedio), marginTop: 2 }}>{pctMedio}%</div>
        </div>
      </div>
      
      {/* Barre capacita prossimi 5 giorni */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as any, letterSpacing: 0.3, marginBottom: 6 }}>OFFICINA · PROSSIMI 5 GIORNI</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {giorni.map((g, i) => {
            const pct = Math.min(100, (g.carico / CAPACITA) * 100)
            const isOggi = g.iso === oggi.toISOString().split('T')[0]
            return (
              <div key={i} onClick={() => window.dispatchEvent(new CustomEvent('mastro:open-produzione'))} style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: isOggi ? '#28A0A0' : MUTED, textAlign: 'center' as any, marginBottom: 2 }}>{g.lbl}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#0F1F33', textAlign: 'center' as any, marginBottom: 3 }}>{g.d.getDate()}</div>
                <div style={{ height: 24, background: '#E2E8F0', borderRadius: 4, position: 'relative' as any, overflow: 'hidden' as any }}>
                  <div style={{ position: 'absolute' as any, bottom: 0, left: 0, right: 0, height: pct + '%', background: colorePct(pct), transition: 'height 0.3s' }} />
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: pct > 0 ? colorePct(pct) : MUTED, textAlign: 'center' as any, marginTop: 2 }}>{g.carico}/{CAPACITA}</div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Top 3 commesse in produzione */}
      {top.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as any, letterSpacing: 0.3, marginBottom: 6 }}>IN LAVORAZIONE ORA</div>
          {top.map((c: any, i: number) => (
            <div key={i} onClick={() => apri(c?.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < top.length - 1 ? '1px solid ' + BORDER : 'none', cursor: 'pointer' }}>
              <div style={{ width: 4, height: 28, background: c?.fase === 'produzione' ? '#F59E0B' : '#1E3A5F', borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: TEXT, fontWeight: 800 }}>{c?.codice || c?.code}</span>
                  <span style={{ fontSize: 8, color: '#FFF', background: c?.fase === 'produzione' ? '#F59E0B' : '#1E3A5F', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(c?.fase || '').toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c?.cliente || c?.cliente_nome || ''}{c?.n_vani ? ' · ' + c.n_vani + ' vani' : ''}</div>
              </div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </>
      )}
      
      {/* CTA finale */}
      <div onClick={() => window.dispatchEvent(new CustomEvent('mastro:open-produzione'))} style={{ marginTop: 10, padding: 10, background: 'linear-gradient(135deg, #1E3A5F, #0F1B2D)', color: '#fff', borderRadius: 8, textAlign: 'center' as any, fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}>
        APRI CALENDARIO PRODUZIONE →
      </div>
    </>
  )
}

function CardGestioneMateriali({ ordini, magazzino, onClick }: any) {
  const ordiniAttivi = (ordini || []).filter((o: any) => o?.stato && !['arrivato','completato','annullato'].includes(o.stato))
  const inTransito = (ordini || []).filter((o: any) => o?.stato === 'in_transito' || o?.stato === 'inviato' || o?.stato === 'confermato').length
  const sottoScorta = (magazzino || []).filter((a: any) => Number(a?.qta_disponibile || 0) < Number(a?.qta_minima || 0)).length
  const valoreMag = (magazzino || []).reduce((s: number, a: any) => s + (Number(a?.qta_disponibile || 0) * Number(a?.prezzo_medio || 0)), 0)
  const valoreLabel = valoreMag >= 1000 ? `${(valoreMag / 1000).toFixed(1)}k€` : `${Math.round(valoreMag)}€`

  return (
    <>
      <CardHead title="Gestione materiali" link="apri" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>} />
      <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4, cursor: 'pointer' }}>
        <div style={{ background: '#F2FAFA', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth={2}><rect x={1} y={3} width={15} height={13}/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx={5.5} cy={18.5} r={2.5}/><circle cx={18.5} cy={18.5} r={2.5}/></svg>
            <span style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>IN TRANSITO</span>
          </div>
          <div style={{ fontSize: 18, color: TEXT, fontWeight: 700, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{inTransito}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{ordiniAttivi.length} ordini attivi</div>
        </div>
        <div style={{ background: sottoScorta > 0 ? '#FEF3C7' : '#F2FAFA', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={sottoScorta > 0 ? '#BA7517' : '#1E3A5F'} strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span style={{ fontSize: 9, color: sottoScorta > 0 ? '#92400E' : MUTED, fontWeight: 600 }}>SOTTO-SCORTA</span>
          </div>
          <div style={{ fontSize: 18, color: sottoScorta > 0 ? '#92400E' : TEXT, fontWeight: 700, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{sottoScorta}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>val. mag. {valoreLabel}</div>
        </div>
      </div>
      {sottoScorta > 0 ? (
        <div onClick={onClick} style={{ marginTop: 8, padding: '8px 10px', background: '#FEF3C7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth={2.2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style={{ fontSize: 10, color: '#92400E', fontWeight: 600, flex: 1 }}>{sottoScorta} articoli da riordinare</span>
          <span style={{ fontSize: 10, color: '#1E3A5F', fontWeight: 700 }}>RIORDINA →</span>
        </div>
      ) : null}
    </>
  )
}

function CardClienti({ contatti, cantieri, onClick }: any) {
  const totale = (contatti || []).length
  const recenti = (contatti || []).slice().sort((a: any, b: any) => {
    const ta = new Date(a?.updated_at || a?.created_at || 0).getTime()
    const tb = new Date(b?.updated_at || b?.created_at || 0).getTime()
    return tb - ta
  }).slice(0, 3)
  const commessePerCliente = (cliId: string) => cantieri.filter((c: any) => c?.cliente_id === cliId || c?.contatto_id === cliId).length

  return (
    <>
      <CardHead title="Clienti" badge={totale} link="vedi tutti" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
      {recenti.length === 0 ? <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', padding: '8px 0' }}>Nessun cliente</div> : null}
      {recenti.map((c: any, i: number) => {
        const numCM = commessePerCliente(c?.id)
        const iniziali = String(c?.nome || c?.ragione_sociale || '?').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()
        return (
          <div key={i} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recenti.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 50, background: '#E5EAF0', color: '#1E3A5F', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{iniziali}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.nome || c?.ragione_sociale || 'Senza nome'}{c?.cognome ? ` ${c.cognome}` : ''}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.telefono || c?.email || c?.indirizzo || '—'}</div>
            </div>
            {numCM > 0 ? (
              <div style={{ flexShrink: 0, padding: '2px 8px', background: '#E5EAF0', borderRadius: 5 }}>
                <span style={{ fontSize: 10, color: '#1E3A5F', fontWeight: 700 }}>{numCM} CM</span>
              </div>
            ) : null}
          </div>
        )
      })}
      <div onClick={onClick} style={{ marginTop: 8, padding: '8px 10px', background: '#F2FAFA', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>STORIA · DIARIO · COMMESSE</span>
        <span style={{ fontSize: 10, color: '#1E3A5F', fontWeight: 700 }}>APRI →</span>
</div>
    </>
  )
}


function CardStatistiche({ cantieri, onClick }: any) {
  const sopr = cantieri.filter((c: any) => c?.fase === 'sopralluogo').length
  const prev = cantieri.filter((c: any) => c?.fase === 'preventivo').length
  const conf = cantieri.filter((c: any) => ['conferma_ordine','confermata','acconto_pagato','ordine'].includes(c?.fase)).length
  const fatt = cantieri.filter((c: any) => ['fatturata','pagata'].includes(c?.fase)).length
  return (
    <>
      <CardHead title="Statistiche" link="report" onClick={onClick} icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>} />
      <Row label="Sopralluoghi" value={sopr} onClick={onClick} />
      <Row label="Preventivi" value={prev} onClick={onClick} />
      <Row label="Confermate" value={conf} onClick={onClick} />
      <Row label="Fatturate" value={fatt} last onClick={onClick} />
    </>
  )
}
