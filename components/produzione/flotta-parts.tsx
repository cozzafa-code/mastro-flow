import React from 'react'
import { PROD_COLORS, STATO_COLOR, getFaseColor } from './prod-constants'
import type { CaricoArricchito, StatoStazione, KPIProduzione } from '@/hooks/useProduzioneFlotta'

export function HeaderFlotta({ kpi, onApriConfigFasi, onNuovoCarico }: { kpi: KPIProduzione; onApriConfigFasi: () => void; onNuovoCarico: () => void }) {
  return (
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
  )
}

function KpiBox({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ background: accent ? `${accent}26` : 'rgba(255,255,255,0.06)', border: accent ? `1px solid ${accent}66` : 'none', borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 9, color: accent || PROD_COLORS.tealLight, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: accent || '#FFF', lineHeight: 1, marginTop: 2 }}>{value}</div>
    </div>
  )
}

export function CaricoStazioniBar({ stazioni }: { stazioni: StatoStazione[] }) {
  return (
    <div style={{ background: '#FFF', padding: '10px 12px', borderBottom: `1px solid ${PROD_COLORS.borderSoft}` }}>
      <div style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600, letterSpacing: 0.6, marginBottom: 6 }}>CARICO STAZIONI</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {stazioni.map(s => {
          const inCorso = Number(s.vani_in_corso)
          const inCoda = Number(s.vani_in_coda)
          const blk = Number(s.vani_bloccati)
          const tot = inCorso + inCoda + blk
          const ferma = blk > 0
          const c = getFaseColor(s.fase_colore)
          let bg = '#EEF8F8'
          let txt: string = PROD_COLORS.textDim
          let border: string = `1px solid ${PROD_COLORS.borderSoft}`
          if (ferma) { bg = PROD_COLORS.red; txt = '#FFF'; border = 'none' }
          else if (inCorso > 0) { bg = c.bg; txt = '#FFF'; border = 'none' }
          else if (tot > 0) { bg = PROD_COLORS.amber; txt = '#FFF'; border = 'none' }
          return (
            <div key={s.fase_id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '100%', height: 32, background: bg, border, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: txt, fontSize: 12, fontWeight: 700 }}>
                {tot}
                {ferma && <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: '#FBE54B', border: `1px solid ${PROD_COLORS.navy}`, borderRadius: '50%' }} />}
              </div>
              <div style={{ fontSize: 8, color: ferma ? PROD_COLORS.red : PROD_COLORS.navy, marginTop: 3, fontWeight: ferma ? 700 : 600 }}>
                {s.fase_nome.substring(0, 6).toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SearchERigaFiltri({ search, setSearch, filtroBase, setFiltroBase, sistemiSel, toggleSistema, sistemiDisponibili, kpi, onApriFiltri }: any) {
  return (
    <div style={{ background: '#FFF', padding: '8px 12px', borderBottom: `1px solid ${PROD_COLORS.borderSoft}` }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: PROD_COLORS.bgPage, padding: '7px 10px', borderRadius: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PROD_COLORS.textDim} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="cerca commessa, cliente..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 11, color: PROD_COLORS.navy }} />
        </div>
        <button onClick={onApriFiltri} style={{ background: '#FFF', border: `1px solid ${PROD_COLORS.borderSoft}`, padding: '7px 10px', borderRadius: 6, fontSize: 11, color: PROD_COLORS.navy, fontWeight: 600, cursor: 'pointer' }}>FILTRI</button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Chip attivo={filtroBase === 'tutti'} onClick={() => setFiltroBase('tutti')} label="TUTTI" />
        <Chip attivo={filtroBase === 'urgenti'} onClick={() => setFiltroBase('urgenti')} label="URGENTI" />
        <Chip attivo={filtroBase === 'bloccate'} onClick={() => setFiltroBase('bloccate')} label={`BLOCCATE ${kpi.bloccate}`} colore="red" />
        <Chip attivo={filtroBase === 'ritardo'} onClick={() => setFiltroBase('ritardo')} label={`RITARDO ${kpi.in_ritardo}`} colore="amber" />
        <Chip attivo={filtroBase === 'settimana'} onClick={() => setFiltroBase('settimana')} label="Settimana" />
        {sistemiDisponibili.map((sis: string) => (
          <Chip key={sis} attivo={sistemiSel.includes(sis)} onClick={() => toggleSistema(sis)} label={sis} />
        ))}
      </div>
    </div>
  )
}

function Chip({ attivo, onClick, label, colore }: any) {
  const cmap: Record<string, any> = {
    red: { text: PROD_COLORS.red, border: '#F09595' },
    amber: { text: PROD_COLORS.amberText, border: PROD_COLORS.amber },
  }
  const c = colore ? cmap[colore] : null
  return (
    <button onClick={onClick} style={{
      background: attivo ? PROD_COLORS.navy : '#FFF',
      color: attivo ? '#FFF' : (c?.text || PROD_COLORS.navy),
      border: attivo ? 'none' : `1px solid ${c?.border || PROD_COLORS.borderSoft}`,
      padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer'
    }}>{label}</button>
  )
}

export function IntestazioneLista({ ordine, toggleOrdine }: { ordine: 'priorita' | 'consegna'; toggleOrdine: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 6px' }}>
      <div style={{ fontSize: 10, color: PROD_COLORS.textDim, letterSpacing: 0.4 }}>COMMESSA · STATO FASE · CONSEGNA</div>
      <div onClick={toggleOrdine} style={{ fontSize: 10, color: PROD_COLORS.navy, fontWeight: 600, cursor: 'pointer' }}>
        ORDINA: {ordine === 'priorita' ? 'priorità' : 'consegna'} ▾
      </div>
    </div>
  )
}

export function CardCarico({ carico, fasi, onClick }: { carico: CaricoArricchito; fasi: any[]; onClick: () => void }) {
  const oggi = new Date().toISOString().split('T')[0]
  const inRitardo = carico.data_fine_prevista < oggi && carico.stato !== 'completato'
  const giorniRimasti = carico.commessa_consegna ? Math.ceil((new Date(carico.commessa_consegna).getTime() - Date.now()) / 86400000) : null
  const haBlocco = carico.vani_bloccati > 0 || carico.stato === 'bloccato' || carico.fase_ferma_per_blocco

  let bordoColore = PROD_COLORS.teal
  if (haBlocco) bordoColore = PROD_COLORS.red
  else if (inRitardo) bordoColore = PROD_COLORS.amber
  else if (carico.stato === 'pianificato') bordoColore = '#B4B2A9'
  else if (carico.stato === 'completato') bordoColore = PROD_COLORS.green

  const statoStyle = STATO_COLOR[carico.stato] || STATO_COLOR.pianificato
  const totV = carico.vani_totali || 0
  const perc = totV > 0 ? Math.round((carico.vani_completati / totV) * 100) : 0
  const fasiList = (fasi || []).slice(0, 6)
  const progress = totV > 0 ? carico.vani_completati / totV : 0
  const ordineCorr = carico.fase_corrente_ordine || 0

  const segmenti = fasiList.map((f: any, i: number) => {
    const sogliaSup = (i + 1) / fasiList.length
    const sogliaInf = i / fasiList.length
    const fc = getFaseColor(f.colore)
    if (progress >= sogliaSup) return PROD_COLORS.green
    if (haBlocco && f.ordine === ordineCorr) return PROD_COLORS.red
    if (progress > sogliaInf || f.ordine === ordineCorr) return fc.bg
    return '#EEF8F8'
  })

  let infoSx: string
  let infoColor: string = PROD_COLORS.textDim
  let infoBold = false
  if (haBlocco && carico.fase_corrente_nome) {
    infoSx = `⚠ ${carico.fase_corrente_nome} stazione ferma`
    infoColor = PROD_COLORS.red; infoBold = true
  } else if (carico.stato === 'pianificato') {
    infoSx = 'in coda · da avviare'
  } else if (carico.operatori_attivi_count > 0) {
    const sq = carico.squadre[0] || ''
    const fc = carico.fase_corrente_nome ? `in ${carico.fase_corrente_nome.toLowerCase()}` : 'in lavoro'
    infoSx = `${carico.operatori_attivi_count} op${sq ? ' · ' + sq : ''} · ${fc}`
  } else {
    infoSx = carico.fase_corrente_nome ? `in ${carico.fase_corrente_nome.toLowerCase()}` : 'pronto'
  }

  return (
    <div onClick={onClick} style={{ background: '#FFF', borderLeft: `4px solid ${bordoColore}`, borderRadius: '0 8px 8px 0', padding: '10px 12px', marginBottom: 5, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: PROD_COLORS.navy }}>{carico.commessa_code}</span>
            <span style={{ background: statoStyle.bg, color: statoStyle.text, padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>
              {haBlocco ? 'BLOCCO' : carico.stato.toUpperCase().substring(0, 6)}
            </span>
            {inRitardo && giorniRimasti !== null && (
              <span style={{ background: PROD_COLORS.redBg, color: PROD_COLORS.red, padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 600 }}>{giorniRimasti}gg</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: PROD_COLORS.navy, marginTop: 1 }}>
            {carico.commessa_cliente || '—'} · {totV} vani
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {segmenti.map((bg, i) => <div key={i} style={{ height: 6, flex: 1, background: bg, borderRadius: 1 }} />)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
        <span style={{ color: infoColor, fontWeight: infoBold ? 600 : 400 }}>{infoSx}</span>
        <span style={{ color: perc > 0 ? PROD_COLORS.green : PROD_COLORS.textDim, fontWeight: 600 }}>{carico.vani_completati}/{totV} · {perc}%</span>
      </div>
    </div>
  )
}

const btnGhost: React.CSSProperties = { background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const btnTeal: React.CSSProperties = { background: PROD_COLORS.teal, color: '#FFF', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }
