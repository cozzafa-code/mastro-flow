'use client'
export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useClienteDettaglio, type DettaglioTab } from '@/hooks/useClienteDettaglio'
import { createDiaryEntry, dismissDiaryEntry, markDiaryActionTaken } from '@/lib/clienti-queries'
import { BottomNav } from '@/app/components/BottomNav'
import { getInitials, getAvatarColor, STATO_COLOR, DIARY_SOURCE_META } from '@/lib/clienti-types'
import type { DiaryEntry } from '@/lib/clienti-types'

const TABS: { id: DettaglioTab; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'diario', label: 'Diario' },
  { id: 'commesse', label: 'Commesse' },
  { id: 'comunicazioni', label: 'Comunic.' },
]

export default function ClienteDettaglioPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { cliente, indirizzi, commesse, diary, loading, tab, setTab, reloadDiary } = useClienteDettaglio(id)

  if (loading) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--ink-dim)' }}>Caricamento…</div>
    </div>
  )

  if (!cliente) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--red)' }}>Cliente non trovato</div>
    </div>
  )

  const initials = getInitials(cliente.nome)
  const avatarColor = getAvatarColor(cliente.nome)
  const stato = STATO_COLOR[cliente.stato]

  return (
    <div className="phone-screen">

      {/* Header teal fluffy */}
      <div style={{ position:'relative', margin:'8px 16px 0', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:-10, borderRadius:34, background:'var(--teal)', filter:'blur(16px)', opacity:0.4, zIndex:-1 }} />
        <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', borderRadius:26, padding:'14px 18px 16px', position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(0,0,0,0.08),0 14px 32px rgba(20,80,90,0.45),inset 0 6px 14px rgba(255,255,255,0.12),inset 0 -6px 12px rgba(0,0,0,0.22)' }}>
          <div style={{ position:'absolute', top:'10%', left:'12%', width:'30%', height:'20%', background:'rgba(255,255,255,0.15)', borderRadius:'50%', filter:'blur(14px)' }} />

          {/* Back + actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, position:'relative', zIndex:2 }}>
            <button onClick={() => router.back()} style={{ width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.15)', display:'grid', placeItems:'center', color:'#fff', backdropFilter:'blur(4px)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>CLIENTE</span>
            <div style={{ width:32 }} />
          </div>

          {/* Avatar + nome */}
          <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative', zIndex:2 }}>
            <div style={{ width:60, height:60, borderRadius:18, flexShrink:0, position:'relative', display:'grid', placeItems:'center', background: cliente.foto_url ? 'transparent' : 'rgba(255,255,255,0.2)', boxShadow:'inset 0 2px 6px rgba(255,255,255,0.2),0 4px 10px rgba(0,0,0,0.2)' }}>
              {cliente.foto_url
                ? <img src={cliente.foto_url} alt={cliente.nome} style={{ width:60, height:60, borderRadius:18, objectFit:'cover' }} />
                : <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:22, fontWeight:700, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.3)' }}>{initials}</span>
              }
              {cliente.livello_vip > 0 && (
                <div style={{ position:'absolute', top:-5, right:-5, width:20, height:20, borderRadius:'50%', background:'var(--ocra)', display:'grid', placeItems:'center', boxShadow:'0 2px 5px rgba(200,138,23,0.6)', border:'2px solid var(--teal-deep)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.1, textShadow:'0 2px 4px rgba(0,0,0,0.25)' }}>{cliente.nome}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'rgba(255,255,255,0.7)', letterSpacing:0.5, fontWeight:600 }}>{cliente.codice}</span>
                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:800, padding:'2px 8px', borderRadius:999, background:'rgba(255,255,255,0.18)', color:'#fff', letterSpacing:0.5 }}>{cliente.stato.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display:'flex', gap:8, marginTop:14, position:'relative', zIndex:2 }}>
            {[
              { label:'WA', color:'#25D366', href: cliente.whatsapp_numero ? `https://wa.me/${cliente.whatsapp_numero.replace(/\D/g,'')}` : `https://wa.me/${(cliente.telefono_principale||'').replace(/\D/g,'')}`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
              { label:'Chiama', color:'rgba(255,255,255,0.2)', href: `tel:${cliente.telefono_principale||''}`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 2 2 0 012 7.81V5a2 2 0 012-1.72c.96.127 1.903.361 2.81.7a2 2 0 011.11 2.45l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.45 1.11c.339.907.573 1.85.7 2.81z"/></svg> },
              { label:'Mail', color:'rgba(255,255,255,0.2)', href: `mailto:${cliente.email_principale||''}`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
            ].filter(a => a.href.length > 6).map(a => (
              <a key={a.label} href={a.href} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:999, background:a.color, color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700, boxShadow:'0 3px 8px rgba(0,0,0,0.2)', backdropFilter:'blur(4px)' }}>
                {a.icon}{a.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, padding:'12px 16px 4px', flexShrink:0 }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, border:'none', cursor:'pointer', borderRadius:12, padding:'9px 4px',
              fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700,
              background: active ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
              color: active ? '#fff' : 'var(--ink-dim)',
              boxShadow: active ? '0 4px 10px rgba(20,80,90,0.4),inset 0 2px 4px rgba(255,255,255,0.2)' : 'inset 0 2px 4px rgba(255,255,255,0.5),0 2px 4px rgba(60,50,30,0.1)',
              transition:'all 0.2s',
            }}>{t.label}</button>
          )
        })}
      </div>

      {/* Contenuto tab */}
      <div className="page">
        <AnimatePresence mode="wait">
          {tab === 'info' && <TabInfo key="info" cliente={cliente} indirizzi={indirizzi} />}
          {tab === 'diario' && <TabDiario key="diario" clienteId={id} diary={diary} onReload={reloadDiary} />}
          {tab === 'commesse' && <TabCommesse key="commesse" commesse={commesse} />}
          {tab === 'comunicazioni' && <TabComunicazioni key="comunicazioni" />}
        </AnimatePresence>
        <div className="bottom-spacer" />
      </div>

      <BottomNav active="clienti" />
    </div>
  )
}

