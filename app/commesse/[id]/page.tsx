'use client'
export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { BottomNav } from '@/app/components/BottomNav'
import MastroProvider from '@/components/MastroProvider'
import RilieviVaniPanel from '@/components/RilieviVaniPanel'
import VanoDetailPanel from '@/components/VanoDetailPanel'
import { useMastro } from '@/components/MastroContext'

const PIPELINE = [
  { short:'CLI' }, { short:'MIS' }, { short:'PRV' }, { short:'FIR' },
  { short:'ORD' }, { short:'PRD' }, { short:'MON' }, { short:'COL' },
]
const FASE_IDX: Record<string,number> = {
  sopralluogo:0, preventivo:2, confermata:3, confermata_ordine:3,
  ordine:4, produzione:5, montaggio:6, fatturata:6, pagata:7, chiusa:7
}

function getProssimaAzione(cm: any, rilievi: any[]) {
  const hasRilievi = rilievi.length > 0
  const hasVani = rilievi.some((r:any) => r.vani?.length > 0)
  const hasMisure = rilievi.some((r:any) => r.vani?.some((v:any) => v.misure?.lCentro || v.misure?.lAlto))
  if (!hasRilievi) return { titolo:'Esegui il primo rilievo', desc:'Vai in cantiere e prendi le misure di ogni vano', cta:'+ CREA RILIEVO', tipo:'crea' }
  if (!hasVani) return { titolo:'Aggiungi vani al rilievo', desc:'Il rilievo è vuoto. Aggiungi i vani da misurare.', cta:'APRI RILIEVO →', tipo:'apri' }
  if (!hasMisure) return { titolo:'Completa le misure', desc:`Vani presenti ma mancano le misure`, cta:'APRI MISURE →', tipo:'apri' }
  return { titolo:'Misure completate', desc:'Procedi con il preventivo', cta:'APRI PREVENTIVO →', tipo:'preventivo' }
}

