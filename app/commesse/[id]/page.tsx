'use client'
export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '@/app/components/BottomNav'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

// ── PIPELINE 8 FASI (dal brief §5.3) ────────────────────
const PIPELINE = [
  { id:'sopralluogo', label:'CLIENTE',  short:'CLI' },
  { id:'misure',      label:'MISURE',   short:'MIS' },
  { id:'preventivo',  label:'PREV.',    short:'PRV' },
  { id:'confermata',  label:'FIRMA',    short:'FIR' },
  { id:'ordine',      label:'ORD.',     short:'ORD' },
  { id:'produzione',  label:'PROD.',    short:'PRD' },
  { id:'montaggio',   label:'MONT.',    short:'MON' },
  { id:'chiusa',      label:'COLL.',    short:'COL' },
]

// Mappa fase DB → indice pipeline
const FASE_IDX: Record<string,number> = {
  sopralluogo:0, preventivo:2, confermata:3, confermata_ordine:3,
  ordine:4, produzione:5, montaggio:6, fatturata:6, pagata:7, chiusa:7
}

// ── LOGICA PROSSIMA AZIONE (dal brief §5.5) ──────────────
function getProssimaAzione(cm: any, rilievi: any[]) {
  const hasRilievi = rilievi.length > 0
  const hasVani = rilievi.some((r:any) => r.vani?.length > 0)
  const hasMisure = rilievi.some((r:any) => r.vani?.some((v:any) => v.misure?.lCentro || v.misure?.lAlto))
  const hasPrezzi = !!cm.totale_preventivo
  const hasFirmaC = cm.fase === 'confermata' || cm.fase === 'confermata_ordine' || FASE_IDX[cm.fase] >= 3
  const hasOrdine = FASE_IDX[cm.fase] >= 4
  const hasMont = FASE_IDX[cm.fase] >= 6

  if (!hasRilievi) return { titolo: 'Esegui il primo rilievo', desc: 'Nessun rilievo ancora. Vai dal cliente e prendi le misure.', cta: '+ CREA RILIEVO', tipo: 'rilievo', colore: 'teal' }
  if (!hasVani) return { titolo: 'Aggiungi vani al rilievo', desc: 'Il rilievo è vuoto. Aggiungi i vani da misurare.', cta: 'APRI RILIEVO', tipo: 'rilievo', colore: 'teal' }
  if (!hasMisure) return { titolo: 'Completa le misure', desc: 'Hai i vani ma mancano le misure. Compila almeno larghezza e altezza.', cta: 'APRI MISURE', tipo: 'misure', colore: 'ocra' }
  if (!hasPrezzi) return { titolo: 'Imposta prezzi per il preventivo', desc: 'Le misure ci sono. Adesso calcola il preventivo.', cta: 'APRI PREVENTIVO', tipo: 'preventivo', colore: 'blue' }
  if (!hasFirmaC) return { titolo: 'Invia preventivo per firma', desc: 'Il preventivo è pronto. Aspetti la firma del cliente.', cta: 'INVIA PREVENTIVO', tipo: 'firma', colore: 'ocra' }
  if (!hasOrdine) return { titolo: 'Emetti conferma d\'ordine', desc: 'Il cliente ha accettato. Emetti la conferma e incassa l\'acconto.', cta: 'EMETTI CdO →', tipo: 'ordine', colore: 'teal' }
  if (!hasMont) return { titolo: 'Pianifica il montaggio', desc: 'Materiale in arrivo. Pianifica data e squadra di montaggio.', cta: 'PIANIFICA', tipo: 'montaggio', colore: 'teal' }
  return { titolo: 'Chiudi la commessa', desc: 'Montaggio completato. Emetti fattura di saldo e chiudi.', cta: 'FATTURA SALDO', tipo: 'chiusura', colore: 'success' }
}

