import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// ── Funzioni che l'AI può eseguire ──────────────────────────
const FUNCTIONS = [
  {
    name: "crea_commessa",
    description: "Crea una nuova commessa per un cliente",
    parameters: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Nome del cliente" },
        cognome: { type: "string", description: "Cognome del cliente" },
        indirizzo: { type: "string", description: "Indirizzo del cantiere" },
        telefono: { type: "string", description: "Numero di telefono" },
        note: { type: "string", description: "Note sulla commessa" },
      },
      required: ["cliente"],
    },
  },
  {
    name: "crea_task",
    description: "Crea un nuovo task o promemoria",
    parameters: {
      type: "object",
      properties: {
        testo: { type: "string", description: "Descrizione del task" },
        data: { type: "string", description: "Data nel formato YYYY-MM-DD" },
        priorita: { type: "string", enum: ["alta", "media", "bassa"], description: "Priorità del task" },
        commessa: { type: "string", description: "Codice commessa collegata (es. S-0042)" },
      },
      required: ["testo"],
    },
  },
  {
    name: "crea_evento",
    description: "Crea un appuntamento o evento in agenda",
    parameters: {
      type: "object",
      properties: {
        testo: { type: "string", description: "Descrizione dell'evento" },
        data: { type: "string", description: "Data nel formato YYYY-MM-DD" },
        ora: { type: "string", description: "Ora nel formato HH:MM" },
        tipo: { type: "string", enum: ["sopralluogo", "misure", "preventivo", "posa", "collaudo", "telefonata", "riunione", "altro"], description: "Tipo di evento" },
        commessa: { type: "string", description: "Codice commessa collegata" },
      },
      required: ["testo", "data"],
    },
  },
  {
    name: "cambia_fase_commessa",
    description: "Cambia la fase/stato di una commessa nella pipeline",
    parameters: {
      type: "object",
      properties: {
        codice: { type: "string", description: "Codice commessa (es. S-0042)" },
        nuova_fase: { type: "string", enum: ["sopralluogo", "preventivo", "conferma", "ordini", "produzione", "posa", "collaudo", "chiusura"], description: "Nuova fase" },
      },
      required: ["codice", "nuova_fase"],
    },
  },
  {
    name: "cerca_commessa",
    description: "Cerca una commessa per cliente o codice e restituisce i dettagli",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome cliente o codice commessa" },
      },
      required: ["query"],
    },
  },
];

// ── TTS con ElevenLabs ──────────────────────────────────────
async function textToSpeech(text: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "o4b57JYAECRMJyCEXyIE";
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text.substring(0, 500), // max 500 chars per risposta vocale
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
      }),
    });

    if (!res.ok) return null;
    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

// ── Handler principale ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, context, tts = false } = await req.json();

    const oggi = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const systemPrompt = `Sei MASTRO AI, l'assistente intelligente integrato in MASTRO ERP per artigiani italiani.
Oggi è ${oggi}.

## DATI AZIENDA IN TEMPO REALE:
${JSON.stringify(context, null, 2)}

## COSA PUOI FARE:
- Rispondere a domande sui dati (commesse, clienti, fatture, montaggi, task)
- Analizzare performance e trend
- **ESEGUIRE AZIONI** tramite function calling: crea commesse, task, eventi, cambia fasi
- Cercare clienti e commesse specifiche

## REGOLE:
- Rispondi SEMPRE in italiano, tono professionale ma diretto
- Usa i dati reali del contesto, non inventare
- Per le azioni usa le funzioni disponibili — non dire "non posso farlo"
- Risposte vocali: max 2-3 frasi, chiare e concise
- Risposte testo: puoi essere più dettagliato
- Se mancano dati per un'azione, chiedi solo quello che serve`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        functions: FUNCTIONS,
        function_call: "auto",
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    // ── Function call richiesta ──
    if (message?.function_call) {
      const fnName = message.function_call.name;
      let fnArgs = {};
      try { fnArgs = JSON.parse(message.function_call.arguments); } catch {}

      // Genera risposta testuale che conferma l'azione
      const confirmMessages = [
        ...messages,
        message,
        {
          role: "function",
          name: fnName,
          content: JSON.stringify({ success: true, ...fnArgs }),
        },
      ];

      const confirmRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, ...confirmMessages],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      const confirmData = await confirmRes.json();
      const reply = confirmData.choices?.[0]?.message?.content || "Fatto!";

      // TTS per la conferma
      let audioData = null;
      if (tts) audioData = await textToSpeech(reply);

      return NextResponse.json({
        reply,
        action: { type: fnName, params: fnArgs },
        audio: audioData,
      });
    }

    // ── Risposta testuale normale ──
    const reply = message?.content || "Nessuna risposta";

    // TTS se richiesto
    let audioData = null;
    if (tts) audioData = await textToSpeech(reply);

    return NextResponse.json({ reply, audio: audioData });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
