// app/api/pannelli/process/route.ts
// Processa il PDF intero (o pagine specifiche) con Claude Vision via document API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

const SYSTEM_PROMPT = `Sei un assistente esperto di cataloghi di serramenti italiani: porte interne, portoncini blindati, pannelli PVC, ingressi alluminio, porte garage.

Analizza il PDF fornito ed estrai TUTTI i modelli/pannelli/porte visibili nel documento.

Per ogni pannello trovato, identifica:
- nome del modello (es. "Tekno T82", "Sparta 5", "Lima")
- codice articolo se presente
- tipo: deve essere ESATTAMENTE uno tra: porta_interna, blindato, pvc, ingresso_alluminio, garage
- produttore (es. "Garofoli", "Dierre", "Vighi", "Internorm")
- serie/collezione
- modello dettagliato
- misure standard min/max in mm (larghezza, altezza, spessore)
- colori/finiture disponibili (lista stringhe)
- prezzo se presente in EUR
- certificazioni (RC1-RC6 sicurezza, Rw acustica dB, U termica W/m²K)

Rispondi SOLO con JSON valido. ZERO markdown. ZERO backticks. ZERO testo introduttivo.

Schema OBBLIGATORIO:
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

Anche se il catalogo contiene 1 solo modello, ritornalo come elemento del array "pannelli". Se davvero non c'è NESSUN pannello identificabile, ritorna {"pannelli":[]}. Mai inventare: campi non visibili = null.`;

export async function POST(req: NextRequest) {
  try {
    if (!ANTHROPIC_KEY) {
      return NextResponse.json({
        error: "ANTHROPIC_API_KEY mancante. Vai su Vercel → Settings → Environment Variables e aggiungi ANTHROPIC_API_KEY=sk-ant-...",
        codice_errore: "API_KEY_MISSING",
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { import_id, pdf_base64 } = body;

    if (!import_id || !pdf_base64) {
      return NextResponse.json({ error: "import_id e pdf_base64 richiesti" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

    // Anthropic supporta nativamente PDF come document type
    let message: any;
    try {
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document" as any,
                source: { type: "base64" as any, media_type: "application/pdf" as any, data: pdf_base64 },
              } as any,
              {
                type: "text",
                text: "Analizza questo intero catalogo PDF ed estrai tutti i pannelli secondo lo schema indicato. Rispondi SOLO con JSON valido.",
              },
            ],
          },
        ],
      });
    } catch (anthropicErr: any) {
      console.error("Anthropic error:", anthropicErr);
      return NextResponse.json({
        error: `Errore Claude API: ${anthropicErr?.message || "sconosciuto"}`,
        codice_errore: "ANTHROPIC_ERROR",
        details: anthropicErr?.message,
      }, { status: 500 });
    }

    const textBlock = message.content.find((c: any) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({
        pannelli: [],
        errore: "Risposta AI non contiene testo",
      });
    }

    let parsed: any = null;
    try {
      const cleaned = textBlock.text.replace(/```json/g, "").replace(/```/g, "").trim();
      // Prova a estrarre solo il JSON object se c'è preamble
      const match = cleaned.match(/\{[\s\S]*\}/);
      const jsonText = match ? match[0] : cleaned;
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      return NextResponse.json({
        pannelli: [],
        errore: "JSON parse failed",
        raw_response: textBlock.text.substring(0, 500),
      });
    }

    const pannelli = parsed?.pannelli || [];

    // Inserisci pannelli estratti in tabella temp per review
    if (pannelli.length > 0) {
      const rows = pannelli.map((p: any, i: number) => ({
        import_id,
        pagina: 1,
        posizione_in_pagina: i,
        dati: { ...p, produttore: p.produttore || parsed.produttore, serie: p.serie || parsed.serie },
        confermato: true,
      }));
      await supabase.from("pannelli_estratti_temp").insert(rows);
    }

    // Aggiorna contatore + costo reale
    const inputTokens = message.usage?.input_tokens || 0;
    const outputTokens = message.usage?.output_tokens || 0;
    const costoReale = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

    const { data: imp } = await supabase
      .from("pannelli_imports")
      .select("pannelli_estratti, costo_reale")
      .eq("id", import_id)
      .single();

    await supabase
      .from("pannelli_imports")
      .update({
        pannelli_estratti: (imp?.pannelli_estratti || 0) + pannelli.length,
        costo_reale: (imp?.costo_reale || 0) + costoReale,
      })
      .eq("id", import_id);

    return NextResponse.json({
      pannelli,
      pannelli_count: pannelli.length,
      tokens_in: inputTokens,
      tokens_out: outputTokens,
      costo_reale: costoReale,
      produttore: parsed.produttore,
      serie: parsed.serie,
    });
  } catch (e: any) {
    console.error("Process error:", e);
    return NextResponse.json({
      error: e.message || "Errore generico",
      codice_errore: "GENERIC_ERROR",
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    anthropic_key_configured: !!ANTHROPIC_KEY,
    supabase_configured: !!SUPABASE_URL && !!SUPABASE_KEY,
  });
}