// ── TAB INFO ─────────────────────────────────────────────
function TabInfo({ cliente: c, indirizzi }: { cliente: any; indirizzi: any[] }) {
  return (
    <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.18 }}
      style={{ padding:'8px 16px' }}>

      <InfoCard label="ANAGRAFICA" icon="user">
        <InfoRow label="Nome" value={c.nome} />
        <InfoRow label="Tipo" value={c.tipo === 'privato' ? 'Privato' : 'Azienda'} />
        {c.data_nascita && <InfoRow label="Data nascita" value={new Date(c.data_nascita).toLocaleDateString('it-IT')} />}
        {c.codice_fiscale && <InfoRow label="Cod. fiscale" value={c.codice_fiscale} mono />}
        {c.partita_iva && <InfoRow label="P.IVA" value={c.partita_iva} mono />}
        {c.cliente_dal && <InfoRow label="Cliente dal" value={new Date(c.cliente_dal).toLocaleDateString('it-IT')} />}
      </InfoCard>

      <InfoCard label="CONTATTI" icon="phone">
        {c.telefono_principale && <InfoRow label="Telefono" value={c.telefono_principale} link={`tel:${c.telefono_principale}`} />}
        {c.whatsapp_numero && <InfoRow label="WhatsApp" value={c.whatsapp_numero} link={`https://wa.me/${c.whatsapp_numero.replace(/\D/g,'')}`} />}
        {c.email_principale && <InfoRow label="Email" value={c.email_principale} link={`mailto:${c.email_principale}`} />}
        {c.citta_principale && <InfoRow label="Città" value={`${c.citta_principale}${c.provincia_principale ? ` (${c.provincia_principale})` : ''}`} />}
      </InfoCard>

      {(c.num_commesse > 0 || c.fatturato_totale > 0) && (
        <InfoCard label="STATISTICHE" icon="chart">
          {c.num_commesse > 0 && <InfoRow label="Commesse" value={String(c.num_commesse)} />}
          {c.fatturato_totale > 0 && <InfoRow label="Fatturato" value={`€${Math.round(c.fatturato_totale).toLocaleString('it')}`} />}
          {c.origine && <InfoRow label="Origine" value={c.origine} />}
        </InfoCard>
      )}

      {indirizzi.length > 0 && (
        <InfoCard label="INDIRIZZI" icon="map">
          {indirizzi.map(addr => (
            <InfoRow key={addr.id} label={addr.tipo} value={`${addr.via}${addr.numero_civico ? ' '+addr.numero_civico : ''}, ${addr.citta}`} />
          ))}
        </InfoCard>
      )}

      {c.nota_breve && (
        <InfoCard label="NOTE" icon="note">
          <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--ink)', lineHeight:1.5, margin:0 }}>{c.nota_breve}</p>
        </InfoCard>
      )}
    </motion.div>
  )
}

