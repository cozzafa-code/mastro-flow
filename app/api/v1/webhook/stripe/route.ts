// app/api/v1/webhook/stripe/route.ts
// MASTRO API - Webhook receiver Stripe
// NB: questo NON usa API key (Stripe firma con webhook secret)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function verifyStripeSignature(body: string, signature: string): boolean {
  if (!STRIPE_WEBHOOK_SECRET || !signature) return false;
  const parts = signature.split(',').reduce((acc: any, p) => {
    const [k, v] = p.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;

  const payload = `${timestamp}.${body}`;
  const expected = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  // Verifica firma Stripe
  if (!verifyStripeSignature(body, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // Gestiamo solo gli eventi rilevanti
  switch (event.type) {
    case 'checkout.session.completed':
    case 'payment_intent.succeeded': {
      const session = event.data.object;
      const commessaId = session.metadata?.commessa_id;
      const aziendaId = session.metadata?.azienda_id;
      const amount = (session.amount_total ?? session.amount_received ?? 0) / 100;

      if (!commessaId || !aziendaId) {
        return NextResponse.json({ ok: true, ignored: 'missing_metadata' });
      }

      // Aggiorna commessa: acconto pagato
      await supabaseAdmin
        .from('commesse')
        .update({
          acconto_pagato: amount,
          acconto_pagato_il: new Date().toISOString(),
          acconto_metodo: 'stripe',
          acconto_ref: session.id,
        })
        .eq('id', commessaId)
        .eq('azienda_id', aziendaId);

      // Log timeline
      await supabaseAdmin.from('timeline_universale').insert({
        azienda_id: aziendaId,
        entita_tipo: 'commessa',
        entita_id: commessaId,
        evento_tipo: 'pagamento_ricevuto',
        descrizione: `Acconto ${amount}€ ricevuto via Stripe`,
        meta: { stripe_session: session.id, importo: amount },
      });

      return NextResponse.json({ ok: true, processed: event.type });
    }

    case 'payment_intent.payment_failed': {
      // Log fallimento per follow-up commerciale
      const intent = event.data.object;
      const commessaId = intent.metadata?.commessa_id;
      const aziendaId = intent.metadata?.azienda_id;

      if (commessaId && aziendaId) {
        await supabaseAdmin.from('timeline_universale').insert({
          azienda_id: aziendaId,
          entita_tipo: 'commessa',
          entita_id: commessaId,
          evento_tipo: 'pagamento_fallito',
          descrizione: `Tentativo pagamento Stripe fallito: ${intent.last_payment_error?.message ?? 'sconosciuto'}`,
        });
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true, ignored: event.type });
  }
}
