'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getVano, saveMisure, saveVanoNote, uploadFotoVano, getFotoVano } from '@/lib/misure-queries'
import type { Vano, MisureVano, SubTab, Settore } from '@/lib/misure-types'
import { SETTORI, isMisureComplete } from '@/lib/misure-types'

interface Props {
  vanoId: string
  rilievoId: string
  onBack: () => void
}

// ── VOICE INPUT HOOK ─────────────────────────────────────────────
function useVoiceInput(onResult: (value: string) => void) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  const startListen = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) return
    const rec = new SpeechRec()
    rec.lang = 'it-IT'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const raw = e.results[0][0].transcript.replace(/[^0-9.,]/g, '').replace(',', '.')
      if (raw) onResult(raw)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [onResult])

  const stopListen = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, startListen, stopListen }
}

// ── SETTORE ICON COLOR ───────────────────────────────────────────
const SETTORE_COLORS: Record<string, { bg: string; color: string }> = {
  teal: { bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)' },
  blue: { bg: 'linear-gradient(160deg, var(--blue-bg), #C5CCE5)', color: 'var(--blue-deep)' },
  violet: { bg: 'linear-gradient(160deg, #E8DFF4, #D5C5E5)', color: '#6B4F9C' },
  ocra: { bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)' },
  success: { bg: 'linear-gradient(160deg, var(--success-bg), var(--success-mid))', color: 'var(--success)' },
  gray: { bg: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: 'var(--ink-2)' },
}

