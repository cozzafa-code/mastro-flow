// components/settings-mobile/SettingsAccessoriMobile.tsx
// Catalogo Accessori mobile cablato Supabase tabella catalogo_accessori.

'use client'

import React, { useEffect, useState } from 'react'
import { T, numStyle } from '../home-mobile/HomeUI'
import { useMastro } from '../MastroContext'

const BUCKET = 'accessori-files'

interface Accessorio {
  id: string
  azienda_id: string | null
  categoria: string | null
  nome: string
  codice: string | null
  attivo: boolean
  sistema_id: string | null
  descrizione: string | null
  tipo: string | null
  unita_misura: string | null
  prezzo_unitario: number | null
  note: string | null
  fornitore: string | null
  sottotipo: string | null
  materiale: string | null
  compatibile_serie: any
  compatibile_tipi: any
  min_peso_anta: number | null
  max_peso_anta: number | null
  min_larghezza: number | null
  max_larghezza: number | null
  min_altezza: number | null
  max_altezza: number | null
  posizione: string | null
  distanza_angolo_min: number | null
  distanza_angolo_max: number | null
  quantita_per_anta: number | null
  regola_quantita: string | null
  prezzo: number | null
  peso: number | null
  immagine_url: string | null
  scheda_tecnica_url: string | null
  created_at?: string
  updated_at?: string
}

interface Sistema { id: string; marca: string; sistema: string }

const CAMPI_NON_UPDATABILI = ['id', 'created_at', 'updated_at']
const CATEGORIE = ['ferramenta', 'accessori', 'attrezzatura', 'Maniglie', 'Squadrette']
const POSIZIONI = ['anta', 'telaio', 'angolo', 'centro', 'alto', 'basso', 'laterale']

function pulisci(p: any): any {
  const out: any = {}
  for (const k of Object.keys(p)) {
    if (!CAMPI_NON_UPDATABILI.includes(k)) out[k] = p[k]
  }
  return out
}

function isUrl(s: string | null): boolean {
  if (!s) return false
  return s.startsWith('http://') || s.startsWith('https://')
}

async function uploadStorage(sb: any, file: File, accId: string, tipo: string): Promise<string | null> {
  try {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = 'accessorio_' + accId + '/' + tipo + '_' + Date.now() + '.' + ext
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (upErr) { alert('Errore upload: ' + upErr.message); return null }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
    return data?.publicUrl || null
  } catch (e: any) { alert('Errore upload: ' + (e?.message || e)); return null }
}

