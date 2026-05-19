// components/nodi/NodiCatalogModal.tsx
// Modal full-screen mobile per scelta profili dal catalogo (profili + vetri + pannelli).

'use client'

import React, { useState, useMemo } from 'react'

const DS = {
  teal: '#28A0A0', dark: '#156060', ink: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF',
  muted: '#888',
}
const M = "'JetBrains Mono', monospace"

interface Profilo {
  id: string
  codice: string
  fornitore?: string
  serie?: string
  tipo?: string
  sezione_svg?: string
  _source?: string
}

interface Props {
  profili: Profilo[]
  onSelect: (p: Profilo) => void
  onClose: () => void
}

export default function NodiCatalogModal({ profili, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [filtroFornitore, setFiltroFornitore] = useState('')
  const [filtroSerie, setFiltroSerie] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const fornitori = useMemo(() =>
    [...new Set(profili.map(p => p.fornitore).filter(Boolean))].sort()
  , [profili]) as string[]

  const serie = useMemo(() =>
    [...new Set(profili.filter(p => !filtroFornitore || p.fornitore === filtroFornitore).map(p => p.serie).filter(Boolean))].sort()
  , [profili, filtroFornitore]) as string[]

  const tipi = useMemo(() =>
    [...new Set(profili.map(p => p.tipo).filter(Boolean))].sort()
  , [profili]) as string[]

  const filtered = useMemo(() => {
    return profili.filter(p => {
      if (filtroFornitore && p.fornitore !== filtroFornitore) return false
      if (filtroSerie && p.serie !== filtroSerie) return false
      if (filtroTipo && p.tipo !== filtroTipo) return false
      if (search) {
        const s = search.toLowerCase()
        return (p.codice || '').toLowerCase().includes(s) ||
               (p.fornitore || '').toLowerCase().includes(s) ||
               (p.serie || '').toLowerCase().includes(s)
      }
      return true
    })
  }, [profili, filtroFornitore, filtroSerie, filtroTipo, search])

  const grouped = useMemo(() => {
    const m: Record<string, Profilo[]> = {}
    for (const p of filtered) {
      const key = `${p.fornitore || '?'} · ${p.serie || '?'}`
      if (!m[key]) m[key] = []
      m[key].push(p)
    }
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: DS.white,
      zIndex: 200,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '12px 14px',
        background: DS.ink, color: '#FFF',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.18)', border: 'none',
          width: 36, height: 36, borderRadius: 10,
          color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Scegli profilo</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>{filtered.length} risultati</div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ padding: 12, flexShrink: 0 }}>
        <input
          placeholder="Cerca codice / fornitore / serie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10,
            border: `1.5px solid ${DS.border}`, background: DS.light,
            fontSize: 14, color: DS.ink, boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* FILTRI - chip orizzontali */}
      <div style={{
        padding: '0 12px 8px',
        display: 'flex', gap: 6, overflowX: 'auto',
        flexShrink: 0,
      }}>
        <FilterChipMenu
          label="Fornitore"
          value={filtroFornitore}
          options={['', ...fornitori]}
          onChange={(v) => { setFiltroFornitore(v); setFiltroSerie('') }}
          formatValue={(v) => v || 'Tutti'}
        />
        <FilterChipMenu
          label="Serie"
          value={filtroSerie}
          options={['', ...serie]}
          onChange={setFiltroSerie}
          formatValue={(v) => v || 'Tutte'}
        />
        <FilterChipMenu
          label="Tipo"
          value={filtroTipo}
          options={['', ...tipi]}
          onChange={setFiltroTipo}
          formatValue={(v) => v || 'Tutti'}
        />
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: DS.muted, fontSize: 13 }}>
            {profili.length === 0
              ? 'Nessun profilo con sezione disponibile. Carica i profili da Settings → Profili.'
              : 'Nessun risultato. Modifica i filtri.'
            }
          </div>
        ) : grouped.map(([group, items]) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: DS.ink,
              padding: '6px 4px',
              borderLeft: `3px solid ${DS.teal}`,
              paddingLeft: 8,
              marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{group}</span>
              <span style={{ fontWeight: 400, color: DS.muted, fontSize: 10 }}>{items.length}</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 6,
            }}>
              {items.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    padding: 8, borderRadius: 10,
                    border: `1.5px solid ${DS.border}`,
                    background: DS.white,
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{
                    height: 56,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', marginBottom: 4,
                  }}>
                    {p.sezione_svg ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: p.sezione_svg }}
                        style={{ maxWidth: '90%', maxHeight: '90%' }}
                      />
                    ) : (
                      <span style={{ color: DS.border, fontSize: 9 }}>no preview</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 10, fontFamily: M, fontWeight: 700,
                    color: DS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.codice}</div>
                  {p.tipo && (
                    <div style={{ fontSize: 9, color: DS.muted }}>{p.tipo}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ Chip menu (filtro a tendina) ============
function FilterChipMenu({
  label, value, options, onChange, formatValue,
}: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void;
  formatValue: (v: string) => string;
}) {
  const [open, setOpen] = useState(false)
  const display = formatValue(value)
  const active = value !== ''

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '7px 12px', borderRadius: 8,
          border: `1px solid ${active ? DS.teal : DS.border}`,
          background: active ? DS.teal : DS.white,
          color: active ? '#FFF' : DS.ink,
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ opacity: 0.7 }}>{label}:</span>
        <span style={{ fontWeight: 700 }}>{display}</span>
        <span style={{ fontSize: 9 }}>▾</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(13,31,31,.4)', zIndex: 9,
            }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)', left: 0,
            minWidth: 180, maxHeight: 260, overflowY: 'auto',
            background: DS.white,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: 'none', background: 'transparent',
                  textAlign: 'left', cursor: 'pointer',
                  fontSize: 12,
                  color: opt === value ? DS.teal : DS.ink,
                  fontWeight: opt === value ? 700 : 500,
                  borderBottom: i < options.length - 1 ? `1px solid ${DS.light}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>{formatValue(opt)}</span>
                {opt === value && <span style={{ color: DS.teal }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
