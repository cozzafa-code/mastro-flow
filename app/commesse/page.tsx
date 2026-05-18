'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCommesse } from '@/hooks/useCommesse'
import { CommessaCard } from './components/CommessaCard'
import { CommessaRow } from './components/CommessaRow'
import { CommessaTile } from './components/CommessaTile'
import { FilterSheet, SortSheet } from './components/Sheets'
import { NuovaCommessa } from './components/NuovaCommessa/index'
import { BottomNav } from '@/app/components/BottomNav'
import { Topbar } from '@/app/components/Topbar'
import { FILTER_LABEL } from '@/lib/commesse-types'
import type { Layout } from '@/lib/commesse-types'

function CommesseContent() {
  const {
    layout, setLayout, filter, setFilter, sort, setSort,
    search, setSearch, commesse, counts, loading,
    filterSheetOpen, setFilterSheetOpen,
    sortSheetOpen, setSortSheetOpen,
    ricarica,
  } = useCommesse()

  const [nuovaModalOpen, setNuovaModalOpen] = useState(false)
  const totalCount = counts['all'] ?? commesse.length

  return (
    <div className="phone-screen">
      {/* Topbar condiviso */}
      <Topbar
        notificheCount={0}
        onSearchOpen={() => {}}
      />

      {/* Scrollable content */}
      <div className="page">

        {/* Hero */}
        <div style={{ padding: '14px 26px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2.5,
              color: 'var(--ink-dim)', textTransform: 'uppercase', fontWeight: 600,
              textShadow: '0 1px 0 rgba(255,255,255,0.5)', marginBottom: 6,
            }}>
              {'\u2014'} COMMESSE
            </div>
            <h1 style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 30, fontWeight: 600,
              letterSpacing: -0.9, lineHeight: 1, color: 'var(--ink)',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}>
              <span style={{ color: 'var(--teal)' }}>{totalCount}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-dim)', letterSpacing: 0, marginLeft: 6 }}>
                attive
              </span>
            </h1>
          </div>

          {/* Bottone Nuova commessa */}
          <button
            onClick={() => setNuovaModalOpen(true)}
            style={{
              border: 'none', cursor: 'pointer',
              borderRadius: 16, padding: '10px 16px',
              background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))',
              display: 'flex', alignItems: 'center', gap: 7,
              position: 'relative',
              boxShadow: `
                0 0 0 1px rgba(0,0,0,0.08),
                0 8px 18px rgba(20,80,90,0.4),
                inset 0 4px 7px rgba(255,255,255,0.2),
                inset 0 -3px 6px rgba(0,0,0,0.2)
              `,
            }}
          >
            {/* Fuzz */}
            <div style={{
              position: 'absolute', inset: -4, borderRadius: 18,
              background: 'var(--teal)', filter: 'blur(8px)', opacity: 0.4, zIndex: -1,
            }} />
            {/* Highlight */}
            <div style={{
              position: 'absolute', top: '14%', left: '18%',
              width: '28%', height: '30%',
              background: 'rgba(255,255,255,0.35)', borderRadius: '50%', filter: 'blur(3px)',
            }} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.8" strokeLinecap="round"
              style={{ position: 'relative', zIndex: 1 }}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 14, fontWeight: 700, color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              position: 'relative', zIndex: 1,
              whiteSpace: 'nowrap',
            }}>
              Nuova commessa
            </span>
          </button>
        </div>

        {/* View switch */}
        <div style={{
          margin: '14px 20px 0',
          background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
          borderRadius: 16, padding: 4,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.12), inset 0 -1px 2px rgba(255,255,255,0.5)',
        }}>
          {(['card','lista','griglia'] as Layout[]).map((l, i) => {
            const isActive = layout === l
            const icons = [
              <svg key="c" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="13" width="18" height="6" rx="1"/></svg>,
              <svg key="l" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
              <svg key="g" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>,
            ]
            return (
              <button key={l} onClick={() => setLayout(l)} style={{
                background: isActive ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '9px 0',
                fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: 1.2, color: isActive ? '#fff' : 'var(--ink-dim)',
                textTransform: 'uppercase', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: isActive ? 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.15), 0 3px 8px rgba(20,80,90,0.35)' : 'none',
                textShadow: isActive ? '0 1px 1px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s',
              }}>
                {icons[i]}
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            )
          })}
        </div>

        {/* Filter bar */}
        <div style={{ margin: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button onClick={() => setFilterSheetOpen(true)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '6px 8px', display: 'inline-flex', alignItems: 'center', gap: 8,
            borderRadius: 10,
          }}>
            <span style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
              color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              {FILTER_LABEL[filter]}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800,
                color: 'var(--teal)', background: 'var(--teal-bg)',
                padding: '1px 7px', borderRadius: 999,
                boxShadow: 'inset 0 1px 2px rgba(20,80,90,0.15)',
              }}>
                {filter === 'all' ? totalCount : (counts[filter] || 0)}
              </span>
            </span>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
              display: 'grid', placeItems: 'center', position: 'relative',
              boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(60,50,30,0.12)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </span>
          </button>

          <button onClick={() => setSortSheetOpen(true)} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
            display: 'grid', placeItems: 'center', color: 'var(--ink-2)', position: 'relative',
            boxShadow: '0 0 0 1px rgba(60,50,30,0.05), 0 3px 7px rgba(60,50,30,0.15), inset 0 3px 5px rgba(255,255,255,0.55)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}>
              <path d="M3 6h18M6 12h12M10 18h4"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div style={{
          margin: '12px 20px 0',
          background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
          borderRadius: 14, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: 'inset 0 3px 6px rgba(60,50,30,0.12), inset 0 -1px 2px rgba(255,255,255,0.5)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2.2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cliente, codice, indirizzo…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            name="fliwox-commesse-search"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--ink)',
            }}
          />
        </div>

        {/* Lista commesse */}
        <div style={{ padding: '14px 20px 0' }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{
                    height: layout === 'card' ? 180 : layout === 'lista' ? 60 : 140,
                    borderRadius: 22, marginBottom: 12,
                    background: 'linear-gradient(160deg, var(--surface-2), var(--surface-3))',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)',
                    animation: 'pulse-dot 1.5s ease infinite',
                  }} />
                ))}
              </motion.div>
            ) : commesse.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '40px 0' }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
                  Nessuna commessa
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>
                  {filter !== 'all' ? 'Cambia filtro per vederne altre' : 'Crea la prima commessa'}
                </div>
              </motion.div>
            ) : layout === 'card' ? (
              <motion.div key="card" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {commesse.map(c => <CommessaCard key={c.id} commessa={c} />)}
              </motion.div>
            ) : layout === 'lista' ? (
              <motion.div key="lista" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: -6, borderRadius: 28,
                  background: 'var(--surface-2)', filter: 'blur(10px)', opacity: 0.45, zIndex: -1,
                }} />
                <div style={{
                  background: 'linear-gradient(160deg, var(--surface), var(--surface-2))',
                  borderRadius: 22, padding: 6,
                  boxShadow: '0 0 0 1px rgba(60,50,30,0.05), 0 10px 22px rgba(60,50,30,0.16), inset 0 4px 8px rgba(255,255,255,0.55)',
                  overflow: 'hidden',
                }}>
                  {commesse.map((c, i) => <CommessaRow key={c.id} commessa={c} isFirst={i === 0} />)}
                </div>
              </motion.div>
            ) : (
              <motion.div key="griglia" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {commesse.map(c => <CommessaTile key={c.id} commessa={c} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bottom-spacer" />
      </div>

      {/* Bottom nav - Commesse attiva */}
      <BottomNav mailCount={0} activeTab="commesse" />

      {/* Sheets */}
      <FilterSheet
        isOpen={filterSheetOpen}
        current={filter}
        counts={counts}
        onSelect={setFilter}
        onClose={() => setFilterSheetOpen(false)}
      />
      <SortSheet
        isOpen={sortSheetOpen}
        current={sort}
        onSelect={setSort}
        onClose={() => setSortSheetOpen(false)}
      />
      {/* Modal nuova commessa */}
      <NuovaCommessa
        isOpen={nuovaModalOpen}
        onClose={() => setNuovaModalOpen(false)}
        onCreata={() => { setNuovaModalOpen(false); ricarica() }}
      />
    </div>
  )
}

export default function CommessePage() {
  return (
    <Suspense>
      <CommesseContent />
    </Suspense>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'linear-gradient(160deg, #FCF7E8, var(--surface-2))',
  border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
  color: 'var(--ink)', position: 'relative',
  boxShadow: '0 0 0 1px rgba(60,50,30,0.05), 0 6px 14px rgba(60,50,30,0.2), inset 0 4px 7px rgba(255,255,255,0.7), inset 0 -3px 7px rgba(0,0,0,0.06)',
}