export default function SettingsAccessoriMobile({ onBack }: { onBack: () => void }) {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [accessori, setAccessori] = useState<Accessorio[]>([])
  const [sistemi, setSistemi] = useState<Sistema[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCat, setFiltroCat] = useState<string>('tutti')
  const [selected, setSelected] = useState<Accessorio | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { supabase: sb } = await import('@/lib/supabase')
        const [acc, sis] = await Promise.all([
          sb.from('catalogo_accessori').select('*').order('nome'),
          sb.from('sistemi_profilo').select('*'),
        ])
        if (!mounted) return
        if (acc.data) setAccessori(acc.data as Accessorio[])
        if (sis.data) setSistemi(sis.data as Sistema[])
      } catch (e) { console.error(e) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const aggiorna = async (a: Accessorio) => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const dati = pulisci(a)
      const { data, error } = await sb.from('catalogo_accessori').update(dati).eq('id', a.id).select().single()
      if (error) { alert('Errore: ' + error.message); return }
      const aggiornato = (data || a) as Accessorio
      setAccessori(prev => prev.map(x => x.id === a.id ? aggiornato : x))
      setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo accessorio?')) return
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const { error } = await sb.from('catalogo_accessori').delete().eq('id', id)
      if (error) { alert('Errore: ' + error.message); return }
      setAccessori(prev => prev.filter(x => x.id !== id))
      setSelected(null)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const aggiungi = async () => {
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const azienda_id = ctx?.aziendaIdReal || ctx?.aziendaInfo?.id || null
      const nuovo = {
        nome: 'Nuovo accessorio',
        codice: 'ACC-' + Date.now(),
        categoria: 'ferramenta',
        materiale: 'acciaio',
        attivo: true,
        azienda_id,
      }
      const { data, error } = await sb.from('catalogo_accessori').insert([nuovo]).select().single()
      if (error) { alert('Errore: ' + error.message); return }
      setAccessori(prev => [...prev, data as Accessorio])
      setSelected(data as Accessorio)
    } catch (e: any) { alert('Errore: ' + (e?.message || e)) }
  }

  const filtrati = accessori.filter(a => {
    if (filtroCat !== 'tutti') {
      if (filtroCat === 'senza' && a.categoria) return false
      if (filtroCat !== 'senza' && a.categoria !== filtroCat) return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    return (a.nome || '').toLowerCase().includes(q) ||
           (a.codice || '').toLowerCase().includes(q) ||
           (a.descrizione || '').toLowerCase().includes(q)
  })

  if (selected) {
    return <DettaglioAccessorio
      acc={selected}
      sistemi={sistemi}
      onBack={() => setSelected(null)}
      onSave={aggiorna}
      onDelete={() => elimina(selected.id)}
    />
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      <Header onBack={onBack} totale={accessori.length} />

      <div style={{ padding: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome o codice..."
          style={{ width: '100%', padding: '12px 14px', border: '1px solid ' + T.bdr, borderRadius: 12, fontSize: 14, background: '#FFF', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
        />

        {/* Filtro categoria - chip orizzontali scrollabili */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, scrollbarWidth: 'none' }}>
          <Chip label="Tutti" attivo={filtroCat === 'tutti'} onClick={() => setFiltroCat('tutti')} />
          {CATEGORIE.map(c => (
            <Chip key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} attivo={filtroCat === c} onClick={() => setFiltroCat(c)} />
          ))}
          <Chip label="Senza categoria" attivo={filtroCat === 'senza'} onClick={() => setFiltroCat('senza')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <Kpi value={accessori.length} label="Totali" color={T.acc} />
          <Kpi value={accessori.filter(a => a.prezzo_unitario != null).length} label="Con prezzo" color={T.numTeal} />
          <Kpi value={accessori.filter(a => a.immagine_url).length} label="Con foto" color={T.numBlue} />
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13 }}>Carico catalogo...</div>
        ) : filtrati.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13 }}>
            {accessori.length === 0 ? 'Nessun accessorio nel catalogo' : 'Nessun accessorio in questa categoria'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrati.map(a => <RigaAccessorio key={a.id} a={a} onClick={() => setSelected(a)} />)}
          </div>
        )}

        <button onClick={aggiungi} style={{ width: '100%', marginTop: 14, background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,118,110,0.15)' }}>+ AGGIUNGI ACCESSORIO</button>
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
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', WebkitFontSmoothing: 'antialiased' }}>Accessori</div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{totale} {totale === 1 ? 'accessorio' : 'accessori'} in catalogo</div>
    </div>
  )
}

