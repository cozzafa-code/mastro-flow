import React from 'react'
import { PROD_COLORS, getFaseColor } from './prod-constants'
import type { CommessaProdFull, VanoRiepilogo, OperatoreAttivo, StazioneCommessa, EventoTimeline } from '@/hooks/useCommessaProduzione'

export const sezTitolo: React.CSSProperties = {
  fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600,
  letterSpacing: 0.6, marginBottom: 8, paddingLeft: 4
}

export function HeaderCommessa({ commessa, perc, sopraStimaH, vaniBloccati }: { commessa: CommessaProdFull; perc: number; sopraStimaH: number; vaniBloccati: number }) {
  const cliente = [commessa.cliente, commessa.cognome].filter(Boolean).join(' ') || commessa.code
  const totV = commessa.carico_vani_totali || 0
  const oggi = new Date().toISOString().split('T')[0]
  const inRit = commessa.data_richiesta && commessa.data_richiesta < oggi
  const gg = commessa.data_richiesta ? Math.ceil((new Date(commessa.data_richiesta).getTime() - Date.now()) / 86400000) : null

  let statoBg = PROD_COLORS.teal
  let statoLabel = 'IN CORSO'
  if (vaniBloccati > 0 || commessa.carico_stato === 'bloccato') { statoBg = PROD_COLORS.red; statoLabel = 'BLOCCATA' }
  else if (commessa.carico_stato === 'pianificato') { statoBg = '#5F5E5A'; statoLabel = 'PIANIFICATA' }
  else if (commessa.carico_stato === 'completato') { statoBg = PROD_COLORS.green; statoLabel = 'COMPLETATA' }

  return (
    <>
      <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5, marginBottom: 8 }}>PRODUZIONE / {commessa.code}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{cliente}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
              {totV} vani
              {commessa.data_richiesta && ` · consegna ${new Date(commessa.data_richiesta).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`}
              {gg !== null && ` · ${inRit ? '+' : '-'}${Math.abs(gg)}gg`}
            </div>
            {commessa.indirizzo && <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{commessa.indirizzo}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <div style={{ background: statoBg, padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{statoLabel}</div>
            <div style={{ fontSize: 10, color: PROD_COLORS.tealLight }}>{perc}% · {commessa.carico_vani_completati}/{totV}</div>
            {sopraStimaH > 0 && (
              <div style={{ background: 'rgba(232,176,92,0.2)', border: `1px solid ${PROD_COLORS.amber}`, padding: '2px 7px', borderRadius: 8, fontSize: 9, color: '#FBF0DC', fontWeight: 600 }}>+{sopraStimaH.toFixed(1)}h SOPRA</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: PROD_COLORS.navy, padding: '0 14px 14px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <KpiH label="AVANZ." value={`${perc}%`} />
            <KpiH label="VANI" value={`${commessa.carico_vani_completati}/${totV}`} />
            <KpiH label="ORE STIM" value={`${commessa.carico_ore_pianificate || 0}h`} color={PROD_COLORS.amber} />
            <KpiH label="BLOCCHI" value={`${vaniBloccati}`} color={vaniBloccati > 0 ? '#F09595' : '#FFF'} />
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${perc}%`, height: '100%', background: vaniBloccati > 0 ? PROD_COLORS.red : PROD_COLORS.teal }} />
          </div>
        </div>
      </div>
    </>
  )
}

function KpiH({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: PROD_COLORS.tealLight, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: color || '#FFF', lineHeight: 1, marginTop: 2 }}>{value}</div>
    </div>
  )
}

export function AllertaBlocchi({ vaniBloccati, onVai }: { vaniBloccati: VanoRiepilogo[]; onVai: () => void }) {
  if (vaniBloccati.length === 0) return null
  const lista = vaniBloccati.slice(0, 3).map(v => `V${v.vano_numero || '?'} ${v.vano_stanza || v.vano_tipo || ''}`).join(' · ')
  return (
    <div style={{ background: PROD_COLORS.amberBg, borderTop: `3px solid ${PROD_COLORS.amber}`, padding: '10px 14px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0, marginTop: 2, color: PROD_COLORS.amberText, fontWeight: 700 }}>⚠</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: PROD_COLORS.amberText, fontWeight: 700, letterSpacing: 0.5 }}>
            {vaniBloccati.length} VAN{vaniBloccati.length === 1 ? 'O' : 'I'} BLOCCAT{vaniBloccati.length === 1 ? 'O' : 'I'}
          </div>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, marginTop: 2 }}>
            {lista}{vaniBloccati.length > 3 && ` · +${vaniBloccati.length - 3}`}
          </div>
          <button onClick={onVai} style={{ background: PROD_COLORS.navy, color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: 5, fontSize: 10, fontWeight: 600, marginTop: 6, cursor: 'pointer' }}>VEDI BLOCCHI</button>
        </div>
      </div>
    </div>
  )
}

export function OperatoriAttivi({ operatori }: { operatori: OperatoreAttivo[] }) {
  if (operatori.length === 0) {
    return <div style={{ background: '#FFF', borderRadius: 10, padding: 12, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessun operatore attivo</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {operatori.map(op => {
        const init = (op.operatore_nome[0] || '') + ((op.operatore_cognome || '')[0] || '')
        const nomeBreve = `${op.operatore_nome} ${(op.operatore_cognome || '')[0] || ''}.`
        const inizio = op.iniziato_at ? new Date(op.iniziato_at).getTime() : null
        const durMin = inizio ? Math.floor((Date.now() - inizio) / 60000) : 0
        const dur = durMin >= 60 ? `${Math.floor(durMin / 60)}h ${durMin % 60}m` : `${durMin}m`
        const blk = op.stato_attivita === 'bloccato'
        return (
          <div key={op.operatore_id} style={{ background: '#FFF', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: blk ? `1px solid #F09595` : 'none' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, background: op.colore || PROD_COLORS.teal, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 600, fontSize: 12 }}>{init}</div>
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, background: blk ? PROD_COLORS.red : PROD_COLORS.green, border: '2px solid #FFF', borderRadius: '50%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: PROD_COLORS.navy }}>{nomeBreve}</div>
                <div style={{ fontSize: 10, color: blk ? PROD_COLORS.red : PROD_COLORS.green, fontWeight: 600 }}>● {blk ? 'BLOCCATO' : 'ATTIVO'} {dur}</div>
              </div>
              <div style={{ fontSize: 11, color: PROD_COLORS.textDim }}>{op.fase_corrente} · {op.vano_corrente_stanza ? `V${op.vano_corrente_stanza}` : 'vano ?'}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
