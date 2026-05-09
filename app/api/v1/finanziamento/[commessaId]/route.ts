// app/api/v1/finanziamento/[commessaId]/route.ts
// MASTRO API - Genera link Soisy/Cofidis per finanziamento cliente
// Header: Authorization: Bearer mk_live_xxx
// Scope: pagamenti:write

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SOISY_BASE = 'https://api.soisy.it/api/shops';

export const POST = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const commessaId = url.pathname.split('/').slice(-1)[0];

  const body = await req.json().catch(() => ({}));
  const provider = body.provider || 'soisy'; // soisy | cofidis | younited
  const numeroRate = body.numero_rate || 24;

  // 1. Recupera commessa
  const { data: commessa } = await supabaseAdmin
    .from('commesse')
    .select(`
      id, numero, totale, acconto_pagato,
      cliente_nome, cliente_cf, cliente_telefono, cliente_email,
      cliente_indirizzo, cliente_comune, cliente_cap
    `)
    .eq('id', commessaId)
    .eq('azienda_id', ctx.aziendaId)
    .maybeSingle();

  if (!commessa) {
    return NextResponse.json({ error: 'commessa_not_found' }, { status: 404 });
  }

  const importo = commessa.totale - (commessa.acconto_pagato || 0);
  if (importo < 200) {
    return NextResponse.json(
      { error: 'amount_too_low', message: 'Importo minimo €200' },
      { status: 400 }
    );
  }
  if (importo > 30000) {
    return NextResponse.json(
      { error: 'amount_too_high', message: 'Importo massimo €30.000 per Soisy. Usa altro provider.' },
      { status: 400 }
    );
  }

  // 2. Config provider
  const { data: integ } = await supabaseAdmin
    .from('user_integrazioni')
    .select('config')
    .eq('azienda_id', ctx.aziendaId)
    .eq('tipo', `finanziamento_${provider}`)
    .maybeSingle();

  if (!integ?.config) {
    return NextResponse.json(
      {
        error: 'provider_not_configured',
        message: `Provider ${provider} non configurato. Vai in Settings → Integrazioni → Finanziamenti.`,
      },
      { status: 400 }
    );
  }

  // 3. Crea richiesta finanziamento
  switch (provider) {
    case 'soisy':
      return await creaSoisyLoan(integ.config, commessa, importo, numeroRate, ctx);
    case 'cofidis':
      return NextResponse.json(
        { error: 'not_implemented', message: 'Cofidis in arrivo' },
        { status: 501 }
      );
    case 'younited':
      return NextResponse.json(
        { error: 'not_implemented', message: 'Younited in arrivo' },
        { status: 501 }
      );
    default:
      return NextResponse.json({ error: 'unknown_provider' }, { status: 400 });
  }
}, { scope: 'pagamenti:write' });

// ==================== SOISY ====================

async function creaSoisyLoan(
  config: any,
  commessa: any,
  importo: number,
  rate: number,
  ctx: { aziendaId: string }
) {
  const payload = {
    shopId: config.shop_id,
    amount: Math.round(importo * 100), // cents
    instalments: rate,
    invoiceId: commessa.numero,
    customer: {
      firstName: (commessa.cliente_nome || '').split(' ')[0],
      lastName: (commessa.cliente_nome || '').split(' ').slice(1).join(' '),
      email: commessa.cliente_email,
      phoneNumber: commessa.cliente_telefono,
      taxCode: commessa.cliente_cf,
    },
    billingAddress: {
      address: commessa.cliente_indirizzo,
      city: commessa.cliente_comune,
      zip: commessa.cliente_cap,
      country: 'IT',
    },
    callbackUrl: `https://mastro-erp.vercel.app/api/v1/webhook/soisy?azienda=${ctx.aziendaId}&commessa=${commessa.id}`,
    redirectUrl: `https://mastro-erp.vercel.app/payment-result?commessa=${commessa.id}`,
  };

  try {
    const res = await fetch(`${SOISY_BASE}/${config.shop_id}/loan-requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: 'soisy_rejected', status: res.status, detail: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const checkoutUrl = data.url || data.checkoutUrl;
    const requestId = data.id || data.requestId;

    // Salva riferimento + log timeline
    await supabaseAdmin.from('timeline_universale').insert({
      azienda_id: ctx.aziendaId,
      entita_tipo: 'commessa',
      entita_id: commessa.id,
      evento_tipo: 'finanziamento_link_creato',
      descrizione: `Link Soisy generato (${rate} rate, €${importo})`,
      meta: { provider: 'soisy', request_id: requestId, importo, rate },
    });

    return NextResponse.json({
      success: true,
      provider: 'soisy',
      checkout_url: checkoutUrl,
      request_id: requestId,
      importo,
      rate,
      rata_mensile: Math.round((importo / rate) * 100) / 100,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'soisy_error', message: e?.message },
      { status: 502 }
    );
  }
}
