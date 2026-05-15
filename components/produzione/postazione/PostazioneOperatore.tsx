'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useOperatorCoda, logoutOperatore, completaLavorazioneInt, completaRiparazioneFn, type OperatoreSession, type CodaLavoro } from '@/hooks/useOperatorPostazione'
import { completaFaseRpc } from '@/hooks/useVanoDetail'
import { PROD_COLORS, getFaseColor } from '../prod-constants'

interface Props {
  sessione: OperatoreSession
  aziendaId: string
  onLogout: () => void
  onApriDettaglio: (codaItem: CodaLavoro) => void
}

export default function PostazioneOperatore({ sessione, aziendaId, onLogout, onApriDettaglio }: Props) {
  const { coda, loading, error, refetch } = useOperatorCoda(sessione.operatore_id, aziendaId)
  const [now, setNow] = useState(Date.now())
  const [oraCorrente, setOraCorrente] = useState(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      setOraCorrente(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = async () => {
    if (confirm('Confermi uscita?')) {
      await logoutOperatore(sessione.operatore_id)
      onLogout()
    }
  }

  const inCorso = coda.find(c => c.stato === 'in_corso')
  const bloccati = coda.filter(c => c.stato === 'bloccato')
  const prossimi = coda.filter(c => !['in_corso', 'bloccato'].includes(c.stato))

  const handleCompleta = async () => {
    if (!inCorso) return
    if (!confirm('Confermi completamento?')) return
    try {
      if (inCorso.tipo === 'odl' && inCorso.vano_stato_id) await completaFaseRpc(inCorso.vano_stato_id)
      else if (inCorso.tipo === 'lavorazione') await completaLavorazioneInt(inCorso.id)
      else if (inCorso.tipo === 'riparazione') await completaRiparazioneFn(inCorso.id)
      refetch()
    } catch (e: any) { alert('Errore: ' + e.message) }
  }

  const handleBlocca = async () => {
    if (!inCorso || inCorso.tipo !== 'odl' || !inCorso.vano_stato_id) return alert('Solo OdL possono essere bloccati qui')
    const motivo = prompt('Descrivi il problema:')
    if (!motivo) return
    const res = await supabase.rpc('blocca_fase_vano', { p_vano_stato_id: inCorso.vano_stato_id, p_problema: motivo })
    if (res.error) alert('Errore: ' + res.error.message)
    else refetch()
  }

  const inizio = inCorso?.iniziato_at ? new Date(inCorso.iniziato_at).getTime() : null
  const durMin = inizio ? Math.floor((now - inizio) / 60000) : 0
  const durSec = inizio ? Math.floor(((now - inizio) % 60000) / 1000) : 0

  const init = (sessione.nome[0] || '') + ((sessione.cognome || '')[0] || '')

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 30 }}>
      {/* Header operatore */}
      <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, background: sessione.colore || PROD_COLORS.teal, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 600 }}>{init}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1 }}>{sessione.nome} {sessione.cognome}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{sessione.postazione || 'Postazione'} · {oraCorrente}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>ESCI</button>
        </div>
      </div>

      {error && <div style={{ background: PROD_COLORS.redBg, color: PROD_COLORS.red, padding: 12, margin: 10, borderRadius: 8, fontSize: 12 }}>Errore: {error}</div>}

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento...</div>
      ) : (
        <>
          {/* Lavoro in corso - grande card centrale */}
          {inCorso ? (
            <CardInCorso item={inCorso} durMin={durMin} durSec={durSec} onCompleta={handleCompleta} onBlocca={handleBlocca} onApri={() => onApriDettaglio(inCorso)} />
          ) : (
            <div style={{ background: '#FFF', margin: 12, padding: 24, borderRadius: 12, textAlign: 'center', border: `1px dashed ${PROD_COLORS.borderSoft}` }}>
              <div style={{ fontSize: 13, color: PROD_COLORS.textDim }}>Nessun lavoro in corso</div>
              <div style={{ fontSize: 11, color: PROD_COLORS.textDim, marginTop: 4 }}>Tocca un lavoro qui sotto per iniziare</div>
            </div>
          )}

          {/* Lavori bloccati */}
          {bloccati.length > 0 && (
            <div style={{ padding: '0 12px 8px' }}>
              <div style={{ fontSize: 10, color: PROD_COLORS.red, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6, paddingLeft: 4 }}>BLOCCATI · {bloccati.length}</div>
              {bloccati.map(b => <CardCoda key={b.id} item={b} onTap={() => onApriDettaglio(b)} stato="bloccato" />)}
            </div>
          )}

          {/* Prossimi in coda */}
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6, paddingLeft: 4 }}>PROSSIMI · {prossimi.length}</div>
            {prossimi.length === 0 ? (
              <div style={{ background: '#FFF', padding: 16, borderRadius: 10, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessun lavoro in coda</div>
            ) : (
              prossimi.map(p => <CardCoda key={p.id} item={p} onTap={() => onApriDettaglio(p)} stato="coda" />)
            )}
          </div>
        </>
      )}
    </div>
  )
}

