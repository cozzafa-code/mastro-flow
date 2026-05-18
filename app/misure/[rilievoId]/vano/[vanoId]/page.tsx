'use client'
export const dynamic = 'force-dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import MastroProvider from '@/components/MastroProvider'
import VanoDetailPanel from '@/components/VanoDetailPanel'

export default function VanoPage() {
  const params = useParams()
  const vanoId = params.vanoId as string
  const [vano, setVano] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vani?id=${vanoId}`)
      .then(r => r.json())
      .then(j => { if (j.vano) setVano(j.vano) })
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

  return (
    <MastroProvider initialVano={vano}>
      <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'var(--bg, #ECE6D6)' }}>
        <VanoDetailPanel />
      </div>
    </MastroProvider>
  )
}
