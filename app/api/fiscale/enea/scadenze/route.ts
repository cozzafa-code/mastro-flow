// app/api/fiscale/enea/scadenze/route.ts
// Cron giornaliero: scansiona pratiche 65/75 con data_fine_lavori → crea evento in `eventi`
// a (fine_lavori + 90gg - 7) con tipo='scadenza_enea'.
// Idempotente su pratica_fiscale_id.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(_req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: pratiche, error } = await supabase
      .from('fiscale_pratica')
      .select(`
        id, commessa_id, detrazione_raccomandata, data_fine_lavori, stato_enea,
        commessa:commessa_id(code, azienda_id, cliente, cognome)
      `)
      .in('detrazione_raccomandata', ['65', '75'])
      .not('data_fine_lavori', 'is', null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!pratiche?.length) return NextResponse.json({ ok: true, processate: 0 });

    // Filtra pratiche non già inviate (da_inviare/errore/null)
    const filtrate = pratiche.filter((p: any) =>
      p.stato_enea !== 'inviata' && p.stato_enea !== 'confermata'
    );

    let create = 0, update = 0, scaduteTot = 0;

    for (const p of filtrate as any[]) {
      const fine = new Date(p.data_fine_lavori);
      const scadenzaEnea = new Date(fine);
      scadenzaEnea.setDate(scadenzaEnea.getDate() + 90);

      const alertDate = new Date(scadenzaEnea);
      alertDate.setDate(alertDate.getDate() - 7);

      const oggi = new Date();
      const giorniAllaScadenza = Math.ceil((scadenzaEnea.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));

      // Scadute → marca pratica e non creare evento
      if (giorniAllaScadenza < 0 && p.stato_enea !== 'scaduta') {
        await supabase.from('fiscale_pratica').update({ stato_enea: 'scaduta' }).eq('id', p.id);
        scaduteTot++;
        continue;
      }

      const commessa = p.commessa;
      const nomeCliente = [commessa?.cliente, commessa?.cognome].filter(Boolean).join(' ').trim() || 'cliente';
      const code = commessa?.code || '';
      const aziendaId = commessa?.azienda_id;
      if (!aziendaId) continue;

      const titolo = giorniAllaScadenza <= 7
        ? `ENEA — SCADENZA IMMINENTE (${giorniAllaScadenza}gg)`
        : `ENEA — Scadenza comunicazione`;
      const note = `Invio pratica ENEA ${p.detrazione_raccomandata}% per ${nomeCliente} (commessa ${code}). Fine lavori: ${fine.toLocaleDateString('it-IT')}. Scadenza legale: ${scadenzaEnea.toLocaleDateString('it-IT')}.`;

      const dataAlert = alertDate.toISOString().slice(0, 10);
      const linkModulo = `/commesse/${p.commessa_id}?tab=fiscale&wizard=enea&pratica=${p.id}`;

      const { data: esistente } = await supabase
        .from('eventi')
        .select('id')
        .eq('pratica_fiscale_id', p.id)
        .eq('tipo', 'scadenza_enea')
        .maybeSingle();

      if (esistente) {
        await supabase.from('eventi').update({
          data: dataAlert,
          titolo,
          note,
          link_modulo: linkModulo,
          colore: giorniAllaScadenza <= 7 ? '#EF4444' : '#F59E0B',
        }).eq('id', esistente.id);
        update++;
      } else {
        await supabase.from('eventi').insert({
          azienda_id: aziendaId,
          commessa_id: p.commessa_id,
          titolo,
          tipo: 'scadenza_enea',
          data: dataAlert,
          ora: '09:00',
          note,
          colore: giorniAllaScadenza <= 7 ? '#EF4444' : '#F59E0B',
          link_modulo: linkModulo,
          pratica_fiscale_id: p.id,
          completato: false,
        });
        create++;
      }
    }

    return NextResponse.json({
      ok: true,
      processate: filtrate.length,
      eventi_creati: create,
      eventi_aggiornati: update,
      pratiche_scadute: scaduteTot,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
