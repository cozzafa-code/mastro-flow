// components/SettingsMobile.tsx
// Settings mobile fliwoX. Lista raggruppata per sezione.

'use client'

import React, { useState } from 'react'
import { useMastro } from './MastroContext'
import { T } from './home-mobile/HomeUI'

// Catalogo prodotti (esistenti)
import SettingsProfiliMobile from './settings-mobile/SettingsProfiliMobile'
import SettingsVetriMobile from './settings-mobile/SettingsVetriMobile'
import SettingsAccessoriMobile from './settings-mobile/SettingsAccessoriMobile'

// Catalogo prodotti (NEW)
import MastroWinMobile from './settings-mobile/MastroWinMobile'
import SettingsSistemiMobile from './settings-mobile/SettingsSistemiMobile'
import NodiTecniciPanel from './NodiTecniciPanel'
import SettingsImportaMobile from './settings-mobile/SettingsImportaMobile'

// Tendaggi
import SettingsCatalogoTendaggi from './settings-mobile/SettingsCatalogoTendaggi'
import SettingsAccessoriTendaggi from './settings-mobile/SettingsAccessoriTendaggi'
import SettingsColoriTendaggi from './settings-mobile/SettingsColoriTendaggi'
import SettingsFornitoriTendaggi from './settings-mobile/SettingsFornitoriTendaggi'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

type Sezione =
  | null
  | 'profili' | 'vetri' | 'accessori'
  | 'win' | 'sistemi' | 'nodi' | 'importa'
  | 'tendaggi' | 'accessori_tendaggi' | 'colori_tendaggi' | 'fornitori_tendaggi'

export default function SettingsMobile() {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const [sezione, setSezione] = useState<Sezione>(null)

  const tornaHome = () => { if (ctx?.setTab) ctx.setTab('dashboard') }
  const torna = () => setSezione(null)

  const azienda_id = ctx?.azienda?.id || ctx?.aziendaId || AZIENDA_ID

  // CATALOGO PRODOTTI
  if (sezione === 'profili')   return <SettingsProfiliMobile onBack={torna} />
  if (sezione === 'vetri')     return <SettingsVetriMobile onBack={torna} />
  if (sezione === 'accessori') return <SettingsAccessoriMobile onBack={torna} />
  if (sezione === 'win')       return <MastroWinMobile azienda_id={azienda_id} onBack={torna} />
  if (sezione === 'sistemi')   return <SettingsSistemiMobile azienda_id={azienda_id} onBack={torna} />
  if (sezione === 'nodi')      return <NodiTecniciPanel onBack={torna} />
  if (sezione === 'importa')   return <SettingsImportaMobile azienda_id={azienda_id} onBack={torna} />

  // TENDAGGI
  if (sezione === 'tendaggi')           return <SettingsCatalogoTendaggi onBack={torna} />
  if (sezione === 'accessori_tendaggi') return <SettingsAccessoriTendaggi onBack={torna} />
  if (sezione === 'colori_tendaggi')    return <SettingsColoriTendaggi onBack={torna} />
  if (sezione === 'fornitori_tendaggi') return <SettingsFornitoriTendaggi onBack={torna} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      <Header onBack={tornaHome} />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        <SectionTitle>Catalogo profilati</SectionTitle>
        <CardSezione icona="📐" titolo="Profili"          sub="Catalogo profili (telai, ante, traversi)"      colore={T.acc}      onClick={() => setSezione('profili')} />
        <CardSezione icona="🪟" titolo="Vetri"            sub="Catalogo vetri configurati"                    colore={T.numBlue}  onClick={() => setSezione('vetri')} />
        <CardSezione icona="🔧" titolo="Accessori"        sub="Catalogo accessori"                            colore={T.numAmber} onClick={() => setSezione('accessori')} />
        <CardSezione icona="⚡" titolo="Ferramenta WIN"   sub="Selezione automatica per anta"                 colore={T.accDeep}  onClick={() => setSezione('win')}     badge="NEW" />
        <CardSezione icona="⚙️" titolo="Sistemi profilo"  sub="Aluplast, Twin Systems · attivazione e prezzi" colore="#6B5BA6"    onClick={() => setSezione('sistemi')} badge="NEW" />
        <CardSezione icona="🔗" titolo="Nodi tecnici"     sub="Nodi costruttivi per sistema"                  colore={T.numTeal}  onClick={() => setSezione('nodi')}    badge="NEW" />
        <CardSezione icona="📥" titolo="Importa da Excel" sub="Aggiorna prezzi profili / colori / accessori"  colore={T.numRed}   onClick={() => setSezione('importa')} badge="NEW" />

        <SectionTitle>Tendaggi</SectionTitle>
        <CardSezione icona="🪟" titolo="Catalogo tendaggi"   sub="Modelli e marche"                       colore="#A2845E" onClick={() => setSezione('tendaggi')} />
        <CardSezione icona="🔧" titolo="Accessori tendaggi"  sub="Bastoni, binari, mantovane, fissaggi"   colore="#C49E66" onClick={() => setSezione('accessori_tendaggi')} />
        <CardSezione icona="🎨" titolo="Colori tendaggi"     sub="RAL, finiture, palette colore"          colore="#D4A373" onClick={() => setSezione('colori_tendaggi')} />
        <CardSezione icona="🚚" titolo="Fornitori tendaggi"  sub="Anagrafica fornitori"                   colore="#B08968" onClick={() => setSezione('fornitori_tendaggi')} />

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
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Impostazioni</div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>Catalogo, prezzi, sistemi</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
      color: T.muted, textTransform: 'uppercase',
      marginTop: 12, marginBottom: -2, paddingLeft: 4,
    }}>{children}</div>
  )
}

function CardSezione({ icona, titolo, sub, colore, onClick, badge }: {
  icona: string; titolo: string; sub: string; colore: string; onClick: () => void; badge?: string
}) {
  return (
    <button onClick={onClick} style={{
      background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 16,
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', boxShadow: T.shadow,
      width: '100%', textAlign: 'left',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: colore + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>{icona}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {titolo}
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: '2px 6px', borderRadius: 4,
              background: T.acc, color: '#FFF',
            }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>
      </div>
      <div style={{ color: T.acc, fontSize: 22, fontWeight: 700 }}>›</div>
    </button>
  )
}
