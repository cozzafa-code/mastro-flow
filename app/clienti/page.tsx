'use client'
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useClienti, type ClientiFiltro } from '@/hooks/useClienti'
import { NuovoClienteModal } from './components/NuovoClienteModal'
import { BottomNav } from '@/app/components/BottomNav'
import { getInitials, getAvatarColor, STATO_COLOR, exportClientiCSV } from '@/lib/clienti-types'
import type { Cliente } from '@/lib/clienti-types'

const FILTRI: { id: ClientiFiltro; label: string }[] = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'attivo', label: 'Attivi' },
  { id: 'lead', label: 'Lead' },
  { id: 'vip', label: '⭐ VIP' },
  { id: 'pausa', label: 'In pausa' },
  { id: 'perso', label: 'Persi' },
]

export default function ClientiPage() {
  const router = useRouter()
  const { clienti, loading, filtro, setFiltro, search, setSearch, nuovoOpen, setNuovoOpen, reload, counts } = useClienti()

  return (
    <div className="phone-screen">
      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px 4px', zIndex:5, position:'relative' }}>
        <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:28, fontWeight:600, letterSpacing:-0.5, color:'var(--ink)', textShadow:'0 1px 0 rgba(255,255,255,0.6)' }}>
          fliwo<span style={{ color:'var(--teal)' }}>X</span>
        </span>
        <div style={{ display:'flex', gap:8 }}>
          {/* Export CSV */}
          <button onClick={() => exportClientiCSV(filtro === 'tutti' ? undefined : filtro)} style={iconBtn}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          {/* + Nuovo cliente */}
          <button onClick={() => setNuovoOpen(true)} style={{
            ...iconBtn,
            background:'linear-gradient(160deg,var(--teal),var(--teal-deep))',
            boxShadow:'0 0 0 1px rgba(0,0,0,0.08),0 6px 14px rgba(20,80,90,0.4),inset 0 4px 7px rgba(255,255,255,0.2)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          {/* Avatar */}
          <div style={{ ...iconBtn, background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', fontFamily:"'Fredoka',sans-serif", fontSize:17, fontWeight:700, color:'#fff', display:'grid', placeItems:'center' }}>T</div>
        </div>
      </div>

      <div className="page">
        {/* Hero */}
        <div style={{ padding:'12px 22px 8px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, letterSpacing:2.5, color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:4 }}>— CLIENTI</div>
            <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:30, fontWeight:600, letterSpacing:-0.9, lineHeight:1, color:'var(--ink)' }}>
              <span style={{ color:'var(--teal)' }}>{clienti.length}</span>
              <span style={{ fontSize:15, fontWeight:500, color:'var(--ink-dim)', marginLeft:6 }}>nel database</span>
            </h1>
          </div>
          {counts.vip > 0 && (
            <div style={{ background:'var(--ocra-bg)', borderRadius:12, padding:'6px 12px', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13 }}>⭐</span>
              <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700, color:'var(--ocra-deep)' }}>{counts.vip} VIP</span>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div style={{ padding:'0 16px 10px', position:'relative' }}>
          <div style={{ position:'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2" strokeLinecap="round" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', zIndex:1 }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca nome, telefono…"
              style={{
                width:'100%', paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11,
                borderRadius:14, border:'none', fontFamily:"'Nunito',sans-serif",
                fontSize:16, fontWeight:600, color:'var(--ink)',
                background:'linear-gradient(160deg,var(--surface),var(--surface-2))',
                boxShadow:'inset 0 3px 5px rgba(60,50,30,0.1), 0 2px 4px rgba(255,255,255,0.5)',
                outline:'none',
              }}
            />
          </div>
        </div>

        {/* Filtri pill */}
        <div style={{ display:'flex', gap:6, padding:'0 16px 12px', overflowX:'auto' }}>
          {FILTRI.map(f => {
            const active = filtro === f.id
            return (
              <button key={f.id} onClick={() => setFiltro(f.id)} style={{
                border:'none', cursor:'pointer', borderRadius:999, padding:'7px 14px', whiteSpace:'nowrap',
                fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700,
                background: active ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
                color: active ? '#fff' : 'var(--ink-dim)',
                boxShadow: active ? '0 4px 10px rgba(20,80,90,0.4),inset 0 2px 4px rgba(255,255,255,0.2)' : 'inset 0 2px 4px rgba(255,255,255,0.5),0 2px 4px rgba(60,50,30,0.1)',
                transition:'all 0.18s',
              }}>{f.label}</button>
            )
          })}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ flex:1, display:'grid', placeItems:'center' }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, color:'var(--ink-dim)' }}>Caricamento…</div>
          </div>
        ) : clienti.length === 0 ? (
          <EmptyState onNuovo={() => setNuovoOpen(true)} />
        ) : (
          <div style={{ padding:'0 16px' }}>
            <AnimatePresence>
              {clienti.map((c, i) => (
                <motion.div key={c.id}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <ClienteRow cliente={c} onClick={() => router.push(`/clienti/${c.id}`)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="bottom-spacer" />
      </div>

      <BottomNav active="clienti" />

      <NuovoClienteModal
        isOpen={nuovoOpen}
        onClose={() => setNuovoOpen(false)}
        onCreato={() => { setNuovoOpen(false); reload() }}
      />
    </div>
  )
}

// ── CLIENTE ROW ──────────────────────────────────────────
function ClienteRow({ cliente: c, onClick }: { cliente: Cliente; onClick: () => void }) {
  const initials = getInitials(c.nome)
  const avatarColor = getAvatarColor(c.nome)
  const stato = STATO_COLOR[c.stato]

  return (
    <div onClick={onClick} style={{ position:'relative', marginBottom:8 }}>
      <div style={{ position:'absolute', inset:-4, borderRadius:22, background:'var(--surface-2)', filter:'blur(8px)', opacity:0.4, zIndex:-1 }} />
      <div style={{
        background:'linear-gradient(160deg,var(--surface),var(--surface-2))',
        borderRadius:18, padding:'12px 14px',
        display:'flex', alignItems:'center', gap:12,
        boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 6px rgba(255,255,255,0.5)',
        cursor:'pointer', position:'relative', overflow:'hidden',
      }}>
        {/* Highlight */}
        <div style={{ position:'absolute', top:'8%', left:'8%', width:'20%', height:'30%', background:'rgba(255,255,255,0.4)', borderRadius:'50%', filter:'blur(8px)', pointerEvents:'none' }} />

        {/* Avatar */}
        <div style={{ width:48, height:48, borderRadius:14, flexShrink:0, position:'relative',
          background: c.foto_url ? 'transparent' : `linear-gradient(160deg,${avatarColor.bg},${avatarColor.bg})`,
          display:'grid', placeItems:'center',
          boxShadow:'inset 0 2px 4px rgba(255,255,255,0.5),0 3px 7px rgba(60,50,30,0.15)',
        }}>
          {c.foto_url ? (
            <img src={c.foto_url} alt={c.nome} style={{ width:48, height:48, borderRadius:14, objectFit:'cover' }} />
          ) : (
            <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, fontWeight:700, color:avatarColor.text }}>{initials}</span>
          )}
          {c.livello_vip > 0 && (
            <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:'50%', background:'var(--ocra)', display:'grid', placeItems:'center', boxShadow:'0 2px 4px rgba(200,138,23,0.5)', border:'2px solid var(--surface)' }}>
              <span style={{ fontSize:9 }}>⭐</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, fontWeight:700, color:'var(--ink)', textShadow:'0 1px 0 rgba(255,255,255,0.4)' }}>{c.nome}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:0.5, color:'var(--ink-soft)', fontWeight:600 }}>{c.codice}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {c.telefono_principale && (
              <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-dim)', fontWeight:600 }}>{c.telefono_principale}</span>
            )}
            {c.citta_principale && (
              <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-soft)' }}>{c.citta_principale}</span>
            )}
          </div>
          {c.num_commesse > 0 && (
            <div style={{ marginTop:4, display:'flex', gap:6 }}>
              <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", background:'var(--teal-bg)', color:'var(--teal-deep)', padding:'2px 7px', borderRadius:999, fontWeight:700 }}>
                {c.num_commesse} cm
              </span>
              {c.fatturato_totale > 0 && (
                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", background:'var(--success-bg)', color:'var(--success)', padding:'2px 7px', borderRadius:999, fontWeight:700 }}>
                  €{Math.round(c.fatturato_totale).toLocaleString('it')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stato + chevron */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", fontWeight:800, letterSpacing:0.5, background:stato.bg, color:stato.text, padding:'3px 8px', borderRadius:999, boxShadow:`inset 0 1px 2px rgba(0,0,0,0.08)` }}>
            {c.stato.toUpperCase()}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </div>
  )
}

// ── EMPTY STATE ──────────────────────────────────────────
function EmptyState({ onNuovo }: { onNuovo: () => void }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, gap:16 }}>
      <div style={{ fontSize:52 }}>👥</div>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:22, fontWeight:600, color:'var(--ink)', textAlign:'center' }}>Nessun cliente</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, letterSpacing:1.5, color:'var(--ink-dim)', textTransform:'uppercase' }}>AGGIUNGI IL PRIMO</div>
      <button onClick={onNuovo} style={{
        border:'none', cursor:'pointer', borderRadius:16, padding:'13px 24px',
        background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff',
        fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700,
        boxShadow:'0 6px 14px rgba(20,80,90,0.4),inset 0 3px 6px rgba(255,255,255,0.2)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Nuovo cliente
      </button>
    </div>
  )
}

// ── STILI COMUNI ─────────────────────────────────────────
const iconBtn: React.CSSProperties = {
  width:44, height:44, borderRadius:'50%', border:'none', cursor:'pointer',
  display:'grid', placeItems:'center',
  background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
  boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.2),inset 0 4px 7px rgba(255,255,255,0.7)',
}
