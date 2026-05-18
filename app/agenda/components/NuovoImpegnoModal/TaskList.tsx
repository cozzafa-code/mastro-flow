'use client'
import { FC, useState } from 'react'
import type { Priorita } from '@/lib/agenda-types'
import { genTaskId } from '@/lib/agenda-types'

export interface SubTaskDraft { id: string; testo: string; fatto: boolean }
export interface TaskDraft {
  id: string; testo: string; priorita: Priorita
  assegnato_a: string; assegnato_avatar: string
  data_scadenza: string; fatto: boolean
  sub_tasks: SubTaskDraft[]
}

const PRI_STYLE: Record<Priorita, { bg: string; color: string }> = {
  alta:  { bg: 'var(--red-bg)',  color: 'var(--red-deep)'  },
  media: { bg: 'var(--ocra-bg)', color: 'var(--ocra-deep)' },
  bassa: { bg: 'var(--teal-bg)', color: 'var(--teal-deep)' },
}

interface Props {
  tasks: TaskDraft[]
  onChange: (tasks: TaskDraft[]) => void
}

export const TaskList: FC<Props> = ({ tasks, onChange }) => {
  const [addingText, setAddingText] = useState('')
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [subText, setSubText] = useState<Record<string, string>>({})

  const update = (id: string, patch: Partial<TaskDraft>) =>
    onChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t))

  const addTask = () => {
    if (!addingText.trim()) return
    onChange([...tasks, { id: genTaskId(), testo: addingText.trim(), priorita: 'media', assegnato_a: '', assegnato_avatar: '', data_scadenza: '', fatto: false, sub_tasks: [] }])
    setAddingText(''); setAdding(false)
  }

  const addSub = (taskId: string) => {
    const txt = (subText[taskId] || '').trim()
    if (!txt) return
    update(taskId, { sub_tasks: [...(tasks.find(t => t.id === taskId)?.sub_tasks || []), { id: genTaskId(), testo: txt, fatto: false }] })
    setSubText(p => ({ ...p, [taskId]: '' }))
  }

  const toggleSub = (taskId: string, subId: string) => {
    const t = tasks.find(x => x.id === taskId)!
    update(taskId, { sub_tasks: t.sub_tasks.map(s => s.id === subId ? { ...s, fatto: !s.fatto } : s) })
  }

  const completi = tasks.filter(t => t.fatto).length

  return (
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
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'var(--violet-bg)', color: 'var(--violet-deep)' }}>{completi}/{tasks.length}</span>
          )}
        </div>

        {/* Task rows */}
        {tasks.map(t => (
          <div key={t.id} style={{ borderBottom: '1px solid rgba(60,50,30,0.06)', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 4px 6px' }}>
              {/* Check */}
              <button onClick={() => update(t.id, { fatto: !t.fatto })} style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: t.fatto ? 'none' : '1.8px solid rgba(60,50,30,0.18)', cursor: 'pointer', display: 'grid', placeItems: 'center', background: t.fatto ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: t.fatto ? 'inset 0 1.5px 3px rgba(255,255,255,0.3), 0 2.5px 6px rgba(47,125,87,0.4)' : 'none' }}>
                {t.fatto && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13.5, fontWeight: 700, color: t.fatto ? 'var(--ink-soft)' : 'var(--ink)', textDecoration: t.fatto ? 'line-through' : 'none', lineHeight: 1.3 }}>{t.testo}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  {(['alta','media','bassa'] as Priorita[]).map(p => (
                    <button key={p} onClick={() => update(t.id, { priorita: p })} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', letterSpacing: 0.6, background: t.priorita === p ? PRI_STYLE[p].bg : 'transparent', color: t.priorita === p ? PRI_STYLE[p].color : 'var(--ink-soft)' }}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                  <input type="date" value={t.data_scadenza} onChange={e => update(t.id, { data_scadenza: e.target.value })} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-dim)', cursor: 'pointer', width: 90 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <input placeholder="Assegna a…" value={t.assegnato_a} onChange={e => update(t.id, { assegnato_a: e.target.value, assegnato_avatar: e.target.value.trim().slice(0,1).toUpperCase() })} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--ink-dim)', width: 90 }} />
                  <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--teal-deep)', fontWeight: 700 }}>
                    {expanded === t.id ? '▲' : `▼ sub (${t.sub_tasks.length})`}
                  </button>
                </div>
                {/* Sub-tasks */}
                {expanded === t.id && (
                  <div style={{ marginLeft: 16, marginTop: 4, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -8, top: 0, bottom: 8, width: 1.5, background: 'rgba(60,50,30,0.15)', borderRadius: 1 }} />
                    {t.sub_tasks.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 5px 8px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -8, top: '50%', width: 10, height: 1.5, background: 'rgba(60,50,30,0.15)' }} />
                        <button onClick={() => toggleSub(t.id, s.id)} style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: s.fatto ? 'none' : '1.5px solid rgba(60,50,30,0.18)', cursor: 'pointer', display: 'grid', placeItems: 'center', background: s.fatto ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))' }}>
                          {s.fatto && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.fatto ? 'var(--ink-soft)' : 'var(--ink-2)', textDecoration: s.fatto ? 'line-through' : 'none', flex: 1 }}>{s.testo}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, padding: '4px 0 4px 8px' }}>
                      <input placeholder="+ Sub-task…" value={subText[t.id] || ''} onChange={e => setSubText(p => ({ ...p, [t.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addSub(t.id) }} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'var(--ink-dim)' }} />
                      <button onClick={() => addSub(t.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--teal-deep)', fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700 }}>OK</button>
                    </div>
                  </div>
                )}
              </div>
              {/* Avatar o elimina */}
              {t.assegnato_avatar ? (
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)', display: 'grid', placeItems: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 10, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                  {t.assegnato_avatar}
                </div>
              ) : (
                <button onClick={() => onChange(tasks.filter(x => x.id !== t.id))} style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red-deep)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Aggiungi task */}
        {adding ? (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, position: 'relative', zIndex: 2 }}>
            <input autoFocus style={{ flex: 1, border: 'none', borderRadius: 10, padding: '9px 12px', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--ink)', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', outline: 'none' }} placeholder="Descrivi il task…" value={addingText} onChange={e => setAddingText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false) }} />
            <button onClick={addTask} style={{ border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700 }}>OK</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ width: '100%', marginTop: 8, padding: '9px 12px', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', border: '1.5px dashed rgba(60,50,30,0.22)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', position: 'relative', zIndex: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)', display: 'grid', placeItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Aggiungi task</span>
          </button>
        )}
      </div>
    </div>
  )
}