// ── COMPONENTE PRINCIPALE ────────────────────────────────────────
export const VanoDetailPanel: FC<Props> = ({ vanoId, rilievoId, onBack }) => {
  const router = useRouter()
  const [vano, setVano] = useState<Vano | null>(null)
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState<SubTab>('misure')
  const [misure, setMisure] = useState<MisureVano | null>(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [activeField, setActiveField] = useState<keyof MisureVano | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Voice input
  const { listening, startListen, stopListen } = useVoiceInput(useCallback((val: string) => {
    if (!activeField || !misure) return
    setMisure(m => m ? { ...m, [activeField]: val } : m)
    setActiveField(null)
  }, [activeField, misure]))

  // Carica vano
  useEffect(() => {
    getVano(vanoId).then(v => {
      if (v) {
        setVano(v)
        setMisure(v.misure)
        setNote(v.note)
      }
      setLoading(false)
    })
    getFotoVano(vanoId).then(setFotos)
  }, [vanoId])

  // Auto-save misure con debounce
  useEffect(() => {
    if (!misure || !vanoId) return
    const t = setTimeout(() => saveMisure(vanoId, misure), 800)
    return () => clearTimeout(t)
  }, [misure, vanoId])

  const handleMisuraChange = (field: keyof MisureVano, val: string) => {
    setMisure(m => m ? { ...m, [field]: val } : m)
  }

  const handleVoiceForField = (field: keyof MisureVano) => {
    setActiveField(field)
    startListen()
  }

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFotoVano(vanoId, file)
    if (url) setFotos(p => [...p, url])
  }

  const handleSaveNote = async () => {
    await saveVanoNote(vanoId, note)
  }

  const settore = SETTORI.find(s => s.id === vano?.settore)
  const colori = SETTORE_COLORS[settore?.color || 'teal']
  const misureComplete = misure ? isMisureComplete(misure) : false

  if (loading) return (
    <div className="phone-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!vano || !misure) return null

  return (
    <div className="phone-screen">
      {/* TOPBAR TEAL FLUFFY */}
      <div style={{ padding: '12px 14px 0', position: 'relative', zIndex: 5, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: '12px 14px 0', borderRadius: 28, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.45, zIndex: -1 }} />
        <div style={{
          background: 'linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 60%, var(--teal-darker) 100%)',
          borderRadius: 24, padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 10,
          color: '#fff', position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)',
        }}>
          <div style={{ position: 'absolute', top: '8%', left: '10%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', filter: 'blur(12px)' }} />

          {/* Back knob */}
          <button onClick={onBack} style={{
            width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))',
            display: 'grid', placeItems: 'center', color: '#fff', position: 'relative', zIndex: 2, flexShrink: 0,
            boxShadow: 'inset 0 2.5px 4px rgba(255,255,255,0.28), inset 0 -2px 3px rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.3)',
          }}>
            <div style={{ position: 'absolute', top: '16%', left: '22%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
              VANO {vano.numero}
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: -0.4, lineHeight: 1, marginTop: 2, textShadow: '0 1.5px 3px rgba(0,0,0,0.3)' }}>
              {vano.nome || `${settore?.label} ${vano.numero}`}
            </div>
          </div>

          {/* Stato pill */}
          <span style={{
            fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700,
            padding: '7px 13px', borderRadius: 999, color: '#fff',
            background: misureComplete ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))',
            boxShadow: misureComplete ? '0 4px 9px rgba(47,125,87,0.5)' : '0 4px 9px rgba(200,138,23,0.5)',
            letterSpacing: 0.2, position: 'relative', zIndex: 2, flexShrink: 0,
            textShadow: '0 1px 1px rgba(0,0,0,0.25)',
          }}>
            {misureComplete ? 'Completo' : 'Provv.'}
          </span>

          {/* Avatar settore */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
            display: 'grid', placeItems: 'center',
            color: 'var(--teal-deep)', fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700, fontSize: 14, position: 'relative', zIndex: 2,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 4px 9px rgba(0,0,0,0.3), inset 0 2.5px 4px rgba(255,255,255,0.75)',
            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}>
            <div style={{ position: 'absolute', top: '14%', left: '24%', width: '34%', height: '20%', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              {vano.nome?.slice(0, 2).toUpperCase() || settore?.label.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Contenuto scrollabile */}
      <div className="page">
        <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* BOTTONE DETTATURA VOCALE */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -6, borderRadius: 24, background: listening ? 'var(--red)' : 'var(--teal)', filter: 'blur(13px)', opacity: 0.5, zIndex: -1 }} />
            <button
              onClick={listening ? stopListen : () => { setActiveField('larghezza_cx'); startListen() }}
              style={{
                width: '100%', border: 'none', cursor: 'pointer', borderRadius: 18, padding: '16px 14px',
                background: listening ? 'linear-gradient(160deg, var(--red), var(--red-deep))' : 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700,
                textShadow: '0 1px 2px rgba(0,0,0,0.25)', position: 'relative', overflow: 'hidden',
                boxShadow: listening
                  ? '0 0 0 1px rgba(0,0,0,0.06), 0 10px 22px rgba(200,73,65,0.5), inset 0 4px 7px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.22)'
                  : '0 0 0 1px rgba(0,0,0,0.06), 0 10px 22px rgba(20,80,90,0.5), inset 0 4px 7px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.22)',
              }}
            >
              <div style={{ position: 'absolute', top: '14%', left: '22%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', filter: 'blur(5px)', pointerEvents: 'none' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
                {listening
                  ? <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>
                  : <><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>
                }
              </svg>
              <span style={{ position: 'relative', zIndex: 1 }}>
                {listening ? `Ascolto… ${activeField ? `(${activeField})` : ''}` : 'Dettatura misure vocale'}
              </span>
              {listening && <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block', position: 'relative', zIndex: 1 }} />}
            </button>
          </div>

          {/* SUB-TAB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '6px 2px 4px' }}>
            {(['misure', 'dettagli', 'riepilogo'] as SubTab[]).map((t, i) => {
              const isCurrent = subTab === t
              const isDone = (t === 'misure' && misureComplete) || (t === 'dettagli' && note.length > 0)
              return (
                <button key={t} onClick={() => setSubTab(t)} style={{
                  border: 'none', cursor: 'pointer', background: 'transparent',
                  padding: '11px 6px 14px', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  position: 'relative',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 800,
                    background: isDone ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : isCurrent ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
                    color: isDone || isCurrent ? '#fff' : 'var(--ink-soft)',
                    boxShadow: isDone ? '0 3px 7px rgba(47,125,87,0.4)' : isCurrent ? '0 4px 9px rgba(20,80,90,0.45)' : 'inset 0 1.5px 3px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.06)',
                    textShadow: isDone || isCurrent ? '0 1px 1px rgba(0,0,0,0.25)' : 'none',
                  }}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : i + 1}
                  </div>
                  <span style={{
                    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700,
                    color: isDone ? 'var(--success)' : isCurrent ? 'var(--ink)' : 'var(--ink-soft)',
                    letterSpacing: 0.3,
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                  {isCurrent && (
                    <div style={{ position: 'absolute', bottom: 0, left: '18%', right: '18%', height: 3, background: 'linear-gradient(90deg, var(--teal), var(--teal-deep))', borderRadius: 999, boxShadow: '0 0 8px rgba(20,80,90,0.5)' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── TAB: MISURE ── */}
          <AnimatePresence mode="wait">
            {subTab === 'misure' && (
              <motion.div key="misure" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Card info vano */}
                <SecCard
                  title={vano.nome || `${settore?.label} ${vano.numero}`}
                  subtitle={`Piano ${vano.piano || '—'} · ${settore?.label}`}
                  pill="Provv."
                  colori={colori}
                />

                {/* Schizzo tecnico placeholder */}
                <button style={{
                  width: '100%', border: 'none', cursor: 'pointer', borderRadius: 15, padding: '11px 14px',
                  background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
                  display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden',
                  boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.6)',
                }}>
                  <div style={{ position: 'absolute', top: '10%', left: '8%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(7px)' }} />
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(160deg, #E8DFF4, #D5C5E5)', color: '#6B4F9C', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.07)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
                  </div>
                  <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>Schizzo tecnico</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 2, fontWeight: 600 }}>Tocca per aprire il CAD</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}><path d="M9 18l6-6-6-6"/></svg>
                </button>

                {/* LARGHEZZE */}
                <MisureBlock
                  label="LARGHEZZA" color="blue"
                  fields={[
                    { key: 'larghezza_sx', label: 'SX', value: misure.larghezza_sx },
                    { key: 'larghezza_cx', label: 'CX ★', value: misure.larghezza_cx },
                    { key: 'larghezza_dx', label: 'DX', value: misure.larghezza_dx },
                  ]}
                  onChange={handleMisuraChange}
                  onVoice={handleVoiceForField}
                  activeField={activeField}
                />

                {/* ALTEZZE */}
                <MisureBlock
                  label="ALTEZZA" color="success"
                  fields={[
                    { key: 'altezza_sx', label: 'SX', value: misure.altezza_sx },
                    { key: 'altezza_cx', label: 'CX ★', value: misure.altezza_cx },
                    { key: 'altezza_dx', label: 'DX', value: misure.altezza_dx },
                  ]}
                  onChange={handleMisuraChange}
                  onVoice={handleVoiceForField}
                  activeField={activeField}
                />

                {/* DIAGONALI */}
                <MisureBlock
                  label="DIAGONALE" color="ocra"
                  fields={[
                    { key: 'diagonale_1', label: 'D1', value: misure.diagonale_1 },
                    { key: 'diagonale_2', label: 'D2', value: misure.diagonale_2 },
                  ]}
                  onChange={handleMisuraChange}
                  onVoice={handleVoiceForField}
                  activeField={activeField}
                />

                {/* SPALLETTE */}
                <MisureBlock
                  label="SPALLETTA" color="gray"
                  fields={[
                    { key: 'spalletta_sx', label: 'SX', value: misure.spalletta_sx },
                    { key: 'spalletta_dx', label: 'DX', value: misure.spalletta_dx },
                  ]}
                  onChange={handleMisuraChange}
                  onVoice={handleVoiceForField}
                  activeField={activeField}
                />
              </motion.div>
            )}

            {/* ── TAB: DETTAGLI ── */}
            {subTab === 'dettagli' && (
              <motion.div key="dettagli" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Note */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', paddingLeft: 4 }}>NOTE VANO</div>
                <textarea
                  style={{ width: '100%', border: 'none', borderRadius: 14, padding: '14px 15px', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--ink)', outline: 'none', resize: 'none', minHeight: 100, background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13), inset 0 -1px 2px rgba(255,255,255,0.45)' } as React.CSSProperties}
                  placeholder="Es. Cliente preferisce profilo scuro…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onBlur={handleSaveNote}
                />

                {/* Foto */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', paddingLeft: 4 }}>FOTO</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {fotos.map((url, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', boxShadow: '0 3px 8px rgba(60,50,30,0.15)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed rgba(60,50,30,0.2)', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--ink-dim)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: 1 }}>FOTO</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFotoUpload} />
              </motion.div>
            )}

            {/* ── TAB: RIEPILOGO ── */}
            {subTab === 'riepilogo' && (
              <motion.div key="riepilogo" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <RiepilogoMisure misure={misure} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* AZIONI BOTTOM */}
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={onBack} style={btnBackStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              Indietro
            </button>
            <div style={{ flex: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -6, borderRadius: 20, background: 'var(--teal)', filter: 'blur(12px)', opacity: 0.5, zIndex: -1 }} />
              <button
                onClick={() => router.push(`/misure/${rilievoId}`)}
                style={btnSalvaStyle}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                Salva · Prossimo vano
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SUB-COMPONENTI ───────────────────────────────────────────────

const SecCard: FC<{ title: string; subtitle: string; pill: string; colori: { bg: string; color: string } }> = ({ title, subtitle, pill, colori }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', inset: -4, borderRadius: 20, background: 'var(--surface-2)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1 }} />
    <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 5px 12px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.6)' }}>
      <div style={{ position: 'absolute', top: '8%', left: '10%', width: '28%', height: '14%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(8px)' }} />
      <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3, textShadow: '0 1px 0 rgba(255,255,255,0.45)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', marginTop: 3, fontWeight: 600 }}>{subtitle}</div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)', letterSpacing: 0.4, display: 'inline-block', marginTop: 5, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.55)' }}>{pill}</span>
      </div>
    </div>
  </div>
)

