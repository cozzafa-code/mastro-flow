import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nomeAzienda, citta, settore, coloreAccent, teamMode, operatori, userId } = body;

    if (!nomeAzienda || !userId) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Crea o aggiorna azienda
    const { data: azienda, error: azErr } = await supabase
      .from('aziende')
      .upsert({
        nome: nomeAzienda,
        citta: citta || '',
        settore_principale: settore || 'serramenti',
        colore_brand: coloreAccent || '#28A0A0',
        onboarding_completed: false,
        piano: 'trial',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (azErr || !azienda) {
      return NextResponse.json({ error: azErr?.message || 'Errore creazione azienda' }, { status: 500 });
    }

    const aziendaId = azienda.id;

    // Crea operatore titolare
    await supabase.from('operatori').upsert({
      azienda_id: aziendaId,
      auth_id: userId,
      ruolo: 'titolare',
      attivo: true,
    }, { onConflict: 'auth_id' });

    // Crea operatori team se presenti
    if (teamMode === 'team' && operatori?.length > 0) {
      for (const op of operatori) {
        if (!op.nome) continue;
        await supabase.from('operatori').insert({
          azienda_id: aziendaId,
          nome: op.nome,
          ruolo: op.ruolo || 'montatore',
          email: op.email || null,
          attivo: true,
        });
      }
    }

    return NextResponse.json({ ok: true, aziendaId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
