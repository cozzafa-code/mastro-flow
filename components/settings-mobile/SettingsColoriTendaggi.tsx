// components/settings-mobile/SettingsColoriTendaggi.tsx
// CRUD colori tendaggi - tabella colori_tendaggi.
// Walter aggiunge/modifica i colori che vende per ogni fornitore.

'use client'

import React, { useEffect, useState } from 'react'
import { T } from '../home-mobile/HomeUI'
import { getAziendaId } from '@/lib/supabase-sync'

interface Colore {
  id: string
  azienda_id: string
  fornitore: string
  codice: string
  nome: string
  hex: string | null
  tipo: 'standard' | 'speciale' | 'metallizzato' | 'strutturato' | 'tessuto'
  sovrapprezzo_pct: number | null
  sovrapprezzo_eur: number | null
  attivo: boolean
  ordine: number | null
}

const TIPI: Array<[Colore['tipo'], string, string]> = [
  ['standard', 'Standard', '#28A0A0'],
  ['speciale', 'Speciale', '#8B5CF6'],
  ['metallizzato', 'Metallizzato', '#F59E0B'],
  ['strutturato', 'Strutturato', '#EC4899'],
  ['tessuto', 'Tessuto', '#10B981'],
]

export default function SettingsColoriTendaggi({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Colore[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFornitore, setFiltroFornitore] = useState<string>('tutti')
  const [filtroTipo, setFiltroTipo] = useState<'tutti' | Colore['tipo']>('tutti')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Colore | null>(null)
  const [aziendaId, setAziendaId] = useState<string | null>(null)

  useEffect(() => { (async () => {
    try {
      const id = await getAziendaId()
      setAziendaId(id)
      const { supabase: sb } = await import('@/lib/supabase')
      const { data } = await sb.from('colori_tendaggi').select('*').order('fornitore', { ascending: true }).order('ordine', { ascending: true })
      setItems((data || []) as Colore[])
    } catch (e) { console.error(e) }
    setLoading(false)
  })() }, [])

  const aggiungi = async () => {
    if (!aziendaId) { alert('Azienda non identificata. Riapri.'); return }
    const { supabase: sb } = await import('@/lib/supabase')
    const nuovo: any = {
      azienda_id: aziendaId, fornitore: '', codice: 'NEW' + Date.now().toString().slice(-4),
      nome: 'Nuovo colore', hex: '#CCCCCC', tipo: 'standard',
      sovrapprezzo_pct: 0, sovrapprezzo_eur: 0, attivo: true,
    }
    const { data, error } = await sb.from('colori_tendaggi').insert([nuovo]).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => [...prev, data as Colore])
    setSelected(data as Colore)
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo colore?')) return
    const { supabase: sb } = await import('@/lib/supabase')
    const { error } = await sb.from('colori_tendaggi').delete().eq('id', id)
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.filter(x => x.id !== id))
    setSelected(null)
  }

  const salva = async (c: Colore) => {
    const { supabase: sb } = await import('@/lib/supabase')
    const patch: any = {
      fornitore: c.fornitore, codice: c.codice, nome: c.nome, hex: c.hex,
      tipo: c.tipo, sovrapprezzo_pct: c.sovrapprezzo_pct, sovrapprezzo_eur: c.sovrapprezzo_eur,
      attivo: c.attivo, updated_at: new Date().toISOString(),
    }
    const { data, error } = await sb.from('colori_tendaggi').update(patch).eq('id', c.id).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.map(x => x.id === c.id ? data as Colore : x))
    setSelected(null)
  }

  const fornitori = Array.from(new Set(items.map(c => c.fornitore).filter(Boolean))).sort()

  const filtrati = items.filter(c => {
    if (filtroFornitore !== 'tutti' && c.fornitore !== filtroFornitore) return false
    if (filtroTipo !== 'tutti' && c.tipo !== filtroTipo) return false
    if (!search) return true
    const q = search.toLowerCase()
    return c.codice.toLowerCase().includes(q) || c.nome.toLowerCase().includes(q) || c.fornitore.toLowerCase().includes(q)
  })

  const tipoColor = (t: string) => TIPI.find(x => x[0] === t)?.[2] || '#6b7280'
  const tipoLabel = (t: string) => TIPI.find(x => x[0] === t)?.[1] || t

  if (selected) return <DettaglioColore c={selected} onSave={salva} onCancel={() => setSelected(null)} onDelete={() => elimina(selected.id)} fornitori={fornitori} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <Header onBack={onBack} totale={items.length} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome, codice o fornitore…"
          style={{ padding: '12px 14px', border: `1px solid ${T.bdr}`, borderRadius: 12, fontSize: 14, outline: 'none', background: '#FFF' }} />

        {fornitori.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setFiltroFornitore('tutti')} style={chip(filtroFornitore === 'tutti', '#28A0A0')}>Tutti i fornitori</button>
            {fornitori.map(f => (
              <button key={f} onClick={() => setFiltroFornitore(f)} style={chip(filtroFornitore === f, '#28A0A0')}>{f}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFiltroTipo('tutti')} style={chip(filtroTipo === 'tutti', '#999')}>Tutti i tipi</button>
          {TIPI.map(([t, lab, col]) => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={chip(filtroTipo === t, col)}>{lab}</button>
          ))}
        </div>

        <button onClick={aggiungi} style={{
          background: '#28A0A0', color: '#FFF', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow,
        }}>+ Aggiungi colore</button>

        {loading && <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>Caricamento…</div>}
        {!loading && filtrati.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>
            Nessun colore. Aggiungi il primo o importa un catalogo demo da "Tendaggi".
          </div>
        )}
        {filtrati.map(c => (
          <button key={c.id} onClick={() => setSelected(c)} style={{
            background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 14, padding: 12,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            opacity: c.attivo ? 1 : 0.5, boxShadow: T.shadow, width: '100%',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: c.hex || '#CCCCCC',
              border: `2px solid ${tipoColor(c.tipo)}`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
              <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.fornitore || 'Senza fornitore'} · {c.codice} · <span style={{ color: tipoColor(c.tipo), fontWeight: 600 }}>{tipoLabel(c.tipo)}</span>
              </div>
            </div>
            {(c.sovrapprezzo_pct || c.sovrapprezzo_eur) ? (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#28A0A0', whiteSpace: 'nowrap' }}>
                {c.sovrapprezzo_pct ? `+${c.sovrapprezzo_pct}%` : ''}
                {c.sovrapprezzo_eur ? `+€${c.sovrapprezzo_eur}` : ''}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

function DettaglioColore({ c, onSave, onCancel, onDelete, fornitori }: { c: Colore; onSave: (c: Colore) => void; onCancel: () => void; onDelete: () => void; fornitori: string[] }) {
  const [f, setF] = useState<Colore>(c)
  const set = (k: keyof Colore, v: any) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 140 }}>
      <Header onBack={onCancel} totale={null} titolo="Modifica colore" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nome colore"><input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Es. Antracite" style={inp} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Codice"><input value={f.codice} onChange={e => set('codice', e.target.value)} placeholder="RAL 7016" style={inp} /></Field>
          <Field label="Tipo">
            <select value={f.tipo} onChange={e => set('tipo', e.target.value as any)} style={inp}>
              {TIPI.map(([t, lab]) => <option key={t} value={t}>{lab}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Fornitore">
          <input value={f.fornitore} onChange={e => set('fornitore', e.target.value)} placeholder="Es. Pratic, Gibus..." list="fornitori-list" style={inp} />
          <datalist id="fornitori-list">{fornitori.map(fn => <option key={fn} value={fn} />)}</datalist>
        </Field>

        <Field label="Anteprima colore (codice HEX)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: 10, background: f.hex || '#CCCCCC', border: `2px solid ${T.bdr}`, flexShrink: 0 }} />
            <input value={f.hex || ''} onChange={e => set('hex', e.target.value)} placeholder="#293133" style={inp} />
            <input type="color" value={f.hex || '#CCCCCC'} onChange={e => set('hex', e.target.value)} style={{ width: 50, height: 44, border: `1px solid ${T.bdr}`, borderRadius: 10, cursor: 'pointer', flexShrink: 0, padding: 2 }} />
          </div>
        </Field>

        <div style={{ padding: 12, background: '#F7FAFA', borderRadius: 10, border: `1px solid ${T.bdr}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.4 }}>Sovrapprezzo (opzionale)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="% sul prezzo modello">
              <input type="number" step="0.5" value={f.sovrapprezzo_pct ?? ''} onChange={e => set('sovrapprezzo_pct', e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="0" style={inp} />
            </Field>
            <Field label="€ fisso">
              <input type="number" step="0.01" value={f.sovrapprezzo_eur ?? ''} onChange={e => set('sovrapprezzo_eur', e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="0.00" style={inp} />
            </Field>
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 6, lineHeight: 1.4 }}>
            ⓘ Es. Antracite +5% sopra il prezzo base. Lascia 0 se è colore standard.
          </div>
        </div>

        <Field label="Attivo">
          <button onClick={() => set('attivo', !f.attivo)} style={{
            padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.bdr}`,
            background: f.attivo ? '#28A0A020' : '#FFF', color: f.attivo ? '#28A0A0' : T.muted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{f.attivo ? '● Attivo' : '○ Disattivato'}</button>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onDelete} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${T.bdr}`, background: '#FFF', color: '#C0392B', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Elimina</button>
          <button onClick={() => onSave(f)} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#28A0A0', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow }}>Salva</button>
        </div>
      </div>
    </div>
  )
}

const chip = (active: boolean, color: string): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: 999, border: `1px solid ${active ? color : T.bdr}`,
  background: active ? color : '#FFF', color: active ? '#FFF' : T.text,
  fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
})

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

function Header({ onBack, totale, titolo = 'Colori Tendaggi' }: { onBack: () => void; totale: number | null; titolo?: string }) {
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
      {totale != null && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 5 }}>{totale} colori configurati</div>}
    </div>
  )
}
