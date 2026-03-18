import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `Sei MASTRO AI, l'assistente intelligente integrato in MASTRO ERP — il gestionale per artigiani italiani del settore serramenti, tendaggi, fabbri e pergole.

Hai accesso completo ai dati dell'azienda in tempo reale. Rispondi SEMPRE in italiano, in modo diretto e professionale.

## I TUOI DATI IN TEMPO REALE:
${JSON.stringify(context, null, 2)}

## COSA PUOI FARE:
- Rispondere a domande sui dati (commesse, clienti, fatture, montaggi, team)
- Analizzare trend e performance
- Suggerire azioni da compiere
- Calcolare totali, medie, scadenze
- Identificare problemi (commesse ferme, fatture scadute, ecc.)
- Guidare l'utente nel workflow del software

## REGOLE:
- Rispondi sempre in italiano
- Sii conciso ma completo
- Usa i dati reali forniti nel contesto
- Se non hai un dato, dillo chiaramente
- Per le azioni (crea commessa, cambia fase ecc.) descrivi i passi ma non eseguirle direttamente
- Usa numeri precisi dai dati, non inventare

## FORMATO RISPOSTE:
- Risposte brevi per domande semplici
- Elenchi puntati per liste di dati
- Evidenzia i numeri importanti
- Aggiungi emoji pertinenti per leggibilità (✅ ⚠️ 📊 💰 📅)`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Nessuna risposta";

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
