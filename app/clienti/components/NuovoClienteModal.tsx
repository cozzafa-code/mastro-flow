'use client'
import { FC, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createCliente } from '@/lib/clienti-queries'
import { useFlashAdvance } from '@/app/commesse/components/NuovaCommessa/useFlashAdvance'
import type { ClienteTipo, CanalePref } from '@/lib/clienti-types'

interface Props { isOpen: boolean; onClose: () => void; onCreato?: () => void }

export const NuovoClienteModal: FC<Props> = ({ isOpen, onClose, onCreato }) => {
  const { flash } = useFlashAdvance()
  const [saving, setSaving] = useState(false)
  const [tipo, setTipo] = useState<ClienteTipo>('privato')
  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [citta, setCitta] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [canale, setCanale] = useState<CanalePref>('whatsapp')
  const [nota, setNota] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const canSave = nome.trim().length > 0

  const reset = () => { setNome(''); setTelefono(''); setEmail(''); setCitta(''); setDataNascita(''); setNota(''); setFotoUrl('') }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await createCliente({ tipo, nome, telefono_principale: telefono || undefined, email_principale: email || undefined, citta_principale: citta || undefined, data_nascita: dataNascita || undefined, canale_preferito: canale, nota_breve: nota || undefined, foto_url: fotoUrl || undefined })
      reset()
      onCreato ? onCreato() : onClose()
    } catch (e) {
      alert('Errore: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const CANALI: { id: CanalePref; label: string; icon: string }[] = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'call', label: 'Chiamata', icon: '📞' },
    { id: 'sms', label: 'SMS', icon: '✉️' },
    { id: 'email', label: 'Email', icon: '📧' },
  ]

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(3px)' }} />

          <motion.div
            initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:30, stiffness:300 }}
            style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'min(100vw, 430px)', maxWidth:430, zIndex:301, background:'var(--bg)', borderRadius:'32px 32px 0 0', boxShadow:'0 -16px 50px rgba(0,0,0,0.25)', maxHeight:'92dvh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Handle */}
            <div style={{ padding:'10px 0 0', display:'flex', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:40, height:4, borderRadius:2, background:'var(--surface-3)' }} />
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 40px' }}>

              {/* Header teal fluffy */}
              <div style={{ position:'relative', marginBottom:14 }}>
                <div style={{ position:'absolute', inset:-8, borderRadius:32, background:'var(--teal)', filter:'blur(14px)', opacity:0.45, zIndex:-1 }} />
                <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', borderRadius:24, padding:'16px 18px', color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(0,0,0,0.08),0 14px 32px rgba(20,80,90,0.45),inset 0 6px 14px rgba(255,255,255,0.12),inset 0 -6px 12px rgba(0,0,0,0.22)' }}>
                  <div style={{ position:'absolute', top:'12%', left:'14%', width:'28%', height:'16%', background:'rgba(255,255,255,0.18)', borderRadius:'50%', filter:'blur(12px)' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, zIndex:2, position:'relative' }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2.5, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', fontWeight:600 }}>NUOVO CLIENTE</span>
                    <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer', background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', display:'grid', placeItems:'center', color:'var(--teal-deep)', boxShadow:'0 3px 8px rgba(0,0,0,0.2),inset 0 2px 4px rgba(255,255,255,0.6)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:26, fontWeight:600, letterSpacing:-0.5, color:'#fff', lineHeight:1.05, textShadow:'0 2px 4px rgba(0,0,0,0.25)', zIndex:2, position:'relative' }}>Nuovo cliente</div>
                  <div style={{ display:'flex', gap:6, marginTop:6, zIndex:2, position:'relative' }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.2, padding:'3px 8px', borderRadius:999, background:'rgba(0,0,0,0.25)', color:'#fff' }}>⚡ FLASH</span>
                  </div>
                </div>
              </div>

              {/* Tipo Privato/Azienda */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {(['privato','azienda'] as ClienteTipo[]).map(t => (
                  <button key={t} onClick={() => { setTipo(t); flash('section-nome') }} style={{
                    border:'none', cursor:'pointer', borderRadius:16, padding:'13px 6px',
                    fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700,
                    background: tipo===t ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
                    color: tipo===t ? '#fff' : 'var(--ink-dim)',
                    boxShadow: tipo===t ? '0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)' : 'inset 0 3px 6px rgba(255,255,255,0.6),0 4px 10px rgba(60,50,30,0.15)',
                    transition:'all 0.2s', position:'relative',
                  }}>
                    <div style={{ position:'absolute', top:'14%', left:'22%', width:'32%', height:'18%', background:'rgba(255,255,255,0.5)', borderRadius:'50%', filter:'blur(2.5px)', pointerEvents:'none' }} />
                    {t === 'privato' ? 'Privato' : 'Azienda'}
                  </button>
                ))}
              </div>

              {/* Dati principali */}
              <FormCard>
                <SectionLabel label="DATI PRINCIPALI" required />
                <div id="section-nome">
                  <input id="input-nome" style={inp} placeholder={tipo==='privato' ? 'Nome e Cognome *' : 'Ragione Sociale *'} value={nome} onChange={e => { setNome(e.target.value); if(e.target.value.length===2) flash('input-telefono') }} />
                </div>

                {/* Foto profilo */}
                <button onClick={() => fileRef.current?.click()} style={{ width:'100%', border:'1.5px dashed rgba(31,111,120,0.4)', borderRadius:12, padding:'11px 14px', marginBottom:8, cursor:'pointer', background:'linear-gradient(160deg,rgba(220,236,237,0.4),rgba(197,221,222,0.4))', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Nunito',sans-serif", color:'var(--teal-deep)', fontSize:12, fontWeight:700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  {fotoUrl ? '✓ Foto aggiunta' : 'Aggiungi foto profilo (opzionale)'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if(f) setFotoUrl(URL.createObjectURL(f)) }} />

                <input id="input-telefono" style={inp} placeholder="Telefono" inputMode="tel" value={telefono} onChange={e => { setTelefono(e.target.value); if(e.target.value.length===10) flash('input-email') }} />
                <input id="input-email" style={inp} placeholder="Email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={inp} placeholder="Città" value={citta} onChange={e => { setCitta(e.target.value); if(e.target.value.length>=3) flash('section-nascita') }} />
              </FormCard>

              {/* Data nascita (solo privato) */}
              {tipo === 'privato' && (
                <FormCard>
                  <SectionLabel label="COMPLEANNO" />
                  <div id="section-nascita">
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-soft)', letterSpacing:0.5, marginBottom:6 }}>
                      Inserisci la data di nascita — genererò un promemoria automatico
                    </div>
                    <input style={inp} type="date" value={dataNascita} onChange={e => { setDataNascita(e.target.value); if(e.target.value) flash('section-canale') }} />
                  </div>
                </FormCard>
              )}

              {/* Canale preferito */}
              <FormCard>
                <SectionLabel label="CANALE PREFERITO" />
                <div id="section-canale" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                  {CANALI.map(c => (
                    <button key={c.id} onClick={() => { setCanale(c.id); flash('section-note') }} style={{
                      border:'none', cursor:'pointer', borderRadius:12, padding:'10px 8px',
                      display:'flex', alignItems:'center', gap:8,
                      background: canale===c.id ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
                      color: canale===c.id ? '#fff' : 'var(--ink-dim)',
                      fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700,
                      boxShadow: canale===c.id ? '0 4px 10px rgba(20,80,90,0.4),inset 0 2px 4px rgba(255,255,255,0.2)' : 'inset 0 2px 4px rgba(255,255,255,0.5),0 2px 4px rgba(60,50,30,0.1)',
                      transition:'all 0.18s',
                    }}>
                      <span style={{ fontSize:16 }}>{c.icon}</span>{c.label}
                    </button>
                  ))}
                </div>
              </FormCard>

              {/* Note */}
              <FormCard>
                <SectionLabel label="NOTE RAPIDE" />
                <div id="section-note">
                  <textarea style={{ ...inp, resize:'none', minHeight:70 } as React.CSSProperties} placeholder="Nota breve sul cliente…" value={nota} onChange={e => setNota(e.target.value)} />
                </div>
              </FormCard>

              {/* CTA */}
              <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                {!canSave && <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-dim)', textAlign:'center', fontStyle:'italic' }}>Inserisci il nome per continuare</p>}
                <button onClick={handleSave} disabled={!canSave || saving} style={{ width:'100%', border:'none', cursor: canSave ? 'pointer' : 'not-allowed', borderRadius:16, padding:'15px 16px', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, textShadow:'0 1px 2px rgba(0,0,0,0.25)', boxShadow:'0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)', opacity: canSave ? 1 : 0.5 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {saving ? 'Salvataggio…' : 'Crea cliente'}
                </button>
                <button onClick={onClose} style={{ width:'100%', border:'none', cursor:'pointer', borderRadius:14, padding:'13px', background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color:'var(--ink-2)', fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, boxShadow:'0 4px 10px rgba(60,50,30,0.15),inset 0 3px 6px rgba(255,255,255,0.6)' }}>
                  Annulla
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return mounted ? createPortal(modalContent, document.body) : null
}

const CANALI = [
  { id: 'whatsapp' as const, label: 'WhatsApp', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { id: 'call' as const, label: 'Chiamata', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> },
  { id: 'sms' as const, label: 'SMS', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg> },
  { id: 'email' as const, label: 'Email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
]

const FormCard: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position:'relative', marginBottom:12 }}>
    <div style={{ position:'absolute', inset:-6, borderRadius:28, background:'var(--surface-2)', filter:'blur(10px)', opacity:0.45, zIndex:-1 }} />
    <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:22, padding:14, position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 10px 22px rgba(60,50,30,0.16),inset 0 4px 8px rgba(255,255,255,0.55)' }}>
      <div style={{ position:'absolute', top:'6%', left:'10%', width:'28%', height:'14%', background:'rgba(255,255,255,0.5)', borderRadius:'50%', filter:'blur(10px)', pointerEvents:'none' }} />
      {children}
    </div>
  </div>
)

const SectionLabel: FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10, zIndex:2, position:'relative' }}>
    {label} {required && <span style={{ color:'var(--red)' }}>*</span>}
  </div>
)

const inp: React.CSSProperties = {
  width:'100%', background:'linear-gradient(160deg,var(--bg-soft),var(--surface-2))', border:'none', borderRadius:12, padding:'11px 13px',
  fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:600, color:'var(--ink)', outline:'none', marginBottom:8,
  boxShadow:'inset 0 3px 5px rgba(60,50,30,0.1),inset 0 -1px 2px rgba(255,255,255,0.4)',
}

import { FC } from 'react'
