import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function POST(request, { params }) {
  const route = params.route?.join('/');
  const body = await request.json().catch(() => ({}));
  try {
    switch (route) {
      case 'commesse/avanza': {
        const { commessa_id, nuova_fase } = body;
        const { data, error } = await supabase.from('commesse').update({ fase_pipeline: nuova_fase, sotto_fase: 0 }).eq('id', commessa_id).select().single();
        if (error) throw error;
        return NextResponse.json({ ok: true, commessa: data });
      }
      case 'messaggi/invia': {
        const { data, error } = await supabase.from('messaggi').insert(body).select().single();

      // === DAY · log mail / messaggio ===
      if (!error && data) {
        try {
          const direzione: 'in' | 'out' = (body?.direzione === 'in' || body?.tipo === 'in') ? 'in' : 'out';
          const tipo = direzione === 'in' ? 'mail_ricevuta' : 'mail_inviata';
          const canale: string = body?.canale ?? body?.channel ?? 'email';
          const cmId: string | null = body?.commessa_id ?? body?.cm_id ?? null;
          const aziendaId: string | null = body?.azienda_id ?? null;
          const userId: string | null = body?.user_id ?? null;
          if (aziendaId && userId) {
            await supabase.from('day_eventi').insert({
              azienda_id: aziendaId,
              user_id: userId,
              tipo,
              modulo_origine: 'mail',
              direzione: direzione === 'in' ? 'entrata' : 'uscita',
              cm_id: cmId,
              payload: { messaggio_id: data.id, canale },
              titolo_breve: direzione === 'in'
                ? `Nuovo ${canale} ricevuto`
                : `${canale[0].toUpperCase() + canale.slice(1)} inviato`,
              contesto: body?.contesto ?? null,
            });
            // se in entrata · popolo anche backlog NUOVI
            if (direzione === 'in') {
              await supabase.from('day_backlog').insert({
                azienda_id: aziendaId,
                user_id: userId,
                origine: canale === 'email' ? 'mail' : (canale === 'whatsapp' ? 'vocale' : 'evento_workflow'),
                titolo: body?.oggetto ?? body?.testo?.slice(0, 80) ?? 'Nuovo messaggio',
                descrizione: body?.testo ?? null,
                cm_id: cmId,
                payload: { messaggio_id: data.id, canale },
              });
            }
          }
        } catch (e) { console.warn('[Day] log mail fallito', e); }
      }
        if (error) throw error;
        return NextResponse.json({ ok: true, messaggio: data });
      }
      case 'produzione/avanza': {
        const { commessa_id, sotto_fase, operatore_id, azienda_id } = body;
        const { data } = await supabase.from('produzione').upsert({ azienda_id, commessa_id, sotto_fase, stato: 'in_corso', operatore_id, data_inizio: new Date().toISOString() }).select().single();
        await supabase.from('commesse').update({ sotto_fase }).eq('id', commessa_id);
        return NextResponse.json({ ok: true, fase: data });
      }
      default: return NextResponse.json({ error: 'Route non trovata: ' + route }, { status: 404 });
    }
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
export async function GET(request, { params }) {
  const route = params.route?.join('/');
  const { searchParams } = new URL(request.url);
  const aziendaId = searchParams.get('azienda_id');
  try {
    switch (route) {
      case 'pipeline': { const { data } = await supabase.from('pipeline_config').select('*').eq('azienda_id', aziendaId).eq('attiva', true).order('ordine'); return NextResponse.json(data || []); }
      case 'commesse': { const { data } = await supabase.from('commesse').select('*, cliente:clienti(nome,cognome,telefono)').eq('azienda_id', aziendaId).order('updated_at', { ascending: false }); return NextResponse.json(data || []); }
      default: return NextResponse.json({ error: 'Route GET non trovata: ' + route }, { status: 404 });
    }
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

// P2 · TODO opzionale: dopo aver loggato mail_inviata, se l'oggetto/body contiene 'preventivo'
//      o se c'e' un allegato di tipo preventivo, loggare anche prev_inviato:
//      await supabase.from('day_eventi').insert({
//        azienda_id, user_id, tipo: 'prev_inviato', modulo_origine: 'mail',
//        direzione: 'uscita', cm_id, titolo_breve: 'Preventivo inviato', contesto: oggetto,
//      });
