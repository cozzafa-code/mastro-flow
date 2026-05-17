'use client'
import { FC, useRef } from 'react'
import { motion } from 'framer-motion'
import type { CalendarHeroProps, Evento } from '@/lib/types'

const GIORNI_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_SHORT = ['D', 'L', 'M', 'M', 'G', 'V', 'S']
const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

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
  const dragRef = useRef<number>(0)

  const selectedKey = toISO(selectedDate)
  const eventiOggi = eventiPerData[selectedKey] || []
  const prossimoOra = (() => {
    if (toISO(selectedDate) !== toISO(oggi)) return eventiOggi[0]?.ora_inizio
    return eventiOggi.find(e => {
      const [h, m] = e.ora_inizio.split(':').map(Number)
      return h * 60 + m >= oggi.getHours() * 60 + oggi.getMinutes()
    })?.ora_inizio ?? eventiOggi[0]?.ora_inizio
  })()

  const prossimoCliente = (() => {
    const e = eventiOggi.find(ev => ev.ora_inizio === prossimoOra)
    return e?.cliente?.nome?.split(' ')[0] ?? e?.titolo?.split(' ')[0] ?? '—'
  })()

  // Swipe settimana
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -60) {
      const next = new Date(selectedDate); next.setDate(next.getDate() + 7); onDateChange(next)
    } else if (info.offset.x > 60) {
      const prev = new Date(selectedDate); prev.setDate(prev.getDate() - 7); onDateChange(prev)
    }
  }

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div style={{
        background: 'linear-gradient(160deg, var(--teal-deep), var(--teal-darker))',
        borderRadius: 24,
        padding: '18px 18px 16px',
        boxShadow: '0 8px 24px rgba(14,62,68,0.4), 0 2px 6px rgba(0,0,0,0.15), inset 0 2px 8px rgba(255,255,255,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow fuzz */}
        <div style={{
          position: 'absolute', inset: -6,
          background: 'linear-gradient(160deg, var(--teal-deep), var(--teal-darker))',
          filter: 'blur(8px)', opacity: 0.5, zIndex: 0, borderRadius: 28,
        }} />

        {/* Top bar: label + seg switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 14 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 600, letterSpacing: 2,
            color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
          }}>CALENDARIO</span>

          <SegSwitch value={viewMode} onChange={onViewModeChange} />
        </div>

        {/* Big day */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginBottom: 14 }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 600, letterSpacing: 2,
              color: 'var(--ocra)', textTransform: 'uppercase', marginBottom: 2,
            }}>
              {GIORNI_IT[selectedDate.getDay()].toUpperCase()}
            </div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 80, fontWeight: 700, lineHeight: 1,
              color: '#fff',
              textShadow: '0 1px 0 rgba(255,255,255,.15), 0 2px 0 rgba(0,0,0,.2), 0 4px 8px rgba(0,0,0,.3), 0 8px 16px rgba(0,0,0,.2)',
            }}>
              {selectedDate.getDate()}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {MESI_IT[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 42, fontWeight: 700, color: 'var(--ocra)',
                textShadow: '0 2px 8px rgba(232,167,38,0.4)',
              }}>{eventiOggi.length}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>eventi oggi</span>
            </div>
            {prossimoOra && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <span className="pulse" style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--ocra)', display: 'inline-block',
                  willChange: 'transform',
                }} />
                prossimo · <b style={{ color: 'rgba(255,255,255,0.85)' }}>{prossimoOra} {prossimoCliente}</b>
              </div>
            )}
          </div>
        </div>

        {/* Week strip - draggable */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 5, position: 'relative', zIndex: 1,
          }}
        >
          {giorni.map((g) => {
            const key = toISO(g)
            const isToday = key === toISO(oggi)
            const isSelected = key === selectedKey
            const eventiGiorno = eventiPerData[key] || []
            const dots = Math.min(eventiGiorno.length, 3)

            return (
              <motion.button
                key={key}
                onClick={() => onDateChange(g)}
                whileTap={{ scale: 0.95 }}
                style={{
                  border: 'none', cursor: 'pointer',
                  borderRadius: 12,
                  padding: '7px 3px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: isSelected
                    ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(232,167,38,0.4), inset 0 2px 4px rgba(255,255,255,0.3)'
                    : 'inset 0 1px 2px rgba(255,255,255,0.05)',
                  transform: isToday && !isSelected ? 'translateY(-2px) scale(1.08)' : 'none',
                  willChange: 'transform',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 600, letterSpacing: 1,
                  color: isSelected ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.45)',
                }}>
                  {GIORNI_SHORT[g.getDay()]}
                </span>
                <span style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 17, fontWeight: 600,
                  color: isSelected ? '#1a0a00' : '#fff',
                  textShadow: isSelected ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                }}>
                  {g.getDate()}
                </span>
                {/* dots */}
                <div style={{ display: 'flex', gap: 2, height: 5 }}>
                  {Array.from({ length: dots }).map((_, i) => (
                    <span key={i} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: isSelected ? 'rgba(0,0,0,0.4)' : 'var(--ocra)',
                    }} />
                  ))}
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

// ── SEG SWITCH ──────────────────────────────────────────────────
const SegSwitch: FC<{
  value: 'day' | 'week' | 'month'
  onChange: (v: 'day' | 'week' | 'month') => void
}> = ({ value, onChange }) => {
  const opts: { key: 'day' | 'week' | 'month'; label: string }[] = [
    { key: 'day', label: 'Giorno' },
    { key: 'week', label: 'Sett.' },
    { key: 'month', label: 'Mese' },
  ]
  return (
    <div style={{
      display: 'flex', gap: 3,
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 10, padding: 3,
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
    }}>
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          border: 'none', cursor: 'pointer',
          padding: '4px 10px', borderRadius: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
          transition: 'all 0.15s',
          background: value === o.key
            ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'
            : 'transparent',
          color: value === o.key ? '#1a0a00' : 'rgba(255,255,255,0.5)',
          boxShadow: value === o.key
            ? '0 2px 6px rgba(232,167,38,0.35), inset 0 1px 2px rgba(255,255,255,0.3)'
            : 'none',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
