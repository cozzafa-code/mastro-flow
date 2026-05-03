// app/api/ai-credits/route.ts
// Gestione crediti AI azienda
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: credits } = await supabase.from("ai_credits").select("*").eq("azienda_id", AZIENDA_ID).single();
    const { data: movs } = await supabase
      .from("ai_credits_movimenti")
      .select("*")
      .eq("azienda_id", AZIENDA_ID)
      .order("created_at", { ascending: false })
      .limit(20);
    return NextResponse.json({ credits, movimenti: movs || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Ricarica crediti (in produzione: da gestire con Stripe checkout)
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const importo = parseFloat(body.importo);
    if (!importo || importo <= 0) return NextResponse.json({ error: "importo invalido" }, { status: 400 });
    const { data: credits } = await supabase.from("ai_credits").select("budget_corrente, ricariche_totali").eq("azienda_id", AZIENDA_ID).single();
    const cur = credits?.budget_corrente || 0;
    const nuovo = cur + importo;
    await supabase.from("ai_credits").update({
      budget_corrente: nuovo,
      ricariche_totali: (credits?.ricariche_totali || 0) + importo,
      updated_at: new Date().toISOString(),
    }).eq("azienda_id", AZIENDA_ID);
    await supabase.from("ai_credits_movimenti").insert({
      azienda_id: AZIENDA_ID, tipo: "ricarica", importo, saldo_dopo: nuovo,
      descrizione: `Ricarica €${importo}`,
    });
    return NextResponse.json({ saldo: nuovo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
