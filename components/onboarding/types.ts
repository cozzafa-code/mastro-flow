// types.ts — shared onboarding types
export interface OnboardingData {
  // Step 1
  nomeAzienda: string;
  citta: string;
  settore: string;
  // Step 2
  coloreAccent: string;
  logo: File | null;
  // Step 3
  teamMode: 'solo' | 'team';
  operatori: { nome: string; ruolo: string; email: string }[];
  // Step 4
  importCsv: File | null;
  // Step 5
  piano: string;
}

export const defaultOnboardingData: OnboardingData = {
  nomeAzienda: '',
  citta: '',
  settore: '',
  coloreAccent: '#D08008',
  logo: null,
  teamMode: 'solo',
  operatori: [{ nome: '', ruolo: 'montatore', email: '' }],
  importCsv: null,
  piano: '',
};
