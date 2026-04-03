'use client';
import { OnboardingData } from './types';
import PricingPanel from '../PricingPanel';
import { PlanKey } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void; onComplete: () => void; }

export default function Step5Piano({ data, onChange, onComplete }: Props) {
  const handleSelect = async (plan: PlanKey) => {
    onChange({ piano: plan });

    // Ottieni sessione utente corrente
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Salva dati onboarding (crea azienda + operatore)
    let aziendaId: string | null = null;
    try {
      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeAzienda: data.nomeAzienda,
          citta: data.citta,
          settore: data.settore,
          coloreAccent: data.coloreAccent,
          teamMode: data.teamMode,
          operatori: data.operatori,
          userId,
        }),
      });
      const json = await res.json();
      aziendaId = json.aziendaId;
    } catch (_) {}

    // Redirect a Stripe
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        successUrl: `${window.location.origin}/stripe-success`,
        cancelUrl: `${window.location.origin}/onboarding`,
        aziendaId,
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div>
      <PricingPanel mode="onboarding" onSelect={handleSelect} />
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={onComplete} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
          Salta per ora, entro con il piano gratuito
        </button>
      </div>
    </div>
  );
}
