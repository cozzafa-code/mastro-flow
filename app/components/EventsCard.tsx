'use client'
import { FC } from 'react'
import { EventRow } from './EventRow'
import type { Evento } from '@/lib/types'

interface EventsCardProps {
  eventi: Evento[]
  expandedEventId: string | null
  prossimoEventoId: string | undefined
  onToggle: (id: string) => void
  onSposta: (evento: Evento) => void
}

export const EventsCard: FC<EventsCardProps> = ({
  eventi, expandedEventId, prossimoEventoId, onToggle, onSposta
}) => {
  return (
    <div style={{ position: 'relative', margin: '18px 20px 0' }}>
      {/* Fuzz sotto */}
      <div style={{
        position: 'absolute', inset: -8, borderRadius: 36,
        background: 'var(--surface-2)', filter: 'blur(12px)', opacity: 0.5, zIndex: -1,
      }} />

      <div style={{
        background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
        borderRadius: 28, padding: 6, position: 'relative', overflow: 'hidden',
        boxShadow: `
          0 0 0 1px rgba(60,50,30,0.05),
          0 14px 30px rgba(60,50,30,0.2),
          0 4px 10px rgba(60,50,30,0.1),
          inset 0 6px 12px rgba(255,255,255,0.6),
          inset 0 -3px 8px rgba(0,0,0,0.06)
        `,
      }}>
        {/* Highlight */}
        <div style={{
          position: 'absolute', top: '6%', left: '12%',
          width: '28%', height: '10%',
          background: 'rgba(255,255,255,0.5)', borderRadius: '50%',
          filter: 'blur(10px)', pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', zIndex: 2,
        }}>
          <h3 style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 17, fontWeight: 600, color: 'var(--ink)',
            letterSpacing: -0.2, textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}>
            Eventi di oggi
          </h3>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
            color: 'var(--teal-deep)',
            background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))',
            padding: '6px 12px', borderRadius: 999,
            boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -2px 3px rgba(20,80,90,0.15), 0 2px 5px rgba(20,80,90,0.18)',
          }}>
            {eventi.length} PROGRAMMATI
          </span>
        </div>

        {/* Lista */}
        <div style={{ padding: '0 4px 4px', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: 2 }}>
          {eventi.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: 'linear-gradient(160deg, var(--surface-2), var(--surface-3))',
                boxShadow: 'inset 0 3px 5px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(60,50,30,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>🎉</div>
              <div style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 16, fontWeight: 600, color: 'var(--ink)',
                textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              }}>Nessun evento oggi</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: 'var(--ink-soft)', letterSpacing: 1,
              }}>GIORNATA LIBERA</div>
            </div>
          ) : (
            eventi.map(e => (
              <EventRow
                key={e.id}
                evento={e}
                isExpanded={expandedEventId === e.id}
                isNext={e.id === prossimoEventoId}
                onToggle={onToggle}
                onSposta={onSposta}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
