import { NextRequest, NextResponse } from "next/server";

// NON edge runtime — serve fetch a Supabase
// export const runtime = "edge";

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

// ─── Parole chiave tecniche ────────────────────────────────────────────────────

const KEYWORDS_TECNICI = [
  "ideal", "energeto", "aluplast", "profilo", "profili", "uf", "uw", "up",
  "telaio", "anta", "traverso", "fermavetro", "guarnizione", "saldatura",
  "cx30", "cx45", "cx55", "cx60", "cx65", "cx70", "twin systems",
  "blackout", "schermatura", "gtot", "tessuto", "detrazione",
  "pannello porta", "pirall", "taglio termico", "barretta",
  "lavorazione", "cnc", "drenaggio", "scarico", "foro",
  "normativa", "uni", "cam", "passiva", "vento", "condensa",
  "kg/ml", "peso profilo", "cerniera", "cremonese", "portata",
  "posa", "giunto", "nastro", "schiuma", "membrana",
  "distanza angolo", "interasse", "fissaggio",
  "grande", "grandi", "migliore", "bonamassa", "maestro", "montaggio", "spessore", "carica vetro", "punta corta", "punta lunga", "schiuma", "soudal", "anta tocca",
];

function isDomandaTecnica(msg: string): boolean {
  const q = msg.toLowerCase();
  return KEYWORDS_TECNICI.some(k => q.includes(k));
}

// ─── Ricerca DB tecnico Supabase ──────────────────────────────────────────────

