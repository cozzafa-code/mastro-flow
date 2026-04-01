'use client';
import { useState } from 'react';
import { OnboardingData, defaultOnboardingData } from './onboarding/types';
import Step1Azienda from './onboarding/Step1Azienda';
import Step2Brand from './onboarding/Step2Brand';
import Step3Team from './onboarding/Step3Team';
import Step4Import from './onboarding/Step4Import';
import Step5Piano from './onboarding/Step5Piano';
import { useRouter } from 'next/navigation';

const STEPS = [
  { n: 1, label: 'Azienda', icon: '🏢' },
  { n: 2, label: 'Brand', icon: '🎨' },
  { n: 3, label: 'Team', icon: '👥' },
  { n: 4, label: 'Clienti', icon: '📋' },
  { n: 5, label: 'Piano', icon: '⭐' },
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const router = useRouter();

  const update = (partial: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...partial }));
  const next = () => setStep(s => Math.min(s + 1, 5));
  const skip = () => next();
  const complete = () => router.push('/app?onboarding=done');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F2F1EC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: step === 5 ? 900 : 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1C', letterSpacing: '-0.5px' }}>
            MASTRO <span style={{ color: '#D08008' }}>SUITE</span>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: step > s.n ? '#1A9E73' : step === s.n ? '#D08008' : '#E5E3DC',
                  color: step >= s.n ? '#fff' : '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: step > s.n ? 16 : 13,
                  fontWeight: 700,
                  transition: 'all 0.2s',
                }}>
                  {step > s.n ? '✓' : s.icon}
                </div>
                <div style={{
                  fontSize: 11,
                  color: step === s.n ? '#D08008' : '#9CA3AF',
                  marginTop: 4,
                  fontWeight: step === s.n ? 600 : 400,
                }}>
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  height: 2,
                  flex: 0.5,
                  background: step > s.n ? '#1A9E73' : '#E5E3DC',
                  marginBottom: 20,
                  transition: 'background 0.2s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: step === 5 ? '32px 28px' : '32px 28px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #E5E3DC',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1C', marginTop: 0, marginBottom: 6 }}>
            {step === 1 && 'Raccontaci la tua azienda'}
            {step === 2 && 'Il tuo brand'}
            {step === 3 && 'Il tuo team'}
            {step === 4 && 'Importa i tuoi clienti'}
            {step === 5 && 'Scegli il tuo piano'}
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, marginTop: 0 }}>
            {step === 1 && `Benvenuto in MASTRO! Ci vogliono 2 minuti.`}
            {step === 2 && 'Personalizza l\'aspetto dell\'app e dei tuoi documenti.'}
            {step === 3 && 'Aggiungi i tuoi operatori — potranno accedere dall\'app MASTRO TEAM.'}
            {step === 4 && 'Importa la lista clienti esistente. Puoi farlo dopo dalle impostazioni.'}
            {step === 5 && '30 giorni gratis, nessuna carta adesso. Disdici quando vuoi.'}
          </p>

          {step === 1 && <Step1Azienda data={data} onChange={update} onNext={next} />}
          {step === 2 && <Step2Brand data={data} onChange={update} onNext={next} onSkip={skip} />}
          {step === 3 && <Step3Team data={data} onChange={update} onNext={next} />}
          {step === 4 && <Step4Import data={data} onChange={update} onNext={next} onSkip={skip} />}
          {step === 5 && <Step5Piano data={data} onChange={update} onComplete={complete} />}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20 }}>
          Passo {step} di {STEPS.length} · I tuoi dati sono al sicuro
        </p>
      </div>
    </div>
  );
}
