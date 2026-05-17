'use client'
import { FC } from 'react'
import { useRouter } from 'next/navigation'
import type { Commessa } from '@/lib/commesse-types'
import { getFlag, getAvatarColor, getInitials, formatValore } from '@/lib/commesse-types'

interface Props { commessa: Commessa }

export const CommessaTile: FC<Props> = ({ commessa: c }) => {
  const router = useRouter()
  const flag = getFlag(c)

  const flagColor = flag === 'red' ? 'var(--red)' : flag === 'ocra' ? 'var(--ocra)' : flag === 'success' ? '#2F7D57' : null

  return (
    <div
      onClick={() => router.push(`/commesse/${c.id}`)}
      style={{
        background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
        borderRadius: 18, padding: 12, cursor: 'pointer', position: 'relative',
        overflow: 'hidden',
        boxShadow: `
          0 0 0 1px rgba(60,50,30,0.05),
          0 8px 18px rgba(60,50,30,0.14),
          inset 0 4px 8px rgba(255,255,255,0.55)
        `,
      }}
    >
      {/* Highlight */}
      <div style={{
        position: 'absolute', top: '8%', left: '10%',
        width: '28%', height: '12%',
        background: 'rgba(255,255,255,0.5)', borderRadius: '50%',
        filter: 'blur(8px)', pointerEvents: 'none',
      }} />

      {/* Top row: avatar + flag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: getAvatarColor(c.fase),
          display: 'grid', placeItems: 'center', position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.22), inset 0 -2px 3px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.18)',
        }}>
          <div style={{
            position: 'absolute', top: '14%', left: '22%',
            width: '32%', height: '18%',
            background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(2px)',
          }} />
          <span style={{
            fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700,
            color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.25)',
            position: 'relative', zIndex: 1,
          }}>{getInitials(c.cliente_nome)}</span>
        </div>

        {flagColor && (
          <span style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: flagColor, marginTop: 4,
            boxShadow: `0 0 6px ${flagColor}`,
          }} />
        )}
      </div>

      {/* Nome */}
      <div style={{
        fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600,
        color: 'var(--ink)', letterSpacing: -0.2, lineHeight: 1.2, marginBottom: 4,
        textShadow: '0 1px 0 rgba(255,255,255,0.4)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{c.cliente_nome}</div>

      {/* Codice */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
        color: 'var(--ink-2)', marginBottom: 8,
      }}>{c.codice}</div>

      {/* Pill fase */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
          color: 'var(--teal-deep)',
          background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))',
          padding: '4px 8px', borderRadius: 999,
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(20,80,90,0.15)',
          letterSpacing: 0.5,
        }}>{c.fase}</span>
        <span style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
          color: 'var(--teal)', letterSpacing: -0.2,
          textShadow: '0 1px 0 rgba(255,255,255,0.4)',
        }}>{formatValore(c.valore_eur)}</span>
      </div>
    </div>
  )
}
