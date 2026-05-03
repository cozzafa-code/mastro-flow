// app/api/pannelli/process/route.ts
// Estrazione AI cataloghi serramentisti con prompt aggressivo orientato al PUNTO VENDITA.
// Obiettivo: ogni riga estratta = una variante vendibile (modello + finitura + sistema apertura).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 600; // 10 min: cataloghi complessi 60+ pagine

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
NON estrarre solo i modelli "macro" del catalogo (es. BiGlass, BiPlan, Panvi). Devi estrarre ogni VARIANTE VENDIBILE che il serramentista può ordinare. Una variante = combinazione concreta di:
- modello base (es. BiGlass, BiPlan, Panvi, Vert, Horizon)
- configurazione/codice tecnico (es. 1VF, 1LF, 1VH, 1VV, 1LVF, 7PAL)
- finitura (essenza legno, colore laccato, tipo vetro)
- sistema di apertura (battente, doppia, scorrevole interno muro, a parete, a soffitto, rototraslante, complanare, bilico)

Se il catalogo elenca 12 finiture legno × 5 modelli, devi estrarre tutte le combinazioni concrete che vedi associate. Se il catalogo presenta una matrice (es. "Profilo Bianco × Vetro BT/BS/BR/BRS"), estrai ogni cella della matrice come variante separata.

REGOLA #3 - PRIORITÀ:
1. Codici tecnici esatti dal catalogo (es. "BIPLAN 1LF", "BIGLASS 1VF", "VETRINA HORIZON 1VH", "PANVI 1LVF", "7PAL/Legno", "BIPLUS 7PA/Lucido") → vanno SEMPRE come voci separate
2. Finiture concrete con nome esatto (Rovere Teak, Rovere Wengé, Laccato Bianco, Vetro Fumè Trasparente FT, ecc.)
3. Sistemi di apertura → ogni variante (battente / doppia battente / rototraslante / scorrevole interno muro / a parete / a soffitto / Linea / Total Biglass bilico) come voce separata se il catalogo le distingue

