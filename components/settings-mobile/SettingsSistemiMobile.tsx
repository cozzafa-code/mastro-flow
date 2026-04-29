// components/settings-mobile/SettingsSistemiMobile.tsx
// Lista sistemi raggruppata per marca (Aluplast / Twin Systems).
// Toggle attivo + preferito. Tap su un sistema apre SistemaDetail.

'use client'

import React, { useState, useMemo } from 'react'
import { T } from '../home-mobile/HomeUI'
import { useSistemi } from '@/hooks/useSistemi'
import type { SistemaConStats } from '@/lib/types/sistemi'
import SistemaDetail from './sistemi/SistemaDetail'

interface Props {
  azienda_id: string
  onBack: () => void
}

export default function SettingsSistemiMobile({ azienda_id, onBack }: Props) {
  const sis = useSistemi(azienda_id)
  const [filtro, setFiltro] = useState('')
  const [soloAttivi, setSoloAttivi] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const filtrati = useMemo(() => {
    const f = filtro.toLowerCase().trim()
    return sis.sistemi.filter((s) => {
      if (soloAttivi && !s.attivo_azienda) return false
      if (!f) return true
      return (
        s.marca.toLowerCase().includes(f) ||
        s.sistema.toLowerCase().includes(f) ||
        s.materiale.toLowerCase().includes(f)
      )
    })
  }, [sis.sistemi, filtro, soloAttivi])

  const grouped = useMemo(() => {
    const m = new Map<string, SistemaConStats[]>()
    for (const s of filtrati) {
      const k = s.marca || '—'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(s)
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtrati])

  const stats = useMemo(() => {
    const tot = sis.sistemi.length
    const attivi = sis.sistemi.filter((s) => s.attivo_azienda).length
    const preferiti = sis.sistemi.filter((s) => s.preferito).length
    return { tot, attivi, preferiti }
  }, [sis.sistemi])

  if (selected) {
    const s = sis.sistemi.find((x) => x.id === selected)
    if (!s) {
      setSelected(null)
      return null
    }
    return (
      <SistemaDetail
        sistema={s}
        sis={sis}
        azienda_id={azienda_id}
        onBack={() => setSelected(null)}
      />
    )
  }

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
        <div style={{
          fontSize: 32, fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>Sistemi profilo</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, display: 'flex', gap: 10 }}>
          <span>{stats.tot} totali</span>
          <span>·</span>
          <span>{stats.attivi} attivi</span>
          <span>·</span>
          <span>{stats.preferiti} preferiti</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Cerca marca / sistema..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${T.bdr}`,
            background: '#FFF',
            fontSize: 14,
            color: T.text,
          }}
        />
        <button
          onClick={() => setSoloAttivi((v) => !v)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: `1px solid ${soloAttivi ? T.acc : T.bdr}`,
            background: soloAttivi ? T.acc : '#FFF',
            color: soloAttivi ? '#FFF' : T.text,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {soloAttivi ? '✓ Attivi' : 'Tutti'}
        </button>
      </div>

      {sis.loading && (
        <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
          Caricamento...
        </div>
      )}

      {/* LISTA RAGGRUPPATA */}
      <div style={{ padding: '0 12px' }}>
        {grouped.map(([marca, items]) => (
          <div key={marca} style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 4px 6px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: T.muted,
            }}>
              {marca.toUpperCase()}
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 6,
                background: T.bdr,
                color: T.text,
              }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map((s) => (
                <CardSistema
                  key={s.id}
                  s={s}
                  onTap={() => setSelected(s.id)}
                  onToggleAttivo={() => sis.toggleAttivo(s.id)}
                  onTogglePref={() => sis.togglePreferito(s.id)}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && !sis.loading && (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
            Nessun sistema trovato.
          </div>
        )}
      </div>
    </div>
  )
}

function CardSistema({
  s, onTap, onToggleAttivo, onTogglePref,
}: {
  s: SistemaConStats
  onTap: () => void
  onToggleAttivo: () => void
  onTogglePref: () => void
}) {
  return (
    <div style={{
      background: '#FFF',
      border: `1px solid ${s.attivo_azienda ? T.acc : T.bdr}`,
      borderRadius: 12,
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: T.shadow,
    }}>
      {/* Toggle attivo (sx) */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleAttivo() }}
        title={s.attivo_azienda ? 'Disattiva' : 'Attiva'}
        style={{
          width: 28, height: 28, borderRadius: 8,
          border: 'none',
          background: s.attivo_azienda ? T.acc : T.bdr,
          color: '#FFF',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          flexShrink: 0,
        }}
      >{s.attivo_azienda ? '✓' : ''}</button>

      {/* Body */}
      <div onClick={onTap} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.sistema}</div>
          {s.preferito && (
            <span style={{ fontSize: 11, color: '#E0A030' }}>★</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          {s.materiale}
          {' · '}
          <span style={{ color: T.text }}>{s.n_profili}</span> profili
          {' · '}
          <span style={{ color: T.text }}>{s.n_colori}</span> colori
          {' · '}
          <span style={{ color: T.text }}>{s.n_vetri}</span> vetri
        </div>
      </div>

      {/* Toggle preferito */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePref() }}
        title={s.preferito ? 'Rimuovi preferito' : 'Imposta preferito'}
        style={{
          width: 28, height: 28, borderRadius: 8,
          border: `1px solid ${s.preferito ? '#E0A030' : T.bdr}`,
          background: s.preferito ? '#FFF7E0' : '#FFF',
          color: s.preferito ? '#E0A030' : T.muted,
          fontSize: 14, cursor: 'pointer',
          flexShrink: 0,
        }}
      >★</button>

      {/* Chevron */}
      <div onClick={onTap} style={{ color: T.acc, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>›</div>
    </div>
  )
}
