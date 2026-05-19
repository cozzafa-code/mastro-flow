// components/settings-mobile/SettingsVetriMobile.tsx
// Catalogo Vetri mobile + Costruttore Vetri integrato

'use client'

import React, { useEffect, useState } from 'react'
import { T, numStyle } from '../home-mobile/HomeUI'
import { useMastro } from '../MastroContext'
import { parseComposizione, generaSvgVetro } from '@/lib/vetri-section'
import {
  VetroLayer, calcolaVetro, generaSvgSezione, gid,
} from '@/lib/vetri-engine'
import CostruttoreVetriMobile from './CostruttoreVetriMobile'

interface Vetro {
  id: string
  azienda_id: string | null
  codice: string | null
  nome: string
  composizione: string | null
  ug: number | null
  spessore: number | null
  peso_mq: number | null
  trasmittanza_solare: number | null
  abbattimento_acustico: number | null
  sicurezza: string | null
  prezzo_mq: number | null
  descrizione: string | null
  fornitore: string | null
  attivo: boolean
  sezione_svg: string | null
  strati: any
  created_at?: string
}

const CAMPI_NON_UPDATABILI = ['id', 'created_at']
function pulisci(p: any): any {
  const out: any = {}
  for (const k of Object.keys(p)) {
    if (!CAMPI_NON_UPDATABILI.includes(k)) out[k] = p[k]
  }
  return out
}

// Carica strati da JSONB salvati o ricostruisce da composizione
function loadLayers(v: Vetro): VetroLayer[] {
  if (Array.isArray(v.strati) && v.strati.length > 0) {
    return v.strati.map((s: any) => ({
      id: gid(),
      tipo: s.tipo,
      spessore: s.spessore,
      vetro_tipo: s.vetro_tipo,
      gas: s.gas,
      canalina_tipo: s.canalina_tipo,
    }))
  }
  // Fallback: ricostruisce da composizione tramite parser semplice
  if (v.composizione) {
    const parsed = parseComposizione(v.composizione)
    return parsed.map(p => {
      if (p.isGas) {
        return { id: gid(), tipo: 'canalina', spessore: p.spessore, gas: (p.tipo === 'argon' || p.tipo === 'kripton' ? p.tipo : 'aria') as any, canalina_tipo: 'warm_edge' }
      }
      let vt: any = 'float'
      if (p.tipo === 'BE') vt = 'basso_emissivo'
      else if (p.tipo === 'tempera') vt = 'temperato'
      return { id: gid(), tipo: 'vetro', spessore: p.spessore, vetro_tipo: vt }
    })
  }
  return []
}

type View = 'lista' | 'dettaglio' | 'costruttore'