REGOLA #4 - SCHEMA OBBLIGATORIO:
{
  "pannelli": [
    {
      "codice": string,        // codice tecnico es. "BIGLASS-1VF-FT-BIANCO" o codice catalogo "1VF" + sigla finitura
      "nome": string,           // descrizione completa concisa es. "BiGlass 1VF Vetro Fumè Trasparente Profilo Bianco"
      "modello": string,        // modello base es. "BiGlass"
      "serie": string,          // famiglia es. "BiSystem"
      "produttore": string,     // es. "Garofoli"
      "configurazione": string, // codice tecnico es. "1VF" o sistema apertura
      "finitura": string,       // finitura specifica es. "Rovere Teak" o "Vetro Fumè Trasparente FT"
      "tipo_apertura": string,  // "battente" | "doppia" | "scorrevole_interno_muro" | "scorrevole_parete" | "soffitto" | "rototraslante" | "complanare" | "bilico" | null
      "colore_finitura": string,// colore principale es. "Teak", "Bianco", "Fumè"
      "materiale": string,      // "legno" | "vetro" | "vetro+legno" | "alluminio"
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
    "numero_modelli_base": number,
    "numero_finiture_legno": number,
    "numero_finiture_laccate": number,
    "numero_tipi_vetro": number,
    "numero_sistemi_apertura": number,
    "stima_varianti_totali": number
  }
}

REGOLA #5 - QUANTITÀ:
Per cataloghi serramentisti il numero di varianti vendibili è ALTO. Aspettati MOLTO più di 10. Cataloghi tipo Garofoli/Bertolotto/FerreroLegno hanno 50-300 varianti vere. Estraine quante ne servono — non risparmiare token. Se il catalogo presenta 12 essenze × 4 sistemi apertura = devi tendere a 48 varianti minimo.

REGOLA #6 - PREZZI:
Cataloghi branding raramente hanno prezzi. Metti prezzo: null. NON è un motivo per scartare la voce: il serramentista applicherà il listino separato.

REGOLA #7 - DIMENSIONI:
Se trovi tabelle dimensionali (es. "L 600/650/700/750/800/900, H 1950/2000/2050/2100"), usa min/max di quelle. Se non trovi: null.

REGOLA #8 - DEDUPLICAZIONE:
Una variante = una riga. Se "BiGlass" appare in 30 pagine sempre uguale → 1 voce. Se "BiGlass Profilo Bianco vetro Fumè Trasparente" e "BiGlass Profilo Nero vetro Fumè Trasparente" sono entrambi mostrati → 2 voci distinte.`;

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
      await setImportError(supabase, import_id!, "API_KEY_MISSING", "ANTHROPIC_API_KEY non configurata");
      return NextResponse.json({ ok: false, codice_errore: "API_KEY_MISSING", dettaglio: "API key mancante" }, { status: 500 });
    }

    const { data: importRow, error: importErr } = await supabase
      .from("pannelli_imports").select("id, azienda_id, pre_analisi")
      .eq("id", import_id!).eq("azienda_id", AZIENDA_ID).single();
    if (importErr || !importRow) {
      return NextResponse.json({ ok: false, codice_errore: "IMPORT_NOT_FOUND", dettaglio: importErr?.message || "Import inesistente" }, { status: 404 });
    }

    const { data: credits } = await supabase.from("ai_credits")
      .select("budget_corrente, totale_speso_mese").eq("azienda_id", AZIENDA_ID).single();
    const budget = Number(credits?.budget_corrente ?? 0);
    if (budget < 0.10) {
      await setImportError(supabase, import_id!, "CREDITS_INSUFFICIENT", `Budget insufficiente (€${budget.toFixed(2)})`);
      return NextResponse.json({ ok: false, codice_errore: "CREDITS_INSUFFICIENT", dettaglio: `Budget insufficiente (€${budget.toFixed(2)})` }, { status: 402 });
    }

    await supabase.from("pannelli_imports").update({
      stato: "processing", file_url: pdf_url,
      pre_analisi: { ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url },
    }).eq("id", import_id!);

    const headRes = await fetch(pdf_url, { method: "HEAD" }).catch(() => null);
    if (!headRes || !headRes.ok) {
      await setImportError(supabase, import_id!, "PDF_FETCH_ERROR", `PDF non accessibile (${headRes?.status ?? "n/a"})`);
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
        max_tokens: 32000, // alto per cataloghi grandi
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "url", url: pdf_url } },
            { type: "text", text: `Estrai TUTTE le varianti vendibili dal catalogo (categoria: ${categoria}). Ricorda: ogni combinazione modello+configurazione+finitura = una riga. Se vedi 12 finiture legno per il modello BiPlan, devi produrre 12 righe BiPlan distinte. Aspettati ALMENO 30-100 varianti per un catalogo brand di porte. Rispondi SOLO con JSON valido.` },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      await setImportError(supabase, import_id!, "ANTHROPIC_ERROR", `Status ${anthropicRes.status}: ${errText}`);
      return NextResponse.json({ ok: false, codice_errore: "ANTHROPIC_ERROR", dettaglio: errText.slice(0, 500) }, { status: 502 });
    }

    const anthropicJson = await anthropicRes.json();
    const rawText: string = anthropicJson?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

    const usage = anthropicJson?.usage ?? {};
    const inTok = Number(usage.input_tokens ?? 0);
    const outTok = Number(usage.output_tokens ?? 0);
    const costoReale = (inTok * 3 / 1_000_000) + (outTok * 15 / 1_000_000);
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
        },
      }).eq("id", import_id!);
      await setImportError(supabase, import_id!, "JSON_PARSE_ERROR",
        `Anthropic non ha restituito JSON valido. stop_reason=${stopReason}. Inizio: ${rawText.slice(0, 200)}`);
      return NextResponse.json({ ok: false, codice_errore: "JSON_PARSE_ERROR", dettaglio: "JSON Anthropic non parseabile" }, { status: 502 });
    }

    const pannelli = Array.isArray(parsed?.pannelli) ? parsed!.pannelli! : [];

    if (pannelli.length === 0) {
      await supabase.from("pannelli_imports").update({
        stato: "review", pannelli_estratti: 0, costo_reale: costoReale, errore_msg: null,
        pre_analisi: {
          ...(importRow.pre_analisi || {}), categoria, file_url: pdf_url,
          metadata: parsed?.metadata ?? null,
          tokens_input: inTok, tokens_output: outTok, stop_reason: stopReason,
          raw_response: rawText.slice(0, 2000),
        },
      }).eq("id", import_id!);
      await supabase.from("ai_credits").update({
        budget_corrente: Math.max(0, budget - costoReale),
        totale_speso_mese: Number(credits?.totale_speso_mese ?? 0) + costoReale,
      }).eq("azienda_id", AZIENDA_ID);
      return NextResponse.json({
        ok: true, import_id: import_id!, numero_pannelli: 0, stato: "review", costo_reale: costoReale,
        warning: "PDF analizzato ma nessuna variante estratta. Probabilmente catalogo solo immagini. Prova manuale.",
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
      return NextResponse.json({ ok: false, codice_errore: "DB_INSERT_ERROR", dettaglio: insErr.message }, { status: 500 });
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
        tokens_input: inTok, tokens_output: outTok, stop_reason: stopReason,
      },
    }).eq("id", import_id!);

    return NextResponse.json({
      ok: true,
      import_id: import_id!,
      numero_pannelli: pannelli.length,
      stato: "review",
      costo_reale: costoReale,
      stop_reason: stopReason,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (import_id) await setImportError(supabase, import_id, "INTERNAL_ERROR", msg);
    return NextResponse.json({ ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: msg }, { status: 500 });
  }
}
