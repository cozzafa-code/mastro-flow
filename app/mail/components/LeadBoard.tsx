'use client'
import { FC, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Email, LeadStage } from '@/lib/mail-types'
import { LEAD_STAGES, getAvatarColor, getAvatarInitial, formatEmailTime } from '@/lib/mail-types'

interface Props {
  emails: Email[]
  onEmailClick: (e: Email) => void
  onStageChange: (id: string, stage: LeadStage) => void
}

export const LeadBoard: FC<Props> = ({ emails, onEmailClick, onStageChange }) => {
  const [stagePicker, setStagePicker] = useState<{ emailId: string; current: LeadStage } | null>(null)

  const byStage = (stage: LeadStage) => emails.filter(e => e.lead_stage === stage)

  return (
    <div>
      {/* Mini funnel sticky */}
      <div style={{ padding: '0 18px 12px' }}>
        <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.12), inset 0 3px 5px rgba(255,255,255,0.55)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '8%', width: '26%', height: '18%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(6px)' }} />
          {LEAD_STAGES.map((s, i) => {
            const count = byStage(s.id).length
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: count > 0 ? s.bg : 'var(--surface-2)', display: 'grid', placeItems: 'center', boxShadow: count > 0 ? 'inset 0 1.5px 3px rgba(255,255,255,0.55), 0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 700, color: count > 0 ? s.color : 'var(--ink-soft)' }}>{count}</span>
                  </div>
                </div>
                {i < LEAD_STAGES.length - 1 && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Kanban scroll orizzontale con snap */}
      <div style={{ overflowX: 'auto', paddingLeft: 18, paddingBottom: 16, scrollSnapType: 'x mandatory', display: 'flex', gap: 10, scrollbarWidth: 'none' }}>
        {LEAD_STAGES.map(stage => (
          <div key={stage.id} style={{ width: 280, flexShrink: 0, scrollSnapAlign: 'start' }}>
            {/* Header colonna */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, paddingRight: 18 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: stage.dot, boxShadow: `0 0 5px ${stage.dot}` }} />
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: stage.bg, color: stage.color }}>{byStage(stage.id).length}</span>
            </div>

            {/* Lead cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 10 }}>
              {byStage(stage.id).map(e => {
                const av = getAvatarColor(e.from_address)
                const daysSince = e.received_at ? (Date.now() - new Date(e.received_at).getTime()) / 86400000 : 0
                const fermoColor = daysSince > 5 ? 'var(--red-deep)' : daysSince > 3 ? 'var(--ocra-deep)' : 'var(--success)'
                const fermoBg = daysSince > 5 ? 'var(--red-bg)' : daysSince > 3 ? 'var(--ocra-bg)' : 'var(--success-bg)'
                return (
                  <div key={e.id} onClick={() => onEmailClick(e)} style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 16, padding: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 5px 12px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
                    <div style={{ position: 'absolute', top: '8%', left: '10%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(6px)' }} />
                    {/* Avatar + nome */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, position: 'relative', zIndex: 2 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: av.bg, color: av.color, display: 'grid', placeItems: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                        {getAvatarInitial(e.from_name, e.from_address)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.from_name || e.from_address}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.from_address}</div>
                      </div>
                    </div>
                    {/* Subject */}
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', lineHeight: 1.3, marginBottom: 8, position: 'relative', zIndex: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                      {e.subject}
                    </div>
                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', fontWeight: 700 }}>{formatEmailTime(e.received_at || e.sent_at)}</span>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: fermoBg, color: fermoColor }}>
                          {daysSince < 1 ? 'OK' : `${Math.floor(daysSince)}gg`}
                        </span>
                        {/* Sposta a... */}
                        <button onClick={ev => { ev.stopPropagation(); setStagePicker({ emailId: e.id, current: e.lead_stage! }) }} style={{ border: 'none', cursor: 'pointer', borderRadius: 7, padding: '3px 7px', background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)', fontFamily: "'Fredoka', sans-serif", fontSize: 9, fontWeight: 700 }}>
                          Sposta →
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {byStage(stage.id).length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', letterSpacing: 1 }}>VUOTO</div>
              )}
            </div>
          </div>
        ))}
        {/* Spacer finale */}
        <div style={{ width: 8, flexShrink: 0 }} />
      </div>

      {/* Stage picker modal */}
      {stagePicker && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={() => setStagePicker(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: 430, zIndex: 401, background: 'var(--bg)', borderRadius: '28px 28px 0 0', padding: '16px 20px 40px', boxShadow: '0 -12px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface-3)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Sposta a…</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEAD_STAGES.map(s => (
                <button key={s.id} onClick={() => { onStageChange(stagePicker.emailId, s.id); setStagePicker(null) }} style={{ border: 'none', cursor: 'pointer', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: stagePicker.current === s.id ? s.bg : 'linear-gradient(160deg, var(--surface), var(--surface-2))', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 3px 8px rgba(60,50,30,0.12), inset 0 2px 4px rgba(255,255,255,0.6)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, boxShadow: `0 0 5px ${s.dot}` }} />
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: s.color, flex: 1, textAlign: 'left' }}>{s.label}</span>
                  {stagePicker.current === s.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
