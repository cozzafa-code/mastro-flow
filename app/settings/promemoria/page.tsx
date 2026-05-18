'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchReminderSettings, updateReminderSettings } from '@/lib/clienti-queries'
import type { ReminderSettings } from '@/lib/clienti-types'
import { BottomNav } from '@/app/components/BottomNav'

export default function PromemoriaSettingsPage() {
  const router = useRouter()
  const [s, setS] = useState<ReminderSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchReminderSettings().then(setS).catch(console.error) }, [])

  const update = (key: keyof ReminderSettings, value: unknown) => {
    setS(prev => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!s) return
    setSaving(true)
    try {
      await updateReminderSettings(s)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { alert('Errore salvataggio') }
    finally { setSaving(false) }
  }

  if (!s) return <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}><div style={{ fontFamily:"'Fredoka',sans-serif", color:'var(--ink-dim)', fontSize:18 }}>Caricamento…</div></div>

  const SEZIONI = [
    {
      key: 'birthday', label: 'Compleanni', color: 'var(--pink)', colorBg: 'var(--pink-bg)', colorDeep: 'var(--pink-deep)',
      enabled: s.birthday_enabled, onToggle: () => update('birthday_enabled', !s.birthday_enabled),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1"/><path d="M12 3v2M9.17 4.83L8 6M14.83 4.83L16 6"/></svg>,
      controls: [
        { label: 'Giorni prima', value: s.birthday_days_before, options: [7,14,30], key: 'birthday_days_before' },
        { label: 'Canale', value: s.birthday_canale_suggerito, options: ['whatsapp','call','email'], key: 'birthday_canale_suggerito' },
      ],
    },
    {
      key: 'maintenance', label: 'Manutenzioni', color: 'var(--teal)', colorBg: 'var(--teal-bg)', colorDeep: 'var(--teal-deep)',
      enabled: s.maintenance_enabled, onToggle: () => update('maintenance_enabled', !s.maintenance_enabled),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
      controls: [
        { label: 'Anni dopo installazione', value: s.maintenance_years, options: [1,2,3,5], key: 'maintenance_years' },
      ],
    },
    {
      key: 'anniversary', label: 'Anniversari', color: 'var(--success)', colorBg: 'var(--success-bg)', colorDeep: 'var(--success)',
      enabled: s.anniversary_enabled, onToggle: () => update('anniversary_enabled', !s.anniversary_enabled),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      controls: [
        { label: 'Mesi dopo consegna', value: s.anniversary_months_after, options: [6,12,24], key: 'anniversary_months_after' },
      ],
    },
    {
      key: 'followup', label: 'Follow-up', color: 'var(--ocra)', colorBg: 'var(--ocra-bg)', colorDeep: 'var(--ocra-deep)',
      enabled: s.followup_enabled, onToggle: () => update('followup_enabled', !s.followup_enabled),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      controls: [
        { label: 'Giorni senza risposta', value: s.followup_days, options: [3,5,7,10,14], key: 'followup_days' },
      ],
    },
    {
      key: 'winback', label: 'Win-back', color: 'var(--blue)', colorBg: 'var(--blue-bg)', colorDeep: 'var(--blue-deep)',
      enabled: s.winback_enabled, onToggle: () => update('winback_enabled', !s.winback_enabled),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
      controls: [
        { label: 'Mesi inattività', value: s.winback_months, options: [6,12,18,24], key: 'winback_months' },
      ],
    },
  ]

  return (
    <div className="phone-screen">
      {/* Header */}
      <div style={{ position:'relative', margin:'8px 16px 0', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:-8, borderRadius:30, background:'var(--teal)', filter:'blur(12px)', opacity:0.4, zIndex:-1 }} />
        <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', borderRadius:22, padding:'14px 18px', position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(0,0,0,0.08),0 12px 28px rgba(20,80,90,0.45),inset 0 5px 12px rgba(255,255,255,0.12)' }}>
          <div style={{ position:'absolute', top:'12%', left:'14%', width:'26%', height:'18%', background:'rgba(255,255,255,0.18)', borderRadius:'50%', filter:'blur(12px)' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:2 }}>
            <button onClick={() => router.back()} style={{ width:30, height:30, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.15)', display:'grid', placeItems:'center', color:'#fff' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(255,255,255,0.65)', textTransform:'uppercase' }}>IMPOSTAZIONI</span>
            <div style={{ width:30 }} />
          </div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:22, fontWeight:600, color:'#fff', marginTop:8, textShadow:'0 2px 4px rgba(0,0,0,0.2)', position:'relative', zIndex:2 }}>Promemoria automatici</div>

          {/* Master toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, position:'relative', zIndex:2 }}>
            <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'rgba(255,255,255,0.85)', fontWeight:600, flex:1 }}>Attiva tutti i promemoria</span>
            <Toggle value={s.master_enabled} onChange={() => update('master_enabled', !s.master_enabled)} />
          </div>
        </div>
      </div>

      <div className="page" style={{ padding:'8px 16px' }}>
        {SEZIONI.map(sez => (
          <div key={sez.key} style={{ position:'relative', marginBottom:10 }}>
            <div style={{ position:'absolute', inset:-5, borderRadius:26, background:'var(--surface-2)', filter:'blur(9px)', opacity:0.4, zIndex:-1 }} />
            <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:20, padding:14, boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 8px 20px rgba(60,50,30,0.14),inset 0 4px 8px rgba(255,255,255,0.55)', opacity: s.master_enabled ? 1 : 0.5, transition:'opacity 0.2s' }}>
              {/* Header sezione */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: sez.enabled ? 12 : 0 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:sez.colorBg, display:'grid', placeItems:'center', color:sez.colorDeep, flexShrink:0, boxShadow:'inset 0 2px 3px rgba(255,255,255,0.5),0 2px 5px rgba(60,50,30,0.1)' }}>
                  {sez.icon}
                </div>
                <span style={{ flex:1, fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:800, color:'var(--ink)' }}>{sez.label}</span>
                <Toggle value={sez.enabled && s.master_enabled} onChange={sez.onToggle} disabled={!s.master_enabled} />
              </div>

              {/* Controlli */}
              {sez.enabled && s.master_enabled && sez.controls.map(ctrl => (
                <div key={ctrl.key} style={{ marginBottom:8 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:6 }}>{ctrl.label}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {ctrl.options.map(opt => {
                      const active = ctrl.value === opt
                      return (
                        <button key={opt} onClick={() => update(ctrl.key as keyof ReminderSettings, opt)} style={{ border:'none', cursor:'pointer', borderRadius:999, padding:'6px 14px', fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700, background: active ? `linear-gradient(160deg,${sez.color},${sez.colorDeep})` : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color: active ? '#fff' : 'var(--ink-dim)', boxShadow: active ? '0 3px 8px rgba(0,0,0,0.2)' : 'inset 0 2px 4px rgba(255,255,255,0.5)', transition:'all 0.15s' }}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quiet hours */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <div style={{ position:'absolute', inset:-5, borderRadius:26, background:'var(--surface-2)', filter:'blur(9px)', opacity:0.4, zIndex:-1 }} />
          <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:20, padding:14, boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 8px 20px rgba(60,50,30,0.14),inset 0 4px 8px rgba(255,255,255,0.55)' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>ORE SILENZIOSE</div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-dim)', marginBottom:5 }}>DALLE</div>
                <input type="time" value={s.quiet_hours_start} onChange={e => update('quiet_hours_start', e.target.value)} style={{ width:'100%', border:'none', borderRadius:10, padding:'9px 12px', fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:600, color:'var(--ink)', background:'linear-gradient(160deg,var(--bg-soft),var(--surface-2))', boxShadow:'inset 0 3px 5px rgba(60,50,30,0.1)', outline:'none' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-dim)', marginBottom:5 }}>ALLE</div>
                <input type="time" value={s.quiet_hours_end} onChange={e => update('quiet_hours_end', e.target.value)} style={{ width:'100%', border:'none', borderRadius:10, padding:'9px 12px', fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:600, color:'var(--ink)', background:'linear-gradient(160deg,var(--bg-soft),var(--surface-2))', boxShadow:'inset 0 3px 5px rgba(60,50,30,0.1)', outline:'none' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <button onClick={handleSave} disabled={saving} style={{ width:'100%', border:'none', cursor:'pointer', borderRadius:16, padding:'15px', background: saved ? 'linear-gradient(160deg,var(--success),#1F5A3D)' : 'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, boxShadow:'0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.3s' }}>
          {saved ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Salvato!</>
          ) : saving ? 'Salvataggio…' : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Salva impostazioni</>
          )}
        </button>

        <div className="bottom-spacer" />
      </div>

      <BottomNav active="clienti" />
    </div>
  )
}

// ── TOGGLE COMPONENT ──────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onChange} style={{ width:46, height:26, borderRadius:999, border:'none', cursor: disabled ? 'default' : 'pointer', position:'relative', background: value ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'var(--surface-3)', boxShadow: value ? '0 3px 8px rgba(20,80,90,0.4),inset 0 2px 4px rgba(255,255,255,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s', opacity: disabled ? 0.4 : 1 }}>
      <div style={{ position:'absolute', top:3, left: value ? 23 : 3, width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 2px 5px rgba(0,0,0,0.2)', transition:'left 0.2s' }} />
    </button>
  )
}
