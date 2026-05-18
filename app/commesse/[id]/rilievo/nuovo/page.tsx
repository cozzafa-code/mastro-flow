'use client'
export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'

type TipoRilievo = 'semplice' | 'complesso'
type TipoMisure = 'provvisorie' | 'verificate' | 'definitive' | 'da_rivedere' | 'personalizzato'

export default function NuovoRilievoPage() {
  const params = useParams()
  const router = useRouter()
  const commessaId = params.id as string

  const [tipoRilievo, setTipoRilievo] = useState<TipoRilievo>('semplice')
  const [tipoMisure, setTipoMisure] = useState<TipoMisure>('provvisorie')
  const [rilevatore, setRilevatore] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch commessa info per header
  const [cmCode, setCmCode] = useState('')
  const [cmCliente, setCmCliente] = useState('')
  useState(() => {
    fetch(`/api/commesse/${commessaId}`)
      .then(r => r.json())
      .then(j => { if (j.commessa) { setCmCode(j.commessa.code); setCmCliente(j.commessa.cliente) } })
      .catch(() => {})
  })

  const handleCrea = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/rilievi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commessa_id: commessaId,
          tipo_rilievo: tipoRilievo,
          tipo_misure: tipoMisure,
          rilevatore: rilevatore.trim() || null,
          note: note.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      // Naviga alla lista vani del rilievo
      router.push(`/misure/${json.rilievo.id}`)
    } catch (e) {
      alert('Errore: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="phone-screen">
      <div className="page">

        {/* â”€â”€ HEADER â”€â”€ */}
        <div style={{ padding:'14px 18px 16px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:26, fontWeight:600, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.05, textShadow:'0 1px 0 rgba(255,255,255,0.55)' }}>
              Nuovo rilievo
            </div>
            <div style={{ fontSize:12, color:'var(--ink-dim)', marginTop:6, letterSpacing:0.2, display:'flex', alignItems:'center', gap:6 }}>
              Commessa
              {cmCode && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'var(--teal-deep)', background:'var(--teal-bg)', padding:'2px 7px', borderRadius:6, fontSize:10, boxShadow:'inset 0 1px 2px rgba(20,80,90,0.15)' }}>{cmCode}</span>
              )}
              {cmCliente && <span style={{ fontWeight:700 }}>Â· {cmCliente.toUpperCase()}</span>}
            </div>
          </div>
          {/* Close knob avorio fluffy */}
          <button onClick={() => router.back()} style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--ink-2)', flexShrink:0, position:'relative', boxShadow:'0 0 0 1px rgba(60,50,30,0.07),0 5px 12px rgba(60,50,30,0.2),inset 0 3.5px 6px rgba(255,255,255,0.7),inset 0 -2.5px 5px rgba(0,0,0,0.07)' }}>
            <div style={{ position:'absolute', top:'14%', left:'24%', width:'34%', height:'20%', background:'rgba(255,255,255,0.6)', borderRadius:'50%', filter:'blur(2.5px)' }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" style={{ position:'relative', zIndex:2 }}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* â”€â”€ BODY â”€â”€ */}
        <div style={{ padding:'0 16px 24px', display:'flex', flexDirection:'column', gap:18 }}>

          {/* TIPO RILIEVO */}
          <div>
            <div style={secLabelStyle}>TIPO RILIEVO</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
              {[
                { id:'semplice', titolo:'Semplice', desc:'Vani senza gerarchia' },
                { id:'complesso', titolo:'Complesso', desc:'Organizza per zone/piani' },
              ].map(opt => {
                const sel = tipoRilievo === opt.id
                return (
                  <div key={opt.id} style={{ position:'relative' }}>
                    {sel && <div style={{ position:'absolute', inset:-5, borderRadius:22, background:'var(--teal)', filter:'blur(12px)', opacity:0.45, zIndex:-1 }} />}
                    <button onClick={() => setTipoRilievo(opt.id as TipoRilievo)} style={{
                      width:'100%', border:'none', cursor:'pointer', borderRadius:16, padding:'13px 14px', textAlign:'left', position:'relative', overflow:'hidden', transition:'all 0.18s',
                      background: sel ? 'linear-gradient(160deg,var(--teal),var(--teal-deep))' : 'linear-gradient(160deg,var(--surface),var(--surface-2))',
                      boxShadow: sel ? '0 0 0 1px rgba(0,0,0,0.08),0 10px 22px rgba(20,80,90,0.5),inset 0 3.5px 6px rgba(255,255,255,0.25),inset 0 -3px 5px rgba(0,0,0,0.22)' : '0 0 0 1px rgba(60,50,30,0.06),0 6px 14px rgba(60,50,30,0.16),inset 0 3.5px 6px rgba(255,255,255,0.65)',
                    }}>
                      <div style={{ position:'absolute', top:'10%', left:'12%', width:'32%', height:'18%', background: sel?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.55)', borderRadius:'50%', filter:'blur(8px)', pointerEvents:'none' }} />
                      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, color: sel?'#fff':'var(--ink)', letterSpacing:-0.2, lineHeight:1.1, textShadow: sel?'0 1px 2px rgba(0,0,0,0.25)':'0 1px 0 rgba(255,255,255,0.5)', position:'relative', zIndex:2 }}>{opt.titolo}</div>
                      <div style={{ fontSize:11, color: sel?'rgba(255,255,255,0.85)':'var(--ink-dim)', marginTop:5, lineHeight:1.4, fontWeight:600, position:'relative', zIndex:2 }}>{opt.desc}</div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TIPO MISURE */}
          <div>
            <div style={secLabelStyle}>TIPO MISURE</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
              {[
                { id:'provvisorie', titolo:'Provvisorie', desc:'Prima visita, misure indicative' },
                { id:'verificate', titolo:'Verificate', desc:'Controllate sul posto' },
                { id:'definitive', titolo:'Definitive', desc:'Misure finali, preventivo sbloccato' },
                { id:'da_rivedere', titolo:'Da rivedere', desc:'Discrepanze, ricontrollare' },
                { id:'personalizzato', titolo:'Personalizzato', desc:'Tipo a scelta, descrivi nelle note', wide:true },
              ].map(opt => {
                const sel = tipoMisure === opt.id
                return (
                  <div key={opt.id} style={{ position:'relative', gridColumn: opt.wide ? 'span 2' : undefined }}>
                    {sel && <div style={{ position:'absolute', inset:-5, borderRadius:22, background:'var(--ocra)', filter:'blur(12px)', opacity:0.5, zIndex:-1 }} />}
                    <button onClick={() => setTipoMisure(opt.id as TipoMisure)} style={{
                      width:'100%', border:'none', cursor:'pointer', borderRadius:16, padding:'13px 14px', textAlign:'left', position:'relative', overflow:'hidden', transition:'all 0.18s',
                      background: sel ? 'linear-gradient(160deg,var(--ocra),var(--ocra-deep))' : 'linear-gradient(160deg,var(--surface),var(--surface-2))',
                      boxShadow: sel ? '0 0 0 1px rgba(0,0,0,0.08),0 10px 22px rgba(200,138,23,0.55),inset 0 3.5px 6px rgba(255,255,255,0.3),inset 0 -3px 5px rgba(0,0,0,0.18)' : '0 0 0 1px rgba(60,50,30,0.06),0 6px 14px rgba(60,50,30,0.16),inset 0 3.5px 6px rgba(255,255,255,0.65)',
                    }}>
                      <div style={{ position:'absolute', top:'10%', left:'12%', width:'32%', height:'18%', background: sel?'rgba(255,255,255,0.28)':'rgba(255,255,255,0.55)', borderRadius:'50%', filter:'blur(8px)', pointerEvents:'none' }} />
                      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:700, color: sel?'#fff':'var(--ink)', letterSpacing:-0.2, lineHeight:1.1, textShadow: sel?'0 1px 2px rgba(0,0,0,0.25)':'0 1px 0 rgba(255,255,255,0.5)', position:'relative', zIndex:2 }}>{opt.titolo}</div>
                      <div style={{ fontSize:11, color: sel?'rgba(255,255,255,0.92)':'var(--ink-dim)', marginTop:5, lineHeight:1.4, fontWeight:600, position:'relative', zIndex:2 }}>{opt.desc}</div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CHI HA FATTO IL RILIEVO */}
          <div>
            <div style={secLabelStyle}>CHI HA FATTO IL RILIEVO</div>
            <input
              style={inputStyle}
              placeholder="Nome rilevatore"
              value={rilevatore}
              onChange={e => setRilevatore(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* NOTE */}
          <div>
            <div style={secLabelStyle}>NOTE (OPZIONALE)</div>
            <textarea
              style={{ ...inputStyle, resize:'none', minHeight:80, lineHeight:1.4 } as React.CSSProperties}
              placeholder="Es. Seconda visita dopo modifiche"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* ACTIONS */}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            {/* Annulla */}
            <button onClick={() => router.back()} style={{ flex:1, background:'linear-gradient(160deg,#FCF7E8,var(--surface-2))', border:'none', borderRadius:16, padding:'15px 14px', fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, color:'var(--ink-2)', cursor:'pointer', position:'relative', boxShadow:'0 0 0 1px rgba(60,50,30,0.07),0 5px 12px rgba(60,50,30,0.18),inset 0 3.5px 6px rgba(255,255,255,0.7)', textShadow:'0 1px 0 rgba(255,255,255,0.45)' }}>
              <div style={{ position:'absolute', top:'14%', left:'22%', width:'32%', height:'18%', background:'rgba(255,255,255,0.55)', borderRadius:'50%', filter:'blur(3px)' }} />
              <span style={{ position:'relative', zIndex:1 }}>Annulla</span>
            </button>

            {/* Crea rilievo */}
            <div style={{ flex:2, position:'relative' }}>
              <div style={{ position:'absolute', inset:-6, borderRadius:22, background:'var(--teal)', filter:'blur(13px)', opacity:0.5, zIndex:-1 }} />
              <button onClick={handleCrea} disabled={saving} style={{ width:'100%', background:'linear-gradient(160deg,var(--teal),var(--teal-deep))', color:'#fff', border:'none', borderRadius:16, padding:'15px 14px', fontFamily:"'Fredoka',sans-serif", fontSize:14, fontWeight:700, letterSpacing:0.3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, position:'relative', boxShadow:'0 0 0 1px rgba(0,0,0,0.07),0 10px 20px rgba(20,80,90,0.5),inset 0 3.5px 6px rgba(255,255,255,0.25),inset 0 -3px 5px rgba(0,0,0,0.22)', textShadow:'0 1px 2px rgba(0,0,0,0.25)', opacity: saving ? 0.7 : 1 }}>
                <div style={{ position:'absolute', top:'14%', left:'22%', width:'30%', height:'18%', background:'rgba(255,255,255,0.3)', borderRadius:'50%', filter:'blur(4px)', pointerEvents:'none' }} />
                <span style={{ position:'relative', zIndex:1 }}>{saving ? 'Creazioneâ€¦' : 'Crea rilievo Â· Aggiungi vani'}</span>
                {!saving && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" style={{ position:'relative', zIndex:1 }}>
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const secLabelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10, fontWeight: 800, color: 'var(--ink-dim)',
  letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 9, padding: '0 4px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))',
  border: 'none', borderRadius: 14, padding: '14px 15px',
  fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
  color: 'var(--ink)', outline: 'none',
  boxShadow: 'inset 0 3.5px 6px rgba(60,50,30,0.13), inset 0 -1px 2px rgba(255,255,255,0.45)',
}