// ── ALERT AUTOMATICI (dal brief §5.6) ───────────────────
function getAlerts(cm: any) {
  const alerts: { msg: string; tipo: 'red'|'ocra' }[] = []
  if (!cm) return alerts
  const oggi = new Date()
  const faseStart = cm.fase_start ? new Date(cm.fase_start) : new Date(cm.created_at)
  const gg = Math.floor((oggi.getTime() - faseStart.getTime()) / 86400000)
  if (cm.fase === 'preventivo' && gg > 7) alerts.push({ msg: `Preventivo fermo da ${gg} giorni — sollecita firma cliente`, tipo: 'ocra' })
  if (cm.fase === 'fatturata' && gg > 14) alerts.push({ msg: `Fattura emessa da ${gg} giorni — verifica pagamento`, tipo: 'red' })
  if (cm.fase === 'ordine' && gg > 30) alerts.push({ msg: `Ordine fornitore da ${gg} giorni — verifica stato`, tipo: 'ocra' })
  return alerts
}

export default function CentroOperativoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [cm, setCm] = useState<any>(null)
  const [rilievi, setRilievi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cmRes, rilRes] = await Promise.all([
        fetch(`/api/commesse/${id}`),
        fetch(`/api/rilievi?commessa_id=${id}`),
      ])
      const cmJson = await cmRes.json()
      if (cmRes.ok) setCm(cmJson.commessa)
      const rilJson = rilRes.ok ? await rilRes.json() : { rilievi: [] }
      setRilievi(rilJson.rilievi || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--ink-dim)' }}>Caricamento…</div>
    </div>
  )
  if (!cm) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--red)' }}>Commessa non trovata</div>
    </div>
  )

  const faseIdx = FASE_IDX[cm.fase] ?? 0
  const nomeCompleto = [cm.cliente, cm.cognome].filter(Boolean).join(' ')
  const azione = getProssimaAzione(cm, rilievi)
  const alerts = getAlerts(cm)

  return (
    <div className="phone-screen">
      <div className="page">

        {/* ── TOPBAR SCURA ── */}
        <div style={{ background:'linear-gradient(160deg,var(--teal-deeper,#0E3E44),var(--teal-deep))', padding:'12px 16px 16px', flexShrink:0, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'10%', left:'8%', width:'35%', height:'40%', background:'rgba(255,255,255,0.06)', borderRadius:'50%', filter:'blur(20px)' }} />

          {/* Back + actions */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, position:'relative', zIndex:2 }}>
            <button onClick={() => router.back()} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'rgba(255,255,255,0.9)', boxShadow:'inset 0 1.5px 2.5px rgba(255,255,255,0.15),0 2px 4px rgba(0,0,0,0.3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2.5, color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>CENTRO OPERATIVO</span>
            <button style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'rgba(255,255,255,0.7)', boxShadow:'inset 0 1.5px 2.5px rgba(255,255,255,0.15),0 2px 4px rgba(0,0,0,0.3)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </div>

          {/* Codice + nome + indirizzo */}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.7)', letterSpacing:1, marginBottom:3 }}>{cm.code}</div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:26, fontWeight:700, color:'#fff', lineHeight:1.05, letterSpacing:-0.5, textShadow:'0 2px 6px rgba(0,0,0,0.3)' }}>{nomeCompleto}</div>
            {cm.indirizzo && <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:4, fontWeight:600 }}>{cm.indirizzo}</div>}
            <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', letterSpacing:0.5 }}>
                {rilievi.length} RILIEV{rilievi.length === 1 ? 'O' : 'I'}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', letterSpacing:0.5 }}>
                {rilievi.reduce((acc:number,r:any)=>acc+(r.vani?.length||0),0)} VANI
              </span>
              {cm.totale_preventivo && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', letterSpacing:0.5 }}>
                  €{Math.round(cm.totale_preventivo).toLocaleString('it')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── PIPELINE 8 STEP ── */}
        <div style={{ padding:'14px 16px 8px', flexShrink:0 }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-5, borderRadius:22, background:'var(--surface-2)', filter:'blur(8px)', opacity:0.4, zIndex:-1 }} />
            <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:18, padding:'12px 10px 10px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
                {PIPELINE.map((p, i) => {
                  const done = i < faseIdx
                  const current = i === faseIdx
                  return (
                    <div key={p.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                        {i > 0 && <div style={{ flex:1, height:2, background: done||current ? 'var(--teal)' : 'var(--surface-3)', transition:'background 0.3s' }} />}
                        <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'grid', placeItems:'center',
                          background: done ? 'linear-gradient(160deg,var(--success),#1F5A3D)' : current ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,#FCF7E8,var(--surface-2))',
                          boxShadow: done ? '0 2px 5px rgba(47,125,87,0.4)' : current ? '0 0 0 3px var(--teal-bg),0 3px 7px rgba(20,80,90,0.4)' : 'inset 0 1.5px 2.5px rgba(255,255,255,0.55)',
                          transition:'all 0.3s',
                        }}>
                          {done
                            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:10, fontWeight:700, color: current?'#fff':'var(--ink-soft)' }}>{i+1}</span>
                          }
                        </div>
                        {i < PIPELINE.length-1 && <div style={{ flex:1, height:2, background: done ? 'var(--teal)' : 'var(--surface-3)', transition:'background 0.3s' }} />}
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:800, letterSpacing:0.3, textTransform:'uppercase', color: current?'var(--teal-deep)': done?'var(--success)':'var(--ink-soft)', textAlign:'center' }}>{p.short}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ALERTS ── */}
        {alerts.map((a, i) => (
          <div key={i} style={{ margin:'0 16px 8px', padding:'10px 14px', borderRadius:14, background: a.tipo==='red'?'var(--red-bg)':'var(--ocra-bg)', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 6px rgba(60,50,30,0.1)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.tipo==='red'?'var(--red)':'var(--ocra-deep)'} strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, fontWeight:700, color: a.tipo==='red'?'var(--red-deep)':'var(--ocra-deep)', flex:1 }}>{a.msg}</span>
          </div>
        ))}

        {/* ── CARD AZIONE CORRENTE ── */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-6, borderRadius:26, background: azione.colore==='teal'?'var(--teal)': azione.colore==='ocra'?'var(--ocra)': azione.colore==='success'?'var(--success)':'var(--blue)', filter:'blur(12px)', opacity:0.3, zIndex:-1 }} />
            <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:20, padding:16, position:'relative', overflow:'hidden', boxShadow:'0 0 0 1px rgba(60,50,30,0.06),0 10px 24px rgba(60,50,30,0.18),inset 0 4px 8px rgba(255,255,255,0.6)' }}>
              <div style={{ position:'absolute', top:'6%', left:'10%', width:'26%', height:'14%', background:'rgba(255,255,255,0.55)', borderRadius:'50%', filter:'blur(10px)', pointerEvents:'none' }} />

              {/* Badge AZIONE */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, position:'relative', zIndex:2 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, letterSpacing:1.5, padding:'3px 10px', borderRadius:999, background:'var(--teal-deep)', color:'#fff', textTransform:'uppercase' }}>AZIONE</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--ink-dim)', letterSpacing:1, textTransform:'uppercase' }}>FASE · {PIPELINE[faseIdx]?.label}</span>
              </div>

              {/* Titolo */}
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:20, fontWeight:600, color:'var(--ink)', letterSpacing:-0.3, lineHeight:1.2, marginBottom:6, position:'relative', zIndex:2 }}>{azione.titolo}</div>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:'var(--ink-dim)', fontWeight:600, marginBottom:14, lineHeight:1.4, position:'relative', zIndex:2 }}>{azione.desc}</div>

              {/* CTA */}
              <button
                onClick={() => {
                  if (azione.tipo === 'rilievo' && rilievi.length === 0) router.push(`/commesse/${id}/rilievo/nuovo`)
                  else if (azione.tipo === 'rilievo' && rilievi.length > 0) router.push(`/misure/${rilievi[0].id}`)
                  else if (azione.tipo === 'misure' && rilievi[0]) router.push(`/misure/${rilievi[0].id}`)
                }}
                style={{ width:'100%', border:'none', cursor:'pointer', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.25)', position:'relative', zIndex:2,
                  background: azione.colore==='ocra' ? 'linear-gradient(160deg,var(--ocra),var(--ocra-deep))' : azione.colore==='success' ? 'linear-gradient(160deg,var(--success),#1F5A3D)' : azione.colore==='blue' ? 'linear-gradient(160deg,var(--blue),var(--blue-deep))' : 'linear-gradient(160deg,var(--teal),var(--teal-deep))',
                  boxShadow: azione.colore==='ocra' ? '0 6px 14px rgba(200,138,23,0.45),inset 0 3px 6px rgba(255,255,255,0.25)' : '0 6px 14px rgba(20,80,90,0.45),inset 0 3px 6px rgba(255,255,255,0.22)',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                {azione.cta}
              </button>
            </div>
          </div>
        </div>

        {/* ── SEZIONE RILIEVI ── */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.8, textTransform:'uppercase' }}>
              {rilievi.length} RILIEV{rilievi.length===1?'O':'I'}
            </div>
            <button onClick={() => router.push(`/commesse/${id}/rilievo/nuovo`)} style={{ border:'none', cursor:'pointer', borderRadius:999, padding:'6px 14px', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', fontFamily:"'Fredoka',sans-serif", fontSize:12, fontWeight:700, boxShadow:'0 3px 8px rgba(20,80,90,0.35)', display:'flex', alignItems:'center', gap:5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Nuovo rilievo
            </button>
          </div>

          {rilievi.length === 0 ? (
            /* CTA tratteggiata */
            <button onClick={() => router.push(`/commesse/${id}/rilievo/nuovo`)} style={{ width:'100%', border:'2px dashed rgba(31,111,120,0.3)', borderRadius:18, padding:'20px 16px', cursor:'pointer', background:'linear-gradient(160deg,rgba(220,236,237,0.3),rgba(197,221,222,0.3))', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all 0.2s' }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'var(--teal-bg)', display:'grid', placeItems:'center', boxShadow:'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, color:'var(--teal)', textAlign:'center' }}>+ CREA PRIMO RILIEVO</div>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-dim)', fontWeight:600, textAlign:'center' }}>Vai dal cliente e prendi le misure</div>
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {rilievi.map((r:any) => (
                <RilievoCard key={r.id} rilievo={r} commessaId={id} onPress={() => router.push(`/misure/${r.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* ── STORIA / TIMELINE ── */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.8, textTransform:'uppercase', marginBottom:8 }}>STORIA</div>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-5, borderRadius:22, background:'var(--surface-2)', filter:'blur(8px)', opacity:0.35, zIndex:-1 }} />
            <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:18, padding:'12px 14px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
              {/* Timeline items */}
              {[
                { icon:'check', colore:'success', testo:`Commessa creata`, data: cm.created_at },
                rilievi.length > 0 && { icon:'ruler', colore:'teal', testo:`Primo rilievo: ${rilievi[0].tipo_rilievo||'semplice'}`, data: rilievi[0]?.created_at },
                cm.totale_preventivo && { icon:'doc', colore:'blue', testo:`Preventivo: €${Math.round(cm.totale_preventivo).toLocaleString('it')}`, data: cm.updated_at },
                (cm.fase === 'confermata' || cm.fase === 'confermata_ordine') && { icon:'sign', colore:'ocra', testo:'Commessa confermata dal cliente', data: cm.updated_at },
              ].filter(Boolean).map((item:any, i:number, arr) => (
                <div key={i} style={{ display:'flex', gap:12, paddingBottom: i < arr.length-1 ? 12 : 0, position:'relative' }}>
                  {i < arr.length-1 && <div style={{ position:'absolute', left:14, top:28, width:2, height:'calc(100% - 14px)', background:'var(--surface-3)' }} />}
                  <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'grid', placeItems:'center', background: item.colore==='success'?'var(--success-bg)': item.colore==='teal'?'var(--teal-bg)': item.colore==='blue'?'var(--blue-bg)':'var(--ocra-bg)', boxShadow:'inset 0 1.5px 3px rgba(255,255,255,0.5),0 1px 3px rgba(60,50,30,0.1)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.colore==='success'?'var(--success)': item.colore==='teal'?'var(--teal-deep)': item.colore==='blue'?'var(--blue)':'var(--ocra-deep)'} strokeWidth="2.2" strokeLinecap="round">
                      {item.icon==='check' && <><polyline points="20 6 9 17 4 12"/></>}
                      {item.icon==='ruler' && <><path d="M21 3L3 21M8 3v4M12 3v2M16 3v4M3 8h4M3 12h2M3 16h4"/></>}
                      {item.icon==='doc' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
                      {item.icon==='sign' && <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                    </svg>
                  </div>
                  <div style={{ flex:1, paddingTop:4 }}>
                    <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700, color:'var(--ink)' }}>{item.testo}</div>
                    {item.data && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:'var(--ink-soft)', marginTop:2 }}>{new Date(item.data).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── INFO COMMESSA ── */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:'var(--ink-dim)', letterSpacing:1.8, textTransform:'uppercase', marginBottom:8 }}>DATI COMMESSA</div>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-5, borderRadius:22, background:'var(--surface-2)', filter:'blur(8px)', opacity:0.35, zIndex:-1 }} />
            <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:18, padding:'12px 14px', boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 6px 14px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
              {[
                cm.telefono && { label:'Telefono', value:cm.telefono, link:`tel:${cm.telefono}` },
                cm.email && { label:'Email', value:cm.email, link:`mailto:${cm.email}` },
                cm.indirizzo && { label:'Indirizzo', value:cm.indirizzo },
                cm.tipo && { label:'Tipo', value:cm.tipo },
                { label:'Creata', value: new Date(cm.created_at).toLocaleDateString('it-IT') },
              ].filter(Boolean).map((row:any, i:number, arr) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(60,50,30,0.05)' : 'none' }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:'var(--ink-dim)', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' }}>{row.label}</span>
                  {row.link
                    ? <a href={row.link} style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600, color:'var(--teal)', textDecoration:'none' }}>{row.value}</a>
                    : <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600, color:'var(--ink)' }}>{row.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bottom-spacer" />
      </div>

      <BottomNav active="commesse" />
    </div>
  )
}

// ── RILIEVO CARD ─────────────────────────────────────────
function RilievoCard({ rilievo: r, commessaId, onPress }: { rilievo:any; commessaId:string; onPress:()=>void }) {
  const nVani = r.vani?.length || 0
  const tipoColor = r.tipo_misure === 'definitive' ? 'success' : r.tipo_misure === 'verificate' ? 'teal' : r.tipo_misure === 'da_rivedere' ? 'red' : 'ocra'
  const colMap: Record<string,{bg:string;text:string}> = {
    success:{bg:'var(--success-bg)',text:'var(--success)'},
    teal:{bg:'var(--teal-bg)',text:'var(--teal-deep)'},
    ocra:{bg:'var(--ocra-bg)',text:'var(--ocra-deep)'},
    red:{bg:'var(--red-bg)',text:'var(--red-deep)'},
  }
  const col = colMap[tipoColor]

  return (
    <div onClick={onPress} style={{ position:'relative', cursor:'pointer' }}>
      <div style={{ position:'absolute', inset:-4, borderRadius:20, background:'var(--surface-2)', filter:'blur(7px)', opacity:0.35, zIndex:-1 }} />
      <div style={{ background:'linear-gradient(160deg,var(--surface),var(--surface-2))', borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 0 0 1px rgba(60,50,30,0.05),0 5px 12px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' }}>
        {/* Icona */}
        <div style={{ width:42, height:42, borderRadius:13, background:'var(--teal-bg)', display:'grid', placeItems:'center', flexShrink:0, boxShadow:'inset 0 2px 4px rgba(255,255,255,0.5),0 2px 5px rgba(20,80,90,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 3L3 21M8 3v4M12 3v2M16 3v4M3 8h4M3 12h2M3 16h4"/></svg>
        </div>
        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, color:'var(--ink)' }}>Rilievo {r.tipo_rilievo||'semplice'}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:999, background:col.bg, color:col.text, letterSpacing:0.5 }}>{(r.tipo_misure||'provvisorie').toUpperCase()}</span>
          </div>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:'var(--ink-dim)', fontWeight:600 }}>
            {nVani} van{nVani===1?'o':'i'} · {new Date(r.created_at||Date.now()).toLocaleDateString('it-IT')}
            {r.rilevatore && ` · ${r.rilevatore}`}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>
  )
}
