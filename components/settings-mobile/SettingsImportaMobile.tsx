// components/settings-mobile/SettingsImportaMobile.tsx
// Modulo IMPORTA EXCEL - 3 tab: prezzi profili (per sistema), prezzi colori, prezzi accessori/ferramenta.

'use client'

import React, { useState } from 'react'
import { T } from '../home-mobile/HomeUI'
import ImportProfili from './importa/ImportProfili'
import ImportColori from './importa/ImportColori'
import ImportAccessori from './importa/ImportAccessori'

interface Props {
  azienda_id: string
  onBack: () => void
}

type Tab = 'profili' | 'colori' | 'accessori'

const TABS: { key: Tab; label: string; icon: string; sub: string }[] = [
  { key: 'profili',   label: 'Profili',   icon: '📐', sub: 'Prezzo €/kg per sistema' },
  { key: 'colori',    label: 'Colori',    icon: '🎨', sub: 'Maggiorazioni % colore' },
  { key: 'accessori', label: 'Accessori', icon: '🔧', sub: 'Prezzi listino/netto ferramenta' },
]

export default function SettingsImportaMobile({ azienda_id, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('profili')

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
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Importa Excel</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>Aggiorna prezzi da listino fornitore</div>
      </div>

      {/* TAB BAR */}
      <div style={{
        display: 'flex', gap: 6,
        padding: '12px 12px 4px', overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${active ? T.acc : T.bdr}`,
                background: active ? T.acc : '#FFF',
                color: active ? '#FFF' : T.text,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: T.muted, padding: '4px 16px 8px' }}>
        {TABS.find(x => x.key === tab)!.sub}
      </div>

      {/* CONTENT */}
      <div>
        {tab === 'profili'   && <ImportProfili azienda_id={azienda_id} />}
        {tab === 'colori'    && <ImportColori azienda_id={azienda_id} />}
        {tab === 'accessori' && <ImportAccessori azienda_id={azienda_id} />}
      </div>
    </div>
  )
}
