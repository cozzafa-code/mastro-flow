'use client'
import { FC, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { searchAll } from '@/lib/supabase/queries'
import type { SearchResult } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  evento: '📅',
  commessa: '📁',
  cliente: '👤',
}

const TYPE_LABEL: Record<string, string> = {
  evento: 'Evento',
  commessa: 'Commessa',
  cliente: 'Cliente',
}

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchPanel: FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await searchAll(query)
      setResults(res)
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleSelect = (r: SearchResult) => {
    router.push(r.link)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(3px)',
            }}
          />

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: 70, left: 16, right: 16,
              zIndex: 101,
              background: 'linear-gradient(145deg, var(--surface), var(--bg-soft))',
              borderRadius: 20,
              boxShadow: '0 12px 36px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px',
              borderBottom: results.length > 0 ? '1px solid var(--line)' : 'none',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cerca eventi, commesse, clienti…"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 15, fontWeight: 600, color: 'var(--ink)',
                }}
              />
              {loading && (
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid var(--teal-soft)',
                  borderTopColor: 'var(--teal)',
                  animation: 'spin 0.6s linear infinite',
                }} />
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {results.map(r => (
                  <button key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)} style={{
                    width: '100%', border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    padding: '12px 16px',
                    display: 'flex', gap: 12, alignItems: 'center',
                    borderBottom: '1px solid var(--line)',
                  }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(145deg, var(--surface-2), var(--surface-3))',
                      boxShadow: '0 2px 6px rgba(60,50,30,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>{TYPE_ICON[r.type]}</span>
                    <div>
                      <div style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 14, fontWeight: 700, color: 'var(--ink)',
                      }}>{r.label}</div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, letterSpacing: 0.5,
                        color: 'var(--ink-soft)',
                      }}>
                        {TYPE_LABEL[r.type]}{r.sublabel ? ` · ${r.sublabel}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div style={{
                padding: '20px 16px', textAlign: 'center',
                color: 'var(--ink-soft)', fontSize: 13,
                fontFamily: "'Nunito', sans-serif",
              }}>
                Nessun risultato per «{query}»
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
