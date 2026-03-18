// app/api/stripe/checkout/route.ts
// Crea sessione checkout Stripe per upgrade piano
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20.acacia" });

const PREZZI: Record<string, string> = {
  start: process.env.STRIPE_PRICE_START!,
  pro:   process.env.STRIPE_PRICE_PRO!,
  titan: process.env.STRIPE_PRICE_TITAN!,
};

export async function POST(req: NextRequest) {
  try {
    const { piano } = await req.json();
    const supabase  = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

    const { data: profilo } = await supabase.from("profili").select("azienda_id").eq("user_id", user.id).single();
    const { data: azienda  } = await supabase.from("aziende").select("stripe_customer_id,ragione,piva").eq("id", profilo!.azienda_id).single();

    const priceId = PREZZI[piano?.toLowerCase()];
    if (!priceId) return NextResponse.json({ error: "Piano non valido" }, { status: 400 });

    const origin = req.headers.get("origin") || "https://mastro-erp.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: azienda?.stripe_customer_id || undefined,
      customer_email: azienda?.stripe_customer_id ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { azienda_id: profilo!.azienda_id, price_id: priceId, piano },
      },
      metadata: { azienda_id: profilo!.azienda_id, price_id: priceId, piano },
      success_url: `${origin}/dashboard?upgrade=success&piano=${piano}`,
      cancel_url:  `${origin}/dashboard?upgrade=cancel`,
      locale: "it",
      custom_text: { submit: { message: `Inizia 30 giorni gratis poi €${piano==="start"?"29":piano==="pro"?"59":"89"}/mese` } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
