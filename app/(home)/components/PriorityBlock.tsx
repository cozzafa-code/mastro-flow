'use client'
import { FC } from 'react'
import { useRouter } from 'next/navigation'
import type { PrioritaTitolare } from '@/lib/types'

interface PriorityBlockProps {
  priorita: PrioritaTitolare
  count: number
}

export const PriorityBlock: FC<PriorityBlockProps> = ({ priorita, count }) => {
  const router = useRouter()

  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div style={{
        background: 'linear-gradient(160deg, var(--teal-deep), var(--teal-darker))',
        borderRadius: 20,
        padding: '14px 16px',
        boxShadow: '0 6px 18px rgba(14,62,68,0.35), inset 0 2px 6px rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: -4,
          background: 'linear-gradient(160deg, var(--teal-deep), var(--teal-darker))',
          filter: 'blur(6px)', opacity: 0.4, zIndex: 0, borderRadius: 22,
        }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 }}>
          {/* Ico pill */}
          <div style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--ocra), var(--ocra-deep))',
            boxShadow: '0 4px 10px rgba(232,167,38,0.4), inset 0 2px 4px rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>

          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 600, letterSpacing: 2,
              color: 'var(--ocra)', textTransform: 'uppercase', marginBottom: 3,
            }}>
              PRIORITÀ OGGI
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {count} task {count === 1 ? 'scaduta richiede' : 'scadute richiedono'} attenzione
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push(`/commesse/${priorita.commessa_ref}`)}
          style={{
            width: '100%', border: 'none', cursor: 'pointer',
            borderRadius: 14, padding: '11px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--red), var(--red-deep))',
            boxShadow: '0 4px 12px rgba(200,73,65,0.45), inset 0 2px 4px rgba(255,255,255,0.2)',
            position: 'relative', zIndex: 1,
          }}
        >
          {/* Fuzz */}
          <div style={{
            position: 'absolute', inset: -3,
            background: 'linear-gradient(135deg, var(--red), var(--red-deep))',
            filter: 'blur(5px)', opacity: 0.4, borderRadius: 15, zIndex: -1,
          }} />
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14, fontWeight: 700, color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}>
            Apri commessa {priorita.commessa_ref}
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
