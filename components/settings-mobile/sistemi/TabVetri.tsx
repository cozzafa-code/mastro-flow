// components/settings-mobile/sistemi/TabVetri.tsx
// Vetri compatibili al sistema (gestione semplice add/remove + range spessori).

'use client'

import React, { useState } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { SistemaConStats, VetroSistema } from '@/lib/types/sistemi'

interface Props {
  sistema: SistemaConStats
  sis: any
}

export default function TabVetri({ sistema, sis }: Props) {
  const [adding, setAdding] = useState<Partial<VetroSistema> | null>(null)
  const vetri: VetroSistema[] = sis.vetri

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.muted }}>
          {vetri.length} VETRI COMPATIBILI
        </div>
        <button
          onClick={() => setAdding({ sistema_id: sistema.id })}
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
        >+ NUOVO</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {vetri.map((v) => (
          <div
            key={v.id}
            style={{
              background: '#FFF',
              border: `1px solid ${T.bdr}`,
              borderRadius: 10,
              padding: '10px 12px',
              boxShadow: T.shadow,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{
              width: 36, height: 36,
              borderRadius: 8,
              background: T.numBlue + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🪟</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                {v.vetro_id ?? '(generico)'}
              </div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: 'monospace', marginTop: 2 }}>
                {v.spessore_min != null ? `${v.spessore_min}` : '–'}
                {' ÷ '}
                {v.spessore_max != null ? `${v.spessore_max}` : '–'}
                {' mm'}
                {v.note && ` · ${v.note}`}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!confirm('Rimuovere questo vetro?')) return
                const r = await sis.disattivaVetro(v.id)
                if (!r.ok) alert(r.error)
              }}
              style={{
                width: 28, height: 28,
                borderRadius: 7,
                border: 'none',
                background: 'rgba(209,69,69,0.1)',
                color: '#D14545',
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
              }}
            >×</button>
          </div>
        ))}
        {vetri.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
            Nessun vetro associato. Tap "+ NUOVO" per aggiungere.
          </div>
        )}
      </div>

      {/* MODAL ADD */}
      {adding && (
        <VetroForm
          v={adding}
          onClose={() => setAdding(null)}
          onSave={async (v) => {
            const r = await sis.attivaVetro(v)
            if (r.ok) setAdding(null)
            else alert(r.error)
          }}
        />
      )}
    </div>
  )
}

function VetroForm({ v, onClose, onSave }: {
  v: Partial<VetroSistema>
  onClose: () => void
  onSave: (v: Partial<VetroSistema>) => void | Promise<void>
}) {
  const [f, setF] = useState<Partial<VetroSistema>>(v)
  const set = <K extends keyof VetroSistema>(k: K, val: VetroSistema[K]) =>
    setF((x) => ({ ...x, [k]: val }))

  return (
    <div
      onClick={onClose}
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
          background: T.bg, borderRadius: 16,
        }}
      >
        <div style={{
          padding: '12px 14px',
          background: T.accDeep, color: '#FFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
        }}>
          <div style={{ fontWeight: 700 }}>NUOVO VETRO COMPATIBILE</div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF',
            width: 28, height: 28, borderRadius: 8, fontSize: 16, cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Tx label="Codice/ID vetro" v={f.vetro_id ?? ''} on={(x) => set('vetro_id', x)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Nm label="Spessore min (mm)" v={f.spessore_min} on={(x) => set('spessore_min', x ?? undefined)} />
            <Nm label="Spessore max (mm)" v={f.spessore_max} on={(x) => set('spessore_max', x ?? undefined)} />
          </div>
          <Tx label="Note" v={f.note ?? ''} on={(x) => set('note', x)} />
        </div>

        <div style={{
          padding: 12,
          borderTop: `1px solid ${T.bdr}`,
          background: '#FFF',
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }}>
          <button onClick={() => onSave(f)} style={{
            width: '100%', padding: 10, borderRadius: 8, border: 'none',
            background: T.acc, color: '#FFF',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 0 0 ' + T.accDeep,
          }}>SALVA</button>
        </div>
      </div>
    </div>
  )
}

function Tx({ label, v, on }: { label: string; v: string; on: (x: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>{label}</div>
      <input
        type="text" value={v}
        onChange={(e) => on(e.target.value)}
        style={{
          width: '100%', padding: '9px 10px', borderRadius: 8,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 13, color: T.text,
        }}
      />
    </label>
  )
}
function Nm({ label, v, on }: { label: string; v: number | null | undefined; on: (x: number | null) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>{label}</div>
      <input
        type="number" inputMode="decimal" step="0.1"
        value={v ?? ''}
        onChange={(e) => on(e.target.value === '' ? null : Number(e.target.value))}
        style={{
          width: '100%', padding: '9px 10px', borderRadius: 8,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 13, fontFamily: 'monospace', color: T.text,
        }}
      />
    </label>
  )
}
