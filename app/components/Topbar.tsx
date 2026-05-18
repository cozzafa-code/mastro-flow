'use client'
import { FC } from 'react'

interface TopbarProps {
  notificheCount: number
  onSearchOpen: () => void
  onNotificheOpen?: () => void
  onNuovaCommessa?: () => void
}

export const Topbar: FC<TopbarProps> = ({ notificheCount, onSearchOpen, onNotificheOpen, onNuovaCommessa }) => {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 22px 4px', position: 'relative', zIndex: 5,
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

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

        {/* + Nuova commessa — solo se passata la prop */}
        {onNuovaCommessa && (
          <button onClick={onNuovaCommessa} style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
            border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center', position: 'relative',
            boxShadow: `0 0 0 1px rgba(0,0,0,0.08), 0 6px 14px rgba(20,80,90,0.4),
              inset 0 4px 7px rgba(255,255,255,0.2), inset 0 -3px 7px rgba(0,0,0,0.18)`,
          }}>
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'var(--teal)', filter: 'blur(7px)', opacity: 0.45, zIndex: -1 }} />
            <div style={{ position: 'absolute', top: '14%', left: '22%', width: '34%', height: '20%', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        )}

        {/* Search */}
        <button onClick={onSearchOpen} style={iconBtnStyle}>
          <div style={fuzzStyle} />
          <div style={highlightStyle} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>

        {/* Bell */}
        {onNotificheOpen && (
          <button onClick={onNotificheOpen} style={{ ...iconBtnStyle, position: 'relative' }}>
            <div style={fuzzStyle} />
            <div style={highlightStyle} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {notificheCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 11, height: 11, borderRadius: '50%', zIndex: 3,
                background: 'linear-gradient(160deg, var(--red), var(--red-deep))',
                border: '2px solid #FCF7E8',
                boxShadow: '0 1px 3px rgba(165,58,51,0.5)',
              }} />
            )}
          </button>
        )}

        {/* Avatar */}
        <button style={{
          width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
          color: '#fff', position: 'relative',
          fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          boxShadow: `0 0 0 1px rgba(0,0,0,0.08), 0 6px 14px rgba(20,80,90,0.45),
            inset 0 4px 7px rgba(255,255,255,0.2), inset 0 -3px 7px rgba(0,0,0,0.22)`,
          display: 'grid', placeItems: 'center',
        }}>
          <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: 'var(--teal)', filter: 'blur(8px)', opacity: 0.5, zIndex: -1 }} />
          <div style={{ position: 'absolute', top: '14%', left: '22%', width: '34%', height: '20%', background: 'rgba(255,255,255,0.45)', borderRadius: '50%', filter: 'blur(2.5px)' }} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
  color: 'var(--ink)', position: 'relative',
  boxShadow: `0 0 0 1px rgba(60,50,30,0.05), 0 6px 14px rgba(60,50,30,0.2),
    inset 0 4px 7px rgba(255,255,255,0.7), inset 0 -3px 7px rgba(0,0,0,0.06)`,
}

const fuzzStyle: React.CSSProperties = {
  position: 'absolute', inset: -4, borderRadius: '50%',
  background: 'var(--surface-2)', filter: 'blur(7px)', opacity: 0.5, zIndex: -1,
}

const highlightStyle: React.CSSProperties = {
  position: 'absolute', top: '14%', left: '24%', width: '32%', height: '18%',
  background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(2.5px)', pointerEvents: 'none',
}
