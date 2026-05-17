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
  // mostra sempre la card, anche vuota

  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div style={{
        borderRadius: 24,
        background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
        boxShadow: '0 6px 20px rgba(60,50,30,0.12), inset 0 3px 6px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.04)',
        padding: '16px 14px',
        position: 'relative',
      }}>
        {/* Fuzz */}
        <div style={{
          position: 'absolute', inset: -4, borderRadius: 26,
          background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
          filter: 'blur(6px)', opacity: 0.5, zIndex: -1,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14,
        }}>
          <h3 style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 18, fontWeight: 600, color: 'var(--ink)',
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}>
            Eventi di oggi
          </h3>
          <span style={{
            borderRadius: 10, padding: '5px 11px',
            background: 'linear-gradient(135deg, var(--teal-bg), var(--teal-soft))',
            boxShadow: '0 2px 6px rgba(21,81,89,0.15), inset 0 1px 2px rgba(255,255,255,0.6)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, fontWeight: 600, letterSpacing: 1.2,
            color: 'var(--teal)',
          }}>
            {eventi.length} PROGRAMMATI
          </span>
        </div>

        {/* Lista o empty state */}
        {eventi.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
              boxShadow: '0 2px 8px rgba(60,50,30,0.1), inset 0 2px 3px rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🎉</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14, fontWeight: 700, color: 'var(--ink)',
            }}>Nessun evento oggi</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: 'var(--ink-soft)', letterSpacing: 0.5,
            }}>Giornata libera</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {eventi.map(e => (
              <EventRow
                key={e.id}
                evento={e}
                isExpanded={expandedEventId === e.id}
                isNext={e.id === prossimoEventoId}
                onToggle={onToggle}
                onSposta={onSposta}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
