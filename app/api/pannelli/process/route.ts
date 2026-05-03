// app/api/pannelli/process/route.ts
// Riceve { import_id, pdf_url }, scarica il PDF da Supabase Storage,
// lo manda ad Anthropic (Claude Sonnet 4.5) via document API,
// estrae i pannelli e li salva in pannelli_estratti_temp.
//
// Mantiene flusso: pannelli_imports → review → finalize.
// Codici_errore standardizzati: API_KEY_MISSING, PDF_FETCH_ERROR,
// ANTHROPIC_ERROR, JSON_PARSE_ERROR, DB_INSERT_ERROR, CREDITS_INSUFFICIENT.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min: PDF grandi + Anthropic

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const COSTO_CREDITI_PER_IMPORT = 1;

// ─────────────────────────────────────────────────────────────────────────
// Helpers

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
  codice_errore: string,
  dettaglio: string
) {
  await supabase
    .from("pannelli_imports")
    .update({
      stato: "errore",
      codice_errore,
      dettaglio_errore: dettaglio.slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", import_id);
}

// ─────────────────────────────────────────────────────────────────────────
// Prompt estrazione

const SYSTEM_PROMPT = `Sei un assistente che estrae dati strutturati da PDF tecnici di pannelli/serramenti italiani.
Devi restituire SOLO JSON valido, nessun testo prima o dopo, nessun markdown.

Schema richiesto:
{
  "pannelli": [
    {
      "codice": string,
      "descrizione": string,
      "larghezza_mm": number | null,
      "altezza_mm": number | null,
      "quantita": number,
      "prezzo_unitario": number | null,
      "note": string | null
    }
  ],
  "metadata": {
    "fornitore": string | null,
    "numero_documento": string | null,
    "data_documento": string | null
  }
}

Regole:
- Se un campo non è presente, usa null (mai stringa vuota per i numerici).
- Misure sempre in millimetri.
- Prezzi in euro senza simbolo, punto come separatore decimale.
- Quantità intera, default 1 se non specificata.
- Restituisci array vuoto se non trovi pannelli.`;

// ─────────────────────────────────────────────────────────────────────────
// POST handler

export async function POST(req: NextRequest) {
  let import_id: string | null = null;
  const supabase = supabaseAdmin();

  try {
    // 1. Parse body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.import_id !== "string" || typeof body.pdf_url !== "string") {
      return NextResponse.json(
        { ok: false, codice_errore: "BAD_REQUEST", dettaglio: "import_id e pdf_url richiesti" },
        { status: 400 }
      );
    }
    import_id = body.import_id;
    const pdf_url: string = body.pdf_url;

    // 2. API key check
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      await setImportError(supabase, import_id!, "API_KEY_MISSING", "ANTHROPIC_API_KEY non configurata");
      return NextResponse.json(
        { ok: false, codice_errore: "API_KEY_MISSING", dettaglio: "API key mancante" },
        { status: 500 }
      );
    }

    // 3. Carica import e verifica crediti
    const { data: importRow, error: importErr } = await supabase
      .from("pannelli_imports")
      .select("id, azienda_id, stato")
      .eq("id", import_id!)
      .eq("azienda_id", AZIENDA_ID)
      .single();

    if (importErr || !importRow) {
      return NextResponse.json(
        { ok: false, codice_errore: "IMPORT_NOT_FOUND", dettaglio: importErr?.message || "Import inesistente" },
        { status: 404 }
      );
    }

    const { data: credits } = await supabase
      .from("ai_credits")
      .select("crediti_residui")
      .eq("azienda_id", AZIENDA_ID)
      .single();

    if (!credits || (credits.crediti_residui ?? 0) < COSTO_CREDITI_PER_IMPORT) {
      await setImportError(supabase, import_id!, "CREDITS_INSUFFICIENT", "Crediti AI insufficienti");
      return NextResponse.json(
        { ok: false, codice_errore: "CREDITS_INSUFFICIENT", dettaglio: "Crediti AI insufficienti" },
        { status: 402 }
      );
    }

    // 4. Aggiorna stato → processing
    await supabase
      .from("pannelli_imports")
      .update({ stato: "processing", pdf_url, updated_at: new Date().toISOString() })
      .eq("id", import_id!);

    // 5. Verifica accessibilità PDF (HEAD)
    const headRes = await fetch(pdf_url, { method: "HEAD" }).catch(() => null);
    if (!headRes || !headRes.ok) {
      await setImportError(supabase, import_id!, "PDF_FETCH_ERROR", `PDF non accessibile (status ${headRes?.status ?? "n/a"})`);
      return NextResponse.json(
        { ok: false, codice_errore: "PDF_FETCH_ERROR", dettaglio: "PDF non raggiungibile dallo Storage" },
        { status: 400 }
      );
    }

    // 6. Chiamata Anthropic con document URL
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "url", url: pdf_url },
              },
              {
                type: "text",
                text: "Estrai tutti i pannelli da questo documento e restituisci il JSON.",
              },
            ],
          },
        ],
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

    // 7. Parse JSON (tollerante a fence ```json)
    let parsed: { pannelli?: Array<Record<string, unknown>>; metadata?: Record<string, unknown> } | null = null;
    try {
      const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      await setImportError(
        supabase,
        import_id!,
        "JSON_PARSE_ERROR",
        `Risposta non parseabile: ${rawText.slice(0, 300)}`
      );
      return NextResponse.json(
        { ok: false, codice_errore: "JSON_PARSE_ERROR", dettaglio: "JSON Anthropic non valido" },
        { status: 502 }
      );
    }

    const pannelli = Array.isArray(parsed?.pannelli) ? parsed!.pannelli! : [];

    // 8. Insert pannelli_estratti_temp
    if (pannelli.length > 0) {
      const rows = pannelli.map((p) => ({
        import_id: import_id!,
        azienda_id: AZIENDA_ID,
        codice: (p.codice as string | null) ?? null,
        descrizione: (p.descrizione as string | null) ?? null,
        larghezza_mm: (p.larghezza_mm as number | null) ?? null,
        altezza_mm: (p.altezza_mm as number | null) ?? null,
        quantita: (p.quantita as number | null) ?? 1,
        prezzo_unitario: (p.prezzo_unitario as number | null) ?? null,
        note: (p.note as string | null) ?? null,
        stato_review: "pending",
      }));

      const { error: insErr } = await supabase.from("pannelli_estratti_temp").insert(rows);
      if (insErr) {
        await setImportError(supabase, import_id!, "DB_INSERT_ERROR", insErr.message);
        return NextResponse.json(
          { ok: false, codice_errore: "DB_INSERT_ERROR", dettaglio: insErr.message },
          { status: 500 }
        );
      }
    }

    // 9. Scala crediti + finalize import
    await supabase.rpc("decrementa_crediti_ai", {
      p_azienda_id: AZIENDA_ID,
      p_quantita: COSTO_CREDITI_PER_IMPORT,
    });

    const usage = anthropicJson?.usage ?? {};
    await supabase
      .from("pannelli_imports")
      .update({
        stato: "review",
        numero_pannelli_estratti: pannelli.length,
        metadata_estratto: parsed?.metadata ?? null,
        tokens_input: usage.input_tokens ?? null,
        tokens_output: usage.output_tokens ?? null,
        codice_errore: null,
        dettaglio_errore: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", import_id!);

    return NextResponse.json({
      ok: true,
      import_id: import_id!,
      numero_pannelli: pannelli.length,
      stato: "review",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (import_id) {
      await setImportError(supabase, import_id, "INTERNAL_ERROR", msg);
    }
    return NextResponse.json(
      { ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: msg },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   NOTA: se la colonna pdf_url non esiste in pannelli_imports, esegui una
   tantum su Supabase SQL Editor:

   ALTER TABLE pannelli_imports
     ADD COLUMN IF NOT EXISTS pdf_url text,
     ADD COLUMN IF NOT EXISTS codice_errore text,
     ADD COLUMN IF NOT EXISTS dettaglio_errore text,
     ADD COLUMN IF NOT EXISTS tokens_input int,
     ADD COLUMN IF NOT EXISTS tokens_output int,
     ADD COLUMN IF NOT EXISTS metadata_estratto jsonb,
     ADD COLUMN IF NOT EXISTS numero_pannelli_estratti int;

   E la RPC per scalare crediti (se non esiste):

   CREATE OR REPLACE FUNCTION decrementa_crediti_ai(
     p_azienda_id uuid, p_quantita int
   ) RETURNS void LANGUAGE sql AS $$
     UPDATE ai_credits
        SET crediti_residui = GREATEST(0, crediti_residui - p_quantita),
            updated_at = now()
      WHERE azienda_id = p_azienda_id;
   $$;
   ───────────────────────────────────────────────────────────────────── */
