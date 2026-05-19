// components/settings-mobile/MastroWinMobile.tsx
// Modulo MASTRO WIN: 4 tab (Calcolo / Articoli / Cremonesi / Dim+Portate).
// Stile fliwoX coerente con SettingsAccessoriMobile / SettingsProfiliMobile.

'use client'

import React, { useState } from 'react'
import { T } from '../home-mobile/HomeUI'
import { useMastroWin } from '@/hooks/useMastroWin'
import type { WinTab } from '@/lib/types/mastro-win'
import CalcoloLive from './mastro-win/CalcoloLive'
import CrudArticoli from './mastro-win/CrudArticoli'
import CrudCremonesi from './mastro-win/CrudCremonesi'
import CrudDimensioniPortate from './mastro-win/CrudDimensioniPortate'

interface Props {
  azienda_id: string
  onBack: () => void
}

const TABS: { key: WinTab; label: string }[] = [
  { key: 'calcolo',    label: 'Calcolo' },
  { key: 'articoli',   label: 'Articoli' },
  { key: 'cremonesi',  label: 'Cremonesi' },
  { key: 'dimensioni', label: 'Dim/Port' },
]

export default function MastroWinMobile({ azienda_id, onBack }: Props) {
  const [tab, setTab] = useState<WinTab>('calcolo')
  const win = useMastroWin(azienda_id)

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
        padding: '14px 16px 20px',
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
          WebkitFontSmoothing: 'antialiased',
        }}>MASTRO WIN</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
          {win.articoli.length} articoli · {win.cremonesi.length} cremonesi
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '12px 16px 4px',
        overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: `1px solid ${active ? T.acc : T.bdr}`,
                background: active ? T.acc : '#FFF',
                color: active ? '#FFF' : T.text,
                fontSize: 13,
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
      <div style={{ padding: '8px 0' }}>
        {tab === 'calcolo' && (
          <CalcoloLive
            articoli={win.articoli}
            cremonesi={win.cremonesi}
            azienda_id={azienda_id}
          />
        )}
        {tab === 'articoli' && (
          <CrudArticoli
            articoli={win.articoli}
            loading={win.loadingArticoli}
            onSave={win.saveArticolo}
            onDelete={win.deleteArticolo}
          />
        )}
        {tab === 'cremonesi' && (
          <CrudCremonesi
            cremonesi={win.cremonesi}
            loading={win.loadingCremonesi}
            onSave={win.saveCremonese}
            onDelete={win.deleteCremonese}
          />
        )}
        {tab === 'dimensioni' && (
          <CrudDimensioniPortate
            catalogo={win.catalogo}
            dimensioni={win.dimensioni}
            portate={win.portate}
            loading={win.loadingCatalogo}
            onReloadDP={win.reloadDimensioniPortate}
            onSaveCatalogo={win.saveCatalogo}
            onDeleteCatalogo={win.deleteCatalogo}
            onSaveDimensione={win.saveDimensione}
            onDeleteDimensione={win.deleteDimensione}
            onSavePortata={win.savePortata}
            onDeletePortata={win.deletePortata}
          />
        )}
      </div>
    </div>
  )
}
