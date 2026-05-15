import React, { useState } from 'react'
import { PROD_COLORS, getFaseColor } from './prod-constants'
import type { FaseConMacchine, MacchinaConfig } from '@/hooks/useConfigFasi'

export function HeaderConfig({ aziendaNome, totFasiAttive, onChiudi }: { 
  aziendaNome: string; totFasiAttive: number; onChiudi: () => void 
}) {
  return (
    <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
      <div onClick={onChiudi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>‹</span>
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>PRODUZIONE / CONFIGURA FASI</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Stazioni officina</div>
      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{aziendaNome} · {totFasiAttive} fasi attive</div>
    </div>
  )
}

export function BannerInfo() {
  return (
    <div style={{ padding: '12px 12px 8px' }}>
      <div style={{ background: PROD_COLORS.amberBg, borderLeft: `3px solid ${PROD_COLORS.amber}`, borderRadius: '0 8px 8px 0', padding: '10px 12px' }}>
        <div style={{ fontSize: 11, color: PROD_COLORS.amberText, lineHeight: 1.4 }}>
          <b>Trascina per riordinare</b> · le fasi devono rispettare il flusso fisico dell'officina · ogni vano le attraversa in sequenza
        </div>
      </div>
    </div>
  )
}

export function FaseRowConfig({ fase, espansa, onToggleEspansa, onToggleAttiva, onElimina, onAggiungiMacchina, onToggleMacchina, onEliminaMacchina, onSposta }: {
  fase: FaseConMacchine
  espansa: boolean
  onToggleEspansa: () => void
  onToggleAttiva: (attiva: boolean) => void
  onElimina: () => void
  onAggiungiMacchina: () => void
  onToggleMacchina: (id: string, stato: MacchinaConfig['stato']) => void
  onEliminaMacchina: (id: string) => void
  onSposta: (direzione: 'su' | 'giu') => void
}) {
  const c = getFaseColor(fase.colore)
  const isFerma = fase.stato_globale === 'ferma'
  const isManut = fase.stato_globale === 'manutenzione'

  let bordoEsterno: React.CSSProperties['border'] = `1px solid ${PROD_COLORS.borderSoft}`
  if (isFerma) bordoEsterno = `2px solid ${PROD_COLORS.red}`
  else if (isManut) bordoEsterno = `2px solid ${PROD_COLORS.amber}`

  return (
    <div style={{ background: '#FFF', borderRadius: 10, marginBottom: 6, border: bordoEsterno, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: 12 }}>
        <div style={{ marginRight: 10, display: 'flex', flexDirection: 'column', gap: 1, cursor: 'pointer' }}>
          <span onClick={() => onSposta('su')} style={{ fontSize: 9, color: PROD_COLORS.textDim, lineHeight: 0.8, padding: 1 }}>▲</span>
          <span onClick={() => onSposta('giu')} style={{ fontSize: 9, color: PROD_COLORS.textDim, lineHeight: 0.8, padding: 1 }}>▼</span>
        </div>
        <div style={{ width: 8, height: 36, background: c.bg, borderRadius: 2, marginRight: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }} onClick={onToggleEspansa}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: PROD_COLORS.navy }}>
              {fase.ordine} · {fase.nome}
            </span>
            {fase.attiva ? (
              isFerma ? <Badge bg={PROD_COLORS.redBg} text={PROD_COLORS.red} label="⚠ FERMA" />
              : isManut ? <Badge bg={PROD_COLORS.amberBg} text={PROD_COLORS.amberText} label="MANUT." />
              : <Badge bg={PROD_COLORS.greenBg} text={PROD_COLORS.green} label="ATTIVA" />
            ) : <Badge bg="#F1EFE8" text="#5F5E5A" label="DISATTIVA" />}
          </div>
          <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginTop: 2 }}>
            {fase.macchine.length} {fase.macchine.length === 1 ? 'macchina' : 'macchine'}
            {fase.stima_minuti_default && ` · stima ${fase.stima_minuti_default} min/vano`}
            {fase.descrizione && ` · ${fase.descrizione}`}
          </div>
        </div>
        <span style={{ fontSize: 14, color: PROD_COLORS.textDim, marginLeft: 8 }}>{espansa ? '▾' : '▸'}</span>
      </div>

      {espansa && (
        <div style={{ padding: '0 12px 12px', background: '#FAFCFC', borderTop: `1px solid ${PROD_COLORS.borderSoft}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 6px' }}>
            <div style={{ fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.5 }}>MACCHINE</div>
            <button onClick={() => onToggleAttiva(!fase.attiva)} style={btnLink}>
              {fase.attiva ? 'disattiva fase' : 'attiva fase'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {fase.macchine.map(m => (
              <MacchinaRow key={m.id} macchina={m} onToggle={onToggleMacchina} onElimina={onEliminaMacchina} />
            ))}
            <button onClick={onAggiungiMacchina} style={{ background: 'none', border: `1px dashed ${PROD_COLORS.borderSoft}`, borderRadius: 5, padding: 6, fontSize: 10, color: PROD_COLORS.teal, fontWeight: 600, cursor: 'pointer' }}>+ macchina</button>
          </div>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid #EEF8F8` }}>
            <button onClick={onElimina} style={btnLinkRed}>elimina fase</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MacchinaRow({ macchina, onToggle, onElimina }: { macchina: MacchinaConfig; onToggle: (id: string, stato: MacchinaConfig['stato']) => void; onElimina: (id: string) => void }) {
  const stati: MacchinaConfig['stato'][] = ['attiva', 'ferma', 'manutenzione']
  const idxNext = (stati.indexOf(macchina.stato) + 1) % stati.length
  const statoLabel = macchina.stato === 'attiva' ? '● ATTIVA' : macchina.stato === 'ferma' ? '● FERMA' : '● MANUT.'
  const statoColor = macchina.stato === 'attiva' ? PROD_COLORS.green : macchina.stato === 'ferma' ? PROD_COLORS.red : PROD_COLORS.amberText
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#FFF', borderRadius: 5, border: `1px solid #EEF8F8`, alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: PROD_COLORS.navy, fontWeight: 600 }}>{macchina.nome}</div>
        <div style={{ fontSize: 9, color: PROD_COLORS.textDim }}>
          {macchina.tipo}
          {macchina.capacita_orarie && ` · cap ${macchina.capacita_orarie} ${macchina.unita_capacita || 'pz/h'}`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button onClick={() => onToggle(macchina.id, stati[idxNext])} style={{ fontSize: 9, color: statoColor, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
          {statoLabel}
        </button>
        <button onClick={() => onElimina(macchina.id)} style={{ background: 'none', border: 'none', color: PROD_COLORS.textDim, fontSize: 12, cursor: 'pointer' }}>×</button>
      </div>
    </div>
  )
}

export function FlussoPreview({ fasi }: { fasi: FaseConMacchine[] }) {
  const fasiAttive = fasi.filter(f => f.attiva)
  return (
    <div style={{ padding: '0 12px 14px' }}>
      <div style={{ background: '#FFF', borderRadius: 10, padding: 12, marginTop: 6 }}>
        <div style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600, letterSpacing: 0.6, marginBottom: 8 }}>FLUSSO COMPLETO</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          {fasiAttive.map((f, i) => {
            const c = getFaseColor(f.colore)
            return (
              <React.Fragment key={f.id}>
                <span style={{ background: c.bg, color: '#FFF', padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600 }}>
                  {f.nome.substring(0, 7)}
                </span>
                {i < fasiAttive.length - 1 && <span style={{ color: PROD_COLORS.borderSoft, fontSize: 12 }}>›</span>}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ModalNuovaFase({ onConferma, onAnnulla }: { onConferma: (nome: string, colore: string) => void; onAnnulla: () => void }) {
  const [nome, setNome] = useState('')
  const [colore, setColore] = useState('#28A0A0')
  const colori = [PROD_COLORS.teal, PROD_COLORS.amber, PROD_COLORS.red, '#8B5CF6', PROD_COLORS.green, PROD_COLORS.navy]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
      <div style={{ background: '#FFF', borderRadius: 12, padding: 20, width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy, marginBottom: 12 }}>Nuova fase officina</div>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome (es. Test acustico)" style={{ width: '100%', padding: 8, border: `1px solid ${PROD_COLORS.borderSoft}`, borderRadius: 6, fontSize: 12, marginBottom: 12, boxSizing: 'border-box' }} />
        <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginBottom: 6 }}>Colore</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {colori.map(c => (
            <button key={c} onClick={() => setColore(c)} style={{ width: 26, height: 26, background: c, borderRadius: 6, border: colore === c ? `3px solid ${PROD_COLORS.navy}` : 'none', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onAnnulla} style={{ flex: 1, background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: 10, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ANNULLA</button>
          <button onClick={() => nome.trim() && onConferma(nome.trim(), colore)} disabled={!nome.trim()} style={{ flex: 1, background: nome.trim() ? PROD_COLORS.teal : '#CCC', color: '#FFF', border: 'none', padding: 10, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: nome.trim() ? 'pointer' : 'not-allowed' }}>CREA FASE</button>
        </div>
      </div>
    </div>
  )
}

export function ModalNuovaMacchina({ faseNome, onConferma, onAnnulla }: { faseNome: string; onConferma: (nome: string, modello: string, capacita: number) => void; onAnnulla: () => void }) {
  const [nome, setNome] = useState('')
  const [modello, setModello] = useState('')
  const [capacita, setCapacita] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
      <div style={{ background: '#FFF', borderRadius: 12, padding: 20, width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy, marginBottom: 4 }}>Nuova macchina</div>
        <div style={{ fontSize: 11, color: PROD_COLORS.textDim, marginBottom: 12 }}>per fase: {faseNome}</div>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome (es. Emmegi Precision 2)" style={inputStyle} />
        <input value={modello} onChange={e => setModello(e.target.value)} placeholder="Modello (opzionale)" style={inputStyle} />
        <input value={capacita} onChange={e => setCapacita(e.target.value)} placeholder="Capacità oraria (pz/h)" type="number" style={inputStyle} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onAnnulla} style={{ flex: 1, background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: 10, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ANNULLA</button>
          <button onClick={() => nome.trim() && onConferma(nome.trim(), modello.trim(), Number(capacita) || 0)} disabled={!nome.trim()} style={{ flex: 1, background: nome.trim() ? PROD_COLORS.teal : '#CCC', color: '#FFF', border: 'none', padding: 10, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: nome.trim() ? 'pointer' : 'not-allowed' }}>AGGIUNGI</button>
        </div>
      </div>
    </div>
  )
}

function Badge({ bg, text, label }: { bg: string; text: string; label: string }) {
  return <span style={{ background: bg, color: text, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{label}</span>
}

const btnLink: React.CSSProperties = {
  background: 'none', border: 'none', color: PROD_COLORS.teal, fontSize: 10, fontWeight: 600, cursor: 'pointer'
}
const btnLinkRed: React.CSSProperties = {
  background: 'none', border: 'none', color: PROD_COLORS.red, fontSize: 10, fontWeight: 600, cursor: 'pointer'
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 8, border: `1px solid ${PROD_COLORS.borderSoft}`, borderRadius: 6, fontSize: 12, marginBottom: 8, boxSizing: 'border-box' as const
}
