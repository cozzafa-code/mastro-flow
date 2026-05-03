// app/api/pannelli/preanalyze/route.ts
// Pre-analisi PDF: conta pagine, stima pannelli, calcola costo - GRATIS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

// Costi configurati
const COSTO_PER_PAGINA_AI = 0.012; // EUR (input + output Claude Sonnet)
const MARGINE_MASTRO = 4.0;        // ricarico 4x sul costo Anthropic
const PREZZO_PER_PANNELLO_MANUALE = 0.0; // import manuale = gratis
const STIMA_PANNELLI_PER_PAGINA = 1.5;   // media catalogo serramenti

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { filename, fileSize, fileBase64, metodo } = body;

    if (!filename) return NextResponse.json({ error: "filename mancante" }, { status: 400 });
    if (!metodo || !["ai", "manuale", "dxf"].includes(metodo)) {
      return NextResponse.json({ error: "metodo invalido (ai|manuale|dxf)" }, { status: 400 });
    }

    // Hash del file per dedup tra aziende
    let fileHash: string | null = null;
    if (fileBase64) {
      fileHash = crypto.createHash("sha256").update(fileBase64).digest("hex");

      // Check se già importato da qualcuno - sharing automatico
      const { data: existing } = await supabase
        .from("pannelli_imports")
        .select("id, pannelli_confermati")
        .eq("file_hash", fileHash)
        .eq("stato", "completato")
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({
          deduped: true,
          pannelli_disponibili: existing[0].pannelli_confermati,
          message: "Catalogo già elaborato in precedenza, importazione gratuita",
          costo_stimato: 0,
          metodo,
        });
      }
    }

    // Stima pagine + pannelli (lato client invierà già il pageCount estratto da pdfjs)
    const pageCount = body.pageCount || 50;
    const pagineUtili = body.pagineUtili || Math.round(pageCount * 0.4); // ~40% sono pagine prodotto
    const pannelliStimati = Math.round(pagineUtili * STIMA_PANNELLI_PER_PAGINA);

    // Calcolo costo per metodo
    let costoStimato = 0;
    let prezzoCliente = 0;
    if (metodo === "ai") {
      costoStimato = pagineUtili * COSTO_PER_PAGINA_AI;
      prezzoCliente = costoStimato * MARGINE_MASTRO;
    } else if (metodo === "manuale" || metodo === "dxf") {
      costoStimato = 0;
      prezzoCliente = 0;
    }

    // Verifica budget AI corrente
    const { data: credits } = await supabase
      .from("ai_credits")
      .select("budget_corrente, budget_mensile, totale_speso_mese")
      .eq("azienda_id", AZIENDA_ID)
      .single();

    const budgetCorrente = credits?.budget_corrente || 0;
    const budgetSufficiente = prezzoCliente <= budgetCorrente;

    return NextResponse.json({
      deduped: false,
      filename,
      fileSize,
      fileHash,
      metodo,
      pageCount,
      pagineUtili,
      pannelliStimati,
      costoAnthropic: costoStimato,
      prezzoCliente: Number(prezzoCliente.toFixed(2)),
      budgetCorrente,
      budgetSufficiente,
      ricaricaConsigliata: budgetSufficiente ? 0 : Math.ceil((prezzoCliente - budgetCorrente) / 5) * 5,
      tempoStimato: metodo === "ai" ? `${Math.ceil(pagineUtili * 8 / 60)} min` : "Istantaneo",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
