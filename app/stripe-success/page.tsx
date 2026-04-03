'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StripeSuccessPage() {
  const [status, setStatus] = useState('Attivazione abbonamento in corso...');
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const activate = async () => {
      // Aspetta che il webhook abbia processato
      await new Promise(r => setTimeout(r, 2000));
      setStatus('Account attivato! Accesso in corso...');
      await new Promise(r => setTimeout(r, 1000));

      // Controlla se utente è loggato
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/app?stripe=success');
      } else {
        // Non loggato — manda al register
        router.push('/register?activated=true');
      }
    };
    activate();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#E8F4F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0D1F1F', margin: '0 0 8px' }}>Pagamento completato!</h1>
        <p style={{ fontSize: 15, color: '#4A7070', margin: '0 0 24px' }}>{status}</p>
        <div style={{ width: 40, height: 4, background: '#28A0A0', borderRadius: 2, margin: '0 auto', animation: 'pulse 1s infinite' }} />
      </div>
    </div>
  );
}
