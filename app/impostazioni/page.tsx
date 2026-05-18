'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/app/components/Topbar'
import { BottomNav } from '@/app/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

interface Azienda {
  ragione: string; nome: string; piva: string; partita_iva: string
  codice_fiscale: string; indirizzo: string; citta: string; cap: string
  provincia: string; telefono: string; email: string; website: string
  iban: string; cciaa: string; logo_url: string
  enea_user: string; enea_codice_fiscale: string
}

const EMPTY: Azienda = { ragione: '', nome: '', piva: '', partita_iva: '', codice_fiscale: '', indirizzo: '', citta: '', cap: '', provincia: '', telefono: '', email: '', website: '', iban: '', cciaa: '', logo_url: '', enea_user: '', enea_codice_fiscale: '' }

export default function ImpostazioniPage() {
  const router = useRouter()
  const [az, setAz] = useState<Azienda>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [section, setSection] = useState<'azienda' | 'mail' | 'altro'>('azienda')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/azienda').then(r => r.json()).then(j => {
      if (j.azienda) setAz({ ...EMPTY, ...j.azienda })
      setLoading(false)
    })
  }, [])

  const setF = (k: keyof Azienda, v: string) => setAz(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/azienda', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ragione: az.ragione, nome: az.nome, piva: az.piva || az.partita_iva, codice_fiscale: az.codice_fiscale, indirizzo: az.indirizzo, citta: az.citta, cap: az.cap, provincia: az.provincia, telefono: az.telefono, email: az.email, website: az.website, iban: az.iban, cciaa: az.cciaa }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const sb = createClient()
    const path = `loghi/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await sb.storage.from('azienda-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = sb.storage.from('azienda-assets').getPublicUrl(path)
      setF('logo_url', publicUrl)
      await fetch('/api/azienda', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: publicUrl }) })
    }
    setLogoUploading(false)
  }

  const handleEsci = () => router.push('/login')

  if (loading) return (
    <div className="phone-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="phone-screen">
      <Topbar notificheCount={0} onSearchOpen={() => {}} />

      <div className="page">
        {/* Header */}
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>— IMPOSTAZIONI</div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.5, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>Configurazione</div>
        </div>

        {/* Tab sezioni */}
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{ background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', borderRadius: 14, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.12)' }}>
            {[{ id: 'azienda', label: 'Azienda' }, { id: 'mail', label: 'Mail' }, { id: 'altro', label: 'Altro' }].map(t => (
              <button key={t.id} onClick={() => setSection(t.id as any)} style={{ padding: '9px 8px', border: 'none', background: section === t.id ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'transparent', fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, color: section === t.id ? '#fff' : 'var(--ink-dim)', cursor: 'pointer', borderRadius: 11, boxShadow: section === t.id ? 'inset 0 1.5px 3px rgba(255,255,255,0.25), 0 4px 9px rgba(20,80,90,0.45)' : 'none', textShadow: section === t.id ? '0 1px 1.5px rgba(0,0,0,0.25)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 20px 110px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── SEZIONE AZIENDA ── */}
          {section === 'azienda' && (
            <>
              {/* Logo */}
              <SecCard title="Logo aziendale" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} color="violet">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Preview logo */}
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', border: '2px dashed rgba(60,50,30,0.2)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(60,50,30,0.08)' }}>
                    {az.logo_url ? <img src={az.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                      {az.logo_url ? 'Logo caricato ✓' : 'Nessun logo'}
                    </div>
                    <button onClick={() => fileRef.current?.click()} disabled={logoUploading} style={{ border: 'none', cursor: 'pointer', borderRadius: 10, padding: '8px 14px', background: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)', fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55)' }}>
                      {logoUploading ? 'Caricamento…' : 'Carica logo'}
                    </button>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', marginTop: 5, letterSpacing: 0.5 }}>PNG/SVG · max 2MB · usato su documenti e preventivi</div>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </SecCard>

              {/* Info azienda */}
              <SecCard title="Dati azienda" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} color="teal">
                <Campo label="RAGIONE SOCIALE" value={az.ragione} onChange={v => setF('ragione', v)} placeholder="Es: Infissi Rossi S.r.l." />
                <Campo label="P.IVA" value={az.piva || az.partita_iva} onChange={v => setF('piva', v)} placeholder="IT00000000000" inputMode="numeric" />
                <Campo label="CODICE FISCALE" value={az.codice_fiscale} onChange={v => setF('codice_fiscale', v.toUpperCase())} placeholder="RSSMRC80A01F205Z" />
                <Campo label="CCIAA / REA" value={az.cciaa} onChange={v => setF('cciaa', v)} placeholder="CS-123456" />
              </SecCard>

              {/* Sede */}
              <SecCard title="Sede" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} color="ocra">
                <Campo label="INDIRIZZO" value={az.indirizzo} onChange={v => setF('indirizzo', v)} placeholder="Via Roma, 1" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 2 }}><Campo label="CITTÀ" value={az.citta} onChange={v => setF('citta', v)} placeholder="Cosenza" /></div>
                  <div style={{ flex: 1 }}><Campo label="CAP" value={az.cap} onChange={v => setF('cap', v)} placeholder="87100" inputMode="numeric" /></div>
                  <div style={{ flex: 1 }}><Campo label="PROV" value={az.provincia} onChange={v => setF('provincia', v.toUpperCase())} placeholder="CS" /></div>
                </div>
              </SecCard>

              {/* Contatti */}
              <SecCard title="Contatti" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.12 3 2 2 0 012.1 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.66-.66a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>} color="blue">
                <Campo label="TELEFONO" value={az.telefono} onChange={v => setF('telefono', v)} placeholder="+39 0984 000000" inputMode="tel" />
                <Campo label="EMAIL" value={az.email} onChange={v => setF('email', v)} placeholder="info@azienda.it" inputMode="email" />
                <Campo label="SITO WEB" value={az.website} onChange={v => setF('website', v)} placeholder="www.azienda.it" />
                <Campo label="IBAN" value={az.iban} onChange={v => setF('iban', v.toUpperCase())} placeholder="IT60X0542811101000000123456" />
              </SecCard>

              {/* CTA salva */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -6, borderRadius: 22, background: saved ? 'var(--success)' : 'var(--teal)', filter: 'blur(12px)', opacity: 0.5, zIndex: -1, transition: 'background 0.3s' }} />
                <button onClick={handleSave} disabled={saving} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '15px', background: saved ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 8px 18px rgba(20,80,90,0.5), inset 0 3px 5px rgba(255,255,255,0.22)', transition: 'all 0.3s' }}>
                  {saved ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Salvato!</> : saving ? 'Salvataggio…' : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Salva dati azienda</>}
                </button>
              </div>
            </>
          )}

          {/* ── SEZIONE MAIL ── */}
          {section === 'mail' && (
            <SecCard title="Impostazioni mail" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} color="blue">
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--ink-dim)', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📬</div>
                Configurazione SMTP in arrivo
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', marginTop: 6, letterSpacing: 1 }}>COMING SOON</div>
              </div>
            </SecCard>
          )}

          {/* ── SEZIONE ALTRO ── */}
          {section === 'altro' && (
            <SecCard title="Altro" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>} color="gray">
              <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--ink-dim)', fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>⚙️</div>
                Altre impostazioni in arrivo
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', marginTop: 6, letterSpacing: 1 }}>COMING SOON</div>
              </div>
            </SecCard>
          )}

          {/* ESCI — sempre visibile */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -5, borderRadius: 20, background: 'var(--red)', filter: 'blur(10px)', opacity: 0.35, zIndex: -1 }} />
            <button onClick={handleEsci} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '14px', background: 'linear-gradient(160deg, var(--red-bg), var(--red-mid))', color: 'var(--red-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, boxShadow: '0 0 0 1px rgba(200,73,65,0.15), 0 5px 12px rgba(200,73,65,0.2), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Esci dall'app
            </button>
          </div>

          {/* Versione */}
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', letterSpacing: 1, paddingBottom: 8 }}>
            fliwoX · v0.1.0 · mastro-flow
          </div>
        </div>
      </div>

      <BottomNav mailCount={0} />
    </div>
  )
}

// ── SUB-COMPONENTI ────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; color: string }> = {
  violet: { bg: 'linear-gradient(160deg, #E8DFF4, #D5C5E5)', color: '#6B4F9C' },
  teal:   { bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)' },
  ocra:   { bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: 'var(--ocra-deep)' },
  blue:   { bg: 'linear-gradient(160deg, var(--blue-bg), #C5CCE5)', color: 'var(--blue-deep)' },
  gray:   { bg: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: 'var(--ink-2)' },
}

function SecCard({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  const c = COLOR_MAP[color] || COLOR_MAP.gray
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: -4, borderRadius: 22, background: 'var(--surface-2)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1 }} />
      <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', borderRadius: 18, padding: '14px', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 6px 14px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.6)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '5%', left: '8%', width: '26%', height: '12%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(8px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, position: 'relative', zIndex: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: c.bg, color: c.color, display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.07)' }}>{icon}</div>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,0.45)' }}>{title}</span>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
      </div>
    </div>
  )
}

function Campo({ label, value, onChange, placeholder, inputMode }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <input
        value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} inputMode={inputMode}
        style={{ width: '100%', border: 'none', borderRadius: 12, padding: '11px 13px', fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--ink)', outline: 'none', background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1), inset 0 -1px 2px rgba(255,255,255,0.4)' }}
      />
    </div>
  )
}
