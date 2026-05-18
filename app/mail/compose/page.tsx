'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/app/components/Topbar'
import type { EmailTemplate } from '@/lib/mail-types'

const inp: React.CSSProperties = {
  width: '100%', border: 'none', borderRadius: 12, padding: '12px 14px',
  fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600,
  color: 'var(--ink)', outline: 'none',
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.4)',
}
const lbl: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
  color: 'var(--ink-dim)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
}

export default function ComposePage() {
  const router = useRouter()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    fetch('/api/mail/templates').then(r => r.json()).then(j => setTemplates(j.templates || []))
  }, [])

  const applyTemplate = (t: EmailTemplate) => {
    setSubject(t.subject_template)
    setBody(t.body_template)
    setShowTemplates(false)
  }

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      })
      if (res.ok) router.push('/mail')
      else alert('Errore invio')
    } finally { setSending(false) }
  }

  return (
    <div className="phone-screen">
      <Topbar notificheCount={0} onSearchOpen={() => {}} />
      <div className="page">
        {/* Header teal */}
        <div style={{ padding: '14px 14px 0', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '14px 14px 0', borderRadius: 28, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.4, zIndex: -1 }} />
          <div style={{ background: 'linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 55%, var(--teal-darker) 100%)', borderRadius: 24, padding: '13px 14px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)' }}>
            <div style={{ position: 'absolute', top: '8%', left: '12%', width: '32%', height: '22%', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(12px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
              <button onClick={() => router.back()} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 12px', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Indietro
              </button>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase' }}>NUOVA MAIL</span>
              <div style={{ width: 70 }} />
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600, color: '#fff', marginTop: 8, position: 'relative', zIndex: 2, textShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>Scrivi email</div>
          </div>
        </div>

        <div style={{ padding: '18px 18px 110px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Template picker */}
          <div>
            <div style={lbl}>TEMPLATE RAPIDI</div>
            <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 4, scrollbarWidth: 'none' }}>
              {templates.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)} style={{ flexShrink: 0, border: 'none', cursor: 'pointer', borderRadius: 12, padding: '9px 13px', background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', whiteSpace: 'nowrap', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 3px 8px rgba(60,50,30,0.12), inset 0 2px 4px rgba(255,255,255,0.6)' }}>
                  {t.name}
                </button>
              ))}
              {templates.length === 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)' }}>Nessun template</span>}
            </div>
          </div>

          {/* A: */}
          <div>
            <div style={lbl}>A:</div>
            <input style={inp} type="email" placeholder="destinatario@email.it" value={to} onChange={e => setTo(e.target.value)} inputMode="email" />
          </div>

          {/* Oggetto */}
          <div>
            <div style={lbl}>OGGETTO</div>
            <input style={inp} placeholder="Oggetto dell'email" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          {/* Corpo */}
          <div>
            <div style={lbl}>MESSAGGIO</div>
            <textarea style={{ ...inp, resize: 'none', minHeight: 200, lineHeight: 1.5 } as React.CSSProperties} placeholder="Scrivi il messaggio…" value={body} onChange={e => setBody(e.target.value)} />
          </div>

          {/* Allegati placeholder */}
          <button style={{ border: '1.5px dashed rgba(60,50,30,0.22)', borderRadius: 14, padding: '12px', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.4)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(160deg, var(--violet-bg), var(--violet-mid))', color: 'var(--violet-deep)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>Allega file</span>
          </button>

          {/* Firma automatica */}
          <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 14, padding: '11px 14px', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), inset 0 2px 4px rgba(255,255,255,0.55)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, color: 'var(--ink-soft)', letterSpacing: 1, marginBottom: 4 }}>FIRMA AUTOMATICA</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'var(--ink-dim)', fontWeight: 600, lineHeight: 1.4 }}>Cordiali saluti<br />fliwoX · Il tuo assistente serramenti</div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.back()} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '14px', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3.5px 6px rgba(255,255,255,0.7)' }}>Annulla</button>
            <div style={{ flex: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -6, borderRadius: 22, background: 'var(--teal)', filter: 'blur(12px)', opacity: (to && subject) ? 0.5 : 0.2, zIndex: -1 }} />
              <button onClick={handleSend} disabled={!to.trim() || !subject.trim() || sending} style={{ width: '100%', border: 'none', cursor: (to && subject) ? 'pointer' : 'not-allowed', borderRadius: 16, padding: '14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, opacity: (to && subject) ? 1 : 0.6, boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 10px 20px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25)', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {sending ? 'Invio…' : 'Invia email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
