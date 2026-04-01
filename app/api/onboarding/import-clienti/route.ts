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

    const { rows } = await req.json(); // [{ nome, telefono, email, citta }]
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ importati: 0 });
    }

    const records = rows
      .filter((r: any) => r.nome?.trim())
      .map((r: any) => ({
        azienda_id: auth.aziendaId,
        nome: r.nome?.trim(),
        telefono: r.telefono?.trim() ?? null,
        email: r.email?.trim() ?? null,
        citta: r.citta?.trim() ?? null,
        fonte: 'import_onboarding',
        created_at: new Date().toISOString(),
      }));

    const { error, count } = await supabase
      .from('clienti')
      .upsert(records, { onConflict: 'azienda_id,email', ignoreDuplicates: true });

    if (error) throw error;

    return NextResponse.json({ importati: count ?? records.length });
  } catch (err: any) {
    console.error('[onboarding/import-clienti]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
