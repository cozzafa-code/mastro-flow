'use client'
export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createAdminClient } from '@/lib/supabase/client'
import { BottomNav } from '@/app/components/BottomNav'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

const FASI = [
  'sopralluogo','preventivo','confermata','confermata_ordine',
  'ordine','produzione','montaggio','fatturata','pagata','chiusa',
]

const FASE_COLOR: Record<string, { bg: string; text: string }> = {
  sopralluogo:      { bg:'var(--teal-bg)',    text:'var(--teal-deep)' },
  preventivo:       { bg:'var(--ocra-bg)',    text:'var(--ocra-deep)' },
  confermata:       { bg:'var(--blue-bg)',    text:'var(--blue-deep)' },
  confermata_ordine:{ bg:'var(--blue-bg)',    text:'var(--blue-deep)' },
  ordine:           { bg:'var(--blue-bg)',    text:'var(--blue-deep)' },
  produzione:       { bg:'var(--ocra-bg)',    text:'var(--ocra-deep)' },
  montaggio:        { bg:'var(--ocra-bg)',    text:'var(--ocra-deep)' },
  fatturata:        { bg:'var(--success-bg)', text:'var(--success)' },
  pagata:           { bg:'var(--success-bg)', text:'var(--success)' },
  chiusa:           { bg:'var(--surface-3)',  text:'var(--ink-dim)' },
}

