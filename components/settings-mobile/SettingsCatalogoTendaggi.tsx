// components/settings-mobile/SettingsCatalogoTendaggi.tsx
// Catalogo Tendaggi mobile cablato Supabase tabella catalogo_tendaggi.
// 28 tipi modello generici (id stabili) + override per azienda con marca/colore/prezzo.

'use client'

import React, { useEffect, useState } from 'react'
import { T } from '../home-mobile/HomeUI'
import { getAziendaId } from '@/lib/supabase-sync'

interface Modello {
  id: string
  azienda_id: string | null
  fornitore: string
  modello: string
  categoria: 'esterno' | 'interno'
  tipo_modello: string
  colore_default: string | null
  prezzo_base_eur: number | null
  unita_prezzo: 'mq' | 'pz' | null
  note: string | null
  png_url: string | null
  attivo: boolean
  ordine: number | null
  created_at?: string
  updated_at?: string
}

const TIPI_ESTERNO: Array<[string, string]> = [
  ['cassonetto', 'Cassonetto chiuso'],
  ['semicassonetto', 'Semi-cassonetto'],
  ['bracci', 'Solo telo'],
  ['trapezio', 'A trapezio'],
  ['doppiolivello', 'Doppio livello'],
  ['capottina', 'Capottina tonda'],
  ['capottinapunta', 'Capottina a punta'],
  ['veranda', 'Veranda vetrata'],
  ['verandatenda', 'Veranda+tenda'],
  ['caduta', 'A caduta verticale'],
  ['pergola', 'Pergola lame'],
  ['pergolatelo', 'Pergola telo'],
  ['tettopiramide', 'Tetto piramide'],
  ['pergolabox', 'Pergola+cassonetto'],
]

const TIPI_INTERNO: Array<[string, string]> = [
  ['classica', 'Classica 2 teli'],
  ['classicaplisse', 'Classica plissé'],
  ['mantovana', 'Con mantovana'],
  ['drappeggio', 'Drappeggio raccolto'],
  ['voile', 'Voile/Velo'],
  ['rullo', 'Rullo'],
  ['pacchetto', 'Pacchetto'],
  ['plisse', 'Plissé'],
  ['veneziana', 'Veneziana orizzontale'],
  ['venezianavert', 'Veneziana verticale'],
  ['pannello', 'Pannello giapponese'],
  ['oscurante', 'Oscurante blackout'],
  ['doppiostrato', 'Giorno/Notte'],
  ['venezianalegno', 'Veneziana in legno'],
]

const TIPI_ALL = TIPI_ESTERNO.concat(TIPI_INTERNO)
function tipoLabel(id: string) {
  return TIPI_ALL.find(t => t[0] === id)?.[1] || id
}

