// ============================================================
// MASTRO ERP — /api/profilo-extract/route.ts
// Estrae dati tecnici profilo da PDF/immagine con Claude Vision
// + genera SVG vettoriale con Potrace
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Prompt specializzato per estrazione dati profili serramenti
const SYSTEM_PROMPT = `Sei un esperto di profili per serramenti, finestre, porte e strutture in alluminio e PVC.
Analizza l'immagine fornita e estrai TUTTI i dati tecnici visibili.

RISPONDI SOLO con un oggetto JSON valido (nessun testo prima o dopo), con questi campi:

{
  "profili": [
    {
      "codice": "codice profilo se visibile (es. 14XX07, CX60.101, IDEAL 4000)",
      "nome": "nome descrittivo (es. Telaio 70mm, Anta battente CX600)",
      "tipo": "Anta|Telaio|Riporto Centrale|Traverso|Montante|Multiuso|Complementare|Fermavetro|Zoccolo|Fascia|Zoccolo Riportato|Compensatore|Colonna|Tubolare|Profilo Tondo|Angolare|Binario|Scattino|Altro",
      "utilizzo": "telaio_fisso|anta_battente|anta_scorrevole|fermavetro|riporto|traverso|montante|soglia|fascia|complementare",
      "materiale": "PVC|Alluminio|Legno|Legno-Alluminio|Acciaio",
      "marca": "marca/fornitore se visibile (es. Aluplast, Twin Systems, Rehau, Schuco)",
      "profondita_mm": "profondita del profilo in mm (la dimensione orizzontale della sezione, tipicamente 55-120mm)",
      "frontale": "faccia vista del profilo in mm (altezza visibile da davanti, la dimensione verticale)",
      "battuta": "sovrapposizione con profilo accoppiato in mm — la parte che si sovrappone al telaio (per anta) o all'anta (per telaio). Cerca quote che indicano quanto un profilo copre l'altro",
      "sede_fermavetro": "profondita alloggio vetro in mm — la rientranza dove si inserisce il vetro/fermavetro. Nei disegni tecnici spesso quotata con una freccia verso la scanalatura interna",
      "tubolare": "altezza della parte strutturale chiusa (il rettangolo pieno/chiuso piu grande nella sezione) in mm",
      "aria": "gioco libero tra profili accoppiati in mm — lo spazio vuoto tra telaio e anta visibile nella sezione del nodo",
      "camere": "numero camere interne (solo PVC — gli spazi vuoti dentro il profilo)",
      "uf": "valore trasmittanza termica Uf in W/m2K",
      "peso_kg_ml": "peso al metro lineare in kg/ml",
      "sviluppo": "sviluppo lineare del profilo in mm (spesso scritto come 'mm. XX' o '-- mm XX')",
      "quote_mm": ["lista di TUTTE le quote costruttive visibili nel disegno in mm"],
      "ferramenta": ["codici ferramenta se visibili"],
      "note": "altre info tecniche"
    }
  ],
  "pagina_tipo": "disegno_tecnico|scheda_prodotto|catalogo_generale|distinta_taglio|nodo_sezione|foto|altro",
  "confidenza": "alta|media|bassa"
}

REGOLE IMPORTANTI:
- MISURE PER DISTINTA TAGLIO: battuta, sede_fermavetro, tubolare, aria sono CRITICHE per il calcolo dei tagli. Cercale nelle quote del disegno tecnico.
- La BATTUTA e la parte del profilo che sporge lateralmente e si sovrappone all'altro profilo accoppiato
- La SEDE FERMAVETRO e la scanalatura dove si inserisce il vetro, spesso quotata separatamente
- Il TUBOLARE e il rettangolo chiuso strutturale piu grande nella sezione
- L'ARIA e il gioco tra telaio e anta visibile nei nodi (sezioni con 2 profili accoppiati)
- Se vedi un NODO (2 profili accoppiati), estrai entrambi i profili separatamente e calcola l'aria tra loro
- Se vedi PIU profili nella stessa immagine, elencali tutti separatamente
- Se un dato non e visibile, usa null
- Per Twin Systems cerca sigle: CX, MX, RX, DX, DW, SX, WF, WX, EW, HX, HM
- Per Aluplast cerca: IDEAL 4000/5000/7000/8000, ENERGETO, ENERGETO NEO
- I codici Aluplast tipo 14XX07 significano serie 4000 profilo 07`;

export async function POST(req: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurata" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    
    // Determina media type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    let mediaType = "image/png";
    if (ext === "jpg" || ext === "jpeg") mediaType = "image/jpeg";
    else if (ext === "png") mediaType = "image/png";
    else if (ext === "gif") mediaType = "image/gif";
    else if (ext === "webp") mediaType = "image/webp";
    else if (ext === "pdf") mediaType = "application/pdf";

    // Per PDF: usa il tipo document
    const content: any[] = [];
    
    if (ext === "pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      });
    } else {
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }
    
    content.push({
      type: "text",
      text: "Analizza questa immagine/documento di profili serramenti. Estrai tutti i dati tecnici in formato JSON.",
    });

    // Chiama Claude Vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", errText);
      return NextResponse.json({ error: "Errore Claude API: " + response.status }, { status: 500 });
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === "text");
    const rawText = textBlock?.text || "";

    // Parse JSON dalla risposta
    let extracted;
    try {
      // Rimuovi eventuali backtick markdown
      const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(clean);
    } catch {
      // Se non riesce a parsare, restituisci il testo raw
      return NextResponse.json({
        profili: [],
        raw_text: rawText,
        error: "Risposta non parsabile come JSON",
        usage: data.usage,
      });
    }

    // Aggiungi info costi
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    // Sonnet: $3/MTok input, $15/MTok output
    const costoUSD = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

    return NextResponse.json({
      ...extracted,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        costo_usd: Math.round(costoUSD * 10000) / 10000,
      },
    });

  } catch (e: any) {
    console.error("Errore profilo-extract:", e);
    return NextResponse.json({ error: e.message || "Errore interno" }, { status: 500 });
  }
}
