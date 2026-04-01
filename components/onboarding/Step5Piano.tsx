'use client';
import { OnboardingData } from './types';
import PricingPanel from '../PricingPanel';
import { PlanKey } from '@/lib/stripe';

interface Props { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void; onComplete: () => void; }

export default function Step5Piano({ data, onChange, onComplete }: Props) {
  const handleSelect = async (plan: PlanKey) => {
    onChange({ piano: plan });

    // Salva i dati onboarding prima del redirect Stripe
    try {
      await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeAzienda: data.nomeAzienda,
          citta: data.citta,
          settore: data.settore,
          coloreAccent: data.coloreAccent,
          teamMode: data.teamMode,
          operatori: data.operatori,
        }),
      });
    } catch (_) {}

    // Redirect a Stripe
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div>
      <PricingPanel mode="onboarding" onSelect={handleSelect} />

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          onClick={onComplete}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Salta per ora, entrerò con il piano gratuito
        </button>
      </div>
    </div>
  );
}
