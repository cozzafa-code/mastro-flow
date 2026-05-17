'use client'
import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { EventRowProps } from '@/lib/types'

const TIPO_CONFIG = {
  sopralluogo: { bg: 'linear-gradient(135deg, var(--teal), var(--teal-deep))', shadow: 'rgba(21,81,89,0.4)', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )},
  cantiere: { bg: 'linear-gradient(135deg, var(--ocra), var(--ocra-deep))', shadow: 'rgba(200,138,23,0.4)', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="2" strokeLinecap="round">
      <path d="M2 22h20M3 22V7l9-5 9 5v15M11 11h2M11 15h2M11 19h2"/>
    </svg>
  )},
  firma: { bg: 'linear-gradient(135deg, var(--blue), var(--blue-deep))', shadow: 'rgba(46,63,143,0.4)', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
      <path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  )},
  task: { bg: 'linear-gradient(135deg, var(--red), var(--red-deep))', shadow: 'rgba(200,73,65,0.4)', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  )},
}

function formatDurata(min: number): string {
  if (min < 60) return `${min} MIN`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h} ${h === 1 ? 'ORA' : 'ORE'}`
}

export const EventRow: FC<EventRowProps> = ({ evento, isExpanded, isNext, onToggle, onSposta }) => {
  const router = useRouter()
  const tipoConf = TIPO_CONFIG[evento.tipo] ?? TIPO_CONFIG.task

  const handleNavigate = () => {
    if (!evento.indirizzo) return
    const addr = encodeURIComponent(`${evento.indirizzo} ${evento.citta ?? ''}`)
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    window.open(isiOS ? `maps://maps.apple.com/?q=${addr}` : `https://www.google.com/maps/?q=${addr}`)
  }

  const handleCall = () => {
    if (evento.cliente?.telefono) window.location.href = `tel:${evento.cliente.telefono}`
  }

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: isNext
        ? 'linear-gradient(135deg, var(--ocra-bg), var(--ocra-mid))'
        : 'linear-gradient(145deg, var(--surface), var(--surface-2))',
      boxShadow: isNext
        ? '0 4px 14px rgba(232,167,38,0.2), inset 0 2px 4px rgba(255,255,255,0.6)'
        : '0 3px 10px rgba(60,50,30,0.1), inset 0 2px 3px rgba(255,255,255,0.55)',
      position: 'relative',
    }}>
      {/* Badge PROSSIMO */}
      {isNext && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, var(--ocra), var(--ocra-deep))',
          borderRadius: 20, padding: '3px 12px', fontSize: 9, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
          color: 'rgba(0,0,0,0.65)',
          boxShadow: '0 3px 8px rgba(232,167,38,0.4)',
          zIndex: 2,
        }}>PROSSIMO</div>
      )}

      {/* Top row */}
      <button
        onClick={() => onToggle(evento.id)}
        style={{
          width: '100%', border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: 10, padding: isNext ? '18px 14px 12px' : '12px 14px',
          textAlign: 'left',
        }}
      >
        {/* Time block */}
        <div style={{
          flexShrink: 0, borderRadius: 12,
          padding: '7px 9px',
          background: isNext
            ? 'linear-gradient(135deg, var(--ocra), var(--ocra-deep))'
            : 'linear-gradient(135deg, var(--teal-bg), var(--teal-soft))',
          boxShadow: isNext
            ? '0 3px 8px rgba(232,167,38,0.4), inset 0 2px 3px rgba(255,255,255,0.4)'
            : '0 2px 6px rgba(21,81,89,0.15), inset 0 1px 2px rgba(255,255,255,0.6)',
          textAlign: 'center', minWidth: 54,
        }}>
          <div style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 16, fontWeight: 600,
            color: isNext ? 'rgba(0,0,0,0.75)' : 'var(--teal)',
            lineHeight: 1.1,
          }}>{evento.ora_inizio}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, fontWeight: 600,
            color: isNext ? 'rgba(0,0,0,0.5)' : 'var(--teal-deep)',
            letterSpacing: 0.5, marginTop: 2,
          }}>{formatDurata(evento.durata_min)}</div>
        </div>

        {/* Icon type */}
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: tipoConf.bg,
          boxShadow: `0 3px 8px ${tipoConf.shadow}, inset 0 2px 3px rgba(255,255,255,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {tipoConf.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15, fontWeight: 700,
            color: 'var(--ink)', marginBottom: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{evento.titolo}</div>
          {evento.indirizzo && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--ink-dim)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              </svg>
              {evento.indirizzo}{evento.citta ? ` · ${evento.citta}` : ''}
            </div>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: isExpanded
              ? 'linear-gradient(135deg, var(--teal), var(--teal-deep))'
              : 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
            boxShadow: isExpanded
              ? '0 3px 8px rgba(21,81,89,0.35)'
              : '0 2px 4px rgba(60,50,30,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={isExpanded ? '#fff' : 'var(--ink-dim)'} strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {evento.cliente?.nome && (
                  <Tag icon={<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="3"/><path d="M4 22v-2a8 8 0 0116 0v2"/></svg>}>
                    {evento.cliente.nome.toUpperCase()}
                  </Tag>
                )}
                {evento.commessa_ref && <Tag>{evento.commessa_ref}</Tag>}
                {evento.commessa?.materiale && <Tag>{evento.commessa.materiale.toUpperCase()}</Tag>}
              </div>

              {/* Note */}
              {evento.note && (
                <div style={{
                  borderRadius: 12, padding: '10px 12px',
                  background: 'rgba(0,0,0,0.04)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08), inset 0 -1px 2px rgba(255,255,255,0.4)',
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, fontWeight: 600, letterSpacing: 1.5,
                    color: 'var(--ink-soft)', marginBottom: 4,
                  }}>NOTA SOPRALLUOGO</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    {evento.note}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 7 }}>
                <ActionBtn primary onClick={handleNavigate} icon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                  </svg>
                }>Naviga</ActionBtn>
                <ActionBtn onClick={handleCall} icon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6z"/>
                  </svg>
                }>Chiama</ActionBtn>
                <ActionBtn onClick={() => router.push(`/commesse/${evento.commessa_id}`)} icon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                  </svg>
                }>Commessa</ActionBtn>
                <ActionBtn onClick={() => onSposta(evento)} icon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                }>Sposta</ActionBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── TAG ──────────────────────────────────────────────────────────
const Tag: FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    borderRadius: 8, padding: '4px 9px',
    background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
    boxShadow: '0 2px 4px rgba(60,50,30,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 600, letterSpacing: 1,
    color: 'var(--ink-2)',
  }}>
    {icon}{children}
  </span>
)

// ── ACTION BTN ───────────────────────────────────────────────────
const ActionBtn: FC<{
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  primary?: boolean
}> = ({ children, icon, onClick, primary }) => (
  <button onClick={onClick} style={{
    flex: 1, border: 'none', cursor: 'pointer',
    borderRadius: 12, padding: '9px 4px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: primary
      ? 'linear-gradient(135deg, var(--teal), var(--teal-deep))'
      : 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
    boxShadow: primary
      ? '0 4px 10px rgba(21,81,89,0.35), inset 0 2px 3px rgba(255,255,255,0.2)'
      : '0 2px 6px rgba(60,50,30,0.1), inset 0 2px 3px rgba(255,255,255,0.55)',
    color: primary ? '#fff' : 'var(--ink-2)',
    position: 'relative',
  }}>
    {/* Fuzz */}
    <div style={{
      position: 'absolute', inset: -2, borderRadius: 13,
      background: 'inherit', filter: 'blur(4px)', opacity: 0.4, zIndex: -1,
    }} />
    <span style={{ color: 'inherit' }}>{icon}</span>
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 8, fontWeight: 600, letterSpacing: 0.8, color: 'inherit',
    }}>{children}</span>
  </button>
)
