import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, getStripe, STRIPE_PLANS, createOrRetrieveCustomer, PlanKey } from '@/lib/stripe';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { plan, successUrl, cancelUrl, aziendaId: bodyAziendaId } = await req.json();

    if (!plan || !(plan in STRIPE_PLANS)) {
      return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
    }

    const auth = await requireAuth(req);
    let customerId: string;
    let aziendaId: string = bodyAziendaId || 'onboarding';

    if (!auth.ok) {
      // Onboarding senza auth — customer anonimo
      const s = getStripe();
      const customer = await s.customers.create({
        metadata: { onboarding: 'true', azienda_id: aziendaId }
      });
      customerId = customer.id;
    } else {
      // Utente loggato
      const { data: operatore } = await supabase
        .from('operatori')
        .select('azienda_id, email, aziende(nome)')
        .eq('auth_id', auth.userId)
        .single();

      if (operatore) {
        aziendaId = operatore.azienda_id;
        const email = operatore.email;
        const nomeAzienda = (operatore.aziende as any)?.nome ?? 'Azienda';
        customerId = await createOrRetrieveCustomer(aziendaId, email, nomeAzienda);
      } else {
        const s = getStripe();
        const customer = await s.customers.create({ metadata: { azienda_id: aziendaId } });
        customerId = customer.id;
      }
    }

    const planConfig = STRIPE_PLANS[plan as PlanKey];
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 15,
        metadata: { azienda_id: aziendaId, plan },
      },
      metadata: { azienda_id: aziendaId, plan },
      success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/stripe-success`,
      cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      locale: 'it',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
