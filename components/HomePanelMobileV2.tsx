// components/HomePanelMobileV2.tsx
// Home mobile fliwoX v2. Statica, 10 widget operativi.

'use client'

import React from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import { T, IconBtn, Avatar } from './home-mobile/HomeUI'
import { IconCalendar, IconMenu } from './home-mobile/HomeIcons'
import {
  CardOggiOperativo, CardTeamLive, CardCommesseCritiche, CardProblemi,
  CardAgendaLive, CardProduzione, CardCaricoLavoro, CardCassa,
  CardOperatoreFermo, CardAzioniRapide,
} from './home-mobile/HomeWidgets'

export default function HomePanelMobileV2(_props: any) {
  const { data } = useHomeMobile()

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 110 }}>
      <Header user={data.user} />

      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CardOggiOperativo
          lavori={data.oggi.lavori}
          task={data.oggi.task}
          problemi={data.oggi.problemi}
          attivita={data.oggi.attivita}
        />
        <CardTeamLive
          operatori={data.team.operatori}
          attivi={data.team.attivi}
          problemi={data.team.problemi}
        />
        <CardCommesseCritiche commesse={data.commesse} />
        <CardProblemi problemi={data.problemi} />
        <CardAgendaLive
          giorni={data.agenda.giorni}
          eventi={data.agenda.eventi}
        />
        <CardProduzione
          ordini={data.produzione.ordini}
          inCorso={data.produzione.in_corso}
          fermi={data.produzione.fermi}
        />
        <CardCaricoLavoro settimana={data.carico.settimana} />
        <CardCassa soldi={data.soldi} />
        {data.operatore_fermo && <CardOperatoreFermo op={data.operatore_fermo} />}
        <CardAzioniRapide />
      </div>
    </div>
  )
}

function Header({ user }: { user: { nome: string; iniziali: string; data: string } }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
      padding: '14px 16px 28px',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      color: '#FFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: 0.3 }}>filwoX</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DayBadge />
          <IconBtn><IconMenu /></IconBtn>
          <Avatar text={user.iniziali} bg="rgba(255,255,255,0.18)" size={36} />
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

function DayBadge() {
  return (
    <div style={{
      background: '#FFFFFF', color: T.acc,
      borderRadius: 14, padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: 6,
      fontWeight: 600, fontSize: 13,
    }}>
      <IconCalendar color={T.acc} size={14} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span>DAY</span>
        <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.7 }}>0 task</span>
      </div>
    </div>
  )
}