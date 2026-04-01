import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { data } = await supabase
    .from('aziende')
    .select('nome,piva,cf,indirizzo,cap,comune,provincia,telefono,email,iban,pec,codice_sdi,regime_fiscale,colore_accent,settore,citta,logo_url')
    .eq('id', auth.aziendaId)
    .single();

  return NextResponse.json(data ?? {});
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const campiConsentiti = ['nome','piva','cf','indirizzo','cap','comune','provincia','telefono','email','iban','pec','codice_sdi','regime_fiscale','colore_accent','settore','citta'];
  const aggiornamenti: Record<string, any> = {};
  for (const k of campiConsentiti) {
    if (body[k] !== undefined) aggiornamenti[k] = body[k];
  }
  aggiornamenti.updated_at = new Date().toISOString();

  const { error } = await supabase.from('aziende').update(aggiornamenti).eq('id', auth.aziendaId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
