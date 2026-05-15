'use client'
import React from 'react'
import { useCommessaProduzione, chiudiCaricoFn } from '@/hooks/useCommessaProduzione'
import { supabase } from '@/lib/supabase'
import { PROD_COLORS } from './prod-constants'
import { HeaderCommessa, AllertaBlocchi, OperatoriAttivi, sezTitolo } from './commessa-parts-header'
import { CruscottoVani, CaricoStazioniCommessa, TimelineCommessa } from './commessa-parts-body'

interface Props {
  commessaId: string
  aziendaId: string
  onApriVano: (vanoId: string, vanoNumero: number | null, commessaCode: string) => void
  onApriMagazzino?: () => void
  onApriCalendario?: () => void
  onApriChat?: (commessaId: string) => void
  onCaricoChiuso?: () => void
}

export default function ProduzioneCommessaMobile({ 
  commessaId, aziendaId, onApriVano, onApriMagazzino, onApriCalendario, onApriChat, onCaricoChiuso 
}: Props) {
  const { commessa, vani, operatori, stazioni, timeline, loading, error, refetch } = useCommessaProduzione(commessaId, aziendaId)

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento commessa...</div>
  if (error || !commessa) return <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>Errore: {error || 'Commessa non trovata'}</div>

  const totV = commessa.carico_vani_totali || vani.length || 0
  const fatti = vani.filter(v => v.stato_globale === 'completato').length
  const perc = totV > 0 ? Math.round((fatti / totV) * 100) : 0
  const vaniBloccati = vani.filter(v => v.bloccato)

  let sopraStima = 0
  if (commessa.carico_avviato_at && commessa.carico_ore_pianificate) {
    const oreTrascorse = (Date.now() - new Date(commessa.carico_avviato_at).getTime()) / 3600000
    sopraStima = Math.max(0, oreTrascorse - commessa.carico_ore_pianificate)
  }

  const handleTapVano = (vanoId: string, n: number | null) => onApriVano(vanoId, n, commessa.code)
  const handleVediBlocchi = () => {
    if (vaniBloccati[0]) handleTapVano(vaniBloccati[0].vano_id, vaniBloccati[0].vano_numero)
  }
  const handleChiudiCarico = async () => {
    if (!commessa.carico_id) return
    if (!confirm('Confermi chiusura carico? La commessa passerà a montaggio.')) return
    const ok = await chiudiCaricoFn(commessa.carico_id, aziendaId)
    if (ok) {
      refetch()
      onCaricoChiuso?.()
    } else {
      alert('Errore chiusura carico')
    }
  }

  const handleAvviaProduzione = async () => {
    if (!commessa.carico_id) return
    if (!confirm('Avviare la produzione di questa commessa?\nLo stato passa a IN_CORSO e potrai avviare le fasi dei vani.')) return
    const res = await supabase.from('produzione_carichi')
      .update({ stato: 'in_corso', avviato_at: new Date().toISOString() })
      .eq('id', commessa.carico_id).eq('azienda_id', aziendaId)
    if (res.error) {
      alert('Errore: ' + res.error.message)
    } else {
      refetch()
    }
  }

  const puoChiudere = fatti >= totV && vaniBloccati.length === 0 && totV > 0

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 80 }}>
      <HeaderCommessa commessa={commessa} perc={perc} sopraStimaH={sopraStima} vaniBloccati={vaniBloccati.length} />

      <AllertaBlocchi vaniBloccati={vaniBloccati} onVai={handleVediBlocchi} />

      <div style={{ padding: '12px 14px 8px' }}>
        <div style={sezTitolo}>CHI STA LAVORANDO</div>
        <OperatoriAttivi operatori={operatori} />
      </div>

      <div style={{ padding: '6px 14px 8px' }}>
        <div style={sezTitolo}>CRUSCOTTO VANI · {vani.length}</div>
        {vani.length > 0 ? (
          <CruscottoVani vani={vani} onTap={handleTapVano} />
        ) : (
          <div style={{ background: '#FFF', borderRadius: 10, padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>
            Nessun vano in questa commessa
          </div>
        )}
      </div>

      {stazioni.length > 0 && vani.length > 0 && (
        <div style={{ padding: '6px 14px 8px' }}>
          <div style={sezTitolo}>CARICO STAZIONI COMMESSA</div>
          <CaricoStazioniCommessa stazioni={stazioni} />
        </div>
      )}

      <div style={{ padding: '6px 14px 8px' }}>
        <div style={sezTitolo}>TIMELINE · {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</div>
        <TimelineCommessa eventi={timeline} />
      </div>

      {commessa.carico_stato === 'pianificato' && (
        <div style={{ padding: '12px 14px 6px' }}>
          <button onClick={handleAvviaProduzione} style={{ width: '100%', background: PROD_COLORS.green, color: '#FFF', border: 'none', padding: 14, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,110,86,0.3)' }}>
            ▶ AVVIA PRODUZIONE
          </button>
          <div style={{ fontSize: 9, color: PROD_COLORS.textDim, textAlign: 'center', marginTop: 5 }}>
            Cambia stato carico in IN_CORSO · puoi avviare le fasi dei vani
          </div>
        </div>
      )}

      <div style={{ padding: '12px 14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <BtnAz label="MAGAZZINO" onClick={onApriMagazzino} />
        <BtnAz label="CALENDARIO" onClick={onApriCalendario} />
        <BtnAz label="CHAT COMMESSA" onClick={() => onApriChat?.(commessaId)} />
        <BtnAz label="CHIUDI CARICO" primary disabled={!puoChiudere} onClick={handleChiudiCarico} />
      </div>
    </div>
  )
}

function BtnAz({ label, onClick, primary, disabled }: { label: string; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: primary && !disabled ? PROD_COLORS.teal : '#FFF',
      color: primary && !disabled ? '#FFF' : PROD_COLORS.navy,
      border: primary && !disabled ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
      padding: 10, borderRadius: 8, fontSize: 11, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1
    }}>{label}</button>
  )
}
