'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

// â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Settore = 'serramenti' | 'tendaggi' | 'fabbro' | 'zanzariere' | 'pergole'

interface OnboardingData {
  ragione_sociale: string
  piva: string
  settori: Settore[]
  nome_titolare: string
  telefono: string
  citta: string
}

const SETTORI_CONFIG: { id: Settore; label: string; emoji: string; desc: string }[] = [
  { id: 'serramenti', label: 'Serramenti', emoji: 'ðŸªŸ', desc: 'Finestre, porte, infissi PVC/alluminio/legno' },
  { id: 'tendaggi',   label: 'Tendaggi',   emoji: 'ðŸª„', desc: 'Tende, veneziane, oscuranti, tessuti' },
  { id: 'fabbro',     label: 'Fabbro',     emoji: 'âš™ï¸', desc: 'Cancelli, ringhiere, strutture metalliche' },
  { id: 'zanzariere', label: 'Zanzariere', emoji: 'ðŸ”²', desc: 'Zanzariere plissÃ©, avvolgibili, laterali' },
  { id: 'pergole',    label: 'Pergole',    emoji: 'ðŸ¡', desc: 'Pergole bioclimatiche, coperture, LED' },
]

const STEPS = [
  { n: 1, label: 'La tua azienda' },
  { n: 2, label: 'Settori di lavoro' },
  { n: 3, label: 'Contatti' },
  { n: 4, label: 'Riepilogo' },
]

// â”€â”€ ICONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IcoArrow = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
  </svg>
)
const IcoCheck = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const IcoStar = () => (
  <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

// â”€â”€ FIELD COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Field({
  label, value, onChange, placeholder, type = 'text', optional = false
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; optional?: boolean
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 8
      }}>
        {label} {optional && <span style={{ color: '#9B9B9B', fontWeight: 400, textTransform: 'none' }}>(opzionale)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '14px 16px',
          background: '#FAFAF8', border: '1.5px solid #E0DFD9',
          borderRadius: 10, fontSize: 15, color: '#1A1A1C',
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'inherit', transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#D08008' }}
        onBlur={e => { e.target.style.borderColor = '#E0DFD9' }}
      />
    </div>
  )
}

