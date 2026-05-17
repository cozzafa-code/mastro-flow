'use client'
import { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  mailCount: number
}

const TABS = [
  {
    href: '/', label: 'Home',
    color: 'var(--teal)', colorDeep: 'var(--teal-deep)', shadow: 'rgba(21,81,89,0.4)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 12L12 3l9 9M5 10v10h4v-6h6v6h4V10"/></svg>,
  },
  {
    href: '/commesse', label: 'Commesse',
    color: 'var(--blue)', colorDeep: 'var(--blue-deep)', shadow: 'rgba(46,63,143,0.4)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
  },
  {
    href: '/agenda', label: 'Agenda',
    color: 'var(--red)', colorDeep: 'var(--red-deep)', shadow: 'rgba(200,73,65,0.4)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: '/mail', label: 'Mail',
    color: 'var(--ocra)', colorDeep: 'var(--ocra-deep)', shadow: 'rgba(200,138,23,0.4)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>,
    badge: true,
  },
]

export const BottomNav: FC<BottomNavProps> = ({ mailCount }) => {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'absolute', bottom: 16, left: 16, right: 16,
      borderRadius: 24,
      background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
      boxShadow: '0 8px 24px rgba(60,50,30,0.18), inset 0 3px 6px rgba(255,255,255,0.65), inset 0 -2px 4px rgba(0,0,0,0.05)',
      padding: '10px 8px 12px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 50,
    }}>
      {/* Fuzz sotto */}
      <div style={{
        position: 'absolute', inset: -5, borderRadius: 26,
        background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
        filter: 'blur(8px)', opacity: 0.55, zIndex: -1,
      }} />

      {TABS.map(tab => {
        const isActive = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href)

        return (
          <Link key={tab.href} href={tab.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            textDecoration: 'none', flex: 1,
          }}>
            {/* Bubble */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 46, height: 46, borderRadius: 16,
                background: isActive
                  ? `linear-gradient(135deg, ${tab.color}, ${tab.colorDeep})`
                  : 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
                boxShadow: isActive
                  ? `0 5px 14px ${tab.shadow}, inset 0 2px 4px rgba(255,255,255,0.25)`
                  : '0 2px 6px rgba(60,50,30,0.1), inset 0 2px 3px rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? '#fff' : 'var(--ink-dim)',
                transition: 'all 0.2s',
                position: 'relative',
              }}>
                {/* Fuzz bubble */}
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: -3, borderRadius: 17,
                    background: `linear-gradient(135deg, ${tab.color}, ${tab.colorDeep})`,
                    filter: 'blur(5px)', opacity: 0.4, zIndex: -1,
                  }} />
                )}
                {/* Highlight */}
                <div style={{
                  position: 'absolute', top: '14%', left: '20%',
                  width: '32%', height: '18%',
                  background: 'rgba(255,255,255,0.45)',
                  borderRadius: '50%', filter: 'blur(2px)',
                  pointerEvents: 'none',
                }} />
                {tab.icon}
              </div>

              {/* Badge mail */}
              {tab.badge && mailCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'var(--red)',
                  color: '#fff', fontSize: 9, fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--surface)',
                  boxShadow: '0 2px 6px rgba(200,73,65,0.4)',
                }}>{mailCount > 9 ? '9+' : mailCount}</span>
              )}
            </div>

            {/* Label */}
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 10, fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
              letterSpacing: 0.3,
            }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
