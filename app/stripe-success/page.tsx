'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function StripeSuccessContent() {
  const [status, setStatus] = useState('Attivazione abbonamento in corso...');
  const router = useRouter();

  useEffect(() => {
    const activate = async () => {
      await new Promise(r => setTimeout(r, 2500));
      setStatus('Account attivato! Accesso in corso...');
      await new Promise(r => setTimeout(r, 1000));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/app?stripe=success');
      } else {
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
        <div style={{ width: 40, height: 4, background: '#28A0A0', borderRadius: 2, margin: '0 auto' }} />
      </div>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#E8F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4A7070', fontFamily: 'system-ui,sans-serif' }}>Caricamento...</p>
      </div>
    }>
      <StripeSuccessContent />
    </Suspense>
  );
}
