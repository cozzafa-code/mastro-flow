// rebuild-20260510174513
// app/api/fatture/marca-pagata/route.ts
// Marca fattura come pagata. Trigger DB avanza la fase commessa.
// Body: { aziendaId, fatturaId, metodoPagamento?, dataPagamento? }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aziendaId, fatturaId, metodoPagamento, dataPagamento } = body;

    if (!aziendaId || !UUID_RE.test(aziendaId)) {
      return NextResponse.json({ error: 'aziendaId invalido' }, { status: 400 });
    }
    if (!fatturaId || !UUID_RE.test(fatturaId)) {
      return NextResponse.json({ error: 'fatturaId invalido' }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verifica fattura esista e appartenga all'azienda
    const { data: f, error: errF } = await sb
      .from('fin_fatture_emesse')
      .select('id, totale, stato, commessa_id, tipo')
      .eq('id', fatturaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle();

    if (errF || !f) {
      return NextResponse.json({ error: 'fattura non trovata' }, { status: 404 });
    }
    if (String(f.stato).toLowerCase() === 'pagata') {
      return NextResponse.json({ ok: true, alreadyPaid: true, fattura: f });
    }

    // Note: include metodo pagamento (campo libero)
    const noteMetodo = metodoPagamento 
      ? `Pagata via ${metodoPagamento} il ${dataPagamento || new Date().toISOString().slice(0,10)}` 
      : `Pagata il ${dataPagamento || new Date().toISOString().slice(0,10)}`;

    // Marca pagata: stato + pagato + residuo. Trigger DB scatta solo
    const { data: updated, error: errU } = await sb
      .from('fin_fatture_emesse')
      .update({
        stato: 'pagata',
        pagato: f.totale,
        residuo: 0,
        note: noteMetodo,
      })
      .eq('id', fatturaId)
      .select('id, numero, stato, pagato, residuo, commessa_id, tipo')
      .single();

    if (errU) {
      console.error('[marca-pagata] update error:', errU);
      return NextResponse.json({ error: errU.message }, { status: 400 });
    }

    // Ritorna anche fase commessa aggiornata (post-trigger)
    let commessaAggiornata: any = null;
    if (updated.commessa_id) {
      const { data: cm } = await sb
        .from('commesse')
        .select('id, code, fase, fattura_acconto_pagata_at, fattura_saldo_pagata_at')
        .eq('id', updated.commessa_id)
        .maybeSingle();
      commessaAggiornata = cm;
    }

    return NextResponse.json({ 
      ok: true, 
      fattura: updated, 
      commessa: commessaAggiornata,
    });
  } catch (e: any) {
    console.error('[marca-pagata] exception:', e);
    return NextResponse.json({ error: e.message || 'Errore server' }, { status: 500 });
  }
}
