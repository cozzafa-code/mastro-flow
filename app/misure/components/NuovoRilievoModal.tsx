'use client'
import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createRilievo } from '@/lib/misure-queries'
import type { TipoRilievo, TipoMisure } from '@/lib/misure-types'
import { TIPO_MISURE_LABEL, TIPO_MISURE_DESC } from '@/lib/misure-types'

interface Props {
  isOpen: boolean
  onClose: () => void
  commessaId: string
  commessaCodice: string
  commessaCliente: string
}

const TIPI_RILIEVO: { id: TipoRilievo; label: string; desc: string }[] = [
  { id: 'semplice', label: 'Semplice', desc: 'Vani senza gerarchia' },
  { id: 'complesso', label: 'Complesso', desc: 'Organizza per zone/piani' },
]

const TIPI_MISURE: TipoMisure[] = ['provvisorie', 'verificate', 'definitive', 'da_rivedere', 'personalizzato']

export const NuovoRilievoModal: FC<Props> = ({
  isOpen, onClose, commessaId, commessaCodice, commessaCliente
}) => {
  const router = useRouter()
  const [tipoRilievo, setTipoRilievo] = useState<TipoRilievo>('semplice')
  const [tipoMisure, setTipoMisure] = useState<TipoMisure>('provvisorie')
  const [rilevatore, setRilevatore] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCrea = async () => {
    setSaving(true)
    const rilievo = await createRilievo({
      commessa_id: commessaId,
      commessa_codice: commessaCodice,
      commessa_cliente: commessaCliente,
      tipo: tipoRilievo,
      tipo_misure: tipoMisure,
      rilevatore,
      note,
    })
    setSaving(false)
    if (rilievo) {
      onClose()
      router.push(`/misure/${rilievo.id}`)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
               zIndex: 301,
              background: 'var(--bg)', borderRadius: '32px 32px 0 0',
              boxShadow: '0 -16px 50px rgba(0,0,0,0.25)',
              maxHeight: '90dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Handle */}
            <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface-3)' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1.05, textShadow: '0 1px 0 rgba(255,255,255,0.55)' }}>
                    Nuovo rilievo
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Commessa
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--teal-deep)', background: 'var(--teal-bg)', padding: '2px 7px', borderRadius: 6, fontSize: 10, boxShadow: 'inset 0 1px 2px rgba(20,80,90,0.15)' }}>
                      {commessaCodice}
                    </span>
                    · {commessaCliente}
                  </div>
                </div>
                <button onClick={onClose} style={closeKnobStyle}>
                  <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'var(--surface-2)', filter: 'blur(7px)', opacity: 0.55, zIndex: -1 }} />
                  <div style={{ position: 'absolute', top: '14%', left: '24%', width: '34%', height: '20%', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* TIPO RILIEVO */}
                <div>
                  <div style={secLabelStyle}>TIPO RILIEVO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {TIPI_RILIEVO.map(t => {
                      const isActive = tipoRilievo === t.id
                      return (
                        <div key={t.id} style={{ position: 'relative' }}>
                          {isActive && (
                            <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: 'var(--teal)', filter: 'blur(12px)', opacity: 0.45, zIndex: -1 }} />
                          )}
                          <button onClick={() => setTipoRilievo(t.id)} style={{
                            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                            borderRadius: 16, padding: '13px 14px', position: 'relative', overflow: 'hidden',
                            background: isActive ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, var(--surface), var(--surface-2))',
                            boxShadow: isActive
                              ? '0 0 0 1px rgba(0,0,0,0.08), 0 10px 22px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25), inset 0 -3px 5px rgba(0,0,0,0.22)'
                              : '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.16), inset 0 3.5px 6px rgba(255,255,255,0.65)',
                            transition: 'all 0.2s',
                          }}>
                            <div style={{ position: 'absolute', top: '10%', left: '12%', width: '32%', height: '18%', background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(8px)', pointerEvents: 'none' }} />
                            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: isActive ? '#fff' : 'var(--ink)', letterSpacing: -0.2, textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 0 rgba(255,255,255,0.5)', position: 'relative', zIndex: 2 }}>
                              {t.label}
                            </div>
                            <div style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--ink-dim)', marginTop: 5, lineHeight: 1.4, fontWeight: 600, position: 'relative', zIndex: 2, textShadow: isActive ? '0 1px 1px rgba(0,0,0,0.2)' : 'none' }}>
                              {t.desc}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* TIPO MISURE */}
                <div>
                  <div style={secLabelStyle}>TIPO MISURE</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {TIPI_MISURE.map((t, i) => {
                      const isActive = tipoMisure === t
                      const isWide = t === 'personalizzato'
                      return (
                        <div key={t} style={{ position: 'relative', gridColumn: isWide ? 'span 2' : undefined }}>
                          {isActive && (
                            <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: 'var(--ocra)', filter: 'blur(12px)', opacity: 0.5, zIndex: -1 }} />
                          )}
                          <button onClick={() => setTipoMisure(t)} style={{
                            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                            borderRadius: 16, padding: '13px 14px', position: 'relative', overflow: 'hidden',
                            background: isActive ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, var(--surface), var(--surface-2))',
                            boxShadow: isActive
                              ? '0 0 0 1px rgba(0,0,0,0.08), 0 10px 22px rgba(200,138,23,0.55), inset 0 3.5px 6px rgba(255,255,255,0.3), inset 0 -3px 5px rgba(0,0,0,0.18)'
                              : '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.16), inset 0 3.5px 6px rgba(255,255,255,0.65)',
                            transition: 'all 0.2s',
                          }}>
                            <div style={{ position: 'absolute', top: '10%', left: '12%', width: '32%', height: '18%', background: isActive ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(8px)', pointerEvents: 'none' }} />
                            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: isActive ? '#fff' : 'var(--ink)', letterSpacing: -0.2, textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 0 rgba(255,255,255,0.5)', position: 'relative', zIndex: 2 }}>
                              {TIPO_MISURE_LABEL[t]}
                            </div>
                            <div style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.92)' : 'var(--ink-dim)', marginTop: 5, lineHeight: 1.4, fontWeight: 600, position: 'relative', zIndex: 2 }}>
                              {TIPO_MISURE_DESC[t]}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* RILEVATORE */}
                <div>
                  <div style={secLabelStyle}>CHI HA FATTO IL RILIEVO</div>
                  <input
                    style={inputStyle}
                    placeholder="Nome rilevatore"
                    value={rilevatore}
                    onChange={e => setRilevatore(e.target.value)}
                  />
                </div>

                {/* NOTE */}
                <div>
                  <div style={secLabelStyle}>NOTE (OPZIONALE)</div>
                  <textarea
                    style={{ ...inputStyle, resize: 'none', minHeight: 80 } as React.CSSProperties}
                    placeholder="Es. Seconda visita dopo modifiche"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>

                {/* ACTIONS */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={onClose} style={btnAnnullaStyle}>Annulla</button>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -6, borderRadius: 22, background: 'var(--teal)', filter: 'blur(13px)', opacity: 0.5, zIndex: -1 }} />
                    <button
                      onClick={handleCrea}
                      disabled={saving}
                      style={btnCreaStyle}
                    >
                      {saving ? 'Creazione…' : 'Crea rilievo · Aggiungi vani'}
                      {!saving && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── STYLES ───────────────────────────────────────────────────────
const secLabelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800,
  color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase',
  marginBottom: 9, paddingLeft: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  border: 'none', borderRadius: 14, padding: '14px 15px',
  fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
  color: 'var(--ink)', outline: 'none',
  boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13), inset 0 -1px 2px rgba(255,255,255,0.45)',
}

const closeKnobStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: '50%',
  background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
  color: 'var(--ink-2)', position: 'relative', flexShrink: 0,
  boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.2), inset 0 3.5px 6px rgba(255,255,255,0.7), inset 0 -2.5px 5px rgba(0,0,0,0.07)',
}

const btnAnnullaStyle: React.CSSProperties = {
  flex: 1, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '15px 14px',
  fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
  color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  textShadow: '0 1px 0 rgba(255,255,255,0.45)', position: 'relative',
  boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3.5px 6px rgba(255,255,255,0.7)',
}

const btnCreaStyle: React.CSSProperties = {
  width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '15px 14px',
  fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
  color: '#fff', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, position: 'relative',
  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 10px 20px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25), inset 0 -3px 5px rgba(0,0,0,0.22)',
}
