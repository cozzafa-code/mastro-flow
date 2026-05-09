// app/api/commessa/avanza-fase/route.ts
// Avanza la fase di una commessa rispettando i gates del trigger DB
// Body: { aziendaId, commessaId, faseDa, faseA, payload? }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aziendaId, commessaId, faseDa, faseA, payload } = body;

    if (!aziendaId || !UUID_RE.test(aziendaId)) {
      return NextResponse.json({ error: 'aziendaId invalido' }, { status: 400 });
    }
    if (!commessaId || !UUID_RE.test(commessaId)) {
      return NextResponse.json({ error: 'commessaId invalido' }, { status: 400 });
    }
    if (!faseA) {
      return NextResponse.json({ error: 'faseA mancante' }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verifica commessa
    const { data: cm, error: cmErr } = await sb
      .from('commesse')
      .select('id, fase, totale_finale, preventivo_inviato_at, conferma_ordine_inviata_at, conferma_ordine_firmata_at, firma_data, fattura_acconto_pagata_at, produzione_completata_at, montaggio_completato_at, fattura_saldo_pagata_at')
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle();

    if (cmErr || !cm) {
      return NextResponse.json({ error: 'commessa non trovata' }, { status: 404 });
    }

    // Costruisci update con campi del payload + nuova fase
    const updateRow: any = { fase: faseA };

    if (payload && typeof payload === 'object') {
      // Whitelist dei campi consentiti per evitare iniezioni
      const allowed = [
        'preventivo_inviato_at',
        'conferma_ordine_inviata_at',
        'conferma_ordine_firmata_at',
        'firma_data',
        'firma_cliente',
        'fattura_acconto_id',
        'fattura_acconto_pagata_at',
        'materiale_ordinato_at',
        'produzione_completata_at',
        'montaggio_completato_at',
        'fattura_saldo_id',
        'fattura_saldo_pagata_at',
        'totale_finale',
        'preventivo_inviato_canale',
      ];
      for (const k of allowed) {
        if (payload[k] !== undefined) updateRow[k] = payload[k];
      }
    }

    const { data, error } = await sb
      .from('commesse')
      .update(updateRow)
      .eq('id', commessaId)
      .select('id, code, fase, updated_at')
      .single();

    if (error) {
      console.error('[avanza-fase] update error:', error);
      // Trigger DB rifiuta con messaggio chiaro
      return NextResponse.json({ error: error.message, details: error.details || null }, { status: 400 });
    }

    return NextResponse.json({ ok: true, commessa: data });
  } catch (e: any) {
    console.error('[avanza-fase] exception:', e);
    return NextResponse.json({ error: e.message || 'Errore server' }, { status: 500 });
  }
}
