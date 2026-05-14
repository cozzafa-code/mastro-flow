import React from 'react'
import { PROD_COLORS } from './prod-constants'

export const sezTitolo: React.CSSProperties = {
  fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600,
  letterSpacing: 0.6, marginBottom: 8, paddingLeft: 4
}

export function SpecificaTecnica({ vano }: { vano: any }) {
  return (
    <div style={{ padding: '6px 12px 8px' }}>
      <div style={sezTitolo}>SPECIFICA TECNICA</div>
      <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 8px' }}>
          <Spec label="TIPO" value={vano.tipo} />
          <Spec label="VETRO" value={vano.vetro} />
          <Spec label="U-VALUE" value={vano.uw ? `${vano.uw} W/m²K` : null} />
          <Spec label="SISTEMA" value={vano.sistema} />
          <Spec label="COLORE" value={[vano.colore_int, vano.colore_est].filter(Boolean).join(' / ')} />
          <Spec label="TELAIO" value={vano.telaio} />
        </div>
        {vano.note && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EEF8F8' }}>
            <div style={{ fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.4, marginBottom: 3 }}>NOTE</div>
            <div style={{ fontSize: 11, color: PROD_COLORS.navy, lineHeight: 1.4 }}>{vano.note}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 11, color: PROD_COLORS.navy, fontWeight: 500, marginTop: 1 }}>{value || '—'}</div>
    </div>
  )
}

export function EventiTimeline({ eventi }: { eventi: any[] }) {
  return (
    <div style={{ padding: '6px 12px 8px' }}>
      <div style={sezTitolo}>EVENTI · {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</div>
      <div style={{ background: '#FFF', borderRadius: 10, padding: '10px 12px' }}>
        {eventi.map((ev, i) => {
          const ora = new Date(ev.evento_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
          const colore = ev.tipo === 'problema' ? PROD_COLORS.red : ev.tipo === 'completamento' ? PROD_COLORS.green : PROD_COLORS.teal
          return (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 9, color: PROD_COLORS.textDim, width: 40, paddingTop: 1 }}>{ora}</div>
              <div style={{ width: 5, height: 5, background: colore, borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
              <div style={{ fontSize: 10, color: ev.tipo === 'problema' ? PROD_COLORS.red : PROD_COLORS.navy, fontWeight: ev.tipo === 'problema' ? 600 : 400, flex: 1 }}>
                {ev.operatore_nome && `${ev.operatore_nome.split(' ')[0]} · `}{ev.descrizione}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RiepilogoTempi({ oreStimate, oreLavoro, tempoMortoSec }: { oreStimate: number; oreLavoro: number; tempoMortoSec: number }) {
  const scostamento = oreStimate > 0 ? Math.round(((oreLavoro - oreStimate) / oreStimate) * 100) : 0
  const tempoMortoH = tempoMortoSec / 3600
  const costoOra = 20
  const costoTotale = oreLavoro * costoOra
  return (
    <div style={{ padding: '6px 12px 8px' }}>
      <div style={sezTitolo}>RIEPILOGO TEMPI</div>
      <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
        <TempoRow label="Stima totale" value={`${oreStimate.toFixed(1)}h`} />
        <TempoRow label="Lavoro effettivo" value={`${oreLavoro.toFixed(2)}h ${scostamento !== 0 ? `· ${scostamento > 0 ? '+' : ''}${scostamento}%` : ''}`} color={scostamento <= 0 ? PROD_COLORS.green : PROD_COLORS.amberText} />
        {tempoMortoH > 0 && <TempoRow label="Tempo morto (blocco)" value={`${tempoMortoH.toFixed(2)}h`} color={PROD_COLORS.red} />}
        <div style={{ height: 1, background: '#EEF8F8', margin: '6px 0' }} />
        <TempoRow label="Costo manodopera" value={`€ ${costoTotale.toFixed(2)}`} bold />
      </div>
    </div>
  )
}

function TempoRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 11, color: bold ? PROD_COLORS.navy : PROD_COLORS.textDim, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 11, color: color || PROD_COLORS.navy, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
