// HomePanelMobileV2 STEP 2 - + useHomeMobile hook
'use client'
import React, { useState } from 'react'
import { useMastro } from './MastroContext'
import { useHomeMobile } from '../hooks/useHomeMobile'

const NAVY = '#1B3A5C', NAVY_DEEP = '#0F1F33', BG = '#F4F1EA', TEXT = '#0F1F33'

export default function HomePanelMobileV2(props: any) {
  const ctx: any = useMastro() || {}
  const { data } = useHomeMobile()
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
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{(data?.user?.nome || 'TITOLARE').toUpperCase()}</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div onClick={() => goto('commesse')} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>COMMESSE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, marginTop: 6 }}>{cantieri.length}</div>
        </div>

        <div onClick={() => goto('agenda')} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>EVENTI OGGI</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, marginTop: 6 }}>{data?.oggi?.lavori || events.length}</div>
        </div>

        <div onClick={() => goto('team')} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>TASK</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, marginTop: 6 }}>{data?.oggi?.task || tasks.length}</div>
        </div>

        <div style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 11, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.5 }}>DEBUG STEP 2</div>
          <div style={{ fontSize: 13, color: TEXT, marginTop: 6 }}>useHomeMobile data: {data ? 'OK' : 'NULL'}</div>
          <button onClick={() => setCount(c => c + 1)} style={{ background: NAVY, color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
            Counter: {count}
          </button>
        </div>
      </div>
    </div>
  )
}