// ── INNER – ha accesso al context MastroProvider ─────────────
function CentroOperativoInner({ cm, rilievi, onReload }: { cm: any, rilievi: any[], onReload: () => void }) {
  const router = useRouter()
  const {
    selectedVano, setSelectedVano,
    selectedRilievo, setSelectedRilievo,
  } = useMastro()

  const faseIdx = FASE_IDX[cm?.fase] ?? 0
  const nomeCompleto = [cm?.cliente, cm?.cognome].filter(Boolean).join(' ')
  const azione = getProssimaAzione(cm, rilievi)

  // Ricarica i vani quando si seleziona un rilievo
  const handleSelectRilievo = useCallback((r: any) => {
    router.push(`/misure/${r.id}`)
  }, [router])

  // Quando si apre un vano da RilieviVaniPanel
  const handleOpenVano = useCallback((vanoId: string, rilId: string) => {
    const ril = rilievi.find((r: any) => r.id === rilId) || selectedRilievo
    const vano = ril?.vani?.find((v: any) => v.id === vanoId)
      || selectedRilievo?.vani?.find((v: any) => v.id === vanoId)
    if (vano) setSelectedVano(vano)
  }, [rilievi, selectedRilievo, setSelectedVano])

  // Se c'è un vano selezionato → mostra VanoDetailPanel
  if (selectedVano) {
    return (
      <div className="phone-screen">
        <div className="page">
          <VanoDetailPanel />
        </div>
      </div>
    )
  }

  // Se c'è un rilievo selezionato → mostra RilieviVaniPanel
  if (selectedRilievo) {
    return (
      <div className="phone-screen">
        <div className="page" style={{ paddingBottom: 80 }}>
          <RilieviVaniPanel onOpenVano={handleOpenVano} />
        </div>
        <BottomNav active="commesse" />
      </div>
    )
  }

  // Default → Centro Operativo
  return (
    <div className="phone-screen">
      <div className="page">

        {/* TOPBAR */}
        <div style={{ background:'linear-gradient(160deg,#0E3E44,var(--teal-deep))', padding:'12px 16px 16px', flexShrink:0, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'10%', left:'8%', width:'35%', height:'40%', background:'rgba(255,255,255,0.06)', borderRadius:'50%', filter:'blur(20px)' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, position:'relative', zIndex:2 }}>
            <button onClick={() => router.back()} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'rgba(255,255,255,0.9)', boxShadow:'inset 0 1.5px 2.5px rgba(255,255,255,0.15)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2.5, color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>CENTRO OPERATIVO</span>
            <div style={{ width:34 }} />
          </div>
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.7)', letterSpacing:1 }}>{cm?.code}</div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:24, fontWeight:700, color:'#fff', lineHeight:1.05, letterSpacing:-0.5, textShadow:'0 2px 6px rgba(0,0,0,0.3)' }}>{nomeCompleto}</div>
            {cm?.indirizzo && <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:4 }}>{cm.indirizzo}</div>}
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)' }}>{rilievi.length} RILIEV{rilievi.length===1?'O':'I'}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)' }}>{rilievi.reduce((a:number,r:any)=>a+(r.vani?.length||0),0)} VANI</span>
            </div>
          </div>
        </div>

        {/* PIPELINE */}
        <div style={{ padding:'12px 16px 8px', flexShrink:0 }}>
          <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:18, padding:'12px 10px 10px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
            <div style={{ display:'flex', alignItems:'flex-start' }}>
              {PIPELINE.map((p, i) => {
                const done = i < faseIdx
                const current = i === faseIdx
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                      {i > 0 && <div style={{ flex:1, height:2, background: done||current ? 'var(--teal)' : 'var(--surface-3,#ddd)' }} />}
                      <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'grid', placeItems:'center',
                        background: done ? 'linear-gradient(160deg,var(--success),#1F5A3D)' : current ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
                        boxShadow: current ? '0 0 0 3px var(--teal-bg),0 3px 7px rgba(20,80,90,0.4)' : 'none',
                      }}>
                        {done ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:9, fontWeight:700, color: current?'#fff':'var(--ink-soft)' }}>{i+1}</span>}
                      </div>
                      {i < PIPELINE.length-1 && <div style={{ flex:1, height:2, background: done ? 'var(--teal)' : 'var(--surface-3,#ddd)' }} />}
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:800, color: current?'var(--teal-deep)':done?'var(--success)':'var(--ink-soft)', textAlign:'center' }}>{p.short}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AZIONE CORRENTE */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-6, borderRadius:26, background:'var(--teal)', filter:'blur(12px)', opacity:0.25, zIndex:-1 }} />
            <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:20, padding:16, boxShadow:'0 0 0 1px rgba(60,50,30,0.06),0 10px 24px rgba(60,50,30,0.18),inset 0 4px 8px rgba(255,255,255,0.6)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, background:'var(--teal-deep)', color:'#fff', letterSpacing:1.5 }}>AZIONE</span>
              </div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:20, fontWeight:600, color:'var(--ink)', letterSpacing:-0.3, marginBottom:6 }}>{azione.titolo}</div>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--ink-dim)', fontWeight:600, marginBottom:14, lineHeight:1.4 }}>{azione.desc}</div>
              <button onClick={() => {
                if (azione.tipo === 'crea') router.push(`/commesse/${cm.id}/rilievo/nuovo`)
                else if (azione.tipo === 'apri' && rilievi[0]) handleSelectRilievo(rilievi[0])
              }} style={{ width:'100%', border:'none', cursor:'pointer', borderRadius:14, padding:'13px 16px', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, textShadow:'0 1px 2px rgba(0,0,0,0.25)', boxShadow:'0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)' }}>
                {azione.cta}
              </button>
            </div>
          </div>
        </div>

        {/* RILIEVI */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.8, textTransform:'uppercase' }}>{rilievi.length} RILIEV{rilievi.length===1?'O':'I'}</div>
            <button onClick={() => router.push(`/commesse/${cm.id}/rilievo/nuovo`)} style={{ border:'none', cursor:'pointer', borderRadius:999, padding:'6px 14px', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:12, fontWeight:700, boxShadow:'0 3px 8px rgba(20,80,90,0.35)', display:'flex', alignItems:'center', gap:5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Nuovo rilievo
            </button>
          </div>

          {rilievi.length === 0 ? (
            <button onClick={() => router.push(`/commesse/${cm.id}/rilievo/nuovo`)} style={{ width:'100%', border:'2px dashed rgba(31,111,120,0.3)', borderRadius:18, padding:'20px 16px', cursor:'pointer', background:'rgba(220,236,237,0.2)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, color:'var(--teal)' }}>+ CREA PRIMO RILIEVO</div>
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {rilievi.map((r:any) => (
                <div key={r.id} onClick={() => handleSelectRilievo(r)} style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 5px 12px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
                  <div style={{ width:42, height:42, borderRadius:13, background:'var(--teal-bg)', display:'grid', placeItems:'center', flexShrink:0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 3L3 21M8 3v4M12 3v2M16 3v4M3 8h4M3 12h2M3 16h4"/></svg>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, color:'var(--ink)' }}>Rilievo {r.tipo_rilievo||'semplice'}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:999, background:'var(--ocra-bg)', color:'var(--ocra-deep)', letterSpacing:0.5 }}>{(r.tipo_misure||'provvisorie').toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-dim)', fontWeight:600 }}>{r.vani?.length||0} vani · {new Date(r.created_at).toLocaleDateString('it-IT')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STORIA */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.8, textTransform:'uppercase', marginBottom:8 }}>STORIA</div>
          <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:18, padding:'12px 14px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
            <div style={{ display:'flex', gap:12, paddingBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'grid', placeItems:'center', background:'var(--success-bg)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ flex:1, paddingTop:4 }}>
                <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700, color:'var(--ink)' }}>Commessa creata</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:'var(--ink-soft)', marginTop:2 }}>{new Date(cm?.created_at).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}</div>
              </div>
            </div>
            {rilievi.length > 0 && (
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'grid', placeItems:'center', background:'var(--teal-bg)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal-deep)" strokeWidth="2.2" strokeLinecap="round"><path d="M21 3L3 21M8 3v4M12 3v2M16 3v4M3 8h4M3 12h2M3 16h4"/></svg>
                </div>
                <div style={{ flex:1, paddingTop:4 }}>
                  <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700, color:'var(--ink)' }}>Primo rilievo eseguito</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:'var(--ink-soft)', marginTop:2 }}>{new Date(rilievi[0]?.created_at).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bottom-spacer" />
      </div>
      <BottomNav active="commesse" />
    </div>
  )
}

// ── OUTER – carica dati e monta provider ──────────────────────
export default function CommessaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [cm, setCm] = useState<any>(null)
  const [rilievi, setRilievi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [cmRes, rilRes] = await Promise.all([
        fetch(`/api/commesse/${id}`),
        fetch(`/api/rilievi?commessa_id=${id}`),
      ])
      const cmJson = await cmRes.json()
      if (cmRes.ok) setCm(cmJson.commessa)
      const rilJson = rilRes.ok ? await rilRes.json() : { rilievi: [] }
      setRilievi(rilJson.rilievi || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  // Ricarica quando si torna su questa pagina (dopo nuovo rilievo)
  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handleFocus = () => load()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [load])

  if (loading) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--ink-dim)' }}>Caricamento…</span>
    </div>
  )
  if (!cm) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--red)' }}>Commessa non trovata</span>
    </div>
  )

  const rilieviConVani = rilievi.map((r:any) => ({
    ...r,
    tipo_rilievo: r.complesso ? 'complesso' : 'semplice',
    tipo_misure: r.motivo_modifica || r.tipo || 'provvisorie',
    vani: r.vani || [],
  }))

  const cmForProvider = { ...cm, rilievi: rilieviConVani }

  return (
    <MastroProvider initialCM={cmForProvider} initialRilievo={null}>
      <CentroOperativoInner cm={cm} rilievi={rilieviConVani} onReload={load} />
    </MastroProvider>
  )
}
 
