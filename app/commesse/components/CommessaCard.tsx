'use client'
import { FC } from 'react'
import { useRouter } from 'next/navigation'
import type { Commessa } from '@/lib/commesse-types'
import { FASI, getFlag, getAvatarColor, getInitials, formatValore } from '@/lib/commesse-types'

const FLAG_STYLE = {
  red: { bg: 'linear-gradient(160deg, var(--red-bg), var(--red-mid))', color: 'var(--red-deep)', label: 'FERMA' },
  ocra: { bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)', label: 'SCAD' },
  success: { bg: 'linear-gradient(160deg, var(--success-bg), var(--success-mid))', color: 'var(--success)', label: 'PRONTA' },
}

const FASE_CTA: Partial<Record<string, string>> = {
  APP: 'Vai al sopralluogo',
  MIS: 'Inserisci misure',
  PRV: 'Apri preventivo',
  CNF: 'Invia conferma',
  ACC: 'Registra acconto',
  ORD: 'Ordina fornitore',
  MAT: 'Traccia materiale',
  MON: 'Vai al montaggio',
  END: 'Chiudi commessa',
}

interface Props { commessa: Commessa }

export const CommessaCard: FC<Props> = ({ commessa: c }) => {
  const router = useRouter()
  const flag = getFlag(c)
  const faseIdx = FASI.indexOf(c.fase)

  return (
    <div style={{ position: 'relative' }}>
      {/* Fuzz */}
      <div style={{
        position: 'absolute', inset: -6, borderRadius: 28,
        background: 'var(--surface-2)', filter: 'blur(10px)', opacity: 0.45, zIndex: -1,
      }} />

      <div
        onClick={() => router.push(`/commesse/${c.id}`)}
        style={{
          background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
          borderRadius: 22, padding: 14, position: 'relative', overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: `
            0 0 0 1px rgba(60,50,30,0.05),
            0 10px 22px rgba(60,50,30,0.16),
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

        {/* Status pill */}
        {flag && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, fontWeight: 800, padding: '3px 7px',
            borderRadius: 6, letterSpacing: 0.6, zIndex: 3,
            background: FLAG_STYLE[flag].bg,
            color: FLAG_STYLE[flag].color,
            boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -2px 3px rgba(0,0,0,0.1)',
          }}>
            {FLAG_STYLE[flag].label}
          </span>
        )}

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 12, position: 'relative', zIndex: 2 }}>
          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: getAvatarColor(c.fase),
            display: 'grid', placeItems: 'center',
            position: 'relative',
            boxShadow: 'inset 0 3px 5px rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              position: 'absolute', top: '14%', left: '22%',
              width: '32%', height: '18%',
              background: 'rgba(255,255,255,0.45)', borderRadius: '50%', filter: 'blur(2.5px)',
            }} />
            <span style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700,
              color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              position: 'relative', zIndex: 1,
            }}>{getInitials(c.cliente_nome)}</span>
          </div>

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 600,
              color: 'var(--ink)', letterSpacing: -0.3, lineHeight: 1.1,
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{c.cliente_nome}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--ink-2)' }}>
                {c.codice}
              </span>
              {c.indirizzo && <>
                <span>·</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></svg>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{c.indirizzo}</span>
              </>}
            </div>
          </div>

          {/* Valore */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 600,
              color: 'var(--teal)', letterSpacing: -0.3, lineHeight: 1,
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}>{formatValore(c.valore_eur)}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              color: 'var(--ink-dim)', fontWeight: 600, letterSpacing: 0.5,
              textTransform: 'uppercase', marginTop: 2,
            }}>VALORE</div>
          </div>
        </div>

        {/* Step rail */}
        <div style={{
          background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
          borderRadius: 12, padding: '10px 11px 8px', marginBottom: 11,
          boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
              letterSpacing: 1.2, color: 'var(--ink-dim)', textTransform: 'uppercase',
            }}>FLUSSO</span>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 10, color: 'var(--ink-2)', fontWeight: 600 }}>
              fase <b style={{ color: 'var(--teal)' }}>{c.fase}</b>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3 }}>
            {FASI.map((fase, i) => {
              const isDone = i < faseIdx
              const isCurrent = i === faseIdx
              return (
                <div key={fase} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div style={{
                      width: '100%', height: 4, borderRadius: 999,
                      background: isDone || isCurrent
                        ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))'
                        : 'linear-gradient(160deg, rgba(60,50,30,0.12), rgba(60,50,30,0.18))',
                      boxShadow: isCurrent
                        ? '0 0 7px rgba(20,80,90,0.5)'
                        : isDone ? 'inset 0 1px 2px rgba(255,255,255,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.18)',
                    }} />
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', width: 9, height: 9, borderRadius: '50%',
                        background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
                        top: '50%', right: 0, transform: 'translate(50%, -50%)',
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), 0 2px 5px rgba(20,80,90,0.5)',
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 7, fontWeight: 700,
                    color: isCurrent ? 'var(--teal)' : isDone ? 'var(--ink-2)' : 'var(--ink-soft)',
                    letterSpacing: 0.2,
                  }}>{fase}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 2 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/commesse/${c.id}`)}
            style={{
              flex: 1, border: 'none', cursor: 'pointer', borderRadius: 12, padding: '10px 0',
              background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
              boxShadow: 'inset 0 3px 5px rgba(255,255,255,0.22), inset 0 -3px 5px rgba(0,0,0,0.2), 0 4px 10px rgba(20,80,90,0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.25)', position: 'relative',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
            {FASE_CTA[c.fase] ?? 'Apri commessa'}
          </button>
          <button style={{
            width: 40, border: 'none', cursor: 'pointer', borderRadius: 12,
            background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
            display: 'grid', placeItems: 'center', color: 'var(--ink)',
            boxShadow: 'inset 0 3px 5px rgba(255,255,255,0.55), 0 3px 7px rgba(60,50,30,0.12)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
