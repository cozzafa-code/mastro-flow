'use client'
export const dynamic = 'force-dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import MastroProvider from '@/components/MastroProvider'
import VanoDetailPanel from '@/components/VanoDetailPanel'
import { useMastro } from '@/components/MastroContext'

function Inner({ vano, onBack }: { vano: any, onBack: () => void }) {
  const { selectedVano } = useMastro()
  return <VanoDetailPanel />
}

export default function VanoPage() {
  const params = useParams()
  const router = useRouter()
  const vanoId = params.vanoId as string
  const rilievoId = params.rilievoId as string
  const [vano, setVano] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vani?id=${vanoId}`)
      .then(r => r.json())
      .then(j => { if (j.vano) setVano(j.vano) })
      .finally(() => setLoading(false))
  }, [vanoId])

  if (loading) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--ink-dim)' }}>Caricamento…</span>
    </div>
  )
  if (!vano) return (
    <div className="phone-screen" style={{ display:'grid', placeItems:'center' }}>
      <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:18, color:'var(--red)' }}>Vano non trovato</span>
    </div>
  )

  return (
    <MastroProvider initialVano={vano}>
      <div className="phone-screen">
        <div className="page">
          <VanoDetailPanel />
        </div>
      </div>
    </MastroProvider>
  )
}
