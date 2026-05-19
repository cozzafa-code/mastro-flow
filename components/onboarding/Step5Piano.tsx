'use client';
import { OnboardingData } from './types';
import PricingPanel from '../PricingPanel';
import { PlanKey } from '@/lib/stripe';
import { useRouter } from 'next/navigation';

interface Props { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void; onComplete: () => void; }

export default function Step5Piano({ data, onChange, onComplete }: Props) {
  const router = useRouter();

  const handleSelect = async (plan: PlanKey) => {
    onChange({ piano: plan });
    router.push('/dashboard');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div>
      <PricingPanel mode="onboarding" onSelect={handleSelect} />
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={handleSkip} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
          Salta per ora, entro con il piano gratuito
        </button>
      </div>
    </div>
  );
}
