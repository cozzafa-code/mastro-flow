'use client'
import React, { useState } from 'react'
import ProduzioneFlottaMobile from './ProduzioneFlottaMobile'
import ProduzioneCommessaMobile from './ProduzioneCommessaMobile'
import ProduzioneVanoDetailMobile from './ProduzioneVanoDetailMobile'
import ProduzioneGateMaterialiMobile from './ProduzioneGateMaterialiMobile'
import ProduzioneConfigFasiMobile from './ProduzioneConfigFasiMobile'
import { supabase } from '@/lib/supabase'

type Vista = 
  | { tipo: 'flotta' }
  | { tipo: 'commessa'; commessaId: string; caricoId: string | null }
  | { tipo: 'vano'; vanoId: string; vanoNumero: number | null; commessaCode: string; commessaId: string | null }
  | { tipo: 'gate'; commessaId: string; commessaCode: string; commessaCliente: string; commessaDataConsegna: string | null; vaniTotali: number }
  | { tipo: 'config' }

interface Props {
  aziendaId: string
  aziendaNome?: string
  onChiudiModulo: () => void
  onApriCommessaERP?: (commessaId: string) => void
  onApriMagazzino?: () => void
  onApriCalendario?: () => void
}

export default function ProduzioneModulo({ 
  aziendaId, aziendaNome, onChiudiModulo, onApriCommessaERP, onApriMagazzino, onApriCalendario 
}: Props) {
  const [vista, setVista] = useState<Vista>({ tipo: 'flotta' })

  const apriCarico = async (caricoId: string) => {
    const { data } = await supabase
      .from('produzione_carichi')
      .select('commessa_id')
      .eq('id', caricoId)
      .eq('azienda_id', aziendaId)
      .maybeSingle()
    if (data?.commessa_id) {
      setVista({ tipo: 'commessa', commessaId: data.commessa_id, caricoId })
    }
  }

  const apriVano = (vanoId: string, vanoNumero: number | null, commessaCode: string) => {
    const commessaId = vista.tipo === 'commessa' ? vista.commessaId : null
    setVista({ tipo: 'vano', vanoId, vanoNumero, commessaCode, commessaId })
  }

  const apriGate = async (commessaId: string) => {
    const { data: c } = await supabase
      .from('commesse')
      .select('code, cliente, cognome, data_richiesta')
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle()
    if (!c) return
    const { data: pv } = await supabase.rpc('commessa_vani_riepilogo', { 
      p_commessa_id: commessaId, p_azienda_id: aziendaId 
    })
    const vaniTotali = (pv || []).length
    const cliente = [c.cliente, c.cognome].filter(Boolean).join(' ').trim() || c.code
    setVista({
      tipo: 'gate',
      commessaId,
      commessaCode: c.code,
      commessaCliente: cliente,
      commessaDataConsegna: c.data_richiesta,
      vaniTotali
    })
  }

  const tornaAllaFlotta = () => setVista({ tipo: 'flotta' })

  // navigazione INDIETRO contestuale
  const handleIndietro = () => {
    if (vista.tipo === 'flotta') {
      onChiudiModulo()
    } else if (vista.tipo === 'vano' && vista.commessaId) {
      setVista({ tipo: 'commessa', commessaId: vista.commessaId, caricoId: null })
    } else {
      tornaAllaFlotta()
    }
  }

  // titolo header dinamico
  let titolo = 'Officina'
  if (vista.tipo === 'commessa') titolo = 'Commessa'
  else if (vista.tipo === 'vano') titolo = `Vano ${vista.vanoNumero ?? ''}`
  else if (vista.tipo === 'gate') titolo = 'Gate Materiali'
  else if (vista.tipo === 'config') titolo = 'Configurazione Fasi'

  // contenuto vista
  const renderVista = () => {
    if (vista.tipo === 'flotta') {
      return (
        <ProduzioneFlottaMobile
          aziendaId={aziendaId}
          onApriCarico={apriCarico}
          onApriConfigFasi={() => setVista({ tipo: 'config' })}
        />
      )
    }
    if (vista.tipo === 'commessa') {
      return (
        <ProduzioneCommessaMobile
          commessaId={vista.commessaId}
          aziendaId={aziendaId}
          onApriVano={apriVano}
          onApriMagazzino={onApriMagazzino}
          onApriCalendario={onApriCalendario}
          onApriChat={(cm) => alert('CHAT commessa ' + cm + '\n(da collegare a modulo chat)')}
          onCaricoChiuso={tornaAllaFlotta}
        />
      )
    }
    if (vista.tipo === 'vano') {
      return (
        <ProduzioneVanoDetailMobile
          vanoId={vista.vanoId}
          aziendaId={aziendaId}
        />
      )
    }
    if (vista.tipo === 'gate') {
      return (
        <ProduzioneGateMaterialiMobile
          commessaId={vista.commessaId}
          aziendaId={aziendaId}
          commessaCode={vista.commessaCode}
          commessaCliente={vista.commessaCliente}
          commessaDataConsegna={vista.commessaDataConsegna}
          vaniTotali={vista.vaniTotali}
          onChiudi={tornaAllaFlotta}
          onAvviato={(caricoId) => apriCarico(caricoId)}
        />
      )
    }
    if (vista.tipo === 'config') {
      return (
        <ProduzioneConfigFasiMobile
          aziendaId={aziendaId}
          aziendaNome={aziendaNome}
          onChiudi={tornaAllaFlotta}
        />
      )
    }
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#EEF8F8',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#1B3A5C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button
          onClick={handleIndietro}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>â€¹</span> INDIETRO
        </button>
        <div style={{
          fontSize: 11,
          color: '#9FE1CB',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>{titolo}</div>
        <button
          onClick={onChiudiModulo}
          style={{
            background: 'transparent',
            color: '#FFF',
            border: 'none',
            fontSize: 22,
            lineHeight: 1,
            padding: '6px 10px',
            cursor: 'pointer',
            fontWeight: 300,
          }}>Ã—</button>
      </div>
      {renderVista()}
    </div>
  )
}

// Helper esportato: apre direttamente il GATE per una commessa specifica
// Usato dal pulsante "AVVIA PRODUZIONE" dentro la scheda commessa ERP
export function useApriGateProduzione(aziendaId: string | null) {
  return async (commessaId: string): Promise<{ commessaCode: string; commessaCliente: string; commessaDataConsegna: string | null; vaniTotali: number } | null> => {
    if (!aziendaId) return null
    const { data: c } = await supabase
      .from('commesse')
      .select('code, cliente, cognome, data_richiesta')
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle()
    if (!c) return null
    const { data: pv } = await supabase.rpc('commessa_vani_riepilogo', { 
      p_commessa_id: commessaId, p_azienda_id: aziendaId 
    })
    const cliente = [c.cliente, c.cognome].filter(Boolean).join(' ').trim() || c.code
    return {
      commessaCode: c.code,
      commessaCliente: cliente,
      commessaDataConsegna: c.data_richiesta,
      vaniTotali: (pv || []).length
    }
  }
}
