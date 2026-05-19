'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PROD_COLORS } from '../prod-constants'

interface Props {
  aziendaId: string
  onChiudi: () => void
  onCreatoCommessa: (commessaId: string) => void
  onCreatoLavorazione: () => void
  onCreatoRiparazione: () => void
  onApriSelettoreCommesse: () => void
}

type Step = 'tipo' | 'commessa_interna' | 'lavorazione_libera' | 'riparazione'
type TipoLav = 'manutenzione' | 'formazione' | 'pulizia' | 'prototipo' | 'campione' | 'altro'

export default function WizardNuovaLavorazione({ aziendaId, onChiudi, onCreatoLavorazione, onCreatoRiparazione, onApriSelettoreCommesse }: Props) {
  const [step, setStep] = useState<Step>('tipo')
  
  return (
    <div style={overlay}>
      <div style={modalBox}>
        <Header step={step} onChiudi={onChiudi} onIndietro={() => setStep('tipo')} />
        {step === 'tipo' && (
          <ScelteTipo 
            onCommessaCliente={() => { onChiudi(); onApriSelettoreCommesse() }}
            onCommessaInterna={() => setStep('commessa_interna')}
            onLavLibera={() => setStep('lavorazione_libera')}
            onRiparazione={() => setStep('riparazione')}
          />
        )}
        {step === 'lavorazione_libera' && <FormLavorazione aziendaId={aziendaId} onFatto={() => { onCreatoLavorazione(); onChiudi() }} />}
        {step === 'commessa_interna' && <FormCommessaInterna aziendaId={aziendaId} onFatto={() => { onCreatoLavorazione(); onChiudi() }} />}
        {step === 'riparazione' && <FormRiparazione aziendaId={aziendaId} onFatto={() => { onCreatoRiparazione(); onChiudi() }} />}
      </div>
    </div>
  )
}

function Header({ step, onChiudi, onIndietro }: { step: Step; onChiudi: () => void; onIndietro: () => void }) {
  const titoli: Record<Step, string> = {
    tipo: 'Nuova lavorazione',
    commessa_interna: 'Commessa interna',
    lavorazione_libera: 'Lavorazione libera',
    riparazione: 'Riparazione cliente'
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {step !== 'tipo' && <button onClick={onIndietro} style={{ background: 'none', border: 'none', fontSize: 18, color: PROD_COLORS.textDim, cursor: 'pointer', padding: 4 }}>‹</button>}
        <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy }}>{titoli[step]}</div>
      </div>
      <button onClick={onChiudi} style={{ background: 'none', border: 'none', fontSize: 22, color: PROD_COLORS.textDim, cursor: 'pointer' }}>×</button>
    </div>
  )
}

function ScelteTipo({ onCommessaCliente, onCommessaInterna, onLavLibera, onRiparazione }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <BigOption icon="📦" titolo="Commessa cliente" sottotitolo="Avvia produzione da commessa esistente" colore={PROD_COLORS.teal} onClick={onCommessaCliente} />
      <BigOption icon="🏭" titolo="Commessa interna" sottotitolo="Campione, prototipo, vano showroom" colore={PROD_COLORS.amber} onClick={onCommessaInterna} />
      <BigOption icon="🔧" titolo="Lavorazione libera" sottotitolo="Manutenzione, formazione, pulizia officina" colore="#6B7280" onClick={onLavLibera} />
      <BigOption icon="🛠" titolo="Riparazione cliente" sottotitolo="Post-vendita, garanzia, intervento" colore={PROD_COLORS.red} onClick={onRiparazione} />
    </div>
  )
}

function BigOption({ icon, titolo, sottotitolo, colore, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#FFF', border: `1px solid ${PROD_COLORS.borderSoft}`,
      borderLeft: `4px solid ${colore}`, borderRadius: 8,
      padding: '12px 14px', cursor: 'pointer', textAlign: 'left'
    }}>
      <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PROD_COLORS.navy }}>{titolo}</div>
        <div style={{ fontSize: 11, color: PROD_COLORS.textDim, marginTop: 1 }}>{sottotitolo}</div>
      </div>
      <div style={{ fontSize: 18, color: PROD_COLORS.textDim }}>›</div>
    </button>
  )
}

