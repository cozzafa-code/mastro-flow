'use client'
import React, { useMemo, useState } from 'react'
import { useProduzione, type CaricoConCommessa } from '@/hooks/useProduzione'
import { PROD_COLORS, STATO_COLOR, getFaseColor } from './prod-constants'

interface Props {
  aziendaId: string
  onApriCarico: (caricoId: string) => void
  onApriConfigFasi: () => void
  onNuovoCarico: () => void
}

type FiltroChip = 'tutti' | 'urgenti' | 'bloccate' | 'ritardo'

export default function ProduzioneFlottaMobile({ aziendaId, onApriCarico, onApriConfigFasi, onNuovoCarico }: Props) {
  const { carichi, fasi, kpi, stazioni, loading, error } = useProduzione(aziendaId)
  const [filtro, setFiltro] = useState<FiltroChip>('tutti')
  const [search, setSearch] = useState('')

  const carichiFiltered = useMemo(() => {
    const oggi = new Date().toISOString().split('T')[0]
    let list = carichi
    if (filtro === 'urgenti') {
      list = list.filter(c => c.data_fine_prevista && (new Date(c.data_fine_prevista).getTime() - Date.now()) < 3 * 24 * 3600 * 1000)
    } else if (filtro === 'bloccate') {
      list = list.filter(c => c.stato === 'bloccato' || c.vani_bloccati > 0)
    } else if (filtro === 'ritardo') {
      list = list.filter(c => c.data_fine_prevista < oggi && c.stato !== 'completato')
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        c.commessa_code?.toLowerCase().includes(s) ||
        c.commessa_cliente?.toLowerCase().includes(s)
      )
    }
    return list
  }, [carichi, filtro, search])

  if (error) {
    return (
      <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>
        Errore: {error}
      </div>
    )
  }

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 80 }}>
      <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>PRODUZIONE</div>
            <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1, marginTop: 2 }}>Officina</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onApriConfigFasi} style={btnGhost}>FASI</button>
            <button onClick={onNuovoCarico} style={btnTeal}>+ CARICO</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          <KpiBox label="ATTIVE" value={kpi.attive} />
          <KpiBox label="CODA" value={kpi.in_coda} />
          <KpiBox label="RITARDO" value={kpi.in_ritardo} accent={kpi.in_ritardo > 0 ? PROD_COLORS.amber : undefined} />
          <KpiBox label="BLOCCO" value={kpi.bloccate} accent={kpi.bloccate > 0 ? '#F09595' : undefined} />
        </div>
      </div>

      <div style={{ background: '#FFF', padding: '10px 12px', borderBottom: `1px solid ${PROD_COLORS.borderSoft}` }}>
        <div style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600, letterSpacing: 0.6, marginBottom: 6 }}>CARICO STAZIONI</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {stazioni.map(s => {
            const c = getFaseColor(s.fase_colore)
            const totale = Number(s.vani_in_corso) + Number(s.vani_in_coda) + Number(s.vani_bloccati)
            const haBlocco = Number(s.vani_bloccati) > 0
            const bgFinale = haBlocco ? PROD_COLORS.red : (totale > 0 ? c.bg : '#EEF8F8')
            const txtFinale = totale > 0 ? '#FFF' : PROD_COLORS.textDim
            return (
              <div key={s.fase_id} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '100%', height: 32, background: bgFinale, border: totale === 0 ? `1px solid ${PROD_COLORS.borderSoft}` : 'none', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: txtFinale, fontSize: 12, fontWeight: 700 }}>
                  {totale}
                  {haBlocco && <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: '#FBE54B', border: `1px solid ${PROD_COLORS.navy}`, borderRadius: '50%' }} />}
                </div>
                <div style={{ fontSize: 8, color: haBlocco ? PROD_COLORS.red : PROD_COLORS.navy, marginTop: 3, fontWeight: haBlocco ? 700 : 600 }}>
                  {s.fase_nome.substring(0, 6).toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#FFF', padding: '8px 12px', borderBottom: `1px solid ${PROD_COLORS.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: PROD_COLORS.bgPage, padding: '7px 10px', borderRadius: 6 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="cerca commessa, cliente..."
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 11, color: PROD_COLORS.navy }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, overflowX: 'auto' }}>
          <ChipFiltro attivo={filtro === 'tutti'} onClick={() => setFiltro('tutti')} label="TUTTI" />
          <ChipFiltro attivo={filtro === 'urgenti'} onClick={() => setFiltro('urgenti')} label={`URGENTI ${kpi.attive > 0 ? Math.min(kpi.attive, 4) : 0}`} />
          <ChipFiltro attivo={filtro === 'bloccate'} onClick={() => setFiltro('bloccate')} label={`BLOCCATE ${kpi.bloccate}`} colore="red" />
          <ChipFiltro attivo={filtro === 'ritardo'} onClick={() => setFiltro('ritardo')} label={`RITARDO ${kpi.in_ritardo}`} colore="amber" />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento...</div>
      ) : (
        <div style={{ padding: '8px 10px' }}>
          {carichiFiltered.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12, background: '#FFF', borderRadius: 10, border: `1px dashed ${PROD_COLORS.borderSoft}` }}>
              Nessuna commessa {filtro !== 'tutti' ? `in stato "${filtro}"` : 'in produzione'}
            </div>
          ) : (
            carichiFiltered.map(c => (
              <CardCarico key={c.id} carico={c} fasi={fasi} onClick={() => onApriCarico(c.id)} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function KpiBox({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{
      background: accent ? `${accent}26` : 'rgba(255,255,255,0.06)',
      border: accent ? `1px solid ${accent}66` : 'none',
      borderRadius: 6, padding: 8
    }}>
      <div style={{ fontSize: 9, color: accent || PROD_COLORS.tealLight, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: accent || '#FFF', lineHeight: 1, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function ChipFiltro({ attivo, onClick, label, colore }: { attivo: boolean; onClick: () => void; label: string; colore?: 'red' | 'amber' }) {
  const colorMap = {
    red: { text: PROD_COLORS.red, border: '#F09595' },
    amber: { text: PROD_COLORS.amberText, border: PROD_COLORS.amber },
  }
  const c = colore ? colorMap[colore] : null
  return (
    <button onClick={onClick} style={{
      background: attivo ? PROD_COLORS.navy : '#FFF',
      color: attivo ? '#FFF' : (c?.text || PROD_COLORS.navy),
      border: attivo ? 'none' : `1px solid ${c?.border || PROD_COLORS.borderSoft}`,
      padding: '3px 10px',
      borderRadius: 12, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer'
    }}>{label}</button>
  )
}

function CardCarico({ carico, fasi, onClick }: { carico: CaricoConCommessa; fasi: any[]; onClick: () => void }) {
  const oggi = new Date().toISOString().split('T')[0]
  const inRitardo = carico.data_fine_prevista < oggi && carico.stato !== 'completato'
  const giorniRimasti = carico.commessa_consegna
    ? Math.ceil((new Date(carico.commessa_consegna).getTime() - Date.now()) / (24 * 3600 * 1000))
    : null

  let bordoColore = PROD_COLORS.teal
  if (carico.stato === 'bloccato' || carico.vani_bloccati > 0) bordoColore = PROD_COLORS.red
  else if (inRitardo) bordoColore = PROD_COLORS.amber
  else if (carico.stato === 'pianificato') bordoColore = '#B4B2A9'
  else if (carico.stato === 'completato') bordoColore = PROD_COLORS.green

  const statoStyle = STATO_COLOR[carico.stato] || STATO_COLOR.pianificato
  const totVani = carico.vani_totali || 0
  const fattiPerc = totVani > 0 ? Math.round((carico.vani_completati / totVani) * 100) : 0

  return (
    <div onClick={onClick} style={{
      background: '#FFF', borderLeft: `4px solid ${bordoColore}`, borderRadius: '0 8px 8px 0',
      padding: '10px 12px', marginBottom: 5, cursor: 'pointer'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: PROD_COLORS.navy }}>{carico.commessa_code}</span>
            <span style={{ background: statoStyle.bg, color: statoStyle.text, padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>
              {carico.stato.toUpperCase().substring(0, 6)}
            </span>
            {inRitardo && giorniRimasti !== null && (
              <span style={{ background: PROD_COLORS.redBg, color: PROD_COLORS.red, padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 600 }}>
                {giorniRimasti}gg
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, marginTop: 1 }}>
            {carico.commessa_cliente} · {totVani} vani
          </div>
        </div>
        {carico.commessa_consegna && (
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
            <div style={{ fontSize: 10, color: inRitardo ? PROD_COLORS.red : PROD_COLORS.navy, fontWeight: 700 }}>
              {new Date(carico.commessa_consegna).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
            </div>
            <div style={{ fontSize: 9, color: PROD_COLORS.textDim }}>
              {giorniRimasti !== null ? (giorniRimasti < 0 ? 'scaduta' : `-${giorniRimasti}gg`) : ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '8px 0' }}>
        {(fasi || []).slice(0, 6).map((f, i) => {
          const stepDone = (carico.vani_completati / Math.max(totVani, 1)) > (i / 6)
          const stepActive = (carico.vani_completati / Math.max(totVani, 1)) > ((i - 1) / 6)
          const fc = getFaseColor(f.colore)
          let segBg = '#EEF8F8'
          if (stepDone) segBg = PROD_COLORS.green
          else if (stepActive) segBg = fc.bg
          return <div key={f.id} style={{ height: 6, flex: 1, background: segBg, borderRadius: 1 }} />
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
        <span style={{ color: PROD_COLORS.textDim }}>
          {carico.vani_bloccati > 0 ? (
            <span style={{ color: PROD_COLORS.red, fontWeight: 600 }}>⚠ {carico.vani_bloccati} bloccati</span>
          ) : (
            `${carico.vani_completati}/${totVani} vani`
          )}
        </span>
        <span style={{ color: fattiPerc > 0 ? PROD_COLORS.green : PROD_COLORS.textDim, fontWeight: 600 }}>{fattiPerc}%</span>
      </div>
    </div>
  )
}

const btnGhost: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', color: '#FFF',
  border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px',
  borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer'
}

const btnTeal: React.CSSProperties = {
  background: PROD_COLORS.teal, color: '#FFF',
  border: 'none', padding: '6px 10px',
  borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer'
}
