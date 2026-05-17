'use client'
import { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  mailCount: number
}

const TABS = [
  {
    href: '/', key: 'home', label: 'Home',
    bg: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
    shadow: 'rgba(20,80,90,0.45)',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}><path d="M3 12L12 3l9 9M5 10v10h4v-6h6v6h4V10"/></svg>,
  },
  {
    href: '/commesse', key: 'commesse', label: 'Commesse',
    bg: 'linear-gradient(160deg, var(--blue), var(--blue-deep))',
    shadow: 'rgba(46,63,143,0.45)',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
  },
  {
    href: '/agenda', key: 'agenda', label: 'Agenda',
    bg: 'linear-gradient(160deg, var(--red), var(--red-deep))',
    shadow: 'rgba(200,73,65,0.45)',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: '/mail', key: 'mail', label: 'Mail', badge: true,
    bg: 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))',
    shadow: 'rgba(200,138,23,0.45)',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>,
  },
]

export const BottomNav: FC<BottomNavProps> = ({ mailCount }) => {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, right: 16,
      borderRadius: 32,
      background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
      padding: '12px 8px 14px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 50,
      boxShadow: `
        0 0 0 1px rgba(60,50,30,0.05),
        0 14px 32px rgba(60,50,30,0.22),
        0 4px 10px rgba(60,50,30,0.1),
        inset 0 6px 14px rgba(255,255,255,0.65),
        inset 0 -3px 7px rgba(0,0,0,0.06)
      `,
      position: 'absolute',
    }}>
      {/* Fuzz */}
      <div style={{
        position: 'absolute', inset: -7, borderRadius: 40,
        background: 'var(--surface-2)', filter: 'blur(12px)', opacity: 0.5, zIndex: -1,
      }} />
      {/* Highlight */}
      <div style={{
        position: 'absolute', top: '8%', left: '14%',
        width: '30%', height: '14%',
        background: 'rgba(255,255,255,0.55)', borderRadius: '50%',
        filter: 'blur(8px)', pointerEvents: 'none',
      }} />

      {TABS.map(tab => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

        return (
          <Link key={tab.href} href={tab.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            textDecoration: 'none', flex: 1, position: 'relative',
          }}>
            {/* Badge */}
            {tab.badge && mailCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: 14,
                minWidth: 18, height: 18, borderRadius: 999,
                background: 'linear-gradient(160deg, var(--red), var(--red-deep))',
                color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 800,
                display: 'grid', placeItems: 'center',
                padding: '0 5px',
                border: '2px solid var(--surface)',
                boxShadow: '0 2px 5px rgba(165,58,51,0.5), inset 0 1px 2px rgba(255,255,255,0.3)',
                zIndex: 3,
              }}>{mailCount > 9 ? '9+' : mailCount}</span>
            )}

            {/* Bubble */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: isActive ? tab.bg : 'linear-gradient(160deg, var(--surface-2), var(--surface-3))',
              display: 'grid', placeItems: 'center',
              color: isActive ? '#fff' : 'var(--ink-dim)',
              position: 'relative',
              boxShadow: isActive
                ? `inset 0 4px 7px rgba(255,255,255,0.28), inset 0 -3px 6px rgba(0,0,0,0.2), 0 4px 10px ${tab.shadow}, 0 0 0 1px rgba(0,0,0,0.06)`
                : 'inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 3px rgba(0,0,0,0.07), 0 3px 6px rgba(60,50,30,0.15)',
              transition: 'all 0.2s',
            }}>
              {/* Fuzz bubble */}
              {isActive && (
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  background: tab.bg, filter: 'blur(7px)', opacity: 0.45, zIndex: -1,
                }} />
              )}
              {/* Highlight */}
              <div style={{
                position: 'absolute', top: '14%', left: '22%',
                width: '32%', height: '18%',
                background: 'rgba(255,255,255,0.45)', borderRadius: '50%',
                filter: 'blur(2.5px)', pointerEvents: 'none',
              }} />
              {tab.icon}
            </div>

            <span style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 10, fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--ink)' : 'var(--ink-dim)',
              letterSpacing: 0.2,
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
