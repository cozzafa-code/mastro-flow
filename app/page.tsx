'use client'

export const dynamic = 'force-dynamic'

import { Topbar } from './components/Topbar'
import { CalendarHero } from './components/CalendarHero'
import { PriorityBlock } from './components/PriorityBlock'
import { EventsCard } from './components/EventsCard'
import { BottomNav } from './components/BottomNav'
import { NotifichePanel } from './components/NotifichePanel'
import { SearchPanel } from './components/SearchPanel'
import { SpostaEventoModal } from './components/SpostaEventoModal'
import { useHome } from '@/hooks/useHome'

export default function HomePage() {
  const {
    selectedDate, viewMode, expandedEventId,
    spostaTarget, notifichePanelOpen, searchOpen,
    eventiOggi, eventiSettimana, priorita, notifiche,
    notificheNonLette, prossimoEvento, loading,
    setViewMode, setNotifichePanelOpen, setSearchOpen, setSpostaTarget,
    handleDateChange, handleToggleExpand, handleSposta, handleConfermaSposta,
  } = useHome()

  if (loading) {
    return (
      <div className="phone-screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <span style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600,
          color: 'var(--teal)',
          textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(60,50,30,0.15)',
        }}>
          fliwo<span style={{ color: 'var(--teal)' }}>X</span>
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div className="phone-screen">
      {/* TUTTO scrolla dentro .page — topbar inclusa */}
      <div className="page">

        {/* Topbar */}
        <Topbar
          notificheCount={notificheNonLette}
          onSearchOpen={() => setSearchOpen(true)}
          onNotificheOpen={() => setNotifichePanelOpen(true)}
        />

        {/* Eyebrow */}
        <div style={{ padding: '4px 26px 0', position: 'relative', zIndex: 2 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 600, letterSpacing: 2.5,
            color: 'var(--ink-dim)', textTransform: 'uppercase',
            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}>
            {'\u2014'} BUONGIORNO, TITOLARE
          </span>
        </div>

        {/* Calendario */}
        <CalendarHero
          selectedDate={selectedDate}
          viewMode={viewMode}
          eventiPerData={eventiSettimana}
          onDateChange={handleDateChange}
          onViewModeChange={setViewMode}
        />

        {priorita && <PriorityBlock priorita={priorita} count={1} />}

        <EventsCard
          eventi={eventiOggi}
          expandedEventId={expandedEventId}
          prossimoEventoId={prossimoEvento?.id}
          onToggle={handleToggleExpand}
          onSposta={handleSposta}
        />

        <div className="bottom-spacer" />
      </div>

      {/* Bottom Nav FISSA */}
      <BottomNav mailCount={notificheNonLette} />

      {/* Panels */}
      <NotifichePanel
        isOpen={notifichePanelOpen}
        notifiche={notifiche}
        onClose={() => setNotifichePanelOpen(false)}
        onAggiorna={() => {}}
      />
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SpostaEventoModal
        evento={spostaTarget}
        isOpen={!!spostaTarget}
        onClose={() => setSpostaTarget(null)}
        onConfirm={handleConfermaSposta}
      />
    </div>
  )
}
