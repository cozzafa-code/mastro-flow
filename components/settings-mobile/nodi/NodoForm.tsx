// components/settings-mobile/nodi/NodoForm.tsx
// Modal create/edit nodo con upload allegati e multi-select profili.

'use client'

import React, { useState, useRef } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { NodoTecnico } from '@/lib/types/nodi'
import { TIPI_NODO_LABEL } from '@/lib/types/nodi'

interface Props {
  nodo: Partial<NodoTecnico>
  n: any  // useNodi return
  onClose: () => void
  onSave: (n: Partial<NodoTecnico>) => void | Promise<void>
  onDelete?: () => void | Promise<void>
}

export default function NodoForm({ nodo, n, onClose, onSave, onDelete }: Props) {
  const [f, setF] = useState<Partial<NodoTecnico>>(nodo)
  const [upImg, setUpImg] = useState(false)
  const [upDxf, setUpDxf] = useState(false)
  const [upPdf, setUpPdf] = useState(false)
  const [profQuery, setProfQuery] = useState('')

  const set = <K extends keyof NodoTecnico>(k: K, v: NodoTecnico[K]) =>
    setF((x) => ({ ...x, [k]: v }))

  const profSelected = f.profili_coinvolti ?? []
  const profDisp = (n.profili as { codice: string; nome: string; tipo: string | null }[])
    .filter(p => !profSelected.includes(p.codice))
    .filter(p => {
      const q = profQuery.toLowerCase().trim()
      if (!q) return true
      return p.codice.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q)
    })
    .slice(0, 8)

  async function handleUpload(file: File, kind: 'immagine' | 'dxf' | 'pdf') {
    if (kind === 'immagine') setUpImg(true)
    if (kind === 'dxf') setUpDxf(true)
    if (kind === 'pdf') setUpPdf(true)
    const url = await n.uploadAllegato(file, kind)
    if (url) {
      if (kind === 'immagine') set('immagine_url', url)
      if (kind === 'dxf') set('dxf_url', url)
      if (kind === 'pdf') set('pdf_url', url)
    }
    setUpImg(false); setUpDxf(false); setUpPdf(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(13,31,31,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 8,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480,
        maxHeight: '92vh', overflowY: 'auto',
        background: T.bg, borderRadius: 16,
      }}>
        {/* HEADER */}
        <div style={{
          padding: '12px 14px', background: T.accDeep, color: '#FFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <div style={{ fontWeight: 700 }}>{nodo.id ? 'MODIFICA NODO' : 'NUOVO NODO TECNICO'}</div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF',
            width: 28, height: 28, borderRadius: 8, fontSize: 16, cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Tx label="Nome" v={f.nome} on={(x) => set('nome', x)} />
          <Sel
            label="Sistema"
            v={f.sistema_id ?? ''}
            on={(x) => set('sistema_id', x || null)}
            opts={[
              { v: '', l: '— seleziona —' },
              ...(n.sistemi as { id: string; nome: string; produttore: string }[])
                .map(s => ({ v: s.id, l: `${s.produttore} · ${s.nome}` }))
            ]}
          />
          <Sel
            label="Tipo"
            v={f.tipo ?? 'altro'}
            on={(x) => set('tipo', x)}
            opts={Object.entries(TIPI_NODO_LABEL).map(([v, l]) => ({ v, l }))}
          />
          <Tx label="Descrizione" v={f.descrizione ?? ''} on={(x) => set('descrizione', x)} />

          {/* PROFILI COINVOLTI */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>
              PROFILI COINVOLTI ({profSelected.length})
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 4,
              padding: 6, minHeight: 36,
              background: '#FFF', border: `1px solid ${T.bdr}`,
              borderRadius: 8, marginBottom: 6,
            }}>
              {profSelected.map(codice => (
                <button
                  key={codice}
                  onClick={() => set('profili_coinvolti', profSelected.filter(p => p !== codice))}
                  style={{
                    padding: '3px 8px', borderRadius: 6,
                    background: T.acc + '20', color: T.accDeep,
                    border: 'none', fontSize: 11, fontFamily: 'monospace',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >{codice} ×</button>
              ))}
              {profSelected.length === 0 && (
                <span style={{ fontSize: 11, color: T.muted, fontStyle: 'italic', padding: 4 }}>
                  Nessuno selezionato
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Cerca profilo per codice o nome..."
              value={profQuery}
              onChange={(e) => setProfQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${T.bdr}`, background: '#FFF',
                fontSize: 12, color: T.text, marginBottom: 4,
              }}
            />
            {profQuery && profDisp.length > 0 && (
              <div style={{
                background: '#FFF', border: `1px solid ${T.bdr}`,
                borderRadius: 8, maxHeight: 180, overflowY: 'auto',
              }}>
                {profDisp.map(p => (
                  <button
                    key={p.codice}
                    onClick={() => {
                      set('profili_coinvolti', [...profSelected, p.codice])
                      setProfQuery('')
                    }}
                    style={{
                      width: '100%', padding: '8px 10px',
                      border: 'none', background: 'transparent',
                      textAlign: 'left', cursor: 'pointer',
                      borderBottom: `1px solid ${T.bdr}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{p.codice}</span>
                    <span style={{ fontSize: 10, color: T.muted, marginLeft: 8, flex: 1, textAlign: 'left' }}>{p.nome}</span>
                    <span style={{ fontSize: 9, color: T.acc }}>+ aggiungi</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ALLEGATI */}
          <div style={{
            background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 10,
          }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 8 }}>ALLEGATI</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <UploadSlot label="Immagine" url={f.immagine_url} loading={upImg} onPick={(file) => handleUpload(file, 'immagine')} accept="image/*" onClear={() => set('immagine_url', null)} />
              <UploadSlot label="DXF" url={f.dxf_url} loading={upDxf} onPick={(file) => handleUpload(file, 'dxf')} accept=".dxf" onClear={() => set('dxf_url', null)} />
              <UploadSlot label="PDF" url={f.pdf_url} loading={upPdf} onPick={(file) => handleUpload(file, 'pdf')} accept="application/pdf" onClear={() => set('pdf_url', null)} />
            </div>
          </div>

          <Tx label="Note" v={f.note ?? ''} on={(x) => set('note', x)} />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={f.attivo ?? true}
              onChange={(e) => set('attivo', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Attivo
          </label>
        </div>

        <div style={{
          padding: 12, borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: 8,
          background: '#FFF', borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }}>
          {onDelete && (
            <button onClick={onDelete} style={{
              padding: '10px 14px', borderRadius: 8, border: 'none',
              background: '#FFEBEB', color: '#D14545',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>ELIMINA</button>
          )}
          <button onClick={() => onSave(f)} style={{
            flex: 1, padding: 10, borderRadius: 8, border: 'none',
            background: T.acc, color: '#FFF',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 0 0 ' + T.accDeep,
          }}>SALVA</button>
        </div>
      </div>
    </div>
  )
}

function UploadSlot({
  label, url, loading, onPick, accept, onClear,
}: {
  label: string; url: string | null | undefined; loading: boolean
  onPick: (file: File) => void; accept: string; onClear: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{
      border: `1px dashed ${url ? T.acc : T.bdr}`,
      borderRadius: 8, padding: 8, textAlign: 'center',
      background: url ? T.acc + '10' : '#FFF',
      position: 'relative',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>{label}</div>
      {url ? (
        <>
          {label === 'Immagine' ? (
            <img src={url} alt="" style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 4, marginBottom: 4 }} />
          ) : (
            <div style={{ fontSize: 22, color: T.acc, marginBottom: 2 }}>✓</div>
          )}
          <button onClick={onClear} style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            border: 'none', background: 'rgba(209,69,69,0.1)', color: '#D14545',
            cursor: 'pointer', fontWeight: 600,
          }}>rimuovi</button>
        </>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={loading} style={{
          padding: '8px 0', width: '100%', border: 'none',
          background: 'transparent', color: T.muted,
          fontSize: 11, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
        }}>{loading ? '...' : '+ carica'}</button>
      )}
      <input
        ref={ref} type="file" accept={accept}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f) }}
        style={{ display: 'none' }}
      />
    </div>
  )
}

// helpers
function Tx({ label, v, on }: { label: string; v: string | null | undefined; on: (x: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>{label}</div>
      <input
        type="text" value={v ?? ''} onChange={(e) => on(e.target.value)}
        style={{
          width: '100%', padding: '9px 10px', borderRadius: 8,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 13, color: T.text,
        }}
      />
    </label>
  )
}
function Sel({ label, v, on, opts }: { label: string; v: string; on: (x: string) => void; opts: { v: string; l: string }[] }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>{label}</div>
      <select
        value={v} onChange={(e) => on(e.target.value)}
        style={{
          width: '100%', padding: '9px 10px', borderRadius: 8,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 13, color: T.text,
        }}
      >
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}
