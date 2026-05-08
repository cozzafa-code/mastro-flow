// ════════════════════════════════════════════════════════════
// RDP PDF READER · AI parser via /api/chat
// ════════════════════════════════════════════════════════════
// Legge PDF risposta fornitore (Schüco, Aluplast, ecc.)
// Estrae: voci, prezzi, costo totale, costo posa stimato.
// Usa claude-sonnet-4-20250514 via /api/chat proxy.

import type { VoceEstratta } from "./rdp-supabase";

export type AIReadResult = {
  voci: VoceEstratta[];
  costo_fornitore_eur: number;
  costo_posa_stimato_eur: number;
  fornitore_riconosciuto: string | null;
  sistema_riconosciuto: string | null;
  confidence: number;     // 0..1
  raw_response: string;
};

const SYSTEM_PROMPT = `Sei un assistente specializzato nella lettura di offerte commerciali di fornitori italiani di serramenti (Schüco, Aluplast, Internorm, Reynaers, Albertini, ecc.).

Analizza il PDF allegato e restituisci ESCLUSIVAMENTE un oggetto JSON valido (NO markdown, NO commenti, NO testo prima/dopo).

Schema richiesto:
{
  "voci": [
    {
      "descrizione": "string (es. 'Finestra 2 ante AWS 75 BS.SI 1200x1400')",
      "quantita": number,
      "unita": "pz" | "mq" | "ml" | null,
      "prezzo_unitario": number,
      "prezzo_totale": number
    }
  ],
  "costo_fornitore_eur": number (somma totali, escluse spese accessorie),
  "costo_posa_stimato_eur": number (stima 15-20% del totale fornitore se non specificato altrove),
  "fornitore_riconosciuto": "string o null",
  "sistema_riconosciuto": "string o null (es. 'AWS 75 BS.SI', 'Ideal 7000')",
  "confidence": number tra 0 e 1
}

Regole:
- I prezzi sono in EUR. Estrai i valori numerici puri (es. 1.234,56 → 1234.56).
- Se il fornitore non specifica posa, stima 18% del costo fornitore.
- Se non trovi voci chiare, restituisci voci vuote ma costo_fornitore_eur con il totale generale del documento.
- confidence: 0.9+ se PDF chiaro e strutturato, 0.6-0.8 se parziale, sotto 0.5 se illeggibile.
- NESSUN testo extra: solo l'oggetto JSON.`;

/**
 * Legge un PDF fornitore e ritorna voci + costi estratti dall'AI.
 * Il PDF viene passato come URL (già caricato su Supabase Storage).
 */
export async function leggiPDFFornitore(pdf_url: string): Promise<AIReadResult | null> {
  try {
    // Scarica PDF e converti in base64
    const pdfRes = await fetch(pdf_url);
    if (!pdfRes.ok) {
      console.error("[rdp-pdf] fetch pdf failed", pdfRes.status);
      return null;
    }
    const pdfBlob = await pdfRes.blob();
    const pdfBase64 = await blobToBase64(pdfBlob);

    // Chiama /api/chat proxy
    const aiRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: "Leggi questo PDF di offerta fornitore e restituisci l'oggetto JSON come da schema. Solo JSON, nessun altro testo.",
              },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error("[rdp-pdf] AI request failed", aiRes.status);
      return null;
    }

    const aiData = await aiRes.json();
    const aiText = extractTextFromAIResponse(aiData);
    if (!aiText) {
      console.error("[rdp-pdf] no text in AI response");
      return null;
    }

    // Parse JSON pulendo eventuali markdown fences
    const jsonClean = aiText.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
    const parsed = JSON.parse(jsonClean);

    return {
      voci: parsed.voci ?? [],
      costo_fornitore_eur: Number(parsed.costo_fornitore_eur) || 0,
      costo_posa_stimato_eur: Number(parsed.costo_posa_stimato_eur) || 0,
      fornitore_riconosciuto: parsed.fornitore_riconosciuto ?? null,
      sistema_riconosciuto: parsed.sistema_riconosciuto ?? null,
      confidence: Number(parsed.confidence) || 0.5,
      raw_response: aiText,
    };
  } catch (err) {
    console.error("[rdp-pdf] parse error", err);
    return null;
  }
}

// ─── HELPERS ───────────────────────────────────────────────
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      res(result.split(",")[1] ?? "");
    };
    r.onerror = () => rej(new Error("blob to base64 failed"));
    r.readAsDataURL(blob);
  });
}

function extractTextFromAIResponse(aiData: any): string | null {
  if (!aiData?.content || !Array.isArray(aiData.content)) return null;
  const textBlocks = aiData.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text || "");
  return textBlocks.join("\n").trim();
}

/**
 * Genera testo email/WhatsApp da inviare al fornitore.
 * Usato dal bottone "Richiedi prezzo a fornitore" nel modulo MISURE.
 */
export function generaTestoRichiestaFornitore(params: {
  azienda_nome: string;
  cliente_nome: string;
  citta: string;
  vani: Array<{ tipo: string; larghezza_mm: number; altezza_mm: number; note?: string }>;
  sistema_richiesto?: string;
}): string {
  const lines = [
    `Buongiorno,`,
    ``,
    `da ${params.azienda_nome} richiediamo offerta per il cliente ${params.cliente_nome} (${params.citta}).`,
    ``,
    params.sistema_richiesto ? `Sistema richiesto: ${params.sistema_richiesto}` : `Sistema: a vostra discrezione`,
    ``,
    `Misure rilevate:`,
  ];

  params.vani.forEach((v, i) => {
    const dim = `${v.larghezza_mm}×${v.altezza_mm} mm`;
    lines.push(`${i + 1}. ${v.tipo} · ${dim}${v.note ? ` · ${v.note}` : ""}`);
  });

  lines.push(``);
  lines.push(`Cordiali saluti.`);

  return lines.join("\n");
}
