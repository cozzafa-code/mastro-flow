'use client'
import { FC, useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'

// ── COSTANTI ─────────────────────────────────────────────────────
const FAB_SIZE = 58
const LONG_PRESS_MS = 400
const STORAGE_KEY = 'fliwox_fab_pos'

// ── VOCI MENU ────────────────────────────────────────────────────
interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  colorDeep: string
  shadow: string
  action: () => void
}

// ── COMPONENTE ───────────────────────────────────────────────────
interface Props {
  onNuovaCommessa: () => void
  onNuovoImpegno?: () => void
  onNuovaMail?: () => void
}

export const DraggableFAB: FC<Props> = ({ onNuovaCommessa, onNuovoImpegno, onNuovaMail }) => {
  const router = useRouter()
  const pathname = usePathname()

  // Posizione persistita
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const hasDragged = useRef(false)
  const fabRef = useRef<HTMLDivElement>(null)

  // Carica posizione salvata
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPos(JSON.parse(saved))
      } else {
        // Default: basso destra
        setPos({ x: window.innerWidth - FAB_SIZE - 20, y: window.innerHeight - FAB_SIZE - 90 })
      }
    } catch {
      setPos({ x: window.innerWidth - FAB_SIZE - 20, y: window.innerHeight - FAB_SIZE - 90 })
    }
  }, [])

  // Chiudi menu su navigazione
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Chiudi menu su tap fuori
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: TouchEvent | MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('touchstart', handler)
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [menuOpen])

  const savePos = useCallback((x: number, y: number) => {
    const clamped = clampToScreen(x, y)
    setPos(clamped)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped))
  }, [])

  // ── TOUCH HANDLERS ───────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartPos.current = { x: touch.clientX, y: touch.clientY }
    hasDragged.current = false

    // Long press timer
    longPressTimer.current = setTimeout(() => {
      if (!hasDragged.current) {
        setMenuOpen(v => !v)
        // Haptic feedback se disponibile
        if ('vibrate' in navigator) navigator.vibrate(30)
      }
    }, LONG_PRESS_MS)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const start = dragStartPos.current
    if (!start || !pos) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y

    if (!hasDragged.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      hasDragged.current = true
      clearTimeout(longPressTimer.current!)
      setMenuOpen(false)
      setIsDragging(true)
    }

    if (hasDragged.current) {
      const newX = pos.x + dx
      const newY = pos.y + dy
      const clamped = clampToScreen(newX, newY)
      setPos(clamped)
      dragStartPos.current = { x: touch.clientX, y: touch.clientY }
    }
  }, [pos])

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current!)
    setIsDragging(false)

    if (!hasDragged.current) {
      if (menuOpen) {
        // Se menu aperto → chiudi
        setMenuOpen(false)
      } else {
        // Tap semplice → azione contestuale
        handleContextAction()
      }
    } else if (pos) {
      savePos(pos.x, pos.y)
      // Snap al bordo più vicino
      const snapX = pos.x < window.innerWidth / 2
        ? 20
        : window.innerWidth - FAB_SIZE - 20
      savePos(snapX, pos.y)
    }
  }, [pos, menuOpen, savePos])

  // Azione contestuale sul tap (dipende dalla pagina)
  const handleContextAction = useCallback(() => {
    if (pathname === '/commesse' || pathname.startsWith('/commesse')) {
      onNuovaCommessa()
    } else if (pathname === '/agenda') {
      onNuovoImpegno?.()
    } else if (pathname === '/mail') {
      onNuovaMail?.()
    } else {
      // Home o altro → apri menu
      setMenuOpen(v => !v)
    }
  }, [pathname, onNuovaCommessa, onNuovoImpegno, onNuovaMail])

  // Voci menu
  const menuItems: MenuItem[] = [
    {
      id: 'commessa',
      label: 'Nuova commessa',
      icon: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
      color: 'var(--teal)', colorDeep: 'var(--teal-deep)', shadow: 'rgba(20,80,90,0.45)',
      action: () => { setMenuOpen(false); onNuovaCommessa() },
    },
    {
      id: 'impegno',
      label: 'Nuovo impegno',
      icon: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>,
      color: 'var(--red)', colorDeep: 'var(--red-deep)', shadow: 'rgba(200,73,65,0.45)',
      action: () => { setMenuOpen(false); router.push('/agenda') },
    },
    {
      id: 'mail',
      label: 'Nuova mail',
      icon: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>,
      color: 'var(--ocra)', colorDeep: 'var(--ocra-deep)', shadow: 'rgba(200,138,23,0.45)',
      action: () => { setMenuOpen(false); router.push('/mail') },
    },
    {
      id: 'ai',
      label: 'AI fliwoX',
      icon: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8v4l3 3"/></svg>,
      color: 'var(--blue)', colorDeep: 'var(--blue-deep)', shadow: 'rgba(46,63,143,0.45)',
      action: () => { setMenuOpen(false); router.push('/ai') },
    },
    {
      id: 'back',
      label: 'Indietro',
      icon: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
      color: 'var(--surface-3)', colorDeep: 'var(--surface-3)', shadow: 'rgba(60,50,30,0.2)',
      action: () => { setMenuOpen(false); router.back() },
    },
  ]

  if (!pos || typeof document === 'undefined') return null

  // Determina se menu va sopra o sotto il FAB
  const menuGoesUp = pos.y > window.innerHeight / 2

  return createPortal(
    <>
      {/* Overlay sfondo quando menu aperto */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 8998, background: 'rgba(0,0,0,0.2)' }}
          />
        )}
      </AnimatePresence>

      {/* Menu voci */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            style={{
              position: 'fixed',
              left: Math.min(pos.x, window.innerWidth - 220),
              [menuGoesUp ? 'bottom' : 'top']: menuGoesUp
                ? window.innerHeight - pos.y + FAB_SIZE + 10
                : pos.y + FAB_SIZE + 10,
              zIndex: 8999,
              display: 'flex', flexDirection: 'column', gap: 8,
              minWidth: 200,
            }}
          >
            {(menuGoesUp ? menuItems : [...menuItems].reverse()).map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
                onClick={item.action}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: 16,
                  padding: '11px 16px',
                  background: `linear-gradient(160deg, ${item.color}, ${item.colorDeep})`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: item.id === 'back' ? 'var(--ink)' : '#fff',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.06), 0 6px 14px ${item.shadow}, inset 0 3px 5px rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,0,0.18)`,
                  textShadow: item.id === 'back' ? 'none' : '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {/* Highlight */}
                <div style={{ position: 'absolute', top: '12%', left: '10%', width: '28%', height: '30%', background: 'rgba(255,255,255,0.35)', borderRadius: '50%', filter: 'blur(4px)', pointerEvents: 'none' }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{item.icon}</span>
                <span style={{
                  fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
                  letterSpacing: 0.2, position: 'relative', zIndex: 1,
                  whiteSpace: 'nowrap',
                }}>{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB principale */}
      <div
        ref={fabRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: FAB_SIZE,
          height: FAB_SIZE,
          zIndex: 9000,
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Fuzz */}
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: menuOpen ? 'var(--ocra)' : 'var(--teal)',
          filter: 'blur(12px)', opacity: menuOpen ? 0.6 : 0.5, zIndex: -1,
          transition: 'background 0.3s',
          animation: !menuOpen && !isDragging ? 'fab-pulse 2.5s ease infinite' : 'none',
        }} />

        {/* Corpo FAB */}
        <motion.div
          animate={{
            scale: isDragging ? 1.1 : menuOpen ? 1.05 : 1,
            rotate: menuOpen ? 45 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{
            width: FAB_SIZE, height: FAB_SIZE, borderRadius: '50%',
            background: menuOpen
              ? 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'
              : 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
            display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
            boxShadow: `0 0 0 1px rgba(0,0,0,0.08), 0 8px 20px ${menuOpen ? 'rgba(200,138,23,0.55)' : 'rgba(20,80,90,0.5)'}, inset 0 4px 8px rgba(255,255,255,0.28), inset 0 -3px 6px rgba(0,0,0,0.22)`,
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Highlight */}
          <div style={{ position: 'absolute', top: '14%', left: '22%', width: '34%', height: '20%', background: 'rgba(255,255,255,0.45)', borderRadius: '50%', filter: 'blur(3px)', pointerEvents: 'none' }} />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.6" strokeLinecap="round"
            style={{ position: 'relative', zIndex: 1 }}>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </motion.div>

        {/* Label hint al primo avvio */}
        <style>{`
          @keyframes fab-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.15); }
          }
        `}</style>
      </div>
    </>,
    document.body
  )
}

// ── HELPER: CLAMP POSIZIONE ──────────────────────────────────────
function clampToScreen(x: number, y: number): { x: number; y: number } {
  const margin = 10
  const maxX = (typeof window !== 'undefined' ? window.innerWidth : 400) - FAB_SIZE - margin
  const maxY = (typeof window !== 'undefined' ? window.innerHeight : 800) - FAB_SIZE - 80 // spazio bottom nav
  return {
    x: Math.max(margin, Math.min(x, maxX)),
    y: Math.max(80, Math.min(y, maxY)), // non sopra la topbar
  }
}
