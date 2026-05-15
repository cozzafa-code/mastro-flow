import React from 'react'
import { PROD_COLORS, getFaseColor } from './prod-constants'
import type { VanoRiepilogo, StazioneCommessa, EventoTimeline } from '@/hooks/useCommessaProduzione'

export function CruscottoVani({ vani, onTap }: { vani: VanoRiepilogo[]; onTap: (vanoId: string, numero: number | null) => void }) {
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
        {vani.map(v => {
          let bg: string = PROD_COLORS.bgPage, color = PROD_COLORS.navy, border = `1px dashed ${PROD_COLORS.amber}`
          if (v.stato_globale === 'completato') { bg = PROD_COLORS.green; color = '#FFF'; border = 'none' }
          else if (v.stato_globale === 'bloccato') { bg = PROD_COLORS.red; color = '#FFF'; border = `2px solid ${PROD_COLORS.red}` }
          else if (v.stato_globale === 'in_corso') { bg = PROD_COLORS.teal; color = '#FFF'; border = 'none' }
          else if (v.stato_globale === 'parziale') { 
            const c = v.fase_corrente_colore ? getFaseColor(v.fase_corrente_colore) : { bg: PROD_COLORS.amber }
            bg = c.bg; color = '#FFF'; border = 'none'
          }
          return (
            <div key={v.vano_id} onClick={() => onTap(v.vano_id, v.vano_numero)} style={{ aspectRatio: '1', background: bg, color, border, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, position: 'relative', cursor: 'pointer' }}>
              {v.vano_numero ?? '?'}
              {v.bloccato && <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: '#FBE54B', border: `1px solid ${PROD_COLORS.navy}`, borderRadius: '50%' }} />}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 10, marginTop: 10, borderTop: '1px solid #EEF8F8', flexWrap: 'wrap' }}>
        <Leg c={PROD_COLORS.green} l={`fatti ${vani.filter(v => v.stato_globale === 'completato').length}`} />
        <Leg c={PROD_COLORS.teal} l={`in corso ${vani.filter(v => v.stato_globale === 'in_corso').length}`} />
        <Leg c={PROD_COLORS.amber} l={`parziale ${vani.filter(v => v.stato_globale === 'parziale').length}`} />
        <Leg c={PROD_COLORS.red} l={`bloccati ${vani.filter(v => v.stato_globale === 'bloccato').length}`} />
        <Leg c="" border={`1px dashed ${PROD_COLORS.amber}`} l={`da fare ${vani.filter(v => v.stato_globale === 'in_coda').length}`} />
      </div>
    </div>
  )
}

function Leg({ c, border, l }: { c: string; border?: string; l: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 9, height: 9, background: c, border: border || 'none', borderRadius: 2 }} />
      <span style={{ fontSize: 9, color: PROD_COLORS.textDim }}>{l}</span>
    </div>
  )
}

export function CaricoStazioniCommessa({ stazioni }: { stazioni: StazioneCommessa[] }) {
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 10 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {stazioni.map(s => {
          const totV = Number(s.vani_totali)
          const done = Number(s.vani_completati)
          const inc = Number(s.vani_in_corso)
          const blk = Number(s.vani_bloccati)
          const c = getFaseColor(s.fase_colore)
          let bg = '#EEF8F8', txt: string = PROD_COLORS.textDim, border: string = `1px solid ${PROD_COLORS.borderSoft}`
          if (blk > 0) { bg = PROD_COLORS.red; txt = '#FFF'; border = 'none' }
          else if (done >= totV && totV > 0) { bg = PROD_COLORS.green; txt = '#FFF'; border = 'none' }
          else if (inc > 0) { bg = c.bg; txt = '#FFF'; border = 'none' }
          else if (done > 0) { bg = c.bg; txt = '#FFF'; border = 'none' }
          return (
            <div key={s.fase_id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '100%', height: 28, background: bg, border, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: txt, fontSize: 11, fontWeight: 700 }}>
                {done}/{totV}
              </div>
              <div style={{ fontSize: 8, color: blk > 0 ? PROD_COLORS.red : PROD_COLORS.navy, marginTop: 3, fontWeight: blk > 0 ? 700 : 600 }}>
                {s.fase_nome.substring(0, 6).toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TimelineCommessa({ eventi }: { eventi: EventoTimeline[] }) {
  if (eventi.length === 0) {
    return <div style={{ background: '#FFF', borderRadius: 10, padding: 16, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessuna attività nelle ultime 24h</div>
  }
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      {eventi.map((ev, i) => {
        const ora = new Date(ev.evento_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        const colore = ev.tipo === 'blocco' ? PROD_COLORS.red : ev.tipo === 'fine' ? PROD_COLORS.green : ev.colore || PROD_COLORS.teal
        return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 9, color: PROD_COLORS.textDim, width: 38, paddingTop: 1 }}>{ora}</span>
            <div style={{ width: 5, height: 5, background: colore, borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: ev.tipo === 'blocco' ? PROD_COLORS.red : PROD_COLORS.navy, fontWeight: ev.tipo === 'blocco' ? 600 : 400, flex: 1 }}>
              {ev.descrizione}
            </span>
          </div>
        )
      })}
    </div>
  )
}
