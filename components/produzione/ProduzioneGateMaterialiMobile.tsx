'use client'
import React, { useState } from 'react'
import { useGateMateriali } from '@/hooks/useGateMateriali'
import { PROD_COLORS } from './prod-constants'
import { HeaderGate, GateSteps, OrdineCard, TimelineGate, sezTitolo } from './gate-materiali-parts'

interface Props {
  commessaId: string
  aziendaId: string
  commessaCode: string
  commessaCliente: string
  commessaDataConsegna: string | null
  vaniTotali: number
  onChiudi: () => void
  onAvviato: (caricoId: string) => void
}

export default function ProduzioneGateMaterialiMobile({
  commessaId, aziendaId, commessaCode, commessaCliente, commessaDataConsegna, vaniTotali,
  onChiudi, onAvviato
}: Props) {
  const { stats, ordini, timeline, loading, error, refetch, avviaProduzione } = useGateMateriali(commessaId, aziendaId)
  const [avviando, setAvviando] = useState(false)
  const [showConfermaForza, setShowConfermaForza] = useState(false)

  if (loading) {
    return <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento gate...</div>
  }
  if (error || !stats) {
    return (
      <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>
        Errore: {error || 'Stats non disponibili'}
      </div>
    )
  }

  const statoGate: 'attesa' | 'pronto' | 'parziale' =
    stats.bloccanti_aperti > 0 ? 'attesa' :
    stats.arrivati === stats.totali ? 'pronto' :
    stats.arrivati > 0 ? 'parziale' : 'attesa'

  const vaniPronti = stats.totali > 0 
    ? Math.floor(vaniTotali * (stats.arrivati / stats.totali))
    : 0
  const percPronti = vaniTotali > 0 ? Math.round((vaniPronti / vaniTotali) * 100) : 0
  const puoAvviarePieno = stats.bloccanti_aperti === 0 && stats.arrivati === stats.totali
  const puoAvviareParziale = vaniPronti > 0 && stats.bloccanti_aperti > 0

  const handleAvvia = async (forza: boolean) => {
    setAvviando(true)
    setShowConfermaForza(false)
    const res = await avviaProduzione(forza)
    setAvviando(false)
    if (res.esito === 'successo' && res.carico_id) {
      onAvviato(res.carico_id)
    } else if (res.esito === 'gate_bloccato') {
      alert(res.msg || 'Gate bloccato')
    } else {
      alert('Errore: ' + (res.msg || 'sconosciuto'))
    }
  }

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 100 }}>
      <HeaderGate 
        codeCommessa={commessaCode}
        cliente={commessaCliente}
        vaniTotali={vaniTotali}
        dataConsegna={commessaDataConsegna}
        statoGate={statoGate}
        onChiudi={onChiudi}
      />

      <GateSteps stats={stats} />

      <div style={{ padding: '12px 12px 6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4, marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600, letterSpacing: 0.6 }}>
            ORDINI FORNITORE · {ordini.length}
          </div>
          <div style={{ fontSize: 10, color: PROD_COLORS.teal, fontWeight: 600 }}>+ ordine</div>
        </div>
        {ordini.length === 0 ? (
          <div style={{ background: '#FFF', borderRadius: 10, padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim, border: `1px dashed ${PROD_COLORS.borderSoft}` }}>
            Nessun ordine fornitore per questa commessa
          </div>
        ) : (
          ordini.map(o => (
            <OrdineCard 
              key={o.id} 
              ordine={o}
              onChiama={() => alert(`Chiama ${o.fornitore}`)}
              onSollecita={() => alert(`Sollecita ${o.numero}`)}
            />
          ))
        )}
      </div>

      {timeline.length > 0 && (
        <div style={{ padding: '6px 12px 8px' }}>
          <div style={sezTitolo}>TIMELINE ORDINI</div>
          <TimelineGate eventi={timeline} />
        </div>
      )}

      <div style={{ background: '#FFF', padding: '12px 14px', marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: PROD_COLORS.textDim, letterSpacing: 0.5 }}>PRONTI PER PRODUZIONE</div>
            <div style={{ fontSize: 14, color: PROD_COLORS.navy, fontWeight: 700, marginTop: 1 }}>
              {vaniPronti} vani su {vaniTotali}
            </div>
          </div>
          <div style={{ fontSize: 11, color: PROD_COLORS.green, fontWeight: 600 }}>{percPronti}%</div>
        </div>
        <div style={{ height: 6, background: '#EEF8F8', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${percPronti}%`, height: '100%', background: PROD_COLORS.green }} />
        </div>
        {stats.bloccanti_aperti > 0 && (
          <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginTop: 6, lineHeight: 1.4 }}>
            {stats.bloccanti_aperti} ordin{stats.bloccanti_aperti === 1 ? 'e' : 'i'} bloccant{stats.bloccanti_aperti === 1 ? 'e' : 'i'} non arrivat{stats.bloccanti_aperti === 1 ? 'o' : 'i'}
          </div>
        )}
      </div>

      <div style={{ background: PROD_COLORS.navy, padding: '14px 16px', display: 'flex', gap: 6 }}>
        {puoAvviareParziale && (
          <button 
            onClick={() => setShowConfermaForza(true)}
            disabled={avviando}
            style={btnGhost}>
            FORZA AVVIO
          </button>
        )}
        <button 
          onClick={() => handleAvvia(false)}
          disabled={avviando || (!puoAvviarePieno && !puoAvviareParziale)}
          style={{ ...btnTeal, flex: 2, opacity: avviando ? 0.5 : 1 }}>
          {avviando ? 'AVVIO IN CORSO...' : puoAvviarePieno 
            ? `AVVIA · ${vaniTotali} VANI` 
            : puoAvviareParziale ? `AVVIA · ${vaniPronti} DISPONIBILI` : 'IN ATTESA MATERIALI'}
        </button>
      </div>

      {showConfermaForza && (
        <ModalConferma
          onConferma={() => handleAvvia(true)}
          onAnnulla={() => setShowConfermaForza(false)}
          bloccanti={stats.bloccanti_aperti}
        />
      )}
    </div>
  )
}

function ModalConferma({ onConferma, onAnnulla, bloccanti }: { onConferma: () => void; onAnnulla: () => void; bloccanti: number }) {
  return (
    <div style={{ 
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100
    }}>
      <div style={{ background: '#FFF', borderRadius: 12, padding: 20, maxWidth: 340 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.red, marginBottom: 8 }}>⚠ Forza avvio?</div>
        <div style={{ fontSize: 12, color: PROD_COLORS.navy, lineHeight: 1.5, marginBottom: 14 }}>
          Ci {bloccanti === 1 ? 'è' : 'sono'} {bloccanti} ordin{bloccanti === 1 ? 'e' : 'i'} bloccant{bloccanti === 1 ? 'e' : 'i'} non ancora arrivat{bloccanti === 1 ? 'o' : 'i'}. 
          La produzione partirà solo per i vani che hanno tutti i materiali.
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onAnnulla} style={{ flex: 1, background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ANNULLA</button>
          <button onClick={onConferma} style={{ flex: 1, background: PROD_COLORS.amber, color: PROD_COLORS.navy, border: 'none', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>FORZA AVVIO</button>
        </div>
      </div>
    </div>
  )
}

const btnGhost: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,0.1)', color: '#FFF',
  border: '1px solid rgba(255,255,255,0.2)', padding: 11,
  borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer'
}

const btnTeal: React.CSSProperties = {
  background: PROD_COLORS.teal, color: '#FFF',
  border: 'none', padding: 11,
  borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer'
}