function Chip({ label, attivo, onClick }: { label: string; attivo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      padding: '8px 14px',
      borderRadius: 999,
      border: '1px solid ' + (attivo ? T.acc : T.bdr),
      background: attivo ? T.acc : '#FFF',
      color: attivo ? '#FFF' : T.text,
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}>{label}</button>
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

function RigaAccessorio({ a, onClick }: { a: Accessorio; onClick: () => void }) {
  const inattivo = a.attivo === false
  const cat = a.categoria || 'senza cat.'
  const colCat = a.categoria === 'ferramenta' ? T.numTeal :
                 a.categoria === 'Maniglie' ? T.numAmber :
                 a.categoria === 'Squadrette' ? T.numBlue :
                 a.categoria === 'attrezzatura' ? '#6B5BA6' :
                 T.muted

  return (
    <button onClick={onClick} style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', width: '100%', textAlign: 'left', opacity: inattivo ? 0.5 : 1 }}>
      {isUrl(a.immagine_url) ? (
        <img src={a.immagine_url!} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 10, background: colCat + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: colCat, flexShrink: 0, textAlign: 'center', padding: 4 }}>
          {cat.slice(0, 6).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
        <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.codice ? a.codice + ' - ' : ''}{a.materiale || 'n.d.'}
        </div>
        <div style={{ fontSize: 10, color: colCat, marginTop: 2, fontWeight: 600 }}>
          {cat}
          {a.prezzo_unitario != null ? ' - EUR ' + a.prezzo_unitario : ''}
          {a.peso ? ' - ' + a.peso + 'kg' : ''}
        </div>
      </div>
      <div style={{ color: T.acc, fontSize: 18, fontWeight: 700 }}>&rsaquo;</div>
    </button>
  )
}

// ────────── DETTAGLIO ──────────

function DettaglioAccessorio({ acc, sistemi, onBack, onSave, onDelete }: {
  acc: Accessorio; sistemi: Sistema[]; onBack: () => void; onSave: (a: Accessorio) => void; onDelete: () => void
}) {
  const [a, setA] = useState<Accessorio>(acc)
  const [tabAttiva, setTabAttiva] = useState<'base' | 'vincoli' | 'compat' | 'file'>('base')
  const [uploading, setUploading] = useState<string | null>(null)
  const f = (k: keyof Accessorio) => (val: any) => setA(prev => ({ ...prev, [k]: val }))

  const uploadCampo = (campo: 'immagine_url' | 'scheda_tecnica_url') => async (e: any) => {
    const file: File | undefined = e.target.files?.[0]
    if (!file) return
    setUploading(campo)
    try {
      const { supabase: sb } = await import('@/lib/supabase')
      const url = await uploadStorage(sb, file, a.id, campo.replace('_url', ''))
      if (url) {
        const aggiornato = { ...a, [campo]: url }
        setA(aggiornato)
        const dati = pulisci(aggiornato)
        await sb.from('catalogo_accessori').update(dati).eq('id', a.id)
      }
    } finally { setUploading(null) }
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      <div style={{ background: 'linear-gradient(160deg, ' + T.acc + ' 0%, ' + T.accDeep + ' 100%)', padding: '14px 16px 22px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', width: 36, height: 36, borderRadius: 10, color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>&lsaquo;</button>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Accessori &rsaquo; Dettaglio</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{a.nome || 'Senza nome'}</div>
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '12px 16px 0', borderBottom: '1px solid ' + T.bdr, background: T.bg, overflowX: 'auto' }}>
        {([['base','Base'],['vincoli','Vincoli'],['compat','Compatib.'],['file','File']] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTabAttiva(id)} style={{
            flex: 1, minWidth: 80,
            padding: '10px 8px', background: 'transparent', border: 'none',
            borderBottom: tabAttiva === id ? '2px solid ' + T.acc : '2px solid transparent',
            fontSize: 12, fontWeight: 600, color: tabAttiva === id ? T.acc : T.muted, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tabAttiva === 'base' && <>
          {isUrl(a.immagine_url) && (
            <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 8, textAlign: 'center' }}>
              <img src={a.immagine_url!} alt="" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
            </div>
          )}
          <Field label="Nome" value={a.nome || ''} onChange={f('nome')} />
          <Field label="Codice" value={a.codice || ''} onChange={f('codice')} />
          <Row>
            <Select label="Categoria" value={a.categoria || ''} onChange={v => f('categoria')(v || null)}
              options={[{ v: '', l: 'Nessuna' }, ...CATEGORIE.map(c => ({ v: c, l: c }))]} />
            <Field label="Sottotipo" value={a.sottotipo || ''} onChange={f('sottotipo')} placeholder="es. cerniera 3D" />
          </Row>
          <Row>
            <Field label="Tipo" value={a.tipo || ''} onChange={f('tipo')} placeholder="cerniera, vite..." />
            <Field label="Materiale" value={a.materiale || ''} onChange={f('materiale')} placeholder="acciaio, ottone..." />
          </Row>
          <Field label="Fornitore" value={a.fornitore || ''} onChange={f('fornitore')} placeholder="Roto, Maico, Hoppe..." />
          <Field label="Descrizione" value={a.descrizione || ''} onChange={f('descrizione')} />
          <Row>
            <Field label="Prezzo unitario EUR" value={a.prezzo_unitario ?? ''} onChange={v => f('prezzo_unitario')(v === '' ? null : Number(v))} type="number" step="0.01" />
            <Field label="Unita misura" value={a.unita_misura || ''} onChange={f('unita_misura')} placeholder="pz, kg, ml..." />
          </Row>
          <Field label="Peso unitario kg" value={a.peso ?? ''} onChange={v => f('peso')(v === '' ? null : Number(v))} type="number" step="0.001" />
        </>}

        {tabAttiva === 'vincoli' && <>
          <div style={{ background: T.tealSoft, border: '1px solid ' + T.bdr, borderRadius: 10, padding: '10px 12px', fontSize: 11, color: T.text }}>
            Limiti applicazione e regole di quantita per il calcolo automatico nei preventivi.
          </div>
          <Row>
            <Field label="Min peso anta kg" value={a.min_peso_anta ?? ''} onChange={v => f('min_peso_anta')(v === '' ? null : Number(v))} type="number" />
            <Field label="Max peso anta kg" value={a.max_peso_anta ?? ''} onChange={v => f('max_peso_anta')(v === '' ? null : Number(v))} type="number" />
          </Row>
          <Row>
            <Field label="Min larghezza mm" value={a.min_larghezza ?? ''} onChange={v => f('min_larghezza')(v === '' ? null : Number(v))} type="number" />
            <Field label="Max larghezza mm" value={a.max_larghezza ?? ''} onChange={v => f('max_larghezza')(v === '' ? null : Number(v))} type="number" />
          </Row>
          <Row>
            <Field label="Min altezza mm" value={a.min_altezza ?? ''} onChange={v => f('min_altezza')(v === '' ? null : Number(v))} type="number" />
            <Field label="Max altezza mm" value={a.max_altezza ?? ''} onChange={v => f('max_altezza')(v === '' ? null : Number(v))} type="number" />
          </Row>
          <Select label="Posizione applicazione" value={a.posizione || ''} onChange={v => f('posizione')(v || null)}
            options={[{ v: '', l: 'Nessuna' }, ...POSIZIONI.map(p => ({ v: p, l: p }))]} />
          <Row>
            <Field label="Distanza angolo min mm" value={a.distanza_angolo_min ?? ''} onChange={v => f('distanza_angolo_min')(v === '' ? null : Number(v))} type="number" />
            <Field label="Distanza angolo max mm" value={a.distanza_angolo_max ?? ''} onChange={v => f('distanza_angolo_max')(v === '' ? null : Number(v))} type="number" />
          </Row>
          <Row>
            <Field label="Quantita per anta" value={a.quantita_per_anta ?? ''} onChange={v => f('quantita_per_anta')(v === '' ? null : Number(v))} type="number" />
            <Field label="Regola quantita" value={a.regola_quantita || ''} onChange={f('regola_quantita')} placeholder="formula" />
          </Row>
        </>}

        {tabAttiva === 'compat' && <>
          <div style={{ background: T.tealSoft, border: '1px solid ' + T.bdr, borderRadius: 10, padding: '10px 12px', fontSize: 11, color: T.text }}>
            Sistemi e tipologie compatibili. Filtri usati nel CAD per mostrare solo accessori applicabili.
          </div>
          <Select label="Sistema profilo principale" value={a.sistema_id || ''} onChange={v => f('sistema_id')(v || null)}
            options={[{ v: '', l: 'Tutti i sistemi' }, ...sistemi.map(s => ({ v: s.id, l: s.marca + ' ' + s.sistema }))]} />

          <MultiTagField label="Serie compatibili" value={a.compatibile_serie}
            onChange={v => f('compatibile_serie')(v)}
            placeholder="es. IDEAL 4000, CX600..." />

          <MultiTagField label="Tipi anta compatibili" value={a.compatibile_tipi}
            onChange={v => f('compatibile_tipi')(v)}
            placeholder="anta-ribalta, scorrevole..." />

          <Field label="Note compatibilita" value={a.note || ''} onChange={f('note')} />
        </>}

        {tabAttiva === 'file' && <>
          <FileBox label="IMMAGINE" url={a.immagine_url} accept="image/*" onChange={uploadCampo('immagine_url')} preview busy={uploading === 'immagine_url'} />
          <FileBox label="SCHEDA TECNICA PDF" url={a.scheda_tecnica_url} accept=".pdf" onChange={uploadCampo('scheda_tecnica_url')} busy={uploading === 'scheda_tecnica'} />
        </>}

        <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Accessorio attivo</span>
          <button onClick={() => f('attivo')(!a.attivo)} style={{ width: 48, height: 28, borderRadius: 14, background: a.attivo !== false ? T.acc : T.bdr, border: 'none', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 2, left: a.attivo !== false ? 22 : 2, width: 24, height: 24, borderRadius: '50%', background: '#FFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={() => onSave(a)} style={{ flex: 1, background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: 14, fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>SALVA</button>
          <button onClick={onDelete} style={{ background: '#FFF', color: T.numRed, border: '1px solid ' + T.numRed + '40', borderRadius: 12, padding: '14px 18px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>ELIMINA</button>
        </div>
      </div>
    </div>
  )
}

// ────────── HELPERS ──────────

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

type Opt = string | { v: string; l: string }
function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: Opt[];
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + T.bdr, borderRadius: 10, fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box' }}>
        {options.map((o, i) => {
          const v = typeof o === 'string' ? o : o.v
          const l = typeof o === 'string' ? (o || 'Nessuno') : o.l
          return <option key={i} value={v}>{l}</option>
        })}
      </select>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>
}

function MultiTagField({ label, value, onChange, placeholder }: {
  label: string; value: any; onChange: (v: any) => void; placeholder?: string
}) {
  // value puo essere array, jsonb, o null
  const arr = Array.isArray(value) ? value : (value ? [value] : [])
  const [input, setInput] = useState('')

  const add = () => {
    const t = input.trim()
    if (!t) return
    onChange([...arr, t])
    setInput('')
  }

  const rm = (i: number) => {
    const out = [...arr]
    out.splice(i, 1)
    onChange(out.length ? out : null)
  }

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      {arr.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {arr.map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: T.tealSoft, color: T.numTeal, borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
              {String(t)}
              <button onClick={() => rm(i)} style={{ background: 'transparent', border: 'none', color: T.numTeal, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder || 'Aggiungi e premi invio'}
          style={{ flex: 1, padding: '10px 12px', border: '1px solid ' + T.bdr, borderRadius: 10, fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box' }}
        />
        <button onClick={add} style={{ padding: '10px 14px', background: T.acc, color: '#FFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+</button>
      </div>
    </div>
  )
}

function FileBox({ label, url, accept, onChange, preview, busy }: {
  label: string; url: string | null; accept: string; onChange: (e: any) => void; preview?: boolean; busy?: boolean;
}) {
  const ha = isUrl(url)
  return (
    <div>
      {preview && ha && (
        <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 8, textAlign: 'center', marginBottom: 8 }}>
          <img src={url!} alt="" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
        </div>
      )}
      <label style={{ background: ha ? T.tealSoft : '#FFF', border: '1px solid ' + (ha ? T.numTeal + '40' : T.bdr), borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: ha ? T.numTeal : T.bdr, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>+</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.4 }}>{label}</div>
          <div style={{ fontSize: 12, color: ha ? T.numTeal : T.muted, fontWeight: 500 }}>
            {busy ? 'Caricamento in corso...' : (ha ? 'Caricato - tap per cambiare' : 'Tocca per caricare')}
          </div>
        </div>
        <input type="file" accept={accept} onChange={onChange} disabled={busy} style={{ display: 'none' }} />
      </label>
      {ha && url && url.toLowerCase().endsWith('.pdf') && (
        <a href={url} target="_blank" rel="noopener" style={{ display: 'block', marginTop: 6, textAlign: 'center', fontSize: 12, color: T.acc, fontWeight: 600 }}>Apri PDF in nuova scheda</a>
      )}
    </div>
  )
}
