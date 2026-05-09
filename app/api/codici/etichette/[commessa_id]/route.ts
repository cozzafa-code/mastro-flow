// app/api/codici/etichette/[commessa_id]/route.ts
// POST: genera tutti i codici mancanti per una commessa
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { commessa_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const commessaId = params.commessa_id;

  try {
    // 1) Recupera commessa + vani
    const { data: commessa, error: errCommessa } = await supabase
      .from('commesse')
      .select('id, codice, cliente_nome, azienda_id, vani(id, nome, larghezza, altezza, tipologia)')
      .eq('id', commessaId)
      .maybeSingle();

    if (errCommessa || !commessa) {
      return NextResponse.json(
        { ok: false, error: 'commessa_non_trovata' },
        { status: 404 }
      );
    }

    const aziendaId = commessa.azienda_id;
    const generati: any[] = [];

    // 2) Genera codice COMMESSA (se non esiste)
    const { data: codCommessa } = await supabase
      .from('codici')
      .select('short')
      .eq('entita_id', commessaId)
      .eq('tipo', 'commessa')
      .maybeSingle();

    if (!codCommessa) {
      const { data: nuovo } = await supabase.rpc('genera_codice', {
        p_tipo: 'commessa',
        p_entita_id: commessaId,
        p_azienda_id: aziendaId,
        p_payload: {
          nome: commessa.codice,
          cliente: commessa.cliente_nome,
        },
      });
      if (nuovo) generati.push(nuovo);
    }

    // 3) Genera codici VANI
    const vani = (commessa.vani as any[]) || [];
    for (const vano of vani) {
      const { data: existing } = await supabase
        .from('codici')
        .select('short')
        .eq('entita_id', vano.id)
        .eq('tipo', 'vano')
        .maybeSingle();

      if (!existing) {
        const { data: nuovo } = await supabase.rpc('genera_codice', {
          p_tipo: 'vano',
          p_entita_id: vano.id,
          p_azienda_id: aziendaId,
          p_payload: {
            nome: vano.nome,
            commessa_id: commessaId,
            commessa: commessa.codice,
            cliente: commessa.cliente_nome,
            tipologia: vano.tipologia,
            misure: {
              larghezza: vano.larghezza,
              altezza: vano.altezza,
            },
          },
        });
        if (nuovo) generati.push(nuovo);
      }
    }

    return NextResponse.json({
      ok: true,
      commessa_id: commessaId,
      generati: generati.length,
      dettagli: generati,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
