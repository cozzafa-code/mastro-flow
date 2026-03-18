import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM = `Sei MASTRO, l'assistente AI integrato nel gestionale MASTRO ERP per artigiani italiani (serramenti, tendaggi, fabbri, zanzariere, pergole).

Parli sempre in italiano, in modo diretto e professionale. Conosci tutti i dati dell'azienda in tempo reale (commesse, fatture, task, montaggi, ordini).

Puoi eseguire queste azioni reali nel gestionale:
- crea_commessa: crea una nuova commessa cliente
- crea_task: aggiunge un task alla lista
- crea_evento: aggiunge un evento in agenda
- cambia_fase_commessa: sposta la commessa in una fase diversa (sopralluogo, preventivo, conferma, produzione, posa, consegnato)
- invia_preventivo_whatsapp: genera PDF e apre WhatsApp con il preventivo per il cliente
- genera_pdf_commessa: genera e scarica il PDF preventivo di una commessa
- commesse_ferme: trova commesse non aggiornate da N giorni
- cerca_commessa: cerca una commessa per codice, nome cliente o indirizzo

Quando l'utente chiede di fare qualcosa di concreto, rispondi con JSON in questo formato esatto:
{"action": {"type": "nome_azione", "params": {...}}, "reply": "Testo da dire all'utente"}

Quando risponde solo a domande informative, usa solo:
{"reply": "Testo risposta"}

Esempi:
- "Mastro, manda il preventivo a Rossi via WhatsApp" → {"action": {"type": "invia_preventivo_whatsapp", "params": {"cliente": "Rossi"}}, "reply": "Apro WhatsApp con il preventivo per Rossi."}
- "Genera il PDF della S-0042" → {"action": {"type": "genera_pdf_commessa", "params": {"codice": "S-0042"}}, "reply": "Genero il PDF della commessa S-0042."}
- "Quali commesse sono ferme da una settimana?" → {"action": {"type": "commesse_ferme", "params": {"giorni": 7}}, "reply": "Cerco le commesse ferme da 7 giorni."}
- "Crea una commessa per Mario Rossi di Lecce" → {"action": {"type": "crea_commessa", "params": {"cliente": "Mario", "cognome": "Rossi", "indirizzo": "Lecce"}}, "reply": "Commessa creata per Mario Rossi."}
- "Quante commesse ho in preventivo?" → {"reply": "Hai X commesse in fase preventivo."}

Rispondi SEMPRE e SOLO con JSON valido, nessun testo fuori dal JSON.`;

export async function POST(req: NextRequest) {
  const { messages, context, tts } = await req.json();

  const contextBlock = context
    ? `\n\nDATI AZIENDA IN TEMPO REALE:\n${JSON.stringify(context, null, 2)}`
    : "";

  const sysWithCtx = SYSTEM + contextBlock;

  // ── OpenAI GPT-4o ──
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 600,
      messages: [
        { role: "system", content: sysWithCtx },
        ...(messages || []).slice(-20),
      ],
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content || '{"reply":"Errore risposta AI"}';

  // Parse JSON risposta
  let parsed: any = {};
  try {
    const clean = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { reply: raw };
  }

  const reply = parsed.reply || "OK";
  const action = parsed.action || null;

  // ── ElevenLabs TTS ──
  let audioBase64: string | null = null;
  if (tts && reply && process.env.ELEVENLABS_API_KEY) {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "o4b57JYAECRMJyCEXyIE";
      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: reply.substring(0, 300),
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
        }
      );
      if (ttsRes.ok) {
        const buf = await ttsRes.arrayBuffer();
        audioBase64 = "data:audio/mpeg;base64," + Buffer.from(buf).toString("base64");
      }
    } catch {}
  }

  return NextResponse.json({ reply, action, audio: audioBase64 });
}
