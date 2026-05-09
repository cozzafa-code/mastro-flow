// app/api/v1/fatture/[id]/send-sdi/route.ts
// POST /api/v1/fatture/{id}/send-sdi
// Invia fattura MASTRO a SDI via Fatture in Cloud
// Scope richiesto: fatture:write

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';
import { pushMastroFatturaToFic } from '@/lib/integrations/fatture-in-cloud';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const POST = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const fatturaId = url.pathname.split('/').slice(-2)[0];

  if (!fatturaId) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  // 1. Recupera fattura MASTRO
  const { data: fattura, error: fatErr } = await supabaseAdmin
    .from('fin_fatture_emesse')
    .select('*')
    .eq('id', fatturaId)
    .eq('azienda_id', ctx.aziendaId)
    .maybeSingle();

  if (fatErr || !fattura) {
    return NextResponse.json({ error: 'fattura_not_found' }, { status: 404 });
  }

  // 2. Recupera config FIC dell'azienda (da user_integrazioni)
  const { data: integ } = await supabaseAdmin
    .from('user_integrazioni')
    .select('config')
    .eq('azienda_id', ctx.aziendaId)
    .eq('tipo', 'fatture_in_cloud')
    .maybeSingle();

  if (!integ?.config) {
    return NextResponse.json(
      { error: 'fic_not_configured', message: 'Fatture in Cloud non configurato per questa azienda' },
      { status: 400 }
    );
  }

  const ficConfig = integ.config as { accessToken: string; companyId: number };

  // 3. Prepara payload e push
  try {
    const result = await pushMastroFatturaToFic(ficConfig, {
      numero: fattura.numero,
      data: fattura.data_emissione || new Date().toISOString().slice(0, 10),
      cliente: {
        name: fattura.cliente_ragione_sociale || fattura.cliente_nome,
        vat_number: fattura.cliente_piva,
        tax_code: fattura.cliente_cf,
        email: fattura.cliente_email,
        address_street: fattura.cliente_indirizzo,
        address_city: fattura.cliente_citta,
        address_province: fattura.cliente_provincia,
        ei_code: fattura.cliente_sdi || '0000000',
      },
      righe: (fattura.righe || []).map((r: any) => ({
        descrizione: r.descrizione,
        quantita: r.quantita || 1,
        prezzo_unitario: r.prezzo_unitario,
        iva_percent: r.iva_percent ?? 22,
      })),
      totale_imponibile: fattura.totale_imponibile,
      totale_iva: fattura.totale_iva,
      totale_documento: fattura.totale_documento,
    });

    // 4. Aggiorna fattura MASTRO con riferimenti FIC
    await supabaseAdmin
      .from('fin_fatture_emesse')
      .update({
        sdi_inviata: true,
        sdi_inviata_il: new Date().toISOString(),
        sdi_provider: 'fatture_in_cloud',
        sdi_provider_id: String(result.fic_invoice_id),
        sdi_status: result.sdi_status,
        sdi_pdf_url: result.pdf_url,
      })
      .eq('id', fatturaId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'fic_error', message: e?.message ?? 'Errore Fatture in Cloud', detail: e?.detail },
      { status: 502 }
    );
  }
}, { scope: 'fatture:write' });