export default function SettingsVetriMobile({ onBack }: { onBack: () => void }) {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [vetri, setVetri] = useState<Vetro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Vetro | null>(null)
  const [view, setView] = useState<View>('lista')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { supabase: sb } = await import('@/lib/supabase')
        const { data, error } = await sb.from('catalogo_vetri').select('*').order('nome')
        if (!mounted) return
        if (error) console.error(error)
        else setVetri((data as Vetro[]) || [])
      } catch (e) { console.error(e) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const aggiorna = async (v: Vetro) => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const dati = pulisci(v)
      const { data, error } = await sb.from('catalogo_vetri').update(dati).eq('id', v.id).select().single()
      if (error) { alert('Errore: ' + error.message); return }
      const aggiornato = (data || v) as Vetro
      setVetri(prev => prev.map(x => x.id === v.id ? aggiornato : x))
      setView('lista'); setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo vetro?')) return
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const { error } = await sb.from('catalogo_vetri').delete().eq('id', id)
      if (error) { alert('Errore: ' + error.message); return }
      setVetri(prev => prev.filter(x => x.id !== id))
      setView('lista'); setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const aggiungiCostruttore = () => {
    setSelected(null)
    setView('costruttore')
  }

  const apriCostruttoreEsistente = () => {
    if (!selected) return
    setView('costruttore')
  }

  const salvaCostruttore = async (data: {
    nome: string; codice: string; fornitore: string | null; prezzo: number | null;
    layers: VetroLayer[]; svg: string; calc: any;
  }) => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const azienda_id = ctx?.aziendaIdReal || ctx?.aziendaInfo?.id || null
      const stratiJson = data.layers.map(l => ({
        tipo: l.tipo, spessore: l.spessore,
        vetro_tipo: l.vetro_tipo, gas: l.gas, canalina_tipo: l.canalina_tipo,
      }))
      const payload: any = {
        codice: data.codice,
        nome: data.nome,
        composizione: data.calc.comp,
        ug: data.calc.Ug,
        spessore: data.calc.sp,
        peso_mq: data.calc.peso,
        trasmittanza_solare: data.calc.g,
        abbattimento_acustico: data.calc.Rw,
        prezzo_mq: data.prezzo,
        fornitore: data.fornitore,
        sezione_svg: data.svg,
        strati: stratiJson,
        attivo: true,
        azienda_id,
      }

      if (selected) {
        // Update
        const { data: out, error } = await sb.from('catalogo_vetri').update(pulisci(payload)).eq('id', selected.id).select().single()
        if (error) { alert('Errore: ' + error.message); return }
        const aggiornato = out as Vetro
        setVetri(prev => prev.map(x => x.id === selected.id ? aggiornato : x))
        setSelected(null)
      } else {
        // Insert (upsert su codice)
        const { data: out, error } = await sb.from('catalogo_vetri')
          .upsert(payload, { onConflict: 'codice' }).select().single()
        if (error) { alert('Errore: ' + error.message); return }
        const nuovo = out as Vetro
        setVetri(prev => {
          const filtered = prev.filter(x => x.id !== nuovo.id)
          return [...filtered, nuovo]
        })
      }
      setView('lista')
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const filtrati = vetri.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return (v.nome || '').toLowerCase().includes(q) || (v.codice || '').toLowerCase().includes(q) || (v.composizione || '').toLowerCase().includes(q)
  })

  // VIEW: COSTRUTTORE
  if (view === 'costruttore') {
    return (
      <CostruttoreVetriMobile
        initialLayers={selected ? loadLayers(selected) : []}
        initialNome={selected?.nome || ''}
        initialCodice={selected?.codice || ''}
        initialFornitore={selected?.fornitore || ''}
        initialPrezzo={selected?.prezzo_mq ?? null}
        onBack={() => { setView(selected ? 'dettaglio' : 'lista') }}
        onSave={salvaCostruttore}
      />
    )
  }

  // VIEW: DETTAGLIO
  if (view === 'dettaglio' && selected) {
    return <DettaglioVetro
      vetro={selected}
      onBack={() => { setView('lista'); setSelected(null) }}
      onSave={aggiorna}
      onDelete={() => elimina(selected.id)}
      onApriCostruttore={apriCostruttoreEsistente}
    />
  }

  // VIEW: LISTA
  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      <Header onBack={onBack} totale={vetri.length} />
      <div style={{ padding: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome, codice, composizione..."
          style={{ width: '100%', padding: '12px 14px', border: '1px solid ' + T.bdr, borderRadius: 12, fontSize: 14, background: '#FFF', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <Kpi value={vetri.length} label="Totali" color={T.acc} />
          <Kpi value={vetri.filter(v => v.attivo !== false).length} label="Attivi" color={T.numTeal} />
          <Kpi value={vetri.filter(v => v.ug && v.ug <= 1.1).length} label="Bassi Ug" color={T.numBlue} />
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13 }}>Carico catalogo...</div>
        ) : filtrati.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13 }}>
            {vetri.length === 0 ? 'Nessun vetro nel catalogo' : 'Nessun vetro trovato'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrati.map(v => <RigaVetro key={v.id} v={v} onClick={() => { setSelected(v); setView('dettaglio') }} />)}
          </div>
        )}
        <button onClick={aggiungiCostruttore} style={{ width: '100%', marginTop: 14, background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,118,110,0.15)' }}>+ NUOVO VETRO (COSTRUTTORE)</button>
      </div>
    </div>
  )
}

