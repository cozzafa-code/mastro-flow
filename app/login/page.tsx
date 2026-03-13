'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [azienda, setAzienda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o password non corretti')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri')
      setLoading(false)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } }
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Questa email Ã¨ giÃ  registrata. Prova ad accedere.'
        : authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: azError } = await supabase.from('aziende').insert({
        owner_id: authData.user.id,
        ragione: azienda || 'La mia azienda',
      })
      if (azError) console.error('Errore creazione azienda:', azError.message)
    }

    if (authData.user && !authData.session) {
      setSuccess('Controlla la tua email per confermare la registrazione!')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A1A1C 0%, #2d2d30 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#F2F1EC', borderRadius: 20, padding: '40px 32px',
        width: '100%', maxWidth: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em',
            color: '#1A1A1C', fontFamily: 'Georgia, serif',
          }}>MASTRO</div>
          <div style={{ fontSize: 11, color: '#86868b', fontWeight: 600, letterSpacing: '0.15em', marginTop: 2 }}>
            ERP SERRAMENTI
          </div>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Il tuo nome
                </label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Mario Rossi" required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e5ea', fontSize: 15, boxSizing: 'border-box', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Nome azienda
                </label>
                <input type="text" value={azienda} onChange={e => setAzienda(e.target.value)}
                  placeholder="Serramenti Rossi SRL" required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e5ea', fontSize: 15, boxSizing: 'border-box', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="nome@azienda.it" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e5ea', fontSize: 15, boxSizing: 'border-box', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required minLength={6}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e5ea', fontSize: 15, boxSizing: 'border-box', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #ff3b30', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff3b30', fontWeight: 600 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fff4', border: '1px solid #34c759', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#34c759', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: loading ? '#86868b' : 'linear-gradient(135deg, #D08008, #b86e06)',
            color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {loading
              ? (mode === 'login' ? 'Accesso in corso...' : 'Registrazione...')
              : (mode === 'login' ? 'Accedi â†’' : 'Crea account â†’')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#86868b' }}>
          {mode === 'login' ? (
            <>Non hai un account?{' '}
              <span onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                style={{ color: '#D08008', fontWeight: 700, cursor: 'pointer' }}>Registrati gratis</span>
            </>
          ) : (
            <>Hai giÃ  un account?{' '}
              <span onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ color: '#D08008', fontWeight: 700, cursor: 'pointer' }}>Accedi</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