function CardInCorso({ item, durMin, durSec, onCompleta, onBlocca, onApri }: any) {
  const c = item.fase_colore ? getFaseColor(item.fase_colore) : { bg: PROD_COLORS.teal }
  return (
    <div style={{ margin: 12, background: '#FFF', borderRadius: 14, overflow: 'hidden', border: `2px solid ${c.bg}` }}>
      <div style={{ background: c.bg, color: '#FFF', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>IN CORSO · {item.fase_nome?.toUpperCase()}</div>
        <div style={{ fontSize: 11, opacity: 0.95, fontVariantNumeric: 'tabular-nums' }}>⏱ {durMin}:{String(durSec).padStart(2,'0')}</div>
      </div>
      <div onClick={onApri} style={{ padding: '14px 16px', cursor: 'pointer' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: PROD_COLORS.navy, lineHeight: 1.1 }}>{item.titolo}</div>
        {item.sottotitolo && <div style={{ fontSize: 12, color: PROD_COLORS.textDim, marginTop: 4 }}>{item.sottotitolo}</div>}
        {item.macchina && <div style={{ display: 'inline-block', background: PROD_COLORS.bgPage, color: PROD_COLORS.navy, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500, marginTop: 8 }}>{item.macchina}</div>}
        <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginTop: 6 }}>Tocca per aprire dettaglio →</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: PROD_COLORS.borderSoft }}>
        <button onClick={onBlocca} style={{ background: '#FFF', color: PROD_COLORS.red, border: 'none', padding: '14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⊘ SEGNALA BLOCCO</button>
        <button onClick={onCompleta} style={{ background: PROD_COLORS.green, color: '#FFF', border: 'none', padding: '14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✓ COMPLETATO</button>
      </div>
    </div>
  )
}

function CardCoda({ item, onTap, stato }: { item: CodaLavoro; onTap: () => void; stato: 'bloccato' | 'coda' }) {
  const c = item.fase_colore ? getFaseColor(item.fase_colore) : { bg: PROD_COLORS.borderSoft }
  return (
    <div onClick={onTap} style={{
      background: '#FFF',
      borderLeft: `4px solid ${stato === 'bloccato' ? PROD_COLORS.red : c.bg}`,
      borderRadius: '0 10px 10px 0',
      padding: '10px 14px',
      marginBottom: 5,
      cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: PROD_COLORS.navy }}>{item.titolo}</div>
          {item.fase_nome && <span style={{ background: c.bg, color: '#FFF', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>{item.fase_nome}</span>}
          {item.tipo === 'lavorazione' && <span style={{ background: PROD_COLORS.amberBg, color: PROD_COLORS.amberText, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>INTERNA</span>}
          {item.tipo === 'riparazione' && <span style={{ background: PROD_COLORS.redBg, color: PROD_COLORS.red, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>RIPARAZIONE</span>}
        </div>
        {item.sottotitolo && <div style={{ fontSize: 11, color: PROD_COLORS.textDim, marginTop: 2 }}>{item.sottotitolo}</div>}
        <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginTop: 3 }}>
          {item.stima_minuti && <span>stima {item.stima_minuti} min</span>}
          {item.macchina && <span> · {item.macchina}</span>}
        </div>
      </div>
      <div style={{ fontSize: 18, color: PROD_COLORS.textDim, marginLeft: 8 }}>›</div>
    </div>
  )
}
