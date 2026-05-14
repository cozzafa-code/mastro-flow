'use client'
import React from 'react'
import { useVanoDetail, useVanoActions, type VanoFaseStorico } from '@/hooks/useVanoDetail'
import { PROD_COLORS, getFaseColor } from './prod-constants'
import { SpecificaTecnica, EventiTimeline, RiepilogoTempi, sezTitolo } from './vano-detail-parts'

interface Props {
  vanoId: string
  aziendaId: string
  commessaCode?: string
  vanoNumero?: number
  onChiudi: () => void
  onChiamaOperatore?: (operatoreId: string) => void
}

export default function ProduzioneVanoDetailMobile({ vanoId, aziendaId, commessaCode, vanoNumero, onChiudi, onChiamaOperatore }: Props) {
  const { vano, storico, eventi, loading, error, refetch } = useVanoDetail(vanoId, aziendaId)
  const actions = useVanoActions(aziendaId)

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento vano...</div>
  if (error || !vano) return (
    <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>
      Errore: {error || 'Vano non trovato'}
    </div>
  )

  const fasebloccata = storico.find(s => s.stato === 'bloccato')
  const faseAttiva = storico.find(s => s.stato === 'in_corso')
  const stato: 'bloccato' | 'in_corso' | 'completato' | 'in_coda' =
    fasebloccata ? 'bloccato' :
    faseAttiva ? 'in_corso' :
    storico.every(s => s.stato === 'completato') && storico.length > 0 ? 'completato' : 'in_coda'

  const oreStimate = vano.ore_produzione || 0
  const oreLavoro = storico.filter(s => s.durata_secondi).reduce((a, s) => a + (s.durata_secondi || 0) / 3600, 0)
  const tempoMortoSec = fasebloccata && fasebloccata.problema_aperto_at
    ? Math.floor((Date.now() - new Date(fasebloccata.problema_aperto_at).getTime()) / 1000)
    : 0

  const statoColore = {
    bloccato: { bg: PROD_COLORS.red, label: 'BLOCCATO' },
    in_corso: { bg: PROD_COLORS.teal, label: 'IN CORSO' },
    completato: { bg: PROD_COLORS.green, label: 'COMPLETATO' },
    in_coda: { bg: '#5F5E5A', label: 'IN CODA' },
  }[stato]

  const risolvi = async (faseId: string) => {
    const id = await getVanoStatoId(vanoId, faseId, aziendaId)
    if (id) { await actions.risolviProblema(id, 'Problema risolto da titolare'); refetch() }
  }

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 80 }}>
      <HeaderVano commessaCode={commessaCode || ''} vanoNumero={vanoNumero} vano={vano} stato={statoColore} tempoMortoSec={tempoMortoSec} onChiudi={onChiudi} />

      <div style={{ padding: '12px 12px 8px' }}>
        <div style={sezTitolo}>PERCORSO FASI</div>
        <div style={{ background: '#FFF', borderRadius: 10, overflow: 'hidden' }}>
          {storico.map((fase, idx) => (
            <FaseRow 
              key={fase.fase_id} fase={fase} ultimo={idx === storico.length - 1}
              onRisolvi={() => risolvi(fase.fase_id)}
              onChiamaOp={() => fase.operatore_id && onChiamaOperatore?.(fase.operatore_id)}
            />
          ))}
        </div>
      </div>

      <SpecificaTecnica vano={vano} />
      {eventi.length > 0 && <EventiTimeline eventi={eventi} />}
      <RiepilogoTempi oreStimate={oreStimate} oreLavoro={oreLavoro} tempoMortoSec={tempoMortoSec} />

      <div style={{ background: PROD_COLORS.navy, padding: '14px 16px', display: 'flex', gap: 6 }}>
        <button style={btnGhost} onClick={() => alert('Sposta operatore: TODO')}>SPOSTA OP.</button>
        <button style={btnGhost} onClick={() => alert('Pausa: TODO')}>PAUSA</button>
        {fasebloccata ? (
          <button style={btnAmber} onClick={() => risolvi(fasebloccata.fase_id)}>RISOLVI BLOCCO</button>
        ) : (
          <button style={btnAmber} onClick={onChiudi}>CHIUDI</button>
        )}
      </div>
    </div>
  )
}

async function getVanoStatoId(vanoId: string, faseId: string, aziendaId: string): Promise<string | null> {
  const { supabase } = await import('@/lib/supabase')
  const { data } = await supabase
    .from('produzione_vano_stato')
    .select('id')
    .eq('vano_id', vanoId).eq('fase_id', faseId).eq('azienda_id', aziendaId)
    .maybeSingle()
  return data?.id || null
}

function HeaderVano({ commessaCode, vanoNumero, vano, stato, tempoMortoSec, onChiudi }: any) {
  const misure = vano.misure_complete?.larghezza && vano.misure_complete?.altezza
    ? `${vano.misure_complete.larghezza} × ${vano.misure_complete.altezza} mm` : ''
  return (
    <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
      <div onClick={onChiudi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>‹</span>
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>{commessaCode} / VANO {vanoNumero ?? ''}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{vano.stanza || vano.nome || vano.tipo || 'Vano'}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>{vano.tipo}{misure && ` · ${misure}`}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{vano.sistema}{vano.colore_int && ` · ${vano.colore_int}`}{vano.colore_est && `/${vano.colore_est}`}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <div style={{ background: stato.bg, padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>{stato.label}</div>
          {tempoMortoSec > 0 && (
            <div style={{ fontSize: 9, color: '#FBF0DC' }}>
              {Math.floor(tempoMortoSec / 3600)}h {Math.floor((tempoMortoSec % 3600) / 60)}m fermo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FaseRow({ fase, ultimo, onRisolvi, onChiamaOp }: { fase: VanoFaseStorico; ultimo: boolean; onRisolvi: () => void; onChiamaOp: () => void }) {
  const c = getFaseColor(fase.fase_colore)
  let borderColor = PROD_COLORS.borderSoft
  let pallinoColor: string = c.bg
  let pallinoIcon: 'check' | 'play' | 'block' | 'wait' = 'wait'
  let bgRow = '#FFF'

  if (fase.stato === 'completato') { borderColor = PROD_COLORS.green; pallinoColor = PROD_COLORS.green; pallinoIcon = 'check' }
  else if (fase.stato === 'in_corso') { borderColor = PROD_COLORS.teal; pallinoColor = PROD_COLORS.teal; pallinoIcon = 'play' }
  else if (fase.stato === 'bloccato') { borderColor = PROD_COLORS.red; pallinoColor = PROD_COLORS.red; pallinoIcon = 'block'; bgRow = '#FFF5F5' }

  const dataFmt = (iso: string | null) => iso ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  const durataMin = fase.durata_secondi ? Math.round(fase.durata_secondi / 60) : null

  return (
    <div style={{ display: 'flex', padding: '10px 12px', borderLeft: `4px solid ${borderColor}`, background: bgRow, borderBottom: ultimo ? 'none' : `1px solid #EEF8F8` }}>
      <div style={{ marginRight: 10, flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, background: fase.stato === 'in_coda' ? '#FFF' : pallinoColor, border: fase.stato === 'in_coda' ? `2px dashed ${PROD_COLORS.borderSoft}` : 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pallinoIcon === 'check' && <span style={{ color: '#FFF', fontWeight: 700, fontSize: 12 }}>✓</span>}
          {pallinoIcon === 'play' && <div style={{ width: 8, height: 8, background: '#FFF', borderRadius: '50%' }} />}
          {pallinoIcon === 'block' && <span style={{ color: '#FFF', fontWeight: 700, fontSize: 12 }}>!</span>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: fase.stato === 'bloccato' ? 700 : 600, color: fase.stato === 'bloccato' ? PROD_COLORS.red : PROD_COLORS.navy }}>
            {fase.fase_ordine} · {fase.fase_nome}{fase.stato === 'bloccato' && ' · BLOCCATO'}
          </div>
          <div style={{ fontSize: 9, color: fase.stato === 'completato' ? PROD_COLORS.green : (fase.stato === 'bloccato' ? PROD_COLORS.red : PROD_COLORS.textDim), fontWeight: 600 }}>
            {fase.iniziato_at && dataFmt(fase.iniziato_at)}
            {fase.completato_at && ` → ${dataFmt(fase.completato_at).split(' ').slice(-1)[0]}`}
          </div>
        </div>
        {fase.operatore_id && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 18, height: 18, background: PROD_COLORS.navy, borderRadius: '50%', color: '#FFF', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {fase.operatore_nome.split(' ').map(s => s[0]).slice(0, 2).join('')}
            </div>
            <span style={{ fontSize: 11, color: PROD_COLORS.navy, fontWeight: fase.stato === 'bloccato' ? 600 : 400 }}>{fase.operatore_nome}</span>
            {fase.macchina && (
              <span style={{ background: fase.stato === 'bloccato' ? PROD_COLORS.redBg : '#EEF8F8', color: fase.stato === 'bloccato' ? PROD_COLORS.red : PROD_COLORS.navy, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: fase.stato === 'bloccato' ? 600 : 400 }}>
                {fase.macchina}
              </span>
            )}
          </div>
        )}
        {durataMin !== null && (
          <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 10, color: PROD_COLORS.textDim }}>
            <span>⏱ {durataMin} min</span>
          </div>
        )}
        {fase.stato === 'bloccato' && fase.problema_descrizione && (
          <>
            <div style={{ background: '#FFF', border: `1px solid #F09595`, borderRadius: 6, padding: '6px 8px', marginTop: 7, fontSize: 10, color: PROD_COLORS.navy, lineHeight: 1.4 }}>
              <b style={{ color: PROD_COLORS.red }}>⚠ Problema:</b> {fase.problema_descrizione}
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
              <button onClick={onRisolvi} style={{ background: PROD_COLORS.red, color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>RISOLVI</button>
              {fase.operatore_id && (
                <button onClick={onChiamaOp} style={{ background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>CHIAMA OP.</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const btnGhost: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,0.1)', color: '#FFF',
  border: '1px solid rgba(255,255,255,0.2)', padding: 10,
  borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer'
}

const btnAmber: React.CSSProperties = {
  flex: 1, background: PROD_COLORS.amber, color: PROD_COLORS.navy,
  border: 'none', padding: 10,
  borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer'
}
