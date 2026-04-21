// app/api/firma/webhook/route.ts
// Webhook chiamato da Namirial quando envelope cambia stato.
// Payload atteso (semplificato): { EnvelopeId, EventType, Status }
// Quando status = 'Completed': scarica PDF firmato, salvalo su storage, aggiorna firma_tokens.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEnvelope } from '@/lib/firma/namirial';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const envelopeId: string | undefined = body.EnvelopeId || body.envelopeId || body.envelope_id;
    const eventType: string = body.EventType || body.eventType || '';
    const status: string = (body.Status || body.status || '').toLowerCase();

    if (!envelopeId) {
      return NextResponse.json({ error: 'envelopeId mancante' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Trova firma_tokens
    const { data: fToken, error: tErr } = await supabase
      .from('firma_tokens')
      .select('id, azienda_id, commessa_id, cm_id, provider_log, pdf_non_firmato_path')
      .eq('envelope_id', envelopeId)
      .single();

    if (tErr || !fToken) {
      return NextResponse.json({ error: 'envelope non tracciato nel DB' }, { status: 404 });
    }

    // Log evento
    const logEntry = { ts: new Date().toISOString(), evento: eventType || 'status_update', status, raw: body };
    const nuovoLog = [...((fToken.provider_log as any[]) || []), logEntry];

    // Se completato, scarica PDF firmato
    if (status === 'completed' || eventType === 'EnvelopeCompleted' || status === 'completed_or_finished') {
      const { data: azienda } = await supabase
        .from('aziende')
        .select('firma_api_key, firma_account_id, firma_provider')
        .eq('id', fToken.azienda_id)
        .single();

      if (!azienda?.firma_api_key) {
        await supabase.from('firma_tokens').update({
          stato: 'errore',
          provider_log: [...nuovoLog, { ts: new Date().toISOString(), evento: 'err', msg: 'api_key mancante' }],
        }).eq('id', fToken.id);
        return NextResponse.json({ error: 'credenziali firma mancanti' }, { status: 500 });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mastro-erp.vercel.app';
      const envStato = await getEnvelope({
        apiKey: azienda.firma_api_key,
        organizationKey: azienda.firma_account_id || undefined,
        webhookUrl: `${baseUrl}/api/firma/webhook`,
        returnUrl: `${baseUrl}/firma/completata`,
      }, envelopeId);

      if (envStato.ok && envStato.pdfFirmatoBase64) {
        const buf = Buffer.from(envStato.pdfFirmatoBase64, 'base64');
        const nome = envStato.nomePdf || `firmato-${envelopeId}.pdf`;
        const firmatoPath = (fToken.pdf_non_firmato_path || `firmati/${fToken.id}`).replace(/\.pdf$/, '') + '-FIRMATO.pdf';

        const { error: upErr } = await supabase.storage
          .from('documenti-firmati')
          .upload(firmatoPath, buf, {
            contentType: 'application/pdf',
            upsert: true,
          });

        let signedUrl: string | null = null;
        if (!upErr) {
          const { data: signed } = await supabase.storage
            .from('documenti-firmati')
            .createSignedUrl(firmatoPath, 60 * 60 * 24 * 365);
          signedUrl = signed?.signedUrl || null;
        }

        await supabase.from('firma_tokens').update({
          stato: 'firmata',
          pdf_firmato_path: firmatoPath,
          pdf_firmato_url: signedUrl,
          firmato_il: new Date().toISOString(),
          provider_log: [...nuovoLog, { ts: new Date().toISOString(), evento: 'pdf_scaricato', path: firmatoPath }],
        }).eq('id', fToken.id);

        // Aggiorna commessa con firma timestamp
        if (fToken.cm_id) {
          await supabase.from('commesse').update({
            firma_cliente: 'firmato_certificato',
            firma_data: new Date().toISOString(),
          }).eq('id', fToken.cm_id);
        }

        return NextResponse.json({ ok: true, stato: 'firmata', firmato_path: firmatoPath });
      } else {
        await supabase.from('firma_tokens').update({
          stato: 'errore',
          provider_log: [...nuovoLog, { ts: new Date().toISOString(), evento: 'err_download_pdf', msg: envStato.error }],
        }).eq('id', fToken.id);
        return NextResponse.json({ error: 'download PDF firmato fallito: ' + envStato.error }, { status: 502 });
      }
    }

    // Altri eventi: solo log
    const statoDB = ['expired', 'rejected', 'cancelled'].includes(status) ? 'annullata' : 'in_corso';
    await supabase.from('firma_tokens').update({
      stato: statoDB,
      provider_log: nuovoLog,
    }).eq('id', fToken.id);

    return NextResponse.json({ ok: true, stato: statoDB });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore interno' }, { status: 500 });
  }
}

// Per verifica connettività da Namirial
export async function GET() {
  return NextResponse.json({ ok: true, service: 'mastro-firma-webhook' });
}
