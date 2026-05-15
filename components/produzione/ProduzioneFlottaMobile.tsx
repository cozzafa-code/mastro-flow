'use client'
import React, { useMemo, useState, useRef } from 'react'
import { useProduzioneFlotta } from '@/hooks/useProduzioneFlotta'
import { PROD_COLORS } from './prod-constants'
import { HeaderFlotta, CaricoStazioniBar, SearchERigaFiltri, IntestazioneLista, CardCarico } from './flotta-parts'
import { ModalNuovoCarico, SheetFiltri } from './flotta-modals'

interface Props {
  aziendaId: string
  onApriCarico: (caricoId: string) => void
  onApriConfigFasi: () => void
}

const MAX_VISIBLE = 5

export default function ProduzioneFlottaMobile({ aziendaId, onApriCarico, onApriConfigFasi }: Props) {
  const { carichi, fasi, kpi, stazioni, loading, error, refetch } = useProduzioneFlotta(aziendaId)
  const [filtroBase, setFiltroBase] = useState<string>('tutti')
  const [sistemiSel, setSistemiSel] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [ordine, setOrdine] = useState<'priorita' | 'consegna'>('priorita')
  const [mostraTutte, setMostraTutte] = useState(false)
  const [showModalCarico, setShowModalCarico] = useState(false)
  const [showSheetFiltri, setShowSheetFiltri] = useState(false)

  // Pull-to-refresh state
  const touchStart = useRef(0)
  const [pullDist, setPullDist] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStart.current = e.touches[0].clientY
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === 0) return
    const dist = e.touches[0].clientY - touchStart.current
    if (dist > 0 && window.scrollY === 0) setPullDist(Math.min(dist, 80))
  }
  const handleTouchEnd = async () => {
    if (pullDist > 60) {
      setRefreshing(true)
      await refetch()
      setRefreshing(false)
    }
    setPullDist(0)
    touchStart.current = 0
  }

  const sistemiDisponibili = useMemo(() => {
    const tutti = new Set<string>()
    carichi.forEach(c => c.sistemi_costruzione.forEach(s => tutti.add(s)))
    return Array.from(tutti).sort()
  }, [carichi])

  const carichiFiltered = useMemo(() => {
    const oggi = new Date().toISOString().split('T')[0]
    const inizioSettimana = new Date(); inizioSettimana.setDate(inizioSettimana.getDate() - inizioSettimana.getDay())
    const fineSettimana = new Date(inizioSettimana); fineSettimana.setDate(fineSettimana.getDate() + 7)
    let list = [...carichi]
    if (filtroBase === 'urgenti') list = list.filter(c => c.commessa_consegna && (new Date(c.commessa_consegna).getTime() - Date.now()) < 3 * 86400000)
    else if (filtroBase === 'bloccate') list = list.filter(c => c.stato === 'bloccato' || c.vani_bloccati > 0 || c.fase_ferma_per_blocco)
    else if (filtroBase === 'ritardo') list = list.filter(c => c.data_fine_prevista < oggi && c.stato !== 'completato')
    else if (filtroBase === 'settimana') list = list.filter(c => {
      if (!c.commessa_consegna) return false
      const d = new Date(c.commessa_consegna)
      return d >= inizioSettimana && d < fineSettimana
    })
    if (sistemiSel.length > 0) {
      list = list.filter(c => c.sistemi_costruzione.some(s => sistemiSel.includes(s)))
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(c => c.commessa_code?.toLowerCase().includes(s) || c.commessa_cliente?.toLowerCase().includes(s))
    }
    if (ordine === 'consegna') {
      list.sort((a, b) => (a.commessa_consegna || '9999').localeCompare(b.commessa_consegna || '9999'))
    } else {
      list.sort((a, b) => (b.priorita || 0) - (a.priorita || 0))
    }
    return list
  }, [carichi, filtroBase, sistemiSel, search, ordine])

  const carichiVisibili = mostraTutte ? carichiFiltered : carichiFiltered.slice(0, MAX_VISIBLE)
  const altreCarichi = carichiFiltered.length - carichiVisibili.length

  if (error) return <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>Errore: {error}</div>

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 80 }}>

      {(pullDist > 0 || refreshing) && (
        <div style={{ height: pullDist, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PROD_COLORS.bgPage, transition: refreshing ? 'height 0.2s' : 'none' }}>
          <div style={{ fontSize: 11, color: PROD_COLORS.teal, fontWeight: 600 }}>
            {refreshing ? '⟳ aggiornamento...' : pullDist > 60 ? '↓ rilascia per aggiornare' : '↓ tira per aggiornare'}
          </div>
        </div>
      )}

      <HeaderFlotta kpi={kpi} onApriConfigFasi={onApriConfigFasi} onNuovoCarico={() => setShowModalCarico(true)} />
      <CaricoStazioniBar stazioni={stazioni} />
      <SearchERigaFiltri 
        search={search} setSearch={setSearch}
        filtroBase={filtroBase} setFiltroBase={setFiltroBase}
        sistemiSel={sistemiSel} 
        toggleSistema={(s: string) => setSistemiSel(sistemiSel.includes(s) ? sistemiSel.filter(x => x !== s) : [...sistemiSel, s])}
        sistemiDisponibili={sistemiDisponibili}
        kpi={kpi}
        onApriFiltri={() => setShowSheetFiltri(true)}
      />

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento...</div>
      ) : (
        <div style={{ padding: '8px 10px' }}>
          <IntestazioneLista ordine={ordine} toggleOrdine={() => setOrdine(ordine === 'priorita' ? 'consegna' : 'priorita')} />
          {carichiVisibili.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12, background: '#FFF', borderRadius: 10, border: `1px dashed ${PROD_COLORS.borderSoft}` }}>
              Nessuna commessa {filtroBase !== 'tutti' ? `con filtro "${filtroBase}"` : 'in produzione'}
            </div>
          ) : (
            <>
              {carichiVisibili.map(c => (
                <CardCarico key={c.id} carico={c} fasi={fasi} onClick={() => onApriCarico(c.id)} />
              ))}
              {altreCarichi > 0 && (
                <div onClick={() => setMostraTutte(true)} style={{ background: '#FAFCFC', border: `1px dashed ${PROD_COLORS.borderSoft}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center', marginTop: 6, cursor: 'pointer' }}>
                  <span style={{ fontSize: 11, color: PROD_COLORS.textDim }}>altre {altreCarichi} commesse · vedi tutte</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showModalCarico && (
        <ModalNuovoCarico 
          aziendaId={aziendaId}
          onAnnulla={() => setShowModalCarico(false)}
          onCreato={(caricoId) => { setShowModalCarico(false); refetch(); onApriCarico(caricoId) }}
        />
      )}
      {showSheetFiltri && (
        <SheetFiltri
          filtroBase={filtroBase} setFiltroBase={setFiltroBase}
          sistemiSel={sistemiSel} setSistemiSel={setSistemiSel}
          sistemiDisponibili={sistemiDisponibili}
          onChiudi={() => setShowSheetFiltri(false)}
        />
      )}
    </div>
  )
}
