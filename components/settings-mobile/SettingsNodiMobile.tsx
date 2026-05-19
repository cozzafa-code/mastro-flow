// components/settings-mobile/SettingsNodiMobile.tsx
// Modulo NODI TECNICI - lista raggruppata per sistema canonico (catalogo_sistemi).

'use client'

import React, { useState, useMemo } from 'react'
import { T } from '../home-mobile/HomeUI'
import { useNodi } from '@/hooks/useNodi'
import type { NodoTecnico } from '@/lib/types/nodi'
import { TIPI_NODO_LABEL } from '@/lib/types/nodi'
import NodoForm from './nodi/NodoForm'

interface Props {
  azienda_id: string
  onBack: () => void
}

export default function SettingsNodiMobile({ azienda_id, onBack }: Props) {
  const n = useNodi(azienda_id)
  const [filtro, setFiltro] = useState('')
  const [editing, setEditing] = useState<Partial<NodoTecnico> | null>(null)

  const filtrati = useMemo(() => {
    const f = filtro.toLowerCase().trim()
    if (!f) return n.nodi
    return n.nodi.filter((x) =>
      x.nome.toLowerCase().includes(f) ||
      (x.tipo ?? '').toLowerCase().includes(f) ||
      (x.descrizione ?? '').toLowerCase().includes(f) ||
      (x.profili_coinvolti ?? []).some(p => p.toLowerCase().includes(f))
    )
  }, [n.nodi, filtro])

  const grouped = useMemo(() => {
    const m = new Map<string, NodoTecnico[]>()
    for (const nodo of filtrati) {
      const sis = n.sistemi.find(s => s.id === nodo.sistema_id)
      const k = sis ? `${sis.produttore} · ${sis.nome}` : '(senza sistema)'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(nodo)
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtrati, n.sistemi])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
        padding: '14px 16px 22px',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        color: '#FFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.18)', border: 'none',
            width: 36, height: 36, borderRadius: 10,
            color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          }}>‹</button>
          <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.3, opacity: 0.85 }}>filwoX</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Nodi tecnici</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
          {n.nodi.length} nodi · {n.sistemi.length} sistemi
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ padding: 12, display: 'flex', gap: 8 }}>
        <input
          placeholder="Cerca nome / profilo / tipo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            border: `1px solid ${T.bdr}`, background: '#FFF',
            fontSize: 14, color: T.text,
          }}
        />
        <button
          onClick={() => setEditing({
            nome: '',
            tipo: 'laterale',
            descrizione: '',
            profili_coinvolti: [],
            attivo: true,
          })}
          style={{
            padding: '10px 14px', borderRadius: 10, border: 'none',
            background: T.acc, color: '#FFF',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 0 0 ' + T.accDeep,
            whiteSpace: 'nowrap',
          }}
        >+ NUOVO</button>
      </div>

      {n.loading && (
        <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
          Caricamento...
        </div>
      )}

      {/* LISTA */}
      <div style={{ padding: '0 12px' }}>
        {grouped.map(([gruppo, items]) => (
          <div key={gruppo} style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 4px 6px',
              fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
              color: T.muted,
            }}>
              {gruppo.toUpperCase()}
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 6,
                background: T.bdr, color: T.text,
              }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map((nodo) => (
                <CardNodo key={nodo.id} nodo={nodo} onTap={() => setEditing(nodo)} />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && !n.loading && (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
            Nessun nodo. Tap "+ NUOVO" per iniziare.
          </div>
        )}
      </div>

      {/* MODAL */}
      {editing && (
        <NodoForm
          nodo={editing}
          n={n}
          onClose={() => setEditing(null)}
          onSave={async (x) => {
            const r = await n.save(x)
            if (r.ok) setEditing(null)
            else alert(r.error)
          }}
          onDelete={editing.id ? async () => {
            if (!confirm('Eliminare questo nodo?')) return
            const r = await n.remove(editing.id!)
            if (r.ok) setEditing(null)
            else alert(r.error)
          } : undefined}
        />
      )}
    </div>
  )
}

function CardNodo({ nodo, onTap }: { nodo: NodoTecnico; onTap: () => void }) {
  const tipoLabel = nodo.tipo
    ? (TIPI_NODO_LABEL[nodo.tipo as keyof typeof TIPI_NODO_LABEL] ?? nodo.tipo)
    : '—'
  return (
    <div
      onClick={onTap}
      style={{
        background: '#FFF',
        border: `1px solid ${T.bdr}`,
        borderRadius: 12,
        padding: '10px 12px',
        cursor: 'pointer',
        boxShadow: T.shadow,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      {nodo.immagine_url ? (
        <img
          src={nodo.immagine_url}
          alt=""
          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: `1px solid ${T.bdr}` }}
        />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: 8,
          background: T.acc + '15', color: T.acc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, flexShrink: 0,
        }}>⊕</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{nodo.nome}</div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            padding: '1px 6px', borderRadius: 4,
            background: T.acc + '20', color: T.accDeep,
            textTransform: 'uppercase', marginRight: 6,
          }}>{tipoLabel}</span>
          {(nodo.profili_coinvolti?.length ?? 0) > 0 && (
            <span style={{ fontFamily: 'monospace' }}>
              {nodo.profili_coinvolti!.slice(0, 3).join(' · ')}
              {nodo.profili_coinvolti!.length > 3 && ` +${nodo.profili_coinvolti!.length - 3}`}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {nodo.dxf_url && <Pill bg="#3B82F6">DXF</Pill>}
        {nodo.pdf_url && <Pill bg="#D14545">PDF</Pill>}
      </div>
      <div style={{ color: T.acc, fontSize: 18, fontWeight: 700 }}>›</div>
    </div>
  )
}
function Pill({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
      padding: '2px 5px', borderRadius: 4,
      background: bg, color: '#FFF',
    }}>{children}</span>
  )
}
