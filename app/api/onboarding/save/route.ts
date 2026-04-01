import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await req.json();
    const { nomeAzienda, citta, settore, coloreAccent, teamMode, operatori } = body;

    // Aggiorna azienda
    const { error: azErr } = await supabase
      .from('aziende')
      .update({
        nome: nomeAzienda,
        citta: citta ?? null,
        settore: settore ?? null,
        colore_accent: coloreAccent ?? '#D08008',
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.aziendaId);

    if (azErr) throw azErr;

    // Crea operatori aggiuntivi (solo se teamMode === 'team')
    if (teamMode === 'team' && Array.isArray(operatori)) {
      const validi = operatori.filter((o: any) => o.nome?.trim());
      for (const op of validi) {
        const { data: existing } = await supabase
          .from('operatori')
          .select('id')
          .eq('azienda_id', auth.aziendaId)
          .eq('nome', op.nome.trim())
          .maybeSingle();

        if (!existing) {
          await supabase.from('operatori').insert({
            azienda_id: auth.aziendaId,
            nome: op.nome.trim(),
            ruolo: op.ruolo ?? 'montatore',
            email: op.email?.trim() ?? null,
            pin: Math.floor(1000 + Math.random() * 9000).toString(),
            attivo: true,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[onboarding/save]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
