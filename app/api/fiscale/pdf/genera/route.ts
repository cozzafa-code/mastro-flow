// app/api/fiscale/pdf/genera/route.ts
// POST { praticaId } — genera 4 PDF fiscali, carica su fiscale-docs, aggiorna pratica.
// Lato server per tenere jsPDF fuori dal bundle client principale.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generaEcaricaPDFFiscali,
  type DatiFiscalePDF,
} from '@/lib/fiscale/pdfGenerator';

export async function POST(req: NextRequest) {
  try {
    const { praticaId } = await req.json();
    if (!praticaId) return NextResponse.json({ error: 'praticaId mancante' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: pratica, error } = await supabase
      .from('fiscale_pratica')
      .select(`
        id, commessa_id, detrazione_raccomandata, iva_raccomandata,
        importo_totale, data_fine_lavori,
        commessa:commessa_id(
          id, code, azienda_id, cliente, cognome, indirizzo, contatto_id,
          contatto:contatto_id(nome, cognome, indirizzo, citta, cap)
        )
      `)
      .eq('id', praticaId)
      .single();

    if (error || !pratica) {
      return NextResponse.json({ error: error?.message || 'pratica non trovata' }, { status: 404 });
    }

    const commessa = (pratica as any).commessa;
    if (!commessa?.azienda_id) {
      return NextResponse.json({ error: 'commessa senza azienda' }, { status: 400 });
    }

    const { data: azienda, error: aErr } = await supabase
      .from('aziende')
      .select('ragione, piva, codice_fiscale, indirizzo, iban')
      .eq('id', commessa.azienda_id)
      .single();
    if (aErr || !azienda) {
      return NextResponse.json({ error: 'azienda non trovata' }, { status: 404 });
    }

    const contatto = commessa.contatto;
    const nomeCliente = contatto
      ? [contatto.nome, contatto.cognome].filter(Boolean).join(' ').trim()
      : [commessa.cliente, commessa.cognome].filter(Boolean).join(' ').trim();
    const indirizzoImmobile = contatto
      ? [contatto.indirizzo, contatto.cap, contatto.citta].filter(Boolean).join(' ')
      : commessa.indirizzo || '';

    // C.F. cliente non in schema? → prendilo da contatto (colonna codice_fiscale se esiste, altrimenti vuoto)
    const cfCliente = (contatto as any)?.codice_fiscale || '';

    const detrazione = (pratica as any).detrazione_raccomandata;
    if (!['50', '65', '75'].includes(detrazione)) {
      return NextResponse.json({ error: `detrazione non valida: ${detrazione}` }, { status: 400 });
    }

    const dati: DatiFiscalePDF = {
      azienda: {
        ragione: azienda.ragione || '',
        piva: azienda.piva || '',
        codice_fiscale: azienda.codice_fiscale,
        indirizzo: azienda.indirizzo,
        iban: azienda.iban,
      },
      cliente: {
        nome: nomeCliente,
        codice_fiscale: cfCliente,
        indirizzo_immobile: indirizzoImmobile,
      },
      commessa: {
        id: commessa.id,
        code: commessa.code || '',
        importo_totale: Number((pratica as any).importo_totale || 0),
        iva_aliquota: Number((pratica as any).iva_raccomandata || 22),
        data_fine_lavori: (pratica as any).data_fine_lavori,
      },
      detrazione: detrazione as '50' | '65' | '75',
      praticaId,
    };

    const result = await generaEcaricaPDFFiscali(dati, supabase);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ ok: true, urls: result.urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore interno' }, { status: 500 });
  }
}