// ── TAB DIARIO ────────────────────────────────────────────
function TabDiario({ clienteId, diary, onReload }: { clienteId: string; diary: DiaryEntry[]; onReload: () => void }) {
  const [nuovoTesto, setNuovoTesto] = useState('')
  const [saving, setSaving] = useState(false)

  const handleNota = async () => {
    if (!nuovoTesto.trim()) return
    setSaving(true)
    try {
      await createDiaryEntry({ cliente_id: clienteId, testo: nuovoTesto.trim() })
      setNuovoTesto('')
      onReload()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDismiss = async (id: string) => {
    await dismissDiaryEntry(id)
    onReload()
  }

  const handleAction = async (id: string, type: string) => {
    await markDiaryActionTaken(id, type)
    onReload()
  }

  return (
    <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.18 }}
      style={{ padding:'8px 16px' }}>

      {/* Nuova nota */}
      <div style={{ position:'relative', marginBottom:12 }}>
        <div style={{ position:'absolute', inset:-5, borderRadius:24, background:'var(--surface-2)', filter:'blur(8px)', opacity:0.4, zIndex:-1 }} />
        <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:18, padding:14, boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 8px 18px rgba(60,50,30,0.14),inset 0 3px 7px rgba(255,255,255,0.55)' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>
            AGGIUNGI NOTA
          </div>
          <textarea
            value={nuovoTesto}
            onChange={e => setNuovoTesto(e.target.value)}
            placeholder="Scrivi una nota sul cliente…"
            rows={2}
            style={{ width:'100%', border:'none', borderRadius:10, padding:'10px 12px', fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:600, color:'var(--ink)', outline:'none', resize:'none', marginBottom:8, background:'linear-gradient(160deg,var(--bg-soft),var(--surface-2))', boxShadow:'inset 0 3px 5px rgba(60,50,30,0.1)' }}
          />
          <button onClick={handleNota} disabled={!nuovoTesto.trim()||saving} style={{ width:'100%', border:'none', cursor:'pointer', borderRadius:12, padding:'10px', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, opacity: nuovoTesto.trim() ? 1 : 0.5, boxShadow:'0 4px 10px rgba(20,80,90,0.4)' }}>
            {saving ? 'Salvataggio…' : 'Salva nota'}
          </button>
        </div>
      </div>

      {/* Lista diary */}
      {diary.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--ink-dim)', fontFamily:"'Fredoka',sans-serif", fontSize:16 }}>Nessuna nota ancora</div>
      ) : (
        diary.map(entry => <DiaryCard key={entry.id} entry={entry} onDismiss={handleDismiss} onAction={handleAction} />)
      )}
    </motion.div>
  )
}

