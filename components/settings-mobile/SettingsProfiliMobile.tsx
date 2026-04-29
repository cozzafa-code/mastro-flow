// components/settings-mobile/SettingsProfiliMobile.tsx
// Catalogo Profili mobile cablato Supabase tabella profili_catalogo.

'use client'

import React, { useEffect, useState } from 'react'
import { T, numStyle } from '../home-mobile/HomeUI'
import { useMastro } from '../MastroContext'

interface Profilo {
  id: number
  azienda_id: string | null
  sistema_id: string | null
  codice: string | null
  nome: string
  tipo: string | null
  materiale: string | null
  marca: string | null
  profondita_mm: number | null
  camere: number | null
  uf: number | null
  peso_kg_ml: number | null
  immagine_url: string | null
  dxf_url: string | null
  pdf_url: string | null
  note: string | null
  attivo: boolean
}

export default function SettingsProfiliMobile({ onBack }: { onBack: () => void }) {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [profili, setProfili] = useState<Profilo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Profilo | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { supabase: sb } = await import('@/lib/supabase')
        const { data, error } = await sb.from('profili_catalogo').select('*').order('nome')
        if (!mounted) return
        if (error) console.error('profili_catalogo error', error)
        else setProfili((data as Profilo[]) || [])
      } catch (e) { console.error('Errore caricamento profili', e) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const aggiorna = async (p: Profilo) => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const { error } = await sb.from('profili_catalogo').update(p).eq('id', p.id)
      if (error) { alert('Errore salvataggio: ' + error.message); return }
      setProfili(prev => prev.map(x => x.id === p.id ? p : x))
      setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const elimina = async (id: number) => {
    if (!confirm('Eliminare questo profilo?')) return
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const { error } = await sb.from('profili_catalogo').delete().eq('id', id)
      if (error) { alert('Errore: ' + error.message); return }
      setProfili(prev => prev.filter(x => x.id !== id))
      setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const aggiungi = async () => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const azienda_id = ctx?.aziendaIdReal || ctx?.aziendaInfo?.id || "demo"
      const nuovo = { nome: 'Nuovo profilo', materiale: 'PVC', tipo: 'telaio', attivo: true, azienda_id }
      const { data, error } = await sb.from('profili_catalogo').insert([nuovo]).select().single()
      if (error) { alert('Errore: ' + error.message); return }
      setProfili(prev => [...prev, data as Profilo])
      setSelected(data as Profilo)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const filtrati = profili.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.nome || '').toLowerCase().includes(q) || (p.codice || '').toLowerCase().includes(q)
  })

  if (selected) {
    return <DettaglioProfilo
      profilo={selected}
      onBack={() => setSelected(null)}
      onSave={aggiorna}
      onDelete={() => elimina(selected.id)}
    />
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      <HeaderProfili onBack={onBack} totale={profili.length} />

      <div style={{ padding: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome o codice..."
          style={{
            width: '100%', padding: '12px 14px',
            border: `1px solid ${T.bdr}`, borderRadius: 12,
            fontSize: 14, background: '#FFF', outline: 'none',
            marginBottom: 12, boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <Kpi value={profili.length} label="Totali" color={T.acc} />
          <Kpi value={profili.filter(p => p.attivo !== false).length} label="Attivi" color={T.numTeal} />
          <Kpi value={profili.filter(p => p.dxf_url || p.pdf_url || p.immagine_url).length} label="Con file" color={T.numBlue} />
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13 }}>Carico catalogo...</div>
        ) : filtrati.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13 }}>
            {profili.length === 0 ? 'Nessun profilo nel catalogo' : 'Nessun profilo trovato'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrati.map(p => <RigaProfilo key={p.id} p={p} onClick={() => setSelected(p)} />)}
          </div>
        )}

        <button onClick={aggiungi} style={{
          width: '100%', marginTop: 14,
          background: T.acc, color: '#FFF', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(15,118,110,0.15)',
        }}>+ AGGIUNGI PROFILO</button>
      </div>
    </div>
  )
}

function HeaderProfili({ onBack, totale }: { onBack: () => void; totale: number }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
      padding: '14px 16px 24px',
      borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      color: '#FFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.18)', border: 'none',
          width: 36, height: 36, borderRadius: 10,
          color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
        }}>â€¹</button>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Impostazioni â€º Catalogo</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', WebkitFontSmoothing: 'antialiased' }}>Profili</div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{totale} {totale === 1 ? 'profilo' : 'profili'} in catalogo</div>
    </div>
  )
}

