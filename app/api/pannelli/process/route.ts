// app/api/pannelli/process/route.ts
// Processa una pagina del PDF con Claude Vision
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

const SYSTEM_PROMPT = `Sei un assistente specializzato nell'analisi di cataloghi di serramenti e pannelli italiani (porte interne, blindati, PVC, ingressi alluminio, garage).

Ti fornisco l'immagine di una pagina di catalogo. Devi estrarre TUTTI i modelli/pannelli visibili nella pagina.

Per ogni pannello rilevato, identifica:
- nome del modello (es. "Tekno T82", "Sparta 5")
- codice articolo (se presente)
- tipo: una di [porta_interna, blindato, pvc, ingresso_alluminio, garage]
- produttore e serie (se identificabili)
- misure standard min/max in mm (larghezza, altezza, spessore)
- colori/finiture disponibili (lista stringhe)
- prezzo (se presente, in EUR)
- certificazioni (RC1-RC6 sicurezza, Rw acustica, U termica)

Rispondi SOLO con JSON valido. NO markdown. NO preamble. Niente "ecco il JSON" o backticks.

Schema:
{
  "produttore": "string|null",
  "serie": "string|null",
  "pannelli": [
    {
      "nome": "string",
      "codice": "string|null",
      "tipo": "porta_interna|blindato|pvc|ingresso_alluminio|garage",
      "modello": "string|null",
      "colore_finitura": "string|null",
      "colori_disponibili": ["string"],
      "larghezza_min": number|null,
      "larghezza_max": number|null,
      "altezza_min": number|null,
      "altezza_max": number|null,
      "spessore_mm": number|null,
      "prezzo": number|null,
      "certificazioni": {"sicurezza": "string|null", "acustica": "string|null", "termica": "string|null"}
    }
  ]
}

Se la pagina è puramente tecnica/intro/indice senza pannelli specifici, ritorna {"pannelli":[]}. Mai inventare dati: se non li vedi, lascia null.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { import_id, pagina, image_base64 } = body;

    if (!import_id || !pagina || !image_base64) {
      return NextResponse.json({ error: "import_id, pagina, image_base64 richiesti" }, { status: 400 });
    }

    if (!ANTHROPIC_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurata" }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

    // Chiamata Claude Vision
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: image_base64 },
            },
            {
              type: "text",
              text: `Analizza questa pagina (numero ${pagina}) ed estrai tutti i pannelli/modelli. Rispondi SOLO con JSON valido.`,
            },
          ],
        },
      ],
    });

    // Estrai testo + parse JSON
    const textBlock = message.content.find((c: any) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ pannelli: [], errore: "no_text_response" });
    }

    let parsed: any = null;
    try {
      const jsonText = textBlock.text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      // Salva ma non aggiungere pannelli
      return NextResponse.json({ pannelli: [], errore: "json_parse_failed", raw: textBlock.text.substring(0, 200) });
    }

    const pannelli = parsed?.pannelli || [];

    // Inserisci pannelli estratti in tabella temp per review
    if (pannelli.length > 0) {
      const rows = pannelli.map((p: any, i: number) => ({
        import_id,
        pagina,
        posizione_in_pagina: i,
        dati: { ...p, produttore: parsed.produttore, serie: parsed.serie },
        confermato: true,
      }));
      await supabase.from("pannelli_estratti_temp").insert(rows);

      // Aggiorna contatore
      const { data: imp } = await supabase
        .from("pannelli_imports")
        .select("pannelli_estratti, costo_reale")
        .eq("id", import_id)
        .single();

      const inputTokens = message.usage?.input_tokens || 0;
      const outputTokens = message.usage?.output_tokens || 0;
      const costoPagina = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

      await supabase
        .from("pannelli_imports")
        .update({
          pannelli_estratti: (imp?.pannelli_estratti || 0) + pannelli.length,
          costo_reale: (imp?.costo_reale || 0) + costoPagina,
        })
        .eq("id", import_id);
    }

    return NextResponse.json({
      pannelli,
      tokens_in: message.usage?.input_tokens || 0,
      tokens_out: message.usage?.output_tokens || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
