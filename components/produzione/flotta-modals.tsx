import React, { useEffect, useState } from 'react'
import { PROD_COLORS } from './prod-constants'
import { fetchCommesseDisponibili, creaCarico, type CommessaDisponibile } from '@/hooks/useProduzioneFlotta'

export function ModalNuovoCarico({ aziendaId, onAnnulla, onCreato }: { aziendaId: string; onAnnulla: () => void; onCreato: (caricoId: string) => void }) {
  const [commesse, setCommesse] = useState<CommessaDisponibile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCommesseDisponibili(aziendaId)
      .then(setCommesse)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [aziendaId])

  const handleCrea = async (cm: CommessaDisponibile) => {
    setCreating(cm.id)
    setError(null)
    try {
      const caricoId = await creaCarico(aziendaId, cm.id)
      onCreato(caricoId)
    } catch (e: any) {
      setError(e.message || 'Errore creazione carico')
      setCreating(null)
    }
  }

  return (
    <div style={overlay}>
      <div style={modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy }}>Nuovo carico produzione</div>
            <div style={{ fontSize: 11, color: PROD_COLORS.textDim, marginTop: 2 }}>Seleziona commessa da avviare</div>
          </div>
          <button onClick={onAnnulla} style={{ background: 'none', border: 'none', fontSize: 22, color: PROD_COLORS.textDim, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
        </div>
        {error && <div style={{ background: PROD_COLORS.redBg, color: PROD_COLORS.red, padding: '6px 10px', borderRadius: 6, fontSize: 11, marginBottom: 8 }}>{error}</div>}
        <div style={{ maxHeight: '60vh', overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Caricamento...</div>
          ) : commesse.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim, background: PROD_COLORS.bgPage, borderRadius: 8 }}>
              Nessuna commessa pronta per la produzione.<br />
              <span style={{ fontSize: 10, opacity: 0.7 }}>Serve fase "confermata", "acconto_pagato" o "ordine"</span>
            </div>
          ) : (
            commesse.map(cm => (
              <div key={cm.id} onClick={() => !creating && handleCrea(cm)} style={{ background: '#FFF', border: `1px solid ${PROD_COLORS.borderSoft}`, borderRadius: 8, padding: '10px 12px', marginBottom: 5, cursor: creating ? 'wait' : 'pointer', opacity: creating && creating !== cm.id ? 0.4 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: PROD_COLORS.navy }}>{cm.code}</span>
                      <span style={{ background: PROD_COLORS.greenBg, color: PROD_COLORS.green, padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>{cm.fase}</span>
                    </div>
                    <div style={{ fontSize: 11, color: PROD_COLORS.navy, marginTop: 1 }}>{cm.cliente || '—'} · {cm.n_vani} vani</div>
                    {cm.data_consegna && <div style={{ fontSize: 9, color: PROD_COLORS.textDim, marginTop: 1 }}>consegna {new Date(cm.data_consegna).toLocaleDateString('it-IT')}</div>}
                  </div>
                  <button style={{ background: PROD_COLORS.teal, color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                    {creating === cm.id ? '...' : 'AVVIA'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function SheetFiltri({ filtroBase, setFiltroBase, sistemiSel, setSistemiSel, sistemiDisponibili, onChiudi }: any) {
  const toggleSistema = (s: string) => {
    setSistemiSel(sistemiSel.includes(s) ? sistemiSel.filter((x: string) => x !== s) : [...sistemiSel, s])
  }
  const resetTutti = () => { setFiltroBase('tutti'); setSistemiSel([]) }
  return (
    <div style={overlay} onClick={onChiudi}>
      <div onClick={e => e.stopPropagation()} style={{ ...modalBox, position: 'absolute', bottom: 0, left: 0, right: 0, top: 'auto', maxWidth: '100%', borderRadius: '14px 14px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy }}>Filtri avanzati</div>
          <button onClick={onChiudi} style={{ background: 'none', border: 'none', fontSize: 22, color: PROD_COLORS.textDim, cursor: 'pointer' }}>×</button>
        </div>
        <SecF titolo="STATO">
          {['tutti', 'urgenti', 'bloccate', 'ritardo', 'settimana'].map(f => (
            <Opzione key={f} attivo={filtroBase === f} onClick={() => setFiltroBase(f)} label={f.toUpperCase()} />
          ))}
        </SecF>
        {sistemiDisponibili.length > 0 && (
          <SecF titolo="SISTEMA COSTRUZIONE">
            {sistemiDisponibili.map((s: string) => (
              <Opzione key={s} attivo={sistemiSel.includes(s)} onClick={() => toggleSistema(s)} label={s} />
            ))}
          </SecF>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <button onClick={resetTutti} style={{ flex: 1, background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>RESET</button>
          <button onClick={onChiudi} style={{ flex: 1, background: PROD_COLORS.teal, color: '#FFF', border: 'none', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>APPLICA</button>
        </div>
      </div>
    </div>
  )
}

function SecF({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: PROD_COLORS.textDim, letterSpacing: 0.6, marginBottom: 8 }}>{titolo}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  )
}

function Opzione({ attivo, onClick, label }: any) {
  return (
    <button onClick={onClick} style={{
      background: attivo ? PROD_COLORS.navy : '#FFF',
      color: attivo ? '#FFF' : PROD_COLORS.navy,
      border: attivo ? 'none' : `1px solid ${PROD_COLORS.borderSoft}`,
      padding: '6px 12px', borderRadius: 18, fontSize: 11, fontWeight: 600, cursor: 'pointer'
    }}>{label}</button>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }
const modalBox: React.CSSProperties = { background: '#FFF', borderRadius: 12, padding: 16, width: '100%', maxWidth: 380 }
