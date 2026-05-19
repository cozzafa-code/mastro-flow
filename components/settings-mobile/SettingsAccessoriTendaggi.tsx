// components/settings-mobile/SettingsAccessoriTendaggi.tsx
// CRUD accessori tendaggi (motori, sensori, comandi, LED, tessuti, ecc.).

'use client'

import React, { useEffect, useState } from 'react'
import { T } from '../home-mobile/HomeUI'
import { getAziendaId } from '@/lib/supabase-sync'

interface Accessorio {
  id: string
  azienda_id: string
  fornitore: string | null
  nome: string
  categoria: 'motore' | 'comando' | 'sensore' | 'tessuto' | 'illuminazione' | 'colore' | 'altro'
  unita: 'pz' | 'ml' | 'mq' | 'm'
  prezzo_unitario: number | null
  compatibile_tipi: string[]
  attivo: boolean
  ordine: number | null
  note: string | null
}

const CATEGORIE: Array<[Accessorio['categoria'], string]> = [
  ['motore', 'Motore'],
  ['comando', 'Comando'],
  ['sensore', 'Sensore'],
  ['tessuto', 'Tessuto'],
  ['illuminazione', 'Illuminazione'],
  ['colore', 'Colore/Verniciatura'],
  ['altro', 'Altro'],
]

const TIPI_COMPATIBILI: Array<[string, string]> = [
  ['cassonetto', 'Cassonetto chiuso'],
  ['semicassonetto', 'Semi-cassonetto'],
  ['bracci', 'Solo telo'],
  ['caduta', 'A caduta'],
  ['capottina', 'Capottina'],
  ['veranda', 'Veranda'],
  ['pergola', 'Pergola lame'],
  ['pergolatelo', 'Pergola telo'],
  ['pergolabox', 'Pergola+box'],
  ['tettopiramide', 'Tetto piramide'],
  ['rullo', 'Rullo'],
  ['veneziana', 'Veneziana'],
  ['plisse', 'Plissé'],
]

