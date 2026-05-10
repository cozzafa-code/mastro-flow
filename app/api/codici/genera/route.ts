// app/api/codici/genera/route.ts
// Endpoint generico per generare un codice di qualsiasi tipo
// Wrapper RPC public.genera_codice
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const TIPI_VALIDI = [
  'pezzo_cnc', 'vano', 'commessa', 'collo',
  'articolo', 'cantiere', 'documento',
  'macchina', 'furgone', 'fornitore_esterno',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, entita_id, azienda_id, payload, rotates, expires_at } = body;

    if (!tipo || !TIPI_VALIDI.includes(tipo)) {
      return NextResponse.json(
        { ok: false, error: 'tipo non valido', tipi_validi: TIPI_VALIDI },
        { status: 400 }
      );
    }
    if (!entita_id) {
      return NextResponse.json({ ok: false, error: 'entita_id mancante' }, { status: 400 });
    }
    if (!azienda_id) {
      return NextResponse.json({ ok: false, error: 'azienda_id mancante' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc('genera_codice', {
      p_tipo: tipo,
      p_entita_id: entita_id,
      p_azienda_id: azienda_id,
      p_payload: payload || {},
      p_rotates: rotates || false,
      p_expires_at: expires_at || null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, codice: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'errore' }, { status: 500 });
  }
}
