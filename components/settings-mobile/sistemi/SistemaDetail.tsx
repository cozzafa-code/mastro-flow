// components/settings-mobile/sistemi/SistemaDetail.tsx
// Schermata di dettaglio singolo sistema con 5 tab: Overview, Profili, Colori, Vetri, Tecnico.

'use client'

import React, { useState, useEffect } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { SistemaConStats, SistemaTab } from '@/lib/types/sistemi'
import TabOverview from './TabOverview'
import TabProfili from './TabProfili'
import TabColori from './TabColori'
import TabVetri from './TabVetri'
import TabTecnico from './TabTecnico'

interface Props {
  sistema: SistemaConStats
  sis: any
  azienda_id: string
  onBack: () => void
}

const TABS: { key: SistemaTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'profili',  label: 'Profili' },
  { key: 'colori',   label: 'Colori' },
  { key: 'vetri',    label: 'Vetri' },
  { key: 'tecnico',  label: 'Tecnico' },
]

export default function SistemaDetail({ sistema, sis, azienda_id, onBack }: Props) {
  const [tab, setTab] = useState<SistemaTab>('overview')

  useEffect(() => {
    sis.loadDettaglio(sistema.id)
  }, [sistema.id])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
        padding: '14px 16px 18px',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        color: '#FFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.18)', border: 'none',
            width: 36, height: 36, borderRadius: 10,
            color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          }}>‹</button>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{sistema.marca}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              {sistema.sistema}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
              {sistema.materiale}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <button
              onClick={() => sis.toggleAttivo(sistema.id)}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: '5px 10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: sistema.attivo_azienda ? '#FFF' : 'rgba(255,255,255,0.15)',
                color: sistema.attivo_azienda ? T.accDeep : '#FFF',
                cursor: 'pointer',
              }}
            >{sistema.attivo_azienda ? '✓ ATTIVO' : 'ATTIVA'}</button>
            <button
              onClick={() => sis.togglePreferito(sistema.id)}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: '5px 10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: sistema.preferito ? '#FFF7E0' : 'rgba(255,255,255,0.15)',
                color: sistema.preferito ? '#E0A030' : '#FFF',
                cursor: 'pointer',
              }}
            >{sistema.preferito ? '★ PREFERITO' : '☆'}</button>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '12px 12px 4px',
        overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '7px 12px',
                borderRadius: 9,
                border: `1px solid ${active ? T.acc : T.bdr}`,
                background: active ? T.acc : '#FFF',
                color: active ? '#FFF' : T.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* CONTENT */}
      <div>
        {tab === 'overview' && <TabOverview sistema={sistema} sis={sis} />}
        {tab === 'profili'  && <TabProfili  sistema={sistema} sis={sis} />}
        {tab === 'colori'   && <TabColori   sistema={sistema} sis={sis} />}
        {tab === 'vetri'    && <TabVetri    sistema={sistema} sis={sis} />}
        {tab === 'tecnico'  && <TabTecnico  sistema={sistema} sis={sis} />}
      </div>
    </div>
  )
}
