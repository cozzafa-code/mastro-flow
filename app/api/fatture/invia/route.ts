// rebuild-20260510174513
// app/api/fatture/invia/route.ts
// Marca fattura come 'inviata' (passaggio bozza -> inviata).
// Body: { aziendaId, fatturaId, canale?: 'whatsapp'|'email'|'manuale' }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aziendaId, fatturaId, canale } = body;

    if (!aziendaId || !UUID_RE.test(aziendaId)) {
      return NextResponse.json({ error: 'aziendaId invalido' }, { status: 400 });
    }
    if (!fatturaId || !UUID_RE.test(fatturaId)) {
      return NextResponse.json({ error: 'fatturaId invalido' }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: f, error: errF } = await sb
      .from('fin_fatture_emesse')
      .select('id, stato, note')
      .eq('id', fatturaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle();

    if (errF || !f) {
      return NextResponse.json({ error: 'fattura non trovata' }, { status: 404 });
    }
    if (['pagata','inviata','da_inviare'].includes(String(f.stato).toLowerCase())) {
      return NextResponse.json({ ok: true, alreadyInState: true, fattura: f });
    }

    const noteAdd = canale ? `Inviata via ${canale} il ${new Date().toLocaleDateString('it-IT')}` : null;
    const noteFinal = noteAdd && f.note ? `${f.note}\n${noteAdd}` : (noteAdd || f.note);

    const { data: upd, error: errU } = await sb
      .from('fin_fatture_emesse')
      .update({
        stato: 'inviata',
        note: noteFinal,
      })
      .eq('id', fatturaId)
      .select('id, numero, stato, totale')
      .single();

    if (errU) {
      return NextResponse.json({ error: errU.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, fattura: upd });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore server' }, { status: 500 });
  }
}
