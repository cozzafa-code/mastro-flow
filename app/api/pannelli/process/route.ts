// app/api/pannelli/process/route.ts
// Estrazione AI con wallet system: costo cliente = costo provider × markup_factor.
// Usa RPC wallet_consuma (atomica) per scalare il wallet.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 600;

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const EUR_PER_USD = 0.93;

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function setImportError(
  supabase: ReturnType<typeof supabaseAdmin>,
  import_id: string, codice: string, dettaglio: string
) {
  await supabase.from("pannelli_imports").update({
    stato: "errore", errore_msg: `[${codice}] ${dettaglio}`.slice(0, 2000),
  }).eq("id", import_id);
}

const SYSTEM_PROMPT = `Sei un agente AI specializzato nell'estrazione esaustiva di cataloghi tecnici di SERRAMENTI e PORTE per artigiani italiani (serramentisti). Il tuo cliente è un artigiano che usa il catalogo per fare preventivi: deve potersi vendere ogni VARIANTE specifica del catalogo.

REGOLA #1 - FORMATO RISPOSTA:
La tua intera risposta DEVE essere SOLO JSON valido. Inizia con { e finisci con }. Niente preamboli, niente markdown, niente note finali, niente backtick.

REGOLA #2 - ESTRAZIONE ESAUSTIVA:
NON estrarre solo i modelli "macro" del catalogo. Devi estrarre ogni VARIANTE VENDIBILE che il serramentista può ordinare. Una variante = combinazione concreta di:
- modello base
- configurazione/codice tecnico
- finitura (essenza legno, colore laccato, tipo vetro)
- sistema di apertura

Se il catalogo elenca 12 finiture × 5 modelli, devi estrarre tutte le combinazioni concrete che vedi associate. Se vedi una matrice profilo×vetro, estrai ogni cella come variante separata.

REGOLA #3 - SCHEMA OBBLIGATORIO:
{
  "pannelli": [
    {
      "codice": string,
      "nome": string,
      "modello": string,
      "serie": string,
      "produttore": string,
      "configurazione": string,
      "finitura": string,
      "tipo_apertura": string,
      "colore_finitura": string,
      "materiale": string,
      "spessore_mm": number | null,
      "larghezza_min": number | null,
      "larghezza_max": number | null,
      "altezza_min": number | null,
      "altezza_max": number | null,
      "prezzo": number | null,
      "pagina": number,
      "note": string | null
    }
  ],
  "metadata": {
    "fornitore": string | null,
    "numero_documento": string | null,
    "data_documento": string | null,
    "stima_varianti_totali": number
  }
}

REGOLA #4 - QUANTITÀ:
Cataloghi serramentisti hanno 30-300 varianti vere. Estraine quante ne servono - non risparmiare token.

REGOLA #5 - PREZZI:
Cataloghi branding raramente hanno prezzi. Metti prezzo: null. NON è motivo per scartare la voce.

REGOLA #6 - DEDUPLICAZIONE:
Una variante = una riga. Stesso modello con finiture diverse = righe diverse.`;

