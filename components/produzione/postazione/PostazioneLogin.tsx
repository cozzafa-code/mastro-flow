'use client'
import React, { useState } from 'react'
import { loginOperatore } from '@/hooks/useOperatorPostazione'
import { PROD_COLORS } from '../prod-constants'

interface Props {
  aziendaId: string
  onLogin: (sess: any) => void
  onAnnulla: () => void
}

export default function PostazioneLogin({ aziendaId, onLogin, onAnnulla }: Props) {
  const [pin, setPin] = useState('')
  const [postazione, setPostazione] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const banchi = ['Banco Taglio', 'Saldatura', 'Vetri', 'Verniciatura', 'Controllo', 'Imballaggio', 'Generico']

  const tap = (n: string) => {
    setErr(null)
    if (n === 'del') setPin(p => p.slice(0, -1))
    else if (n === 'clr') setPin('')
    else if (pin.length < 4) setPin(p => p + n)
  }

  const tryLogin = async (p: string) => {
    setLoading(true)
    setErr(null)
    const sess = await loginOperatore(aziendaId, p, postazione || undefined)
    setLoading(false)
    if (sess) onLogin(sess)
    else { setErr('PIN non valido'); setPin('') }
  }

  React.useEffect(() => {
    if (pin.length === 4 && !loading) tryLogin(pin)
  }, [pin])

  const Key = ({ n, label }: { n: string; label?: string }) => (
    <button onClick={() => tap(n)} style={{
      background: '#FFF', color: PROD_COLORS.navy, border: `1px solid ${PROD_COLORS.borderSoft}`,
      borderRadius: 12, fontSize: 26, fontWeight: 500, padding: '18px 0', cursor: 'pointer',
    }}>{label || n}</button>
  )

  return (
    <div style={{ background: PROD_COLORS.navy, minHeight: '100vh', padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ color: '#FFF' }}>
          <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 0.5 }}>POSTAZIONE OPERATORE</div>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1, marginTop: 4 }}>Accedi col tuo PIN</div>
        </div>
        <button onClick={onAnnulla} style={{ background: 'transparent', color: '#FFF', border: 'none', fontSize: 28, lineHeight: 1, cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: PROD_COLORS.tealLight, letterSpacing: 0.5, marginBottom: 6 }}>BANCO / STAZIONE</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {banchi.map(b => (
            <button key={b} onClick={() => setPostazione(b)} style={{
              background: postazione === b ? PROD_COLORS.teal : 'rgba(255,255,255,0.08)',
              color: '#FFF', border: postazione === b ? 'none' : '1px solid rgba(255,255,255,0.15)',
              padding: '7px 12px', borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: 'pointer'
            }}>{b}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '20px 0' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 50, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
            border: `2px solid ${pin.length > i ? PROD_COLORS.teal : 'rgba(255,255,255,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFF', fontSize: 30, fontWeight: 600
          }}>{pin[i] ? '●' : ''}</div>
        ))}
      </div>

      {err && <div style={{ background: 'rgba(199,62,29,0.2)', color: '#F09595', padding: 10, borderRadius: 8, marginBottom: 10, textAlign: 'center', fontSize: 12 }}>{err}</div>}
      {loading && <div style={{ color: PROD_COLORS.tealLight, textAlign: 'center', marginBottom: 10, fontSize: 12 }}>Accesso in corso...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 320, margin: '0 auto', width: '100%' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <Key key={n} n={String(n)} />)}
        <Key n="clr" label="C" />
        <Key n="0" />
        <Key n="del" label="←" />
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', paddingTop: 20 }}>
        Non ricordi il PIN? Chiedi al responsabile officina.
      </div>
    </div>
  )
}
