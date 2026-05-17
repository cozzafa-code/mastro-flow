'use client'
import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Notifica } from '@/lib/types'
import { segnaNotificaLetta } from '@/lib/supabase/queries'

const TIPO_ICON = {
  evento: '📅',
  commessa: '📁',
  sistema: '⚙️',
  priorita: '⚠️',
}

interface NotifichePanelProps {
  isOpen: boolean
  notifiche: Notifica[]
  onClose: () => void
  onAggiorna: () => void
}

export const NotifichePanel: FC<NotifichePanelProps> = ({
  isOpen, notifiche, onClose, onAggiorna
}) => {
  const handleLeggi = async (id: string) => {
    await segnaNotificaLetta(id)
    onAggiorna()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: '82%', zIndex: 101,
              background: 'linear-gradient(160deg, var(--surface), var(--bg-soft))',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
              borderRadius: '24px 0 0 24px',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 18px 14px',
              borderBottom: '1px solid var(--line)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, letterSpacing: 2, color: 'var(--ink-soft)',
                  textTransform: 'uppercase', marginBottom: 3,
                }}>NOTIFICHE</div>
                <div style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 20, fontWeight: 600, color: 'var(--ink)',
                }}>
                  {notifiche.filter(n => !n.letta).length > 0
                    ? `${notifiche.filter(n => !n.letta).length} nuove`
                    : 'Tutto letto'}
                </div>
              </div>
              <button onClick={onClose} style={{
                width: 36, height: 36, borderRadius: 11, border: 'none',
                background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
                boxShadow: '0 2px 6px rgba(60,50,30,0.12), inset 0 1px 2px rgba(255,255,255,0.6)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--ink-dim)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {notifiche.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 0',
                  color: 'var(--ink-soft)', fontSize: 14,
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  Nessuna notifica
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifiche.map(n => (
                    <button key={n.id} onClick={() => handleLeggi(n.id)} style={{
                      width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: 14, padding: '12px 14px',
                      background: n.letta
                        ? 'linear-gradient(145deg, var(--surface), var(--surface-2))'
                        : 'linear-gradient(145deg, var(--teal-bg), var(--teal-soft))',
                      boxShadow: n.letta
                        ? '0 2px 6px rgba(60,50,30,0.08), inset 0 1px 2px rgba(255,255,255,0.5)'
                        : '0 3px 10px rgba(21,81,89,0.12), inset 0 1px 2px rgba(255,255,255,0.5)',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>
                        {TIPO_ICON[n.tipo]}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: 13, fontWeight: n.letta ? 600 : 800,
                          color: 'var(--ink)', marginBottom: 2,
                        }}>{n.titolo}</div>
                        {n.body && (
                          <div style={{
                            fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.4,
                          }}>{n.body}</div>
                        )}
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9, color: 'var(--ink-soft)', marginTop: 4,
                          letterSpacing: 0.5,
                        }}>
                          {new Date(n.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {!n.letta && (
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--teal)', flexShrink: 0, marginTop: 4,
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
