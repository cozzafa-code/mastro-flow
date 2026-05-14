import React from 'react'
import { PROD_COLORS } from './prod-constants'
import type { GateStats, OrdineFornitoreRow, TimelineEvento } from '@/hooks/useGateMateriali'

export const sezTitolo: React.CSSProperties = {
  fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600,
  letterSpacing: 0.6, marginBottom: 8, paddingLeft: 4
}

export function HeaderGate({ codeCommessa, cliente, vaniTotali, dataConsegna, statoGate, onChiudi }: {
  codeCommessa: string
  cliente: string
  vaniTotali: number
  dataConsegna: string | null
  statoGate: 'attesa' | 'pronto' | 'parziale'
  onChiudi: () => void
}) {
  const giorniRimasti = dataConsegna 
    ? Math.ceil((new Date(dataConsegna).getTime() - Date.now()) / 86400000) 
    : null
  const labelStato = statoGate === 'pronto' ? 'PRONTO PER AVVIO' : statoGate === 'parziale' ? 'PARZIALE' : 'IN ATTESA'
  const bgStato = statoGate === 'pronto' ? PROD_COLORS.teal : statoGate === 'parziale' ? PROD_COLORS.amber : PROD_COLORS.amber

  return (
    <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
      <div onClick={onChiudi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>‹</span>
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>PRODUZIONE / GATE MATERIALI</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{codeCommessa} · {cliente}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
            {vaniTotali} vani
            {dataConsegna && ` · consegna ${new Date(dataConsegna).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`}
            {giorniRimasti !== null && ` · -${giorniRimasti}gg`}
          </div>
        </div>
        <div style={{ background: bgStato, padding: '4px 10px', borderRadius: 12, fontSize: 9, fontWeight: 700, color: statoGate === 'pronto' ? '#FFF' : PROD_COLORS.navy }}>
          {labelStato}
        </div>
      </div>
    </div>
  )
}

export function GateSteps({ stats }: { stats: GateStats }) {
  const stepConferma = stats.inviati > 0 && stats.inviati >= stats.totali
  const stepArrivo = stats.arrivati === stats.totali
  const stepArrivoParziale = stats.arrivati > 0 && stats.arrivati < stats.totali
  const stepGate = stepArrivo && stats.bloccanti_aperti === 0

  const totaleStepOk = (stats.totali > 0 ? 1 : 0) + (stepConferma ? 1 : 0) + (stepArrivo ? 1 : 0) + (stepGate ? 1 : 0)

  return (
    <div style={{ background: '#FFF', padding: 14, borderBottom: `1px solid ${PROD_COLORS.borderSoft}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 700, letterSpacing: 0.6 }}>GATE PRE-PRODUZIONE</div>
        <div style={{ background: stepGate ? PROD_COLORS.greenBg : PROD_COLORS.amberBg, color: stepGate ? PROD_COLORS.green : PROD_COLORS.amberText, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
          {totaleStepOk}/4 OK
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <StepNode 
          done={stats.totali > 0} 
          label="ORDINI" 
          sublabel="INVIATI" 
          value={stats.inviati > 0 ? `${stats.inviati}` : undefined}
        />
        <Connector done={stepConferma} />
        <StepNode 
          done={stepConferma} 
          label="CONFERMA" 
          sublabel="FORNITORI" 
          value={stats.confermati > 0 ? `${stats.confermati}` : undefined}
        />
        <Connector done={stepArrivo} mixed={stepArrivoParziale} />
        <StepNode 
          done={stepArrivo} 
          partial={stepArrivoParziale}
          error={stats.con_errori > 0}
          label="MATERIALI" 
          sublabel="ARRIVATI"
          value={`${stats.arrivati}/${stats.totali}`}
        />
        <Connector done={stepGate} />
        <StepNode 
          done={stepGate} 
          label="AVVIA" 
          sublabel="PRODUZ."
        />
      </div>
    </div>
  )
}

function StepNode({ done, partial, error, label, sublabel, value }: { done: boolean; partial?: boolean; error?: boolean; label: string; sublabel: string; value?: string }) {
  let bg = '#FFF'
  let textColor = PROD_COLORS.textDim
  let icon = '○'
  let borderStyle = `2px dashed ${PROD_COLORS.borderSoft}`
  if (error) { bg = PROD_COLORS.red; textColor = '#FFF'; icon = ''; borderStyle = 'none' }
  else if (partial) { bg = PROD_COLORS.red; textColor = '#FFF'; icon = ''; borderStyle = 'none' }
  else if (done) { bg = PROD_COLORS.green; textColor = '#FFF'; icon = '✓'; borderStyle = 'none' }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 36, height: 36, background: bg, border: borderStyle, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {value ? (
          <span style={{ color: textColor, fontWeight: 700, fontSize: 11 }}>{value}</span>
        ) : (
          <span style={{ color: textColor, fontWeight: 700, fontSize: 14 }}>{icon}</span>
        )}
      </div>
      <div style={{ fontSize: 8, color: error || partial ? PROD_COLORS.red : (done ? PROD_COLORS.green : PROD_COLORS.textDim), fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
        {label}<br />{sublabel}
      </div>
    </div>
  )
}

function Connector({ done, mixed }: { done: boolean; mixed?: boolean }) {
  if (mixed) return <div style={{ flex: 0.5, height: 3, background: `linear-gradient(90deg,${PROD_COLORS.green} 50%,${PROD_COLORS.red} 50%)`, marginBottom: 18 }} />
  return <div style={{ flex: 0.5, height: 3, background: done ? PROD_COLORS.green : '#EEF8F8', marginBottom: 18 }} />
}

export function OrdineCard({ ordine, onChiama, onSollecita }: { ordine: OrdineFornitoreRow; onChiama: () => void; onSollecita: () => void }) {
  const haErrore = !!ordine.errore_descrizione && !ordine.verificato_at
  const arrivato = !!ordine.arrivato_at && !haErrore
  const inViaggio = ordine.stato === 'in_viaggio'

  let bordoColore = PROD_COLORS.borderSoft
  let badgeBg = '#F1EFE8'
  let badgeColor = '#5F5E5A'
  let badgeLabel = ordine.stato.toUpperCase()
  let isFullBorder = false

  if (haErrore) {
    isFullBorder = true; bordoColore = PROD_COLORS.red
    badgeBg = PROD_COLORS.red; badgeColor = '#FFF'; badgeLabel = '⚠ ERRORE'
  } else if (arrivato) {
    bordoColore = PROD_COLORS.green
    badgeBg = PROD_COLORS.greenBg; badgeColor = PROD_COLORS.green; badgeLabel = 'ARRIVATO'
  } else if (inViaggio) {
    bordoColore = PROD_COLORS.amber
    badgeBg = PROD_COLORS.amberBg; badgeColor = PROD_COLORS.amberText; badgeLabel = 'IN VIAGGIO'
  }

  return (
    <div style={{
      background: '#FFF',
      [isFullBorder ? 'border' : 'borderLeft']: isFullBorder ? `2px solid ${bordoColore}` : `4px solid ${bordoColore}`,
      borderRadius: isFullBorder ? 10 : '0 10px 10px 0',
      padding: '10px 12px', marginBottom: 6
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: PROD_COLORS.navy }}>{ordine.numero}</span>
            <span style={{ background: badgeBg, color: badgeColor, padding: '1px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700 }}>{badgeLabel}</span>
            {ordine.bloccante && !arrivato && (
              <span style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '1px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700 }}>BLOCCANTE</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, marginTop: 2 }}>
            {ordine.fornitore}{ordine.categoria_materiale && ` · ${ordine.categoria_materiale}`}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, fontWeight: 700 }}>€ {ordine.totale_euro?.toFixed(0) || '0'}</div>
          {ordine.ddt_data && (
            <div style={{ fontSize: 9, color: haErrore ? PROD_COLORS.red : PROD_COLORS.green }}>
              DDT {new Date(ordine.ddt_data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
            </div>
          )}
          {!arrivato && !haErrore && ordine.consegna_prevista && (
            <div style={{ fontSize: 9, color: PROD_COLORS.amberText }}>
              ETA {new Date(ordine.consegna_prevista).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
            </div>
          )}
        </div>
      </div>
      {haErrore ? (
        <>
          <div style={{ background: PROD_COLORS.redBg, borderRadius: 6, padding: '7px 9px', margin: '6px 0', fontSize: 10, color: PROD_COLORS.navy, lineHeight: 1.4 }}>
            <b style={{ color: PROD_COLORS.red }}>⚠ {ordine.errore_descrizione}</b>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onChiama} style={{ flex: 1, background: PROD_COLORS.red, color: '#FFF', border: 'none', padding: 7, borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>CHIAMA</button>
            <button onClick={onSollecita} style={{ background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: '7px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>SOLLECITA</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: PROD_COLORS.textDim, paddingTop: 6, borderTop: `1px solid #EEF8F8`, alignItems: 'center' }}>
          {arrivato ? (
            <span><span style={{ color: PROD_COLORS.green, fontWeight: 600 }}>✓ {ordine.n_righe_verificate}/{ordine.n_righe} verificate</span></span>
          ) : (
            <span>{ordine.n_righe} righe attesa</span>
          )}
          {ordine.scostamento_costo !== null && ordine.scostamento_costo !== 0 && (
            <span style={{ marginLeft: 'auto', color: ordine.scostamento_costo < 0 ? PROD_COLORS.green : PROD_COLORS.amberText }}>
              scost. {ordine.scostamento_costo > 0 ? '+' : ''}€{ordine.scostamento_costo.toFixed(0)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function TimelineGate({ eventi }: { eventi: TimelineEvento[] }) {
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      {eventi.map((ev, i) => {
        const colore = ev.colore === 'red' ? PROD_COLORS.red : ev.colore === 'amber' ? PROD_COLORS.amber : PROD_COLORS.green
        const data = new Date(ev.evento_at)
        return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 9, color: PROD_COLORS.textDim, width: 42, paddingTop: 1 }}>
              {data.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
            </div>
            <div style={{ width: 5, height: 5, background: colore, borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
            <div style={{ fontSize: 10, color: ev.colore === 'red' ? PROD_COLORS.red : PROD_COLORS.navy, fontWeight: ev.colore === 'red' ? 600 : 400, flex: 1 }}>
              <b>{ev.titolo}</b> · {ev.descrizione}
            </div>
          </div>
        )
      })}
    </div>
  )
}