function FormLavorazione({ aziendaId, onFatto }: any) {
  const [tipo, setTipo] = useState<TipoLav>('manutenzione')
  const [titolo, setTitolo] = useState('')
  const [descr, setDescr] = useState('')
  const [ore, setOre] = useState(1)
  const [operatori, setOperatori] = useState<any[]>([])
  const [opSel, setOpSel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('operatori').select('id, nome, cognome, colore').eq('azienda_id', aziendaId).eq('attivo', true).order('nome').then(r => setOperatori(r.data || []))
  }, [aziendaId])

  const handleSalva = async () => {
    if (!titolo.trim()) return alert('Inserisci titolo')
    setSaving(true)
    const res = await supabase.rpc('crea_lavorazione_interna', {
      p_azienda_id: aziendaId, p_tipo: tipo, p_titolo: titolo, p_descrizione: descr || null,
      p_data_pianificata: new Date().toISOString().split('T')[0], p_ore_stimate: ore,
      p_fase_id: null, p_operatore_id: opSel
    })
    setSaving(false)
    if (res.error) alert('Errore: ' + res.error.message)
    else onFatto()
  }

  const tipi: { v: TipoLav; l: string; e: string }[] = [
    { v: 'manutenzione', l: 'Manutenzione', e: '🔧' },
    { v: 'pulizia', l: 'Pulizia', e: '🧹' },
    { v: 'formazione', l: 'Formazione', e: '📚' },
    { v: 'prototipo', l: 'Prototipo', e: '🧪' },
    { v: 'campione', l: 'Campione', e: '🎨' },
    { v: 'altro', l: 'Altro', e: '⚙️' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SecLabel>TIPO LAVORAZIONE</SecLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
        {tipi.map(t => (
          <button key={t.v} onClick={() => setTipo(t.v)} style={{
            background: tipo === t.v ? PROD_COLORS.navy : '#FFF',
            color: tipo === t.v ? '#FFF' : PROD_COLORS.navy,
            border: tipo === t.v ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
            padding: 10, borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
          }}>
            <span style={{ fontSize: 18 }}>{t.e}</span>{t.l}
          </button>
        ))}
      </div>
      
      <SecLabel>TITOLO</SecLabel>
      <input value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es. Manutenzione saldatrice Yilmaz" style={inputStyle} />
      
      <SecLabel>DESCRIZIONE (opz.)</SecLabel>
      <textarea value={descr} onChange={e => setDescr(e.target.value)} placeholder="Dettagli..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }} />

      <SecLabel>ORE STIMATE</SecLabel>
      <input type="number" min="0.25" step="0.25" value={ore} onChange={e => setOre(parseFloat(e.target.value) || 1)} style={inputStyle} />

      <SecLabel>ASSEGNA A (opz.)</SecLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
        {operatori.map(op => (
          <button key={op.id} onClick={() => setOpSel(opSel === op.id ? null : op.id)} style={{
            background: opSel === op.id ? (op.colore || PROD_COLORS.teal) : '#FFF',
            color: opSel === op.id ? '#FFF' : PROD_COLORS.navy,
            border: opSel === op.id ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
            padding: '5px 10px', borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: 'pointer'
          }}>{op.nome} {(op.cognome || '')[0]}.</button>
        ))}
      </div>

      <button onClick={handleSalva} disabled={saving || !titolo} style={{
        background: PROD_COLORS.teal, color: '#FFF', border: 'none',
        padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        marginTop: 8, opacity: saving || !titolo ? 0.5 : 1
      }}>{saving ? 'SALVO...' : '✓ CREA LAVORAZIONE'}</button>
    </div>
  )
}

function FormCommessaInterna({ aziendaId, onFatto }: any) {
  const [titolo, setTitolo] = useState('')
  const [descr, setDescr] = useState('')
  const [ore, setOre] = useState(4)
  const [saving, setSaving] = useState(false)
  const [opSel, setOpSel] = useState<string | null>(null)
  const [operatori, setOperatori] = useState<any[]>([])

  useEffect(() => {
    supabase.from('operatori').select('id, nome, cognome, colore').eq('azienda_id', aziendaId).eq('attivo', true).order('nome').then(r => setOperatori(r.data || []))
  }, [aziendaId])

  const handleSalva = async () => {
    if (!titolo.trim()) return alert('Inserisci titolo')
    setSaving(true)
    // Per ora: lo creo come lavorazione_interna tipo "campione" o "prototipo"
    const res = await supabase.rpc('crea_lavorazione_interna', {
      p_azienda_id: aziendaId, p_tipo: 'campione', p_titolo: titolo, p_descrizione: descr || null,
      p_data_pianificata: new Date().toISOString().split('T')[0], p_ore_stimate: ore,
      p_fase_id: null, p_operatore_id: opSel
    })
    setSaving(false)
    if (res.error) alert('Errore: ' + res.error.message)
    else onFatto()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: PROD_COLORS.amberBg, padding: 10, borderRadius: 8, fontSize: 11, color: PROD_COLORS.amberText, lineHeight: 1.5 }}>
        Per campioni fiera, prototipi o vani showroom. Non genera fattura cliente.
      </div>
      <SecLabel>NOME LAVORO</SecLabel>
      <input value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es. Campione fiera MADE Expo · finestra PVC bianca" style={inputStyle} />
      <SecLabel>DESCRIZIONE</SecLabel>
      <textarea value={descr} onChange={e => setDescr(e.target.value)} placeholder="Misure, sistema, vetro, accessori..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const }} />
      <SecLabel>ORE STIMATE</SecLabel>
      <input type="number" min="0.5" step="0.5" value={ore} onChange={e => setOre(parseFloat(e.target.value) || 4)} style={inputStyle} />
      <SecLabel>ASSEGNA A (opz.)</SecLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
        {operatori.map(op => (
          <button key={op.id} onClick={() => setOpSel(opSel === op.id ? null : op.id)} style={{
            background: opSel === op.id ? (op.colore || PROD_COLORS.teal) : '#FFF',
            color: opSel === op.id ? '#FFF' : PROD_COLORS.navy,
            border: opSel === op.id ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
            padding: '5px 10px', borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: 'pointer'
          }}>{op.nome} {(op.cognome || '')[0]}.</button>
        ))}
      </div>
      <button onClick={handleSalva} disabled={saving || !titolo} style={{ background: PROD_COLORS.amber, color: PROD_COLORS.navy, border: 'none', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8, opacity: saving || !titolo ? 0.5 : 1 }}>
        {saving ? 'SALVO...' : '✓ CREA COMMESSA INTERNA'}
      </button>
    </div>
  )
}

