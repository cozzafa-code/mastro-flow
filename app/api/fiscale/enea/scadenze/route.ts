// app/api/fiscale/enea/scadenze/route.ts
// POST: esegue scansione pratiche 65/75 non ancora inviate con data_fine_lavori impostata.
// Crea evento agenda a (fine_lavori + 90gg - 7) con tipo 'scadenza_enea'.
// Idempotente: se evento esiste già (per pratica_fiscale_id), aggiorna la data.
// Richiamabile da cron Vercel o manualmente.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Pratiche 65/75 con fine lavori impostata ma non ancora inviate a ENEA
    const { data: pratiche, error } = await supabase
      .from('fiscale_pratica')
      .select('id, azienda_id, commessa_id, detrazione, data_fine_lavori, stato_enea, commessa:commessa_id(numero, cliente_id, cliente:cliente_id(nome, cognome))')
      .in('detrazione', ['65', '75'])
      .not('data_fine_lavori', 'is', null)
      .in('stato_enea', ['da_inviare', 'errore']);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!pratiche?.length) return NextResponse.json({ ok: true, processate: 0 });

    let create = 0, update = 0, scaduteTot = 0;

    for (const p of pratiche) {
      const fine = new Date(p.data_fine_lavori!);
      const scadenzaEnea = new Date(fine);
      scadenzaEnea.setDate(scadenzaEnea.getDate() + 90);

      const alertDate = new Date(scadenzaEnea);
      alertDate.setDate(alertDate.getDate() - 7);

      const oggi = new Date();
      const giorniAllaScadenza = Math.ceil((scadenzaEnea.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));

      // Marca scadute
      if (giorniAllaScadenza < 0 && p.stato_enea !== 'scaduta') {
        await supabase.from('fiscale_pratica').update({ stato_enea: 'scaduta' }).eq('id', p.id);
        scaduteTot++;
        continue;
      }

      const cliente = (p.commessa as any)?.cliente;
      const numero = (p.commessa as any)?.numero;
      const nomeCliente = cliente ? `${cliente.nome || ''} ${cliente.cognome || ''}`.trim() : 'cliente';

      const titolo = `⚠️ ENEA — ${giorniAllaScadenza <= 7 ? 'SCADENZA IMMINENTE' : 'Scadenza tra 90gg'}`;
      const descrizione = `Invio pratica ENEA ${p.detrazione}% per ${nomeCliente} (commessa ${numero}). Fine lavori: ${fine.toLocaleDateString('it-IT')}. Scadenza legale: ${scadenzaEnea.toLocaleDateString('it-IT')}.`;

      // Verifica evento esistente
      const { data: esistente } = await supabase
        .from('agenda_eventi')
        .select('id')
        .eq('pratica_fiscale_id', p.id)
        .eq('tipo_evento', 'scadenza_enea')
        .maybeSingle();

      if (esistente) {
        await supabase.from('agenda_eventi').update({
          data_inizio: alertDate.toISOString(),
          data_fine: scadenzaEnea.toISOString(),
          titolo,
          descrizione,
        }).eq('id', esistente.id);
        update++;
      } else {
        await supabase.from('agenda_eventi').insert({
          azienda_id: p.azienda_id,
          titolo,
          descrizione,
          data_inizio: alertDate.toISOString(),
          data_fine: scadenzaEnea.toISOString(),
          tipo_evento: 'scadenza_enea',
          link_modulo: `/commesse/${p.commessa_id}?tab=fiscale&wizard=enea&pratica=${p.id}`,
          pratica_fiscale_id: p.id,
        });
        create++;
      }
    }

    return NextResponse.json({
      ok: true,
      processate: pratiche.length,
      eventi_creati: create,
      eventi_aggiornati: update,
      pratiche_scadute: scaduteTot,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore interno' }, { status: 500 });
  }
}

// GET: utile per cron Vercel (stesso comportamento)
export async function GET(req: NextRequest) {
  return POST(req);
}
