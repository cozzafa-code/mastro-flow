'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const T = '#28A0A0';
const DARK = '#0D1F1F';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !nome) { setError('Compila tutti i campi'); return; }
    if (password.length < 8) { setError('Password minimo 8 caratteri'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { nome_completo: nome } }
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/onboarding');
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Inserisci email e password'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError('Credenziali non valide'); setLoading(false); return; }
    router.push('/app');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E8F4F4',
      backgroundImage: 'linear-gradient(rgba(40,160,160,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.12) 1px,transparent 1px)',
      backgroundSize: '24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui,sans-serif' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="40" height="40">
          <g><rect x="95" y="15" width="8" height="8" rx="2" fill="#2FA7A2"/>
          <rect x="128" y="24" width="8" height="8" rx="2" fill="#7ED957"/>
          <rect x="152" y="48" width="8" height="8" rx="2" fill="#F59E0B"/>
          <rect x="162" y="93" width="8" height="8" rx="2" fill="#7ED957"/>
          <rect x="152" y="138" width="8" height="8" rx="2" fill="#F59E0B"/>
          <rect x="128" y="162" width="8" height="8" rx="2" fill="#7ED957"/>
          <rect x="95" y="172" width="8" height="8" rx="2" fill="#2FA7A2"/>
          <rect x="62" y="162" width="8" height="8" rx="2" fill="#F59E0B"/>
          <rect x="38" y="138" width="8" height="8" rx="2" fill="#7ED957"/>
          <rect x="28" y="93" width="8" height="8" rx="2" fill="#F59E0B"/>
          <rect x="38" y="48" width="8" height="8" rx="2" fill="#7ED957"/>
          <rect x="62" y="24" width="8" height="8" rx="2" fill="#F59E0B"/></g>
          <g transform="rotate(8 100 100)">
            <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
            <path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
            <path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
          </g>
        </svg>
        <span style={{ fontSize: 28, fontWeight: 900, color: DARK }}>fliwo<span style={{ color: T }}>X</span></span>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(40,160,160,0.2)',
        boxShadow: '0 8px 32px rgba(13,31,31,0.12)', padding: '32px 24px' }}>

        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: DARK }}>Crea il tuo account</h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#4A7070' }}>15 giorni gratis · Nessuna carta richiesta</p>

        {error && <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelS}>Nome e cognome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Mario Rossi" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@serramenti.it" type="email" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimo 8 caratteri" type="password" style={inputS} />
          </div>

          <button onClick={handleRegister} disabled={loading} style={{
            width: '100%', padding: '14px 0', marginTop: 8,
            background: T, color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 5px 0 0 #156060', opacity: loading ? 0.7 : 1,
            fontFamily: 'system-ui,sans-serif'
          }}>
            {loading ? 'Creazione account...' : 'Inizia gratis →'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#4A7070', marginTop: 4 }}>
            Hai già un account?{' '}
            <button onClick={handleLogin} disabled={loading} style={{ background: 'none', border: 'none', color: T, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Accedi
            </button>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: '#4A7070', textAlign: 'center' }}>
        Registrandoti accetti i{' '}
        <a href="/termini" style={{ color: T }}>Termini di Servizio</a> e la{' '}
        <a href="/privacy" style={{ color: T }}>Privacy Policy</a>
      </p>
    </div>
  );
}

const labelS: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#0D1F1F', marginBottom: 5 };
const inputS: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1px solid #C8E4E4', borderRadius: 10, fontSize: 15, background: '#F8FCFC', color: '#0D1F1F', outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' };
