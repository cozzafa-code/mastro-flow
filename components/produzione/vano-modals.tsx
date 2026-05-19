import React, { useEffect, useState } from 'react'
import { PROD_COLORS } from './prod-constants'
import { fetchOperatoriDisponibili, fetchMacchinePerFase, spostaOperatoreVano, avviaFaseRpc, bloccaFaseRpc } from '@/hooks/useVanoDetail'

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }
const sheetBox: React.CSSProperties = { background: '#FFF', borderRadius: '14px 14px 0 0', padding: 16, width: '100%', maxWidth: 380, maxHeight: '70vh', overflowY: 'auto' }

export function SheetSpostaOperatore({ aziendaId, vanoStatoId, onChiudi, onFatto }: { aziendaId: string; vanoStatoId: string; onChiudi: () => void; onFatto: () => void }) {
  const [operatori, setOperatori] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  useEffect(() => { fetchOperatoriDisponibili(aziendaId).then(d => { setOperatori(d); setLoading(false) }) }, [aziendaId])

  const handleScegli = async (opId: string) => {
    setSaving(opId)
    const ok = await spostaOperatoreVano(vanoStatoId, opId)
    if (ok) onFatto(); else { alert('Errore'); setSaving(null) }
  }

  return (
    <div onClick={onChiudi} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheetBox}>
        <Titolo titolo="Sposta operatore" onChiudi={onChiudi} />
        {loading ? <Empty>Caricamento...</Empty>
        : operatori.length === 0 ? <Empty>Nessun operatore disponibile</Empty>
        : operatori.map(op => <RigaOperatore key={op.id} op={op} attesa={saving === op.id} dim={saving && saving !== op.id} onClick={() => !saving && handleScegli(op.id)} />)}
      </div>
    </div>
  )
}

