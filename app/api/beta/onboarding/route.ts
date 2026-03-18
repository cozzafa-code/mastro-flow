// app/api/beta/onboarding/route.ts
// Email onboarding beta tester: sequenza automatica 5 email in 14 giorni
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEQUENZA_EMAIL = [
  {
    day: 0, id: "welcome",
    subject: "Benvenuto in MASTRO — inizia subito 🚀",
    body: (nome: string) => `
Ciao ${nome},

Benvenuto in MASTRO! Hai 30 giorni per testare tutto senza limitazioni.

Ecco cosa puoi fare OGGI in 15 minuti:
→ Crea la tua prima commessa
→ Configura un preventivo e invialo via WhatsApp
→ Attiva l'AI Agente per rispondere ai clienti in automatico

Hai bisogno di aiuto? Rispondi a questa email — ti rispondo io personalmente.

A presto,
Fabio — MASTRO
    `,
  },
  {
    day: 3, id: "features",
    subject: "Hai visto il configuratore? (con calcolo Uw automatico)",
    body: (nome: string) => `
Ciao ${nome},

Dopo 3 giorni voglio assicurarmi che tu abbia trovato le funzioni più utili:

🔧 CONFIGURATORE: apri una commessa → clicca "Configura" → vedi Uw, margine e classe energetica in tempo reale

📋 PREVENTIVO: dal configuratore → PDF pronto → firma digitale del cliente via smartphone

🤖 AI AGENTE: risponde ai clienti WhatsApp quando sei in cantiere

Hai trovato qualcosa che non funziona? Dimmi tutto.

Fabio
    `,
  },
  {
    day: 7, id: "midpoint",
    subject: "Metà del trial — come sta andando?",
    body: (nome: string) => `
Ciao ${nome},

Sei a metà del tuo trial di 30 giorni.

Vorrei capire come sta andando. 3 domande rapide:
1. Hai già fatto un preventivo con MASTRO?
2. C'è qualcosa che non riesci a fare?
3. Quanto tempo ti sta facendo risparmiare?

Rispondimi qui — le tue risposte migliorano il prodotto per tutti.

Fabio
    `,
  },
  {
    day: 21, id: "pre_end",
    subject: "Il trial scade tra 9 giorni",
    body: (nome: string) => `
Ciao ${nome},

Tra 9 giorni scade il tuo trial gratuito di MASTRO.

Piano START a €29/mese:
✓ Commesse illimitate
✓ Configuratore + PDF
✓ Messaggi WhatsApp
✓ App mobile iOS/Android

Piano PRO a €59/mese (il più scelto):
✓ Tutto di START
✓ AI Agente autopilot 24/7
✓ Trova Clienti (20 lead/mese)
✓ ENEA / CAM 2026
✓ Report analytics

Attiva ora → mastro-erp.vercel.app/dashboard

Hai domande? Chiamami: +39 ...

Fabio
    `,
  },
  {
    day: 28, id: "last_call",
    subject: "Ultimi 2 giorni — offerta speciale",
    body: (nome: string) => `
Ciao ${nome},

Tra 2 giorni scade il trial.

Per i beta tester che attivano entro domani: primo mese gratis (oltre al trial).

→ mastro-erp.vercel.app/dashboard → Impostazioni → Piano

Non perdere l'accesso ai tuoi dati.

Fabio
    `,
  },
];

export async function POST(req: NextRequest) {
  try {
    const { azienda_id, nome, email, giorno } = await req.json();

    const emailDaInviare = SEQUENZA_EMAIL.filter(e => e.day === (giorno || 0));
    if (!emailDaInviare.length) return NextResponse.json({ sent: 0 });

    // Log nel DB (in produzione: usa Resend/SendGrid)
    for (const email_template of emailDaInviare) {
      await supabaseAdmin.from("audit_log").insert({
        azienda_id,
        azione: `email_${email_template.id}`,
        dettagli: { email, nome, subject: email_template.subject, day: email_template.day }
      });

      // TODO: await resend.emails.send({ from: "MASTRO <noreply@mastro.it>", to: email, subject: email_template.subject, text: email_template.body(nome) });
      console.log(`[BETA EMAIL] Day ${email_template.day} → ${email}: ${email_template.subject}`);
    }

    return NextResponse.json({ sent: emailDaInviare.length, emails: emailDaInviare.map(e => e.id) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: trigger manuale sequenza per azienda
export async function GET(req: NextRequest) {
  try {
    const azId = req.nextUrl.searchParams.get("azienda_id");
    if (!azId) return NextResponse.json({ error: "Missing azienda_id" }, { status: 400 });

    const { data: az } = await supabaseAdmin.from("aziende").select("ragione,nome,email_titolare,created_at").eq("id", azId).single();
    if (!az) return NextResponse.json({ error: "Azienda non trovata" }, { status: 404 });

    const ggDallaRegistrazione = Math.floor((Date.now() - new Date(az.created_at).getTime()) / 86400000);
    const nomeAz = az.ragione || az.nome || "artigiano";
    const emailAz = az.email_titolare || "";

    const emails = SEQUENZA_EMAIL.filter(e => e.day <= ggDallaRegistrazione);
    return NextResponse.json({ azienda: nomeAz, giorni: ggDallaRegistrazione, emails_da_inviare: emails.map(e => ({ day: e.day, id: e.id, subject: e.subject })) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
