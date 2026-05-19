// components/settings-mobile/importa/ImportPanel.tsx
// Componente generico usato dai 3 import (profili, colori, accessori).
// Gestisce: download template -> upload file -> preview tabella -> commit.

'use client'

import React, { useState, useRef } from 'react'
import { T } from '../../home-mobile/HomeUI'
import { downloadTemplate, parseUpload, type SheetColumn } from '@/lib/excel-helpers'

interface Props {
  templateName: string
  sheetName: string
  columns: SheetColumn[]
  helpText: string
  onCommit: (rows: any[]) => Promise<{ ok: number; ko: number; errors: string[] }>
}

export default function ImportPanel({ templateName, sheetName, columns, helpText, onCommit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<any[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState<{ ok: number; ko: number; errors: string[] } | null>(null)

  async function handleFile(file: File) {
    setResult(null)
    try {
      const { rows, warnings } = await parseUpload(file, columns)
      setRows(rows)
      setWarnings(warnings)
    } catch (e) {
      alert('Errore lettura file: ' + String(e))
    }
  }

  async function commit() {
    if (rows.length === 0) return
    setCommitting(true)
    const r = await onCommit(rows)
    setResult(r)
    setCommitting(false)
    if (r.ko === 0) {
      // pulizia dopo successo totale
      setTimeout(() => {
        setRows([])
        setWarnings([])
        setResult(null)
      }, 4000)
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* HELP */}
      <div style={{
        background: '#FFF8E1', border: '1px solid #E0C870',
        borderRadius: 10, padding: 10, fontSize: 11, color: '#5C4500',
      }}>
        {helpText}
      </div>

      {/* AZIONI */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => downloadTemplate(templateName, sheetName, columns)}
          style={{
            flex: 1, padding: '11px 10px', borderRadius: 10,
            border: `1px solid ${T.bdr}`, background: '#FFF',
            color: T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >📥 SCARICA TEMPLATE</button>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            flex: 1, padding: '11px 10px', borderRadius: 10,
            border: 'none', background: T.acc, color: '#FFF',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 0 0 ' + T.accDeep,
          }}
        >📤 CARICA FILE</button>
        <input
          ref={inputRef} type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          style={{ display: 'none' }}
        />
      </div>

      {/* WARNINGS */}
      {warnings.length > 0 && (
        <div style={{
          background: '#FFEBEB', border: '1px solid #D14545',
          borderRadius: 10, padding: 10, fontSize: 11, color: '#7A2929',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{warnings.length} avvisi:</div>
          {warnings.slice(0, 6).map((w, i) => <div key={i}>• {w}</div>)}
          {warnings.length > 6 && <div>...e altri {warnings.length - 6}</div>}
        </div>
      )}

      {/* PREVIEW */}
      {rows.length > 0 && (
        <div style={{
          background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px',
            background: T.bdr,
            fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.text,
          }}>
            ANTEPRIMA: {rows.length} RIGHE PRONTE
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 320 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ background: '#F8FBFB', position: 'sticky', top: 0 }}>
                <tr>
                  {columns.map(c => (
                    <th key={c.key} style={{
                      padding: '6px 8px', textAlign: 'left',
                      fontSize: 10, color: T.muted,
                      borderBottom: `1px solid ${T.bdr}`,
                      whiteSpace: 'nowrap',
                    }}>{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.bdr}` }}>
                    {columns.map(c => (
                      <td key={c.key} style={{
                        padding: '5px 8px',
                        fontFamily: 'monospace',
                        color: T.text,
                        whiteSpace: 'nowrap',
                      }}>{r[c.key] != null ? String(r[c.key]) : '—'}</td>
                    ))}
                  </tr>
                ))}
                {rows.length > 50 && (
                  <tr><td colSpan={columns.length} style={{
                    padding: 8, textAlign: 'center', fontSize: 10, color: T.muted, fontStyle: 'italic',
                  }}>...e altre {rows.length - 50} righe (tutte verranno importate)</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 10, borderTop: `1px solid ${T.bdr}`, background: '#FFF' }}>
            <button
              onClick={commit}
              disabled={committing}
              style={{
                width: '100%', padding: 11, borderRadius: 8, border: 'none',
                background: T.acc, color: '#FFF',
                fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
                cursor: committing ? 'wait' : 'pointer',
                opacity: committing ? 0.6 : 1,
                boxShadow: '0 3px 0 0 ' + T.accDeep,
              }}
            >{committing ? 'IMPORTAZIONE IN CORSO...' : `✓ CONFERMA IMPORT (${rows.length} righe)`}</button>
          </div>
        </div>
      )}

      {/* RISULTATO */}
      {result && (
        <div style={{
          background: result.ko === 0 ? '#E8F8E8' : '#FFEBEB',
          border: `1px solid ${result.ko === 0 ? '#4CAF50' : '#D14545'}`,
          borderRadius: 10, padding: 10, fontSize: 12,
          color: result.ko === 0 ? '#2A6A2A' : '#7A2929',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {result.ko === 0 ? '✓ Importazione completata' : '⚠ Importazione parziale'}
          </div>
          <div>Righe importate: <b>{result.ok}</b> · Errori: <b>{result.ko}</b></div>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11 }}>
              {result.errors.slice(0, 5).map((e, i) => <div key={i}>• {e}</div>)}
              {result.errors.length > 5 && <div>...e altri {result.errors.length - 5}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
