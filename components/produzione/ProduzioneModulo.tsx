'use client'
import React, { useState } from 'react'
import ProduzioneFlottaMobile from './ProduzioneFlottaMobile'
import ProduzioneCommessaMobile from './ProduzioneCommessaMobile'
import ProduzioneVanoDetailMobile from './ProduzioneVanoDetailMobile'
import ProduzioneGateMaterialiMobile from './ProduzioneGateMaterialiMobile'
import ProduzioneConfigFasiMobile from './ProduzioneConfigFasiMobile'
import PostazioneLogin from './postazione/PostazioneLogin'
import PostazioneOperatore from './postazione/PostazioneOperatore'
import PianificazioneSettimana from './pianificazione/PianificazioneSettimana'
import WizardNuovaLavorazione from './lavorazioni/WizardNuovaLavorazione'
import { getStoredSession, type OperatoreSession, type CodaLavoro } from '@/hooks/useOperatorPostazione'
import { supabase } from '@/lib/supabase'

type Vista =
  | { tipo: 'flotta' }
  | { tipo: 'commessa'; commessaId: string; caricoId: string | null }
  | { tipo: 'vano'; vanoId: string; vanoNumero: number | null; commessaCode: string; commessaId: string | null }
  | { tipo: 'gate'; commessaId: string; commessaCode: string; commessaCliente: string; commessaDataConsegna: string | null; vaniTotali: number }
  | { tipo: 'config' }
  | { tipo: 'postazione_login' }
  | { tipo: 'postazione' }
  | { tipo: 'pianificazione' }

interface Props {
  aziendaId: string
  aziendaNome?: string
  onChiudiModulo: () => void
  onApriCommessaERP?: (commessaId: string) => void
  onApriMagazzino?: () => void
  onApriCalendario?: () => void
}

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
)
const IconPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6 6 6"/>
  </svg>
)
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

