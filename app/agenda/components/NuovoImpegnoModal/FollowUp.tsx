'use client'
import { FC } from 'react'

type Canale = 'whatsapp' | 'chiamata' | 'email' | 'sms'

export interface FollowUpState {
  attivo: boolean
  giorni: number
  messaggio: string
  canale: Canale
}

interface Props {
  value: FollowUpState
  dataImpegno: string
  onChange: (v: FollowUpState) => void
}

function getDate(giorni: number, dataImpegno: string): string {
  const d = new Date(dataImpegno + 'T00:00:00')
  d.setDate(d.getDate() + giorni)
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}

const CANALI: { id: Canale; label: string; icon: React.ReactNode }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> },
  { id: 'chiamata', label: 'Chiama', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5a2 2 0 011.72-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> },
  { id: 'email', label: 'Email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { id: 'sms', label: 'SMS', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
]

const inp: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, padding: '14px', fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)', outline: 'none', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13)' }
const lbl: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 7 }

export const FollowUp: FC<Props> = ({ value, dataImpegno, onChange }) => {
  const set = (patch: Partial<FollowUpState>) => onChange({ ...value, ...patch })

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: value.attivo ? 'var(--ocra)' : 'var(--surface-2)', filter: 'blur(9px)', opacity: value.attivo ? 0.4 : 0.3, zIndex: -1 }} />
      <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 18, padding: '13px 14px', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.55)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '6%', left: '8%', width: '26%', height: '12%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(7px)' }} />

        {/* Header + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: value.attivo ? 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: value.attivo ? 'var(--ocra-deep)' : 'var(--ink-soft)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Follow-up</div>
              {value.attivo && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ocra-deep)', fontWeight: 700, marginTop: 2 }}>Tra {value.giorni}g · {getDate(value.giorni, dataImpegno)}</div>}
            </div>
          </div>
          <button onClick={() => set({ attivo: !value.attivo })} style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, background: value.attivo ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, var(--surface-3), var(--surface-2))', boxShadow: value.attivo ? 'inset 0 1.5px 2.5px rgba(255,255,255,0.25), 0 2px 5px rgba(200,138,23,0.4)' : 'inset 0 1.5px 3px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}>
            <div style={{ width: 17, height: 17, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2.5, left: value.attivo ? undefined : 2.5, right: value.attivo ? 2.5 : undefined, transition: 'all 0.2s', boxShadow: '0 1.5px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        {value.attivo && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 2 }}>
            {/* Giorni */}
            <div style={{ display: 'flex', gap: 5 }}>
              {[1,2,3,5,7,14,30].map(g => (
                <button key={g} onClick={() => set({ giorni: g })} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, padding: '7px 2px', fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, background: value.giorni === g ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: value.giorni === g ? '#fff' : 'var(--ink-dim)', boxShadow: value.giorni === g ? '0 3px 7px rgba(200,138,23,0.4)' : 'inset 0 1.5px 2px rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>{g}g</button>
              ))}
            </div>
            {/* Messaggio */}
            <textarea style={{ ...inp, resize: 'none', minHeight: 65, fontSize: 13 } as React.CSSProperties} placeholder="Quando ricontattare…" value={value.messaggio} onChange={e => set({ messaggio: e.target.value })} />
            {/* Canale */}
            <div>
              <div style={lbl}>CANALE PREFERITO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {CANALI.map(c => {
                  const isActive = value.canale === c.id
                  return (
                    <button key={c.id} onClick={() => set({ canale: c.id })} style={{ border: 'none', cursor: 'pointer', borderRadius: 11, padding: '9px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: isActive ? 'linear-gradient(160deg, var(--success-bg), var(--success-mid))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: isActive ? 'var(--success)' : 'var(--ink-2)', boxShadow: isActive ? '0 0 0 1px rgba(47,125,87,0.18), inset 0 2px 4px rgba(255,255,255,0.6), 0 3px 7px rgba(47,125,87,0.25)' : '0 0 0 1px rgba(60,50,30,0.06), inset 0 2px 4px rgba(255,255,255,0.55)', transition: 'all 0.15s' }}>
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
  )
}
