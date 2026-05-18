'use client'
import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { FilterType, SortType } from '@/lib/commesse-types'
import { FILTER_LABEL, SORT_LABEL } from '@/lib/commesse-types'

// Portal wrapper per uscire dal phone-screen
const SheetPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
}

const sheetStyle: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
  background: 'linear-gradient(160deg, var(--surface), var(--bg-soft))',
  borderRadius: '28px 28px 0 0',
  boxShadow: '0 -12px 40px rgba(0,0,0,0.2)',
  overflow: 'hidden',
  maxHeight: '80vh',
}

// ── FILTER SHEET ─────────────────────────────────────────────────
interface FilterSheetProps {
  isOpen: boolean
  current: FilterType
  counts: Record<string, number>
  onSelect: (f: FilterType) => void
  onClose: () => void
}

const FILTERS: FilterType[] = [
  'all','appuntamenti','misure','preventivi','conferme',
  'acconti','ordini','materiali','montaggi','da_fatturare'
]

export const FilterSheet: FC<FilterSheetProps> = ({ isOpen, current, counts, onSelect, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <SheetPortal>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} style={overlayStyle}
        />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          style={sheetStyle}
        >
          <Handle />
          <div style={{ padding: '14px 20px 8px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 2, color: 'var(--ink-soft)', marginBottom: 4 }}>FILTRA PER</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Tipo di commessa</div>
          </div>
          <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: '60vh' }}>
            {FILTERS.map(f => {
              const isActive = current === f
              const count = f === 'all' ? counts['all'] : counts[f] || 0
              return (
                <button key={f} onClick={() => onSelect(f)} style={{
                  width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderRadius: 14, padding: '12px 14px',
                  background: isActive ? 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isActive ? 'var(--teal)' : 'transparent', border: `2px solid ${isActive ? 'var(--teal)' : 'var(--surface-3)'}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--teal-deep)' : 'var(--ink)' }}>{FILTER_LABEL[f]}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: isActive ? 'var(--teal)' : 'var(--ink-soft)' }}>{count}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </SheetPortal>
    )}
  </AnimatePresence>
)

// ── SORT SHEET ───────────────────────────────────────────────────
interface SortSheetProps {
  isOpen: boolean
  current: SortType
  onSelect: (s: SortType) => void
  onClose: () => void
}

const SORTS: SortType[] = [
  'updated_desc','created_desc','created_asc','value_desc','value_asc','name_asc','name_desc','phase'
]

export const SortSheet: FC<SortSheetProps> = ({ isOpen, current, onSelect, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <SheetPortal>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} style={overlayStyle}
        />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          style={sheetStyle}
        >
          <Handle />
          <div style={{ padding: '14px 20px 8px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Ordina per</div>
          </div>
          <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: '60vh' }}>
            {SORTS.map(s => {
              const isActive = current === s
              return (
                <button key={s} onClick={() => onSelect(s)} style={{
                  width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderRadius: 14, padding: '12px 14px',
                  background: isActive ? 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: isActive ? 'var(--teal)' : 'transparent', border: `2px solid ${isActive ? 'var(--teal)' : 'var(--surface-3)'}`, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--teal-deep)' : 'var(--ink)' }}>{SORT_LABEL[s]}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </SheetPortal>
    )}
  </AnimatePresence>
)

const Handle: FC = () => (
  <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface-3)' }} />
  </div>
)
