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
    getNotifiche: aggiornaNofiche,
  } = useHome() as ReturnType<typeof useHome> & { getNotifiche: () => void }

  if (loading) {
    return (
      <div className="phone-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 22, color: 'var(--teal)',
          textShadow: '0 1px 0 rgba(255,255,255,0.6)',
        }}>
          fliwo<span style={{ color: 'var(--teal)' }}>X</span>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--teal-soft)',
          borderTopColor: 'var(--teal)',
          marginTop: 20,
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div className="phone-screen">
      {/* Status bar placeholder */}
      <div style={{
        height: 44, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '0 28px',
        flexShrink: 0, position: 'relative', zIndex: 5,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14, fontWeight: 700, color: 'var(--ink)',
        }}>
          {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* Segnale */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 10 }}>
            {[30, 55, 80, 100].map((h, i) => (
              <div key={i} style={{
                width: 2.5, borderRadius: 1,
                height: `${h}%`, background: 'var(--ink)',
                opacity: i === 3 ? 0.3 : 1,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>5G</span>
          {/* Batteria */}
          <div style={{
            width: 24, height: 11, border: '1.5px solid var(--ink)',
            borderRadius: 3, position: 'relative',
            display: 'flex', alignItems: 'center', padding: 1.5,
          }}>
            <div style={{ width: '68%', height: '100%', background: 'var(--ink)', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Topbar */}
      <Topbar
        notificheCount={notificheNonLette}
        onSearchOpen={() => setSearchOpen(true)}
        onNotificheOpen={() => setNotifichePanelOpen(true)}
      />

      {/* Hero eyebrow */}
      <div style={{ padding: '4px 22px 0', position: 'relative', zIndex: 2 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 600, letterSpacing: 2.5,
          color: 'var(--ink-dim)',
          textShadow: '0 1px 0 rgba(255,255,255,0.4)',
        }}>
          â€” BUONGIORNO, TITOLARE
        </span>
      </div>

      {/* Page scroll */}
      <div className="page">
        {/* Calendar Hero */}
        <CalendarHero
          selectedDate={selectedDate}
          viewMode={viewMode}
          eventiPerData={eventiSettimana}
          onDateChange={handleDateChange}
          onViewModeChange={setViewMode}
        />

        {/* Priority block - solo se presente */}
        {priorita && (
          <PriorityBlock
            priorita={priorita}
            count={1}
          />
        )}

        {/* Events card */}
        <EventsCard
          eventi={eventiOggi}
          expandedEventId={expandedEventId}
          prossimoEventoId={prossimoEvento?.id}
          onToggle={handleToggleExpand}
          onSposta={handleSposta}
        />

        <div className="bottom-spacer" />
      </div>

      {/* Bottom Nav */}
      <BottomNav mailCount={notificheNonLette} />

      {/* Panels */}
      <NotifichePanel
        isOpen={notifichePanelOpen}
        notifiche={notifiche}
        onClose={() => setNotifichePanelOpen(false)}
        onAggiorna={() => {}}
      />

      <SearchPanel
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Modal sposta */}
      <SpostaEventoModal
        evento={spostaTarget}
        isOpen={!!spostaTarget}
        onClose={() => setSpostaTarget(null)}
        onConfirm={handleConfermaSposta}
      />
    </div>
  )
}

