// app/api/sync/commessa/route.ts
// Upsert commessa lato server con service_role - bypassa RLS.
// Il client passa azienda_id da sessionStorage (PIN login) o Supabase auth.
// Il server valida e ritorna il record con UUID reale.
// FIX: gestione corretta INSERT con fase != sopralluogo (trigger DB esige sopralluogo all'INSERT)

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

    // Verifica azienda
    const { data: az } = await sb.from('aziende').select('id').eq('id', aziendaId).maybeSingle();
    if (!az) {
      return NextResponse.json({ error: 'azienda non trovata' }, { status: 404 });
    }

    const c = commessa;
    const isUUID = typeof c.id === 'string' && UUID_RE.test(c.id);
    const faseTarget = c.fase || 'sopralluogo';

    const baseRow: any = {
      azienda_id: aziendaId,
      code: c.code,
      cliente: c.cliente || '',
      cognome: c.cognome || '',
      indirizzo: c.indirizzo || '',
      telefono: c.telefono || '',
      email: c.email || '',
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

    // Cerca commessa esistente: per id se UUID, altrimenti per code+azienda
    let existingId: string | null = null;
    if (isUUID) {
      const { data: ex } = await sb
        .from('commesse')
        .select('id')
        .eq('id', c.id)
        .maybeSingle();
      if (ex?.id) existingId = ex.id;
    }
    if (!existingId) {
      const { data: ex2 } = await sb
        .from('commesse')
        .select('id')
        .eq('azienda_id', aziendaId)
        .eq('code', c.code)
        .maybeSingle();
      if (ex2?.id) existingId = ex2.id;
    }

    if (existingId) {
      // === UPDATE: commessa esiste, applica TUTTI i campi inclusa fase target ===
      const updateRow: any = { ...baseRow, fase: faseTarget };
      const { data, error } = await sb
        .from('commesse')
        .update(updateRow)
        .eq('id', existingId)
        .select('id, code, cliente, fase, updated_at')
        .single();

      if (error) {
        console.error('[sync/commessa] UPDATE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, commessa: data, action: 'update' });
    }

    // === INSERT: commessa nuova - trigger DB esige fase=sopralluogo ===
    // Step 1: INSERT con sopralluogo
    const insertRow: any = { ...baseRow, fase: 'sopralluogo' };
    if (isUUID) insertRow.id = c.id;

    const { data: inserted, error: insErr } = await sb
      .from('commesse')
      .insert(insertRow)
      .select('id, code, cliente, fase, updated_at')
      .single();

    if (insErr) {
      console.error('[sync/commessa] INSERT error:', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // Step 2: se fase target != sopralluogo, avanza progressivamente
    // (il trigger DB richiede di avanzare un passo alla volta + gates)
    if (faseTarget !== 'sopralluogo' && inserted?.id) {
      // Per ora settiamo direttamente la fase target. Se il trigger blocca per gates
      // (es. preventivo richiede vani con misure), almeno la commessa esiste e l'utente
      // pu\u00f2 procedere normalmente dal client.
      const { data: updated, error: updErr } = await sb
        .from('commesse')
        .update({ fase: faseTarget })
        .eq('id', inserted.id)
        .select('id, code, cliente, fase, updated_at')
        .single();

      if (updErr) {
        // Non blocchiamo: la commessa esiste, lasciamo a sopralluogo
        console.warn('[sync/commessa] avanzamento fase fallito (commessa creata in sopralluogo):', updErr.message);
        return NextResponse.json({ ok: true, commessa: inserted, action: 'insert_partial', warning: updErr.message });
      }
      return NextResponse.json({ ok: true, commessa: updated, action: 'insert_advanced' });
    }

    return NextResponse.json({ ok: true, commessa: inserted, action: 'insert' });
  } catch (e: any) {
    console.error('[sync/commessa] exception:', e);
    return NextResponse.json({ error: e.message || 'Errore server' }, { status: 500 });
  }
}
