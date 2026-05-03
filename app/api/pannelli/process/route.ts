// app/api/pannelli/process/route.ts
// Riceve { import_id, pdf_url, categoria }, estrae pannelli via Anthropic,
// salva in pannelli_estratti_temp.
//
// Parser JSON tollerante: estrae il primo blocco {...} valido anche se
// preceduto/seguito da preamboli, ```json fence, o note finali.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function setImportError(
  supabase: ReturnType<typeof supabaseAdmin>,
  import_id: string,
  codice: string,
  dettaglio: string
) {
  await supabase
    .from("pannelli_imports")
    .update({ stato: "errore", errore_msg: `[${codice}] ${dettaglio}`.slice(0, 2000) })
    .eq("id", import_id);
}

const SYSTEM_PROMPT = `Sei un assistente che estrae pannelli/serramenti da PDF tecnici italiani.

REGOLA CRITICA: Restituisci SOLO il JSON, niente altro. Niente preamboli, niente backtick, niente note finali, niente markdown. La tua intera risposta DEVE iniziare con { e finire con }.

Schema obbligatorio:
{
  "pannelli": [
    {
      "codice": string | null,
      "nome": string,
      "descrizione": string | null,
      "produttore": string | null,
      "serie": string | null,
      "modello": string | null,
      "colore_finitura": string | null,
      "larghezza_min": number | null,
      "larghezza_max": number | null,
      "altezza_min": number | null,
      "altezza_max": number | null,
      "spessore_mm": number | null,
      "prezzo": number | null,
      "pagina": number,
      "note": string | null
    }
  ],
  "metadata": {
    "fornitore": string | null,
    "numero_documento": string | null,
    "data_documento": string | null
  }
}

Regole estrazione:
- Misure in millimetri.
- Prezzi in euro, punto come separatore decimale.
- pagina = numero pagina del PDF (default 1 se non chiaro).
- Se manca un campo numerico usa null, MAI 0 o stringa vuota.
- Se il documento è un catalogo con MOLTI modelli, estraine almeno 20-30 anche se mancano alcuni campi.
- Se vedi modelli illustrati con codice/nome ma senza prezzo, includili comunque (prezzo null).
- Se davvero non trovi nessun pannello restituisci pannelli: [].`;

