// components/SettingsMobile.tsx
// Settings mobile fliwoX. 6 card grandi cliccabili, ognuna apre full-screen.
// Cablato Supabase diretto.

'use client'

import React, { useState } from 'react'
import { useMastro } from './MastroContext'
import { T } from './home-mobile/HomeUI'
import SettingsProfiliMobile from './settings-mobile/SettingsProfiliMobile'
import SettingsVetriMobile from './settings-mobile/SettingsVetriMobile'

type Sezione = null | 'profili' | 'vetri' | 'accessori' | 'nodi' | 'sistemi' | 'importa'

export default function SettingsMobile() {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [sezione, setSezione] = useState<Sezione>(null)

  const tornaHome = () => {
    if (ctx?.setTab) ctx.setTab('dashboard')
  }
  const torna = () => setSezione(null)

  if (sezione === 'profili') return <SettingsProfiliMobile onBack={torna} />
  if (sezione === 'vetri') return <SettingsVetriMobile onBack={torna} />
  if (sezione === 'accessori') return <Placeholder titolo="ACCESSORI" onBack={torna} />
  if (sezione === 'nodi') return <Placeholder titolo="NODI TECNICI" onBack={torna} />
  if (sezione === 'sistemi') return <Placeholder titolo="SISTEMI" onBack={torna} />
  if (sezione === 'importa') return <Placeholder titolo="IMPORTA EXCEL" onBack={torna} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      <Header onBack={tornaHome} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CardSezione
          icona="📐"
          titolo="Profili"
          sub="40 profili nel catalogo"
          colore={T.acc}
          onClick={() => setSezione('profili')}
        />
        <CardSezione
          icona="🪟"
          titolo="Vetri"
          sub="8 vetri configurati"
          colore={T.numBlue}
          onClick={() => setSezione('vetri')}
        />
        <CardSezione
          icona="🔧"
          titolo="Accessori"
          sub="41 accessori in catalogo"
          colore={T.numAmber}
          onClick={() => setSezione('accessori')}
        />
        <CardSezione
          icona="🔗"
          titolo="Nodi tecnici"
          sub="8 nodi disponibili"
          colore={T.numTeal}
          onClick={() => setSezione('nodi')}
        />
        <CardSezione
          icona="⚙️"
          titolo="Sistemi profilo"
          sub="45 sistemi (Aluplast, Schuco...)"
          colore="#6B5BA6"
          onClick={() => setSezione('sistemi')}
        />
        <CardSezione
          icona="📥"
          titolo="Importa da Excel"
          sub="Carica catalogo completo"
          colore={T.numRed}
          onClick={() => setSezione('importa')}
        />
      </div>
    </div>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
      padding: '14px 16px 24px',
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
      }}>Impostazioni</div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
        Catalogo, prezzi, sistemi
      </div>
    </div>
  )
}

function CardSezione({
  icona, titolo, sub, colore, onClick,
}: { icona: string; titolo: string; sub: string; colore: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: '#FFF',
      border: `1px solid ${T.bdr}`,
      borderRadius: 16,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: 'pointer',
      boxShadow: T.shadow,
      width: '100%',
      textAlign: 'left',
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: 12,
        background: colore + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
      }}>{icona}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 2 }}>{titolo}</div>
        <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>
      </div>
      <div style={{ color: T.acc, fontSize: 22, fontWeight: 700 }}>›</div>
    </button>
  )
}

function Placeholder({ titolo, onBack }: { titolo: string; onBack: () => void }) {
  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <Header onBack={onBack} />
      <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>{titolo}</div>
        <div style={{ fontSize: 12 }}>In arrivo</div>
      </div>
    </div>
  )
}