function DiaryCard({ entry: e, onDismiss, onAction }: { entry: DiaryEntry; onDismiss: (id:string)=>void; onAction:(id:string,type:string)=>void }) {
  const meta = DIARY_SOURCE_META[e.source]
  const isAuto = e.source !== 'manual'

  return (
    <div style={{ position:'relative', marginBottom:8 }}>
      <div style={{ position:'absolute', inset:-4, borderRadius:20, background:'var(--surface-2)', filter:'blur(7px)', opacity:0.35, zIndex:-1 }} />
      <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:16, padding:'12px 14px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 6px rgba(255,255,255,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:800, padding:'2px 8px', borderRadius:999, background: isAuto ? 'var(--ocra-bg)' : 'var(--teal-bg)', color: isAuto ? 'var(--ocra-deep)' : 'var(--teal-deep)', letterSpacing:0.5 }}>
            {meta.label.toUpperCase()}
          </span>
          <span style={{ flex:1 }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--ink-soft)' }}>
            {new Date(e.created_at).toLocaleDateString('it-IT')}
          </span>
          <button onClick={() => onDismiss(e.id)} style={{ width:22, height:22, borderRadius:'50%', border:'none', cursor:'pointer', background:'var(--surface-3)', display:'grid', placeItems:'center', color:'var(--ink-dim)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--ink)', lineHeight:1.5, margin:0 }}>{e.testo}</p>

        {/* Action buttons */}
        {e.action_required && !e.action_taken && (
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            {e.action_type === 'manda_whatsapp' && (
              <button onClick={() => onAction(e.id, 'manda_whatsapp')} style={{ ...actionBtn, background:'#25D366', color:'#fff' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Manda auguri WA
              </button>
            )}
            {e.action_type === 'crea_impegno' && (
              <button onClick={() => onAction(e.id, 'crea_impegno')} style={{ ...actionBtn, background:'var(--teal)', color:'#fff' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Crea appuntamento
              </button>
            )}
            {e.action_type === 'chiedi_recensione' && (
              <button onClick={() => onAction(e.id, 'chiedi_recensione')} style={{ ...actionBtn, background:'var(--ocra)', color:'#fff' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Chiedi recensione
              </button>
            )}
            <button onClick={() => onAction(e.id, 'ignored')} style={{ ...actionBtn, background:'var(--surface-3)', color:'var(--ink-dim)' }}>
              Ignora
            </button>
          </div>
        )}
        {e.action_taken && (
          <div style={{ marginTop:8, fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:'var(--success)', letterSpacing:0.5 }}>✓ FATTO</div>
        )}
      </div>
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  border:'none', cursor:'pointer', borderRadius:999, padding:'6px 12px',
  fontFamily:"'Fredoka',sans-serif", fontSize:12, fontWeight:700,
  display:'flex', alignItems:'center', gap:5,
  boxShadow:'0 3px 7px rgba(0,0,0,0.18)',
}

// ── TAB COMMESSE ──────────────────────────────────────────
function TabCommesse({ commesse }: { commesse: any[] }) {
  return (
    <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.18 }}
      style={{ padding:'8px 16px' }}>
      {commesse.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-dim)', fontFamily:"'Fredoka',sans-serif", fontSize:16 }}>Nessuna commessa collegata</div>
      ) : commesse.map((cm: any) => (
        <div key={cm.id} style={{ position:'relative', marginBottom:8 }}>
          <div style={{ position:'absolute', inset:-4, borderRadius:20, background:'var(--surface-2)', filter:'blur(7px)', opacity:0.35, zIndex:-1 }} />
          <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:16, padding:'12px 14px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 6px rgba(255,255,255,0.5)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, color:'var(--ink)' }}>{cm.code}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:999, background:'var(--teal-bg)', color:'var(--teal-deep)' }}>{cm.fase?.toUpperCase()}</span>
            </div>
            {cm.totale_finale && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'var(--success)', fontWeight:700 }}>€{Math.round(cm.totale_finale).toLocaleString('it')}</div>}
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--ink-soft)', marginTop:2 }}>{new Date(cm.created_at).toLocaleDateString('it-IT')}</div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ── TAB COMUNICAZIONI ────────────────────────────────────
function TabComunicazioni() {
  return (
    <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.18 }}
      style={{ padding:'40px 16px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--ink-dim)', marginBottom:8 }}>Timeline comunicazioni</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-soft)', letterSpacing:1, textTransform:'uppercase' }}>In arrivo — fase 2</div>
    </motion.div>
  )
}

// ── INFO CARD ─────────────────────────────────────────────
function InfoCard({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ position:'relative', marginBottom:10 }}>
      <div style={{ position:'absolute', inset:-5, borderRadius:26, background:'var(--surface-2)', filter:'blur(9px)', opacity:0.4, zIndex:-1 }} />
      <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:20, padding:14, position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 8px 20px rgba(60,50,30,0.14),inset 0 4px 8px rgba(255,255,255,0.55)' }}>
        <div style={{ position:'absolute', top:'6%', left:'10%', width:'26%', height:'14%', background:'rgba(255,255,255,0.5)', borderRadius:'50%', filter:'blur(10px)', pointerEvents:'none' }} />
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10, position:'relative', zIndex:2 }}>{label}</div>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  const valStyle: React.CSSProperties = {
    fontFamily: mono ? "'JetBrains Mono',monospace" : "'Nunito',sans-serif",
    fontSize: 13, fontWeight: 600, color: link ? 'var(--teal)' : 'var(--ink)',
    textDecoration: 'none',
  }
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(60,50,30,0.05)' }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' }}>{label}</span>
      {link
        ? <a href={link} target="_blank" rel="noreferrer" style={valStyle}>{value}</a>
        : <span style={valStyle}>{value}</span>
      }
    </div>
  )
}