export default function CommessaDettaglioPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [cm, setCm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info'|'accesso'|'note'>('info')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commesse/${id}`)
      const json = await res.json()
      if (res.ok) setCm(json.commessa)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--ink-dim)' }}>Caricamento…</span>
    </div>
  )

  if (!cm) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center', gap:16, padding:32 }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:20, color:'var(--red)' }}>Commessa non trovata</span>
      <button onClick={() => router.back()} style={{ ...ctaBack }}>← Torna indietro</button>
    </div>
  )

  const faseColor = FASE_COLOR[cm.fase] ?? { bg:'var(--surface-3)', text:'var(--ink-dim)' }
  const nomeCompleto = [cm.cliente, cm.cognome].filter(Boolean).join(' ')

  return (
    <div className="phone-screen">

      {/* Header teal fluffy */}
      <div style={{ position:'relative', margin:'8px 16px 0', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:-10, borderRadius:34, background:'var(--teal)', filter:'blur(16px)', opacity:0.4, zIndex:-1 }} />
        <div style={{ background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', borderRadius:26, padding:'14px 18px 18px', position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(0,0,0,0.08),0 14px 32px rgba(20,80,90,0.45),inset 0 6px 14px rgba(255,255,255,0.12),inset 0 -6px 12px rgba(0,0,0,0.22)' }}>
          <div style={{ position:'absolute', top:'10%', left:'12%', width:'30%', height:'20%', background:'rgba(255,255,255,0.15)', borderRadius:'50%', filter:'blur(14px)' }} />

          {/* Back */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, position:'relative', zIndex:2 }}>
            <button onClick={() => router.back()} style={{ width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(255,255,255,0.15)', display:'grid', placeItems:'center', color:'#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>COMMESSA</span>
            <div style={{ width:32 }} />
          </div>

          {/* Codice + fase */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative', zIndex:2 }}>
            <div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:28, fontWeight:700, color:'#fff', lineHeight:1, textShadow:'0 2px 6px rgba(0,0,0,0.3)' }}>{cm.code}</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, fontWeight:600, color:'rgba(255,255,255,0.9)', marginTop:4, textShadow:'0 1px 3px rgba(0,0,0,0.2)' }}>{nomeCompleto}</div>
              {cm.indirizzo && <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:3 }}>{cm.indirizzo}</div>}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, letterSpacing:0.5, padding:'5px 12px', borderRadius:999, background: faseColor.bg, color: faseColor.text, flexShrink:0, boxShadow:'inset 0 1px 2px rgba(0,0,0,0.08)' }}>
              {cm.fase?.toUpperCase().replace('_',' ')}
            </span>
          </div>

          {/* Valore */}
          {(cm.totale_preventivo || cm.totale_finale) && (
            <div style={{ display:'flex', gap:12, marginTop:12, position:'relative', zIndex:2 }}>
              {cm.totale_preventivo && (
                <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'7px 14px', backdropFilter:'blur(4px)' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'rgba(255,255,255,0.65)', letterSpacing:1, textTransform:'uppercase' }}>Preventivo</div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, fontWeight:700, color:'#fff' }}>€{Math.round(cm.totale_preventivo).toLocaleString('it')}</div>
                </div>
              )}
              {cm.totale_finale && (
                <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'7px 14px', backdropFilter:'blur(4px)' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'rgba(255,255,255,0.65)', letterSpacing:1, textTransform:'uppercase' }}>Totale</div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, fontWeight:700, color:'#fff' }}>€{Math.round(cm.totale_finale).toLocaleString('it')}</div>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display:'flex', gap:8, marginTop:12, position:'relative', zIndex:2 }}>
            {cm.telefono && (
              <a href={`tel:${cm.telefono}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, background:'rgba(255,255,255,0.2)', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700, backdropFilter:'blur(4px)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 2 2 0 012 7.81V5a2 2 0 012-1.72c.96.127 1.903.361 2.81.7a2 2 0 011.11 2.45L6.64 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.45 1.11c.339.907.573 1.85.7 2.81z"/></svg>
                Chiama
              </a>
            )}
            {cm.telefono && (
              <a href={`https://wa.me/${cm.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, background:'#25D366', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                WA
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Step rail fasi */}
      <div style={{ padding:'12px 16px 4px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:0, overflow:'hidden' }}>
          {FASI.slice(0, 7).map((f, i) => {
            const idx = FASI.indexOf(cm.fase)
            const done = i < idx
            const current = i === idx
            return (
              <div key={f} style={{ flex:1, display:'flex', alignItems:'center' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background: done ? 'var(--success)' : current ? 'var(--ocra)' : 'var(--surface-3)', boxShadow: current ? '0 0 0 3px var(--ocra-bg)' : 'none', transition:'all 0.2s' }} />
                {i < 6 && <div style={{ flex:1, height:2, background: done ? 'var(--success)' : 'var(--surface-3)', transition:'background 0.3s' }} />}
              </div>
            )
          })}
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--ink-dim)', letterSpacing:0.5, marginTop:4, textTransform:'uppercase' }}>
          Fase {FASI.indexOf(cm.fase) + 1} di {FASI.length}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, padding:'4px 16px 4px', flexShrink:0 }}>
        {[{id:'info',label:'Info'},{id:'accesso',label:'Accesso'},{id:'note',label:'Note'}].map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{ flex:1, border:'none', cursor:'pointer', borderRadius:12, padding:'9px 4px', fontFamily:"'Fredoka',sans-serif", fontSize:13, fontWeight:700, background: active ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color: active ? '#fff' : 'var(--ink-dim)', boxShadow: active ? '0 4px 10px rgba(20,80,90,0.4)' : 'inset 0 2px 4px rgba(255,255,255,0.5)', transition:'all 0.2s' }}>{t.label}</button>
          )
        })}
      </div>

      {/* Contenuto */}
      <div className="page" style={{ padding:'8px 16px' }}>
        {tab === 'info' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <InfoCard label="CLIENTE">
              <InfoRow label="Nome" value={nomeCompleto} />
              {cm.telefono && <InfoRow label="Telefono" value={cm.telefono} link={`tel:${cm.telefono}`} />}
              {cm.email && <InfoRow label="Email" value={cm.email} link={`mailto:${cm.email}`} />}
              {cm.indirizzo && <InfoRow label="Indirizzo" value={cm.indirizzo} />}
            </InfoCard>

            <InfoCard label="COMMESSA">
              <InfoRow label="Codice" value={cm.code} mono />
              <InfoRow label="Fase" value={cm.fase?.replace(/_/g,' ') ?? '—'} />
              {cm.tipo && <InfoRow label="Tipo" value={cm.tipo} />}
              {cm.sistema && <InfoRow label="Sistema" value={cm.sistema} />}
              <InfoRow label="Creata il" value={new Date(cm.created_at).toLocaleDateString('it-IT')} />
            </InfoCard>

            {(cm.totale_preventivo || cm.totale_finale) && (
              <InfoCard label="IMPORTI">
                {cm.totale_preventivo && <InfoRow label="Preventivo" value={`€${Math.round(cm.totale_preventivo).toLocaleString('it')}`} />}
                {cm.sconto_perc && <InfoRow label="Sconto" value={`${cm.sconto_perc}%`} />}
                {cm.totale_finale && <InfoRow label="Totale finale" value={`€${Math.round(cm.totale_finale).toLocaleString('it')}`} />}
              </InfoCard>
            )}
          </motion.div>
        )}

        {tab === 'accesso' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <InfoCard label="ACCESSO / SALITA">
              {cm.difficolta_salita ? <InfoRow label="Difficoltà" value={cm.difficolta_salita} /> : <EmptyField />}
              {cm.piano_edificio && <InfoRow label="Piano" value={cm.piano_edificio} />}
              {cm.foro_scale && <InfoRow label="Foro scale" value={cm.foro_scale} />}
              {cm.mezzo_salita && <InfoRow label="Mezzo salita" value={cm.mezzo_salita} />}
            </InfoCard>
            <InfoCard label="EDIFICIO">
              {cm.tipo_edificio ? <InfoRow label="Tipo" value={cm.tipo_edificio} /> : <EmptyField />}
            </InfoCard>
          </motion.div>
        )}

        {tab === 'note' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <InfoCard label="NOTE">
              {cm.note
                ? <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--ink)', lineHeight:1.6 }}>{cm.note}</p>
                : <EmptyField label="Nessuna nota" />
              }
            </InfoCard>
            {cm.motivo_ferma && (
              <InfoCard label="MOTIVO BLOCCO">
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--red)', lineHeight:1.6 }}>{cm.motivo_ferma}</p>
              </InfoCard>
            )}
          </motion.div>
        )}

        <div className="bottom-spacer" />
      </div>

      <BottomNav active="commesse" />
    </div>
  )
}

// ── SUB-COMPONENTI ───────────────────────────────────────
function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
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
  const valStyle: React.CSSProperties = { fontFamily: mono ? "'JetBrains Mono',monospace" : "'Nunito',sans-serif", fontSize:13, fontWeight:600, color: link ? 'var(--teal)' : 'var(--ink)', textDecoration:'none' }
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(60,50,30,0.05)' }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' }}>{label}</span>
      {link ? <a href={link} style={valStyle}>{value}</a> : <span style={valStyle}>{value}</span>}
    </div>
  )
}

function EmptyField({ label = 'Non specificato' }: { label?: string }) {
  return <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--ink-soft)', fontStyle:'italic', padding:'4px 0' }}>{label}</div>
}

const ctaBack: React.CSSProperties = {
  border:'none', cursor:'pointer', borderRadius:14, padding:'12px 24px',
  background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', color:'var(--ink-2)',
  fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700,
  boxShadow:'0 4px 10px rgba(60,50,30,0.15)',
}
