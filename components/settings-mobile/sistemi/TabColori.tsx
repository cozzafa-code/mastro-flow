// components/settings-mobile/sistemi/TabColori.tsx
// Colori associati al sistema. Add da catalogo globale, remove dall'associazione.

'use client'

import React, { useState, useMemo } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { SistemaConStats, ColoreCatalogo } from '@/lib/types/sistemi'

interface Props {
  sistema: SistemaConStats
  sis: any
}

export default function TabColori({ sistema, sis }: Props) {
  const [filtroAdd, setFiltroAdd] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const coloriAssoc = sis.coloriSistema as { id: number; colore_id: number; sistema_id: string }[]
  const coloriCat = sis.coloriCatalogo as ColoreCatalogo[]

  const coloriAssociatiPieni = useMemo(() => {
    return coloriAssoc.map((cs) => {
      const c = coloriCat.find((cc) => cc.id === cs.colore_id)
      return { assocId: cs.id, ...c }
    }).filter((x) => x.id != null) as Array<ColoreCatalogo & { assocId: number }>
  }, [coloriAssoc, coloriCat])

  const coloriDisponibili = useMemo(() => {
    const associati = new Set(coloriAssoc.map((c) => c.colore_id))
    let arr = coloriCat.filter((c) => !associati.has(c.id))
    if (filtroAdd.trim()) {
      const f = filtroAdd.toLowerCase()
      arr = arr.filter((c) => c.nome.toLowerCase().includes(f) || c.codice_ral?.toLowerCase().includes(f))
    }
    return arr
  }, [coloriAssoc, coloriCat, filtroAdd])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.muted }}>
          {coloriAssociatiPieni.length} COLORI ATTIVI · {coloriCat.length} TOTALI
        </div>
        <button
          onClick={() => setShowPicker(true)}
          style={{
            padding: '7px 12px',
            borderRadius: 9,
            border: 'none',
            background: T.acc,
            color: '#FFF',
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 0 0 ' + T.accDeep,
          }}
        >+ AGGIUNGI</button>
      </div>

      {/* GRIGLIA COLORI ASSOCIATI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: 8,
      }}>
        {coloriAssociatiPieni.map((c) => (
          <ColoreCard
            key={c.assocId}
            c={c}
            onRemove={async () => {
              if (!confirm(`Rimuovere ${c.nome} dai colori del sistema?`)) return
              const r = await sis.disattivaColore(c.assocId)
              if (!r.ok) alert(r.error)
            }}
          />
        ))}
        {coloriAssociatiPieni.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 24, textAlign: 'center',
            color: T.muted, fontSize: 12,
          }}>
            Nessun colore associato. Tap "+ AGGIUNGI" per iniziare.
          </div>
        )}
      </div>

      {/* PICKER MODAL */}
      {showPicker && (
        <div
          onClick={() => setShowPicker(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(13,31,31,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: 8,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              maxHeight: '85vh', overflowY: 'auto',
              background: T.bg, borderRadius: 16,
            }}
          >
            <div style={{
              padding: '12px 14px',
              background: T.accDeep, color: '#FFF',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTopLeftRadius: 16, borderTopRightRadius: 16,
              position: 'sticky', top: 0, zIndex: 5,
            }}>
              <div style={{ fontWeight: 700 }}>AGGIUNGI COLORE</div>
              <button onClick={() => setShowPicker(false)} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF',
                width: 28, height: 28, borderRadius: 8, fontSize: 16, cursor: 'pointer',
              }}>×</button>
            </div>

            <div style={{ padding: 12, position: 'sticky', top: 52, background: T.bg, zIndex: 4 }}>
              <input
                placeholder="Cerca nome / RAL..."
                value={filtroAdd}
                onChange={(e) => setFiltroAdd(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${T.bdr}`,
                  background: '#FFF',
                  fontSize: 14, color: T.text,
                }}
              />
            </div>

            <div style={{
              padding: '0 12px 12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 8,
            }}>
              {coloriDisponibili.slice(0, 200).map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    const r = await sis.attivaColore(sistema.id, c.id)
                    if (!r.ok) alert(r.error)
                  }}
                  style={{
                    background: '#FFF',
                    border: `1px solid ${T.bdr}`,
                    borderRadius: 10,
                    padding: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: 50,
                    borderRadius: 6,
                    background: c.hex || (c.immagine_url ? `url(${c.immagine_url}) center/cover` : T.bdr),
                    marginBottom: 6,
                    border: `1px solid ${T.bdr}`,
                  }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>
                    {c.nome}
                  </div>
                  {c.codice_ral && (
                    <div style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace', marginTop: 2 }}>
                      RAL {c.codice_ral}
                    </div>
                  )}
                </button>
              ))}
              {coloriDisponibili.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: 24, textAlign: 'center',
                  color: T.muted, fontSize: 12,
                }}>
                  Tutti i colori del catalogo sono già associati o nessun risultato.
                </div>
              )}
              {coloriDisponibili.length > 200 && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: 12, textAlign: 'center',
                  color: T.muted, fontSize: 11,
                }}>
                  Mostrati 200 risultati. Affina la ricerca per vedere altri.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ColoreCard({ c, onRemove }: {
  c: ColoreCatalogo & { assocId: number }
  onRemove: () => void
}) {
  return (
    <div style={{
      background: '#FFF',
      border: `1px solid ${T.bdr}`,
      borderRadius: 10,
      padding: 8,
      position: 'relative',
      boxShadow: T.shadow,
    }}>
      <div style={{
        width: '100%',
        height: 60,
        borderRadius: 6,
        background: c.hex || (c.immagine_url ? `url(${c.immagine_url}) center/cover` : T.bdr),
        marginBottom: 6,
        border: `1px solid ${T.bdr}`,
      }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: T.text, lineHeight: 1.2, paddingRight: 18 }}>
        {c.nome}
      </div>
      {c.codice_ral && (
        <div style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace', marginTop: 2 }}>
          RAL {c.codice_ral}
        </div>
      )}
      <button
        onClick={onRemove}
        title="Rimuovi"
        style={{
          position: 'absolute',
          top: 6, right: 6,
          width: 20, height: 20,
          borderRadius: 5,
          border: 'none',
          background: 'rgba(209,69,69,0.1)',
          color: '#D14545',
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >×</button>
    </div>
  )
}
