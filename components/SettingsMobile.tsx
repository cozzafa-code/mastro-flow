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
import NodiTecniciPanelMobile from './nodi/NodiTecniciPanelMobile'
import SettingsImportaMobile from './settings-mobile/SettingsImportaMobile'

// Tendaggi
import SettingsCatalogoTendaggi from './settings-mobile/SettingsCatalogoTendaggi'
import SettingsAccessoriTendaggi from './settings-mobile/SettingsAccessoriTendaggi'
import SettingsColoriTendaggi from './settings-mobile/SettingsColoriTendaggi'
import SettingsFornitoriTendaggi from './settings-mobile/SettingsFornitoriTendaggi'

// Flusso lavoro v10
import SettingsPipelineMobile from './SettingsPipelineMobile'
import SettingsBrandingMobile from './SettingsBrandingMobile'
import DocumentBuilderMobile from './DocumentBuilderMobile'

// Sviluppatori
import ApiKeysMobile from './mobile/settings/ApiKeysMobile'
import GeneraApiKeyModal from './mobile/settings/GeneraApiKeyModal'
import RevocaApiKeyModal from './mobile/settings/RevocaApiKeyModal'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

type Sezione =
  | null
  | 'profili' | 'vetri' | 'accessori'
  | 'win' | 'sistemi' | 'nodi' | 'importa'
  | 'tendaggi' | 'accessori_tendaggi' | 'colori_tendaggi' | 'fornitori_tendaggi'
  | 'pipeline' | 'branding' | 'docbuilder'
  | 'sviluppatori'

