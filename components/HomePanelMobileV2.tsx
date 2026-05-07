// HomePanelMobileV2 v4 - tasto menu cablato a settings

'use client'

import React from 'react'
import { useHomeMobile } from '../hooks/useHomeMobile'
import * as UI from './home-mobile/HomeUI'
import { HomeStateProvider, useHomeState } from './home-mobile/HomeUI'
import { useDragReorder } from '../lib/home/useDragReorder'
import { useState } from 'react'
import { IconCalendar, IconMenu } from './home-mobile/HomeIcons'
import {
  CardOggiOperativo, CardTeamLive, CardCommesseCritiche, CardProblemi,
  CardAgendaLive, CardProduzione, CardCaricoLavoro, CardCassa,
  CardOperatoreFermo, CardAzioniRapide,
} from './home-mobile/HomeWidgets'
import { useMastro } from './MastroContext'

const DEFAULT_CARD_ORDER = ['oggi-operativo','team-live','commesse-critiche','problemi','agenda-live','produzione','carico-lavoro','cassa','azioni-rapide']

export default function HomePanelMobileV2(props: any) {
  const { data } = useHomeMobile()
  const palette = UI.T

  const [editMode, setEditMode] = useState(false)
  const [order, setOrder] = useState<string[]>(DEFAULT_CARD_ORDER)

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
      <Header
        user={data.user}
        palette={palette}
        onMenu={apriSettings}
        editMode={editMode}
        onToggleEdit={() => setEditMode(v => !v)}
      />

      <HomeStateProvider
        defaultExpandedIds={['oggi-operativo']}
        allIds={DEFAULT_CARD_ORDER}
        editMode={editMode}
        setEditMode={setEditMode}
      >
      <DragReorderBridge order={order} setOrder={setOrder} />
      <div data-card-list style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {order.map(id => {
          switch (id) {
            case 'oggi-operativo': return (
              <CardOggiOperativo
                key="oggi-operativo"
                cardId="oggi-operativo"
                lavori={data.oggi.lavori}
                task={data.oggi.task}
                problemi={data.oggi.problemi}
                attivita={data.oggi.attivita}
                onVedi={() => goto('agenda')}
              />
            )
            case 'team-live': return (
              <CardTeamLive
                key="team-live"
                cardId="team-live"
                operatori={data.team.operatori}
                attivi={data.team.attivi}
                problemi={data.team.problemi}
                onApri={() => goto('team')}
              />
            )
            case 'commesse-critiche': return (
              <CardCommesseCritiche key="commesse-critiche" cardId="commesse-critiche" commesse={data.commesse} onApri={apriCommessa} />
            )
            case 'problemi': return (
              <CardProblemi key="problemi" cardId="problemi" problemi={data.problemi} onApri={() => goto('problemi')} />
            )
            case 'agenda-live': return (
              <CardAgendaLive
                key="agenda-live"
                cardId="agenda-live"
                giorni={data.agenda.giorni}
                eventi={data.agenda.eventi}
                onApri={() => goto('agenda')}
              />
            )
            case 'produzione': return (
              <CardProduzione
                key="produzione"
                cardId="produzione"
                ordini={data.produzione.ordini}
                inCorso={data.produzione.in_corso}
                fermi={data.produzione.fermi}
                onApri={() => goto('produzione')}
              />
            )
            case 'carico-lavoro': return (
              <CardCaricoLavoro key="carico-lavoro" cardId="carico-lavoro" settimana={data.carico.settimana} onApri={() => goto('agenda')} />
            )
            case 'cassa': return (
              <CardCassa key="cassa" cardId="cassa" soldi={data.soldi} onApri={() => goto('contabilita')} />
            )
            case 'azioni-rapide': return (
              <CardAzioniRapide
                key="azioni-rapide"
                cardId="azioni-rapide"
                onTask={() => goto('team')}
                onCommessa={() => goto('commesse')}
                onMappa={() => goto('team')}
                onFoto={() => goto('commesse')}
                onFirma={() => goto('contabilita')}
                onPreventivo={() => goto('preventivi')}
              />
            )
            default: return null
          }
        })}
        {data.operatore_fermo && (
          <CardOperatoreFermo op={data.operatore_fermo} onApri={() => goto('team')} />
        )}
      </div>
      </HomeStateProvider>
    </div>
  )
}

// ============================================================
// DragReorderBridge: collega useDragReorder al context HomeStateProvider
// ============================================================
function DragReorderBridge({ order, setOrder }: { order: string[]; setOrder: (o: string[]) => void }) {
  const ctx = useHomeState()
  const orderRef = (typeof window !== 'undefined') ? (window as any) : {}
  orderRef._mastroOrder = order

  const { startDrag } = useDragReorder((newOrder: string[]) => {
    setOrder(newOrder)
  })

  // Registro il drag handler nel context
  if (ctx.enabled) {
    ctx.registerDragStart((e: React.PointerEvent, cardId: string) => {
      const cardEl = (e.target as HTMLElement).closest('[data-card-id]') as HTMLElement
      if (cardEl) startDrag(e, cardEl)
    })
  }

  return null
}


function Header({ user, palette, onMenu, editMode, onToggleEdit }: { user: any; palette: any; onMenu?: () => void; editMode?: boolean; onToggleEdit?: () => void }) {
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
          <button
            onClick={onToggleEdit}
            style={{
              padding: editMode ? '7px 14px' : '7px 12px',
              borderRadius: 8,
              fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
              textTransform: 'uppercase' as const,
              background: editMode ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
              color: editMode ? '#0F1B2D' : '#FFFFFF',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >{editMode ? 'Fatto' : 'Riordina'}</button>
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
