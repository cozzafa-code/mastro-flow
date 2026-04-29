// components/settings-mobile/SettingsVetriMobile.tsx
// Catalogo Vetri mobile cablato Supabase tabella catalogo_vetri.

'use client'

import React, { useEffect, useState } from 'react'
import { T, numStyle } from '../home-mobile/HomeUI'
import { useMastro } from '../MastroContext'
import { parseComposizione, generaSvgVetro } from '@/lib/vetri-section'

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

export default function SettingsVetriMobile({ onBack }: { onBack: () => void }) {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [vetri, setVetri] = useState<Vetro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Vetro | null>(null)

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
      setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo vetro?')) return
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const { error } = await sb.from('catalogo_vetri').delete().eq('id', id)
      if (error) { alert('Errore: ' + error.message); return }
      setVetri(prev => prev.filter(x => x.id !== id))
      setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const aggiungi = async () => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const azienda_id = ctx?.aziendaIdReal || ctx?.aziendaInfo?.id || null
      const nuovo = { nome: 'Nuovo vetro', composizione: '4float+16argon+4BE', ug: 1.1, spessore: 24, attivo: true, azienda_id }
      const { data, error } = await sb.from('catalogo_vetri').insert([nuovo]).select().single()
      if (error) { alert('Errore: ' + error.message); return }
      setVetri(prev => [...prev, data as Vetro])
      setSelected(data as Vetro)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const filtrati = vetri.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return (v.nome || '').toLowerCase().includes(q) || (v.codice || '').toLowerCase().includes(q) || (v.composizione || '').toLowerCase().includes(q)
  })

  if (selected) {
    return <DettaglioVetro
      vetro={selected}
      onBack={() => setSelected(null)}
      onSave={aggiorna}
      onDelete={() => elimina(selected.id)}
    />
  }

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
            {filtrati.map(v => <RigaVetro key={v.id} v={v} onClick={() => setSelected(v)} />)}
          </div>
        )}
        <button onClick={aggiungi} style={{ width: '100%', marginTop: 14, background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,118,110,0.15)' }}>+ AGGIUNGI VETRO</button>
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
  const strati = parseComposizione(v.composizione || '')
  return (
    <button onClick={onClick} style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', width: '100%', textAlign: 'left', opacity: inattivo ? 0.5 : 1 }}>
      <div style={{ width: 60, height: 40, borderRadius: 8, background: T.blueSoft, padding: 4, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: generaMiniSvg(strati) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.nome}</div>
        <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v.codice ? v.codice + ' - ' : ''}
          {v.composizione || 'Senza composizione'}
        </div>
        <div style={{ fontSize: 10, color: T.numBlue, marginTop: 2, fontWeight: 600 }}>
          {v.ug != null ? 'Ug ' + v.ug : ''}
          {v.spessore != null ? ' - ' + v.spessore + 'mm' : ''}
          {v.prezzo_mq != null ? ' - EUR ' + v.prezzo_mq + '/m2' : ''}
        </div>
      </div>
      <div style={{ color: T.acc, fontSize: 18, fontWeight: 700 }}>&rsaquo;</div>
    </button>
  )
}

function generaMiniSvg(strati: any[]): string {
  if (strati.length === 0) return ''
  const totale = strati.reduce((s, x) => s + x.spessore, 0)
  const w = 60, h = 40
  let x = 4
  const drawW = w - 8
  const scaleX = drawW / totale
  const parts: string[] = []
  strati.forEach((s) => {
    const ww = s.spessore * scaleX
    const fill = s.isGas ? '#E8F4F4' : (s.tipo === 'BE' ? '#D6F0F8' : (s.tipo === 'stratificato' ? '#C4E0F0' : '#DCE8E8'))
    const stroke = s.isGas ? '#9DC8C8' : (s.tipo === 'BE' ? '#5A8FA0' : '#7090A0')
    parts.push('<rect x="' + x + '" y="6" width="' + ww + '" height="28" fill="' + fill + '" stroke="' + stroke + '" stroke-width="0.5"/>')
    x += ww
  })
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">' + parts.join('') + '</svg>'
}