function estraiJsonBlock(raw: string): string | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0; let inString = false; let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return cleaned.slice(start, i + 1); }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let import_id: string | null = null;
  const supabase = supabaseAdmin();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.import_id !== "string" || typeof body.pdf_url !== "string") {
      return NextResponse.json({ ok: false, codice_errore: "BAD_REQUEST", dettaglio: "import_id e pdf_url richiesti" }, { status: 400 });
    }
    import_id = body.import_id;
    const pdf_url: string = body.pdf_url;
    const categoria: string = typeof body.categoria === "string" ? body.categoria : "porte_interne";

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      await setImportError(supabase, import_id!, "API_KEY_MISSING", "Servizio AI temporaneamente non disponibile");
      return NextResponse.json({ ok: false, codice_errore: "API_KEY_MISSING", dettaglio: "Servizio temporaneamente non disponibile" }, { status: 500 });
    }

    const { data: importRow, error: importErr } = await supabase
      .from("pannelli_imports").select("id, azienda_id, pre_analisi")
      .eq("id", import_id!).eq("azienda_id", AZIENDA_ID).single();
    if (importErr || !importRow) {
      return NextResponse.json({ ok: false, codice_errore: "IMPORT_NOT_FOUND", dettaglio: "Import non trovato" }, { status: 404 });
    }

    // Pre-check saldo wallet (controllo informativo, blocco vero è in wallet_consuma)
    const { data: aiCredits } = await supabase
      .from("ai_credits").select("wallet_balance_eur, markup_factor")
      .eq("azienda_id", AZIENDA_ID).single();
    const saldo = Number(aiCredits?.wallet_balance_eur ?? 0);
    const markup = Number(aiCredits?.markup_factor ?? 1.5);

    if (saldo < 0.50) {
      await setImportError(supabase, import_id!, "WALLET_INSUFFICIENT", `Saldo insufficiente (€${saldo.toFixed(2)})`);
      return NextResponse.json({
        ok: false, codice_errore: "WALLET_INSUFFICIENT",
        dettaglio: `Saldo insufficiente. Ricarica il tuo wallet MASTRO per continuare.`,
        saldo_eur: saldo,
      }, { status: 402 });
    }

    await supabase.from("pannelli_imports").update({
      stato: "processing", file_url: pdf_url,
      pre_analisi: { ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url },
    }).eq("id", import_id!);

    const headRes = await fetch(pdf_url, { method: "HEAD" }).catch(() => null);
    if (!headRes || !headRes.ok) {
      await setImportError(supabase, import_id!, "PDF_FETCH_ERROR", `PDF non accessibile`);
      return NextResponse.json({ ok: false, codice_errore: "PDF_FETCH_ERROR", dettaglio: "PDF non raggiungibile" }, { status: 400 });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 32000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "url", url: pdf_url } },
            { type: "text", text: `Estrai TUTTE le varianti vendibili dal catalogo (categoria: ${categoria}). Aspettati 30-100+ varianti per un catalogo brand. Rispondi SOLO con JSON valido.` },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      await setImportError(supabase, import_id!, "AI_ERROR", `Estrazione AI fallita`);
      return NextResponse.json({
        ok: false, codice_errore: "AI_ERROR",
        dettaglio: "Estrazione AI temporaneamente non disponibile. Riprova tra qualche minuto.",
      }, { status: 502 });
    }

    const anthropicJson = await anthropicRes.json();
    const rawText: string = anthropicJson?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

    // Calcolo costo PROVIDER reale (interno)
    const usage = anthropicJson?.usage ?? {};
    const inTok = Number(usage.input_tokens ?? 0);
    const outTok = Number(usage.output_tokens ?? 0);
    const costoProviderUsd = (inTok * 3 / 1_000_000) + (outTok * 15 / 1_000_000);
    const costoProviderEur = costoProviderUsd * EUR_PER_USD;
    const costoClienteEur = costoProviderEur * markup;
    const stopReason = anthropicJson?.stop_reason ?? null;

    let parsed: { pannelli?: Array<Record<string, unknown>>; metadata?: Record<string, unknown> } | null = null;
    const jsonBlock = estraiJsonBlock(rawText);
    if (jsonBlock) { try { parsed = JSON.parse(jsonBlock); } catch { parsed = null; } }

    if (!parsed) {
      await supabase.from("pannelli_imports").update({
        pre_analisi: {
          ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url,
          raw_response: rawText.slice(0, 4000),
          tokens_input: inTok, tokens_output: outTok, stop_reason: stopReason,
          costo_provider_eur: costoProviderEur,
        },
      }).eq("id", import_id!);
      await setImportError(supabase, import_id!, "EXTRACTION_FAILED", "Estrazione fallita: contenuto non leggibile");
      return NextResponse.json({
        ok: false, codice_errore: "EXTRACTION_FAILED",
        dettaglio: "Il PDF non è stato estratto correttamente. Prova con inserimento manuale.",
      }, { status: 502 });
    }

    const pannelli = Array.isArray(parsed?.pannelli) ? parsed!.pannelli! : [];

    // CONSUMA WALLET (atomico via RPC) - solo se estrazione produce qualcosa
    const consumoEffettivo = pannelli.length > 0 ? costoClienteEur : Math.min(costoClienteEur, 0.50);
    const consumoProvider = pannelli.length > 0 ? costoProviderEur : Math.min(costoProviderEur, 0.30);

    const { data: consumaResult } = await supabase.rpc("wallet_consuma", {
      p_azienda_id: AZIENDA_ID,
      p_importo_cliente: Number(consumoEffettivo.toFixed(4)),
      p_costo_provider: Number(consumoProvider.toFixed(4)),
      p_import_id: import_id!,
      p_descrizione: `Estrazione AI - ${pannelli.length} varianti - ${categoria}`,
    });

    const consumaOk = consumaResult && (consumaResult as { ok?: boolean }).ok === true;

    // Inserisci pannelli estratti
    if (pannelli.length > 0) {
      const rows = pannelli.map((p, idx) => ({
        import_id: import_id!,
        pagina: typeof p.pagina === "number" ? p.pagina : 1,
        posizione_in_pagina: idx + 1,
        dati: { ...p, categoria, sorgente_import: "ai_catalogo" },
        confermato: false,
      }));
      const { error: insErr } = await supabase.from("pannelli_estratti_temp").insert(rows);
      if (insErr) {
        await setImportError(supabase, import_id!, "DB_INSERT_ERROR", "Errore salvataggio");
        return NextResponse.json({ ok: false, codice_errore: "DB_INSERT_ERROR", dettaglio: "Errore salvataggio dati" }, { status: 500 });
      }
    }

    await supabase.from("pannelli_imports").update({
      stato: "review",
      pannelli_estratti: pannelli.length,
      costo_reale: costoProviderEur, // INTERNO
      prezzo_cliente: consumoEffettivo, // mostrabile
      errore_msg: null,
      pre_analisi: {
        ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url,
        metadata: parsed?.metadata ?? null,
        tokens_input: inTok, tokens_output: outTok, stop_reason: stopReason,
        costo_provider_eur: costoProviderEur,
        costo_cliente_eur: consumoEffettivo,
        margine_eur: consumoEffettivo - consumoProvider,
        wallet_consumato: consumaOk,
      },
    }).eq("id", import_id!);

    return NextResponse.json({
      ok: true,
      import_id: import_id!,
      numero_pannelli: pannelli.length,
      stato: "review",
      addebito_eur: Number(consumoEffettivo.toFixed(2)),
      ...(pannelli.length === 0 ? {
        warning: "PDF analizzato ma nessuna variante estratta. Probabilmente catalogo solo immagini. Prova manuale.",
      } : {}),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (import_id) await setImportError(supabase, import_id, "INTERNAL_ERROR", msg);
    return NextResponse.json({ ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: "Errore interno" }, { status: 500 });
  }
}
