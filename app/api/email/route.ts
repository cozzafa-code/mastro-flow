import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// Resend.com (o Postmark) — aggiungi: npm install resend
// ENV: RESEND_API_KEY

export type EmailType =
  | 'preventivo_cliente'
  | 'conferma_ordine'
  | 'promemoria_pagamento'
  | 'benvenuto_operatore'
  | 'trial_scade'
  | 'fattura_allegata';

interface EmailPayload {
  tipo: EmailType;
  to: string;
  dati: Record<string, any>;
}

const TEMPLATES: Record<EmailType, (d: Record<string, any>) => { subject: string; html: string }> = {
  preventivo_cliente: (d) => ({
    subject: `Preventivo ${d.numero} — ${d.azienda}`,
    html: emailBase(d.azienda, d.colore ?? '#D08008', `
      <h2 style="margin:0 0 8px">Gentile ${d.cliente},</h2>
      <p>Le inviamo il preventivo <strong>${d.numero}</strong> del ${d.data}.</p>
      <p>Importo totale: <strong style="font-size:20px">€ ${d.importo}</strong></p>
      <div style="margin:24px 0">
        <a href="${d.link_pdf}" style="background:${d.colore ?? '#D08008'};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">
          Scarica PDF →
        </a>
      </div>
      <p style="color:#6B7280;font-size:13px">Per accettare o richiedere modifiche risponda a questa email.</p>
    `),
  }),

  conferma_ordine: (d) => ({
    subject: `Ordine confermato — ${d.azienda}`,
    html: emailBase(d.azienda, d.colore ?? '#1A9E73', `
      <h2 style="color:#1A9E73">✓ Ordine confermato!</h2>
      <p>Gentile ${d.cliente}, il suo ordine è stato confermato.</p>
      <p><strong>Data prevista posa:</strong> ${d.data_posa ?? 'Da definire'}</p>
      <p><strong>Riferimento:</strong> ${d.numero}</p>
      <p style="color:#6B7280;font-size:13px">Il nostro team la contatterà per confermare l'appuntamento.</p>
    `),
  }),

  promemoria_pagamento: (d) => ({
    subject: `Promemoria pagamento — Fattura ${d.numero}`,
    html: emailBase(d.azienda, d.colore ?? '#D08008', `
      <h2>Promemoria pagamento</h2>
      <p>Gentile ${d.cliente}, le ricordiamo che la fattura <strong>${d.numero}</strong> è in scadenza.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6B7280">Importo</td><td style="padding:8px;font-weight:700">€ ${d.importo}</td></tr>
        <tr style="background:#F2F1EC"><td style="padding:8px;color:#6B7280">Scadenza</td><td style="padding:8px;font-weight:700;color:#DC4444">${d.scadenza}</td></tr>
        <tr><td style="padding:8px;color:#6B7280">IBAN</td><td style="padding:8px;font-family:monospace">${d.iban ?? '—'}</td></tr>
      </table>
    `),
  }),

  benvenuto_operatore: (d) => ({
    subject: `Benvenuto in MASTRO — Le tue credenziali`,
    html: emailBase(d.azienda, d.colore ?? '#1A1A1C', `
      <h2>Benvenuto in MASTRO SUITE!</h2>
      <p>Ciao ${d.nome}, sei stato aggiunto come operatore da <strong>${d.azienda}</strong>.</p>
      <div style="background:#F2F1EC;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px;color:#6B7280;font-size:13px">IL TUO PIN DI ACCESSO</p>
        <p style="font-size:32px;font-weight:800;font-family:monospace;letter-spacing:8px;margin:0">${d.pin}</p>
      </div>
      <p>Accedi dall'app MASTRO o dal link:</p>
      <a href="${d.app_url}" style="background:#1A1A1C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">
        Accedi →
      </a>
    `),
  }),

  trial_scade: (d) => ({
    subject: `Il tuo trial MASTRO scade tra ${d.giorni} giorni`,
    html: emailBase('MASTRO SUITE', '#D08008', `
      <h2>Il tuo trial scade tra <span style="color:#DC4444">${d.giorni} giorni</span></h2>
      <p>Ciao ${d.nome}, il periodo di prova gratuita di MASTRO SUITE termina il <strong>${d.data_fine}</strong>.</p>
      <p>Per non perdere i tuoi dati e continuare a usare MASTRO, attiva un piano:</p>
      <div style="margin:24px 0">
        <a href="${d.link_upgrade}" style="background:#D08008;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Attiva il piano →
        </a>
      </div>
      <p style="color:#6B7280;font-size:13px">Domande? Rispondi a questa email, ti rispondo entro poche ore.</p>
    `),
  }),

  fattura_allegata: (d) => ({
    subject: `Fattura ${d.numero} — ${d.azienda}`,
    html: emailBase(d.azienda, d.colore ?? '#1A1A1C', `
      <h2>Fattura ${d.numero}</h2>
      <p>Gentile ${d.cliente}, in allegato la fattura <strong>${d.numero}</strong> del ${d.data}.</p>
      <p><strong>Importo:</strong> € ${d.importo}</p>
      <p style="color:#6B7280;font-size:13px">La fattura elettronica è stata inviata anche al Sistema di Interscambio (SDI).</p>
    `),
  }),
};

function emailBase(azienda: string, colore: string, corpo: string): string {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
  <style>body{font-family:Inter,Arial,sans-serif;background:#F2F1EC;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E3DC}
  .header{background:${colore};padding:20px 28px;color:#fff;font-weight:800;font-size:18px}
  .body{padding:28px}p{color:#374151;line-height:1.6;margin:0 0 12px}
  .footer{padding:16px 28px;background:#F2F1EC;font-size:12px;color:#9CA3AF;text-align:center}</style>
  </head><body>
  <div class="wrap">
    <div class="header">${azienda}</div>
    <div class="body">${corpo}</div>
    <div class="footer">MASTRO SUITE · <a href="/privacy" style="color:#9CA3AF">Privacy</a> · <a href="/tos" style="color:#9CA3AF">Termini</a></div>
  </div></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const payload: EmailPayload = await req.json();
    const { tipo, to, dati } = payload;

    if (!TEMPLATES[tipo]) {
      return NextResponse.json({ error: `Tipo email non valido: ${tipo}` }, { status: 400 });
    }

    const { subject, html } = TEMPLATES[tipo](dati);

    // Invia via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${dati.azienda ?? 'MASTRO SUITE'} <noreply@mastrosuite.com>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    const result = await res.json();
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err: any) {
    console.error('[email]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
