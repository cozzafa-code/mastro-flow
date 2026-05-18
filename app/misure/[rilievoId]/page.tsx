'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getRilievo, createVano, getVaniRilievo } from '@/lib/misure-queries'
import { BottomNav } from '@/app/components/BottomNav'
import type { Rilievo, Vano, Settore } from '@/lib/misure-types'
import { SETTORI, isMisureComplete } from '@/lib/misure-types'

export default function RilievoPage() {
  const router = useRouter()
  const params = useParams()
  const rilievoId = params.rilievoId as string

  const [rilievo, setRilievo] = useState<Rilievo | null>(null)
  const [vani, setVani] = useState<Vano[]>([])
  const [loading, setLoading] = useState(true)
  const [addingVano, setAddingVano] = useState(false)
  const [settoreSheet, setSettoreSheet] = useState(false)

  useEffect(() => {
    Promise.all([
      getRilievo(rilievoId),
      getVaniRilievo(rilievoId),
    ]).then(([r, v]) => {
      if (r) setRilievo(r)
      setVani(v)
      setLoading(false)
    })
  }, [rilievoId])

  const handleAddVano = async (settore: Settore) => {
    setSettoreSheet(false)
    setAddingVano(true)
    const settoreInfo = SETTORI.find(s => s.id === settore)
    const num = vani.filter(v => v.settore === settore).length + 1
    const vano = await createVano({
      rilievo_id: rilievoId,
      commessa_id: rilievo?.commessa_id,
      nome: `${settoreInfo?.label} ${num}`,
      settore,
      numero: vani.length + 1,
      tipo_misure: rilievo?.tipo_misure || 'provvisorie',
    })
    setAddingVano(false)
    if (vano) {
      router.push(`/misure/${rilievoId}/vano/${vano.id}`)
    }
  }

  if (loading) return (
    <div className="phone-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const totale = vani.length
  const completi = vani.filter(v => isMisureComplete(v.misure)).length

  return (
    <div className="phone-screen">
      {/* Topbar teal */}
      <div style={{ padding: '12px 14px 0', flexShrink: 0, position: 'relative', zIndex: 5 }}>
        <div style={{ position: 'absolute', inset: '12px 14px 0', borderRadius: 28, background: 'var(--teal)', filter: 'blur(14px)', opacity: 0.45, zIndex: -1 }} />
        <div style={{ background: 'linear-gradient(165deg, var(--teal), var(--teal-deep), var(--teal-darker))', borderRadius: 24, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 14px 30px rgba(20,80,90,0.5), inset 0 5px 10px rgba(255,255,255,0.18), inset 0 -4px 8px rgba(0,0,0,0.25)' }}>
          <div style={{ position: 'absolute', top: '8%', left: '10%', width: '36%', height: '22%', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', filter: 'blur(12px)' }} />
          <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 2.5px 4px rgba(255,255,255,0.28), 0 3px 6px rgba(0,0,0,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
              {rilievo?.commessa_codice} Â· {rilievo?.tipo_misure?.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: -0.4, lineHeight: 1, marginTop: 2, textShadow: '0 1.5px 3px rgba(0,0,0,0.3)' }}>
              Vani rilievo
            </div>
          </div>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 999, background: 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))', color: '#fff', boxShadow: '0 4px 9px rgba(200,138,23,0.5)', position: 'relative', zIndex: 2 }}>
            {completi}/{totale}
          </span>
        </div>
      </div>

      <div className="page">
        <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Lista vani */}
          {vani.map(vano => {
            const settore = SETTORI.find(s => s.id === vano.settore)
            const completo = isMisureComplete(vano.misure)
            return (
              <button key={vano.id} onClick={() => router.push(`/misure/${rilievoId}/vano/${vano.id}`)} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '13px 14px', background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 5px 12px rgba(60,50,30,0.14), inset 0 3px 6px rgba(255,255,255,0.6)' }}>
                <div style={{ position: 'absolute', top: '10%', left: '8%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(7px)' }} />
                <div style={{ width: 40, height: 40, borderRadius: 12, background: completo ? 'linear-gradient(160deg, var(--success), #1F5A3D)' : 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', display: 'grid', placeItems: 'center', color: completo ? '#fff' : 'var(--teal-deep)', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: completo ? '0 3px 8px rgba(47,125,87,0.35)' : '0 2px 6px rgba(20,80,90,0.12), inset 0 1.5px 3px rgba(255,255,255,0.6)' }}>
                  {completo ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700 }}>{vano.numero}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2, textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>{vano.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 2, fontWeight: 600 }}>{settore?.label} Â· {vano.stato}</div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: completo ? 'linear-gradient(160deg, var(--success-bg), var(--success-mid))' : 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', color: completo ? 'var(--success)' : 'var(--ocra-deep)', position: 'relative', zIndex: 2 }}>
                  {completo ? 'OK' : 'MANCA'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative', zIndex: 2 }}><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )
          })}

          {/* Bottone aggiungi vano */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -5, borderRadius: 22, background: addingVano ? 'var(--ocra)' : 'var(--teal)', filter: 'blur(12px)', opacity: 0.45, zIndex: -1 }} />
            <button
              onClick={() => setSettoreSheet(true)}
              disabled={addingVano}
              style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '14px', background: 'linear-gradient(160deg, var(--teal), var(--teal-deep))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.25)', boxShadow: '0 0 0 1px rgba(0,0,0,0.07), 0 8px 18px rgba(20,80,90,0.5), inset 0 3.5px 6px rgba(255,255,255,0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '14%', left: '22%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', filter: 'blur(5px)', pointerEvents: 'none' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" style={{ position: 'relative', zIndex: 1 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span style={{ position: 'relative', zIndex: 1 }}>{addingVano ? 'Creazione vanoâ€¦' : 'Aggiungi vano'}</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav mailCount={0} />

      {/* Sheet selezione settore */}
      <AnimatePresence>
        {settoreSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSettoreSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 201, background: 'linear-gradient(160deg, var(--surface), var(--bg-soft))', borderRadius: '28px 28px 0 0', boxShadow: '0 -12px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface-3)' }} />
              </div>
              <div style={{ padding: '14px 20px 8px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Tipo vano</div>
              </div>
              <div style={{ padding: '8px 16px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SETTORI.map(s => {
                  const colori = { bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', color: 'var(--teal-deep)' }
                  return (
                    <button key={s.id} onClick={() => handleAddVano(s.id)} style={{ border: 'none', cursor: 'pointer', borderRadius: 14, padding: '13px', background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.13), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: colori.bg, color: colori.color, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1.5px 3px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.07)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      </div>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