// â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ─── Lumina Design Tokens ────────────────────────────────
const L = {
  bg:          "#f9f9fb",
  surface:     "#ffffff",
  surfaceLow:  "#f3f3f5",
  surfaceMid:  "#eeeef0",
  primary:     "#031631",
  primaryCont: "#1a2b47",
  onPrimary:   "#ffffff",
  muted:       "#8293b4",
  text:        "#1a1c1d",
  sub:         "#44474d",
  placeholder: "#75777e",
  green:       "#1a9e73",
  red:         "#dc4444",
  amber:       "#e4c18c",
  amberBg:     "#ffdeac",
  border:      "rgba(197,198,206,0.25)",
  glass:       "rgba(255,255,255,0.85)",
} as const;
const SH = {
  ambient: "0 20px 40px rgba(26,28,29,0.04)",
  float:   "0 20px 40px rgba(26,28,29,0.08)",
  sm:      "0 2px 8px rgba(26,28,29,0.05)",
} as const;
// ─────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    ragione_sociale: '', piva: '', settori: [],
    nome_titolare: '', telefono: '', citta: '',
  })

  const set = (k: keyof OnboardingData, v: any) => setData(prev => ({ ...prev, [k]: v }))

  const toggleSettore = (s: Settore) => {
    set('settori', data.settori.includes(s)
      ? data.settori.filter(x => x !== s)
      : [...data.settori, s]
    )
  }

  // Validazione per step
  const canProceed = () => {
    if (step === 1) return data.ragione_sociale.trim().length > 0
    if (step === 2) return data.settori.length > 0
    if (step === 3) return data.nome_titolare.trim().length > 0
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non trovato')

      // Crea/aggiorna azienda
      const { data: azienda, error: errAz } = await supabase
        .from('aziende')
        .upsert({
          id: user.id, // temporaneo, verrÃ  sovrascritto
          ragione: data.ragione_sociale,
          piva: data.piva || null,
          settori: data.settori,
          citta: data.citta || null,
        })
        .select()
        .single()

      if (errAz) throw errAz

      // Aggiorna profilo titolare
      await supabase.from('profili').upsert({
        id: user.id,
        nome: data.nome_titolare,
        telefono: data.telefono || null,
        azienda_id: azienda.id,
        onboarding_completato: true,
      })

      setDone(true)
    } catch (err) {
      console.error('Onboarding error:', err)
    } finally {
      setLoading(false)
    }
  }

  // â”€â”€ DONE SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (done) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F2F1EC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{
          background: '#1A1A1C', borderRadius: 24, padding: '56px 48px',
          textAlign: 'center', maxWidth: 480, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        }}>
          <div style={{ color: '#D08008', marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <IcoStar />
          </div>
          <h2 style={{ color: '#F2F1EC', fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>
            MASTRO Ã¨ pronto.
          </h2>
          <p style={{ color: '#9B9B9B', fontSize: 15, lineHeight: 1.6, margin: '0 0 32px' }}>
            Il tuo gestionale Ã¨ configurato e pronto all'uso.<br />
            Il tuo trial di <strong style={{ color: '#D08008' }}>30 giorni</strong> Ã¨ attivo.
          </p>

          {/* Checklist */}
          {[
            'Azienda configurata',
            `${data.settori.length} ${data.settori.length === 1 ? 'settore attivato' : 'settori attivati'}`,
            'Profilo titolare salvato',
            'Trial 30 giorni attivo',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: i < 3 ? '1px solid #2A2A2C' : 'none',
              textAlign: 'left',
            }}>
              <div style={{
                width: 24, height: 24, background: '#1A9E73',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#fff',
              }}>
                <IcoCheck />
              </div>
              <span style={{ color: '#F2F1EC', fontSize: 14 }}>{item}</span>
            </div>
          ))}

          <button
            onClick={() => router.push('/dashboard')}
            style={{
              marginTop: 32, width: '100%', padding: '16px',
              background: '#D08008', color: '#1A1A1C',
              border: 'none', borderRadius: 12, fontSize: 16,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Entra in MASTRO â†’
          </button>
        </div>
      </div>
    )
  }

  // â”€â”€ WIZARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div style={{
      minHeight: '100vh', background: '#F2F1EC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1A1A1C', borderRadius: 10, padding: '8px 16px',
            marginBottom: 24,
          }}>
            <span style={{ color: '#D08008', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
              MASTRO
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1A1A1C', margin: '0 0 8px' }}>
            Configura il tuo gestionale
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 15, margin: 0 }}>
            3 minuti e sei operativo.
          </p>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: step > s.n ? '#1A9E73' : step === s.n ? '#D08008' : '#E0DFD9',
                  color: step >= s.n ? '#fff' : '#9B9B9B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.3s',
                  flexShrink: 0,
                }}>
                  {step > s.n ? <IcoCheck /> : s.n}
                </div>
                <span style={{
                  fontSize: 10, marginTop: 4, color: step === s.n ? '#1A1A1C' : '#9B9B9B',
                  fontWeight: step === s.n ? 600 : 400, textAlign: 'center',
                  display: i < 3 ? undefined : 'none',
                }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  height: 2, flex: 1, margin: '0 4px',
                  background: step > s.n ? '#1A9E73' : '#E0DFD9',
                  transition: 'background 0.3s', marginBottom: 16,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '36px 36px 28px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>

          {/* STEP 1 â€” Azienda */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1C', margin: '0 0 6px' }}>
                La tua azienda
              </h2>
              <p style={{ color: '#6B6B6B', fontSize: 14, margin: '0 0 28px' }}>
                Questi dati appariranno sui tuoi preventivi e documenti.
              </p>
              <Field
                label="Ragione sociale *"
                value={data.ragione_sociale}
                onChange={v => set('ragione_sociale', v)}
                placeholder="es. Infissi Rossi SRL"
              />
              <Field
                label="Partita IVA"
                value={data.piva}
                onChange={v => set('piva', v)}
                placeholder="IT00000000000"
                optional
              />
            </div>
          )}

          {/* STEP 2 â€” Settori */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1C', margin: '0 0 6px' }}>
                Di cosa ti occupi?
              </h2>
              <p style={{ color: '#6B6B6B', fontSize: 14, margin: '0 0 24px' }}>
                Seleziona uno o piÃ¹ settori. MASTRO si adatta automaticamente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SETTORI_CONFIG.map(s => {
                  const sel = data.settori.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSettore(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${sel ? '#D08008' : '#E0DFD9'}`,
                        background: sel ? '#FFF8EC' : '#FAFAF8',
                        transition: 'all 0.15s', textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{s.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1C' }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{s.desc}</div>
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${sel ? '#D08008' : '#E0DFD9'}`,
                        background: sel ? '#D08008' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: '#fff', transition: 'all 0.15s',
                      }}>
                        {sel && <IcoCheck />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3 â€” Contatti */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1C', margin: '0 0 6px' }}>
                I tuoi dati
              </h2>
              <p style={{ color: '#6B6B6B', fontSize: 14, margin: '0 0 28px' }}>
                Usati per personalizzare la tua esperienza.
              </p>
              <Field
                label="Il tuo nome *"
                value={data.nome_titolare}
                onChange={v => set('nome_titolare', v)}
                placeholder="es. Marco Rossi"
              />
              <Field
                label="Telefono"
                value={data.telefono}
                onChange={v => set('telefono', v)}
                placeholder="+39 320 000 0000"
                optional
              />
              <Field
                label="CittÃ "
                value={data.citta}
                onChange={v => set('citta', v)}
                placeholder="es. Napoli"
                optional
              />
            </div>
          )}

          {/* STEP 4 â€” Riepilogo */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1C', margin: '0 0 6px' }}>
                Tutto pronto?
              </h2>
              <p style={{ color: '#6B6B6B', fontSize: 14, margin: '0 0 24px' }}>
                Controlla i dati prima di confermare.
              </p>
              {[
                { label: 'Azienda', value: data.ragione_sociale },
                { label: 'P.IVA', value: data.piva || 'â€”' },
                { label: 'Settori', value: data.settori.map(s => SETTORI_CONFIG.find(c => c.id === s)?.label).join(', ') },
                { label: 'Titolare', value: data.nome_titolare },
                { label: 'Telefono', value: data.telefono || 'â€”' },
                { label: 'CittÃ ', value: data.citta || 'â€”' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: i < 5 ? '1px solid #F2F1EC' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 14, color: '#1A1A1C', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div style={{
                marginTop: 20, padding: 14, background: '#FFF8EC',
                borderRadius: 10, border: '1px solid #F5D89A',
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#8B5E08' }}>
                  ðŸŽ‰ <strong>Trial gratuito di 30 giorni</strong> attivato automaticamente.
                  Nessuna carta di credito richiesta.
                </p>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 32,
          }}>
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              style={{
                padding: '12px 20px', background: 'transparent',
                border: '1.5px solid #E0DFD9', borderRadius: 10,
                fontSize: 14, color: step === 1 ? '#C0C0C0' : '#1A1A1C',
                cursor: step === 1 ? 'default' : 'pointer', fontFamily: 'inherit',
              }}
            >
              â† Indietro
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px',
                  background: canProceed() ? '#1A1A1C' : '#E0DFD9',
                  color: canProceed() ? '#fff' : '#9B9B9B',
                  border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  cursor: canProceed() ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                Continua <IcoArrow />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px',
                  background: loading ? '#E0DFD9' : '#D08008',
                  color: loading ? '#9B9B9B' : '#1A1A1C',
                  border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {loading ? 'Salvataggio...' : 'Attiva MASTRO â†’'}
              </button>
            )}
          </div>

        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9B9B9B', marginTop: 20 }}>
          Puoi modificare tutto in seguito da Impostazioni
        </p>
      </div>
    </div>
  )
}

