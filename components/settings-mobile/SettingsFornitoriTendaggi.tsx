// components/settings-mobile/SettingsFornitoriTendaggi.tsx
// CRUD anagrafica fornitori tendaggi.

'use client'

import React, { useEffect, useState } from 'react'
import { T } from '../home-mobile/HomeUI'
import { getAziendaId } from '@/lib/supabase-sync'

interface Fornitore {
  id: string
  azienda_id: string
  nome: string
  partita_iva: string | null
  codice_fiscale: string | null
  sito_web: string | null
  email: string | null
  pec: string | null
  telefono: string | null
  indirizzo: string | null
  citta: string | null
  cap: string | null
  provincia: string | null
  referente_nome: string | null
  referente_email: string | null
  referente_telefono: string | null
  sconto_default_pct: number | null
  ricarico_default_pct: number | null
  condizioni_pagamento: string | null
  tempo_consegna_giorni: number | null
  note: string | null
  attivo: boolean
  ordine: number | null
}

export default function SettingsFornitoriTendaggi({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Fornitore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Fornitore | null>(null)
  const [aziendaId, setAziendaId] = useState<string | null>(null)

  useEffect(() => { (async () => {
    try {
      const id = await getAziendaId()
      setAziendaId(id)
      const { supabase: sb } = await import('@/lib/supabase')
      const { data } = await sb.from('fornitori_tendaggi').select('*').order('ordine', { ascending: true })
      setItems((data || []) as Fornitore[])
    } catch (e) { console.error(e) }
    setLoading(false)
  })() }, [])

  const aggiungi = async () => {
    if (!aziendaId) { alert('Azienda non identificata. Riapri.'); return }
    const { supabase: sb } = await import('@/lib/supabase')
    const nuovo: any = { azienda_id: aziendaId, nome: 'Nuovo fornitore ' + Date.now().toString().slice(-4), attivo: true }
    const { data, error } = await sb.from('fornitori_tendaggi').insert([nuovo]).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => [...prev, data as Fornitore])
    setSelected(data as Fornitore)
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo fornitore?')) return
    const { supabase: sb } = await import('@/lib/supabase')
    const { error } = await sb.from('fornitori_tendaggi').delete().eq('id', id)
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.filter(x => x.id !== id))
    setSelected(null)
  }

  const salva = async (f: Fornitore) => {
    const { supabase: sb } = await import('@/lib/supabase')
    const patch: any = { ...f, updated_at: new Date().toISOString() }
    delete patch.id; delete patch.azienda_id
    const { data, error } = await sb.from('fornitori_tendaggi').update(patch).eq('id', f.id).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.map(x => x.id === f.id ? data as Fornitore : x))
    setSelected(null)
  }

  const filtrati = items.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.nome.toLowerCase().includes(q) || (f.citta || '').toLowerCase().includes(q) || (f.partita_iva || '').toLowerCase().includes(q)
  })

  if (selected) return <DettaglioFornitore f={selected} onSave={salva} onCancel={() => setSelected(null)} onDelete={() => elimina(selected.id)} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <Header onBack={onBack} totale={items.length} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome, citta, P.IVA…"
          style={{ padding: '12px 14px', border: `1px solid ${T.bdr}`, borderRadius: 12, fontSize: 14, outline: 'none', background: '#FFF' }} />
        <button onClick={aggiungi} style={{
          background: '#28A0A0', color: '#FFF', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow,
        }}>+ Aggiungi fornitore</button>
        {loading && <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>Caricamento…</div>}
        {!loading && filtrati.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>Nessun fornitore. Aggiungi il primo.</div>
        )}
        {filtrati.map(f => (
          <button key={f.id} onClick={() => setSelected(f)} style={{
            background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 14, padding: 12,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            opacity: f.attivo ? 1 : 0.5, boxShadow: T.shadow, width: '100%',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#28A0A015', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#28A0A0', flexShrink: 0 }}>
              {f.nome.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nome}</div>
              <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.citta || ''}{f.partita_iva ? ' · P.IVA ' + f.partita_iva : ''}{f.tempo_consegna_giorni ? ' · ' + f.tempo_consegna_giorni + 'gg' : ''}
              </div>
            </div>
            {f.sconto_default_pct ? <div style={{ fontSize: 12, fontWeight: 700, color: '#28A0A0' }}>-{f.sconto_default_pct}%</div> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

function DettaglioFornitore({ f, onSave, onCancel, onDelete }: { f: Fornitore; onSave: (f: Fornitore) => void; onCancel: () => void; onDelete: () => void }) {
  const [data, setData] = useState<Fornitore>(f)
  const set = (k: keyof Fornitore, v: any) => setData(prev => ({ ...prev, [k]: v }))
  const [tab, setTab] = useState<'anagrafica' | 'commerciale' | 'note'>('anagrafica')

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 140 }}>
      <Header onBack={onCancel} totale={null} titolo="Modifica fornitore" />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['anagrafica', 'commerciale', 'note'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10,
              border: `1px solid ${tab === t ? '#28A0A0' : T.bdr}`,
              background: tab === t ? '#28A0A0' : '#FFF',
              color: tab === t ? '#FFF' : T.text,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'anagrafica' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nome / Ragione sociale"><input value={data.nome} onChange={e => set('nome', e.target.value)} style={inp} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Partita IVA"><input value={data.partita_iva || ''} onChange={e => set('partita_iva', e.target.value)} style={inp} /></Field>
              <Field label="Codice Fiscale"><input value={data.codice_fiscale || ''} onChange={e => set('codice_fiscale', e.target.value)} style={inp} /></Field>
            </div>
            <Field label="Sito web"><input value={data.sito_web || ''} onChange={e => set('sito_web', e.target.value)} placeholder="https://" style={inp} /></Field>
            <Field label="Email"><input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} style={inp} /></Field>
            <Field label="PEC"><input value={data.pec || ''} onChange={e => set('pec', e.target.value)} style={inp} /></Field>
            <Field label="Telefono"><input value={data.telefono || ''} onChange={e => set('telefono', e.target.value)} style={inp} /></Field>
            <Field label="Indirizzo"><input value={data.indirizzo || ''} onChange={e => set('indirizzo', e.target.value)} style={inp} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 8 }}>
              <Field label="Citta"><input value={data.citta || ''} onChange={e => set('citta', e.target.value)} style={inp} /></Field>
              <Field label="CAP"><input value={data.cap || ''} onChange={e => set('cap', e.target.value)} style={inp} /></Field>
              <Field label="Prov"><input value={data.provincia || ''} onChange={e => set('provincia', e.target.value)} maxLength={2} style={inp} /></Field>
            </div>
            <div style={{ paddingTop: 10, borderTop: `1px solid ${T.bdr}`, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.4 }}>Referente commerciale</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Field label="Nome referente"><input value={data.referente_nome || ''} onChange={e => set('referente_nome', e.target.value)} style={inp} /></Field>
                <Field label="Email referente"><input value={data.referente_email || ''} onChange={e => set('referente_email', e.target.value)} style={inp} /></Field>
                <Field label="Telefono referente"><input value={data.referente_telefono || ''} onChange={e => set('referente_telefono', e.target.value)} style={inp} /></Field>
              </div>
            </div>
          </div>
        )}

        {tab === 'commerciale' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: '#F7FAFA', borderRadius: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.4 }}>Sconti e ricarichi default</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Sconto fornitore %">
                  <input type="number" step="0.5" value={data.sconto_default_pct ?? ''} onChange={e => set('sconto_default_pct', e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="0" style={inp} />
                </Field>
                <Field label="Ricarico mio %">
                  <input type="number" step="0.5" value={data.ricarico_default_pct ?? ''} onChange={e => set('ricarico_default_pct', e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="0" style={inp} />
                </Field>
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 6, lineHeight: 1.4 }}>
                ⓘ Sconto = quanto ti tolgono dal listino. Ricarico = quanto aggiungi tu sopra il netto.
              </div>
            </div>
            <Field label="Condizioni pagamento">
              <input value={data.condizioni_pagamento || ''} onChange={e => set('condizioni_pagamento', e.target.value)} placeholder="Es. 30gg DF FM" style={inp} />
            </Field>
            <Field label="Tempo consegna (giorni)">
              <input type="number" value={data.tempo_consegna_giorni ?? ''} onChange={e => set('tempo_consegna_giorni', e.target.value === '' ? null : parseInt(e.target.value))} placeholder="20" style={inp} />
            </Field>
          </div>
        )}

        {tab === 'note' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Note libere"><textarea rows={6} value={data.note || ''} onChange={e => set('note', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></Field>
            <Field label="Attivo">
              <button onClick={() => set('attivo', !data.attivo)} style={{
                padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.bdr}`,
                background: data.attivo ? '#28A0A020' : '#FFF', color: data.attivo ? '#28A0A0' : T.muted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{data.attivo ? '● Attivo' : '○ Disattivato'}</button>
            </Field>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onDelete} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${T.bdr}`, background: '#FFF', color: '#C0392B', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Elimina</button>
          <button onClick={() => onSave(data)} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#28A0A0', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow }}>Salva</button>
        </div>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 12px', border: `1px solid ${T.bdr}`,
  borderRadius: 10, fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
      {children}
    </label>
  )
}

function Header({ onBack, totale, titolo = 'Fornitori Tendaggi' }: { onBack: () => void; totale: number | null; titolo?: string }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, #28A0A0 0%, #1a7575 100%)`,
      padding: '14px 16px 22px', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, color: '#FFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', width: 34, height: 34, borderRadius: 10, color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>‹</button>
        <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: 0.3, opacity: 0.85 }}>filwoX</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{titolo}</div>
      {totale != null && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 5 }}>{totale} fornitori in anagrafica</div>}
    </div>
  )
}
