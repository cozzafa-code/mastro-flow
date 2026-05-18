'use client'
import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { TipoImpegno } from '@/lib/agenda-types'
import { TIPI_IMPEGNO, DURATE, genImpegnoId } from '@/lib/agenda-types'
import { TipoPicker } from './TipoPicker'
import { TaskList, type TaskDraft } from './TaskList'
import { FollowUp, type FollowUpState } from './FollowUp'

interface Props {
  isOpen: boolean
  onClose: () => void
  dataIniziale?: string
  onCreato?: () => void
}

const today = new Date().toISOString().slice(0, 10)
const inp: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, padding: '14px', fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)', outline: 'none', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13)' }
const lbl: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 9 }

export const NuovoImpegnoModal: FC<Props> = ({ isOpen, onClose, dataIniziale, onCreato }) => {
  const [tipo, setTipo] = useState<TipoImpegno>('sopralluogo')
  const [titolo, setTitolo] = useState('')
  const [data, setData] = useState(dataIniziale || today)
  const [oraInizio, setOraInizio] = useState('09:00')
  const [durata, setDurata] = useState(60)
  const [luogo, setLuogo] = useState('')
  const [note, setNote] = useState('')
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [followUp, setFollowUp] = useState<FollowUpState>({ attivo: false, giorni: 3, messaggio: '', canale: 'whatsapp' })
  const [saving, setSaving] = useState(false)

  const tipoInfo = TIPI_IMPEGNO.find(t => t.id === tipo)!

  const handleCrea = async () => {
    if (!titolo.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/impegni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: genImpegnoId(), titolo: titolo.trim(), tipo, data,
          ora_inizio: oraInizio, durata_min: durata,
          luogo: luogo.trim(), note: note.trim(),
          operatori: [],
          push_reminder: true, reminder_min: 30,
          commessa_id: null, commessa_codice: null, commessa_cliente: null,
          follow_up: followUp.attivo ? followUp : null,
          tasks: tasks.map(t => ({ id: t.id, testo: t.testo, priorita: t.priorita, assegnato_a: t.assegnato_a, data_scadenza: t.data_scadenza || null, fatto: t.fatto, sub_tasks: t.sub_tasks })),
        }),
      })
      if (!res.ok) throw new Error('Errore')
      onClose(); onCreato?.()
      setTitolo(''); setNote(''); setLuogo(''); setTasks([])
      setFollowUp({ attivo: false, giorni: 3, messaggio: '', canale: 'whatsapp' })
    } catch (e) {
      alert('Errore: ' + (e as Error).message)
    } finally { setSaving(false) }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', width: '100%', maxWidth: 430, zIndex: 301, background: 'var(--bg)', borderRadius: '32px 32px 0 0', maxHeight: '94svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -16px 50px rgba(0,0,0,0.25)', touchAction: 'pan-y' }}>

            <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface-3)' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* HEADER teal */}
              <div style={{ padding: '14px 14px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '14px 14px 0', borderRadius: 28, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.4, zIndex: -1 }} />
                <div style={{ background: 'linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 55%, var(--teal-darker) 100%)', borderRadius: 24, padding: '13px 13px 14px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)' }}>
                  <div style={{ position: 'absolute', top: '8%', left: '12%', width: '32%', height: '22%', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(12px)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase' }}>CREA NUOVO</span>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 3px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.6)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.25)', position: 'relative', zIndex: 2 }}>Nuovo impegno</div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 5, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{tipoInfo.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                      {tasks.length > 0 ? `${tasks.length} task` : 'nessun task'}{followUp.attivo ? ' · 1 follow-up' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* TIPO */}
                <div>
                  <div style={lbl}>TIPO IMPEGNO</div>
                  <TipoPicker value={tipo} onChange={setTipo} />
                </div>

                {/* TITOLO */}
                <div>
                  <div style={lbl}>TITOLO IMPEGNO</div>
                  <input style={{ ...inp, fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, padding: '16px 14px' }} placeholder="Es: Sopralluogo Rossi" value={titolo} onChange={e => setTitolo(e.target.value)} />
                </div>

                {/* QUANDO */}
                <div>
                  <div style={lbl}>QUANDO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'DATA', value: data, type: 'date', onChange: setData },
                      { label: 'ORA', value: oraInizio, type: 'time', onChange: setOraInizio },
                    ].map(f => (
                      <div key={f.label} style={{ ...inp, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 14 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 800, color: 'var(--ink-soft)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{f.label}</div>
                          <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)', width: '100%' }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 800, color: 'var(--ink-soft)', letterSpacing: 0.6, textTransform: 'uppercase' }}>DURATA</div>
                        <select style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)', width: '100%' }} value={durata} onChange={e => setDurata(Number(e.target.value))}>
                          {DURATE.map(d => <option key={d} value={d}>{d < 60 ? `${d}min` : `${d/60}h`}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LUOGO */}
                <div>
                  <div style={lbl}>LUOGO</div>
                  <input style={inp} placeholder="Indirizzo o nome luogo" value={luogo} onChange={e => setLuogo(e.target.value)} />
                </div>

                {/* TASK */}
                <TaskList tasks={tasks} onChange={setTasks} />

                {/* FOLLOW-UP */}
                <FollowUp value={followUp} dataImpegno={data} onChange={setFollowUp} />

                {/* NOTE */}
                <div>
                  <div style={lbl}>NOTE</div>
                  <textarea style={{ ...inp, resize: 'none', minHeight: 70 } as React.CSSProperties} placeholder="Note aggiuntive…" value={note} onChange={e => setNote(e.target.value)} />
                </div>

                {/* ACTIONS */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={onClose} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '15px 14px', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3.5px 6px rgba(255,255,255,0.7)' }}>Annulla</button>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -6, borderRadius: 22, background: 'var(--teal)', filter: 'blur(13px)', opacity: titolo ? 0.5 : 0.2, zIndex: -1 }} />
                    <button onClick={handleCrea} disabled={!titolo.trim() || saving} style={{ width: '100%', border: 'none', cursor: titolo.trim() ? 'pointer' : 'not-allowed', borderRadius: 16, padding: '15px 14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, opacity: titolo.trim() ? 1 : 0.6, boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 10px 20px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25)' }}>
                      {saving ? 'Salvataggio…' : 'Crea Impegno'}
                      {!saving && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
