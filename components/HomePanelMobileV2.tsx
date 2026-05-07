// HomePanelMobileV2 v4 - tasto menu cablato a settings

'use client'

import React from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import * as UI from './home-mobile/HomeUI'
import { HomeStateProvider, useHomeState } from './home-mobile/HomeUI'
import { useState } from 'react'
import { IconCalendar, IconMenu } from './home-mobile/HomeIcons'
import {
  CardOggiOperativo, CardTeamLive, CardCommesseCritiche, CardProblemi,
  CardAgendaLive, CardProduzione, CardCaricoLavoro, CardCassa,
  CardOperatoreFermo, CardAzioniRapide,
} from './home-mobile/HomeWidgets'
import { useMastro } from './MastroContext'

export default function HomePanelMobileV2(props: any) {
  const { data } = useHomeMobile()
  const palette = UI.T

  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()
  const goto = (tab: string) => {
    if (ctx?.setTab) ctx.setTab(tab)
    else if (props?.onNavigate) props.onNavigate(tab)
  }
  const apriCommessa = (id: string) => {
    if (ctx?.setSelectedCM) ctx.setSelectedCM(id)
    goto('commesse')
  }
  const apriSettings = () => goto('settings')

  return (
    <div style={{ background: palette.bg, minHeight: '100vh', paddingBottom: 110 }}>
      <Header user={data.user} palette={palette} onMenu={apriSettings} />

      <HomeStateProvider
        defaultExpandedIds={['oggi-operativo']}
        allIds={['oggi-operativo','team-live','commesse-critiche','problemi','agenda-live','produzione','carico-lavoro','cassa','azioni-rapide']}
      >
      <HomeToolbar />
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CardOggiOperativo
          cardId="oggi-operativo"
          lavori={data.oggi.lavori}
          task={data.oggi.task}
          problemi={data.oggi.problemi}
          attivita={data.oggi.attivita}
          onVedi={() => goto('agenda')}
        />
        <CardTeamLive
          cardId="team-live"
          operatori={data.team.operatori}
          attivi={data.team.attivi}
          problemi={data.team.problemi}
          onApri={() => goto('team')}
        />
        <CardCommesseCritiche cardId="commesse-critiche" commesse={data.commesse} onApri={apriCommessa} />
        <CardProblemi cardId="problemi" problemi={data.problemi} onApri={() => goto('problemi')} />
        <CardAgendaLive
          cardId="agenda-live"
          giorni={data.agenda.giorni}
          eventi={data.agenda.eventi}
          onApri={() => goto('agenda')}
        />
        <CardProduzione
          cardId="produzione"
          ordini={data.produzione.ordini}
          inCorso={data.produzione.in_corso}
          fermi={data.produzione.fermi}
          onApri={() => goto('produzione')}
        />
        <CardCaricoLavoro cardId="carico-lavoro" settimana={data.carico.settimana} onApri={() => goto('agenda')} />
        <CardCassa cardId="cassa" soldi={data.soldi} onApri={() => goto('contabilita')} />
        {data.operatore_fermo && (
          <CardOperatoreFermo op={data.operatore_fermo} onApri={() => goto('team')} />
        )}
        <CardAzioniRapide
          cardId="azioni-rapide"
          onTask={() => goto('team')}
          onCommessa={() => goto('commesse')}
          onMappa={() => goto('team')}
          onFoto={() => goto('commesse')}
          onFirma={() => goto('contabilita')}
          onPreventivo={() => goto('preventivi')}
        />
      </div>
      </HomeStateProvider>
    </div>
  )
}

// ============================================================
// HomeToolbar funzionante: usa context HomeStateProvider direttamente
// Stile clean: 2 chips minimal navy, niente fondo blu chiaro
// ============================================================
function HomeToolbar() {
  const ctx = useHomeState()
  const total = ctx.allIds.length
  const open = ctx.expandedCount
  const allOpen = open === total
  const allClosed = open === 0

  return (
    <div style={{
      padding: '12px 16px 4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: '#475A75',
        letterSpacing: 0.5, textTransform: 'uppercase' as const,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {open}/{total} aperte
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={ctx.expandAll}
          disabled={allOpen}
          style={{
            padding: '6px 12px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
            border: '1px solid #1E3A5F',
            background: allOpen ? '#E2E8F0' : '#FFFFFF',
            color: allOpen ? '#94A3B8' : '#1E3A5F',
            cursor: allOpen ? 'default' : 'pointer',
            opacity: allOpen ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
        >Apri tutte</button>
        <button
          onClick={ctx.collapseAll}
          disabled={allClosed}
          style={{
            padding: '6px 12px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
            border: '1px solid #1E3A5F',
            background: allClosed ? '#E2E8F0' : '#1E3A5F',
            color: allClosed ? '#94A3B8' : '#FFFFFF',
            cursor: allClosed ? 'default' : 'pointer',
            opacity: allClosed ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
        >Chiudi tutte</button>
      </div>
    </div>
  )
}

function Header({ user, palette, onMenu }: { user: any; palette: any; onMenu?: () => void }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${palette.acc} 0%, ${palette.accDeep} 100%)`,
      padding: '14px 16px 28px',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      color: '#FFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: 0.3 }}>filwoX</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DayBadge palette={palette} />
          <UI.IconBtn onClick={onMenu}><IconMenu /></UI.IconBtn>
          <UI.Avatar text={user.iniziali} bg="rgba(255,255,255,0.18)" size={36} />
        </div>
      </div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>BUONGIORNO</div>
      <div style={{
        fontSize: 38, fontWeight: 700,
        letterSpacing: '-0.02em', lineHeight: 1,
        WebkitFontSmoothing: 'antialiased',
      }}>{user.nome}</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>{user.data}</div>
    </div>
  )
}

function DayBadge({ palette }: { palette: any }) {
  return (
    <div style={{
      background: '#FFFFFF', color: palette.acc,
      borderRadius: 14, padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: 6,
      fontWeight: 600, fontSize: 13,
    }}>
      <IconCalendar color={palette.acc} size={14} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span>DAY</span>
        <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.7 }}>0 task</span>
      </div>
    </div>
  )
}
