import React from 'react'
import { PROD_COLORS } from './prod-constants'
import type { VanoFull, VanoEvento, VanoFaseStorico } from '@/hooks/useVanoDetail'

export function SpecificaTecnica({ vano }: { vano: VanoFull }) {
  const colori = [vano.colore_int, vano.colore_est].filter(Boolean).join(' / ')
  const accessori = vano.accessori && typeof vano.accessori === 'object' ? vano.accessori : {}
  const ferramenta = accessori.ferramenta?.descrizione || accessori.ferramenta?.tipo || null
  const hasNote = vano.note && vano.note.trim().length > 0

  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 8px' }}>
        <Spec label="TIPO" value={vano.tipo} />
        <Spec label="VETRO" value={vano.vetro} />
        <Spec label="U-VALUE" value={vano.uw ? `${vano.uw} W/m²K` : null} />
        <Spec label="SISTEMA" value={vano.sistema} />
        <Spec label="COLORE" value={colori || null} />
        <Spec label="FERRAMENTA" value={ferramenta} />
        {vano.telaio && <Spec label="TELAIO" value={vano.telaio} />}
        {vano.sottosistema && <Spec label="SOTTOSIS." value={vano.sottosistema} />}
      </div>
      {hasNote && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EEF8F8' }}>
          <div style={{ fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.4, marginBottom: 3 }}>NOTE</div>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, lineHeight: 1.4 }}>{vano.note}</div>
        </div>
      )}
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

export function MaterialiConsumati({ vano, storico }: { vano: VanoFull; storico: VanoFaseStorico[] }) {
  // Genera materiali dalle fasi + accessori vano
  const materiali: { nome: string; stato: 'ok' | 'mancante' | 'attesa' }[] = []
  if (vano.sistema) {
    const faseTaglio = storico.find(s => s.fase_nome.toLowerCase().includes('tagl'))
    materiali.push({ 
      nome: `Profilo ${vano.sistema}`, 
      stato: faseTaglio?.stato === 'completato' ? 'ok' : 'attesa' 
    })
  }
  const accessori = vano.accessori && typeof vano.accessori === 'object' ? vano.accessori : {}
  if (accessori.ferramenta) {
    const faseSald = storico.find(s => s.fase_nome.toLowerCase().includes('sald') || s.fase_nome.toLowerCase().includes('ferram'))
    materiali.push({ 
      nome: `Ferramenta ${accessori.ferramenta?.descrizione || accessori.ferramenta?.tipo || ''}`,
      stato: faseSald?.stato === 'completato' ? 'ok' : 'attesa'
    })
  }
  if (vano.vetro) {
    const faseVetri = storico.find(s => s.fase_nome.toLowerCase().includes('vetr'))
    materiali.push({ 
      nome: `Vetro ${vano.vetro}`,
      stato: faseVetri?.stato === 'bloccato' ? 'mancante' : (faseVetri?.stato === 'completato' ? 'ok' : 'attesa')
    })
  }

  if (materiali.length === 0) {
    return <div style={{ background: '#FFF', borderRadius: 10, padding: 12, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessun materiale specifico</div>
  }

  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      {materiali.map((m, i) => {
        const isLast = i === materiali.length - 1
        const sta = m.stato === 'ok' ? { txt: '✓ ok', col: PROD_COLORS.green }
                   : m.stato === 'mancante' ? { txt: '⚠ mancante', col: PROD_COLORS.red }
                   : { txt: 'in attesa', col: PROD_COLORS.textDim }
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: isLast ? 'none' : '1px solid #EEF8F8' }}>
            <span style={{ fontSize: 11, color: PROD_COLORS.navy }}>{m.nome}</span>
            <span style={{ fontSize: 10, color: sta.col, fontWeight: 600 }}>{sta.txt}</span>
          </div>
        )
      })}
    </div>
  )
}

export function FotoENoteRilievo({ vano }: { vano: VanoFull }) {
  const foto = vano.foto_rilievo || []
  const note = vano.note_rilievo
  if (foto.length === 0 && !note) {
    return <div style={{ background: '#FFF', borderRadius: 10, padding: 16, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessuna foto o nota dal rilievo</div>
  }
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      {foto.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {foto.slice(0, 4).map((url: string, i: number) => (
            <div key={i} style={{ width: 60, height: 60, background: `url(${url}) center/cover`, borderRadius: 6, cursor: 'pointer' }} />
          ))}
        </div>
      )}
      {note && <div style={{ fontSize: 11, color: PROD_COLORS.navy, lineHeight: 1.4 }}>{note}</div>}
    </div>
  )
}

export function EventiVano({ eventi }: { eventi: VanoEvento[] }) {
  if (eventi.length === 0) {
    return <div style={{ background: '#FFF', borderRadius: 10, padding: 16, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessuna attività registrata</div>
  }
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      {eventi.map((ev, i) => {
        const ora = new Date(ev.evento_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        const col = ev.tipo === 'blocco' ? PROD_COLORS.red : ev.tipo === 'fine' ? PROD_COLORS.green : ev.colore
        return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 9, color: PROD_COLORS.textDim, width: 40, paddingTop: 1 }}>{ora}</span>
            <div style={{ width: 5, height: 5, background: col, borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: ev.tipo === 'blocco' ? PROD_COLORS.red : PROD_COLORS.navy, fontWeight: ev.tipo === 'blocco' ? 600 : 400, flex: 1 }}>
              {ev.descrizione}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function RiepilogoTempi({ oreStimate, oreLavoro, tempoMortoSec }: { oreStimate: number; oreLavoro: number; tempoMortoSec: number }) {
  const scost = oreStimate > 0 ? Math.round(((oreLavoro - oreStimate) / oreStimate) * 100) : 0
  const tempoMortoH = tempoMortoSec / 3600
  const costoOra = 20
  const costoTot = oreLavoro * costoOra
  return (
    <div style={{ background: '#FFF', borderRadius: 10, padding: 12 }}>
      <RigaT label="Stima totale" value={`${oreStimate.toFixed(1)}h`} />
      <RigaT label="Lavoro effettivo" value={`${oreLavoro.toFixed(2)}h${scost !== 0 ? ` · ${scost > 0 ? '+' : ''}${scost}%` : ''}`} color={oreLavoro === 0 ? PROD_COLORS.textDim : (scost <= 0 ? PROD_COLORS.green : PROD_COLORS.amberText)} />
      {tempoMortoH > 0 && <RigaT label="Tempo morto (blocco)" value={`${tempoMortoH.toFixed(2)}h`} color={PROD_COLORS.red} />}
      <div style={{ height: 1, background: '#EEF8F8', margin: '6px 0' }} />
      <RigaT label="Costo manodopera" value={`€ ${costoTot.toFixed(2)}`} bold />
    </div>
  )
}

function RigaT({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 11, color: bold ? PROD_COLORS.navy : PROD_COLORS.textDim, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 11, color: color || PROD_COLORS.navy, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
