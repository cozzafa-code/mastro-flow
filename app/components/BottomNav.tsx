'use client'
import { FC } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'

interface Props { active?: string; mailCount?: number }

const TABS = [
  { href:'/', key:'home', label:'Home',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><path d="M3 12L12 3l9 9M5 10v10h4v-6h6v6h4V10"/></svg>,
    bg:'linear-gradient(160deg,var(--teal),var(--teal-deep))', shadow:'rgba(20,80,90,0.45)' },
  { href:'/commesse', key:'commesse', label:'Commesse',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
    bg:'linear-gradient(160deg,var(--blue),var(--blue-deep))', shadow:'rgba(46,63,143,0.45)' },
  { href:'/clienti', key:'clienti', label:'Clienti',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    bg:'linear-gradient(160deg,var(--success),#1F5A3D)', shadow:'rgba(47,125,87,0.45)', center:true },
  { href:'/agenda', key:'agenda', label:'Agenda',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    bg:'linear-gradient(160deg,var(--red),var(--red-deep))', shadow:'rgba(200,73,65,0.45)' },
  { href:'/mail', key:'mail', label:'Mail',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>,
    bg:'linear-gradient(160deg,var(--ocra),var(--ocra-deep))', shadow:'rgba(200,138,23,0.45)' },
]

export const BottomNav: FC<Props> = ({ active, mailCount }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const currentKey = active ?? (
    pathname === '/' ? 'home' :
    pathname.startsWith('/commesse') ? 'commesse' :
    pathname.startsWith('/clienti') ? 'clienti' :
    pathname.startsWith('/agenda') ? 'agenda' :
    pathname.startsWith('/mail') ? 'mail' : ''
  )

  const nav = (
    <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', width:'calc(min(100vw,430px) - 32px)', borderRadius:32, background:'linear-gradient(160deg,var(--surface),var(--surface-2))', padding:'12px 8px 14px', display:'flex', justifyContent:'space-around', zIndex:50, boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 14px 32px rgba(60,50,30,0.22),inset 0 6px 14px rgba(255,255,255,0.65)' }}>
      <div style={{ position:'absolute', inset:-8, borderRadius:38, background:'var(--surface-2)', filter:'blur(12px)', opacity:0.5, zIndex:-1 }} />
      {TABS.map(tab => {
        const isActive = currentKey === tab.key
        return (
          <button key={tab.key} onClick={() => router.push(tab.href)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer', padding:'0 6px', minWidth:56 }}>
            <div style={{ width: tab.center ? 52 : 46, height: tab.center ? 52 : 46, borderRadius: tab.center ? 16 : '50%', position:'relative', display:'grid', placeItems:'center', marginTop: tab.center ? -14 : 0,
              background: isActive ? tab.bg : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
              color: isActive ? '#fff' : 'var(--ink-dim)',
              boxShadow: isActive ? `0 0 0 1px rgba(0,0,0,0.06),0 6px 14px ${tab.shadow},inset 0 3px 6px rgba(255,255,255,0.22),inset 0 -3px 6px rgba(0,0,0,0.18)` : '0 0 0 1px rgba(60,50,30,0.05),0 4px 10px rgba(60,50,30,0.15),inset 0 3px 6px rgba(255,255,255,0.6)',
              transition:'all 0.2s',
            }}>
              {isActive && <div style={{ position:'absolute', inset:-5, borderRadius: tab.center ? 20 : '50%', background:tab.bg.includes('teal') ? 'var(--teal)' : tab.bg.includes('blue') ? 'var(--blue)' : tab.bg.includes('success') ? 'var(--success)' : tab.bg.includes('red') ? 'var(--red)' : 'var(--ocra)', filter:'blur(8px)', opacity:0.45, zIndex:-1 }} />}
              <div style={{ position:'absolute', top:'14%', left:'22%', width:'32%', height:'18%', background:'rgba(255,255,255,0.45)', borderRadius:'50%', filter:'blur(2px)', pointerEvents:'none' }} />
              {tab.icon}
              {tab.key==='mail' && (mailCount ?? 0) > 0 && (
                <span style={{ position:'absolute', top:2, right:2, width:14, height:14, borderRadius:'50%', background:'var(--red)', border:'2px solid var(--surface)', display:'grid', placeItems:'center', fontSize:8, color:'#fff', fontWeight:800 }}>{mailCount}</span>
              )}
            </div>
            <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:11, fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--ink)' : 'var(--ink-dim)', transition:'color 0.2s' }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )

  return mounted ? createPortal(nav, document.body) : null
}