async function cercaDBTecnico(domanda: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return "";

  const q = domanda.toLowerCase();
  const risultati: string[] = [];

  const sbFetch = async (table: string, select: string, filters?: string) => {
    try {
      const endpoint = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters ? "&" + filters : ""}&limit=20`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch { return []; }
  };

  // Sistemi profili PVC
  if (q.match(/ideal|energeto|aluplast|uf|pvc|sistema|profil/)) {
    const data = await sbFetch(
      "sistemi_profili",
      "nome,uf_val,spessore_telaio_mm,numero_camere,numero_guarnizioni,peso_max_anta_kg,larghezza_max_anta_mm,altezza_max_anta_mm,guarnizione_centrale,bonding_inside,casa_passiva,rinforzo_tipo"
    );
    if (data?.length) risultati.push(
      "PROFILI PVC ALUPLAST:\n" + data.map((s: any) =>
        `- ${s.nome}: Uf=${s.uf_val} W/m²K, ${s.spessore_telaio_mm}mm, ${s.numero_camere} camere${s.guarnizione_centrale ? ", guarn.centrale" : ""}${s.bonding_inside ? ", bonding inside" : ""}${s.casa_passiva ? ", CASA PASSIVA" : ""}, max anta ${s.larghezza_max_anta_mm}x${s.altezza_max_anta_mm}mm ${s.peso_max_anta_kg}kg`
      ).join("\n")
    );
  }

  // Profili alluminio Twin Systems
  if (q.match(/cx\d+|twin|alluminio|telaio|anta|traverso|kg.ml|peso profil/)) {
    const m = q.match(/cx(\d+)/); const serieNum = m ? (m[1].length <= 2 ? m[1] + "0" : m[1]) : null; const filters = serieNum ? `serie=eq.CX${serieNum.toUpperCase()}` : "";
    const data = await sbFetch(
      "profili_alluminio",
      "codice,descrizione,tipo,serie,spessore_mm,peso_ml,jx_cm4,taglio_termico",
      filters
    );
    if (data?.length) risultati.push(
      "PROFILI ALLUMINIO TWIN SYSTEMS:\n" + data.map((p: any) =>
        `- ${p.codice} ${p.descrizione}: ${p.peso_ml}kg/ml, serie ${p.serie}${p.spessore_mm ? ` ${p.spessore_mm}mm` : ""}${p.taglio_termico ? ", taglio termico" : ""}`
      ).join("\n")
    );
  }

  // Ferramenta
  if (q.match(/cerniera|cremonese|portata|ribalta|ferramenta|kg.*ant|ant.*kg/)) {
    const data = await sbFetch(
      "ferramenta_alluminio",
      "codice,descrizione,tipo,portata_max_kg"
    );
    if (data?.length) risultati.push(
      "FERRAMENTA:\n" + data.map((f: any) =>
        `- ${f.codice} ${f.descrizione}: portata max ${f.portata_max_kg || "nd"}kg`
      ).join("\n")
    );
  }

  // Guarnizioni
  if (q.match(/guarnizion|epdm|cingivetro|battuta|vetro.*mm/)) {
    const data = await sbFetch("guarnizioni", "codice,descrizione,funzione,spessore_vetro_min_mm,spessore_vetro_max_mm");
    if (data?.length) risultati.push(
      "GUARNIZIONI EPDM:\n" + data.map((g: any) =>
        `- ${g.codice} ${g.descrizione}: ${g.funzione}${g.spessore_vetro_min_mm ? ` (vetro ${g.spessore_vetro_min_mm}-${g.spessore_vetro_max_mm}mm)` : ""}`
      ).join("\n")
    );
  }

  // Pannelli porte
  if (q.match(/pannello|porta|up=|pirall|up \d/)) {
    const data = await sbFetch("pannelli_porte", "tipo_codice,spessore_mm,up_val,isolante");
    if (data?.length) risultati.push(
      "PANNELLI PORTE:\n" + data.map((p: any) =>
        `- ${p.tipo_codice}: ${p.spessore_mm}mm, Up=${p.up_val} W/m²K (${p.isolante})`
      ).join("\n")
    );
  }

  // Tessuti schermatura
  if (q.match(/blackout|tessuto|schermatura|gtot|detrazione.*50|50.*detrazione/)) {
    const data = await sbFetch("tessuti_schermatura", "nome_prodotto,colore,gtot_interno,classe_gtot_interno,detrazione_50pct");
    if (data?.length) risultati.push(
      "TESSUTI SCHERMATURA:\n" + data.map((t: any) =>
        `- ${t.nome_prodotto} ${t.colore}: gtot=${t.gtot_interno} Classe ${t.classe_gtot_interno}${t.detrazione_50pct ? " ✓ detraibile 50%" : ""}`
      ).join("\n")
    );
  }

  // Saldatura
  if (q.match(/saldatura|temperatura|fusione|pvc.*sald/)) {
    const data = await sbFetch("parametri_saldatura", "*", "limit=1");
    if (data?.[0]) {
      const s = data[0];
      risultati.push(
        `SALDATURA PVC: temp ${s.temperatura_piastra_min_c}-${s.temperatura_piastra_max_c}°C, fusione ${s.profondita_fusione_min_mm}-${s.profondita_fusione_max_mm}mm, riscaldamento ${s.tempo_riscaldamento_min_s}-${s.tempo_riscaldamento_max_s}s, giunzione ${s.tempo_giunzione_min_s}-${s.tempo_giunzione_max_s}s`
      );
    }
  }

  // Lavorazioni CNC
  if (q.match(/lavorazion|cnc|drenaggio|scarico|foro|fresatura/)) {
    const data = await sbFetch("lavorazioni_profili", "codice,nome,tipo,dim_diametro_mm,dim_larghezza_mm,obbligatoria,note");
    if (data?.length) risultati.push(
      "LAVORAZIONI CNC:\n" + data.map((l: any) =>
        `- ${l.codice} ${l.nome}${l.dim_diametro_mm ? ` Ø${l.dim_diametro_mm}mm` : ""}${l.obbligatoria ? " [OBB]" : ""}${l.note ? ` — ${l.note}` : ""}`
      ).join("\n")
    );
  }

  // Regole normativa
  if (q.match(/norma|uni |cam|passiva|vento|condensa|posa|legale|obbligator/)) {
    const data = await sbFetch("regole_validazione", "codice_norma,descrizione,severita");
    if (data?.length) risultati.push(
      "NORMATIVE:\n" + data.map((r: any) =>
        `- [${r.severita}] ${r.codice_norma}: ${r.descrizione}`
      ).join("\n")
    );
  }

  // Vento
  if (q.match(/vento|pressione|piano|altezza.*edificio/)) {
    const data = await sbFetch("tabella_vento", "*", "order=altezza_min_m.asc");
    if (data?.length) risultati.push(
      "PRESSIONE VENTO:\n" + data.map((v: any) =>
        `- ${v.altezza_min_m}-${v.altezza_max_m}m: ${v.pressione_nm2} N/m² (${v.velocita_kmh} km/h)`
      ).join("\n")
    );
  }

  return risultati.join("\n\n");
}

// ─── Handler principale ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, context, tts } = await req.json();

  // Ultima domanda utente
  const ultimaMsg = [...(messages || [])].reverse().find((m: any) => m.role === "user")?.content || "";

  // Cerca nel DB tecnico se domanda tecnica
  let contestoTecnico = "";
  if (isDomandaTecnica(ultimaMsg)) {
    contestoTecnico = await cercaDBTecnico(ultimaMsg);
  }

  const contextBlock = context
    ? `\n\nDATI AZIENDA IN TEMPO REALE:\n${JSON.stringify(context, null, 2)}`
    : "";

  const tecnicoBlock = contestoTecnico
    ? `\n\nDATABASE TECNICO MASTRO (usa questi dati per rispondere — sono dati reali da certificati):\n${contestoTecnico}`
    : "";

  const sysWithCtx = SYSTEM + contextBlock + tecnicoBlock;

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