function Kpi({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 12, padding: 12, textAlign: 'center' }}>
      <div style={numStyle(20, color)}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function RigaProfilo({ p, onClick }: { p: Profilo; onClick: () => void }) {
  const haFile = !!(p.dxf_url || p.pdf_url || p.immagine_url)
  const inattivo = p.attivo === false
  return (
    <button onClick={onClick} style={{
      background: '#FFF', border: `1px solid ${T.bdr}`,
      borderRadius: 12, padding: 12,
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer', width: '100%', textAlign: 'left',
      opacity: inattivo ? 0.5 : 1,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: T.tealSoft, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: T.numTeal, flexShrink: 0,
      }}>
        {p.materiale ? p.materiale.slice(0, 3).toUpperCase() : '???'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</div>
        <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.codice ? `${p.codice} Â· ` : ''}{p.tipo || 'Senza tipo'}
          {p.profondita_mm ? ` Â· ${p.profondita_mm}mm` : ''}
        </div>
      </div>
      {haFile && <span style={{ background: T.blueSoft, color: T.numBlue, fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 5 }}>FILE</span>}
      <div style={{ color: T.acc, fontSize: 18, fontWeight: 700 }}>â€º</div>
    </button>
  )
}

function DettaglioProfilo({ profilo, onBack, onSave, onDelete }: {
  profilo: Profilo; onBack: () => void; onSave: (p: Profilo) => void; onDelete: () => void
}) {
  const [p, setP] = useState<Profilo>(profilo)
  const f = (k: keyof Profilo) => (v: any) => setP(prev => ({ ...prev, [k]: v }))

  const uploadFile = (campo: 'immagine_url' | 'dxf_url' | 'pdf_url') => (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => f(campo)(ev.target?.result)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <div style={{
        background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
        padding: '14px 16px 22px',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        color: '#FFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.18)', border: 'none',
            width: 36, height: 36, borderRadius: 10,
            color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          }}>â€¹</button>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Profili â€º Dettaglio</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{p.nome || 'Senza nome'}</div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome" value={p.nome || ''} onChange={f('nome')} />
        <Field label="Codice" value={p.codice || ''} onChange={f('codice')} />
        <Row>
          <Field label="Materiale" value={p.materiale || ''} onChange={f('materiale')} />
          <Field label="Marca" value={p.marca || ''} onChange={f('marca')} />
        </Row>
        <Field label="Tipo" value={p.tipo || ''} onChange={f('tipo')} placeholder="telaio, anta, traverso..." />
        <Row>
          <Field label="Profondita mm" value={p.profondita_mm ?? ''} onChange={v => f('profondita_mm')(v === '' ? null : Number(v))} type="number" />
          <Field label="Camere" value={p.camere ?? ''} onChange={v => f('camere')(v === '' ? null : Number(v))} type="number" />
        </Row>
        <Row>
          <Field label="Uf (W/m2K)" value={p.uf ?? ''} onChange={v => f('uf')(v === '' ? null : Number(v))} type="number" />
          <Field label="Peso kg/ml" value={p.peso_kg_ml ?? ''} onChange={v => f('peso_kg_ml')(v === '' ? null : Number(v))} type="number" />
        </Row>

        <FileBox label="IMMAGINE" url={p.immagine_url} accept="image/*" onChange={uploadFile('immagine_url')} />
        <FileBox label="FILE DXF" url={p.dxf_url} accept=".dxf,.dwg" onChange={uploadFile('dxf_url')} />
        <FileBox label="FILE PDF" url={p.pdf_url} accept=".pdf" onChange={uploadFile('pdf_url')} />

        <div style={{
          background: '#FFF', border: `1px solid ${T.bdr}`,
          borderRadius: 12, padding: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Profilo attivo</span>
          <button onClick={() => f('attivo')(!p.attivo)} style={{
            width: 48, height: 28, borderRadius: 14,
            background: p.attivo !== false ? T.acc : T.bdr,
            border: 'none', cursor: 'pointer', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 2,
              left: p.attivo !== false ? 22 : 2,
              width: 24, height: 24, borderRadius: '50%',
              background: '#FFF', transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={() => onSave(p)} style={{
            flex: 1, background: T.acc, color: '#FFF',
            border: 'none', borderRadius: 12, padding: 14,
            fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer',
          }}>SALVA</button>
          <button onClick={onDelete} style={{
            background: '#FFF', color: T.numRed,
            border: `1px solid ${T.numRed}40`, borderRadius: 12, padding: '14px 18px',
            fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer',
          }}>ELIMINA</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: any; onChange: (v: any) => void; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px',
          border: `1px solid ${T.bdr}`, borderRadius: 10,
          fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>
}

function FileBox({ label, url, accept, onChange }: {
  label: string; url: string | null; accept: string; onChange: (e: any) => void;
}) {
  const ha = !!url
  return (
    <label style={{
      background: ha ? T.tealSoft : '#FFF',
      border: `1px solid ${ha ? T.numTeal + '40' : T.bdr}`,
      borderRadius: 12, padding: 14,
      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: ha ? T.numTeal : T.bdr, color: '#FFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700,
      }}>{ha ? 'âœ“' : '+'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.4 }}>{label}</div>
        <div style={{ fontSize: 12, color: ha ? T.numTeal : T.muted, fontWeight: 500 }}>
          {ha ? 'Caricato Â· tap per cambiare' : 'Tocca per caricare'}
        </div>
      </div>
      <input type="file" accept={accept} onChange={onChange} style={{ display: 'none' }} />
    </label>
  )
}