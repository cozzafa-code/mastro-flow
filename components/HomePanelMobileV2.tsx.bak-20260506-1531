// HomePanelMobileV2 v4 - tasto menu cablato a settings

'use client'

import React from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import * as UI from './home-mobile/HomeUI'
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

      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CardOggiOperativo
          lavori={data.oggi.lavori}
          task={data.oggi.task}
          problemi={data.oggi.problemi}
          attivita={data.oggi.attivita}
          onVedi={() => goto('agenda')}
        />
        <CardTeamLive
          operatori={data.team.operatori}
          attivi={data.team.attivi}
          problemi={data.team.problemi}
          onApri={() => goto('team')}
        />
        <CardCommesseCritiche commesse={data.commesse} onApri={apriCommessa} />
        <CardProblemi problemi={data.problemi} onApri={() => goto('problemi')} />
        <CardAgendaLive
          giorni={data.agenda.giorni}
          eventi={data.agenda.eventi}
          onApri={() => goto('agenda')}
        />
        <CardProduzione
          ordini={data.produzione.ordini}
          inCorso={data.produzione.in_corso}
          fermi={data.produzione.fermi}
          onApri={() => goto('produzione')}
        />
        <CardCaricoLavoro settimana={data.carico.settimana} onApri={() => goto('agenda')} />
        <CardCassa soldi={data.soldi} onApri={() => goto('contabilita')} />
        {data.operatore_fermo && (
          <CardOperatoreFermo op={data.operatore_fermo} onApri={() => goto('team')} />
        )}
        <CardAzioniRapide
          onTask={() => goto('team')}
          onCommessa={() => goto('commesse')}
          onMappa={() => goto('team')}
          onFoto={() => goto('commesse')}
          onFirma={() => goto('contabilita')}
          onPreventivo={() => goto('preventivi')}
        />
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
