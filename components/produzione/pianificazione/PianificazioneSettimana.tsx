'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PROD_COLORS } from '../prod-constants'

interface Props { aziendaId: string }

interface PianifItem {
  tipo: 'lavorazione' | 'riparazione' | 'carico'
  id: string
  titolo: string
  sottotitolo: string | null
  data_pianificata: string | null
  ore_stimate: number | null
  operatore_id: string | null
  operatore_nome: string | null
  fase_nome: string | null
  fase_colore: string | null
  stato: string
}

export default function PianificazioneSettimana({ aziendaId }: Props) {
  const oggi = new Date()
  const lunedi = new Date(oggi)
  const dow = oggi.getDay() || 7  // domenica=0 → 7
  lunedi.setDate(oggi.getDate() - (dow - 1))
  const [inizioSett, setInizioSett] = useState(lunedi)
  const [items, setItems] = useState<PianifItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selezionato, setSelezionato] = useState<PianifItem | null>(null)

  const dataDa = inizioSett.toISOString().split('T')[0]
  const dataAFix = new Date(inizioSett); dataAFix.setDate(dataAFix.getDate() + 6)
  const dataA = dataAFix.toISOString().split('T')[0]

  const refetch = useCallback(async () => {
    setLoading(true)
    const res = await supabase.rpc('pianificazione_settimana', { p_azienda_id: aziendaId, p_data_da: dataDa, p_data_a: dataA })
    setItems(res.data || [])
    setLoading(false)
  }, [aziendaId, dataDa, dataA])

  useEffect(() => { refetch() }, [refetch])

  const cambiaSett = (delta: number) => {
    const d = new Date(inizioSett)
    d.setDate(d.getDate() + delta * 7)
    setInizioSett(d)
  }

  const giorni = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inizioSett)
    d.setDate(d.getDate() + i)
    return d
  })

  const itemsPerGiorno = (data: Date) => {
    const ds = data.toISOString().split('T')[0]
    return items.filter(it => it.data_pianificata === ds)
  }

  const handleSpostaA = async (item: PianifItem, nuovaData: string) => {
    const res = await supabase.rpc('sposta_pianificato', { p_tipo: item.tipo, p_id: item.id, p_nuova_data: nuovaData, p_nuovo_operatore_id: null })
    if (res.error) alert('Errore: ' + res.error.message)
    else { setSelezionato(null); refetch() }
  }

  const oreSettimana = items.reduce((acc, it) => acc + (it.ore_stimate || 0), 0)
  const totG = giorni.map(g => itemsPerGiorno(g).reduce((acc, it) => acc + (it.ore_stimate || 0), 0))
  const capacitaG = 8 * 5 // 5 operatori × 8h presunti
  const giornoOverload = totG.map(o => o > capacitaG)

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', paddingBottom: 60, fontFamily: '-apple-system, sans-serif' }}>
      {/* Header settimana */}
      <div style={{ background: PROD_COLORS.navy, color: '#FFF', padding: '14px 16px' }}>
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.5 }}>PIANIFICAZIONE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button onClick={() => cambiaSett(-1)} style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>‹</button>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {inizioSett.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} – {dataAFix.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
          </div>
          <button onClick={() => cambiaSett(1)} style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>›</button>
        </div>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'center' }}>
          {items.length} lavorazioni · {oreSettimana.toFixed(1)}h totali
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento...</div>
      ) : (
        <div style={{ padding: 10 }}>
          {giorni.map((g, i) => {
            const list = itemsPerGiorno(g)
            const isOggi = g.toDateString() === new Date().toDateString()
            const overload = giornoOverload[i]
            return (
              <div key={i} style={{ marginBottom: 10, background: '#FFF', borderRadius: 10, overflow: 'hidden', border: isOggi ? `2px solid ${PROD_COLORS.teal}` : 'none' }}>
                <div style={{ background: overload ? PROD_COLORS.redBg : PROD_COLORS.bgPage, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: overload ? PROD_COLORS.red : PROD_COLORS.navy }}>
                    {g.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'short' }).toUpperCase()}
                    {isOggi && <span style={{ marginLeft: 6, fontSize: 9, background: PROD_COLORS.teal, color: '#FFF', padding: '1px 6px', borderRadius: 8 }}>OGGI</span>}
                  </div>
                  <div style={{ fontSize: 10, color: overload ? PROD_COLORS.red : PROD_COLORS.textDim, fontWeight: 600 }}>
                    {totG[i].toFixed(1)}h {overload && '⚠'}
                  </div>
                </div>
                {list.length === 0 ? (
                  <div style={{ padding: '14px 12px', fontSize: 10, color: PROD_COLORS.textDim, fontStyle: 'italic' }}>Nessuna lavorazione</div>
                ) : (
                  list.map(it => (
                    <div key={it.tipo + it.id} onClick={() => setSelezionato(it)} style={{
                      padding: '8px 12px',
                      borderTop: `1px solid #EEF8F8`,
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, background: it.fase_colore || PROD_COLORS.navy, borderRadius: '50%', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: PROD_COLORS.navy }}>{it.titolo}</span>
                          {it.tipo === 'lavorazione' && <span style={{ fontSize: 8, background: PROD_COLORS.amberBg, color: PROD_COLORS.amberText, padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>INT</span>}
                          {it.tipo === 'riparazione' && <span style={{ fontSize: 8, background: PROD_COLORS.redBg, color: PROD_COLORS.red, padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>RIP</span>}
                          {it.tipo === 'carico' && <span style={{ fontSize: 8, background: PROD_COLORS.bgPage, color: PROD_COLORS.navy, padding: '1px 5px', borderRadius: 3, fontWeight: 600, border: `1px solid ${PROD_COLORS.borderSoft}` }}>COM</span>}
                        </div>
                        {it.sottotitolo && <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginTop: 2, paddingLeft: 14 }}>{it.sottotitolo}</div>}
                        {it.operatore_nome && <div style={{ fontSize: 9, color: PROD_COLORS.textDim, marginTop: 1, paddingLeft: 14 }}>→ {it.operatore_nome}</div>}
                      </div>
                      <div style={{ fontSize: 10, color: PROD_COLORS.textDim, marginLeft: 8 }}>{it.ore_stimate?.toFixed(1)}h</div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal sposta */}
      {selezionato && (
        <SheetSposta item={selezionato} giorni={giorni} onChiudi={() => setSelezionato(null)} onSposta={handleSpostaA} />
      )}
    </div>
  )
}

function SheetSposta({ item, giorni, onChiudi, onSposta }: { item: PianifItem; giorni: Date[]; onChiudi: () => void; onSposta: (i: PianifItem, d: string) => void }) {
  return (
    <div onClick={onChiudi} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF', borderRadius: '14px 14px 0 0', padding: 16, width: '100%', maxWidth: 380, maxHeight: '70vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy }}>{item.titolo}</div>
            <div style={{ fontSize: 11, color: PROD_COLORS.textDim, marginTop: 2 }}>Sposta a quale giorno?</div>
          </div>
          <button onClick={onChiudi} style={{ background: 'none', border: 'none', fontSize: 22, color: PROD_COLORS.textDim, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 5 }}>
          {giorni.map(g => {
            const ds = g.toISOString().split('T')[0]
            const attuale = item.data_pianificata === ds
            return (
              <button key={ds} onClick={() => !attuale && onSposta(item, ds)} disabled={attuale} style={{
                background: attuale ? PROD_COLORS.bgPage : '#FFF',
                color: PROD_COLORS.navy,
                border: `1px solid ${attuale ? PROD_COLORS.borderSoft : PROD_COLORS.teal}`,
                padding: 10, borderRadius: 8, fontSize: 11, fontWeight: 500,
                cursor: attuale ? 'not-allowed' : 'pointer', opacity: attuale ? 0.5 : 1, textAlign: 'left'
              }}>
                {g.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
                {attuale && <div style={{ fontSize: 9, color: PROD_COLORS.textDim, marginTop: 2 }}>attuale</div>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
