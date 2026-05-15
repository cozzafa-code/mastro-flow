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
  | { tipo: 'commessa'; commessaId: string; caricoId: string }
  | { tipo: 'vano'; vanoId: string; vanoNumero: number | null; commessaCode: string }
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
    setVista({ tipo: 'vano', vanoId, vanoNumero, commessaCode })
  }

  const apriGate = async (commessaId: string) => {
    const { data: c } = await supabase
      .from('commesse')
      .select('code, cliente_nome, data_consegna_prevista')
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle()
    const { data: pv } = await supabase.rpc('commessa_vani_riepilogo', { 
      p_commessa_id: commessaId, p_azienda_id: aziendaId 
    })
    const vaniTotali = (pv || []).length
    if (c) {
      setVista({
        tipo: 'gate',
        commessaId,
        commessaCode: c.code,
        commessaCliente: c.cliente_nome || '',
        commessaDataConsegna: c.data_consegna_prevista,
        vaniTotali
      })
    }
  }

  const tornaAllaFlotta = () => setVista({ tipo: 'flotta' })
  const chiudiCarico = async (caricoId: string) => {
    if (!confirm('Confermi la chiusura del carico? La commessa passerà alla fase montaggio.')) return
    await supabase
      .from('produzione_carichi')
      .update({ stato: 'completato', completato_at: new Date().toISOString() })
      .eq('id', caricoId)
      .eq('azienda_id', aziendaId)
    tornaAllaFlotta()
  }

  if (vista.tipo === 'flotta') {
    return (
      <ProduzioneFlottaMobile
        aziendaId={aziendaId}
        onApriCarico={apriCarico}
        onApriConfigFasi={() => setVista({ tipo: 'config' })}
        onNuovoCarico={() => alert('Nuovo carico: scegli commessa\n\n(TODO: aprire selettore commesse in fase confermata/acconto_pagato)')}
      />
    )
  }

  if (vista.tipo === 'commessa') {
    return (
      <ProduzioneCommessaMobile
        commessaId={vista.commessaId}
        aziendaId={aziendaId}
        onChiudi={tornaAllaFlotta}
        onApriVano={apriVano}
        onApriMagazzino={onApriMagazzino}
        onApriCalendario={onApriCalendario}
        onChiudiCarico={chiudiCarico}
      />
    )
  }

  if (vista.tipo === 'vano') {
    return (
      <ProduzioneVanoDetailMobile
        vanoId={vista.vanoId}
        aziendaId={aziendaId}
        commessaCode={vista.commessaCode}
        vanoNumero={vista.vanoNumero ?? undefined}
        onChiudi={() => {
          // torna alla scheda commessa se conosco l'id, altrimenti flotta
          setVista({ tipo: 'flotta' })
        }}
        onChiamaOperatore={(opId) => alert(`Chiama operatore ${opId}`)}
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

// Helper esportato: apre direttamente il GATE per una commessa specifica
// Usato dal pulsante "AVVIA PRODUZIONE" dentro la scheda commessa ERP
export function useApriGateProduzione(aziendaId: string | null) {
  return async (commessaId: string): Promise<{ commessaCode: string; commessaCliente: string; commessaDataConsegna: string | null; vaniTotali: number } | null> => {
    if (!aziendaId) return null
    const { data: c } = await supabase
      .from('commesse')
      .select('code, cliente_nome, data_consegna_prevista')
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle()
    if (!c) return null
    const { data: pv } = await supabase.rpc('commessa_vani_riepilogo', { 
      p_commessa_id: commessaId, p_azienda_id: aziendaId 
    })
    return {
      commessaCode: c.code,
      commessaCliente: c.cliente_nome || '',
      commessaDataConsegna: c.data_consegna_prevista,
      vaniTotali: (pv || []).length
    }
  }
}
