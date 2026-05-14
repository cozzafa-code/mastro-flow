'use client'
import React from 'react'
import { useCommessaProduzione } from '@/hooks/useCommessaProduzione'
import { PROD_COLORS } from './prod-constants'
import { 
  HeaderCommessa, 
  AllertaBlocchi, 
  OperatoriAttivi, 
  CruscottoVani,
  sezTitolo 
} from './commessa-prod-parts'

interface Props {
  commessaId: string
  aziendaId: string
  onChiudi: () => void
  onApriVano: (vanoId: string, vanoNumero: number | null, commessaCode: string) => void
  onApriMagazzino?: () => void
  onApriCalendario?: () => void
  onChiudiCarico?: (caricoId: string) => void
}

export default function ProduzioneCommessaMobile({ 
  commessaId, aziendaId, onChiudi, onApriVano, onApriMagazzino, onApriCalendario, onChiudiCarico 
}: Props) {
  const { commessa, vani, operatori, loading, error, refetch } = useCommessaProduzione(commessaId, aziendaId)

  if (loading) {
    return <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento commessa...</div>
  }
  if (error || !commessa) {
    return (
      <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>
        Errore: {error || 'Commessa non trovata'}
      </div>
    )
  }

  const totVani = commessa.carico_vani_totali || vani.length || 0
  const fatti = vani.filter(v => v.stato_globale === 'completato').length
  const perc = totVani > 0 ? Math.round((fatti / totVani) * 100) : 0
  const vaniBloccati = vani.filter(v => v.bloccato)

  // Calcolo "sopra stima" semplice: se carico avviato da più tempo della stima → diff in ore
  let sopraStima = 0
  if (commessa.carico_avviato_at && commessa.carico_ore_pianificate) {
    const oreTrascorse = (Date.now() - new Date(commessa.carico_avviato_at).getTime()) / 3600000
    sopraStima = oreTrascorse - commessa.carico_ore_pianificate
    if (sopraStima < 0) sopraStima = 0
  }

  const handleTapVano = (vanoId: string, numero: number | null) => {
    onApriVano(vanoId, numero, commessa.code)
  }

  const handleVediBlocchi = () => {
    if (vaniBloccati[0]) {
      handleTapVano(vaniBloccati[0].vano_id, vaniBloccati[0].vano_numero)
    }
  }

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 80 }}>
      <HeaderCommessa 
        commessa={commessa} 
        perc={perc} 
        sopraStima={sopraStima} 
        vaniBloccati={vaniBloccati.length}
        onChiudi={onChiudi} 
      />

      <AllertaBlocchi vaniBloccati={vaniBloccati} onRisolvi={handleVediBlocchi} />

      <div style={{ padding: '12px 14px 8px' }}>
        <div style={sezTitolo}>CHI STA LAVORANDO</div>
        <OperatoriAttivi operatori={operatori} />
      </div>

      <div style={{ padding: '6px 14px 8px' }}>
        <div style={sezTitolo}>CRUSCOTTO VANI · {vani.length}</div>
        {vani.length > 0 ? (
          <CruscottoVani vani={vani} onTapVano={handleTapVano} />
        ) : (
          <div style={{ background: '#FFF', borderRadius: 10, padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>
            Nessun vano in produzione per questa commessa
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px 18px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <BtnAzione label="MAGAZZINO" onClick={onApriMagazzino} />
        <BtnAzione label="CALENDARIO" onClick={onApriCalendario} />
        <BtnAzione 
          label="CHIUDI CARICO" 
          primary 
          disabled={fatti < totVani || vaniBloccati.length > 0}
          onClick={() => commessa.carico_id && onChiudiCarico?.(commessa.carico_id)} 
        />
      </div>
    </div>
  )
}

function BtnAzione({ label, onClick, primary, disabled }: { label: string; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{ 
        flex: 1, 
        minWidth: '46%', 
        background: primary && !disabled ? PROD_COLORS.teal : '#FFF', 
        color: primary && !disabled ? '#FFF' : PROD_COLORS.navy, 
        border: primary && !disabled ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`, 
        padding: 10, 
        borderRadius: 8, 
        fontSize: 11, 
        fontWeight: 600, 
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}>
      {label}
    </button>
  )
}
