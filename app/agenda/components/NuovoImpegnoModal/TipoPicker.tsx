'use client'
import { FC } from 'react'
import type { TipoImpegno } from '@/lib/agenda-types'
import { TIPI_IMPEGNO } from '@/lib/agenda-types'

const TIPO_LABELS: Record<TipoImpegno, string> = {
  sopralluogo: 'Sopr.', montaggio: 'Mont.', conferma: 'Cons.',
  promemoria: 'Prom.', scadenza: 'Scad.',
}

const TIPO_ICONS: Record<TipoImpegno, React.ReactNode> = {
  sopralluogo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  montaggio:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  conferma:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M16 3h5v5"/><path d="M21 8L11 18l-4-4-7 7"/></svg>,
  promemoria:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  scadenza:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
}

interface Props { value: TipoImpegno; onChange: (t: TipoImpegno) => void }

export const TipoPicker: FC<Props> = ({ value, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
    {TIPI_IMPEGNO.map(t => {
      const isActive = value === t.id
      return (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          background: isActive ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, var(--surface), var(--surface-2))',
          border: 'none', cursor: 'pointer', borderRadius: 14, padding: '10px 4px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          position: 'relative', overflow: 'hidden',
          boxShadow: isActive
            ? '0 0 0 1px rgba(0,0,0,0.08), 0 8px 18px rgba(20,80,90,0.5), inset 0 2px 4px rgba(255,255,255,0.22)'
            : '0 0 0 1px rgba(60,50,30,0.06), 0 3px 8px rgba(60,50,30,0.13), inset 0 2px 4px rgba(255,255,255,0.6)',
          transition: 'all 0.18s',
        }}>
          {isActive && <div style={{ position: 'absolute', inset: -5, borderRadius: 19, background: 'var(--teal)', filter: 'blur(10px)', opacity: 0.45, zIndex: -1 }} />}
          <div style={{ position: 'absolute', top: '8%', left: '14%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(4px)', pointerEvents: 'none' }} />
          <div style={{
            width: 30, height: 30, borderRadius: 10,
            background: isActive ? 'rgba(255,255,255,0.25)' : t.bg,
            color: isActive ? '#fff' : t.color,
            display: 'grid', placeItems: 'center', position: 'relative', zIndex: 2,
            boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.08)',
          }}>
            {TIPO_ICONS[t.id]}
          </div>
          <span style={{
            fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 700,
            color: isActive ? '#fff' : 'var(--ink-2)',
            position: 'relative', zIndex: 2,
            textShadow: isActive ? '0 1px 1px rgba(0,0,0,0.25)' : 'none',
          }}>{TIPO_LABELS[t.id]}</span>
        </button>
      )
    })}
  </div>
)
