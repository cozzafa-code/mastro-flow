'use client'
import { FC, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { TipoImpegno, Priorita } from '@/lib/agenda-types'
import { TIPI_IMPEGNO, DURATE, genImpegnoId, genTaskId } from '@/lib/agenda-types'

interface Props {
  isOpen: boolean
  onClose: () => void
  dataIniziale?: string
  onCreato?: () => void
}

interface SubTaskDraft { id: string; testo: string; fatto: boolean }
interface TaskDraft {
  id: string; testo: string; priorita: Priorita
  assegnato_a: string; assegnato_avatar: string
  data_scadenza: string; fatto: boolean
  sub_tasks: SubTaskDraft[]
}

const PRIORITA: { id: Priorita; label: string; bg: string; color: string }[] = [
  { id: 'alta',  label: 'ALTA',  bg: 'var(--red-bg)',  color: 'var(--red-deep)'  },
  { id: 'media', label: 'MEDIA', bg: 'var(--ocra-bg)', color: 'var(--ocra-deep)' },
  { id: 'bassa', label: 'BASSA', bg: 'var(--teal-bg)', color: 'var(--teal-deep)' },
]

// Label corte come nel mockup
const TIPO_LABELS: Record<TipoImpegno, string> = {
  sopralluogo: 'Sopr.',
  montaggio:   'Mont.',
  conferma:    'Cons.',
  promemoria:  'Prom.',
  scadenza:    'Scad.',
}

const today = new Date().toISOString().slice(0, 10)

function getFollowUpDate(giorni: number, dataImpegno: string): string {
  const d = new Date(dataImpegno + 'T00:00:00')
  d.setDate(d.getDate() + giorni)
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}

function genAvatar(nome: string): string {
  return nome.trim().slice(0, 1).toUpperCase() || '?'
}

export const NuovoImpegnoModal: FC<Props> = ({ isOpen, onClose, dataIniziale, onCreato }) => {
  const [tipo, setTipo] = useState<TipoImpegno>('sopralluogo')
  const [titolo, setTitolo] = useState('')
  const [data, setData] = useState(dataIniziale || today)
  const [oraInizio, setOraInizio] = useState('09:00')
  const [durata, setDurata] = useState(60)
  const [luogo, setLuogo] = useState('')
  const [note, setNote] = useState('')
  const [operatori, setOperatori] = useState('')
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [pushReminder, setPushReminder] = useState(true)
  const [reminderMin, setReminderMin] = useState(30)
  const [saving, setSaving] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [newSubText, setNewSubText] = useState<Record<string, string>>({})
  // Follow-up
  const [followUpOn, setFollowUpOn] = useState(false)
  const [followUpGiorni, setFollowUpGiorni] = useState(3)
  const [followUpMessaggio, setFollowUpMessaggio] = useState('')
  const [followUpCanale, setFollowUpCanale] = useState<'whatsapp'|'chiamata'|'email'|'sms'>('whatsapp')

  const tipoInfo = TIPI_IMPEGNO.find(t => t.id === tipo)!
  const taskCompleti = tasks.filter(t => t.fatto).length

  const addTask = useCallback(() => {
    if (!newTaskText.trim()) return
    const id = genTaskId()
    setTasks(p => [...p, { id, testo: newTaskText.trim(), priorita: 'media', assegnato_a: '', assegnato_avatar: '', data_scadenza: '', fatto: false, sub_tasks: [] }])
    setNewTaskText('')
    setAddingTask(false)
  }, [newTaskText])

  const toggleTask = (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, fatto: !t.fatto } : t))
  const removeTask = (id: string) => setTasks(p => p.filter(t => t.id !== id))
  const updateTask = (id: string, field: keyof TaskDraft, value: any) => setTasks(p => p.map(t => t.id === id ? { ...t, [field]: value } : t))

  const addSubTask = (taskId: string) => {
    const txt = (newSubText[taskId] || '').trim()
    if (!txt) return
    setTasks(p => p.map(t => t.id === taskId ? { ...t, sub_tasks: [...t.sub_tasks, { id: genTaskId(), testo: txt, fatto: false }] } : t))
    setNewSubText(p => ({ ...p, [taskId]: '' }))
  }
  const toggleSubTask = (taskId: string, subId: string) => setTasks(p => p.map(t => t.id === taskId ? { ...t, sub_tasks: t.sub_tasks.map(s => s.id === subId ? { ...s, fatto: !s.fatto } : s) } : t))

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
          operatori: operatori ? operatori.split(',').map(s => s.trim()).filter(Boolean) : [],
          push_reminder: pushReminder, reminder_min: reminderMin,
          commessa_id: null, commessa_codice: null, commessa_cliente: null,
          follow_up: followUpOn ? { attivo: true, giorni: followUpGiorni, messaggio: followUpMessaggio, canale: followUpCanale } : null,
          tasks: tasks.map(t => ({ id: t.id, testo: t.testo, priorita: t.priorita, assegnato_a: t.assegnato_a, data_scadenza: t.data_scadenza || null, fatto: t.fatto, sub_tasks: t.sub_tasks })),
        }),
      })
      if (!res.ok) throw new Error('Errore')
      onClose(); onCreato?.()
      setTitolo(''); setNote(''); setLuogo(''); setTasks([]); setOperatori('')
    } catch (e) { alert('Errore: ' + (e as Error).message)
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
              {/* HEADER */}
              <div style={{ padding: '14px 14px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '14px 14px 0', borderRadius: 28, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.4, zIndex: -1 }} />
                <div style={{ background: 'linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 55%, var(--teal-darker) 100%)', borderRadius: 24, padding: '13px 13px 14px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)' }}>
                  <div style={{ position: 'absolute', top: '8%', left: '12%', width: '32%', height: '22%', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(12px)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase' }}>CREA NUOVO</span>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', position: 'relative', boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 3px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.6)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, letterSpacing: -0.5, color: '#fff', lineHeight: 1.05, textShadow: '0 2px 4px rgba(0,0,0,0.25)', position: 'relative', zIndex: 2 }}>Nuovo impegno</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{tipoInfo.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                      {tasks.length > 0 ? `${tasks.length} task` : 'nessun task'}{followUpOn ? ' · 1 follow-up' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* TIPO — 5 card come mockup */}
                <div>
                  <div style={secLbl}>TIPO IMPEGNO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {TIPI_IMPEGNO.map(t => {
                      const isActive = tipo === t.id
                      return (
                        <button key={t.id} onClick={() => setTipo(t.id)} style={{ background: isActive ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, var(--surface), var(--surface-2))', border: 'none', cursor: 'pointer', borderRadius: 14, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative', overflow: 'hidden', boxShadow: isActive ? '0 0 0 1px rgba(0,0,0,0.08), 0 8px 18px rgba(20,80,90,0.5), inset 0 2px 4px rgba(255,255,255,0.22)' : '0 0 0 1px rgba(60,50,30,0.06), 0 3px 8px rgba(60,50,30,0.13), inset 0 2px 4px rgba(255,255,255,0.6)', transition: 'all 0.18s' }}>
                          {isActive && <div style={{ position: 'absolute', inset: -5, borderRadius: 19, background: 'var(--teal)', filter: 'blur(10px)', opacity: 0.45, zIndex: -1 }} />}
                          <div style={{ position: 'absolute', top: '8%', left: '14%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(4px)', pointerEvents: 'none' }} />
                          <div style={{ width: 30, height: 30, borderRadius: 10, background: isActive ? 'rgba(255,255,255,0.25)' : t.bg, color: isActive ? '#fff' : t.color, display: 'grid', placeItems: 'center', position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.08)' }}>
                            <TipoIcon tipo={t.id} />
                          </div>
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : 'var(--ink-2)', position: 'relative', zIndex: 2, textShadow: isActive ? '0 1px 1px rgba(0,0,0,0.25)' : 'none' }}>{TIPO_LABELS[t.id]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* TITOLO */}
                <div>
                  <div style={secLbl}>TITOLO IMPEGNO</div>
                  <input style={{ ...inp, fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, padding: '16px 14px' }} placeholder="Es: Sopralluogo Rossi" value={titolo} onChange={e => setTitolo(e.target.value)} />
                </div>

                {/* QUANDO */}
                <div>
                  <div style={secLbl}>QUANDO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 8 }}>
                    <DtPick icon="cal" label="DATA" value={data} type="date" onChange={setData} />
                    <DtPick icon="clock" label="ORA" value={oraInizio} type="time" onChange={setOraInizio} />
                    <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(160deg, var(--surface-2), #DCD3BF)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 3"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 800, color: 'var(--ink-soft)', letterSpacing: 0.6, textTransform: 'uppercase' }}>DURATA</div>
                        <select style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)', width: '100%', cursor: 'pointer' }} value={durata} onChange={e => setDurata(Number(e.target.value))}>
                          {DURATE.map(d => <option key={d} value={d}>{d < 60 ? `${d}min` : `${d/60}h`}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMMESSA */}
                <div>
                  <div style={secLbl}>COMMESSA COLLEGATA</div>
                  <button style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 3px 8px rgba(60,50,30,0.12), inset 0 2.5px 4px rgba(255,255,255,0.6)' }}>
                    <div style={{ position: 'absolute', top: '8%', left: '10%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(6px)' }} />
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)', display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                    </div>
                    <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>Collega commessa</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 2, fontWeight: 700 }}>Tocca per cercare una commessa</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>

                {/* TASK LIST stile Asana — fedele al mockup */}
                <div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: 'var(--surface-2)', filter: 'blur(9px)', opacity: 0.4, zIndex: -1 }} />
                    <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 18, padding: '12px 12px 10px', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.55)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '4%', left: '8%', width: '28%', height: '12%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(8px)' }} />
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px', position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(160deg, var(--violet-bg), #D5C5E5)', color: 'var(--violet-deep)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/><polyline points="20 12 13 19 11 17"/></svg>
                          </div>
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>Task</span>
                        </div>
                        {tasks.length > 0 && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'var(--violet-bg)', color: 'var(--violet-deep)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }}>
                            {taskCompleti}/{tasks.length}
                          </span>
                        )}
                      </div>

                      {/* Task rows */}
                      {tasks.map(t => (
                        <div key={t.id} style={{ borderBottom: '1px solid rgba(60,50,30,0.06)', position: 'relative', zIndex: 2 }}>
                          {/* Task principale */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 4px 6px' }}>
                            {/* Check circle */}
                            <button onClick={() => toggleTask(t.id)} style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: t.fatto ? 'none' : '1.8px solid rgba(60,50,30,0.18)', cursor: 'pointer', display: 'grid', placeItems: 'center', background: t.fatto ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: t.fatto ? 'inset 0 1.5px 3px rgba(255,255,255,0.3), 0 2.5px 6px rgba(47,125,87,0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                              {t.fatto && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                            {/* Body */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13.5, fontWeight: 700, color: t.fatto ? 'var(--ink-soft)' : 'var(--ink)', lineHeight: 1.3, textDecoration: t.fatto ? 'line-through' : 'none' }}>{t.testo}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                                {/* Priorità */}
                                {PRIORITA.map(p => (
                                  <button key={p.id} onClick={() => updateTask(t.id, 'priorita', p.id)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', letterSpacing: 0.6, background: t.priorita === p.id ? p.bg : 'transparent', color: t.priorita === p.id ? p.color : 'var(--ink-soft)', boxShadow: t.priorita === p.id ? 'inset 0 1px 2px rgba(255,255,255,0.45)' : 'none' }}>{p.label}</button>
                                ))}
                                {/* Data scadenza */}
                                <input type="date" value={t.data_scadenza} onChange={e => updateTask(t.id, 'data_scadenza', e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: 'var(--ink-dim)', cursor: 'pointer', width: 90 }} />
                              </div>
                              {/* Assegna operatore */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                                <input placeholder="Assegna a…" value={t.assegnato_a} onChange={e => { updateTask(t.id, 'assegnato_a', e.target.value); updateTask(t.id, 'assegnato_avatar', genAvatar(e.target.value)) }} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--ink-dim)', width: 90, padding: '2px 0' }} />
                                {t.sub_tasks.length > 0 && (
                                  <button onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--teal-deep)', fontWeight: 700 }}>
                                    {t.sub_tasks.filter(s => s.fatto).length}/{t.sub_tasks.length} sub
                                  </button>
                                )}
                              </div>

                              {/* Sub-tasks */}
                              {expandedTask === t.id && (
                                <div style={{ marginLeft: 16, marginTop: 6, paddingTop: 2, position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: -8, top: 0, bottom: 8, width: 1.5, background: 'rgba(60,50,30,0.15)', borderRadius: 1 }} />
                                  {t.sub_tasks.map(s => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 5px 8px', position: 'relative' }}>
                                      <div style={{ position: 'absolute', left: -8, top: '50%', width: 10, height: 1.5, background: 'rgba(60,50,30,0.15)' }} />
                                      <button onClick={() => toggleSubTask(t.id, s.id)} style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: s.fatto ? 'none' : '1.5px solid rgba(60,50,30,0.18)', cursor: 'pointer', display: 'grid', placeItems: 'center', background: s.fatto ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: s.fatto ? 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1.5px 4px rgba(47,125,87,0.35)' : 'none' }}>
                                        {s.fatto && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                      </button>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: s.fatto ? 'var(--ink-soft)' : 'var(--ink-2)', textDecoration: s.fatto ? 'line-through' : 'none', flex: 1 }}>{s.testo}</span>
                                    </div>
                                  ))}
                                  {/* Aggiungi sub-task */}
                                  <div style={{ display: 'flex', gap: 6, padding: '5px 0 5px 8px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: -8, top: '50%', width: 10, height: 1.5, background: 'rgba(60,50,30,0.15)' }} />
                                    <input placeholder="+ Sub-task…" value={newSubText[t.id] || ''} onChange={e => setNewSubText(p => ({ ...p, [t.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addSubTask(t.id) }} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--ink-dim)' }} />
                                    <button onClick={() => addSubTask(t.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--teal-deep)', fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700 }}>OK</button>
                                  </div>
                                </div>
                              )}
                              {/* Bottone espandi sub-tasks */}
                              <button onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--teal-deep)', fontWeight: 700, padding: '3px 0', display: 'block' }}>
                                {expandedTask === t.id ? '▲ chiudi' : '▼ sub-task'}
                              </button>
                            </div>
                            {/* Avatar */}
                            {t.assegnato_avatar ? (
                              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)', display: 'grid', placeItems: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 10, position: 'relative', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                                <div style={{ position: 'absolute', top: '12%', left: '24%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(1.5px)' }} />
                                {t.assegnato_avatar}
                              </div>
                            ) : (
                              <button onClick={() => removeTask(t.id)} style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red-deep)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Aggiungi task */}
                      {addingTask ? (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, position: 'relative', zIndex: 2 }}>
                          <input autoFocus style={{ flex: 1, border: 'none', borderRadius: 10, padding: '9px 12px', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--ink)', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(60,50,30,0.1)' }} placeholder="Descrivi il task…" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAddingTask(false) }} />
                          <button onClick={addTask} style={{ border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700 }}>OK</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingTask(true)} style={{ width: '100%', marginTop: 8, padding: '9px 12px', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', border: '1.5px dashed rgba(60,50,30,0.22)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', position: 'relative', zIndex: 2, boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.4)' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1.5px 2px rgba(255,255,255,0.55)' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </div>
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Aggiungi task</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOLLOW-UP */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: followUpOn ? 'var(--ocra)' : 'var(--surface-2)', filter: 'blur(9px)', opacity: followUpOn ? 0.4 : 0.3, zIndex: -1 }} />
                  <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 18, padding: '13px 14px', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.55)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '6%', left: '8%', width: '26%', height: '12%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(7px)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: followUpOn ? 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: followUpOn ? 'var(--ocra-deep)' : 'var(--ink-soft)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Follow-up</div>
                          {followUpOn && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ocra-deep)', fontWeight: 700, marginTop: 2 }}>Tra {followUpGiorni}g · {getFollowUpDate(followUpGiorni, data)}</div>}
                        </div>
                      </div>
                      <button onClick={() => setFollowUpOn(v => !v)} style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: followUpOn ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, var(--surface-3), var(--surface-2))', position: 'relative', zIndex: 2, boxShadow: followUpOn ? 'inset 0 1.5px 2.5px rgba(255,255,255,0.25), 0 2px 5px rgba(200,138,23,0.4)' : 'inset 0 1.5px 3px rgba(0,0,0,0.15)', transition: 'all 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'linear-gradient(160deg, #fff, var(--bg-soft))', position: 'absolute', top: 2.5, right: followUpOn ? 2.5 : undefined, left: followUpOn ? undefined : 2.5, transition: 'all 0.2s', boxShadow: '0 1.5px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>

                    {followUpOn && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 2 }}>
                        {/* Input testo "Tra X giorni · data" */}
                        <input style={inp} value={`Tra ${followUpGiorni} giorni · ${getFollowUpDate(followUpGiorni, data)}`} readOnly />
                        {/* Giorni quick pick */}
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[1,2,3,5,7,14,30].map(g => (
                            <button key={g} onClick={() => setFollowUpGiorni(g)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, padding: '7px 2px', fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, background: followUpGiorni === g ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: followUpGiorni === g ? '#fff' : 'var(--ink-dim)', boxShadow: followUpGiorni === g ? '0 3px 7px rgba(200,138,23,0.4)' : 'inset 0 1.5px 2px rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>{g}g</button>
                          ))}
                        </div>
                        {/* Messaggio */}
                        <textarea style={{ ...inp, resize: 'none', minHeight: 65, fontSize: 13 } as React.CSSProperties} placeholder="Quando ricontattare…" value={followUpMessaggio} onChange={e => setFollowUpMessaggio(e.target.value)} />
                        {/* Canale */}
                        <div>
                          <div style={{ ...secLbl, marginBottom: 7 }}>CANALE PREFERITO</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {[
                              { id: 'whatsapp', label: 'WhatsApp', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> },
                              { id: 'chiamata', label: 'Chiama', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.12 3 2 2 0 012.1 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.66-.66a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> },
                              { id: 'email', label: 'Email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                              { id: 'sms', label: 'SMS', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
                            ].map(c => {
                              const isActive = followUpCanale === c.id
                              return (
                                <button key={c.id} onClick={() => setFollowUpCanale(c.id as any)} style={{ border: 'none', cursor: 'pointer', borderRadius: 11, padding: '9px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: isActive ? 'linear-gradient(160deg, var(--success-bg), var(--success-mid))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: isActive ? 'var(--success)' : 'var(--ink-2)', boxShadow: isActive ? '0 0 0 1px rgba(47,125,87,0.18), inset 0 2px 4px rgba(255,255,255,0.6), 0 3px 7px rgba(47,125,87,0.25)' : '0 0 0 1px rgba(60,50,30,0.06), inset 0 2px 4px rgba(255,255,255,0.55), 0 1.5px 4px rgba(60,50,30,0.1)', transition: 'all 0.15s' }}>
                                  {c.icon}
                                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 9.5, fontWeight: isActive ? 800 : 700 }}>{c.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* NOTE */}
                <div>
                  <div style={secLbl}>NOTE</div>
                  <textarea style={{ ...inp, resize: 'none', minHeight: 70 } as React.CSSProperties} placeholder="Note aggiuntive sull'impegno…" value={note} onChange={e => setNote(e.target.value)} />
                </div>

                {/* ACTIONS */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={onClose} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '15px 14px', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', textShadow: '0 1px 0 rgba(255,255,255,0.45)', boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3.5px 6px rgba(255,255,255,0.7)' }}>Annulla</button>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -6, borderRadius: 22, background: 'var(--teal)', filter: 'blur(13px)', opacity: titolo ? 0.5 : 0.2, zIndex: -1 }} />
                    <button onClick={handleCrea} disabled={!titolo.trim() || saving} style={{ width: '100%', border: 'none', cursor: titolo.trim() ? 'pointer' : 'not-allowed', borderRadius: 16, padding: '15px 14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.25)', opacity: titolo.trim() ? 1 : 0.6, boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 10px 20px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25)' }}>
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

// ── HELPERS ──────────────────────────────────────────────────────
const TipoIcon: FC<{ tipo: TipoImpegno }> = ({ tipo }) => {
  const icons: Record<TipoImpegno, React.ReactNode> = {
    sopralluogo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    montaggio:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    conferma:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M16 3h5v5"/><path d="M21 8L11 18l-4-4-7 7"/></svg>,
    promemoria:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    scadenza:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  }
  return <>{icons[tipo]}</>
}

const DtPick: FC<{ icon: string; label: string; value: string; type: string; onChange: (v: string) => void }> = ({ icon, label, value, type, onChange }) => (
  <div style={{ background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', borderRadius: 14, padding: '11px 12px', boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.13), inset 0 -1px 2px rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(160deg, var(--surface-2), #DCD3BF)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
      {icon === 'cal' ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 800, color: 'var(--ink-soft)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 1, width: '100%', cursor: 'pointer' }} />
    </div>
  </div>
)

const secLbl: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 9, paddingLeft: 2 }
const inp: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, padding: '14px 14px', fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)', outline: 'none', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13), inset 0 -1px 2px rgba(255,255,255,0.45)' }
