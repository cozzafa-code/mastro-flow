'use client'
import { FC } from 'react'
import { motion } from 'framer-motion'
import type { CalendarHeroProps } from '@/lib/types'

const GIORNI_IT = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']
const GIORNI_SHORT = ['D','L','M','M','G','V','S']
const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

function toISO(d: Date) { return d.toISOString().split('T')[0] }

function getSettimanaGiorni(date: Date): Date[] {
  const d = new Date(date)
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d); x.setDate(x.getDate() + i); return x
  })
}

export const CalendarHero: FC<CalendarHeroProps> = ({
  selectedDate, viewMode, eventiPerData, onDateChange, onViewModeChange
}) => {
  const oggi = new Date()
  const giorni = getSettimanaGiorni(selectedDate)
  const selectedKey = toISO(selectedDate)
  const eventiOggi = eventiPerData[selectedKey] || []

  const prossimoEvento = (() => {
    if (toISO(selectedDate) !== toISO(oggi)) return eventiOggi[0]
    return eventiOggi.find(e => {
      const [h, m] = e.ora_inizio.split(':').map(Number)
      return h * 60 + m >= oggi.getHours() * 60 + oggi.getMinutes()
    }) ?? eventiOggi[0]
  })()

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -60) {
      const next = new Date(selectedDate); next.setDate(next.getDate() + 7); onDateChange(next)
    } else if (info.offset.x > 60) {
      const prev = new Date(selectedDate); prev.setDate(prev.getDate() - 7); onDateChange(prev)
    }
  }

  return (
    <div style={{ padding: '10px 20px 0', position: 'relative' }}>
      {/* Fuzz teal sotto la card */}
      <div style={{
        position: 'absolute', inset: '2px 12px',
        borderRadius: 40,
        background: 'var(--teal-deep)',
        filter: 'blur(14px)',
        opacity: 0.45,
        zIndex: 0,
      }} />

      <div style={{
        background: 'linear-gradient(160deg, var(--teal-deep) 0%, var(--teal-darker) 100%)',
        borderRadius: 32,
        padding: 22,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
        boxShadow: `
          0 0 0 1px rgba(0,0,0,0.08),
          0 20px 44px rgba(20,80,90,0.45),
          0 6px 16px rgba(20,80,90,0.25),
          inset 0 7px 16px rgba(255,255,255,0.12),
          inset 0 -8px 14px rgba(0,0,0,0.28)
        `,
      }}>
        {/* Cerchio dorato decorativo */}
        <div style={{
          position: 'absolute', width: 240, height: 240, borderRadius: '50%',
          bottom: -120, right: -90,
          background: 'radial-gradient(circle, rgba(232,167,38,0.3) 0%, transparent 60%)',
          filter: 'blur(22px)', pointerEvents: 'none',
        }} />
        {/* Highlight bianco */}
        <div style={{
          position: 'absolute', top: '12%', left: '14%',
          width: '32%', height: '18%',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%', filter: 'blur(15px)', pointerEvents: 'none',
        }} />

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 2 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: 2.5, fontWeight: 600,
            color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>CALENDARIO</span>

          {/* Seg switch */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 999, padding: 4, display: 'flex',
            boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.05)',
          }}>
            {(['day','week','month'] as const).map((m, i) => (
              <button key={m} onClick={() => onViewModeChange(m)} style={{
                border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 999,
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                textTransform: 'uppercase',
                background: viewMode === m ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'transparent',
                color: viewMode === m ? '#fff' : 'rgba(255,255,255,0.55)',
                boxShadow: viewMode === m ? 'inset 0 3px 5px rgba(255,255,255,0.35), inset 0 -3px 5px rgba(0,0,0,0.2), 0 3px 8px rgba(200,138,23,0.55)' : 'none',
                textShadow: viewMode === m ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 1px rgba(0,0,0,0.2)',
              }}>
                {['Giorno','Sett.','Mese'][i]}
              </button>
            ))}
          </div>
        </div>

        {/* Big day */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginBottom: 22, position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, letterSpacing: 3, fontWeight: 700,
              color: 'var(--ocra)', textTransform: 'uppercase', marginBottom: 4,
              textShadow: '0 1px 0 rgba(0,0,0,0.3), 0 2px 6px rgba(200,138,23,0.4)',
            }}>
              {GIORNI_IT[selectedDate.getDay()].toUpperCase()}
            </div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 84, fontWeight: 500, letterSpacing: -4, lineHeight: 0.85,
              color: '#fff',
              textShadow: '0 1px 0 rgba(255,255,255,0.15), 0 2px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)',
            }}>
              {selectedDate.getDate()}
            </div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 500,
              color: 'rgba(255,255,255,0.75)', marginTop: 4,
              textShadow: '0 1px 2px rgba(0,0,0,0.25)',
            }}>
              {MESI_IT[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
          </div>

          <div style={{ flex: 1, paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontFamily: "'Fredoka', sans-serif", fontSize: 30, fontWeight: 600,
                color: 'var(--ocra)', letterSpacing: -0.6, lineHeight: 1,
                textShadow: '0 1px 0 rgba(0,0,0,0.25), 0 3px 8px rgba(200,138,23,0.4)',
              }}>{eventiOggi.length}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
                eventi oggi
              </span>
            </div>
            {prossimoEvento && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 7, textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
                <span className="pulse" style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--ocra)',
                  boxShadow: '0 0 12px var(--ocra), inset 0 1px 1px rgba(255,255,255,0.3)',
                  display: 'inline-block',
                }} />
                prossimo · <b style={{ color: '#fff', fontWeight: 700 }}>{prossimoEvento.ora_inizio} {prossimoEvento.cliente?.nome?.split(' ')[0] ?? ''}</b>
              </div>
            )}
          </div>
        </div>

        {/* Week strip */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, position: 'relative', zIndex: 2 }}
        >
          {giorni.map(g => {
            const key = toISO(g)
            const isToday = key === toISO(oggi)
            const isSelected = key === selectedKey
            const dots = Math.min((eventiPerData[key] || []).length, 3)

            return (
              <button key={key} onClick={() => onDateChange(g)} style={{
                border: 'none', cursor: 'pointer', borderRadius: 14,
                padding: '9px 0 7px', textAlign: 'center', position: 'relative',
                background: isSelected
                  ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'
                  : 'linear-gradient(160deg, rgba(0,0,0,0.22), rgba(0,0,0,0.32))',
                boxShadow: isSelected
                  ? 'inset 0 3px 5px rgba(255,255,255,0.4), inset 0 -3px 5px rgba(0,0,0,0.18), 0 6px 14px rgba(232,167,38,0.6), 0 2px 5px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)'
                  : 'inset 0 2px 3px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(255,255,255,0.08)',
                transform: isSelected ? 'translateY(-2px) scale(1.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '12%', left: '22%',
                    width: '32%', height: '18%',
                    background: 'rgba(255,255,255,0.55)',
                    borderRadius: '50%', filter: 'blur(2.5px)',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.6,
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.45)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.2)',
                }}>{GIORNI_SHORT[g.getDay()]}</div>
                <div style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 17, fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)',
                  marginTop: 3, textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                }}>{g.getDate()}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 5, height: 4 }}>
                  {Array.from({ length: dots }).map((_, i) => (
                    <span key={i} style={{
                      width: 3, height: 3, borderRadius: '50%',
                      background: isSelected ? 'rgba(255,255,255,0.95)' : 'var(--ocra)',
                      boxShadow: isSelected ? '0 0 4px rgba(255,255,255,0.6)' : '0 0 4px rgba(232,167,38,0.6)',
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              </button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