export function SheetAvviaFase({ aziendaId, vanoId, faseId, faseNome, caricoId, commessaId, onChiudi, onFatto }: { aziendaId: string; vanoId: string; faseId: string; faseNome: string; caricoId: string | null; commessaId: string; onChiudi: () => void; onFatto: () => void }) {
  const [operatori, setOperatori] = useState<any[]>([])
  const [macchine, setMacchine] = useState<any[]>([])
  const [opSel, setOpSel] = useState<string | null>(null)
  const [macSel, setMacSel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchOperatoriDisponibili(aziendaId),
      fetchMacchinePerFase(aziendaId, faseId)
    ]).then(([ops, macs]) => {
      setOperatori(ops); setMacchine(macs)
      if (macs.length === 1) setMacSel(macs[0].nome)
      setLoading(false)
    })
  }, [aziendaId, faseId])

  const handleAvvia = async () => {
    if (!opSel) return alert('Scegli operatore')
    if (!caricoId) return alert('Carico produzione non trovato. Avvia prima la commessa.')
    setSaving(true)
    try {
      await avviaFaseRpc({
        vanoId, faseId, caricoId, operatoreId: opSel, macchina: macSel || '',
        aziendaId, commessaId
      })
      onFatto()
    } catch (e: any) { alert('Errore: ' + e.message); setSaving(false) }
  }

  return (
    <div onClick={onChiudi} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheetBox}>
        <Titolo titolo={`Avvia ${faseNome}`} onChiudi={onChiudi} />
        {loading ? <Empty>Caricamento...</Empty> : (
          <>
            <div style={sec}>OPERATORE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {operatori.map(op => {
                const init = (op.nome[0] || '') + ((op.cognome || '')[0] || '')
                return (
                  <button key={op.id} onClick={() => setOpSel(op.id)} style={{
                    background: opSel === op.id ? PROD_COLORS.teal : '#FFF',
                    color: opSel === op.id ? '#FFF' : PROD_COLORS.navy,
                    border: opSel === op.id ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
                    padding: '8px 12px', borderRadius: 18, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                  }}>
                    <span style={{ width: 18, height: 18, background: opSel === op.id ? '#FFF' : (op.colore || PROD_COLORS.teal), color: opSel === op.id ? PROD_COLORS.teal : '#FFF', borderRadius: '50%', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{init}</span>
                    {op.nome} {(op.cognome || '')[0] || ''}.
                  </button>
                )
              })}
            </div>

            {macchine.length > 0 && (
              <>
                <div style={sec}>MACCHINA</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {macchine.map((m: any) => (
                    <button key={m.id} onClick={() => setMacSel(m.nome)} style={{
                      background: macSel === m.nome ? PROD_COLORS.navy : '#FFF',
                      color: macSel === m.nome ? '#FFF' : PROD_COLORS.navy,
                      border: macSel === m.nome ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
                      padding: '6px 12px', borderRadius: 18, fontSize: 11, fontWeight: 500, cursor: 'pointer'
                    }}>{m.nome}</button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onChiudi} style={btnSec}>ANNULLA</button>
              <button onClick={handleAvvia} disabled={saving || !opSel} style={{ ...btnPri, opacity: !opSel || saving ? 0.4 : 1 }}>{saving ? 'AVVIO...' : 'AVVIA FASE'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function SheetBloccaFase({ vanoStatoId, faseNome, onChiudi, onFatto }: { vanoStatoId: string; faseNome: string; onChiudi: () => void; onFatto: () => void }) {
  const [problema, setProblema] = useState('')
  const [saving, setSaving] = useState(false)
  const presets = ['Materiale mancante', 'Errore fornitore', 'Macchina guasta', 'Misura sbagliata', 'Operatore non disponibile']

  const handleBlocca = async () => {
    if (!problema.trim()) return alert('Descrivi il problema')
    setSaving(true)
    try { await bloccaFaseRpc(vanoStatoId, problema); onFatto() }
    catch (e: any) { alert('Errore: ' + e.message); setSaving(false) }
  }

  return (
    <div onClick={onChiudi} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheetBox}>
        <Titolo titolo={`Blocca ${faseNome}`} onChiudi={onChiudi} />
        <div style={sec}>MOTIVO RAPIDO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {presets.map(p => (
            <button key={p} onClick={() => setProblema(p)} style={{
              background: problema === p ? PROD_COLORS.red : '#FFF',
              color: problema === p ? '#FFF' : PROD_COLORS.navy,
              border: problema === p ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
              padding: '5px 10px', borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: 'pointer'
            }}>{p}</button>
          ))}
        </div>
        <div style={sec}>DESCRIZIONE</div>
        <textarea value={problema} onChange={e => setProblema(e.target.value)} placeholder="Descrivi il problema..." style={{ width: '100%', minHeight: 80, padding: 10, border: `1px solid ${PROD_COLORS.borderSoft}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14, color: PROD_COLORS.navy }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onChiudi} style={btnSec}>ANNULLA</button>
          <button onClick={handleBlocca} disabled={saving || !problema.trim()} style={{ ...btnPri, background: PROD_COLORS.red, opacity: !problema.trim() || saving ? 0.4 : 1 }}>{saving ? 'BLOCCO...' : 'BLOCCA'}</button>
        </div>
      </div>
    </div>
  )
}

function Titolo({ titolo, onChiudi }: { titolo: string; onChiudi: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy }}>{titolo}</div>
      <button onClick={onChiudi} style={{ background: 'none', border: 'none', fontSize: 22, color: PROD_COLORS.textDim, cursor: 'pointer' }}>×</button>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>{children}</div>
}

function RigaOperatore({ op, attesa, dim, onClick }: any) {
  const init = (op.nome[0] || '') + ((op.cognome || '')[0] || '')
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, marginBottom: 4, border: `1px solid ${PROD_COLORS.borderSoft}`, cursor: 'pointer', opacity: dim ? 0.4 : 1 }}>
      <div style={{ width: 32, height: 32, background: op.colore || PROD_COLORS.teal, borderRadius: '50%', color: '#FFF', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{init}</div>
      <div style={{ flex: 1, fontSize: 12, color: PROD_COLORS.navy, fontWeight: 500 }}>{op.nome} {op.cognome || ''}</div>
      {attesa && <span style={{ fontSize: 10, color: PROD_COLORS.teal }}>...</span>}
    </div>
  )
}

const sec: React.CSSProperties = { fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.6, marginBottom: 8, fontWeight: 600 }
const btnSec: React.CSSProperties = { flex: 1, background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const btnPri: React.CSSProperties = { flex: 1, background: PROD_COLORS.teal, color: '#FFF', border: 'none', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }
