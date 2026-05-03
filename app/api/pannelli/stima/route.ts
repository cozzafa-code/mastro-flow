// app/api/pannelli/stima/route.ts
// Calcola pagine PDF e prezzo CLIENTE (markup 1.5x sul costo provider).
// Il client riceve solo costo_eur (prezzo finale) - mai il costo provider.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

// Costi provider (USD - convertiti in EUR)
const EUR_PER_USD = 0.93;
const COSTO_PROVIDER_BASE_USD = 0.05;
const COSTO_PROVIDER_PER_PAGINA_USD = 0.04;

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function contaPaginePdf(pdfUrl: string): Promise<number | null> {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
    const countMatch = text.match(/\/Count\s+(\d+)/);
    if (countMatch) return parseInt(countMatch[1], 10);
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.import_id !== "string" || typeof body.pdf_url !== "string") {
      return NextResponse.json(
        { ok: false, codice_errore: "BAD_REQUEST", dettaglio: "import_id e pdf_url richiesti" },
        { status: 400 }
      );
    }
    const { import_id, pdf_url } = body;
    const supabase = supabaseAdmin();

    const pagine = await contaPaginePdf(pdf_url);
    const pagineSafe = pagine ?? 5;

    // Costo provider INTERNO (mai esposto al client)
    const costoProviderUsd = COSTO_PROVIDER_BASE_USD + pagineSafe * COSTO_PROVIDER_PER_PAGINA_USD;
    const costoProviderEur = costoProviderUsd * EUR_PER_USD;

    // Markup factor del cliente (default 1.5x)
    const { data: aiCredits } = await supabase
      .from("ai_credits")
      .select("wallet_balance_eur, markup_factor")
      .eq("azienda_id", AZIENDA_ID)
      .single();

    const markup = Number(aiCredits?.markup_factor ?? 1.5);
    const saldo = Number(aiCredits?.wallet_balance_eur ?? 0);

    // Prezzo CLIENTE (questo è quello che vede)
    const costoClienteEur = costoProviderEur * markup;
    const costoClienteMaxEur = costoClienteEur * 1.5; // safety margin per cataloghi imprevedibili

    const saldoSufficiente = saldo >= costoClienteMaxEur;

    // Salva costo_stimato (PROVIDER, non cliente) sull'import per audit interno
    await supabase
      .from("pannelli_imports")
      .update({
        pagine_totali: pagine,
        costo_stimato: costoProviderEur, // costo INTERNO
        stato: "preventivo",
      })
      .eq("id", import_id);

    return NextResponse.json({
      ok: true,
      pagine: pagine,
      // Risposta al CLIENT: solo prezzi finali, niente costi provider
      costo_eur: Number(costoClienteEur.toFixed(2)),
      costo_max_eur: Number(costoClienteMaxEur.toFixed(2)),
      saldo_eur: Number(saldo.toFixed(2)),
      saldo_sufficiente: saldoSufficiente,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: msg },
      { status: 500 }
    );
  }
}
