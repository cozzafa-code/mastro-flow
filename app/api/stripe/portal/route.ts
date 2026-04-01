import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { data: operatore } = await supabase
      .from('operatori')
      .select('azienda_id')
      .eq('auth_id', auth.userId)
      .single();

    if (!operatore) {
      return NextResponse.json({ error: 'Operatore non trovato' }, { status: 404 });
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('azienda_id', operatore.azienda_id)
      .single();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'Nessun abbonamento attivo' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?tab=impostazioni`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[stripe/portal]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
