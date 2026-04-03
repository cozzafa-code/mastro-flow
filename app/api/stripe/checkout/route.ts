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
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan || !(plan in STRIPE_PLANS)) {
      return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
    }

    // Recupera dati azienda
    let customerId: string;
    if (isOnboarding) {
      const s = getStripe();
      const customer = await s.customers.create({ metadata: { onboarding: 'true' } });
      customerId = customer.id;
    } else {
      const { data: operatore } = await supabase
        .from('operatori')
        .select('azienda_id, email, aziende(nome)')
        .eq('auth_id', auth.userId)
        .single();
      if (!operatore) {
        return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
      }
      const aziendaId = operatore.azienda_id;
      const email = operatore.email;
      const nomeAzienda = (operatore.aziende as any)?.nome ?? 'Azienda';
      customerId = await createOrRetrieveCustomer(aziendaId, email, nomeAzienda);
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
      success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/app?stripe=success&plan=${plan}`,
      cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=5&stripe=cancel`,
      locale: 'it',
      allow_promotion_codes: true,
      customer_update: { address: 'auto', name: 'auto' },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true }, // P.IVA italiana
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
