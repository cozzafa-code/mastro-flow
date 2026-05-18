'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getVano, saveMisure, saveVanoNote, uploadFotoVano, getFotoVano } from '@/lib/misure-queries'
import type { Vano, MisureVano, SubTab } from '@/lib/misure-types'
import {
  TIPOLOGIE_RAPIDE, DIFFICOLTA_SALITA, MEZZI_SALITA,
  VETRI, TELAI, CONTROTELAI_TIPI, isMisureComplete, isMisureParziale
} from '@/lib/misure-types'
import { createClient } from '@/lib/supabase/client'

// ── VOICE INPUT ──────────────────────────────────────────────────
function useVoiceInput(onResult: (val: string) => void) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'it-IT'; rec.continuous = false; rec.interimResults = false
    rec.onresult = (e: any) => {
      const raw = e.results[0][0].transcript.replace(/[^0-9.,]/g, '').replace(',', '.')
      if (raw) onResult(raw)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec; rec.start(); setListening(true)
  }, [onResult])

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false) }, [])
  return { listening, start, stop }
}

// ── ACCORDION COMPONENT ──────────────────────────────────────────
interface AccordionProps {
  id: string
  iconClass: string
  icon: React.ReactNode
  label: string
  badge?: string
  optional?: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

const Accordion: FC<AccordionProps> = ({ id, iconClass, icon, label, badge, optional, isOpen, onToggle, children }) => {
  const colorMap: Record<string, string> = {
    violet: 'linear-gradient(160deg, #E8DFF4, #D5C5E5)',
    teal: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))',
    ocra: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))',
    success: 'linear-gradient(160deg, var(--success-bg), var(--success-mid))',
    blue: 'linear-gradient(160deg, var(--blue-bg), #C5CCE5)',
    gray: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  }
  const textColorMap: Record<string, string> = {
    violet: '#6B4F9C', teal: 'var(--teal-deep)', ocra: 'var(--ocra-deep)',
    success: 'var(--success)', blue: 'var(--blue-deep)', gray: 'var(--ink-2)',
  }

  return (
    <div id={id} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: -3, borderRadius: 18, background: 'var(--surface-2)', filter: 'blur(7px)', opacity: 0.35, zIndex: -1 }} />
      <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 15, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.65), inset 0 -2px 4px rgba(0,0,0,0.05)' }}>
        <button onClick={onToggle} style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '8%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(7px)', pointerEvents: 'none' }} />
          <div style={{ width: 30, height: 30, borderRadius: 9, background: colorMap[iconClass] || colorMap.gray, color: textColorMap[iconClass] || 'var(--ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6), inset 0 -1.5px 2.5px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.08)' }}>
            {icon}
          </div>
          <div style={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.1, textShadow: '0 1px 0 rgba(255,255,255,0.45)', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 6, position: 'relative', zIndex: 2 }}>
            {label}
            {optional && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: 'var(--ink-soft)', letterSpacing: 0.4 }}>opz.</span>}
          </div>
          {badge && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'var(--teal-bg)', color: 'var(--teal-deep)', letterSpacing: 0.5, position: 'relative', zIndex: 2, boxShadow: 'inset 0 1px 2px rgba(20,80,90,0.15)' }}>{badge}</span>
          )}
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--ink-dim)', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6), 0 1px 3px rgba(60,50,30,0.1)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '6px 14px 14px' }}>{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── INPUT MISURA ─────────────────────────────────────────────────
const MisureInput: FC<{
  fieldKey: keyof MisureVano; label: string; value: string
  isActive: boolean; isMaster?: boolean
  onChange: (k: keyof MisureVano, v: string) => void
  onVoice: (k: keyof MisureVano) => void
}> = ({ fieldKey, label, value, isActive, isMaster, onChange, onVoice }) => (
  <div style={{ marginBottom: 9 }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 5, paddingLeft: 4 }}>
      {label}{isMaster && ' ★'}
    </div>
    <div style={{ position: 'relative' }}>
      <input
        type="number" inputMode="decimal"
        placeholder="0" value={value}
        onChange={e => onChange(fieldKey, e.target.value)}
        style={{
          width: '100%', border: 'none', borderRadius: 15, padding: '18px 40px 18px 14px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 800,
          color: 'var(--ink)', outline: 'none', textAlign: 'center',
          background: isActive ? 'linear-gradient(160deg, #FFF9EE, var(--ocra-bg))' : 'linear-gradient(160deg, #FFFEFB, var(--bg-soft))',
          boxShadow: isActive
            ? '0 0 0 2px var(--ocra), 0 4px 9px rgba(200,138,23,0.2), inset 0 2.5px 4px rgba(255,255,255,0.7)'
            : '0 0 0 1px rgba(60,50,30,0.07), 0 4px 9px rgba(60,50,30,0.13), inset 0 2.5px 4px rgba(255,255,255,0.7)',
        }}
      />
      <button onClick={() => onVoice(fieldKey)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.5), 0 2px 4px rgba(20,80,90,0.15)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
      </button>
    </div>
  </div>
)

