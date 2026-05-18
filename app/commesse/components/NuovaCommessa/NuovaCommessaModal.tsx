'use client'
import { FC, useState, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFlashAdvance } from './useFlashAdvance'
import { ModalPortal } from './ModalPortal'

// ── TIPI ────────────────────────────────────────────────────────
type Tipo = 'nuova' | 'riparazione'
type Difficolta = 'facile' | 'media' | 'difficile' | null
type RipStep = 0 | 1 | 2 | 3
type Urgenza = 'normale' | 'media' | 'urgente' | null

interface FormNuova {
  nome: string; cognome: string; indirizzo: string
  telefono: string; email: string; codiceFiscale: string
  piva: string; citta: string; cap: string; pec: string; sdi: string
  difficoltaSalita: Difficolta
  pianoEdificio: string; foroScale: string; mezzoSalita: string
  tipoEdificio: string; note: string
}

interface FormRip {
  nome: string; cognome: string; telefono: string
  tipoProblema: string; tipoInfisso: string
  urgenza: Urgenza; descrizione: string; chiSegnala: string
}

const PIANI = ['S2','S1','PT','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','M']
const MEZZI = ['Ascensore standard','Montacarichi','Scala interna','Cestello esterno','Autoscala']
const TIPI_EDIFICIO = ['','palazzo','condominio','scuola','ospedale','villa','capannone','altro']
const PROBLEMI_RIP = ['Serratura','Cerniera','Vetro rotto','Maniglia','Persiana','Zanzariera','Guarnizione','Altro']
const INFISSI_RIP = ['Finestra PVC','Finestra alluminio','Porta ingresso','Porta interna','Portafinestra','Persiana','Zanzariera','Altro']

// ── CODICE AUTO ──────────────────────────────────────────────────
function genCodice(): string {
  const n = Math.floor(Math.random() * 9000) + 1000
  return `S-${n}`
}

// ── ICONE SVG ───────────────────────────────────────────────────
const IcoUser = () => <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--teal)" strokeWidth="2.4" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoAccesso = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="17 11 21 7 17 3"/><line x1="3" y1="7" x2="21" y2="7"/><polyline points="7 21 3 17 7 13"/><line x1="21" y1="17" x2="3" y2="17"/></svg>
const IcoEdificio = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 22V7l9-5 9 5v15M11 11h2M11 15h2M11 19h2"/></svg>
const IcoNote = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>

// ── SHARED STYLES ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0,
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  border: 'none', borderRadius: 12, padding: '11px 13px',
  fontFamily: "'Nunito', sans-serif",
  fontSize: 16, /* CRITICO: sotto 16px iOS fa zoom automatico */
  fontWeight: 600,
  color: 'var(--ink)', outline: 'none',
  boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.4)',
  marginBottom: 8,
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  paddingRight: 30, cursor: 'pointer',
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
}

// ── COMPONENTE PRINCIPALE ────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
}

