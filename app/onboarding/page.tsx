// app/onboarding/page.tsx
import OnboardingWizard from '@/components/OnboardingWizard'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Configura MASTRO' }

export default async function OnboardingPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Se ha già completato l'onboarding → vai alla dashboard
  const { data: profilo } = await supabase
    .from('profili')
    .select('onboarding_completato')
    .eq('id', user.id)
    .single()

  if (profilo?.onboarding_completato) redirect('/dashboard')

  return <OnboardingWizard />
}
