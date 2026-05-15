import React, { useEffect, useState } from 'react'
import { PROD_COLORS } from './prod-constants'
import { fetchOperatoriDisponibili, spostaOperatoreVano } from '@/hooks/useVanoDetail'

export function SheetSpostaOperatore({ aziendaId, vanoStatoId, onChiudi, onFatto }: { aziendaId: string; vanoStatoId: string; onChiudi: () => void; onFatto: () => void }) {
  const [operatori, setOperatori] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchOperatoriDisponibili(aziendaId).then(d => { setOperatori(d); setLoading(false) })
  }, [aziendaId])

  const handleScegli = async (opId: string) => {
    setSaving(opId)
    const ok = await spostaOperatoreVano(vanoStatoId, opId)
    if (ok) onFatto()
    else { alert('Errore'); setSaving(null) }
  }

  return (
    <div onClick={onChiudi} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF', borderRadius: '14px 14px 0 0', padding: 16, width: '100%', maxWidth: 380, maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: PROD_COLORS.navy }}>Sposta operatore</div>
          <button onClick={onChiudi} style={{ background: 'none', border: 'none', fontSize: 22, color: PROD_COLORS.textDim, cursor: 'pointer' }}>×</button>
        </div>
        {loading ? <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Caricamento...</div>
        : operatori.length === 0 ? <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: PROD_COLORS.textDim }}>Nessun operatore disponibile</div>
        : operatori.map(op => {
            const init = (op.nome[0] || '') + ((op.cognome || '')[0] || '')
            return (
              <div key={op.id} onClick={() => !saving && handleScegli(op.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, marginBottom: 4, border: `1px solid ${PROD_COLORS.borderSoft}`, cursor: saving ? 'wait' : 'pointer', opacity: saving && saving !== op.id ? 0.4 : 1 }}>
                <div style={{ width: 32, height: 32, background: op.colore || PROD_COLORS.teal, borderRadius: '50%', color: '#FFF', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{init}</div>
                <div style={{ flex: 1, fontSize: 12, color: PROD_COLORS.navy, fontWeight: 500 }}>{op.nome} {op.cognome || ''}</div>
                {saving === op.id && <span style={{ fontSize: 10, color: PROD_COLORS.teal }}>...</span>}
              </div>
            )
          })}
      </div>
    </div>
  )
}
