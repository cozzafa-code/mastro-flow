'use client'
import React, { useEffect, useState } from 'react'
import { useVanoDetail, risolviProblemaVano, mettiInPausaVano, completaFaseRpc } from '@/hooks/useVanoDetail'
import { PROD_COLORS } from './prod-constants'
import { HeaderVano, PercorsoFasi, sezTitolo } from './vano-parts-header'
import { SpecificaTecnica, MaterialiConsumati, FotoENoteRilievo, EventiVano, RiepilogoTempi } from './vano-parts-body'
import { SheetSpostaOperatore, SheetAvviaFase, SheetBloccaFase } from './vano-modals'

interface Props {
  vanoId: string
  aziendaId: string
}

export default function ProduzioneVanoDetailMobile({ vanoId, aziendaId }: Props) {
  const { vano, storico, eventi, caricoId, loading, error, refetch } = useVanoDetail(vanoId, aziendaId)
  const [now, setNow] = useState(Date.now())
  const [showSposta, setShowSposta] = useState<string | null>(null)
  const [showAvvia, setShowAvvia] = useState<{ faseId: string; faseNome: string } | null>(null)
  const [showBlocca, setShowBlocca] = useState<{ vanoStatoId: string; faseNome: string } | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento vano...</div>
  if (error || !vano) return <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>Errore: {error || 'Vano non trovato'}</div>

  const faseBloccata = storico.find(s => s.stato === 'bloccato')
  const faseAttiva = storico.find(s => s.stato === 'in_corso')
  const tutteCompletate = storico.length > 0 && storico.every(s => s.stato === 'completato')

  let statoLabel = 'IN CODA', statoBg: string = '#5F5E5A'
  if (faseBloccata) { statoLabel = 'BLOCCATO'; statoBg = PROD_COLORS.red }
  else if (faseAttiva) { statoLabel = 'IN CORSO'; statoBg = PROD_COLORS.teal }
  else if (tutteCompletate) { statoLabel = 'COMPLETATO'; statoBg = PROD_COLORS.green }

  const oreStimate = vano.ore_produzione || 0
  const oreLavoro = storico.filter(s => s.durata_secondi).reduce((acc, s) => acc + (s.durata_secondi || 0) / 3600, 0)
  const tempoMortoSec = faseBloccata?.problema_aperto_at 
    ? Math.floor((now - new Date(faseBloccata.problema_aperto_at).getTime()) / 1000)
    : 0

  const handleAvvia = (faseId: string, faseNome: string) => {
    if (!caricoId) {
      alert('Per avviare le fasi, devi prima creare un carico di produzione per questa commessa.\n\nVai indietro alla scheda commessa o crea un carico dalla flotta.')
      return
    }
    setShowAvvia({ faseId, faseNome })
  }
  const handleCompleta = async (vanoStatoId: string) => {
    if (!confirm('Confermi completamento fase?')) return
    try { await completaFaseRpc(vanoStatoId); refetch() }
    catch (e: any) { alert('Errore: ' + e.message) }
  }
  const handleRisolvi = async (vanoStatoId: string) => {
    if (!confirm('Confermi risoluzione blocco? Il vano torna in corso.')) return
    const ok = await risolviProblemaVano(vanoStatoId)
    if (ok) refetch(); else alert('Errore')
  }
  const handlePausa = async () => {
    if (!faseAttiva?.vano_stato_id) return alert('Nessuna fase attiva da mettere in pausa')
    if (!confirm('Confermi pausa? Il vano torna in coda.')) return
    const ok = await mettiInPausaVano(faseAttiva.vano_stato_id)
    if (ok) refetch()
  }
  const handleChiamaOp = (opId: string | null) => {
    if (!opId) return
    alert('Chiama operatore (TODO: integrazione telefono)\nOperatore ID: ' + opId)
  }

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 100 }}>
      <HeaderVano vano={vano} tempoMortoSec={tempoMortoSec} statoLabel={statoLabel} statoBg={statoBg} />

      {!caricoId && (
        <div style={{ background: PROD_COLORS.amberBg, borderTop: `3px solid ${PROD_COLORS.amber}`, padding: '8px 14px', fontSize: 11, color: PROD_COLORS.amberText, fontWeight: 600 }}>
          ⚠ Nessun carico produzione per questa commessa. I bottoni AVVIA fase sono disabilitati.
        </div>
      )}

      <div style={{ padding: '12px 12px 8px' }}>
        <div style={sezTitolo}>PERCORSO FASI</div>
        <PercorsoFasi 
          storico={storico} 
          caricoMancante={!caricoId}
          callbacks={{
            onAvvia: handleAvvia,
            onCompleta: handleCompleta,
            onBlocca: (vsId, faseNome) => setShowBlocca({ vanoStatoId: vsId, faseNome }),
            onRisolvi: handleRisolvi,
            onChiamaOp: handleChiamaOp,
            onSposta: (id) => id && setShowSposta(id),
          }}
        />
      </div>

      <div style={{ padding: '6px 12px 8px' }}>
        <div style={sezTitolo}>SPECIFICA TECNICA</div>
        <SpecificaTecnica vano={vano} />
      </div>

      <div style={{ padding: '6px 12px 8px' }}>
        <div style={sezTitolo}>MATERIALI CONSUMATI</div>
        <MaterialiConsumati vano={vano} storico={storico} />
      </div>

      <div style={{ padding: '6px 12px 8px' }}>
        <div style={sezTitolo}>FOTO E NOTE RILIEVO</div>
        <FotoENoteRilievo vano={vano} />
      </div>

      <div style={{ padding: '6px 12px 8px' }}>
        <div style={sezTitolo}>EVENTI · {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</div>
        <EventiVano eventi={eventi} />
      </div>

      <div style={{ padding: '6px 12px 8px' }}>
        <div style={sezTitolo}>RIEPILOGO TEMPI</div>
        <RiepilogoTempi oreStimate={oreStimate} oreLavoro={oreLavoro} tempoMortoSec={tempoMortoSec} />
      </div>

      <div style={{ background: PROD_COLORS.navy, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <BtnAz label="SPOSTA OPERATORE" onClick={() => faseAttiva?.vano_stato_id ? setShowSposta(faseAttiva.vano_stato_id) : (faseBloccata?.vano_stato_id ? setShowSposta(faseBloccata.vano_stato_id) : alert('Nessuna fase attiva o bloccata'))} />
        <BtnAz label="METTI IN PAUSA" onClick={handlePausa} disabled={!faseAttiva} />
        <BtnAz label="DUPLICA VANO" onClick={() => alert('Duplica vano (TODO)')} />
        <BtnAz label="RISOLVI BLOCCO" primary disabled={!faseBloccata} onClick={() => faseBloccata && handleRisolvi(faseBloccata.vano_stato_id!)} />
      </div>

      {showSposta && (
        <SheetSpostaOperatore aziendaId={aziendaId} vanoStatoId={showSposta} onChiudi={() => setShowSposta(null)} onFatto={() => { setShowSposta(null); refetch() }} />
      )}
      {showAvvia && caricoId && vano.commessa_id && (
        <SheetAvviaFase 
          aziendaId={aziendaId} vanoId={vanoId} faseId={showAvvia.faseId} faseNome={showAvvia.faseNome}
          caricoId={caricoId} commessaId={vano.commessa_id}
          onChiudi={() => setShowAvvia(null)} 
          onFatto={() => { setShowAvvia(null); refetch() }}
        />
      )}
      {showBlocca && (
        <SheetBloccaFase 
          vanoStatoId={showBlocca.vanoStatoId} faseNome={showBlocca.faseNome}
          onChiudi={() => setShowBlocca(null)} 
          onFatto={() => { setShowBlocca(null); refetch() }}
        />
      )}
    </div>
  )
}

function BtnAz({ label, onClick, primary, disabled }: { label: string; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: primary && !disabled ? PROD_COLORS.amber : 'rgba(255,255,255,0.1)',
      color: primary && !disabled ? PROD_COLORS.navy : '#FFF',
      border: primary && !disabled ? 'none' : '1px solid rgba(255,255,255,0.2)',
      padding: 10, borderRadius: 7, fontSize: 11, fontWeight: primary ? 700 : 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1
    }}>{label}</button>
  )
}
