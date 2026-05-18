'use client'
export const dynamic = 'force-dynamic'
import { useParams, useRouter } from 'next/navigation'
import { VanoDetailPanel } from '@/app/misure/components/VanoDetailPanel'

export default function VanoPage() {
  const params = useParams()
  const router = useRouter()
  const rilievoId = params.rilievoId as string
  const vanoId = params.vanoId as string
  return (
    <VanoDetailPanel
      vanoId={vanoId}
      rilievoId={rilievoId}
      onBack={() => router.push(`/misure/${rilievoId}`)}
    />
  )
}