const COLOR_MAP: Record<string, { label: string; labelColor: string }> = {
  blue: { label: '↔', labelColor: 'var(--blue-deep)' },
  success: { label: '↕', labelColor: 'var(--success)' },
  ocra: { label: '⤡', labelColor: 'var(--ocra-deep)' },
  gray: { label: '←→', labelColor: 'var(--ink-2)' },
}

const MisureBlock: FC<{
  label: string; color: string
  fields: { key: keyof MisureVano; label: string; value: string }[]
  onChange: (k: keyof MisureVano, v: string) => void
  onVoice: (k: keyof MisureVano) => void
  activeField: keyof MisureVano | null
}> = ({ label, color, fields, onChange, onVoice, activeField }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, paddingLeft: 4 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.7, textTransform: 'uppercase', color: COLOR_MAP[color]?.labelColor || 'var(--ink-2)' }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: fields.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
      {fields.map(f => (
        <div key={f.key} style={{ marginBottom: 9 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 5, paddingLeft: 4 }}>
            {f.label}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={f.value}
              onChange={e => onChange(f.key, e.target.value)}
              onFocus={() => {}}
              style={{
                width: '100%', border: 'none', borderRadius: 15, padding: '18px 40px 18px 14px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 800,
                color: 'var(--ink)', outline: 'none', textAlign: 'center',
                background: activeField === f.key ? 'linear-gradient(160deg, #FFF9EE, var(--ocra-bg))' : 'linear-gradient(160deg, #FFFEFB, var(--bg-soft))',
                boxShadow: activeField === f.key
                  ? '0 0 0 2px var(--ocra), 0 4px 9px rgba(200,138,23,0.2), inset 0 2.5px 4px rgba(255,255,255,0.7)'
                  : '0 0 0 1px rgba(60,50,30,0.07), 0 4px 9px rgba(60,50,30,0.13), inset 0 2.5px 4px rgba(255,255,255,0.7)',
              }}
            />
            {/* Voice btn */}
            <button
              onClick={() => onVoice(f.key)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.5), 0 2px 4px rgba(20,80,90,0.15)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const RiepilogoMisure: FC<{ misure: MisureVano }> = ({ misure }) => {
  const rows = [
    { label: 'L. Sinistra', value: misure.larghezza_sx, color: 'var(--blue-deep)' },
    { label: 'L. Centro ★', value: misure.larghezza_cx, color: 'var(--blue-deep)' },
    { label: 'L. Destra', value: misure.larghezza_dx, color: 'var(--blue-deep)' },
    { label: 'A. Sinistra', value: misure.altezza_sx, color: 'var(--success)' },
    { label: 'A. Centro ★', value: misure.altezza_cx, color: 'var(--success)' },
    { label: 'A. Destra', value: misure.altezza_dx, color: 'var(--success)' },
    { label: 'Diagonale 1', value: misure.diagonale_1, color: 'var(--ocra-deep)' },
    { label: 'Diagonale 2', value: misure.diagonale_2, color: 'var(--ocra-deep)' },
    { label: 'Spalletta SX', value: misure.spalletta_sx, color: 'var(--ink-2)' },
    { label: 'Spalletta DX', value: misure.spalletta_dx, color: 'var(--ink-2)' },
  ]
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: -4, borderRadius: 20, background: 'var(--surface-2)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1 }} />
      <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 16, padding: '14px', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.6)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '6%', left: '10%', width: '28%', height: '12%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(8px)' }} />
        {rows.filter(r => r.value).map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', borderBottom: i < rows.filter(r2 => r2.value).length - 1 ? '1px dashed rgba(60,50,30,0.1)' : 'none' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: r.color }}>{r.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{r.value} <span style={{ fontSize: 10, color: 'var(--ink-dim)' }}>mm</span></span>
          </div>
        ))}
        {rows.every(r => !r.value) && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-soft)', fontFamily: "'Nunito', sans-serif", fontSize: 13 }}>
            Nessuna misura inserita
          </div>
        )}
      </div>
    </div>
  )
}

const btnBackStyle: React.CSSProperties = {
  flex: 1, border: 'none', cursor: 'pointer', borderRadius: 15, padding: '14px',
  fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
  color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  textShadow: '0 1px 0 rgba(255,255,255,0.45)',
  boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3.5px 6px rgba(255,255,255,0.7)',
}

const btnSalvaStyle: React.CSSProperties = {
  width: '100%', border: 'none', cursor: 'pointer', borderRadius: 15, padding: '14px',
  fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
  color: '#fff', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, position: 'relative',
  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 8px 18px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25), inset 0 -3px 5px rgba(0,0,0,0.22)',
}