function FormRiparazione({ aziendaId, onFatto }: any) {
  const [cliente, setCliente] = useState('')
  const [tel, setTel] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [vanoDescr, setVanoDescr] = useState('')
  const [problema, setProblema] = useState('')
  const [garanzia, setGaranzia] = useState(true)
  const [ore, setOre] = useState(1)
  const [saving, setSaving] = useState(false)

  const handleSalva = async () => {
    if (!cliente.trim() || !problema.trim()) return alert('Cliente e problema obbligatori')
    setSaving(true)
    const res = await supabase.rpc('crea_riparazione_esterna', {
      p_azienda_id: aziendaId, p_commessa_origine_id: null,
      p_cliente: cliente, p_indirizzo: indirizzo || null, p_telefono: tel || null,
      p_vano_descr: vanoDescr || null, p_problema: problema, p_in_garanzia: garanzia,
      p_data_pianificata: new Date().toISOString().split('T')[0], p_ore_stimate: ore, p_operatore_id: null
    })
    setSaving(false)
    if (res.error) alert('Errore: ' + res.error.message)
    else onFatto()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SecLabel>CLIENTE *</SecLabel>
      <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome cognome" style={inputStyle} />
      <SecLabel>TELEFONO</SecLabel>
      <input value={tel} onChange={e => setTel(e.target.value)} placeholder="+39..." style={inputStyle} />
      <SecLabel>INDIRIZZO</SecLabel>
      <input value={indirizzo} onChange={e => setIndirizzo(e.target.value)} placeholder="Via..." style={inputStyle} />
      <SecLabel>VANO</SecLabel>
      <input value={vanoDescr} onChange={e => setVanoDescr(e.target.value)} placeholder="Es. Finestra cucina 2 ante PVC bianco" style={inputStyle} />
      <SecLabel>PROBLEMA *</SecLabel>
      <textarea value={problema} onChange={e => setProblema(e.target.value)} placeholder="Cerniera rotta, vetro infranto..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }} />
      <SecLabel>ORE STIMATE</SecLabel>
      <input type="number" min="0.25" step="0.25" value={ore} onChange={e => setOre(parseFloat(e.target.value) || 1)} style={inputStyle} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: PROD_COLORS.navy, marginTop: 4, cursor: 'pointer' }}>
        <input type="checkbox" checked={garanzia} onChange={e => setGaranzia(e.target.checked)} /> Intervento in garanzia
      </label>
      <button onClick={handleSalva} disabled={saving || !cliente || !problema} style={{ background: PROD_COLORS.red, color: '#FFF', border: 'none', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8, opacity: saving || !cliente || !problema ? 0.5 : 1 }}>
        {saving ? 'SALVO...' : '✓ APRI RIPARAZIONE'}
      </button>
    </div>
  )
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.6, fontWeight: 600, marginBottom: 0, marginTop: 2 }}>{children}</div>
}

const inputStyle: React.CSSProperties = { width: '100%', padding: 10, border: `1px solid ${PROD_COLORS.borderSoft}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', color: PROD_COLORS.navy, outline: 'none' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }
const modalBox: React.CSSProperties = { background: '#FFF', borderRadius: 12, padding: 16, width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto' }
