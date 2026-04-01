import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generaFatturaPA } from '@/lib/fattura-pa';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fatturaId = searchParams.get('fattura_id');
    if (!fatturaId) return NextResponse.json({ error: 'fattura_id obbligatorio' }, { status: 400 });

    const { data: fattura } = await supabase
      .from('fatture')
      .select('*, clienti(*), fattura_righe(*)')
      .eq('id', fatturaId)
      .eq('azienda_id', auth.aziendaId)
      .single();

    if (!fattura) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });

    const { data: azienda } = await supabase
      .from('aziende')
      .select('*')
      .eq('id', auth.aziendaId)
      .single();

    if (!azienda?.piva) {
      return NextResponse.json({ error: 'P.IVA azienda non configurata in Impostazioni' }, { status: 400 });
    }

    const xml = generaFatturaPA(
      {
        piva: azienda.piva,
        cf: azienda.cf,
        ragione_sociale: azienda.nome,
        indirizzo: azienda.indirizzo ?? '',
        cap: azienda.cap ?? '00000',
        comune: azienda.comune ?? '',
        provincia: azienda.provincia ?? '',
        regime_fiscale: azienda.regime_fiscale ?? 'RF19',
      },
      {
        piva: fattura.clienti?.piva,
        cf: fattura.clienti?.cf,
        ragione_sociale: fattura.clienti?.nome,
        indirizzo: fattura.clienti?.indirizzo ?? '',
        cap: fattura.clienti?.cap ?? '00000',
        comune: fattura.clienti?.comune ?? '',
        provincia: fattura.clienti?.provincia,
      },
      {
        numero: fattura.numero,
        data: fattura.data?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        righe: (fattura.fattura_righe ?? []).map((r: any, i: number) => ({
          numero: i + 1,
          descrizione: r.descrizione,
          quantita: r.quantita ?? 1,
          prezzo_unitario: r.prezzo_unitario ?? 0,
          aliquota_iva: r.aliquota_iva ?? 22,
          unita_misura: r.unita_misura,
        })),
        causale: fattura.note,
        dati_pagamento: fattura.importo_totale ? {
          modalita: 'MP05',
          importo: fattura.importo_totale,
          iban: azienda.iban,
        } : undefined,
      }
    );

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Content-Disposition': `attachment; filename="fattura_${fattura.numero}.xml"`,
      },
    });
  } catch (err: any) {
    console.error('[fatture/genera-xml]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