export default function ProduzioneModulo({ aziendaId, aziendaNome, onChiudiModulo, onApriMagazzino, onApriCalendario }: Props) {
  const [vista, setVista] = useState<Vista>({ tipo: 'flotta' })
  const [opSess, setOpSess] = useState<OperatoreSession | null>(typeof window !== 'undefined' ? getStoredSession() : null)
  const [showWizardNuovo, setShowWizardNuovo] = useState(false)

  const apriCarico = async (caricoId: string) => {
    const { data } = await supabase.from('produzione_carichi').select('commessa_id').eq('id', caricoId).eq('azienda_id', aziendaId).maybeSingle()
    if (data?.commessa_id) setVista({ tipo: 'commessa', commessaId: data.commessa_id, caricoId })
  }
  const apriVano = (vanoId: string, vanoNumero: number | null, commessaCode: string) => {
    const commessaId = vista.tipo === 'commessa' ? vista.commessaId : null
    setVista({ tipo: 'vano', vanoId, vanoNumero, commessaCode, commessaId })
  }
  const tornaAllaFlotta = () => setVista({ tipo: 'flotta' })

  const apriDettaglioCoda = (item: CodaLavoro) => {
    if (item.tipo === 'odl' && item.vano_id && item.commessa_id) {
      setVista({ tipo: 'vano', vanoId: item.vano_id, vanoNumero: null, commessaCode: '', commessaId: item.commessa_id })
    } else if (item.tipo === 'lavorazione' || item.tipo === 'riparazione') {
      alert(item.titolo + '\n\n' + (item.sottotitolo || ''))
    }
  }

  const handleIndietro = () => {
    if (vista.tipo === 'flotta') onChiudiModulo()
    else if (vista.tipo === 'vano' && vista.commessaId) setVista({ tipo: 'commessa', commessaId: vista.commessaId, caricoId: null })
    else if (vista.tipo === 'postazione_login') tornaAllaFlotta()
    else tornaAllaFlotta()
  }

  let titolo = 'Officina'
  if (vista.tipo === 'commessa') titolo = 'Commessa'
  else if (vista.tipo === 'vano') titolo = 'Vano ' + (vista.vanoNumero != null ? String(vista.vanoNumero) : '')
  else if (vista.tipo === 'gate') titolo = 'Gate Materiali'
  else if (vista.tipo === 'config') titolo = 'Configurazione Fasi'
  else if (vista.tipo === 'postazione_login') titolo = 'Accesso Postazione'
  else if (vista.tipo === 'postazione') titolo = 'Postazione'
  else if (vista.tipo === 'pianificazione') titolo = 'Pianificazione'

  const renderVista = () => {
    if (vista.tipo === 'postazione_login') {
      return <PostazioneLogin aziendaId={aziendaId} onLogin={s => { setOpSess(s); setVista({ tipo: 'postazione' }) }} onAnnulla={tornaAllaFlotta} />
    }
    if (vista.tipo === 'postazione' && opSess) {
      return <PostazioneOperatore sessione={opSess} aziendaId={aziendaId} onLogout={() => { setOpSess(null); tornaAllaFlotta() }} onApriDettaglio={apriDettaglioCoda} />
    }
    if (vista.tipo === 'postazione' && !opSess) {
      setVista({ tipo: 'postazione_login' })
      return null
    }
    if (vista.tipo === 'pianificazione') {
      return <PianificazioneSettimana aziendaId={aziendaId} />
    }
    if (vista.tipo === 'flotta') {
      return (
        <>
          <div style={{ paddingBottom: 90 }}>
            <ProduzioneFlottaMobile aziendaId={aziendaId} onApriCarico={apriCarico} onApriConfigFasi={() => setVista({ tipo: 'config' })} />
          </div>
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #C8E4E4',
            padding: '10px 12px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            zIndex: 10000,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.06)'
          }}>
            <BtnFooter icon={<IconUser />} label="POSTAZIONE" onClick={() => setVista(opSess ? { tipo: 'postazione' } : { tipo: 'postazione_login' })} />
            <BtnFooter icon={<IconCalendar />} label="PIANIFICA" onClick={() => setVista({ tipo: 'pianificazione' })} />
            <BtnFooter icon={<IconPlus />} label="NUOVO" onClick={() => setShowWizardNuovo(true)} primary />
          </div>
        </>
      )
    }
    if (vista.tipo === 'commessa') {
      return <ProduzioneCommessaMobile commessaId={vista.commessaId} aziendaId={aziendaId} onApriVano={apriVano} onApriMagazzino={onApriMagazzino} onApriCalendario={onApriCalendario} onApriChat={(cm) => alert('CHAT commessa ' + cm)} onCaricoChiuso={tornaAllaFlotta} />
    }
    if (vista.tipo === 'vano') {
      return <ProduzioneVanoDetailMobile vanoId={vista.vanoId} aziendaId={aziendaId} />
    }
    if (vista.tipo === 'gate') {
      return <ProduzioneGateMaterialiMobile commessaId={vista.commessaId} aziendaId={aziendaId} commessaCode={vista.commessaCode} commessaCliente={vista.commessaCliente} commessaDataConsegna={vista.commessaDataConsegna} vaniTotali={vista.vaniTotali} onChiudi={tornaAllaFlotta} onAvviato={apriCarico} />
    }
    if (vista.tipo === 'config') {
      return <ProduzioneConfigFasiMobile aziendaId={aziendaId} aziendaNome={aziendaNome} onChiudi={tornaAllaFlotta} />
    }
    return null
  }

  const hideTopBar = vista.tipo === 'postazione' || vista.tipo === 'postazione_login'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#EEF8F8', overflow: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 'env(safe-area-inset-top)' }}>
      {!hideTopBar && (
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1B3A5C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleIndietro} style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBack /> INDIETRO
          </button>
          <div style={{ fontSize: 11, color: '#9FE1CB', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>{titolo}</div>
          <button onClick={onChiudiModulo} style={{ background: 'transparent', color: '#FFF', border: 'none', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <IconClose />
          </button>
        </div>
      )}
      {renderVista()}
      {showWizardNuovo && (
        <WizardNuovaLavorazione
          aziendaId={aziendaId}
          onChiudi={() => setShowWizardNuovo(false)}
          onCreatoCommessa={() => { setShowWizardNuovo(false) }}
          onCreatoLavorazione={() => { setShowWizardNuovo(false) }}
          onCreatoRiparazione={() => { setShowWizardNuovo(false) }}
          onApriSelettoreCommesse={() => {}}
        />
      )}
    </div>
  )
}

function BtnFooter({ icon, label, onClick, primary }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: primary ? '#14B8A6' : '#FFFFFF',
      color: primary ? '#FFFFFF' : '#1B3A5C',
      border: primary ? 'none' : '1px solid #C8E4E4',
      padding: '8px 6px',
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      letterSpacing: 0.5,
      lineHeight: 1
    }}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function useApriGateProduzione(aziendaId: string | null) {
  return async (commessaId: string) => {
    if (!aziendaId) return null
    const { data: c } = await supabase.from('commesse').select('code, cliente, cognome, data_richiesta').eq('id', commessaId).eq('azienda_id', aziendaId).maybeSingle()
    if (!c) return null
    const { data: pv } = await supabase.rpc('commessa_vani_riepilogo', { p_commessa_id: commessaId, p_azienda_id: aziendaId })
    const cliente = [c.cliente, c.cognome].filter(Boolean).join(' ').trim() || c.code
    return { commessaCode: c.code, commessaCliente: cliente, commessaDataConsegna: c.data_richiesta, vaniTotali: (pv || []).length }
  }
}
