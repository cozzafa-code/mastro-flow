// components/TimelineDrawer.tsx
// Drawer slide-from-right che mostra <Timeline> in overlay sopra il Centro Comando.
// Sempre accessibile in qualunque fase. Backdrop blur. Animazione 0.28s.
// NON modifica Timeline.tsx — wrappa il componente esistente con tutte le sue props.

'use client'

import React, { useEffect } from 'react'
import Timeline from './Timeline'

type ModuloTimeline =
  | "commessa" | "cliente" | "fornitore" | "squadra" | "operatore"
  | "fattura" | "ordine" | "vano" | "preventivo" | "montaggio" | "altro"

interface TimelineDrawerProps {
  open: boolean
  onClose: () => void
  modulo: ModuloTimeline
  entitaId: string
  aziendaId?: string
  titolo?: string
  // Callback inoltrate a <Timeline>
  onChiamata?: (telefono: string) => void
  onWhatsApp?: (telefono: string, msg?: string) => void
  onEmail?: (email: string, oggetto?: string) => void
  onAprivanoId?: (vanoId: string) => void
  onApriCommessaId?: (commessaId: string) => void
}

export default function TimelineDrawer({
  open,
  onClose,
  modulo,
  entitaId,
  aziendaId,
  titolo,
  onChiamata,
  onWhatsApp,
  onEmail,
  onAprivanoId,
  onApriCommessaId,
}: TimelineDrawerProps) {
  // ESC chiude il drawer
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll quando drawer aperto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9700,
          background: 'rgba(15,27,45,0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'mastroFadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer slide-from-right */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(88%, 460px)',
          background: '#F7F7F5',
          zIndex: 9710,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 40px rgba(15,27,45,0.25)',
          animation: 'mastroSlideInRight 0.28s ease-out',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Header drawer */}
        <div style={{
          background: 'linear-gradient(145deg, #2D5A87 0%, #1E3A5F 50%, #0F1B2D 100%)',
          color: '#fff',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            aria-label="Chiudi storia"
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(255,255,255,0.18)',
              border: 'none', color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontSize: 18, fontWeight: 700,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              letterSpacing: '-0.2px',
              display: 'flex', alignItems: 'center', gap: 8,
              lineHeight: 1.2,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={12} cy={12} r={10}/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {titolo || 'Storia commessa'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, letterSpacing: 0.3 }}>
              Cronologia completa · documenti · azioni
            </div>
          </div>
        </div>

        {/* Body scrollabile contenente Timeline esistente */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: '#F7F7F5',
        }}>
          <Timeline
            modulo={modulo}
            entitaId={entitaId}
            aziendaId={aziendaId}
            maxHeight={undefined}
            titolo={undefined}
            onChiamata={onChiamata}
            onWhatsApp={onWhatsApp}
            onEmail={onEmail}
            onAprivanoId={onAprivanoId}
            onApriCommessaId={onApriCommessaId}
          />
        </div>
      </div>

      {/* Animazioni inline (non sporcano global CSS) */}
      <style>{`
        @keyframes mastroSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes mastroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
