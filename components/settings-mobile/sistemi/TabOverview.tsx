// components/settings-mobile/sistemi/TabOverview.tsx
// Overview: prezzi €/kg per azienda + statistiche aggregate.

'use client'

import React, { useState, useEffect } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { SistemaConStats, AziendaSistemaAttivo } from '@/lib/types/sistemi'
import { supabase } from '@/lib/supabase'

interface Props {
  sistema: SistemaConStats
  sis: any
}

export default function TabOverview({ sistema, sis }: Props) {
  const [att, setAtt] = useState<AziendaSistemaAttivo | null>(null)
  const [listino, setListino] = useState<string>('')
  const [netto, setNetto] = useState<string>('')
  const [sconto, setSconto] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!sistema.attivazione_id) {
      setAtt(null)
      setListino(''); setNetto(''); setSconto('')
      return
    }
    supabase
      .from('azienda_sistemi_attivi')
      .select('*')
      .eq('id', sistema.attivazione_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setAtt(data as AziendaSistemaAttivo)
          setListino(data.prezzo_kg_listino?.toString() ?? '')
          setNetto(data.prezzo_kg_netto?.toString() ?? '')
          setSconto(data.sconto_perc?.toString() ?? '')
        }
      })
  }, [sistema.attivazione_id])

  async function salvaPrezzi() {
    setSaving(true)
    const r = await sis.setPrezzoKg(
      sistema.id,
      listino === '' ? null : Number(listino),
      netto === '' ? null : Number(netto),
      sconto === '' ? null : Number(sconto)
    )
    setSaving(false)
    if (!r.ok) alert(r.error)
  }

  // Auto-calcola netto da listino + sconto se modificati
  function autoCalcNetto(l: string, sc: string) {
    if (l && sc) {
      const n = Number(l) * (1 - Number(sc) / 100)
      setNetto(n.toFixed(2))
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Stat icona="📐" label="Profili" valore={sistema.n_profili} colore={T.acc} />
        <Stat icona="🎨" label="Colori" valore={sistema.n_colori} colore={T.numBlue} />
        <Stat icona="🪟" label="Vetri" valore={sistema.n_vetri} colore={T.numAmber} />
      </div>

      {/* PREZZI */}
      <div style={{
        background: '#FFF',
        border: `1px solid ${T.bdr}`,
        borderRadius: 12,
        padding: 14,
        boxShadow: T.shadow,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.muted, marginBottom: 10 }}>
          PREZZO €/KG (azienda)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <NumField
            label="Listino"
            v={listino}
            onChange={(x) => { setListino(x); autoCalcNetto(x, sconto) }}
          />
          <NumField
            label="Sconto %"
            v={sconto}
            onChange={(x) => { setSconto(x); autoCalcNetto(listino, x) }}
          />
        </div>
        <NumField label="Netto" v={netto} onChange={setNetto} highlight />

        <button
          onClick={salvaPrezzi}
          disabled={saving}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '11px 0',
            borderRadius: 10,
            border: 'none',
            background: T.acc,
            color: '#FFF',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 3px 0 0 ' + T.accDeep,
          }}
        >{saving ? 'SALVATAGGIO...' : 'SALVA PREZZI'}</button>
      </div>

      {/* INFO */}
      <div style={{
        background: '#FFF',
        border: `1px solid ${T.bdr}`,
        borderRadius: 12,
        padding: 14,
        boxShadow: T.shadow,
      }}>
        <Info label="Marca" v={sistema.marca} />
        <Info label="Sistema" v={sistema.sistema} />
        <Info label="Materiale" v={sistema.materiale} />
        <Info label="ID interno" v={sistema.id} mono />
      </div>
    </div>
  )
}

function Stat({ icona, label, valore, colore }: { icona: string; label: string; valore: number; colore: string }) {
  return (
    <div style={{
      background: '#FFF',
      border: `1px solid ${T.bdr}`,
      borderRadius: 12,
      padding: 12,
      textAlign: 'center',
      boxShadow: T.shadow,
    }}>
      <div style={{
        width: 36, height: 36, margin: '0 auto 6px',
        borderRadius: 10,
        background: colore + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>{icona}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>{valore}</div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function NumField({ label, v, onChange, highlight }: { label: string; v: string; onChange: (x: string) => void; highlight?: boolean }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 4 }}>{label}</div>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 10px',
          borderRadius: 8,
          border: `1px solid ${highlight ? T.acc : T.bdr}`,
          background: highlight ? '#F0FBFB' : '#FFF',
          fontSize: 14,
          fontFamily: 'monospace',
          color: T.text,
        }}
      />
    </label>
  )
}

function Info({ label, v, mono }: { label: string; v: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '7px 0',
      borderBottom: `1px solid ${T.bdr}`,
      fontSize: 13,
    }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{
        color: T.text,
        fontWeight: 600,
        fontFamily: mono ? 'monospace' : undefined,
        fontSize: mono ? 11 : 13,
        opacity: mono ? 0.7 : 1,
      }}>{v}</span>
    </div>
  )
}