// ── SELECT STYLE ─────────────────────────────────────────────────
const selStyle: React.CSSProperties = {
  width: '100%', border: 'none', borderRadius: 12, padding: '11px 30px 11px 13px',
  fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700,
  color: 'var(--ink)', outline: 'none', marginBottom: 8,
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.4)',
  appearance: 'none' as const,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'%3E%3C/path%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: 'none', borderRadius: 12, padding: '11px 13px',
  fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600,
  color: 'var(--ink)', outline: 'none', marginBottom: 8,
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.4)',
}

const lblStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800,
  color: 'var(--ink-dim)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5, marginTop: 8, paddingLeft: 2,
}

// ── COMPONENTE PRINCIPALE ────────────────────────────────────────
interface Props { vanoId: string; rilievoId: string; onBack: () => void }

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
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stato accordion dati tecnici (sincronizzati con vano)
  const [tipo, setTipo] = useState('')
  const [stanza, setStanza] = useState('')
  const [piano, setPiano] = useState('')
  const [sistema, setSistema] = useState('')
  const [coloreInt, setColoreInt] = useState('')
  const [coloreEst, setColoreEst] = useState('')
  const [vetro, setVetro] = useState('')
  const [telaio, setTelaio] = useState('')
  const [coprifilo, setCoprifilo] = useState('')
  const [lamiera, setLamiera] = useState('')
  const [difficoltaSalita, setDifficoltaSalita] = useState('')
  const [mezzoSalita, setMezzoSalita] = useState('')
  const [controtelaio, setControtelaio] = useState('')
  const [ferro, setFerro] = useState('')
  const [pezzi, setPezzi] = useState('1')

  // Voice
  const { listening, start: startVoice, stop: stopVoice } = useVoiceInput(useCallback((val: string) => {
    if (!activeField || !misure) return
    setMisure(m => m ? { ...m, [activeField]: val } : m)
    setActiveField(null)
  }, [activeField, misure]))

  // Carica vano
  useEffect(() => {
    getVano(vanoId).then(v => {
      if (v) {
        setVano(v); setMisure(v.misure); setNote(v.note)
        setTipo(v.tipo || ''); setStanza(v.stanza || ''); setPiano(v.piano || '')
        setSistema(v.sistema || ''); setColoreInt(v.coloreInt || ''); setColoreEst(v.coloreEst || '')
        setVetro(v.vetro || ''); setTelaio(v.telaio || ''); setCoprifilo(v.coprifilo || '')
        setLamiera(v.lamiera || ''); setDifficoltaSalita(v.difficoltaSalita || '')
        setMezzoSalita(v.mezzoSalita || ''); setControtelaio(v.controtelaio || '')
        setFerro(v.ferro || ''); setPezzi(String(v.pezzi || 1))
      }
      setLoading(false)
    })
    getFotoVano(vanoId).then(setFotos)
  }, [vanoId])

  // Auto-save misure
  useEffect(() => {
    if (!misure || !vanoId) return
    const t = setTimeout(() => saveMisure(vanoId, misure), 800)
    return () => clearTimeout(t)
  }, [misure, vanoId])

  // Salva campo tecnico su Supabase
  const saveField = useCallback(async (field: string, value: string | number | boolean) => {
    const sb = createClient()
    await sb.from('vani').update({ [field]: value }).eq('id', vanoId)
  }, [vanoId])

  const handleMisuraChange = (field: keyof MisureVano, val: string) => {
    setMisure(m => m ? { ...m, [field]: val } : m)
  }

  const handleVoiceForField = (field: keyof MisureVano) => {
    setActiveField(field)
    startVoice()
  }

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFotoVano(vanoId, file)
    if (url) setFotos(p => [...p, url])
  }

  const handleSaveAndNext = async () => {
    setSaving(true)
    if (misure) await saveMisure(vanoId, misure)
    await saveVanoNote(vanoId, note)
    setSaving(false)
    router.push(`/misure/${rilievoId}`)
  }

  const toggleAcc = (k: string) => setAccOpen(p => ({ ...p, [k]: !p[k] }))

  const misureComplete = misure ? !!(misure.lCentro && misure.hCentro) : false
  const misureParziale = misure ? isMisureParziale(misure) : false

  if (loading) return (
    <div className="phone-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!vano || !misure) return null

  const statoPill = misureComplete ? 'Definitive' : misureParziale ? 'Parziale' : 'Provv.'
  const statoBg = misureComplete ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : misureParziale ? 'linear-gradient(160deg, var(--blue), var(--blue-deep))' : 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'

  return (
    <div className="phone-screen">
      {/* TOPBAR TEAL */}
      <div style={{ padding: '12px 14px 0', position: 'relative', zIndex: 5, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: '12px 14px 0', borderRadius: 28, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.45, zIndex: -1 }} />
        <div style={{ background: 'linear-gradient(165deg, var(--teal) 0%, var(--teal-deep) 60%, var(--teal-darker) 100%)', borderRadius: 24, padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)' }}>
          <div style={{ position: 'absolute', top: '8%', left: '10%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', filter: 'blur(12px)' }} />
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 2.5px 4px rgba(255,255,255,0.28), inset 0 -2px 3px rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.3)' }}>
            <div style={{ position: 'absolute', top: '16%', left: '22%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div style={{ flex: 1, position: 'relative', zIndex: 2, minWidth: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.8, textTransform: 'uppercase' }}>VANO {vano.numero}</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: -0.4, lineHeight: 1, marginTop: 2, textShadow: '0 1.5px 3px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vano.nome}</div>
          </div>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 999, background: statoBg, color: '#fff', boxShadow: '0 4px 9px rgba(20,80,90,0.4)', position: 'relative', zIndex: 2, flexShrink: 0, textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
            {statoPill}
          </span>
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 14, position: 'relative', zIndex: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 4px 9px rgba(0,0,0,0.3), inset 0 2.5px 4px rgba(255,255,255,0.75)', textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
            <div style={{ position: 'absolute', top: '14%', left: '24%', width: '34%', height: '20%', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
            <span style={{ position: 'relative', zIndex: 1 }}>{vano.nome.slice(0, 2).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="page">
        <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* DETTATURA VOCALE */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -6, borderRadius: 24, background: listening ? 'var(--red)' : 'var(--teal)', filter: 'blur(13px)', opacity: 0.5, zIndex: -1 }} />
            <button
              onClick={listening ? stopVoice : () => { setActiveField('lCentro'); startVoice() }}
              style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 18, padding: '16px 14px', background: listening ? 'linear-gradient(160deg, var(--red), var(--red-deep))' : 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.25)', position: 'relative', overflow: 'hidden', boxShadow: listening ? '0 0 0 1px rgba(0,0,0,0.06), 0 10px 22px rgba(200,73,65,0.5), inset 0 4px 7px rgba(255,255,255,0.25)' : '0 0 0 1px rgba(0,0,0,0.06), 0 10px 22px rgba(20,80,90,0.5), inset 0 4px 7px rgba(255,255,255,0.25)' }}
            >
              <div style={{ position: 'absolute', top: '14%', left: '22%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', filter: 'blur(5px)', pointerEvents: 'none' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
                {listening ? <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></> : <><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
              </svg>
              <span style={{ position: 'relative', zIndex: 1 }}>{listening ? `In ascolto… (${activeField || 'campo'})` : 'Avvia Dettatura'}</span>
              {listening && <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block', position: 'relative', zIndex: 1 }} />}
            </button>
          </div>

          {/* SUB-TAB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '6px 2px 4px' }}>
            {(['misure', 'dettagli', 'riepilogo'] as SubTab[]).map((t, i) => {
              const isCurrent = subTab === t
              const isDone = t === 'misure' ? misureComplete : t === 'dettagli' ? sistema.length > 0 : false
              return (
                <button key={t} onClick={() => setSubTab(t)} style={{ border: 'none', cursor: 'pointer', background: 'transparent', padding: '11px 6px 14px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, position: 'relative' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 800, background: isDone ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : isCurrent ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: isDone || isCurrent ? '#fff' : 'var(--ink-soft)', boxShadow: isDone ? '0 3px 7px rgba(47,125,87,0.4)' : isCurrent ? '0 4px 9px rgba(20,80,90,0.45)' : 'inset 0 1.5px 3px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.06)', textShadow: isDone || isCurrent ? '0 1px 1px rgba(0,0,0,0.25)' : 'none' }}>
                    {isDone ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                  </div>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, color: isDone ? 'var(--success)' : isCurrent ? 'var(--ink)' : 'var(--ink-soft)', letterSpacing: 0.3 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  {isCurrent && <div style={{ position: 'absolute', bottom: 0, left: '18%', right: '18%', height: 3, background: 'linear-gradient(90deg, var(--teal), var(--teal-deep))', borderRadius: 999, boxShadow: '0 0 8px rgba(20,80,90,0.5)' }} />}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ── TAB MISURE ── */}
            {subTab === 'misure' && (
              <motion.div key="misure" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Card info vano */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: -4, borderRadius: 20, background: 'var(--surface-2)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1 }} />
                  <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 5px 12px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.6)' }}>
                    <div style={{ position: 'absolute', top: '8%', left: '10%', width: '28%', height: '14%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(8px)' }} />
                    <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3, textShadow: '0 1px 0 rgba(255,255,255,0.45)' }}>{vano.nome}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-dim)', marginTop: 3, fontWeight: 600 }}>{tipo ? `${TIPOLOGIE_RAPIDE.find(t => t.code === tipo)?.label || tipo} · ` : ''}{stanza || 'Stanza —'} · {piano || 'Piano —'}</div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: statoBg, color: '#fff', display: 'inline-block', marginTop: 5, textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>{statoPill}</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: 'var(--ink-dim)', textAlign: 'right' }}>
                      {pezzi} <span style={{ fontSize: 9, fontWeight: 700 }}>pz</span>
                    </div>
                  </div>
                </div>

                {/* Schizzo tecnico */}
                <button style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 15, padding: '11px 14px', background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
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

                {/* 10 ACCORDION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>

                  {/* 1. Accesso / Difficoltà */}
                  <Accordion id="acc-accesso" iconClass="violet" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} label="Accesso / Difficoltà" badge={difficoltaSalita || undefined} isOpen={!!accOpen['accesso']} onToggle={() => toggleAcc('accesso')}>
                    <label style={lblStyle}>Difficoltà salita</label>
                    <select style={selStyle} value={difficoltaSalita} onChange={e => { setDifficoltaSalita(e.target.value); saveField('difficolta_salita', e.target.value) }}>
                      {DIFFICOLTA_SALITA.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <label style={lblStyle}>Mezzo di salita</label>
                    <select style={selStyle} value={mezzoSalita} onChange={e => { setMezzoSalita(e.target.value); saveField('mezzo_salita', e.target.value) }}>
                      {MEZZI_SALITA.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </Accordion>

                  {/* 2. Tipologia */}
                  <Accordion id="acc-tipologia" iconClass="teal" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>} label="Tipologia" badge={tipo || undefined} isOpen={!!accOpen['tipologia']} onToggle={() => toggleAcc('tipologia')}>
                    <label style={lblStyle}>Tipo infisso</label>
                    <select style={selStyle} value={tipo} onChange={e => { setTipo(e.target.value); saveField('tipo', e.target.value) }}>
                      {TIPOLOGIE_RAPIDE.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                    <label style={lblStyle}>Pezzi</label>
                    <input type="number" inputMode="numeric" style={inputStyle} value={pezzi} onChange={e => { setPezzi(e.target.value); saveField('pezzi', parseInt(e.target.value) || 1) }} min="1" />
                  </Accordion>

                  {/* 3. Stanza / Piano */}
                  <Accordion id="acc-stanza" iconClass="ocra" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Stanza / Piano" badge={stanza || undefined} isOpen={!!accOpen['stanza']} onToggle={() => toggleAcc('stanza')}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 2 }}>
                        <label style={lblStyle}>Stanza</label>
                        <input style={inputStyle} placeholder="Es: Cucina, Camera..." value={stanza} onChange={e => setStanza(e.target.value)} onBlur={() => saveField('stanza', stanza)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={lblStyle}>Piano</label>
                        <input style={inputStyle} placeholder="PT, P1..." value={piano} onChange={e => setPiano(e.target.value)} onBlur={() => saveField('piano', piano)} />
                      </div>
                    </div>
                  </Accordion>

                  {/* 4. Sistema / Vetro */}
                  <Accordion id="acc-sistema" iconClass="blue" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} label="Sistema / Vetro" badge={sistema || undefined} isOpen={!!accOpen['sistema']} onToggle={() => toggleAcc('sistema')}>
                    <label style={lblStyle}>Sistema / Profilo</label>
                    <input style={inputStyle} placeholder="Es: Aliplast Genesis 75" value={sistema} onChange={e => setSistema(e.target.value)} onBlur={() => saveField('sistema', sistema)} />
                    <label style={lblStyle}>Vetro</label>
                    <select style={selStyle} value={vetro} onChange={e => { setVetro(e.target.value); saveField('vetro', e.target.value) }}>
                      {VETRI.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </Accordion>

                  {/* 5. Colori profili */}
                  <Accordion id="acc-colori" iconClass="gray" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="9"/></svg>} label="Colori profili" badge={coloreEst || undefined} isOpen={!!accOpen['colori']} onToggle={() => toggleAcc('colori')}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={lblStyle}>Colore interno</label>
                        <input style={inputStyle} placeholder="Bianco RAL 9016" value={coloreInt} onChange={e => setColoreInt(e.target.value)} onBlur={() => saveField('colore_int', coloreInt)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={lblStyle}>Colore esterno</label>
                        <input style={inputStyle} placeholder="Antracite RAL 7016" value={coloreEst} onChange={e => setColoreEst(e.target.value)} onBlur={() => saveField('colore_est', coloreEst)} />
                      </div>
                    </div>
                  </Accordion>

                  {/* 6. Telaio / Rifilato */}
                  <Accordion id="acc-telaio" iconClass="gray" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>} label="Telaio / Rifilato" optional isOpen={!!accOpen['telaio']} onToggle={() => toggleAcc('telaio')}>
                    <label style={lblStyle}>Tipo telaio</label>
                    <select style={selStyle} value={telaio} onChange={e => { setTelaio(e.target.value); saveField('telaio', e.target.value) }}>
                      {TELAI.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Accordion>

                  {/* 7. Coprifilo */}
                  <Accordion id="acc-coprifilo" iconClass="gray" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>} label="Coprifilo" optional isOpen={!!accOpen['coprifilo']} onToggle={() => toggleAcc('coprifilo')}>
                    <input style={inputStyle} placeholder="Es: Coprifilo 30mm bianco" value={coprifilo} onChange={e => setCoprifilo(e.target.value)} onBlur={() => saveField('coprifilo', coprifilo)} />
                  </Accordion>

                  {/* 8. Lamiera */}
                  <Accordion id="acc-lamiera" iconClass="gray" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>} label="Lamiera" optional isOpen={!!accOpen['lamiera']} onToggle={() => toggleAcc('lamiera')}>
                    <input style={inputStyle} placeholder="Es: Lamiera 15mm zincata" value={lamiera} onChange={e => setLamiera(e.target.value)} onBlur={() => saveField('lamiera', lamiera)} />
                  </Accordion>

                  {/* 9. Controtelaio */}
                  <Accordion id="acc-controtelaio" iconClass="gray" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>} label="Controtelaio" optional isOpen={!!accOpen['controtelaio']} onToggle={() => toggleAcc('controtelaio')}>
                    <label style={lblStyle}>Tipo controtelaio</label>
                    <select style={selStyle} value={controtelaio} onChange={e => { setControtelaio(e.target.value); saveField('controtelaio', e.target.value) }}>
                      {CONTROTELAI_TIPI.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Accordion>

                  {/* 10. Ferro */}
                  <Accordion id="acc-ferro" iconClass="gray" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>} label="Ferro" optional isOpen={!!accOpen['ferro']} onToggle={() => toggleAcc('ferro')}>
                    <input style={inputStyle} placeholder="Tipo ferro / rinforzo" value={ferro} onChange={e => setFerro(e.target.value)} onBlur={() => saveField('ferro', ferro)} />
                  </Accordion>
                </div>

                {/* MISURE */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', paddingLeft: 4, marginTop: 4 }}>MISURE</div>

                {/* Larghezze */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, paddingLeft: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--blue-deep)" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14"/><path d="M15 7l5 5-5 5"/><path d="M9 7L4 12l5 5"/></svg>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.7, textTransform: 'uppercase', color: 'var(--blue-deep)' }}>LARGHEZZA</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <MisureInput fieldKey="lAlto" label="ALTO" value={misure.lAlto} isActive={activeField === 'lAlto'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                    <MisureInput fieldKey="lCentro" label="CENTRO" value={misure.lCentro} isActive={activeField === 'lCentro'} isMaster onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                    <MisureInput fieldKey="lBasso" label="BASSO" value={misure.lBasso} isActive={activeField === 'lBasso'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                  </div>
                </div>

                {/* Altezze */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, paddingLeft: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"/><path d="M7 9l5-5 5 5"/><path d="M7 15l5 5 5-5"/></svg>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.7, textTransform: 'uppercase', color: 'var(--success)' }}>ALTEZZA</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <MisureInput fieldKey="hSx" label="SX" value={misure.hSx} isActive={activeField === 'hSx'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                    <MisureInput fieldKey="hCentro" label="CENTRO" value={misure.hCentro} isActive={activeField === 'hCentro'} isMaster onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                    <MisureInput fieldKey="hDx" label="DX" value={misure.hDx} isActive={activeField === 'hDx'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                  </div>
                </div>

                {/* Diagonali */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, paddingLeft: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.7, textTransform: 'uppercase', color: 'var(--ocra-deep)' }}>DIAGONALE</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <MisureInput fieldKey="diag1" label="D1" value={misure.diag1} isActive={activeField === 'diag1'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                    <MisureInput fieldKey="diag2" label="D2" value={misure.diag2} isActive={activeField === 'diag2'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                  </div>
                </div>

                {/* Spallette */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, paddingLeft: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: 1.7, textTransform: 'uppercase', color: 'var(--ink-2)' }}>SPALLETTA</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <MisureInput fieldKey="spallSx" label="SX" value={misure.spallSx} isActive={activeField === 'spallSx'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                    <MisureInput fieldKey="spallDx" label="DX" value={misure.spallDx} isActive={activeField === 'spallDx'} onChange={handleMisuraChange} onVoice={handleVoiceForField} />
                  </div>
                </div>

              </motion.div>
            )}

            {/* ── TAB DETTAGLI ── */}
            {subTab === 'dettagli' && (
              <motion.div key="dettagli" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', paddingLeft: 4 }}>NOTE VANO</div>
                <textarea style={{ width: '100%', border: 'none', borderRadius: 14, padding: '14px 15px', fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--ink)', outline: 'none', resize: 'none', minHeight: 100, background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13), inset 0 -1px 2px rgba(255,255,255,0.45)' } as React.CSSProperties} placeholder="Es. Cliente preferisce profilo scuro…" value={note} onChange={e => setNote(e.target.value)} onBlur={() => saveVanoNote(vanoId, note)} />

                {/* Foto */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.8, textTransform: 'uppercase', paddingLeft: 4 }}>FOTO</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {fotos.map((url, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', boxShadow: '0 3px 8px rgba(60,50,30,0.15)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed rgba(60,50,30,0.2)', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--ink-dim)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: 1 }}>FOTO</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFotoUpload} />
              </motion.div>
            )}

            {/* ── TAB RIEPILOGO ── */}
            {subTab === 'riepilogo' && (
              <motion.div key="riepilogo" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Riepilogo vano */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: -4, borderRadius: 22, background: 'var(--surface-2)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1 }} />
                  <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 18, padding: 16, boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.6)' }}>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.4, textShadow: '0 1px 0 rgba(255,255,255,0.45)', marginBottom: 4 }}>{vano.nome}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', letterSpacing: 0.5, fontWeight: 700 }}>
                      {tipo} · {sistema || '—'} · {vetro || '—'}
                    </div>
                    {/* Misure */}
                    {[
                      { label: 'LARGHEZZA', color: 'var(--blue-deep)', bg: 'linear-gradient(160deg, var(--blue-bg), #C5CCE5)', rows: [{ l: 'Alto', v: misure.lAlto }, { l: 'Centro ★', v: misure.lCentro }, { l: 'Basso', v: misure.lBasso }] },
                      { label: 'ALTEZZA', color: 'var(--success)', bg: 'linear-gradient(160deg, var(--success-bg), var(--success-mid))', rows: [{ l: 'SX', v: misure.hSx }, { l: 'Centro ★', v: misure.hCentro }, { l: 'DX', v: misure.hDx }] },
                      { label: 'DIAGONALE', color: 'var(--ocra-deep)', bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', rows: [{ l: 'D1', v: misure.diag1 }, { l: 'D2', v: misure.diag2 }] },
                      { label: 'SPALLETTA', color: 'var(--ink-2)', bg: 'linear-gradient(160deg, var(--surface-2), #DCD3BF)', rows: [{ l: 'SX', v: misure.spallSx }, { l: 'DX', v: misure.spallDx }] },
                    ].map(sec => (
                      <div key={sec.label} style={{ borderRadius: 13, marginTop: 10, overflow: 'hidden', boxShadow: 'inset 0 2.5px 4px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.45)' }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, padding: '7px 14px', textTransform: 'uppercase', background: sec.bg, color: sec.color }}>{sec.label}</div>
                        {sec.rows.filter(r => r.v).map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', fontSize: 12.5, borderTop: i > 0 ? '1px solid rgba(60,50,30,0.06)' : 'none', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))' }}>
                            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{r.l}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: 'var(--ink-soft)' }}>{r.v} mm</span>
                          </div>
                        ))}
                        {!sec.rows.some(r => r.v) && <div style={{ padding: '7px 14px', fontSize: 11, color: 'var(--ink-soft)', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))' }}>— non inserita</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AZIONI BOTTOM */}
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={onBack} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 15, padding: '14px', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textShadow: '0 1px 0 rgba(255,255,255,0.45)', boxShadow: '0 0 0 1px rgba(60,50,30,0.07), 0 5px 12px rgba(60,50,30,0.18), inset 0 3.5px 6px rgba(255,255,255,0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              Indietro
            </button>
            <div style={{ flex: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -5, borderRadius: 20, background: 'var(--teal)', filter: 'blur(12px)', opacity: 0.5, zIndex: -1 }} />
              <button onClick={handleSaveAndNext} disabled={saving} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 15, padding: '14px', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 0.3, color: '#fff', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, position: 'relative', textShadow: '0 1px 2px rgba(0,0,0,0.25)', boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 8px 18px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                {saving ? 'Salvataggio…' : 'Salva · Prossimo vano'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
