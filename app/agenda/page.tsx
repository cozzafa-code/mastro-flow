'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '@/app/components/BottomNav'
import { Topbar } from '@/app/components/Topbar'
import { NuovoImpegnoModal } from './components/NuovoImpegnoModal'
import type { Impegno, VistaAgenda } from '@/lib/agenda-types'
import {
  TIPI_IMPEGNO, MESI_IT, GIORNI_SHORT,
  generateMonthGrid, getDotsForDay, groupByData,
  isSameDay, isToday, toISODate, formatDataLunga, formatOra,
} from '@/lib/agenda-types'

export default function AgendaPage() {
  const today = new Date()
  const [vista, setVista] = useState<VistaAgenda>('mese')
  const [meseCorrente, setMeseCorrente] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selectedDate, setSelectedDate] = useState(today)
  const [impegni, setImpegni] = useState<Impegno[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const loadImpegni = useCallback(async () => {
    setLoading(true)
    const mese = `${meseCorrente.y}-${String(meseCorrente.m + 1).padStart(2, '0')}`
    const res = await fetch(`/api/impegni?mese=${mese}`)
    const json = await res.json()
    setImpegni(json.impegni || [])
    setLoading(false)
  }, [meseCorrente])

  useEffect(() => { loadImpegni() }, [loadImpegni])

  const giorni = generateMonthGrid(meseCorrente.y, meseCorrente.m)
  const impegniGiorno = impegni.filter(i => i.data === toISODate(selectedDate))
  const impegniGruppo = groupByData([...impegni].sort((a, b) => a.data.localeCompare(b.data)))

  const prevMese = () => setMeseCorrente(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 })
  const nextMese = () => setMeseCorrente(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 })
  const goToOggi = () => { setSelectedDate(today); setMeseCorrente({ y: today.getFullYear(), m: today.getMonth() }) }

  return (
    <div className="phone-screen">
      <Topbar notificheCount={0} onSearchOpen={() => {}} />

      <div className="page">
        {/* HEADER */}
        <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>— AGENDA</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
              {MESI_IT[meseCorrente.m]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 4, fontWeight: 700 }}>{impegni.length} eventi questo mese</div>
          </div>

          {/* + Nuovo impegno */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -7, borderRadius: 28, background: 'var(--teal)', filter: 'blur(13px)', opacity: 0.5, zIndex: -1 }} />
            <button onClick={() => setModalOpen(true)} style={{ background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, padding: '7px 16px 7px 7px', display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, flexShrink: 0, position: 'relative', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 18px rgba(20,80,90,0.5), inset 0 3px 5px rgba(255,255,255,0.22), inset 0 -3px 5px rgba(0,0,0,0.22)', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
              <div style={{ position: 'absolute', top: '14%', left: '8%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.22)', borderRadius: '50%', filter: 'blur(8px)', pointerEvents: 'none' }} />
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', flexShrink: 0, position: 'relative', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 2px 3px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.15)' }}>
                <div style={{ position: 'absolute', top: '16%', left: '24%', width: '34%', height: '18%', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(2px)' }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}>Nuovo impegno</span>
            </button>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        <div style={{ padding: '0 18px', marginBottom: 14 }}>
          <div style={{ background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', borderRadius: 14, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.12), inset 0 -1px 2px rgba(255,255,255,0.4)' }}>
            {(['mese', 'giorno', 'lista'] as VistaAgenda[]).map(v => {
              const icons: Record<VistaAgenda, React.ReactNode> = {
                mese: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
                giorno: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                lista: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
              }
              const isActive = vista === v
              return (
                <button key={v} onClick={() => setVista(v)} style={{ padding: '9px 8px', border: 'none', background: isActive ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'transparent', fontFamily: "'Fredoka', sans-serif", fontSize: 12.5, fontWeight: 700, color: isActive ? '#fff' : 'var(--ink-dim)', cursor: 'pointer', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: 0.2, position: 'relative', textShadow: isActive ? '0 1px 1.5px rgba(0,0,0,0.25)' : 'none', boxShadow: isActive ? 'inset 0 1.5px 3px rgba(255,255,255,0.25), 0 4px 9px rgba(20,80,90,0.45)' : 'none' }}>
                  {isActive && <div style={{ position: 'absolute', top: '14%', left: '18%', width: '28%', height: '18%', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', filter: 'blur(2.5px)' }} />}
                  <span style={{ position: 'relative', zIndex: 1 }}>{icons[v]}</span>
                  <span style={{ position: 'relative', zIndex: 1, textTransform: 'capitalize' }}>{v}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* MONTH NAV */}
        <div style={{ padding: '0 18px', marginBottom: 14 }}>
          <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 16, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 5px 12px rgba(60,50,30,0.14), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
            <div style={{ position: 'absolute', top: '6%', left: '10%', width: '28%', height: '14%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(7px)' }} />
            <NavArrow onClick={prevMese} dir="left" />
            <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2, lineHeight: 1, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{MESI_IT[meseCorrente.m]}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--ink-dim)', marginTop: 3 }}>{meseCorrente.y}</div>
            </div>
            <button onClick={goToOggi} style={{ padding: '6px 12px', borderRadius: 999, border: 'none', background: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)', fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55), 0 2px 5px rgba(200,138,23,0.18)' }}>Oggi</button>
            <NavArrow onClick={nextMese} dir="right" />
          </div>
        </div>

        {/* LEGENDA */}
        <div style={{ padding: '0 18px', marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIPI_IMPEGNO.map(t => (
            <span key={t.id} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10.5, fontWeight: 800, padding: '4px 10px 4px 8px', borderRadius: 999, background: t.bg, color: t.color, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.45)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.dot, display: 'inline-block', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.15)' }} />
              {t.label}
            </span>
          ))}
        </div>

        <div style={{ padding: '0 18px 110px' }}>
          <AnimatePresence mode="wait">

            {/* ── VISTA MESE ── */}
            {vista === 'mese' && (
              <motion.div key="mese" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: -6, borderRadius: 28, background: 'var(--surface-2)', filter: 'blur(11px)', opacity: 0.5, zIndex: -1 }} />
                  <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 22, padding: '14px 12px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 8px 18px rgba(60,50,30,0.16), inset 0 4px 7px rgba(255,255,255,0.6)' }}>
                    <div style={{ position: 'absolute', top: '4%', left: '8%', width: '28%', height: '12%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(9px)' }} />
                    {/* Giorni settimana */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8, position: 'relative', zIndex: 2 }}>
                      {GIORNI_SHORT.map((g, i) => (
                        <div key={g} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: i >= 5 ? 'var(--red)' : 'var(--ink-dim)', textAlign: 'center', letterSpacing: 1, padding: '4px 0' }}>{g}</div>
                      ))}
                    </div>
                    {/* Griglia giorni */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, position: 'relative', zIndex: 2 }}>
                      {giorni.map((d, i) => {
                        const isCurrentMonth = d.getMonth() === meseCorrente.m
                        const isSelected = isSameDay(d, selectedDate)
                        const isTodayDate = isToday(d)
                        const dots = getDotsForDay(impegni, d)
                        return (
                          <button key={i} onClick={() => { setSelectedDate(d); if (vista !== 'giorno') {} }} style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px 2px', borderRadius: 10, cursor: 'pointer', border: 'none', background: isTodayDate ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : isSelected ? 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))' : 'transparent', color: isTodayDate ? '#fff' : isCurrentMonth ? 'var(--ink)' : 'var(--ink-soft)', opacity: isCurrentMonth ? 1 : 0.4, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, position: 'relative', boxShadow: isTodayDate ? 'inset 0 1.5px 3px rgba(255,255,255,0.25), 0 4px 9px rgba(20,80,90,0.5)' : isSelected ? 'inset 0 2px 4px rgba(60,50,30,0.15), 0 0 0 2px var(--ocra-deep)' : 'none', textShadow: isTodayDate ? '0 1px 1.5px rgba(0,0,0,0.25)' : 'none', transition: 'all 0.15s' }}>
                            {isTodayDate && <div style={{ position: 'absolute', top: '14%', left: '18%', width: '28%', height: '18%', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', filter: 'blur(2px)' }} />}
                            <span style={{ lineHeight: 1, position: 'relative', zIndex: 2 }}>{d.getDate()}</span>
                            {dots.length > 0 && (
                              <div style={{ display: 'flex', gap: 2, position: 'relative', zIndex: 2 }}>
                                {dots.map((tipo, di) => {
                                  const t = TIPI_IMPEGNO.find(x => x.id === tipo)
                                  return <span key={di} style={{ width: 5, height: 5, borderRadius: '50%', background: isTodayDate ? 'rgba(255,255,255,0.85)' : t?.dot || 'var(--ink-dim)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)' }} />
                                })}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary cards */}
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Sopralluoghi', tipo: 'sopralluogo', color: 'var(--teal-deep)', dot: 'var(--teal)', bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))' },
                    { label: 'Montaggi', tipo: 'montaggio', color: 'var(--ocra-deep)', dot: 'var(--ocra)', bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))' },
                  ].map(s => {
                    const count = impegni.filter(i => i.tipo === s.tipo).length
                    return (
                      <div key={s.tipo} style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 14, padding: '10px 12px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.12), inset 0 3px 5px rgba(255,255,255,0.55)' }}>
                        <div style={{ position: 'absolute', top: '6%', left: '10%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(6px)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, position: 'relative', zIndex: 2 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.dot, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 0 4px currentColor' }} />
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: s.color }}>{s.label}</span>
                        </div>
                        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, position: 'relative', zIndex: 2, textShadow: '0 1px 0 rgba(255,255,255,0.45)' }}>{count}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 3, fontWeight: 700, position: 'relative', zIndex: 2 }}>questo mese</div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ── VISTA GIORNO ── */}
            {vista === 'giorno' && (
              <motion.div key="giorno" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                {/* Day header */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: 'var(--teal)', filter: 'blur(11px)', opacity: 0.35, zIndex: -1 }} />
                  <div style={{ background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', borderRadius: 18, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 10px 22px rgba(20,80,90,0.45), inset 0 4px 7px rgba(255,255,255,0.22)' }}>
                    <div style={{ position: 'absolute', top: '8%', left: '12%', width: '32%', height: '18%', background: 'rgba(255,255,255,0.22)', borderRadius: '50%', filter: 'blur(10px)' }} />
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 38, fontWeight: 600, lineHeight: 1, textShadow: '0 2px 3px rgba(0,0,0,0.3)', position: 'relative', zIndex: 2 }}>{selectedDate.getDate()}</div>
                    <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: 2, textTransform: 'uppercase' }}>{GIORNI_SHORT[(selectedDate.getDay() + 6) % 7]}</div>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, marginTop: 2, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{MESI_IT[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
                    </div>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, padding: '7px 13px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: '#fff', position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.25)' }}>
                      {impegniGiorno.length} eventi
                    </span>
                  </div>
                </div>

                {impegniGiorno.length === 0 ? (
                  <EmptyState label="Nessun impegno oggi" sub="Giornata libera" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {impegniGiorno.map(imp => (
                      <EventCard key={imp.id} impegno={imp} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── VISTA LISTA ── */}
            {vista === 'lista' && (
              <motion.div key="lista" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {Object.keys(impegniGruppo).length === 0 ? (
                  <EmptyState label="Nessun impegno" sub="Crea il primo impegno" />
                ) : (
                  Object.entries(impegniGruppo).map(([data, evts]) => (
                    <div key={data}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
                        {formatDataLunga(data)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {evts.map(imp => <EventCard key={imp.id} impegno={imp} />)}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav mailCount={0} />

      <NuovoImpegnoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dataIniziale={toISODate(selectedDate)}
        onCreato={loadImpegni}
      />
    </div>
  )
}

// ── SUB-COMPONENTI ────────────────────────────────────────────────

const NavArrow: React.FC<{ onClick: () => void; dir: 'left' | 'right' }> = ({ onClick, dir }) => (
  <button onClick={onClick} style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-2)', position: 'relative', flexShrink: 0, zIndex: 2, boxShadow: '0 0 0 1px rgba(60,50,30,0.06), inset 0 2px 3px rgba(255,255,255,0.65), 0 2px 4px rgba(60,50,30,0.1)' }}>
    <div style={{ position: 'absolute', top: '18%', left: '24%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(2px)' }} />
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
      {dir === 'left' ? <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></> : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}
    </svg>
  </button>
)

const EventCard: React.FC<{ impegno: Impegno }> = ({ impegno }) => {
  const tipoInfo = TIPI_IMPEGNO.find(t => t.id === impegno.tipo)!
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: -3, borderRadius: 18, background: 'var(--surface-2)', filter: 'blur(7px)', opacity: 0.35, zIndex: -1 }} />
      <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 15, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 5px 12px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '26%', height: '14%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(7px)' }} />
        {/* Color bar */}
        <div style={{ width: 4, height: '100%', position: 'absolute', left: 0, top: 0, borderRadius: '15px 0 0 15px', background: tipoInfo.dot }} />
        <div style={{ width: 34, height: 34, borderRadius: 11, background: tipoInfo.bg, color: tipoInfo.color, display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative', zIndex: 2, marginLeft: 8, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55), 0 2px 4px rgba(0,0,0,0.07)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2, textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>{impegno.titolo}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: 'var(--ink-2)' }}>{formatOra(impegno.ora_inizio)}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-soft)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--ink-soft)', fontWeight: 700 }}>
              {impegno.durata_min < 60 ? `${impegno.durata_min}min` : `${impegno.durata_min / 60}h`}
            </span>
            {impegno.luogo && <span style={{ fontSize: 11, color: 'var(--ink-dim)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{impegno.luogo}</span>}
          </div>
          {impegno.commessa_codice && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'var(--teal-bg)', color: 'var(--teal-deep)', display: 'inline-block', marginTop: 6 }}>{impegno.commessa_codice}</span>
          )}
        </div>
      </div>
    </div>
  )
}

const EmptyState: React.FC<{ label: string; sub: string }> = ({ label, sub }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
    <div style={{ fontSize: 48 }}>📅</div>
    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>{label}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{sub}</div>
  </div>
)
