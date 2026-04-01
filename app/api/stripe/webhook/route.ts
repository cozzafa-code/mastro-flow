import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[webhook] Firma non valida:', err.message);
    return NextResponse.json({ error: 'Firma webhook non valida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[webhook] Errore handler:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.CheckoutSession) {
  const aziendaId = session.metadata?.azienda_id;
  const plan = session.metadata?.plan;
  if (!aziendaId || !plan) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  await supabase.from('subscriptions').upsert(
    {
      azienda_id: aziendaId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'azienda_id' }
  );

  // Aggiorna flag onboarding completato
  await supabase
    .from('aziende')
    .update({ onboarding_completed: true, piano: plan })
    .eq('id', aziendaId);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const aziendaId = sub.metadata?.azienda_id;
  if (!aziendaId) return;

  const priceId = sub.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId) ?? 'base';

  await supabase
    .from('subscriptions')
    .update({
      plan,
      status: sub.status,
      trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('azienda_id', aziendaId);

  await supabase.from('aziende').update({ piano: plan }).eq('id', aziendaId);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const aziendaId = sub.metadata?.azienda_id;
  if (!aziendaId) return;

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('azienda_id', aziendaId);

  await supabase.from('aziende').update({ piano: 'base' }).eq('id', aziendaId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', customerId);
}
