'use client'
import { useState } from 'react'
import { DraggableFAB } from './DraggableFAB'
import { NuovaCommessaModal } from '@/app/commesse/components/NuovaCommessa/NuovaCommessaModal'

export function FABWrapper() {
  const [nuovaCommessaOpen, setNuovaCommessaOpen] = useState(false)

  return (
    <>
      <DraggableFAB
        onNuovaCommessa={() => setNuovaCommessaOpen(true)}
      />
      <NuovaCommessaModal
        isOpen={nuovaCommessaOpen}
        onClose={() => setNuovaCommessaOpen(false)}
        commessaId=""
        commessaCodice=""
        commessaCliente=""
      />
    </>
  )
}