function DettaglioVetro({ vetro, onBack, onSave, onDelete }: {
  vetro: Vetro; onBack: () => void; onSave: (v: Vetro) => void; onDelete: () => void
}) {
  const [v, setV] = useState<Vetro>(vetro)
  const [tabAttiva, setTabAttiva] = useState<'base' | 'sezione' | 'note'>('base')
  const f = (k: keyof Vetro) => (val: any) => setV(prev => ({ ...prev, [k]: val }))

  const strati = parseComposizione(v.composizione || '')
  const svgSezione = v.sezione_svg || generaSvgVetro(strati, 200)

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
          <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 8, height: 120 }}
            dangerouslySetInnerHTML={{ __html: svgSezione }} />
          <Field label="Nome" value={v.nome || ''} onChange={f('nome')} />
          <Field label="Codice" value={v.codice || ''} onChange={f('codice')} />
          <Field label="Composizione" value={v.composizione || ''} onChange={f('composizione')} placeholder="es. 4float+16argon+4BE" />
          <Row>
            <Field label="Ug (W/m2K)" value={v.ug ?? ''} onChange={val => f('ug')(val === '' ? null : Number(val))} type="number" step="0.01" />
            <Field label="Spessore mm" value={v.spessore ?? ''} onChange={val => f('spessore')(val === '' ? null : Number(val))} type="number" />
          </Row>
          <Row>
            <Field label="Peso kg/m2" value={v.peso_mq ?? ''} onChange={val => f('peso_mq')(val === '' ? null : Number(val))} type="number" step="0.1" />
            <Field label="Prezzo EUR/m2" value={v.prezzo_mq ?? ''} onChange={val => f('prezzo_mq')(val === '' ? null : Number(val))} type="number" step="0.01" />
          </Row>
          <Row>
            <Field label="Trasm. solare g" value={v.trasmittanza_solare ?? ''} onChange={val => f('trasmittanza_solare')(val === '' ? null : Number(val))} type="number" step="0.01" />
            <Field label="Acust. dB" value={v.abbattimento_acustico ?? ''} onChange={val => f('abbattimento_acustico')(val === '' ? null : Number(val))} type="number" />
          </Row>
          <Row>
            <Field label="Sicurezza" value={v.sicurezza || ''} onChange={f('sicurezza')} placeholder="P1A, P2A, P4A, P5A..." />
            <Field label="Fornitore" value={v.fornitore || ''} onChange={f('fornitore')} />
          </Row>
        </>}

        {tabAttiva === 'sezione' && <>
          <div style={{ background: T.tealSoft, border: '1px solid ' + T.bdr, borderRadius: 10, padding: '10px 12px', fontSize: 11, color: T.text }}>
            Sezione stratigrafica generata dalla composizione. Modifica la composizione in tab Base per cambiare la sezione.
          </div>
          <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 14, minHeight: 240 }}
            dangerouslySetInnerHTML={{ __html: svgSezione }} />
          {strati.length > 0 && (
            <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: 0.4, textTransform: 'uppercase' }}>Strati riconosciuti</div>
              {strati.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < strati.length - 1 ? '1px solid ' + T.bdr : 'none' }}>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{i + 1}. {s.raw}</span>
                  <span style={{ fontSize: 11, color: s.isGas ? T.numBlue : T.numTeal, fontWeight: 600 }}>
                    {s.spessore}mm {s.isGas ? '(camera ' + s.tipo + ')' : '(' + s.tipo + ')'}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid ' + T.acc, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>SPESSORE TOTALE</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>{strati.reduce((s, x) => s + x.spessore, 0)} mm</span>
              </div>
            </div>
          )}
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
