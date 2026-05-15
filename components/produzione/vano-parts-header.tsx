import React from 'react'
import { PROD_COLORS, getFaseColor } from './prod-constants'
import type { VanoFull, VanoFaseStorico } from '@/hooks/useVanoDetail'

export const sezTitolo: React.CSSProperties = {
  fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600,
  letterSpacing: 0.6, marginBottom: 8, paddingLeft: 4
}

export function HeaderVano({ vano, statoBlocco, tempoMortoSec, statoLabel, statoBg }: { vano: VanoFull; statoBlocco: boolean; tempoMortoSec: number; statoLabel: string; statoBg: string }) {
  const titolo = vano.stanza || vano.nome || vano.tipo || 'Vano'
  const misure = vano.misure_larghezza && vano.misure_altezza 
    ? `${vano.misure_larghezza}×${vano.misure_altezza} mm`
    : (vano.misure_json?.l && vano.misure_json?.h ? `${vano.misure_json.l}×${vano.misure_json.h} mm` : '')
  const colori = [vano.colore_int, vano.colore_est].filter(Boolean).join('/')

  return (
    <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5, marginBottom: 8 }}>
        {vano.commessa_code} / VANO {vano.numero ?? '?'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{titolo}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
            {vano.tipo}{misure && ` · ${misure}`}
            {vano.pezzi > 1 && ` · ${vano.pezzi} pz`}
          </div>
          {(vano.sistema || colori) && (
            <div style={{ fontSize: 11, opacity: 0.85 }}>
              {vano.sistema}{colori && ` · ${colori}`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <div style={{ background: statoBg, padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>{statoLabel}</div>
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

export function PercorsoFasi({ storico, onRisolvi, onChiamaOp, onSposta }: { storico: VanoFaseStorico[]; onRisolvi: (faseId: string, vanoStatoId: string | null) => void; onChiamaOp: (opId: string | null) => void; onSposta: (vanoStatoId: string | null) => void }) {
  return (
    <div style={{ background: '#FFF', borderRadius: 10, overflow: 'hidden' }}>
      {storico.map((f, idx) => (
        <FaseRow key={f.fase_id} fase={f} ultimo={idx === storico.length - 1} 
          onRisolvi={() => onRisolvi(f.fase_id, f.vano_stato_id)}
          onChiamaOp={() => onChiamaOp(f.operatore_id)}
          onSposta={() => onSposta(f.vano_stato_id)}
        />
      ))}
    </div>
  )
}

function FaseRow({ fase, ultimo, onRisolvi, onChiamaOp, onSposta }: { fase: VanoFaseStorico; ultimo: boolean; onRisolvi: () => void; onChiamaOp: () => void; onSposta: () => void }) {
  const c = getFaseColor(fase.fase_colore)
  let borderColor = PROD_COLORS.borderSoft
  let pallinoBg: string = c.bg
  let icon: 'check' | 'play' | 'block' | 'wait' = 'wait'
  let bgRow = '#FFF'
  let isCoda = false

  if (fase.stato === 'completato') { borderColor = PROD_COLORS.green; pallinoBg = PROD_COLORS.green; icon = 'check' }
  else if (fase.stato === 'in_corso') { borderColor = PROD_COLORS.teal; pallinoBg = PROD_COLORS.teal; icon = 'play' }
  else if (fase.stato === 'bloccato') { borderColor = PROD_COLORS.red; pallinoBg = PROD_COLORS.red; icon = 'block'; bgRow = '#FFF5F5' }
  else { isCoda = true }

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  const durMin = fase.durata_secondi ? Math.round(fase.durata_secondi / 60) : null
  const scostMin = durMin !== null && fase.stima_minuti ? durMin - fase.stima_minuti : null

  return (
    <div style={{ display: 'flex', padding: '10px 12px', borderLeft: isCoda ? 'none' : `4px solid ${borderColor}`, background: bgRow, borderBottom: ultimo ? 'none' : `1px solid #EEF8F8` }}>
      <div style={{ marginRight: 10, flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, background: isCoda ? '#FFF' : pallinoBg, border: isCoda ? `2px dashed ${PROD_COLORS.borderSoft}` : 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon === 'check' && <span style={{ color: '#FFF', fontWeight: 700, fontSize: 12 }}>✓</span>}
          {icon === 'play' && <div style={{ width: 8, height: 8, background: '#FFF', borderRadius: '50%' }} />}
          {icon === 'block' && <span style={{ color: '#FFF', fontWeight: 700, fontSize: 12 }}>!</span>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isCoda ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 500, color: PROD_COLORS.textDim }}>{fase.fase_ordine} · {fase.fase_nome}</div>
            <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginTop: 2 }}>
              in attesa{fase.stima_minuti && ` · stima ${fase.stima_minuti} min`}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: fase.stato === 'bloccato' ? 700 : 600, color: fase.stato === 'bloccato' ? PROD_COLORS.red : PROD_COLORS.navy }}>
                {fase.fase_ordine} · {fase.fase_nome}{fase.stato === 'bloccato' && ' · BLOCCATO'}
              </div>
              <div style={{ fontSize: 9, color: fase.stato === 'completato' ? PROD_COLORS.green : (fase.stato === 'bloccato' ? PROD_COLORS.red : PROD_COLORS.textDim), fontWeight: 600 }}>
                {fase.iniziato_at && fmt(fase.iniziato_at)}
                {fase.completato_at && ` → ${fmt(fase.completato_at).split(' ').slice(-1)[0]}`}
              </div>
            </div>
            {fase.operatore_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <div style={{ width: 18, height: 18, background: PROD_COLORS.navy, borderRadius: '50%', color: '#FFF', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {fase.operatore_iniziali}
                </div>
                <span style={{ fontSize: 11, color: PROD_COLORS.navy, fontWeight: fase.stato === 'bloccato' ? 600 : 400 }}>{fase.operatore_nome}</span>
                {fase.macchina && (
                  <span style={{ background: fase.stato === 'bloccato' ? PROD_COLORS.redBg : '#EEF8F8', color: fase.stato === 'bloccato' ? PROD_COLORS.red : PROD_COLORS.navy, padding: '1px 6px', borderRadius: 4, fontSize: 9 }}>
                    {fase.macchina}
                  </span>
                )}
              </div>
            )}
            {durMin !== null && (
              <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 10, color: PROD_COLORS.textDim, flexWrap: 'wrap' }}>
                <span>⏱ {durMin} min</span>
                {fase.stima_minuti && <span>stima {fase.stima_minuti} min</span>}
                {scostMin !== null && scostMin !== 0 && (
                  <span style={{ color: scostMin < 0 ? PROD_COLORS.green : PROD_COLORS.amberText, fontWeight: 600 }}>
                    {scostMin > 0 ? '+' : ''}{scostMin} min
                  </span>
                )}
              </div>
            )}
            {fase.stato === 'bloccato' && fase.problema_descrizione && (
              <>
                <div style={{ background: '#FFF', border: `1px solid #F09595`, borderRadius: 6, padding: '6px 8px', marginTop: 7, fontSize: 10, color: PROD_COLORS.navy, lineHeight: 1.4 }}>
                  <b style={{ color: PROD_COLORS.red }}>⚠ Problema:</b> {fase.problema_descrizione}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                  <button onClick={onRisolvi} style={{ background: PROD_COLORS.red, color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>RISOLVI</button>
                  {fase.operatore_id && (
                    <button onClick={onChiamaOp} style={{ background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>CHIAMA OP.</button>
                  )}
                  <button onClick={onSposta} style={{ background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`, padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>SPOSTA</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
