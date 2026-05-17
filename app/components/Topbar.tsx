'use client'
import { FC } from 'react'

interface TopbarProps {
  notificheCount: number
  onSearchOpen: () => void
  onNotificheOpen: () => void
}

export const Topbar: FC<TopbarProps> = ({ notificheCount, onSearchOpen, onNotificheOpen }) => {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 26px 4px', position: 'relative', zIndex: 5,
    }}>
      {/* Brand */}
      <span style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: 28, fontWeight: 600, letterSpacing: -0.5,
        color: 'var(--ink)',
        textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(60,50,30,0.15)',
      }}>
        fliwo<span style={{
          color: 'var(--teal)',
          textShadow: '0 1px 0 rgba(255,255,255,0.5), 0 2px 6px rgba(20,80,90,0.25)',
        }}>X</span>
      </span>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Search btn */}
        <button onClick={onSearchOpen} style={iconBtnStyle}>
          <div style={fuzzStyle('#EAE3D1')} />
          <div style={highlightStyle} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'relative', zIndex: 2 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>

        {/* Bell btn */}
        <button onClick={onNotificheOpen} style={{ ...iconBtnStyle, position: 'relative' }}>
          <div style={fuzzStyle('#EAE3D1')} />
          <div style={highlightStyle} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'relative', zIndex: 2 }}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {notificheCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 11, height: 11, borderRadius: '50%', zIndex: 3,
              background: 'linear-gradient(160deg, var(--red), var(--red-deep))',
              border: '2px solid #FCF7E8',
              boxShadow: '0 1px 3px rgba(165,58,51,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
            }} />
          )}
        </button>

        {/* Avatar */}
        <button style={{
          width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
          color: '#fff', position: 'relative',
          fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          boxShadow: `
            0 0 0 1px rgba(0,0,0,0.08),
            0 6px 14px rgba(20,80,90,0.45),
            0 2px 4px rgba(20,80,90,0.18),
            inset 0 4px 7px rgba(255,255,255,0.2),
            inset 0 -3px 7px rgba(0,0,0,0.22)
          `,
          display: 'grid', placeItems: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: -5, borderRadius: '50%',
            background: 'var(--teal)', filter: 'blur(8px)', opacity: 0.5, zIndex: -1,
          }} />
          <div style={{
            position: 'absolute', top: '14%', left: '22%',
            width: '34%', height: '20%',
            background: 'rgba(255,255,255,0.45)', borderRadius: '50%', filter: 'blur(2.5px)',
          }} />
          <span style={{ position: 'relative', zIndex: 2 }}>T</span>
        </button>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  border: 'none', cursor: 'pointer',
  display: 'grid', placeItems: 'center',
  color: 'var(--ink)', position: 'relative',
  boxShadow: `
    0 0 0 1px rgba(60,50,30,0.05),
    0 6px 14px rgba(60,50,30,0.2),
    0 1px 3px rgba(60,50,30,0.08),
    inset 0 4px 7px rgba(255,255,255,0.7),
    inset 0 -3px 7px rgba(0,0,0,0.06)
  `,
}

const fuzzStyle = (color: string): React.CSSProperties => ({
  position: 'absolute', inset: -4, borderRadius: '50%',
  background: color, filter: 'blur(7px)', opacity: 0.5, zIndex: -1,
})

const highlightStyle: React.CSSProperties = {
  position: 'absolute', top: '14%', left: '24%',
  width: '32%', height: '18%',
  background: 'rgba(255,255,255,0.55)',
  borderRadius: '50%', filter: 'blur(2.5px)', pointerEvents: 'none',
}
