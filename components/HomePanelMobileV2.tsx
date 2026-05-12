// HomePanelMobileV2 DIAGNOSTIC - solo header + status base
'use client'
import React, { useState } from 'react'
import { useMastro } from './MastroContext'

const NAVY = '#1B3A5C', NAVY_DEEP = '#0F1F33', BG = '#F4F1EA', TEXT = '#0F1F33'

export default function HomePanelMobileV2(props: any) {
  const ctx: any = useMastro() || {}
  const [count, setCount] = useState(0)
  
  const cantieri = ctx?.cantieri || []
  const events = ctx?.events || ctx?.eventi || []
  const tasks = ctx?.tasks || []
  
  const goto = (tab: string) => {
    if (ctx?.setTab) ctx.setTab(tab)
    else if (props?.onNavigate) props.onNavigate(tab)
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingBottom: 110 }}>
      <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, padding: '20px 18px 32px', borderRadius: '0 0 22px 22px', color: '#FFF' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>fliwoX</div>
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1.5 }}>BUONGIORNO</div>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>TITOLARE</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div onClick={() => goto('commesse')} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>COMMESSE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, marginTop: 6 }}>{cantieri.length}</div>
        </div>

        <div onClick={() => goto('agenda')} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>EVENTI</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, marginTop: 6 }}>{events.length}</div>
        </div>

        <div onClick={() => goto('team')} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>TASK</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, marginTop: 6 }}>{tasks.length}</div>
        </div>

        <button onClick={() => setCount(c => c + 1)} style={{ background: NAVY, color: '#FFF', border: 'none', padding: '14px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Test counter: {count}
        </button>
      </div>
    </div>
  )
}
