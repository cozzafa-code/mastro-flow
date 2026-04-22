// app/api/sync/commessa/route.ts
// Upsert commessa lato server con service_role — bypassa RLS.
// Il client passa azienda_id da sessionStorage (PIN login) o Supabase auth.
// Il server valida e ritorna il record con UUID reale.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aziendaId, commessa } = body;

    if (!aziendaId || !UUID_RE.test(aziendaId)) {
      return NextResponse.json({ error: 'aziendaId mancante o non valido' }, { status: 400 });
    }
    if (!commessa || !commessa.code) {
      return NextResponse.json({ error: 'commessa mancante o code vuoto' }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verifica che l'azienda esista (protezione base)
    const { data: az } = await sb.from('aziende').select('id').eq('id', aziendaId).maybeSingle();
    if (!az) {
      return NextResponse.json({ error: 'azienda non trovata' }, { status: 404 });
    }

    const c = commessa;
    const isUUID = typeof c.id === 'string' && UUID_RE.test(c.id);

    const row: any = {
      azienda_id: aziendaId,
      code: c.code,
      cliente: c.cliente || '',
      cognome: c.cognome || '',
      indirizzo: c.indirizzo || '',
      telefono: c.telefono || '',
      email: c.email || '',
      fase: c.fase || 'sopralluogo',
      tipo: c.tipo || 'nuova',
      sistema: c.sistema || '',
      difficolta_salita: c.difficoltaSalita || '',
      mezzo_salita: c.mezzoSalita || '',
      foro_scale: c.foroScale || '',
      piano_edificio: c.pianoEdificio || '',
      note: c.note || '',
      totale_preventivo: c.totalePreventivo || null,
      sconto_perc: c.scontoPerc || null,
      totale_finale: c.totaleFinale || null,
      firma_cliente: c.firmaCliente || null,
    };

    if (isUUID) {
      row.id = c.id;
    } else {
      // Cerca commessa esistente con stesso code+azienda per evitare duplicati
      const { data: existing } = await sb
        .from('commesse')
        .select('id')
        .eq('azienda_id', aziendaId)
        .eq('code', c.code)
        .maybeSingle();
      if (existing?.id) row.id = existing.id;
    }

    const { data, error } = await sb
      .from('commesse')
      .upsert(row, { onConflict: 'id' })
      .select('id, code, cliente, fase, updated_at')
      .single();

    if (error) {
      console.error('[sync/commessa] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, commessa: data });
  } catch (e: any) {
    console.error('[sync/commessa] exception:', e);
    return NextResponse.json({ error: e.message || 'Errore server' }, { status: 500 });
  }
}