export const NuovaCommessaModal: FC<Props> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const { flash } = useFlashAdvance()
  const codice = useState(genCodice)[0]

  const [tipo, setTipo] = useState<Tipo>('nuova')
  const [saving, setSaving] = useState(false)

  // Form nuova
  const [f, setF] = useState<FormNuova>({
    nome: '', cognome: '', indirizzo: '', telefono: '', email: '',
    codiceFiscale: '', piva: '', citta: '', cap: '', pec: '', sdi: '',
    difficoltaSalita: null, pianoEdificio: 'PT', foroScale: '',
    mezzoSalita: 'Ascensore standard', tipoEdificio: '', note: '',
  })

  // Accordion stato
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({
    accesso: false, edificio: false, note: false,
  })

  // Form riparazione
  const [rip, setRip] = useState<FormRip>({
    nome: '', cognome: '', telefono: '',
    tipoProblema: '', tipoInfisso: '',
    urgenza: null, descrizione: '', chiSegnala: '',
  })
  const [ripStep, setRipStep] = useState<RipStep>(0)

  const setFld = useCallback((k: keyof FormNuova, v: string) => setF(p => ({ ...p, [k]: v })), [])
  const setRipFld = useCallback((k: keyof FormRip, v: string) => setRip(p => ({ ...p, [k]: v })), [])

  const toggleAcc = (k: string) => setAccOpen(p => ({ ...p, [k]: !p[k] }))
  const closeAcc = (k: string) => setAccOpen(p => ({ ...p, [k]: false }))

  // Validazione nuova
  const canSaveNuova = f.nome.trim().length > 0 && f.cognome.trim().length > 0 && f.telefono.trim().length > 0

  // Validazione riparazione
  const canSaveRip = rip.nome.trim().length > 0 && rip.cognome.trim().length > 0 && rip.tipoProblema.length > 0

  // Difficoltà flash
  const onDifficolta = (v: Difficolta) => {
    setFld('difficoltaSalita', v as string)
    closeAcc('accesso')
    flash('section-edificio')
  }

  // Chip tipo problema flash
  const onTipoProblema = (v: string) => {
    setRipFld('tipoProblema', v)
    flash('section-infisso')
  }

  // Chip tipo infisso flash
  const onTipoInfisso = (v: string) => {
    setRipFld('tipoInfisso', v)
    flash('section-descrizione')
  }

  // Urgenza flash
  const onUrgenza = (v: Urgenza) => {
    setRip(p => ({ ...p, urgenza: v }))
    flash('section-chi-segnala')
  }

  // Salva nuova commessa via API route (bypassa RLS)
  const handleSaveNuova = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/commesse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codice,
          cliente_nome: `${f.nome} ${f.cognome}`.trim(),
          indirizzo: f.indirizzo || null,
          citta: f.citta || null,
          telefono: f.telefono || null,
          email: f.email || null,
          note: f.note || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Errore creazione commessa')
      onClose()
      router.push('/commesse')
      router.refresh()
    } catch (e) {
      console.error('handleSaveNuova', e)
      alert('Errore: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Salva riparazione via API route
  const handleSaveRip = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/commesse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codice,
          cliente_nome: `${rip.nome} ${rip.cognome}`.trim(),
          note: rip.descrizione || null,
          sotto_stato: 'riparazione',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Errore creazione riparazione')
      onClose()
      router.push('/commesse')
      router.refresh()
    } catch (e) {
      console.error('handleSaveRip', e)
      alert('Errore: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: 'min(100vw, 430px)',
              zIndex: 301,
              background: 'var(--bg)',
              borderRadius: '32px 32px 0 0',
              boxShadow: '0 -16px 50px rgba(0,0,0,0.25)',
              maxHeight: '92svh',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              touchAction: 'pan-y',
              overscrollBehavior: 'none',
            }}
          >
            {/* Handle */}
            <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface-3)' }} />
            </div>

            {/* Contenuto scrollabile */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 40px' }}>

              {/* HEADER */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                {/* Fuzz */}
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: 32,
                  background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.45, zIndex: -1,
                }} />
                <div style={{
                  background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
                  borderRadius: 24, padding: '16px 18px', color: '#fff',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 32px rgba(20,80,90,0.45), inset 0 6px 14px rgba(255,255,255,0.12), inset 0 -6px 12px rgba(0,0,0,0.22)',
                }}>
                  {/* Highlight */}
                  <div style={{
                    position: 'absolute', top: '12%', left: '14%',
                    width: '28%', height: '16%',
                    background: 'rgba(255,255,255,0.18)', borderRadius: '50%', filter: 'blur(12px)',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 2.5, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', fontWeight: 600 }}>
                      CREA NUOVA
                    </span>
                    <button onClick={onClose} style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
                      display: 'grid', placeItems: 'center', color: 'var(--teal-deep)',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 3px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.6)',
                      position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', top: '16%', left: '24%', width: '32%', height: '16%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(2px)' }} />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, letterSpacing: -0.5, color: '#fff', lineHeight: 1.05, textShadow: '0 2px 4px rgba(0,0,0,0.25)', position: 'relative', zIndex: 2 }}>
                    Nuova commessa
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, position: 'relative', zIndex: 2 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{codice}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                      {tipo === 'nuova' ? 'Nuova installazione' : 'Riparazione'}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
                      letterSpacing: 1.2, padding: '3px 8px 3px 7px', borderRadius: 999,
                      background: 'rgba(0,0,0,0.25)', color: '#fff',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                    }}>⚡ FLASH</span>
                  </div>
                </div>
              </div>

              {/* TAB SELECT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {(['nuova', 'riparazione'] as Tipo[]).map(t => {
                  const isActive = tipo === t
                  const isNuova = t === 'nuova'
                  return (
                    <button key={t} onClick={() => setTipo(t)} style={{
                      border: 'none', cursor: 'pointer', borderRadius: 16, padding: '14px 6px',
                      fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
                      position: 'relative', textAlign: 'center',
                      background: isActive
                        ? isNuova
                          ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))'
                          : 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'
                        : 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
                      color: isActive ? '#fff' : 'var(--ink-dim)',
                      boxShadow: isActive
                        ? isNuova
                          ? '0 0 0 1px rgba(0,0,0,0.06), 0 6px 14px rgba(20,80,90,0.45), inset 0 3px 6px rgba(255,255,255,0.22), inset 0 -3px 6px rgba(0,0,0,0.2)'
                          : '0 0 0 1px rgba(0,0,0,0.06), 0 6px 14px rgba(200,138,23,0.5), inset 0 3px 6px rgba(255,255,255,0.28), inset 0 -3px 6px rgba(0,0,0,0.18)'
                        : '0 0 0 1px rgba(60,50,30,0.05), 0 4px 10px rgba(60,50,30,0.15), inset 0 3px 6px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.06)',
                      textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 0 rgba(255,255,255,0.4)',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ position: 'absolute', top: '14%', left: '22%', width: '32%', height: '18%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(2.5px)', pointerEvents: 'none' }} />
                      {t === 'nuova' ? 'Nuova installazione' : 'Riparazione'}
                    </button>
                  )
                })}
              </div>

              {/* ── FORM NUOVA INSTALLAZIONE ── */}
              <AnimatePresence mode="wait">
                {tipo === 'nuova' && (
                  <motion.div key="nuova" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>

                    {/* Dati cliente */}
                    <FormCard>
                      <SectionLabel icon={<IcoUser />} label="DATI CLIENTE" required />
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input id="input-nome" style={inputStyle} placeholder="Nome *" value={f.nome} onChange={e => setFld('nome', e.target.value)} />
                        <input style={inputStyle} placeholder="Cognome *" value={f.cognome} onChange={e => setFld('cognome', e.target.value)} />
                      </div>
                      {/* Rubrica pill */}
                      <button style={{
                        width: '100%', border: '1.5px dashed rgba(31,111,120,0.4)', borderRadius: 12,
                        padding: '11px 14px', marginBottom: 8, cursor: 'pointer',
                        background: 'linear-gradient(160deg, rgba(220,236,237,0.4), rgba(197,221,222,0.4))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: "'Nunito', sans-serif", color: 'var(--teal-deep)', fontSize: 12, fontWeight: 700,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Scegli dalla rubrica
                      </button>
                      <input style={inputStyle} placeholder="Indirizzo lavori (Via, CAP, Città)" value={f.indirizzo} onChange={e => setFld('indirizzo', e.target.value)} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Telefono *" inputMode="tel" value={f.telefono} onChange={e => setFld('telefono', e.target.value)} />
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Email" inputMode="email" value={f.email} onChange={e => setFld('email', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Codice fiscale" value={f.codiceFiscale} onChange={e => setFld('codiceFiscale', e.target.value.toUpperCase())} />
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="P.IVA" inputMode="numeric" value={f.piva} onChange={e => setFld('piva', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 2 }} placeholder="Città residenza" value={f.citta} onChange={e => setFld('citta', e.target.value)} />
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="CAP" inputMode="numeric" value={f.cap} onChange={e => setFld('cap', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="PEC" inputMode="email" value={f.pec} onChange={e => setFld('pec', e.target.value)} />
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Codice SDI" value={f.sdi} onChange={e => setFld('sdi', e.target.value.toUpperCase())} />
                      </div>
                    </FormCard>

                    {/* Accordion: Accesso */}
                    <Accordion
                      id="section-accesso"
                      icon={<IcoAccesso />}
                      label="Accesso / Difficoltà salita"
                      badge={f.difficoltaSalita ? f.difficoltaSalita.toUpperCase() : undefined}
                      isOpen={accOpen['accesso']}
                      onToggle={() => toggleAcc('accesso')}
                    >
                      {/* Difficoltà 3 bottoni */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                        {[
                          { id: 'facile', label: 'Facile', activeClass: 'grn', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                          { id: 'media', label: 'Media', activeClass: 'ocra', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                          { id: 'difficile', label: 'Difficile', activeClass: 'red', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg> },
                        ].map(btn => {
                          const isActive = f.difficoltaSalita === btn.id
                          const activeBg = btn.activeClass === 'grn' ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : btn.activeClass === 'ocra' ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, var(--red), var(--red-deep))'
                          const activeShadow = btn.activeClass === 'grn' ? '0 6px 14px rgba(47,125,87,0.45)' : btn.activeClass === 'ocra' ? '0 6px 14px rgba(200,138,23,0.55)' : '0 6px 14px rgba(165,58,51,0.5)'
                          return (
                            <button key={btn.id} onClick={() => onDifficolta(btn.id as Difficolta)} style={{
                              border: 'none', cursor: 'pointer', borderRadius: 14, padding: '14px 4px 11px',
                              textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                              position: 'relative',
                              background: isActive ? activeBg : 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
                              boxShadow: isActive ? `0 0 0 1px rgba(0,0,0,0.05), inset 0 3px 5px rgba(255,255,255,0.22), inset 0 -3px 5px rgba(0,0,0,0.2), ${activeShadow}` : 'inset 0 3px 5px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.07), 0 3px 6px rgba(60,50,30,0.12)',
                              transform: isActive ? 'translateY(-1px)' : 'none',
                              transition: 'all 0.18s',
                              color: isActive ? '#fff' : 'var(--ink-dim)',
                            }}>
                              <div style={{ position: 'absolute', top: '14%', left: '22%', width: '32%', height: '18%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(2px)', pointerEvents: 'none' }} />
                              <div style={{ position: 'relative', zIndex: 1 }}>{btn.icon}</div>
                              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, position: 'relative', zIndex: 1, textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 0 rgba(255,255,255,0.4)' }}>
                                {btn.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={lblStyle}>Piano edificio</label>
                          <select style={selectStyle} value={f.pianoEdificio} onChange={e => setFld('pianoEdificio', e.target.value)}>
                            {PIANI.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={lblStyle}>Foro scale (cm)</label>
                          <input style={inputStyle} placeholder="es. 80×200" value={f.foroScale} onChange={e => setFld('foroScale', e.target.value)} />
                        </div>
                      </div>
                      <label style={lblStyle}>Mezzo di salita</label>
                      <select style={selectStyle} value={f.mezzoSalita} onChange={e => setFld('mezzoSalita', e.target.value)}>
                        {MEZZI.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </Accordion>

                    {/* Accordion: Tipo edificio */}
                    <Accordion
                      id="section-edificio"
                      icon={<IcoEdificio />}
                      label="Tipo edificio"
                      badge={f.tipoEdificio || undefined}
                      isOpen={accOpen['edificio']}
                      onToggle={() => toggleAcc('edificio')}
                    >
                      <label style={lblStyle}>Tipo edificio</label>
                      <select style={selectStyle} value={f.tipoEdificio} onChange={e => {
                        setFld('tipoEdificio', e.target.value)
                        if (e.target.value !== '') closeAcc('edificio')
                      }}>
                        {TIPI_EDIFICIO.map(t => <option key={t} value={t}>{t || '— seleziona —'}</option>)}
                      </select>
                    </Accordion>

                    {/* Accordion: Note */}
                    <Accordion
                      id="section-note"
                      icon={<IcoNote />}
                      label="Note"
                      isOpen={accOpen['note']}
                      onToggle={() => toggleAcc('note')}
                    >
                      <textarea
                        style={{ ...inputStyle, resize: 'none', minHeight: 80 } as React.CSSProperties}
                        placeholder="Note aggiuntive…"
                        value={f.note}
                        onChange={e => setFld('note', e.target.value)}
                      />
                    </Accordion>

                    {/* CTA */}
                    <BottomActions
                      codice={codice}
                      canSave={canSaveNuova}
                      saving={saving}
                      onSave={handleSaveNuova}
                      onBack={onClose}
                    />
                  </motion.div>
                )}

                {/* ── WIZARD RIPARAZIONE ── */}
                {tipo === 'riparazione' && (
                  <motion.div key="rip" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

                    {/* Stepper */}
                    <Stepper step={ripStep} />

                    {/* Step 0: Cliente */}
                    {ripStep === 0 && (
                      <FormCard>
                        <SectionLabel icon={<IcoUser />} label="CLIENTE" required />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input style={inputStyle} placeholder="Nome *" value={rip.nome} onChange={e => setRipFld('nome', e.target.value)} />
                          <input style={inputStyle} placeholder="Cognome *" value={rip.cognome} onChange={e => setRipFld('cognome', e.target.value)} />
                        </div>
                        <input style={inputStyle} placeholder="Telefono *" inputMode="tel" value={rip.telefono} onChange={e => setRipFld('telefono', e.target.value)} />
                        <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
                          ⚡ Compila i campi · prosegue da solo
                        </p>
                        <button
                          onClick={() => { if (rip.nome && rip.cognome) setRipStep(1) }}
                          disabled={!rip.nome || !rip.cognome}
                          style={{
                            ...ctaSaveStyle,
                            marginTop: 12,
                            opacity: (!rip.nome || !rip.cognome) ? 0.5 : 1,
                          }}>
                          Avanti →
                        </button>
                      </FormCard>
                    )}

                    {/* Step 1: Problema */}
                    {ripStep === 1 && (
                      <FormCard>
                        <SectionLabel icon={<IcoNote />} label="TIPO PROBLEMA" required />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {PROBLEMI_RIP.map(p => (
                            <button key={p} onClick={() => onTipoProblema(p)} style={chipStyle(rip.tipoProblema === p)}>
                              {p}
                            </button>
                          ))}
                        </div>

                        <div id="section-infisso" style={{ marginTop: 12 }}>
                          <SectionLabel icon={<IcoEdificio />} label="TIPO INFISSO" />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {INFISSI_RIP.map(i => (
                              <button key={i} onClick={() => onTipoInfisso(i)} style={chipStyle(rip.tipoInfisso === i)}>
                                {i}
                              </button>
                            ))}
                          </div>
                        </div>

                        <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
                          ⚡ Tap su tipo · prosegue al passo Dettagli
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button onClick={() => setRipStep(0)} style={ctaBackStyle}>← Indietro</button>
                          <button onClick={() => { if (rip.tipoProblema) setRipStep(2) }} disabled={!rip.tipoProblema}
                            style={{ ...ctaSaveStyle, flex: 1, opacity: !rip.tipoProblema ? 0.5 : 1 }}>
                            Avanti →
                          </button>
                        </div>
                      </FormCard>
                    )}

                    {/* Step 2: Dettagli */}
                    {ripStep === 2 && (
                      <FormCard>
                        {/* Urgenza */}
                        <SectionLabel icon={<IcoNote />} label="URGENZA" />
                        <div id="section-urgenza" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                          {[
                            { id: 'normale', label: 'Normale', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                            { id: 'media', label: 'Media', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                            { id: 'urgente', label: 'Urgente', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                          ].map(u => {
                            const isActive = rip.urgenza === u.id
                            return (
                              <button key={u.id} onClick={() => onUrgenza(u.id as Urgenza)} style={{
                                border: 'none', cursor: 'pointer', borderRadius: 14, padding: '12px 4px 10px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                                position: 'relative',
                                background: isActive ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
                                color: isActive ? '#fff' : 'var(--ink-dim)',
                                boxShadow: isActive ? '0 6px 14px rgba(200,138,23,0.5), inset 0 3px 5px rgba(255,255,255,0.28)' : 'inset 0 3px 5px rgba(255,255,255,0.55), 0 3px 6px rgba(60,50,30,0.12)',
                                transition: 'all 0.18s',
                              }}>
                                {u.icon}
                                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700 }}>{u.label}</span>
                              </button>
                            )
                          })}
                        </div>

                        <div id="section-chi-segnala">
                          <label style={lblStyle}>Chi segnala il problema</label>
                          <input style={inputStyle} placeholder="Es: Condomino, Proprietario, Admin…" value={rip.chiSegnala} onChange={e => setRipFld('chiSegnala', e.target.value)} />
                        </div>

                        <div id="section-descrizione">
                          <label style={lblStyle}>Descrizione problema</label>
                          <textarea
                            style={{ ...inputStyle, resize: 'none', minHeight: 80 } as React.CSSProperties}
                            placeholder="Descrivi il problema nel dettaglio…"
                            value={rip.descrizione}
                            onChange={e => setRipFld('descrizione', e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button onClick={() => setRipStep(1)} style={ctaBackStyle}>← Indietro</button>
                          <button onClick={() => setRipStep(3)} style={{ ...ctaSaveStyle, flex: 1 }}>
                            Avanti →
                          </button>
                        </div>
                      </FormCard>
                    )}

                    {/* Step 3: Foto (opzionale) */}
                    {ripStep === 3 && (
                      <FormCard>
                        <SectionLabel icon={<IcoNote />} label="FOTO (OPZIONALE)" />
                        <div style={{
                          height: 120, borderRadius: 14, border: '2px dashed rgba(60,50,30,0.2)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                          background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
                          color: 'var(--ink-dim)', marginBottom: 12,
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 600 }}>Tocca per aggiungere foto</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 1, color: 'var(--ink-soft)' }}>OPZIONALE</span>
                        </div>

                        <BottomActions
                          codice={codice}
                          canSave={canSaveRip}
                          saving={saving}
                          onSave={handleSaveRip}
                          onBack={() => setRipStep(2)}
                          labelSave="Crea riparazione"
                        />
                      </FormCard>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  )
}

// ── SUB-COMPONENTI ───────────────────────────────────────────────

const FormCard: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'relative', marginBottom: 12 }}>
    <div style={{ position: 'absolute', inset: -6, borderRadius: 28, background: 'var(--surface-2)', filter: 'blur(10px)', opacity: 0.45, zIndex: -1 }} />
    <div style={{
      background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
      borderRadius: 22, padding: 14, position: 'relative', overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(60,50,30,0.05), 0 10px 22px rgba(60,50,30,0.16), inset 0 4px 8px rgba(255,255,255,0.55)',
    }}>
      <div style={{ position: 'absolute', top: '6%', left: '10%', width: '28%', height: '14%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(10px)', pointerEvents: 'none' }} />
      {children}
    </div>
  </div>
)

const SectionLabel: FC<{ icon: React.ReactNode; label: string; required?: boolean }> = ({ icon, label, required }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 11, position: 'relative', zIndex: 2 }}>
    {icon} {label} {required && <span style={{ color: 'var(--red)', fontWeight: 800 }}>*</span>}
  </div>
)

const Accordion: FC<{ id: string; icon: React.ReactNode; label: string; badge?: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ id, icon, label, badge, isOpen, onToggle, children }) => (
  <div id={id} style={{ position: 'relative', marginBottom: 10 }}>
    <div style={{ position: 'absolute', inset: -5, borderRadius: 24, background: 'var(--surface-2)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1 }} />
    <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.05), 0 6px 14px rgba(60,50,30,0.12), inset 0 3px 6px rgba(255,255,255,0.5)' }}>
      <button onClick={onToggle} style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--teal-deep)', flexShrink: 0, position: 'relative', boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.55), 0 2px 4px rgba(60,50,30,0.1)' }}>
          <div style={{ position: 'absolute', top: '16%', left: '24%', width: '30%', height: '16%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(2px)' }} />
          {icon}
        </div>
        <span style={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,0.4)', textAlign: 'left' }}>{label}</span>
        {badge && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'var(--teal-bg)', color: 'var(--teal-deep)', letterSpacing: 0.5, boxShadow: 'inset 0 1px 2px rgba(20,80,90,0.15)' }}>{badge}</span>}
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--ink-dim)', flexShrink: 0, boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.5), 0 2px 4px rgba(60,50,30,0.12)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 14px 14px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
)

const Stepper: FC<{ step: RipStep }> = ({ step }) => {
  const steps = ['Cliente', 'Problema', 'Dettagli', 'Foto']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 800,
              background: i < step ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : i === step ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))' : 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
              color: i <= step ? '#fff' : 'var(--ink-dim)',
              boxShadow: i < step ? '0 3px 7px rgba(47,125,87,0.4)' : i === step ? '0 4px 10px rgba(200,138,23,0.5)' : 'inset 0 2px 3px rgba(255,255,255,0.55), 0 2px 4px rgba(60,50,30,0.1)',
              textShadow: i <= step ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 0 rgba(255,255,255,0.4)',
            }}>{i < step ? '✓' : i + 1}</div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: i === step ? 'var(--ocra-deep)' : 'var(--ink-dim)', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 3, margin: '0 -2px 14px', borderRadius: 999, background: i < step ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, rgba(60,50,30,0.12), rgba(60,50,30,0.18))', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)', zIndex: -1 }} />
          )}
        </div>
      ))}
    </div>
  )
}