export default function SettingsCatalogoTendaggi({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Modello[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCat, setFiltroCat] = useState<'tutti' | 'esterno' | 'interno'>('tutti')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Modello | null>(null)
  const [aziendaId, setAziendaId] = useState<string | null>(null)
  const [showImporter, setShowImporter] = useState(false)

  useEffect(() => { (async () => {
    try {
      const id = await getAziendaId()
      setAziendaId(id)
      const { supabase: sb } = await import('@/lib/supabase')
      const { data, error } = await sb.from('catalogo_tendaggi').select('*').order('ordine', { ascending: true }).order('fornitore', { ascending: true })
      if (error) console.error(error)
      setItems((data || []) as Modello[])
    } catch (e) { console.error(e) }
    setLoading(false)
  })() }, [])

  const aggiungi = async () => {
    if (!aziendaId) { alert('Azienda non identificata. Riapri la pagina e ritenta.'); return }
    const { supabase: sb } = await import('@/lib/supabase')
    const nuovo: any = {
      azienda_id: aziendaId,
      fornitore: 'Nuovo fornitore',
      modello: 'Nuovo modello ' + Date.now().toString().slice(-4),
      categoria: 'esterno',
      tipo_modello: 'cassonetto',
      attivo: true,
    }
    const { data, error } = await sb.from('catalogo_tendaggi').insert([nuovo]).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => [...prev, data as Modello])
    setSelected(data as Modello)
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo modello?')) return
    const { supabase: sb } = await import('@/lib/supabase')
    const { error } = await sb.from('catalogo_tendaggi').delete().eq('id', id)
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.filter(x => x.id !== id))
    setSelected(null)
  }

  const salva = async (m: Modello) => {
    const { supabase: sb } = await import('@/lib/supabase')
    const patch: any = {
      fornitore: m.fornitore, modello: m.modello, categoria: m.categoria,
      tipo_modello: m.tipo_modello, colore_default: m.colore_default,
      prezzo_base_eur: m.prezzo_base_eur, unita_prezzo: m.unita_prezzo,
      note: m.note, attivo: m.attivo, updated_at: new Date().toISOString(),
    }
    const { data, error } = await sb.from('catalogo_tendaggi').update(patch).eq('id', m.id).select().single()
    if (error) { alert('Errore: ' + error.message); return }
    setItems(prev => prev.map(x => x.id === m.id ? data as Modello : x))
    setSelected(null)
  }

  const filtrati = items.filter(m => {
    if (filtroCat !== 'tutti' && m.categoria !== filtroCat) return false
    if (!search) return true
    const q = search.toLowerCase()
    return m.fornitore.toLowerCase().includes(q) ||
           m.modello.toLowerCase().includes(q) ||
           tipoLabel(m.tipo_modello).toLowerCase().includes(q)
  })

  if (selected) return <DettaglioModello m={selected} onSave={salva} onCancel={() => setSelected(null)} onDelete={() => elimina(selected.id)} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <Header onBack={onBack} totale={items.length} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per marca, modello, tipo…"
          style={{ padding: '12px 14px', border: `1px solid ${T.bdr}`, borderRadius: 12, fontSize: 14, outline: 'none', background: '#FFF' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['tutti', 'esterno', 'interno'] as const).map(c => (
            <button key={c} onClick={() => setFiltroCat(c)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 10,
              border: `1px solid ${filtroCat === c ? T.acc : T.bdr}`,
              background: filtroCat === c ? T.acc : '#FFF',
              color: filtroCat === c ? '#FFF' : T.text,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
            }}>{c}</button>
          ))}
        </div>
        <button onClick={aggiungi} style={{
          background: T.acc, color: '#FFF', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow,
        }}>+ Aggiungi modello</button>
        <button onClick={() => setShowImporter(true)} style={{
          background: '#FFF', color: T.acc, border: `1.5px solid ${T.acc}`, borderRadius: 12,
          padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>📥 Importa catalogo demo (Pratic, Gibus, KE, Mottura)</button>
        {showImporter && <ImporterSheet onClose={() => setShowImporter(false)} onImported={async () => {
          // Ricarica items dopo import
          const { supabase: sb } = await import('@/lib/supabase')
          const { data } = await sb.from('catalogo_tendaggi').select('*').order('ordine', { ascending: true }).order('fornitore', { ascending: true })
          setItems((data || []) as Modello[])
        }} />}
        {loading && <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>Caricamento…</div>}
        {!loading && filtrati.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 13 }}>
            Nessun modello. Aggiungi il primo o richiedi importazione catalogo demo all'amministratore.
          </div>
        )}
        {filtrati.map(m => (
          <button key={m.id} onClick={() => setSelected(m)} style={{
            background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 14, padding: 12,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            opacity: m.attivo ? 1 : 0.5, boxShadow: T.shadow, width: '100%',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: T.acc + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.acc, flexShrink: 0 }}>
              {m.categoria === 'esterno' ? 'EXT' : 'INT'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fornitore} · {m.modello}</div>
              <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tipoLabel(m.tipo_modello)}{m.colore_default ? ' · ' + m.colore_default : ''}</div>
            </div>
            {m.prezzo_base_eur != null && (
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, whiteSpace: 'nowrap' }}>€{m.prezzo_base_eur}/{m.unita_prezzo || 'mq'}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function DettaglioModello({ m, onSave, onCancel, onDelete }: { m: Modello; onSave: (m: Modello) => void; onCancel: () => void; onDelete: () => void }) {
  const [f, setF] = useState<Modello>(m)
  const set = (k: keyof Modello, v: any) => setF(prev => ({ ...prev, [k]: v }))
  const tipiOpts = f.categoria === 'esterno' ? TIPI_ESTERNO : TIPI_INTERNO

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 140 }}>
      <Header onBack={onCancel} totale={null} titolo="Modifica modello" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Marca / Fornitore"><input value={f.fornitore} onChange={e => set('fornitore', e.target.value)} style={inp} /></Field>
        <Field label="Modello / Sistema"><input value={f.modello} onChange={e => set('modello', e.target.value)} style={inp} /></Field>
        <Field label="Categoria">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['esterno', 'interno'] as const).map(c => (
              <button key={c} onClick={() => set('categoria', c)} style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: `1px solid ${f.categoria === c ? T.acc : T.bdr}`,
                background: f.categoria === c ? T.acc : '#FFF',
                color: f.categoria === c ? '#FFF' : T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              }}>{c}</button>
            ))}
          </div>
        </Field>
        <Field label="Tipo di tenda (per disegno)">
          <select value={f.tipo_modello} onChange={e => set('tipo_modello', e.target.value)} style={inp}>
            {tipiOpts.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </Field>
        <Field label="Colore di default"><input value={f.colore_default || ''} onChange={e => set('colore_default', e.target.value)} placeholder="Es. RAL 7016 Antracite" style={inp} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <Field label="Prezzo base €">
            <input type="number" step="0.01" value={f.prezzo_base_eur ?? ''} onChange={e => set('prezzo_base_eur', e.target.value === '' ? null : parseFloat(e.target.value))} style={inp} />
          </Field>
          <Field label="Unità">
            <select value={f.unita_prezzo || 'mq'} onChange={e => set('unita_prezzo', e.target.value as any)} style={inp}>
              <option value="mq">€/m²</option>
              <option value="pz">€/pz</option>
            </select>
          </Field>
        </div>
        <Field label="Note"><textarea rows={3} value={f.note || ''} onChange={e => set('note', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></Field>
        <Field label="Attivo">
          <button onClick={() => set('attivo', !f.attivo)} style={{
            padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.bdr}`,
            background: f.attivo ? T.acc + '20' : '#FFF', color: f.attivo ? T.acc : T.muted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{f.attivo ? '● Attivo' : '○ Disattivato'}</button>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onDelete} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${T.bdr}`, background: '#FFF', color: '#C0392B', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Elimina</button>
          <button onClick={() => onSave(f)} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: T.acc, color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: T.shadow }}>Salva</button>
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

function Header({ onBack, totale, titolo = 'Catalogo Tendaggi' }: { onBack: () => void; totale: number | null; titolo?: string }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
      padding: '14px 16px 22px', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, color: '#FFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', width: 34, height: 34, borderRadius: 10, color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>‹</button>
        <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: 0.3, opacity: 0.85 }}>filwoX</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{titolo}</div>
      {totale != null && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 5 }}>{totale} modelli nel catalogo</div>}
    </div>
  )
}

