// app/api/stripe/webhook/route.ts
// Stripe webhook: gestione subscription, upgrade/downgrade, trial end
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20.acacia" });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PIANI: Record<string, { nome: string; features: string[]; limiti: Record<string,number> }> = {
  [process.env.STRIPE_PRICE_START!]:  { nome:"START",  features:["commesse","messaggi","pdf"],              limiti:{leads:0,agenti:0,cnc:0} },
  [process.env.STRIPE_PRICE_PRO!]:    { nome:"PRO",    features:["commesse","messaggi","pdf","leads","ai"], limiti:{leads:20,agenti:0,cnc:1} },
  [process.env.STRIPE_PRICE_TITAN!]:  { nome:"TITAN",  features:["tutto"],                                  limiti:{leads:50,agenti:10,cnc:1} },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Stripe webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const azId    = session.metadata?.azienda_id;
        const subId   = session.subscription as string;
        const price   = session.metadata?.price_id;
        const piano   = PIANI[price]?.nome || "START";
        if (azId) {
          await supabaseAdmin.from("aziende").update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: subId,
            piano, piano_features: PIANI[price]?.features || [],
            piano_limiti: PIANI[price]?.limiti || {},
            trial_end: null, abbonamento_attivo: true,
          }).eq("id", azId);
          // Audit log
          await supabaseAdmin.from("audit_log").insert({ azienda_id: azId, azione: "subscription_activated", dettagli: { piano, price_id: price, subscription_id: subId } });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub   = event.data.object as Stripe.Subscription;
        const azId  = sub.metadata?.azienda_id;
        const price = sub.items.data[0]?.price.id;
        const piano = PIANI[price]?.nome || "START";
        const stato = sub.status;
        if (azId) {
          await supabaseAdmin.from("aziende").update({
            piano, piano_features: PIANI[price]?.features || [],
            piano_limiti: PIANI[price]?.limiti || {},
            abbonamento_attivo: stato === "active",
            stripe_subscription_status: stato,
          }).eq("id", azId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub  = event.data.object as Stripe.Subscription;
        const azId = sub.metadata?.azienda_id;
        if (azId) {
          await supabaseAdmin.from("aziende").update({
            abbonamento_attivo: false, piano: "START",
            piano_features: ["commesse"], piano_limiti: { leads:0, agenti:0, cnc:0 },
            stripe_subscription_status: "canceled",
          }).eq("id", azId);
          await supabaseAdmin.from("audit_log").insert({ azienda_id: azId, azione: "subscription_canceled", dettagli: {} });
        }
        break;
      }

      case "invoice.payment_failed": {
        const inv  = event.data.object as Stripe.Invoice;
        const azId = (inv as any).metadata?.azienda_id || inv.customer_email;
        if (azId) {
          await supabaseAdmin.from("aziende").update({ abbonamento_attivo: false }).eq("id", azId);
          // In produzione: invia email avviso pagamento fallito
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        const sub  = event.data.object as Stripe.Subscription;
        const azId = sub.metadata?.azienda_id;
        // In produzione: invia email "il trial scade tra 3 giorni"
        if (azId) {
          await supabaseAdmin.from("audit_log").insert({ azienda_id: azId, azione: "trial_ending_soon", dettagli: { trial_end: sub.trial_end } });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
