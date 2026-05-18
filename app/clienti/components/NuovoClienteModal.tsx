'use client'
import { FC, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createCliente } from '@/lib/clienti-queries'
import { useFlashAdvance } from '@/app/commesse/components/NuovaCommessa/useFlashAdvance'
import type { ClienteTipo, CanalePref } from '@/lib/clienti-types'

interface Props { isOpen: boolean; onClose: () => void; onCreato?: () => void }

const IcoUser = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.4" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoCamera = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
const IcoPersona = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoAzienda = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
const IcoWA = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const IcoCall = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.81 1.19 2 2 0 012.81 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
const IcoSMS = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
const IcoMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IcoBirthday = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1"/><path d="M12 3v2M9.17 4.83L8 6M14.83 4.83L16 6"/></svg>
const IcoNote = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.4" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>

const CANALI: { id: CanalePref; label: string; Icon: FC }[] = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: IcoWA },
  { id: 'call', label: 'Chiamata', Icon: IcoCall },
  { id: 'sms', label: 'SMS', Icon: IcoSMS },
  { id: 'email', label: 'Email', Icon: IcoMail },
]

export const NuovoClienteModal: FC<Props> = ({ isOpen, onClose, onCreato }) => {
  const { flash } = useFlashAdvance()
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => setMounted(true), [])

  const canSave = nome.trim().length > 0

  const reset = () => { setNome(''); setTelefono(''); setEmail(''); setCitta(''); setDataNascita(''); setNota(''); setFotoUrl(''); setTipo('privato'); setCanale('whatsapp') }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await createCliente({ tipo, nome, telefono_principale: telefono||undefined, email_principale: email||undefined, citta_principale: citta||undefined, data_nascita: dataNascita||undefined, canale_preferito: canale, nota_breve: nota||undefined, foto_url: fotoUrl||undefined })
      reset()
      onCreato ? onCreato() : onClose()
    } catch (e) { alert('Errore: ' + (e as Error).message) }
    finally { setSaving(false) }
  }

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
            style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} />

          <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:30, stiffness:300 }}
            style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, zIndex:401, background:'var(--bg)', borderRadius:'28px 28px 0 0', boxShadow:'0 -20px 60px rgba(0,0,0,0.3)', maxHeight:'92svh', display:'flex', flexDirection:'column' }}>

            <div style={{ flexShrink:0, padding:'10px 0 0', display:'flex', justifyContent:'center' }}>
              <div style={{ width:36, height:4, borderRadius:2, background:'var(--surface-3)' }} />
            </div>

            <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'8px 16px 48px' }}>

              {/* Header */}
              <div style={{ position:'relative', marginBottom:14 }}>
                <div style={{ position:'absolute', inset:-8, borderRadius:32, background:'var(--teal)', filter:'blur(14px)', opacity:0.4, zIndex:-1 }} />
                <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', borderRadius:22, padding:'16px 18px', position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(0,0,0,0.08),0 14px 32px rgba(20,80,90,0.45),inset 0 6px 14px rgba(255,255,255,0.12),inset 0 -6px 12px rgba(0,0,0,0.22)' }}>
                  <div style={{ position:'absolute', top:'12%', left:'14%', width:'28%', height:'16%', background:'rgba(255,255,255,0.18)', borderRadius:'50%', filter:'blur(12px)' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, position:'relative', zIndex:2 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2.5, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', fontWeight:600 }}>NUOVO CLIENTE</span>
                    <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'none', cursor:'pointer', background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', display:'grid', placeItems:'center', color:'var(--teal-deep)', boxShadow:'0 3px 8px rgba(0,0,0,0.2),inset 0 2px 4px rgba(255,255,255,0.6)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:26, fontWeight:600, letterSpacing:-0.5, color:'#fff', lineHeight:1.05, textShadow:'0 2px 4px rgba(0,0,0,0.25)', position:'relative', zIndex:2 }}>Nuovo cliente</div>
                  <div style={{ marginTop:6, position:'relative', zIndex:2 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, letterSpacing:1.2, padding:'3px 8px', borderRadius:999, background:'rgba(0,0,0,0.25)', color:'#fff' }}>⚡ FLASH</span>
                  </div>
                </div>
              </div>

              {/* Tipo */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {([{ t:'privato' as ClienteTipo, label:'Privato', Icon:IcoPersona },{ t:'azienda' as ClienteTipo, label:'Azienda', Icon:IcoAzienda }]).map(({ t, label, Icon }) => {
                  const active = tipo === t
                  return (
                    <button key={t} onClick={() => { setTipo(t); flash('section-nome') }} style={{ border:'none', cursor:'pointer', borderRadius:14, padding:'13px 8px', fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:7, position:'relative', background: active ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color: active ? '#fff' : 'var(--ink-dim)', boxShadow: active ? '0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)' : 'inset 0 3px 6px rgba(255,255,255,0.6),0 4px 10px rgba(60,50,30,0.15)', transition:'all 0.2s' }}>
                      <div style={{ position:'absolute', top:'14%', left:'22%', width:'32%', height:'18%', background:'rgba(255,255,255,0.45)', borderRadius:'50%', filter:'blur(2.5px)', pointerEvents:'none' }} />
                      <span style={{ position:'relative', zIndex:1 }}><Icon /></span>
                      <span style={{ position:'relative', zIndex:1 }}>{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Dati principali */}
              <FormCard>
                <SectionLabel icon={<IcoUser />} label="DATI PRINCIPALI" required />
                <div id="section-nome"><input style={inp} placeholder={tipo==='privato' ? 'Nome e Cognome *' : 'Ragione Sociale *'} value={nome} onChange={e => setNome(e.target.value)} /></div>
                <button onClick={() => fileRef.current?.click()} style={{ width:'100%', border:'1.5px dashed rgba(31,111,120,0.35)', borderRadius:12, padding:'11px 14px', marginBottom:8, cursor:'pointer', background:'linear-gradient(160deg,rgba(220,236,237,0.4),rgba(197,221,222,0.4))', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Nunito',sans-serif", color:'var(--teal-deep)', fontSize:12, fontWeight:700 }}>
                  <IcoCamera />{fotoUrl ? 'Foto aggiunta' : 'Aggiungi foto profilo (opzionale)'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) setFotoUrl(URL.createObjectURL(f)) }} />
                <input style={inp} placeholder="Telefono" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} />
                <input style={inp} placeholder="Email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} />
                <input style={{ ...inp, marginBottom:0 }} placeholder="Città" value={citta} onChange={e => setCitta(e.target.value)} />
              </FormCard>

              {/* Compleanno */}
              {tipo === 'privato' && (
                <FormCard>
                  <SectionLabel icon={<IcoBirthday />} label="COMPLEANNO" />
                  <div id="section-nascita">
                    <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:'var(--ink-dim)', marginBottom:8, fontStyle:'italic' }}>Inserisci la data di nascita per promemoria automatici</p>
                    <input style={{ ...inp, marginBottom:0 }} type="date" value={dataNascita} onChange={e => { setDataNascita(e.target.value); if(e.target.value) flash('section-canale') }} />
                  </div>
                </FormCard>
              )}

              {/* Canale */}
              <FormCard>
                <SectionLabel icon={<IcoWA />} label="CANALE PREFERITO" />
                <div id="section-canale" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {CANALI.map(({ id, label, Icon }) => {
                    const active = canale === id
                    return (
                      <button key={id} onClick={() => { setCanale(id); flash('section-note') }} style={{ border:'none', cursor:'pointer', borderRadius:12, padding:'10px 10px', display:'flex', alignItems:'center', gap:8, position:'relative', background: active ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color: active ? '#fff' : 'var(--ink-dim)', fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700, boxShadow: active ? '0 4px 10px rgba(20,80,90,0.4),inset 0 2px 4px rgba(255,255,255,0.2)' : 'inset 0 2px 4px rgba(255,255,255,0.5),0 2px 4px rgba(60,50,30,0.1)', transition:'all 0.18s' }}>
                        <div style={{ position:'absolute', top:'14%', left:'16%', width:'28%', height:'22%', background:'rgba(255,255,255,0.4)', borderRadius:'50%', filter:'blur(2px)', pointerEvents:'none' }} />
                        <span style={{ position:'relative', zIndex:1 }}><Icon /></span>
                        <span style={{ position:'relative', zIndex:1 }}>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </FormCard>

              {/* Note */}
              <FormCard>
                <SectionLabel icon={<IcoNote />} label="NOTE RAPIDE" />
                <div id="section-note">
                  <textarea style={{ ...inp, resize:'none', minHeight:70, marginBottom:0 } as React.CSSProperties} placeholder="Nota breve sul cliente…" value={nota} onChange={e => setNota(e.target.value)} />
                </div>
              </FormCard>

              {/* CTA */}
              <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                {!canSave && <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-dim)', textAlign:'center', fontStyle:'italic' }}>Inserisci il nome per continuare</p>}
                <button onClick={handleSave} disabled={!canSave||saving} style={{ width:'100%', border:'none', cursor:canSave?'pointer':'not-allowed', borderRadius:16, padding:'15px 16px', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, textShadow:'0 1px 2px rgba(0,0,0,0.25)', boxShadow:'0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)', opacity:canSave?1:0.5 }}>
                  <IcoPersona />{saving ? 'Salvataggio…' : 'Crea cliente'}
                </button>
                <button onClick={onClose} style={{ width:'100%', border:'none', cursor:'pointer', borderRadius:14, padding:'13px', background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color:'var(--ink-2)', fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, boxShadow:'0 4px 10px rgba(60,50,30,0.15),inset 0 3px 6px rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>Annulla
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return mounted ? createPortal(modal, document.body) : null
}

const FormCard: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position:'relative', marginBottom:10 }}>
    <div style={{ position:'absolute', inset:-5, borderRadius:26, background:'var(--surface-2)', filter:'blur(9px)', opacity:0.45, zIndex:-1 }} />
    <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:20, padding:14, position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 8px 20px rgba(60,50,30,0.14),inset 0 4px 8px rgba(255,255,255,0.55)' }}>
      <div style={{ position:'absolute', top:'6%', left:'10%', width:'26%', height:'14%', background:'rgba(255,255,255,0.5)', borderRadius:'50%', filter:'blur(10px)', pointerEvents:'none' }} />
      {children}
    </div>
  </div>
)

const SectionLabel: FC<{ icon: React.ReactNode; label: string; required?: boolean }> = ({ icon, label, required }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10, position:'relative', zIndex:2 }}>
    {icon} {label} {required && <span style={{ color:'var(--red)' }}>*</span>}
  </div>
)

const inp: React.CSSProperties = {
  width:'100%', background:'linear-gradient(160deg,var(--bg-soft),var(--surface-2))', border:'none', borderRadius:12, padding:'11px 13px', fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:600, color:'var(--ink)', outline:'none', marginBottom:8,
  boxShadow:'inset 0 3px 5px rgba(60,50,30,0.1),inset 0 -1px 2px rgba(255,255,255,0.4)',
}