type TplItem = { key: string; fornitore: string; descrizione: string; versione: string; modelli_count: number; accessori_count: number; colori_count: number; gia_importato: boolean }

function ImporterSheet({ onClose, onImported }: { onClose: () => void; onImported: () => void | Promise<void> }) {
  const [templates, setTemplates] = useState<TplItem[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [risultato, setRisultato] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { supabase: sb } = await import('@/lib/supabase')
        const { data: { session } } = await sb.auth.getSession()
        const token = session?.access_token || ''
        const res = await fetch('/api/catalogo-tende/seed', { headers: { Authorization: 'Bearer ' + token } })
        const j = await res.json()
        if (j.ok) setTemplates(j.templates || [])
      } catch (e) { console.error(e) }
      setLoading(false)
    })()
  }, [])

  const importa = async (key: string) => {
    setImporting(key)
    setRisultato(null)
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const res = await fetch('/api/catalogo-tende/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ fornitori: [key] }),
      })
      const j = await res.json()
      if (j.ok) {
        setRisultato(`✓ Importati ${j.modelli || 0} modelli, ${j.accessori || 0} accessori, ${j.colori || 0} colori`)
        await onImported()
        // Aggiorno lo stato del template (gia_importato)
        setTemplates(prev => prev.map(t => t.key === key ? { ...t, gia_importato: true } : t))
      } else {
        setRisultato('Errore: ' + (j.error || 'sconosciuto'))
      }
    } catch (e: any) {
      setRisultato('Errore: ' + (e?.message || e))
    }
    setImporting(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: '#FFF', width: '100%', maxHeight: '88vh', overflowY: 'auto', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Importa catalogo demo</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Listini indicativi 2026, da rivedere coi prezzi reali</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, color: T.muted, cursor: 'pointer' }}>✕</button>
        </div>
        {loading && <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: T.muted }}>Caricamento template…</div>}
        {!loading && templates.length === 0 && <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: T.muted }}>Nessun template disponibile</div>}
        {!loading && templates.map(tpl => (
          <div key={tpl.key} style={{ background: '#F7FAFA', border: `1px solid ${T.bdr}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{tpl.fornitore}</div>
              {tpl.gia_importato && <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: '#10B98115', padding: '3px 8px', borderRadius: 999 }}>✓ GIÀ IMPORTATO</span>}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{tpl.descrizione}</div>
            <div style={{ fontSize: 11, color: T.text, marginBottom: 10 }}>
              <b>{tpl.modelli_count}</b> modelli · <b>{tpl.accessori_count}</b> accessori · <b>{tpl.colori_count}</b> colori
            </div>
            <button onClick={() => importa(tpl.key)} disabled={importing === tpl.key || tpl.gia_importato} style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none',
              background: tpl.gia_importato ? '#E8E8E8' : T.acc,
              color: tpl.gia_importato ? '#999' : '#FFF',
              fontSize: 13, fontWeight: 700, cursor: tpl.gia_importato ? 'default' : 'pointer',
              opacity: importing === tpl.key ? 0.6 : 1,
            }}>
              {importing === tpl.key ? 'Importazione in corso…' : tpl.gia_importato ? 'Già nel tuo catalogo' : '📥 Importa nel mio catalogo'}
            </button>
          </div>
        ))}
        {risultato && (
          <div style={{ padding: 12, background: risultato.startsWith('✓') ? '#10B98115' : '#FEF2F2', color: risultato.startsWith('✓') ? '#065F46' : '#991B1B', borderRadius: 10, marginTop: 10, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
            {risultato}
          </div>
        )}
        <div style={{ fontSize: 10, color: T.muted, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          ⓘ I prezzi sono stime di mercato 2026. Dopo l'import vai sui singoli modelli e adatta prezzo/sconto al tuo accordo reale col fornitore.
        </div>
      </div>
    </div>
  )
}
