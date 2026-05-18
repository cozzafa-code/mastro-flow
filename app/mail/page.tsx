'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/app/components/Topbar'
import { BottomNav } from '@/app/components/BottomNav'
import { MailInbox } from './components/MailInbox'
import { LeadBoard } from './components/LeadBoard'
import type { Email, MailFilter, MailVista, LeadStage } from '@/lib/mail-types'

export default function MailPage() {
  const router = useRouter()
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<MailVista>('inbox')
  const [filter, setFilter] = useState<MailFilter>('tutte')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ filter, vista, q: search })
    const res = await fetch(`/api/mail?${params}`)
    const json = await res.json()
    setEmails(json.emails || [])
    setLoading(false)
  }, [filter, vista, search])

  useEffect(() => { load() }, [load])

  const nonLette = emails.filter(e => !e.is_read).length
  const lead = emails.filter(e => e.category === 'lead').length

  const handleStar = async (id: string, val: boolean) => {
    setEmails(p => p.map(e => e.id === id ? { ...e, is_starred: val } : e))
    await fetch('/api/mail', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_starred: val }) })
  }

  const handleStageChange = async (id: string, stage: LeadStage) => {
    setEmails(p => p.map(e => e.id === id ? { ...e, lead_stage: stage } : e))
    await fetch('/api/mail', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, lead_stage: stage, lead_stage_updated_at: new Date().toISOString() }) })
  }

  return (
    <div className="phone-screen">
      <Topbar notificheCount={0} onSearchOpen={() => {}} />
      <div className="page">
        {/* HEADER */}
        <div style={{ padding: '8px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>— POSTA</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>Inbox</div>
            <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 4, fontWeight: 700 }}>
              {nonLette > 0 ? `${nonLette} non lette` : 'Tutto letto'}{lead > 0 ? ` · ${lead} lead` : ''}
            </div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: -7, borderRadius: 28, background: 'var(--teal)', filter: 'blur(13px)', opacity: 0.5, zIndex: -1 }} />
            <button onClick={() => router.push('/mail/compose')} style={{ background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, padding: '6px 14px 6px 6px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, position: 'relative', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 18px rgba(20,80,90,0.5), inset 0 3px 5px rgba(255,255,255,0.22)', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
              <div style={{ position: 'absolute', top: '14%', left: '8%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.22)', borderRadius: '50%', filter: 'blur(8px)', pointerEvents: 'none' }} />
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', flexShrink: 0, position: 'relative', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 2px 3px rgba(255,255,255,0.7)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}>Nuova mail</span>
            </button>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        <div style={{ padding: '0 18px 10px' }}>
          <div style={{ background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', borderRadius: 12, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.12)' }}>
            {[
              { id: 'inbox' as MailVista, label: 'Lista' },
              { id: 'lead_board' as MailVista, label: 'Lead Board' },
            ].map(v => (
              <button key={v.id} onClick={() => setVista(v.id)} style={{ padding: '8px 4px', border: 'none', background: vista === v.id ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'transparent', fontFamily: "'Fredoka', sans-serif", fontSize: 11.5, fontWeight: 700, color: vista === v.id ? '#fff' : 'var(--ink-dim)', cursor: 'pointer', borderRadius: 9, boxShadow: vista === v.id ? 'inset 0 1.5px 3px rgba(255,255,255,0.25), 0 4px 9px rgba(20,80,90,0.45)' : 'none', textShadow: vista === v.id ? '0 1px 1.5px rgba(0,0,0,0.25)' : 'none' }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, paddingBottom: 110 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : vista === 'inbox' ? (
            <MailInbox emails={emails} filter={filter} onFilterChange={setFilter} onEmailClick={e => router.push(`/mail/${e.id}`)} onStarToggle={handleStar} search={search} onSearchChange={setSearch} />
          ) : (
            <LeadBoard emails={emails} onEmailClick={e => router.push(`/mail/${e.id}`)} onStageChange={handleStageChange} />
          )}
        </div>
      </div>
      <BottomNav mailCount={nonLette} />
    </div>
  )
}
