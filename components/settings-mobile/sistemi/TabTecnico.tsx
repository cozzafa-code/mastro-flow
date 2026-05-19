// components/settings-mobile/sistemi/TabTecnico.tsx
// Parametri tecnici associati al sistema: dimensioni limite, prestazioni,
// formule, fermavetri, guarnizioni, taglio termico, drenaggio, lavorazioni,
// quote taglio, nodi costruttivi, manutenzione, sigillanti.

'use client'

import React, { useEffect, useState } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { SistemaConStats } from '@/lib/types/sistemi'
import { supabase } from '@/lib/supabase'

interface Props {
  sistema: SistemaConStats
  sis: any
}

interface Categoria {
  table: string
  label: string
  icona: string
  colore: string
  count: number
  loading: boolean
  rows: any[]
}

const CATEGORIE_BASE: Omit<Categoria, 'count' | 'loading' | 'rows'>[] = [
  { table: 'catalogo_dimensioni_limite', label: 'Dimensioni limite', icona: '📏', colore: '#28A0A0' },
  { table: 'catalogo_prestazioni',       label: 'Prestazioni',       icona: '⚡', colore: '#3B82F6' },
  { table: 'catalogo_formule',           label: 'Formule',           icona: '∑',  colore: '#8B5CF6' },
  { table: 'catalogo_fermavetri',        label: 'Fermavetri',        icona: '⊟',  colore: '#0EA5E9' },
  { table: 'catalogo_guarnizioni',       label: 'Guarnizioni',       icona: '◷',  colore: '#10B981' },
  { table: 'catalogo_taglio_termico',    label: 'Taglio termico',    icona: '⊠',  colore: '#F59E0B' },
  { table: 'catalogo_drenaggio',         label: 'Drenaggio',         icona: '◊',  colore: '#06B6D4' },
  { table: 'catalogo_lavorazioni',       label: 'Lavorazioni',       icona: '⚙',  colore: '#6366F1' },
  { table: 'catalogo_quote_taglio',      label: 'Quote taglio',      icona: '✂',  colore: '#EC4899' },
  { table: 'catalogo_nodi_costruttivi',  label: 'Nodi costruttivi',  icona: '⊕',  colore: '#14B8A6' },
  { table: 'catalogo_manutenzione',      label: 'Manutenzione',      icona: '🔧', colore: '#EAB308' },
  { table: 'catalogo_sigillanti',        label: 'Sigillanti',        icona: '◉',  colore: '#A855F7' },
  { table: 'catalogo_pannelli',          label: 'Pannelli',          icona: '▦',  colore: '#84CC16' },
]

export default function TabTecnico({ sistema, sis }: Props) {
  const [cats, setCats] = useState<Categoria[]>(
    CATEGORIE_BASE.map((c) => ({ ...c, count: 0, loading: true, rows: [] }))
  )
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all(
      CATEGORIE_BASE.map(async (c) => {
        try {
          const { data, error } = await supabase
            .from(c.table)
            .select('*')
            .eq('sistema_id', sistema.id)
            .limit(50)
          return { table: c.table, rows: error ? [] : (data ?? []) }
        } catch {
          return { table: c.table, rows: [] }
        }
      })
    ).then((results) => {
      if (!alive) return
      setCats((prev) =>
        prev.map((c) => {
          const r = results.find((x) => x.table === c.table)
          return { ...c, count: r?.rows.length ?? 0, loading: false, rows: r?.rows ?? [] }
        })
      )
    })
    return () => { alive = false }
  }, [sistema.id])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.muted, marginBottom: 10 }}>
        PARAMETRI TECNICI · {cats.reduce((s, c) => s + c.count, 0)} TOTALI
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cats.map((c) => (
          <CategoriaCard
            key={c.table}
            cat={c}
            expanded={expanded === c.table}
            onToggle={() => setExpanded(expanded === c.table ? null : c.table)}
          />
        ))}
      </div>

      <div style={{
        marginTop: 14, padding: 10,
        background: '#FFF8E1',
        border: '1px solid #E0C870',
        borderRadius: 10,
        fontSize: 11, color: '#5C4500',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Sola lettura</div>
        <div>I dati tecnici per categoria sono di sola consultazione qui. CRUD completo dedicato verrà aggiunto in iterazione successiva (un modulo per categoria).</div>
      </div>
    </div>
  )
}

function CategoriaCard({ cat, expanded, onToggle }: {
  cat: Categoria
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div style={{
      background: '#FFF',
      border: `1px solid ${expanded ? cat.colore : T.bdr}`,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: T.shadow,
    }}>
      <button
        onClick={onToggle}
        disabled={cat.count === 0}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: cat.count === 0 ? 'default' : 'pointer',
          textAlign: 'left',
          opacity: cat.count === 0 ? 0.5 : 1,
        }}
      >
        <div style={{
          width: 36, height: 36,
          borderRadius: 9,
          background: cat.colore + '15',
          color: cat.colore,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700,
          flexShrink: 0,
        }}>{cat.icona}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{cat.label}</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {cat.loading ? 'Caricamento...' : (cat.count === 0 ? 'Nessun dato' : `${cat.count} elementi`)}
          </div>
        </div>
        {cat.count > 0 && (
          <div style={{ color: T.muted, fontSize: 18 }}>{expanded ? '▾' : '▸'}</div>
        )}
      </button>

      {expanded && cat.rows.length > 0 && (
        <div style={{
          borderTop: `1px solid ${T.bdr}`,
          background: '#F8FBFB',
          padding: 10,
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {cat.rows.map((row, i) => (
            <RowDetail key={i} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}

function RowDetail({ row }: { row: any }) {
  // Mostro tutti i campi non-null in modo compatto
  const entries = Object.entries(row).filter(([k, v]) =>
    v != null && k !== 'id' && k !== 'sistema_id' && k !== 'created_at' && k !== 'updated_at' && k !== 'azienda_id'
  )
  return (
    <div style={{
      background: '#FFF',
      borderRadius: 8,
      padding: 8,
      marginBottom: 6,
      border: `1px solid ${T.bdr}`,
      fontSize: 11,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 9, color: T.muted, letterSpacing: 0.3 }}>{k}</span>
            <span style={{
              fontSize: 11,
              color: T.text,
              fontFamily: typeof v === 'number' ? 'monospace' : undefined,
              wordBreak: 'break-word',
            }}>
              {typeof v === 'boolean' ? (v ? '✓' : '—') : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
