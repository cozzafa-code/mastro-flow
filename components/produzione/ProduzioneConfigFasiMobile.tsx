'use client'
import React, { useState } from 'react'
import { useConfigFasi } from '@/hooks/useConfigFasi'
import { PROD_COLORS } from './prod-constants'
import { 
  HeaderConfig, BannerInfo, FaseRowConfig, FlussoPreview,
  ModalNuovaFase, ModalNuovaMacchina 
} from './config-fasi-parts'

interface Props {
  aziendaId: string
  aziendaNome?: string
  onChiudi: () => void
}

export default function ProduzioneConfigFasiMobile({ aziendaId, aziendaNome = 'Officina', onChiudi }: Props) {
  const { 
    fasi, loading, error, refetch,
    aggiornaOrdineFasi, toggleFaseAttiva, aggiungiFase, eliminaFase,
    aggiungiMacchina, toggleStatoMacchina, eliminaMacchina
  } = useConfigFasi(aziendaId)

  const [faseEspansa, setFaseEspansa] = useState<string | null>(null)
  const [modalNuovaFase, setModalNuovaFase] = useState(false)
  const [modalNuovaMacchina, setModalNuovaMacchina] = useState<{ faseId: string; faseNome: string } | null>(null)

  if (loading) {
    return <div style={{ padding: 30, textAlign: 'center', color: PROD_COLORS.textDim, fontSize: 12 }}>Caricamento configurazione...</div>
  }
  if (error) {
    return (
      <div style={{ padding: 16, background: PROD_COLORS.redBg, color: PROD_COLORS.red, fontSize: 13 }}>
        Errore: {error}
      </div>
    )
  }

  const fasiAttive = fasi.filter(f => f.attiva).length

  const spostaFase = (idx: number, direzione: 'su' | 'giu') => {
    const newIdx = direzione === 'su' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= fasi.length) return
    const reordered = [...fasi]
    const [movedItem] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, movedItem)
    aggiornaOrdineFasi(reordered.map(f => f.id))
  }

  const eliminaFaseConferma = (faseId: string, nome: string) => {
    if (confirm(`Eliminare la fase "${nome}"? Le macchine associate diventeranno orfane.`)) {
      eliminaFase(faseId)
    }
  }

  const eliminaMacchinaConferma = (id: string, nome: string) => {
    if (confirm(`Eliminare la macchina "${nome}"?`)) {
      eliminaMacchina(id)
    }
  }

  return (
    <div style={{ background: PROD_COLORS.bgPage, minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: 30 }}>
      <HeaderConfig aziendaNome={aziendaNome} totFasiAttive={fasiAttive} onChiudi={onChiudi} />
      <BannerInfo />

      <div style={{ padding: '0 12px' }}>
        {fasi.length === 0 ? (
          <div style={{ background: '#FFF', borderRadius: 10, padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim, border: `1px dashed ${PROD_COLORS.borderSoft}` }}>
            Nessuna fase configurata. Aggiungi la prima per iniziare.
          </div>
        ) : (
          fasi.map((fase, idx) => (
            <FaseRowConfig 
              key={fase.id}
              fase={fase}
              espansa={faseEspansa === fase.id}
              onToggleEspansa={() => setFaseEspansa(faseEspansa === fase.id ? null : fase.id)}
              onToggleAttiva={(attiva) => toggleFaseAttiva(fase.id, attiva)}
              onElimina={() => eliminaFaseConferma(fase.id, fase.nome)}
              onAggiungiMacchina={() => setModalNuovaMacchina({ faseId: fase.id, faseNome: fase.nome })}
              onToggleMacchina={toggleStatoMacchina}
              onEliminaMacchina={(id) => {
                const mac = fase.macchine.find(m => m.id === id)
                if (mac) eliminaMacchinaConferma(id, mac.nome)
              }}
              onSposta={(dir) => spostaFase(idx, dir)}
            />
          ))
        )}

        <button 
          onClick={() => setModalNuovaFase(true)} 
          style={{ width: '100%', background: '#FFF', color: PROD_COLORS.teal, border: `1px dashed ${PROD_COLORS.teal}`, padding: 12, borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginTop: 6, cursor: 'pointer' }}>
          + AGGIUNGI FASE
        </button>
      </div>

      <FlussoPreview fasi={fasi} />

      {modalNuovaFase && (
        <ModalNuovaFase 
          onAnnulla={() => setModalNuovaFase(false)}
          onConferma={async (nome, colore) => {
            await aggiungiFase(nome, colore)
            setModalNuovaFase(false)
          }}
        />
      )}

      {modalNuovaMacchina && (
        <ModalNuovaMacchina
          faseNome={modalNuovaMacchina.faseNome}
          onAnnulla={() => setModalNuovaMacchina(null)}
          onConferma={async (nome, modello, capacita) => {
            await aggiungiMacchina(modalNuovaMacchina.faseId, nome, modello || undefined, capacita || undefined)
            setModalNuovaMacchina(null)
          }}
        />
      )}
    </div>
  )
}
