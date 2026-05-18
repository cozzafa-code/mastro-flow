'use client'
export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import MastroProvider from '@/components/MastroProvider'
import VanoDetailPanel from '@/components/VanoDetailPanel'

export default function VanoPage() {
  const params = useParams()
  const vanoId = params.vanoId as string
  const rilievoId = params.rilievoId as string
  const [vano, setVano] = useState<any>(null)
  const [cm, setCm] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vani?id=${vanoId}`)
      .then(r => r.json())
      .then(async j => {
        if (j.vano) {
          setVano(j.vano)
          const cmRes = await fetch(`/api/commesse/${j.vano.commessa_id}`)
          const cmJson = await cmRes.json()
          if (cmJson.commessa) {
            setCm({ ...cmJson.commessa, rilievi: cmJson.commessa.rilievi || [] })
          }
        }
      })
      .finally(() => setLoading(false))
  }, [vanoId])

  if (loading) return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18 }}>Caricamento...</span>
    </div>
  )
  if (!vano) return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'red' }}>Vano non trovato</span>
    </div>
  )

  const rilievo = { id: rilievoId, vani: [vano] }

  return (
    <MastroProvider initialVano={vano} initialCM={cm} initialRilievo={rilievo}>
      <div style={{ position:'fixed', inset:0, overflow:'auto', background:'var(--bg, #ECE6D6)' }}>
        <VanoDetailPanel />
      </div>
    </MastroProvider>
  )
}