// Estrae il primo blocco JSON {...} bilanciato dal testo
function estraiJsonBlock(raw: string): string | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let import_id: string | null = null;
  const supabase = supabaseAdmin();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.import_id !== "string" || typeof body.pdf_url !== "string") {
      return NextResponse.json(
        { ok: false, codice_errore: "BAD_REQUEST", dettaglio: "import_id e pdf_url richiesti" },
        { status: 400 }
      );
    }
    import_id = body.import_id;
    const pdf_url: string = body.pdf_url;
    const categoria: string = typeof body.categoria === "string" ? body.categoria : "porte_interne";

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      await setImportError(supabase, import_id!, "API_KEY_MISSING", "ANTHROPIC_API_KEY non configurata");
      return NextResponse.json(
        { ok: false, codice_errore: "API_KEY_MISSING", dettaglio: "API key mancante" },
        { status: 500 }
      );
    }

    const { data: importRow, error: importErr } = await supabase
      .from("pannelli_imports")
      .select("id, azienda_id, stato, pre_analisi")
      .eq("id", import_id!).eq("azienda_id", AZIENDA_ID).single();

    if (importErr || !importRow) {
      return NextResponse.json(
        { ok: false, codice_errore: "IMPORT_NOT_FOUND", dettaglio: importErr?.message || "Import inesistente" },
        { status: 404 }
      );
    }

    const { data: credits } = await supabase
      .from("ai_credits").select("budget_corrente, totale_speso_mese")
      .eq("azienda_id", AZIENDA_ID).single();
    const budget = Number(credits?.budget_corrente ?? 0);
    if (budget < 0.10) {
      await setImportError(supabase, import_id!, "CREDITS_INSUFFICIENT", `Budget insufficiente (€${budget.toFixed(2)})`);
      return NextResponse.json(
        { ok: false, codice_errore: "CREDITS_INSUFFICIENT", dettaglio: `Budget insufficiente (€${budget.toFixed(2)})` },
        { status: 402 }
      );
    }

    await supabase.from("pannelli_imports").update({
      stato: "processing", file_url: pdf_url,
      pre_analisi: { ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url },
    }).eq("id", import_id!);

    const headRes = await fetch(pdf_url, { method: "HEAD" }).catch(() => null);
    if (!headRes || !headRes.ok) {
      await setImportError(supabase, import_id!, "PDF_FETCH_ERROR", `PDF non accessibile (${headRes?.status ?? "n/a"})`);
      return NextResponse.json(
        { ok: false, codice_errore: "PDF_FETCH_ERROR", dettaglio: "PDF non raggiungibile" },
        { status: 400 }
      );
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
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "url", url: pdf_url } },
            { type: "text", text: `Estrai i pannelli (categoria: ${categoria}). Rispondi SOLO con JSON valido, niente testo prima o dopo.` },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      await setImportError(supabase, import_id!, "ANTHROPIC_ERROR", `Status ${anthropicRes.status}: ${errText}`);
      return NextResponse.json(
        { ok: false, codice_errore: "ANTHROPIC_ERROR", dettaglio: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const anthropicJson = await anthropicRes.json();
    const rawText: string =
      anthropicJson?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

    // Salva sempre raw response per debug
    const usage = anthropicJson?.usage ?? {};
    const inTok = Number(usage.input_tokens ?? 0);
    const outTok = Number(usage.output_tokens ?? 0);
    const costoReale = (inTok * 3 / 1_000_000) + (outTok * 15 / 1_000_000);

    let parsed: { pannelli?: Array<Record<string, unknown>>; metadata?: Record<string, unknown> } | null = null;
    const jsonBlock = estraiJsonBlock(rawText);
    if (jsonBlock) {
      try { parsed = JSON.parse(jsonBlock); } catch { parsed = null; }
    }

    if (!parsed) {
      // Salva raw per debug ma restituisci errore chiaro
      await supabase.from("pannelli_imports").update({
        pre_analisi: {
          ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url,
          raw_response: rawText.slice(0, 4000),
          tokens_input: inTok, tokens_output: outTok,
        },
      }).eq("id", import_id!);
      await setImportError(supabase, import_id!, "JSON_PARSE_ERROR",
        `Anthropic non ha restituito JSON valido. Inizio risposta: ${rawText.slice(0, 200)}`);
      return NextResponse.json(
        { ok: false, codice_errore: "JSON_PARSE_ERROR", dettaglio: "JSON Anthropic non parseabile" },
        { status: 502 }
      );
    }

    const pannelli = Array.isArray(parsed?.pannelli) ? parsed!.pannelli! : [];

    if (pannelli.length === 0) {
      // PDF analizzato ma 0 pannelli: NON è un errore tecnico, ma lo segnaliamo chiaramente
      await supabase.from("pannelli_imports").update({
        stato: "review",
        pannelli_estratti: 0,
        costo_reale: costoReale,
        errore_msg: null,
        pre_analisi: {
          ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url,
          metadata: parsed?.metadata ?? null,
          tokens_input: inTok, tokens_output: outTok,
          raw_response: rawText.slice(0, 2000),
        },
      }).eq("id", import_id!);

      await supabase.from("ai_credits").update({
        budget_corrente: Math.max(0, budget - costoReale),
        totale_speso_mese: Number(credits?.totale_speso_mese ?? 0) + costoReale,
      }).eq("azienda_id", AZIENDA_ID);

      return NextResponse.json({
        ok: true,
        import_id: import_id!,
        numero_pannelli: 0,
        stato: "review",
        costo_reale: costoReale,
        warning: "PDF analizzato ma nessun pannello estratto. Probabilmente è un catalogo con immagini scannerizzate o senza dati strutturati. Prova con inserimento manuale.",
      });
    }

    const rows = pannelli.map((p, idx) => ({
      import_id: import_id!,
      pagina: typeof p.pagina === "number" ? p.pagina : 1,
      posizione_in_pagina: idx + 1,
      dati: { ...p, categoria, sorgente_import: "ai_catalogo" },
      confermato: false,
    }));

    const { error: insErr } = await supabase.from("pannelli_estratti_temp").insert(rows);
    if (insErr) {
      await setImportError(supabase, import_id!, "DB_INSERT_ERROR", insErr.message);
      return NextResponse.json(
        { ok: false, codice_errore: "DB_INSERT_ERROR", dettaglio: insErr.message },
        { status: 500 }
      );
    }

    await supabase.from("ai_credits").update({
      budget_corrente: Math.max(0, budget - costoReale),
      totale_speso_mese: Number(credits?.totale_speso_mese ?? 0) + costoReale,
    }).eq("azienda_id", AZIENDA_ID);

    await supabase.from("pannelli_imports").update({
      stato: "review",
      pannelli_estratti: pannelli.length,
      costo_reale: costoReale,
      errore_msg: null,
      pre_analisi: {
        ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url,
        metadata: parsed?.metadata ?? null,
        tokens_input: inTok, tokens_output: outTok,
      },
    }).eq("id", import_id!);

    return NextResponse.json({
      ok: true,
      import_id: import_id!,
      numero_pannelli: pannelli.length,
      stato: "review",
      costo_reale: costoReale,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (import_id) await setImportError(supabase, import_id, "INTERNAL_ERROR", msg);
    return NextResponse.json(
      { ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: msg },
      { status: 500 }
    );
  }
}