const BottomActions: FC<{ codice: string; canSave: boolean; saving: boolean; onSave: () => void; onBack: () => void; labelSave?: string }> = ({ codice, canSave, saving, onSave, onBack, labelSave }) => (
  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {!canSave && (
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'var(--ink-dim)', textAlign: 'center', fontStyle: 'italic' }}>
        Compila Nome, Cognome e Telefono per continuare
      </p>
    )}
    <button onClick={onSave} disabled={!canSave || saving} style={{ ...ctaSaveStyle, opacity: (!canSave || saving) ? 0.6 : 1, cursor: (!canSave || saving) ? 'not-allowed' : 'pointer' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      {saving ? 'Salvataggio…' : `${labelSave ?? 'Crea commessa'} ${codice}`}
    </button>
    <button onClick={onBack} style={ctaBackStyle}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      Annulla
    </button>
  </div>
)

// Chip style helper
const chipStyle = (isActive: boolean): React.CSSProperties => ({
  border: 'none', cursor: 'pointer', borderRadius: 999, padding: '7px 13px',
  fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, position: 'relative',
  background: isActive ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  color: isActive ? '#fff' : 'var(--ink-dim)',
  boxShadow: isActive ? 'inset 0 2px 4px rgba(255,255,255,0.22), 0 4px 10px rgba(20,80,90,0.4)' : 'inset 0 2px 4px rgba(255,255,255,0.5), 0 2px 4px rgba(60,50,30,0.1)',
  textShadow: isActive ? '0 1px 1px rgba(0,0,0,0.25)' : '0 1px 0 rgba(255,255,255,0.4)',
  transition: 'all 0.18s',
})

const lblStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
  color: 'var(--ink-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5, marginTop: 8,
}

const ctaSaveStyle: React.CSSProperties = {
  width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '15px 16px',
  background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700,
  textShadow: '0 1px 2px rgba(0,0,0,0.25)', position: 'relative',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 6px 14px rgba(20,80,90,0.45), inset 0 3px 6px rgba(255,255,255,0.22), inset 0 -3px 6px rgba(0,0,0,0.2)',
}

const ctaBackStyle: React.CSSProperties = {
  width: '100%', border: 'none', cursor: 'pointer', borderRadius: 14, padding: '13px 16px',
  background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))', color: 'var(--ink-2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
  textShadow: '0 1px 0 rgba(255,255,255,0.4)',
  boxShadow: '0 0 0 1px rgba(60,50,30,0.05), 0 4px 10px rgba(60,50,30,0.15), inset 0 3px 6px rgba(255,255,255,0.6)',
}