export default function SettingsAccessoriTendaggi({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Accessorio[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCat, setFiltroCat] = useState<'tutti' | Accessorio['categoria']>('tutti')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Accessorio | null>(null)
  const [aziendaId, setAziendaId] = useState<string | null>(null)

  useEffect(() => { (async () => {
    try {
      const id = await getAziendaId()
      setAziendaId(id)
      const { supabase: sb } = await import('@/lib/supabase')
      const { data } = await sb.from('accessori_tendaggi').select('*').order('ordine', { ascending: true })
      setItems((data || []) as Accessorio[])
    } catch (e) { console.error(e) }
    setLoading(false)
  })() }, [])

  const aggiungi = async () => {
    if (!aziendaId) { alert('Azienda non identificata. Riapri.'); return }
    const { supabase: sb } = await import('@/lib/supabase')
    const nuovo: any = {
      azienda_id: aziendaId, fornitore: '', nome: 'Nuovo accessorio',
      categoria: 'motore', unita: 'pz', prezzo_unitario: 0,
      compatibile_tipi: [], attivo: true,
    }
    const { data, error } = await sb.from('accessori_tendaggi').insert([nuovo]).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => [...prev, data as Accessorio])
    setSelected(data as Accessorio)
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo accessorio?')) return
    const { supabase: sb } = await import('@/lib/supabase')
    const { error } = await sb.from('accessori_tendaggi').delete().eq('id', id)
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.filter(x => x.id !== id))
    setSelected(null)
  }

  const salva = async (a: Accessorio) => {
    const { supabase: sb } = await import('@/lib/supabase')
    const patch: any = {
      fornitore: a.fornitore, nome: a.nome, categoria: a.categoria,
      unita: a.unita, prezzo_unitario: a.prezzo_unitario,
      compatibile_tipi: a.compatibile_tipi, note: a.note, attivo: a.attivo,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await sb.from('accessori_tendaggi').update(patch).eq('id', a.id).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.map(x => x.id === a.id ? data as Accessorio : x))
    setSelected(null)
  }

  const filtrati = items.filter(a => {
    if (filtroCat !== 'tutti' && a.categoria !== filtroCat) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (a.fornitore || '').toLowerCase().includes(q) || a.nome.toLowerCase().includes(q)
  })

  const catLabel = (c: string) => CATEGORIE.find(x => x[0] === c)?.[1] || c
  const catColor = (c: string) => ({
    motore: '#3b82f6', comando: '#8b5cf6', sensore: '#f59e0b',
    tessuto: '#10b981', illuminazione: '#fbbf24', colore: '#ec4899', altro: '#6b7280',
  } as any)[c] || '#6b7280'

  if (selected) return <DettaglioAccessorio a={selected} onSave={salva} onCancel={() => setSelected(null)} onDelete={() => elimina(selected.id)} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <Header onBack={onBack} totale={items.length} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o fornitore…"
          style={{ padding: '12px 14px', border: `1px solid ${T.bdr}`, borderRadius: 12, fontSize: 14, outline: 'none', background: '#FFF' }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFiltroCat('tutti')} style={chipStyle(filtroCat === 'tutti', '#28A0A0')}>Tutti</button>
          {CATEGORIE.map(([c, lab]) => (
            <button key={c} onClick={() => setFiltroCat(c)} style={chipStyle(filtroCat === c, catColor(c))}>{lab}</button>
          ))}
        </div>
        <button onClick={aggiungi} style={{
          background: '#28A0A0', color: '#FFF', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow,
        }}>+ Aggiungi accessorio</button>
        {loading && <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>Caricamento…</div>}
        {!loading && filtrati.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>Nessun accessorio. Aggiungi il primo.</div>
        )}
        {filtrati.map(a => (
          <button key={a.id} onClick={() => setSelected(a)} style={{
            background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 14, padding: 12,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            opacity: a.attivo ? 1 : 0.5, boxShadow: T.shadow, width: '100%',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: catColor(a.categoria) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: catColor(a.categoria), flexShrink: 0, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, padding: 4 }}>
              {catLabel(a.categoria).slice(0, 6)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
              <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.fornitore || 'Generico'} · {(a.compatibile_tipi || []).length} compatibilità</div>
            </div>
            {a.prezzo_unitario != null && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#28A0A0', whiteSpace: 'nowrap' }}>€{a.prezzo_unitario}/{a.unita}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function DettaglioAccessorio({ a, onSave, onCancel, onDelete }: { a: Accessorio; onSave: (a: Accessorio) => void; onCancel: () => void; onDelete: () => void }) {
  const [f, setF] = useState<Accessorio>(a)
  const set = (k: keyof Accessorio, v: any) => setF(prev => ({ ...prev, [k]: v }))

  const toggleTipo = (tipoId: string) => {
    const arr = f.compatibile_tipi || []
    const nuovi = arr.includes(tipoId) ? arr.filter(x => x !== tipoId) : [...arr, tipoId]
    set('compatibile_tipi', nuovi)
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 140 }}>
      <Header onBack={onCancel} totale={null} titolo="Modifica accessorio" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nome accessorio"><input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Es. Motore Sonesse 30" style={inp} /></Field>
        <Field label="Fornitore"><input value={f.fornitore || ''} onChange={e => set('fornitore', e.target.value)} placeholder="Es. Somfy, Pratic..." style={inp} /></Field>
        <Field label="Categoria">
          <select value={f.categoria} onChange={e => set('categoria', e.target.value as any)} style={inp}>
            {CATEGORIE.map(([c, lab]) => <option key={c} value={c}>{lab}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <Field label="Prezzo €">
            <input type="number" step="0.01" value={f.prezzo_unitario ?? ''} onChange={e => set('prezzo_unitario', e.target.value === '' ? null : parseFloat(e.target.value))} style={inp} />
          </Field>
          <Field label="Unità">
            <select value={f.unita} onChange={e => set('unita', e.target.value as any)} style={inp}>
              <option value="pz">€/pz</option>
              <option value="m">€/m lin.</option>
              <option value="ml">€/ml</option>
              <option value="mq">€/m²</option>
            </select>
          </Field>
        </div>
        <Field label="Tipi tenda compatibili (lascia vuoto = compatibile con tutti)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {TIPI_COMPATIBILI.map(([id, lab]) => {
              const sel = (f.compatibile_tipi || []).includes(id)
              return (
                <button key={id} onClick={() => toggleTipo(id)} style={{
                  padding: '7px 11px', borderRadius: 999, border: `1px solid ${sel ? '#28A0A0' : T.bdr}`,
                  background: sel ? '#28A0A0' : '#FFF', color: sel ? '#FFF' : T.text,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>{lab}</button>
              )
            })}
          </div>
        </Field>
        <Field label="Note"><textarea rows={3} value={f.note || ''} onChange={e => set('note', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></Field>
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

const chipStyle = (active: boolean, color: string): React.CSSProperties => ({
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

function Header({ onBack, totale, titolo = 'Accessori Tendaggi' }: { onBack: () => void; totale: number | null; titolo?: string }) {
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
      {totale != null && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 5 }}>{totale} accessori configurati</div>}
    </div>
  )
}