export default function SettingsMobile() {
  const { azienda_id, tornaHome } = useMastro()
  const [sezione, setSezione] = useState<Sezione>(null)
  const [showGeneraModal, setShowGeneraModal] = useState(false)
  const [keysReload, setKeysReload] = useState(0)
  const [revokingKey, setRevokingKey] = useState<any>(null)

  const aId = azienda_id || AZIENDA_ID
  const torna = () => setSezione(null)

  // CATALOGO PRODOTTI
  if (sezione === 'profili')   return <SettingsProfiliMobile onBack={torna} />
  if (sezione === 'vetri')     return <SettingsVetriMobile onBack={torna} />
  if (sezione === 'accessori') return <SettingsAccessoriMobile onBack={torna} />
  if (sezione === 'win')       return <MastroWinMobile azienda_id={aId} onBack={torna} />
  if (sezione === 'sistemi')   return <SettingsSistemiMobile azienda_id={aId} onBack={torna} />
  if (sezione === 'nodi')      return <NodiTecniciPanelMobile onBack={torna} />
  if (sezione === 'importa')   return <SettingsImportaMobile azienda_id={aId} onBack={torna} />

  // TENDAGGI
  if (sezione === 'tendaggi')           return <SettingsCatalogoTendaggi onBack={torna} />
  if (sezione === 'accessori_tendaggi') return <SettingsAccessoriTendaggi onBack={torna} />
  if (sezione === 'colori_tendaggi')    return <SettingsColoriTendaggi onBack={torna} />
  if (sezione === 'fornitori_tendaggi') return <SettingsFornitoriTendaggi onBack={torna} />

  // FLUSSO LAVORO
  if (sezione === 'pipeline')   return <SettingsPipelineMobile  azienda_id={aId} onClose={torna} />
  if (sezione === 'branding')   return <SettingsBrandingMobile  azienda_id={aId} onClose={torna} />
  if (sezione === 'docbuilder') return <DocumentBuilderMobile   azienda_id={aId} onClose={torna} />

  // SVILUPPATORI
  if (sezione === 'sviluppatori') return (
    <>
      <ApiKeysMobile
        key={keysReload}
        aziendaId={aId}
        onBack={torna}
        onOpenGenera={() => setShowGeneraModal(true)}
        onRevoke={(k) => setRevokingKey(k)}
      />
      {showGeneraModal && (
        <GeneraApiKeyModal
          onClose={() => setShowGeneraModal(false)}
          onCreated={() => setKeysReload(n => n + 1)}
        />
      )}
      {revokingKey && (
        <RevocaApiKeyModal
          apiKey={revokingKey}
          onClose={() => setRevokingKey(null)}
          onConfirmed={() => {
            setRevokingKey(null)
            setKeysReload(n => n + 1)
          }}
        />
      )}
    </>
  )

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100 }}>
      <Header onBack={tornaHome} />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        <SectionTitle>Flusso lavoro</SectionTitle>
        <CardSezione icona="⚡" titolo="Pipeline fasi"     sub="Personalizza il flusso di lavoro"            colore="#1E3A5F" onClick={() => setSezione('pipeline')}   badge="NEW" />
        <CardSezione icona="🎨" titolo="Branding"          sub="Logo, colori, intestazione, footer"          colore="#10B981" onClick={() => setSezione('branding')}   badge="NEW" />
        <CardSezione icona="📐" titolo="Document Builder"  sub="Costruisci i tuoi template documenti"        colore="#8B5CF6" onClick={() => setSezione('docbuilder')} badge="NEW" />

        <SectionTitle>Catalogo profilati</SectionTitle>
        <CardSezione icona="📐" titolo="Profili"          sub="Catalogo profili (telai, ante, traversi)"      colore={T.acc}      onClick={() => setSezione('profili')} />
        <CardSezione icona="🪟" titolo="Vetri"            sub="Catalogo vetri configurati"                    colore={T.numBlue}  onClick={() => setSezione('vetri')} />
        <CardSezione icona="🔧" titolo="Accessori"        sub="Catalogo accessori"                            colore={T.numAmber} onClick={() => setSezione('accessori')} />
        <CardSezione icona="⚡" titolo="Ferramenta WIN"   sub="Selezione automatica per anta"                 colore={T.accDeep}  onClick={() => setSezione('win')}     badge="NEW" />
        <CardSezione icona="⚙️" titolo="Sistemi profilo"  sub="Aluplast, Twin Systems"                      colore="#6B5BA6"    onClick={() => setSezione('sistemi')} badge="NEW" />
        <CardSezione icona="🔗" titolo="Nodi tecnici"     sub="Nodi costruttivi per sistema"                  colore={T.numTeal}  onClick={() => setSezione('nodi')}    badge="NEW" />
        <CardSezione icona="📥" titolo="Importa da Excel" sub="Aggiorna prezzi profili / colori / accessori"  colore={T.numRed}   onClick={() => setSezione('importa')} badge="NEW" />

        <SectionTitle>Tendaggi</SectionTitle>
        <CardSezione icona="🪟" titolo="Catalogo tendaggi"   sub="Modelli e marche"                       colore="#A2845E" onClick={() => setSezione('tendaggi')} />
        <CardSezione icona="🔧" titolo="Accessori tendaggi"  sub="Bastoni, binari, mantovane, fissaggi"   colore="#C49E66" onClick={() => setSezione('accessori_tendaggi')} />
        <CardSezione icona="🎨" titolo="Colori tendaggi"     sub="RAL, finiture, palette colore"          colore="#D4A373" onClick={() => setSezione('colori_tendaggi')} />
        <CardSezione icona="🚚" titolo="Fornitori tendaggi"  sub="Anagrafica fornitori"                   colore="#B08968" onClick={() => setSezione('fornitori_tendaggi')} />

        <SectionTitle>Sviluppatori</SectionTitle>
        <CardSezione icona="🔑" titolo="API Keys" sub="Genera chiavi per integrazioni esterne" colore="#1E3A5F" onClick={() => setSezione('sviluppatori')} badge="NEW" />
      </div>
    </div>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0F1B2D 0%, #1E3A5F 100%)',
      color: '#FFF', padding: '20px 16px 24px', borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
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
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      width: '100%', textAlign: 'left',
      boxShadow: '0 1px 0 rgba(15,27,45,0.04)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${colore}15`, color: colore,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>{icona}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: '-0.01em' }}>{titolo}</div>
          {badge && (
            <div style={{
              background: '#0F1B2D', color: '#FFF', padding: '2px 7px',
              borderRadius: 6, fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            }}>{badge}</div>
          )}
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ color: T.muted, fontSize: 18 }}>›</div>
    </button>
  )
}
