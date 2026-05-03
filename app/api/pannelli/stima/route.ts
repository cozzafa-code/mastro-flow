// app/api/pannelli/stima/route.ts
// Riceve { import_id, pdf_url }, conta pagine PDF, restituisce stima costo.
// Niente chiamata Anthropic: solo parse pagine + formula deterministica.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

// Costi Anthropic Sonnet 4.5: $3/M input, $15/M output
// PDF document: ~2k token per pagina input, ~150 token output per pannello
// Formula prudente:
const COSTO_BASE_EUR = 0.05;
const COSTO_PER_PAGINA_EUR = 0.04;
const EUR_PER_USD = 0.93;

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
    // Conteggio pagine via regex su /Type /Page (non /Pages)
    const text = buf.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
    // Fallback: /Count nel root /Pages
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
    const pagineSafe = pagine ?? 5; // default prudente

    const costoStimato = COSTO_BASE_EUR + pagineSafe * COSTO_PER_PAGINA_EUR;
    const costoStimatoMax = costoStimato * 1.5; // margine

    const { data: credits } = await supabase
      .from("ai_credits")
      .select("budget_corrente")
      .eq("azienda_id", AZIENDA_ID)
      .single();

    const budget = Number(credits?.budget_corrente ?? 0);
    const budgetSufficiente = budget >= costoStimatoMax;

    await supabase
      .from("pannelli_imports")
      .update({
        pagine_totali: pagine,
        costo_stimato: costoStimato,
        stato: "preventivo",
      })
      .eq("id", import_id);

    return NextResponse.json({
      ok: true,
      pagine: pagine,
      pagine_usate_per_stima: pagineSafe,
      costo_stimato_eur: Number(costoStimato.toFixed(2)),
      costo_stimato_max_eur: Number(costoStimatoMax.toFixed(2)),
      budget_corrente_eur: Number(budget.toFixed(2)),
      budget_sufficiente: budgetSufficiente,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: msg },
      { status: 500 }
    );
  }
}
