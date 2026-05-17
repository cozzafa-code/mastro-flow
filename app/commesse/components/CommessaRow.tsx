'use client'
import { FC } from 'react'
import { useRouter } from 'next/navigation'
import type { Commessa } from '@/lib/commesse-types'
import { getFlag, getAvatarColor, getInitials, formatValore } from '@/lib/commesse-types'

const FLAG_DOT = {
  red: 'var(--red)',
  ocra: 'var(--ocra)',
  success: '#2F7D57',
}

interface Props { commessa: Commessa; isFirst: boolean }

export const CommessaRow: FC<Props> = ({ commessa: c, isFirst }) => {
  const router = useRouter()
  const flag = getFlag(c)

  return (
    <div
      onClick={() => router.push(`/commesse/${c.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 11px', borderRadius: 14, cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Separatore dashed */}
      {!isFirst && (
        <div style={{
          position: 'absolute', top: 0, left: 14, right: 14,
          borderTop: '1px dashed rgba(60,50,30,0.14)',
        }} />
      )}

      {/* Avatar piccolo */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: getAvatarColor(c.fase),
        display: 'grid', placeItems: 'center', position: 'relative',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.22), inset 0 -1px 3px rgba(0,0,0,0.18), 0 3px 7px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          position: 'absolute', top: '14%', left: '22%',
          width: '32%', height: '18%',
          background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(2px)',
        }} />
        <span style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700,
          color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          position: 'relative', zIndex: 1,
        }}>{getInitials(c.cliente_nome)}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
            color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          }}>{c.cliente_nome}</span>
          {flag && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: FLAG_DOT[flag],
              boxShadow: `0 0 5px ${FLAG_DOT[flag]}`,
            }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            color: 'var(--ink-2)',
          }}>{c.codice}</span>
          <span style={{ color: 'var(--ink-soft)' }}>·</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            color: 'var(--teal)', fontSize: 9,
            background: 'var(--teal-bg)', padding: '1px 6px', borderRadius: 999,
          }}>{c.fase}</span>
          {c.citta && (
            <span style={{ color: 'var(--ink-dim)', fontSize: 10 }}>{c.citta}</span>
          )}
        </div>
      </div>

      {/* Valore + chevron */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600,
          color: 'var(--teal)', textShadow: '0 1px 0 rgba(255,255,255,0.4)',
        }}>{formatValore(c.valore_eur)}</div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2 }}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </div>
  )
}
