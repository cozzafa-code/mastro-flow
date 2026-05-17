'use client'
import { FC, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SpostaEventoModalProps, SlotLibero } from '@/lib/types'
import { getSlotLiberi } from '@/lib/supabase/queries'

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
const GIORNI = ['L','M','M','G','V','S','D']

function toISO(d: Date) { return d.toISOString().split('T')[0] }

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const days: Date[] = []
  // Pad to Monday
  const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1
  for (let i = 0; i < startDow; i++) days.push(null as unknown as Date)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
  return days
}

type Step = 'calendario' | 'ora' | 'team' | 'conferma'

export const SpostaEventoModal: FC<SpostaEventoModalProps> = ({
  evento, isOpen, onClose, onConfirm
}) => {
  const oggi = new Date()
  const [step, setStep] = useState<Step>('calendario')
  const [calMonth, setCalMonth] = useState(oggi.getMonth())
  const [calYear, setCalYear] = useState(oggi.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedOra, setSelectedOra] = useState<string | null>(null)
  const [slotLiberi, setSlotLiberi] = useState<SlotLibero[]>([])
  const [loadingSlot, setLoadingSlot] = useState(false)
  const [invioEmail, setInvioEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteSposta, setNoteSposta] = useState('')

  // Reset quando si apre
  useEffect(() => {
    if (isOpen) {
      setStep('calendario')
      setSelectedDate(null)
      setSelectedOra(null)
      setSlotLiberi([])
      setNoteSposta('')
      setInvioEmail(true)
      setSaving(false)
    }
  }, [isOpen])

  // Carica slot liberi quando si seleziona una data
  useEffect(() => {
    if (!selectedDate || !evento) return
    setLoadingSlot(true)
    const dal = toISO(selectedDate)
    const d2 = new Date(selectedDate); d2.setDate(d2.getDate() + 1)
    const al = toISO(d2)
    getSlotLiberi(dal, al, evento.durata_min).then(slots => {
      setSlotLiberi(slots)
      setLoadingSlot(false)
    })
  }, [selectedDate, evento])

  const days = getDaysInMonth(calYear, calMonth)

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d)
    setSelectedOra(null)
    setStep('ora')
  }

  const handleOraSelect = (ora: string) => {
    setSelectedOra(ora)
    setStep('team')
  }

  const handleConferma = async () => {
    if (!selectedDate || !selectedOra || !evento) return
    setSaving(true)
    await onConfirm(evento.id, toISO(selectedDate), selectedOra)
    setSaving(false)
  }

  // Genera ore disponibili (da slot liberi + orari manuali)
  const oreDisponibili = slotLiberi.length > 0
    ? slotLiberi.map(s => s.ora)
    : Array.from({ length: 21 }, (_, i) => {
        const h = 8 + Math.floor(i / 2)
        const m = i % 2 === 0 ? '00' : '30'
        return `${String(h).padStart(2,'0')}:${m}`
      })

  const stepLabels: Record<Step, string> = {
    calendario: '1 · Scegli giorno',
    ora: '2 · Scegli ora',
    team: '3 · Disponibilità team',
    conferma: '4 · Conferma',
  }

  if (!evento) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              zIndex: 201,
              background: 'linear-gradient(160deg, var(--surface), var(--bg-soft))',
              borderRadius: '28px 28px 0 0',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.2)',
              maxHeight: '85%',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Handle */}
            <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: 'var(--surface-3)',
              }} />
            </div>

            {/* Header */}
            <div style={{ padding: '12px 20px 14px', borderBottom: '1px solid var(--line)' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: 2, color: 'var(--teal)',
                textTransform: 'uppercase', marginBottom: 4,
              }}>SPOSTA EVENTO</div>
              <div style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 4,
              }}>{evento.titolo}</div>

              {/* Stepper */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
                {(['calendario','ora','team','conferma'] as Step[]).map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 8,
                      background: step === s
                        ? 'linear-gradient(135deg, var(--teal), var(--teal-deep))'
                        : (['calendario','ora','team','conferma'] as Step[]).indexOf(step) > i
                          ? 'linear-gradient(135deg, var(--ocra), var(--ocra-deep))'
                          : 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: step === s || (['calendario','ora','team','conferma'] as Step[]).indexOf(step) > i ? '#fff' : 'var(--ink-soft)',
                      boxShadow: step === s ? '0 2px 6px rgba(21,81,89,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}>{i + 1}</div>
                    {i < 3 && <div style={{ width: 16, height: 1, background: 'var(--surface-3)' }} />}
                  </div>
                ))}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, color: 'var(--ink-dim)', letterSpacing: 0.5, marginLeft: 4,
                }}>{stepLabels[step]}</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* STEP 1: CALENDARIO */}
              {step === 'calendario' && (
                <div>
                  {/* Nav mese */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 14,
                  }}>
                    <button onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
                      else setCalMonth(m => m - 1)
                    }} style={navBtnStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <span style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontSize: 17, fontWeight: 600, color: 'var(--ink)',
                    }}>{MESI[calMonth]} {calYear}</span>
                    <button onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
                      else setCalMonth(m => m + 1)
                    }} style={navBtnStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>

                  {/* Header giorni */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                    {GIORNI.map((g, i) => (
                      <div key={i} style={{
                        textAlign: 'center',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, fontWeight: 600, letterSpacing: 1,
                        color: 'var(--ink-soft)', padding: '4px 0',
                      }}>{g}</div>
                    ))}
                  </div>

                  {/* Giorni */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {days.map((d, i) => {
                      if (!d) return <div key={i} />
                      const isPast = d < new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate())
                      const isSelected = selectedDate && toISO(d) === toISO(selectedDate)
                      const isToday = toISO(d) === toISO(oggi)

                      return (
                        <button key={i} onClick={() => !isPast && handleDateSelect(d)}
                          disabled={isPast}
                          style={{
                            border: 'none', cursor: isPast ? 'not-allowed' : 'pointer',
                            borderRadius: 10, padding: '8px 4px',
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--teal), var(--teal-deep))'
                              : isToday
                                ? 'linear-gradient(135deg, var(--ocra-bg), var(--ocra-mid))'
                                : 'transparent',
                            boxShadow: isSelected
                              ? '0 3px 8px rgba(21,81,89,0.3)'
                              : 'none',
                            opacity: isPast ? 0.3 : 1,
                            transition: 'all 0.15s',
                          }}>
                          <span style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 15, fontWeight: 600,
                            color: isSelected ? '#fff' : isToday ? 'var(--ocra-deep)' : 'var(--ink)',
                          }}>{d.getDate()}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: ORA */}
              {step === 'ora' && (
                <div>
                  <div style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 13, color: 'var(--ink-dim)', marginBottom: 14,
                  }}>
                    {loadingSlot
                      ? 'Calcolo slot disponibili…'
                      : slotLiberi.length > 0
                        ? `${slotLiberi.length} slot liberi trovati`
                        : 'Seleziona orario manualmente'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {oreDisponibili.map(ora => {
                      const isSlotLibero = slotLiberi.some(s => s.ora === ora)
                      const isSelected = selectedOra === ora
                      return (
                        <button key={ora} onClick={() => handleOraSelect(ora)} style={{
                          border: 'none', cursor: 'pointer', borderRadius: 12,
                          padding: '10px 4px',
                          background: isSelected
                            ? 'linear-gradient(135deg, var(--teal), var(--teal-deep))'
                            : isSlotLibero
                              ? 'linear-gradient(135deg, rgba(31,111,120,0.1), rgba(31,111,120,0.2))'
                              : 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
                          boxShadow: isSelected
                            ? '0 3px 8px rgba(21,81,89,0.3), inset 0 1px 2px rgba(255,255,255,0.2)'
                            : '0 2px 4px rgba(60,50,30,0.08), inset 0 1px 2px rgba(255,255,255,0.5)',
                          transition: 'all 0.15s',
                          position: 'relative',
                        }}>
                          {isSlotLibero && !isSelected && (
                            <div style={{
                              position: 'absolute', top: 4, right: 4,
                              width: 5, height: 5, borderRadius: '50%',
                              background: 'var(--teal)',
                            }} />
                          )}
                          <div style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 15, fontWeight: 600,
                            color: isSelected ? '#fff' : 'var(--ink)',
                          }}>{ora}</div>
                        </button>
                      )
                    })}
                  </div>

                  {slotLiberi.length > 0 && (
                    <div style={{
                      marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, color: 'var(--ink-soft)',
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
                      = slot libero consigliato
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DISPONIBILITA TEAM */}
              {step === 'team' && (
                <div>
                  <div style={{
                    borderRadius: 16, padding: '14px',
                    background: 'linear-gradient(145deg, var(--teal-bg), var(--teal-soft))',
                    boxShadow: '0 3px 10px rgba(21,81,89,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
                    marginBottom: 14,
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9, letterSpacing: 2, color: 'var(--teal)', marginBottom: 8,
                    }}>RIEPILOGO SPOSTAMENTO</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Row label="Evento" value={evento.titolo} />
                      <Row label="Data attuale" value={evento.data} />
                      <Row label="Ora attuale" value={evento.ora_inizio} />
                      <Row label="Nuova data" value={selectedDate ? toISO(selectedDate) : '—'} accent />
                      <Row label="Nuova ora" value={selectedOra ?? '—'} accent />
                    </div>
                  </div>

                  {/* Disponibilità team - placeholder realistico */}
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, letterSpacing: 2, color: 'var(--ink-soft)',
                    marginBottom: 10,
                  }}>DISPONIBILITÀ TEAM</div>

                  {slotLiberi.length > 0 && slotLiberi[0].operatori_disponibili.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {slotLiberi
                        .find(s => s.ora === selectedOra)
                        ?.operatori_disponibili.map(op => (
                          <div key={op} style={{
                            borderRadius: 12, padding: '10px 14px',
                            background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
                            boxShadow: '0 2px 6px rgba(60,50,30,0.08)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{op}</span>
                            <span style={{
                              borderRadius: 8, padding: '3px 9px',
                              background: 'linear-gradient(135deg, rgba(26,158,115,0.15), rgba(26,158,115,0.25))',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 9, color: '#1a9e73', fontWeight: 600, letterSpacing: 1,
                            }}>LIBERO</span>
                          </div>
                        )) ?? (
                        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, padding: '16px 0' }}>
                          Nessun dato operatori disponibile
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      borderRadius: 12, padding: '14px',
                      background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
                      textAlign: 'center',
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 13, color: 'var(--ink-dim)',
                    }}>
                      Disponibilità non configurata — verifica con il team manualmente
                    </div>
                  )}

                  {/* Note */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9, letterSpacing: 2, color: 'var(--ink-soft)', marginBottom: 6,
                    }}>NOTE (opzionale)</div>
                    <textarea
                      value={noteSposta}
                      onChange={e => setNoteSposta(e.target.value)}
                      placeholder="Motivo spostamento…"
                      rows={2}
                      style={{
                        width: '100%', border: 'none', outline: 'none',
                        borderRadius: 12, padding: '10px 14px',
                        background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
                        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.08), inset 0 -1px 2px rgba(255,255,255,0.3)',
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 13, color: 'var(--ink)',
                        resize: 'none',
                      }}
                    />
                  </div>

                  {/* Email toggle */}
                  <div style={{
                    marginTop: 12, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '12px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
                    boxShadow: '0 2px 6px rgba(60,50,30,0.08)',
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                        Notifica cliente via email
                      </div>
                      {evento.cliente?.nome && (
                        <div style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
                          {evento.cliente.nome}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setInvioEmail(v => !v)} style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      cursor: 'pointer',
                      background: invioEmail
                        ? 'linear-gradient(135deg, var(--teal), var(--teal-deep))'
                        : 'var(--surface-3)',
                      boxShadow: invioEmail ? '0 2px 6px rgba(21,81,89,0.3)' : 'none',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}>
                      <motion.div
                        animate={{ x: invioEmail ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                          position: 'absolute', top: 2, left: 2,
                          width: 20, height: 20, borderRadius: 10,
                          background: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </button>
                  </div>

                  <button onClick={() => setStep('conferma')} style={{
                    width: '100%', border: 'none', cursor: 'pointer',
                    marginTop: 14, borderRadius: 14, padding: '14px',
                    background: 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
                    boxShadow: '0 5px 14px rgba(21,81,89,0.35), inset 0 2px 4px rgba(255,255,255,0.2)',
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 17, fontWeight: 600, color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: -3, borderRadius: 16,
                      background: 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
                      filter: 'blur(5px)', opacity: 0.4, zIndex: -1,
                    }} />
                    Continua →
                  </button>
                </div>
              )}

              {/* STEP 4: CONFERMA */}
              {step === 'conferma' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Riepilogo finale */}
                  <div style={{
                    borderRadius: 18, padding: '18px',
                    background: 'linear-gradient(145deg, var(--teal-bg), var(--teal-soft))',
                    boxShadow: '0 4px 14px rgba(21,81,89,0.12), inset 0 2px 4px rgba(255,255,255,0.5)',
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9, letterSpacing: 2, color: 'var(--teal)', marginBottom: 12,
                    }}>RIEPILOGO FINALE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Row label="Evento" value={evento.titolo} />
                      {evento.cliente?.nome && <Row label="Cliente" value={evento.cliente.nome} />}
                      <div style={{ height: 1, background: 'rgba(21,81,89,0.15)', margin: '4px 0' }} />
                      <Row label="Da" value={`${evento.data} · ${evento.ora_inizio}`} />
                      <Row label="A" value={`${selectedDate ? toISO(selectedDate) : '—'} · ${selectedOra ?? '—'}`} accent />
                      <Row label="Notifica email" value={invioEmail ? 'Sì' : 'No'} />
                      {noteSposta && <Row label="Note" value={noteSposta} />}
                    </div>
                  </div>

                  {invioEmail && (
                    <div style={{
                      borderRadius: 12, padding: '12px 14px',
                      background: 'linear-gradient(145deg, var(--ocra-bg), var(--ocra-mid))',
                      boxShadow: '0 3px 8px rgba(232,167,38,0.15)',
                      fontSize: 12, color: 'var(--ocra-deep)',
                      fontFamily: "'Nunito', sans-serif",
                    }}>
                      📧 Verrà inviata una email al cliente con i nuovi dettagli dell'appuntamento.
                    </div>
                  )}

                  {/* Pulsanti */}
                  <button
                    onClick={handleConferma}
                    disabled={saving}
                    style={{
                      width: '100%', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                      borderRadius: 14, padding: '15px',
                      background: saving
                        ? 'var(--surface-3)'
                        : 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
                      boxShadow: saving ? 'none' : '0 5px 16px rgba(21,81,89,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
                      fontFamily: "'Fredoka', sans-serif",
                      fontSize: 18, fontWeight: 600,
                      color: saving ? 'var(--ink-soft)' : '#fff',
                      position: 'relative',
                    }}>
                    {!saving && (
                      <div style={{
                        position: 'absolute', inset: -3, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
                        filter: 'blur(6px)', opacity: 0.4, zIndex: -1,
                      }} />
                    )}
                    {saving ? 'Salvataggio…' : 'Conferma spostamento'}
                  </button>

                  <button onClick={onClose} style={{
                    width: '100%', border: 'none', cursor: 'pointer',
                    borderRadius: 14, padding: '12px',
                    background: 'transparent',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 14, fontWeight: 600, color: 'var(--ink-dim)',
                  }}>Annulla</button>
                </div>
              )}
            </div>

            {/* Nav back */}
            {step !== 'calendario' && (
              <div style={{ padding: '10px 20px 16px', borderTop: '1px solid var(--line)' }}>
                <button onClick={() => {
                  const order: Step[] = ['calendario','ora','team','conferma']
                  const i = order.indexOf(step)
                  if (i > 0) setStep(order[i - 1])
                }} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 13, fontWeight: 600, color: 'var(--ink-dim)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                  Indietro
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Helpers ──────────────────────────────────────────────────────
const Row: FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9, letterSpacing: 1, color: 'var(--teal-deep)', fontWeight: 600,
    }}>{label.toUpperCase()}</span>
    <span style={{
      fontFamily: "'Nunito', sans-serif",
      fontSize: 13, fontWeight: accent ? 800 : 600,
      color: accent ? 'var(--teal)' : 'var(--ink-2)',
    }}>{value}</span>
  </div>
)

const navBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
  boxShadow: '0 2px 6px rgba(60,50,30,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
