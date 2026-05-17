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
      padding: '16px 22px 4px',
      position: 'relative', zIndex: 5,
    }}>
      {/* Brand */}
      <span style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: 26, fontWeight: 600, letterSpacing: '-0.6px',
        color: 'var(--ink)',
        textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(60,50,30,0.15)',
      }}>
        fliwo<span style={{ color: 'var(--teal)' }}>X</span>
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Search */}
        <button onClick={onSearchOpen} style={iconBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>

        {/* Bell */}
        <button onClick={onNotificheOpen} style={{ ...iconBtnStyle, position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {notificheCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--red)',
              border: '1.5px solid var(--surface)',
            }} />
          )}
        </button>

        {/* Avatar */}
        <button style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
          boxShadow: '0 3px 8px rgba(21,81,89,0.35), inset 0 2px 4px rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 15, fontWeight: 600, color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}>
          T
        </button>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12,
  background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
  boxShadow: '0 3px 8px rgba(60,50,30,0.12), inset 0 2px 3px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.06)',
  border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