function Header({ onBack, totale }: { onBack: () => void; totale: number }) {
  return (
    <div style={{ background: 'linear-gradient(160deg, ' + T.acc + ' 0%, ' + T.accDeep + ' 100%)', padding: '14px 16px 24px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#FFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', width: 36, height: 36, borderRadius: 10, color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>&lsaquo;</button>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Impostazioni &rsaquo; Catalogo</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', WebkitFontSmoothing: 'antialiased' }}>Vetri</div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{totale} {totale === 1 ? 'vetro' : 'vetri'} in catalogo</div>
    </div>
  )
}

function Kpi({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 12, textAlign: 'center' }}>
      <div style={numStyle(20, color)}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function RigaVetro({ v, onClick }: { v: Vetro; onClick: () => void }) {
  const inattivo = v.attivo === false
  const layers = loadLayers(v)
  const sezioneSvg = v.sezione_svg || (layers.length ? generaSvgSezione(layers, 1.5) : '')
  return (
    <button onClick={onClick} style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', width: '100%', textAlign: 'left', opacity: inattivo ? 0.5 : 1 }}>
      <div style={{ width: 60, height: 40, borderRadius: 8, background: T.blueSoft, padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sezioneSvg ? <div dangerouslySetInnerHTML={{ __html: sezioneSvg }} style={{ width: '100%', height: '100%' }} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.nome}</div>
        <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v.codice ? v.codice + ' · ' : ''}{v.composizione || 'Senza composizione'}
        </div>
        <div style={{ fontSize: 10, color: T.numBlue, marginTop: 2, fontWeight: 600 }}>
          {v.ug != null ? 'Ug ' + v.ug : ''}
          {v.spessore != null ? ' · ' + v.spessore + 'mm' : ''}
          {v.prezzo_mq != null ? ' · €' + v.prezzo_mq + '/m²' : ''}
        </div>
      </div>
      <div style={{ color: T.acc, fontSize: 18, fontWeight: 700 }}>&rsaquo;</div>
    </button>
  )
}

function DettaglioVetro({ vetro, onBack, onSave, onDelete, onApriCostruttore }: {
  vetro: Vetro; onBack: () => void; onSave: (v: Vetro) => void; onDelete: () => void; onApriCostruttore: () => void
}) {
  const [v, setV] = useState<Vetro>(vetro)
  const [tabAttiva, setTabAttiva] = useState<'base' | 'sezione' | 'note'>('base')
  const f = (k: keyof Vetro) => (val: any) => setV(prev => ({ ...prev, [k]: val }))

  const layers = loadLayers(v)
  const calc = calcolaVetro(layers)
  const svgSezione = v.sezione_svg || (layers.length ? generaSvgSezione(layers, 3) : generaSvgVetro(parseComposizione(v.composizione || ''), 200))

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <div style={{ background: 'linear-gradient(160deg, ' + T.acc + ' 0%, ' + T.accDeep + ' 100%)', padding: '14px 16px 22px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', width: 36, height: 36, borderRadius: 10, color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>&lsaquo;</button>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Vetri &rsaquo; Dettaglio</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{v.nome || 'Senza nome'}</div>
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '12px 16px 0', borderBottom: '1px solid ' + T.bdr, background: T.bg }}>
        {([['base','Base'],['sezione','Sezione'],['note','Note']] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTabAttiva(id)} style={{
            flex: 1, padding: '10px 8px', background: 'transparent', border: 'none',
            borderBottom: tabAttiva === id ? '2px solid ' + T.acc : '2px solid transparent',
            fontSize: 12, fontWeight: 600, color: tabAttiva === id ? T.acc : T.muted, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tabAttiva === 'base' && <>
          <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 12, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: svgSezione }} />
          <Field label="Nome" value={v.nome || ''} onChange={f('nome')} />
          <Field label="Codice" value={v.codice || ''} onChange={f('codice')} />
          <Field label="Composizione" value={v.composizione || ''} onChange={f('composizione')} placeholder="es. 4float+16argon+4BE" />
          <Row>
            <Field label="Ug (W/m²K)" value={v.ug ?? ''} onChange={val => f('ug')(val === '' ? null : Number(val))} type="number" step="0.01" />
            <Field label="Spessore mm" value={v.spessore ?? ''} onChange={val => f('spessore')(val === '' ? null : Number(val))} type="number" />
          </Row>
          <Row>
            <Field label="Peso kg/m²" value={v.peso_mq ?? ''} onChange={val => f('peso_mq')(val === '' ? null : Number(val))} type="number" step="0.1" />
            <Field label="Prezzo €/m²" value={v.prezzo_mq ?? ''} onChange={val => f('prezzo_mq')(val === '' ? null : Number(val))} type="number" step="0.01" />
          </Row>
          <Row>
            <Field label="g solare" value={v.trasmittanza_solare ?? ''} onChange={val => f('trasmittanza_solare')(val === '' ? null : Number(val))} type="number" step="0.01" />
            <Field label="Acust. dB" value={v.abbattimento_acustico ?? ''} onChange={val => f('abbattimento_acustico')(val === '' ? null : Number(val))} type="number" />
          </Row>
          <Row>
            <Field label="Sicurezza" value={v.sicurezza || ''} onChange={f('sicurezza')} placeholder="P1A, P2A, P4A..." />
            <Field label="Fornitore" value={v.fornitore || ''} onChange={f('fornitore')} />
          </Row>
        </>}

        {tabAttiva === 'sezione' && <>
          <div style={{ background: T.tealSoft, border: '1px solid ' + T.bdr, borderRadius: 10, padding: '10px 12px', fontSize: 11, color: T.text }}>
            Sezione stratigrafica. Per modificare struttura, gas, vetri e calcoli usa il Costruttore.
          </div>
          <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 14, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: svgSezione }} />
          {calc && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <KpiSm label="Ug" value={calc.Ug} unit="W/m²K" color={calc.Ug <= 1.1 ? T.numTeal : T.numAmber} />
              <KpiSm label="Spessore" value={calc.sp} unit="mm" color={T.text} />
              <KpiSm label="Peso" value={calc.peso} unit="kg/m²" color={T.text} />
              <KpiSm label="Rw" value={calc.Rw} unit="dB" color={calc.Rw >= 35 ? T.numTeal : T.numAmber} />
            </div>
          )}
          <button onClick={onApriCostruttore} style={{ width: '100%', background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: 14, fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>
            APRI COSTRUTTORE VETRI
          </button>
        </>}

        {tabAttiva === 'note' && <>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>Descrizione / Note</div>
            <textarea value={v.descrizione || ''} onChange={e => f('descrizione')(e.target.value)}
              placeholder="Note tecniche, condizioni d'uso, certificazioni..."
              style={{ width: '100%', minHeight: 140, padding: '10px 12px', border: '1px solid ' + T.bdr, borderRadius: 10, fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </>}

        <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Vetro attivo</span>
          <button onClick={() => f('attivo')(!v.attivo)} style={{ width: 48, height: 28, borderRadius: 14, background: v.attivo !== false ? T.acc : T.bdr, border: 'none', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 2, left: v.attivo !== false ? 22 : 2, width: 24, height: 24, borderRadius: '50%', background: '#FFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={() => onSave(v)} style={{ flex: 1, background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: 14, fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>SALVA</button>
          <button onClick={onDelete} style={{ background: '#FFF', color: T.numRed, border: '1px solid ' + T.numRed + '40', borderRadius: 12, padding: '14px 18px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>ELIMINA</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', step }: {
  label: string; value: any; onChange: (v: any) => void; placeholder?: string; type?: string; step?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <input type={type} step={step} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + T.bdr, borderRadius: 10, fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>
}

function KpiSm({ label, value, unit, color }: { label: string; value: any; unit: string; color: string }) {
  return (
    <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 10, padding: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace' }}>{value} <span style={{ fontSize: 9, color: T.muted, fontWeight: 500 }}>{unit}</span></div>
    </div>
  )
}
