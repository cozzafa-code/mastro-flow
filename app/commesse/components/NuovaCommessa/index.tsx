'use client'
import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreata?: () => void
}

const inp: React.CSSProperties = {
  width: '100%', border: 'none', borderRadius: 12, padding: '13px 14px',
  fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600,
  color: 'var(--ink)', outline: 'none',
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1)',
}

export const NuovaCommessa: FC<Props> = ({ isOpen, onClose, onCreata }) => {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => { setNome(''); setCognome(''); setTelefono(''); setEmail(''); setIndirizzo(''); setError('') }

  const handleCrea = async () => {
    if (!nome.trim()) { setError('Inserisci il nome'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/commesse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codice: `S-${Date.now().toString().slice(-5)}`,
          cliente_nome: `${nome.trim()} ${cognome.trim()}`.trim(),
          telefono: telefono || null,
          email: email || null,
          indirizzo: indirizzo || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Errore')
      reset()
      onCreata?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false) }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: 430, zIndex: 301, background: 'var(--bg)', borderRadius: '32px 32px 0 0', maxHeight: '90svh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 -16px 50px rgba(0,0,0,0.3)', touchAction: 'pan-y' }}>

            {/* Handle */}
            <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(60,50,30,0.18)' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Header teal */}
              <div style={{ padding: '12px 14px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '12px 14px 0', borderRadius: 24, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.4, zIndex: -1 }} />
                <div style={{ background: 'linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 55%, var(--teal-darker) 100%)', borderRadius: 22, padding: '13px 14px 14px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)' }}>
                  <div style={{ position: 'absolute', top: '8%', left: '12%', width: '32%', height: '22%', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(12px)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase' }}>NUOVA COMMESSA</span>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600, color: '#fff', position: 'relative', zIndex: 2 }}>Nuova commessa</div>
                </div>
              </div>

              <div style={{ padding: '20px 18px 50px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Nome + Cognome */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <L>NOME *</L>
                    <input style={inp} placeholder="Mario" value={nome} onChange={e => setNome(e.target.value)} autoComplete="off" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <L>COGNOME</L>
                    <input style={inp} placeholder="Rossi" value={cognome} onChange={e => setCognome(e.target.value)} autoComplete="off" />
                  </div>
                </div>

                {/* Telefono + Email */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <L>TELEFONO</L>
                    <input style={inp} placeholder="3401234567" value={telefono} onChange={e => setTelefono(e.target.value)} inputMode="tel" autoComplete="off" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <L>EMAIL</L>
                    <input style={inp} placeholder="mario@email.it" value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoComplete="off" />
                  </div>
                </div>

                {/* Indirizzo */}
                <div>
                  <L>INDIRIZZO</L>
                  <input style={inp} placeholder="Via Roma, 1 — Cosenza" value={indirizzo} onChange={e => setIndirizzo(e.target.value)} autoComplete="off" />
                </div>

                {/* Errore */}
                {error && (
                  <div style={{ background: 'var(--red-bg)', borderRadius: 10, padding: '10px 14px', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--red-deep)' }}>
                    ⚠ {error}
                  </div>
                )}

                {/* CTA */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={onClose} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 14, padding: '14px', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3px 6px rgba(255,255,255,0.7)' }}>
                    Annulla
                  </button>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -5, borderRadius: 20, background: 'var(--teal)', filter: 'blur(12px)', opacity: nome ? 0.5 : 0.2, zIndex: -1 }} />
                    <button
                      onClick={handleCrea}
                      disabled={!nome.trim() || saving}
                      style={{ width: '100%', border: 'none', cursor: nome.trim() ? 'pointer' : 'not-allowed', borderRadius: 16, padding: '14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, opacity: nome.trim() ? 1 : 0.5, boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 10px 20px rgba(20,80,90,0.5), inset 0 3px 6px rgba(255,255,255,0.22)', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {saving ? 'Creazione…' : 'Crea commessa'}
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

const L: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>{children}</div>
)
