import React from 'react'
import { PROD_COLORS, getFaseColor } from './prod-constants'
import type { VanoRiepilogo, OperatoreAttivo, CommessaProdFull } from '@/hooks/useCommessaProduzione'

export const sezTitolo: React.CSSProperties = {
  fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600,
  letterSpacing: 0.6, marginBottom: 8, paddingLeft: 4
}

export function HeaderCommessa({ commessa, perc, sopraStima, vaniBloccati, onChiudi }: {
  commessa: CommessaProdFull
  perc: number
  sopraStima: number
  vaniBloccati: number
  onChiudi: () => void
}) {
  const oggi = new Date().toISOString().split('T')[0]
  const giorniRimasti = commessa.data_consegna_prevista
    ? Math.ceil((new Date(commessa.data_consegna_prevista).getTime() - Date.now()) / 86400000)
    : null
  const inRitardo = commessa.data_consegna_prevista && commessa.data_consegna_prevista < oggi

  return (
    <>
      <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
        <div onClick={onChiudi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>‹</span>
          <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>
            PRODUZIONE / {commessa.code}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{commessa.cliente_nome || commessa.code}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
              {commessa.carico_vani_totali || 0} vani
              {commessa.data_consegna_prevista && (
                <> · consegna {new Date(commessa.data_consegna_prevista).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</>
              )}
              {giorniRimasti !== null && ` · ${inRitardo ? '+' : '-'}${Math.abs(giorniRimasti)}gg`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <div style={{ background: vaniBloccati > 0 ? PROD_COLORS.red : PROD_COLORS.teal, padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
              {vaniBloccati > 0 ? 'BLOCCATA' : 'IN CORSO'}
            </div>
            <div style={{ fontSize: 10, color: PROD_COLORS.tealLight }}>{perc}% · {commessa.carico_vani_completati}/{commessa.carico_vani_totali || 0}</div>
            {sopraStima > 0 && (
              <div style={{ background: 'rgba(232,176,92,0.2)', border: `1px solid ${PROD_COLORS.amber}`, padding: '2px 7px', borderRadius: 8, fontSize: 9, color: '#FBF0DC', fontWeight: 600 }}>+{sopraStima.toFixed(1)}h SOPRA</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: PROD_COLORS.navy, padding: '0 14px 14px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <KpiHeader label="AVANZ." value={`${perc}%`} />
            <KpiHeader label="VANI" value={`${commessa.carico_vani_completati}/${commessa.carico_vani_totali || 0}`} />
            <KpiHeader label="ORE STIM" value={`${commessa.carico_ore_pianificate || 0}h`} color={PROD_COLORS.amber} />
            <KpiHeader label="BLOCCHI" value={`${vaniBloccati}`} color={vaniBloccati > 0 ? '#F09595' : '#FFF'} />
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${perc}%`, height: '100%', background: vaniBloccati > 0 ? PROD_COLORS.red : PROD_COLORS.teal }} />
          </div>
        </div>
      </div>
    </>
  )
}

function KpiHeader({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: PROD_COLORS.tealLight, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: color || '#FFF', lineHeight: 1, marginTop: 2 }}>{value}</div>
    </div>
  )
}

export function AllertaBlocchi({ vaniBloccati, onRisolvi }: { vaniBloccati: VanoRiepilogo[]; onRisolvi: () => void }) {
  if (vaniBloccati.length === 0) return null
  return (
    <div style={{ background: PROD_COLORS.amberBg, borderTop: `3px solid ${PROD_COLORS.amber}`, padding: '10px 14px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0, marginTop: 2, color: PROD_COLORS.amberText, fontWeight: 700 }}>⚠</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: PROD_COLORS.amberText, fontWeight: 700, letterSpacing: 0.5 }}>
            {vaniBloccati.length} VAN{vaniBloccati.length === 1 ? 'O' : 'I'} BLOCCATO{vaniBloccati.length === 1 ? '' : 'I'}
          </div>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, marginTop: 2 }}>
            {vaniBloccati.slice(0, 2).map(v => `V${v.vano_numero} ${v.vano_stanza || v.vano_tipo || ''}`).join(' · ')}
            {vaniBloccati.length > 2 && ` · +${vaniBloccati.length - 2}`}
          </div>
          <button onClick={onRisolvi} style={{ background: PROD_COLORS.navy, color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: 5, fontSize: 10, fontWeight: 600, marginTop: 6, cursor: 'pointer' }}>VEDI BLOCCHI</button>
        </div>
      </div>
    </div>
  )
}

export function OperatoriAttivi({ operatori }: { operatori: OperatoreAttivo[] }) {
  if (operatori.length === 0) {
    return (
      <div style={{ background: '#FFF', borderRadius: 10, padding: 12, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>
        Nessun operatore attivo in questo momento
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {operatori.map(op => {
        const nomeBreve = `${op.operatore_nome} ${(op.operatore_cognome || '')[0] || ''}.`
        const inizioMs = op.iniziato_at ? new Date(op.iniziato_at).getTime() : null
        const durataMin = inizioMs ? Math.floor((Date.now() - inizioMs) / 60000) : 0
        const durata = durataMin >= 60 ? `${Math.floor(durataMin / 60)}h ${durataMin % 60}m` : `${durataMin}m`
        const bloccato = op.stato_attivita === 'bloccato'
        return (
          <div key={op.operatore_id} style={{ background: '#FFF', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: bloccato ? `1px solid #F09595` : 'none' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, background: op.colore || PROD_COLORS.teal, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 600, fontSize: 12 }}>
                {(op.operatore_nome[0] || '') + ((op.operatore_cognome || '')[0] || '')}
              </div>
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, background: bloccato ? PROD_COLORS.red : PROD_COLORS.green, border: '2px solid #FFF', borderRadius: '50%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: PROD_COLORS.navy }}>{nomeBreve}</div>
                <div style={{ fontSize: 10, color: bloccato ? PROD_COLORS.red : PROD_COLORS.green, fontWeight: 600 }}>
                  ● {bloccato ? 'BLOCCATO' : 'ATTIVO'} {durata}
                </div>
              </div>
              <div style={{ fontSize: 11, color: PROD_COLORS.textDim }}>
                {op.fase_corrente} · V{op.vano_corrente_stanza ? op.vano_corrente_stanza : '?'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CruscottoVani({ vani, onTapVano }: { vani: VanoRiepilogo[]; onTapVano: (vanoId: string, numero: number | null) => void }) {
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
        {vani.map(v => {
          let bg = PROD_COLORS.bgPage
          let color = PROD_COLORS.navy
          let border = `1px dashed ${PROD_COLORS.amber}`
          if (v.stato_globale === 'completato') { bg = PROD_COLORS.green; color = '#FFF'; border = 'none' }
          else if (v.stato_globale === 'bloccato') { bg = PROD_COLORS.red; color = '#FFF'; border = `2px solid ${PROD_COLORS.red}` }
          else if (v.stato_globale === 'in_corso') { bg = PROD_COLORS.teal; color = '#FFF'; border = 'none' }
          else if (v.stato_globale === 'parziale') { 
            const c = v.fase_corrente_colore ? getFaseColor(v.fase_corrente_colore) : { bg: PROD_COLORS.amber }
            bg = c.bg; color = '#FFF'; border = 'none'
          }
          return (
            <div 
              key={v.vano_id} 
              onClick={() => onTapVano(v.vano_id, v.vano_numero)}
              style={{ aspectRatio: '1', background: bg, color, border, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, position: 'relative', cursor: 'pointer' }}>
              {v.vano_numero ?? '?'}
              {v.bloccato && <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: '#FBE54B', border: `1px solid ${PROD_COLORS.navy}`, borderRadius: '50%' }} />}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 10, marginTop: 10, borderTop: '1px solid #EEF8F8', flexWrap: 'wrap' }}>
        <Legenda colore={PROD_COLORS.green} label={`fatti ${vani.filter(v => v.stato_globale === 'completato').length}`} />
        <Legenda colore={PROD_COLORS.teal} label={`in corso ${vani.filter(v => v.stato_globale === 'in_corso' || v.stato_globale === 'parziale').length}`} />
        <Legenda colore={PROD_COLORS.red} label={`bloccati ${vani.filter(v => v.stato_globale === 'bloccato').length}`} />
        <Legenda colore="" border={`1px dashed ${PROD_COLORS.amber}`} label={`da fare ${vani.filter(v => v.stato_globale === 'in_coda').length}`} />
      </div>
    </div>
  )
}

function Legenda({ colore, border, label }: { colore: string; border?: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 9, height: 9, background: colore, border: border || 'none', borderRadius: 2 }} />
      <span style={{ fontSize: 9, color: PROD_COLORS.textDim }}>{label}</span>
    </div>
  )
}
